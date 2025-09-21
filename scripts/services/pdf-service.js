/**
 * PDF SERVICE - Handle PDF Form Filling and Document Generation
 * Uses PDF-lib for form filling and jsPDF for document creation
 */

class PDFService {
    constructor() {
        this.initialized = false;
        this.bcifFormPath = './assets/forms/blank-bcif-form.pdf';
        
        console.log('📄 PDF Service initialized');
    }

    async init() {
        console.log('🔧 Initializing PDF Service...');
        
        // Check if PDF-lib and jsPDF are available
        if (typeof PDFLib === 'undefined') {
            console.error('❌ PDF-lib not loaded');
            return false;
        }
        
        if (typeof window.jsPDF === 'undefined' && typeof window.jsPDF?.jsPDF === 'undefined') {
            console.error('❌ jsPDF not loaded');
            return false;
        }
        
        this.initialized = true;
        console.log('✅ PDF Service ready');
        return true;
    }

    /**
     * Fill BCIF PDF form with extracted CCC data
     * @param {Object} cccData - Extracted data from CCC estimate
     * @param {Object} fieldMapping - Mapped form fields
     * @returns {Blob} - Filled PDF as blob
     */
    async fillBCIFForm(cccData, fieldMapping) {
        console.log('📋 Filling BCIF PDF form...');
        
        if (!this.initialized) {
            throw new Error('PDF Service not initialized');
        }

        try {
            // Load the blank BCIF form
            const formBytes = await this.loadBCIFForm();
            
            if (!formBytes) {
                // If we can't load the actual form, create a new PDF with the data
                return await this.createBCIFPDF(cccData, fieldMapping);
            }

            // Fill the actual PDF form
            const pdfDoc = await PDFLib.PDFDocument.load(formBytes);
            const form = pdfDoc.getForm();

            // Fill form fields based on mapping
            await this.populateFormFields(form, fieldMapping, cccData);

            // Serialize the PDF
            const pdfBytes = await pdfDoc.save();
            
            console.log('✅ BCIF form filled successfully');
            return new Blob([pdfBytes], { type: 'application/pdf' });

        } catch (error) {
            console.error('❌ Error filling BCIF form:', error);
            // Fallback to creating new PDF
            return await this.createBCIFPDF(cccData, fieldMapping);
        }
    }

    /**
     * Load the BCIF form from the assets folder
     */
    async loadBCIFForm() {
        try {
            console.log('📁 Attempting to load BCIF form from:', this.bcifFormPath);
            
            // Fetch the blank BCIF form from the assets folder
            const response = await fetch(this.bcifFormPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('✅ BCIF form loaded successfully');
            return arrayBuffer;
            
        } catch (error) {
            console.error('❌ Could not load BCIF form:', error);
            console.log('📝 Will create new BCIF PDF instead');
            return null;
        }
    }

    /**
     * Populate PDF form fields with mapped data
     */
    async populateFormFields(form, fieldMapping, cccData) {
        console.log('📝 Populating form fields...');

        // Get all form fields
        const fields = form.getFields();
        console.log(`📋 Found ${fields.length} form fields`);

        let fieldsPopulated = 0;

        // Iterate through our field mapping and fill corresponding PDF fields
        for (const [fieldName, value] of Object.entries(fieldMapping)) {
            try {
                // Try to find matching field in PDF
                const field = form.getField(fieldName);
                
                if (field) {
                    if (field.constructor.name === 'PDFTextField') {
                        field.setText(value.toString());
                        fieldsPopulated++;
                    } else if (field.constructor.name === 'PDFCheckBox') {
                        if (value === 'Yes' || value === true) {
                            field.check();
                        } else {
                            field.uncheck();
                        }
                        fieldsPopulated++;
                    }
                }
            } catch (fieldError) {
                // Field might not exist in PDF, skip it
                console.log(`⚠️ Field '${fieldName}' not found in PDF form`);
            }
        }

        console.log(`✅ Populated ${fieldsPopulated} form fields`);
    }

    /**
     * Create a new BCIF PDF document with data
     */
    async createBCIFPDF(cccData, fieldMapping) {
        console.log('📄 Creating new BCIF PDF document...');

        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            let page = pdfDoc.addPage([612, 792]); // Standard letter size
            
            // Load a standard font
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            
            const { width, height } = page.getSize();
            let yPosition = height - 50;

            // Title
            page.drawText('BASIC CLAIM INFORMATION FORM (BCIF)', {
                x: 50,
                y: yPosition,
                size: 16,
                font: boldFont,
            });
            yPosition -= 30;

            page.drawText('Generated from CCC Estimate Processing', {
                x: 50,
                y: yPosition,
                size: 10,
                font: font,
            });
            yPosition -= 40;

            // Claim Information Section
            yPosition = this.addSection(page, font, boldFont, 'CLAIM INFORMATION', yPosition, {
                'Claim Number': fieldMapping['Claim Number'] || '',
                'Owner\'s Name': fieldMapping['Owner\'s Name'] || '',
                'Owner\'s Phone': fieldMapping['Owner\'s Phone'] || '',
                'Loss Date': fieldMapping['Date of Loss'] || '',
                'Loss State': fieldMapping['Loss State'] || '',
                'Loss ZIP': fieldMapping['Loss ZIP Code'] || ''
            });

            // Vehicle Information Section
            yPosition = this.addSection(page, font, boldFont, 'VEHICLE INFORMATION', yPosition, {
                'VIN': fieldMapping['VIN'] || '',
                'Year': fieldMapping['Year'] || '',
                'Make': fieldMapping['Make'] || '',
                'Model': fieldMapping['Model'] || '',
                'Mileage': fieldMapping['Mileage'] || ''
            });

            // Vehicle Options Section
            yPosition = this.addSection(page, font, boldFont, 'VEHICLE OPTIONS', yPosition, {});
            yPosition = this.addOptionsSection(page, font, fieldMapping, yPosition);

            // Add page footer
            page.drawText(`Generated: ${new Date().toLocaleString()}`, {
                x: 50,
                y: 30,
                size: 8,
                font: font,
            });

            page.drawText('Claim Cipher Total Loss System', {
                x: width - 200,
                y: 30,
                size: 8,
                font: font,
            });

            const pdfBytes = await pdfDoc.save();
            console.log('✅ BCIF PDF created successfully');
            
            return new Blob([pdfBytes], { type: 'application/pdf' });

        } catch (error) {
            console.error('❌ Error creating BCIF PDF:', error);
            throw error;
        }
    }

    /**
     * Add a section to the PDF with key-value pairs
     */
    addSection(page, font, boldFont, title, yPosition, data) {
        // Section title
        page.drawText(title, {
            x: 50,
            y: yPosition,
            size: 12,
            font: boldFont,
        });
        yPosition -= 20;

        // Section data
        for (const [key, value] of Object.entries(data)) {
            page.drawText(`${key}: ${value}`, {
                x: 70,
                y: yPosition,
                size: 10,
                font: font,
            });
            yPosition -= 15;
        }

        return yPosition - 10;
    }

    /**
     * Add vehicle options section with checkboxes
     */
    addOptionsSection(page, font, fieldMapping, yPosition) {
        const options = [
            'PS - Power Steering', 'PB - Power Brakes', 'PW - Power Windows', 'PL - Power Locks',
            'AC - Air Conditioning', 'CC - Cruise Control', 'LS - Leather Seats', 'BS - Bucket Seats',
            'FM - FM Radio', 'ST - Stereo', 'AW - Alloy Wheels', 'AB - Anti-Lock Brakes'
        ];

        let x = 70;
        let y = yPosition;
        let column = 0;

        options.forEach(option => {
            const optionCode = option.split(' - ')[0];
            const isSelected = fieldMapping[optionCode] === 'Yes';
            
            // Draw checkbox
            page.drawRectangle({
                x: x,
                y: y - 2,
                width: 8,
                height: 8,
                borderColor: PDFLib.rgb(0, 0, 0),
                borderWidth: 1,
            });

            if (isSelected) {
                page.drawText('✓', {
                    x: x + 1,
                    y: y - 1,
                    size: 8,
                    font: font,
                });
            }

            // Draw option text
            page.drawText(option, {
                x: x + 15,
                y: y,
                size: 9,
                font: font,
            });

            // Move to next position
            y -= 15;
            if (y < 100) {
                // Move to next column
                x += 250;
                y = yPosition;
                column++;
            }

            if (column >= 2) {
                // Return new Y position if we've used both columns
                return y - 20;
            }
        });

        return Math.min(y, yPosition - 20);
    }

    /**
     * Generate professional valuation report as PDF
     */
    async createValuationPDF(valuationContent) {
        console.log('📊 Creating valuation PDF...');

        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            let page = pdfDoc.addPage([612, 792]);
            
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            
            // Split content into lines and add to PDF
            const lines = valuationContent.split('\n');
            let yPosition = 750;
            
            lines.forEach(line => {
                // Sanitize line to prevent encoding issues
                line = this.sanitizeTextForPDF(line);
                if (yPosition < 50) {
                    // Add new page if needed
                    const newPage = pdfDoc.addPage([612, 792]);
                    page = newPage;
                    yPosition = 750;
                }

                const useFont = line.includes('REPORT') || line.includes('VALUATION') || 
                               line.startsWith('-') ? boldFont : font;
                const fontSize = line.includes('VEHICLE VALUATION REPORT') ? 14 : 
                               line.startsWith('-') || line.includes(':') ? 10 : 9;

                page.drawText(line, {
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font: useFont,
                });

                yPosition -= 12;
            });

            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });

        } catch (error) {
            console.error('❌ Error creating valuation PDF:', error);
            throw error;
        }
    }

    /**
     * Generate comparables report as PDF  
     */
    async createComparablesPDF(comparablesContent) {
        console.log('🔍 Creating comparables PDF...');

        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            let page = pdfDoc.addPage([612, 792]);
            
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            
            const lines = comparablesContent.split('\n');
            let yPosition = 750;
            
            lines.forEach(line => {
                // Sanitize line to prevent encoding issues
                line = this.sanitizeTextForPDF(line);
                if (yPosition < 50) {
                    page = pdfDoc.addPage([612, 792]);
                    yPosition = 750;
                }

                const useFont = line.includes('REPORT') || line.includes('DEALER') || 
                               line.startsWith('=') ? boldFont : font;
                const fontSize = line.includes('COMPARABLE VEHICLES REPORT') ? 14 : 
                               line.startsWith('=') || line.includes('DEALER') ? 10 : 9;

                page.drawText(line.substring(0, 85), { // Limit line length
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font: useFont,
                });

                yPosition -= 12;
            });

            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });

        } catch (error) {
            console.error('❌ Error creating comparables PDF:', error);
            throw error;
        }
    }

    /**
     * Generate claim summary as PDF
     */
    async createSummaryPDF(summaryContent) {
        console.log('📋 Creating summary PDF...');

        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            let page = pdfDoc.addPage([612, 792]);
            
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            
            const lines = summaryContent.split('\n');
            let yPosition = 750;
            
            lines.forEach(line => {
                // Sanitize line to prevent encoding issues
                line = this.sanitizeTextForPDF(line);
                if (yPosition < 50) {
                    page = pdfDoc.addPage([612, 792]);
                    yPosition = 750;
                }

                const useFont = line.includes('SUMMARY') || line.includes('INFORMATION') || 
                               line.startsWith('-') ? boldFont : font;
                const fontSize = line.includes('TOTAL LOSS CLAIM SUMMARY') ? 14 : 
                               line.startsWith('-') || line.includes('INFORMATION') ? 10 : 9;

                page.drawText(line.substring(0, 80), {
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font: useFont,
                });

                yPosition -= 12;
            });

            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });

        } catch (error) {
            console.error('❌ Error creating summary PDF:', error);
            throw error;
        }
    }

    /**
     * Create download URL for PDF blob
     */
    createDownloadURL(pdfBlob, filename) {
        const url = URL.createObjectURL(pdfBlob);
        return { url, filename };
    }

    /**
     * Sanitize text for PDF to prevent WinAnsi encoding errors
     */
    sanitizeTextForPDF(text) {
        return text
            .replace(/─/g, '-')  // Replace box drawing horizontal
            .replace(/═/g, '=')  // Replace double horizontal
            .replace(/│/g, '|')  // Replace box drawing vertical
            .replace(/║/g, '|')  // Replace double vertical
            .replace(/┌/g, '+')  // Replace box drawing corners
            .replace(/┐/g, '+')
            .replace(/└/g, '+')
            .replace(/┘/g, '+')
            .replace(/├/g, '+')  // Replace box drawing tees
            .replace(/┤/g, '+')
            .replace(/┬/g, '+')
            .replace(/┴/g, '+')
            .replace(/┼/g, '+')  // Replace box drawing cross
            .replace(/[^\x20-\x7E]/g, '?'); // Replace any non-printable ASCII with ?
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.PDFService = PDFService;
}

console.log('📄 PDF Service loaded');