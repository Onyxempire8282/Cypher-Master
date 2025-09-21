/**
 * Firm Configuration Module
 * Post-onboarding setup for billing and firm management
 */

class FirmConfiguration {
    constructor(jobBillingService) {
        this.jobBillingService = jobBillingService;
        this.currentFirmIndex = 0;
        this.firmsToSetup = [];
        this.isPostOnboarding = false;
        this.container = null;
        
        this.init();
    }

    init() {
        // Listen for post-onboarding triggers
        window.addEventListener('onboarding:completed', (event) => {
            this.startPostOnboardingSetup(event.detail);
        });

        // Listen for firm setup requests
        window.addEventListener('firm:setup-requested', () => {
            this.showFirmSetup();
        });
    }

    startPostOnboardingSetup(onboardingData) {
        this.isPostOnboarding = true;
        
        // Check if user indicated they work with multiple firms
        const networkData = onboardingData.userCipher?.network;
        if (networkData && (networkData.firmCount > 1 || networkData.firms?.length > 0)) {
            this.showFirmSetupIntro(onboardingData);
        } else {
            // Skip firm setup for now, user can add later
            this.redirectToDashboard();
        }
    }

    showFirmSetupIntro(onboardingData) {
        // Create overlay container
        this.createOverlayContainer();
        
        this.container.innerHTML = `
            <div class="firm-setup-intro">
                <button class="modal-close" data-action="close-modal">×</button>
                <div class="setup-header">
                    <h2>🏢 Set Up Your Billing Firms</h2>
                    <p class="setup-subtitle">Configure billing rates for accurate earnings tracking</p>
                </div>

                <div class="intro-content">
                    <div class="intro-explanation">
                        <h3>Why Set Up Firm Billing?</h3>
                        <ul class="benefits-list">
                            <li>📊 <strong>Automatic earnings calculation</strong> - File rates + mileage tracking</li>
                            <li>📅 <strong>Smart payment calendar</strong> - Never miss a billing cycle</li>
                            <li>📈 <strong>Performance analytics</strong> - Track which firms pay best</li>
                            <li>🚗 <strong>Integrated mileage</strong> - GPS-powered route calculations</li>
                        </ul>
                    </div>

                    <div class="setup-options">
                        <div class="option-card recommended">
                            <div class="option-header">
                                <h4>📋 Quick Setup</h4>
                                <span class="option-badge">Recommended</span>
                            </div>
                            <p>Set up your top 3-5 paying firms now (5 minutes)</p>
                            <button class="setup-btn primary" data-action="start-quick-setup">
                                Start Quick Setup
                            </button>
                        </div>

                        <div class="option-card">
                            <div class="option-header">
                                <h4>🔧 Full Configuration</h4>
                            </div>
                            <p>Configure all firms with detailed billing settings</p>
                            <button class="setup-btn secondary" data-action="start-full-setup">
                                Full Setup
                            </button>
                        </div>

                        <div class="option-card">
                            <div class="option-header">
                                <h4>⏭️ Skip for Now</h4>
                            </div>
                            <p>Set up billing later in the Firms tab</p>
                            <button class="setup-btn tertiary" data-action="skip-setup">
                                Skip & Continue to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                <div class="setup-progress">
                    <div class="progress-text">Optional Setup • Takes 2-10 minutes</div>
                </div>
            </div>
        `;

        this.bindIntroEvents();
        this.showOverlay();
    }

    startQuickSetup() {
        this.firmsToSetup = [
            { name: '', isQuickSetup: true },
            { name: '', isQuickSetup: true },
            { name: '', isQuickSetup: true }
        ];
        this.currentFirmIndex = 0;
        this.showFirmConfigurationForm();
    }

    startFullSetup() {
        this.showFirmListBuilder();
    }

    showFirmListBuilder() {
        this.container.innerHTML = `
            <div class="firm-list-builder">
                <button class="modal-close" data-action="close-modal">×</button>
                <div class="setup-header">
                    <h2>📋 Your Insurance Firms</h2>
                    <p class="setup-subtitle">Add all the firms you work with regularly</p>
                </div>

                <div class="firm-input-section">
                    <div class="input-group">
                        <input type="text" 
                               id="firmNameInput" 
                               class="firm-input" 
                               placeholder="Enter firm name (e.g., Sedgwick, Crawford & Company)"
                               autocomplete="off">
                        <button class="add-firm-btn" data-action="add-firm">
                            <span class="btn-icon">+</span>
                            Add Firm
                        </button>
                    </div>
                    
                    <div class="common-firms">
                        <span class="common-firms-label">Common firms:</span>
                        <div class="common-firms-list">
                            <button class="common-firm-btn" data-firm="Sedgwick">Sedgwick</button>
                            <button class="common-firm-btn" data-firm="Crawford & Company">Crawford</button>
                            <button class="common-firm-btn" data-firm="GAB Robins">GAB Robins</button>
                            <button class="common-firm-btn" data-firm="Pilot Catastrophe">Pilot</button>
                            <button class="common-firm-btn" data-firm="Eberl Claims">Eberl</button>
                            <button class="common-firm-btn" data-firm="ESIS">ESIS</button>
                        </div>
                    </div>
                </div>

                <div class="firms-list" id="firmsList">
                    <div class="list-header">
                        <h4>Firms to Configure:</h4>
                    </div>
                    <div class="firms-container" id="firmsContainer">
                        <!-- Firms will be added here -->
                    </div>
                </div>

                <div class="setup-actions">
                    <button class="setup-btn secondary" data-action="back-to-intro">
                        ← Back
                    </button>
                    <button class="setup-btn primary" data-action="configure-firms" disabled id="configureFirmsBtn">
                        Configure Billing →
                    </button>
                </div>
            </div>
        `;

        this.bindListBuilderEvents();
    }

    showFirmConfigurationForm() {
        const currentFirm = this.firmsToSetup[this.currentFirmIndex];
        const isLast = this.currentFirmIndex === this.firmsToSetup.length - 1;
        const progress = Math.round(((this.currentFirmIndex + 1) / this.firmsToSetup.length) * 100);

        this.container.innerHTML = `
            <div class="firm-configuration-form">
                <button class="modal-close" data-action="close-modal">×</button>
                <div class="setup-header">
                    <h2>💰 Configure ${currentFirm.name || 'Firm ' + (this.currentFirmIndex + 1)}</h2>
                    <p class="setup-subtitle">Set up billing rates and payment schedule</p>
                </div>

                <div class="configuration-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">Firm ${this.currentFirmIndex + 1} of ${this.firmsToSetup.length}</span>
                </div>

                <form class="firm-config-form" id="firmConfigForm">
                    <!-- Firm Name -->
                    <div class="form-section">
                        <label class="form-label" for="firmName">
                            <span class="label-text">Firm Name</span>
                            <span class="label-required">*</span>
                        </label>
                        <input type="text" 
                               id="firmName" 
                               name="firmName"
                               class="form-input"
                               value="${currentFirm.name || ''}"
                               placeholder="e.g., Sedgwick Claims Management"
                               required>
                    </div>

                    <!-- Billing Rates Section -->
                    <div class="form-section">
                        <h4 class="section-title">💰 Billing Rates</h4>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="fileRate">
                                    <span class="label-text">File Rate</span>
                                    <span class="label-help">Per claim/inspection</span>
                                </label>
                                <div class="input-with-prefix">
                                    <span class="input-prefix">$</span>
                                    <input type="number" 
                                           id="fileRate" 
                                           name="fileRate"
                                           class="form-input"
                                           placeholder="75"
                                           min="0"
                                           step="0.01"
                                           required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="mileageRate">
                                    <span class="label-text">Mileage Rate</span>
                                    <span class="label-help">Per mile after free</span>
                                </label>
                                <div class="input-with-prefix">
                                    <span class="input-prefix">$</span>
                                    <input type="number" 
                                           id="mileageRate" 
                                           name="mileageRate"
                                           class="form-input"
                                           placeholder="0.67"
                                           min="0"
                                           step="0.01"
                                           required>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="freeMileage">
                                    <span class="label-text">Free Mileage</span>
                                    <span class="label-help">Roundtrip miles included</span>
                                </label>
                                <div class="input-with-suffix">
                                    <input type="number" 
                                           id="freeMileage" 
                                           name="freeMileage"
                                           class="form-input"
                                           placeholder="60"
                                           min="0"
                                           required>
                                    <span class="input-suffix">miles</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="timeExpenseRate">
                                    <span class="label-text">Time/Expense Rate</span>
                                    <span class="label-help">Optional hourly rate</span>
                                </label>
                                <div class="input-with-prefix">
                                    <span class="input-prefix">$</span>
                                    <input type="number" 
                                           id="timeExpenseRate" 
                                           name="timeExpenseRate"
                                           class="form-input"
                                           placeholder="45"
                                           min="0"
                                           step="0.01">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Schedule Section -->
                    <div class="form-section">
                        <h4 class="section-title">📅 Payment Schedule</h4>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="paymentSchedule">Payment Frequency</label>
                                <select id="paymentSchedule" name="paymentSchedule" class="form-select" required>
                                    <option value="">Select frequency...</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Bi-weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="paymentDay">Payment Day</label>
                                <select id="paymentDay" name="paymentDay" class="form-select" required>
                                    <option value="">Select day...</option>
                                    <!-- Options populated dynamically based on schedule -->
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Billing Example -->
                    <div class="billing-example" id="billingExample">
                        <h5>📊 Billing Example</h5>
                        <div class="example-calculation">
                            <!-- Example populated dynamically -->
                        </div>
                    </div>
                </form>

                <div class="setup-actions">
                    <button class="setup-btn secondary" data-action="previous-firm" ${this.currentFirmIndex === 0 ? 'disabled' : ''}>
                        ← Previous
                    </button>
                    <button class="setup-btn primary" data-action="${isLast ? 'complete-setup' : 'next-firm'}">
                        ${isLast ? '✅ Complete Setup' : 'Next Firm →'}
                    </button>
                </div>
            </div>
        `;

        this.bindFormEvents();
        this.updatePaymentDayOptions();
        this.updateBillingExample();
    }

    bindIntroEvents() {
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'start-quick-setup':
                    this.startQuickSetup();
                    break;
                case 'start-full-setup':
                    this.startFullSetup();
                    break;
                case 'skip-setup':
                    this.skipSetup();
                    break;
                case 'close-modal':
                    this.hideOverlay();
                    break;
            }
        });
    }

    bindListBuilderEvents() {
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const firmName = e.target.dataset.firm;
            
            switch (action) {
                case 'add-firm':
                    this.addFirmToList();
                    break;
                case 'back-to-intro':
                    this.showFirmSetupIntro();
                    break;
                case 'configure-firms':
                    this.proceedToConfiguration();
                    break;
                case 'remove-firm':
                    this.removeFirmFromList(e.target.dataset.index);
                    break;
                case 'close-modal':
                    this.hideOverlay();
                    break;
            }
            
            if (firmName) {
                this.addCommonFirm(firmName);
            }
        });

        // Handle Enter key in firm input
        const firmInput = this.container.querySelector('#firmNameInput');
        firmInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addFirmToList();
            }
        });
    }

    bindFormEvents() {
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'previous-firm':
                    this.previousFirm();
                    break;
                case 'next-firm':
                    this.nextFirm();
                    break;
                case 'complete-setup':
                    this.completeFirmSetup();
                    break;
                case 'close-modal':
                    this.hideOverlay();
                    break;
            }
        });

        // Form change handlers
        const form = this.container.querySelector('#firmConfigForm');
        form.addEventListener('change', () => {
            this.updateBillingExample();
        });

        form.addEventListener('input', () => {
            this.updateBillingExample();
        });

        // Payment schedule change handler
        const paymentScheduleSelect = this.container.querySelector('#paymentSchedule');
        paymentScheduleSelect.addEventListener('change', () => {
            this.updatePaymentDayOptions();
        });
    }

    addFirmToList() {
        const firmInput = this.container.querySelector('#firmNameInput');
        const firmName = firmInput.value.trim();
        
        if (!firmName) return;
        
        // Check for duplicates
        if (this.firmsToSetup.some(firm => firm.name.toLowerCase() === firmName.toLowerCase())) {
            this.showNotification('Firm already added', 'warning');
            return;
        }
        
        this.firmsToSetup.push({ name: firmName, isQuickSetup: false });
        firmInput.value = '';
        
        this.updateFirmsList();
        this.updateConfigureButton();
    }

    addCommonFirm(firmName) {
        if (this.firmsToSetup.some(firm => firm.name.toLowerCase() === firmName.toLowerCase())) {
            this.showNotification('Firm already added', 'warning');
            return;
        }
        
        this.firmsToSetup.push({ name: firmName, isQuickSetup: false });
        this.updateFirmsList();
        this.updateConfigureButton();
    }

    removeFirmFromList(index) {
        this.firmsToSetup.splice(index, 1);
        this.updateFirmsList();
        this.updateConfigureButton();
    }

    updateFirmsList() {
        const container = this.container.querySelector('#firmsContainer');
        
        if (this.firmsToSetup.length === 0) {
            container.innerHTML = '<div class="empty-firms">No firms added yet</div>';
            return;
        }
        
        container.innerHTML = this.firmsToSetup.map((firm, index) => `
            <div class="firm-list-item">
                <span class="firm-name">${firm.name}</span>
                <button class="remove-firm-btn" data-action="remove-firm" data-index="${index}">
                    ×
                </button>
            </div>
        `).join('');
    }

    updateConfigureButton() {
        const button = this.container.querySelector('#configureFirmsBtn');
        button.disabled = this.firmsToSetup.length === 0;
    }

    proceedToConfiguration() {
        this.currentFirmIndex = 0;
        this.showFirmConfigurationForm();
    }

    updatePaymentDayOptions() {
        const scheduleSelect = this.container.querySelector('#paymentSchedule');
        const daySelect = this.container.querySelector('#paymentDay');
        const schedule = scheduleSelect.value;
        
        daySelect.innerHTML = '<option value="">Select day...</option>';
        
        if (schedule === 'weekly' || schedule === 'bi-weekly') {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            days.forEach(day => {
                daySelect.innerHTML += `<option value="${day}">${day}</option>`;
            });
        } else if (schedule === 'monthly') {
            for (let i = 1; i <= 31; i++) {
                const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
                daySelect.innerHTML += `<option value="${i}">${i}${suffix}</option>`;
            }
        }
    }

    updateBillingExample() {
        const form = this.container.querySelector('#firmConfigForm');
        const formData = new FormData(form);
        
        const fileRate = parseFloat(formData.get('fileRate')) || 0;
        const mileageRate = parseFloat(formData.get('mileageRate')) || 0;
        const freeMileage = parseInt(formData.get('freeMileage')) || 0;
        
        const exampleContainer = this.container.querySelector('.example-calculation');
        
        if (fileRate === 0 && mileageRate === 0) {
            exampleContainer.innerHTML = '<div class="example-placeholder">Enter rates to see example</div>';
            return;
        }
        
        // Example calculation: 2 jobs, 85 miles total
        const exampleJobs = 2;
        const exampleMiles = 85;
        const billableMiles = Math.max(0, exampleMiles - freeMileage);
        const jobEarnings = exampleJobs * fileRate;
        const mileageEarnings = billableMiles * mileageRate;
        const totalEarnings = jobEarnings + mileageEarnings;
        
        exampleContainer.innerHTML = `
            <div class="example-scenario">
                <strong>Example:</strong> ${exampleJobs} jobs, ${exampleMiles} total miles
            </div>
            <div class="calculation-breakdown">
                <div class="calc-line">
                    <span>Jobs: ${exampleJobs} × $${fileRate}</span>
                    <span>= $${jobEarnings.toFixed(2)}</span>
                </div>
                <div class="calc-line">
                    <span>Mileage: ${billableMiles} miles × $${mileageRate}</span>
                    <span>= $${mileageEarnings.toFixed(2)}</span>
                </div>
                <div class="calc-total">
                    <span><strong>Total Earnings:</strong></span>
                    <span><strong>$${totalEarnings.toFixed(2)}</strong></span>
                </div>
            </div>
        `;
    }

    nextFirm() {
        if (this.saveFirmConfiguration()) {
            this.currentFirmIndex++;
            this.showFirmConfigurationForm();
        }
    }

    previousFirm() {
        this.currentFirmIndex--;
        this.showFirmConfigurationForm();
    }

    async completeFirmSetup() {
        if (this.saveFirmConfiguration()) {
            try {
                // Save all firm configurations
                await this.saveAllConfigurations();
                
                this.showSetupComplete();
            } catch (error) {
                console.error('Error completing firm setup:', error);
                this.showNotification('Error saving configurations', 'error');
            }
        }
    }

    saveFirmConfiguration() {
        const form = this.container.querySelector('#firmConfigForm');
        const formData = new FormData(form);
        
        // Validate required fields
        const requiredFields = ['firmName', 'fileRate', 'mileageRate', 'freeMileage', 'paymentSchedule', 'paymentDay'];
        for (const field of requiredFields) {
            if (!formData.get(field)) {
                this.showNotification(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                return false;
            }
        }
        
        // Save to current firm
        const currentFirm = this.firmsToSetup[this.currentFirmIndex];
        currentFirm.config = {
            name: formData.get('firmName'),
            fileRate: parseFloat(formData.get('fileRate')),
            mileageRate: parseFloat(formData.get('mileageRate')),
            freeMileage: parseInt(formData.get('freeMileage')),
            timeExpenseRate: parseFloat(formData.get('timeExpenseRate')) || 0,
            paymentSchedule: formData.get('paymentSchedule'),
            paymentDay: formData.get('paymentDay'),
            contactInfo: null
        };
        
        return true;
    }

    async saveAllConfigurations() {
        for (const firm of this.firmsToSetup) {
            if (firm.config) {
                await this.jobBillingService.addFirmConfig(firm.config);
            }
        }
        
        // Trigger event for other components
        window.dispatchEvent(new CustomEvent('firms:configured', {
            detail: { firms: this.firmsToSetup.length }
        }));
    }

    showSetupComplete() {
        this.container.innerHTML = `
            <div class="setup-complete">
                <div class="completion-icon">✅</div>
                <h2>Firm Setup Complete!</h2>
                <p class="completion-message">
                    Successfully configured ${this.firmsToSetup.length} firms for billing tracking
                </p>
                
                <div class="completion-summary">
                    <h4>What's Next:</h4>
                    <ul>
                        <li>📱 Add jobs in the Jobs tab</li>
                        <li>🚗 Automatic mileage calculation</li>
                        <li>📊 View earnings in Analytics</li>
                        <li>📅 Track payments in Billing Calendar</li>
                    </ul>
                </div>
                
                <div class="completion-actions">
                    <button class="setup-btn primary" data-action="go-to-dashboard">
                        🏠 Go to Dashboard
                    </button>
                </div>
            </div>
        `;
        
        this.container.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'go-to-dashboard') {
                this.redirectToDashboard();
            }
        });
    }

    skipSetup() {
        this.redirectToDashboard();
    }

    redirectToDashboard() {
        this.hideOverlay();
        
        // Redirect to main dashboard
        window.location.href = 'dashboard.html';
    }

    showFirmSetup() {
        this.isPostOnboarding = false;
        this.createOverlayContainer();
        this.showFirmSetupIntro({ userCipher: { network: { firmCount: 1 } } });
    }

    createOverlayContainer() {
        if (this.container) {
            this.container.remove();
        }
        
        this.container = document.createElement('div');
        this.container.className = 'firm-setup-overlay';
        this.container.innerHTML = `
            <div class="overlay-backdrop"></div>
            <div class="overlay-content">
                <!-- Content will be populated -->
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Add backdrop click handler
        const backdrop = this.container.querySelector('.overlay-backdrop');
        backdrop.addEventListener('click', () => {
            this.hideOverlay();
        });
        
        // Update container reference to content area
        this.container = this.container.querySelector('.overlay-content');
    }

    showOverlay() {
        const overlay = document.querySelector('.firm-setup-overlay');
        if (overlay) {
            overlay.classList.add('visible');
        }
    }

    hideOverlay() {
        const overlay = document.querySelector('.firm-setup-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10001'
        });

        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Export for use in other modules
window.FirmConfiguration = FirmConfiguration;