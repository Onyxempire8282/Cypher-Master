/**
 * 🧮 MILEAGE CYPHER - Combined Professional Calculator
 * Features: Firm Management, Auto-Distance, Quick Calculate, Copy-Ready Billing
 */

class MileageCypherCalculator {
    constructor() {
        this.settings = this.initializeSettings();
        this.currentCalculation = null;
        this.calculationHistory = [];
        
        this.init();
    }

    init() {
        console.log('🧮 Mileage Cypher Calculator initializing...');
        this.setupEventListeners();
        this.loadFirmsToDropdown();
        this.setupAutoCalculation();
        this.loadUserHomeLocation();
        this.checkForRouteImport();
        console.log('🧮 Mileage Cypher Calculator ready!');
    }

    initializeSettings() {
        const defaultSettings = {
            // Default firms with realistic rates, free miles, and claim type rates
            firms: [
                {
                    id: 'sedgwick',
                    name: 'Sedgwick',
                    freeMiles: 50,
                    ratePerMile: 0.67,
                    roundTripDefault: true,
                    claimTypes: {
                        auto: 75,
                        te: 95,
                        photoscope: 60,
                        exotic: 110
                    }
                },
                {
                    id: 'acd',
                    name: 'ACD (American Claims & Disposal)',
                    freeMiles: 30,
                    ratePerMile: 0.60,
                    roundTripDefault: false,
                    claimTypes: {
                        auto: 65,
                        te: 85,
                        photoscope: 50,
                        exotic: 95
                    }
                },
                {
                    id: 'crawford',
                    name: 'Crawford & Company',
                    freeMiles: 40,
                    ratePerMile: 0.65,
                    roundTripDefault: true,
                    claimTypes: {
                        auto: 70,
                        te: 90,
                        photoscope: 55,
                        exotic: 105
                    }
                }
            ],
            // User preferences
            homeLocation: '', // Static starting point for user
            lastSelectedFirmId: 'sedgwick',
            // API configuration
            googleMapsApiKey: window.MILEAGE_CYPHER_CONFIG?.GOOGLE_MAPS_API_KEY || '', // Load from config
            autoCalculateEnabled: true,
            copyFormat: 'detailed' // 'brief', 'detailed', 'custom'
        };

        const saved = localStorage.getItem('mileage_cypher_settings_v2');
        console.log('🧮 Loading settings - localStorage data:', saved);
        console.log('🧮 Default firms count:', defaultSettings.firms.length);
        
        let settings;
        if (saved) {
            const parsedSaved = JSON.parse(saved);
            settings = { ...defaultSettings, ...parsedSaved };
            console.log('🧮 Merged settings firms count:', settings.firms?.length || 0);
            
            // Ensure we always have default firms if saved settings has empty firms
            if (!settings.firms || settings.firms.length === 0) {
                console.log('🧮 No firms in saved settings, restoring defaults...');
                settings.firms = defaultSettings.firms;
            } else {
                // Ensure existing firms have claimTypes (backward compatibility)
                console.log('🧮 Checking firms for claimTypes...');
                settings.firms = settings.firms.map(firm => {
                    const defaultFirm = defaultSettings.firms.find(df => df.id === firm.id);
                    if (!firm.claimTypes && defaultFirm && defaultFirm.claimTypes) {
                        console.log(`🧮 Adding missing claimTypes to ${firm.name}`);
                        return { ...firm, claimTypes: defaultFirm.claimTypes };
                    }
                    return firm;
                });
                
                // Save updated settings with claimTypes
                setTimeout(() => {
                    this.saveSettings();
                }, 100);
            }
        } else {
            settings = defaultSettings;
            console.log('🧮 Using default settings, firms count:', settings.firms.length);
        }
        
        return settings;
    }

    setupEventListeners() {
        console.log('🧮 Setting up event listeners - checking for DOM elements...');
        
        // Check all required elements
        const elements = {
            firmSelect: document.getElementById('firmSelect'),
            pointA: document.getElementById('pointA'),
            pointB: document.getElementById('pointB'),
            distanceMiles: document.getElementById('distanceMiles'),
            roundTrip: document.getElementById('roundTrip'),
            calculateBtn: document.getElementById('calculateBtn'),
            claimTypeSelect: document.getElementById('claimTypeSelect'),
            copyBtn: document.getElementById('copyBtn'),
            sendToJobsBtn: document.getElementById('sendToJobsBtn')
        };
        
        console.log('🧮 DOM elements found:', Object.keys(elements).map(key => `${key}: ${!!elements[key]}`).join(', '));
        
        // Firm selection
        const firmSelect = elements.firmSelect;
        if (firmSelect) {
            firmSelect.addEventListener('change', (e) => this.onFirmChange(e.target.value));
        }

        // Calculate button with loading states
        const calculateBtn = document.getElementById('calculateBtn');
        console.log('🧮 Calculate button element found:', !!calculateBtn);
        if (calculateBtn) {
            calculateBtn.addEventListener('click', (e) => {
                console.log('🧮 Calculate button clicked! Event triggered.');
                e.preventDefault();
                
                // Show loading state
                this.showCalculateLoading(true);
                
                // Check if distance field is empty and try auto-calculation first
                const distance = parseFloat(document.getElementById('distanceMiles').value) || 0;
                const pointA = document.getElementById('pointA').value.trim();
                const pointB = document.getElementById('pointB').value.trim();
                
                console.log('🧮 Calculate button clicked - values:', {
                    distance,
                    pointA: pointA || 'EMPTY',
                    pointB: pointB || 'EMPTY'
                });
                
                if (distance <= 0 && pointA && pointB) {
                    console.log('🧮 Calculate button clicked - attempting auto-distance first');
                    this.triggerAutoDistance();
                } else if (distance > 0) {
                    console.log('🧮 Calculate button clicked - distance already set, calculating billing');
                    this.performCalculation(false); // false = not silent, show results
                } else {
                    console.log('🧮 Calculate button clicked - missing required data, forcing calculation anyway');
                    // Force calculation to show validation errors
                    this.performCalculation(false);
                }
            });
        }

        // Copy functionality with success states
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyCalculationToClipboard());
        }

        // Send to Jobs functionality
        const sendToJobsBtn = document.getElementById('sendToJobsBtn');
        if (sendToJobsBtn) {
            sendToJobsBtn.addEventListener('click', () => this.handleSendToJobs());
        }

        // Claim Type selection
        const claimTypeSelect = document.getElementById('claimTypeSelect');
        if (claimTypeSelect) {
            claimTypeSelect.addEventListener('change', () => this.onClaimTypeChange());
        }

        // Claim ID input for job preview
        const claimIdInput = document.getElementById('claimIdInput');
        if (claimIdInput) {
            claimIdInput.addEventListener('input', () => this.updateJobPreview());
        }

        // New calculation
        const newCalcBtn = document.getElementById('newCalculation');
        if (newCalcBtn) {
            newCalcBtn.addEventListener('click', () => this.startNewCalculation());
        }


        // Add firm form
        const addFirmForm = document.getElementById('addFirmForm');
        if (addFirmForm) {
            addFirmForm.addEventListener('submit', (e) => this.handleAddFirm(e));
        }

        // Auto-distance calculation triggers for Point B
        const pointBInput = document.getElementById('pointB');
        console.log('🧮 Point B input element found:', !!pointBInput);
        if (pointBInput) {
            // Trigger on blur (when user clicks away)
            pointBInput.addEventListener('blur', () => {
                console.log('🧮 Point B blur event - triggering auto-distance');
                setTimeout(() => this.triggerAutoDistance(), 500);
            });
            
            // Trigger on Enter key
            pointBInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.triggerAutoDistance();
                }
            });
            
            // Trigger after user stops typing (debounced)
            let typingTimer;
            pointBInput.addEventListener('input', () => {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    if (pointBInput.value.trim().length > 5) { // Only if decent length address
                        this.triggerAutoDistance();
                    }
                }, 2000); // Wait 2 seconds after user stops typing
            });
        }
        
        // Also add triggers for Point A in case user changes it
        const pointAInput = document.getElementById('pointA');
        if (pointAInput) {
            pointAInput.addEventListener('input', () => {
                if (this.settings.autoCalculateEnabled) {
                    this.debounceAutoCalculate();
                }
            });
        }

        // Distance input for manual entry
        const distanceInput = document.getElementById('distanceMiles');
        if (distanceInput) {
            distanceInput.addEventListener('input', () => {
                if (this.settings.autoCalculateEnabled) {
                    this.debounceAutoCalculate();
                }
            });
        }

        // Round trip checkbox
        const roundTripCheckbox = document.getElementById('roundTrip');
        if (roundTripCheckbox) {
            roundTripCheckbox.addEventListener('change', () => {
                if (this.settings.autoCalculateEnabled) {
                    this.debounceAutoCalculate();
                }
            });
        }

        console.log('🧮 Event listeners configured');
    }

    setupAutoCalculation() {
        console.log('🧮 Setting up auto-calculation features...');
        
        // Enable auto-calculation by default
        this.settings.autoCalculateEnabled = true;
        
        // Set up debounced auto-calculation timeout
        this.autoCalculateTimeout = null;
        
        console.log('🧮 Auto-calculation features configured');
    }

    loadFirmsToDropdown() {
        const select = document.getElementById('firmSelect');
        console.log('🧮 Loading firms to dropdown - select element found:', !!select);
        console.log('🧮 Number of firms available:', this.settings.firms?.length || 0);
        console.log('🧮 Firms data:', this.settings.firms);
        
        if (!select) {
            console.error('🧮 Firm select element not found!');
            // Let's wait a bit and try again in case DOM isn't ready
            // Add a retry counter to avoid infinite loops
            this.firmDropdownRetries = (this.firmDropdownRetries || 0) + 1;
            
            if (this.firmDropdownRetries <= 3) {
                setTimeout(() => {
                    console.log(`🧮 Retrying firm dropdown population (attempt ${this.firmDropdownRetries}/3)...`);
                    this.loadFirmsToDropdown();
                }, 1000 * this.firmDropdownRetries); // Increasing delay
            } else {
                console.error('🧮 Failed to find firm select element after 3 retries - DOM structure issue');
            }
            return;
        }

        select.innerHTML = '<option value="">Select your firm...</option>';
        
        if (!this.settings.firms || this.settings.firms.length === 0) {
            console.warn('🧮 No firms available to load!');
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No firms configured - Add firms in Firms tab";
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        
        this.settings.firms.forEach(firm => {
            const option = document.createElement('option');
            option.value = firm.id;
            option.textContent = `${firm.name} (${firm.freeMiles} free, $${firm.ratePerMile}/mi)`;
            select.appendChild(option);
            console.log('🧮 Added firm to dropdown:', firm.name);
        });

        // Also sync firms with JobBillingService for jobs integration
        this.syncFirmsWithBillingService();

        // Restore last selected firm
        if (this.settings.lastSelectedFirmId) {
            select.value = this.settings.lastSelectedFirmId;
            this.onFirmChange(this.settings.lastSelectedFirmId);
            console.log('🧮 Restored selected firm:', this.settings.lastSelectedFirmId);
        }
    }
    
    syncFirmsWithBillingService() {
        // Ensure JobBillingService has all our firm configurations
        if (window.masterInterface && window.masterInterface.jobBillingService) {
            console.log('🧮 Syncing firms with JobBillingService...');
            this.settings.firms.forEach(firm => {
                const billingConfig = {
                    name: firm.name,
                    fileRate: firm.claimTypes?.auto || 75, // Use auto as default file rate
                    mileageRate: firm.ratePerMile,
                    freeMileage: firm.freeMiles,
                    paymentSchedule: 'bi-weekly',
                    claimTypes: firm.claimTypes,
                    contactInfo: {}
                };
                
                // Check if firm already exists in billing service
                const existingFirm = window.masterInterface.jobBillingService.getFirmConfig(firm.name);
                if (!existingFirm) {
                    window.masterInterface.jobBillingService.addFirmConfig(billingConfig);
                    console.log('🧮 Synced firm with billing service:', firm.name);
                }
            });
        } else {
            console.log('🧮 JobBillingService not available for sync');
        }
    }

    loadUserHomeLocation() {
        const pointAInput = document.getElementById('pointA');
        if (pointAInput) {
            if (this.settings.homeLocation) {
                pointAInput.value = this.settings.homeLocation;
                pointAInput.placeholder = 'Your home base location';
            } else {
                // Set a default home location if none exists
                pointAInput.placeholder = 'Enter your home/office address (this will be saved)';
                
                // Save home location when user enters it
                pointAInput.addEventListener('blur', () => {
                    const homeAddress = pointAInput.value.trim();
                    if (homeAddress && homeAddress !== this.settings.homeLocation) {
                        this.settings.homeLocation = homeAddress;
                        this.saveSettings();
                        console.log('🧮 Home location saved:', homeAddress);
                    }
                });
            }
        }
    }

    onFirmChange(firmId) {
        if (!firmId) return;

        const firm = this.settings.firms.find(f => f.id === firmId);
        if (!firm) return;

        // Set round trip default based on firm preference
        const roundTripCheckbox = document.getElementById('roundTrip');
        if (roundTripCheckbox) {
            roundTripCheckbox.checked = firm.roundTripDefault;
        }

        // Save selection
        this.settings.lastSelectedFirmId = firmId;
        this.saveSettings();

        // Auto-calculate if we have all required data  
        if (this.settings.autoCalculateEnabled) {
            console.log('🧮 Firm changed - checking if auto-calculation should trigger...');
            const hasAddresses = document.getElementById('pointA')?.value?.trim() && document.getElementById('pointB')?.value?.trim();
            const hasDistance = parseFloat(document.getElementById('distanceMiles')?.value) > 0;
            
            if (hasAddresses || hasDistance) {
                console.log('🧮 Auto-calculation triggered due to firm change (have addresses/distance)');
                this.debounceAutoCalculate();
            } else {
                console.log('🧮 Auto-calculation skipped - no addresses or distance yet');
            }
        }

        console.log(`🧮 Firm changed to: ${firm.name}`);
    }

    async triggerAutoDistance() {
        // Check if Google Maps API is available
        const apiKey = window.MILEAGE_CYPHER_CONFIG?.GOOGLE_MAPS_API_KEY;
        
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            console.warn('🧮 No API key configured');
            return;
        }
        
        if (typeof google === 'undefined') {
            console.warn('🧮 Google Maps API not loaded yet');
            return;
        }
        
        console.log('🧮 Triggering auto-distance calculation...');

        const pointA = document.getElementById('pointA').value.trim();
        const pointB = document.getElementById('pointB').value.trim();

        if (!pointA || !pointB) {
            console.log('🧮 Missing addresses - Point A:', pointA, 'Point B:', pointB);
            return;
        }

        console.log('🧮 Calculating distance from:', pointA, 'to:', pointB);
        this.updateDistanceStatus('Calculating distance...', '🔄');

        try {
            await this.calculateDistanceWithGoogleMaps(pointA, pointB);
            this.updateDistanceStatus('Distance calculated', '✅');
        } catch (error) {
            console.error('🧮 Auto-distance calculation failed:', error);
            console.error('🧮 Error details:', error.message);
            console.error('🧮 Error stack:', error.stack);
            this.updateDistanceStatus('Enter distance manually', '📝');
            this.showNotification(`Distance calculation failed: ${error.message}`, 'warning');
        }
    }

    async calculateDistanceWithGoogleMaps(origin, destination) {
        if (typeof google === 'undefined') {
            throw new Error('Google Maps API not loaded');
        }

        const distanceInput = document.getElementById('distanceMiles');
        
        if (!distanceInput) {
            throw new Error('Distance input field not found');
        }
        
        const originalPlaceholder = distanceInput.placeholder;
        
        distanceInput.placeholder = '🧮 Calculating distance...';
        distanceInput.disabled = true;

        try {
            const service = new google.maps.DistanceMatrixService();
            const result = await new Promise((resolve, reject) => {
                service.getDistanceMatrix({
                    origins: [origin],
                    destinations: [destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.IMPERIAL,
                    avoidHighways: false,
                    avoidTolls: false
                }, (response, status) => {
                    if (status === 'OK') {
                        const element = response.rows[0].elements[0];
                        if (element.status === 'OK') {
                            const miles = element.distance.value * 0.000621371; // Convert meters to miles
                            resolve(Math.round(miles * 10) / 10); // Round to 1 decimal
                        } else {
                            reject(new Error('Route not found between these locations'));
                        }
                    } else {
                        reject(new Error(`Google Maps API error: ${status}`));
                    }
                });
            });

            distanceInput.value = result;
            console.log('🧮 Distance set to:', result, 'miles');
            
            // Automatically perform the billing calculation
            setTimeout(() => {
                console.log('🧮 Starting automatic billing calculation...');
                this.performCalculation(false); // false = not silent, show results
                this.showCalculateLoading(false); // Hide loading state
            }, 1000); // Small delay to let user see the distance notification

        } finally {
            distanceInput.placeholder = originalPlaceholder;
            distanceInput.disabled = false;
        }
    }

    debounceAutoCalculate() {
        clearTimeout(this.autoCalculateTimeout);
        this.autoCalculateTimeout = setTimeout(() => {
            console.log('🧮 Auto-calculation triggered via debounce...');
            this.performCalculation(false); // false = show validation errors for debugging
        }, 1000);
    }

    performCalculation(silentMode = false) {
        console.log('🧮 performCalculation called, silentMode:', silentMode);
        
        const calculationData = this.gatherCalculationInputs();
        console.log('🧮 Calculation data gathered:', calculationData);
        
        if (!this.validateCalculationInputs(calculationData, silentMode)) {
            console.log('🧮 Validation failed, aborting calculation');
            return null;
        }
        
        console.log('🧮 Validation passed, proceeding with calculation');

        try {
            const result = this.calculateMileageBilling(calculationData);
            this.displayCalculationResults(result);
            this.currentCalculation = result;
            
            // Add to history (keep last 10)
            this.calculationHistory.unshift(result);
            if (this.calculationHistory.length > 10) {
                this.calculationHistory = this.calculationHistory.slice(0, 10);
            }

            // Only show success notification for manual calculations (when user clicks button)
            // Auto-calculations don't need success notifications

            console.log('🧮 Calculation completed:', result);
            this.showCalculateLoading(false); // Hide loading state
            return result;

        } catch (error) {
            console.error('🧮 Calculation error:', error);
            this.showCalculateLoading(false); // Hide loading state
            return null;
        }
    }

    gatherCalculationInputs() {
        const firmSelect = document.getElementById('firmSelect');
        const pointAInput = document.getElementById('pointA');
        const pointBInput = document.getElementById('pointB');
        const distanceInput = document.getElementById('distanceMiles');
        const roundTripInput = document.getElementById('roundTrip');
        const noteInput = document.getElementById('noteField');
        
        console.log('🧮 Gathering inputs - elements found:', {
            firmSelect: !!firmSelect,
            pointA: !!pointAInput,
            pointB: !!pointBInput,
            distance: !!distanceInput,
            roundTrip: !!roundTripInput,
            note: !!noteInput
        });
        
        const firmId = firmSelect?.value || '';
        const firm = this.settings.firms.find(f => f.id === firmId);
        
        const data = {
            firm,
            pointA: pointAInput?.value?.trim() || '',
            pointB: pointBInput?.value?.trim() || '',
            distance: parseFloat(distanceInput?.value) || 0,
            roundTrip: roundTripInput?.checked || false,
            note: noteInput?.value?.trim() || ''
        };
        
        console.log('🧮 Gathered calculation data:', data);
        return data;
    }

    validateCalculationInputs(data, silentMode = false) {
        console.log('🧮 Validating inputs:', {
            hasFirm: !!data.firm,
            firmName: data.firm?.name,
            pointA: data.pointA || 'EMPTY',
            pointB: data.pointB || 'EMPTY', 
            distance: data.distance,
            silentMode
        });
        
        if (!data.firm) {
            if (!silentMode) {
                console.warn('🧮 Validation failed: No firm selected');
                this.showNotification('Please select a firm', 'warning');
            }
            return false;
        }

        if (!data.pointA || !data.pointB) {
            if (!silentMode) {
                console.warn('🧮 Validation failed: Missing addresses - Point A:', data.pointA || 'EMPTY', 'Point B:', data.pointB || 'EMPTY');
                this.showNotification('Please enter both addresses', 'warning');
            }
            return false;
        }

        if (data.distance <= 0) {
            if (!silentMode) {
                console.warn('🧮 Validation failed: No distance - attempting auto-calculation...');
                // If auto-calculation is enabled, try to trigger it first
                if (this.settings.autoCalculateEnabled && data.pointA && data.pointB) {
                    console.log('🧮 Attempting auto-distance calculation for validation...');
                    this.triggerAutoDistance();
                    return false; // Return false for now, auto-calculation will retry
                } else {
                    console.warn('🧮 Validation failed: No distance specified and auto-calc disabled');
                    this.showNotification('Please enter distance manually', 'warning');
                }
            }
            return false;
        }

        console.log('🧮 Validation passed! ✅');
        return true;
    }

    calculateMileageBilling(data) {
        const { firm, pointA, pointB, distance, roundTrip, note } = data;

        // Core billing calculation
        const baseMiles = distance * (roundTrip ? 2 : 1);
        const billableMiles = Math.max(0, baseMiles - firm.freeMiles);
        const totalFee = billableMiles * firm.ratePerMile;

        // Get claim type and file rate
        const claimType = document.getElementById('claimTypeSelect')?.value;
        const fileRate = claimType && firm.claimTypes ? firm.claimTypes[claimType] : 0;
        
        console.log('🧮 Calculating file rate:', {
            claimType: claimType || 'NOT_SELECTED',
            firmHasClaimTypes: !!firm.claimTypes,
            availableClaimTypes: firm.claimTypes ? Object.keys(firm.claimTypes) : 'NONE',
            firmClaimTypesValues: firm.claimTypes,
            lookupResult: firm.claimTypes ? firm.claimTypes[claimType] : 'NO_CLAIM_TYPES',
            calculatedFileRate: fileRate
        });

        return {
            firm,
            route: { from: pointA, to: pointB },
            distance: this.roundTo(distance, 1),
            roundTrip,
            baseMiles: this.roundTo(baseMiles, 1),
            freeMiles: firm.freeMiles,
            billableMiles: this.roundTo(billableMiles, 1),
            ratePerMile: firm.ratePerMile,
            totalFee: this.roundTo(totalFee, 2),
            claimType,
            fileRate,
            totalJobValue: this.roundTo(totalFee + fileRate, 2),
            note,
            timestamp: new Date(),
            calculationId: this.generateCalculationId()
        };
    }

    displayCalculationResults(result) {
        const { firm, route, distance, roundTrip, baseMiles, freeMiles, billableMiles, ratePerMile, totalFee, claimType, fileRate, totalJobValue, note } = result;

        const breakdownHtml = `
            <div class="breakdown-item">
                <span class="label">🗺️ Route:</span>
                <span class="value">${route.from} → ${route.to}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">📏 One-way Distance:</span>
                <span class="value">${distance} miles</span>
            </div>
            <div class="breakdown-item">
                <span class="label">🔄 Round Trip:</span>
                <span class="value">${roundTrip ? 'Yes' : 'No'}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">📐 Total Distance:</span>
                <span class="value">${baseMiles} miles</span>
            </div>
            <div class="breakdown-item">
                <span class="label">🎁 Free Miles (${firm.name}):</span>
                <span class="value">${freeMiles} miles</span>
            </div>
            <div class="breakdown-item highlight">
                <span class="label">💰 Billable Miles:</span>
                <span class="value">${billableMiles} miles</span>
            </div>
            <div class="breakdown-item">
                <span class="label">💵 Rate per Mile:</span>
                <span class="value">$${ratePerMile}/mile</span>
            </div>
            <div class="breakdown-item total">
                <span class="label">🧾 Mileage Fee:</span>
                <span class="value">$${totalFee}</span>
            </div>
            ${claimType && fileRate > 0 ? `
                <div class="breakdown-item">
                    <span class="label">📋 ${this.formatClaimType(claimType)} File Rate:</span>
                    <span class="value">$${fileRate}</span>
                </div>
                <div class="breakdown-item total-job">
                    <span class="label">💼 Total Job Value:</span>
                    <span class="value">$${totalJobValue}</span>
                </div>
            ` : ''}
            ${note ? `
            <div class="breakdown-item">
                <span class="label">📝 Note:</span>
                <span class="value">${note}</span>
            </div>
            ` : ''}
        `;

        const breakdownContainer = document.getElementById('breakdownDisplay');
        if (breakdownContainer) {
            breakdownContainer.innerHTML = breakdownHtml;
        }

        // Update copy-ready text
        this.updateCopyReadyText(result);

        // Add workflow integration buttons
        this.addWorkflowIntegrationButtons(result);

        // Show results section with animation
        const resultsSection = document.getElementById('resultsSection');
        const mileageContainer = document.querySelector('.mileage-container');
        
        console.log('🧮 Displaying results - resultsSection found:', !!resultsSection);
        console.log('🧮 Displaying results - mileageContainer found:', !!mileageContainer);
        
        if (resultsSection) {
            // Always show the results section
            resultsSection.style.display = 'block';
            
            // Add a brief highlight to draw attention to new results
            resultsSection.style.backgroundColor = '#f8f9fa';
            resultsSection.style.border = '2px solid #007bff';
            
            // Trigger animation after a small delay
            setTimeout(() => {
                resultsSection.classList.add('show');
                
                // Remove highlight after animation
                setTimeout(() => {
                    resultsSection.style.backgroundColor = '';
                    resultsSection.style.border = '';
                }, 1500);
            }, 100);
            
            // Smooth scroll to view results
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
            
            console.log('🧮 Results section should now be visible');
        } else {
            console.error('🧮 Results section not found in DOM!');
        }
        
        // Ensure copy button is visible and functional
        const copyBtn = document.getElementById('copyBtn');
        console.log('🧮 Copy button found:', !!copyBtn);
        
        if (copyBtn) {
            copyBtn.style.display = 'block';
            console.log('🧮 Copy button should now be visible');
        }
    }

    updateCopyReadyText(result) {
        const copyTextArea = document.getElementById('copyText');
        if (!copyTextArea) return;

        let copyText = '';
        
        switch (this.settings.copyFormat) {
            case 'brief':
                copyText = this.generateBriefCopyText(result);
                break;
            case 'detailed':
                copyText = this.generateDetailedCopyText(result);
                break;
            default:
                copyText = this.generateDetailedCopyText(result);
        }

        copyTextArea.value = copyText;
    }

    generateBriefCopyText(result) {
        const { baseMiles, billableMiles, totalFee, firm } = result;
        return `${baseMiles} RT miles - ${firm.freeMiles} free miles = ${billableMiles} billable miles × $${firm.ratePerMile} = $${totalFee}`;
    }

    generateDetailedCopyText(result) {
        const { baseMiles, freeMiles, billableMiles, ratePerMile, totalFee, claimType, fileRate, totalJobValue } = result;
        
        // Create a clear TPA-ready format
        let copyText = `Mileage: ${baseMiles} RT miles - ${freeMiles} free miles = ${billableMiles} billable miles × $${ratePerMile} = $${totalFee}`;
        
        // Add file rate if applicable
        if (fileRate > 0) {
            copyText += `\nFile Rate (${claimType?.toUpperCase()}): $${fileRate}`;
            copyText += `\nTotal Bill: $${totalJobValue}`;
        }
        
        return copyText;
    }

    addWorkflowIntegrationButtons(result) {
        // Find or create workflow buttons container
        let workflowContainer = document.getElementById('workflowIntegration');
        
        if (!workflowContainer) {
            // Create workflow buttons container in the results section
            const resultsSection = document.getElementById('resultsSection');
            const copyContainer = resultsSection?.querySelector('.copy-container');
            
            if (copyContainer) {
                workflowContainer = document.createElement('div');
                workflowContainer.id = 'workflowIntegration';
                workflowContainer.className = 'workflow-integration-container';
                
                // Insert before copy container
                copyContainer.parentNode.insertBefore(workflowContainer, copyContainer);
            } else {
                console.warn('🧮 Copy container not found, cannot add workflow buttons');
                return;
            }
        }

        // Clear existing buttons
        workflowContainer.innerHTML = '';

        // Create workflow buttons
        const workflowHtml = `
            <div class="workflow-header">
                <h4>📋 Next Steps</h4>
                <div class="workflow-progress-bar">
                    <div class="progress-step completed">Route</div>
                    <div class="progress-step completed">Mileage</div>
                    <div class="progress-step pending">Job</div>
                </div>
            </div>
            <div class="workflow-actions">
                <button class="cipher-btn cipher-btn--primary workflow-btn" onclick="window.mileageCalculator.sendToJobs()">
                    <span class="btn-icon">💼</span>
                    <span class="btn-text">Create Job from Calculation</span>
                    <span class="btn-value">$${result.totalJobValue || result.totalFee}</span>
                </button>
                <button class="cipher-btn cipher-btn--secondary workflow-btn" onclick="window.mileageCalculator.calculateAnother()">
                    <span class="btn-icon">🧮</span>
                    <span class="btn-text">Calculate Another Route</span>
                </button>
            </div>
        `;

        workflowContainer.innerHTML = workflowHtml;

        // Add CSS for workflow integration
        this.addWorkflowStyles();

        // Store calculation for job creation
        localStorage.setItem('cc_mileage_calculation', JSON.stringify({
            ...result,
            timestamp: Date.now(),
            workflowStep: 'job-creation'
        }));

        console.log('🧮 Workflow integration buttons added');
    }

    addWorkflowStyles() {
        // Check if styles already exist
        if (document.getElementById('workflow-integration-styles')) return;

        const style = document.createElement('style');
        style.id = 'workflow-integration-styles';
        style.textContent = `
            .workflow-integration-container {
                background: var(--cipher-card-bg);
                border: 1px solid var(--cipher-border);
                border-radius: var(--cipher-radius-lg);
                padding: 20px;
                margin: 20px 0;
            }
            
            .workflow-header {
                margin-bottom: 16px;
            }
            
            .workflow-header h4 {
                margin: 0 0 12px 0;
                color: var(--cipher-text-primary);
                font-size: 16px;
                font-weight: 600;
            }
            
            .workflow-progress-bar {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }
            
            .progress-step {
                flex: 1;
                padding: 8px 12px;
                text-align: center;
                border-radius: var(--cipher-radius-md);
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .progress-step.completed {
                background: var(--cipher-success);
                color: white;
            }
            
            .progress-step.pending {
                background: var(--cipher-bg-secondary);
                color: var(--cipher-text-secondary);
                border: 1px dashed var(--cipher-border);
            }
            
            .workflow-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .workflow-btn {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                text-align: left;
                width: 100%;
            }
            
            .workflow-btn .btn-icon {
                font-size: 18px;
                margin-right: 12px;
            }
            
            .workflow-btn .btn-text {
                flex: 1;
                font-weight: 500;
            }
            
            .workflow-btn .btn-value {
                font-size: 16px;
                font-weight: 600;
                color: var(--cipher-success);
            }
            
            .workflow-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            @media (max-width: 768px) {
                .workflow-progress-bar {
                    flex-direction: column;
                }
                
                .workflow-btn {
                    flex-direction: column;
                    text-align: center;
                    gap: 8px;
                }
                
                .workflow-btn .btn-icon {
                    margin-right: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    sendToJobs() {
        console.log('💼 Starting job creation from mileage calculation...');
        
        // Get current calculation
        const calculation = JSON.parse(localStorage.getItem('cc_mileage_calculation') || '{}');
        
        if (!calculation || !calculation.firm) {
            this.showNotification('No calculation data available', 'warning');
            return;
        }

        // Prepare job data
        const jobData = {
            source: 'mileage-calculator',
            timestamp: Date.now(),
            firm: calculation.firm.name,
            claimType: calculation.claimType || 'auto',
            location: calculation.route.to,
            fromLocation: calculation.route.from,
            mileage: {
                distance: calculation.distance,
                roundTrip: calculation.roundTrip,
                billableMiles: calculation.billableMiles,
                mileageFee: calculation.totalFee
            },
            fileRate: calculation.fileRate || 0,
            totalValue: calculation.totalJobValue || calculation.totalFee,
            status: 'pending',
            note: calculation.note || `Mileage calculation: ${calculation.baseMiles} miles`
        };

        // Store job data for jobs tab to pick up
        localStorage.setItem('cc_pending_job', JSON.stringify(jobData));
        
        // Update workflow tracking
        this.updateWorkflowProgress('job-creation');

        // Show confirmation and navigate
        this.showJobCreationModal(jobData);
    }

    calculateAnother() {
        // Clear current results but keep the calculation data for reference
        this.hideResults();
        
        // Focus on the destination input for next calculation
        const pointBInput = document.getElementById('pointB');
        if (pointBInput) {
            pointBInput.focus();
            pointBInput.select();
        }
        
        this.showNotification('Ready for next calculation!', 'success');
    }

    updateWorkflowProgress(currentStep) {
        const workflowData = JSON.parse(localStorage.getItem('cc_workflow_data') || '{}');
        
        workflowData.workflow = {
            ...workflowData.workflow,
            currentStep,
            completionPercentage: currentStep === 'job-creation' ? 66 : workflowData.workflow?.completionPercentage || 33
        };

        if (currentStep === 'job-creation') {
            workflowData.mileageCalculator = {
                completed: true,
                timestamp: Date.now(),
                data: this.currentCalculation
            };
            workflowData.jobs = {
                pending: true,
                readyForCreation: true
            };
        }

        localStorage.setItem('cc_workflow_data', JSON.stringify(workflowData));
        console.log('📊 Workflow progress updated:', workflowData);
    }

    showJobCreationModal(jobData) {
        const modal = document.createElement('div');
        modal.className = 'job-creation-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💼 Create Job from Mileage Calculation</h3>
                    <button class="modal-close">×</button>
                </div>
                
                <div class="job-preview">
                    <h4>Job Preview</h4>
                    <div class="job-details-grid">
                        <div class="detail-item">
                            <span class="label">Firm:</span>
                            <span class="value">${jobData.firm}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Claim Type:</span>
                            <span class="value">${jobData.claimType.toUpperCase()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Location:</span>
                            <span class="value">${jobData.location}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Mileage:</span>
                            <span class="value">${jobData.mileage.billableMiles} billable miles</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Mileage Fee:</span>
                            <span class="value">$${jobData.mileage.mileageFee}</span>
                        </div>
                        ${jobData.fileRate > 0 ? `
                        <div class="detail-item">
                            <span class="label">File Rate:</span>
                            <span class="value">$${jobData.fileRate}</span>
                        </div>
                        ` : ''}
                        <div class="detail-item total">
                            <span class="label">Total Value:</span>
                            <span class="value">$${jobData.totalValue}</span>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="cipher-btn cipher-btn--primary" onclick="window.mileageCalculator.continueToJobs()">
                        <span class="btn-icon">💼</span>
                        Create Job in Jobs Tab
                    </button>
                    <button class="cipher-btn cipher-btn--secondary" onclick="this.closest('.job-creation-modal').remove()">
                        <span class="btn-icon">🧮</span>
                        Stay in Mileage Calculator
                    </button>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .job-creation-modal {
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
            
            .job-creation-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .job-creation-modal .modal-content {
                position: relative;
                background: var(--cipher-card-bg);
                border: 1px solid var(--cipher-border);
                border-radius: var(--cipher-radius-lg);
                box-shadow: var(--cipher-shadow-lg);
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .job-creation-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--cipher-border);
            }
            
            .job-creation-modal .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--cipher-text-secondary);
                padding: 4px 8px;
                border-radius: var(--cipher-radius-md);
            }
            
            .job-creation-modal .modal-close:hover {
                background: var(--cipher-danger);
                color: white;
            }
            
            .job-preview {
                padding: 20px;
            }
            
            .job-preview h4 {
                margin: 0 0 16px 0;
                color: var(--cipher-text-primary);
            }
            
            .job-details-grid {
                display: grid;
                gap: 8px;
            }
            
            .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: var(--cipher-bg-secondary);
                border-radius: var(--cipher-radius-md);
            }
            
            .detail-item.total {
                background: var(--cipher-accent);
                color: var(--cipher-accent-text);
                font-weight: 600;
            }
            
            .detail-item .label {
                color: var(--cipher-text-secondary);
                font-size: 14px;
            }
            
            .detail-item .value {
                font-weight: 600;
            }
            
            .detail-item.total .label,
            .detail-item.total .value {
                color: var(--cipher-accent-text);
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

    continueToJobs() {
        // Close modal
        const modal = document.querySelector('.job-creation-modal');
        if (modal) modal.remove();

        // Navigate to jobs tab
        if (window.masterInterface) {
            // If in master interface, switch tabs
            window.masterInterface.activateTab('jobs');
        } else {
            // If standalone, navigate to jobs page
            window.location.href = 'jobs.html?from=mileage-calculator';
        }
        
        this.showNotification('Job data sent to Jobs tab!', 'success');
    }

    async copyCalculationToClipboard() {
        const copyText = document.getElementById('copyText').value;
        
        try {
            await navigator.clipboard.writeText(copyText);
            console.log('🧮 Calculation copied to clipboard');
            this.showCopySuccess();
        } catch (error) {
            console.error('🧮 Copy failed:', error);
            
            // Fallback for older browsers
            const textArea = document.getElementById('copyText');
            textArea.select();
            textArea.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                console.log('🧮 Calculation copied to clipboard (fallback)');
                this.showCopySuccess();
            } catch (fallbackError) {
                console.error('🧮 Copy failed completely:', fallbackError);
            }
        }
    }

    startNewCalculation() {
        // Clear inputs except firm and home location
        const pointBInput = document.getElementById('pointB');
        const distanceInput = document.getElementById('distanceMiles');
        const noteInput = document.getElementById('noteField');
        
        if (pointBInput) pointBInput.value = '';
        if (distanceInput) distanceInput.value = '';
        if (noteInput) noteInput.value = '';

        // Reset layout and hide results
        const resultsSection = document.getElementById('resultsSection');
        const mileageContainer = document.querySelector('.mileage-container');
        
        if (resultsSection) {
            resultsSection.classList.remove('show');
            setTimeout(() => {
                resultsSection.style.display = 'none';
            }, 300);
        }
        
        if (mileageContainer) {
            mileageContainer.classList.remove('has-results');
        }

        this.currentCalculation = null;

        // Focus on destination input
        if (pointBInput) {
            pointBInput.focus();
        }

        console.log('🧮 New calculation started');
    }

    // Firm Management Functions
    openFirmsManagementModal() {
        this.loadFirmsListInModal();
        const modal = document.getElementById('firmsModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    loadFirmsListInModal() {
        const firmsList = document.getElementById('firmsList');
        if (!firmsList) return;

        firmsList.innerHTML = '';

        this.settings.firms.forEach(firm => {
            const firmElement = document.createElement('div');
            firmElement.className = 'firm-item';
            firmElement.innerHTML = `
                <div class="firm-info">
                    <strong>${firm.name}</strong>
                    <div class="firm-details">
                        Free Miles: ${firm.freeMiles} | Rate: $${firm.ratePerMile}/mile | 
                        Round Trip Default: ${firm.roundTripDefault ? 'Yes' : 'No'}
                    </div>
                </div>
                <div class="firm-actions">
                    <button class="edit-btn" data-firm-id="${firm.id}">✏️ Edit</button>
                    <button class="delete-btn" data-firm-id="${firm.id}">🗑️ Delete</button>
                </div>
            `;
            
            // Add event listeners to the buttons
            const editBtn = firmElement.querySelector('.edit-btn');
            const deleteBtn = firmElement.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => this.editFirm(firm.id));
            deleteBtn.addEventListener('click', () => this.deleteFirm(firm.id));
            
            firmsList.appendChild(firmElement);
        });
    }

    handleAddFirm(event) {
        event.preventDefault();
        
        // Check if we're in edit mode
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const editingId = submitBtn?.dataset.editingId;
        
        // Get form field values directly
        const firmData = {
            name: document.getElementById('firmName')?.value?.trim() || '',
            freeMiles: parseInt(document.getElementById('firmFreeMiles')?.value) || 0,
            ratePerMile: parseFloat(document.getElementById('firmRate')?.value) || 0,
            roundTripDefault: document.getElementById('firmRoundTripDefault')?.checked || false
        };
        
        console.log('🧮 Form data collected:', firmData);

        if (!this.validateFirmData(firmData)) return;

        if (editingId) {
            // Edit existing firm
            const firmIndex = this.settings.firms.findIndex(f => f.id === editingId);
            if (firmIndex !== -1) {
                this.settings.firms[firmIndex] = { id: editingId, ...firmData };
                this.saveSettings();
                this.loadFirmsListInModal();
                this.loadFirmsToDropdown();
                this.resetAddFirmForm();
                console.log('🧮 Firm updated:', firmData.name);
            }
        } else {
            // Add new firm
            const firmId = this.generateFirmId(firmData.name);
            
            // Check for duplicates
            if (this.settings.firms.find(f => f.id === firmId)) {
                console.warn('🧮 Duplicate firm name:', firmData.name);
                return;
            }

            const newFirm = { id: firmId, ...firmData };
            this.settings.firms.push(newFirm);
            this.saveSettings();

            // Update UI
            this.loadFirmsListInModal();
            this.loadFirmsToDropdown();
            event.target.reset();

            console.log('🧮 Firm added:', firmData.name);
        }
    }

    editFirm(firmId) {
        console.log('🧮 Edit firm requested for ID:', firmId);
        
        const firm = this.settings.firms.find(f => f.id === firmId);
        if (!firm) {
            console.error('🧮 Firm not found:', firmId);
            return;
        }
        
        // Populate form with existing firm data
        const firmNameInput = document.getElementById('firmName');
        const firmFreeMilesInput = document.getElementById('firmFreeMiles');
        const firmRateInput = document.getElementById('firmRate');
        const firmRoundTripInput = document.getElementById('firmRoundTripDefault');
        
        if (firmNameInput) firmNameInput.value = firm.name;
        if (firmFreeMilesInput) firmFreeMilesInput.value = firm.freeMiles;
        if (firmRateInput) firmRateInput.value = firm.ratePerMile;
        if (firmRoundTripInput) firmRoundTripInput.checked = firm.roundTripDefault;
        
        // Change form to edit mode
        const form = document.getElementById('addFirmForm');
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '✏️ Update Firm';
            submitBtn.dataset.editingId = firmId;
        }
        
        // Add cancel button if not exists
        let cancelBtn = form?.querySelector('.cancel-edit-btn');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'cancel-edit-btn cipher-btn cipher-btn--secondary';
            cancelBtn.textContent = '❌ Cancel Edit';
            cancelBtn.addEventListener('click', () => this.resetAddFirmForm());
            submitBtn?.parentNode?.insertBefore(cancelBtn, submitBtn.nextSibling);
        }
        cancelBtn.style.display = 'inline-block';
        
        // Scroll to form
        const addFirmSection = document.querySelector('.add-firm-section');
        if (addFirmSection) {
            addFirmSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('🧮 Edit mode activated for firm:', firmId, firm.name);
    }

    resetAddFirmForm() {
        const form = document.getElementById('addFirmForm');
        if (form) {
            form.reset();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '➕ Add Firm';
                delete submitBtn.dataset.editingId;
            }
            
            // Hide cancel button
            const cancelBtn = form.querySelector('.cancel-edit-btn');
            if (cancelBtn) {
                cancelBtn.style.display = 'none';
            }
        }
        console.log('🧮 Form reset to add mode');
    }

    validateFirmData(data) {
        if (!data.name || data.name.length < 2) {
            console.warn('🧮 Validation failed: Firm name too short');
            return false;
        }
        if (data.freeMiles < 0 || isNaN(data.freeMiles)) {
            console.warn('🧮 Validation failed: Invalid free miles');
            return false;
        }
        if (data.ratePerMile <= 0 || isNaN(data.ratePerMile)) {
            console.warn('🧮 Validation failed: Invalid rate per mile');
            return false;
        }
        if (data.ratePerMile > 10) {
            console.warn('🧮 Warning: Rate per mile is unusually high:', data.ratePerMile);
        }
        return true;
    }

    deleteFirm(firmId) {
        console.log('🧮 Delete firm requested for ID:', firmId);
        
        if (this.settings.firms.length <= 1) {
            console.warn('🧮 Cannot delete last firm');
            return;
        }

        const firm = this.settings.firms.find(f => f.id === firmId);
        if (!firm) {
            console.error('🧮 Firm not found for deletion:', firmId);
            return;
        }

        // Show confirmation dialog
        const confirmDelete = confirm(`Are you sure you want to delete "${firm.name}"?\n\nThis action cannot be undone.`);
        
        if (confirmDelete) {
            // Remove firm from array
            this.settings.firms = this.settings.firms.filter(f => f.id !== firmId);
            
            // Update selected firm if the deleted firm was selected
            if (this.settings.lastSelectedFirmId === firmId) {
                this.settings.lastSelectedFirmId = this.settings.firms[0]?.id || '';
            }
            
            // Save to localStorage
            this.saveSettings();
            
            // Update UI
            this.loadFirmsListInModal();
            this.loadFirmsToDropdown();
            
            // Reset form if we were editing the deleted firm
            const form = document.getElementById('addFirmForm');
            const submitBtn = form?.querySelector('button[type="submit"]');
            if (submitBtn?.dataset.editingId === firmId) {
                this.resetAddFirmForm();
            }
            
            console.log('🧮 Firm deleted:', firm.name);
            console.log('🧮 Firm deleted:', firmId);
        }
    }

    // Route Import Support
    checkForRouteImport() {
        const routeData = localStorage.getItem('cc_route_export');
        if (routeData) {
            try {
                const data = JSON.parse(routeData);
                if (Date.now() - data.timestamp < 3600000) { // 1 hour validity
                    this.offerRouteImport(data);
                } else {
                    localStorage.removeItem('cc_route_export');
                }
            } catch (error) {
                console.error('🧮 Route import error:', error);
                localStorage.removeItem('cc_route_export');
            }
        }
    }

    offerRouteImport(routeData) {
        const modal = document.getElementById('routeImportModal');
        if (modal) {
            const dataContainer = document.getElementById('routeImportData');
            if (dataContainer) {
                dataContainer.innerHTML = `
                    <p><strong>Distance:</strong> ${routeData.distance} miles</p>
                    <p><strong>Route:</strong> ${routeData.route.overall.miles} total miles across ${routeData.route.days.length} day(s)</p>
                `;
            }
            modal.style.display = 'flex';
            this.pendingRouteImport = routeData;
        }
    }

    importFromRoute() {
        if (!this.pendingRouteImport) return;

        const distanceInput = document.getElementById('distanceMiles');
        if (distanceInput) {
            distanceInput.value = this.pendingRouteImport.distance;
        }

        // Import route points if available
        if (this.pendingRouteImport.route.days[0]?.stops) {
            const stops = this.pendingRouteImport.route.days[0].stops;
            const pointBInput = document.getElementById('pointB');
            if (pointBInput && stops.length > 1) {
                pointBInput.value = this.shortenAddress(stops[stops.length - 1]);
            }
        }

        this.closeRouteImportModal();
        
        if (this.settings.autoCalculateEnabled) {
            this.debounceAutoCalculate();
        }

        localStorage.removeItem('cc_route_export');
        this.pendingRouteImport = null;
        
        console.log('🧮 Route data imported successfully');
    }

    closeRouteImportModal() {
        const modal = document.getElementById('routeImportModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.pendingRouteImport = null;
    }

    // Utility Functions
    roundTo(value, decimals) {
        const multiplier = Math.pow(10, decimals);
        return Math.round(value * multiplier) / multiplier;
    }

    generateFirmId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    generateCalculationId() {
        return 'calc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    shortenAddress(address) {
        return address.length <= 40 ? address : address.substring(0, 37) + '...';
    }

    saveSettings() {
        try {
            localStorage.setItem('mileage_cypher_settings_v2', JSON.stringify(this.settings));
            console.log('🧮 Settings saved to localStorage:', this.settings.firms.length, 'firms');
        } catch (error) {
            console.error('🧮 Failed to save settings:', error);
        }
    }

    // UI State Management Functions
    showCalculateLoading(show) {
        const calculateBtn = document.getElementById('calculateBtn');
        if (!calculateBtn) return;
        
        const btnText = calculateBtn.querySelector('.btn-text');
        const btnLoading = calculateBtn.querySelector('.btn-loading');
        
        if (show) {
            calculateBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';
        } else {
            calculateBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    showCopySuccess() {
        const copyBtn = document.getElementById('copyBtn');
        if (!copyBtn) return;
        
        const btnText = copyBtn.querySelector('.btn-text');
        const btnSuccess = copyBtn.querySelector('.btn-success');
        
        if (btnText && btnSuccess) {
            btnText.style.display = 'none';
            btnSuccess.style.display = 'flex';
            
            // Also highlight the copied text area briefly
            const copyTextArea = document.getElementById('copyText');
            if (copyTextArea) {
                copyTextArea.style.backgroundColor = '#d4edda';
                copyTextArea.style.border = '2px solid #28a745';
                
                setTimeout(() => {
                    copyTextArea.style.backgroundColor = '';
                    copyTextArea.style.border = '';
                }, 2000);
            }
            
            setTimeout(() => {
                btnText.style.display = 'inline';
                btnSuccess.style.display = 'none';
            }, 2000);
        }
        
        // Show notification to user
        this.showNotification('📋 Billing calculation copied to clipboard - ready to paste in TPA dashboard!', 'success');
    }

    updateDistanceStatus(status, icon = '🎯') {
        const distanceStatus = document.getElementById('distanceStatus');
        if (distanceStatus) {
            const statusIcon = distanceStatus.querySelector('.status-icon');
            if (statusIcon) statusIcon.textContent = icon;
            distanceStatus.innerHTML = `<span class="status-icon">${icon}</span>${status}`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="toast-close">×</button>
        `;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        } else {
            // Fallback to console if no toast container
            console.log(`🧮 ${type.toUpperCase()}: ${message}`);
        }
    }
}

// Global Functions for HTML onclick handlers
function closeFirmsModal() {
    const modal = document.getElementById('firmsModal');
    if (modal) modal.style.display = 'none';
}

function closeRouteImportModal() {
    if (window.mileageCalculator) {
        window.mileageCalculator.closeRouteImportModal();
    }
}

function handleLogout() {
    // Placeholder for logout functionality
    console.log('🧮 Logout requested');
}

// Initialize when DOM is ready - but only if not in master interface
document.addEventListener('DOMContentLoaded', () => {
    // Check if API configuration is available
    if (window.MILEAGE_CYPHER_CONFIG?.GOOGLE_MAPS_API_KEY) {
        const apiKey = window.MILEAGE_CYPHER_CONFIG.GOOGLE_MAPS_API_KEY;
        if (apiKey !== 'YOUR_API_KEY_HERE') {
            console.log('🧮 Google Maps API key configured for auto-distance calculation');
        } else {
            console.warn('🧮 Google Maps API key needs to be set in config/api-config.js');
        }
    } else {
        console.warn('🧮 API configuration not found - manual distance entry only');
    }
    
    // Only initialize if master interface controller is not handling it
    if (!window.masterInterface) {
        console.log('🧮 Standalone mode - initializing calculator directly');
        window.mileageCalculator = new MileageCypherCalculator();
    } else {
        console.log('🧮 Master interface mode - calculator will be initialized after content loads');
    }
    
    console.log('🧮 Mileage Cypher Calculator fully loaded and ready!');
});

// Additional methods for Jobs Integration
Object.assign(MileageCypherCalculator.prototype, {
    onClaimTypeChange() {
        const claimType = document.getElementById('claimTypeSelect')?.value;
        const firmId = document.getElementById('firmSelect')?.value;
        
        if (claimType && firmId) {
            const firm = this.settings.firms.find(f => f.id === firmId);
            if (firm && firm.claimTypes && firm.claimTypes[claimType]) {
                console.log(`🧮 Claim type changed to: ${claimType} ($${firm.claimTypes[claimType]} file rate)`);
                
                // Auto-calculate immediately when claim type changes (user wants to see total cost)
                if (this.settings.autoCalculateEnabled) {
                    console.log('🧮 Claim type changed - checking if calculation should trigger...');
                    const hasAddresses = document.getElementById('pointA')?.value?.trim() && document.getElementById('pointB')?.value?.trim();
                    const hasDistance = parseFloat(document.getElementById('distanceMiles')?.value) > 0;
                    
                    if (hasAddresses && hasDistance) {
                        console.log('🧮 Auto-calculation triggered due to claim type change (have all data)');
                        setTimeout(() => {
                            this.performCalculation(false); // false = show results immediately
                        }, 300);
                    } else if (hasAddresses && !hasDistance) {
                        console.log('🧮 Have addresses but no distance - triggering auto-distance calculation');
                        this.triggerAutoDistance();
                    } else {
                        console.log('🧮 Auto-calculation skipped - missing addresses or distance');
                    }
                }
                
                // Update job preview if claim ID exists
                this.updateJobPreview();
            }
        }
    },

    updateJobPreview() {
        const claimId = document.getElementById('claimIdInput')?.value?.trim();
        const jobPreview = document.getElementById('jobPreview');
        const previewContent = document.getElementById('previewContent');
        
        if (!claimId || !this.currentCalculation) {
            if (jobPreview) jobPreview.style.display = 'none';
            return;
        }

        const { firm, claimType, totalFee, fileRate, totalJobValue } = this.currentCalculation;
        
        if (!claimType || !fileRate) {
            if (jobPreview) jobPreview.style.display = 'none';
            return;
        }

        const claimTypeDisplay = this.formatClaimType(claimType);
        
        if (previewContent) {
            previewContent.innerHTML = `
                <div class="preview-job">
                    <div class="job-header">
                        <strong>${firm.name}/${claimTypeDisplay}</strong>
                        <span class="job-id">#${claimId}</span>
                    </div>
                    <div class="job-breakdown">
                        <div class="job-item">
                            <span>Mileage:</span>
                            <span>$${totalFee}</span>
                        </div>
                        <div class="job-item">
                            <span>File Rate:</span>
                            <span>$${fileRate}</span>
                        </div>
                        <div class="job-total">
                            <span><strong>Total:</strong></span>
                            <span><strong>$${totalJobValue}</strong></span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (jobPreview) jobPreview.style.display = 'block';
    },

    async handleSendToJobs() {
        const claimId = document.getElementById('claimIdInput')?.value?.trim();
        
        if (!claimId) {
            this.showNotification('Please enter a Claim ID', 'warning');
            return;
        }

        if (!this.currentCalculation) {
            this.showNotification('Please calculate mileage first', 'warning');
            return;
        }

        const { firm, claimType, totalFee, fileRate, totalJobValue, route } = this.currentCalculation;
        
        // Debug the calculation values
        console.log('🧮 Current calculation breakdown:', {
            claimType,
            mileageFee: totalFee,
            fileRate: fileRate,
            totalJobValue: totalJobValue,
            firmClaimTypes: firm.claimTypes
        });
        
        console.log('🧮 Send to Jobs - Current calculation data:', {
            firm: firm?.name,
            claimType,
            totalFee,
            fileRate,
            totalJobValue,
            route
        });
        
        if (!claimType) {
            console.log('🧮 Send to Jobs failed: No claim type');
            this.showNotification('Please select a claim type', 'warning');
            return;
        }
        
        if (fileRate === undefined || fileRate === null) {
            console.log('🧮 Send to Jobs failed: No file rate for claim type', claimType);
            this.showNotification('File rate not found for selected claim type', 'warning');
            return;
        }

        try {
            // Create job data for the Jobs system
            const jobData = {
                claimNumber: claimId,
                firmName: firm.name,
                claimType: this.formatClaimType(claimType),
                mileageAmount: totalFee,
                fileRate: fileRate,
                totalJobValue: totalJobValue,
                route: route,
                status: 'pending',
                createdFrom: 'mileage-calculator',
                createdDate: new Date().toISOString()
            };

            // Send to Jobs system
            console.log('🧮 Checking for Jobs system integration...');
            console.log('🧮 window.masterInterface exists:', !!window.masterInterface);
            console.log('🧮 jobBillingService exists:', !!(window.masterInterface && window.masterInterface.jobBillingService));
            
            if (window.masterInterface && window.masterInterface.jobBillingService) {
                console.log('🧮 Creating job with data:', jobData);
                
                // Create job in the billing service with pre-calculated mileage data
                const job = window.masterInterface.jobBillingService.createJob({
                    firmName: firm.name,
                    claimNumber: claimId,
                    totalJobValue: totalJobValue,
                    mileageAmount: totalFee,
                    status: 'active',
                    claimType: claimType,
                    route: `${route.from} → ${route.to}`,
                    customerAddress: route.to || 'Unknown Location',
                    homeAddress: route.from || this.settings.homeLocation || 'Home',
                    scheduledDate: new Date().toISOString(),
                    description: `${claimType?.toUpperCase()} claim - Mileage + File Rate`,
                    // Pass pre-calculated mileage data to avoid duplicate Google Maps calls
                    preCalculatedMileage: {
                        distance: this.currentCalculation.distance,
                        billableMiles: this.currentCalculation.billableMiles,
                        totalFee: this.currentCalculation.totalFee,
                        calculated: true
                    }
                });
                
                console.log('🧮 JobBillingService.createJob() parameters:', {
                    firmName: firm.name,
                    claimNumber: claimId,
                    totalJobValue: totalJobValue,
                    mileageAmount: totalFee,
                    status: 'active',
                    claimType: claimType,
                    customerAddress: route.to,
                    homeAddress: route.from
                });

                console.log('🧮 Job creation result:', job);
                
                // Ensure job is set to active status (JobBillingService might default to 'scheduled')
                if (job && job.jobId && job.status !== 'active') {
                    console.log('🧮 Updating job status from', job.status, 'to active');
                    job.status = 'active';
                    // Save the updated job
                    if (window.masterInterface.jobBillingService.saveData) {
                        window.masterInterface.jobBillingService.saveData();
                    }
                }
                
                this.showNotification(`Job created successfully! ${claimId} → ${firm.name}`, 'success');
                console.log('🧮 Job sent to active jobs:', jobData);
                
                // Ensure JobsStudio is available for Jobs tab display
                if (!window.jobsStudio && window.JobsStudioController) {
                    console.log('🧮 Initializing JobsStudio for job sync...');
                    try {
                        window.jobsStudio = new window.JobsStudioController();
                        console.log('✅ JobsStudio initialized for job sync');
                    } catch (error) {
                        console.error('❌ Failed to initialize JobsStudio:', error);
                    }
                }
                
                // Add job to JobsStudio system for Jobs tab display using createJob method
                if (window.jobsStudio && window.jobsStudio.createJob) {
                    console.log('🧮 Adding job to JobsStudio for Jobs tab display...');
                    const jobsStudioJob = {
                        number: claimId,
                        firm: firm.name,
                        type: claimType?.toUpperCase() || 'AUTO',
                        location: route.to || 'Unknown Location',
                        earnings: totalJobValue,
                        mileageAmount: totalFee,
                        fileRate: fileRate,
                        status: 'active',
                        date: new Date().toISOString(),
                        notes: `Mileage: ${this.currentCalculation.billableMiles} billable miles × $${firm.ratePerMile} + $${fileRate} file rate`
                    };
                    
                    window.jobsStudio.createJob(jobsStudioJob);
                    console.log('🧮 Job added to JobsStudio:', jobsStudioJob);
                } else {
                    console.log('🧮 JobsStudio.createJob not available - trying direct localStorage method...');
                    // Fallback: Add job directly to localStorage 
                    const existingJobs = JSON.parse(localStorage.getItem('cipherJobs') || '[]');
                    const newJob = {
                        id: Date.now().toString(),
                        number: claimId,
                        firm: firm.name,
                        type: claimType?.toUpperCase() || 'AUTO',
                        location: route.to || 'Unknown Location',
                        earnings: totalJobValue,
                        mileageAmount: totalFee,
                        fileRate: fileRate,
                        status: 'active',
                        date: new Date().toISOString(),
                        notes: `Mileage: ${this.currentCalculation.billableMiles} billable miles × $${firm.ratePerMile} + $${fileRate} file rate`
                    };
                    
                    existingJobs.push(newJob);
                    localStorage.setItem('cipherJobs', JSON.stringify(existingJobs));
                    console.log('🧮 Job added directly to localStorage:', newJob);
                    
                    console.log('🧮 Debug info:', {
                        'window.jobsStudio exists': !!window.jobsStudio,
                        'JobsStudioController exists': !!window.JobsStudioController,
                        'Available methods': window.jobsStudio ? Object.keys(window.jobsStudio) : 'N/A'
                    });
                }
                
                // Trigger refresh of Jobs display if available
                if (window.masterInterface.refreshJobsDisplay) {
                    console.log('🧮 Refreshing jobs display...');
                    window.masterInterface.refreshJobsDisplay();
                }
                
                // Clear the claim ID input
                document.getElementById('claimIdInput').value = '';
                this.updateJobPreview();

            } else {
                console.warn('🧮 Jobs system not available, storing for later sync');
                this.showNotification('Job created! Please sync with Jobs tab.', 'info');
            }

        } catch (error) {
            console.error('🧮 Error sending to jobs:', error);
            this.showNotification('Error creating job entry', 'error');
        }
    },

    formatClaimType(claimType) {
        const claimTypeLabels = {
            auto: 'Auto',
            te: 'T&E',
            photoscope: 'Photo/Scope',
            exotic: 'Exotic/Classic'
        };
        return claimTypeLabels[claimType] || claimType;
    }
});

// Export for global access
window.MileageCypherCalculator = MileageCypherCalculator;