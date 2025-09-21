/**
 * BCIF FIELD MAPPER
 * Maps CCC estimate data to BCIF form fields
 * Handles field validation and data transformation
 */

class BCIFFieldMapper {
    constructor() {
        this.fieldMappings = {};
        this.transformations = {};
        this.validationRules = {};
        this.initialized = false;
    }

    async init() {
        console.log('🗺️ BCIF Field Mapper initializing...');
        
        this.setupFieldMappings();
        this.setupTransformations();
        this.setupValidationRules();
        
        this.initialized = true;
        console.log('✅ BCIF Field Mapper ready');
    }

    setupFieldMappings() {
        // Map CCC PDF fields to BCIF form field names
        this.fieldMappings = {
            // Section 1: Claim Information
            'claimNumber': 'claim_number',
            'policyNumber': 'policy_number', 
            'lossDate': 'date_of_loss',
            'reportDate': 'report_date',
            
            // Section 2: Insured Information
            'insuredFirstName': 'insured_first_name',
            'insuredLastName': 'insured_last_name',
            'insuredAddress1': 'insured_address_line_1',
            'insuredAddress2': 'insured_address_line_2',
            'insuredCity': 'insured_city',
            'insuredState': 'insured_state',
            'insuredZip': 'insured_zip_code',
            'insuredPhone': 'insured_phone',
            
            // Section 3: Owner Information (if different)
            'ownerFirstName': 'owner_first_name',
            'ownerLastName': 'owner_last_name',
            'ownerAddress1': 'owner_address_line_1',
            'ownerAddress2': 'owner_address_line_2',
            'ownerCity': 'owner_city',
            'ownerState': 'owner_state',
            'ownerZip': 'owner_zip_code',
            'ownerPhone': 'owner_phone',
            
            // Section 4: Vehicle Information
            'year': 'vehicle_year',
            'make': 'vehicle_make',
            'model': 'vehicle_model',
            'trim': 'vehicle_trim',
            'vin': 'vehicle_vin',
            'odometer': 'vehicle_mileage',
            'vehicleColor': 'vehicle_color',
            'licensePlate': 'license_plate',
            'licenseState': 'license_state',
            
            // Section 5: Loss Information
            'lossState': 'loss_state',
            'lossCity': 'loss_city',
            'lossZipCode': 'loss_zip_code',
            'lossType': 'loss_type',
            'lossDescription': 'loss_description',
            
            // Section 6: Financial Information
            'actualCashValue': 'actual_cash_value',
            'totalLossAmount': 'total_loss_amount',
            'salvageValue': 'salvage_value',
            'deductible': 'deductible_amount',
            'netSettlement': 'net_settlement'
        };
    }

    setupTransformations() {
        // Define data transformations for different field types
        this.transformations = {
            // Date transformations
            date: (value) => {
                if (!value) return '';
                try {
                    // Handle various date formats
                    let date;
                    if (value.includes('/')) {
                        const parts = value.split('/');
                        if (parts.length === 3) {
                            // MM/DD/YYYY format
                            date = new Date(parts[2], parts[0] - 1, parts[1]);
                        }
                    } else {
                        date = new Date(value);
                    }
                    
                    if (isNaN(date.getTime())) return value; // Return original if invalid
                    
                    // Return in MM/DD/YYYY format
                    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
                } catch {
                    return value;
                }
            },
            
            // Currency transformations
            currency: (value) => {
                if (!value) return '$0.00';
                
                // Remove existing currency symbols and commas
                const cleaned = value.toString().replace(/[$,]/g, '');
                const num = parseFloat(cleaned);
                
                if (isNaN(num)) return '$0.00';
                
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(num);
            },
            
            // Name transformations
            name: (value) => {
                if (!value) return '';
                
                // Handle "LASTNAME, FIRSTNAME" format
                if (value.includes(',')) {
                    const parts = value.split(',');
                    return {
                        lastName: parts[0].trim(),
                        firstName: parts[1] ? parts[1].trim() : ''
                    };
                }
                
                return value.trim();
            },
            
            // Phone number transformation
            phone: (value) => {
                if (!value) return '';
                
                // Remove all non-digits
                const digits = value.replace(/\D/g, '');
                
                // Format as (XXX) XXX-XXXX
                if (digits.length === 10) {
                    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                }
                
                return value;
            },
            
            // VIN transformation
            vin: (value) => {
                if (!value) return '';
                return value.toString().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
            },
            
            // Mileage transformation
            mileage: (value) => {
                if (!value) return '';
                
                // Remove commas and non-digits
                const cleaned = value.toString().replace(/[^\d]/g, '');
                const num = parseInt(cleaned);
                
                if (isNaN(num)) return '';
                
                return num.toLocaleString();
            },
            
            // Text transformation
            text: (value) => {
                if (!value) return '';
                return value.toString().trim();
            },
            
            // State abbreviation
            state: (value) => {
                if (!value) return '';
                const state = value.toString().trim().toUpperCase();
                
                // State abbreviation mapping
                const stateMap = {
                    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
                    'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
                    'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
                    'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
                    'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
                    'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
                    'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
                    'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
                    'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
                    'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
                    'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
                    'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
                    'WISCONSIN': 'WI', 'WYOMING': 'WY'
                };
                
                return stateMap[state] || state;
            }
        };
    }

    setupValidationRules() {
        // Define validation rules for each field type
        this.validationRules = {
            required: [
                'claim_number', 'policy_number', 'date_of_loss', 
                'insured_first_name', 'insured_last_name',
                'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_vin'
            ],
            
            patterns: {
                claim_number: /^\d{6}-[A-Z]{2}-\d+$/,
                vehicle_vin: /^[A-HJ-NPR-Z0-9]{17}$/,
                vehicle_year: /^(19|20)\d{2}$/,
                phone: /^\(\d{3}\) \d{3}-\d{4}$/,
                zip_code: /^\d{5}(-\d{4})?$/,
                state: /^[A-Z]{2}$/
            },
            
            ranges: {
                vehicle_year: { min: 1900, max: new Date().getFullYear() + 1 },
                vehicle_mileage: { min: 0, max: 999999 }
            }
        };
    }

    /**
     * Map and transform CCC data to BCIF format
     * @param {Object} cccData - Raw data extracted from CCC PDF
     * @returns {Object} - Mapped and validated BCIF data
     */
    mapToBCIF(cccData) {
        if (!this.initialized) {
            throw new Error('BCIFFieldMapper not initialized');
        }

        console.log('🗺️ Mapping CCC data to BCIF format...');

        const bcifData = {};
        const errors = [];
        const warnings = [];

        try {
            // Process each field mapping
            for (const [cccField, bcifField] of Object.entries(this.fieldMappings)) {
                const rawValue = cccData[cccField];
                
                try {
                    // Apply transformation based on field type
                    const transformedValue = this.transformField(bcifField, rawValue);
                    
                    // Validate the transformed value
                    const validationResult = this.validateField(bcifField, transformedValue);
                    
                    if (validationResult.isValid) {
                        bcifData[bcifField] = transformedValue;
                    } else {
                        warnings.push(`Validation warning for ${bcifField}: ${validationResult.message}`);
                        bcifData[bcifField] = transformedValue; // Include anyway, but warn
                    }
                    
                } catch (fieldError) {
                    errors.push(`Error processing field ${cccField} -> ${bcifField}: ${fieldError.message}`);
                }
            }

            // Handle special cases and derived fields
            this.handleSpecialCases(cccData, bcifData);

            // Check for required fields
            const missingRequired = this.checkRequiredFields(bcifData);
            if (missingRequired.length > 0) {
                warnings.push(`Missing required fields: ${missingRequired.join(', ')}`);
            }

            // Calculate completeness score
            const completeness = this.calculateCompleteness(bcifData);

            console.log(`✅ BCIF mapping completed - ${completeness}% complete`);

            return {
                data: bcifData,
                metadata: {
                    completeness: completeness,
                    errors: errors,
                    warnings: warnings,
                    mappedAt: new Date().toISOString(),
                    totalFields: Object.keys(this.fieldMappings).length,
                    mappedFields: Object.keys(bcifData).length
                }
            };

        } catch (error) {
            console.error('❌ Error during BCIF mapping:', error);
            throw error;
        }
    }

    transformField(bcifField, rawValue) {
        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return '';
        }

        // Determine transformation type based on field name
        let transformationType = 'text'; // default
        
        if (bcifField.includes('date')) transformationType = 'date';
        else if (bcifField.includes('amount') || bcifField.includes('value')) transformationType = 'currency';
        else if (bcifField.includes('phone')) transformationType = 'phone';
        else if (bcifField.includes('vin')) transformationType = 'vin';
        else if (bcifField.includes('mileage')) transformationType = 'mileage';
        else if (bcifField.includes('state')) transformationType = 'state';
        else if (bcifField.includes('name')) transformationType = 'name';

        return this.transformations[transformationType](rawValue);
    }

    validateField(bcifField, value) {
        // Check if field is required
        if (this.validationRules.required.includes(bcifField) && !value) {
            return {
                isValid: false,
                message: 'Required field is empty'
            };
        }

        // Check pattern validation
        const pattern = this.validationRules.patterns[bcifField];
        if (pattern && value && !pattern.test(value)) {
            return {
                isValid: false,
                message: `Value does not match expected pattern`
            };
        }

        // Check range validation
        const range = this.validationRules.ranges[bcifField];
        if (range && value) {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && (numValue < range.min || numValue > range.max)) {
                return {
                    isValid: false,
                    message: `Value outside allowed range (${range.min}-${range.max})`
                };
            }
        }

        return { isValid: true };
    }

    handleSpecialCases(cccData, bcifData) {
        // Handle name splitting if needed
        if (bcifData.insured_first_name && typeof bcifData.insured_first_name === 'object') {
            const nameObj = bcifData.insured_first_name;
            bcifData.insured_first_name = nameObj.firstName || '';
            bcifData.insured_last_name = nameObj.lastName || '';
        }

        if (bcifData.owner_first_name && typeof bcifData.owner_first_name === 'object') {
            const nameObj = bcifData.owner_first_name;
            bcifData.owner_first_name = nameObj.firstName || '';
            bcifData.owner_last_name = nameObj.lastName || '';
        }

        // Set current date as report date if not provided
        if (!bcifData.report_date) {
            bcifData.report_date = this.transformations.date(new Date());
        }

        // Calculate net settlement if financial fields are available
        if (bcifData.actual_cash_value && bcifData.deductible_amount) {
            const acv = parseFloat(bcifData.actual_cash_value.replace(/[$,]/g, ''));
            const deductible = parseFloat(bcifData.deductible_amount.replace(/[$,]/g, ''));
            const salvage = bcifData.salvage_value ? parseFloat(bcifData.salvage_value.replace(/[$,]/g, '')) : 0;
            
            const net = acv - deductible - salvage;
            bcifData.net_settlement = this.transformations.currency(net);
        }

        // Ensure owner info defaults to insured if not provided
        if (!bcifData.owner_first_name && bcifData.insured_first_name) {
            bcifData.owner_first_name = bcifData.insured_first_name;
            bcifData.owner_last_name = bcifData.insured_last_name;
            bcifData.owner_address_line_1 = bcifData.insured_address_line_1;
            bcifData.owner_city = bcifData.insured_city;
            bcifData.owner_state = bcifData.insured_state;
            bcifData.owner_zip_code = bcifData.insured_zip_code;
            bcifData.owner_phone = bcifData.insured_phone;
        }
    }

    checkRequiredFields(bcifData) {
        return this.validationRules.required.filter(field => !bcifData[field] || bcifData[field] === '');
    }

    calculateCompleteness(bcifData) {
        const totalFields = Object.keys(this.fieldMappings).length;
        const filledFields = Object.keys(bcifData).filter(key => bcifData[key] && bcifData[key] !== '').length;
        return Math.round((filledFields / totalFields) * 100);
    }

    /**
     * Get the reverse mapping (BCIF to CCC)
     * @returns {Object} - Reverse field mapping
     */
    getReverseMappings() {
        const reverse = {};
        for (const [cccField, bcifField] of Object.entries(this.fieldMappings)) {
            reverse[bcifField] = cccField;
        }
        return reverse;
    }

    /**
     * Validate mapped data for completeness and accuracy
     * @param {Object} mappedData - Data that has been mapped to BCIF format
     * @returns {Object} - Validation results with score and details
     */
    validateMappedData(mappedData) {
        console.log('🔍 Validating mapped BCIF data...');
        
        const validation = {
            isValid: true,
            completeness: 0,
            errors: [],
            warnings: [],
            missingRequired: [],
            score: 0
        };

        try {
            // Check required fields
            const missing = this.checkRequiredFields(mappedData);
            if (missing.length > 0) {
                validation.missingRequired = missing;
                validation.warnings.push(`Missing required fields: ${missing.join(', ')}`);
            }

            // Calculate completeness
            validation.completeness = this.calculateCompleteness(mappedData);

            // Validate field formats
            for (const [field, value] of Object.entries(mappedData)) {
                if (value && value !== '') {
                    const fieldValidation = this.validateField(field, value);
                    if (!fieldValidation.isValid) {
                        validation.warnings.push(`${field}: ${fieldValidation.message}`);
                    }
                }
            }

            // Calculate overall score
            validation.score = this.calculateValidationScore(validation, mappedData);

            // Determine if data is valid enough to proceed
            validation.isValid = validation.score >= 50 && validation.missingRequired.length < 3;

            console.log(`✅ Validation completed - Score: ${validation.score}%`);
            return validation;

        } catch (error) {
            console.error('❌ Error during validation:', error);
            validation.isValid = false;
            validation.errors.push(`Validation error: ${error.message}`);
            return validation;
        }
    }

    /**
     * Calculate validation score based on completeness and quality
     * @param {Object} validation - Validation object
     * @param {Object} mappedData - Mapped data
     * @returns {number} - Score from 0-100
     */
    calculateValidationScore(validation, mappedData) {
        let score = validation.completeness; // Start with completeness percentage
        
        // Deduct points for missing required fields
        score -= validation.missingRequired.length * 10;
        
        // Deduct points for validation warnings
        score -= validation.warnings.length * 2;
        
        // Deduct points for errors
        score -= validation.errors.length * 5;
        
        // Bonus points for having key fields
        const keyFields = ['claim_number', 'vehicle_vin', 'insured_last_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'];
        const presentKeyFields = keyFields.filter(field => mappedData[field] && mappedData[field] !== '');
        score += presentKeyFields.length * 3;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Get field information and requirements
     * @returns {Object} - Field configuration details
     */
    getFieldInfo() {
        return {
            mappings: this.fieldMappings,
            transformations: Object.keys(this.transformations),
            validation: this.validationRules,
            totalFields: Object.keys(this.fieldMappings).length
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BCIFFieldMapper = BCIFFieldMapper;
}