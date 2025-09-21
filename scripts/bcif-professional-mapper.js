/**
 * BCIF PROFESSIONAL MAPPER
 * Advanced pattern recognition and field mapping for CCC estimates
 * Maps extracted data to BCIF form fields with professional validation
 */

class BCIFProfessionalMapper {
    constructor() {
        this.patterns = {};
        this.fieldMappings = {};
        this.validationRules = {};
        this.initialized = false;
    }

    async init() {
        console.log('🎯 BCIF Professional Mapper initializing...');
        
        this.setupPatterns();
        this.setupFieldMappings();
        this.setupValidationRules();
        
        this.initialized = true;
        console.log('✅ BCIF Professional Mapper ready');
    }

    setupPatterns() {
        // Text patterns for identifying and extracting data
        this.patterns = {
            // Name patterns
            fullName: /^([A-Z]+),\s*([A-Z\s]+)$/,
            claimNumber: /^\d{6}-[A-Z]{2}-\d+$/,
            policyNumber: /^[A-Z0-9\-]+$/,
            
            // Vehicle patterns
            vin: /^[A-HJ-NPR-Z0-9]{17}$/,
            year: /^(19|20)\d{2}$/,
            make: /^[A-Z]{3,4}$/,
            model: /^[A-Z][a-z]+(\s[A-Z0-9]+)?$/,
            
            // Date patterns
            lossDate: /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}\s+(AM|PM))$/,
            
            // Numeric patterns
            mileage: /^\d{1,3}(,\d{3})*$/,
            zipCode: /^\d{5}(-\d{4})?$/,
            state: /^[A-Z]{2}$/
        };
    }

    setupFieldMappings() {
        // Map CCC fields to BCIF form fields
        this.fieldMappings = {
            // Insured Information
            'insuredFirstName': 'bcif_insured_first_name',
            'insuredLastName': 'bcif_insured_last_name',
            'ownerFirstName': 'bcif_owner_first_name',
            'ownerLastName': 'bcif_owner_last_name',
            
            // Vehicle Information
            'vin': 'bcif_vehicle_vin',
            'year': 'bcif_vehicle_year',
            'make': 'bcif_vehicle_make',
            'model': 'bcif_vehicle_model',
            'trim': 'bcif_vehicle_trim',
            'odometer': 'bcif_vehicle_mileage',
            
            // Claim Information
            'claimNumber': 'bcif_claim_number',
            'policyNumber': 'bcif_policy_number',
            'lossDate': 'bcif_loss_date',
            'lossState': 'bcif_loss_state',
            'lossZipCode': 'bcif_loss_zip'
        };
    }

    setupValidationRules() {
        // Validation rules for extracted data
        this.validationRules = {
            required: ['claimNumber', 'insuredLastName', 'vin', 'year', 'make', 'model'],
            formats: {
                'vin': this.patterns.vin,
                'year': this.patterns.year,
                'claimNumber': this.patterns.claimNumber,
                'lossDate': this.patterns.lossDate,
                'state': this.patterns.state,
                'zipCode': this.patterns.zipCode
            }
        };
    }

    /**
     * Extract data from PDF text using pattern matching
     * @param {string} pdfText - Full text content from PDF
     * @returns {Object} - Extracted data using pattern recognition
     */
    extractFromText(pdfText) {
        console.log('🎯 Extracting data from PDF text using patterns...');
        
        if (!this.initialized) {
            console.warn('⚠️ BCIFProfessionalMapper not initialized, using basic extraction');
        }
        
        const extractedData = {};
        
        try {
            // Extract claim number pattern - looking for 8-9 digit numbers
            const claimMatch = pdfText.match(/(\d{8,9})/);
            if (claimMatch) {
                extractedData.claimNumber = claimMatch[1];
            }
            
            // Extract VIN pattern
            const vinMatch = pdfText.match(/([A-HJ-NPR-Z0-9]{17})/);
            if (vinMatch) {
                extractedData.vin = vinMatch[1];
            }
            
            // Extract year pattern (4 digits likely to be a year)
            const yearMatch = pdfText.match(/(19|20)\d{2}/g);
            if (yearMatch) {
                extractedData.year = yearMatch[0];
            }
            
            // Extract name patterns (LASTNAME, FIRSTNAME format)
            const nameMatch = pdfText.match(/([A-Z]+),\s*([A-Z]+)/);
            if (nameMatch) {
                extractedData.insuredLastName = nameMatch[1];
                extractedData.insuredFirstName = nameMatch[2];
                // Assume owner same as insured unless specified otherwise
                extractedData.ownerLastName = nameMatch[1];
                extractedData.ownerFirstName = nameMatch[2];
            }
            
            // Extract mileage patterns
            const mileageMatch = pdfText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:miles|mi)/i);
            if (mileageMatch) {
                extractedData.odometer = mileageMatch[1].replace(/,/g, '');
            }
            
            // Extract date patterns
            const dateMatch = pdfText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateMatch) {
                extractedData.lossDate = dateMatch[1];
            }
            
            // Extract state patterns
            const stateMatch = pdfText.match(/\b([A-Z]{2})\b.*(?:state|ST)/i);
            if (stateMatch) {
                extractedData.lossState = stateMatch[1];
            }
            
            console.log('✅ Pattern-based extraction completed:', extractedData);
            return extractedData;
            
        } catch (error) {
            console.error('❌ Error in pattern extraction:', error);
            return {};
        }
    }

    /**
     * Process and map raw extracted data to BCIF format
     * @param {Object} rawData - Raw data from PDF extraction
     * @returns {Object} - Cleaned and mapped data for BCIF form
     */
    mapToBCIF(rawData) {
        if (!this.initialized) {
            throw new Error('BCIFProfessionalMapper not initialized');
        }

        console.log('🎯 Mapping raw data to BCIF format...');
        
        const mappedData = {};
        const errors = [];

        // Process each field
        for (const [sourceField, targetField] of Object.entries(this.fieldMappings)) {
            try {
                const rawValue = rawData[sourceField];
                const cleanedValue = this.cleanAndValidateField(sourceField, rawValue);
                
                if (cleanedValue !== null) {
                    mappedData[targetField] = cleanedValue;
                }
            } catch (error) {
                errors.push(`Error mapping ${sourceField}: ${error.message}`);
            }
        }

        // Special processing for complex fields
        this.processComplexFields(rawData, mappedData);

        // Validate required fields
        const validationErrors = this.validateRequiredFields(mappedData);
        errors.push(...validationErrors);

        if (errors.length > 0) {
            console.warn('⚠️ Mapping completed with warnings:', errors);
        }

        console.log('✅ Data mapping completed');
        return {
            data: mappedData,
            errors: errors,
            completeness: this.calculateCompleteness(mappedData)
        };
    }

    cleanAndValidateField(fieldName, rawValue) {
        if (!rawValue || rawValue.toString().trim() === '') {
            return null;
        }

        let cleanValue = rawValue.toString().trim();

        // Field-specific cleaning
        switch (fieldName) {
            case 'insuredFirstName':
            case 'insuredLastName':
                cleanValue = this.cleanNameField(cleanValue);
                break;
                
            case 'odometer':
                cleanValue = this.cleanMileageField(cleanValue);
                break;
                
            case 'lossDate':
                cleanValue = this.cleanDateField(cleanValue);
                break;
                
            case 'vin':
                cleanValue = cleanValue.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                break;
                
            case 'year':
                cleanValue = cleanValue.replace(/[^\d]/g, '');
                break;
                
            case 'make':
                cleanValue = this.expandMakeAbbreviation(cleanValue);
                break;
        }

        // Validate format if rule exists
        const formatRule = this.validationRules.formats[fieldName];
        if (formatRule && !formatRule.test(cleanValue)) {
            console.warn(`⚠️ Format validation failed for ${fieldName}: ${cleanValue}`);
        }

        return cleanValue;
    }

    cleanNameField(nameValue) {
        // Handle "LASTNAME, FIRSTNAME" format
        const nameMatch = nameValue.match(this.patterns.fullName);
        if (nameMatch) {
            return {
                lastName: nameMatch[1].trim(),
                firstName: nameMatch[2].trim()
            };
        }
        return nameValue;
    }

    cleanMileageField(mileageValue) {
        // Remove commas and non-digits
        return mileageValue.replace(/[^\d]/g, '');
    }

    cleanDateField(dateValue) {
        // Standardize date format
        const dateMatch = dateValue.match(this.patterns.lossDate);
        if (dateMatch) {
            const [, month, day, year, time] = dateMatch;
            return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
        }
        return dateValue;
    }

    expandMakeAbbreviation(makeValue) {
        const makeExpansions = {
            'CHEV': 'CHEVROLET',
            'FORD': 'FORD',
            'DODG': 'DODGE',
            'TOYT': 'TOYOTA',
            'HOND': 'HONDA',
            'NISS': 'NISSAN',
            'HYUN': 'HYUNDAI',
            'KIA': 'KIA',
            'BMW': 'BMW',
            'MERZ': 'MERCEDES-BENZ',
            'AUDI': 'AUDI',
            'VOLV': 'VOLVO',
            'SUBR': 'SUBARU'
        };
        
        return makeExpansions[makeValue.toUpperCase()] || makeValue;
    }

    processComplexFields(rawData, mappedData) {
        // Handle name splitting
        if (rawData.insuredLastName && typeof rawData.insuredLastName === 'object') {
            mappedData.bcif_insured_first_name = rawData.insuredLastName.firstName;
            mappedData.bcif_insured_last_name = rawData.insuredLastName.lastName;
        }
        
        if (rawData.ownerLastName && typeof rawData.ownerLastName === 'object') {
            mappedData.bcif_owner_first_name = rawData.ownerLastName.firstName;
            mappedData.bcif_owner_last_name = rawData.ownerLastName.lastName;
        }

        // Generate derived fields
        if (mappedData.bcif_vehicle_year && mappedData.bcif_vehicle_make && mappedData.bcif_vehicle_model) {
            mappedData.bcif_vehicle_description = `${mappedData.bcif_vehicle_year} ${mappedData.bcif_vehicle_make} ${mappedData.bcif_vehicle_model}`;
        }
    }

    validateRequiredFields(mappedData) {
        const errors = [];
        
        for (const requiredField of this.validationRules.required) {
            const bcifField = this.fieldMappings[requiredField];
            if (!mappedData[bcifField]) {
                errors.push(`Required field missing: ${requiredField} -> ${bcifField}`);
            }
        }
        
        return errors;
    }

    calculateCompleteness(mappedData) {
        const totalFields = Object.keys(this.fieldMappings).length;
        const filledFields = Object.values(mappedData).filter(value => value && value !== '').length;
        return Math.round((filledFields / totalFields) * 100);
    }

    /**
     * Get field mapping information
     * @returns {Object} - Field mapping configuration
     */
    getFieldMappings() {
        return {
            mappings: this.fieldMappings,
            patterns: this.patterns,
            validation: this.validationRules
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BCIFProfessionalMapper = BCIFProfessionalMapper;
}