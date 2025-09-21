class NotificationManager {
    constructor() {
        this.isActive = false; // DISABLED UNTIL SCHEDULER IS READY
        this.notificationChannels = {
            sms: false,      // Will integrate with SMS service
            email: false,    // Will integrate with email service
            ui: true,        // UI notifications always available
            push: false      // Future mobile push notifications
        };
        
        this.notificationQueue = [];
        this.sentNotifications = [];
        this.templates = this.initializeTemplates();
    }

    initializeTemplates() {
        return {
            // TRIAL LOCKOUT TEMPLATES
            trialWarning: {
                sms: 'Your Claim Cipher trial expires in {days} days. Upgrade now to keep your data: {upgradeLink}',
                email: {
                    subject: 'Claim Cipher Trial Expiring in {days} Days',
                    body: `Your professional claims management trial expires soon. 
                           Don't lose access to your routes, mileage tracking, and job data.
                           Upgrade now: {upgradeLink}`
                },
                ui: 'Trial expires in {days} days - upgrade to continue'
            },

            trialExpired: {
                sms: 'Your Claim Cipher trial has expired. Upgrade to restore access: {upgradeLink}',
                email: {
                    subject: 'Claim Cipher Trial Expired - Immediate Action Required',
                    body: `Your trial has expired and your account is now locked.
                           Your data is safe for 30 days. Upgrade immediately: {upgradeLink}`
                },
                ui: 'Trial expired - account locked. Upgrade to restore access.'
            },

            // APPOINTMENT REMINDER TEMPLATES
            appointmentReminder24h: {
                sms: `Hello {customerName}, reminder: Vehicle inspection tomorrow at {appointmentTime}. 
                      Location: {address}. Inspector: {inspectorName} {inspectorPhone}. Reply CONFIRM.`,
                email: {
                    subject: 'Vehicle Inspection Reminder - Tomorrow at {appointmentTime}',
                    body: `Dear {customerName},
                           
                           This is a reminder of your vehicle inspection appointment:
                           
                           Date: Tomorrow, {appointmentDate}
                           Time: {appointmentTime}
                           Location: {address}
                           Inspector: {inspectorName}
                           Contact: {inspectorPhone}
                           
                           Please ensure your vehicle is accessible and you have your keys ready.
                           
                           If you need to reschedule, please call us immediately.`
                },
                ui: 'Inspection reminder sent to {customerName} for tomorrow'
            },

            appointmentReminder2h: {
                sms: `Hi {customerName}, your vehicle inspection is in 2 hours at {appointmentTime}. 
                      Inspector arriving at {address}. Keys ready? Questions: {inspectorPhone}`,
                email: null, // No email for 2-hour reminder
                ui: '2-hour inspection reminder sent to {customerName}'
            },

            // MILEAGE REPORT TEMPLATES
            weeklyMileageReport: {
                email: {
                    subject: 'Weekly Mileage Report - {weekStartDate} to {weekEndDate}',
                    body: `Your weekly mileage summary is attached.
                           
                           Total Miles: {totalMiles}
                           Business Miles: {businessMiles}
                           Estimated Reimbursement: {estimatedReimbursement}
                           
                           Firm Breakdown:
                           {firmBreakdown}
                           
                           Download detailed report: {reportLink}`
                },
                ui: 'Weekly mileage report generated and emailed'
            },

            // JOB REMINDER TEMPLATES
            openJobsReminder: {
                sms: `You have {jobCount} open jobs requiring attention. 
                      Highest priority: {topJobDescription}. View all: {dashboardLink}`,
                email: {
                    subject: 'Open Jobs Requiring Attention - {jobCount} Items',
                    body: `You have {jobCount} open jobs that need your attention:
                           
                           HIGH PRIORITY:
                           {highPriorityJobs}
                           
                           NORMAL PRIORITY:
                           {normalPriorityJobs}
                           
                           View your dashboard: {dashboardLink}`
                },
                ui: '{jobCount} open jobs require attention'
            },

            // BILLING REMINDER TEMPLATES
            billingDue: {
                email: {
                    subject: 'Invoice Due - {firmName} - Amount: {amount}',
                    body: `Dear {firmName},
                           
                           Your invoice is due for payment:
                           
                           Invoice #: {invoiceNumber}
                           Amount Due: {amount}
                           Due Date: {dueDate}
                           Services Period: {servicePeriod}
                           
                           Please submit payment by {dueDate} to avoid late fees.
                           
                           Questions? Contact: {contactInfo}`
                },
                ui: 'Billing reminder sent to {firmName} - {amount} due'
            },

            billingOverdue: {
                sms: 'URGENT: {firmName} payment overdue. Amount: {amount}. Immediate payment required.',
                email: {
                    subject: 'OVERDUE PAYMENT - {firmName} - {amount}',
                    body: `PAYMENT OVERDUE NOTICE
                           
                           Your account has an overdue balance:
                           
                           Invoice #: {invoiceNumber}
                           Amount: {amount}
                           Original Due Date: {originalDueDate}
                           Days Overdue: {daysOverdue}
                           
                           IMMEDIATE PAYMENT REQUIRED to avoid service interruption.`
                },
                ui: 'OVERDUE: {firmName} - {amount} ({daysOverdue} days)'
            }
        };
    }

    // QUEUE NOTIFICATION FOR PROCESSING
    queueNotification(type, data, channels = ['ui']) {
        if (!this.isActive) {
            console.log(`📨 Notification queued (INACTIVE): ${type}`);
            return { success: false, reason: 'notification_manager_inactive' };
        }

        const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            channels,
            createdAt: new Date().toISOString(),
            status: 'queued',
            attempts: 0
        };

        this.notificationQueue.push(notification);
        
        return { success: true, notificationId: notification.id };
    }

    // PROCESS NOTIFICATION TEMPLATES
    processTemplate(templateType, data, channel) {
        const template = this.templates[templateType];
        if (!template || !template[channel]) {
            return null;
        }

        let content = template[channel];
        
        if (channel === 'email') {
            return {
                subject: this.replaceTemplateVariables(content.subject, data),
                body: this.replaceTemplateVariables(content.body, data)
            };
        }
        
        return this.replaceTemplateVariables(content, data);
    }

    replaceTemplateVariables(template, data) {
        return template.replace(/\{([^}]+)\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    // SEND NOTIFICATIONS (WHEN ACTIVE)
    async sendNotification(notification) {
        if (!this.isActive) {
            console.log(`📨 Send skipped (INACTIVE): ${notification.type}`);
            return { success: false, reason: 'notification_manager_inactive' };
        }

        const results = [];

        for (const channel of notification.channels) {
            try {
                const content = this.processTemplate(notification.type, notification.data, channel);
                
                if (!content) continue;

                let result;
                switch (channel) {
                    case 'sms':
                        result = await this.sendSMS(notification.data.phone, content);
                        break;
                    case 'email':
                        result = await this.sendEmail(notification.data.email, content);
                        break;
                    case 'ui':
                        result = await this.sendUINotification(content);
                        break;
                    default:
                        result = { success: false, reason: 'unsupported_channel' };
                }

                results.push({ channel, ...result });
                
            } catch (error) {
                results.push({ 
                    channel, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        notification.status = results.some(r => r.success) ? 'sent' : 'failed';
        notification.results = results;
        notification.sentAt = new Date().toISOString();
        
        this.sentNotifications.push(notification);
        
        return { success: true, results };
    }

    // CHANNEL-SPECIFIC SENDING (PLACEHOLDER IMPLEMENTATIONS)
    async sendSMS(phone, message) {
        console.log(`📱 SMS (INACTIVE): ${phone} - ${message.substring(0, 50)}...`);
        return { success: false, reason: 'sms_service_not_configured' };
    }

    async sendEmail(email, content) {
        console.log(`📧 Email (INACTIVE): ${email} - ${content.subject}`);
        return { success: false, reason: 'email_service_not_configured' };
    }

    async sendUINotification(message) {
        // UI notifications work even when inactive for testing
        if (window.showNotification) {
            window.showNotification(message, 'info');
            return { success: true, method: 'ui_notification' };
        }
        
        console.log(`🔔 UI Notification: ${message}`);
        return { success: true, method: 'console_log' };
    }

    // PROCESS NOTIFICATION QUEUE
    async processNotificationQueue() {
        if (!this.isActive) {
            console.log(`📨 Queue processing skipped - ${this.notificationQueue.length} notifications waiting`);
            return { processed: 0, reason: 'notification_manager_inactive' };
        }

        const toProcess = [...this.notificationQueue];
        this.notificationQueue = [];
        
        let processed = 0;
        for (const notification of toProcess) {
            await this.sendNotification(notification);
            processed++;
        }

        return { processed, timestamp: new Date().toISOString() };
    }

    // NOTIFICATION MANAGER STATUS
    getStatus() {
        return {
            active: this.isActive,
            channels: this.notificationChannels,
            queueSize: this.notificationQueue.length,
            totalSent: this.sentNotifications.length,
            templates: Object.keys(this.templates).length,
            readyForActivation: false // Will be true when dependencies are met
        };
    }

    // ACTIVATE/DEACTIVATE
    async activate() {
        console.log('⚠️ Cannot activate - dependencies not ready (SMS/Email services, scheduler)');
        return { success: false, reason: 'dependencies_not_ready' };
    }

    deactivate() {
        this.isActive = false;
        console.log('🔕 Notification Manager deactivated');
        return { success: true };
    }
}

// Global instance (inactive)
window.NotificationManager = NotificationManager;

console.log('📨 Notification Manager loaded (INACTIVE - awaiting dependencies)');