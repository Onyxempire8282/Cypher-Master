/**
 * Dynamic BCIF Form Population System
 * Adapts to any CCC estimate and generates appropriate BCIF form data
 */

class DynamicBCIFPopulator {
    constructor() {
        // Equipment mapping from CCC features to BCIF codes
        this.equipmentMappings = {
            'Power Steering': 'PS',
            'Power Brakes': 'PB',
            'Power Windows': 'PW',
            'Power Locks': 'PL',
            'Power Driver Seat': 'SP',
            'Power Passenger Seat': 'PC',
            'Power Antenna': 'PA',
            'Power Mirrors': 'PM',
            'Power Trunk/Gate Release': 'PT',
            'Power Adjustable Pedals': 'PP',
            'Power Sliding Door': 'PD',
            'Dual Power Sliding Doors': 'DP',
            'Air Conditioning': 'AC',
            'Dual Air Conditioning': 'DA',
            'Climate Control': 'CL',
            'Rear Defogger': 'RD',
            'Intermittent Wipers': 'IW',
            'Tilt Wheel': 'TW',
            'Telescopic Wheel': 'TL',
            'Cruise Control': 'CC',
            'Keyless Entry': 'KE',
            'Console/Storage': 'CN',
            'Overhead Console': 'CO',
            'Entertainment Center': 'EC',
            'Navigation System': 'NV',
            'Communications System': 'C2',
            'Heads Up Display': 'HU',
            'Wood Interior Trim': 'WT',
            'Electronic Instrumentation': 'EI',
            'On Board Computer': 'IB',
            'Message Center': 'MC',
            'Memory Package': 'MM',
            'Remote Starter': 'RJ',
            'Cloth Seats': 'CS',
            'Leather Seats': 'LS',
            'Reclining/Lounge Seats': 'RL',
            'Bucket Seats': 'BS',
            'Heated Seats': 'SH',
            'Rear Heated Seats': 'RH',
            '3rd Row Seat': '3S',
            'Power Third Seat': '3P',
            'Retractable Seats': 'R3',
            '12 Passenger Seating': '2P',
            '15 Passenger Seating': '5P',
            'Captain Chairs (2)': 'B2',
            'Captain Chairs (4)': 'B4',
            'Captain Chairs (6)': 'B6',
            'AM Radio': 'AM',
            'FM Radio': 'FM',
            'Stereo': 'ST',
            'Cassette': 'CA',
            'Search/Seek': 'SE',
            'CD Player': 'CD',
            'CD Changer/Stacker': 'SK',
            'Premium Radio': 'UR',
            'Satellite Radio': 'XM',
            'Steering Wheel Touch Controls': 'TQ',
            'Auxiliary Audio Connection': 'M3',
            'Equalizer': 'EQ',
            'Aluminum/Alloy Wheels': 'AW',
            'Chrome Wheels': 'CJ',
            '20" or Larger Wheels': 'W2',
            'Deluxe Wheel Covers': 'DC',
            'Full Wheel Covers': 'FC',
            'Spoke Aluminum Wheels': 'SA',
            'Styled Steel Wheels': 'SY',
            'Wire Wheels': 'WW',
            'Wire Wheel Covers': 'WC',
            'Rally Wheels': 'RW',
            'Locking Wheels': 'KW',
            'Locking Wheel Covers': 'LC',
            'Electric Glass Roof': 'EG',
            'Electric Steel Roof': 'ES',
            'Skyview Roof': 'OR',
            'Dual Power Sunroof': 'SD',
            'Manual Steel Roof': 'MS',
            'Manual Glass Roof': 'MG',
            'Flip Roof': 'FR',
            'T-Top/Panel': 'TT',
            'Glass T-Top/Panel': 'GT',
            'Power Convertible Roof': 'VP',
            'Detachable Roof': 'RM',
            'Vinyl Covered Roof': 'VR',
            'Cabriolet Roof': 'RF',
            'Landau Roof': 'LR',
            'Padded Landau Roof': 'LP',
            'Padded Vinyl Roof': 'PV',
            'Hard Top': 'HT',
            'Drivers Side Air Bag': 'AG',
            'Driver Side Air Bag': 'AG',
            'Passenger Air Bag': 'RG',
            'Front Side Impact Air Bags': 'XG',
            'Rear Side Impact Air Bags': 'ZG',
            'Head/Curtain Air Bags': 'DG',
            'Alarm': 'TD',
            'Night Vision': 'VZ',
            'Intelligent Cruise': 'IC',
            'Parking Sensors': 'PJ',
            'Parking Sensors w/Equip': 'PX',
            'Anti-Lock Brakes (4)': 'AB',
            'Anti-Lock Brakes (2)': 'A2',
            '4-Wheel Disc Brakes': 'DB',
            '4 Wheel Disc Brakes': 'DB',
            'Roll Bar': 'RB',
            'Traction Control': 'TX',
            'Stability Control': 'T1',
            'Auto Level': 'AL',
            'Luggage/Roof Rack': 'RR',
            'Woodgrain': 'WG',
            'Rear Window Wiper': 'WP',
            'Two Tone Paint': '2T',
            'Three Stage Paint': 'HP',
            'Clearcoat Paint': 'IP',
            'Clear Coat Paint': 'IP',
            'Metallic Paint': 'MP',
            'Rear Spoiler': 'SL',
            'Fog Lamps': 'FL',
            'Tinted Glass': 'TG',
            'Privacy Glass': 'DT',
            'Body Side Moldings': 'BN',
            'Dual Mirrors': 'DM',
            'Heated Mirrors': 'HM',
            'Headlamp Washers': 'HV',
            'Signal Integrated Mirrors': 'MX',
            'Running Board/Side Steps': 'BD',
            'Power Retractable Running Boards': 'UP',
            'Xenon Headlamps': 'XE',
            'Xenon or L.E.D. Headlamps': 'XE',
            'LED Headlamps': 'XE',
            'Bed Rails': 'AR',
            'Bedliner': 'BL',
            'Bedliner (Spray On)': 'BY',
            'Deluxe Truck Cap': 'CP',
            'Grill Guard': 'GG',
            'Rear Step Bumper': 'SB',
            'Swivel Seats': 'SS',
            'Rear Sliding Window': 'SW',
            'Power Rear Window': 'PG',
            'Tool Box (Permanent)': 'TB',
            'Soft Tonneau Cover': 'TN',
            'Hard Tonneau Cover': 'TZ',
            'Trailering Package': 'TP',
            'Dual Rear Wheels': 'WD',
            'Auxiliary Fuel Tank': 'XT',
            'Bumper Cushions': 'BC',
            'Bumper Guards': 'BG',
            'California Emissions': 'EM',
            'Stone Guard': 'SG',
            'Winch': 'WI'
        };

        // Body style mappings
        this.bodyStyleMappings = {
            '2DR': '2DR',
            '2D': '2DR',
            '4DR': '4DR',
            '4D': '4DR',
            '4D UTV': 'Utility',
            'UTV': 'Utility',
            'Utility': 'Utility',
            'Hatchback': 'Hatchback',
            'Convertible': 'Convertible',
            'Wagon': 'Wagon',
            'Pickup': 'Pickup',
            'Van': 'Van'
        };

        // Transmission mappings
        this.transmissionMappings = {
            'Automatic': 'Automatic',
            'Manual': 'S5',
            '6-Speed': 'S6',
            '5-Speed': 'S5',
            '4-Speed': 'S4',
            '3-Speed': 'S3'
        };

        console.log('🔧 DynamicBCIFPopulator initialized');
    }

    /**
     * Parse any CCC estimate and generate BCIF form data
     * @param {string} cccText - Raw text content from CCC estimate
     * @returns {Object} BCIF form data ready for population
     */
    generateBCIFFormData(cccText) {
        const formData = {};
        
        // Extract basic claim information
        formData['Claim Number'] = this.extractClaimNumber(cccText) || '';
        formData['Date of Loss'] = this.extractLossDate(cccText) || '';
        formData['Adjr Name (First & Last)'] = this.extractAdjusterName(cccText) || '';
        formData['Insured\'s Name'] = this.extractInsuredName(cccText) || '';
        formData['Owner\'s Name'] = this.extractOwnerName(cccText) || '';
        formData['Owner\'s Phone'] = this.extractOwnerPhone(cccText) || '';
        formData['Loss ZIP Code'] = this.extractLossZipCode(cccText) || '';
        formData['Loss State'] = this.extractLossState(cccText) || '';
        
        // Extract vehicle information
        const vehicleInfo = this.extractVehicleInfo(cccText);
        formData['VIN'] = vehicleInfo.vin || '';
        formData['Year'] = vehicleInfo.year || '';
        formData['Make'] = vehicleInfo.make || '';
        formData['Model'] = vehicleInfo.model || '';
        formData['Mileage'] = vehicleInfo.mileage || '';
        formData['Engine Size'] = vehicleInfo.engineSize || '';
        
        // Set body style checkboxes
        const bodyStyle = this.extractBodyStyle(cccText);
        if (bodyStyle) {
            formData[bodyStyle] = true;
        }
        
        // Set transmission checkbox
        const transmission = this.extractTransmission(cccText);
        if (transmission) {
            formData[transmission] = true;
        }
        
        // Set cylinder count
        const cylinders = this.extractCylinderCount(cccText);
        if (cylinders) {
            formData[cylinders.toString()] = true;
        }
        
        // Determine loss type
        const lossType = this.determineLossType(cccText);
        if (lossType) {
            formData[lossType] = true;
        }
        
        // Extract and map equipment
        const equipment = this.extractEquipment(cccText);
        equipment.forEach(code => {
            formData[code] = true;
        });
        
        // Set default report method to Email
        formData['Email'] = true;
        
        return formData;
    }

    extractClaimNumber(text) {
        const patterns = [
            /Claim #:\s*(\w+)/i,
            /Claim Number:\s*(\w+)/i,
            /Claim:\s*(\w+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    extractLossDate(text) {
        const patterns = [
            /Date of Loss:\s*([^\n]+)/i,
            /Loss Date:\s*([^\n]+)/i,
            /DOL:\s*([^\n]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    extractAdjusterName(text) {
        const patterns = [
            /Written By:\s*([^\n]+)/i,
            /Adjuster:\s*([^\n]+)/i,
            /Adjr:\s*([^\n]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    extractInsuredName(text) {
        const patterns = [
            /Insured:\s*([^\n]+)/i,
            /Insured Name:\s*([^\n]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    extractOwnerName(text) {
        const patterns = [
            /Owner:\s*([^\n]+)/i,
            /Vehicle Owner:\s*([^\n]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    extractOwnerPhone(text) {
        const patterns = [
            /\((\d{3})\)\s*(\d{3})-(\d{4})/,
            /(\d{3})-(\d{3})-(\d{4})/,
            /\((\d{3})\)\s*(\d{3})\s*(\d{4})/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[0];
        }
        return null;
    }

    extractLossZipCode(text) {
        const zipMatch = text.match(/\b(\d{5})\b/);
        return zipMatch ? zipMatch[1] : null;
    }

    extractLossState(text) {
        const stateMatch = text.match(/\b([A-Z]{2})\s+\d{5}/);
        return stateMatch ? stateMatch[1] : null;
    }

    extractVehicleInfo(text) {
        const info = {};
        
        // VIN - 17 character alphanumeric
        const vinMatch = text.match(/VIN:\s*([A-Z0-9]{17})/i);
        info.vin = vinMatch ? vinMatch[1] : null;
        
        // Vehicle line - typically "YEAR MAKE MODEL"
        const vehicleMatch = text.match(/(\d{4})\s+([A-Z]+)\s+([^\n]+?)(?:\s+\d+[DC]|$)/i);
        if (vehicleMatch) {
            info.year = vehicleMatch[1];
            info.make = vehicleMatch[2];
            info.model = vehicleMatch[3].trim();
        }
        
        // Mileage/Odometer
        const mileageMatch = text.match(/(?:Mileage|Odometer):\s*([\d,]+)/i);
        info.mileage = mileageMatch ? mileageMatch[1].replace(/,/g, '') : null;
        
        // Engine size
        const engineMatch = text.match(/(\d+\.?\d*L?\s*(?:Hybrid)?)/i);
        info.engineSize = engineMatch ? engineMatch[1] : null;
        
        return info;
    }

    extractBodyStyle(text) {
        // Look for body style indicators
        for (const [pattern, style] of Object.entries(this.bodyStyleMappings)) {
            const regex = new RegExp(pattern.replace(/[()]/g, '\\$&'), 'i');
            if (regex.test(text)) {
                return style;
            }
        }
        return null;
    }

    extractTransmission(text) {
        for (const [pattern, trans] of Object.entries(this.transmissionMappings)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(text)) {
                return trans;
            }
        }
        return 'Automatic'; // Default assumption
    }

    extractCylinderCount(text) {
        const cylinderMatch = text.match(/(\d+)\s*[Cc]ylinder/);
        if (cylinderMatch) {
            return parseInt(cylinderMatch[1]);
        }
        
        // Try to infer from engine size
        const engineMatch = text.match(/(\d+\.?\d*)L/);
        if (engineMatch) {
            const displacement = parseFloat(engineMatch[1]);
            if (displacement <= 1.5) return 3;
            if (displacement <= 2.5) return 4;
            if (displacement <= 4.0) return 6;
            return 8;
        }
        
        return 4; // Default assumption
    }

    determineLossType(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('collision') || lowerText.includes('impact') || lowerText.includes('t-bone')) {
            return 'Collision';
        } else if (lowerText.includes('comprehensive') || lowerText.includes('theft') || lowerText.includes('vandal')) {
            return 'Comprehensive';
        } else if (lowerText.includes('liability')) {
            return 'Liability';
        }
        
        return 'Other';
    }

    extractEquipment(text) {
        const foundEquipment = [];
        
        // Search for each equipment pattern in text
        for (const [feature, code] of Object.entries(this.equipmentMappings)) {
            // Create flexible regex pattern
            const pattern = feature
                .replace(/[()]/g, '\\$&')
                .replace(/\s+/g, '\\s+')
                .replace(/\//g, '\\s*\\/\\s*');
            
            const regex = new RegExp(pattern, 'i');
            if (regex.test(text)) {
                foundEquipment.push(code);
            }
        }
        
        // Remove duplicates
        return [...new Set(foundEquipment)];
    }

    /**
     * Process CCC estimate and return complete BCIF data
     * @param {string} cccText - CCC estimate text
     * @returns {Object} Complete processing result
     */
    processCCCEstimate(cccText) {
        console.log('🔍 Processing CCC estimate with Dynamic BCIF Populator...');
        
        const bcifData = this.generateBCIFFormData(cccText);
        
        const summary = {
            textFieldsPopulated: Object.entries(bcifData).filter(([k,v]) => typeof v === 'string' && v.trim() !== '').length,
            checkboxesChecked: Object.entries(bcifData).filter(([k,v]) => v === true).length,
            totalFields: Object.keys(bcifData).length,
            vehicle: `${bcifData['Year']} ${bcifData['Make']} ${bcifData['Model']}`.trim(),
            claimNumber: bcifData['Claim Number']
        };

        console.log('✅ Dynamic parsing complete:', summary);
        
        return {
            bcifData,
            summary,
            success: true
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DynamicBCIFPopulator = DynamicBCIFPopulator;
}

console.log('📄 Dynamic BCIF Populator loaded');