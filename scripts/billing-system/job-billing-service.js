/**
 * Job Billing Service
 * Manages independent per-job billing for insurance adjusters
 */

class JobBillingService {
    constructor() {
        this.jobs = new Map(); // jobId -> job data
        this.dailyTallies = new Map(); // date -> daily summary
        this.firmBillingPeriods = new Map(); // firmName_period -> billing period data
        this.firmConfigs = new Map(); // firmName -> billing configuration
        this.googleMapsService = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.initializeGoogleMaps();
    }

    /**
     * FIRM CONFIGURATION MANAGEMENT
     */
    addFirmConfig(firmData) {
        const {
            name,
            fileRate,           // Per claim/file amount
            mileageRate,        // Per mile after free threshold
            freeMileage,        // Free roundtrip miles per job
            timeExpenseRate,    // Optional hourly rate for vehicle time
            paymentSchedule,    // weekly, bi-weekly, monthly
            paymentDay,         // Friday, Tuesday, or date (31)
            contactInfo
        } = firmData;

        this.firmConfigs.set(name, {
            name,
            fileRate: parseFloat(fileRate),
            mileageRate: parseFloat(mileageRate),
            freeMileage: parseInt(freeMileage),
            timeExpenseRate: parseFloat(timeExpenseRate || 0),
            paymentSchedule,
            paymentDay,
            contactInfo,
            dateCreated: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        this.saveData();
        return true;
    }

    updateFirmConfig(firmName, updates) {
        const existingConfig = this.firmConfigs.get(firmName);
        if (!existingConfig) return false;

        // Update rates affect future jobs, existing jobs keep original rates
        const updatedConfig = {
            ...existingConfig,
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        this.firmConfigs.set(firmName, updatedConfig);
        this.saveData();
        return true;
    }

    getFirmConfig(firmName) {
        return this.firmConfigs.get(firmName);
    }

    getAllFirmConfigs() {
        return Array.from(this.firmConfigs.values());
    }

    deleteFirmConfig(firmName) {
        if (!this.firmConfigs.has(firmName)) {
            console.warn(`Firm configuration not found: ${firmName}`);
            return false;
        }

        // Check if there are any jobs associated with this firm
        const associatedJobs = Array.from(this.jobs.values()).filter(job => job.firmName === firmName);
        
        if (associatedJobs.length > 0) {
            throw new Error(`Cannot delete firm "${firmName}" - it has ${associatedJobs.length} associated job(s). Please complete or delete those jobs first.`);
        }

        // Remove firm configuration
        this.firmConfigs.delete(firmName);
        
        // Clean up any billing periods for this firm
        const periodsToDelete = [];
        for (const [key, period] of this.firmBillingPeriods.entries()) {
            if (period.firmName === firmName) {
                periodsToDelete.push(key);
            }
        }
        
        periodsToDelete.forEach(key => {
            this.firmBillingPeriods.delete(key);
        });
        
        // Save changes
        this.saveData();
        
        console.log(`✅ Firm configuration deleted: ${firmName}`);
        return true;
    }

    /**
     * JOB MANAGEMENT
     */
    async createJob(jobData) {
        const {
            firmName,
            claimNumber,
            customerAddress,
            scheduledDate,
            description,
            homeAddress // User's home/office address for mileage calculation
        } = jobData;

        const firmConfig = this.firmConfigs.get(firmName);
        if (!firmConfig) {
            throw new Error(`Firm configuration not found for: ${firmName}`);
        }

        // Generate unique job ID
        const jobId = this.generateJobId(firmName, claimNumber);

        // Calculate mileage using Google Maps API or use pre-calculated data
        let mileageData;
        if (jobData.preCalculatedMileage && jobData.preCalculatedMileage.calculated) {
            console.log('📍 Using pre-calculated mileage data from mileage calculator');
            mileageData = jobData.preCalculatedMileage;
        } else {
            console.log('📍 Calculating mileage using Google Maps API');
            mileageData = await this.calculateJobMileage(homeAddress, customerAddress);
        }

        const job = {
            jobId,
            firmName,
            claimNumber,
            customerAddress,
            homeAddress,
            scheduledDate,
            description,
            
            // Mileage data
            roundtripMiles: mileageData.miles,
            routeDetails: mileageData.routeDetails,
            
            // Billing calculations (at time of job creation)
            fileRate: firmConfig.fileRate,
            mileageRate: firmConfig.mileageRate,
            freeMileage: firmConfig.freeMileage,
            timeExpenseRate: firmConfig.timeExpenseRate,
            
            // Calculated amounts
            billableMiles: Math.max(0, mileageData.miles - firmConfig.freeMileage),
            mileageAmount: Math.max(0, mileageData.miles - firmConfig.freeMileage) * firmConfig.mileageRate,
            baseJobValue: firmConfig.fileRate,
            
            // Adjustments and final
            adjustments: 0, // Manual add/subtract per job
            timeExpenseHours: 0,
            timeExpenseAmount: 0,
            
            // Status tracking
            status: 'scheduled', // scheduled, in-progress, completed, billed
            createdDate: new Date().toISOString(),
            completedDate: null,
            billedDate: null
        };

        // Calculate total job value
        job.totalJobValue = this.calculateJobTotal(job);

        this.jobs.set(jobId, job);
        this.saveData();
        
        return job;
    }

    updateJob(jobId, updates) {
        const job = this.jobs.get(jobId);
        if (!job) return null;

        // Allow updates to adjustments, status, time expense
        const allowedUpdates = [
            'adjustments', 'status', 'timeExpenseHours', 
            'description', 'completedDate', 'scheduledDate'
        ];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                job[key] = updates[key];
            }
        });

        // Recalculate time expense amount
        if ('timeExpenseHours' in updates) {
            job.timeExpenseAmount = job.timeExpenseHours * job.timeExpenseRate;
        }

        // Recalculate total
        job.totalJobValue = this.calculateJobTotal(job);
        job.lastUpdated = new Date().toISOString();

        this.jobs.set(jobId, job);
        this.saveData();
        
        return job;
    }

    completeJob(jobId, completionData = {}) {
        const job = this.jobs.get(jobId);
        if (!job) return null;

        job.status = 'completed';
        job.completedDate = new Date().toISOString();
        
        // Apply any final adjustments
        if (completionData.adjustments !== undefined) {
            job.adjustments = completionData.adjustments;
        }
        
        if (completionData.timeExpenseHours !== undefined) {
            job.timeExpenseHours = completionData.timeExpenseHours;
            job.timeExpenseAmount = job.timeExpenseHours * job.timeExpenseRate;
        }

        // Recalculate final total
        job.totalJobValue = this.calculateJobTotal(job);

        this.jobs.set(jobId, job);
        
        // Update daily tally for the completion date
        this.updateDailyTally(job.completedDate.split('T')[0], job);
        
        this.saveData();
        return job;
    }

    calculateJobTotal(job) {
        return job.baseJobValue + job.mileageAmount + job.timeExpenseAmount + (job.adjustments || 0);
    }

    /**
     * DAILY TALLY MANAGEMENT
     */
    updateDailyTally(date, completedJob) {
        const dateKey = date; // YYYY-MM-DD format
        
        let dailyTally = this.dailyTallies.get(dateKey) || {
            date: dateKey,
            totalEarnings: 0,
            totalMiles: 0,
            totalJobs: 0,
            firmBreakdown: {},
            completedJobIds: [],
            isFinalized: false,
            finalizedAt: null
        };

        // Add job to tally
        dailyTally.totalEarnings += completedJob.totalJobValue;
        dailyTally.totalMiles += completedJob.roundtripMiles;
        dailyTally.totalJobs += 1;
        dailyTally.completedJobIds.push(completedJob.jobId);

        // Update firm breakdown
        if (!dailyTally.firmBreakdown[completedJob.firmName]) {
            dailyTally.firmBreakdown[completedJob.firmName] = {
                jobs: 0,
                amount: 0,
                miles: 0,
                jobIds: []
            };
        }

        const firmBreakdown = dailyTally.firmBreakdown[completedJob.firmName];
        firmBreakdown.jobs += 1;
        firmBreakdown.amount += completedJob.totalJobValue;
        firmBreakdown.miles += completedJob.roundtripMiles;
        firmBreakdown.jobIds.push(completedJob.jobId);

        this.dailyTallies.set(dateKey, dailyTally);
        this.saveData();
        
        return dailyTally;
    }

    finalizeDay(date) {
        const dateKey = date; // YYYY-MM-DD format
        const dailyTally = this.dailyTallies.get(dateKey);
        
        if (!dailyTally) return null;

        dailyTally.isFinalized = true;
        dailyTally.finalizedAt = new Date().toISOString();

        // Move completed jobs to billing periods
        Object.keys(dailyTally.firmBreakdown).forEach(firmName => {
            this.updateFirmBillingPeriod(firmName, dateKey, dailyTally.firmBreakdown[firmName]);
        });

        this.dailyTallies.set(dateKey, dailyTally);
        this.saveData();
        
        return dailyTally;
    }

    getDailyTally(date) {
        return this.dailyTallies.get(date);
    }

    getCurrentDailyTally() {
        const today = new Date().toISOString().split('T')[0];
        
        // First try to get pre-calculated tally
        let tally = this.getDailyTally(today);
        
        // If no pre-calculated tally exists, calculate from completed jobs
        if (!tally) {
            console.log(`🔄 Calculating daily tally for ${today} from completed jobs...`);
            
            // Get all jobs completed today
            const todaysJobs = Array.from(this.jobs.values()).filter(job => {
                if (!job.completedDate || job.status !== 'completed') return false;
                const jobDate = job.completedDate.split('T')[0];
                return jobDate === today;
            });
            
            console.log(`Found ${todaysJobs.length} jobs completed today:`, todaysJobs.map(j => `${j.claimNumber} ($${j.totalJobValue})`));
            
            // Calculate totals
            const totalEarnings = todaysJobs.reduce((sum, job) => sum + (job.totalJobValue || 0), 0);
            const totalMiles = todaysJobs.reduce((sum, job) => sum + (job.roundtripMiles || 0), 0);
            
            // Create firm breakdown
            const firmBreakdown = {};
            todaysJobs.forEach(job => {
                if (!firmBreakdown[job.firmName]) {
                    firmBreakdown[job.firmName] = {
                        amount: 0,  // Changed from 'earnings' to 'amount' to match widget expectation
                        jobs: 0,
                        miles: 0
                    };
                }
                firmBreakdown[job.firmName].amount += job.totalJobValue || 0;
                firmBreakdown[job.firmName].jobs += 1;
                firmBreakdown[job.firmName].miles += job.roundtripMiles || 0;
            });
            
            tally = {
                date: today,
                totalEarnings: totalEarnings,
                totalMiles: totalMiles,
                totalJobs: todaysJobs.length,
                firmBreakdown: firmBreakdown,
                completedJobIds: todaysJobs.map(job => job.jobId),
                isFinalized: false
            };
            
            // Cache the calculated tally
            this.dailyTallies.set(today, tally);
            console.log(`✅ Daily tally calculated: $${totalEarnings} from ${todaysJobs.length} jobs`);
        }
        
        return tally;
    }

    /**
     * FIRM BILLING PERIOD MANAGEMENT
     */
    updateFirmBillingPeriod(firmName, date, dailyFirmData) {
        const firmConfig = this.firmConfigs.get(firmName);
        if (!firmConfig) return;

        const billingPeriodKey = this.getBillingPeriodKey(firmName, date, firmConfig.paymentSchedule);
        
        let billingPeriod = this.firmBillingPeriods.get(billingPeriodKey) || {
            firmName,
            paymentSchedule: firmConfig.paymentSchedule,
            startDate: this.getBillingPeriodStart(date, firmConfig.paymentSchedule),
            endDate: this.getBillingPeriodEnd(date, firmConfig.paymentSchedule),
            totalFiles: 0,
            totalAmount: 0,
            totalMiles: 0,
            dailyBreakdown: {},
            status: 'pending' // pending, billed, paid
        };

        // Add daily data to period
        billingPeriod.totalFiles += dailyFirmData.jobs;
        billingPeriod.totalAmount += dailyFirmData.amount;
        billingPeriod.totalMiles += dailyFirmData.miles;
        
        billingPeriod.dailyBreakdown[date] = {
            jobs: dailyFirmData.jobs,
            amount: dailyFirmData.amount,
            miles: dailyFirmData.miles,
            jobIds: dailyFirmData.jobIds
        };

        this.firmBillingPeriods.set(billingPeriodKey, billingPeriod);
        this.saveData();
        
        return billingPeriod;
    }

    getFirmBillingPeriods(firmName, limit = 6) {
        const periods = Array.from(this.firmBillingPeriods.values())
            .filter(period => period.firmName === firmName)
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .slice(0, limit);
            
        return periods;
    }

    getCurrentBillingPeriods() {
        const currentPeriods = {};
        
        this.firmConfigs.forEach((config, firmName) => {
            const today = new Date().toISOString().split('T')[0];
            const periodKey = this.getBillingPeriodKey(firmName, today, config.paymentSchedule);
            const period = this.firmBillingPeriods.get(periodKey);
            
            if (period) {
                currentPeriods[firmName] = period;
            }
        });
        
        return currentPeriods;
    }

    /**
     * MILEAGE CALCULATION
     */
    async initializeGoogleMaps() {
        // Initialize Google Maps Distance Matrix API
        // Wait for Google Maps to be available (it loads asynchronously)
        if (typeof google !== 'undefined' && google.maps && google.maps.DistanceMatrixService) {
            try {
                this.googleMapsService = new google.maps.DistanceMatrixService();
                console.log('✅ Google Maps Distance Matrix Service initialized in JobBillingService');
            } catch (error) {
                console.warn('⚠️ Failed to initialize Google Maps in JobBillingService:', error);
                this.googleMapsService = null;
            }
        } else {
            console.log('⚠️ Google Maps API not yet available for JobBillingService - will retry when needed');
            this.googleMapsService = null;
        }
    }

    async calculateJobMileage(homeAddress, customerAddress) {
        try {
            // Try to initialize Google Maps if it wasn't available before
            if (!this.googleMapsService && typeof google !== 'undefined' && google.maps) {
                await this.initializeGoogleMaps();
            }
            
            if (!this.googleMapsService) {
                console.log('📍 Google Maps not available, using estimated calculation');
                // Fallback to estimated calculation
                return this.estimateMileage(homeAddress, customerAddress);
            }

            return new Promise((resolve, reject) => {
                this.googleMapsService.getDistanceMatrix({
                    origins: [homeAddress],
                    destinations: [customerAddress],
                    unitSystem: window.google.maps.UnitSystem.IMPERIAL,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                    avoidHighways: false,
                    avoidTolls: false
                }, (response, status) => {
                    if (status === 'OK') {
                        const element = response.rows[0].elements[0];
                        
                        if (element.status === 'OK') {
                            const oneWayMiles = element.distance.value * 0.000621371; // Convert meters to miles
                            const roundtripMiles = Math.round(oneWayMiles * 2 * 100) / 100; // Round to 2 decimal places
                            
                            resolve({
                                miles: roundtripMiles,
                                routeDetails: {
                                    oneWayDistance: element.distance.text,
                                    oneWayDuration: element.duration.text,
                                    calculatedAt: new Date().toISOString()
                                }
                            });
                        } else {
                            reject(new Error('Route calculation failed'));
                        }
                    } else {
                        reject(new Error('Google Maps API error: ' + status));
                    }
                });
            });
            
        } catch (error) {
            console.error('Mileage calculation error:', error);
            return this.estimateMileage(homeAddress, customerAddress);
        }
    }

    estimateMileage(homeAddress, customerAddress) {
        // Fallback estimation method
        console.warn('Using estimated mileage calculation');
        return {
            miles: 50, // Default estimate
            routeDetails: {
                method: 'estimated',
                calculatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * UTILITY FUNCTIONS
     */
    generateJobId(firmName, claimNumber) {
        const timestamp = Date.now();
        const firmPrefix = firmName.substring(0, 3).toUpperCase();
        return `${firmPrefix}_${claimNumber}_${timestamp}`;
    }

    getBillingPeriodKey(firmName, date, paymentSchedule) {
        const dateObj = new Date(date);
        let periodIdentifier;
        
        switch (paymentSchedule) {
            case 'weekly':
                const weekStart = this.getWeekStart(dateObj);
                periodIdentifier = weekStart.toISOString().split('T')[0];
                break;
            case 'bi-weekly':
                const biWeekStart = this.getBiWeekStart(dateObj);
                periodIdentifier = biWeekStart.toISOString().split('T')[0];
                break;
            case 'monthly':
                periodIdentifier = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                break;
        }
        
        return `${firmName}_${paymentSchedule}_${periodIdentifier}`;
    }

    getBillingPeriodStart(date, paymentSchedule) {
        const dateObj = new Date(date);
        
        switch (paymentSchedule) {
            case 'weekly':
                return this.getWeekStart(dateObj).toISOString().split('T')[0];
            case 'bi-weekly':
                return this.getBiWeekStart(dateObj).toISOString().split('T')[0];
            case 'monthly':
                return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().split('T')[0];
        }
    }

    getBillingPeriodEnd(date, paymentSchedule) {
        const dateObj = new Date(date);
        
        switch (paymentSchedule) {
            case 'weekly':
                const weekEnd = this.getWeekStart(dateObj);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return weekEnd.toISOString().split('T')[0];
            case 'bi-weekly':
                const biWeekEnd = this.getBiWeekStart(dateObj);
                biWeekEnd.setDate(biWeekEnd.getDate() + 13);
                return biWeekEnd.toISOString().split('T')[0];
            case 'monthly':
                return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0];
        }
    }

    getWeekStart(date) {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        return start;
    }

    getBiWeekStart(date) {
        // Implementation for bi-weekly period calculation
        const weekStart = this.getWeekStart(date);
        const weekNumber = Math.floor((weekStart - new Date(weekStart.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        const biWeekNumber = Math.floor(weekNumber / 2);
        
        const biWeekStart = new Date(weekStart.getFullYear(), 0, 1);
        biWeekStart.setDate(biWeekStart.getDate() + (biWeekNumber * 14));
        
        return biWeekStart;
    }

    /**
     * DATA PERSISTENCE
     */
    saveData() {
        const data = {
            jobs: Array.from(this.jobs.entries()),
            dailyTallies: Array.from(this.dailyTallies.entries()),
            firmBillingPeriods: Array.from(this.firmBillingPeriods.entries()),
            firmConfigs: Array.from(this.firmConfigs.entries()),
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('cypher_job_billing_data', JSON.stringify(data));
        
        // Also save to Supabase if available
        if (window.authService) {
            this.saveToCloud();
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem('cypher_job_billing_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                this.jobs = new Map(data.jobs || []);
                this.dailyTallies = new Map(data.dailyTallies || []);
                this.firmBillingPeriods = new Map(data.firmBillingPeriods || []);
                this.firmConfigs = new Map(data.firmConfigs || []);
            }
        } catch (error) {
            console.error('Error loading job billing data:', error);
        }
    }

    async saveToCloud() {
        // Integration with Supabase for cloud storage
        console.log('Job billing data saved locally. Cloud sync pending authentication.');
    }

    /**
     * ANALYTICS & REPORTING
     */
    getEarningsAnalytics(days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - days);
        
        const analytics = {
            totalEarnings: 0,
            totalJobs: 0,
            totalMiles: 0,
            averagePerJob: 0,
            firmBreakdown: {},
            dailyTrends: []
        };
        
        // Calculate analytics from daily tallies
        this.dailyTallies.forEach((tally, date) => {
            const tallyDate = new Date(date);
            if (tallyDate >= startDate && tallyDate <= endDate) {
                analytics.totalEarnings += tally.totalEarnings;
                analytics.totalJobs += tally.totalJobs;
                analytics.totalMiles += tally.totalMiles;
                
                analytics.dailyTrends.push({
                    date: date,
                    earnings: tally.totalEarnings,
                    jobs: tally.totalJobs,
                    miles: tally.totalMiles
                });
                
                // Aggregate firm breakdown
                Object.keys(tally.firmBreakdown).forEach(firmName => {
                    if (!analytics.firmBreakdown[firmName]) {
                        analytics.firmBreakdown[firmName] = { jobs: 0, amount: 0, miles: 0 };
                    }
                    analytics.firmBreakdown[firmName].jobs += tally.firmBreakdown[firmName].jobs;
                    analytics.firmBreakdown[firmName].amount += tally.firmBreakdown[firmName].amount;
                    analytics.firmBreakdown[firmName].miles += tally.firmBreakdown[firmName].miles;
                });
            }
        });
        
        analytics.averagePerJob = analytics.totalJobs > 0 ? analytics.totalEarnings / analytics.totalJobs : 0;
        
        return analytics;
    }
}

// Export for use in other modules
window.JobBillingService = JobBillingService;