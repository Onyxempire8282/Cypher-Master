/**
 * CLAIM SUMMARY EXTRACTOR
 * Extracts and processes claim summary information from CCC estimates
 * Generates comprehensive claim summaries for total loss documentation
 */

class ClaimSummaryExtractor {
    constructor() {
        this.summaryFields = {};
        this.calculationRules = {};
        this.initialized = false;
    }

    async init() {
        console.log('📊 Claim Summary Extractor initializing...');
        
        this.setupSummaryFields();
        this.setupCalculationRules();
        
        this.initialized = true;
        console.log('✅ Claim Summary Extractor ready');
    }

    setupSummaryFields() {
        // Define fields needed for claim summary
        this.summaryFields = {
            // Basic claim info
            claimBasics: ['claimNumber', 'policyNumber', 'lossDate', 'reportDate'],
            
            // Parties involved
            parties: ['insuredFirstName', 'insuredLastName', 'ownerFirstName', 'ownerLastName'],
            
            // Vehicle details
            vehicle: ['year', 'make', 'model', 'trim', 'vin', 'odometer'],
            
            // Loss details
            lossInfo: ['lossDate', 'lossState', 'lossZipCode', 'lossType'],
            
            // Financial summary
            financials: ['totalLossAmount', 'salvageValue', 'actualCashValue', 'deductible']
        };
    }

    setupCalculationRules() {
        // Rules for calculating derived values
        this.calculationRules = {
            // Calculate vehicle age
            vehicleAge: (year) => {
                const currentYear = new Date().getFullYear();
                return currentYear - parseInt(year);
            },
            
            // Format currency values
            formatCurrency: (amount) => {
                if (!amount) return '$0.00';
                const num = parseFloat(amount.toString().replace(/[,$]/g, ''));
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(num);
            },
            
            // Calculate depreciation rate
            depreciationRate: (originalValue, currentValue) => {
                if (!originalValue || !currentValue) return 0;
                return ((originalValue - currentValue) / originalValue * 100).toFixed(2);
            }
        };
    }

    /**
     * Extract comprehensive claim summary from raw data
     * @param {Object} extractedData - Raw data from CCC PDF
     * @returns {Object} - Structured claim summary
     */
    extractClaimSummary(extractedData) {
        if (!this.initialized) {
            console.error('❌ ClaimSummaryExtractor not initialized');
            return null;
        }

        console.log('📊 Extracting claim summary from data...');

        try {
            const summary = {
                // Basic claim information
                claim: this.extractClaimBasics(extractedData),
                
                // Party information
                parties: this.extractParties(extractedData),
                
                // Vehicle information
                vehicle: this.extractVehicleDetails(extractedData),
                
                // Loss information
                loss: this.extractLossDetails(extractedData),
                
                // Financial summary
                financials: this.extractFinancials(extractedData),
                
                // Calculated fields
                calculations: this.performCalculations(extractedData),
                
                // Metadata
                metadata: {
                    extractedAt: new Date().toISOString(),
                    completeness: this.calculateDataCompleteness(extractedData),
                    dataQuality: this.assessDataQuality(extractedData)
                }
            };

            console.log('✅ Claim summary extracted successfully');
            return summary;

        } catch (error) {
            console.error('❌ Error extracting claim summary:', error);
            return null;
        }
    }

    extractClaimBasics(data) {
        return {
            claimNumber: data.claimNumber || 'N/A',
            policyNumber: data.policyNumber || 'N/A',
            lossDate: this.formatDate(data.lossDate),
            reportDate: new Date().toLocaleDateString(),
            claimType: 'Total Loss',
            status: 'Processing'
        };
    }

    extractParties(data) {
        return {
            insured: {
                firstName: data.insuredFirstName || '',
                lastName: data.insuredLastName || '',
                fullName: this.buildFullName(data.insuredFirstName, data.insuredLastName)
            },
            owner: {
                firstName: data.ownerFirstName || data.insuredFirstName || '',
                lastName: data.ownerLastName || data.insuredLastName || '',
                fullName: this.buildFullName(
                    data.ownerFirstName || data.insuredFirstName,
                    data.ownerLastName || data.insuredLastName
                )
            },
            sameAsInsured: this.checkIfSameParty(data)
        };
    }

    extractVehicleDetails(data) {
        return {
            year: data.year || 'N/A',
            make: data.make || 'N/A',
            model: data.model || 'N/A',
            trim: data.trim || 'N/A',
            vin: data.vin || 'N/A',
            odometer: this.formatMileage(data.odometer),
            description: this.buildVehicleDescription(data),
            age: data.year ? this.calculationRules.vehicleAge(data.year) : 'N/A'
        };
    }

    extractLossDetails(data) {
        return {
            lossDate: this.formatDate(data.lossDate),
            lossLocation: {
                state: data.lossState || 'N/A',
                zipCode: data.lossZipCode || 'N/A'
            },
            lossType: this.determineLossType(data),
            severity: this.assessLossSeverity(data)
        };
    }

    extractFinancials(data) {
        return {
            totalLoss: this.calculationRules.formatCurrency(data.totalLossAmount),
            actualCashValue: this.calculationRules.formatCurrency(data.actualCashValue),
            salvageValue: this.calculationRules.formatCurrency(data.salvageValue),
            deductible: this.calculationRules.formatCurrency(data.deductible),
            netSettlement: this.calculateNetSettlement(data)
        };
    }

    performCalculations(data) {
        return {
            vehicleAge: data.year ? this.calculationRules.vehicleAge(data.year) : 'N/A',
            depreciationRate: this.calculateDepreciation(data),
            totalLossRatio: this.calculateTotalLossRatio(data),
            processingSummary: {
                dataCompleteness: this.calculateDataCompleteness(data),
                missingFields: this.identifyMissingFields(data),
                dataQualityScore: this.assessDataQuality(data)
            }
        };
    }

    // Helper methods
    buildFullName(firstName, lastName) {
        const first = firstName || '';
        const last = lastName || '';
        return `${first} ${last}`.trim() || 'N/A';
    }

    buildVehicleDescription(data) {
        const parts = [data.year, data.make, data.model, data.trim].filter(part => part && part !== 'N/A');
        return parts.length > 0 ? parts.join(' ') : 'N/A';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return dateString;
        }
    }

    formatMileage(mileage) {
        if (!mileage) return 'N/A';
        const num = parseInt(mileage.toString().replace(/[^\d]/g, ''));
        return num ? num.toLocaleString() + ' miles' : 'N/A';
    }

    checkIfSameParty(data) {
        const insuredName = this.buildFullName(data.insuredFirstName, data.insuredLastName);
        const ownerName = this.buildFullName(data.ownerFirstName, data.ownerLastName);
        return insuredName === ownerName;
    }

    determineLossType(data) {
        // Basic loss type determination logic
        if (data.totalLossAmount || data.totalLoss) return 'Total Loss';
        return 'Property Damage';
    }

    assessLossSeverity(data) {
        // Simple severity assessment
        if (data.totalLossAmount) return 'Total Loss';
        return 'Significant';
    }

    calculateNetSettlement(data) {
        const acv = parseFloat((data.actualCashValue || '0').toString().replace(/[,$]/g, ''));
        const deductible = parseFloat((data.deductible || '0').toString().replace(/[,$]/g, ''));
        const salvage = parseFloat((data.salvageValue || '0').toString().replace(/[,$]/g, ''));
        
        const net = acv - deductible - salvage;
        return this.calculationRules.formatCurrency(net);
    }

    calculateDepreciation(data) {
        // Simplified depreciation calculation
        if (!data.year) return 'N/A';
        const age = this.calculationRules.vehicleAge(data.year);
        const depreciation = age * 15; // Rough 15% per year
        return `${Math.min(depreciation, 90)}%`;
    }

    calculateTotalLossRatio(data) {
        // Total loss threshold calculation
        const repairCost = parseFloat((data.totalLossAmount || '0').toString().replace(/[,$]/g, ''));
        const acv = parseFloat((data.actualCashValue || '0').toString().replace(/[,$]/g, ''));
        
        if (!acv || acv === 0) return 'N/A';
        const ratio = (repairCost / acv * 100).toFixed(1);
        return `${ratio}%`;
    }

    calculateDataCompleteness(data) {
        const allFields = Object.values(this.summaryFields).flat();
        const filledFields = allFields.filter(field => data[field] && data[field] !== '').length;
        return Math.round((filledFields / allFields.length) * 100);
    }

    identifyMissingFields(data) {
        const allFields = Object.values(this.summaryFields).flat();
        return allFields.filter(field => !data[field] || data[field] === '');
    }

    assessDataQuality(data) {
        let score = 100;
        const critical = ['claimNumber', 'vin', 'year', 'make', 'model'];
        const important = ['insuredLastName', 'lossDate', 'odometer'];
        
        // Deduct points for missing critical fields
        critical.forEach(field => {
            if (!data[field]) score -= 20;
        });
        
        // Deduct points for missing important fields
        important.forEach(field => {
            if (!data[field]) score -= 10;
        });
        
        return Math.max(score, 0);
    }

    /**
     * Generate formatted summary report
     * @param {Object} extractedData - Raw extracted data
     * @returns {string} - Formatted summary report
     */
    generateSummaryReport(extractedData) {
        const summary = this.extractClaimSummary(extractedData);
        if (!summary) return 'Error generating summary report';

        return `
CLAIM SUMMARY REPORT
===================

CLAIM INFORMATION
Claim Number: ${summary.claim.claimNumber}
Policy Number: ${summary.claim.policyNumber}
Loss Date: ${summary.claim.lossDate}
Report Date: ${summary.claim.reportDate}

PARTIES
Insured: ${summary.parties.insured.fullName}
Owner: ${summary.parties.owner.fullName}
Same Party: ${summary.parties.sameAsInsured ? 'Yes' : 'No'}

VEHICLE INFORMATION
Vehicle: ${summary.vehicle.description}
VIN: ${summary.vehicle.vin}
Mileage: ${summary.vehicle.odometer}
Age: ${summary.vehicle.age} years

LOSS DETAILS
Loss Date: ${summary.loss.lossDate}
Location: ${summary.loss.lossLocation.state} ${summary.loss.lossLocation.zipCode}
Type: ${summary.loss.lossType}
Severity: ${summary.loss.severity}

FINANCIAL SUMMARY
Actual Cash Value: ${summary.financials.actualCashValue}
Total Loss Amount: ${summary.financials.totalLoss}
Salvage Value: ${summary.financials.salvageValue}
Deductible: ${summary.financials.deductible}
Net Settlement: ${summary.financials.netSettlement}

DATA QUALITY
Completeness: ${summary.metadata.completeness}%
Quality Score: ${summary.calculations.processingSummary.dataQualityScore}%

Generated: ${new Date().toLocaleString()}
        `.trim();
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ClaimSummaryExtractor = ClaimSummaryExtractor;
}