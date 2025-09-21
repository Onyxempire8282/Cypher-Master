/**
 * Next Steps Widget
 * Shows recommended next actions for new users
 */

class NextStepsWidget {
    constructor(containerId, jobBillingService) {
        this.container = document.getElementById(containerId);
        this.jobBillingService = jobBillingService;
        this.isVisible = true;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Next steps container not found');
            return;
        }

        // Check if user should see next steps
        if (this.shouldShowNextSteps()) {
            this.render();
            this.bindEvents();
        }
    }

    shouldShowNextSteps() {
        // Show if no firms are configured or no jobs completed
        const firmConfigs = this.jobBillingService?.getAllFirmConfigs() || [];
        const hasCompletedJobs = this.jobBillingService?.jobs?.size > 0;
        
        return firmConfigs.length === 0 || !hasCompletedJobs;
    }

    render() {
        const firmConfigs = this.jobBillingService?.getAllFirmConfigs() || [];
        const hasCompletedJobs = this.jobBillingService?.jobs?.size > 0;
        
        this.container.innerHTML = `
            <div class="next-steps-container">
                <div class="next-steps-header">
                    <div class="step-icon">🚀</div>
                    <div class="header-content">
                        <h3>Get Started with Cypher Master</h3>
                        <p class="next-steps-subtitle">Complete these steps to unlock your earnings tracking potential</p>
                    </div>
                </div>

                <div class="setup-options">
                    ${this.renderFirmSetupOption(firmConfigs.length === 0)}
                    ${this.renderJobCreationOption(!hasCompletedJobs)}
                    ${this.renderRouteOptimizationOption()}
                </div>

                <div class="progress-section">
                    <div class="progress-header">
                        <h4>Setup Progress</h4>
                        <span class="progress-percentage">${this.calculateProgress()}% Complete</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.calculateProgress()}%"></div>
                    </div>
                    <div class="progress-steps">
                        ${this.renderProgressSteps(firmConfigs.length > 0, hasCompletedJobs)}
                    </div>
                </div>

                ${this.renderQuickTips()}
            </div>
        `;
    }

    renderFirmSetupOption(isNeeded) {
        if (!isNeeded) {
            return `
                <div class="option-card completed">
                    <div class="option-header">
                        <h4>✅ Billing Firms Configured</h4>
                    </div>
                    <p>Your billing firms are set up and ready to track earnings</p>
                    <button class="setup-btn secondary" data-action="manage-firms">
                        Manage Firms
                    </button>
                </div>
            `;
        }

        return `
            <div class="option-card recommended">
                <div class="option-header">
                    <h4>💰 Set Up Billing Firms</h4>
                </div>
                <p>Configure your firm rates for automatic earnings tracking. Essential for accurate billing calculations.</p>
                <ul class="benefits-list">
                    <li><strong>Automatic earnings calculation</strong> - File rates + mileage tracking</li>
                    <li><strong>Smart payment calendar</strong> - Never miss a billing cycle</li>
                    <li><strong>Performance analytics</strong> - Track which firms pay best</li>
                </ul>
                <button class="setup-btn primary" data-action="setup-firms">
                    Set Up Billing Firms
                </button>
            </div>
        `;
    }

    renderJobCreationOption(isNeeded) {
        if (!isNeeded) {
            return `
                <div class="option-card completed">
                    <div class="option-header">
                        <h4>✅ Jobs System Active</h4>
                    </div>
                    <p>You've started using the job tracking system</p>
                    <button class="setup-btn secondary" data-action="add-job">
                        Add New Job
                    </button>
                </div>
            `;
        }

        return `
            <div class="option-card">
                <div class="option-header">
                    <h4>📋 Create Your First Job</h4>
                </div>
                <p>Start tracking earnings by adding your first job. The system will automatically calculate mileage and billing.</p>
                <button class="setup-btn primary" data-action="create-job">
                    Create First Job
                </button>
            </div>
        `;
    }

    renderRouteOptimizationOption() {
        return `
            <div class="option-card">
                <div class="option-header">
                    <h4>🗺️ Optimize Your Routes</h4>
                </div>
                <p>Plan efficient multi-stop routes to maximize earnings and minimize drive time.</p>
                <button class="setup-btn secondary" data-action="explore-routes">
                    Explore Route Optimizer
                </button>
            </div>
        `;
    }

    renderProgressSteps(firmsConfigured, jobsStarted) {
        return `
            <div class="step-indicators">
                <div class="step-indicator ${firmsConfigured ? 'completed' : 'pending'}">
                    <div class="step-icon">${firmsConfigured ? '✅' : '💰'}</div>
                    <span class="step-label">Firms</span>
                </div>
                <div class="step-connector ${firmsConfigured ? 'completed' : 'pending'}"></div>
                <div class="step-indicator ${jobsStarted ? 'completed' : 'pending'}">
                    <div class="step-icon">${jobsStarted ? '✅' : '📋'}</div>
                    <span class="step-label">Jobs</span>
                </div>
                <div class="step-connector ${jobsStarted ? 'completed' : 'pending'}"></div>
                <div class="step-indicator pending">
                    <div class="step-icon">🚀</div>
                    <span class="step-label">Optimize</span>
                </div>
            </div>
        `;
    }

    renderQuickTips() {
        return `
            <div class="quick-tips">
                <h4>💡 Quick Tips</h4>
                <div class="tips-grid">
                    <div class="tip-item">
                        <span class="tip-icon">⚡</span>
                        <div class="tip-content">
                            <strong>Start Simple</strong>
                            <p>Set up 2-3 main firms first, add others later</p>
                        </div>
                    </div>
                    <div class="tip-item">
                        <span class="tip-icon">📱</span>
                        <div class="tip-content">
                            <strong>Mobile Ready</strong>
                            <p>Works great on phones for field use</p>
                        </div>
                    </div>
                    <div class="tip-item">
                        <span class="tip-icon">🔒</span>
                        <div class="tip-content">
                            <strong>Secure Data</strong>
                            <p>All your information is encrypted and protected</p>
                        </div>
                    </div>
                    <div class="tip-item">
                        <span class="tip-icon">📊</span>
                        <div class="tip-content">
                            <strong>Smart Analytics</strong>
                            <p>Get insights on your most profitable work</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateProgress() {
        const firmConfigs = this.jobBillingService?.getAllFirmConfigs() || [];
        const hasCompletedJobs = this.jobBillingService?.jobs?.size > 0;
        
        let progress = 0;
        if (firmConfigs.length > 0) progress += 50;
        if (hasCompletedJobs) progress += 30;
        // Route optimization would add 20%
        
        return progress;
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'setup-firms':
                    this.handleSetupFirms();
                    break;
                case 'manage-firms':
                    this.handleManageFirms();
                    break;
                case 'create-job':
                    this.handleCreateJob();
                    break;
                case 'add-job':
                    this.handleCreateJob();
                    break;
                case 'explore-routes':
                    this.handleExploreRoutes();
                    break;
            }
        });

        // Listen for setup completion events
        window.addEventListener('firms:configured', () => {
            this.refresh();
        });

        window.addEventListener('job:completed', () => {
            this.refresh();
        });
    }

    handleSetupFirms() {
        // Trigger firm configuration
        window.dispatchEvent(new CustomEvent('firm:setup-requested'));
        
        // Or navigate to firms tab
        if (window.masterInterface && window.masterInterface.switchTab) {
            window.masterInterface.switchTab('firms-directory');
        }
    }

    handleManageFirms() {
        // Navigate to firms tab
        if (window.masterInterface && window.masterInterface.switchTab) {
            window.masterInterface.switchTab('firms-directory');
        }
    }

    handleCreateJob() {
        // Navigate to jobs tab
        if (window.masterInterface && window.masterInterface.switchTab) {
            window.masterInterface.switchTab('jobs-studio');
        }
        
        // Or trigger job creation modal
        window.dispatchEvent(new CustomEvent('job:create-requested'));
    }

    handleExploreRoutes() {
        // Navigate to route optimizer
        if (window.masterInterface && window.masterInterface.switchTab) {
            window.masterInterface.switchTab('route-optimizer');
        }
    }

    refresh() {
        if (this.shouldShowNextSteps()) {
            this.render();
        } else {
            this.hide();
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        this.isVisible = false;
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.render();
        }
        this.isVisible = true;
    }

    destroy() {
        // Cleanup if needed
    }
}

// Export for use in other modules
window.NextStepsWidget = NextStepsWidget;