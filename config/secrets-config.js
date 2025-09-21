// SECURE CONFIGURATION - NEVER COMMIT ACTUAL SECRETS TO GIT
class SecretsConfig {
    constructor() {
        this.isDevelopment = true;
        this.secrets = {
            twilio: {
                accountSid: null,
                authToken: null,
                fromNumber: null
            },
            stripe: {
                publishableKey: null,
                secretKey: null,
                webhookSecret: null
            }
        };
        
        console.log('🔒 Secrets configuration initialized (EMPTY - awaiting secure setup)');
    }

    // SECURE METHOD TO SET CREDENTIALS (USE ONLY IN SECURE ENVIRONMENT)
    setCredentials(service, credentials) {
        if (!this.secrets[service]) {
            console.error(`❌ Unknown service: ${service}`);
            return false;
        }

        // In production, these would come from environment variables
        this.secrets[service] = { ...this.secrets[service], ...credentials };
        console.log(`🔒 ${service} credentials configured (values hidden for security)`);
        return true;
    }

    // SAFE GETTER THAT DOESN'T EXPOSE SECRETS IN LOGS
    getCredentials(service) {
        if (!this.secrets[service]) {
            return null;
        }

        const creds = this.secrets[service];
        const hasRequired = Object.values(creds).every(val => val !== null);
        
        return {
            configured: hasRequired,
            service: service,
            // Never return actual values - only status
            status: hasRequired ? 'ready' : 'missing_credentials'
        };
    }

    // PRODUCTION-READY METHOD (reads from environment variables)
    loadFromEnvironment() {
        try {
            // This would read from process.env in a Node.js environment
            // For browser environment, these would be set server-side
            
            this.secrets.twilio = {
                accountSid: process.env.TWILIO_ACCOUNT_SID || null,
                authToken: process.env.TWILIO_AUTH_TOKEN || null,
                fromNumber: process.env.TWILIO_FROM_NUMBER || null
            };
            
            this.secrets.stripe = {
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
                secretKey: process.env.STRIPE_SECRET_KEY || null,
                webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null
            };
            
            console.log('🔒 Credentials loaded from environment variables');
            return true;
            
        } catch (error) {
            console.log('📝 Environment variables not available - using manual configuration');
            return false;
        }
    }

    // CHECK IF SERVICES ARE READY
    getServicesStatus() {
        return {
            twilio: this.getCredentials('twilio'),
            stripe: this.getCredentials('stripe'),
            allConfigured: this.areAllServicesConfigured()
        };
    }

    areAllServicesConfigured() {
        const twilioStatus = this.getCredentials('twilio');
        const stripeStatus = this.getCredentials('stripe');
        
        return twilioStatus?.configured && stripeStatus?.configured;
    }

    // SECURE METHOD TO TEST CREDENTIALS WITHOUT EXPOSING THEM
    async testCredentials(service) {
        const status = this.getCredentials(service);
        if (!status?.configured) {
            return { success: false, reason: 'credentials_not_configured' };
        }

        try {
            if (service === 'twilio') {
                // Test Twilio credentials (when SMS service is enabled)
                if (window.smsService) {
                    return await window.smsService.validateTwilioCredentials();
                }
            } else if (service === 'stripe') {
                // Test Stripe credentials (when Stripe service is enabled)
                if (window.stripeService) {
                    return { success: true, message: 'Stripe test mode ready' };
                }
            }
            
            return { success: false, reason: 'service_not_available' };
            
        } catch (error) {
            return { success: false, reason: 'credential_test_failed', error: error.message };
        }
    }
}

// IMPORTANT SECURITY NOTES:
// 1. NEVER commit actual API keys to this file
// 2. Use environment variables in production
// 3. Rotate credentials regularly  
// 4. Monitor API usage for anomalies
// 5. Use least-privilege access

// Global instance
window.SecretsConfig = SecretsConfig;

console.log('🔒 Secrets Configuration loaded (SECURE MODE - no credentials exposed)');