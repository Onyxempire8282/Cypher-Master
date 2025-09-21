class SMSService {
    constructor() {
        this.isEnabled = false; // DISABLED UNTIL CONFIGURED
        this.provider = 'twilio'; // Default provider
        this.config = {
            twilio: {
                accountSid: null, // Will need to be configured
                authToken: null,  // Will need to be configured
                fromNumber: null, // Will need to be configured
                baseUrl: 'https://api.twilio.com/2010-04-01'
            },
            aws: {
                accessKeyId: null,
                secretAccessKey: null,
                region: 'us-east-1'
            }
        };
        
        this.messageQueue = [];
        this.sentMessages = [];
        this.deliveryReports = new Map();
        
        console.log('📱 SMS Service initialized (INACTIVE - awaiting configuration)');
    }

    // CONFIGURE SMS PROVIDER
    async configure(provider, credentials) {
        if (provider === 'twilio') {
            this.config.twilio = {
                ...this.config.twilio,
                ...credentials
            };
            
            // Validate Twilio credentials (when enabled)
            if (this.isEnabled) {
                return await this.validateTwilioCredentials();
            }
        }
        
        console.log(`📱 SMS Service configured for ${provider} (still INACTIVE)`);
        return { success: true, provider, status: 'configured_but_inactive' };
    }

    // SEND SMS MESSAGE
    async sendSMS(phoneNumber, message, options = {}) {
        if (!this.isEnabled) {
            console.log(`📱 SMS QUEUED (INACTIVE): ${phoneNumber} - "${message.substring(0, 50)}..."`);
            
            // Queue the message for when service is enabled
            this.queueMessage({
                phoneNumber,
                message,
                options,
                queuedAt: new Date().toISOString(),
                type: 'customer_notification'
            });
            
            return { 
                success: false, 
                reason: 'sms_service_inactive',
                messageId: null,
                queued: true
            };
        }

        try {
            const result = await this.sendViaTwilio(phoneNumber, message, options);
            
            // Log successful send
            this.sentMessages.push({
                phoneNumber,
                message,
                result,
                sentAt: new Date().toISOString(),
                provider: this.provider
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ SMS send failed:', error);
            return { 
                success: false, 
                error: error.message,
                provider: this.provider
            };
        }
    }

    // TWILIO IMPLEMENTATION
    async sendViaTwilio(phoneNumber, message, options = {}) {
        const { accountSid, authToken, fromNumber } = this.config.twilio;
        
        if (!accountSid || !authToken || !fromNumber) {
            throw new Error('Twilio credentials not properly configured');
        }

        const requestBody = new URLSearchParams({
            To: this.formatPhoneNumber(phoneNumber),
            From: fromNumber,
            Body: message
        });

        // Add optional parameters
        if (options.mediaUrl) {
            requestBody.append('MediaUrl', options.mediaUrl);
        }
        if (options.statusCallback) {
            requestBody.append('StatusCallback', options.statusCallback);
        }

        const auth = btoa(`${accountSid}:${authToken}`);
        
        const response = await fetch(`${this.config.twilio.baseUrl}/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: requestBody
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Twilio API Error: ${result.message || 'Unknown error'}`);
        }

        return {
            success: true,
            messageId: result.sid,
            status: result.status,
            provider: 'twilio',
            cost: result.price || 'unknown',
            timestamp: new Date().toISOString()
        };
    }

    // CUSTOMER APPOINTMENT REMINDERS
    async sendAppointmentReminder(customer, inspection, reminderType = '24h') {
        const templates = {
            '24h': `Hello ${customer.name}, reminder: Vehicle inspection tomorrow at ${inspection.appointmentTime}. Location: ${inspection.address}. Inspector: ${inspection.inspectorName} ${inspection.inspectorPhone}. Reply CONFIRM to acknowledge.`,
            
            '2h': `Hi ${customer.name}, your vehicle inspection is in 2 hours at ${inspection.appointmentTime}. Inspector arriving at ${inspection.address}. Questions? Call ${inspection.inspectorPhone}`,
            
            '30min': `${customer.name}, your inspector will arrive in 30 minutes at ${inspection.address}. Please have your vehicle accessible and keys ready.`
        };

        const message = templates[reminderType] || templates['24h'];
        
        const result = await this.sendSMS(customer.phone, message, {
            statusCallback: `${window.location.origin}/api/sms/status/${inspection.id}`,
            type: 'appointment_reminder'
        });

        return {
            ...result,
            customerId: customer.id,
            inspectionId: inspection.id,
            reminderType
        };
    }

    // TRIAL EXPIRATION NOTIFICATIONS
    async sendTrialExpirationNotice(user, daysRemaining) {
        const templates = {
            7: `Your Claim Cipher trial expires in 7 days. Upgrade now to keep your routes, mileage tracking, and job data. Visit: ${window.location.origin}/upgrade`,
            
            3: `URGENT: Your Claim Cipher trial expires in 3 days! Don't lose access to your professional claims management tools. Upgrade today: ${window.location.origin}/upgrade`,
            
            1: `FINAL WARNING: Your Claim Cipher trial expires TOMORROW. Upgrade immediately to avoid losing access: ${window.location.origin}/upgrade`,
            
            0: `Your Claim Cipher trial has expired. Your account is now locked. Upgrade to restore access: ${window.location.origin}/upgrade`
        };

        const message = templates[daysRemaining] || templates[0];
        
        return await this.sendSMS(user.phone, message, {
            type: 'trial_expiration',
            priority: daysRemaining <= 1 ? 'high' : 'normal'
        });
    }

    // BILLING AND PAYMENT REMINDERS
    async sendBillingReminder(customer, invoice, reminderType = 'due') {
        const templates = {
            'due': `Invoice due: ${customer.name}, your Claim Cipher subscription payment of $${invoice.amount} is due ${invoice.dueDate}. Pay now: ${invoice.paymentLink}`,
            
            'overdue': `OVERDUE PAYMENT: ${customer.name}, your payment of $${invoice.amount} is ${invoice.daysOverdue} days overdue. Immediate payment required: ${invoice.paymentLink}`,
            
            'final': `FINAL NOTICE: ${customer.name}, your account will be suspended unless payment of $${invoice.amount} is received immediately: ${invoice.paymentLink}`
        };

        const message = templates[reminderType] || templates['due'];
        
        return await this.sendSMS(customer.phone, message, {
            type: 'billing_reminder',
            priority: reminderType === 'final' ? 'urgent' : 'normal'
        });
    }

    // JOB STATUS NOTIFICATIONS
    async sendJobStatusUpdate(user, job, status) {
        const templates = {
            'assigned': `New job assigned: ${job.description} at ${job.location}. Estimated value: $${job.estimatedValue}. View details: ${window.location.origin}/jobs/${job.id}`,
            
            'completed': `Job completed: ${job.description}. Please submit your final report and invoice. Dashboard: ${window.location.origin}/jobs`,
            
            'urgent': `URGENT JOB: ${job.description} requires immediate attention. Deadline: ${job.deadline}. Contact: ${job.contactPhone}`
        };

        const message = templates[status] || `Job update: ${job.description} - Status: ${status}`;
        
        return await this.sendSMS(user.phone, message, {
            type: 'job_status',
            jobId: job.id
        });
    }

    // QUEUE MANAGEMENT
    queueMessage(messageData) {
        this.messageQueue.push({
            ...messageData,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'queued'
        });
    }

    async processQueue() {
        if (!this.isEnabled) {
            console.log(`📱 Queue processing skipped - ${this.messageQueue.length} messages waiting`);
            return { processed: 0, reason: 'sms_service_inactive' };
        }

        const toProcess = [...this.messageQueue];
        this.messageQueue = [];
        
        let processed = 0;
        let failed = 0;

        for (const messageData of toProcess) {
            try {
                await this.sendSMS(messageData.phoneNumber, messageData.message, messageData.options);
                processed++;
            } catch (error) {
                console.error(`📱 Failed to send queued message:`, error);
                failed++;
            }
        }

        return { 
            processed, 
            failed, 
            timestamp: new Date().toISOString() 
        };
    }

    // UTILITY FUNCTIONS
    formatPhoneNumber(phone) {
        // Remove non-digits and format for Twilio
        const cleaned = phone.replace(/\D/g, '');
        
        // Add country code if missing (assume US)
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }
        
        return phone; // Return as-is if already formatted
    }

    validatePhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    }

    // DELIVERY REPORTING
    async handleDeliveryReport(messageId, status, errorCode = null) {
        this.deliveryReports.set(messageId, {
            status,
            errorCode,
            timestamp: new Date().toISOString()
        });

        // Update message status in sent messages
        const sentMessage = this.sentMessages.find(msg => 
            msg.result && msg.result.messageId === messageId
        );
        
        if (sentMessage) {
            sentMessage.deliveryStatus = status;
            sentMessage.deliveryTime = new Date().toISOString();
        }

        return { success: true, messageId, status };
    }

    // SERVICE STATUS AND STATISTICS
    getServiceStatus() {
        return {
            enabled: this.isEnabled,
            provider: this.provider,
            configured: this.isConfigured(),
            queueSize: this.messageQueue.length,
            totalSent: this.sentMessages.length,
            deliveryReports: this.deliveryReports.size,
            lastActivity: this.sentMessages.length > 0 ? 
                this.sentMessages[this.sentMessages.length - 1].sentAt : 'never'
        };
    }

    isConfigured() {
        if (this.provider === 'twilio') {
            const { accountSid, authToken, fromNumber } = this.config.twilio;
            return !!(accountSid && authToken && fromNumber);
        }
        return false;
    }

    // ENABLE/DISABLE SERVICE
    async enableService() {
        if (!this.isConfigured()) {
            console.log('⚠️ Cannot enable SMS service - not properly configured');
            return { 
                success: false, 
                reason: 'not_configured',
                required: ['accountSid', 'authToken', 'fromNumber']
            };
        }

        // Validate credentials before enabling
        const validation = await this.validateTwilioCredentials();
        if (!validation.success) {
            return validation;
        }

        this.isEnabled = true;
        console.log('✅ SMS Service enabled');
        
        // Process any queued messages
        const queueResult = await this.processQueue();
        
        return { 
            success: true, 
            message: 'SMS service activated',
            queueProcessed: queueResult
        };
    }

    disableService() {
        this.isEnabled = false;
        console.log('🔕 SMS Service disabled');
        return { success: true };
    }

    async validateTwilioCredentials() {
        try {
            // Test API call to validate credentials
            const { accountSid, authToken } = this.config.twilio;
            const auth = btoa(`${accountSid}:${authToken}`);
            
            const response = await fetch(`${this.config.twilio.baseUrl}/Accounts/${accountSid}.json`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });

            if (response.ok) {
                return { success: true, message: 'Twilio credentials validated' };
            } else {
                return { success: false, reason: 'invalid_credentials' };
            }
        } catch (error) {
            return { success: false, reason: 'validation_failed', error: error.message };
        }
    }
}

// Global instance (inactive)
window.SMSService = SMSService;

console.log('📱 SMS Service loaded (INACTIVE - awaiting Twilio configuration)');