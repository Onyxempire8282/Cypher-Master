/**
 * SIMPLIFIED TOTAL LOSS CONTROLLER
 * Uses Google Docs API for document processing and BCIF generation
 * Simple workflow: Upload PDF → Process with Google Docs → Download BCIF
 */

class TotalLossController {
    constructor() {
        this.uploadedFile = null;
        this.extractedData = null;
        this.generatedDocuments = {};
        
        // Google Docs Service - main processor
        this.googleDocsService = null;
        
        this.init();
    }

    async init() {
        console.log('📋 Total Loss Controller initializing...');
        
        // Initialize Google Docs Service
        if (window.GoogleDocsService) {
            this.googleDocsService = new GoogleDocsService();
            await this.googleDocsService.init();
        }
        
        this.setupEventListeners();
        console.log('✅ Total Loss Controller ready');
    }

    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('pdfFileInput');
        const uploadZone = document.getElementById('uploadZone');
        const processBtn = document.getElementById('processFileBtn');
        const removeFileBtn = document.getElementById('removeFileBtn');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }

        if (uploadZone) {
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('drag-over');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type === 'application/pdf') {
                    this.handleFileUpload(files[0]);
                }
            });

            uploadZone.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }

        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processDocument();
            });
        }

        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                this.removeFile();
            });
        }
    }

    handleFileUpload(file) {
        if (!file || file.type !== 'application/pdf') {
            this.showNotification('Please select a valid PDF file', 'error');
            return;
        }

        this.uploadedFile = file;
        
        // Update UI
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        
        // Show file info, hide upload zone
        document.getElementById('uploadZone').style.display = 'none';
        document.getElementById('fileInfo').style.display = 'block';
        
        console.log('📄 File uploaded:', file.name);
        this.showNotification('File uploaded successfully. Click "Process Document" to continue.', 'success');
    }

    removeFile() {
        this.uploadedFile = null;
        this.extractedData = null;
        this.generatedDocuments = {};
        
        // Reset UI
        document.getElementById('uploadZone').style.display = 'block';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('workflowProgress').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'none';
        
        this.updateProgressStep(1);
    }

    async processDocument() {
        if (!this.uploadedFile) {
            this.showNotification('Please upload a PDF file first', 'error');
            return;
        }

        if (!this.googleDocsService) {
            this.showNotification('Google Docs Service not available. Please refresh the page.', 'error');
            return;
        }

        try {
            // Show progress
            document.getElementById('workflowProgress').style.display = 'block';
            
            // Step 1: Send PDF to Google Docs for processing
            this.updateProgressStep(1, 'processing');
            console.log('📊 Sending PDF to Google Docs API for processing...');
            
            const processingResult = await this.googleDocsService.processCCCEstimate(this.uploadedFile);
            this.extractedData = processingResult.extractedData;
            this.updateProgressStep(1, 'completed');

            // Step 2: Generate BCIF using Google Docs
            this.updateProgressStep(2, 'processing');
            console.log('📋 Generating BCIF form using Google Docs...');
            
            this.generatedDocuments.bcif = await this.googleDocsService.generateBCIF(this.extractedData);
            this.updateProgressStep(2, 'completed');

            // Step 3: Generate supporting documents
            this.updateProgressStep(3, 'processing');
            console.log('📄 Generating supporting documents...');
            
            this.generatedDocuments.summary = await this.googleDocsService.generateLossSummary(this.extractedData);
            this.generatedDocuments.valuation = await this.googleDocsService.generateValuation(this.extractedData);
            this.updateProgressStep(3, 'completed');

            // Step 4: Package everything
            this.updateProgressStep(4, 'processing');
            console.log('📦 Preparing download package...');
            
            await this.prepareDownloadPackage();
            this.updateProgressStep(4, 'completed');

            // Show results
            this.showResults();
            this.showNotification('✅ BCIF package generated successfully!', 'success');

        } catch (error) {
            console.error('❌ Error processing document:', error);
            this.showNotification('Error processing document: ' + error.message, 'error');
            
            // Reset progress on error
            this.updateProgressStep(1, 'pending');
        }
    }

    async prepareDownloadPackage() {
        console.log('📦 Preparing download package...');
        
        // Create download URLs for all generated documents
        this.downloadUrls = {};
        
        if (this.generatedDocuments.bcif) {
            this.downloadUrls.bcif = await this.createDownloadUrl(this.generatedDocuments.bcif, 'BCIF');
            console.log('✅ BCIF download URL created');
        }
        
        if (this.generatedDocuments.summary) {
            this.downloadUrls.summary = await this.createDownloadUrl(this.generatedDocuments.summary, 'Summary');
            console.log('✅ Summary download URL created');
        }
        
        if (this.generatedDocuments.valuation) {
            this.downloadUrls.valuation = await this.createDownloadUrl(this.generatedDocuments.valuation, 'Valuation');
            console.log('✅ Valuation download URL created');
        }
        
        // Create comparables document
        this.generatedDocuments.comparables = await this.googleDocsService.generateComparables(this.extractedData);
        this.downloadUrls.comparables = await this.createDownloadUrl(this.generatedDocuments.comparables, 'Comparables');
        console.log('✅ Comparables download URL created');
        
        console.log('📋 Available downloads:', Object.keys(this.downloadUrls));
    }

    async createDownloadUrl(document, type) {
        try {
            console.log(`🔗 Creating download URL for ${type}...`);
            
            let blob;
            let filename;
            
            // Check if we have a PDF blob (preferred)
            if (document?.pdfBlob) {
                console.log(`📄 Using PDF blob for ${type}`);
                blob = document.pdfBlob;
                filename = `${type.toUpperCase()}_${this.extractedData?.claimNumber || Date.now()}.pdf`;
            } else {
                // Fallback to text content
                console.log(`📄 Using text content for ${type}`);
                let content = document?.content;
                
                if (!content) {
                    console.warn(`⚠️ No content found for ${type}, creating default content`);
                    content = `${type.toUpperCase()} DOCUMENT
${'='.repeat(type.length + 9)}

Generated from: ${this.uploadedFile?.name || 'Unknown file'}
Generated on: ${new Date().toLocaleString()}

EXTRACTED DATA:
${JSON.stringify(this.extractedData || {}, null, 2)}

This document was generated by the Claim Cipher Total Loss System.
`;
                }
                
                blob = new Blob([content], { type: 'text/plain' });
                filename = `${type.toUpperCase()}_${this.extractedData?.claimNumber || Date.now()}.txt`;
            }
            
            const url = URL.createObjectURL(blob);
            
            console.log(`✅ Download URL created for ${type} (${blob.type})`);
            return url;
            
        } catch (error) {
            console.error(`❌ Error creating download URL for ${type}:`, error);
            return null;
        }
    }

    showResults() {
        // Hide progress, show results
        document.getElementById('workflowProgress').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';

        // Setup download buttons
        this.setupDownloadButtons();
    }

    setupDownloadButtons() {
        console.log('🔗 Setting up download buttons...');
        
        const buttons = {
            '.result-card.bcif .action-btn.primary': 'bcif',
            '.result-card.summary .action-btn.primary': 'summary', 
            '.result-card.valuation .action-btn.primary': 'valuation',
            '.result-card.comparables .action-btn.primary': 'comparables'
        };

        for (const [selector, type] of Object.entries(buttons)) {
            const btn = document.querySelector(selector);
            console.log(`🔍 Found button for ${type}:`, !!btn);
            
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    console.log(`📥 Download ${type} clicked`);
                    this.downloadDocument(type);
                };
                console.log(`✅ ${type} button connected`);
            }
        }

        // Complete package download
        const packageBtn = document.getElementById('downloadAllBtn');
        console.log('🔍 Found package download button:', !!packageBtn);
        
        if (packageBtn) {
            packageBtn.onclick = (e) => {
                e.preventDefault();
                console.log('📦 Download complete package clicked');
                this.downloadCompletePackage();
            };
            console.log('✅ Package download button connected');
        }
    }

    async downloadDocument(type) {
        console.log(`📥 Attempting to download ${type} document...`);
        console.log('Available URLs:', Object.keys(this.downloadUrls || {}));
        
        // Check if we have actual extracted data first
        if (!this.extractedData && this.uploadedFile) {
            console.log('⚠️ No extracted data available, processing document first...');
            this.showNotification('Processing document to extract data...', 'info');
            
            try {
                // Extract data from uploaded file
                this.extractedData = await this.googleDocsService.extractDataFromPDF(this.uploadedFile);
                console.log('✅ Data extracted for individual download');
            } catch (error) {
                console.error('❌ Error extracting data for download:', error);
                this.showNotification('Error processing document. Please try again.', 'error');
                return;
            }
        }
        
        // Check if we still don't have data
        if (!this.extractedData) {
            this.showNotification('Please upload and process a CCC estimate first.', 'warning');
            return;
        }
        
        // Check if we have a pre-generated URL
        let url = this.downloadUrls?.[type];
        
        // If no URL exists, generate the document on-demand
        if (!url) {
            console.log(`🔄 No pre-generated URL for ${type}, generating on-demand...`);
            
            try {
                // Generate document on-demand
                const document = await this.generateDocumentOnDemand(type);
                if (document) {
                    url = await this.createDownloadUrl(document, type);
                    // Store for future use
                    if (!this.downloadUrls) this.downloadUrls = {};
                    this.downloadUrls[type] = url;
                }
            } catch (error) {
                console.error(`❌ Error generating ${type} document:`, error);
                this.showNotification(`Error generating ${type} document: ${error.message}`, 'error');
                return;
            }
        }

        if (!url) {
            console.error(`❌ Could not create download URL for ${type}`);
            this.showNotification(`${type} document could not be generated`, 'error');
            return;
        }

        try {
            // Determine file extension based on document type
            const fileExtension = url.includes('.pdf') || (document && document.pdfBlob) ? 'pdf' : 'txt';
            const filename = `${type.toUpperCase()}_${this.extractedData?.claimNumber || Date.now()}.${fileExtension}`;
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`✅ ${type} document download triggered (${filename})`);
            this.showNotification(`${type} document downloaded as ${fileExtension.toUpperCase()}`, 'success');
            
        } catch (error) {
            console.error(`❌ Error downloading ${type}:`, error);
            this.showNotification(`Error downloading ${type}: ${error.message}`, 'error');
        }
    }

    async generateDocumentOnDemand(type) {
        console.log(`🔄 Generating ${type} document on-demand...`);
        
        // If no extracted data, try to extract basic info from file
        if (!this.extractedData && this.uploadedFile) {
            console.log('📊 No extracted data, generating basic data from filename...');
            this.extractedData = await this.googleDocsService.extractDataFromPDF(this.uploadedFile);
        }
        
        // If still no data, create minimal data
        if (!this.extractedData) {
            console.log('📝 Creating minimal data for document generation...');
            this.extractedData = {
                claimNumber: Date.now().toString(),
                lossDate: new Date().toLocaleDateString(),
                insuredFirstName: 'N/A',
                insuredLastName: 'N/A',
                year: 'Unknown',
                make: 'Unknown',
                model: 'Unknown',
                vin: 'Not Available'
            };
        }

        // Generate the specific document type
        switch (type) {
            case 'bcif':
                return await this.googleDocsService.generateBCIF(this.extractedData);
            case 'summary':
                return await this.googleDocsService.generateLossSummary(this.extractedData);
            case 'valuation':
                return await this.googleDocsService.generateValuation(this.extractedData);
            case 'comparables':
                return await this.googleDocsService.generateComparables(this.extractedData);
            default:
                throw new Error(`Unknown document type: ${type}`);
        }
    }

    async downloadCompletePackage() {
        console.log('📦 Total Loss Controller: Download complete package called');
        console.log('📋 Upload file:', !!this.uploadedFile);
        console.log('📋 Extracted data:', !!this.extractedData);
        
        // Allow download even without full processing - generate on demand
        if (!this.uploadedFile) {
            console.log('❌ No file uploaded');
            this.showNotification('Please upload a file first.', 'error');
            return;
        }

        try {
            console.log('🔄 Generating complete package - downloading all PDFs...');
            this.showNotification('Generating all documents... This may take a moment.', 'info');
            
            // Generate basic data if not already available
            if (!this.extractedData) {
                console.log('📊 Extracting data for package...');
                this.extractedData = await this.googleDocsService.extractDataFromPDF(this.uploadedFile);
            }
            
            // Generate and download each document as separate PDF
            const documentTypes = ['bcif', 'summary', 'valuation', 'comparables'];
            let successfulDownloads = 0;
            
            for (const type of documentTypes) {
                try {
                    console.log(`🔄 Downloading ${type}...`);
                    
                    // Generate document on-demand if needed
                    const document = await this.generateDocumentOnDemand(type);
                    
                    if (document && document.pdfBlob) {
                        // Create download URL and trigger download
                        const url = URL.createObjectURL(document.pdfBlob);
                        const filename = `${type.toUpperCase()}_${this.extractedData?.claimNumber || Date.now()}.pdf`;
                        
                        // Trigger download with small delay between downloads
                        setTimeout(() => {
                            const link = window.document.createElement('a');
                            link.href = url;
                            link.download = filename;
                            link.style.display = 'none';
                            
                            window.document.body.appendChild(link);
                            link.click();
                            window.document.body.removeChild(link);
                            
                            // Clean up URL after download
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }, successfulDownloads * 500); // 500ms delay between downloads
                        
                        successfulDownloads++;
                        console.log(`✅ ${type} queued for download`);
                    } else {
                        console.warn(`⚠️ No PDF generated for ${type}`);
                    }
                } catch (error) {
                    console.error(`❌ Error downloading ${type}:`, error);
                }
            }

            if (successfulDownloads > 0) {
                console.log(`✅ Complete package: ${successfulDownloads} PDF documents will download`);
                this.showNotification(`Complete package downloading: ${successfulDownloads} PDF documents`, 'success');
            } else {
                this.showNotification('Error: No documents could be generated', 'error');
            }

        } catch (error) {
            console.error('❌ Error downloading package:', error);
            this.showNotification('Error downloading package: ' + error.message, 'error');
        }
    }

    updateProgressStep(step, status = 'pending') {
        const stepElement = document.getElementById(`step${step}`);
        if (!stepElement) return;

        // Reset all classes
        stepElement.classList.remove('pending', 'processing', 'completed');
        
        // Add current status
        stepElement.classList.add(status);
        
        // Update status icon
        const statusElement = stepElement.querySelector('.step-status');
        if (statusElement) {
            switch (status) {
                case 'processing':
                    statusElement.textContent = '⏳';
                    break;
                case 'completed':
                    statusElement.textContent = '✓';
                    break;
                default:
                    statusElement.textContent = '○';
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `total-loss-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            ${message}
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TotalLossController = TotalLossController;
}