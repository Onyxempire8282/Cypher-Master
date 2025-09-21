class ConversionWorkflow {
    constructor() {
        this.isEnabled = false; // DISABLED UNTIL READY FOR USE
        this.subscriptionManager = null;
        this.stripeService = null;
        this.smsService = null;
        this.cloudScheduler = null;
        
        this.conversionFunnel = {
            'trial_signup': 0,
            'trial_active_7d': 0,
            'trial_active_14d': 0,
            'trial_converted': 0,
            'trial_expired': 0
        };
        
        this.conversionTriggers = {
            // Day-based triggers during trial
            day1: {
                trigger: 'welcome_onboarding',
                action: 'send_welcome_flow',
                channels: ['sms', 'email']
            },
            day3: {
                trigger: 'engagement_check',
                action: 'feature_highlight',
                channels: ['sms', 'ui']
            },
            day7: {
                trigger: 'mid_trial_nudge',
                action: 'success_story_share',
                channels: ['sms', 'email']
            },
            day11: {
                trigger: 'pre_expiration_warning',
                action: 'upgrade_incentive',
                channels: ['sms', 'email', 'ui']
            },
            day13: {
                trigger: 'final_chance',
                action: 'last_chance_offer',
                channels: ['sms', 'email', 'ui']
            }
        };

        this.conversionStrategies = {
            'usage_based': {
                name: 'Usage-Based Conversion',
                triggers: ['high_engagement', 'feature_limit_reached', 'daily_active'],
                message: 'You\'re getting great results! Upgrade to unlock unlimited features.'
            },
            'value_demonstration': {
                name: 'Value Demonstration',
                triggers: ['completed_first_route', 'sent_first_sms', 'generated_report'],
                message: 'See the time you\'re saving? Professional users save 10+ hours/week.'
            },
            'scarcity_urgency': {
                name: 'Scarcity & Urgency',
                triggers: ['trial_expiring_soon', 'limited_time_offer'],
                message: 'Trial expires soon! Upgrade now and save 20% on your first month.'
            },
            'social_proof': {
                name: 'Social Proof',
                triggers: ['peer_comparison', 'success_metrics'],
                message: '500+ claims professionals upgraded this month. Join the community!'
            }
        };
        
        this.activeConversions = new Map(); // Track ongoing conversion attempts
        
        console.log('🎯 Conversion Workflow initialized (INACTIVE - awaiting dependencies)');
    }

    // INITIALIZE WITH DEPENDENCIES
    async initialize() {
        if (!this.isEnabled) {
            console.log('🎯 Conversion Workflow initialization skipped - disabled');
            return { success: false, reason: 'conversion_workflow_disabled' };
        }

        // Connect to services
        this.subscriptionManager = window.subscriptionManager;
        this.stripeService = window.stripeService;
        this.smsService = window.smsService;
        this.cloudScheduler = window.cloudScheduler;
        
        console.log('✅ Conversion Workflow initialized');
        return { success: true };
    }

    // START TRIAL CONVERSION SEQUENCE
    async startTrialConversionSequence(userId) {
        if (!this.isEnabled) {
            console.log('🎯 Trial conversion sequence queued (INACTIVE):', userId);
            return { success: false, reason: 'conversion_workflow_inactive' };
        }

        const user = this.subscriptionManager?.users.get(userId);
        if (!user || user.subscriptionTier !== 'trial') {
            return { success: false, reason: 'invalid_trial_user' };
        }

        // Create conversion tracking record
        const conversionRecord = {
            userId: userId,
            startedAt: new Date().toISOString(),
            trialEnd: user.trialEnd,
            strategy: this.selectConversionStrategy(user),
            touchpoints: [],
            status: 'active'
        };

        this.activeConversions.set(userId, conversionRecord);

        // Schedule conversion touchpoints
        await this.scheduleConversionTouchpoints(userId, conversionRecord);

        // Send immediate welcome conversion message
        await this.sendConversionMessage(userId, 'welcome_onboarding');

        return { 
            success: true, 
            conversionRecord: conversionRecord,
            strategy: conversionRecord.strategy
        };
    }

    // SELECT CONVERSION STRATEGY BASED ON USER BEHAVIOR
    selectConversionStrategy(user) {
        const usageStats = user.usageStats || {};
        
        // High engagement user
        if (usageStats.routesCreated > 5 || usageStats.smsSent > 10) {
            return 'usage_based';
        }
        
        // User has completed key actions
        if (usageStats.routesCreated > 0 && usageStats.smsSent > 0) {
            return 'value_demonstration';
        }
        
        // Low engagement - use urgency
        const trialDays = Math.ceil((new Date(user.trialEnd) - new Date()) / (1000 * 60 * 60 * 24));
        if (trialDays <= 3) {
            return 'scarcity_urgency';
        }
        
        // Default to social proof
        return 'social_proof';
    }

    // SCHEDULE CONVERSION TOUCHPOINTS
    async scheduleConversionTouchpoints(userId, conversionRecord) {
        if (!this.cloudScheduler?.isEnabled) {
            console.log('📅 Conversion touchpoints not scheduled - scheduler disabled');
            return { success: false, reason: 'scheduler_not_available' };
        }

        const trialStart = new Date(conversionRecord.startedAt);
        const schedules = [];

        // Schedule each conversion trigger
        for (const [day, config] of Object.entries(this.conversionTriggers)) {
            const triggerDate = new Date(trialStart);
            const dayNumber = parseInt(day.replace('day', ''));
            triggerDate.setDate(triggerDate.getDate() + dayNumber);

            schedules.push({
                userId: userId,
                triggerDate: triggerDate.toISOString(),
                trigger: config.trigger,
                action: config.action,
                channels: config.channels,
                day: dayNumber
            });
        }

        return { success: true, schedules: schedules };
    }

    // SEND CONVERSION MESSAGE
    async sendConversionMessage(userId, triggerType) {
        if (!this.isEnabled) {
            return { success: false, reason: 'conversion_workflow_inactive' };
        }

        const user = this.subscriptionManager?.users.get(userId);
        const conversionRecord = this.activeConversions.get(userId);
        
        if (!user || !conversionRecord) {
            return { success: false, reason: 'conversion_record_not_found' };
        }

        const strategy = this.conversionStrategies[conversionRecord.strategy];
        const message = this.getConversionMessage(triggerType, user, strategy);

        let results = [];

        // Send via SMS if available
        if (this.smsService?.isEnabled && user.phone) {
            const smsResult = await this.smsService.sendSMS(user.phone, message.sms || message.default);
            results.push({ channel: 'sms', ...smsResult });
        }

        // Log touchpoint
        conversionRecord.touchpoints.push({
            triggerType: triggerType,
            sentAt: new Date().toISOString(),
            message: message.default,
            results: results
        });

        return { success: true, results: results };
    }

    // GET CONVERSION MESSAGE BASED ON TRIGGER AND STRATEGY
    getConversionMessage(triggerType, user, strategy) {
        const baseMessages = {
            'welcome_onboarding': {
                default: `Welcome to Claim Cipher, ${user.name}! Start with route optimization to see immediate time savings. Your 14-day trial includes all professional features.`,
                sms: `Hi ${user.name}! Welcome to Claim Cipher. Try the route optimizer first - most users save 2+ hours per day. Trial expires ${new Date(user.trialEnd).toLocaleDateString()}.`
            },
            
            'engagement_check': {
                default: `${user.name}, how's your Claim Cipher experience? ${strategy.message} Need help? Reply HELP.`,
                sms: `Hi ${user.name}! Getting value from Claim Cipher? ${strategy.message}`
            },
            
            'mid_trial_nudge': {
                default: `${user.name}, you're halfway through your trial! Professional users typically save $500+/month in efficiency. Ready to upgrade?`,
                sms: `${user.name}, trial 50% done! Pros save $500+/month with Claim Cipher. Upgrade now: ${window.location.origin}/upgrade`
            },
            
            'pre_expiration_warning': {
                default: `${user.name}, your trial expires in 3 days! Don't lose your routes and data. Upgrade now and get 20% off first month: TRIAL20`,
                sms: `URGENT: ${user.name}, trial expires in 3 days! Save your data + get 20% off: ${window.location.origin}/upgrade?code=TRIAL20`
            },
            
            'final_chance': {
                default: `FINAL CHANCE: ${user.name}, trial expires tomorrow! Upgrade now to keep your ${user.usageStats?.routesCreated || 0} routes and all data.`,
                sms: `FINAL NOTICE: ${user.name}, trial expires tomorrow! Don't lose your work. Upgrade: ${window.location.origin}/upgrade`
            }
        };

        return baseMessages[triggerType] || {
            default: `${user.name}, ${strategy.message}`,
            sms: strategy.message
        };
    }

    // HANDLE CONVERSION SUCCESS
    async handleConversionSuccess(userId, planId) {
        if (!this.isEnabled) {
            return { success: false, reason: 'conversion_workflow_inactive' };
        }

        const conversionRecord = this.activeConversions.get(userId);
        if (!conversionRecord) {
            return { success: false, reason: 'conversion_record_not_found' };
        }

        // Mark conversion as successful
        conversionRecord.status = 'converted';
        conversionRecord.convertedAt = new Date().toISOString();
        conversionRecord.convertedToPlan = planId;

        // Update funnel metrics
        this.conversionFunnel.trial_converted++;

        // Send conversion confirmation
        const user = this.subscriptionManager?.users.get(userId);
        if (user && this.smsService?.isEnabled && user.phone) {
            const plan = this.subscriptionManager?.subscriptionTiers[planId];
            await this.smsService.sendSMS(
                user.phone,
                `🎉 Welcome to ${plan?.name}! Your account is now fully activated with all professional features. Start maximizing your efficiency!`
            );
        }

        // Stop conversion sequence
        this.activeConversions.delete(userId);

        console.log(`✅ User ${userId} converted to ${planId} plan`);
        
        return { 
            success: true, 
            conversionRecord: conversionRecord,
            plan: planId
        };
    }

    // HANDLE CONVERSION FAILURE (TRIAL EXPIRED)
    async handleConversionFailure(userId) {
        if (!this.isEnabled) {
            return { success: false, reason: 'conversion_workflow_inactive' };
        }

        const conversionRecord = this.activeConversions.get(userId);
        if (conversionRecord) {
            conversionRecord.status = 'failed';
            conversionRecord.failedAt = new Date().toISOString();
            
            // Update funnel metrics
            this.conversionFunnel.trial_expired++;
        }

        // Start win-back sequence
        await this.startWinBackSequence(userId);

        // Clean up active conversion
        this.activeConversions.delete(userId);

        return { success: true, action: 'conversion_failed', winBackStarted: true };
    }

    // START WIN-BACK SEQUENCE FOR EXPIRED TRIALS
    async startWinBackSequence(userId) {
        if (!this.isEnabled) {
            return { success: false, reason: 'conversion_workflow_inactive' };
        }

        const user = this.subscriptionManager?.users.get(userId);
        if (!user) {
            return { success: false, reason: 'user_not_found' };
        }

        // Create win-back campaign
        const winBackRecord = {
            userId: userId,
            startedAt: new Date().toISOString(),
            type: 'post_trial_winback',
            offers: [
                { day: 1, offer: '30% off first month', code: 'COMEBACK30' },
                { day: 7, offer: 'Extended 7-day trial', code: 'EXTEND7' },
                { day: 14, offer: '50% off first month', code: 'WINBACK50' }
            ],
            status: 'active'
        };

        // Send immediate win-back offer
        if (this.smsService?.isEnabled && user.phone) {
            await this.smsService.sendSMS(
                user.phone,
                `Don't give up on saving time! Get 30% off your first month of Claim Cipher Professional. Use code COMEBACK30: ${window.location.origin}/upgrade?code=COMEBACK30`
            );
        }

        return { success: true, winBackRecord: winBackRecord };
    }

    // TRACK CONVERSION EVENTS
    async trackConversionEvent(userId, eventType, eventData = {}) {
        if (!this.isEnabled) {
            return { success: false, reason: 'conversion_workflow_inactive' };
        }

        const conversionRecord = this.activeConversions.get(userId);
        if (!conversionRecord) {
            return { success: false, reason: 'no_active_conversion' };
        }

        // Add event to conversion record
        if (!conversionRecord.events) {
            conversionRecord.events = [];
        }

        conversionRecord.events.push({
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString()
        });

        // Trigger behavior-based conversions
        if (eventType === 'feature_limit_reached') {
            await this.sendConversionMessage(userId, 'upgrade_incentive');
        }

        return { success: true, eventTracked: eventType };
    }

    // GET CONVERSION ANALYTICS
    getConversionAnalytics() {
        const totalTrials = this.conversionFunnel.trial_signup;
        const conversions = this.conversionFunnel.trial_converted;
        const conversionRate = totalTrials > 0 ? (conversions / totalTrials * 100).toFixed(2) : 0;

        return {
            funnel: this.conversionFunnel,
            conversionRate: `${conversionRate}%`,
            activeConversions: this.activeConversions.size,
            strategies: Object.keys(this.conversionStrategies),
            averageTrialLength: 14, // days
            topConversionTriggers: this.getTopConversionTriggers()
        };
    }

    getTopConversionTriggers() {
        // Analyze which triggers lead to most conversions
        const triggerEffectiveness = {};
        
        for (const [userId, record] of this.activeConversions) {
            if (record.status === 'converted') {
                for (const touchpoint of record.touchpoints) {
                    const trigger = touchpoint.triggerType;
                    triggerEffectiveness[trigger] = (triggerEffectiveness[trigger] || 0) + 1;
                }
            }
        }

        return Object.entries(triggerEffectiveness)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([trigger, count]) => ({ trigger, conversions: count }));
    }

    // SERVICE STATUS
    getServiceStatus() {
        return {
            enabled: this.isEnabled,
            dependencies: {
                subscriptionManager: this.subscriptionManager?.isEnabled || false,
                stripeService: this.stripeService?.isEnabled || false,
                smsService: this.smsService?.isEnabled || false,
                cloudScheduler: this.cloudScheduler?.isEnabled || false
            },
            activeConversions: this.activeConversions.size,
            conversionFunnel: this.conversionFunnel,
            strategies: Object.keys(this.conversionStrategies).length
        };
    }

    // ENABLE/DISABLE SERVICE
    async enableService() {
        if (!window.subscriptionManager?.isEnabled) {
            console.log('⚠️ Cannot enable Conversion Workflow - Subscription Manager not ready');
            return { success: false, reason: 'subscription_manager_not_ready' };
        }

        this.isEnabled = true;
        await this.initialize();
        
        console.log('✅ Conversion Workflow enabled');
        return { success: true, message: 'Conversion Workflow activated' };
    }

    disableService() {
        this.isEnabled = false;
        console.log('🎯 Conversion Workflow disabled');
        return { success: true };
    }
}

// Global instance (inactive)
window.ConversionWorkflow = ConversionWorkflow;

console.log('🎯 Conversion Workflow loaded (INACTIVE - awaiting dependencies)');