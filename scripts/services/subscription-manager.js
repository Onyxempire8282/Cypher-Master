class SubscriptionManager {
    constructor() {
        this.isEnabled = false; // DISABLED UNTIL ALL SERVICES ARE READY
        this.stripeService = null;
        this.smsService = null;
        this.cloudScheduler = null;
        
        this.users = new Map(); // Local user management
        this.subscriptionTiers = {
            'trial': {
                name: 'Trial',
                price: 0,
                duration: 14, // days
                features: {
                    routes: 10,
                    smsLimit: 50,
                    mileageTracking: true,
                    basicAnalytics: true,
                    support: 'email'
                },
                restrictions: {
                    maxJobsPerMonth: 25,
                    exportLimits: true,
                    advancedFeatures: false
                }
            },
            'starter': {
                name: 'Starter',
                price: 49.99,
                stripePriceId: 'price_starter_monthly',
                features: {
                    routes: 'unlimited',
                    smsLimit: 500,
                    mileageTracking: true,
                    basicAnalytics: true,
                    support: 'email',
                    firmIntegration: true
                },
                restrictions: {
                    maxJobsPerMonth: 100,
                    advancedAnalytics: false
                }
            },
            'professional': {
                name: 'Professional',
                price: 99.99,
                stripePriceId: 'price_professional_monthly',
                features: {
                    routes: 'unlimited',
                    smsLimit: 2000,
                    mileageTracking: true,
                    advancedAnalytics: true,
                    support: 'priority',
                    firmIntegration: true,
                    automatedReporting: true,
                    bulkOperations: true
                },
                restrictions: {
                    maxJobsPerMonth: 500
                }
            },
            'enterprise': {
                name: 'Enterprise',
                price: 199.99,
                stripePriceId: 'price_enterprise_monthly',
                features: {
                    routes: 'unlimited',
                    smsLimit: 'unlimited',
                    mileageTracking: true,
                    advancedAnalytics: true,
                    customAnalytics: true,
                    support: 'phone',
                    firmIntegration: true,
                    automatedReporting: true,
                    bulkOperations: true,
                    whiteLabel: true,
                    apiAccess: true,
                    customIntegrations: true
                },
                restrictions: {}
            }
        };
        
        console.log('🎯 Subscription Manager initialized (INACTIVE - awaiting service dependencies)');
    }

    // INITIALIZE WITH DEPENDENCIES
    async initialize() {
        if (!this.isEnabled) {
            console.log('🎯 Subscription Manager initialization skipped - disabled');
            return { success: false, reason: 'subscription_manager_disabled' };
        }

        // Connect to other services
        this.stripeService = window.stripeService;
        this.smsService = window.smsService;
        this.cloudScheduler = window.cloudScheduler;
        
        if (!this.stripeService || !this.stripeService.isEnabled) {
            return { success: false, reason: 'stripe_service_not_available' };
        }

        console.log('✅ Subscription Manager initialized with dependencies');
        return { success: true };
    }

    // USER REGISTRATION AND TRIAL SETUP
    async registerUser(userData) {
        if (!this.isEnabled) {
            console.log('🎯 User registration queued (INACTIVE):', userData.email);
            return { 
                success: false, 
                reason: 'subscription_manager_inactive',
                userData: userData
            };
        }

        try {
            // Generate trial period
            const trialStart = new Date();
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + this.subscriptionTiers.trial.duration);

            // Create user record
            const user = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...userData,
                subscriptionTier: 'trial',
                trialStart: trialStart.toISOString(),
                trialEnd: trialEnd.toISOString(),
                createdAt: new Date().toISOString(),
                status: 'active',
                usageStats: {
                    routesCreated: 0,
                    smsSent: 0,
                    jobsCompleted: 0,
                    mileageTracked: 0
                }
            };

            // Store user locally
            this.users.set(user.id, user);

            // Create Stripe customer
            const customerResult = await this.stripeService.createCustomer({
                email: user.email,
                name: user.name,
                phone: user.phone,
                userId: user.id,
                trialEnd: user.trialEnd
            });

            if (customerResult.success) {
                user.stripeCustomerId = customerResult.customerId;
            }

            // Schedule trial expiration reminders
            if (this.cloudScheduler && this.cloudScheduler.isEnabled) {
                await this.cloudScheduler.scheduleTrialLockoutReminders(user.id, user.trialEnd);
            }

            // Send welcome SMS
            if (this.smsService && this.smsService.isEnabled && user.phone) {
                await this.smsService.sendSMS(
                    user.phone,
                    `Welcome to Claim Cipher! Your 14-day trial is now active. Start with route optimization: ${window.location.origin}/route-optimizer`
                );
            }

            return { 
                success: true, 
                user: user,
                trialEnd: user.trialEnd
            };

        } catch (error) {
            console.error('❌ User registration failed:', error);
            return { success: false, error: error.message };
        }
    }

    // UPGRADE USER TO PAID PLAN
    async upgradeUser(userId, planId, paymentMethodId = null) {
        if (!this.isEnabled) {
            console.log('🎯 User upgrade queued (INACTIVE):', { userId, planId });
            return { 
                success: false, 
                reason: 'subscription_manager_inactive',
                upgradeData: { userId, planId, paymentMethodId }
            };
        }

        const user = this.users.get(userId);
        if (!user) {
            return { success: false, reason: 'user_not_found' };
        }

        const plan = this.subscriptionTiers[planId];
        if (!plan) {
            return { success: false, reason: 'invalid_plan_id' };
        }

        if (!user.stripeCustomerId) {
            return { success: false, reason: 'stripe_customer_not_found' };
        }

        try {
            // Create Stripe subscription
            const subscriptionResult = await this.stripeService.createSubscription(
                user.stripeCustomerId,
                planId,
                0 // No additional trial period for upgrades
            );

            if (!subscriptionResult.success) {
                return subscriptionResult;
            }

            // Update user record
            user.subscriptionTier = planId;
            user.subscriptionId = subscriptionResult.subscriptionId;
            user.upgradedAt = new Date().toISOString();
            user.status = 'active';
            user.billingCycle = 'monthly';

            // Reset trial status
            if (user.subscriptionTier !== 'trial') {
                user.isTrialUser = false;
            }

            // Update usage limits
            user.usageLimits = this.getUsageLimits(planId);

            // Send upgrade confirmation
            if (this.smsService && this.smsService.isEnabled && user.phone) {
                await this.smsService.sendSMS(
                    user.phone,
                    `Upgrade successful! You're now on the ${plan.name} plan ($${plan.price}/month). All features are now unlocked.`
                );
            }

            // Schedule billing reminders
            if (this.cloudScheduler && this.cloudScheduler.isEnabled) {
                await this.cloudScheduler.scheduleBillingReminders(user.stripeCustomerId, 'monthly');
            }

            return { 
                success: true, 
                user: user,
                subscription: subscriptionResult.subscription
            };

        } catch (error) {
            console.error('❌ User upgrade failed:', error);
            return { success: false, error: error.message };
        }
    }

    // CHECK FEATURE ACCESS
    hasFeatureAccess(userId, featureName) {
        const user = this.users.get(userId);
        if (!user) {
            return { access: false, reason: 'user_not_found' };
        }

        // Check if user account is active
        if (user.status !== 'active') {
            return { access: false, reason: 'account_inactive' };
        }

        // Check trial expiration
        if (user.subscriptionTier === 'trial') {
            const now = new Date();
            const trialEnd = new Date(user.trialEnd);
            
            if (now > trialEnd) {
                return { access: false, reason: 'trial_expired' };
            }
        }

        const tierFeatures = this.subscriptionTiers[user.subscriptionTier].features;
        
        if (tierFeatures.hasOwnProperty(featureName)) {
            return { access: true, limit: tierFeatures[featureName] };
        }

        return { access: false, reason: 'feature_not_in_plan' };
    }

    // CHECK USAGE LIMITS
    checkUsageLimit(userId, usageType) {
        const user = this.users.get(userId);
        if (!user) {
            return { allowed: false, reason: 'user_not_found' };
        }

        const tierFeatures = this.subscriptionTiers[user.subscriptionTier].features;
        const currentUsage = user.usageStats[usageType] || 0;
        const limit = tierFeatures[`${usageType}Limit`] || tierFeatures[usageType];

        // Handle unlimited plans
        if (limit === 'unlimited') {
            return { allowed: true, usage: currentUsage, limit: 'unlimited' };
        }

        // Check numeric limits
        if (typeof limit === 'number') {
            return { 
                allowed: currentUsage < limit,
                usage: currentUsage,
                limit: limit,
                remaining: Math.max(0, limit - currentUsage)
            };
        }

        return { allowed: true, usage: currentUsage };
    }

    // INCREMENT USAGE
    incrementUsage(userId, usageType, amount = 1) {
        const user = this.users.get(userId);
        if (!user) {
            return { success: false, reason: 'user_not_found' };
        }

        if (!user.usageStats[usageType]) {
            user.usageStats[usageType] = 0;
        }

        user.usageStats[usageType] += amount;
        user.lastActivity = new Date().toISOString();

        // Check if approaching limits (80% threshold)
        const usageCheck = this.checkUsageLimit(userId, usageType);
        if (usageCheck.limit !== 'unlimited' && usageCheck.usage / usageCheck.limit >= 0.8) {
            // Send usage warning
            if (this.smsService && this.smsService.isEnabled && user.phone) {
                this.smsService.sendSMS(
                    user.phone,
                    `Usage Alert: You've used ${usageCheck.usage}/${usageCheck.limit} ${usageType}. Consider upgrading to avoid limits.`
                );
            }
        }

        return { 
            success: true, 
            newUsage: user.usageStats[usageType],
            usageCheck: usageCheck
        };
    }

    // HANDLE TRIAL EXPIRATION
    async handleTrialExpiration(userId) {
        if (!this.isEnabled) {
            console.log('🎯 Trial expiration handling queued (INACTIVE):', userId);
            return { success: false, reason: 'subscription_manager_inactive' };
        }

        const user = this.users.get(userId);
        if (!user || user.subscriptionTier !== 'trial') {
            return { success: false, reason: 'invalid_trial_user' };
        }

        // Lock the account
        user.status = 'trial_expired';
        user.trialExpiredAt = new Date().toISOString();

        // Send final expiration notice
        if (this.smsService && this.smsService.isEnabled && user.phone) {
            await this.smsService.sendTrialExpirationNotice(user, 0);
        }

        // Grace period: Keep data for 30 days
        const dataRetentionEnd = new Date();
        dataRetentionEnd.setDate(dataRetentionEnd.getDate() + 30);
        user.dataRetentionEnd = dataRetentionEnd.toISOString();

        console.log(`🔒 Trial expired for user ${userId}, account locked`);
        
        return { 
            success: true, 
            action: 'trial_expired',
            dataRetentionEnd: user.dataRetentionEnd
        };
    }

    // HANDLE PAYMENT FAILURES
    async handlePaymentFailure(userId, invoiceId) {
        if (!this.isEnabled) {
            return { success: false, reason: 'subscription_manager_inactive' };
        }

        const user = this.users.get(userId);
        if (!user) {
            return { success: false, reason: 'user_not_found' };
        }

        // Mark account as payment failed
        user.status = 'payment_failed';
        user.lastPaymentFailure = new Date().toISOString();

        // Send payment failure notification
        if (this.smsService && this.smsService.isEnabled && user.phone) {
            await this.smsService.sendSMS(
                user.phone,
                `Payment failed for your Claim Cipher subscription. Please update your payment method to avoid service interruption: ${window.location.origin}/billing`
            );
        }

        // Downgrade features but keep access for 7 days
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
        user.gracePeriodEnd = gracePeriodEnd.toISOString();

        return { 
            success: true, 
            action: 'payment_failed',
            gracePeriodEnd: user.gracePeriodEnd
        };
    }

    // GET USER SUBSCRIPTION STATUS
    getUserSubscriptionStatus(userId) {
        const user = this.users.get(userId);
        if (!user) {
            return { found: false, reason: 'user_not_found' };
        }

        const now = new Date();
        let status = user.status;
        let daysRemaining = null;

        // Calculate trial days remaining
        if (user.subscriptionTier === 'trial') {
            const trialEnd = new Date(user.trialEnd);
            daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 0) {
                status = 'trial_expired';
            }
        }

        return {
            found: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscriptionTier: user.subscriptionTier,
                status: status,
                trialDaysRemaining: daysRemaining,
                features: this.subscriptionTiers[user.subscriptionTier].features,
                usageStats: user.usageStats,
                createdAt: user.createdAt
            }
        };
    }

    // GET USAGE LIMITS FOR TIER
    getUsageLimits(tier) {
        const tierConfig = this.subscriptionTiers[tier];
        if (!tierConfig) return {};

        return {
            sms: tierConfig.features.smsLimit,
            routes: tierConfig.features.routes,
            jobs: tierConfig.restrictions?.maxJobsPerMonth || 'unlimited'
        };
    }

    // SERVICE STATUS
    getServiceStatus() {
        return {
            enabled: this.isEnabled,
            dependencies: {
                stripeService: this.stripeService?.isEnabled || false,
                smsService: this.smsService?.isEnabled || false,
                cloudScheduler: this.cloudScheduler?.isEnabled || false
            },
            totalUsers: this.users.size,
            subscriptionTiers: Object.keys(this.subscriptionTiers),
            trialUsers: Array.from(this.users.values()).filter(u => u.subscriptionTier === 'trial').length,
            paidUsers: Array.from(this.users.values()).filter(u => u.subscriptionTier !== 'trial').length
        };
    }

    // ENABLE/DISABLE SERVICE
    async enableService() {
        // Check dependencies
        if (!window.stripeService || !window.stripeService.isEnabled) {
            console.log('⚠️ Cannot enable Subscription Manager - Stripe service not ready');
            return { success: false, reason: 'stripe_service_not_ready' };
        }

        this.isEnabled = true;
        await this.initialize();
        
        console.log('✅ Subscription Manager enabled');
        return { success: true, message: 'Subscription Manager activated' };
    }

    disableService() {
        this.isEnabled = false;
        console.log('🎯 Subscription Manager disabled');
        return { success: true };
    }
}

// Global instance (inactive)
window.SubscriptionManager = SubscriptionManager;

console.log('🎯 Subscription Manager loaded (INACTIVE - awaiting dependencies)');