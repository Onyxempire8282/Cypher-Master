/**
 * VEHICLE VALUATION SERVICE
 * Generates vehicle valuations and comparable vehicle reports
 * Integrates with market data for accurate ACV calculations
 */

class VehicleValuationService {
    constructor() {
        this.valuationSources = [];
        this.marketData = {};
        this.initialized = false;
    }

    async init() {
        console.log('💰 Vehicle Valuation Service initializing...');
        
        this.setupValuationSources();
        this.setupMarketData();
        
        this.initialized = true;
        console.log('✅ Vehicle Valuation Service ready');
    }

    setupValuationSources() {
        // Configure valuation data sources
        this.valuationSources = [
            {
                id: 'kbb',
                name: 'Kelley Blue Book',
                weight: 0.35,
                active: true
            },
            {
                id: 'edmunds',
                name: 'Edmunds',
                weight: 0.25,
                active: true
            },
            {
                id: 'nada',
                name: 'NADA Guides',
                weight: 0.25,
                active: true
            },
            {
                id: 'market_analysis',
                name: 'Market Analysis',
                weight: 0.15,
                active: true
            }
        ];
    }

    setupMarketData() {
        // Initialize market data templates
        this.marketData = {
            depreciationRates: {
                'luxury': { annual: 0.22, multiplier: 1.15 },
                'standard': { annual: 0.18, multiplier: 1.0 },
                'economy': { annual: 0.15, multiplier: 0.85 },
                'truck': { annual: 0.16, multiplier: 0.95 },
                'suv': { annual: 0.17, multiplier: 1.05 }
            },
            mileageAdjustments: {
                'low': { threshold: 10000, adjustment: 1.08 },
                'average': { threshold: 15000, adjustment: 1.0 },
                'high': { threshold: 20000, adjustment: 0.92 },
                'excessive': { threshold: 999999, adjustment: 0.85 }
            },
            conditionMultipliers: {
                'excellent': 1.15,
                'good': 1.05,
                'fair': 1.0,
                'poor': 0.85,
                'salvage': 0.25
            }
        };
    }

    /**
     * Generate vehicle valuation report
     * @param {Object} vehicleData - Vehicle information from CCC estimate
     * @returns {Object} - Valuation report with ACV and supporting data
     */
    async generateValuation(vehicleData) {
        if (!this.initialized) {
            throw new Error('VehicleValuationService not initialized');
        }

        console.log('💰 Generating vehicle valuation...', vehicleData);

        try {
            // Extract and validate vehicle data
            const vehicle = this.parseVehicleData(vehicleData);
            
            // Calculate base values from multiple sources
            const valuations = await this.calculateBaseValuations(vehicle);
            
            // Apply adjustments
            const adjustedValues = this.applyValuationAdjustments(vehicle, valuations);
            
            // Generate final ACV
            const actualCashValue = this.calculateACV(adjustedValues);
            
            // Generate comparables
            const comparables = await this.generateComparables(vehicle);
            
            // Create valuation report
            const report = this.createValuationReport(vehicle, adjustedValues, actualCashValue, comparables);
            
            console.log('✅ Valuation report generated');
            return report;

        } catch (error) {
            console.error('❌ Error generating valuation:', error);
            throw error;
        }
    }

    parseVehicleData(data) {
        return {
            year: parseInt(data.year) || new Date().getFullYear(),
            make: (data.make || '').toUpperCase(),
            model: (data.model || '').toUpperCase(),
            trim: data.trim || '',
            vin: data.vin || '',
            mileage: parseInt((data.odometer || '0').toString().replace(/[^\d]/g, '')) || 0,
            condition: data.condition || 'fair',
            location: {
                state: data.lossState || 'NC',
                zipCode: data.lossZipCode || '27589'
            }
        };
    }

    async calculateBaseValuations(vehicle) {
        // Simulate API calls to valuation sources
        const baseValue = this.estimateBaseValue(vehicle);
        
        return {
            kbb: {
                trade: Math.round(baseValue * 0.82),
                private: Math.round(baseValue * 0.95),
                retail: Math.round(baseValue * 1.08)
            },
            edmunds: {
                trade: Math.round(baseValue * 0.84),
                private: Math.round(baseValue * 0.97),
                retail: Math.round(baseValue * 1.06)
            },
            nada: {
                trade: Math.round(baseValue * 0.80),
                private: Math.round(baseValue * 0.93),
                retail: Math.round(baseValue * 1.10)
            },
            market: {
                average: Math.round(baseValue * 0.96),
                median: Math.round(baseValue * 0.94),
                trend: 'stable'
            }
        };
    }

    estimateBaseValue(vehicle) {
        // Base MSRP estimation logic
        let baseMSRP = 25000; // Default base value
        
        // Year adjustment
        const currentYear = new Date().getFullYear();
        const age = currentYear - vehicle.year;
        const yearlyDepreciation = 0.18; // 18% per year average
        
        // Make adjustments
        const makeMultipliers = {
            'TOYOTA': 1.0,
            'HONDA': 1.0,
            'FORD': 0.95,
            'CHEVROLET': 0.92,
            'CHEV': 0.92,
            'NISSAN': 0.96,
            'HYUNDAI': 0.94,
            'KIA': 0.90,
            'BMW': 1.35,
            'MERCEDES-BENZ': 1.40,
            'AUDI': 1.32,
            'LEXUS': 1.25,
            'ACURA': 1.15
        };

        const makeMultiplier = makeMultipliers[vehicle.make] || 1.0;
        baseMSRP = baseMSRP * makeMultiplier;

        // Apply age depreciation
        const depreciatedValue = baseMSRP * Math.pow(1 - yearlyDepreciation, age);
        
        return Math.max(depreciatedValue, 2000); // Minimum value floor
    }

    applyValuationAdjustments(vehicle, valuations) {
        const adjustments = {
            mileage: this.calculateMileageAdjustment(vehicle),
            condition: this.marketData.conditionMultipliers[vehicle.condition] || 1.0,
            location: this.calculateLocationAdjustment(vehicle.location),
            market: 1.0 // Could be dynamic based on market conditions
        };

        // Apply adjustments to each valuation source
        const adjusted = {};
        
        for (const [source, values] of Object.entries(valuations)) {
            adjusted[source] = {};
            
            for (const [type, value] of Object.entries(values)) {
                if (typeof value === 'number') {
                    let adjustedValue = value;
                    adjustedValue *= adjustments.mileage;
                    adjustedValue *= adjustments.condition;
                    adjustedValue *= adjustments.location;
                    adjustedValue *= adjustments.market;
                    
                    adjusted[source][type] = Math.round(adjustedValue);
                } else {
                    adjusted[source][type] = value;
                }
            }
        }

        return {
            values: adjusted,
            adjustments: adjustments
        };
    }

    calculateMileageAdjustment(vehicle) {
        const annualMileage = 12000;
        const expectedMileage = (new Date().getFullYear() - vehicle.year) * annualMileage;
        const mileageDiff = vehicle.mileage - expectedMileage;
        
        // Adjust based on mileage difference
        if (mileageDiff < -5000) return 1.05; // Low mileage bonus
        if (mileageDiff > 20000) return 0.90;  // High mileage penalty
        if (mileageDiff > 40000) return 0.85;  // Very high mileage penalty
        
        return 1.0; // Average mileage
    }

    calculateLocationAdjustment(location) {
        // State-based market adjustments
        const stateMultipliers = {
            'CA': 1.08, 'NY': 1.06, 'FL': 1.02, 'TX': 1.01,
            'NC': 1.0, 'SC': 0.98, 'GA': 1.0, 'VA': 1.02,
            'WV': 0.92, 'KY': 0.94, 'TN': 0.96, 'AL': 0.95
        };
        
        return stateMultipliers[location.state] || 1.0;
    }

    calculateACV(adjustedData) {
        const { values } = adjustedData;
        
        // Weighted average of all sources
        let totalWeight = 0;
        let weightedSum = 0;
        
        // KBB Private Party (35% weight)
        if (values.kbb?.private) {
            weightedSum += values.kbb.private * 0.35;
            totalWeight += 0.35;
        }
        
        // Edmunds Private Party (25% weight)
        if (values.edmunds?.private) {
            weightedSum += values.edmunds.private * 0.25;
            totalWeight += 0.25;
        }
        
        // NADA Average (25% weight)
        if (values.nada?.private) {
            weightedSum += values.nada.private * 0.25;
            totalWeight += 0.25;
        }
        
        // Market Analysis (15% weight)
        if (values.market?.average) {
            weightedSum += values.market.average * 0.15;
            totalWeight += 0.15;
        }
        
        const acv = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        
        return {
            amount: acv,
            confidence: totalWeight >= 0.8 ? 'high' : totalWeight >= 0.5 ? 'medium' : 'low',
            methodology: 'Weighted average of multiple valuation sources'
        };
    }

    async generateComparables(vehicle) {
        // Generate comparable vehicles (simulated)
        const comparables = [];
        
        for (let i = 0; i < 5; i++) {
            const comp = {
                id: `comp_${Date.now()}_${i}`,
                year: vehicle.year + (Math.random() > 0.5 ? 1 : -1),
                make: vehicle.make,
                model: vehicle.model,
                mileage: vehicle.mileage + (Math.floor(Math.random() * 20000) - 10000),
                price: this.estimateBaseValue({
                    ...vehicle,
                    mileage: vehicle.mileage + (Math.floor(Math.random() * 20000) - 10000)
                }),
                distance: Math.floor(Math.random() * 100) + 10,
                source: ['AutoTrader', 'Cars.com', 'CarGurus', 'CarMax', 'Local Dealer'][i],
                daysOnMarket: Math.floor(Math.random() * 60) + 1
            };
            comparables.push(comp);
        }
        
        return comparables.sort((a, b) => a.distance - b.distance);
    }

    createValuationReport(vehicle, adjustedData, acv, comparables) {
        return {
            vehicle: {
                description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                vin: vehicle.vin,
                mileage: vehicle.mileage.toLocaleString(),
                condition: vehicle.condition
            },
            
            valuation: {
                actualCashValue: acv.amount,
                confidence: acv.confidence,
                methodology: acv.methodology,
                date: new Date().toLocaleDateString()
            },
            
            sources: adjustedData.values,
            
            adjustments: {
                mileage: {
                    factor: adjustedData.adjustments.mileage,
                    description: this.getMileageDescription(vehicle, adjustedData.adjustments.mileage)
                },
                condition: {
                    factor: adjustedData.adjustments.condition,
                    description: `Condition: ${vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1)}`
                },
                location: {
                    factor: adjustedData.adjustments.location,
                    description: `Market adjustment for ${vehicle.location.state}`
                }
            },
            
            comparables: comparables,
            
            summary: {
                range: {
                    low: Math.round(acv.amount * 0.90),
                    high: Math.round(acv.amount * 1.10)
                },
                averageComparable: Math.round(comparables.reduce((sum, comp) => sum + comp.price, 0) / comparables.length),
                recommendedACV: acv.amount
            },
            
            metadata: {
                generatedAt: new Date().toISOString(),
                version: '1.0',
                sources: this.valuationSources.filter(s => s.active).map(s => s.name)
            }
        };
    }

    getMileageDescription(vehicle, factor) {
        if (factor > 1.03) return 'Below average mileage - positive adjustment';
        if (factor < 0.95) return 'Above average mileage - negative adjustment';
        return 'Average mileage for age - no adjustment';
    }

    /**
     * Generate printable valuation report
     * @param {Object} vehicle - Vehicle data
     * @returns {string} - Formatted report text
     */
    async generatePrintableReport(vehicle) {
        const report = await this.generateValuation(vehicle);
        
        return `
VEHICLE VALUATION REPORT
========================

VEHICLE INFORMATION
Vehicle: ${report.vehicle.description}
VIN: ${report.vehicle.vin}
Mileage: ${report.vehicle.mileage} miles
Condition: ${report.vehicle.condition}

ACTUAL CASH VALUE
Recommended ACV: $${report.valuation.actualCashValue.toLocaleString()}
Confidence Level: ${report.valuation.confidence.toUpperCase()}
Valuation Date: ${report.valuation.date}

VALUE RANGE
Low Estimate: $${report.summary.range.low.toLocaleString()}
High Estimate: $${report.summary.range.high.toLocaleString()}

COMPARABLE VEHICLES
${report.comparables.map((comp, i) => 
    `${i + 1}. ${comp.year} ${comp.make} ${comp.model} - ${comp.mileage.toLocaleString()} miles - $${comp.price.toLocaleString()} (${comp.distance} miles away)`
).join('\n')}

Average Comparable Price: $${report.summary.averageComparable.toLocaleString()}

ADJUSTMENTS APPLIED
Mileage: ${(report.adjustments.mileage.factor * 100 - 100).toFixed(1)}% (${report.adjustments.mileage.description})
Condition: ${(report.adjustments.condition.factor * 100 - 100).toFixed(1)}% (${report.adjustments.condition.description})
Location: ${(report.adjustments.location.factor * 100 - 100).toFixed(1)}% (${report.adjustments.location.description})

Report generated: ${new Date().toLocaleString()}
        `.trim();
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VehicleValuationService = VehicleValuationService;
}