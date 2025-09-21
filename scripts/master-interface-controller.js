/**
 * Master Interface Controller
 * Manages tab navigation and intelligent workflow connections
 */

class MasterInterfaceController {
    constructor() {
        this.currentTab = 'dashboard';
        this.loadedTabs = new Set();
        this.workflowData = {
            routeData: null,
            mileageData: null,
            jobsData: null,
            totalLossData: null
        };
        
        this.userProfile = null;
        this.colorScheme = 'classic';
        this.workflowAnalytics = {
            sessionStart: Date.now(),
            tabUsage: {},
            completedWorkflows: [],
            recommendations: []
        };
        
        // Billing system components
        this.jobBillingService = null;
        this.earningsSummaryWidget = null;
        this.nextStepsWidget = null;
        this.dailyTallyWidget = null;
        this.billingAnalyticsWidget = null;
        this.billingCalendarWidget = null;
        this.firmConfiguration = null;
        this.jobsStudioController = null;
        
        this.init();
    }

    /* ================================
       USER PROFILE & PERSONALIZATION
       ================================ */

    loadUserProfile() {
        console.log('👤 Loading user profile...');
        
        // Load from localStorage (saved during onboarding)
        const savedProfile = localStorage.getItem('userCipher');
        if (savedProfile) {
            try {
                this.userProfile = JSON.parse(savedProfile);
                this.colorScheme = localStorage.getItem('colorScheme') || 'classic';
                
                // Apply color scheme to body for glassmorphism theming
                document.body.setAttribute('data-color-scheme', this.colorScheme);
                
                console.log('✅ User profile loaded:', this.userProfile);
                console.log('🎨 Color scheme applied:', this.colorScheme);
            } catch (error) {
                console.warn('⚠️ Failed to parse user profile:', error);
            }
        } else {
            // Default color scheme
            document.body.setAttribute('data-color-scheme', 'classic');
        }
        
        // TODO: Also load from Supabase if user is authenticated
        this.loadFromDatabase();
    }

    getUserRole() {
        // Check if user profile has role information
        if (this.userProfile && this.userProfile.role) {
            return this.userProfile.role;
        }
        
        // Fallback to localStorage check
        const userProfile = JSON.parse(localStorage.getItem('cc_user_profile') || '{}');
        return userProfile.role || 'adjuster'; // Default to adjuster
    }

    async loadFromDatabase() {
        if (window.authService && window.authService.isUserAuthenticated()) {
            try {
                const user = window.authService.getCurrentUser();
                if (user) {
                    const result = await window.authService.getUserProfile(user.id);
                    if (result.success) {
                        console.log('📊 Database profile loaded:', result.profile);
                        // Merge with local data
                        this.userProfile = { ...this.userProfile, ...result.profile };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Failed to load from database:', error);
            }
        }
    }

    personalizeInterface() {
        console.log('🎨 Personalizing interface...');
        
        if (!this.userProfile) {
            console.log('📦 No user profile available, using defaults');
            return;
        }

        // Update user name and info
        this.updateUserDisplay();
        
        // Apply color scheme
        this.applyColorScheme();
        
        // Show personalized welcome
        this.showPersonalizedWelcome();
        
        // Customize tabs based on user experience
        this.customizeTabsForUser();
    }

    updateUserDisplay() {
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.querySelector('.user-role');
        
        if (this.userProfile.identity?.fullName) {
            userNameEl.textContent = this.userProfile.identity.fullName;
        }
        
        if (this.userProfile.identity?.experience) {
            const experience = this.userProfile.identity.experience;
            const roleMap = {
                'beginner': 'Rising Adjuster',
                'seasoned': 'Claims Specialist', 
                'master': 'Senior Claims Expert',
                'admin': 'Business Administrator'
            };
            userRoleEl.textContent = roleMap[experience] || 'Claims Professional';
        }
    }

    applyColorScheme() {
        const scheme = this.colorScheme;
        console.log('🎨 Applying color scheme:', scheme);
        
        // Remove existing scheme classes
        document.body.classList.remove('scheme-classic', 'scheme-emerald', 'scheme-platinum', 'scheme-crimson');
        
        // Apply selected scheme
        document.body.classList.add(`scheme-${scheme}`);
        
        // Update CSS custom properties if needed
        const schemeColors = {
            'classic': { primary: '#FFD700', secondary: '#FFA500' },
            'emerald': { primary: '#10B981', secondary: '#059669' },
            'platinum': { primary: '#6B7280', secondary: '#4B5563' },
            'crimson': { primary: '#EF4444', secondary: '#DC2626' }
        };
        
        if (schemeColors[scheme]) {
            const colors = schemeColors[scheme];
            document.documentElement.style.setProperty('--cipher-primary', colors.primary);
            document.documentElement.style.setProperty('--cipher-secondary', colors.secondary);
        }
    }

    showPersonalizedWelcome() {
        if (!this.userProfile.identity?.fullName) return;
        
        // Only show welcome message once per session
        const sessionKey = 'welcome_shown_' + Date.now().toString().substr(0, 8); // Today's date
        if (sessionStorage.getItem(sessionKey)) return;
        
        const name = this.userProfile.identity.fullName;
        const experience = this.userProfile.identity.experience;
        
        const welcomeMessages = {
            'beginner': `Welcome to your cipher, ${name}! Ready to level up your claims game?`,
            'seasoned': `${name}, your cipher awaits. Time to handle some serious claims.`,
            'master': `Welcome back, ${name}. The cipher recognizes a true master.`
        };
        
        const message = welcomeMessages[experience] || `Welcome to your cipher, ${name}!`;
        
        // Show as a subtle notification
        this.showNotification(message, 'welcome');
        
        // Mark as shown for this session
        sessionStorage.setItem(sessionKey, 'true');
    }

    customizeTabsForUser() {
        if (!this.userProfile.identity?.experience) return;
        
        const experience = this.userProfile.identity.experience;
        
        // Add experience indicators to tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            const tabId = btn.dataset.tab;
            
            // Add difficulty indicators
            if (experience === 'beginner' && ['total-loss', 'route-optimizer'].includes(tabId)) {
                btn.classList.add('recommended');
                btn.setAttribute('title', 'Recommended for your experience level');
            }
        });
    }

    showNotification(message, type = 'info') {
        // Don't show notification if user has seen it recently
        const notificationKey = `cipher_notification_${message.substring(0, 20).replace(/\s+/g, '_')}`;
        const lastShown = localStorage.getItem(notificationKey);
        const now = Date.now();
        
        // Only show same notification once per 10 minutes
        if (lastShown && (now - parseInt(lastShown)) < 600000) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `cipher-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🎤</span>
                <span class="notification-text">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove(); localStorage.setItem('${notificationKey}', '${now}');">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mark as shown
        localStorage.setItem(notificationKey, now.toString());
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds (shorter duration)
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    init() {
        console.log('🎛️ Master Interface Controller initializing...');
        this.loadUserProfile();
        this.setupTabNavigation();
        this.setupBillingNavigation();
        this.initializeBillingSystem();
        this.loadInitialTab();
        this.setupWorkflowConnections();
        this.setupFileUploadHandlers();
        this.personalizeInterface();
        this.initializeWorkflowRecommendations();
        this.initializeGlobalWorkflowTracker();
        this.checkPendingOnboardingEvents();
    }

    /* ================================
       BILLING SYSTEM INITIALIZATION
       ================================ */

    initializeBillingSystem() {
        console.log('💰 Initializing billing system...');
        
        try {
            // Initialize job billing service
            if (window.JobBillingService) {
                this.jobBillingService = new window.JobBillingService();
                console.log('✅ Job billing service initialized');
            }
            
            // Initialize JobsStudioController globally (needed for all pages to access job data)
            if (window.JobsStudioController && !this.jobsStudioController && !window.jobsStudio) {
                this.jobsStudioController = new window.JobsStudioController();
                window.jobsStudio = this.jobsStudioController;
                console.log('✅ Jobs Studio Controller initialized globally');
                
                // Sync existing jobs to billing system after a short delay
                setTimeout(() => {
                    if (this.jobBillingService) {
                        this.syncExistingJobs();
                    }
                }, 1000);
            }
            
            // Initialize firm configuration for post-onboarding
            if (window.FirmConfiguration && this.jobBillingService) {
                this.firmConfiguration = new window.FirmConfiguration(this.jobBillingService);
                console.log('✅ Firm configuration initialized');
            }
            
            // Initialize dashboard-specific widgets ONLY on dashboard page
            const currentPage = document.body.getAttribute('data-page');
            if (currentPage === 'dashboard') {
                // Initialize earnings summary widget for dashboard
                if (window.EarningsSummaryWidget && this.jobBillingService) {
                    setTimeout(() => {
                        this.earningsSummaryWidget = new window.EarningsSummaryWidget(
                            'earningsSummaryContainer', 
                            this.jobBillingService
                        );
                        console.log('✅ Earnings summary widget initialized');
                    }, 100);
                }
                
                // Initialize next steps widget for dashboard
                if (window.NextStepsWidget && this.jobBillingService) {
                    setTimeout(() => {
                        this.nextStepsWidget = new window.NextStepsWidget(
                            'nextStepsContainer',
                            this.jobBillingService
                        );
                        console.log('✅ Next steps widget initialized');
                    }, 150);
                }
            } else {
                console.log('📋 Dashboard widgets skipped - not on dashboard page');
            }
            
        } catch (error) {
            console.error('❌ Billing system initialization failed:', error);
        }
    }

    initializeAnalyticsTab() {
        console.log('📊 Initializing analytics tab...');
        
        try {
            // Initialize daily tally widget
            if (window.DailyTallyWidget && this.jobBillingService && !this.dailyTallyWidget) {
                this.dailyTallyWidget = new window.DailyTallyWidget(
                    'dailyTallyContainer',
                    this.jobBillingService
                );
                console.log('✅ Daily tally widget initialized');
            }
            
            // Initialize billing analytics widget
            if (window.BillingAnalyticsWidget && this.jobBillingService && !this.billingAnalyticsWidget) {
                this.billingAnalyticsWidget = new window.BillingAnalyticsWidget(
                    'billingAnalyticsContainer',
                    this.jobBillingService
                );
                console.log('✅ Billing analytics widget initialized');
            }
            
            // Initialize billing calendar widget
            if (window.BillingCalendarWidget && this.jobBillingService && !this.billingCalendarWidget) {
                this.billingCalendarWidget = new window.BillingCalendarWidget(
                    'billingCalendarContainer',
                    this.jobBillingService
                );
                console.log('✅ Billing calendar widget initialized');
            }
            
        } catch (error) {
            console.error('❌ Analytics tab initialization failed:', error);
        }
    }

    initializeFirmsTab() {
        console.log('🏢 Initializing firms tab...');
        
        try {
            this.loadBillingFirms();
            this.setupFirmsTabEvents();
            console.log('✅ Firms tab initialized');
            
        } catch (error) {
            console.error('❌ Firms tab initialization failed:', error);
        }
    }

    initializeJobsStudio() {
        console.log('💼 Initializing Jobs Studio tab...');
        
        try {
            // Initialize Jobs Studio Controller if not already initialized
            if (window.JobsStudioController && !window.jobsStudio) {
                window.jobsStudio = new window.JobsStudioController();
                console.log('✅ Jobs Studio Controller initialized');
            }
            
            // Set up job completion event listeners for billing integration
            window.addEventListener('job:completed', (event) => {
                console.log('🏆 Job completed, updating billing...');
                this.handleJobCompletion(event.detail);
            });
            
            console.log('✅ Jobs Studio tab initialized');
            
            // Sync existing completed jobs with billing system
            this.syncExistingJobs();
            
        } catch (error) {
            console.error('❌ Jobs Studio initialization failed:', error);
        }
    }

    initializeMileageCalculator() {
        console.log('🧮 Initializing Mileage Calculator tab...');
        
        try {
            // Wait a bit to ensure DOM content is fully rendered
            setTimeout(() => {
                console.log('🧮 Creating MileageCypherCalculator after DOM is ready...');
                
                // Initialize Mileage Calculator if not already initialized
                if (window.MileageCypherCalculator && !window.mileageCalculator) {
                    window.mileageCalculator = new window.MileageCypherCalculator();
                    console.log('✅ Mileage Calculator instance created');
                } else if (window.mileageCalculator) {
                    console.log('🧮 MileageCypherCalculator already exists, refreshing DOM bindings...');
                    // Refresh the existing calculator with new DOM elements
                    if (window.mileageCalculator.setupEventListeners) {
                        window.mileageCalculator.setupEventListeners();
                    }
                    if (window.mileageCalculator.loadFirmsToDropdown) {
                        window.mileageCalculator.loadFirmsToDropdown();
                    }
                    console.log('✅ MileageCypherCalculator refreshed');
                }
                
            }, 100); // Small delay to ensure HTML is rendered
            
            // Set up mileage calculation event listeners for workflow integration
            window.addEventListener('mileage:calculated', (event) => {
                console.log('🧮 Mileage calculated, storing workflow data...');
                this.workflowData.mileageData = event.detail;
            });
            
        } catch (error) {
            console.error('❌ Mileage Calculator initialization failed:', error);
        }
    }

    initializeRouteOptimizer() {
        console.log('🗺️ Initializing Route Optimizer tab...');
        
        try {
            // Wait a bit to ensure DOM content is fully rendered
            setTimeout(() => {
                console.log('🗺️ Creating RouteOptimizer after DOM is ready...');
                
                // Initialize Route Optimizer if not already initialized
                if (window.RouteOptimizer && !window.routeOptimizer) {
                    window.routeOptimizer = new window.RouteOptimizer();
                    console.log('✅ RouteOptimizer instance created');
                } else if (window.routeOptimizer) {
                    console.log('🗺️ RouteOptimizer already exists, refreshing DOM bindings...');
                    // Refresh the existing optimizer with new DOM elements
                    if (window.routeOptimizer.setupEventListeners) {
                        window.routeOptimizer.setupEventListeners();
                    }
                    console.log('✅ RouteOptimizer refreshed');
                }
                
            }, 100); // Small delay to ensure HTML is rendered
            
            // Set up route optimization event listeners for workflow integration
            window.addEventListener('route:optimized', (event) => {
                console.log('🗺️ Route optimized, storing workflow data...');
                this.workflowData.routeData = event.detail;
            });
            
            console.log('✅ Route Optimizer initialized');
            
        } catch (error) {
            console.error('❌ Route Optimizer initialization failed:', error);
        }
    }
    
    syncExistingJobs() {
        // Sync existing completed jobs from JobsStudioController to billing system
        if (window.jobsStudio && this.jobBillingService) {
            console.log('🔄 Syncing existing completed jobs...');
            
            const completedJobs = window.jobsStudio.getCompletedJobs();
            console.log(`Found ${completedJobs.length} completed jobs to sync`);
            
            completedJobs.forEach(job => {
                // Check if this job is already in billing system
                const existingJob = Array.from(this.jobBillingService.jobs.values())
                    .find(bJob => bJob.claimNumber === job.number && bJob.firmName === job.firm);
                    
                if (!existingJob) {
                    console.log(`🔄 Syncing completed job: ${job.number}`);
                    this.handleJobCompletion(job);
                } else {
                    console.log(`✅ Job ${job.number} already in billing system`);
                }
            });
        }
    }
    
    handleJobCompletion(jobData) {
        console.log(`🏆 Handling job completion:`, jobData);
        
        // 1. Add to JobBillingService for detailed tracking
        if (this.jobBillingService && jobData.firm && jobData.number) {
            try {
                // Create or update job in billing service
                const jobId = `${jobData.firm}_${jobData.number}_${Date.now()}`;
                
                // Check if firm config exists, if not create basic one
                let firmConfig = this.jobBillingService.getFirmConfig(jobData.firm);
                if (!firmConfig) {
                    console.log(`➕ Creating firm config for ${jobData.firm}`);
                    this.jobBillingService.addFirmConfig({
                        name: jobData.firm,
                        fileRate: jobData.earnings || 750,
                        mileageRate: 0.50,
                        freeMileage: 0,
                        paymentSchedule: 'bi-weekly',
                        paymentDay: 'Friday',
                        contactInfo: {}
                    });
                }
                
                // Create job in billing service
                this.jobBillingService.createJob({
                    firmName: jobData.firm,
                    claimNumber: jobData.number,
                    customerAddress: jobData.location || 'Unknown Location',
                    homeAddress: '123 Home St', // Default home address  
                    scheduledDate: new Date().toISOString(),
                    description: jobData.type || 'General Claim'
                }).then((createdJob) => {
                    // Mark as completed immediately
                    if (createdJob) {
                        createdJob.status = 'completed';
                        createdJob.completedDate = new Date().toISOString();
                        createdJob.totalJobValue = jobData.earnings || createdJob.fileRate;
                        this.jobBillingService.saveData();
                        
                        console.log(`✅ Job added to billing service: ${jobData.number}`);
                        
                        // Refresh all analytics widgets
                        this.refreshAnalyticsWidgets();
                    } else {
                        console.error('❌ Failed to create job in billing service');
                    }
                }).catch(error => {
                    console.error('❌ Error creating job in billing service:', error);
                });
                
            } catch (error) {
                console.error('❌ Error adding job to billing service:', error);
            }
        }
        
        // 2. Add to Billing Calendar
        if (this.billingCalendarWidget && this.billingCalendarWidget.dataService) {
            const billingService = this.billingCalendarWidget.dataService;
            
            if (jobData.firm && jobData.number) {
                console.log(`📅 Adding completed job to billing calendar: ${jobData.number} for ${jobData.firm}`);
                billingService.onClaimCompleted({
                    firmName: jobData.firm,
                    claimId: jobData.number,
                    completionDate: new Date().toISOString()
                });
                
                // Refresh calendar display
                if (this.billingCalendarWidget.refreshData) {
                    this.billingCalendarWidget.refreshData();
                }
            }
        }
    }
    
    refreshAnalyticsWidgets() {
        console.log('🔄 Refreshing analytics widgets...');
        
        // Refresh Daily Tally Widget
        if (this.dailyTallyWidget && this.dailyTallyWidget.render) {
            this.dailyTallyWidget.render();
            console.log('✅ Daily tally refreshed');
        }
        
        // Refresh Billing Analytics Widget
        if (this.billingAnalyticsWidget && this.billingAnalyticsWidget.refreshData) {
            this.billingAnalyticsWidget.refreshData();
            console.log('✅ Billing analytics refreshed');
        }
        
        // Refresh Earnings Summary (if on dashboard)
        if (window.earningsSummaryWidget && window.earningsSummaryWidget.refreshData) {
            window.earningsSummaryWidget.refreshData();
            console.log('✅ Earnings summary refreshed');
        }
        
        // Fire custom event for other widgets to listen
        window.dispatchEvent(new CustomEvent('analytics:refresh', {
            detail: { source: 'job-completion' }
        }));
    }
    
    refreshJobsDisplay() {
        console.log('🔄 Refreshing Jobs display...');
        
        // Refresh Jobs tab if jobsStudio is available
        if (window.jobsStudio && window.jobsStudio.renderJobs) {
            try {
                console.log('🔄 Jobs before refresh:', {
                    totalJobs: window.jobsStudio.jobs?.length || 0,
                    activeJobs: window.jobsStudio.activeJobs?.length || 0,
                    completedJobs: window.jobsStudio.completedJobs?.length || 0
                });
                
                window.jobsStudio.renderJobs();
                console.log('✅ Jobs display refreshed successfully');
            } catch (error) {
                console.error('❌ Error refreshing jobs display:', error);
            }
        } else {
            console.warn('⚠️ window.jobsStudio or renderJobs not available');
            console.log('🔍 Available jobsStudio methods:', window.jobsStudio ? Object.keys(window.jobsStudio) : 'jobsStudio not found');
            
            // Try to initialize JobsStudio if it's not available
            if (window.JobsStudioController && !window.jobsStudio) {
                console.log('🔄 Initializing JobsStudio controller...');
                try {
                    window.jobsStudio = new window.JobsStudioController();
                    console.log('✅ JobsStudio controller initialized');
                    // Now try to render jobs
                    if (window.jobsStudio.renderJobs) {
                        window.jobsStudio.renderJobs();
                        console.log('✅ Jobs rendered after initialization');
                    }
                } catch (error) {
                    console.error('❌ Failed to initialize JobsStudio:', error);
                }
            } else {
                // Fallback: Try to display jobs directly from JobBillingService
                console.log('🔄 Attempting to display jobs directly from JobBillingService...');
                this.displayJobsFromBillingService();
            }
        }
        
        // Also check JobBillingService jobs
        if (this.jobBillingService) {
            const billingJobs = Array.from(this.jobBillingService.jobs?.values() || []);
            console.log('🔄 JobBillingService jobs:', {
                totalJobs: billingJobs.length,
                activeJobs: billingJobs.filter(job => job.status === 'active').length,
                jobIds: billingJobs.map(job => job.claimNumber)
            });
        }
        
        // Also refresh analytics widgets as they may show job data
        this.refreshAnalyticsWidgets();
        
        console.log('🔄 Jobs display refresh completed');
    }
    
    displayJobsFromBillingService() {
        // Fallback method to display jobs directly from JobBillingService
        const activeJobsList = document.getElementById('activeJobsList');
        
        if (!activeJobsList || !this.jobBillingService) {
            console.log('⚠️ Cannot display jobs - missing activeJobsList container or jobBillingService');
            return;
        }
        
        const allJobs = Array.from(this.jobBillingService.jobs.values());
        const activeJobs = allJobs.filter(job => job.status === 'active');
        
        console.log('🔄 Displaying jobs directly:', {
            totalJobs: allJobs.length,
            activeJobs: activeJobs.length
        });
        
        if (activeJobs.length === 0) {
            activeJobsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💼</div>
                    <h4>No Active Jobs</h4>
                    <p>Create jobs from the Mileage Calculator to see them here</p>
                </div>
            `;
            return;
        }
        
        const jobsHTML = activeJobs.map(job => `
            <div class="job-card" data-job-id="${job.jobId}">
                <div class="job-header">
                    <h4>${job.claimNumber}</h4>
                    <span class="job-firm">${job.firmName}</span>
                </div>
                <div class="job-details">
                    <div class="job-amount">$${job.totalJobValue || job.mileageAmount || 0}</div>
                    <div class="job-address">${job.customerAddress}</div>
                </div>
                <div class="job-meta">
                    <span class="job-type">${job.description || 'Mileage Calculation'}</span>
                    <span class="job-date">${new Date(job.createdDate).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
        
        activeJobsList.innerHTML = jobsHTML;
        console.log('✅ Jobs displayed successfully from JobBillingService');
    }

    loadBillingFirms() {
        if (!this.jobBillingService) return;
        
        const container = document.getElementById('billingFirmsContainer');
        if (!container) return;
        
        const firmConfigs = this.jobBillingService.getAllFirmConfigs();
        
        if (firmConfigs.length === 0) {
            container.innerHTML = `
                <div class="empty-billing-firms">
                    <div class="empty-icon">💰</div>
                    <h4>No Billing Firms Configured</h4>
                    <p>Add your first billing firm to start tracking earnings</p>
                    <button class="cipher-btn cipher-btn--primary" data-action="add-billing-firm">
                        Add Your First Firm
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="billing-firms-grid">
                ${firmConfigs.map(firm => `
                    <div class="billing-firm-card">
                        <div class="firm-header">
                            <h4 class="firm-name">${firm.name}</h4>
                            <span class="payment-schedule">${this.formatPaymentSchedule(firm.paymentSchedule)}</span>
                        </div>
                        
                        <div class="firm-rates">
                            <div class="rate-item">
                                <span class="rate-label">File Rate</span>
                                <span class="rate-value">$${firm.fileRate}</span>
                            </div>
                            <div class="rate-item">
                                <span class="rate-label">Mileage</span>
                                <span class="rate-value">$${firm.mileageRate}/mi after ${firm.freeMileage}mi</span>
                            </div>
                            ${firm.timeExpenseRate > 0 ? `
                                <div class="rate-item">
                                    <span class="rate-label">Time/Expense</span>
                                    <span class="rate-value">$${firm.timeExpenseRate}/hr</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="firm-actions">
                            <button class="action-btn" data-action="edit-firm" data-firm="${firm.name}">✏️ Edit</button>
                            <button class="action-btn" data-action="view-billing" data-firm="${firm.name}">📊 View Billing</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupFirmsTabEvents() {
        // Add billing firm button
        const addBillingFirmBtn = document.getElementById('addBillingFirmBtn');
        if (addBillingFirmBtn) {
            addBillingFirmBtn.addEventListener('click', () => {
                this.showFirmConfiguration();
            });
        }
        
        // Billing firms container events
        const billingContainer = document.getElementById('billingFirmsContainer');
        if (billingContainer) {
            billingContainer.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const firmName = e.target.dataset.firm;
                
                switch (action) {
                    case 'add-billing-firm':
                        this.showFirmConfiguration();
                        break;
                    case 'edit-firm':
                        this.editFirmConfiguration(firmName);
                        break;
                    case 'view-billing':
                        this.viewFirmBilling(firmName);
                        break;
                }
            });
        }
    }

    showFirmConfiguration() {
        if (this.firmConfiguration) {
            this.firmConfiguration.showFirmSetup();
        }
    }

    editFirmConfiguration(firmName) {
        console.log('✏️ Editing firm configuration:', firmName);
        // This would open the firm configuration with pre-filled data
        this.showFirmConfiguration();
    }

    viewFirmBilling(firmName) {
        console.log('📊 Viewing billing for firm:', firmName);
        // Switch to analytics tab and filter by firm
        this.switchTab('analytics');
        
        // After tab loads, set firm filter
        setTimeout(() => {
            if (this.billingAnalyticsWidget) {
                // This would be a method to filter analytics by firm
                // this.billingAnalyticsWidget.filterByFirm(firmName);
            }
        }, 300);
    }

    formatPaymentSchedule(schedule) {
        const schedules = {
            'weekly': 'Weekly',
            'bi-weekly': 'Bi-weekly',
            'monthly': 'Monthly'
        };
        return schedules[schedule] || schedule;
    }

    setupBillingNavigation() {
        // Listen for navigation events from billing widgets
        window.addEventListener('dashboard:navigate', (event) => {
            const { tab, source } = event.detail;
            
            if (tab === 'analytics' && source === 'earnings-summary') {
                this.switchTab('analytics');
            }
        });

        // Listen for firm configuration events
        window.addEventListener('firms:configured', (event) => {
            // Refresh firms tab if it's loaded
            if (this.loadedTabs.has('firms-directory')) {
                this.loadBillingFirms();
            }
            
            // Refresh earnings summary
            if (this.earningsSummaryWidget) {
                this.earningsSummaryWidget.refresh();
            }
            
            // Refresh next steps
            if (this.nextStepsWidget) {
                this.nextStepsWidget.refresh();
            }
        });

        // Listen for job completion events
        window.addEventListener('job:completed', (event) => {
            // Refresh all billing widgets
            if (this.earningsSummaryWidget) {
                this.earningsSummaryWidget.refresh();
            }
            
            if (this.nextStepsWidget) {
                this.nextStepsWidget.refresh();
            }
            
            if (this.dailyTallyWidget) {
                this.dailyTallyWidget.refresh();
            }
        });

        // Listen for day finalization events
        window.addEventListener('day:finalized', (event) => {
            // Refresh all billing widgets
            if (this.earningsSummaryWidget) {
                this.earningsSummaryWidget.refresh();
            }
            
            if (this.billingAnalyticsWidget) {
                this.billingAnalyticsWidget.refreshContent();
            }
            
            if (this.billingCalendarWidget) {
                this.billingCalendarWidget.updateData();
            }
        });
    }

    checkPendingOnboardingEvents() {
        // Check if there are pending onboarding events to process
        const pendingEvents = localStorage.getItem('pendingOnboardingEvents');
        
        if (pendingEvents) {
            try {
                const onboardingData = JSON.parse(pendingEvents);
                console.log('🎤 Processing pending onboarding events:', onboardingData);
                
                // Clear the pending events
                localStorage.removeItem('pendingOnboardingEvents');
                
                // Trigger post-onboarding setup after a delay to ensure everything is loaded
                setTimeout(() => {
                    this.triggerPostOnboardingSetup(onboardingData);
                }, 1000);
                
            } catch (error) {
                console.error('❌ Failed to process pending onboarding events:', error);
                localStorage.removeItem('pendingOnboardingEvents'); // Clear invalid data
            }
        }
    }

    triggerPostOnboardingSetup(onboardingData) {
        // Emit the onboarding completed event for firm configuration
        window.dispatchEvent(new CustomEvent('onboarding:completed', {
            detail: onboardingData
        }));
        
        console.log('✅ Post-onboarding setup triggered');
    }

    /* ================================
       SMART WORKFLOW RECOMMENDATIONS
       ================================ */

    initializeWorkflowRecommendations() {
        console.log('🧠 Initializing smart workflow recommendations...');
        
        // Load previous analytics
        this.loadWorkflowAnalytics();
        
        // Generate initial recommendations
        this.generateRecommendations();
        
        // Display recommendation panel
        this.displayRecommendationPanel();
        
        // Track tab usage
        this.setupWorkflowTracking();
    }

    loadWorkflowAnalytics() {
        const savedAnalytics = localStorage.getItem('workflowAnalytics');
        if (savedAnalytics) {
            try {
                const analytics = JSON.parse(savedAnalytics);
                this.workflowAnalytics = { ...this.workflowAnalytics, ...analytics };
                console.log('📊 Workflow analytics loaded:', this.workflowAnalytics);
            } catch (error) {
                console.warn('⚠️ Failed to load analytics:', error);
            }
        }
    }

    generateRecommendations() {
        console.log('🎯 Generating smart recommendations...');
        
        const recommendations = [];
        
        // Experience-based recommendations
        if (this.userProfile?.identity?.experience) {
            recommendations.push(...this.getExperienceRecommendations());
        }
        
        // Territory-based recommendations
        if (this.userProfile?.territory?.territoryType) {
            recommendations.push(...this.getTerritoryRecommendations());
        }
        
        // Usage pattern recommendations
        recommendations.push(...this.getUsagePatternRecommendations());
        
        // Time-based recommendations
        recommendations.push(...this.getTimeBasedRecommendations());
        
        // Add fallback recommendations for unused tabs
        recommendations.push(...this.getFallbackRecommendations());
        
        // Remove duplicates by action, keep highest priority
        const uniqueRecommendations = recommendations.reduce((acc, rec) => {
            const existing = acc.find(r => r.action === rec.action);
            if (!existing || rec.priority > existing.priority) {
                acc = acc.filter(r => r.action !== rec.action);
                acc.push(rec);
            }
            return acc;
        }, []);
        
        // Sort by priority and limit to top 3
        this.workflowAnalytics.recommendations = uniqueRecommendations
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 3);
        
        console.log('✅ Generated recommendations:', this.workflowAnalytics.recommendations);
    }

    getExperienceRecommendations() {
        const experience = this.userProfile.identity.experience;
        const recommendations = [];
        
        switch (experience) {
            case 'beginner':
                recommendations.push({
                    id: 'beginner-total-loss',
                    title: 'Start with Total Loss Processing',
                    description: 'Perfect for learning the fundamentals of claims processing',
                    action: 'total-loss',
                    icon: '📋',
                    priority: 90,
                    category: 'learning'
                });
                recommendations.push({
                    id: 'beginner-help',
                    title: 'Check Out Training Resources',
                    description: 'Boost your skills with our comprehensive help center',
                    action: 'help-center',
                    icon: '📚',
                    priority: 85,
                    category: 'education'
                });
                break;
                
            case 'seasoned':
                recommendations.push({
                    id: 'seasoned-route-optimization',
                    title: 'Optimize Your Routes',
                    description: 'Save time and fuel with intelligent route planning',
                    action: 'route-optimizer',
                    icon: '🗺️',
                    priority: 88,
                    category: 'efficiency'
                });
                recommendations.push({
                    id: 'seasoned-jobs-management',
                    title: 'Manage Your Job Pipeline',
                    description: 'Keep track of all your active claims and assignments',
                    action: 'jobs-studio',
                    icon: '💼',
                    priority: 82,
                    category: 'productivity'
                });
                break;
                
            case 'master':
                recommendations.push({
                    id: 'master-advanced-workflows',
                    title: 'Set Up Advanced Workflows',
                    description: 'Create custom automation for complex claim types',
                    action: 'total-loss',
                    icon: '⚡',
                    priority: 95,
                    category: 'advanced'
                });
                recommendations.push({
                    id: 'master-firm-network',
                    title: 'Expand Your Network',
                    description: 'Connect with high-value firms in your area',
                    action: 'firms-directory',
                    icon: '🏢',
                    priority: 87,
                    category: 'business'
                });
                break;
                
            case 'admin':
                recommendations.push({
                    id: 'admin-schedule-management',
                    title: 'Organize Appointments',
                    description: 'Efficiently schedule and coordinate adjuster appointments',
                    action: 'jobs-studio',
                    icon: '📅',
                    priority: 92,
                    category: 'administration'
                });
                recommendations.push({
                    id: 'admin-billing-tracking',
                    title: 'Track Billing & Expenses',
                    description: 'Monitor mileage, hours, and reimbursements for accurate billing',
                    action: 'mileage-calculator',
                    icon: '💰',
                    priority: 89,
                    category: 'financial'
                });
                recommendations.push({
                    id: 'admin-route-coordination',
                    title: 'Coordinate Travel Routes',
                    description: 'Plan efficient routes to minimize travel time and costs',
                    action: 'route-optimizer',
                    icon: '🗺️',
                    priority: 85,
                    category: 'coordination'
                });
                break;
        }
        
        return recommendations;
    }

    getTerritoryRecommendations() {
        const territoryType = this.userProfile.territory.territoryType;
        const recommendations = [];
        
        if (territoryType === 'rural') {
            recommendations.push({
                id: 'rural-mileage',
                title: 'Track Your Mileage',
                description: 'Rural territories = higher mileage. Maximize your reimbursements',
                action: 'mileage-calculator',
                icon: '🧮',
                priority: 85,
                category: 'financial'
            });
        } else if (territoryType === 'urban') {
            recommendations.push({
                id: 'urban-routing',
                title: 'Beat Traffic with Smart Routes',
                description: 'Urban traffic is brutal. Let AI find the fastest paths',
                action: 'route-optimizer',
                icon: '🚗',
                priority: 88,
                category: 'efficiency'
            });
        }
        
        return recommendations;
    }

    getUsagePatternRecommendations() {
        const recommendations = [];
        const now = new Date();
        const hour = now.getHours();
        
        // Check if user hasn't used certain tabs
        const tabUsage = this.workflowAnalytics.tabUsage;
        
        if (!tabUsage['total-loss'] || tabUsage['total-loss'] < 2) {
            recommendations.push({
                id: 'unused-total-loss',
                title: 'Try Total Loss Processing',
                description: 'Our most popular feature - complete claim packages in minutes',
                action: 'total-loss',
                icon: '🎯',
                priority: 75,
                category: 'feature-discovery'
            });
        }
        
        if (!tabUsage['route-optimizer'] && (tabUsage['total-loss'] || 0) > 3) {
            recommendations.push({
                id: 'workflow-route',
                title: 'Add Route Planning',
                description: 'You\'re processing claims - now optimize your travel time!',
                action: 'route-optimizer',
                icon: '🔄',
                priority: 80,
                category: 'workflow-enhancement'
            });
        }
        
        return recommendations;
    }

    getTimeBasedRecommendations() {
        const recommendations = [];
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        // Morning recommendations (7-11 AM)
        if (hour >= 7 && hour <= 11) {
            recommendations.push({
                id: 'morning-planning',
                title: 'Plan Your Day',
                description: 'Start strong by organizing your route and job schedule',
                action: 'route-optimizer',
                icon: '🌅',
                priority: 70,
                category: 'daily-workflow'
            });
        }
        
        // End of day (4-7 PM)
        if (hour >= 16 && hour <= 19) {
            recommendations.push({
                id: 'end-of-day',
                title: 'Wrap Up Your Claims',
                description: 'Finish strong - complete any pending documentation',
                action: 'total-loss',
                icon: '🌇',
                priority: 68,
                category: 'daily-workflow'
            });
        }
        
        // Monday motivation
        if (dayOfWeek === 1) {
            recommendations.push({
                id: 'monday-momentum',
                title: 'Start the Week Strong',
                description: 'Review your network and set up new connections',
                action: 'firms-directory',
                icon: '💪',
                priority: 65,
                category: 'motivation'
            });
        }
        
        return recommendations;
    }

    getFallbackRecommendations() {
        const allTabs = ['total-loss', 'route-optimizer', 'mileage-calculator', 'jobs-studio', 'firms-directory', 'help-center'];
        const tabUsage = this.workflowAnalytics.tabUsage;
        const recommendations = [];
        
        // Create fallback recommendations for unused tabs
        const fallbackMap = {
            'total-loss': {
                title: 'Process Total Loss Claims',
                description: 'Upload CCC estimates and generate complete claim packages',
                icon: '📋',
                priority: 50,
                category: 'core-feature'
            },
            'route-optimizer': {
                title: 'Optimize Your Routes',
                description: 'Plan efficient routes to save time and fuel costs',
                icon: '🗺️',
                priority: 45,
                category: 'efficiency'
            },
            'mileage-calculator': {
                title: 'Calculate Mileage',
                description: 'Track and calculate mileage for accurate reimbursements',
                icon: '🧮',
                priority: 40,
                category: 'financial'
            },
            'jobs-studio': {
                title: 'Manage Your Jobs',
                description: 'Organize and track all your active assignments',
                icon: '💼',
                priority: 35,
                category: 'organization'
            },
            'firms-directory': {
                title: 'Explore Firm Network',
                description: 'Connect with insurance firms and expand your network',
                icon: '🏢',
                priority: 30,
                category: 'networking'
            },
            'help-center': {
                title: 'Access Help Resources',
                description: 'Learn new skills and get support when you need it',
                icon: '📚',
                priority: 25,
                category: 'support'
            }
        };
        
        // Only add fallbacks for tabs that haven't been used much
        allTabs.forEach(tab => {
            const usage = tabUsage[tab] || 0;
            if (usage < 2 && fallbackMap[tab]) { // Haven't used this tab much
                recommendations.push({
                    id: `fallback-${tab}`,
                    action: tab,
                    ...fallbackMap[tab]
                });
            }
        });
        
        return recommendations;
    }

    displayRecommendationPanel() {
        if (this.workflowAnalytics.recommendations.length === 0) return;
        
        // Only show recommendations on dashboard page
        const currentPage = document.body.getAttribute('data-page');
        if (currentPage === 'dashboard') {
            const dashboardContainer = document.getElementById('dashboardRecommendations');
            if (dashboardContainer) {
                this.displayDashboardRecommendations(dashboardContainer);
            }
        }
        // Remove floating recommendations from non-dashboard pages
    }

    displayDashboardRecommendations(container) {
        container.innerHTML = `
            <div class="dashboard-recommendations-header">
                <h3>🧠 Smart Recommendations</h3>
                <p>Personalized suggestions based on your workflow</p>
            </div>
            <div class="dashboard-recommendations-grid">
                ${this.workflowAnalytics.recommendations.map((rec, index) => `
                    <div class="dashboard-recommendation-card ${rec.category}" data-action="${rec.action}" style="--card-index: ${index}">
                        <div class="recommendation-icon">${rec.icon}</div>
                        <div class="recommendation-content">
                            <h4>${rec.title}</h4>
                            <p>${rec.description}</p>
                            <button class="recommendation-btn cipher-btn cipher-btn--primary" onclick="window.masterInterface.followRecommendation('${rec.id}', '${rec.action}')">
                                ${this.getActionButtonText(rec.action)}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayFloatingRecommendations() {
        // Create floating panel for non-dashboard tabs
        const panel = document.createElement('div');
        panel.className = 'workflow-recommendations';
        panel.innerHTML = `
            <div class="recommendations-header">
                <div class="recommendations-title">
                    <span class="recommendations-icon">🧠</span>
                    <h3>Smart Recommendations</h3>
                </div>
                <button class="recommendations-close" onclick="this.closest('.workflow-recommendations').style.display='none'">×</button>
            </div>
            <div class="recommendations-content">
                ${this.workflowAnalytics.recommendations.map((rec, index) => `
                    <div class="recommendation-card ${rec.category}" data-action="${rec.action}" style="--card-index: ${index}">
                        <div class="recommendation-icon">${rec.icon}</div>
                        <div class="recommendation-content">
                            <h4>${rec.title}</h4>
                            <p>${rec.description}</p>
                            <button class="recommendation-btn cipher-btn cipher-btn--primary" onclick="window.masterInterface.followRecommendation('${rec.id}', '${rec.action}')">
                                ${this.getActionButtonText(rec.action)}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Insert after header
        const header = document.querySelector('.cipher-header');
        header.insertAdjacentElement('afterend', panel);
        
        // Animate in
        setTimeout(() => panel.classList.add('show'), 100);
    }

    getActionButtonText(action) {
        const buttonTexts = {
            'total-loss': 'Process Claims',
            'route-optimizer': 'Plan Routes',
            'mileage-calculator': 'Track Mileage',
            'jobs-studio': 'Manage Jobs',
            'firms-directory': 'Explore Network',
            'help-center': 'Learn More'
        };
        return buttonTexts[action] || 'Take Action';
    }

    followRecommendation(recommendationId, action) {
        console.log(`🎯 Following recommendation: ${recommendationId} → ${action}`);
        
        // Track the recommendation follow
        this.trackRecommendationFollow(recommendationId);
        
        // Switch to the recommended tab
        this.switchTab(action);
        
        // Hide recommendations panel
        const panel = document.querySelector('.workflow-recommendations');
        if (panel) {
            panel.style.display = 'none';
        }
        
        // Show success notification
        this.showNotification(`Great choice! ${this.getActionButtonText(action)} can really boost your productivity.`, 'success');
    }

    setupWorkflowTracking() {
        // Track tab switches with timestamps
        const originalSwitchTab = this.switchTab.bind(this);
        this.switchTab = (tabId) => {
            this.trackTabUsage(tabId);
            return originalSwitchTab(tabId);
        };
        
        // Track time spent on each tab
        setInterval(() => {
            this.saveWorkflowAnalytics();
        }, 30000); // Save every 30 seconds
    }

    trackTabUsage(tabId) {
        const usage = this.workflowAnalytics.tabUsage[tabId] || 0;
        this.workflowAnalytics.tabUsage[tabId] = usage + 1;
        
        console.log(`📊 Tab usage tracked: ${tabId} (${usage + 1} times)`);
        
        // Regenerate recommendations based on new usage
        setTimeout(() => this.generateRecommendations(), 1000);
    }

    trackRecommendationFollow(recommendationId) {
        const followedRecommendations = this.workflowAnalytics.followedRecommendations || [];
        followedRecommendations.push({
            id: recommendationId,
            timestamp: Date.now()
        });
        this.workflowAnalytics.followedRecommendations = followedRecommendations;
    }

    saveWorkflowAnalytics() {
        try {
            localStorage.setItem('workflowAnalytics', JSON.stringify(this.workflowAnalytics));
        } catch (error) {
            console.warn('⚠️ Failed to save analytics:', error);
        }
    }

    /* ================================
       TAB NAVIGATION SYSTEM
       ================================ */

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        if (tabBtns.length > 0) {
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabId = btn.dataset.tab;
                    this.switchTab(tabId);
                });
            });
            console.log(`🔗 Tab navigation setup for ${tabBtns.length} tabs`);
        } else {
            console.log('📄 No tab buttons found, skipping tab navigation setup');
        }
    }

    async switchTab(tabId) {
        console.log(`🔄 Switching to tab: ${tabId}`);
        
        // Update active tab button (only if elements exist)
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons.length > 0) {
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            const targetButton = document.querySelector(`[data-tab="${tabId}"]`);
            if (targetButton) {
                targetButton.classList.add('active');
            }
        }
        
        // Update active tab content (only if elements exist)
        const tabContents = document.querySelectorAll('.tab-content');
        if (tabContents.length > 0) {
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            const targetContent = document.getElementById(`${tabId}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        }
        
        // Load tab content if not already loaded
        if (!this.loadedTabs.has(tabId)) {
            await this.loadTabContent(tabId);
            this.loadedTabs.add(tabId);
        }
        
        this.currentTab = tabId;
        this.onTabSwitch(tabId);
    }

    async loadTabContent(tabId) {
        const container = document.getElementById(`${tabId}-tab`);
        const loadingPlaceholder = container.querySelector('.loading-placeholder');
        
        try {
            switch (tabId) {
                case 'route-optimizer':
                    await this.loadRouteOptimizer(container);
                    break;
                case 'mileage-calculator':
                    await this.loadMileageCalculator(container);
                    break;
                case 'jobs-studio':
                    await this.loadJobsStudio(container);
                    break;
                case 'analytics':
                    await this.loadAnalyticsTab(container);
                    break;
                case 'firms-directory':
                    await this.loadFirmsDirectory(container);
                    break;
                case 'help-center':
                    await this.loadHelpCenter(container);
                    break;
                default:
                    console.log(`Tab ${tabId} content already loaded`);
            }
            
            if (loadingPlaceholder) {
                loadingPlaceholder.style.display = 'none';
            }
            
        } catch (error) {
            console.error(`Failed to load ${tabId}:`, error);
            this.showTabError(container, error);
        }
    }

    loadInitialTab() {
        // Only load initial tab on master tabbed interface
        const hasTabContent = document.querySelectorAll('.tab-content').length > 0;
        if (hasTabContent) {
            // Start with total loss tab
            this.switchTab('total-loss');
        } else {
            console.log('📄 Individual page detected, skipping initial tab load');
        }
    }

    activateTab(tabId) {
        // Method for individual pages to activate their specific tab
        console.log(`🎯 Activating tab: ${tabId} for individual page`);
        
        // Set current tab
        this.currentTab = tabId;
        
        // Update navigation if elements exist
        const navButtons = document.querySelectorAll('.tab-btn, .master-tabs a');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            // Check both data-tab and data-page attributes
            if (btn.dataset.tab === tabId || btn.dataset.page === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Call tab-specific initialization
        this.onTabSwitch(tabId);
        
        console.log(`✅ Tab ${tabId} activated successfully`);
    }

    onTabSwitch(tabId) {
        // Handle tab-specific initialization
        switch (tabId) {
            case 'route-optimizer':
                this.initializeRouteOptimizer();
                break;
            case 'mileage-calculator':
                this.initializeMileageCalculator();
                break;
            case 'jobs-studio':
                this.initializeJobsStudio();
                break;
            case 'analytics':
                this.initializeAnalyticsTab();
                break;
            case 'firms-directory':
                this.initializeFirmsTab();
                break;
        }
    }

    /* ================================
       CONTENT LOADERS
       ================================ */

    async loadAnalyticsTab(container) {
        console.log('📊 Loading Analytics tab...');
        
        // Analytics tab content is already in HTML, just initialize widgets
        this.initializeAnalyticsTab();
        
        return Promise.resolve();
    }

    async loadRouteOptimizer(container) {
        console.log('🗺️ Loading Route Optimizer...');
        
        // Load route optimizer styles
        await this.loadCSS('styles/route-cypher-layout.css');
        
        // Load route optimizer scripts
        await this.loadJS('scripts/route-optimizer.js');
        await this.loadJS('scripts/enhanced-route-optimizer.js');
        
        // Get route optimizer container
        const optimizerContainer = container.querySelector('.route-optimizer-container');
        
        if (optimizerContainer) {
            // Load route optimizer HTML content
            optimizerContainer.innerHTML = await this.fetchRouteOptimizerHTML();
            
            // Initialize Route Optimizer AFTER HTML is loaded
            setTimeout(() => {
                this.initializeRouteOptimizer();
            }, 100);
        } else {
            console.error('🗺️ Route optimizer container not found!');
        }
    }

    async loadMileageCalculator(container) {
        console.log('🧮 Loading Mileage Calculator...');
        
        // Load mileage calculator styles
        await this.loadCSS('styles/professional-calculator.css');
        
        // Load mileage calculator script
        await this.loadJS('scripts/mileage-cypher-combined.js');
        
        // Get mileage container
        const mileageContainer = container.querySelector('.mileage-calculator-container');
        
        // Load mileage calculator HTML content
        mileageContainer.innerHTML = await this.fetchMileageCalculatorHTML();
    }

    async loadJobsStudio(container) {
        console.log('💼 Loading Jobs Studio...');
        
        // Load jobs studio script
        await this.loadJS('scripts/jobs-studio.js');
        
        // Get jobs container
        const jobsContainer = container.querySelector('.jobs-studio-container');
        
        // Load jobs studio HTML content
        jobsContainer.innerHTML = await this.fetchJobsStudioHTML();
    }

    async loadFirmsDirectory(container) {
        console.log('🏢 Loading Firms Directory...');
        
        // Initialize firms directory content
        const hiringFirmsGrid = container.querySelector('#hiringFirmsGrid');
        const clientCatalogGrid = container.querySelector('#clientCatalogGrid');
        
        hiringFirmsGrid.innerHTML = this.generateHiringFirmsContent();
        clientCatalogGrid.innerHTML = this.generateClientCatalogContent();
    }

    async loadHelpCenter(container) {
        console.log('📚 Help Center already loaded');
        // Help center content is static in HTML
    }

    /* ================================
       WORKFLOW CONNECTIONS
       ================================ */

    setupWorkflowConnections() {
        // Setup intelligent connections between workflows
        this.setupFileUploadTriggers();
        this.setupCrossTabDataSharing();
    }

    setupFileUploadHandlers() {
        const fileInput = document.getElementById('pdfFileInput');
        const uploadZone = document.getElementById('uploadZone');
        
        if (fileInput && uploadZone) {
            // File input change handler
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
            
            // Drag and drop handlers
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });
            
            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('drag-over');
            });
            
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type === 'application/pdf') {
                    this.handleFileUpload(files[0]);
                }
            });
        }
    }

    setupFileUploadTriggers() {
        // Any file upload triggers total loss workflow
        document.addEventListener('fileUploaded', (e) => {
            console.log('📄 File uploaded, triggering total loss workflow...');
            this.triggerTotalLossWorkflow(e.detail.file);
        });
    }

    setupCrossTabDataSharing() {
        // Listen for data sharing events between tabs
        document.addEventListener('routeOptimized', (e) => {
            this.workflowData.routeData = e.detail;
            this.showCrossTabNotification('Route optimized! Ready to export to Mileage Calculator.');
        });
        
        document.addEventListener('mileageCalculated', (e) => {
            this.workflowData.mileageData = e.detail;
        });
    }

    /* ================================
       WORKFLOW TRIGGERS
       ================================ */

    handleFileUpload(file) {
        console.log(`📤 Handling file upload: ${file.name}`);
        
        // Show workflow progress
        const workflowProgress = document.getElementById('workflowProgress');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (workflowProgress) {
            workflowProgress.style.display = 'flex';
            this.animateWorkflowProgress();
        }
        
        // Trigger total loss processing
        this.processTotalLossFile(file);
    }

    async processTotalLossFile(file) {
        try {
            // Step 1: Extract data
            this.updateWorkflowStep(1, 'active');
            const extractedData = await this.extractDataFromPDF(file);
            this.updateWorkflowStep(1, 'completed');
            
            // Step 2: Generate BCIF
            this.updateWorkflowStep(2, 'active');
            const bcifForm = await this.generateBCIFForm(extractedData);
            this.updateWorkflowStep(2, 'completed');
            
            // Step 3: Vehicle Valuation
            this.updateWorkflowStep(3, 'active');
            const valuation = await this.performVehicleValuation(extractedData);
            this.updateWorkflowStep(3, 'completed');
            
            // Step 4: Complete Package
            this.updateWorkflowStep(4, 'active');
            const completePackage = await this.generateCompletePackage({
                extractedData,
                bcifForm,
                valuation
            });
            this.updateWorkflowStep(4, 'completed');
            
            // Show results
            this.displayTotalLossResults(completePackage);
            
        } catch (error) {
            console.error('❌ Total loss processing failed:', error);
            this.showWorkflowError(error);
        }
    }

    triggerTotalLossWorkflow(file) {
        // Switch to total loss tab and process file
        this.switchTab('total-loss');
        setTimeout(() => {
            this.handleFileUpload(file);
        }, 500);
    }

    /* ================================
       CROSS-TAB FUNCTIONS
       ================================ */

    exportToMileage() {
        if (!this.workflowData.routeData) {
            alert('Please optimize a route first in the Route Optimizer tab.');
            return;
        }
        
        console.log('🧮 Exporting route data to Mileage Calculator...');
        
        // Switch to mileage tab
        this.switchTab('mileage-calculator');
        
        // Pass route data to mileage calculator
        setTimeout(() => {
            if (window.mileageCalculator && this.workflowData.routeData) {
                window.mileageCalculator.importRouteData(this.workflowData.routeData);
                this.showSuccessNotification('Route data imported to Mileage Calculator!');
            }
        }, 1000);
    }

    importFromRoute() {
        if (!this.workflowData.routeData) {
            this.showInfoNotification('No route data available. Please optimize a route first.');
            this.switchTab('route-optimizer');
            return;
        }
        
        console.log('🗺️ Importing route data to current mileage calculation...');
        
        if (window.mileageCalculator) {
            window.mileageCalculator.importRouteData(this.workflowData.routeData);
            this.showSuccessNotification('Route data imported successfully!');
        }
    }

    syncMobileJobs() {
        console.log('📱 Syncing mobile jobs...');
        
        // Trigger mobile sync
        if (window.jobsStudio) {
            window.jobsStudio.syncMobileJobs();
        }
        
        this.showSuccessNotification('Mobile jobs sync initiated!');
    }

    addFirm() {
        console.log('🏢 Adding new firm...');
        this.showFirmModal();
    }

    /* ================================
       UI HELPERS
       ================================ */

    updateWorkflowStep(stepNumber, status) {
        const step = document.getElementById(`step${stepNumber}`);
        if (step) {
            step.className = `progress-step ${status}`;
        }
    }

    animateWorkflowProgress() {
        // Add animation to workflow progress
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
            setTimeout(() => {
                step.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    step.style.transform = 'scale(1)';
                }, 200);
            }, index * 100);
        });
    }

    displayTotalLossResults(packageData) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = this.generateResultsHTML(packageData);
        }
    }

    generateResultsHTML(packageData) {
        return `
            <div class="results-panel cipher-glass">
                <h3>✅ Total Loss Package Complete</h3>
                <div class="package-summary">
                    <div class="package-item">
                        <span class="item-icon">📄</span>
                        <span class="item-name">BCIF Form</span>
                        <button class="cipher-btn cipher-btn--sm">Download</button>
                    </div>
                    <div class="package-item">
                        <span class="item-icon">📊</span>
                        <span class="item-name">Claim Summary</span>
                        <button class="cipher-btn cipher-btn--sm">Download</button>
                    </div>
                    <div class="package-item">
                        <span class="item-icon">💰</span>
                        <span class="item-name">Valuation Report</span>
                        <button class="cipher-btn cipher-btn--sm">Download</button>
                    </div>
                    <div class="package-item">
                        <span class="item-icon">🚗</span>
                        <span class="item-name">Comparables Analysis</span>
                        <button class="cipher-btn cipher-btn--sm">Download</button>
                    </div>
                </div>
                <div class="package-actions">
                    <button class="cipher-btn cipher-btn--success" onclick="window.masterInterface.downloadCompletePackage()">
                        📥 Download Complete Package
                    </button>
                </div>
            </div>
        `;
    }

    showCrossTabNotification(message) {
        this.showNotification(message, 'info');
    }

    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }

    showInfoNotification(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Don't show notification if user has seen it recently
        const notificationKey = `master_notification_${message.substring(0, 20).replace(/\s+/g, '_')}`;
        const lastShown = localStorage.getItem(notificationKey);
        const now = Date.now();
        
        // Only show same notification once per 15 minutes
        if (lastShown && (now - parseInt(lastShown)) < 900000) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `master-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove(); localStorage.setItem('${notificationKey}', '${now}');">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Mark as shown
        localStorage.setItem(notificationKey, now.toString());
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    /* ================================
       UTILITY FUNCTIONS
       ================================ */

    async loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    async loadJS(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(); // Already loaded
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    showTabError(container, error) {
        const errorHTML = `
            <div class="tab-error">
                <h3>❌ Error Loading Content</h3>
                <p>${error.message}</p>
                <button class="cipher-btn cipher-btn--primary" onclick="location.reload()">
                    🔄 Reload Page
                </button>
            </div>
        `;
        
        container.innerHTML = errorHTML;
    }

    // Placeholder functions for missing content fetchers
    async fetchRouteOptimizerHTML() {
        // Get user role to customize interface
        const userRole = this.getUserRole();
        const isCoordinator = userRole === 'coordinator';
        
        console.log('🗺️ Generating clean route optimizer HTML for role:', userRole, 'isCoordinator:', isCoordinator);
        
        return `
            <div class="route-optimizer-content clean-design">

                <!-- Calendar Section -->
                <div class="calendar-planning-section">
                    <div class="section-header">
                        <h2>My Route Calendar</h2>
                        <p>Plan and schedule your routes by date</p>
                    </div>
                    
                    <div class="route-calendar">
                        <div class="calendar-header">
                            <button class="nav-btn" id="prevMonth">Previous</button>
                            <h3 id="currentMonth">August 2025</h3>
                            <button class="nav-btn" id="nextMonth">Next</button>
                        </div>
                        
                        <div class="calendar-grid">
                            <div class="calendar-days">
                                <div class="day-header">Sun</div>
                                <div class="day-header">Mon</div>
                                <div class="day-header">Tue</div>
                                <div class="day-header">Wed</div>
                                <div class="day-header">Thu</div>
                                <div class="day-header">Fri</div>
                                <div class="day-header">Sat</div>
                            </div>
                            <div class="calendar-dates" id="calendarDates">
                                <!-- Calendar dates will be generated here -->
                            </div>
                        </div>
                        
                        <div class="calendar-summary">
                            <div class="current-route-info">
                                <div class="route-detail">
                                    <strong>Start Location:</strong> <span id="displayStartLocation">Raleigh, NC</span>
                                </div>
                                <div class="route-detail">
                                    <strong>Destinations:</strong> <span id="destinationCount">0 planned for today</span>
                                </div>
                                <div class="route-detail">
                                    <strong>Estimated Time:</strong> <span id="estimatedTime">Not calculated</span>
                                </div>
                            </div>
                            
                            <div class="calendar-actions">
                                <button class="cipher-btn cipher-btn--primary" id="scheduleRoute">Schedule Route</button>
                                <button class="cipher-btn cipher-btn--ghost" id="routeSettings">Route Settings</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Today's Destinations -->
                <div class="destinations-planning-section">
                    <div class="section-header">
                        <h3>Today's Destinations</h3>
                        <button id="addDestination" class="cipher-btn cipher-btn--primary">Add Destination</button>
                    </div>
                    
                    <!-- Starting Location -->
                    <div class="form-group start-location-group">
                        <label for="startLocation" class="form-label">Starting Location</label>
                        <input type="text" id="startLocation" class="form-input" placeholder="Enter your home or office address" value="Raleigh, NC">
                        <div class="field-help">This is where your route will begin and end</div>
                    </div>
                    
                    <!-- Destinations List -->
                    <div id="destinationsList" class="destinations-list">
                        <div class="empty-state">
                            <h4>No destinations added yet</h4>
                            <p>Click "Add Destination" to start planning your route</p>
                        </div>
                    </div>
                    
                    <!-- Route Actions -->
                    <div class="route-actions" id="routeActions" style="display: none;">
                        <button id="showRouteSettings" class="cipher-btn cipher-btn--secondary">
                            Route Settings
                        </button>
                    </div>
                

                <!-- Route Settings (Hidden by default) -->
                <div class="settings-section" id="routeSettingsPanel" style="display: none;">
                    <div class="section-header">
                        <h3>Route Settings</h3>
                        <button class="cipher-btn cipher-btn--ghost" onclick="document.getElementById('routeSettingsPanel').style.display='none'">Close</button>
                    </div>
                    
                    <div class="settings-grid">
                        <div class="form-group">
                            <label for="optimizationMode" class="form-label">Optimize For</label>
                            <select id="optimizationMode" class="form-select">
                                <option value="time" selected>Shortest Time</option>
                                <option value="distance">Shortest Distance</option>
                                <option value="revenue">Maximum Revenue</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="maxLegMiles" class="form-label">Max Miles Between Stops</label>
                            <input type="number" id="maxLegMiles" class="form-input" value="50" min="10" max="200">
                        </div>
                        
                        <div class="form-group">
                            <label for="maxDailyHours" class="form-label">Max Hours Per Day</label>
                            <input type="number" id="maxDailyHours" class="form-input" value="10" min="4" max="12">
                        </div>
                        
                        <div class="form-group">
                            <label for="timePerAppointment" class="form-label">Minutes Per Stop</label>
                            <input type="number" id="timePerAppointment" class="form-input" value="30" min="15" max="120">
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="optimizeEnabled" checked>
                                Smart Route Optimization
                            </label>
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="splitEnabled" checked>
                                Multi-Day Route Splitting
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-section">
                    <button id="optimizeRoute" class="cipher-btn cipher-btn--primary cipher-btn--large">
                        Optimize Route
                    </button>
                    
                    <div class="secondary-actions">
                        <button id="bulkImportBtn" class="cipher-btn cipher-btn--secondary">Bulk Import</button>
                        <button id="clearAll" class="cipher-btn cipher-btn--ghost">Clear All</button>
                    </div>
                </div>

                <!-- Claims Workflow Steps -->
                <div class="claims-workflow-section" id="claimsWorkflow" style="display: none;">
                    <div class="section-header">
                        <h3>Claims Process - Next Actions</h3>
                        <p class="workflow-info">Route optimized! Now execute the claims process:</p>
                    </div>
                    
                    <div class="workflow-actions-grid">
                        <!-- Schedule & Contact -->
                        <div class="workflow-action-card">
                            <h4>1. Schedule & Contact Customers</h4>
                            <p>Arrange inspection dates and confirm times</p>
                            <div class="action-buttons">
                                <button id="scheduleInspections" class="cipher-btn cipher-btn--primary">
                                    Schedule Inspections
                                </button>
                                <button id="sendSMSNotifications" class="cipher-btn cipher-btn--secondary">
                                    Send SMS/Call Customers
                                </button>
                            </div>
                        </div>

                        <!-- Bill Mileage -->  
                        <div class="workflow-action-card">
                            <h4>2. Submit Mileage Billing</h4>
                            <p>Bill various firms for travel - Don't wait for approval!</p>
                            <div class="action-buttons">
                                <button id="exportToMileage" class="cipher-btn cipher-btn--primary">
                                    Export to Mileage Calculator
                                </button>
                                <button id="submitToFirms" class="cipher-btn cipher-btn--secondary">
                                    Submit to Firms
                                </button>
                            </div>
                        </div>

                        <!-- Inspection Prep -->
                        <div class="workflow-action-card">
                            <h4>3. Prepare for Inspections</h4>
                            <p>Ready for field work and documentation</p>
                            <div class="action-buttons">
                                <button id="exportToJobs" class="cipher-btn cipher-btn--primary">
                                    Create Job Assignments
                                </button>
                                <button id="printRouteMap" class="cipher-btn cipher-btn--secondary">
                                    Print Route Map
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="completion-checklist">
                        <h4>Post-Inspection Completion Checklist:</h4>
                        <ul>
                            <li>📸 Take photos during inspection</li>
                            <li>📄 Upload to firm portals</li>
                            <li>🏠 Return home and complete estimates</li>
                            <li>📋 Fill total loss forms (BCIF)</li>
                            <li>📊 Complete claim summary</li>
                            <li>🚗 Get comparables printouts</li>
                            <li>💰 Get pro quote from Copart</li>
                            <li>📞 Call CCC for ACV confirmation</li>
                        </ul>
                    </div>
                </div>

                <!-- Route Results -->
                <div id="routeResults" class="route-results-section" style="display: none;">
                    <div class="route-map-container">
                        <div id="routeMap" class="route-map"></div>
                    </div>
                    <div id="routeOutput" class="route-output"></div>
                </div>

                <!-- Loading & Error States -->
                <div id="loadingOverlay" class="loading-overlay" style="display: none;">
                    <div class="spinner"></div>
                    <p>Optimizing your route...</p>
                </div>
                
                <div id="errorDisplay" class="error-display" style="display: none;">
                    <div class="error-content">
                        <span id="errorMessage" class="error-message"></span>
                        <button onclick="document.getElementById('errorDisplay').style.display='none'" class="error-close">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    async fetchMileageCalculatorHTML() {
        return `
            <div class="mileage-calculator-content">
                <!-- Calculator Input Section -->
                <div class="calculator-section">
                    <div class="section-header">
                        <h3>🧮 Calculate Mileage Billing</h3>
                        <p>Automatic distance calculation and billing generation</p>
                    </div>
                    
                    <div class="input-grid">
                        <!-- Firm Selection -->
                        <div class="input-group">
                            <label for="firmSelect">🏢 Select Firm</label>
                            <select id="firmSelect" class="input-field">
                                <option value="">Choose your firm...</option>
                            </select>
                        </div>

                        <!-- Claim Type Selection -->
                        <div class="input-group">
                            <label for="claimTypeSelect">📋 Claim Type</label>
                            <select id="claimTypeSelect" class="input-field">
                                <option value="">Select claim type...</option>
                                <option value="auto">Auto Claims</option>
                                <option value="te">T&E Claims</option>
                                <option value="photoscope">Photo/Scope</option>
                                <option value="exotic">Exotic/Classic</option>
                            </select>
                        </div>

                        <!-- From Address -->
                        <div class="input-group">
                            <label for="pointA">🏠 From Address</label>
                            <input type="text" id="pointA" class="input-field" placeholder="Your home/office address">
                        </div>

                        <!-- To Address -->
                        <div class="input-group">
                            <label for="pointB">📍 To Address</label>
                            <input type="text" id="pointB" class="input-field" placeholder="Claim location address">
                        </div>

                        <!-- Distance (Auto-calculated) -->
                        <div class="input-group">
                            <label for="distanceMiles">📏 Distance (Miles)</label>
                            <input type="number" id="distanceMiles" class="input-field" placeholder="Auto-calculated" min="0" step="0.1">
                            <div id="distanceStatus" class="input-status">
                                <span class="status-icon">📝</span>
                                Enter addresses above for auto-calculation
                            </div>
                        </div>

                        <!-- Round Trip Option -->
                        <div class="input-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="roundTrip" checked>
                                <span class="checkbox-text">🔄 Round Trip</span>
                            </label>
                        </div>
                    </div>

                    <!-- Calculate Button -->
                    <div class="action-section">
                        <button id="calculateBtn" class="cipher-btn cipher-btn--primary">
                            <span class="btn-text">🧮 Calculate Billing</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span> Calculating...
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Results Section -->
                <div id="resultsSection" class="results-section" style="display: none;">
                    <div class="section-header">
                        <h3>💰 Billing Breakdown</h3>
                        <div class="results-actions">
                            <button id="copyBtn" class="cipher-btn cipher-btn--secondary">
                                <span class="btn-text">📋 Copy for TPA</span>
                                <span class="btn-success" style="display: none;">✅ Copied!</span>
                            </button>
                            <button id="newCalculation" class="cipher-btn cipher-btn--tertiary">
                                🆕 New Calculation
                            </button>
                        </div>
                    </div>
                    
                    <div id="breakdownDisplay" class="breakdown-display">
                        <!-- Populated by JavaScript -->
                    </div>
                    
                    <!-- Copy-ready text -->
                    <div class="copy-section">
                        <label for="copyText">Copy-Ready Breakdown:</label>
                        <textarea id="copyText" class="copy-text" readonly rows="3"></textarea>
                    </div>

                    <!-- Send to Jobs Section -->
                    <div class="send-to-jobs-section">
                        <div class="section-header">
                            <h4>💼 Send to Active Jobs</h4>
                            <p>Create job entry with mileage + file rate</p>
                        </div>
                        
                        <div class="input-group">
                            <label for="claimIdInput">📋 Claim ID</label>
                            <input type="text" id="claimIdInput" class="input-field" placeholder="Enter claim ID (e.g., B640764)">
                        </div>
                        
                        <div class="job-preview" id="jobPreview" style="display: none;">
                            <div class="preview-header">Job Preview:</div>
                            <div class="preview-content" id="previewContent"></div>
                        </div>
                        
                        <button id="sendToJobsBtn" class="cipher-btn cipher-btn--primary" style="width: 100%;">
                            💼 Send to Jobs
                        </button>
                    </div>
                </div>

                <!-- Optional Notes -->
                <div class="notes-section">
                    <label for="noteField">📝 Notes (Optional)</label>
                    <textarea id="noteField" class="input-field" rows="2" placeholder="Additional notes for this calculation..."></textarea>
                </div>
            </div>
        `;
    }

    async fetchJobsStudioHTML() {
        return `
            <div class="jobs-studio-content">
                <p>💼 Jobs Studio will be loaded here...</p>
                <p>Mobile integration and job management workflow.</p>
            </div>
        `;
    }

    generateHiringFirmsContent() {
        return `
            <div class="firm-card">
                <h4>🎯 Example Hiring Firm</h4>
                <p>Currently seeking independent adjusters</p>
                <button class="cipher-btn cipher-btn--sm">View Details</button>
            </div>
        `;
    }

    generateClientCatalogContent() {
        return `
            <div class="firm-card">
                <h4>📂 Your Client Firm</h4>
                <p>Established working relationship</p>
                <button class="cipher-btn cipher-btn--sm">Manage</button>
            </div>
        `;
    }

    // Mock processing functions
    async extractDataFromPDF(file) {
        await this.delay(1500);
        return { vehicleInfo: 'extracted', claimData: 'processed' };
    }

    async generateBCIFForm(data) {
        await this.delay(2000);
        return { formGenerated: true, bcifData: data };
    }

    async performVehicleValuation(data) {
        await this.delay(1800);
        return { valuationComplete: true, marketValue: '$15,000' };
    }

    async generateCompletePackage(data) {
        await this.delay(1000);
        return { packageReady: true, ...data };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /* ================================
       GLOBAL WORKFLOW TRACKER
       ================================ */

    initializeGlobalWorkflowTracker() {
        console.log('📊 Initializing global workflow tracker...');
        
        // Create workflow progress indicator in header
        this.createWorkflowProgressIndicator();
        
        // Monitor workflow data changes
        this.startWorkflowMonitoring();
        
        // Check for existing workflow data
        this.checkExistingWorkflowData();
    }

    createWorkflowProgressIndicator() {
        // Check if already exists
        if (document.getElementById('globalWorkflowTracker')) return;

        const header = document.querySelector('.cipher-header .header-content');
        if (!header) return;

        const workflowTracker = document.createElement('div');
        workflowTracker.id = 'globalWorkflowTracker';
        workflowTracker.className = 'global-workflow-tracker hidden';
        workflowTracker.innerHTML = `
            <div class="workflow-progress-container">
                <div class="workflow-steps">
                    <div class="workflow-step" data-step="route-optimizer">
                        <span class="step-icon">🗺️</span>
                        <span class="step-label">Route</span>
                        <div class="step-status"></div>
                    </div>
                    <div class="workflow-connector"></div>
                    <div class="workflow-step" data-step="mileage-calculator">
                        <span class="step-icon">🧮</span>
                        <span class="step-label">Mileage</span>
                        <div class="step-status"></div>
                    </div>
                    <div class="workflow-connector"></div>
                    <div class="workflow-step" data-step="jobs">
                        <span class="step-icon">💼</span>
                        <span class="step-label">Job</span>
                        <div class="step-status"></div>
                    </div>
                </div>
                <div class="workflow-controls">
                    <button class="workflow-toggle-btn" onclick="window.masterInterface.toggleWorkflowTracker()">
                        <span class="btn-icon">📊</span>
                    </button>
                </div>
            </div>
        `;

        // Insert before the user section to avoid layout issues
        const userSection = header.querySelector('.user-section');
        const masterTabs = header.querySelector('.master-tabs');
        
        if (userSection) {
            userSection.before(workflowTracker);
        } else if (masterTabs) {
            masterTabs.after(workflowTracker);
        } else {
            header.appendChild(workflowTracker);
        }

        // Add styles
        this.addWorkflowTrackerStyles();
    }

    addWorkflowTrackerStyles() {
        if (document.getElementById('global-workflow-styles')) return;

        const style = document.createElement('style');
        style.id = 'global-workflow-styles';
        style.textContent = `
            .global-workflow-tracker {
                display: flex;
                align-items: center;
                margin: 0 8px;
                padding: 6px 12px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: var(--cipher-radius-md);
                backdrop-filter: blur(8px);
                transition: all 0.3s ease;
                flex-shrink: 0;
            }
            
            .global-workflow-tracker.hidden {
                opacity: 0;
                transform: translateY(-10px);
                pointer-events: none;
            }
            
            .workflow-progress-container {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .workflow-steps {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .workflow-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                padding: 6px 8px;
                border-radius: var(--cipher-radius-sm);
                transition: all 0.2s ease;
                position: relative;
                min-width: 45px;
            }
            
            .workflow-step.completed {
                background: var(--cipher-success);
                color: white;
            }
            
            .workflow-step.current {
                background: var(--cipher-accent);
                color: var(--cipher-accent-text);
                transform: scale(1.05);
            }
            
            .workflow-step.pending {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.7);
            }
            
            .workflow-step .step-icon {
                font-size: 16px;
            }
            
            .workflow-step .step-label {
                font-size: 11px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .workflow-step .step-status {
                position: absolute;
                top: -4px;
                right: -4px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid var(--cipher-bg-primary);
                transition: all 0.2s ease;
            }
            
            .workflow-step.completed .step-status {
                background: var(--cipher-success);
            }
            
            .workflow-step.current .step-status {
                background: var(--cipher-accent);
                animation: pulse 1.5s infinite;
            }
            
            .workflow-connector {
                width: 24px;
                height: 2px;
                background: rgba(255, 255, 255, 0.3);
                position: relative;
            }
            
            .workflow-connector.active {
                background: var(--cipher-accent);
            }
            
            .workflow-controls {
                display: flex;
                gap: 8px;
            }
            
            .workflow-toggle-btn {
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: rgba(255, 255, 255, 0.8);
                padding: 6px 8px;
                border-radius: var(--cipher-radius-md);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .workflow-toggle-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.2); }
            }
            
            @media (max-width: 768px) {
                .global-workflow-tracker {
                    margin: 0 8px;
                    padding: 6px 12px;
                }
                
                .workflow-step {
                    padding: 6px 8px;
                    min-width: 50px;
                }
                
                .workflow-step .step-label {
                    display: none;
                }
                
                .workflow-connector {
                    width: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    startWorkflowMonitoring() {
        // Monitor localStorage changes for workflow data
        setInterval(() => {
            this.updateWorkflowProgress();
        }, 1000);

        // Listen for workflow events
        document.addEventListener('workflow:step-completed', (event) => {
            this.updateWorkflowProgress();
            this.showWorkflowNotification(event.detail);
        });
    }

    checkExistingWorkflowData() {
        // Check for existing workflow data from previous sessions
        const workflowData = localStorage.getItem('cc_workflow_data');
        const routeExport = localStorage.getItem('cc_route_export');
        const mileageCalculation = localStorage.getItem('cc_mileage_calculation');
        const pendingJob = localStorage.getItem('cc_pending_job');

        if (workflowData || routeExport || mileageCalculation || pendingJob) {
            console.log('📊 Found existing workflow data, showing tracker...');
            this.showWorkflowTracker();
            this.updateWorkflowProgress();
        }
    }

    updateWorkflowProgress() {
        const tracker = document.getElementById('globalWorkflowTracker');
        if (!tracker) return;

        const workflowData = JSON.parse(localStorage.getItem('cc_workflow_data') || '{}');
        const routeExport = localStorage.getItem('cc_route_export');
        const mileageCalculation = localStorage.getItem('cc_mileage_calculation');
        const pendingJob = localStorage.getItem('cc_pending_job');

        // Update step statuses
        const routeStep = tracker.querySelector('[data-step="route-optimizer"]');
        const mileageStep = tracker.querySelector('[data-step="mileage-calculator"]');
        const jobsStep = tracker.querySelector('[data-step="jobs"]');

        // Reset classes
        [routeStep, mileageStep, jobsStep].forEach(step => {
            step?.classList.remove('completed', 'current', 'pending');
        });

        // Route step status
        if (workflowData.routeOptimizer?.completed || routeExport) {
            routeStep?.classList.add('completed');
        } else {
            routeStep?.classList.add('pending');
        }

        // Mileage step status
        if (workflowData.mileageCalculator?.completed || mileageCalculation) {
            mileageStep?.classList.add('completed');
            if (!pendingJob && !workflowData.jobs?.completed) {
                mileageStep?.classList.add('current');
            }
        } else if (workflowData.routeOptimizer?.completed || routeExport) {
            mileageStep?.classList.add('current');
        } else {
            mileageStep?.classList.add('pending');
        }

        // Jobs step status
        if (workflowData.jobs?.completed) {
            jobsStep?.classList.add('completed');
        } else if (pendingJob || workflowData.jobs?.pending) {
            jobsStep?.classList.add('current');
        } else {
            jobsStep?.classList.add('pending');
        }

        // Update connectors
        const connectors = tracker.querySelectorAll('.workflow-connector');
        connectors.forEach((connector, index) => {
            connector.classList.toggle('active', 
                (index === 0 && (workflowData.routeOptimizer?.completed || routeExport)) ||
                (index === 1 && (workflowData.mileageCalculator?.completed || mileageCalculation))
            );
        });
    }

    showWorkflowTracker() {
        const tracker = document.getElementById('globalWorkflowTracker');
        if (tracker) {
            tracker.classList.remove('hidden');
        }
    }

    toggleWorkflowTracker() {
        const tracker = document.getElementById('globalWorkflowTracker');
        if (tracker) {
            tracker.classList.toggle('hidden');
        }
    }

    showWorkflowNotification(stepData) {
        const notifications = {
            'route-optimizer': '🗺️ Route optimized! Ready for mileage calculation.',
            'mileage-calculator': '🧮 Mileage calculated! Ready to create job.',
            'jobs': '💼 Job created! Workflow completed.'
        };

        const message = notifications[stepData.step] || 'Workflow step completed!';
        this.showSuccessNotification(message);
    }

    /**
     * Download complete total loss package
     * Delegates to the total loss controller
     */
    downloadCompletePackage() {
        console.log('📦 Master Interface: Routing to Total Loss Controller...');
        
        // Check if total loss controller exists and has processed data
        if (window.totalLoss && typeof window.totalLoss.downloadCompletePackage === 'function') {
            console.log('✅ Found totalLoss controller, delegating download...');
            window.totalLoss.downloadCompletePackage();
        } else if (window.totalLossController && typeof window.totalLossController.downloadCompletePackage === 'function') {
            console.log('✅ Found totalLossController, delegating download...');
            window.totalLossController.downloadCompletePackage();
        } else {
            console.error('❌ Total Loss Controller not available');
            console.log('Available window objects:', Object.keys(window).filter(key => key.includes('total')));
            
            // Try to show a helpful message
            if (document.getElementById('resultsContainer') && document.getElementById('resultsContainer').style.display === 'none') {
                this.showNotification('Please process a document first before downloading the package.', 'error');
            } else {
                this.showNotification('Total Loss system not available. Please refresh the page.', 'error');
            }
        }
    }
}

// Initialize Master Interface
window.masterInterface = new MasterInterfaceController();

// Export for global access
window.MasterInterfaceController = MasterInterfaceController;