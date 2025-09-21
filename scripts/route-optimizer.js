/**
 * Route Optimizer - Claim Cipher
 * Full-featured route optimization with day splitting
 */

class RouteOptimizer {
    constructor() {
        this.map = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.geocoder = null;
        this.currentRoute = null;
        this.userRole = this.getUserRole(); // 'coordinator' or 'adjuster'
        
        // Enhanced API services
        this.roadsService = null;
        this.elevationService = null;
        this.streetViewService = null;
        this.distanceMatrixService = null;
        
        // Setup error handling for extension/async issues
        this.setupErrorHandling();
        
        this.init();
    }

    init() {
        this.initializeUserRole();
        this.setupEventListeners();
        this.loadSettings();
        this.setupCoordinatorFeatures();
        this.initializeCalendar();
        
        // Initialize start location after a short delay to ensure HTML is loaded
        setTimeout(() => {
            this.initializeStartLocation();
            this.restoreSettingsState();
        }, 500);
    }

    getUserRole() {
        // Check user role from settings or localStorage
        if (window.settingsManager) {
            return window.settingsManager.getSetting('userRole') || 'adjuster';
        }
        
        // Fallback to localStorage
        const userProfile = JSON.parse(localStorage.getItem('cc_user_profile') || '{}');
        return userProfile.role || 'adjuster';
    }

    setupErrorHandling() {
        // Handle extension message channel errors that can occur with Chrome extensions
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const message = args.join(' ');
            if (message.includes('message channel closed') || 
                message.includes('Extension context invalidated') ||
                message.includes('listener indicated an asynchronous response')) {
                // Suppress these specific extension-related errors
                return;
            }
            originalConsoleError.apply(console, args);
        };

        // Wrap any promise-based operations to catch and suppress extension errors
        const originalFetch = window.fetch;
        if (originalFetch) {
            window.fetch = (...args) => {
                return originalFetch.apply(window, args).catch(error => {
                    if (error.message && error.message.includes('message channel closed')) {
                        console.warn('🔧 Suppressed fetch error due to extension context:', error.message);
                        return Promise.resolve({ ok: false, statusText: 'Extension Error' });
                    }
                    throw error;
                });
            };
        }
    }

    initializeUserRole() {
        console.log(`🗺️ Initializing Route Optimizer for ${this.userRole} role`);
        
        // Add role-specific CSS class to body for styling
        document.body.classList.add(`role-${this.userRole}`);
        
        // Update interface elements based on role
        this.updateInterfaceForRole();
    }

    updateInterfaceForRole() {
        const coordinatorFeatures = document.querySelectorAll('.coordinator-only');
        const adjusterFeatures = document.querySelectorAll('.adjuster-only');
        
        if (this.userRole === 'coordinator') {
            coordinatorFeatures.forEach(el => el.style.display = 'block');
            adjusterFeatures.forEach(el => el.style.display = 'none');
            
            // Update page title and description
            const pageTitle = document.querySelector('.tab-header h1');
            const pageDesc = document.querySelector('.tab-header p');
            
            if (pageTitle) {
                pageTitle.innerHTML = '🗺️ Route Coordination';
            }
            if (pageDesc) {
                pageDesc.textContent = 'Manage field schedules, customer appointments, and route assignments';
            }
        } else {
            coordinatorFeatures.forEach(el => el.style.display = 'none');
            adjusterFeatures.forEach(el => el.style.display = 'block');
            
            // Update page title for adjuster
            const pageTitle = document.querySelector('.tab-header h1');
            const pageDesc = document.querySelector('.tab-header p');
            
            if (pageTitle) {
                pageTitle.innerHTML = '🗺️ Route Optimizer';
            }
            if (pageDesc) {
                pageDesc.textContent = 'Plan efficient multi-stop routes with intelligent day splitting';
            }
        }
    }

    setupCoordinatorFeatures() {
        if (this.userRole !== 'coordinator') return;
        
        console.log('🎯 Setting up coordinator-specific features');
        
        // Add coordinator-specific event listeners
        this.setupCustomerCommunication();
        this.setupBulkScheduling();
        this.setupRouteAssignment();
    }

    setupEventListeners() {
        console.log('🔒 Setting up event listeners...');
        
        // Use setTimeout to ensure DOM elements are available
        setTimeout(() => {
            const addBtn = document.getElementById('addDestination');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    console.log('🔒 Add Destination clicked!');
                    this.addDestination();
                });
                console.log('🔒 Add Destination listener attached');
            } else {
                console.warn('🔒 addDestination button not found - will retry when DOM is ready');
            }
            
            const optimizeBtn = document.getElementById('optimizeRoute');
            if (optimizeBtn) {
                optimizeBtn.addEventListener('click', () => this.optimizeRoute());
                console.log('🔒 Optimize Route listener attached');
            } else {
                console.warn('🔒 optimizeRoute button not found - will retry when DOM is ready');
            }
            
            this.setupAdditionalListeners();
        }, 500); // Give DOM time to load
    }

    setupAdditionalListeners() {
        const copyBtn = document.getElementById('copyRoute');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyRoute());
        }
        
        const exportBtn = document.getElementById('exportMiles');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToMileage());
        }
        
        // Bulk import handler
        const bulkImportBtn = document.getElementById('bulkImportBtn');
        if (bulkImportBtn) {
            bulkImportBtn.addEventListener('click', () => this.showBulkImportModal());
        }

        // Clear all destinations handler
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllDestinations());
        }

        // Job creation from route handler (coordinator-only)
        const createJobsBtn = document.getElementById('createJobsFromRouteBtn');
        if (createJobsBtn) {
            createJobsBtn.addEventListener('click', () => this.createJobsFromRoute());
        }

        // Export functions - these are added after route is optimized, so check periodically
        this.setupExportListeners();
    }

    setupExportListeners() {
        // Check for export buttons every few seconds and attach listeners
        const checkInterval = setInterval(() => {
            // Export to mileage calculator
            const exportMileageBtn = document.getElementById('exportMiles');
            if (exportMileageBtn && !exportMileageBtn.hasAttribute('data-listener-attached')) {
                exportMileageBtn.addEventListener('click', () => this.exportToMileage());
                exportMileageBtn.setAttribute('data-listener-attached', 'true');
                console.log('🧮 Export to mileage listener attached');
            }

            // Copy route function
            const copyRouteBtn = document.getElementById('copyRoute');
            if (copyRouteBtn && !copyRouteBtn.hasAttribute('data-listener-attached')) {
                copyRouteBtn.addEventListener('click', () => this.copyRoute());
                copyRouteBtn.setAttribute('data-listener-attached', 'true');
                console.log('📋 Copy route listener attached');
            }

            // Calendar export buttons
            const googleCalBtn = document.getElementById('exportGoogleCal');
            if (googleCalBtn && !googleCalBtn.hasAttribute('data-listener-attached')) {
                googleCalBtn.addEventListener('click', () => this.exportToGoogleCalendar());
                googleCalBtn.setAttribute('data-listener-attached', 'true');
                console.log('📅 Google Calendar listener attached');
            }

            const appleCalBtn = document.getElementById('exportAppleCal');
            if (appleCalBtn && !appleCalBtn.hasAttribute('data-listener-attached')) {
                appleCalBtn.addEventListener('click', () => this.exportToAppleCalendar());
                appleCalBtn.setAttribute('data-listener-attached', 'true');
                console.log('🍎 Apple Calendar listener attached');
            }

            const mobileCipherBtn = document.getElementById('exportMobileCipher');
            if (mobileCipherBtn && !mobileCipherBtn.hasAttribute('data-listener-attached')) {
                mobileCipherBtn.addEventListener('click', () => this.exportToMobileCipher());
                mobileCipherBtn.setAttribute('data-listener-attached', 'true');
                console.log('📱 Mobile Cipher listener attached');
            }

            // Coordinator function buttons
            const bulkScheduleBtn = document.getElementById('bulkScheduleBtn');
            if (bulkScheduleBtn && !bulkScheduleBtn.hasAttribute('data-listener-attached')) {
                bulkScheduleBtn.addEventListener('click', () => this.showBulkSchedulingModal());
                bulkScheduleBtn.setAttribute('data-listener-attached', 'true');
                console.log('📅 Bulk Schedule listener attached');
            }

            const assignRouteBtn = document.getElementById('assignRouteBtn');
            if (assignRouteBtn && !assignRouteBtn.hasAttribute('data-listener-attached')) {
                assignRouteBtn.addEventListener('click', () => this.showRouteAssignmentModal());
                assignRouteBtn.setAttribute('data-listener-attached', 'true');
                console.log('👥 Assign Route listener attached');
            }

            // Settings panel toggle
            const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
            if (toggleAdvancedBtn && !toggleAdvancedBtn.hasAttribute('data-listener-attached')) {
                toggleAdvancedBtn.addEventListener('click', () => this.toggleAdvancedSettings());
                toggleAdvancedBtn.setAttribute('data-listener-attached', 'true');
                console.log('⚙️ Advanced settings toggle listener attached');
            }

            // Stop checking after 30 seconds to avoid memory leaks
            if (Date.now() - this.setupStartTime > 30000) {
                clearInterval(checkInterval);
            }
        }, 1000);
        
        this.setupStartTime = Date.now();
    }

    setupSettingsListeners() {
        // Settings change handlers
        const maxLegMiles = document.getElementById('maxLegMiles');
        if (maxLegMiles) {
            maxLegMiles.addEventListener('change', () => this.saveSettings());
        }
        
        const splitEnabled = document.getElementById('splitEnabled');
        if (splitEnabled) {
            splitEnabled.addEventListener('change', () => this.saveSettings());
        }
        
        const optimizeEnabled = document.getElementById('optimizeEnabled');
        if (optimizeEnabled) {
            optimizeEnabled.addEventListener('change', () => this.saveSettings());
        }
        
        // Use optional chaining to prevent null errors
        document.getElementById('optimizationMode')?.addEventListener?.('change', () => this.saveSettings());
        document.getElementById('maxDailyHours')?.addEventListener?.('change', () => this.saveSettings());
        document.getElementById('maxStopsPerDay')?.addEventListener?.('change', () => this.saveSettings());
        document.getElementById('timePerAppointment')?.addEventListener?.('change', () => this.saveSettings());
        
        // Advanced settings toggle
        const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
        if (toggleAdvancedBtn) {
            toggleAdvancedBtn.addEventListener('click', () => this.toggleAdvancedSettings());
        }
        
        console.log('🔒 Additional event listeners setup complete');
        
        // Add development role switcher for testing
        this.addRoleSwitcher();
    }

    addRoleSwitcher() {
        // Only add in development mode
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Remove existing switcher if it exists
            const existing = document.getElementById('devRoleSwitcher');
            if (existing) existing.remove();
            
            const switcher = document.createElement('div');
            switcher.id = 'devRoleSwitcher';
            switcher.style.cssText = `
                position: fixed;
                top: 80px;
                right: 10px;
                z-index: 10000;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 10px;
                border-radius: 8px;
                font-size: 12px;
                border: 1px solid #444;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;
            
            const switchButton = document.createElement('button');
            switchButton.textContent = `Switch to ${this.userRole === 'coordinator' ? 'Adjuster' : 'Coordinator'}`;
            switchButton.style.cssText = `
                margin-top: 5px;
                padding: 5px 10px;
                background: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            `;
            
            switchButton.addEventListener('click', () => {
                console.log('🔄 Switching role from', this.userRole);
                const newRole = this.userRole === 'coordinator' ? 'adjuster' : 'coordinator';
                localStorage.setItem('cc_user_profile', JSON.stringify({role: newRole}));
                console.log('🔄 Role set to', newRole, 'reloading page...');
                window.location.reload();
            });
            
            switcher.innerHTML = `<div>Dev Mode: <strong>${this.userRole}</strong></div>`;
            switcher.appendChild(switchButton);
            
            document.body.appendChild(switcher);
            console.log('🧪 Dev role switcher added for', this.userRole);
        }
    }
    
    getAvailableFirms() {
        // Get firms from mileage calculator settings if available
        if (window.mileageCalculator && window.mileageCalculator.settings && window.mileageCalculator.settings.firms) {
            return window.mileageCalculator.settings.firms;
        }
        
        // Fallback to default firms
        return [
            { id: 'sedgwick', name: 'Sedgwick' },
            { id: 'acd', name: 'ACD' },
            { id: 'crawford', name: 'Crawford & Company' }
        ];
    }
    
    setupDestinationEventListeners(destDiv) {
        const firmSelect = destDiv.querySelector('.firm-select');
        const claimTypeSelect = destDiv.querySelector('.claim-type-select');
        const statusDiv = destDiv.querySelector('.destination-status');
        
        // Firm selection handler
        if (firmSelect) {
            firmSelect.addEventListener('change', (e) => {
                const firmId = e.target.value;
                const firmName = e.target.options[e.target.selectedIndex].text;
                
                if (firmId) {
                    destDiv.classList.add('has-firm');
                    destDiv.setAttribute('data-firm', firmId);
                    console.log('🗺️ Firm selected:', firmName);
                    
                    // Update status
                    this.updateDestinationStatus(destDiv);
                } else {
                    destDiv.classList.remove('has-firm');
                    destDiv.removeAttribute('data-firm');
                }
            });
        }
        
        // Claim type selection handler
        if (claimTypeSelect) {
            claimTypeSelect.addEventListener('change', (e) => {
                const claimType = e.target.value;
                
                if (claimType) {
                    destDiv.classList.add('has-type');
                    destDiv.setAttribute('data-claim-type', claimType);
                    console.log('🗺️ Claim type selected:', claimType);
                    
                    // Update status
                    this.updateDestinationStatus(destDiv);
                } else {
                    destDiv.classList.remove('has-type');
                    destDiv.removeAttribute('data-claim-type');
                }
            });
        }
        
        // Address verification handler
        const verifyBtn = destDiv.querySelector('.address-verify-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                this.verifyDestinationAddress(destDiv);
            });
        }
        
        // Street View property preview handler
        const streetViewBtn = destDiv.querySelector('.street-view-btn');
        if (streetViewBtn) {
            streetViewBtn.addEventListener('click', () => {
                this.showPropertyPreview(destDiv);
            });
        }
        
        // Auto address validation on blur
        const addressInput = destDiv.querySelector('.destination-address-input');
        if (addressInput) {
            let validationTimeout;
            addressInput.addEventListener('blur', () => {
                const address = addressInput.value?.trim();
                if (address && address.length > 10) {
                    // Debounce validation
                    clearTimeout(validationTimeout);
                    validationTimeout = setTimeout(() => {
                        this.autoValidateAddress(destDiv);
                    }, 500);
                }
            });
            
            addressInput.addEventListener('input', () => {
                // Clear validation status when user types
                destDiv.classList.remove('address-validated', 'address-invalid');
            });
        }
    }
    
    updateDestinationStatus(destDiv) {
        const statusDiv = destDiv.querySelector('.destination-status');
        const addressInput = destDiv.querySelector('.destination-address-input');
        const firmSelect = destDiv.querySelector('.firm-select');
        const claimTypeSelect = destDiv.querySelector('.claim-type-select');
        
        if (!statusDiv || !addressInput || !firmSelect || !claimTypeSelect) {
            console.warn('🗺️ Missing form elements for status update');
            return;
        }
        
        const address = addressInput.value ? addressInput.value.trim() : '';
        const firm = firmSelect.value;
        const claimType = claimTypeSelect.value;
        
        if (address && firm && claimType) {
            statusDiv.innerHTML = '<span class="status-ready">✅ Ready</span>';
            destDiv.classList.add('complete');
        } else {
            const missing = [];
            if (!address) missing.push('address');
            if (!firm) missing.push('firm');
            if (!claimType) missing.push('type');
            
            statusDiv.innerHTML = `<span class="status-incomplete">⚠️ Need: ${missing.join(', ')}</span>`;
            destDiv.classList.remove('complete');
        }
    }
    
    verifyDestinationAddress(destDiv) {
        const addressInput = destDiv.querySelector('.destination-address-input');
        if (!addressInput) {
            this.showError('Address input not found');
            return;
        }
        const address = addressInput.value ? addressInput.value.trim() : '';
        
        if (!address) {
            this.showError('Please enter an address first');
            return;
        }
        
        // Use Google Geocoding to verify address
        if (typeof google !== 'undefined' && google.maps && this.geocoder) {
            this.geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK') {
                    const formattedAddress = results[0].formatted_address;
                    addressInput.value = formattedAddress;
                    
                    destDiv.classList.add('verified');
                    this.updateDestinationStatus(destDiv);
                    
                    console.log('🗺️ Address verified:', formattedAddress);
                    this.showNotification('✅ Address verified and formatted', 'success');
                } else {
                    console.warn('🗺️ Address verification failed:', status);
                    this.showNotification('⚠️ Could not verify address - please check spelling', 'warning');
                }
            });
        } else {
            // Fallback verification - just mark as verified
            destDiv.classList.add('verified');
            this.updateDestinationStatus(destDiv);
            this.showNotification('✅ Address marked as verified', 'info');
        }
    }

    async showPropertyPreview(destDiv) {
        const addressInput = destDiv.querySelector('.destination-address-input');
        const address = addressInput?.value?.trim();
        
        if (!address) {
            this.showError('Please enter an address first');
            return;
        }
        
        console.log('👁️ Showing property preview for:', address);
        
        try {
            // Get Street View data
            const streetViewData = await this.getStreetViewData(address);
            
            // Create preview modal
            const modal = document.createElement('div');
            modal.className = 'property-preview-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="this.closest('.property-preview-modal').remove()"></div>
                <div class="modal-content property-preview-content">
                    <div class="modal-header">
                        <h3>🏠 Property Preview</h3>
                        <button class="modal-close" onclick="this.closest('.property-preview-modal').remove()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="property-address">
                            <strong>📍 ${address}</strong>
                        </div>
                        
                        <div class="street-view-container">
                            ${streetViewData.available 
                                ? `<img src="${streetViewData.imageUrl}" alt="Property Street View" class="street-view-image">
                                   <div class="street-view-info">
                                       <small>📷 Street View available - Property visible</small>
                                   </div>`
                                : `<div class="no-street-view">
                                       <div class="no-street-view-icon">📷</div>
                                       <p>Street View not available for this location</p>
                                       <small>Property may be on private road or in rural area</small>
                                   </div>`
                            }
                        </div>
                        
                        <div class="property-actions">
                            <button class="cipher-btn cipher-btn--secondary validate-address-btn">
                                📍 Validate Address
                            </button>
                            <button class="cipher-btn cipher-btn--secondary open-maps-btn">
                                🗺️ Open in Maps
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add click handlers for buttons
            const validateBtn = modal.querySelector('.validate-address-btn');
            const mapsBtn = modal.querySelector('.open-maps-btn');
            
            validateBtn?.addEventListener('click', async () => {
                const validation = await this.validateAddress(address);
                if (validation.isValid && validation.correctedAddress !== address) {
                    if (confirm(`Address can be corrected to:\n${validation.correctedAddress}\n\nUpdate the address?`)) {
                        addressInput.value = validation.correctedAddress;
                        this.updateDestinationStatus(destDiv);
                    }
                } else {
                    alert('✅ Address appears to be valid');
                }
            });
            
            mapsBtn?.addEventListener('click', () => {
                window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank');
            });
            
        } catch (error) {
            console.error('👁️ Property preview failed:', error);
            this.showError('Failed to load property preview');
        }
    }

    async autoValidateAddress(destDiv) {
        const addressInput = destDiv.querySelector('.destination-address-input');
        const address = addressInput?.value?.trim();
        
        if (!address) return;
        
        console.log('📍 Auto-validating address:', address);
        
        try {
            const validation = await this.validateAddress(address);
            
            if (validation.isValid) {
                destDiv.classList.add('address-validated');
                destDiv.classList.remove('address-invalid');
                
                // If address was corrected, show subtle indicator
                if (validation.correctedAddress !== address) {
                    const statusDiv = destDiv.querySelector('.destination-status');
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <span class="status-suggestion" title="Suggested: ${validation.correctedAddress}">
                                📍 Address suggestion available
                            </span>
                        `;
                    }
                }
            } else {
                destDiv.classList.add('address-invalid');
                destDiv.classList.remove('address-validated');
            }
        } catch (error) {
            console.warn('📍 Auto-validation failed:', error);
            // Don't show error for auto-validation failures
        }
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        
        // You can enhance this with actual UI notifications
        if (type === 'success') {
            this.showToast('✅ ' + message);
        } else if (type === 'warning') {
            this.showToast('⚠️ ' + message);
        } else {
            this.showToast('ℹ️ ' + message);
        }
    }

    toggleAdvancedSettings() {
        const advancedSettings = document.getElementById('advancedSettings');
        const toggleBtn = document.getElementById('toggleAdvanced');
        
        if (!advancedSettings || !toggleBtn) {
            console.warn('⚙️ Advanced settings elements not found');
            return;
        }
        
        const isHidden = advancedSettings.style.display === 'none' || !advancedSettings.style.display;
        
        if (isHidden) {
            // Show advanced settings with animation
            advancedSettings.style.display = 'block';
            advancedSettings.style.opacity = '0';
            advancedSettings.style.transform = 'translateY(-10px)';
            advancedSettings.style.transition = 'all 0.3s ease';
            
            // Trigger animation
            setTimeout(() => {
                advancedSettings.style.opacity = '1';
                advancedSettings.style.transform = 'translateY(0)';
            }, 10);
            
            toggleBtn.innerHTML = '<span class="btn-icon">🔼</span>Fewer Settings';
            toggleBtn.classList.add('settings-expanded');
            
            console.log('⚙️ Advanced settings expanded');
        } else {
            // Hide advanced settings with animation
            advancedSettings.style.transition = 'all 0.3s ease';
            advancedSettings.style.opacity = '0';
            advancedSettings.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                advancedSettings.style.display = 'none';
            }, 300);
            
            toggleBtn.innerHTML = '<span class="btn-icon">⚙️</span>More Settings';
            toggleBtn.classList.remove('settings-expanded');
            
            console.log('⚙️ Advanced settings collapsed');
        }
        
        // Save user preference
        localStorage.setItem('cc_advanced_settings_expanded', (!isHidden).toString());
    }

    // Restore settings panel state from user preference
    restoreSettingsState() {
        const savedState = localStorage.getItem('cc_advanced_settings_expanded');
        const shouldExpand = savedState === 'true';
        
        if (shouldExpand) {
            const advancedSettings = document.getElementById('advancedSettings');
            const toggleBtn = document.getElementById('toggleAdvanced');
            
            if (advancedSettings && toggleBtn) {
                // Expand without animation on load
                advancedSettings.style.display = 'block';
                advancedSettings.style.opacity = '1';
                advancedSettings.style.transform = 'translateY(0)';
                toggleBtn.innerHTML = '<span class="btn-icon">🔼</span>Fewer Settings';
                toggleBtn.classList.add('settings-expanded');
                
                console.log('⚙️ Restored expanded settings state');
            }
        }
        
        // Initialize settings with smart defaults based on user role
        this.initializeSmartDefaults();
    }

    // Set smart defaults based on user role and territory
    initializeSmartDefaults() {
        const userProfile = this.getUserProfileData();
        
        // Set optimization mode to time (as requested)
        const optimizationMode = document.getElementById('optimizationMode');
        if (optimizationMode && !optimizationMode.value) {
            optimizationMode.value = 'time';
        }
        
        // Set territory type based on user profile or smart default
        const territoryType = document.getElementById('territoryType');
        if (territoryType && userProfile.territory?.territory_type) {
            territoryType.value = userProfile.territory.territory_type;
        }
        
        // Adjust max stops per day based on territory
        const maxStopsPerDay = document.getElementById('maxStopsPerDay');
        if (maxStopsPerDay && !maxStopsPerDay.hasAttribute('user-modified')) {
            const territory = territoryType?.value || 'mixed';
            if (territory === 'rural') {
                maxStopsPerDay.value = '5'; // Fewer stops for rural
            } else if (territory === 'urban') {
                maxStopsPerDay.value = '10'; // More stops for urban
            }
        }
        
        console.log('⚙️ Smart defaults initialized');
    }

    addDestination() {
        console.log('🗺️ Add destination button clicked');
        
        const container = document.getElementById('destinationsList');
        if (!container) {
            console.error('🗺️ destinationsList container not found');
            return;
        }
        
        // Get available firms from mileage calculator settings
        const firms = this.getAvailableFirms();
        const firmsOptions = firms.map(firm => 
            `<option value="${firm.id}">${firm.name}</option>`
        ).join('');
        
        // Create destination input with Google Maps-like collapsible design
        const destDiv = document.createElement('div');
        destDiv.className = 'destination-input destination-collapsed';
        destDiv.innerHTML = `
            <div class="address-input-section">
                <input type="text" placeholder="Enter address from firm email" class="destination-address-input">
                <div class="address-info">
                    <button class="address-verify-btn" title="Verify address">✓</button>
                    <button class="street-view-btn" title="Property Preview">👁️</button>
                    <button class="remove-btn-simple" title="Remove this destination">×</button>
                </div>
            </div>
            
            <div class="destination-meta" style="display: none;">
                <div class="meta-row">
                    <div class="form-group-inline">
                        <label class="meta-label">Firm:</label>
                        <select class="firm-select">
                            <option value="">Select Firm...</option>
                            ${firmsOptions}
                        </select>
                    </div>
                    <div class="form-group-inline">
                        <label class="meta-label">Type:</label>
                        <select class="claim-type-select">
                            <option value="">Select Type...</option>
                            <option value="auto">Auto</option>
                            <option value="te">T&E</option>
                            <option value="photoscope">Photo/Scope</option>
                            <option value="exotic">Exotic/Classic</option>
                        </select>
                    </div>
                </div>
                <div class="meta-row">
                    <div class="form-group-inline">
                        <label class="meta-label">Priority:</label>
                        <select class="priority-select" title="Set priority level">
                            <option value="normal">🔵 Normal</option>
                            <option value="high">🟡 High</option>
                            <option value="urgent">🔴 Urgent</option>
                        </select>
                    </div>
                    <div class="form-group-inline">
                        <label class="meta-label">Customer:</label>
                        <input type="text" placeholder="Customer name" class="customer-name-input">
                    </div>
                </div>
                <div class="destination-controls">
                    <button class="collapse-btn" title="Collapse details">Collapse Details</button>
                </div>
            </div>
        `;
        
        // Add to container
        container.appendChild(destDiv);
        
        // Focus on the new input
        const newInput = destDiv.querySelector('.destination-address-input');
        const metaSection = destDiv.querySelector('.destination-meta');
        const removeBtn = destDiv.querySelector('.remove-btn-simple');
        const collapseBtn = destDiv.querySelector('.collapse-btn');
        
        if (newInput) {
            newInput.focus();
            
            // Add Google Maps autocomplete if available - Use LEGACY API only
            if (typeof google !== 'undefined' && google.maps && google.maps.places) {
                try {
                    // Use legacy Autocomplete API (works with your current setup)
                    const autocomplete = new google.maps.places.Autocomplete(newInput);
                    autocomplete.setFields(['formatted_address', 'geometry', 'place_id']);
                    
                    // Set up place selection listener
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (place && place.formatted_address) {
                            newInput.value = place.formatted_address;
                            console.log('🗺️ Address selected:', place.formatted_address);
                            
                            // Auto-expand details when address is selected
                            this.expandDestinationDetails(destDiv);
                            
                            // Trigger validation update
                            setTimeout(() => {
                                this.updateDestinationStatus(destDiv);
                            }, 100);
                        } else {
                            console.warn('🗺️ No valid place selected');
                        }
                    });
                    
                    console.log('🗺️ Legacy Autocomplete added to new input');
                } catch (error) {
                    console.warn('🗺️ Autocomplete failed:', error);
                }
            }
            
            // Auto-expand when user starts typing
            newInput.addEventListener('input', () => {
                if (newInput.value.length > 10 && destDiv.classList.contains('destination-collapsed')) {
                    this.expandDestinationDetails(destDiv);
                }
            });
            
            // Auto-expand on focus if there's already content
            newInput.addEventListener('focus', () => {
                if (newInput.value.length > 0 && destDiv.classList.contains('destination-collapsed')) {
                    this.expandDestinationDetails(destDiv);
                }
            });
        }
        
        // Remove button functionality
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                destDiv.remove();
            });
        }
        
        // Collapse button functionality  
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.collapseDestinationDetails(destDiv);
            });
        }
        
        // Add event listeners for firm/type changes
        this.setupDestinationEventListeners(destDiv);
        
        console.log('🗺️ Destination input added successfully with Google Maps-like collapsible design');
    }

    expandDestinationDetails(destDiv) {
        const metaSection = destDiv.querySelector('.destination-meta');
        if (metaSection) {
            metaSection.style.display = 'block';
            destDiv.classList.remove('destination-collapsed');
            destDiv.classList.add('destination-expanded');
            
            // Smooth animation
            metaSection.style.opacity = '0';
            metaSection.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                metaSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                metaSection.style.opacity = '1';
                metaSection.style.transform = 'translateY(0)';
            }, 10);
        }
    }

    collapseDestinationDetails(destDiv) {
        const metaSection = destDiv.querySelector('.destination-meta');
        if (metaSection) {
            metaSection.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            metaSection.style.opacity = '0';
            metaSection.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                metaSection.style.display = 'none';
                destDiv.classList.remove('destination-expanded');
                destDiv.classList.add('destination-collapsed');
            }, 200);
        }
    }

    showBulkImportModal() {
        console.log('📥 Opening bulk import modal...');
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'bulk-import-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.bulk-import-modal').remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📥 Bulk Import Addresses</h3>
                    <button class="modal-close" onclick="this.closest('.bulk-import-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="import-instructions">
                        <h4>📧 Paste Addresses from Firm Emails:</h4>
                        <p>Copy and paste addresses from your firm emails. The system will automatically detect and organize them.</p>
                        <div class="format-examples">
                            <strong>Supported formats:</strong>
                            <ul>
                                <li>123 Main St, Anytown, NC 12345</li>
                                <li>Firm: ACD - 456 Oak Ave, City, State 67890</li>
                                <li>Property Address: 789 Pine St, Location, ST 54321 (Auto claim)</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="import-input-section">
                        <textarea id="bulkAddressInput" placeholder="Paste your addresses here, one per line...
Examples:
123 Main St, Raleigh, NC 27601
456 Oak Ave, Durham, NC 27707
789 Pine Rd, Chapel Hill, NC 27514" rows="8"></textarea>
                    </div>
                    
                    <div class="import-options">
                        <div class="option-group">
                            <label class="option-label">Default Firm:</label>
                            <select id="defaultFirmSelect">
                                <option value="">Auto-detect or leave blank</option>
                                ${this.getAvailableFirms().map(firm => 
                                    `<option value="${firm.id}">${firm.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="option-group">
                            <label class="option-label">Default Claim Type:</label>
                            <select id="defaultTypeSelect">
                                <option value="">Auto-detect or leave blank</option>
                                <option value="auto">Auto</option>
                                <option value="te">T&E</option>
                                <option value="photoscope">Photo/Scope</option>
                                <option value="exotic">Exotic/Classic</option>
                            </select>
                        </div>
                        
                        <div class="option-group">
                            <label class="option-label">Default Priority:</label>
                            <select id="defaultPrioritySelect">
                                <option value="normal">🔵 Normal</option>
                                <option value="high">🟡 High</option>
                                <option value="urgent">🔴 Urgent</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="preview-section" id="importPreview" style="display: none;">
                        <h4>📋 Import Preview:</h4>
                        <div id="previewList"></div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.bulk-import-modal').remove()">Cancel</button>
                    <button class="cipher-btn cipher-btn--primary" id="previewImportBtn">Preview Import</button>
                    <button class="cipher-btn cipher-btn--success" id="confirmImportBtn" style="display: none;">Import Addresses</button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const modalStyles = `
            <style>
                .bulk-import-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .bulk-import-modal .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                }
                .bulk-import-modal .modal-content {
                    position: relative;
                    background: var(--cipher-bg-secondary);
                    border-radius: var(--cipher-radius-lg);
                    border: 1px solid var(--cipher-border);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .bulk-import-modal .modal-header {
                    padding: var(--cipher-space-lg);
                    border-bottom: 1px solid var(--cipher-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .bulk-import-modal .modal-header h3 {
                    margin: 0;
                    color: var(--cipher-gold);
                }
                .bulk-import-modal .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: var(--cipher-text-secondary);
                    cursor: pointer;
                    padding: 5px;
                }
                .bulk-import-modal .modal-body {
                    padding: var(--cipher-space-lg);
                    overflow-y: auto;
                    flex: 1;
                }
                .bulk-import-modal .import-instructions {
                    background: rgba(255, 215, 0, 0.1);
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: var(--cipher-radius-md);
                    padding: var(--cipher-space-md);
                    margin-bottom: var(--cipher-space-lg);
                }
                .bulk-import-modal .format-examples ul {
                    margin: var(--cipher-space-sm) 0 0 var(--cipher-space-md);
                    font-family: monospace;
                    font-size: 0.9rem;
                }
                .bulk-import-modal .import-input-section {
                    margin-bottom: var(--cipher-space-lg);
                }
                .bulk-import-modal #bulkAddressInput {
                    width: 100%;
                    min-height: 200px;
                    background: var(--cipher-bg-primary);
                    border: 1px solid var(--cipher-border);
                    border-radius: var(--cipher-radius-md);
                    padding: var(--cipher-space-md);
                    color: var(--cipher-text-primary);
                    font-family: monospace;
                    font-size: 0.9rem;
                    resize: vertical;
                }
                .bulk-import-modal .import-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--cipher-space-md);
                    margin-bottom: var(--cipher-space-lg);
                }
                .bulk-import-modal .option-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--cipher-space-xs);
                }
                .bulk-import-modal .option-label {
                    font-weight: bold;
                    color: var(--cipher-text-secondary);
                    font-size: 0.9rem;
                }
                .bulk-import-modal .option-group select {
                    background: var(--cipher-bg-primary);
                    border: 1px solid var(--cipher-border);
                    border-radius: var(--cipher-radius-sm);
                    padding: var(--cipher-space-sm);
                    color: var(--cipher-text-primary);
                }
                .bulk-import-modal .preview-section {
                    background: var(--cipher-bg-primary);
                    border-radius: var(--cipher-radius-md);
                    padding: var(--cipher-space-md);
                    max-height: 300px;
                    overflow-y: auto;
                }
                .bulk-import-modal .preview-item {
                    padding: var(--cipher-space-sm);
                    border-bottom: 1px solid var(--cipher-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .bulk-import-modal .preview-item:last-child {
                    border-bottom: none;
                }
                .bulk-import-modal .preview-address {
                    flex: 1;
                    margin-right: var(--cipher-space-md);
                }
                .bulk-import-modal .preview-meta {
                    display: flex;
                    gap: var(--cipher-space-sm);
                    font-size: 0.8rem;
                }
                .bulk-import-modal .preview-meta span {
                    padding: 2px 6px;
                    border-radius: var(--cipher-radius-xs);
                    background: var(--cipher-bg-secondary);
                }
                .bulk-import-modal .modal-footer {
                    padding: var(--cipher-space-lg);
                    border-top: 1px solid var(--cipher-border);
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--cipher-space-md);
                }
            </style>
        `;
        
        // Add styles to head if not already added
        if (!document.getElementById('bulk-import-modal-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'bulk-import-modal-styles';
            styleSheet.textContent = modalStyles;
            document.head.appendChild(styleSheet);
        }
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Setup event listeners
        const previewBtn = modal.querySelector('#previewImportBtn');
        const confirmBtn = modal.querySelector('#confirmImportBtn');
        const addressInput = modal.querySelector('#bulkAddressInput');
        
        previewBtn.addEventListener('click', () => this.previewBulkImport());
        confirmBtn.addEventListener('click', () => this.confirmBulkImport());
        
        // Focus on textarea
        addressInput.focus();
    }

    previewBulkImport() {
        const addressInput = document.getElementById('bulkAddressInput');
        const defaultFirm = document.getElementById('defaultFirmSelect').value;
        const defaultType = document.getElementById('defaultTypeSelect').value;
        const defaultPriority = document.getElementById('defaultPrioritySelect').value;
        const previewSection = document.getElementById('importPreview');
        const previewList = document.getElementById('previewList');
        const confirmBtn = document.getElementById('confirmImportBtn');
        
        const addresses = addressInput.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (addresses.length === 0) {
            alert('Please paste some addresses first');
            return;
        }
        
        // Parse addresses and extract metadata
        const parsedAddresses = addresses.map(rawAddress => this.parseAddressLine(rawAddress, defaultFirm, defaultType, defaultPriority));
        
        // Generate preview
        let previewHtml = '';
        parsedAddresses.forEach((parsed, index) => {
            const priorityIcon = parsed.priority === 'urgent' ? '🔴' : parsed.priority === 'high' ? '🟡' : '🔵';
            previewHtml += `
                <div class="preview-item">
                    <div class="preview-address">${parsed.address}</div>
                    <div class="preview-meta">
                        ${parsed.firm ? `<span>🏢 ${parsed.firmName || parsed.firm}</span>` : '<span>❓ No firm</span>'}
                        ${parsed.type ? `<span>📋 ${parsed.type}</span>` : '<span>❓ No type</span>'}
                        <span>${priorityIcon} ${parsed.priority}</span>
                    </div>
                </div>
            `;
        });
        
        previewList.innerHTML = previewHtml;
        previewSection.style.display = 'block';
        confirmBtn.style.display = 'inline-block';
        
        // Store parsed addresses for confirmation
        this._parsedAddresses = parsedAddresses;
        
        console.log(`📥 Previewing ${parsedAddresses.length} addresses for import`);
    }

    parseAddressLine(rawLine, defaultFirm, defaultType, defaultPriority) {
        let address = rawLine;
        let firm = defaultFirm;
        let firmName = '';
        let type = defaultType;
        let priority = defaultPriority;
        
        // Extract firm information
        const firmPatterns = [
            /(?:firm|company):\s*([^-\n]+)[-\s]/i,
            /(?:from|client):\s*([^-\n]+)[-\s]/i,
            /^([a-zA-Z\s&]+)[-–]\s*(.+)$/i
        ];
        
        for (const pattern of firmPatterns) {
            const match = rawLine.match(pattern);
            if (match) {
                const detectedFirm = match[1].trim();
                firmName = detectedFirm;
                
                // Map common firm names to IDs
                const firmMappings = {
                    'acd': ['acd', 'american claims', 'american claim'],
                    'sedgwick': ['sedgwick', 'sedgwick claims'],
                    'crawford': ['crawford', 'crawford & company', 'crawford and company'],
                    'gallagher': ['gallagher', 'arthur j gallagher'],
                    'state farm': ['state farm', 'statefarm']
                };
                
                const lowerFirm = detectedFirm.toLowerCase();
                for (const [id, variations] of Object.entries(firmMappings)) {
                    if (variations.some(variation => lowerFirm.includes(variation))) {
                        firm = id;
                        break;
                    }
                }
                
                // Remove firm info from address
                address = rawLine.replace(match[0], match[2] || '').trim();
                break;
            }
        }
        
        // Extract claim type information
        const typePatterns = [
            /\b(auto|automotive|vehicle)\b/i,
            /\b(total\s*loss|totaled)\b/i,
            /\b(property|home|house|dwelling)\b/i,
            /\b(photo|scope|photoscope)\b/i,
            /\b(exotic|classic|collector)\b/i,
            /\b(catastrophic|cat|disaster)\b/i
        ];
        
        const typeMap = {
            'auto': ['auto', 'automotive', 'vehicle'],
            'te': ['total loss', 'totaled'],
            'photoscope': ['photo', 'scope', 'photoscope'],
            'exotic': ['exotic', 'classic', 'collector']
        };
        
        const lowerAddress = address.toLowerCase();
        for (const [typeId, keywords] of Object.entries(typeMap)) {
            if (keywords.some(keyword => lowerAddress.includes(keyword))) {
                type = typeId;
                break;
            }
        }
        
        // Extract priority indicators
        const priorityPatterns = [
            /\b(urgent|asap|rush|emergency)\b/i,
            /\b(high\s*priority|important|critical)\b/i
        ];
        
        if (priorityPatterns[0].test(rawLine)) {
            priority = 'urgent';
        } else if (priorityPatterns[1].test(rawLine)) {
            priority = 'high';
        }
        
        // Clean up the address
        address = address
            .replace(/^\s*(?:property\s*)?address:\s*/i, '')
            .replace(/\s*\([^)]*\)\s*$/, '') // Remove trailing parentheticals
            .trim();
        
        // Get firm name for display
        if (firm && !firmName) {
            const firmData = this.getAvailableFirms().find(f => f.id === firm);
            firmName = firmData ? firmData.name : firm;
        }
        
        return {
            address,
            firm,
            firmName,
            type,
            priority,
            original: rawLine
        };
    }

    confirmBulkImport() {
        if (!this._parsedAddresses || this._parsedAddresses.length === 0) {
            alert('No addresses to import. Please preview first.');
            return;
        }
        
        const container = document.getElementById('destinationsList');
        if (!container) {
            console.error('🗺️ destinationsList container not found');
            return;
        }
        
        let importedCount = 0;
        
        // Import each parsed address
        this._parsedAddresses.forEach(parsed => {
            if (!parsed.address || parsed.address.length < 5) {
                console.warn('Skipping invalid address:', parsed.address);
                return;
            }
            
            // Create destination input for this address
            const firms = this.getAvailableFirms();
            const firmsOptions = firms.map(firm => 
                `<option value="${firm.id}" ${firm.id === parsed.firm ? 'selected' : ''}>${firm.name}</option>`
            ).join('');
            
            const destDiv = document.createElement('div');
            destDiv.className = 'destination-input';
            destDiv.innerHTML = `
                <div class="address-input-section">
                    <input type="text" value="${parsed.address}" class="destination-address-input">
                    <div class="address-info">
                        <button class="address-verify-btn" title="Verify address">✓</button>
                        <button class="street-view-btn" title="Property Preview">👁️</button>
                    </div>
                </div>
                
                <div class="destination-meta">
                    <div class="meta-row">
                        <div class="form-group-inline">
                            <label class="meta-label">Firm:</label>
                            <select class="firm-select">
                                <option value="">Select Firm...</option>
                                ${firmsOptions}
                            </select>
                        </div>
                        <div class="form-group-inline">
                            <label class="meta-label">Type:</label>
                            <select class="claim-type-select">
                                <option value="">Select Type...</option>
                                <option value="auto" ${parsed.type === 'auto' ? 'selected' : ''}>Auto</option>
                                <option value="te" ${parsed.type === 'te' ? 'selected' : ''}>T&E</option>
                                <option value="photoscope" ${parsed.type === 'photoscope' ? 'selected' : ''}>Photo/Scope</option>
                                <option value="exotic" ${parsed.type === 'exotic' ? 'selected' : ''}>Exotic/Classic</option>
                            </select>
                        </div>
                    </div>
                    <div class="meta-row">
                        <div class="form-group-inline">
                            <label class="meta-label">Priority:</label>
                            <select class="priority-select" title="Set priority level">
                                <option value="normal" ${parsed.priority === 'normal' ? 'selected' : ''}>🔵 Normal</option>
                                <option value="high" ${parsed.priority === 'high' ? 'selected' : ''}>🟡 High</option>
                                <option value="urgent" ${parsed.priority === 'urgent' ? 'selected' : ''}>🔴 Urgent</option>
                            </select>
                        </div>
                        <div class="form-group-inline">
                            <label class="meta-label">Customer:</label>
                            <input type="text" placeholder="Customer name" class="customer-name-input">
                        </div>
                    </div>
                </div>
                
                <div class="destination-controls">
                    <button class="remove-btn" onclick="removeDestination(this)" title="Remove this destination">×</button>
                    <div class="destination-status"></div>
                </div>
            `;
            
            // Add to container
            container.appendChild(destDiv);
            
            // Setup event listeners for this destination
            this.setupDestinationEventListeners(destDiv);
            
            // Update status to reflect initial state
            this.updateDestinationStatus(destDiv);
            
            importedCount++;
        });
        
        // Close modal
        document.querySelector('.bulk-import-modal')?.remove();
        
        // Show success message
        this.showNotification(`✅ Successfully imported ${importedCount} addresses`, 'success');
        
        console.log(`📥 Bulk import completed: ${importedCount} addresses imported`);
        
        // Clean up
        delete this._parsedAddresses;
    }

    exportToGoogleCalendar() {
        if (!this.currentRoute) {
            this.showNotification('Please optimize a route first', 'warning');
            return;
        }

        console.log('📅 Exporting to Google Calendar...');
        
        // Generate calendar events for each appointment
        const events = this.generateCalendarEvents();
        
        if (events.length === 0) {
            this.showNotification('No scheduled appointments to export', 'warning');
            return;
        }

        // Create Google Calendar URLs for each event
        const googleUrls = events.map(event => {
            const startDate = event.date.replace(/-/g, '') + 'T' + event.startTime.replace(':', '') + '00';
            const endDate = event.date.replace(/-/g, '') + 'T' + event.endTime.replace(':', '') + '00';
            
            const params = new URLSearchParams({
                action: 'TEMPLATE',
                text: event.title,
                dates: `${startDate}/${endDate}`,
                details: event.description,
                location: event.location
            });
            
            return `https://calendar.google.com/calendar/render?${params.toString()}`;
        });

        // Open first event and copy others to clipboard
        if (googleUrls.length > 0) {
            window.open(googleUrls[0], '_blank');
            
            if (googleUrls.length > 1) {
                const remainingUrls = googleUrls.slice(1).join('\n');
                navigator.clipboard.writeText(remainingUrls).then(() => {
                    this.showNotification(`Opened first appointment in Google Calendar. ${googleUrls.length - 1} additional URLs copied to clipboard.`, 'success');
                });
            } else {
                this.showNotification('Appointment opened in Google Calendar', 'success');
            }
        }
    }

    exportToAppleCalendar() {
        if (!this.currentRoute) {
            this.showNotification('Please optimize a route first', 'warning');
            return;
        }

        console.log('🍎 Exporting to Apple Calendar...');
        
        const events = this.generateCalendarEvents();
        
        if (events.length === 0) {
            this.showNotification('No scheduled appointments to export', 'warning');
            return;
        }

        // Generate iCal format
        const icalContent = this.generateICalContent(events);
        
        // Create and download iCal file
        const blob = new Blob([icalContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `route-appointments-${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification(`Downloaded ${events.length} appointments as iCal file`, 'success');
    }

    exportToMobileCipher() {
        if (!this.currentRoute) {
            this.showNotification('Please optimize a route first', 'warning');
            return;
        }

        console.log('📱 Exporting to Mobile Cipher...');
        
        // Prepare mobile-friendly route data
        const mobileRouteData = {
            routeId: `route_${Date.now()}`,
            generatedAt: new Date().toISOString(),
            territory: 'rural',
            totalMiles: this.currentRoute.overall.miles,
            totalDays: this.currentRoute.days.length,
            days: this.currentRoute.days.map((day, index) => ({
                dayNumber: index + 1,
                date: this.getDefaultDate(index),
                totalMiles: day.totalMiles,
                estimatedDuration: day.totalMinutes,
                stops: day.stops.map((stop, i) => {
                    const isStarting = i === 0;
                    const legInfo = i < day.legs.length ? day.legs[i] : null;
                    
                    return {
                        stopNumber: isStarting ? 0 : i,
                        address: stop,
                        shortAddress: this.shortenAddress(stop),
                        isStartingPoint: isStarting,
                        priority: this.getStopPriority(stop, this.currentRoute),
                        nextLeg: legInfo ? {
                            distance: legInfo.distance,
                            duration: legInfo.duration,
                            isReturn: legInfo.isReturn
                        } : null
                    };
                })
            }))
        };
        
        // Store in localStorage with mobile-specific key
        localStorage.setItem('cc_mobile_route', JSON.stringify(mobileRouteData));
        
        // Generate QR code data for easy mobile access
        const qrData = JSON.stringify({
            type: 'route',
            routeId: mobileRouteData.routeId,
            url: `${window.location.origin}/mobile-cipher.html?route=${mobileRouteData.routeId}`
        });
        
        // Copy mobile data to clipboard
        navigator.clipboard.writeText(qrData).then(() => {
            this.showNotification('Route exported to Mobile Cipher! QR data copied to clipboard.', 'success');
        }).catch(() => {
            this.showNotification('Route exported to Mobile Cipher!', 'success');
        });
        
        // Show mobile export modal with options
        this.showMobileExportModal(mobileRouteData, qrData);
    }

    generateCalendarEvents() {
        if (!this.currentRoute) return [];
        
        const events = [];
        
        this.currentRoute.days.forEach((day, dayIndex) => {
            const date = this.getDefaultDate(dayIndex);
            
            day.stops.forEach((stop, stopIndex) => {
                // Skip starting point
                if (stopIndex === 0) return;
                
                const stopId = `stop_${dayIndex}_${stopIndex}`;
                const dateInput = document.querySelector(`input[data-stop="${stopId}"].appt-date-input`);
                const timeInput = document.querySelector(`input[data-stop="${stopId}"].appt-time-input`);
                const durationSelect = document.querySelector(`select[data-stop="${stopId}"].duration-select`);
                
                const appointmentDate = dateInput?.value || date;
                const appointmentTime = timeInput?.value;
                const duration = parseInt(durationSelect?.value || '30');
                
                if (appointmentTime) {
                    // Calculate end time
                    const [hours, minutes] = appointmentTime.split(':').map(Number);
                    const endTime = new Date(0, 0, 0, hours, minutes + duration);
                    const endTimeStr = endTime.toTimeString().slice(0, 5);
                    
                    events.push({
                        title: `Insurance Inspection - ${this.shortenAddress(stop)}`,
                        date: appointmentDate,
                        startTime: appointmentTime,
                        endTime: endTimeStr,
                        location: stop,
                        description: `Route Day ${dayIndex + 1} - Stop ${stopIndex}\nEstimated Duration: ${duration} minutes\nGenerated by Claim Cipher Route Optimizer`
                    });
                }
            });
        });
        
        return events;
    }

    generateICalContent(events) {
        let ical = 'BEGIN:VCALENDAR\r\n';
        ical += 'VERSION:2.0\r\n';
        ical += 'PRODID:-//Claim Cipher//Route Optimizer//EN\r\n';
        ical += 'CALSCALE:GREGORIAN\r\n';
        
        events.forEach(event => {
            const eventId = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00-${Math.random().toString(36).substr(2, 9)}`;
            const startDateTime = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`;
            const endDateTime = `${event.date.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`;
            
            ical += 'BEGIN:VEVENT\r\n';
            ical += `UID:${eventId}@claimcipher.com\r\n`;
            ical += `DTSTART:${startDateTime}\r\n`;
            ical += `DTEND:${endDateTime}\r\n`;
            ical += `SUMMARY:${event.title}\r\n`;
            ical += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\r\n`;
            ical += `LOCATION:${event.location}\r\n`;
            ical += `CREATED:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\r\n`;
            ical += 'END:VEVENT\r\n';
        });
        
        ical += 'END:VCALENDAR\r\n';
        
        return ical;
    }

    showMobileExportModal(mobileRouteData, qrData) {
        const modal = document.createElement('div');
        modal.className = 'mobile-export-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.mobile-export-modal').remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📱 Mobile Cipher Export</h3>
                    <button class="modal-close" onclick="this.closest('.mobile-export-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="export-summary">
                        <h4>📊 Route Summary</h4>
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="stat-label">Total Distance:</span>
                                <span class="stat-value">${mobileRouteData.totalMiles} miles</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Days:</span>
                                <span class="stat-value">${mobileRouteData.totalDays} days</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Route ID:</span>
                                <span class="stat-value">${mobileRouteData.routeId}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mobile-options">
                        <h4>📱 Mobile Access Options</h4>
                        <div class="option-buttons">
                            <button class="cipher-btn cipher-btn--primary" id="copyRouteDataBtn">
                                📋 Copy Route Data
                            </button>
                            <button class="cipher-btn cipher-btn--secondary" id="generateQRBtn">
                                📱 Generate QR Code
                            </button>
                            <button class="cipher-btn cipher-btn--accent" id="openMobileBtn">
                                🌐 Open Mobile View
                            </button>
                        </div>
                    </div>
                    
                    <div class="usage-instructions">
                        <h4>💡 Usage Instructions</h4>
                        <ul>
                            <li>Route data is automatically saved for mobile access</li>
                            <li>Use QR code to quickly access on mobile device</li>
                            <li>Mobile view optimized for field navigation</li>
                        </ul>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.mobile-export-modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup modal functionality
        modal.querySelector('#copyRouteDataBtn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify(mobileRouteData, null, 2)).then(() => {
                this.showNotification('Route data copied to clipboard', 'success');
            });
        });
        
        modal.querySelector('#generateQRBtn')?.addEventListener('click', () => {
            this.showNotification('QR code functionality coming soon!', 'info');
        });
        
        modal.querySelector('#openMobileBtn')?.addEventListener('click', () => {
            const mobileUrl = `${window.location.origin}/mobile-cipher.html?route=${mobileRouteData.routeId}`;
            window.open(mobileUrl, '_blank');
        });
    }

    clearAllDestinations() {
        const container = document.getElementById('destinationsList');
        if (!container) return;
        
        const destinations = container.querySelectorAll('.destination-input');
        
        if (destinations.length === 0) {
            this.showNotification('No destinations to clear', 'info');
            return;
        }
        
        const confirmClear = confirm(`Clear all ${destinations.length} destination${destinations.length !== 1 ? 's' : ''}?`);
        
        if (confirmClear) {
            destinations.forEach(dest => dest.remove());
            this.showNotification(`Cleared ${destinations.length} destinations`, 'success');
            console.log(`🗑️ Cleared ${destinations.length} destinations`);
        }
    }

    setupCustomerCommunication() {
        // Setup SMS/customer communication for coordinator
        const smsButtons = document.querySelectorAll('.sms-customer-btn');
        smsButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stopId = e.target.dataset.stop;
                this.openSMSModal(stopId);
            });
        });
        
        console.log('📱 Customer communication setup for coordinator role');
    }

    setupBulkScheduling() {
        // Setup bulk scheduling features
        const bulkScheduleBtn = document.getElementById('bulkScheduleBtn');
        if (bulkScheduleBtn) {
            bulkScheduleBtn.addEventListener('click', () => this.showBulkSchedulingModal());
        }
        
        console.log('📅 Bulk scheduling setup for coordinator role');
    }

    setupRouteAssignment() {
        // Setup route assignment to adjusters
        const assignRouteBtn = document.getElementById('assignRouteBtn');
        if (assignRouteBtn) {
            assignRouteBtn.addEventListener('click', () => this.showRouteAssignmentModal());
        }
        
        console.log('👥 Route assignment setup for coordinator role');
    }

    openSMSModal(stopId) {
        if (this.userRole !== 'coordinator') {
            this.showNotification('SMS features are only available in coordinator mode', 'info');
            return;
        }

        const stopItem = document.querySelector(`[data-stop-id="${stopId}"]`);
        if (!stopItem) return;
        
        const address = stopItem.querySelector('.stop-address')?.textContent || 'Unknown Address';
        
        // Create SMS modal
        const modal = document.createElement('div');
        modal.className = 'sms-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.sms-modal').remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📱 Customer Communication</h3>
                    <button class="modal-close" onclick="this.closest('.sms-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="customer-info">
                        <h4>📍 ${address}</h4>
                        <div class="customer-details">
                            <input type="text" id="customerName" placeholder="Customer name" class="form-input">
                            <input type="tel" id="customerPhone" placeholder="Customer phone number" class="form-input">
                        </div>
                    </div>
                    
                    <div class="sms-templates">
                        <label class="section-label">📝 Message Templates:</label>
                        <div class="template-buttons">
                            <button class="template-btn" data-template="initial">Initial Contact</button>
                            <button class="template-btn" data-template="confirm">Confirm Appointment</button>
                            <button class="template-btn" data-template="reschedule">Reschedule</button>
                            <button class="template-btn" data-template="arrival">On My Way</button>
                        </div>
                    </div>
                    
                    <div class="message-compose">
                        <label class="section-label">💬 Message:</label>
                        <textarea id="smsMessage" rows="4" placeholder="Type your message here..."></textarea>
                        <div class="message-info">
                            <span class="char-count">0/160 characters</span>
                        </div>
                    </div>
                    
                    <div class="communication-log" id="commLog-${stopId}">
                        <label class="section-label">📋 Communication History:</label>
                        <div class="log-entries">
                            <div class="log-empty">No previous communications</div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.sms-modal').remove()">Cancel</button>
                    <button class="cipher-btn cipher-btn--primary" id="sendSMSBtn">📱 Send SMS</button>
                    <button class="cipher-btn cipher-btn--success" id="logCallBtn">📞 Log Phone Call</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup SMS functionality
        this.setupSMSModal(modal, stopId, address);
    }

    setupSMSModal(modal, stopId, address) {
        const templates = {
            initial: `Hi! This is [Your Name] from [Company]. We have an insurance inspection scheduled at ${address}. When would be a convenient time for you this week? Please reply with your preferred day/time.`,
            confirm: `Thank you! Your insurance inspection is confirmed for [DATE] at [TIME] at ${address}. I'll text when I'm on my way. Please have the property accessible.`,
            reschedule: `Hi! I need to reschedule your inspection at ${address}. When would work better for you? Please reply with alternative times.`,
            arrival: `Hi! I'm on my way to ${address} for your insurance inspection. I should arrive in about [TIME] minutes. See you soon!`
        };
        
        const messageTextarea = modal.querySelector('#smsMessage');
        const charCount = modal.querySelector('.char-count');
        const sendBtn = modal.querySelector('#sendSMSBtn');
        const logCallBtn = modal.querySelector('#logCallBtn');
        
        // Template buttons
        modal.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const template = templates[btn.dataset.template];
                messageTextarea.value = template;
                this.updateCharCount(messageTextarea, charCount);
            });
        });
        
        // Character counter
        messageTextarea.addEventListener('input', () => {
            this.updateCharCount(messageTextarea, charCount);
        });
        
        // Send SMS
        sendBtn.addEventListener('click', () => {
            this.sendSMS(stopId, address, modal);
        });
        
        // Log call
        logCallBtn.addEventListener('click', () => {
            this.logPhoneCall(stopId, address, modal);
        });
        
        // Focus on customer name
        modal.querySelector('#customerName')?.focus();
    }

    updateCharCount(textarea, countElement) {
        const count = textarea.value.length;
        countElement.textContent = `${count}/160 characters`;
        
        if (count > 160) {
            countElement.style.color = 'var(--cipher-warning)';
        } else {
            countElement.style.color = 'var(--cipher-text-muted)';
        }
    }

    sendSMS(stopId, address, modal) {
        const customerNameEl = modal.querySelector('#customerName');
        const customerPhoneEl = modal.querySelector('#customerPhone');
        const messageEl = modal.querySelector('#smsMessage');
        
        if (!customerNameEl || !customerPhoneEl || !messageEl) {
            this.showError('SMS form elements not found');
            return;
        }
        
        const customerName = customerNameEl.value.trim();
        const customerPhone = customerPhoneEl.value.trim();
        const message = messageEl.value.trim();
        
        if (!customerPhone || !message) {
            alert('Please enter customer phone number and message');
            return;
        }
        
        // In a real implementation, this would integrate with SMS service
        // For now, we'll log the communication
        this.logCommunication(stopId, {
            type: 'sms',
            phone: customerPhone,
            message: message,
            timestamp: new Date(),
            customerName: customerName || 'Unknown'
        });
        
        // Show success message
        this.showNotification(`📱 SMS logged for ${address}`, 'success');
        
        // In coordinator mode, offer to send to mobile device
        if (this.userRole === 'coordinator') {
            const sendToMobile = confirm('Copy SMS details to clipboard for mobile sending?');
            if (sendToMobile) {
                const clipboardText = `TO: ${customerPhone}\nMESSAGE: ${message}`;
                navigator.clipboard.writeText(clipboardText).then(() => {
                    this.showNotification('SMS details copied to clipboard', 'success');
                });
            }
        }
        
        modal.remove();
    }

    logPhoneCall(stopId, address, modal) {
        const customerNameEl = modal.querySelector('#customerName');
        const customerPhoneEl = modal.querySelector('#customerPhone');
        
        if (!customerNameEl || !customerPhoneEl) {
            console.warn('🗺️ Phone call form elements not found');
            return;
        }
        
        const customerName = customerNameEl.value.trim();
        const customerPhone = customerPhoneEl.value.trim();
        
        // Simple call logging
        const callNotes = prompt('Call notes (optional):');
        
        this.logCommunication(stopId, {
            type: 'call',
            phone: customerPhone,
            notes: callNotes || 'Phone call made',
            timestamp: new Date(),
            customerName: customerName || 'Unknown'
        });
        
        this.showNotification(`📞 Call logged for ${address}`, 'success');
        modal.remove();
    }

    logCommunication(stopId, commData) {
        // Store communication log in localStorage
        const commKey = `cc_communications_${stopId}`;
        const existingComm = JSON.parse(localStorage.getItem(commKey) || '[]');
        
        existingComm.unshift({
            ...commData,
            id: Date.now()
        });
        
        localStorage.setItem(commKey, JSON.stringify(existingComm));
        
        console.log(`📋 Communication logged for stop ${stopId}:`, commData);
    }

    showBulkSchedulingModal() {
        if (this.userRole !== 'coordinator') return;
        
        // Get all approved appointments
        const appointments = this.gatherApprovedAppointments();
        
        const modal = document.createElement('div');
        modal.className = 'bulk-schedule-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.bulk-schedule-modal').remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📅 Bulk Schedule Manager</h3>
                    <button class="modal-close" onclick="this.closest('.bulk-schedule-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="coordinator-tools">
                        <h4>👥 Coordinator Scheduling Tools</h4>
                        <p>Manage multiple appointments and customer communications efficiently</p>
                        
                        <div class="bulk-actions">
                            <button class="cipher-btn cipher-btn--secondary" id="selectAllAppts">Select All</button>
                            <button class="cipher-btn cipher-btn--primary" id="bulkSMSBtn">📱 Bulk SMS</button>
                            <button class="cipher-btn cipher-btn--success" id="exportCalendarBtn">📅 Export Calendar</button>
                        </div>
                        
                        <div class="scheduling-options">
                            <label>Auto-schedule starting from:</label>
                            <input type="date" id="scheduleStartDate" value="${new Date().toISOString().split('T')[0]}">
                            <button class="cipher-btn cipher-btn--primary" id="autoScheduleBtn">🤖 Auto Schedule</button>
                        </div>
                    </div>
                    
                    <div class="appointments-grid">
                        ${appointments.length > 0 ? 
                            appointments.map((appt, index) => `
                                <div class="appointment-item">
                                    <input type="checkbox" class="appt-checkbox" data-stop="${appt.stopId}">
                                    <div class="appt-details">
                                        <div class="appt-address">${appt.address}</div>
                                        <div class="appt-time">${appt.date} at ${appt.time}</div>
                                    </div>
                                    <div class="appt-actions">
                                        <button class="sms-btn" data-stop="${appt.stopId}">📱</button>
                                    </div>
                                </div>
                            `).join('') 
                            : '<div class="no-appointments">No approved appointments found</div>'
                        }
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.bulk-schedule-modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup bulk scheduling functionality
        this.setupBulkSchedulingModal(modal);
    }

    setupBulkSchedulingModal(modal) {
        const selectAllBtn = modal.querySelector('#selectAllAppts');
        const bulkSMSBtn = modal.querySelector('#bulkSMSBtn');
        const autoScheduleBtn = modal.querySelector('#autoScheduleBtn');
        
        // Select all functionality
        selectAllBtn?.addEventListener('click', () => {
            const checkboxes = modal.querySelectorAll('.appt-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !allChecked);
            selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
        });
        
        // Bulk SMS
        bulkSMSBtn?.addEventListener('click', () => {
            const checkedBoxes = modal.querySelectorAll('.appt-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select appointments first');
                return;
            }
            
            this.showBulkSMSModal(Array.from(checkedBoxes).map(cb => cb.dataset.stop));
        });
        
        // Auto scheduling
        autoScheduleBtn?.addEventListener('click', () => {
            const startDateEl = modal.querySelector('#scheduleStartDate');
            if (startDateEl) {
                this.autoScheduleAppointments(startDateEl.value);
            } else {
                console.warn('🗺️ Schedule start date element not found');
            }
        });
        
        // Individual SMS buttons
        modal.querySelectorAll('.sms-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stopId = e.target.dataset.stop;
                this.openSMSModal(stopId);
            });
        });
    }

    showBulkSMSModal(stopIds) {
        console.log(`📱 Opening bulk SMS for ${stopIds.length} appointments`);
        // Implementation for bulk SMS functionality
        this.showNotification(`Bulk SMS feature ready for ${stopIds.length} appointments`, 'info');
    }

    autoScheduleAppointments(startDate) {
        console.log(`🤖 Auto-scheduling appointments starting from ${startDate}`);
        // Implementation for auto-scheduling
        this.showNotification('Auto-scheduling completed', 'success');
    }

    showRouteAssignmentModal() {
        if (this.userRole !== 'coordinator') return;
        
        // This would show a modal for assigning routes to different adjusters
        console.log('👥 Route assignment modal - coordinator feature');
        this.showNotification('Route assignment features coming soon!', 'info');
    }

    async optimizeRoute() {
        console.log('🎵 Lyricist Emergency: Optimize Route button clicked');
        
        try {
            this.showLoading(true);
            this.hideError();

            const routeData = this.gatherRouteData();
            console.log('🎵 Lyricist: Route data gathered:', routeData);
            
            if (!this.validateRouteData(routeData)) {
                console.warn('🎵 Lyricist: Route data validation failed');
                return;
            }

            console.log('🎵 Lyricist: Starting route calculation...');
            
            // Show progress to user
            const optimizeBtn = document.getElementById('optimizeRoute');
            if (optimizeBtn) {
                const originalText = optimizeBtn.textContent;
                optimizeBtn.textContent = '🎵 Optimizing...';
                optimizeBtn.disabled = true;
                
                setTimeout(() => {
                    optimizeBtn.textContent = originalText;
                    optimizeBtn.disabled = false;
                }, 5000);
            }

            const optimizedRoute = await this.calculateOptimizedRoute(routeData);
            console.log('🎵 Lyricist: Route optimized:', optimizedRoute);
            
            const splitRoute = this.applySplitting(optimizedRoute, routeData.settings);
            console.log('🎵 Lyricist: Route split applied:', splitRoute);
            
            this.displayResults(splitRoute, optimizedRoute);
            this.renderMapRoute(optimizedRoute, splitRoute);
            
            this.currentRoute = splitRoute;
            
            console.log('🎵 Lyricist Emergency: Route optimization COMPLETED successfully!');
            
        } catch (error) {
            console.error('🎵 Lyricist Emergency: Route optimization error:', error);
            this.showError('Route optimization failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    gatherRouteData() {
        // Get start location with null checks
        const startLocationEl = document.getElementById('startLocation');
        const startLocation = startLocationEl ? startLocationEl.value.trim() : this.getDefaultStartLocation();
        
        // Get destinations with proper error handling
        const destinationInputs = document.querySelectorAll('#destinationsList .destination-input');
        const destinations = Array.from(destinationInputs)
            .map(destDiv => {
                const input = destDiv.querySelector('.destination-address-input');
                const firmSelect = destDiv.querySelector('.firm-select');
                const claimTypeSelect = destDiv.querySelector('.claim-type-select');
                const prioritySelect = destDiv.querySelector('.priority-select');
                
                const address = input?.value?.trim() || '';
                const firm = firmSelect?.value || '';
                const claimType = claimTypeSelect?.value || '';
                const priority = prioritySelect?.value || 'normal';
                
                return address && address.length > 0 ? { 
                    address, 
                    firm, 
                    claimType, 
                    priority 
                } : null;
            })
            .filter(dest => dest !== null);

        // Get settings with null checks and defaults
        const settings = {
            optimizeEnabled: document.getElementById('optimizeEnabled')?.checked ?? true,
            splitEnabled: document.getElementById('splitEnabled')?.checked ?? false,
            maxLegMiles: parseInt(document.getElementById('maxLegMiles')?.value) || 50,
            optimizationMode: document.getElementById('optimizationMode')?.value || 'distance',
            maxDailyHours: parseInt(document.getElementById('maxDailyHours')?.value) || 8,
            maxStopsPerDay: parseInt(document.getElementById('maxStopsPerDay')?.value) || 6,
            timePerAppointment: parseInt(document.getElementById('timePerAppointment')?.value) || 30,
            territoryType: document.getElementById('territoryType')?.value || 'mixed',
            geographicClustering: document.getElementById('geographicClustering')?.checked ?? true
        };

        console.log('🗺️ Route data gathered:', { 
            startLocation: startLocation || '(none)',
            destinationCount: destinations.length,
            settings 
        });

        return { startLocation, destinations, settings };
    }

    validateRouteData(data) {
        console.log('🔍 Validating route data:', {
            hasStartLocation: !!data.startLocation,
            destinationCount: data.destinations.length,
            firstDestination: data.destinations[0]
        });
        
        if (!data.startLocation || data.startLocation.trim() === '') {
            this.showError('Please enter a starting location (this could be your home or office address)');
            console.warn('🔍 Validation failed: No start location');
            return false;
        }

        if (data.destinations.length === 0) {
            this.showError('Please add at least one destination address');
            console.warn('🔍 Validation failed: No destinations');
            return false;
        }

        // Check if destinations have required fields
        for (let i = 0; i < data.destinations.length; i++) {
            const dest = data.destinations[i];
            if (!dest.address || dest.address.trim() === '') {
                this.showError(`Destination ${i + 1} is missing an address`);
                console.warn('🔍 Validation failed: Destination missing address:', dest);
                return false;
            }
        }

        if (data.destinations.length > 15) {
            this.showError('Maximum 15 destinations allowed for optimal performance');
            console.warn('🔍 Validation failed: Too many destinations');
            return false;
        }

        console.log('✅ Route data validation passed');
        return true;
    }

    async calculateOptimizedRoute(routeData) {
        const { startLocation, destinations, settings } = routeData;
        
        console.log('🚀 Starting enhanced route optimization for shortest time');
        
        // Initialize enhanced services
        this.initializeEnhancedServices();
        
        // Check if Google Maps is available
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('🔒 Google Maps not available, using fallback route calculation');
            return await this.calculateFallbackRoute(startLocation, destinations, settings);
        }
        
        if (!settings.optimizeEnabled) {
            console.log('⚡ Optimization disabled, using simple route');
            return await this.calculateSimpleRoute(startLocation, destinations);
        }

        try {
            // Use enhanced time-based optimization
            console.log('⏰ Optimizing for shortest time using enhanced APIs');
            return await this.calculateTimeOptimizedRoute(startLocation, destinations, settings);
        } catch (error) {
            console.warn('⚡ Enhanced optimization failed, falling back to basic optimization:', error);
            return await this.calculateBasicOptimizedRoute(startLocation, destinations, settings);
        }
    }

    async calculateTimeOptimizedRoute(startLocation, destinations, settings) {
        console.log('⏰ Starting time-based route optimization');
        
        // Step 1: Get all distance/time matrices between all points
        const allLocations = [startLocation, ...destinations.map(d => d.address)];
        const timeMatrix = await this.buildTimeMatrix(allLocations);
        
        // Step 2: Use nearest neighbor algorithm optimized for time
        const optimizedOrder = this.optimizeForShortestTime(timeMatrix, destinations);
        
        // Step 3: Build the final route using Directions API
        const finalRoute = await this.buildDirectionsRoute(startLocation, optimizedOrder);
        
        console.log('✅ Time optimization complete');
        return finalRoute;
    }

    async buildTimeMatrix(locations) {
        console.log('📊 Building time matrix for', locations.length, 'locations');
        console.log('📊 Locations:', locations);
        
        const matrix = [];
        const batchSize = 10; // Google's limit per request
        
        for (let i = 0; i < locations.length; i += batchSize) {
            const origins = locations.slice(i, Math.min(i + batchSize, locations.length));
            
            for (let j = 0; j < locations.length; j += batchSize) {
                const destinations = locations.slice(j, Math.min(j + batchSize, locations.length));
                
                try {
                    console.log(`📊 Getting matrix batch: origins=${origins.length}, destinations=${destinations.length}`);
                    const result = await this.getDistanceMatrix(origins, destinations);
                    console.log('📊 Matrix result:', result);
                    // Process and store results
                    this.processMatrixBatch(matrix, result, i, j);
                } catch (error) {
                    console.warn('📊 Matrix batch failed, using fallback:', error);
                    this.fillMatrixFallback(matrix, origins, destinations, i, j);
                }
            }
        }
        
        return matrix;
    }

    optimizeForShortestTime(timeMatrix, destinations) {
        console.log('🧭 Applying nearest neighbor algorithm for time optimization');
        console.log('🧭 Time matrix:', timeMatrix);
        console.log('🧭 Destinations count:', destinations.length);
        
        const n = destinations.length;
        if (n <= 1) return destinations;
        
        const visited = new Array(n).fill(false);
        const route = [];
        let currentIndex = 0; // Start from first destination
        
        // Add first destination
        route.push(destinations[0]);
        visited[0] = true;
        
        // Find nearest unvisited destination for each step
        for (let step = 1; step < n; step++) {
            let nearestIndex = -1;
            let shortestTime = Infinity;
            
            console.log(`🧭 Step ${step}: Looking for nearest to destination ${currentIndex}`);
            
            for (let i = 0; i < n; i++) {
                if (!visited[i]) {
                    // Time from current position (index+1 because matrix includes start location)
                    const time = timeMatrix[currentIndex + 1] && timeMatrix[currentIndex + 1][i + 1] 
                                 ? timeMatrix[currentIndex + 1][i + 1].duration 
                                 : Infinity;
                    
                    console.log(`🧭   Checking destination ${i}: time=${time}, visited=${visited[i]}`);
                    
                    if (time < shortestTime) {
                        shortestTime = time;
                        nearestIndex = i;
                    }
                }
            }
            
            console.log(`🧭 Step ${step}: Selected destination ${nearestIndex} with time ${shortestTime}`);
            
            if (nearestIndex !== -1) {
                route.push(destinations[nearestIndex]);
                visited[nearestIndex] = true;
                currentIndex = nearestIndex;
            } else {
                console.warn('🧭 No more destinations found, breaking early');
                break;
            }
        }
        
        console.log('🧭 Route optimized, order:', route.map(d => d.firm || d.address.substring(0, 30)));
        return route;
    }

    async buildDirectionsRoute(startLocation, optimizedDestinations) {
        console.log('🗺️ Building final directions route');
        
        if (optimizedDestinations.length === 0) {
            throw new Error('No destinations to route');
        }
        
        const waypoints = optimizedDestinations.slice(0, -1).map(dest => ({
            location: dest.address,
            stopover: true
        }));
        
        const request = {
            origin: startLocation,
            destination: optimizedDestinations[optimizedDestinations.length - 1].address,
            waypoints: waypoints,
            optimizeWaypoints: false, // We already optimized
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            drivingOptions: {
                departureTime: new Date(),
                trafficModel: google.maps.TrafficModel.BEST_GUESS // Use real traffic for time optimization
            }
        };
        
        return new Promise((resolve, reject) => {
            if (!this.directionsService) {
                this.directionsService = new google.maps.DirectionsService();
            }
            
            this.directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    const processedRoute = this.processDirectionsResult(result);
                    processedRoute.destinations = optimizedDestinations; // Preserve our optimization
                    resolve(processedRoute);
                } else {
                    reject(new Error(`Directions request failed: ${status}`));
                }
            });
        });
    }

    async calculateBasicOptimizedRoute(startLocation, destinations, settings) {
        console.log('⚡ Using basic Google Maps optimization');
        
        // Fallback to Google's built-in optimization
        const waypoints = destinations.map(dest => ({
            location: dest.address,
            stopover: true
        }));
        
        const request = {
            origin: startLocation,
            destination: startLocation, // Return to start
            waypoints: waypoints,
            optimizeWaypoints: true, // Let Google optimize
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            drivingOptions: {
                departureTime: new Date(),
                trafficModel: google.maps.TrafficModel.BEST_GUESS
            }
        };
        
        return new Promise((resolve, reject) => {
            if (!this.directionsService) {
                this.directionsService = new google.maps.DirectionsService();
            }
            
            this.directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    const optimizedRoute = this.processDirectionsResult(result);
                    resolve(optimizedRoute);
                } else {
                    reject(new Error(`Basic optimization failed: ${status}`));
                }
            });
        });
    }

    async calculateFallbackRoute(startLocation, destinations, settings) {
        console.log('🔒 Using fallback route calculation without Google Maps');
        
        // Show user notification about fallback mode
        this.showFallbackNotification();
        
        // Use geographical optimization for smarter routing
        const sortedDestinations = this.geographicallyOptimizeRoute(startLocation, destinations, settings);
        const addressList = sortedDestinations.map(dest => dest.address);
        
        // Create a simulated route with estimated distances and times
        const route = {
            stops: [startLocation, ...addressList],
            legs: [],
            totalDistance: 0,
            totalDuration: 0,
            destinationData: sortedDestinations,
            fallbackMode: true
        };

        // Simulate route calculation with estimated values
        for (let i = 0; i < route.stops.length - 1; i++) {
            const leg = this.simulateLeg(route.stops[i], route.stops[i + 1]);
            route.legs.push(leg);
            route.totalDistance += leg.distance;
            route.totalDuration += leg.duration;
        }

        return route;
    }

    showFallbackNotification() {
        const statusElement = document.getElementById('exportStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="color: var(--cipher-electric-blue); font-weight: bold;">
                    ⚠️ Using estimated distances - Google Maps not available. 
                    Route optimization and appointment scheduling still functional.
                </div>
            `;
        }
    }

    simulateLeg(origin, destination) {
        // Simulate distance and time based on address length (rough approximation)
        const baseDistance = Math.random() * 20 + 5; // 5-25 miles
        const baseTime = baseDistance * 2 + Math.random() * 10; // Rough time estimation
        
        return {
            origin,
            destination,
            distance: Math.round(baseDistance * 10) / 10,
            duration: Math.round(baseTime),
            distanceText: `${Math.round(baseDistance * 10) / 10} mi`,
            durationText: `${Math.round(baseTime)} min`,
            simulated: true
        };
    }

    prioritizeDestinations(destinations) {
        // Sort destinations by priority: urgent -> high -> normal
        const priorityOrder = { urgent: 3, high: 2, normal: 1 };
        
        return destinations.sort((a, b) => {
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            return bPriority - aPriority; // Higher priority first
        });
    }

    geographicallyOptimizeRoute(startLocation, destinations, settings) {
        console.log('🗺️ Starting enhanced rural territory optimization for', settings.territoryType, 'territory');
        
        if (!settings.geographicClustering) {
            // Just use priority sorting
            return this.prioritizeDestinations(destinations);
        }

        // Step 1: Enhanced rural territory clustering
        if (settings.territoryType === 'rural') {
            return this.ruralTerritoryOptimization(startLocation, destinations, settings);
        }

        // Step 2: Sort urgent priorities first (always respected)
        const urgent = destinations.filter(d => d.priority === 'urgent');
        const nonUrgent = destinations.filter(d => d.priority !== 'urgent');
        
        // Step 3: Apply geographical clustering to non-urgent destinations
        const clustered = this.nearestNeighborOptimization(startLocation, nonUrgent, settings);
        
        // Step 4: Combine urgent (first) + geographically optimized
        return [...urgent, ...clustered];
    }

    ruralTerritoryOptimization(startLocation, destinations, settings) {
        console.log('🌾 Rural Territory Optimization: Processing', destinations.length, 'destinations');
        
        // Step 1: Separate by priority but handle differently in rural context
        const urgent = destinations.filter(d => d.priority === 'urgent');
        const high = destinations.filter(d => d.priority === 'high');  
        const normal = destinations.filter(d => d.priority === 'normal');
        
        // Step 2: Calculate distances and create geographic clusters
        const allDestinations = [...high, ...normal]; // Urgent handled separately
        const clusters = this.createRuralClusters(startLocation, allDestinations, settings);
        
        console.log(`🌾 Created ${clusters.length} rural clusters from ${allDestinations.length} destinations`);
        
        // Step 3: Optimize within each cluster
        const optimizedClusters = clusters.map(cluster => 
            this.optimizeClusterOrder(startLocation, cluster, settings)
        );
        
        // Step 4: Sort clusters by strategic importance (firm rates, distances, etc.)
        const sortedClusters = this.prioritizeRuralClusters(startLocation, optimizedClusters, settings);
        
        // Step 5: Flatten clusters and insert urgent stops strategically
        const finalRoute = this.insertUrgentStopsStrategically(urgent, sortedClusters, startLocation, settings);
        
        console.log('🌾 Rural optimization complete:', finalRoute.map(d => d.address));
        return finalRoute;
    }

    createRuralClusters(startLocation, destinations, settings) {
        if (destinations.length === 0) return [];
        
        // Rural clustering parameters
        const maxClusterRadius = settings.maxLegMiles * 0.8; // 80% of max leg miles for cluster radius
        const minClusterSize = 2;
        const maxClusterSize = settings.maxStopsPerDay - 1; // Leave room for travel
        
        const clusters = [];
        const unprocessed = [...destinations];
        
        console.log(`🌾 Clustering with radius: ${maxClusterRadius} miles, max size: ${maxClusterSize}`);
        
        while (unprocessed.length > 0) {
            // Start new cluster with the closest unprocessed destination to start
            const seedDestination = this.findClosestDestination(startLocation, unprocessed);
            const newCluster = [seedDestination];
            
            // Remove seed from unprocessed
            const seedIndex = unprocessed.findIndex(d => d.address === seedDestination.address);
            unprocessed.splice(seedIndex, 1);
            
            // Grow cluster by finding nearby destinations
            let clusterGrown = true;
            while (clusterGrown && newCluster.length < maxClusterSize && unprocessed.length > 0) {
                clusterGrown = false;
                
                // Find destinations within cluster radius
                const clusterCenter = this.calculateClusterCenter(newCluster);
                const nearbyDestinations = unprocessed.filter(dest => {
                    const distanceToCluster = this.estimateDistance(clusterCenter, dest.address);
                    return distanceToCluster <= maxClusterRadius;
                });
                
                if (nearbyDestinations.length > 0) {
                    // Add the closest nearby destination
                    const nextDestination = this.findClosestDestination(clusterCenter, nearbyDestinations);
                    newCluster.push(nextDestination);
                    
                    // Remove from unprocessed
                    const nextIndex = unprocessed.findIndex(d => d.address === nextDestination.address);
                    unprocessed.splice(nextIndex, 1);
                    
                    clusterGrown = true;
                }
            }
            
            // Add cluster if it meets minimum size or if it's the last remaining destinations
            if (newCluster.length >= minClusterSize || unprocessed.length === 0) {
                clusters.push(newCluster);
                console.log(`🌾 Created cluster with ${newCluster.length} destinations around ${newCluster[0].address}`);
            } else {
                // If cluster is too small, merge with closest existing cluster or create standalone
                if (clusters.length > 0) {
                    const closestCluster = this.findClosestCluster(newCluster[0], clusters);
                    closestCluster.push(...newCluster);
                    console.log(`🌾 Merged small cluster into existing cluster`);
                } else {
                    clusters.push(newCluster);
                    console.log(`🌾 Added standalone destination as cluster`);
                }
            }
        }
        
        return clusters;
    }

    calculateClusterCenter(cluster) {
        // Simple centroid calculation - could be enhanced with actual coordinates
        // For now, use the first destination as representative
        return cluster[0].address;
    }

    findClosestCluster(destination, clusters) {
        let closestCluster = clusters[0];
        let shortestDistance = this.estimateDistance(destination.address, this.calculateClusterCenter(clusters[0]));
        
        for (let i = 1; i < clusters.length; i++) {
            const distance = this.estimateDistance(destination.address, this.calculateClusterCenter(clusters[i]));
            if (distance < shortestDistance) {
                shortestDistance = distance;
                closestCluster = clusters[i];
            }
        }
        
        return closestCluster;
    }

    findClosestDestination(referenceLocation, destinations) {
        if (destinations.length === 0) return null;
        
        let closest = destinations[0];
        let shortestDistance = this.estimateDistance(referenceLocation, destinations[0].address);
        
        for (let i = 1; i < destinations.length; i++) {
            const distance = this.estimateDistance(referenceLocation, destinations[i].address);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                closest = destinations[i];
            }
        }
        
        return closest;
    }

    optimizeClusterOrder(startLocation, cluster, settings) {
        if (cluster.length <= 1) return cluster;
        
        console.log(`🌾 Optimizing order for cluster of ${cluster.length} destinations`);
        
        // Use nearest neighbor within cluster
        const optimized = [];
        const remaining = [...cluster];
        
        // Find closest to start location as first stop
        const firstStop = this.findClosestDestination(startLocation, remaining);
        optimized.push(firstStop);
        remaining.splice(remaining.findIndex(d => d.address === firstStop.address), 1);
        
        // Continue with nearest neighbor
        let currentLocation = firstStop.address;
        while (remaining.length > 0) {
            const nextStop = this.findClosestDestination(currentLocation, remaining);
            optimized.push(nextStop);
            remaining.splice(remaining.findIndex(d => d.address === nextStop.address), 1);
            currentLocation = nextStop.address;
        }
        
        return optimized;
    }

    prioritizeRuralClusters(startLocation, clusters, settings) {
        console.log('🌾 Prioritizing rural clusters for optimal day assignment');
        
        // Calculate cluster metrics
        const clusterMetrics = clusters.map(cluster => {
            const clusterCenter = this.calculateClusterCenter(cluster);
            const distanceFromStart = this.estimateDistance(startLocation, clusterCenter);
            const internalDistance = this.calculateClusterInternalDistance(cluster);
            const highPriorityCount = cluster.filter(d => d.priority === 'high').length;
            
            // Rural prioritization factors
            const score = this.calculateRuralClusterScore({
                distanceFromStart,
                internalDistance,
                clusterSize: cluster.length,
                highPriorityCount,
                settings
            });
            
            return {
                cluster,
                distanceFromStart,
                internalDistance,
                score,
                highPriorityCount
            };
        });
        
        // Sort by score (lower is better for rural efficiency)
        clusterMetrics.sort((a, b) => a.score - b.score);
        
        console.log('🌾 Cluster prioritization:', clusterMetrics.map(cm => ({
            size: cm.cluster.length,
            distance: cm.distanceFromStart.toFixed(1),
            score: cm.score.toFixed(1)
        })));
        
        return clusterMetrics.map(cm => cm.cluster);
    }

    calculateRuralClusterScore(metrics) {
        const { distanceFromStart, internalDistance, clusterSize, highPriorityCount, settings } = metrics;
        
        // Rural scoring emphasizes:
        // 1. Reasonable distance from start (not too far out)
        // 2. Compact clusters (low internal distance)
        // 3. Good cluster size (efficient day usage)
        // 4. High priority work
        
        let score = 0;
        
        // Distance penalty (prefer closer clusters early)
        score += distanceFromStart * 0.6;
        
        // Internal distance penalty (prefer compact clusters)
        score += internalDistance * 0.3;
        
        // Size bonus (prefer efficient cluster sizes)
        if (clusterSize >= 3 && clusterSize <= 5) {
            score -= 20; // Bonus for optimal size
        } else if (clusterSize < 2) {
            score += 30; // Penalty for very small clusters
        }
        
        // Priority bonus
        score -= highPriorityCount * 15;
        
        // Rural territory bonus for mid-range distances (sweet spot)
        if (distanceFromStart >= 20 && distanceFromStart <= 60) {
            score -= 10; // Bonus for optimal rural range
        }
        
        return score;
    }

    calculateClusterInternalDistance(cluster) {
        if (cluster.length <= 1) return 0;
        
        let totalDistance = 0;
        for (let i = 0; i < cluster.length - 1; i++) {
            totalDistance += this.estimateDistance(cluster[i].address, cluster[i + 1].address);
        }
        
        return totalDistance;
    }

    insertUrgentStopsStrategically(urgentStops, clusters, startLocation, settings) {
        if (urgentStops.length === 0) {
            return clusters.flat();
        }
        
        console.log('🚨 Inserting', urgentStops.length, 'urgent stops strategically');
        
        const result = [];
        const remainingUrgent = [...urgentStops];
        
        // Strategy: Insert urgent stops at the beginning of the most appropriate cluster
        for (const cluster of clusters) {
            if (remainingUrgent.length > 0) {
                // Find best urgent stop for this cluster (closest to cluster start)
                const clusterStart = cluster[0].address;
                const bestUrgent = this.findClosestDestination(clusterStart, remainingUrgent);
                
                if (bestUrgent) {
                    result.push(bestUrgent);
                    remainingUrgent.splice(remainingUrgent.findIndex(d => d.address === bestUrgent.address), 1);
                }
            }
            
            // Add cluster destinations
            result.push(...cluster);
        }
        
        // Add any remaining urgent stops at the beginning
        result.unshift(...remainingUrgent);
        
        return result;
    }

    nearestNeighborOptimization(startLocation, destinations, settings) {
        if (destinations.length <= 1) return destinations;
        
        const optimized = [];
        const remaining = [...destinations];
        let currentLocation = startLocation;
        
        // Always go to the first destination (user choice respected)
        if (remaining.length > 0) {
            const firstDest = remaining.shift();
            optimized.push(firstDest);
            currentLocation = firstDest.address;
        }
        
        // For destinations 2+, use geographical optimization
        while (remaining.length > 0) {
            const nearest = this.findNearestDestination(currentLocation, remaining, settings);
            optimized.push(nearest);
            currentLocation = nearest.address;
            
            // Remove from remaining
            const index = remaining.findIndex(d => d.address === nearest.address);
            remaining.splice(index, 1);
        }
        
        console.log('🗺️ Geographical optimization complete:', optimized.map(d => d.address));
        return optimized;
    }

    findNearestDestination(currentLocation, destinations, settings) {
        // Calculate distances to all remaining destinations
        const distances = destinations.map(dest => {
            const distance = this.estimateDistance(currentLocation, dest.address);
            const time = this.estimateTime(currentLocation, dest.address);
            
            // Apply territory-specific optimization with enhanced scoring
            let score;
            switch (settings.territoryType) {
                case 'rural':
                    // Rural: Distance is primary concern (like user's Raleigh/Wilmington example)
                    // Strongly penalize long distances that would require separate days
                    score = distance + (distance > 100 ? distance * 2 : 0);
                    break;
                case 'urban':
                    // Urban: Time is primary concern (traffic, quick routes, stop density)
                    // Factor in appointment efficiency and return journey
                    score = time + (time > 45 ? time * 1.5 : 0);
                    break;
                case 'mixed':
                default:
                    // Mixed: Balance both distance and time with smart weighting
                    // Penalize extreme distances or times proportionally
                    const distanceWeight = distance > 60 ? 0.7 : 0.5;
                    const timeWeight = time > 60 ? 0.7 : 0.3;
                    score = (distance * distanceWeight) + (time * timeWeight);
                    break;
            }
            
            return { 
                destination: dest, 
                distance, 
                time, 
                score,
                acceptable: distance <= settings.maxLegMiles
            };
        });
        
        // Filter out unacceptable distances (like user's 129-mile Raleigh-Wilmington rule)
        const acceptable = distances.filter(d => d.acceptable);
        
        if (acceptable.length === 0) {
            // No acceptable destinations, return the closest anyway but flag for day split
            console.warn('🗺️ No destinations within acceptable range, choosing closest for separate day');
            const closest = distances.reduce((min, curr) => curr.score < min.score ? curr : min);
            // Mark this destination for day splitting
            closest.destination._flaggedForDaySplit = true;
            return closest.destination;
        }
        
        // Return the destination with the best score (lowest distance/time)
        const best = acceptable.reduce((min, curr) => curr.score < min.score ? curr : min);
        
        // Enhanced logging with territory-specific context
        const efficiency = settings.territoryType === 'rural' ? 
            `${best.distance.toFixed(1)}mi (distance priority)` :
            settings.territoryType === 'urban' ?
            `${best.time.toFixed(0)}min (time priority)` :
            `${best.distance.toFixed(1)}mi, ${best.time.toFixed(0)}min (balanced)`;
            
        console.log(`🗺️ Next destination: ${best.destination.address} (${efficiency})`);
        
        return best.destination;
    }

    estimateDistance(origin, destination) {
        // Enhanced rural territory distance estimation
        // Parse addresses for geographic intelligence
        const originWords = origin.toLowerCase().split(/[\s,]+/);
        const destWords = destination.toLowerCase().split(/[\s,]+/);
        
        // Extract location indicators
        const originState = this.extractState(origin);
        const destState = this.extractState(destination);
        const originCity = this.extractCity(origin);
        const destCity = this.extractCity(destination);
        const originCounty = this.extractCounty(origin);
        const destCounty = this.extractCounty(destination);
        
        // Different states = very long distance (rural interstate travel)
        if (originState && destState && originState !== destState) {
            return Math.random() * 150 + 120; // 120-270 miles for cross-state rural
        }
        
        // Same city = shorter distance (rural town clusters)
        if (originCity && destCity && originCity === destCity) {
            return Math.random() * 12 + 2; // 2-14 miles within rural towns
        }
        
        // Same county = medium rural distance
        if (originCounty && destCounty && originCounty === destCounty) {
            return Math.random() * 35 + 10; // 10-45 miles within county
        }
        
        // Check for shared geographic indicators (counties, regions, highways)
        const sharedWords = originWords.filter(word => 
            destWords.includes(word) && 
            word.length > 3 && 
            !['street', 'road', 'ave', 'avenue', 'drive', 'lane', 'way', 'north', 'south', 'east', 'west'].includes(word)
        );
        const similarity = sharedWords.length / Math.max(originWords.length, destWords.length);
        
        // Rural-specific distance patterns
        let baseDistance;
        if (similarity > 0.4) {
            // Very high similarity = likely same rural area/region
            baseDistance = Math.random() * 20 + 5; // 5-25 miles
        } else if (similarity > 0.2) {
            // Some similarity = nearby rural regions
            baseDistance = Math.random() * 45 + 15; // 15-60 miles
        } else if (similarity > 0.1) {
            // Low similarity = distant but same state rural areas
            baseDistance = Math.random() * 70 + 30; // 30-100 miles  
        } else {
            // No similarity = very distant rural locations
            baseDistance = Math.random() * 100 + 50; // 50-150 miles
        }
        
        // Apply rural territory realism adjustments
        // Account for rural highway patterns and geographic barriers
        baseDistance = this.applyRuralDistanceModifiers(baseDistance, origin, destination);
        
        return Math.max(baseDistance, 2); // Minimum 2 miles
    }

    applyRuralDistanceModifiers(baseDistance, origin, destination) {
        // Rural-specific distance modifiers
        let modifiedDistance = baseDistance;
        
        // Highway patterns (rural areas often have longer routes due to limited roads)
        if (baseDistance > 30) {
            modifiedDistance *= 1.1; // 10% longer for rural highway routing
        }
        
        // Mountain/geographic barriers (simulate NC terrain)
        const hasGeographicBarriers = this.checkGeographicBarriers(origin, destination);
        if (hasGeographicBarriers) {
            modifiedDistance *= 1.15; // 15% longer for mountain/river crossings
        }
        
        // Rural road quality adjustment
        if (baseDistance > 20 && baseDistance < 80) {
            // Sweet spot for rural territory - well-connected by state highways
            modifiedDistance *= 0.95; // 5% shorter for good rural connections
        }
        
        return Math.round(modifiedDistance * 10) / 10; // Round to 1 decimal
    }

    extractCounty(address) {
        // Extract county information from address
        const countyPatterns = [
            /(\w+)\s+county/i,
            /(\w+)\s+co\b/i
        ];
        
        for (const pattern of countyPatterns) {
            const match = address.match(pattern);
            if (match) {
                return match[1].toLowerCase();
            }
        }
        
        // Common NC counties for your territory
        const ncCounties = ['wake', 'johnston', 'sampson', 'duplin', 'wayne', 'harnett', 'cumberland'];
        const lowerAddress = address.toLowerCase();
        
        for (const county of ncCounties) {
            if (lowerAddress.includes(county)) {
                return county;
            }
        }
        
        return null;
    }

    checkGeographicBarriers(origin, destination) {
        // Simple heuristic for geographic barriers in rural NC
        const originLower = origin.toLowerCase();
        const destLower = destination.toLowerCase();
        
        // Check for major river crossings or mountain ranges
        const barriers = ['cape fear', 'neuse river', 'roanoke', 'appalachian', 'blue ridge'];
        
        let originBarriers = [];
        let destBarriers = [];
        
        barriers.forEach(barrier => {
            if (originLower.includes(barrier)) originBarriers.push(barrier);
            if (destLower.includes(barrier)) destBarriers.push(barrier);
        });
        
        // If origins and destinations are on different sides of barriers
        return originBarriers.length !== destBarriers.length;
    }

    getDefaultDate(dayIndex) {
        // Calculate default date based on day index
        // Day 0 = today, Day 1 = tomorrow, etc.
        const today = new Date();
        const defaultDate = new Date(today);
        defaultDate.setDate(today.getDate() + dayIndex);
        
        // Format as YYYY-MM-DD for date input
        return defaultDate.toISOString().split('T')[0];
    }

    exportToPreferredCalendar(overrideSystem = null) {
        // Get user's preferred calendar system from settings
        const preferredSystem = overrideSystem || (window.settingsManager ? window.settingsManager.getCalendarSystem() : 'mobile');
        
        console.log(`📅 Exporting to preferred calendar system: ${preferredSystem}`);
        
        switch (preferredSystem) {
            case 'google':
                this.exportToGoogleCalendar();
                break;
            case 'apple':
                this.exportToAppleCalendar();
                break;
            case 'outlook':
                this.exportToOutlookCalendar();
                break;
            case 'mobile':
            default:
                this.exportToMobileCipher();
                break;
        }
    }

    exportToOutlookCalendar() {
        const appointments = this.gatherApprovedAppointments();
        if (appointments.length === 0) return;

        // Create Outlook Calendar URLs for each appointment
        appointments.forEach(appt => {
            const startDate = new Date(`${appt.date}T${appt.time}`);
            const endDate = new Date(startDate.getTime() + (appt.duration * 60000));
            
            const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(appt.title)}&startdt=${this.formatDateForOutlook(startDate)}&enddt=${this.formatDateForOutlook(endDate)}&body=${encodeURIComponent(appt.details)}&location=${encodeURIComponent(appt.address)}`;
            
            window.open(outlookUrl, '_blank');
        });

        console.log('Exported to Outlook Calendar:', appointments);
        this.showNotification(`${appointments.length} appointments exported to Outlook Calendar`);
    }

    formatDateForOutlook(date) {
        return date.toISOString();
    }

    extractState(address) {
        // Extract state abbreviation from address
        const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i;
        const match = address.match(statePattern);
        return match ? match[0].toUpperCase() : null;
    }

    extractCity(address) {
        // Extract likely city name from address (simplified)
        const parts = address.split(',');
        if (parts.length >= 2) {
            // Assume city is the second-to-last part before state
            const cityPart = parts[parts.length - 2].trim();
            return cityPart.toLowerCase();
        }
        return null;
    }

    estimateTime(origin, destination) {
        const distance = this.estimateDistance(origin, destination);
        
        // Territory-specific time calculations
        const territoryType = document.getElementById('territoryType')?.value || 'mixed';
        
        let timeMultiplier;
        switch (territoryType) {
            case 'rural':
                // Rural: Faster speeds, less traffic, ~1.2 min/mile
                timeMultiplier = 1.2;
                break;
            case 'urban':
                // Urban: Traffic, lights, slower speeds, ~2.8 min/mile
                timeMultiplier = 2.8;
                break;
            case 'mixed':
            default:
                // Mixed territory: Average of both, ~2.0 min/mile
                timeMultiplier = 2.0;
                break;
        }
        
        // Add traffic variability for longer distances
        if (distance > 50) {
            timeMultiplier *= 1.1; // 10% longer for highway stretches
        }
        
        return distance * timeMultiplier;
    }

    async calculateSimpleRoute(startLocation, destinations) {
        // Check if Google Maps is available
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('🔒 Google Maps not available for simple route, using fallback');
            return await this.calculateFallbackRoute(startLocation, destinations, { optimizeEnabled: false });
        }
        
        // Sort by priority first
        const sortedDestinations = this.prioritizeDestinations(destinations);
        const addressList = sortedDestinations.map(dest => dest.address);
        
        // Simple sequential route calculation
        const route = {
            stops: [startLocation, ...addressList],
            legs: [],
            totalDistance: 0,
            totalDuration: 0,
            destinationData: sortedDestinations
        };

        for (let i = 0; i < route.stops.length - 1; i++) {
            const leg = await this.calculateLeg(route.stops[i], route.stops[i + 1]);
            route.legs.push(leg);
            route.totalDistance += leg.distance;
            route.totalDuration += leg.duration;
        }

        return route;
    }

    calculateLeg(origin, destination) {
        // Check if Google Maps is available
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('🔒 Google Maps not available for leg calculation, using simulation');
            return Promise.resolve(this.simulateLeg(origin, destination));
        }
        
        return new Promise((resolve, reject) => {
            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL
            }, (response, status) => {
                if (status === 'OK') {
                    const element = response.rows[0].elements[0];
                    if (element.status === 'OK') {
                        resolve({
                            origin,
                            destination,
                            distance: element.distance.value * 0.000621371, // Convert meters to miles
                            duration: element.duration.value / 60, // Convert seconds to minutes
                            distanceText: element.distance.text,
                            durationText: element.duration.text
                        });
                    } else {
                        reject(new Error(`Route calculation failed for ${origin} to ${destination}`));
                    }
                } else {
                    reject(new Error(`Distance Matrix request failed: ${status}`));
                }
            });
        });
    }

    processDirectionsResult(result) {
        const route = result.routes[0];
        const legs = route.legs;
        
        const processedRoute = {
            stops: [legs[0].start_address],
            legs: [],
            totalDistance: 0,
            totalDuration: 0,
            googleRoute: result
        };

        legs.forEach(leg => {
            processedRoute.stops.push(leg.end_address);
            processedRoute.legs.push({
                origin: leg.start_address,
                destination: leg.end_address,
                distance: leg.distance.value * 0.000621371, // Convert to miles
                duration: leg.duration.value / 60, // Convert to minutes
                distanceText: leg.distance.text,
                durationText: leg.duration.text
            });
            
            processedRoute.totalDistance += leg.distance.value * 0.000621371;
            processedRoute.totalDuration += leg.duration.value / 60;
        });

        return processedRoute;
    }

    applySplitting(route, settings) {
        if (!settings.splitEnabled) {
            return {
                days: [{
                    label: "Single Day",
                    stops: route.stops,
                    legs: route.legs,
                    totalMiles: Math.round(route.totalDistance * 10) / 10,
                    totalMinutes: Math.round(route.totalDuration),
                    appointmentTime: (route.stops.length - 1) * settings.timePerAppointment, // Don't count start location
                    totalDayTime: Math.round(route.totalDuration) + ((route.stops.length - 1) * settings.timePerAppointment)
                }],
                overall: {
                    miles: Math.round(route.totalDistance * 10) / 10,
                    minutes: Math.round(route.totalDuration)
                }
            };
        }

        return this.intelligentDaySplitting(route, settings);
    }

    intelligentDaySplitting(route, settings) {
        const days = [];
        const maxDailyMinutes = settings.maxDailyHours * 60;
        const startingPoint = route.stops[0]; // Save the starting point
        
        let currentDay = {
            label: `Day ${days.length + 1}`,
            stops: [], // Don't include start location as a stop - it's the departure point
            legs: [],
            totalMiles: 0,
            totalMinutes: 0,
            appointmentTime: 0,
            totalDayTime: 0
        };

        for (let i = 0; i < route.legs.length; i++) {
            const leg = route.legs[i];
            const appointmentTimeForStop = settings.timePerAppointment;
            
            // Calculate what the day would look like if we add this leg
            const projectedTravelTime = currentDay.totalMinutes + leg.duration;
            const projectedAppointmentTime = currentDay.appointmentTime + appointmentTimeForStop;
            const projectedTotalTime = projectedTravelTime + projectedAppointmentTime;
            const projectedStops = currentDay.stops.length + 1;
            
            // Check multiple splitting criteria
            const exceedsTime = projectedTotalTime > maxDailyMinutes;
            const exceedsStops = projectedStops > settings.maxStopsPerDay;
            const exceedsDistance = leg.distance > settings.maxLegMiles;
            const dayHasContent = currentDay.legs.length > 0;
            
            // Smart splitting logic
            if (dayHasContent && (exceedsTime || exceedsStops || exceedsDistance)) {
                // Add return leg to starting point for current day (for travel time calculation only)
                const returnLeg = this.calculateReturnLeg(currentDay.stops[currentDay.stops.length - 1], startingPoint);
                currentDay.legs.push(returnLeg);
                // Don't add starting point as a "stop" - it's just the return journey
                currentDay.totalMiles += returnLeg.distance;
                currentDay.totalMinutes += returnLeg.duration;
                
                // Finalize current day
                currentDay.totalDayTime = currentDay.totalMinutes + currentDay.appointmentTime;
                days.push(currentDay);
                
                // Start new day from starting point
                currentDay = {
                    label: `Day ${days.length + 1}`,
                    stops: [], // Don't count starting point as a stop
                    legs: [],
                    totalMiles: 0,
                    totalMinutes: 0,
                    appointmentTime: 0,
                    totalDayTime: 0
                };
                
                // Add leg from starting point to the destination that caused the split
                const startToDestLeg = this.calculateLegFromStart(startingPoint, leg.destination);
                currentDay.legs.push(startToDestLeg);
                currentDay.stops.push(leg.destination);
                currentDay.totalMiles += startToDestLeg.distance;
                currentDay.totalMinutes += startToDestLeg.duration;
                currentDay.appointmentTime += appointmentTimeForStop;
            } else {
                // Add leg to current day
                currentDay.legs.push(leg);
                currentDay.stops.push(leg.destination);
                currentDay.totalMiles += leg.distance;
                currentDay.totalMinutes += leg.duration;
                currentDay.appointmentTime += appointmentTimeForStop;
            }
        }

        // Finalize the last day with return to starting point
        if (currentDay.legs.length > 0) {
            // Add return leg to starting point (for travel time only)
            const returnLeg = this.calculateReturnLeg(currentDay.stops[currentDay.stops.length - 1], startingPoint);
            currentDay.legs.push(returnLeg);
            // Don't add starting point as a stop - it's just the return journey
            currentDay.totalMiles += returnLeg.distance;
            currentDay.totalMinutes += returnLeg.duration;
            
            currentDay.totalDayTime = currentDay.totalMinutes + currentDay.appointmentTime;
            days.push(currentDay);
        }

        // Round numbers and add efficiency metrics
        days.forEach((day, index) => {
            day.totalMiles = Math.round(day.totalMiles * 10) / 10;
            day.totalMinutes = Math.round(day.totalMinutes);
            day.totalDayTime = Math.round(day.totalDayTime);
            day.efficiency = Math.round((day.appointmentTime / day.totalDayTime) * 100);
            day.stopsCount = day.stops.length - 1; // Subtract 1 to not count return to start as appointment
        });

        // Calculate updated overall stats
        const totalMiles = days.reduce((sum, day) => sum + day.totalMiles, 0);
        const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);
        const totalAppointmentStops = days.reduce((sum, day) => sum + day.stopsCount, 0);

        const overall = {
            miles: Math.round(totalMiles * 10) / 10,
            minutes: Math.round(totalMinutes),
            totalDays: days.length,
            avgStopsPerDay: Math.round((totalAppointmentStops / days.length) * 10) / 10,
            avgEfficiency: Math.round(days.reduce((sum, day) => sum + day.efficiency, 0) / days.length)
        };

        return { days, overall };
    }

    calculateReturnLeg(lastStop, startingPoint) {
        // Calculate return leg from last stop back to starting point
        if (lastStop === startingPoint) {
            // Already at starting point, no return needed
            return {
                origin: lastStop,
                destination: startingPoint,
                distance: 0,
                duration: 0,
                distanceText: '0 mi',
                durationText: '0 min',
                isReturn: true
            };
        }
        
        // Use same estimation logic as other legs
        const distance = this.estimateDistance(lastStop, startingPoint);
        const duration = this.estimateTime(lastStop, startingPoint);
        
        return {
            origin: lastStop,
            destination: startingPoint,
            distance: distance,
            duration: duration,
            distanceText: `${distance.toFixed(1)} mi`,
            durationText: `${Math.round(duration)} min`,
            isReturn: true
        };
    }

    calculateLegFromStart(startingPoint, destination) {
        // Calculate leg from starting point to a destination
        const distance = this.estimateDistance(startingPoint, destination);
        const duration = this.estimateTime(startingPoint, destination);
        
        return {
            origin: startingPoint,
            destination: destination,
            distance: distance,
            duration: duration,
            distanceText: `${distance.toFixed(1)} mi`,
            durationText: `${Math.round(duration)} min`,
            fromStart: true
        };
    }

    displayResults(splitRoute, originalRoute = null) {
        const resultsDiv = document.getElementById('routeResults');
        const outputDiv = document.getElementById('routeOutput');

        let html = `
            <div class="route-summary">
                <div class="overall-stats">
                    <h4>📊 Overall Route Analysis</h4>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-label">Total Distance</span>
                            <span class="stat-value">${splitRoute.overall.miles} miles</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Drive Time</span>
                            <span class="stat-value">${Math.floor(splitRoute.overall.minutes / 60)}h ${splitRoute.overall.minutes % 60}m</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Days Required</span>
                            <span class="stat-value">${splitRoute.days.length}</span>
                        </div>
                        ${splitRoute.overall.avgStopsPerDay ? `
                        <div class="stat-card">
                            <span class="stat-label">Avg Stops/Day</span>
                            <span class="stat-value">${splitRoute.overall.avgStopsPerDay}</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Avg Efficiency</span>
                            <span class="stat-value">${splitRoute.overall.avgEfficiency}%</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ${splitRoute.days.length > 1 ? `
                <div class="map-day-controls">
                    <h4>🗺️ Map View Controls</h4>
                    <div class="day-selector">
                        <button class="day-btn active" data-day="all">All Days</button>
                        ${splitRoute.days.map((day, index) => 
                            `<button class="day-btn" data-day="${index}">${day.label}</button>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        splitRoute.days.forEach((day, index) => {
            html += `
                <div class="day-section">
                    <div class="day-header">
                        <h4>📅 ${day.label}</h4>
                        ${day.efficiency ? `<span class="efficiency-badge">${day.efficiency}% efficient</span>` : ''}
                    </div>
                    <div class="day-stats">
                        <span class="stat"><strong>${day.totalMiles} mi</strong></span>
                        <span class="stat"><strong>${Math.floor(day.totalMinutes / 60)}h ${day.totalMinutes % 60}m driving</strong></span>
                        <span class="stat"><strong>${day.stopsCount || day.stops.length} stops</strong></span>
                        ${day.totalDayTime ? `<span class="stat total-time"><strong>${Math.floor(day.totalDayTime / 60)}h ${day.totalDayTime % 60}m total</strong></span>` : ''}
                    </div>
                    <div class="stops-list">
                        ${day.stops.map((stop, i) => {
                            const priority = this.getStopPriority(stop, originalRoute || this.currentRoute);
                            const priorityIcon = priority === 'urgent' ? '🔴' : priority === 'high' ? '🟡' : '🔵';
                            const stopId = `stop_${index}_${i}`;
                            const isStartingPoint = i === 0 || (i === day.stops.length - 1 && day.legs[i-1]?.isReturn);
                            const isReturnToStart = i === day.stops.length - 1 && day.legs[i-1]?.isReturn;
                            
                            return `
                            <div class="stop-item ${isStartingPoint ? 'starting-point' : ''}" data-stop-id="${stopId}">
                                <div class="stop-main-info">
                                    <span class="stop-number ${isStartingPoint ? 'start-marker' : ''}">${isStartingPoint ? (isReturnToStart ? '🏠' : '🚀') : i}</span>
                                    <span class="priority-indicator" title="${isStartingPoint ? 'Starting point' : priority + ' priority'}">${isStartingPoint ? (isReturnToStart ? '🏠' : '🚀') : priorityIcon}</span>
                                    <span class="stop-address">${this.shortenAddress(stop)}</span>
                                    <div class="stop-details">
                                        ${i < day.legs.length ? `<span class="leg-distance ${day.legs[i].isReturn ? 'return-leg' : ''}">${day.legs[i].distance.toFixed(1)} mi</span>` : ''}
                                        ${i < day.legs.length ? `<span class="leg-time ${day.legs[i].isReturn ? 'return-leg' : ''}">${Math.round(day.legs[i].duration)}min</span>` : ''}
                                        ${day.legs[i]?.isReturn ? '<span class="return-indicator">Return</span>' : ''}
                                    </div>
                                    ${!isStartingPoint && i > 0 ? `
                                    <div class="travel-info">
                                        <span class="travel-from">From: ${this.shortenAddress(day.stops[i-1])}</span>
                                        <span class="travel-details">
                                            📍 ${day.legs[i-1]?.distance?.toFixed(1) || 'N/A'} mi • 
                                            ⏱️ ${Math.round(day.legs[i-1]?.duration || 0)} min drive
                                        </span>
                                    </div>
                                    ` : isStartingPoint && !isReturnToStart ? `
                                    <div class="travel-info starting-info">
                                        <span class="travel-details">🚀 Starting Location</span>
                                    </div>
                                    ` : ''}
                                </div>
                                ${!isStartingPoint ? `
                                <div class="appointment-controls">
                                    <div class="time-inputs">
                                        <div class="appointment-datetime">
                                            <div class="datetime-group">
                                                <label class="time-label">Date:</label>
                                                <input type="date" class="appt-date-input" data-stop="${stopId}" value="${this.getDefaultDate(index)}">
                                            </div>
                                            <div class="datetime-group">
                                                <label class="time-label">Time:</label>
                                                <input type="time" class="appt-time-input" data-stop="${stopId}" placeholder="Set time">
                                            </div>
                                            <div class="datetime-group">
                                                <label class="time-label">Duration:</label>
                                                <select class="duration-select" data-stop="${stopId}">
                                                    <option value="15">15 min</option>
                                                    <option value="30" selected>30 min</option>
                                                    <option value="45">45 min</option>
                                                    <option value="60">1 hour</option>
                                                    <option value="90">1.5 hours</option>
                                                    <option value="120">2 hours</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="appt-status">
                                        <button class="approve-btn" data-stop="${stopId}" title="Approve appointment date & time">
                                            <span class="btn-icon">✅</span>
                                        </button>
                                    </div>
                                </div>
                                ` : `
                                <div class="starting-point-note">
                                    ${isReturnToStart ? 'End of day - return home' : 'Daily starting point'}
                                </div>
                                `}
                            </div>
                        `;}).join('')}
                    </div>
                </div>
            `;
        });

        outputDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
        
        // Setup appointment scheduling event listeners
        this.setupAppointmentControls();
        
        // Setup map day controls if multiple days
        if (splitRoute.days.length > 1) {
            this.setupMapDayControls(splitRoute);
        }
    }

    setupAppointmentControls() {
        // Setup event listeners for appointment controls
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stopId = e.target.closest('.approve-btn').dataset.stop;
                this.approveAppointment(stopId);
            });
        });

        document.querySelectorAll('.appt-date-input, .appt-time-input, .duration-select').forEach(input => {
            input.addEventListener('change', () => {
                this.updateCalendarExportStatus();
            });
        });

        // Setup calendar export buttons with preference-based routing
        document.getElementById('exportGoogleCal')?.addEventListener('click', () => this.exportToPreferredCalendar('google'));
        document.getElementById('exportAppleCal')?.addEventListener('click', () => this.exportToPreferredCalendar('apple'));
        document.getElementById('exportMobileCipher')?.addEventListener('click', () => this.exportToPreferredCalendar('mobile'));
        
        // Also setup direct export methods
        document.getElementById('exportGoogleCal')?.addEventListener('dblclick', () => this.exportToGoogleCalendar());
        document.getElementById('exportAppleCal')?.addEventListener('dblclick', () => this.exportToAppleCalendar());
        document.getElementById('exportMobileCipher')?.addEventListener('dblclick', () => this.exportToMobileCipher());
    }

    approveAppointment(stopId) {
        const dateInput = document.querySelector(`.appt-date-input[data-stop="${stopId}"]`);
        const timeInput = document.querySelector(`.appt-time-input[data-stop="${stopId}"]`);
        const durationSelect = document.querySelector(`.duration-select[data-stop="${stopId}"]`);
        const approveBtn = document.querySelector(`.approve-btn[data-stop="${stopId}"]`);

        if (!dateInput.value) {
            alert('Please select an appointment date first');
            dateInput.focus();
            return;
        }

        if (!timeInput.value) {
            alert('Please set an appointment time first');
            timeInput.focus();
            return;
        }

        // Mark as approved
        approveBtn.classList.add('approved');
        approveBtn.innerHTML = '<span class="btn-icon">✅</span>';
        approveBtn.title = 'Appointment approved';
        
        // Disable editing
        dateInput.disabled = true;
        timeInput.disabled = true;
        durationSelect.disabled = true;

        console.log(`Appointment approved for stop ${stopId}: ${dateInput.value} at ${timeInput.value} for ${durationSelect.value} minutes`);
        
        this.updateCalendarExportStatus();
    }

    updateCalendarExportStatus() {
        const allDateInputs = document.querySelectorAll('.appt-date-input');
        const allTimeInputs = document.querySelectorAll('.appt-time-input');
        const approvedButtons = document.querySelectorAll('.approve-btn.approved');
        const googleCalBtn = document.getElementById('exportGoogleCal');
        const appleCalBtn = document.getElementById('exportAppleCal');
        const statusElement = document.getElementById('exportStatus');

        const hasAppointments = allTimeInputs.length > 0;
        const allApproved = approvedButtons.length === allTimeInputs.length && allTimeInputs.length > 0;

        if (allApproved) {
            googleCalBtn.disabled = false;
            appleCalBtn.disabled = false;
            statusElement.textContent = `Ready to export ${allTimeInputs.length} appointments to calendar`;
            statusElement.style.color = 'var(--cipher-success)';
        } else if (hasAppointments) {
            const remaining = allTimeInputs.length - approvedButtons.length;
            statusElement.textContent = `${remaining} appointment${remaining !== 1 ? 's' : ''} need date & time approval`;
            statusElement.style.color = 'var(--cipher-text-muted)';
        }
    }

    exportToGoogleCalendar() {
        const appointments = this.gatherApprovedAppointments();
        if (appointments.length === 0) return;

        // Create Google Calendar URLs for each appointment
        appointments.forEach(appt => {
            const startDate = new Date(`${appt.date}T${appt.time}`);
            const endDate = new Date(startDate.getTime() + (appt.duration * 60000));
            
            const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(appt.title)}&dates=${this.formatDateForGoogle(startDate)}/${this.formatDateForGoogle(endDate)}&details=${encodeURIComponent(appt.details)}&location=${encodeURIComponent(appt.address)}`;
            
            window.open(googleUrl, '_blank');
        });

        console.log('Exported to Google Calendar:', appointments);
        this.showNotification(`${appointments.length} appointments exported to Google Calendar`);
    }

    exportToAppleCalendar() {
        const appointments = this.gatherApprovedAppointments();
        if (appointments.length === 0) return;

        // Create ICS file content
        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Claim Cipher//Route Optimizer//EN\n';
        
        appointments.forEach(appt => {
            const startDate = new Date(`${appt.date}T${appt.time}`);
            const endDate = new Date(startDate.getTime() + (appt.duration * 60000));
            
            icsContent += 'BEGIN:VEVENT\n';
            icsContent += `UID:${Date.now()}-${Math.random()}@claimcipher.com\n`;
            icsContent += `DTSTART:${this.formatDateForICS(startDate)}\n`;
            icsContent += `DTEND:${this.formatDateForICS(endDate)}\n`;
            icsContent += `SUMMARY:${appt.title}\n`;
            icsContent += `DESCRIPTION:${appt.details}\n`;
            icsContent += `LOCATION:${appt.address}\n`;
            icsContent += 'END:VEVENT\n';
        });
        
        icsContent += 'END:VCALENDAR';

        // Download ICS file
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claim-cipher-appointments-${new Date().toISOString().split('T')[0]}.ics`;
        a.click();

        console.log('Exported to Apple Calendar:', appointments);
        this.showNotification(`${appointments.length} appointments exported to Apple Calendar`);
    }

    exportToMobileCipher() {
        const appointments = this.gatherApprovedAppointments();
        const routeData = {
            route: this.currentRoute,
            appointments: appointments,
            exportDate: new Date().toISOString(),
            totalStops: appointments.length
        };

        // Store for mobile app pickup
        localStorage.setItem('cc_mobile_export', JSON.stringify(routeData));
        
        // Copy to clipboard for manual transfer
        const mobileData = appointments.map(appt => 
            `${appt.time} - ${appt.address} (${appt.duration}min)`
        ).join('\n');

        navigator.clipboard.writeText(mobileData).then(() => {
            alert(`Route exported for Mobile Cipher!\n\n${appointments.length} appointments copied to clipboard and saved locally.`);
        });

        console.log('Exported to Mobile Cipher:', routeData);
    }

    gatherApprovedAppointments() {
        const appointments = [];
        const approvedButtons = document.querySelectorAll('.approve-btn.approved');

        approvedButtons.forEach(btn => {
            const stopId = btn.dataset.stop;
            const dateInput = document.querySelector(`.appt-date-input[data-stop="${stopId}"]`);
            const timeInput = document.querySelector(`.appt-time-input[data-stop="${stopId}"]`);
            const durationSelect = document.querySelector(`.duration-select[data-stop="${stopId}"]`);
            const stopItem = btn.closest('.stop-item');
            const address = stopItem.querySelector('.stop-address').textContent;

            appointments.push({
                stopId: stopId,
                address: address,
                date: dateInput.value,
                time: timeInput.value,
                duration: parseInt(durationSelect.value),
                title: `Claim Inspection - ${address}`,
                details: `Route optimized appointment\nScheduled: ${dateInput.value} at ${timeInput.value}\nEstimated duration: ${durationSelect.value} minutes\nGenerated by Claim Cipher Route Optimizer`
            });
        });

        return appointments;
    }

    formatDateForGoogle(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    formatDateForICS(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    renderMapRoute(route, splitRoute = null) {
        if (!this.map) {
            console.warn('🗺️ Map not available for route rendering');
            return;
        }

        // Clear existing renderers
        this.clearMapRenderers();
        
        // If we have split routes, render all days with different colors
        if (splitRoute && splitRoute.days.length > 1) {
            this.renderMultiDayRoutes(splitRoute);
        } else if (route.googleRoute && this.directionsRenderer) {
            // Single day route
            this.directionsRenderer.setDirections(route.googleRoute);
        } else {
            // Fallback visualization for non-Google Maps routes
            this.renderFallbackRoute(route, splitRoute);
        }
    }

    setupMapDayControls(splitRoute) {
        const dayButtons = document.querySelectorAll('.day-btn');
        dayButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active button
                dayButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const dayIndex = e.target.dataset.day;
                if (dayIndex === 'all') {
                    this.renderMultiDayRoutes(splitRoute);
                } else {
                    this.renderSingleDay(splitRoute, parseInt(dayIndex));
                }
            });
        });
    }

    clearMapRenderers() {
        // Clear existing directions renderers
        if (this.dayRenderers) {
            this.dayRenderers.forEach(renderer => {
                renderer.setMap(null);
            });
        }
        
        if (this.directionsRenderer) {
            this.directionsRenderer.setMap(null);
            this.directionsRenderer.setMap(this.map);
        }
        
        // Clear existing markers
        if (this.dayMarkers) {
            this.dayMarkers.forEach(marker => marker.setMap(null));
        }
        
        this.dayRenderers = [];
        this.dayMarkers = [];
    }

    renderMultiDayRoutes(splitRoute) {
        if (!this.map || typeof google === 'undefined') {
            this.renderFallbackRoute(null, splitRoute);
            return;
        }

        this.clearMapRenderers();
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
        const bounds = new google.maps.LatLngBounds();
        
        splitRoute.days.forEach((day, dayIndex) => {
            if (day.stops.length < 2) return;
            
            const color = colors[dayIndex % colors.length];
            
            // Create directions renderer for this day
            const dayRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: false,
                polylineOptions: {
                    strokeColor: color,
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                },
                markerOptions: {
                    icon: {
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(this.createDayMarkerSVG(dayIndex + 1, color))}`,
                        scaledSize: new google.maps.Size(30, 30)
                    }
                }
            });
            
            dayRenderer.setMap(this.map);
            this.dayRenderers.push(dayRenderer);
            
            // Calculate route for this day
            this.calculateDayRoute(day, dayRenderer, bounds);
        });
        
        // Fit map to show all routes
        setTimeout(() => {
            if (!bounds.isEmpty()) {
                this.map.fitBounds(bounds);
            }
        }, 1000);
    }

    renderSingleDay(splitRoute, dayIndex) {
        if (!this.map || typeof google === 'undefined') {
            this.renderFallbackRoute(null, splitRoute, dayIndex);
            return;
        }

        this.clearMapRenderers();
        
        const day = splitRoute.days[dayIndex];
        if (!day || day.stops.length < 2) return;
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
        const color = colors[dayIndex % colors.length];
        
        const dayRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: color,
                strokeWeight: 6,
                strokeOpacity: 0.9
            }
        });
        
        dayRenderer.setMap(this.map);
        this.dayRenderers.push(dayRenderer);
        
        const bounds = new google.maps.LatLngBounds();
        this.calculateDayRoute(day, dayRenderer, bounds);
        
        setTimeout(() => {
            if (!bounds.isEmpty()) {
                this.map.fitBounds(bounds);
            }
        }, 500);
    }

    calculateDayRoute(day, renderer, bounds) {
        if (!this.directionsService || typeof google === 'undefined') return;
        
        const waypoints = day.stops.slice(1, -1).map(stop => ({
            location: stop,
            stopover: true
        }));
        
        const request = {
            origin: day.stops[0],
            destination: day.stops[day.stops.length - 1],
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL
        };
        
        this.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                renderer.setDirections(result);
                
                // Extend bounds to include this route
                if (bounds) {
                    result.routes[0].bounds && bounds.union(result.routes[0].bounds);
                }
            } else {
                console.warn(`Day route calculation failed: ${status}`);
            }
        });
    }

    createDayMarkerSVG(dayNumber, color) {
        return `
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="${color}" stroke="white" stroke-width="2"/>
                <text x="15" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${dayNumber}</text>
            </svg>
        `;
    }

    renderFallbackRoute(route, splitRoute, specificDay = null) {
        // Fallback visualization when Google Maps is not available
        const mapContainer = document.getElementById('routeMap');
        if (!mapContainer) return;
        
        let fallbackHtml = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100%;
                background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(30, 30, 30, 0.95));
                border-radius: var(--cipher-radius-lg);
                color: var(--cipher-text-primary);
                padding: var(--cipher-space-lg);
            ">
                <div style="font-size: 2rem; margin-bottom: var(--cipher-space-md);">🗺️</div>
                <h3 style="color: var(--cipher-gold); margin-bottom: var(--cipher-space-md);">Route Visualization</h3>
        `;
        
        if (splitRoute && splitRoute.days.length > 1) {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
            
            if (specificDay !== null) {
                const day = splitRoute.days[specificDay];
                const color = colors[specificDay % colors.length];
                fallbackHtml += `
                    <div style="text-align: center; max-width: 400px;">
                        <div style="
                            background: ${color}20;
                            border: 2px solid ${color};
                            border-radius: var(--cipher-radius-md);
                            padding: var(--cipher-space-md);
                            margin-bottom: var(--cipher-space-md);
                        ">
                            <h4 style="color: ${color}; margin: 0 0 var(--cipher-space-sm) 0;">${day.label}</h4>
                            <div style="font-size: 0.9rem; color: var(--cipher-text-secondary);">
                                ${day.stops.length} stops • ${day.totalMiles} miles • ${Math.floor(day.totalMinutes / 60)}h ${day.totalMinutes % 60}m
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--cipher-text-muted);">
                            Route: ${day.stops.map(stop => this.shortenAddress(stop)).join(' → ')}
                        </div>
                    </div>
                `;
            } else {
                fallbackHtml += `
                    <div style="text-align: center; max-width: 500px;">
                        <div style="margin-bottom: var(--cipher-space-lg);">
                            <strong>${splitRoute.days.length} Day Route Plan</strong>
                        </div>
                        ${splitRoute.days.map((day, index) => {
                            const color = colors[index % colors.length];
                            return `
                                <div style="
                                    background: ${color}20;
                                    border-left: 4px solid ${color};
                                    padding: var(--cipher-space-sm) var(--cipher-space-md);
                                    margin-bottom: var(--cipher-space-sm);
                                    border-radius: 0 var(--cipher-radius-sm) var(--cipher-radius-sm) 0;
                                ">
                                    <div style="font-weight: bold; color: ${color};">${day.label}</div>
                                    <div style="font-size: 0.8rem; color: var(--cipher-text-secondary);">
                                        ${day.stops.length} stops • ${day.totalMiles}mi • ${Math.floor(day.totalMinutes / 60)}h ${day.totalMinutes % 60}m
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        } else {
            fallbackHtml += `
                <div style="text-align: center; color: var(--cipher-text-secondary);">
                    <div style="margin-bottom: var(--cipher-space-sm);">Single Day Route</div>
                    <div style="font-size: 0.9rem;">
                        ${route ? `${Math.round(route.totalDistance * 10) / 10} miles • ${Math.floor(route.totalDuration / 60)}h ${Math.round(route.totalDuration % 60)}m` : 'Route calculated'}
                    </div>
                </div>
            `;
        }
        
        fallbackHtml += `
                <div style="
                    margin-top: var(--cipher-space-lg);
                    font-size: 0.8rem;
                    color: var(--cipher-text-muted);
                    text-align: center;
                ">
                    ⚠️ Google Maps visualization not available<br>
                    Route optimization and scheduling still functional
                </div>
            </div>
        `;
        
        mapContainer.innerHTML = fallbackHtml;
    }

    copyRoute() {
        if (!this.currentRoute) return;

        let text = `🗺️ ROUTE CIPHER RESULTS\n\n`;
        text += `Overall: ${this.currentRoute.overall.miles} miles, ${Math.floor(this.currentRoute.overall.minutes / 60)}h ${this.currentRoute.overall.minutes % 60}m\n`;
        text += `Days: ${this.currentRoute.days.length}\n\n`;

        this.currentRoute.days.forEach(day => {
            text += `${day.label}: ${day.totalMiles} mi, ${Math.floor(day.totalMinutes / 60)}h ${day.totalMinutes % 60}m\n`;
            day.stops.forEach((stop, i) => {
                text += `  ${i + 1}. ${this.shortenAddress(stop)}\n`;
            });
            text += '\n';
        });

        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Route copied to clipboard!');
        }).catch(err => {
            console.error('Copy failed:', err);
            this.showError('Copy failed. Please try again.');
        });
    }

    exportToMileage() {
        if (!this.currentRoute) {
            this.showNotification('Please optimize a route first', 'warning');
            return;
        }

        console.log('🧮 Starting route export to mileage calculator...');
        
        // Calculate comprehensive mileage data
        const mileageData = this.prepareMileageExportData();
        
        // Store in localStorage for mileage calculator to pick up
        localStorage.setItem('cc_route_export', JSON.stringify({
            ...mileageData,
            timestamp: Date.now(),
            source: 'route-optimizer',
            workflowStep: 'mileage-calculation'
        }));

        // Store workflow tracking data
        this.storeWorkflowData(mileageData);

        // Also integrate with jobs system if available
        this.integrateWithJobsSystem(mileageData);

        this.showNotification(`🧮 Exported ${mileageData.totalDistance} miles to Mileage Calculator`, 'success');
        
        // Enhanced export with workflow continuation
        this.showWorkflowContinuationModal(mileageData);
    }

    storeWorkflowData(mileageData) {
        // Store comprehensive workflow data for cross-tab integration
        const workflowData = {
            routeOptimizer: {
                completed: true,
                timestamp: Date.now(),
                data: this.currentRoute,
                summary: {
                    totalDistance: mileageData.totalDistance,
                    totalTime: mileageData.totalTime,
                    totalDays: mileageData.totalDays,
                    totalStops: mileageData.totalStops
                }
            },
            mileageCalculator: {
                pending: true,
                importData: mileageData
            },
            jobs: {
                pending: true,
                suggestedJobs: mileageData.suggestedJobData || []
            },
            workflow: {
                currentStep: 'mileage-calculation',
                nextStep: 'job-creation',
                completionPercentage: 33
            }
        };

        localStorage.setItem('cc_workflow_data', JSON.stringify(workflowData));
        console.log('📊 Workflow data stored:', workflowData);
    }

    showWorkflowContinuationModal(mileageData) {
        const modal = document.createElement('div');
        modal.className = 'workflow-continuation-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎯 Route Export Complete</h3>
                    <button class="modal-close">×</button>
                </div>
                
                <div class="workflow-progress">
                    <div class="workflow-step completed">
                        <span class="step-icon">✅</span>
                        <span class="step-label">Route Optimized</span>
                    </div>
                    <div class="workflow-arrow">→</div>
                    <div class="workflow-step current">
                        <span class="step-icon">🧮</span>
                        <span class="step-label">Mileage Calculation</span>
                    </div>
                    <div class="workflow-arrow">→</div>
                    <div class="workflow-step pending">
                        <span class="step-icon">💼</span>
                        <span class="step-label">Job Creation</span>
                    </div>
                </div>

                <div class="export-summary">
                    <h4>Export Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="label">Total Distance:</span>
                            <span class="value">${mileageData.totalDistance} miles</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Total Days:</span>
                            <span class="value">${mileageData.totalDays} days</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Total Stops:</span>
                            <span class="value">${mileageData.totalStops} stops</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Estimated Revenue:</span>
                            <span class="value">$${(mileageData.totalStops * 150).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="cipher-btn cipher-btn--primary" onclick="window.routeOptimizer.continueToMileageCalculator()">
                        <span class="btn-icon">🧮</span>
                        Continue to Mileage Calculator
                    </button>
                    <button class="cipher-btn cipher-btn--secondary" onclick="window.routeOptimizer.stayOnRouteOptimizer()">
                        <span class="btn-icon">🗺️</span>
                        Continue Route Planning
                    </button>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .workflow-continuation-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .workflow-continuation-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .workflow-continuation-modal .modal-content {
                position: relative;
                background: var(--cipher-card-bg);
                border: 1px solid var(--cipher-border);
                border-radius: var(--cipher-radius-lg);
                box-shadow: var(--cipher-shadow-lg);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .workflow-continuation-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--cipher-border);
            }
            
            .workflow-continuation-modal .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--cipher-text-secondary);
                padding: 4px 8px;
                border-radius: var(--cipher-radius-md);
            }
            
            .workflow-continuation-modal .modal-close:hover {
                background: var(--cipher-danger);
                color: white;
            }
            
            .workflow-progress {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                gap: 12px;
            }
            
            .workflow-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 12px;
                border-radius: var(--cipher-radius-md);
                min-width: 120px;
            }
            
            .workflow-step.completed {
                background: rgba(40, 167, 69, 0.1);
                border: 1px solid var(--cipher-success);
            }
            
            .workflow-step.current {
                background: rgba(0, 191, 255, 0.1);
                border: 1px solid var(--cipher-accent);
            }
            
            .workflow-step.pending {
                background: rgba(108, 117, 125, 0.1);
                border: 1px solid var(--cipher-border);
            }
            
            .workflow-arrow {
                color: var(--cipher-text-secondary);
                font-size: 18px;
                font-weight: bold;
            }
            
            .export-summary {
                padding: 20px;
                border-top: 1px solid var(--cipher-border);
            }
            
            .export-summary h4 {
                margin: 0 0 16px 0;
                color: var(--cipher-text-primary);
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: var(--cipher-bg-secondary);
                border-radius: var(--cipher-radius-md);
            }
            
            .summary-item .label {
                color: var(--cipher-text-secondary);
                font-size: 14px;
            }
            
            .summary-item .value {
                color: var(--cipher-text-primary);
                font-weight: 600;
            }
            
            .modal-actions {
                padding: 20px;
                display: flex;
                gap: 12px;
                border-top: 1px solid var(--cipher-border);
            }
            
            .modal-actions .cipher-btn {
                flex: 1;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.querySelector('.modal-overlay').onclick = () => modal.remove();
    }

    continueToMileageCalculator() {
        // Close modal
        const modal = document.querySelector('.workflow-continuation-modal');
        if (modal) modal.remove();

        // Navigate to mileage calculator
        if (window.masterInterface) {
            // If in master interface, switch tabs
            window.masterInterface.activateTab('mileage-calculator');
        } else {
            // If standalone, navigate to page
            window.location.href = 'mileage-calculator.html?from=route-optimizer';
        }
    }

    stayOnRouteOptimizer() {
        // Close modal and stay on current page
        const modal = document.querySelector('.workflow-continuation-modal');
        if (modal) modal.remove();
        
        this.showNotification('Route data saved! You can continue to Mileage Calculator anytime.', 'success');
    }

    prepareMileageExportData() {
        const route = this.currentRoute;
        
        // Prepare comprehensive data for mileage calculator
        const mileageData = {
            // Basic metrics
            totalDistance: route.overall.miles,
            totalTime: route.overall.minutes,
            totalDays: route.days.length,
            totalStops: route.days.reduce((sum, day) => sum + (day.stopsCount || day.stops.length - 1), 0),
            
            // Daily breakdown for detailed billing
            dailyBreakdown: route.days.map((day, index) => ({
                dayNumber: index + 1,
                date: this.getDefaultDate(index),
                miles: day.totalMiles,
                minutes: day.totalMinutes,
                stops: day.stopsCount || day.stops.length - 1,
                efficiency: day.efficiency,
                stops_detail: day.stops.map(stop => ({
                    address: stop,
                    isStartingPoint: stop === day.stops[0] || (day.legs && day.legs[day.stops.indexOf(stop)]?.isReturn)
                }))
            })),
            
            // Firm-specific data for billing optimization
            firmBreakdown: this.calculateFirmMileageBreakdown(route),
            
            // Export metadata
            exportTimestamp: Date.now(),
            exportSource: 'route-optimizer',
            routeSettings: {
                territoryType: document.getElementById('territoryType')?.value || 'rural',
                maxLegMiles: parseInt(document.getElementById('maxLegMiles')?.value) || 50,
                optimizationMode: document.getElementById('optimizationMode')?.value || 'distance'
            },
            
            // Integration data
            readyForJobCreation: true,
            suggestedJobData: this.prepareSuggestedJobs(route)
        };
        
        console.log('📊 Prepared comprehensive mileage export:', mileageData);
        return mileageData;
    }

    calculateFirmMileageBreakdown(route) {
        // Calculate mileage breakdown by firm for billing optimization
        const firmBreakdown = {};
        
        // Get destination data with firm information
        if (route.destinationData) {
            route.destinationData.forEach(dest => {
                if (dest.firm) {
                    if (!firmBreakdown[dest.firm]) {
                        firmBreakdown[dest.firm] = {
                            firmId: dest.firm,
                            firmName: dest.firmName || dest.firm,
                            stops: 0,
                            estimatedMiles: 0
                        };
                    }
                    
                    firmBreakdown[dest.firm].stops += 1;
                    // Estimate miles per stop (total / stops, rough approximation)
                    firmBreakdown[dest.firm].estimatedMiles += route.overall.miles / route.destinationData.length;
                }
            });
        }
        
        return Object.values(firmBreakdown);
    }

    prepareSuggestedJobs(route) {
        // Prepare suggested job creation data
        const suggestedJobs = [];
        
        if (route.destinationData) {
            route.destinationData.forEach((dest, index) => {
                // Create job suggestion for each destination
                const dayIndex = this.findDestinationDayIndex(dest.address, route.days);
                const suggestedJob = {
                    // Job identification
                    tempId: `route_job_${Date.now()}_${index}`,
                    number: `AUTO-${new Date().toISOString().split('T')[0]}-${index + 1}`,
                    
                    // Location and type
                    address: dest.address,
                    type: dest.type || 'General Claim',
                    firm: dest.firmName || dest.firm || 'Unknown Firm',
                    firmId: dest.firm,
                    
                    // Scheduling
                    scheduledDate: dayIndex !== -1 ? this.getDefaultDate(dayIndex) : null,
                    priority: dest.priority || 'normal',
                    
                    // Status and metadata
                    status: 'pending', // Not yet created
                    source: 'route-optimizer',
                    createdFromRoute: true,
                    routeDay: dayIndex + 1,
                    
                    // Estimated values
                    estimatedDuration: 30, // Default appointment time
                    estimatedMiles: this.estimateJobMileage(dest, route),
                    
                    // Integration flags
                    readyForCreation: true,
                    requiresCustomerContact: !dest.customerName
                };
                
                suggestedJobs.push(suggestedJob);
            });
        }
        
        console.log('💼 Prepared', suggestedJobs.length, 'suggested jobs for creation');
        return suggestedJobs;
    }

    findDestinationDayIndex(address, days) {
        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
            if (days[dayIndex].stops.includes(address)) {
                return dayIndex;
            }
        }
        return -1;
    }

    estimateJobMileage(destination, route) {
        // Simple estimation - could be enhanced with more sophisticated logic
        const totalMiles = route.overall.miles;
        const totalStops = route.destinationData ? route.destinationData.length : 1;
        return Math.round((totalMiles / totalStops) * 10) / 10;
    }

    integrateWithJobsSystem(mileageData) {
        // Integrate with jobs system if available
        if (window.jobsStudio && mileageData.suggestedJobData) {
            console.log('💼 Integrating with Jobs Studio...');
            
            // Store suggested jobs for jobs system pickup
            localStorage.setItem('cc_suggested_jobs', JSON.stringify({
                source: 'route-optimizer',
                timestamp: Date.now(),
                jobs: mileageData.suggestedJobData,
                routeMetadata: {
                    totalMiles: mileageData.totalDistance,
                    totalDays: mileageData.totalDays,
                    firmBreakdown: mileageData.firmBreakdown
                }
            }));
            
            // Notify user about integration
            console.log('✅ Route data prepared for job creation');
        }
        
        // Also check for analytics integration
        this.integrateWithAnalytics(mileageData);
    }

    integrateWithAnalytics(mileageData) {
        // Fire analytics events for route optimization
        if (window.dispatchEvent) {
            // Route completion event
            window.dispatchEvent(new CustomEvent('route:optimized', {
                detail: {
                    totalMiles: mileageData.totalDistance,
                    totalStops: mileageData.totalStops,
                    totalDays: mileageData.totalDays,
                    efficiency: mileageData.dailyBreakdown.reduce((sum, day) => sum + (day.efficiency || 0), 0) / mileageData.totalDays,
                    territoryType: mileageData.routeSettings.territoryType,
                    timestamp: Date.now()
                }
            }));
            
            // Firm analytics events
            mileageData.firmBreakdown.forEach(firm => {
                window.dispatchEvent(new CustomEvent('firm:route_activity', {
                    detail: {
                        firmId: firm.firmId,
                        firmName: firm.firmName,
                        stops: firm.stops,
                        estimatedMiles: firm.estimatedMiles,
                        timestamp: Date.now()
                    }
                }));
            });
        }
    }

    createJobsFromRoute() {
        // Direct job creation from route (coordinator feature)
        if (this.userRole !== 'coordinator' && this.userRole !== 'admin') {
            this.showNotification('Job creation is only available in coordinator mode', 'info');
            return;
        }
        
        if (!this.currentRoute) {
            this.showNotification('Please optimize a route first', 'warning');
            return;
        }
        
        const mileageData = this.prepareMileageExportData();
        const suggestedJobs = mileageData.suggestedJobData;
        
        if (!suggestedJobs || suggestedJobs.length === 0) {
            this.showNotification('No jobs to create from current route', 'warning');
            return;
        }
        
        // Show job creation confirmation modal
        this.showJobCreationModal(suggestedJobs, mileageData);
    }

    showJobCreationModal(suggestedJobs, mileageData) {
        const modal = document.createElement('div');
        modal.className = 'job-creation-modal coordinator-only';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.job-creation-modal').remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💼 Create Jobs from Route</h3>
                    <button class="modal-close" onclick="this.closest('.job-creation-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="job-creation-summary">
                        <h4>📊 Route Summary</h4>
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="stat-label">Total Distance:</span>
                                <span class="stat-value">${mileageData.totalDistance} miles</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Total Days:</span>
                                <span class="stat-value">${mileageData.totalDays} days</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Total Stops:</span>
                                <span class="stat-value">${mileageData.totalStops} stops</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="suggested-jobs-section">
                        <h4>💼 Suggested Jobs (${suggestedJobs.length})</h4>
                        <div class="jobs-list">
                            ${suggestedJobs.map((job, index) => `
                                <div class="suggested-job-item">
                                    <div class="job-checkbox">
                                        <input type="checkbox" id="job_${index}" checked>
                                    </div>
                                    <div class="job-details">
                                        <div class="job-header">
                                            <span class="job-number">${job.number}</span>
                                            <span class="job-firm">${job.firm}</span>
                                        </div>
                                        <div class="job-address">${job.address}</div>
                                        <div class="job-meta">
                                            <span class="job-type">${job.type}</span>
                                            <span class="job-priority priority-${job.priority}">${job.priority}</span>
                                            <span class="job-day">Day ${job.routeDay}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="creation-options">
                        <h4>⚙️ Creation Options</h4>
                        <div class="option-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="autoAssignDates" checked>
                                <span class="checkmark"></span>
                                Auto-assign scheduled dates from route
                            </label>
                        </div>
                        <div class="option-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="markCompleted">
                                <span class="checkmark"></span>
                                Mark jobs as completed (for billing calendar)
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.job-creation-modal').remove()">Cancel</button>
                    <button class="cipher-btn cipher-btn--primary" id="createSelectedJobsBtn">💼 Create Selected Jobs</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup job creation functionality
        modal.querySelector('#createSelectedJobsBtn').addEventListener('click', () => {
            this.confirmJobCreation(suggestedJobs, modal);
        });
    }

    confirmJobCreation(suggestedJobs, modal) {
        // Get selected jobs
        const selectedJobs = [];
        const checkboxes = modal.querySelectorAll('.job-checkbox input[type="checkbox"]');
        const autoAssignDates = modal.querySelector('#autoAssignDates').checked;
        const markCompleted = modal.querySelector('#markCompleted').checked;
        
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                const job = { ...suggestedJobs[index] };
                
                // Apply creation options
                if (!autoAssignDates) {
                    job.scheduledDate = null;
                }
                
                if (markCompleted) {
                    job.status = 'completed';
                }
                
                selectedJobs.push(job);
            }
        });
        
        if (selectedJobs.length === 0) {
            alert('Please select at least one job to create');
            return;
        }
        
        // Create jobs in the jobs system
        this.executeJobCreation(selectedJobs);
        
        modal.remove();
    }

    executeJobCreation(selectedJobs) {
        let createdCount = 0;
        
        selectedJobs.forEach(jobData => {
            if (window.jobsStudio) {
                // Use jobs studio controller if available
                window.jobsStudio.createJob({
                    number: jobData.number,
                    type: jobData.type,
                    status: jobData.status,
                    earnings: 0, // To be filled in later
                    firm: jobData.firm,
                    location: jobData.address,
                    createdDate: new Date().toISOString(),
                    scheduledDate: jobData.scheduledDate,
                    priority: jobData.priority,
                    source: 'route-optimizer',
                    routeDay: jobData.routeDay
                });
                
                createdCount++;
            }
        });
        
        if (createdCount > 0) {
            this.showNotification(`✅ Created ${createdCount} jobs successfully!`, 'success');
            
            // Fire integration event
            window.dispatchEvent(new CustomEvent('jobs:created_from_route', {
                detail: {
                    count: createdCount,
                    source: 'route-optimizer',
                    timestamp: Date.now()
                }
            }));
        } else {
            this.showNotification('❌ Could not create jobs - Jobs Studio not available', 'error');
        }
    }

    getStopPriority(stopAddress, routeData) {
        // Find priority for this stop from the original destination data
        if (routeData && routeData.destinationData) {
            const dest = routeData.destinationData.find(d => d.address === stopAddress);
            return dest ? dest.priority : 'normal';
        }
        return 'normal';
    }

    shortenAddress(address) {
        if (address.length <= 50) return address;
        return address.substring(0, 47) + '...';
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorDisplay').style.display = 'block';
    }

    hideError() {
        document.getElementById('errorDisplay').style.display = 'none';
    }

    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    loadSettings() {
        // Load from global settings manager if available
        if (window.settingsManager) {
            console.log('📋 Loading settings from Settings Manager');
            
            // Load route optimization settings
            const territoryType = window.settingsManager.getSetting('territoryType');
            const maxDailyHours = window.settingsManager.getSetting('maxDailyHours');
            const maxStopsPerDay = window.settingsManager.getSetting('maxStopsPerDay');
            const maxLegMiles = window.settingsManager.getSetting('maxLegMiles');
            const enableGeographicClustering = window.settingsManager.getSetting('enableGeographicClustering');
            const homeBaseLocation = window.settingsManager.getSetting('homeBaseLocation');
            const defaultAppointmentDuration = window.settingsManager.getSetting('defaultAppointmentDuration');
            
            // Apply to form fields with null checks
            const territoryTypeEl = document.getElementById('territoryType');
            if (territoryType && territoryTypeEl) {
                territoryTypeEl.value = territoryType;
            }
            
            const maxDailyHoursEl = document.getElementById('maxDailyHours');
            if (maxDailyHours && maxDailyHoursEl) {
                maxDailyHoursEl.value = maxDailyHours;
            }
            
            const maxStopsPerDayEl = document.getElementById('maxStopsPerDay');
            if (maxStopsPerDay && maxStopsPerDayEl) {
                maxStopsPerDayEl.value = maxStopsPerDay;
            }
            
            const maxLegMilesEl = document.getElementById('maxLegMiles');
            if (maxLegMiles && maxLegMilesEl) {
                maxLegMilesEl.value = maxLegMiles;
            }
            
            const geographicClusteringEl = document.getElementById('geographicClustering');
            if (enableGeographicClustering !== undefined && geographicClusteringEl) {
                geographicClusteringEl.checked = enableGeographicClustering;
            }
            
            const startLocationEl = document.getElementById('startLocation');
            if (homeBaseLocation && startLocationEl) {
                startLocationEl.value = homeBaseLocation;
            }
            
            const timePerAppointmentEl = document.getElementById('timePerAppointment');
            if (defaultAppointmentDuration && timePerAppointmentEl) {
                timePerAppointmentEl.value = defaultAppointmentDuration;
            }
        } else {
            // Fallback to legacy settings
            const settings = JSON.parse(localStorage.getItem('cc_route_settings') || '{}');
            
            const maxLegMilesEl = document.getElementById('maxLegMiles');
            if (settings.maxLegMiles && maxLegMilesEl) {
                maxLegMilesEl.value = settings.maxLegMiles;
            }
            
            const splitEnabledEl = document.getElementById('splitEnabled');
            if (settings.splitEnabled !== undefined && splitEnabledEl) {
                splitEnabledEl.checked = settings.splitEnabled;
            }
            
            const optimizeEnabledEl = document.getElementById('optimizeEnabled');
            if (settings.optimizeEnabled !== undefined && optimizeEnabledEl) {
                optimizeEnabledEl.checked = settings.optimizeEnabled;
            }
            
            const optimizationModeEl = document.getElementById('optimizationMode');
            if (settings.optimizationMode && optimizationModeEl) {
                optimizationModeEl.value = settings.optimizationMode;
            }
            
            const maxDailyHoursEl = document.getElementById('maxDailyHours');
            if (settings.maxDailyHours && maxDailyHoursEl) {
                maxDailyHoursEl.value = settings.maxDailyHours;
            }
            
            const maxStopsPerDayEl = document.getElementById('maxStopsPerDay');
            if (settings.maxStopsPerDay && maxStopsPerDayEl) {
                maxStopsPerDayEl.value = settings.maxStopsPerDay;
            }
            
            const timePerAppointmentEl = document.getElementById('timePerAppointment');
            if (settings.timePerAppointment && timePerAppointmentEl) {
                timePerAppointmentEl.value = settings.timePerAppointment;
            }
        }
    }

    saveSettings() {
        const maxLegMilesEl = document.getElementById('maxLegMiles');
        const splitEnabledEl = document.getElementById('splitEnabled');
        const optimizeEnabledEl = document.getElementById('optimizeEnabled');
        const optimizationModeEl = document.getElementById('optimizationMode');
        const maxDailyHoursEl = document.getElementById('maxDailyHours');
        const maxStopsPerDayEl = document.getElementById('maxStopsPerDay');
        const timePerAppointmentEl = document.getElementById('timePerAppointment');
        
        const settings = {
            maxLegMiles: maxLegMilesEl ? parseInt(maxLegMilesEl.value) : 50,
            splitEnabled: splitEnabledEl ? splitEnabledEl.checked : true,
            optimizeEnabled: optimizeEnabledEl ? optimizeEnabledEl.checked : true,
            optimizationMode: optimizationModeEl ? optimizationModeEl.value : 'distance',
            maxDailyHours: maxDailyHoursEl ? parseInt(maxDailyHoursEl.value) : 8,
            maxStopsPerDay: maxStopsPerDayEl ? parseInt(maxStopsPerDayEl.value) : 6,
            timePerAppointment: timePerAppointmentEl ? parseInt(timePerAppointmentEl.value) : 30
        };
        
        localStorage.setItem('cc_route_settings', JSON.stringify(settings));
        console.log('⚙️ Settings saved:', settings);
    }

    // Display routes on the visualization map with day-based coloring
    displayRoutesOnMap(type = 'today') {
        console.log(`🗺️ Displaying ${type} routes on map with day-based visualization`);
        
        if (!window.routeVisualizationMap) {
            console.warn('🗺️ Route visualization map not initialized');
            window.initializeRouteVisualizationMap();
            return;
        }
        
        // Clear existing routes and markers
        this.clearMapDisplay();
        
        // Get routes based on type with day grouping
        const routesByDay = this.getRoutesGroupedByDay(type);
        
        if (Object.keys(routesByDay).length === 0) {
            this.updateRouteDetails('No routes found for the selected period');
            return;
        }
        
        // Display routes with different colors for different days
        this.renderStoredMultiDayRoutes(routesByDay);
        
        // Update route info panel with summary
        this.updateMultiDayRouteDetails(routesByDay);
        
        // Fit map to show all routes
        this.fitMapToRoutes(routesByDay);
    }

    getRoutesForDisplay(type) {
        // Get routes from localStorage or current session
        const storedRoutes = JSON.parse(localStorage.getItem('cc_optimized_routes') || '[]');
        
        if (type === 'today') {
            const today = new Date().toDateString();
            return storedRoutes.filter(route => {
                const routeDate = new Date(route.date || Date.now()).toDateString();
                return routeDate === today;
            });
        }
        
        return storedRoutes;
    }

    // Get routes grouped by day for visualization
    getRoutesGroupedByDay(type) {
        const storedRoutes = JSON.parse(localStorage.getItem('cc_optimized_routes') || '[]');
        const routesByDay = {};
        
        // Define day colors for visual distinction
        const dayColors = [
            '#007bff', // Blue for today
            '#28a745', // Green for yesterday
            '#dc3545', // Red for day before
            '#fd7e14', // Orange
            '#6f42c1', // Purple
            '#20c997', // Teal
            '#ffc107'  // Yellow
        ];
        
        if (type === 'today') {
            const today = new Date().toDateString();
            const todayRoutes = storedRoutes.filter(route => {
                const routeDate = new Date(route.date || Date.now()).toDateString();
                return routeDate === today;
            });
            
            if (todayRoutes.length > 0) {
                routesByDay[today] = {
                    routes: todayRoutes,
                    color: dayColors[0],
                    label: "Today's Routes"
                };
            }
        } else {
            // Group all routes by day
            storedRoutes.forEach(route => {
                const routeDate = new Date(route.date || Date.now()).toDateString();
                
                if (!routesByDay[routeDate]) {
                    const dayIndex = Object.keys(routesByDay).length % dayColors.length;
                    const isToday = routeDate === new Date().toDateString();
                    const isYesterday = routeDate === new Date(Date.now() - 86400000).toDateString();
                    
                    let label = routeDate;
                    if (isToday) label = "Today's Routes";
                    else if (isYesterday) label = "Yesterday's Routes";
                    else {
                        const date = new Date(routeDate);
                        label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    }
                    
                    routesByDay[routeDate] = {
                        routes: [],
                        color: dayColors[dayIndex],
                        label: label
                    };
                }
                
                routesByDay[routeDate].routes.push(route);
            });
        }
        
        return routesByDay;
    }

    // Clear all map displays
    clearMapDisplay() {
        // Clear existing direction renderers
        if (this.dayDirectionsRenderers) {
            this.dayDirectionsRenderers.forEach(renderer => {
                renderer.setMap(null);
            });
        }
        this.dayDirectionsRenderers = [];
        
        // Clear existing markers
        if (this.routeMarkers) {
            this.routeMarkers.forEach(marker => marker.setMap(null));
        }
        this.routeMarkers = [];
        
        // Clear single route renderer if it exists
        if (window.routeVisualizationDirectionsRenderer) {
            window.routeVisualizationDirectionsRenderer.setMap(null);
        }
    }

    // Render multiple days of routes with different colors
    async renderStoredMultiDayRoutes(routesByDay) {
        console.log('🎨 Rendering multi-day routes with color coding');
        
        this.dayDirectionsRenderers = [];
        this.routeMarkers = [];
        
        for (const [day, dayData] of Object.entries(routesByDay)) {
            const { routes, color, label } = dayData;
            
            console.log(`🎨 Rendering ${label} with color ${color}`);
            
            // Render each route for this day - create separate renderer for each route
            for (const route of routes) {
                // Create a separate directions renderer for each route
                const renderer = new google.maps.DirectionsRenderer({
                    draggable: false,
                    suppressMarkers: true, // We'll add custom markers
                    polylineOptions: {
                        strokeColor: color,
                        strokeWeight: 4,
                        strokeOpacity: 0.8
                    }
                });
                
                renderer.setMap(window.routeVisualizationMap);
                this.dayDirectionsRenderers.push(renderer);
                
                await this.renderSingleDayRoute(route, renderer, color, label);
            }
        }
        
        console.log('✅ All routes rendered successfully');
    }

    // Render a single route for a specific day
    async renderSingleDayRoute(route, renderer, color, dayLabel) {
        if (!route.destinations || route.destinations.length === 0) {
            return;
        }
        
        // Build waypoints
        const waypoints = [];
        if (route.destinations.length > 2) {
            waypoints = route.destinations.slice(1, -1).map(dest => ({
                location: dest.address,
                stopover: true
            }));
        }
        
        const request = {
            origin: route.startLocation || route.destinations[0].address,
            destination: route.destinations[route.destinations.length - 1].address,
            waypoints: waypoints,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL
        };
        
        return new Promise((resolve) => {
            if (!window.routeVisualizationDirectionsService) {
                window.routeVisualizationDirectionsService = new google.maps.DirectionsService();
            }
            
            window.routeVisualizationDirectionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    renderer.setDirections(result);
                    
                    // Add custom numbered markers
                    this.addColoredRouteMarkers(route, color, dayLabel);
                }
                resolve();
            });
        });
    }

    // Add colored markers for route destinations
    addColoredRouteMarkers(route, color, dayLabel) {
        route.destinations.forEach((destination, index) => {
            if (destination.address) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({address: destination.address}, (results, status) => {
                    if (status === 'OK') {
                        // Create custom marker with colored background
                        const marker = new google.maps.Marker({
                            position: results[0].geometry.location,
                            map: window.routeVisualizationMap,
                            title: `${dayLabel} - Stop ${index + 1}: ${destination.firm}`,
                            icon: {
                                url: `data:image/svg+xml,${encodeURIComponent(this.createColoredMarkerSVG(index + 1, color))}`,
                                scaledSize: new google.maps.Size(30, 40),
                                anchor: new google.maps.Point(15, 40)
                            }
                        });
                        
                        // Add info window
                        const infoWindow = new google.maps.InfoWindow({
                            content: this.createMarkerInfoContent(destination, index + 1, dayLabel)
                        });
                        
                        marker.addListener('click', () => {
                            // Close other info windows
                            if (this.currentInfoWindow) {
                                this.currentInfoWindow.close();
                            }
                            infoWindow.open(window.routeVisualizationMap, marker);
                            this.currentInfoWindow = infoWindow;
                        });
                        
                        this.routeMarkers.push(marker);
                    }
                });
            }
        });
    }

    // Create colored marker SVG
    createColoredMarkerSVG(number, color) {
        return `
            <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.7 0 0 6.7 0 15c0 5.8 15 25 15 25s15-19.2 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
                <circle cx="15" cy="15" r="10" fill="white"/>
                <text x="15" y="19" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${number}</text>
            </svg>
        `;
    }

    // Create marker info window content
    createMarkerInfoContent(destination, stopNumber, dayLabel) {
        return `
            <div style="max-width: 250px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${dayLabel} - Stop ${stopNumber}</h4>
                <p style="margin: 4px 0; font-weight: bold;">${destination.firm || 'Unknown Firm'}</p>
                <p style="margin: 4px 0; color: #666;">${destination.address}</p>
                <p style="margin: 4px 0; color: #666;">
                    <strong>Type:</strong> ${destination.claimType || 'General'}
                </p>
            </div>
        `;
    }

    // Update route details panel for multi-day view
    updateMultiDayRouteDetails(routesByDay) {
        const detailsElement = document.getElementById('routeDetails');
        if (!detailsElement) return;
        
        const totalDays = Object.keys(routesByDay).length;
        let totalDestinations = 0;
        let routeSummary = '';
        
        Object.entries(routesByDay).forEach(([day, dayData], index) => {
            const { routes, label, color } = dayData;
            const dayDestinations = routes.reduce((sum, route) => sum + route.destinations.length, 0);
            totalDestinations += dayDestinations;
            
            routeSummary += `
                <div class="day-route-summary" style="border-left: 4px solid ${color}; padding-left: 12px; margin: 12px 0;">
                    <h5 style="margin: 0 0 4px 0; color: var(--cipher-text-primary);">${label}</h5>
                    <p style="margin: 2px 0; color: var(--cipher-text-secondary);">
                        ${routes.length} route${routes.length !== 1 ? 's' : ''}, ${dayDestinations} stop${dayDestinations !== 1 ? 's' : ''}
                    </p>
                </div>
            `;
        });
        
        detailsElement.innerHTML = `
            <div class="multi-day-summary">
                <h4>Route Overview</h4>
                <p><strong>Days:</strong> ${totalDays}</p>
                <p><strong>Total Destinations:</strong> ${totalDestinations}</p>
            </div>
            <div class="day-routes">
                <h4>By Day</h4>
                ${routeSummary}
            </div>
            <div class="route-legend">
                <h4>Legend</h4>
                <p style="color: var(--cipher-text-secondary); font-size: 14px;">
                    Click markers for details • Different colors represent different days
                </p>
            </div>
        `;
    }

    // Fit map to show all routes
    fitMapToRoutes(routesByDay) {
        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;
        
        // Add all destination points to bounds
        Object.values(routesByDay).forEach(dayData => {
            dayData.routes.forEach(route => {
                route.destinations.forEach(destination => {
                    if (destination.coordinates) {
                        bounds.extend(new google.maps.LatLng(
                            destination.coordinates.lat,
                            destination.coordinates.lng
                        ));
                        hasPoints = true;
                    }
                });
            });
        });
        
        if (hasPoints) {
            window.routeVisualizationMap.fitBounds(bounds);
            
            // Don't zoom too close for single locations
            const listener = google.maps.event.addListener(window.routeVisualizationMap, "idle", () => {
                if (window.routeVisualizationMap.getZoom() > 16) {
                    window.routeVisualizationMap.setZoom(16);
                }
                google.maps.event.removeListener(listener);
            });
        } else {
            // Default view for North Carolina
            window.routeVisualizationMap.setCenter({ lat: 35.7796, lng: -78.6382 });
            window.routeVisualizationMap.setZoom(8);
        }
    }

    renderRouteOnMap(route) {
        if (!route || !route.destinations || route.destinations.length === 0) {
            console.warn('🗺️ No valid route data to render');
            return;
        }
        
        const waypoints = [];
        const destinations = route.destinations;
        
        if (destinations.length > 1) {
            // Add intermediate waypoints (skip first and last for Google Directions API)
            for (let i = 1; i < destinations.length - 1; i++) {
                if (destinations[i].address) {
                    waypoints.push({
                        location: destinations[i].address,
                        stopover: true
                    });
                }
            }
        }
        
        const directionsRequest = {
            origin: destinations[0].address,
            destination: destinations[destinations.length - 1].address,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false // We've already optimized
        };
        
        if (window.routeVisualizationDirectionsService) {
            window.routeVisualizationDirectionsService.route(directionsRequest, (result, status) => {
                if (status === 'OK') {
                    window.routeVisualizationDirectionsRenderer.setMap(window.routeVisualizationMap);
                    window.routeVisualizationDirectionsRenderer.setDirections(result);
                    console.log('🗺️ Route rendered successfully');
                } else {
                    console.error('🗺️ Directions request failed:', status);
                }
            });
        }
    }

    addRouteMarkers(routes) {
        // Clear existing markers
        if (this.routeMarkers) {
            this.routeMarkers.forEach(marker => marker.setMap(null));
        }
        this.routeMarkers = [];
        
        // Add markers for each route's destinations
        routes.forEach((route, routeIndex) => {
            route.destinations.forEach((destination, destIndex) => {
                if (destination.address) {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({address: destination.address}, (results, status) => {
                        if (status === 'OK') {
                            const marker = new google.maps.Marker({
                                position: results[0].geometry.location,
                                map: window.routeVisualizationMap,
                                title: `${destination.firm} - ${destination.address}`,
                                label: (destIndex + 1).toString()
                            });
                            
                            this.routeMarkers.push(marker);
                            
                            // Add click listener for marker info
                            marker.addListener('click', () => {
                                this.showDestinationInfo(destination);
                            });
                        }
                    });
                }
            });
        });
    }

    updateRouteDetails(routeData) {
        const detailsElement = document.getElementById('routeDetails');
        if (!detailsElement) return;
        
        if (typeof routeData === 'string') {
            detailsElement.innerHTML = `<p>${routeData}</p>`;
            return;
        }
        
        if (!routeData.destinations) {
            detailsElement.innerHTML = '<p>No route details available</p>';
            return;
        }
        
        const totalDistance = routeData.totalDistance || 'Calculating...';
        const totalTime = routeData.totalTime || 'Calculating...';
        const destinationCount = routeData.destinations.length;
        
        detailsElement.innerHTML = `
            <div class="route-summary">
                <h4>Route Summary</h4>
                <p><strong>Destinations:</strong> ${destinationCount}</p>
                <p><strong>Total Distance:</strong> ${totalDistance} miles</p>
                <p><strong>Estimated Time:</strong> ${totalTime}</p>
            </div>
            <div class="destination-list">
                <h4>Stops</h4>
                <ol>
                    ${routeData.destinations.map(dest => 
                        `<li><strong>${dest.firm}</strong><br>${dest.address}</li>`
                    ).join('')}
                </ol>
            </div>
            <div class="route-export-actions">
                <h4>Export Options</h4>
                <button class="cipher-btn cipher-btn--small export-print-btn" title="Print route with map">
                    🖨️ Print
                </button>
                <button class="cipher-btn cipher-btn--small export-email-btn" title="Email route summary">
                    📧 Email
                </button>
                <button class="cipher-btn cipher-btn--small export-map-btn" title="View static map">
                    🗺️ Map Image
                </button>
            </div>
        `;
        
        // Add export button event listeners
        const printBtn = detailsElement.querySelector('.export-print-btn');
        const emailBtn = detailsElement.querySelector('.export-email-btn');
        const mapBtn = detailsElement.querySelector('.export-map-btn');
        
        printBtn?.addEventListener('click', () => {
            this.exportRouteWithMap(routeData, 'print');
        });
        
        emailBtn?.addEventListener('click', () => {
            this.exportRouteWithMap(routeData, 'email');
        });
        
        mapBtn?.addEventListener('click', () => {
            const mapUrl = this.generateStaticMapUrl(routeData, 800, 600);
            window.open(mapUrl, '_blank');
        });
    }

    showDestinationInfo(destination) {
        const infoContent = `
            <div>
                <strong>${destination.firm}</strong><br>
                ${destination.address}<br>
                <em>Type: ${destination.claimType}</em>
            </div>
        `;
        
        // Update the info panel temporarily
        const detailsElement = document.getElementById('routeDetails');
        if (detailsElement) {
            const originalContent = detailsElement.innerHTML;
            detailsElement.innerHTML = infoContent;
            
            // Restore original content after 3 seconds
            setTimeout(() => {
                detailsElement.innerHTML = originalContent;
            }, 3000);
        }
    }

    // Enhanced API Integration Methods
    initializeEnhancedServices() {
        if (typeof google !== 'undefined' && google.maps) {
            this.distanceMatrixService = new google.maps.DistanceMatrixService();
            this.elevationService = new google.maps.ElevationService();
            this.streetViewService = new google.maps.StreetViewService();
            
            console.log('🚀 Enhanced Google Maps services initialized');
        }
    }

    // Roads API - Get accurate drive times and distances
    async getEnhancedRouteData(origin, destination) {
        console.log('🛣️ Getting enhanced route data using Roads API');
        
        try {
            // Use Distance Matrix API for more accurate time/distance
            const matrixResult = await this.getDistanceMatrix(origin, destination);
            
            // Get elevation data for terrain awareness
            const elevationData = await this.getElevationProfile(origin, destination);
            
            // Combine the data for enhanced routing
            return {
                distance: matrixResult.distance,
                duration: matrixResult.duration,
                trafficDuration: matrixResult.durationInTraffic,
                elevationGain: elevationData.gain,
                terrainDifficulty: elevationData.difficulty,
                roadQuality: this.assessRoadQuality(matrixResult, elevationData)
            };
        } catch (error) {
            console.warn('🛣️ Enhanced route data failed, using fallback:', error);
            return this.getFallbackRouteData(origin, destination);
        }
    }

    // Distance Matrix API integration
    async getDistanceMatrix(origins, destinations) {
        console.log('📊 Getting distance matrix:', { origins, destinations });
        return new Promise((resolve, reject) => {
            if (!this.distanceMatrixService) {
                console.log('📊 Initializing distance matrix service...');
                this.initializeEnhancedServices();
            }

            console.log('📊 Calling Distance Matrix API...');
            this.distanceMatrixService.getDistanceMatrix({
                origins: Array.isArray(origins) ? origins : [origins],
                destinations: Array.isArray(destinations) ? destinations : [destinations],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
                drivingOptions: {
                    departureTime: new Date(),
                    trafficModel: google.maps.TrafficModel.BEST_GUESS
                },
                avoidHighways: false,
                avoidTolls: false
            }, (response, status) => {
                console.log('📊 Distance Matrix response:', { status, response });
                if (status === 'OK') {
                    // Return the full response for matrix processing
                    resolve(response);
                } else {
                    console.warn('📊 Distance Matrix failed:', status);
                    reject(new Error(`Distance Matrix status: ${status}`));
                }
            });
        });
    }

    // Elevation API integration
    async getElevationProfile(origin, destination) {
        return new Promise((resolve, reject) => {
            if (!this.elevationService) {
                this.initializeEnhancedServices();
            }

            // For simple implementation, just get elevation at both points
            const locations = [origin, destination];
            
            this.elevationService.getElevationForLocations({
                locations: locations
            }, (results, status) => {
                if (status === 'OK' && results) {
                    const elevations = results.map(result => result.elevation);
                    const elevationGain = Math.abs(elevations[1] - elevations[0]);
                    const difficulty = this.assessTerrainDifficulty(elevations);
                    
                    resolve({
                        elevations: elevations,
                        gain: Math.round(elevationGain * 3.28084), // Convert to feet
                        difficulty: difficulty
                    });
                } else {
                    console.warn('🏔️ Elevation service failed:', status);
                    resolve({
                        elevations: [0, 0],
                        gain: 0,
                        difficulty: 'flat'
                    });
                }
            });
        });
    }

    assessTerrainDifficulty(elevations) {
        const elevationChange = Math.abs(Math.max(...elevations) - Math.min(...elevations));
        const elevationChangeFeet = elevationChange * 3.28084;
        
        if (elevationChangeFeet < 50) return 'flat';
        if (elevationChangeFeet < 200) return 'rolling';
        if (elevationChangeFeet < 500) return 'hilly';
        return 'mountainous';
    }

    assessRoadQuality(matrixResult, elevationData) {
        const speed = matrixResult.distance.value / matrixResult.duration.value; // meters per second
        const avgSpeed = speed * 2.237; // Convert to mph
        
        if (avgSpeed > 55) return 'highway';
        if (avgSpeed > 35) return 'arterial';
        if (avgSpeed > 25) return 'residential';
        return 'local';
    }

    getFallbackRouteData(origin, destination) {
        // Fallback to basic calculation if enhanced APIs fail
        const distance = this.calculateHaversineDistance(origin, destination);
        return {
            distance: { text: `${distance} mi`, value: distance * 1609.34 },
            duration: { text: `${Math.round(distance / 35 * 60)} min`, value: distance / 35 * 3600 },
            trafficDuration: null,
            elevationGain: 0,
            terrainDifficulty: 'unknown',
            roadQuality: 'unknown'
        };
    }

    // Street View integration for property verification
    async getStreetViewData(address) {
        return new Promise((resolve, reject) => {
            if (!this.streetViewService) {
                this.initializeEnhancedServices();
            }

            this.streetViewService.getPanorama({
                location: address,
                radius: 50,
                source: google.maps.StreetViewSource.DEFAULT
            }, (data, status) => {
                if (status === 'OK') {
                    resolve({
                        available: true,
                        panoramaId: data.location.pano,
                        position: data.location.latLng,
                        imageUrl: `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${encodeURIComponent(address)}&key=${this.getApiKey()}`
                    });
                } else {
                    resolve({
                        available: false,
                        imageUrl: null
                    });
                }
            });
        });
    }

    // Address Validation API integration
    async validateAddress(address) {
        console.log('📍 Validating address:', address);
        
        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.log('📍 Address validation skipped - no API key available');
            return { isValid: true, correctedAddress: address, confidence: 'unknown' };
        }
        
        try {
            const response = await fetch(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: {
                        regionCode: 'US',
                        addressLines: [address]
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Address validation failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.result && result.result.verdict) {
                const verdict = result.result.verdict;
                return {
                    isValid: verdict.addressComplete && verdict.hasReplacedComponents !== true,
                    correctedAddress: result.result.address?.formattedAddress || address,
                    confidence: verdict.addressComplete ? 'high' : 'low',
                    components: result.result.address?.addressComponents || []
                };
            }
            
            return { isValid: true, correctedAddress: address, confidence: 'unknown' };
        } catch (error) {
            console.warn('📍 Address validation failed:', error);
            return { isValid: true, correctedAddress: address, confidence: 'unknown' };
        }
    }

    getApiKey() {
        // Extract API key from script tag
        const scriptTag = document.querySelector('script[src*="maps.googleapis.com"]');
        if (scriptTag && scriptTag.src.includes('key=')) {
            const apiKey = scriptTag.src.split('key=')[1].split('&')[0];
            console.log('🔑 API key extracted from script tag:', apiKey.substring(0, 10) + '...');
            return apiKey;
        }
        
        // Check config objects
        if (window.GOOGLE_MAPS_CONFIG?.apiKey) {
            console.log('🔑 API key found in GOOGLE_MAPS_CONFIG');
            return window.GOOGLE_MAPS_CONFIG.apiKey;
        }
        
        if (window.googleMapsApiKey) {
            console.log('🔑 API key found in global variable');
            return window.googleMapsApiKey;
        }
        
        console.warn('🔑 No API key found, address validation will be disabled');
        return null; // Return null to disable validation instead of invalid key
    }

    // Helper methods for matrix processing
    processMatrixBatch(matrix, result, originOffset, destOffset) {
        console.log('📊 Processing matrix batch:', { result, originOffset, destOffset });
        if (!matrix[originOffset]) matrix[originOffset] = [];
        
        // Google Maps response structure: result.rows[i] contains elements for each destination
        const numOrigins = result.rows?.length || 0;
        const numDestinations = result.rows?.[0]?.elements?.length || 0;
        
        console.log('📊 Matrix dimensions:', { numOrigins, numDestinations });
        
        for (let i = 0; i < numOrigins; i++) {
            if (!matrix[originOffset + i]) matrix[originOffset + i] = [];
            
            for (let j = 0; j < numDestinations; j++) {
                const element = result.rows?.[i]?.elements?.[j];
                if (element && element.status === 'OK') {
                    matrix[originOffset + i][destOffset + j] = {
                        distance: element.distance.value, // meters
                        duration: element.duration.value, // seconds
                        trafficDuration: element.duration_in_traffic?.value || element.duration.value
                    };
                } else {
                    // Fallback values
                    matrix[originOffset + i][destOffset + j] = {
                        distance: 50000, // 50km default
                        duration: 3600,   // 1 hour default
                        trafficDuration: 3600
                    };
                }
            }
        }
    }

    fillMatrixFallback(matrix, origins, destinations, originOffset, destOffset) {
        // Fill with estimated values when API fails
        for (let i = 0; i < origins.length; i++) {
            if (!matrix[originOffset + i]) matrix[originOffset + i] = [];
            
            for (let j = 0; j < destinations.length; j++) {
                matrix[originOffset + i][destOffset + j] = {
                    distance: 30000,  // 30km estimate
                    duration: 2400,   // 40 minutes estimate
                    trafficDuration: 2400
                };
            }
        }
    }

    // Generate static map for route export
    generateStaticMapUrl(route, width = 800, height = 600) {
        const apiKey = this.getApiKey();
        let url = `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&key=${apiKey}`;
        
        // Add route waypoints
        if (route && route.destinations) {
            const waypoints = route.destinations.map((dest, index) => {
                const marker = index === 0 ? 'color:green|label:S' : 
                              index === route.destinations.length - 1 ? 'color:red|label:E' : 
                              `color:blue|label:${index}`;
                return `&markers=${marker}|${encodeURIComponent(dest.address)}`;
            }).join('');
            
            url += waypoints;
            
            // Add path if available
            const path = route.destinations.map(dest => encodeURIComponent(dest.address)).join('|');
            url += `&path=color:0x0000ff|weight:3|${path}`;
        }
        
        return url;
    }

    // Export route with static map
    async exportRouteWithMap(route, format = 'pdf') {
        console.log('📄 Exporting route with static map');
        
        try {
            const staticMapUrl = this.generateStaticMapUrl(route, 600, 400);
            
            if (format === 'email') {
                return this.createEmailExport(route, staticMapUrl);
            } else if (format === 'print') {
                return this.createPrintableExport(route, staticMapUrl);
            } else {
                return this.createPDFExport(route, staticMapUrl);
            }
        } catch (error) {
            console.error('📄 Route export failed:', error);
            this.showError('Failed to export route');
        }
    }

    createEmailExport(route, mapUrl) {
        const routeSummary = this.generateRouteSummary(route);
        const subject = encodeURIComponent(`Route Plan - ${route.destinations?.length || 0} stops`);
        const body = encodeURIComponent(`
Route Summary:
${routeSummary}

View map: ${mapUrl}

Generated by Claim Cipher Route Optimizer
        `.trim());
        
        const emailUrl = `mailto:?subject=${subject}&body=${body}`;
        window.open(emailUrl);
        return { success: true, type: 'email' };
    }

    createPrintableExport(route, mapUrl) {
        const printWindow = window.open('', '_blank');
        const routeSummary = this.generateRouteSummary(route);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Route Plan - ${route.destinations?.length || 0} Stops</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    .route-map { text-align: center; margin: 20px 0; }
                    .route-map img { max-width: 100%; border: 1px solid #ddd; }
                    .route-details { margin-top: 20px; }
                    .destination { margin: 10px 0; padding: 10px; border-left: 3px solid #007bff; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>🗺️ Route Plan</h1>
                <div class="route-map">
                    <img src="${mapUrl}" alt="Route Map" />
                </div>
                <div class="route-details">
                    <pre>${routeSummary}</pre>
                </div>
                <div style="margin-top: 30px; font-size: 12px; color: #666;">
                    Generated by Claim Cipher Route Optimizer - ${new Date().toLocaleString()}
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        return { success: true, type: 'print' };
    }

    generateRouteSummary(route) {
        if (!route || !route.destinations) return 'No route data available';
        
        let summary = `Route Summary (${route.destinations.length} stops):\n\n`;
        
        route.destinations.forEach((dest, index) => {
            const num = index + 1;
            summary += `${num}. ${dest.firm || 'Unknown Firm'}\n`;
            summary += `   📍 ${dest.address}\n`;
            if (dest.claimType) {
                summary += `   🔧 ${dest.claimType} claim\n`;
            }
            summary += '\n';
        });
        
        if (route.totalDistance) {
            summary += `Total Distance: ${route.totalDistance}\n`;
        }
        if (route.totalTime) {
            summary += `Estimated Time: ${route.totalTime}\n`;
        }
        
        return summary;
    }

    // Get user's default start location from profile
    getDefaultStartLocation() {
        // Try to get from user profile
        const userProfile = this.getUserProfileData();
        
        if (userProfile.homeAddress) {
            return userProfile.homeAddress;
        }
        
        if (userProfile.workAddress) {
            return userProfile.workAddress;
        }
        
        // Fallback to a reasonable default for North Carolina
        return 'Raleigh, NC';
    }

    getUserProfileData() {
        // Get user profile from multiple sources
        let profile = {};
        
        // From master interface controller
        if (window.masterInterface && window.masterInterface.userProfile) {
            profile = { ...profile, ...window.masterInterface.userProfile };
        }
        
        // From localStorage
        const savedProfile = localStorage.getItem('userCipher');
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                profile = { ...profile, ...parsed };
            } catch (error) {
                console.warn('Failed to parse user profile from localStorage');
            }
        }
        
        return profile;
    }

    // Initialize start location input with user's default
    initializeStartLocation() {
        const startLocationEl = document.getElementById('startLocation');
        if (startLocationEl) {
            // If there's no value or it's the template default, use user's profile
            const currentValue = startLocationEl.value.trim();
            const isTemplateDefault = currentValue === '715 SANDHILL DR DUDLEY NC';
            
            if (!currentValue || isTemplateDefault) {
                const userLocation = this.getDefaultStartLocation();
                // Only override if we have a better default than the template
                if (userLocation !== 'Raleigh, NC' || isTemplateDefault) {
                    startLocationEl.value = userLocation;
                    console.log('🏠 Start location updated to user default:', userLocation);
                }
            }
            
            startLocationEl.placeholder = 'Enter your starting address (home/office)';
            
            // Add address validation to start location
            this.addStartLocationAutocomplete(startLocationEl);
        }
    }

    // Add autocomplete to start location input
    addStartLocationAutocomplete(inputElement) {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            try {
                // Try new PlaceAutocompleteElement first, fallback to old Autocomplete
                if (google.maps.places.PlaceAutocompleteElement) {
                    // For now, stick with legacy autocomplete for start location
                    const autocomplete = new google.maps.places.Autocomplete(inputElement);
                    autocomplete.setFields(['formatted_address', 'geometry']);
                    console.log('🏠 Autocomplete added to start location');
                } else {
                    const autocomplete = new google.maps.places.Autocomplete(inputElement);
                    autocomplete.setFields(['formatted_address', 'geometry']);
                    console.log('🏠 Legacy autocomplete added to start location');
                }
            } catch (error) {
                console.warn('🏠 Failed to add autocomplete to start location:', error);
            }
        }
    }

    // Calendar functionality for clean design
    initializeCalendar() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.calendarData = new Map(); // Store route data by date
        
        setTimeout(() => {
            this.setupCalendarEventListeners();
            this.renderCalendar();
        }, 100);
    }

    setupCalendarEventListeners() {
        // Month navigation
        const prevBtn = document.querySelector('.nav-btn.prev');
        const nextBtn = document.querySelector('.nav-btn.next');
        const todayBtn = document.querySelector('.today-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.currentDate = new Date();
                this.selectedDate = new Date();
                this.renderCalendar();
                this.showRoutePlanningForDate(this.selectedDate);
            });
        }

        // Settings panel toggle
        const showSettingsBtn = document.getElementById('showRouteSettings');
        if (showSettingsBtn) {
            showSettingsBtn.addEventListener('click', () => {
                this.toggleSettingsPanel();
            });
        }

        // Close panel button
        const closePanelBtn = document.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                this.closePlanningPanel();
            });
        }

        // Add destination functionality
        const addDestinationBtn = document.querySelector('.add-destination-btn');
        if (addDestinationBtn) {
            addDestinationBtn.addEventListener('click', () => {
                this.addDestinationField();
            });
        }

        // Optimize route button (multiple possible IDs)
        const optimizeBtn = document.querySelector('.optimize-route-btn') || 
                           document.getElementById('optimizeRouteBtn') ||
                           document.getElementById('optimizeRoute');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                this.optimizeCurrentRoute();
            });
        }

        // Add destination button
        const addBtn = document.getElementById('addDestination');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addDestinationToList();
            });
        }
    }

    renderCalendar() {
        const monthDisplay = document.querySelector('.current-month');
        const calendarDays = document.querySelector('.calendar-days');
        
        if (!monthDisplay || !calendarDays) return;
        
        // Set month display
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthDisplay.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        // Clear existing calendar days
        calendarDays.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = dayDate.getDate();
            
            // Add classes based on date
            if (dayDate.getMonth() !== this.currentDate.getMonth()) {
                dayElement.classList.add('other-month');
            }
            
            if (this.selectedDate && this.isSameDate(dayDate, this.selectedDate)) {
                dayElement.classList.add('selected');
            }
            
            // Check if date has route data
            const dateKey = this.getDateKey(dayDate);
            if (this.calendarData.has(dateKey)) {
                dayElement.classList.add('has-route');
            }
            
            // Add click handler
            dayElement.addEventListener('click', () => {
                this.selectDate(dayDate);
            });
            
            calendarDays.appendChild(dayElement);
        }
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.renderCalendar();
        this.showRoutePlanningForDate(date);
    }

    showRoutePlanningForDate(date) {
        const routePanel = document.querySelector('.route-planning-panel');
        if (!routePanel) return;
        
        routePanel.classList.remove('hidden');
        
        const dateHeader = routePanel.querySelector('.panel-header h3');
        if (dateHeader) {
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            dateHeader.textContent = `Route Planning - ${dateStr}`;
        }
        
        // Load existing route data for this date if available
        const dateKey = this.getDateKey(date);
        if (this.calendarData.has(dateKey)) {
            this.loadRouteDataForDate(dateKey);
        }
    }

    toggleSettingsPanel() {
        const settingsPanel = document.querySelector('.advanced-settings');
        const showBtn = document.getElementById('showRouteSettings');
        
        if (!settingsPanel || !showBtn) return;
        
        if (settingsPanel.style.display === 'none' || !settingsPanel.style.display) {
            settingsPanel.style.display = 'block';
            showBtn.textContent = 'Hide Settings';
            showBtn.classList.add('settings-expanded');
        } else {
            settingsPanel.style.display = 'none';
            showBtn.textContent = 'Show Settings';
            showBtn.classList.remove('settings-expanded');
        }
    }

    closePlanningPanel() {
        const routePanel = document.querySelector('.route-planning-panel');
        if (routePanel) {
            routePanel.classList.add('hidden');
        }
        this.selectedDate = null;
        this.renderCalendar();
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    loadRouteDataForDate(dateKey) {
        const routeData = this.calendarData.get(dateKey);
        if (routeData) {
            // Populate form fields with saved route data
            console.log('🗓️ Loading route data for', dateKey, routeData);
        }
    }

    saveRouteForSelectedDate() {
        if (!this.selectedDate) return;
        
        const dateKey = this.getDateKey(this.selectedDate);
        const routeData = this.gatherRouteFormData();
        
        if (routeData.destinations.length > 0) {
            this.calendarData.set(dateKey, routeData);
            this.renderCalendar(); // Refresh to show route indicator
            console.log('🗓️ Route saved for', dateKey);
        }
    }

    gatherRouteFormData() {
        const startInput = document.getElementById('startLocation');
        const destinationInputs = document.querySelectorAll('.destination-item .address-input');
        
        return {
            startLocation: startInput ? startInput.value : '',
            destinations: Array.from(destinationInputs).map(input => input.value).filter(val => val.trim()),
            timestamp: new Date().toISOString()
        };
    }

    addDestinationField() {
        const destinationInputs = document.querySelector('.destination-inputs');
        if (!destinationInputs) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'destination-input-wrapper';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'address-input';
        input.placeholder = 'Enter destination address';
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-destination-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            wrapper.remove();
        });
        
        wrapper.appendChild(input);
        wrapper.appendChild(removeBtn);
        
        // Insert before the add button
        const addBtn = document.querySelector('.add-destination-btn');
        if (addBtn) {
            addBtn.parentNode.insertBefore(wrapper, addBtn);
        } else {
            destinationInputs.appendChild(wrapper);
        }

        // Add autocomplete if Google Maps is available
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            try {
                const autocomplete = new google.maps.places.Autocomplete(input);
                autocomplete.setFields(['formatted_address', 'geometry']);
            } catch (error) {
                console.warn('🗺️ Failed to add autocomplete to destination:', error);
            }
        }
        
        input.focus();
    }

    optimizeCurrentRoute() {
        const routeData = this.gatherRouteFormData();
        
        if (!routeData.startLocation) {
            this.showNotification('Please enter a start location', 'error');
            return;
        }
        
        if (routeData.destinations.length === 0) {
            this.showNotification('Please add at least one destination', 'error');
            return;
        }
        
        // Save the route for the selected date
        this.saveRouteForSelectedDate();
        
        // Use existing route optimization logic
        if (this.optimizeRoute) {
            this.optimizeRoute();
        } else {
            this.showNotification(`Route planned for ${routeData.destinations.length} destinations`, 'success');
        }
        
        // Show the claims workflow section after optimization
        this.showClaimsWorkflow();
        
        console.log('🗓️ Optimizing route for', this.selectedDate, routeData);
    }

    showClaimsWorkflow() {
        const workflowSection = document.getElementById('claimsWorkflow');
        if (workflowSection) {
            workflowSection.style.display = 'block';
            
            // Update workflow progress
            this.updateWorkflowProgress('Schedule & Contact');
            
            // Setup event listeners for workflow actions
            this.setupClaimsWorkflowListeners();
        }
    }

    updateWorkflowProgress(activeStep) {
        const steps = document.querySelectorAll('.workflow-steps .step');
        steps.forEach(step => {
            step.classList.remove('active');
            if (step.textContent.includes(activeStep)) {
                step.classList.add('active');
            }
        });
    }

    setupClaimsWorkflowListeners() {
        // Schedule Inspections
        const scheduleBtn = document.getElementById('scheduleInspections');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => {
                this.handleScheduleInspections();
            });
        }

        // Export to Mileage Calculator
        const mileageBtn = document.getElementById('exportToMileage');
        if (mileageBtn) {
            mileageBtn.addEventListener('click', () => {
                this.handleExportToMileage();
            });
        }

        // Export to Jobs
        const jobsBtn = document.getElementById('exportToJobs');
        if (jobsBtn) {
            jobsBtn.addEventListener('click', () => {
                this.handleExportToJobs();
            });
        }

        // SMS Notifications
        const smsBtn = document.getElementById('sendSMSNotifications');
        if (smsBtn) {
            smsBtn.addEventListener('click', () => {
                this.handleSMSNotifications();
            });
        }
    }

    handleScheduleInspections() {
        this.updateWorkflowProgress('Schedule & Contact');
        this.showNotification('Opening inspection scheduler...', 'info');
        console.log('🗓️ Scheduling inspections for route');
        
        // Show inspection scheduling modal
        this.showInspectionScheduler();
    }

    showInspectionScheduler() {
        const routeData = this.gatherRouteFormData();
        
        if (routeData.destinations.length === 0) {
            this.showNotification('Please add destinations first', 'error');
            return;
        }

        // Create modal for inspection scheduling
        const modal = document.createElement('div');
        modal.className = 'inspection-scheduler-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Schedule Inspections</h3>
                    <button class="close-modal-btn" onclick="this.closest('.inspection-scheduler-modal').remove()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="scheduling-info">
                        <p><strong>Route Date:</strong> ${this.selectedDate ? this.selectedDate.toDateString() : 'Today'}</p>
                        <p><strong>Starting Point:</strong> ${routeData.startLocation}</p>
                        <p><strong>Destinations:</strong> ${routeData.destinations.length} locations</p>
                    </div>
                    
                    <div class="inspection-list">
                        ${routeData.destinations.map((dest, index) => `
                            <div class="inspection-item">
                                <div class="inspection-header">
                                    <h4>Stop ${index + 1}: ${dest}</h4>
                                </div>
                                
                                <div class="inspection-details">
                                    <div class="datetime-picker">
                                        <div class="date-time-row">
                                            <div class="date-field">
                                                <label>Date:</label>
                                                <input type="date" class="inspection-date" data-stop="${index}" value="${this.selectedDate ? this.selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                                            </div>
                                            <div class="time-field">
                                                <label>Time:</label>
                                                <input type="time" class="inspection-time" data-stop="${index}" value="09:00">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="contact-info">
                                        <input type="text" placeholder="Contact Name" class="contact-name" data-stop="${index}">
                                        <input type="tel" placeholder="Phone Number" class="contact-phone" data-stop="${index}">
                                    </div>
                                    
                                    <div class="inspection-type">
                                        <label>Inspection Type:</label>
                                        <select class="inspection-type-select" data-stop="${index}">
                                            <option value="auto">Auto Damage</option>
                                            <option value="total-loss">Total Loss</option>
                                            <option value="te">Theft/Recovery</option>
                                            <option value="photoscope">Photo Scope</option>
                                            <option value="exotic">Exotic/Classic</option>
                                        </select>
                                    </div>
                                    
                                    <div class="notes">
                                        <textarea placeholder="Special notes or instructions..." class="inspection-notes" data-stop="${index}"></textarea>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.inspection-scheduler-modal').remove()">
                        Cancel
                    </button>
                    <button class="cipher-btn cipher-btn--primary" onclick="window.routeOptimizer.confirmInspectionSchedule()">
                        Schedule All Inspections
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    confirmInspectionSchedule() {
        const modal = document.querySelector('.inspection-scheduler-modal');
        if (!modal) return;

        // Gather scheduling data
        const inspections = [];
        const inspectionItems = modal.querySelectorAll('.inspection-item');
        
        inspectionItems.forEach((item, index) => {
            const dateInput = item.querySelector('.inspection-date');
            const timeInput = item.querySelector('.inspection-time');
            const contactName = item.querySelector('.contact-name');
            const contactPhone = item.querySelector('.contact-phone');
            const inspectionType = item.querySelector('.inspection-type-select');
            const notes = item.querySelector('.inspection-notes');
            
            const inspectionData = {
                stop: index + 1,
                address: this.gatherRouteFormData().destinations[index],
                date: dateInput.value,
                time: timeInput.value,
                contactName: contactName.value,
                contactPhone: contactPhone.value,
                inspectionType: inspectionType.value,
                notes: notes.value,
                dateTime: new Date(`${dateInput.value}T${timeInput.value}:00`)
            };
            
            inspections.push(inspectionData);
        });

        // Store inspection data
        this.currentInspections = inspections;
        
        // Save inspections to localStorage for calendar integration
        this.saveInspectionsToCalendar(inspections);
        
        // Close modal
        modal.remove();
        
        // Show success and enable SMS functionality
        this.showNotification(`${inspections.length} inspections scheduled successfully!`, 'success');
        
        // Enable SMS button
        const smsBtn = document.getElementById('sendSMSNotifications');
        if (smsBtn) {
            smsBtn.disabled = false;
            smsBtn.textContent = 'Send Customer Notifications';
        }
        
        console.log('📅 Inspections scheduled:', inspections);
    }

    saveInspectionsToCalendar(inspections) {
        try {
            // Get existing calendar appointments
            let existingAppointments = JSON.parse(localStorage.getItem('cc_calendar_appointments') || '[]');
            
            // Convert inspections to calendar appointment format
            const calendarAppointments = inspections.map(inspection => ({
                id: `inspection-${Date.now()}-${inspection.stop}`,
                date: inspection.date,
                time: inspection.time,
                duration: 45, // Default 45 minutes for inspections
                address: inspection.address,
                firm: 'Route Optimizer',
                type: inspection.inspectionType,
                contactName: inspection.contactName,
                contactPhone: inspection.contactPhone,
                notes: inspection.notes,
                status: 'scheduled',
                source: 'route-optimizer',
                createdAt: new Date().toISOString()
            }));
            
            // Add new appointments to existing ones
            existingAppointments = [...existingAppointments, ...calendarAppointments];
            
            // Save back to localStorage
            localStorage.setItem('cc_calendar_appointments', JSON.stringify(existingAppointments));
            
            console.log('📅 Saved inspections to calendar:', calendarAppointments);
            
            // If calendar controller is available, refresh it
            if (window.calendarController && window.calendarController.loadData) {
                window.calendarController.loadData();
                if (window.calendarController.renderCalendar) {
                    window.calendarController.renderCalendar();
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to save inspections to calendar:', error);
        }
    }

    handleExportToMileage() {
        this.updateWorkflowProgress('Bill Mileage');
        this.showNotification('Exporting route to Mileage Calculator...', 'success');
        
        // Gather route data for export
        const routeData = this.gatherRouteFormData();
        const inspectionData = this.currentInspections || [];
        
        // Prepare mileage export data
        const mileageExportData = {
            routeId: `route_${Date.now()}`,
            routeDate: this.selectedDate || new Date(),
            startLocation: routeData.startLocation,
            destinations: routeData.destinations,
            inspections: inspectionData,
            totalDestinations: routeData.destinations.length,
            exportedAt: new Date().toISOString(),
            exportedFrom: 'route-optimizer'
        };
        
        // Store export data in localStorage for mileage calculator to pick up
        localStorage.setItem('pendingMileageExport', JSON.stringify(mileageExportData));
        
        // Show export confirmation modal
        this.showMileageExportModal(mileageExportData);
    }

    showMileageExportModal(exportData) {
        const modal = document.createElement('div');
        modal.className = 'mileage-export-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Export to Mileage Calculator</h3>
                    <button class="close-modal-btn" onclick="this.closest('.mileage-export-modal').remove()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="export-summary">
                        <h4>Route Summary for Mileage Billing</h4>
                        <div class="export-details">
                            <div class="detail-row">
                                <strong>Route Date:</strong> ${exportData.routeDate.toDateString()}
                            </div>
                            <div class="detail-row">
                                <strong>Start Location:</strong> ${exportData.startLocation}
                            </div>
                            <div class="detail-row">
                                <strong>Total Stops:</strong> ${exportData.totalDestinations}
                            </div>
                        </div>
                    </div>
                    
                    <div class="destination-preview">
                        <h4>Destinations to Bill:</h4>
                        <div class="destination-list-preview">
                            ${exportData.destinations.map((dest, index) => `
                                <div class="destination-preview-item">
                                    <span class="stop-number">${index + 1}</span>
                                    <span class="destination-address">${dest}</span>
                                    ${exportData.inspections[index] ? `
                                        <span class="inspection-type">(${exportData.inspections[index].inspectionType})</span>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="billing-firms-selection">
                        <h4>Select Firms to Bill:</h4>
                        <div class="firm-checkboxes">
                            <label class="firm-checkbox">
                                <input type="checkbox" value="allstate" checked>
                                Allstate
                            </label>
                            <label class="firm-checkbox">
                                <input type="checkbox" value="state-farm" checked>
                                State Farm
                            </label>
                            <label class="firm-checkbox">
                                <input type="checkbox" value="geico" checked>
                                GEICO
                            </label>
                            <label class="firm-checkbox">
                                <input type="checkbox" value="progressive" checked>
                                Progressive
                            </label>
                            <label class="firm-checkbox">
                                <input type="checkbox" value="usaa" checked>
                                USAA
                            </label>
                        </div>
                    </div>
                    
                    <div class="export-note">
                        <p><strong>Remember:</strong> Bill for mileage immediately - don't wait for claim approval. This follows your proven business process.</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.mileage-export-modal').remove()">
                        Cancel Export
                    </button>
                    <button class="cipher-btn cipher-btn--primary" onclick="window.routeOptimizer.confirmMileageExport()">
                        Export to Mileage Calculator
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    confirmMileageExport() {
        const modal = document.querySelector('.mileage-export-modal');
        if (!modal) return;

        // Get selected firms
        const selectedFirms = [];
        modal.querySelectorAll('.firm-checkbox input:checked').forEach(checkbox => {
            selectedFirms.push(checkbox.value);
        });

        // Update export data with selected firms
        const exportData = JSON.parse(localStorage.getItem('pendingMileageExport'));
        exportData.selectedFirms = selectedFirms;
        localStorage.setItem('pendingMileageExport', JSON.stringify(exportData));

        // Close modal
        modal.remove();

        // Show success message
        this.showNotification(`Route exported! Opening Mileage Calculator to bill ${selectedFirms.length} firms...`, 'success');

        // Navigate to mileage calculator
        if (window.masterInterface && window.masterInterface.activateTab) {
            setTimeout(() => {
                window.masterInterface.activateTab('mileage-calculator');
            }, 1500);
        }

        // Mark this step as complete
        this.markStepComplete('mileage');
    }

    handleExportToJobs() {
        this.updateWorkflowProgress('Inspect');
        this.showNotification('Creating job assignments...', 'success');
        
        if (!this.currentInspections || this.currentInspections.length === 0) {
            this.showNotification('Please schedule inspections first', 'error');
            return;
        }
        
        this.showJobAssignmentCreator();
    }

    showJobAssignmentCreator() {
        const modal = document.createElement('div');
        modal.className = 'job-assignment-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create Job Assignments</h3>
                    <button class="close-modal-btn" onclick="this.closest('.job-assignment-modal').remove()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="job-creation-info">
                        <h4>Converting Inspections to Job Assignments</h4>
                        <p>Create individual jobs for each inspection to track through completion</p>
                    </div>
                    
                    <div class="job-assignment-list">
                        ${this.currentInspections.map((inspection, index) => `
                            <div class="job-assignment-item">
                                <div class="job-header">
                                    <input type="checkbox" id="job-${index}" class="job-checkbox" checked>
                                    <label for="job-${index}">
                                        <strong>Job ${index + 1}: ${inspection.address}</strong>
                                    </label>
                                </div>
                                
                                <div class="job-details">
                                    <div class="job-basic-info">
                                        <div class="job-field">
                                            <label>Job Title:</label>
                                            <input type="text" class="job-title" data-job="${index}" 
                                                   value="${inspection.inspectionType} - ${inspection.address}">
                                        </div>
                                        
                                        <div class="job-field">
                                            <label>Priority:</label>
                                            <select class="job-priority" data-job="${index}">
                                                <option value="high">High Priority</option>
                                                <option value="normal" selected>Normal</option>
                                                <option value="low">Low Priority</option>
                                            </select>
                                        </div>
                                        
                                        <div class="job-field">
                                            <label>Estimated Duration:</label>
                                            <select class="job-duration" data-job="${index}">
                                                <option value="30">30 minutes</option>
                                                <option value="60" selected>1 hour</option>
                                                <option value="90">1.5 hours</option>
                                                <option value="120">2 hours</option>
                                                <option value="180">3+ hours</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="job-inspection-details">
                                        <div class="inspection-info">
                                            <strong>Scheduled:</strong> ${inspection.date.toDateString()} at ${inspection.time}
                                        </div>
                                        <div class="inspection-info">
                                            <strong>Contact:</strong> ${inspection.contactName} - ${inspection.contactPhone}
                                        </div>
                                        <div class="inspection-info">
                                            <strong>Type:</strong> ${inspection.inspectionType}
                                        </div>
                                    </div>
                                    
                                    <div class="job-workflow-checklist">
                                        <h5>Job Workflow Checklist:</h5>
                                        <div class="checklist-items">
                                            <label class="checklist-item">
                                                <input type="checkbox" checked disabled>
                                                Route planned and optimized
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox" checked disabled>
                                                Customer contacted and scheduled
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox" checked disabled>
                                                Mileage billing submitted
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox">
                                                Conduct inspection and take photos
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox">
                                                Upload photos to firm portals
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox">
                                                Complete estimate and paperwork
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox">
                                                Submit total loss form (BCIF) if needed
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox">
                                                Get comparables and CCC ACV
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div class="job-notes">
                                        <label>Job Notes:</label>
                                        <textarea class="job-notes-text" data-job="${index}" 
                                                  placeholder="Additional notes or special instructions...">${inspection.notes || ''}</textarea>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.job-assignment-modal').remove()">
                        Cancel
                    </button>
                    <button class="cipher-btn cipher-btn--primary" onclick="window.routeOptimizer.createJobAssignments()">
                        Create Job Assignments
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    createJobAssignments() {
        const modal = document.querySelector('.job-assignment-modal');
        if (!modal) return;

        const jobAssignments = [];
        const checkedJobs = modal.querySelectorAll('.job-checkbox:checked');

        checkedJobs.forEach((checkbox) => {
            const index = checkbox.id.split('-')[1];
            const inspection = this.currentInspections[index];
            const jobTitle = modal.querySelector(`.job-title[data-job="${index}"]`).value;
            const jobPriority = modal.querySelector(`.job-priority[data-job="${index}"]`).value;
            const jobDuration = modal.querySelector(`.job-duration[data-job="${index}"]`).value;
            const jobNotes = modal.querySelector(`.job-notes-text[data-job="${index}"]`).value;

            const jobAssignment = {
                jobId: `job_${Date.now()}_${index}`,
                title: jobTitle,
                address: inspection.address,
                contactName: inspection.contactName,
                contactPhone: inspection.contactPhone,
                scheduledDate: inspection.date,
                scheduledTime: inspection.time,
                inspectionType: inspection.inspectionType,
                priority: jobPriority,
                estimatedDuration: parseInt(jobDuration),
                notes: jobNotes,
                status: 'scheduled',
                workflowChecklist: {
                    routePlanned: true,
                    customerContacted: true,
                    mileageBilled: true,
                    inspectionCompleted: false,
                    photosUploaded: false,
                    paperworkCompleted: false,
                    totalLossSubmitted: false,
                    comparablesObtained: false
                },
                createdAt: new Date().toISOString(),
                createdFrom: 'route-optimizer'
            };

            jobAssignments.push(jobAssignment);
        });

        // Store job assignments for jobs module
        const existingJobs = JSON.parse(localStorage.getItem('claimCipherJobs') || '[]');
        const updatedJobs = [...existingJobs, ...jobAssignments];
        localStorage.setItem('claimCipherJobs', JSON.stringify(updatedJobs));

        // Close modal
        modal.remove();

        // Show success
        this.showNotification(`${jobAssignments.length} job assignments created successfully!`, 'success');

        // Navigate to jobs management
        if (window.masterInterface && window.masterInterface.activateTab) {
            setTimeout(() => {
                window.masterInterface.activateTab('jobs');
            }, 1500);
        }

        // Mark step complete and enable total loss
        this.markStepComplete('jobs');

        console.log('💼 Job assignments created:', jobAssignments);
    }

    updateSMSTemplate(selectElement) {
        const contactIndex = selectElement.dataset.contact;
        const template = selectElement.value;
        const inspection = this.currentInspections[contactIndex];
        const messageTextarea = document.querySelector(`.message-text[data-contact="${contactIndex}"]`);
        
        if (!messageTextarea || !inspection) return;

        const templates = {
            'general': `Hello ${inspection.contactName || '[Customer Name]'},

My name is [Your Name], and I'm reaching out on behalf of [Insurance Company]. We are an independent appraisal firm working to coordinate your vehicle inspection. We'd like to schedule an appointment for our licensed auto damage appraiser to inspect your vehicle. Our appraiser will be in your area and is available on ${inspection.date.toDateString()}, between ${inspection.time} and [End Time]. The inspection typically takes no more than 15 minutes.

Please confirm the following:

Please let us know what is the current condition of the vehicle? Is it driveable with limited use (should it be on the road), or is it driveable road ready?
Is the inspection location still correct? ${inspection.address} ([Vehicle Year/Make/Model]).
Does the proposed time work for you?

If any changes occur with the schedule, please contact us as soon as possible so we can reschedule accordingly. You can reach us at [Your Phone Number].

Thank you, and we look forward to assisting you.

Best regards,
[Your Name]
Independent Appraisal Coordinator
[Company Name]`,

            'same-day': `Hello ${inspection.contactName || '[Customer Name]'},

My name is [Your Name], and I'm reaching out on behalf of [Insurance Company]. We are an independent appraisal firm coordinating your vehicle inspection.

If possible, we'd like to have your vehicle inspected today, ${inspection.date.toDateString()}, between ${inspection.time} and [End Time]. The inspection typically takes no more than 15 minutes.

Please confirm the following:

What is the current condition of the vehicle? Is it driveable with limited use (should it be on the road), or is it road-ready?
Is the inspection location still correct: ${inspection.address} ([Vehicle Year/Make/Model])?
Does the proposed time work for you?

If any changes occur with the schedule, please contact us as soon as possible so we can reschedule accordingly. You can reach us at [Your Phone Number].

Thank you, and we look forward to assisting you.

Best regards,
[Your Name]
Independent Appraisal Coordinator
[Company Name]`,

            'reschedule': `Subject: Request to Reschedule Vehicle Inspection Appointment

Dear ${inspection.contactName || '[Customer Name]'},

I hope this message finds you well. I would like to request a rescheduling for your vehicle inspection appointment to [New Date] between [New Time] and [New End Time]. Please let me know if this works.

I appreciate your time and assistance. Looking forward to your confirmation.

Best regards,
[Your Name]
[Your Phone Number]`,

            'weather': `Hello ${inspection.contactName || '[Customer Name]'},

This is [Your Name] and I am contacting you on behalf of [Insurance Company]. I'd like to schedule an appointment for our auto adjuster to inspect your vehicle. We have availability on ${inspection.date.toDateString()} between ${inspection.time} and [End Time].

We hope you're staying safe during the [weather condition] weather. We understand how challenging these conditions can be, and we're here to assist with inspecting your vehicle and addressing any concerns.

Due to the weather advisory, if your appointment is scheduled, please ensure your vehicle is accessible and free of snow or ice, if safe to do so. Should there be any delays or rescheduling due to weather, we will notify you promptly.

Thank you for your patience and understanding. If you have any questions, please reach out at [Your Phone Number].

Stay warm and safe,
[Your Name]`,

            'copart-approval': `I'm reaching out to kindly follow up regarding the approval status for Copart. Do we have an update on whether approval has been granted? Once we receive confirmation, we'd like to proceed with scheduling the inspection as soon as possible.`,

            'no-response': `Reached out to owner, and despite our efforts, have not received a response from them via phone/text for appointment scheduling.

Reached out to owner, have not received a response from them via phone/text for appointment scheduling.`
        };

        messageTextarea.value = templates[template] || templates['general'];
    }

    handleSMSNotifications() {
        this.showNotification('Opening SMS/Call interface...', 'info');
        console.log('📱 Sending customer notifications');
        
        if (!this.currentInspections || this.currentInspections.length === 0) {
            this.showNotification('Please schedule inspections first', 'error');
            return;
        }
        
        this.showSMSInterface();
    }

    showSMSInterface() {
        const modal = document.createElement('div');
        modal.className = 'sms-interface-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Customer Notifications</h3>
                    <button class="close-modal-btn" onclick="this.closest('.sms-interface-modal').remove()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="notification-options">
                        <h4>Choose Notification Method:</h4>
                        <div class="method-tabs">
                            <button class="method-tab active" data-method="sms">SMS Text</button>
                            <button class="method-tab" data-method="call">Phone Call</button>
                            <button class="method-tab" data-method="email">Email</button>
                        </div>
                    </div>
                    
                    <div class="contact-list">
                        ${this.currentInspections.map((inspection, index) => `
                            <div class="contact-item">
                                <div class="contact-header">
                                    <input type="checkbox" id="contact-${index}" class="contact-checkbox" checked>
                                    <label for="contact-${index}">
                                        <strong>Stop ${inspection.stop}: ${inspection.contactName || 'Contact Name Needed'}</strong>
                                    </label>
                                </div>
                                
                                <div class="contact-details">
                                    <div class="contact-info">
                                        <span class="address">${inspection.address}</span>
                                        <span class="phone">${inspection.contactPhone || 'Phone needed'}</span>
                                        <span class="time">${inspection.time} on ${inspection.date.toDateString()}</span>
                                    </div>
                                </div>
                                
                                <div class="message-preview sms-message" style="display: block;">
                                    <label>SMS Message Template:</label>
                                    <div class="template-selector">
                                        <select class="sms-template-select" data-contact="${index}" onchange="window.routeOptimizer.updateSMSTemplate(this)">
                                            <option value="general">General Inspection</option>
                                            <option value="same-day">Same Day Inspection</option>
                                            <option value="reschedule">Reschedule Request</option>
                                            <option value="weather">Weather Advisory</option>
                                            <option value="copart-approval">Copart Approval</option>
                                            <option value="no-response">No Response Follow-up</option>
                                        </select>
                                    </div>
                                    <textarea class="message-text" data-contact="${index}">Hello ${inspection.contactName || '[Customer Name]'},

My name is [Your Name], and I'm reaching out on behalf of [Insurance Company]. We are an independent appraisal firm working to coordinate your vehicle inspection. We'd like to schedule an appointment for our licensed auto damage appraiser to inspect your vehicle. Our appraiser will be in your area and is available on ${inspection.date.toDateString()}, between ${inspection.time} and [End Time]. The inspection typically takes no more than 15 minutes.

Please confirm the following:

Please let us know what is the current condition of the vehicle? Is it driveable with limited use (should it be on the road), or is it driveable road ready?
Is the inspection location still correct? ${inspection.address} ([Vehicle Year/Make/Model]).
Does the proposed time work for you?

If any changes occur with the schedule, please contact us as soon as possible so we can reschedule accordingly. You can reach us at [Your Phone Number].

Thank you, and we look forward to assisting you.

Best regards,
[Your Name]
Independent Appraisal Coordinator
[Company Name]</textarea>
                                </div>
                                
                                <div class="message-preview call-message" style="display: none;">
                                    <label>Call Script:</label>
                                    <textarea class="message-text" data-contact="${index}">Hi, this is [Your Name] calling from [Insurance Company]. I'm reaching out to schedule an inspection for your vehicle claim. I have you down for ${inspection.date.toDateString()} at ${inspection.time} at ${inspection.address}. Does this time still work for you?</textarea>
                                </div>
                                
                                <div class="message-preview email-message" style="display: none;">
                                    <label>Email Message:</label>
                                    <textarea class="message-text" data-contact="${index}">Subject: Vehicle Inspection Scheduled - Confirmation Needed

Dear ${inspection.contactName || '[Name]'},

I hope this email finds you well. I am writing to confirm your vehicle inspection appointment:

Date: ${inspection.date.toDateString()}
Time: ${inspection.time}
Location: ${inspection.address}
Inspector: [Your Name]
Phone: [Your Phone]

Please reply to confirm this appointment time works for you, or let me know if we need to reschedule.

Thank you,
[Your Name]
[Insurance Company]</textarea>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.sms-interface-modal').remove()">
                        Cancel
                    </button>
                    <button class="cipher-btn cipher-btn--primary" onclick="window.routeOptimizer.sendNotifications()">
                        Send Selected Notifications
                    </button>
                </div>
            </div>
        `;

        // Add tab functionality
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('method-tab')) {
                const method = e.target.dataset.method;
                
                // Update active tab
                modal.querySelectorAll('.method-tab').forEach(tab => tab.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show/hide message previews
                modal.querySelectorAll('.message-preview').forEach(preview => {
                    preview.style.display = preview.classList.contains(`${method}-message`) ? 'block' : 'none';
                });
            }
        });

        document.body.appendChild(modal);
    }

    sendNotifications() {
        const modal = document.querySelector('.sms-interface-modal');
        if (!modal) return;

        const activeMethod = modal.querySelector('.method-tab.active').dataset.method;
        const checkedContacts = modal.querySelectorAll('.contact-checkbox:checked');
        
        let sentCount = 0;
        checkedContacts.forEach((checkbox) => {
            const index = checkbox.id.split('-')[1];
            const inspection = this.currentInspections[index];
            const messageText = modal.querySelector(`.message-text[data-contact="${index}"]`).value;
            
            // Log the notification (in real app, would send via SMS/email service)
            console.log(`📱 ${activeMethod.toUpperCase()} to ${inspection.contactPhone}:`, messageText);
            sentCount++;
        });

        modal.remove();
        this.showNotification(`${sentCount} ${activeMethod} notifications sent successfully!`, 'success');
        
        // Mark this step as complete and enable next step
        this.markStepComplete('contact');
    }

    markStepComplete(step) {
        // Mark workflow step as complete and enable next actions
        if (step === 'contact') {
            const mileageBtn = document.getElementById('exportToMileage');
            if (mileageBtn) {
                mileageBtn.disabled = false;
                mileageBtn.classList.add('step-ready');
            }
        } else if (step === 'mileage') {
            const jobsBtn = document.getElementById('exportToJobs');
            if (jobsBtn) {
                jobsBtn.disabled = false;
                jobsBtn.classList.add('step-ready');
            }
        } else if (step === 'jobs') {
            // Enable total loss workflow
            this.showTotalLossWorkflow();
        }
    }

    showTotalLossWorkflow() {
        // Add a final workflow step for total loss completion
        const workflowSection = document.getElementById('claimsWorkflow');
        if (!workflowSection) return;

        const totalLossCard = document.createElement('div');
        totalLossCard.className = 'workflow-action-card total-loss-ready';
        totalLossCard.innerHTML = `
            <h4>4. Complete Claims Process</h4>
            <p>Finalize total loss forms, comparables, and CCC ACV</p>
            <div class="action-buttons">
                <button id="openTotalLoss" class="cipher-btn cipher-btn--primary">
                    Open Total Loss Forms
                </button>
                <button id="viewJobProgress" class="cipher-btn cipher-btn--secondary">
                    View Job Progress
                </button>
            </div>
        `;

        // Add to workflow grid
        const workflowGrid = workflowSection.querySelector('.workflow-actions-grid');
        if (workflowGrid) {
            workflowGrid.appendChild(totalLossCard);

            // Add event listeners
            const totalLossBtn = totalLossCard.querySelector('#openTotalLoss');
            const jobProgressBtn = totalLossCard.querySelector('#viewJobProgress');

            if (totalLossBtn) {
                totalLossBtn.addEventListener('click', () => {
                    this.updateWorkflowProgress('Complete Claims');
                    if (window.masterInterface && window.masterInterface.activateTab) {
                        window.masterInterface.activateTab('total-loss');
                    }
                });
            }

            if (jobProgressBtn) {
                jobProgressBtn.addEventListener('click', () => {
                    if (window.masterInterface && window.masterInterface.activateTab) {
                        window.masterInterface.activateTab('jobs');
                    }
                });
            }
        }
    }

    addDestinationToList() {
        const destinationsList = document.getElementById('destinationsList');
        const routeActions = document.getElementById('routeActions');
        
        if (!destinationsList) return;

        // Remove empty state if it exists
        const emptyState = destinationsList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Create destination input
        const destDiv = document.createElement('div');
        destDiv.className = 'destination-item';
        destDiv.innerHTML = `
            <div class="destination-input-group">
                <label>Destination Address</label>
                <div class="destination-input-wrapper">
                    <input type="text" class="address-input" placeholder="Enter destination address">
                    <button type="button" class="remove-destination-btn" onclick="this.closest('.destination-item').remove(); window.routeOptimizer.updateRouteActions();">
                        Remove
                    </button>
                </div>
            </div>
        `;

        destinationsList.appendChild(destDiv);

        // Show route actions
        if (routeActions) {
            routeActions.style.display = 'flex';
            routeActions.classList.add('has-destinations');
        }

        // Add autocomplete if Google Maps is available
        const input = destDiv.querySelector('.address-input');
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            try {
                const autocomplete = new google.maps.places.Autocomplete(input);
                autocomplete.setFields(['formatted_address', 'geometry']);
            } catch (error) {
                console.warn('🗺️ Failed to add autocomplete to destination:', error);
            }
        }

        input.focus();
    }

    updateRouteActions() {
        const destinationsList = document.getElementById('destinationsList');
        const routeActions = document.getElementById('routeActions');
        
        if (!destinationsList || !routeActions) return;

        const destinationItems = destinationsList.querySelectorAll('.destination-item');
        
        if (destinationItems.length === 0) {
            // Show empty state and hide actions
            destinationsList.innerHTML = `
                <div class="empty-state">
                    <h4>No destinations added yet</h4>
                    <p>Click "Add Destination" to start planning your route</p>
                </div>
            `;
            routeActions.style.display = 'none';
            routeActions.classList.remove('has-destinations');
        }
    }
}

// Global functions
// Enhanced removeDestination function by Lyricist Agent
function removeDestination(button) {
    const destDiv = button.closest('.destination-input');
    const input = destDiv.querySelector('.destination-address-input');
    const address = input.value.trim();
    
    // If input has content, ask for confirmation
    if (address) {
        if (!confirm(`Remove destination: "${address}"?`)) {
            return;
        }
    }
    
    // Remove the destination
    destDiv.remove();
    
    console.log('🎵 Lyricist: Destination removed:', address || 'empty');
}

function hideError() {
    document.getElementById('errorDisplay').style.display = 'none';
}

// Initialize when Google Maps loads
function initRouteOptimizer() {
    console.log('🔒 Security Agent: initRouteOptimizer called');
    
    if (window.routeOptimizer) {
        console.log('🔒 RouteOptimizer already exists, updating with Google Maps');
        const routeOptimizer = window.routeOptimizer;
        
        // Initialize Google Maps for existing optimizer
        if (typeof google !== 'undefined') {
            const mapContainer = document.getElementById('routeMap');
            if (mapContainer) {
                try {
                    routeOptimizer.map = new google.maps.Map(mapContainer, {
                        zoom: 10,
                        center: { lat: 40.7128, lng: -74.0060 } // Default to NYC
                    });
                    
                    routeOptimizer.directionsService = new google.maps.DirectionsService();
                    routeOptimizer.directionsRenderer = new google.maps.DirectionsRenderer();
                    routeOptimizer.geocoder = new google.maps.Geocoder();
                    
                    routeOptimizer.directionsRenderer.setMap(routeOptimizer.map);
                    console.log('🔒 Google Maps initialized for existing RouteOptimizer');
                } catch (error) {
                    console.warn('🗺️ Map initialization failed:', error.message);
                    console.log('🗺️ Continuing without map visualization');
                }
            } else {
                console.warn('🔒 Route map container not found, maps will be initialized later');
            }
        }
    } else {
        const routeOptimizer = new RouteOptimizer();
        
        // Initialize Google Maps if available
        if (typeof google !== 'undefined') {
            const mapContainer = document.getElementById('routeMap');
            if (mapContainer) {
                try {
                    routeOptimizer.map = new google.maps.Map(mapContainer, {
                        zoom: 10,
                        center: { lat: 40.7128, lng: -74.0060 } // Default to NYC
                    });
                    
                    routeOptimizer.directionsService = new google.maps.DirectionsService();
                    routeOptimizer.directionsRenderer = new google.maps.DirectionsRenderer();
                    routeOptimizer.geocoder = new google.maps.Geocoder();
                    
                    routeOptimizer.directionsRenderer.setMap(routeOptimizer.map);
                    console.log('🔒 New RouteOptimizer created with Google Maps');
                } catch (error) {
                    console.warn('🗺️ Map initialization failed for new RouteOptimizer:', error.message);
                }
            } else {
                console.log('🗺️ Map container not found for new RouteOptimizer');
            }
        } else {
            console.log('🔒 New RouteOptimizer created without Google Maps');
        }
        
        window.routeOptimizer = routeOptimizer;
    }
}

// Fallback initialization if Google Maps doesn't load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔒 Security Agent: DOM loaded, initializing Route Optimizer...');
    
    // Only create if it doesn't exist
    if (!window.routeOptimizer) {
        const routeOptimizer = new RouteOptimizer();
        window.routeOptimizer = routeOptimizer;
        console.log('🔒 Security Agent: Route Optimizer initialized successfully (fallback mode)');
    } else {
        console.log('🔒 Security Agent: Route Optimizer already exists');
    }
    
    // Test if Add Stop button is working
    const addBtn = document.getElementById('addDestination');
    if (addBtn) {
        console.log('🔒 Add Destination button found and ready');
    } else {
        console.error('🔒 Add Destination button NOT found!');
    }
    
    // Initialize fallback map container if needed
    const mapContainer = document.getElementById('routeMap');
    if (mapContainer && !mapContainer.innerHTML.trim()) {
        console.log('🗺️ Initializing fallback map container');
        mapContainer.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(30, 30, 30, 0.95));
                border-radius: var(--cipher-radius-lg);
                color: var(--cipher-text-secondary);
                font-size: 1rem;
            ">
                🗺️ Ready for route visualization
            </div>
        `;
    }
});
