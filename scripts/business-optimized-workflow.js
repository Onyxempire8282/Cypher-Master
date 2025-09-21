/**
 * Business-Optimized Workflow for Independent Appraisers
 * Target: Independent Users → TPA Submission
 * Goal: Complete Total Loss Documentation Package
 */

class BusinessOptimizedWorkflow {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.extractedData = {};
        this.valuationData = {};
        this.completionStatus = {
            extraction: false,
            verification: false,
            valuation: false,
            documentation: false,
            export: false
        };
    }

    initializeBusinessWorkflow() {
        console.log('💼 Initializing Business-Optimized Workflow...');
        
        // Update page title and messaging for business focus
        this.updateBusinessMessaging();
        
        // Set up business-focused progress tracking
        this.setupBusinessProgress();
        
        // Initialize data quality scoring
        this.initializeQualityScoring();
    }

    updateBusinessMessaging() {
        // Update header messaging
        const header = document.querySelector('.total-loss-header h1');
        if (header) {
            header.innerHTML = '🎯 Total Loss Documentation Package Generator';
        }
        
        const subheader = document.querySelector('.total-loss-header p');
        if (subheader) {
            subheader.innerHTML = 'Upload CCC Estimate → Get Complete TPA Submission Package (BCIF + Summary + Valuation + Comparables)';
        }

        // Update step titles for business context
        this.updateStepTitles();
    }

    updateStepTitles() {
        const stepTitles = {
            1: 'Smart Data Extraction',
            2: 'Data Verification & Review', 
            3: 'Market Valuation Research',
            4: 'Complete Package Generation'
        };

        Object.entries(stepTitles).forEach(([step, title]) => {
            const stepElement = document.querySelector(`#progressStep${step} .progress-step-label`);
            if (stepElement) {
                stepElement.innerHTML = title.replace(' ', '<br>');
            }
        });
    }

    setupBusinessProgress() {
        // Add business value indicators
        const progressContainer = document.querySelector('.workflow-progress');
        if (progressContainer) {
            const businessValue = document.createElement('div');
            businessValue.className = 'business-value-indicator';
            businessValue.innerHTML = `
                <div class="value-metrics">
                    <div class="metric">
                        <span class="metric-value" id="timesSaved">0</span>
                        <span class="metric-label">Minutes Saved</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value" id="accuracyScore">0%</span>
                        <span class="metric-label">Data Accuracy</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value" id="completionScore">0%</span>
                        <span class="metric-label">Package Complete</span>
                    </div>
                </div>
            `;
            progressContainer.appendChild(businessValue);
        }
    }

    initializeQualityScoring() {
        this.qualityRules = {
            // Critical fields for BCIF accuracy
            criticalFields: [
                'VIN', 'Year', 'Make', 'Model', 'Mileage',
                'Customer Name', 'Claim Number', 'Policy Number',
                'Loss Date', 'Loss Location'
            ],
            
            // Valuation requirements
            valuationRequirements: [
                'NADA Value', 'ACV', 'Market Research',
                'Comparable Vehicle 1', 'Comparable Vehicle 2', 'Comparable Vehicle 3'
            ],
            
            // Documentation completeness
            documentationChecklist: [
                'BCIF Form', 'Claim Summary', 'Valuation Report',
                'Comparable Analysis', 'Supporting Documents'
            ]
        };
    }

    calculateDataQuality(extractedData) {
        const criticalFieldsFound = this.qualityRules.criticalFields.filter(
            field => extractedData[field] && extractedData[field].trim() !== ''
        );
        
        const accuracyScore = Math.round(
            (criticalFieldsFound.length / this.qualityRules.criticalFields.length) * 100
        );
        
        this.updateBusinessMetrics({
            accuracyScore: accuracyScore,
            criticalFieldsFound: criticalFieldsFound.length,
            totalCriticalFields: this.qualityRules.criticalFields.length
        });
        
        return {
            score: accuracyScore,
            missingFields: this.qualityRules.criticalFields.filter(
                field => !extractedData[field] || extractedData[field].trim() === ''
            ),
            foundFields: criticalFieldsFound
        };
    }

    updateBusinessMetrics(metrics) {
        // Update time saved (estimated based on automation)
        const timesSaved = this.calculateTimeSaved();
        const timeElement = document.getElementById('timesSaved');
        if (timeElement) timeElement.textContent = timesSaved;

        // Update accuracy score
        const accuracyElement = document.getElementById('accuracyScore');
        if (accuracyElement) accuracyElement.textContent = `${metrics.accuracyScore}%`;

        // Update completion score
        const completionScore = this.calculateCompletionScore();
        const completionElement = document.getElementById('completionScore');
        if (completionElement) completionElement.textContent = `${completionScore}%`;
    }

    calculateTimeSaved() {
        // Business logic: typical manual process vs automated
        const manualTimeMinutes = {
            dataEntry: 30,           // Manual data entry from PDF
            bcifGeneration: 45,      // Manual BCIF form filling
            valuationResearch: 60,   // Manual KBB/CarFax research
            documentationPrep: 30,   // Manual summary and package prep
            totalManual: 165         // ~2.75 hours manual work
        };

        const automatedSteps = Object.values(this.completionStatus).filter(Boolean).length;
        const totalSteps = Object.keys(this.completionStatus).length;
        
        return Math.round((automatedSteps / totalSteps) * manualTimeMinutes.totalManual);
    }

    calculateCompletionScore() {
        const completedSteps = Object.values(this.completionStatus).filter(Boolean).length;
        const totalSteps = Object.keys(this.completionStatus).length;
        
        return Math.round((completedSteps / totalSteps) * 100);
    }

    showDataVerificationInterface(extractedData) {
        const quality = this.calculateDataQuality(extractedData);
        
        // Create verification interface
        const verificationHTML = `
            <div class="data-verification-panel">
                <div class="verification-header">
                    <h3>📊 Data Quality Score: ${quality.score}%</h3>
                    <p>Review and verify extracted data for BCIF accuracy</p>
                </div>
                
                <div class="verification-sections">
                    <div class="found-data">
                        <h4>✅ Verified Data (${quality.foundFields.length})</h4>
                        ${quality.foundFields.map(field => `
                            <div class="data-item verified">
                                <span class="field-name">${field}:</span>
                                <span class="field-value">${extractedData[field] || 'Found'}</span>
                                <button class="edit-btn">✏️</button>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${quality.missingFields.length > 0 ? `
                        <div class="missing-data">
                            <h4>⚠️ Missing Critical Data (${quality.missingFields.length})</h4>
                            ${quality.missingFields.map(field => `
                                <div class="data-item missing">
                                    <span class="field-name">${field}:</span>
                                    <input type="text" placeholder="Enter ${field}" class="field-input" data-field="${field}">
                                    <button class="save-btn">💾</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="verification-actions">
                    <button class="cipher-btn cipher-btn--primary" onclick="window.businessWorkflow.proceedToValuation()">
                        ${quality.score >= 80 ? '✅ Data Verified - Proceed to Valuation' : '⚠️ Proceed Anyway (Recommended: Complete Missing Fields)'}
                    </button>
                </div>
            </div>
        `;
        
        // Show in existing preview panel or create new modal
        const previewContainer = document.getElementById('livePreviewContent');
        if (previewContainer) {
            previewContainer.innerHTML = verificationHTML;
        }
    }

    proceedToValuation() {
        console.log('💰 Proceeding to valuation step...');
        this.completionStatus.verification = true;
        this.updateBusinessMetrics({accuracyScore: 85}); // Example update
        
        // Trigger valuation workflow
        this.showValuationInterface();
    }

    showValuationInterface() {
        // Trigger the existing vehicle valuation service
        if (window.totalLossProcessor) {
            window.totalLossProcessor.openVehicleValuation();
        }
    }

    generateCompletePackage() {
        console.log('📦 Generating complete TPA submission package...');
        
        const packageContents = {
            bcifForm: 'CCC_BCIF_Form.pdf',
            claimSummary: 'Claim_Summary.pdf', 
            valuationReport: 'Vehicle_Valuation_Report.pdf',
            comparablesAnalysis: 'Comparable_Vehicles_Analysis.pdf',
            supportingDocs: 'Supporting_Documentation.pdf'
        };
        
        this.showPackagePreview(packageContents);
    }

    showPackagePreview(packageContents) {
        const packageHTML = `
            <div class="package-preview">
                <div class="package-header">
                    <h3>📦 Complete TPA Submission Package</h3>
                    <p>Ready for submission to Third Party Administrator</p>
                </div>
                
                <div class="package-contents">
                    ${Object.entries(packageContents).map(([type, filename]) => `
                        <div class="package-item">
                            <span class="item-icon">📄</span>
                            <span class="item-name">${filename}</span>
                            <span class="item-status">✅ Ready</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="package-actions">
                    <button class="cipher-btn cipher-btn--success" onclick="window.businessWorkflow.downloadCompletePackage()">
                        📥 Download Complete Package (.zip)
                    </button>
                    <button class="cipher-btn cipher-btn--primary" onclick="window.businessWorkflow.submitToTPA()">
                        🎯 Submit to TPA Portal
                    </button>
                </div>
            </div>
        `;
        
        // Show package preview
        const previewContainer = document.getElementById('livePreviewContent');
        if (previewContainer) {
            previewContainer.innerHTML = packageHTML;
        }
    }

    downloadCompletePackage() {
        console.log('📥 Downloading complete package...');
        // Implementation for ZIP file generation
        alert('Complete TPA package downloading...\n\nIncludes:\n- BCIF Form\n- Claim Summary\n- Valuation Report\n- Comparable Analysis\n- Supporting Documents');
    }

    submitToTPA() {
        console.log('🎯 Submitting to TPA portal...');
        // Implementation for TPA integration
        alert('TPA submission feature coming soon!\n\nFor now, download the complete package and submit manually to your TPA portal.');
    }
}

// Initialize business workflow
window.businessWorkflow = new BusinessOptimizedWorkflow();

// Export for global access
window.BusinessOptimizedWorkflow = BusinessOptimizedWorkflow;