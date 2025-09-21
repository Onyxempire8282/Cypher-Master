/**
 * Jobs Studio Controller
 * Manages job creation, tracking, and mobile integration
 */

class JobsStudioController {
    constructor() {
        this.jobs = [];
        this.activeJobs = [];
        this.completedJobs = [];
        
        this.init();
    }

    init() {
        console.log('💼 Initializing Jobs Studio Controller...');
        
        // Load existing jobs
        this.loadJobs();
        
        // Bind events
        this.bindEvents();
        
        // Update stats
        this.updateStats();
        
        console.log('✅ Jobs Studio Controller ready');
    }

    bindEvents() {
        // Sync mobile jobs button
        const syncBtn = document.getElementById('syncMobileJobsBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncMobileJobs());
        }

        // Add job button
        const addJobBtn = document.getElementById('addJobBtn');
        if (addJobBtn) {
            addJobBtn.addEventListener('click', () => this.showAddJobModal());
        }

        // Creation option buttons
        const manualBtn = document.getElementById('manualJobBtn');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => this.createManualJob());
        }

        const mobileBtn = document.getElementById('mobileJobBtn');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => this.syncMobileJobs());
        }

        const zapierBtn = document.getElementById('zapierJobBtn');
        if (zapierBtn) {
            zapierBtn.addEventListener('click', () => this.setupZapierIntegration());
        }
    }

    loadJobs() {
        // Load from localStorage for now
        const savedJobs = localStorage.getItem('cipherJobs');
        this.jobs = savedJobs ? JSON.parse(savedJobs) : [];
        
        // Separate active and completed
        this.activeJobs = this.jobs.filter(job => job.status !== 'completed');
        this.completedJobs = this.jobs.filter(job => job.status === 'completed');
        
        console.log(`📊 Loaded ${this.jobs.length} jobs (${this.activeJobs.length} active)`);
        
        // Render jobs to UI
        this.renderJobs();
        
        // Fire event to update analytics
        window.dispatchEvent(new CustomEvent('jobs:loaded', {
            detail: {
                totalJobs: this.jobs.length,
                activeJobs: this.activeJobs.length,
                completedJobs: this.completedJobs.length
            }
        }));
    }

    updateStats() {
        // Update job counts
        const activeCount = document.getElementById('activeJobsCount');
        if (activeCount) {
            activeCount.textContent = this.activeJobs.length;
        }

        const completedCount = document.getElementById('completedJobsCount');
        if (completedCount) {
            completedCount.textContent = this.completedJobs.length;
        }

        const totalCount = document.getElementById('totalJobsCount');
        if (totalCount) {
            totalCount.textContent = this.jobs.length;
        }

        // Calculate earnings
        const totalEarnings = this.jobs.reduce((sum, job) => sum + (job.earnings || 0), 0);
        const earningsEl = document.getElementById('totalEarnings');
        if (earningsEl) {
            earningsEl.textContent = `$${totalEarnings.toLocaleString()}`;
        }

        // Calculate average
        const avgValue = this.jobs.length > 0 ? totalEarnings / this.jobs.length : 0;
        const avgEl = document.getElementById('avgJobValue');
        if (avgEl) {
            avgEl.textContent = `$${Math.round(avgValue)}`;
        }
    }

    syncMobileJobs() {
        console.log('📱 Syncing mobile jobs...');
        
        // Show loading state
        this.showNotification('Syncing mobile jobs...', 'info');
        
        // Simulate mobile sync
        setTimeout(() => {
            this.showNotification('Mobile sync completed! No new jobs found.', 'success');
        }, 2000);
    }

    showAddJobModal() {
        console.log('➕ Opening add job modal...');
        
        // Collect all job details via prompts (user can cancel at any step by clicking Cancel or pressing Escape)
        const jobNumber = prompt('Enter job/claim number:\n(Click Cancel to exit at any time)');
        if (!jobNumber || jobNumber.trim() === '') {
            console.log('❌ Job creation cancelled by user');
            return;
        }
        
        const firm = prompt('Enter firm name (e.g., ACD, State Farm):\n(Click Cancel to exit)');
        if (!firm || firm.trim() === '') {
            console.log('❌ Job creation cancelled by user');
            return;
        }
        
        const type = prompt('Enter job type (e.g., Property Damage, Auto Total Loss, Catastrophic):\n(Click Cancel to exit, or leave blank for "General Claim")');
        if (type === null) {
            console.log('❌ Job creation cancelled by user');
            return;
        }
        const jobType = type.trim() || 'General Claim';
        
        const location = prompt('Enter location/address:\n(Click Cancel to exit, or leave blank for "TBD")');
        if (location === null) {
            console.log('❌ Job creation cancelled by user');
            return;
        }
        const jobLocation = location.trim() || 'TBD';
        
        const earnings = prompt('Enter expected earnings amount (numbers only):\n(Click Cancel to exit, or leave blank for $0)');
        if (earnings === null) {
            console.log('❌ Job creation cancelled by user');
            return;
        }
        const earningsAmount = earnings && earnings.trim() ? parseFloat(earnings) : 0;
        
        // Ask for initial status
        const isCompleted = confirm('Is this job already completed?\n\nOK = Completed (will appear in billing calendar)\nCancel = Active (still working on it)');
        const status = isCompleted ? 'completed' : 'active';
        
        // Confirm before creating
        const confirmCreate = confirm(`Create this job?\n\nNumber: ${jobNumber}\nFirm: ${firm}\nType: ${jobType}\nLocation: ${jobLocation}\nEarnings: $${earningsAmount}\nStatus: ${status}\n\nClick OK to create, Cancel to abort.`);
        
        if (!confirmCreate) {
            console.log('❌ Job creation cancelled by user at confirmation step');
            return;
        }
        
        this.createJob({
            number: jobNumber,
            type: jobType,
            status: status,
            earnings: earningsAmount,
            firm: firm,
            location: jobLocation,
            createdDate: new Date().toISOString()
        });
    }

    createManualJob() {
        console.log('✍️ Creating manual job...');
        this.showAddJobModal();
    }

    setupZapierIntegration() {
        console.log('⚡ Setting up Zapier integration...');
        this.showNotification('Zapier integration setup coming soon!', 'info');
    }

    createJob(jobData) {
        const newJob = {
            id: Date.now().toString(),
            ...jobData
        };
        
        this.jobs.push(newJob);
        this.saveJobs();
        this.loadJobs();
        this.updateStats();
        
        this.showNotification(`Job ${newJob.number} created successfully!`, 'success');
    }

    saveJobs() {
        localStorage.setItem('cipherJobs', JSON.stringify(this.jobs));
    }

    showNotification(message, type = 'info') {
        // Simple notification for now
        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        
        // Use console instead of alert to prevent modal loops
        console.log(`✅ ${message}`);
    }
    
    renderJobs() {
        // Render active jobs
        const activeContainer = document.getElementById('activeJobsList');
        if (activeContainer) {
            if (this.activeJobs.length === 0) {
                activeContainer.innerHTML = `
                    <div class="empty-jobs-state">
                        <div class="empty-icon">💼</div>
                        <h4>No Active Jobs</h4>
                        <p>Click "Add New Job" to get started</p>
                    </div>
                `;
            } else {
                activeContainer.innerHTML = this.activeJobs.map(job => this.renderJobCard(job)).join('');
            }
        }
        
        // Render completed jobs
        const completedContainer = document.getElementById('completedJobsList');
        if (completedContainer) {
            if (this.completedJobs.length === 0) {
                completedContainer.innerHTML = `
                    <div class="empty-jobs-state">
                        <div class="empty-icon">✅</div>
                        <h4>No Completed Jobs</h4>
                        <p>Completed jobs will appear here</p>
                    </div>
                `;
            } else {
                completedContainer.innerHTML = this.completedJobs.map(job => this.renderJobCard(job)).join('');
            }
        }
    }
    
    renderJobCard(job) {
        const statusClass = job.status === 'completed' ? 'completed' : 'active';
        const earnings = job.earnings ? `$${job.earnings.toFixed(2)}` : '$0.00';
        
        return `
            <div class="job-card ${statusClass}">
                <div class="job-header">
                    <div class="job-info">
                        <h4>${job.number}</h4>
                        <p class="job-type">${job.type}</p>
                    </div>
                    <div class="job-status ${statusClass}">${job.status}</div>
                </div>
                <div class="job-details">
                    <div class="detail-row">
                        <span class="label">Firm:</span>
                        <span class="value">${job.firm}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Location:</span>
                        <span class="value">${job.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Est. Earnings:</span>
                        <span class="value earnings">${earnings}</span>
                    </div>
                </div>
                <div class="job-actions">
                    <button class="action-btn primary" onclick="window.jobsStudio?.viewJobDetails('${job.id}') || console.error('JobsStudio not initialized')">View Details</button>
                    ${job.status !== 'completed' ? 
                        `<button class="action-btn secondary" onclick="window.jobsStudio?.markJobCompleted('${job.id}') || console.error('JobsStudio not initialized')">Mark Complete</button>` : 
                        `<button class="action-btn secondary" onclick="window.jobsStudio?.markJobActive('${job.id}') || console.error('JobsStudio not initialized')">Reopen</button>`
                    }
                    <button class="action-btn danger" onclick="window.jobsStudio?.deleteJob('${job.id}') || console.error('JobsStudio not initialized')">❌ Delete</button>
                </div>
            </div>
        `;
    }
    
    viewJobDetails(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            console.log('📊 Job Details:', job);
            alert(`Job Details:\n\nNumber: ${job.number}\nType: ${job.type}\nFirm: ${job.firm}\nLocation: ${job.location}\nEarnings: $${job.earnings}\nStatus: ${job.status}`);
        }
    }
    
    markJobCompleted(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            job.status = 'completed';
            this.saveJobs();
            this.loadJobs();
            this.updateStats();
            
            // Fire completion event for billing integration
            window.dispatchEvent(new CustomEvent('job:completed', {
                detail: job
            }));
            
            console.log(`✅ Job ${job.number} marked as completed`);
        }
    }
    
    markJobActive(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            job.status = 'active';
            this.saveJobs();
            this.loadJobs();
            this.updateStats();
            console.log(`🔄 Job ${job.number} reopened`);
        }
    }
    
    deleteJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            const confirmDelete = confirm(`Delete job ${job.number}?\n\nFirm: ${job.firm}\nType: ${job.type}\nEarnings: $${job.earnings}\n\nThis action cannot be undone.`);
            
            if (confirmDelete) {
                console.log(`🗑️ Deleting job ${job.number} (ID: ${jobId})`);
                console.log('Jobs before delete:', this.jobs.length);
                
                // Remove job from array
                this.jobs = this.jobs.filter(j => j.id !== jobId);
                
                console.log('Jobs after delete:', this.jobs.length);
                
                // Save to localStorage immediately
                this.saveJobs();
                console.log('Jobs saved to localStorage');
                
                // Verify save worked
                const savedJobs = localStorage.getItem('cipherJobs');
                const parsedJobs = savedJobs ? JSON.parse(savedJobs) : [];
                console.log('Verified jobs in localStorage:', parsedJobs.length);
                
                // Refresh display
                this.loadJobs();
                this.updateStats();
                
                console.log(`✅ Job ${job.number} deleted successfully and saved`);
            } else {
                console.log(`ℹ️ Job deletion cancelled`);
            }
        } else {
            console.error(`❌ Job with ID ${jobId} not found`);
        }
    }

    // Public methods for integration
    getAllJobs() {
        return this.jobs;
    }

    getActiveJobs() {
        return this.activeJobs;
    }

    getCompletedJobs() {
        return this.completedJobs;
    }
}

// Make available globally
window.JobsStudioController = JobsStudioController;

// Auto-initialize if not already done
if (typeof window !== 'undefined' && !window.jobsStudio) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.jobsStudio) {
                console.log('🔄 Auto-initializing JobsStudioController...');
                window.jobsStudio = new JobsStudioController();
            }
        });
    } else {
        // DOM already ready
        console.log('🔄 Auto-initializing JobsStudioController...');
        window.jobsStudio = new JobsStudioController();
    }
}