/**
 * Firms Directory Manager
 * Handles the display and interaction with the comprehensive firm database
 */

class FirmsDirectory {
    constructor() {
        this.currentCategory = 'nationwide-daily';
        this.searchTerm = '';
        this.filters = {
            coverage: '',
            service: ''
        };
        
        // Billing firms search and filters
        this.billingSearchTerm = '';
        this.billingFilters = {
            schedule: '',
            rate: ''
        };
        
        this.firmData = this.loadFirmData();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderFirmsTable();
        this.loadBillingFirmsDisplay();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.directory-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchCategory(e.target.dataset.category);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('firmSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderFirmsTable();
            });
        }

        // Add New Firm Form Event Listeners
        this.setupAddFirmEventListeners();

        // Filter functionality
        const coverageFilter = document.getElementById('coverageFilter');
        const serviceFilter = document.getElementById('serviceFilter');
        
        if (coverageFilter) {
            coverageFilter.addEventListener('change', (e) => {
                this.filters.coverage = e.target.value;
                this.renderFirmsTable();
            });
        }

        if (serviceFilter) {
            serviceFilter.addEventListener('change', (e) => {
                this.filters.service = e.target.value;
                this.renderFirmsTable();
            });
        }

        // Billing firm search functionality
        const billingSearch = document.getElementById('billingFirmSearch');
        if (billingSearch) {
            billingSearch.addEventListener('input', (e) => {
                this.billingSearchTerm = e.target.value.toLowerCase();
                this.displayBillingFirms();
            });
        }

        // Billing firm filters
        const scheduleFilter = document.getElementById('paymentScheduleFilter');
        const rateFilter = document.getElementById('rateRangeFilter');
        
        if (scheduleFilter) {
            scheduleFilter.addEventListener('change', (e) => {
                this.billingFilters.schedule = e.target.value;
                this.displayBillingFirms();
            });
        }

        if (rateFilter) {
            rateFilter.addEventListener('change', (e) => {
                this.billingFilters.rate = e.target.value;
                this.displayBillingFirms();
            });
        }
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // Update active tab
        document.querySelectorAll('.directory-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.renderFirmsTable();
    }

    renderFirmsTable() {
        const container = document.getElementById('firmsTableContainer');
        if (!container) return;

        const firms = this.getFilteredFirms();
        
        if (firms.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h4>No firms found</h4>
                    <p>Try adjusting your search terms or filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="firms-table">
                <div class="table-header">
                    <div class="header-cell">Company</div>
                    <div class="header-cell">Services</div>
                    <div class="header-cell">Coverage Area</div>
                    <div class="header-cell">Contact</div>
                    <div class="header-cell">Actions</div>
                </div>
                <div class="table-body">
                    ${firms.map(firm => this.renderFirmRow(firm)).join('')}
                </div>
            </div>
        `;
    }

    renderFirmRow(firm) {
        const favorites = JSON.parse(localStorage.getItem('favoriteFirms') || '[]');
        const isFavorited = favorites.includes(firm.name);
        
        return `
            <div class="table-row" data-firm="${firm.name}">
                <div class="table-cell firm-name-cell">
                    <div class="firm-name">${firm.name}</div>
                    ${firm.website ? `<div class="firm-website"><a href="${firm.website}" target="_blank">${this.getDomainName(firm.website)}</a></div>` : ''}
                </div>
                <div class="table-cell services-cell">
                    ${firm.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
                </div>
                <div class="table-cell coverage-cell">
                    <span class="coverage-badge ${firm.coverageType}">${firm.coverage}</span>
                </div>
                <div class="table-cell contact-cell">
                    ${firm.email ? `
                        <button class="contact-btn email-btn" onclick="window.open('mailto:${firm.email}', '_blank')" title="Email ${firm.name}">
                            📧
                        </button>
                    ` : ''}
                    ${firm.website ? `
                        <button class="contact-btn website-btn" onclick="window.open('${firm.website}', '_blank')" title="Visit Website">
                            🌐
                        </button>
                    ` : ''}
                </div>
                <div class="table-cell actions-cell">
                    <button class="action-btn primary compact" onclick="firmsDirectory.addToBilling('${firm.name}')">
                        💰 Add to Billing
                    </button>
                    <button class="action-btn secondary compact favorite-btn ${isFavorited ? 'favorited' : ''}" onclick="firmsDirectory.saveToFavorites('${firm.name}')">
                        ${isFavorited ? '⭐ Saved' : '☆ Save'}
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredFirms() {
        let firms = this.firmData[this.currentCategory] || [];

        // Apply search filter
        if (this.searchTerm) {
            firms = firms.filter(firm => 
                firm.name.toLowerCase().includes(this.searchTerm) ||
                firm.coverage.toLowerCase().includes(this.searchTerm) ||
                firm.services.some(service => service.toLowerCase().includes(this.searchTerm))
            );
        }

        // Apply coverage filter
        if (this.filters.coverage) {
            firms = firms.filter(firm => firm.coverageType === this.filters.coverage);
        }

        // Apply service filter
        if (this.filters.service) {
            firms = firms.filter(firm => 
                firm.services.some(service => 
                    service.toLowerCase().includes(this.filters.service.replace('-', ' '))
                )
            );
        }

        // Sort alphabetically by firm name
        firms.sort((a, b) => a.name.localeCompare(b.name));

        return firms;
    }

    getDomainName(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        }
    }

    addToBilling(firmName) {
        const firmData = this.findFirmByName(firmName);
        if (!firmData) {
            this.showNotification('Firm not found', 'error');
            return;
        }
        
        this.showBillingModal(firmData);
    }

    saveToFavorites(firmName) {
        try {
            let favorites = JSON.parse(localStorage.getItem('favoriteFirms') || '[]');
            if (!favorites.includes(firmName)) {
                favorites.push(firmName);
                localStorage.setItem('favoriteFirms', JSON.stringify(favorites));
                this.showNotification(`${firmName} saved to favorites`, 'success');
                
                // Update the button to show it's favorited
                this.updateFavoriteButton(firmName, true);
            } else {
                // Remove from favorites
                favorites = favorites.filter(name => name !== firmName);
                localStorage.setItem('favoriteFirms', JSON.stringify(favorites));
                this.showNotification(`${firmName} removed from favorites`, 'info');
                
                // Update the button to show it's not favorited
                this.updateFavoriteButton(firmName, false);
            }
        } catch (error) {
            console.error('Error managing favorites:', error);
            this.showNotification('Error saving to favorites', 'error');
        }
    }

    findFirmByName(firmName) {
        for (const category in this.firmData) {
            const firm = this.firmData[category].find(f => f.name === firmName);
            if (firm) return firm;
        }
        return null;
    }

    updateFavoriteButton(firmName, isFavorited) {
        const row = document.querySelector(`[data-firm="${firmName}"]`);
        if (row) {
            const favoriteBtn = row.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.innerHTML = isFavorited ? '⭐ Saved' : '☆ Save';
                favoriteBtn.classList.toggle('favorited', isFavorited);
            }
        }
    }

    showBillingModal(firmData) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'billing-modal-overlay';
        modal.innerHTML = `
            <div class="billing-modal">
                <div class="modal-header">
                    <h3>💰 Add ${firmData.name} to Billing</h3>
                    <button class="modal-close" onclick="this.closest('.billing-modal-overlay').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <form id="billingForm" class="billing-form">
                        <div class="form-section">
                            <h4>Firm Information</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Firm Name</label>
                                    <input type="text" name="firmName" value="${firmData.name}" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Display Name (Optional)</label>
                                    <input type="text" name="displayName" placeholder="Custom name for your records">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4>Billing Rates</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>File Rate ($)</label>
                                    <input type="number" name="fileRate" placeholder="150" step="0.01" required>
                                </div>
                                <div class="form-group">
                                    <label>Mileage Rate ($/mile)</label>
                                    <input type="number" name="mileageRate" placeholder="0.67" step="0.01" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Free Mileage (miles)</label>
                                    <input type="number" name="freeMileage" placeholder="25" required>
                                </div>
                                <div class="form-group">
                                    <label>Time/Expense Rate ($/hour)</label>
                                    <input type="number" name="timeExpenseRate" placeholder="75" step="0.01">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4>Payment Terms</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Payment Schedule</label>
                                    <select name="paymentSchedule" required>
                                        <option value="">Select schedule</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="bi-weekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Payment Method</label>
                                    <select name="paymentMethod">
                                        <option value="direct-deposit">Direct Deposit</option>
                                        <option value="check">Check</option>
                                        <option value="wire">Wire Transfer</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4>Contact Information</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Billing Contact Email</label>
                                    <input type="email" name="billingEmail" value="${firmData.email || ''}" placeholder="billing@firm.com">
                                </div>
                                <div class="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phone" placeholder="(555) 123-4567">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4>Additional Settings</h4>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="autoInvoice">
                                    <span class="checkbox-custom"></span>
                                    Automatically generate invoices
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="trackExpenses">
                                    <span class="checkbox-custom"></span>
                                    Track additional expenses
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="cipher-btn cipher-btn--secondary" onclick="this.closest('.billing-modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" class="cipher-btn cipher-btn--primary" onclick="firmsDirectory.submitBillingForm()">
                        💰 Add to Billing Firms
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Focus first input
        const firstInput = modal.querySelector('input[name="fileRate"]');
        if (firstInput) firstInput.focus();
    }

    submitBillingForm() {
        const form = document.getElementById('billingForm');
        const formData = new FormData(form);
        
        // Validate required fields
        const requiredFields = ['firmName', 'fileRate', 'mileageRate', 'freeMileage', 'paymentSchedule'];
        const missingFields = requiredFields.filter(field => !formData.get(field));
        
        if (missingFields.length > 0) {
            this.showNotification(`Please fill in: ${missingFields.join(', ')}`, 'error');
            return;
        }

        // Create billing configuration object in JobBillingService format
        const billingConfig = {
            name: formData.get('firmName'),
            fileRate: formData.get('fileRate'),
            mileageRate: formData.get('mileageRate'),
            freeMileage: formData.get('freeMileage'),
            timeExpenseRate: formData.get('timeExpenseRate') || 0,
            paymentSchedule: formData.get('paymentSchedule'),
            paymentDay: this.getPaymentDay(formData.get('paymentSchedule')),
            contactInfo: {
                email: formData.get('billingEmail'),
                phone: formData.get('phone'),
                paymentMethod: formData.get('paymentMethod') || 'direct-deposit'
            }
        };

        // Save to billing firms
        this.saveToBillingFirms(billingConfig);
        
        // Close modal
        document.querySelector('.billing-modal-overlay').remove();
        
        // Show success notification
        this.showNotification(`${billingConfig.name} added to your billing firms!`, 'success');
        
        // Refresh billing firms display if on page
        this.refreshBillingFirmsDisplay();
    }

    saveToBillingFirms(billingConfig) {
        try {
            // Primary integration with job billing service
            if (window.masterInterface && window.masterInterface.jobBillingService) {
                const success = window.masterInterface.jobBillingService.addFirmConfig(billingConfig);
                if (!success) {
                    this.showNotification('Error adding firm to billing service', 'error');
                    return;
                }
                console.log('✅ Firm added to JobBillingService successfully');
            } else {
                // Fallback to localStorage if service not available
                let billingFirms = JSON.parse(localStorage.getItem('billingFirms') || '[]');
                
                // Check if firm already exists
                const existingIndex = billingFirms.findIndex(firm => firm.name === billingConfig.name);
                
                if (existingIndex >= 0) {
                    // Update existing firm
                    billingFirms[existingIndex] = billingConfig;
                } else {
                    // Add new firm
                    billingFirms.push(billingConfig);
                }
                
                localStorage.setItem('billingFirms', JSON.stringify(billingFirms));
                console.log('📝 Firm saved to localStorage fallback');
            }
            
        } catch (error) {
            console.error('Error saving billing firm:', error);
            this.showNotification('Error saving billing configuration', 'error');
        }
    }

    loadBillingFirmsDisplay() {
        // Load billing firms when page initializes
        try {
            if (window.masterInterface && window.masterInterface.loadBillingFirms) {
                window.masterInterface.loadBillingFirms();
                console.log('📊 Billing firms display loaded on page init');
            } else if (window.masterInterface && window.masterInterface.jobBillingService) {
                // Fallback: directly load from service if loadBillingFirms isn't available
                this.displayBillingFirms();
            } else {
                console.log('⚠️ Master interface not available for billing firms display');
            }
        } catch (error) {
            console.error('Error loading billing firms display:', error);
        }
    }

    refreshBillingFirmsDisplay() {
        // Trigger refresh of billing firms section if master interface is available
        try {
            if (window.masterInterface && window.masterInterface.loadBillingFirms) {
                window.masterInterface.loadBillingFirms();
                console.log('🔄 Billing firms display refreshed');
            } else {
                console.log('⚠️ Master interface not available for refresh');
            }
        } catch (error) {
            console.error('Error refreshing billing firms display:', error);
        }
    }

    displayBillingFirms() {
        // Direct method to display billing firms if master interface loadBillingFirms isn't available
        const container = document.getElementById('billingFirmsContainer');
        if (!container) return;

        try {
            const allFirmConfigs = window.masterInterface.jobBillingService.getAllFirmConfigs();
            const firmConfigs = this.filterBillingFirms(allFirmConfigs);
            
            if (firmConfigs.length === 0) {
                container.innerHTML = `
                    <div class="empty-billing-firms">
                        <div class="empty-icon">💰</div>
                        <h4>No Billing Firms Configured</h4>
                        <p>Add your first billing firm to start tracking earnings</p>
                        <button class="cipher-btn cipher-btn--primary" onclick="document.querySelector('[data-category=\\"nationwide-daily\\"]').click()">
                            Browse Firms Directory
                        </button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="firms-table">
                    <div class="table-header">
                        <div class="header-cell">Company</div>
                        <div class="header-cell">File Rate</div>
                        <div class="header-cell">Payment Schedule</div>
                        <div class="header-cell">Mileage</div>
                        <div class="header-cell">Actions</div>
                    </div>
                    <div class="table-body">
                        ${firmConfigs.map(firm => this.renderBillingFirmRow(firm)).join('')}
                    </div>
                </div>
            `;
            
            console.log(`💰 Displayed ${firmConfigs.length} billing firms`);
            
        } catch (error) {
            console.error('Error displaying billing firms:', error);
            container.innerHTML = `
                <div class="empty-billing-firms">
                    <div class="empty-icon">⚠️</div>
                    <h4>Error Loading Billing Firms</h4>
                    <p>Please refresh the page to try again</p>
                </div>
            `;
        }
    }

    renderBillingFirmRow(firm) {
        return `
            <div class="table-row" data-firm="${firm.name}">
                <div class="table-cell firm-name-cell">
                    <div class="firm-name">${firm.name}</div>
                    ${firm.contactInfo && firm.contactInfo.email ? `<div class="firm-website"><a href="mailto:${firm.contactInfo.email}">${firm.contactInfo.email}</a></div>` : ''}
                </div>
                <div class="table-cell services-cell">
                    <span class="service-tag">$${firm.fileRate}</span>
                </div>
                <div class="table-cell coverage-cell">
                    <span class="coverage-badge ${firm.paymentSchedule}">${this.formatPaymentSchedule(firm.paymentSchedule)}</span>
                </div>
                <div class="table-cell contact-cell">
                    $${firm.mileageRate}/mi after ${firm.freeMileage}mi
                </div>
                <div class="table-cell actions-cell">
                    <button class="action-btn primary compact" onclick="firmsDirectory.editBillingFirm('${firm.name}')">
                        ✏️ Edit
                    </button>
                    <button class="action-btn secondary compact" onclick="firmsDirectory.removeBillingFirm('${firm.name}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    filterBillingFirms(firms) {
        let filteredFirms = [...firms];

        // Apply search filter
        if (this.billingSearchTerm) {
            filteredFirms = filteredFirms.filter(firm => 
                firm.name.toLowerCase().includes(this.billingSearchTerm) ||
                (firm.contactInfo && firm.contactInfo.email && 
                 firm.contactInfo.email.toLowerCase().includes(this.billingSearchTerm))
            );
        }

        // Apply payment schedule filter
        if (this.billingFilters.schedule) {
            filteredFirms = filteredFirms.filter(firm => 
                firm.paymentSchedule === this.billingFilters.schedule
            );
        }

        // Apply rate range filter
        if (this.billingFilters.rate) {
            filteredFirms = filteredFirms.filter(firm => {
                const rate = parseFloat(firm.fileRate);
                switch (this.billingFilters.rate) {
                    case 'low': return rate <= 200;
                    case 'medium': return rate > 200 && rate <= 500;
                    case 'high': return rate > 500;
                    default: return true;
                }
            });
        }

        // Sort by firm name
        filteredFirms.sort((a, b) => a.name.localeCompare(b.name));

        return filteredFirms;
    }

    formatPaymentSchedule(schedule) {
        const schedules = {
            'weekly': 'Weekly',
            'bi-weekly': 'Bi-weekly',
            'monthly': 'Monthly'
        };
        return schedules[schedule] || schedule;
    }

    editBillingFirm(firmName) {
        console.log(`✏️ Editing billing firm: ${firmName}`);
        // This could open the modal with pre-filled data
        this.showNotification('Edit functionality coming soon', 'info');
    }

    removeBillingFirm(firmName) {
        if (confirm(`Are you sure you want to delete the billing configuration for "${firmName}"?\n\nThis will remove all billing rates and payment schedules for this firm. This action cannot be undone.`)) {
            try {
                if (window.masterInterface && window.masterInterface.jobBillingService) {
                    const success = window.masterInterface.jobBillingService.deleteFirmConfig(firmName);
                    if (success) {
                        console.log(`🗑️ Billing firm removed: ${firmName}`);
                        this.showNotification(`${firmName} configuration deleted successfully`, 'success');
                        this.loadBillingFirmsDisplay();
                    } else {
                        this.showNotification('Failed to delete firm configuration', 'error');
                    }
                }
            } catch (error) {
                console.error('Error removing billing firm:', error);
                if (error.message.includes('associated job')) {
                    this.showNotification(error.message, 'error');
                } else {
                    this.showNotification('Error removing firm', 'error');
                }
            }
        }
    }


    getPaymentDay(paymentSchedule) {
        // Default payment days based on schedule
        const defaultDays = {
            'weekly': 'Friday',
            'bi-weekly': 'Friday', 
            'monthly': '31' // End of month
        };
        return defaultDays[paymentSchedule] || 'Friday';
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `firms-notification ${type}`;
        
        const icons = {
            'success': '✅',
            'error': '❌',
            'info': 'ℹ️'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after duration based on type
        const duration = type === 'error' ? 5000 : 3000;
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // Add New Firm Form Event Listeners
    setupAddFirmEventListeners() {
        // Save Firm Button
        const saveFirmBtn = document.getElementById('saveFirmBtn');
        if (saveFirmBtn) {
            saveFirmBtn.addEventListener('click', () => {
                this.saveFirmToDirectory();
            });
        }

        // Clear Form Button
        const clearFormBtn = document.getElementById('clearFormBtn');
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', () => {
                this.clearAddFirmForm();
            });
        }

        // Billing Firms Search
        const billingSearchInput = document.getElementById('billingFirmSearch');
        if (billingSearchInput) {
            billingSearchInput.addEventListener('input', (e) => {
                this.billingSearchTerm = e.target.value.toLowerCase();
                this.loadBillingFirmsDisplay();
            });
        }

        // Billing Firms Filter
        const paymentScheduleFilter = document.getElementById('paymentScheduleFilter');
        if (paymentScheduleFilter) {
            paymentScheduleFilter.addEventListener('change', (e) => {
                this.billingFilters.schedule = e.target.value;
                this.loadBillingFirmsDisplay();
            });
        }
    }

    // Save a firm to billing directory
    saveFirmToDirectory() {
        // Get form data
        const formData = {
            id: Date.now().toString(), // Simple ID generation
            name: document.getElementById('firmName')?.value?.trim() || '',
            type: document.getElementById('firmType')?.value || '',
            contactEmail: document.getElementById('contactEmail')?.value?.trim() || '',
            contactPhone: document.getElementById('contactPhone')?.value?.trim() || '',
            rates: {
                daily: parseFloat(document.getElementById('dailyRate')?.value) || 0,
                catastrophic: parseFloat(document.getElementById('catRate')?.value) || 0,
                heavy: parseFloat(document.getElementById('heavyRate')?.value) || 0,
                mileage: parseFloat(document.getElementById('mileageRate')?.value) || 0
            },
            paymentSchedule: document.getElementById('paymentSchedule')?.value || '',
            paymentMethod: document.getElementById('paymentMethod')?.value || '',
            dateAdded: new Date().toISOString()
        };

        // Validate required fields
        if (!formData.name) {
            this.showNotification('Please enter a firm name', 'error');
            return;
        }

        // Get existing billing firms
        let billingFirms = JSON.parse(localStorage.getItem('billingFirms') || '[]');

        // Check for duplicates
        if (billingFirms.some(firm => firm.name.toLowerCase() === formData.name.toLowerCase())) {
            this.showNotification('A firm with this name already exists', 'error');
            return;
        }

        // Add new firm
        billingFirms.push(formData);

        // Save to localStorage
        localStorage.setItem('billingFirms', JSON.stringify(billingFirms));

        // Clear form and refresh display
        this.clearAddFirmForm();
        this.loadBillingFirmsDisplay();

        this.showNotification('Firm added successfully!', 'success');
    }

    // Clear the add firm form
    clearAddFirmForm() {
        const inputs = document.querySelectorAll('.add-firm-form input, .add-firm-form select');
        inputs.forEach(input => {
            if (input.type === 'number') {
                input.value = '';
            } else {
                input.value = '';
            }
        });
    }

    // Load and display billing firms
    loadBillingFirmsDisplay() {
        const container = document.getElementById('billingFirmsContainer');
        if (!container) return;

        let billingFirms = JSON.parse(localStorage.getItem('billingFirms') || '[]');
        
        // Ensure each firm has proper structure
        billingFirms = billingFirms.map(firm => ({
            ...firm,
            rates: firm.rates || { daily: 0, catastrophic: 0, heavy: 0, mileage: 0 },
            contactEmail: firm.contactEmail || '',
            contactPhone: firm.contactPhone || '',
            paymentSchedule: firm.paymentSchedule || '',
            paymentMethod: firm.paymentMethod || ''
        }));

        // Apply search and filters
        if (this.billingSearchTerm) {
            billingFirms = billingFirms.filter(firm => 
                firm.name.toLowerCase().includes(this.billingSearchTerm) ||
                firm.type.toLowerCase().includes(this.billingSearchTerm) ||
                firm.contactEmail.toLowerCase().includes(this.billingSearchTerm)
            );
        }

        if (this.billingFilters.schedule) {
            billingFirms = billingFirms.filter(firm => 
                firm.paymentSchedule === this.billingFilters.schedule
            );
        }

        if (billingFirms.length === 0) {
            container.innerHTML = `
                <div class="empty-directory">
                    <div class="empty-icon">🏢</div>
                    <h4>No firms ${this.billingSearchTerm || this.billingFilters.schedule ? 'match your criteria' : 'added yet'}</h4>
                    <p>${this.billingSearchTerm || this.billingFilters.schedule ? 'Try adjusting your search or filters' : 'Use the form above to add your first billing firm'}</p>
                </div>
            `;
            return;
        }

        // Render billing firms
        container.innerHTML = billingFirms.map(firm => this.renderBillingFirmItem(firm)).join('');

        // Add delete event listeners
        container.querySelectorAll('.delete-firm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const firmId = e.target.dataset.firmId;
                this.deleteBillingFirm(firmId);
            });
        });
    }

    // Render a billing firm item
    renderBillingFirmItem(firm) {
        return `
            <div class="billing-firm-item" data-firm-id="${firm.id}">
                <div class="billing-firm-header">
                    <div>
                        <h3 class="billing-firm-name">${firm.name}</h3>
                        <div class="billing-firm-type">${firm.type || 'Not specified'}</div>
                    </div>
                    <div class="billing-firm-actions">
                        <button class="delete-firm-btn" data-firm-id="${firm.id}" title="Delete this firm">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                
                <div class="billing-firm-details">
                    <div class="billing-detail-group">
                        <h6>Payment Schedule</h6>
                        <div class="billing-detail-value">${firm.paymentSchedule || 'Not set'}</div>
                    </div>
                    <div class="billing-detail-group">
                        <h6>Payment Method</h6>
                        <div class="billing-detail-value">${firm.paymentMethod || 'Not set'}</div>
                    </div>
                    <div class="billing-detail-group">
                        <h6>Daily Rate</h6>
                        <div class="billing-detail-value">$${(firm.rates?.daily || 0).toFixed(2)}</div>
                    </div>
                </div>
                
                ${firm.contactEmail || firm.contactPhone ? `
                <div class="billing-firm-contact">
                    ${firm.contactEmail ? `<div>📧 ${firm.contactEmail}</div>` : ''}
                    ${firm.contactPhone ? `<div>📞 ${firm.contactPhone}</div>` : ''}
                </div>
                ` : ''}
            </div>
        `;
    }

    // Delete a billing firm
    deleteBillingFirm(firmId) {
        if (!confirm('Are you sure you want to delete this firm? This action cannot be undone.')) {
            return;
        }

        let billingFirms = JSON.parse(localStorage.getItem('billingFirms') || '[]');
        billingFirms = billingFirms.filter(firm => firm.id !== firmId);
        
        localStorage.setItem('billingFirms', JSON.stringify(billingFirms));
        
        this.loadBillingFirmsDisplay();
        this.showNotification('Firm deleted successfully', 'success');
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create or get existing notification
        let notification = document.querySelector('.firms-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'firms-notification';
            document.body.appendChild(notification);
        }

        // Set content and type
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            ${message}
        `;
        notification.className = `firms-notification ${type}`;

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    loadFirmData() {
        return {
            'nationwide-daily': [
                {
                    name: 'AutoClaims Direct (ACD)',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://acdcorp.com',
                    email: 'Network@acdcorp.com'
                },
                {
                    name: 'SCA Claims',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.sca-appraisal.com',
                    email: 'sgallant@scaclaims.com'
                },
                {
                    name: 'Sedgwick (formerly Nationwide Appraisals)',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.sedgwick.com/autoappraisals',
                    email: 'Eilyn.Tomassini@sedgwick.com'
                },
                {
                    name: 'TheBest Claims Solutions',
                    services: ['Daily Auto', 'Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.thebestirs.com',
                    email: 'ken.wittich@thebestirs.com'
                },
                {
                    name: 'Claim Solution Inc.',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'http://www.claimsolution.com',
                    email: 'dmason@claimsolution.com'
                },
                {
                    name: 'Eberl',
                    services: ['Daily Auto', 'Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.eberls.com',
                    email: 'pmorris@eberls.com'
                },
                {
                    name: 'The Doan Group',
                    services: ['Daily Auto', 'Heavy Claims', 'Property'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'http://www.doan.com',
                    email: 'amanda.williams@doan.com'
                },
                {
                    name: 'QA Claims',
                    services: ['Daily Auto', 'Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.qaclaims.com',
                    email: 'ryan@qaclaims.com'
                },
                {
                    name: 'Primecoclaims Group',
                    services: ['Daily Auto', 'Property'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://primecoclaims.com',
                    email: 'eeubanks@primecoclaims.com'
                },
                {
                    name: 'DEKRA Services Inc.',
                    services: ['Daily Auto'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.dekra.us',
                    email: 'jeffrey.dickson@dekra.com'
                },
                {
                    name: 'Nexterra',
                    services: ['Daily Auto', 'Hail Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://nexterras.com',
                    email: 'jshaw@nexterras.com'
                },
                {
                    name: 'Franklin Insurance Adjusters',
                    services: ['Daily Auto', 'Property'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'http://www.fia.team',
                    email: 'sal@fia.team'
                },
                {
                    name: 'Mid-America Catastrophe Services',
                    services: ['Daily Auto', 'Property'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://midamcat.com',
                    email: 'phillip.piper@midamcat.com'
                },
                {
                    name: 'Legacy Claims Services',
                    services: ['Daily Auto'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://legacyclaimsservices.com',
                    email: 'mark@legacyclaimsservices.com'
                },
                {
                    name: 'Vehicle Inspection Solutions',
                    services: ['Daily Auto'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.visclaims.com',
                    email: 'info@visclaims.com'
                },
                {
                    name: 'Engle Martin and Associates',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.englemartin.com',
                    email: 'lmaddox@englemartin.com'
                },
                {
                    name: 'IAS Claims Group',
                    services: ['Daily Auto', 'Heavy Claims', 'Property'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.iasclaimsgroup.com',
                    email: 'ron.ragland@iasclaimsgroup.com'
                },
                {
                    name: 'Condition Now',
                    services: ['Daily Auto'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.conditionnow.com',
                    email: 'Tom.allen@conditionnow.com'
                },
                {
                    name: 'IASVS',
                    services: ['Daily Auto'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://iasvs.net',
                    email: 'n.largent@iasvs.net'
                },
                {
                    name: 'Personal Service Appraisal',
                    services: ['Daily Auto'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.psaclaims.com',
                    email: 'Blackburnclaimsllc@gmail.com'
                },
                {
                    name: 'IA Net',
                    services: ['Daily Auto'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://ianetwork.net',
                    email: 'faheem.bawa@ianetwork.net'
                },
                {
                    name: 'Crawford & Company',
                    services: ['Daily Auto', 'Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide/International',
                    coverageType: 'nationwide',
                    website: 'http://www.crawco.com',
                    email: 'christopher_smith@us.crawco.com'
                }
            ],
            'catastrophic': [
                {
                    name: 'Alacrity Solutions',
                    services: ['Daily Auto', 'Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.alacritysolutions.com',
                    email: 'Resourcemanagement@alacritysolutions.com'
                },
                {
                    name: 'U.S. Adjusting Services',
                    services: ['Daily Auto', 'Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.usadjustingservices.net',
                    email: 'nyoung@usadj.net'
                },
                {
                    name: 'CNC Catastrophe & National Claims',
                    services: ['Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://adjustingexpectations.com',
                    email: 'fernitadixon@cnc-resource.com'
                },
                {
                    name: 'SolutionWorks',
                    services: ['Catastrophic Auto', 'Hail Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://getsw.com',
                    email: 'jhastings@getsw.com'
                },
                {
                    name: '300 LLC',
                    services: ['Catastrophic Auto', 'Hail Claims'],
                    coverage: 'Nationwide (Colorado Focus)',
                    coverageType: 'nationwide',
                    website: 'http://the300advantage.com',
                    email: 'ryan@the300advantage.com'
                },
                {
                    name: 'Legion Claims Solutions',
                    services: ['Daily Auto', 'Property', 'Catastrophic', 'Desk Deployments'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.legionclaims.com',
                    email: 'info@legionclaims.com'
                },
                {
                    name: 'Hi-Tech PDR',
                    services: ['Catastrophic Auto', 'Hail Claims'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://hi-techdentremoval.com',
                    email: 'paul@hi-techpdr.com'
                },
                {
                    name: 'Anchor Claim Services',
                    services: ['Daily Auto', 'Catastrophic'],
                    coverage: 'Nationwide (Southeast Daily)',
                    coverageType: 'nationwide',
                    website: 'http://www.anchor-claims.com',
                    email: 'auto@anchorclaimservices.com'
                },
                {
                    name: 'Rocky Mountain CAT Corp.',
                    services: ['Catastrophic Auto', 'Property'],
                    coverage: 'Nationwide',
                    coverageType: 'nationwide',
                    website: 'https://www.rockymountaincat.com',
                    email: 'jimfarley@rockymountaincat.com'
                }
            ],
            'regional': [
                {
                    name: 'Complete Claims Service',
                    services: ['Daily Auto'],
                    coverage: 'East Coast (NY,NJ,PA,MD,VA,NC,SC,GA,FL,MS,AL,TN,MO)',
                    coverageType: 'regional',
                    website: 'https://www.completeclaims.com',
                    email: 'admin@completeclaims.com'
                },
                {
                    name: 'McAnally Appraisal Services',
                    services: ['Daily Auto'],
                    coverage: 'Texas & Georgia',
                    coverageType: 'regional',
                    website: 'https://masclaims.com',
                    email: 'sarahg@masclaims.com'
                },
                {
                    name: 'Rapid Appraisal Services',
                    services: ['Daily Auto'],
                    coverage: 'Texas, New Mexico, Louisiana',
                    coverageType: 'regional',
                    website: 'https://rasofhouston.com',
                    email: 'shawn.parsons@rasofhouston.com'
                },
                {
                    name: 'CGIA Solutions',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Texas',
                    coverageType: 'regional',
                    website: 'https://cgiasolutions.com',
                    email: 'chris@cgiasolutions.com'
                },
                {
                    name: 'S&S Appraisal Services',
                    services: ['Daily Auto'],
                    coverage: 'East Coast Area surrounding VA',
                    coverageType: 'regional',
                    email: 'ssassignments@hotmail.com'
                },
                {
                    name: 'Viking Auto Appraisal',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Massachusetts',
                    coverageType: 'regional',
                    email: 'PMcKeen@VikingAutoAppraisal.com'
                },
                {
                    name: 'Frontline Appraisals LLC',
                    services: ['Daily Auto'],
                    coverage: 'VA, WV, DC, MD, NC, OH, IN, KY, TN, PA, SC, MI, DE',
                    coverageType: 'regional',
                    website: 'https://frontlineadjusting.com',
                    email: 'dan.read@frontlineadjusting.com'
                },
                {
                    name: 'Cal West Appraisal Services',
                    services: ['Daily Auto'],
                    coverage: 'CA, OR, NV, AZ',
                    coverageType: 'regional',
                    website: 'http://www.calwestas.com',
                    email: 'Assignments@calwestas.com'
                },
                {
                    name: 'Quality Claim Services',
                    services: ['Daily Auto'],
                    coverage: 'NC, SC',
                    coverageType: 'regional',
                    website: 'http://qualityclaimservices.com',
                    email: 'carrie.byers@qualityclaims.net'
                },
                {
                    name: 'Quality Estimates',
                    services: ['Daily Auto'],
                    coverage: 'CA',
                    coverageType: 'regional',
                    website: 'https://www.qualityestimatesllc.com',
                    email: 'mpeters@Qestimates.com'
                },
                {
                    name: 'B&E Appraisal Service',
                    services: ['Daily Auto', 'Heavy Claims'],
                    coverage: 'Arizona',
                    coverageType: 'regional',
                    website: 'https://www.bandeappraisal.com',
                    email: 'rortega@bandeappraisal.com'
                },
                {
                    name: 'Professional Auto Appraisals',
                    services: ['Daily Auto'],
                    coverage: 'Alabama/Florida',
                    coverageType: 'regional',
                    email: 'jshuffordjrc2@gmail.com'
                },
                {
                    name: 'Autocraft Appraisal',
                    services: ['Daily Auto'],
                    coverage: 'Texas',
                    coverageType: 'regional',
                    email: 'dbarnett393@gmail.com'
                },
                {
                    name: 'SNB Appraisal Services',
                    services: ['Daily Auto'],
                    coverage: 'NY- Bronx, Westchester, Queens, Brooklyn, Long Island',
                    coverageType: 'regional',
                    email: 'snbappraisal@gmail.com'
                },
                {
                    name: 'Metro Appraisal Company',
                    services: ['Daily Auto'],
                    coverage: 'Entire Southeast',
                    coverageType: 'regional',
                    website: 'http://alvin@metroapprco.com',
                    email: 'alvin@metroapprco.com'
                },
                {
                    name: 'Accu-Fast Commercial Appraisals',
                    services: ['Daily Auto'],
                    coverage: 'Entire Southeast',
                    coverageType: 'regional',
                    website: 'https://accufastca.com',
                    email: 'accufast2@gmail.com'
                }
            ]
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.getAttribute('data-page') === 'firms') {
        try {
            window.firmsDirectory = new FirmsDirectory();
            console.log('✅ FirmsDirectory initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing FirmsDirectory:', error);
        }
    }
});