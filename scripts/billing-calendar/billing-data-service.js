/**
 * Billing Data Service
 * Manages firm billing schedules and payment tracking
 */

class BillingDataService {
    constructor(jobBillingService = null) {
        this.jobBillingService = jobBillingService;
        this.billingEvents = [];
        this.firms = new Map();
        this.init();
    }

    init() {
        // Load existing billing data
        this.loadBillingData();
        
        // If JobBillingService is available, sync with it
        if (this.jobBillingService) {
            this.syncWithJobBillingService();
        }
        
        // Set up recurring payment calculations
        this.calculateUpcomingPayments();
        
        // Only add sample data if no firms exist AND no JobBillingService data AND no real jobs exist
        const hasRealJobs = window.jobsStudio && window.jobsStudio.getAllJobs().length > 0;
        const hasJobBillingData = this.jobBillingService && this.jobBillingService.jobs.size > 0;
        
        if (this.firms.size === 0 && !this.jobBillingService && !hasRealJobs && !hasJobBillingData) {
            console.log('🎆 No real data found, adding sample data for demo...');
            this.addSampleData();
        } else {
            console.log(`📊 Found real data - Firms: ${this.firms.size}, Events: ${this.billingEvents.length}, Real jobs: ${hasRealJobs ? window.jobsStudio.getAllJobs().length : 0}`);
        }
    }

    syncWithJobBillingService() {
        try {
            const firmConfigs = this.jobBillingService.getAllFirmConfigs();
            console.log(`🔄 Syncing ${firmConfigs.length} firms with calendar service`);
            
            firmConfigs.forEach(firm => {
                this.addFirm({
                    name: firm.name,
                    paymentSchedule: firm.paymentSchedule,
                    paymentDay: firm.paymentDay || this.getDefaultPaymentDay(firm.paymentSchedule),
                    claimRate: firm.fileRate, // Using fileRate as per-claim rate
                    contactInfo: firm.contactInfo || {}
                });
            });
        } catch (error) {
            console.error('Error syncing with JobBillingService:', error);
        }
    }

    getDefaultPaymentDay(schedule) {
        const defaults = {
            'weekly': 'Friday',
            'bi-weekly': 'Friday',
            'monthly': '31'
        };
        return defaults[schedule] || 'Friday';
    }

    /**
     * Add or update a firm's billing information
     */
    addFirm(firmData) {
        const {
            name,
            paymentSchedule, // 'weekly', 'bi-weekly', 'monthly'
            paymentDay,      // 'Friday', 'Tuesday', or date (31)
            claimRate,
            contactInfo
        } = firmData;

        this.firms.set(name, {
            name,
            paymentSchedule,
            paymentDay,
            claimRate,
            contactInfo,
            completedClaimsThisPeriod: 0,
            pendingClaims: [],
            lastPaymentDate: null
        });

        this.calculateFirmNextPayment(name);
        this.saveData();
    }

    /**
     * Add a billing event (calculated payment due date)
     */
    addBillingEvent(eventData) {
        const event = {
            id: this.generateEventId(),
            date: eventData.date,
            firmName: eventData.firmName,
            amount: eventData.amount,
            type: eventData.type, // 'weekly', 'bi-weekly', 'monthly'
            claims: eventData.claims || [],
            status: 'pending', // 'pending', 'paid', 'overdue'
            claimsCompleted: eventData.claimsCompleted || 0
        };

        this.billingEvents.push(event);
        this.sortEventsByDate();
        this.saveData();
        
        return event.id;
    }

    /**
     * Get billing events for a specific date range
     */
    getBillingEvents(startDate = new Date(), endDate = null) {
        if (!endDate) {
            // Default to next 30 days
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 30);
        }

        return this.billingEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= startDate && eventDate <= endDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Get upcoming payments (next 7 days)
     */
    getUpcomingPayments() {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return this.getBillingEvents(today, nextWeek);
    }

    /**
     * Get billing summary for dashboard display
     */
    getBillingSummary() {
        const upcomingPayments = this.getUpcomingPayments();
        const activeFirms = this.firms.size;
        
        const totalUpcoming = upcomingPayments.reduce((sum, payment) => {
            const amount = parseFloat(payment.amount.replace(/[$,]/g, '')) || 0;
            return sum + amount;
        }, 0);

        const nextPaymentDate = upcomingPayments.length > 0 ? upcomingPayments[0].date : null;

        return {
            upcomingPayments: upcomingPayments.length,
            totalUpcoming: `$${totalUpcoming.toFixed(2)}`,
            activeFirms: activeFirms,
            nextPaymentDate: nextPaymentDate
        };
    }

    /**
     * Mark a billing event as paid
     */
    markEventPaid(eventId) {
        const event = this.billingEvents.find(e => e.id === eventId);
        if (event) {
            event.status = 'paid';
            event.paidDate = new Date().toISOString();
            this.saveData();
            return true;
        }
        return false;
    }

    /**
     * Add hours worked for a specific firm
     */
    addCompletedClaims(firmName, claimIds = [], date = new Date()) {
        const firm = this.firms.get(firmName);
        if (!firm) return false;

        const claimCount = claimIds.length || 1;
        firm.completedClaimsThisPeriod += claimCount;
        
        // Add claims to pending list
        claimIds.forEach(claimId => {
            if (!firm.pendingClaims.includes(claimId)) {
                firm.pendingClaims.push(claimId);
            }
        });
        
        // Calculate payment amount based on claims and rate
        const paymentAmount = claimCount * firm.claimRate;
        
        // Create billing event
        this.addBillingEvent({
            firmName: firmName,
            date: this.getNextPaymentDate(firmName, date).toISOString(),
            amount: `$${paymentAmount.toFixed(2)}`,
            type: firm.paymentSchedule,
            claimsCompleted: claimCount,
            claims: claimIds
        });

        this.saveData();
        return true;
    }

    /**
     * Get next payment date for a firm based on their schedule
     */
    getNextPaymentDate(firmName, fromDate = new Date()) {
        const firm = this.firms.get(firmName);
        if (!firm) return fromDate;

        const paymentDate = new Date(fromDate);

        switch (firm.paymentSchedule) {
            case 'weekly':
                // Find next Friday (or specified day)
                const daysUntilFriday = (5 - paymentDate.getDay() + 7) % 7;
                paymentDate.setDate(paymentDate.getDate() + (daysUntilFriday || 7));
                break;

            case 'bi-weekly':
                // Every 2 weeks on Friday
                const daysUntilBiWeekly = (5 - paymentDate.getDay() + 7) % 7;
                paymentDate.setDate(paymentDate.getDate() + (daysUntilBiWeekly || 14));
                break;

            case 'monthly':
                // Last day of month or specified date
                if (firm.paymentDay === '31') {
                    // Last day of month
                    paymentDate.setMonth(paymentDate.getMonth() + 1, 0);
                } else {
                    // Specific date
                    const day = parseInt(firm.paymentDay);
                    paymentDate.setMonth(paymentDate.getMonth() + 1, day);
                }
                break;
        }

        return paymentDate;
    }

    /**
     * Load billing data from localStorage
     */
    loadBillingData() {
        try {
            const savedEvents = localStorage.getItem('billingCalendarEvents');
            if (savedEvents) {
                this.billingEvents = JSON.parse(savedEvents);
            }

            const savedFirms = localStorage.getItem('billingCalendarFirms');
            if (savedFirms) {
                const firmsData = JSON.parse(savedFirms);
                this.firms = new Map(Object.entries(firmsData));
            }
        } catch (error) {
            console.error('Error loading billing data:', error);
        }
    }

    /**
     * Save billing data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem('billingCalendarEvents', JSON.stringify(this.billingEvents));
            
            const firmsObject = Object.fromEntries(this.firms);
            localStorage.setItem('billingCalendarFirms', JSON.stringify(firmsObject));
        } catch (error) {
            console.error('Error saving billing data:', error);
        }
    }

    /**
     * Sort events by date
     */
    sortEventsByDate() {
        this.billingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Generate upcoming payment events automatically
     */
    calculateUpcomingPayments() {
        console.log('📅 Calculating upcoming payments...');
        
        // Clear future events to recalculate
        const now = new Date();
        this.billingEvents = this.billingEvents.filter(event => 
            new Date(event.date) <= now || event.status === 'paid'
        );

        // Generate next payment for each firm
        this.firms.forEach((firm, firmName) => {
            const nextPaymentDate = this.getNextPaymentDate(firmName);
            
            // Create placeholder payment event
            this.addBillingEvent({
                firmName: firmName,
                date: nextPaymentDate.toISOString(),
                amount: `$${(firm.completedClaimsThisPeriod * firm.claimRate).toFixed(2)}`,
                type: firm.paymentSchedule,
                claimsCompleted: firm.completedClaimsThisPeriod,
                claims: firm.pendingClaims || []
            });
        });

        console.log(`✅ Generated ${this.billingEvents.length} billing events`);
    }

    /**
     * Calculate next payment date for a specific firm
     */
    calculateFirmNextPayment(firmName) {
        const firm = this.firms.get(firmName);
        if (!firm) return null;

        const today = new Date();
        let nextPaymentDate;

        switch (firm.paymentSchedule) {
            case 'weekly':
                nextPaymentDate = this.getNextWeekday(firm.paymentDay);
                break;
            case 'bi-weekly':
                nextPaymentDate = this.getNextBiWeeklyDate(firm.paymentDay, firm.lastPaymentDate);
                break;
            case 'monthly':
                nextPaymentDate = this.getNextMonthlyDate(firm.paymentDay);
                break;
        }

        // Create billing event if it doesn't exist
        const existingEvent = this.billingEvents.find(event => 
            event.firmName === firmName && 
            event.date === nextPaymentDate.toISOString().split('T')[0] &&
            event.status === 'pending'
        );

        if (!existingEvent && firm.completedClaimsThisPeriod > 0) {
            this.addBillingEvent({
                date: nextPaymentDate.toISOString().split('T')[0],
                firmName: firmName,
                amount: this.calculatePaymentAmount(firmName),
                type: firm.paymentSchedule,
                claimsCompleted: firm.completedClaimsThisPeriod
            });
        }

        return nextPaymentDate;
    }

    /**
     * Calculate payment amount for a firm based on completed claims
     */
    calculatePaymentAmount(firmName) {
        const firm = this.firms.get(firmName);
        if (!firm) return 0;

        const totalAmount = firm.completedClaimsThisPeriod * parseFloat(firm.claimRate.toString().replace('$', ''));
        return `$${totalAmount.toLocaleString()}`;
    }

    /**
     * Get next occurrence of a specific weekday
     */
    getNextWeekday(dayName) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const todayDayIndex = today.getDay();
        const targetDayIndex = days.indexOf(dayName);
        
        const daysUntilTarget = (targetDayIndex - todayDayIndex + 7) % 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        
        return nextDate;
    }

    /**
     * Get next bi-weekly payment date
     */
    getNextBiWeeklyDate(dayName, lastPaymentDate) {
        if (!lastPaymentDate) {
            return this.getNextWeekday(dayName);
        }

        const lastPayment = new Date(lastPaymentDate);
        const nextPayment = new Date(lastPayment);
        nextPayment.setDate(lastPayment.getDate() + 14);
        
        return nextPayment;
    }

    /**
     * Get next monthly payment date
     */
    getNextMonthlyDate(dayOfMonth) {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
        
        // If the date has passed this month, use next month
        if (today.getDate() > dayOfMonth) {
            return nextMonth;
        } else {
            return new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
        }
    }

    /**
     * Mark a billing event as paid
     */
    markEventPaid(eventId, paidDate = new Date()) {
        const event = this.billingEvents.find(e => e.id === eventId);
        if (event) {
            event.status = 'paid';
            event.paidDate = paidDate.toISOString().split('T')[0];
            
            // Update firm's last payment date
            const firm = this.firms.get(event.firmName);
            if (firm) {
                firm.lastPaymentDate = paidDate.toISOString().split('T')[0];
                firm.completedClaimsThisPeriod = 0; // Reset for next period
            }
            
            this.saveData();
        }
    }

    /**
     * Add completed claims for a specific firm
     */
    addCompletedClaim(firmName, claimId) {
        const firm = this.firms.get(firmName);
        if (firm) {
            firm.completedClaimsThisPeriod += 1;
            
            if (claimId && !firm.pendingClaims.includes(claimId)) {
                firm.pendingClaims.push(claimId);
            }
            
            // Recalculate next payment
            this.calculateFirmNextPayment(firmName);
            this.saveData();
        }
    }

    /**
     * Calculate all upcoming payments for all firms
     */
    calculateUpcomingPayments() {
        this.firms.forEach((firm, firmName) => {
            this.calculateFirmNextPayment(firmName);
        });
    }

    /**
     * Utility functions
     */
    generateEventId() {
        return 'billing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    sortEventsByDate() {
        this.billingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Data persistence
     */
    saveData() {
        const data = {
            billingEvents: this.billingEvents,
            firms: Array.from(this.firms.entries())
        };
        
        localStorage.setItem('cypher_billing_data', JSON.stringify(data));
        
        // Also save to Supabase if available
        if (window.authService) {
            this.saveToBilling();
        }
    }

    loadBillingData() {
        try {
            const savedData = localStorage.getItem('cypher_billing_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.billingEvents = data.billingEvents || [];
                this.firms = new Map(data.firms || []);
            }
        } catch (error) {
            console.error('Error loading billing data:', error);
        }
    }

    async saveToBilling() {
        // Integration with Supabase for cloud storage
        // This will be implemented when user authentication is active
        console.log('Billing data saved locally. Cloud sync pending authentication.');
    }

    /**
     * Integration method - called when a claim is completed in other parts of the system
     */
    onClaimCompleted(claimData) {
        const { firmName, claimId, completionDate } = claimData;
        
        if (!firmName) {
            console.warn('Cannot process claim completion without firm name');
            return false;
        }
        
        console.log(`📋 Claim ${claimId} completed for ${firmName}`);
        
        // Clear demo data when first real claim is added
        this.clearDemoDataIfExists();
        
        // Add the completed claim
        this.addCompletedClaim(firmName, claimId);
        
        return true;
    }
    
    /**
     * Clear demo/sample data when real data is added
     */
    clearDemoDataIfExists() {
        const demoFirms = ['MetLife Insurance', 'State Farm Regional', 'Allstate Quick Claims'];
        let clearedAny = false;
        
        // Remove demo firms
        demoFirms.forEach(demoFirm => {
            if (this.firms.has(demoFirm)) {
                this.firms.delete(demoFirm);
                console.log(`🧺 Removed demo firm: ${demoFirm}`);
                clearedAny = true;
            }
        });
        
        // Remove demo billing events
        const originalEventCount = this.billingEvents.length;
        this.billingEvents = this.billingEvents.filter(event => {
            return !demoFirms.includes(event.firmName);
        });
        
        if (this.billingEvents.length < originalEventCount) {
            console.log(`🧺 Removed ${originalEventCount - this.billingEvents.length} demo billing events`);
            clearedAny = true;
        }
        
        if (clearedAny) {
            this.saveData();
            console.log('✅ Demo data cleared, using real data only');
        }
    }
    
    /**
     * Integration method - get billing status for a specific firm
     */
    getFirmBillingStatus(firmName) {
        const firm = this.firms.get(firmName);
        if (!firm) return null;
        
        const upcomingEvents = this.billingEvents.filter(event => 
            event.firmName === firmName && 
            event.status === 'pending' &&
            new Date(event.date) > new Date()
        );
        
        return {
            firmName: firm.name,
            completedClaims: firm.completedClaimsThisPeriod,
            pendingClaims: firm.pendingClaims.length,
            nextPaymentDate: upcomingEvents.length > 0 ? upcomingEvents[0].date : null,
            nextPaymentAmount: upcomingEvents.length > 0 ? upcomingEvents[0].amount : '$0'
        };
    }
    
    /**
     * Add sample billing data for demonstration
     */
    addSampleData() {
        console.log('🎆 Adding sample billing data for demo...');
        
        // Sample firms with different payment schedules
        const sampleFirms = [
            {
                name: 'MetLife Insurance',
                paymentSchedule: 'bi-weekly',
                paymentDay: 'Friday',
                claimRate: 750,
                contactInfo: { email: 'billing@metlife.com', phone: '555-0123' }
            },
            {
                name: 'State Farm Regional',
                paymentSchedule: 'monthly',
                paymentDay: '31',
                claimRate: 850,
                contactInfo: { email: 'adjusters@statefarm.com', phone: '555-0456' }
            },
            {
                name: 'Allstate Quick Claims',
                paymentSchedule: 'weekly',
                paymentDay: 'Friday',
                claimRate: 650,
                contactInfo: { email: 'payments@allstate.com', phone: '555-0789' }
            }
        ];
        
        sampleFirms.forEach(firm => {
            this.addFirm(firm);
            
            // Add some completed claims for demonstration
            const claimCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < claimCount; i++) {
                const claimId = `DEMO-${firm.name.replace(/\s+/g, '')}-${Date.now()}-${i}`;
                this.addCompletedClaim(firm.name, claimId);
            }
        });
        
        console.log('✅ Sample billing data added successfully!');
    }

    /**
     * Get summary statistics
     */
    getBillingSummary() {
        const upcomingPayments = this.getUpcomingPayments();
        const totalUpcoming = upcomingPayments.reduce((sum, event) => {
            return sum + parseFloat(event.amount.replace(/[$,]/g, ''));
        }, 0);

        return {
            upcomingPayments: upcomingPayments.length,
            totalUpcoming: `$${totalUpcoming.toLocaleString()}`,
            activeFirms: this.firms.size,
            nextPaymentDate: upcomingPayments.length > 0 ? upcomingPayments[0].date : null
        };
    }
}

// Export for use in other modules
window.BillingDataService = BillingDataService;
console.log('✅ BillingDataService loaded successfully');

// Global debug functions for testing
window.debugBillingData = function() {
    // Find the billing service instance
    let billingService;
    if (window.billingCalendar && window.billingCalendar.dataService) {
        billingService = window.billingCalendar.dataService;
    } else if (window.masterInterface && window.masterInterface.billingCalendarWidget) {
        billingService = window.masterInterface.billingCalendarWidget.dataService;
    } else if (window.BillingDataService) {
        // Create a temporary instance to check localStorage
        billingService = new window.BillingDataService();
    }
    
    if (billingService) {
        console.log('📊 Current billing data:');
        console.log('Firms:', Array.from(billingService.firms.entries()));
        
        // Show firm names clearly
        const firmNames = Array.from(billingService.firms.keys());
        console.log('🏢 Firm names:', firmNames);
        
        console.log('Billing events:', billingService.billingEvents);
        console.log('Summary:', billingService.getBillingSummary());
        console.log('LocalStorage data:', {
            events: localStorage.getItem('cypher_billing_data'),
            legacy: localStorage.getItem('billingCalendarEvents')
        });
        return billingService;
    } else {
        console.error('❌ Could not find billing service');
        return null;
    }
};

window.testAddClaim = function(firmName = 'Test Firm', claimId = 'TEST-001', paymentAmount = null) {
    console.log(`🧪 Testing claim completion: ${claimId} for ${firmName}`);
    
    // Find the billing service instance
    let billingService;
    if (window.billingCalendar && window.billingCalendar.dataService) {
        billingService = window.billingCalendar.dataService;
    } else if (window.masterInterface && window.masterInterface.billingCalendarWidget) {
        billingService = window.masterInterface.billingCalendarWidget.dataService;
    } else if (window.BillingDataService) {
        billingService = new window.BillingDataService();
    }
    
    if (billingService) {
        // Check if firm exists, if not prompt for details
        if (!billingService.firms.has(firmName)) {
            const rate = paymentAmount || prompt(`How much do you get paid per claim for ${firmName}? (enter amount without $)`);
            if (!rate) {
                console.log('❌ Cancelled - no payment rate provided');
                return false;
            }
            
            console.log(`➕ Adding new firm: ${firmName} at $${rate} per claim`);
            billingService.addFirm({
                name: firmName,
                paymentSchedule: 'bi-weekly', // Default - can be changed later
                paymentDay: 'Friday',
                claimRate: parseFloat(rate),
                contactInfo: { email: `billing@${firmName.toLowerCase().replace(/\s+/g, '')}.com` }
            });
        }
        
        // Add the completed claim
        billingService.addCompletedClaim(firmName, claimId);
        console.log(`✅ Claim ${claimId} added for ${firmName}`);
        
        // Force refresh of any active calendar widget
        if (window.billingCalendar && window.billingCalendar.refreshData) {
            window.billingCalendar.refreshData();
            console.log('🔄 Calendar refreshed');
        } else if (window.masterInterface && window.masterInterface.billingCalendarWidget) {
            window.masterInterface.billingCalendarWidget.refreshData();
            console.log('🔄 Calendar refreshed via master interface');
        }
        
        // Show updated summary
        const summary = billingService.getBillingSummary();
        console.log('📊 Updated summary:', summary);
        
        return true;
    } else {
        console.error('❌ Could not find billing service');
        return false;
    }
};

window.clearBillingData = function() {
    localStorage.removeItem('cypher_billing_data');
    localStorage.removeItem('billingCalendarEvents');
    localStorage.removeItem('billingCalendarFirms');
    console.log('🧺 All billing data cleared from localStorage');
    window.location.reload();
};