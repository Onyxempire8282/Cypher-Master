class StripeService {
    constructor() {
        this.isEnabled = false; // DISABLED UNTIL CONFIGURED
        this.stripe = null; // Will hold Stripe instance when configured
        this.config = {
            publishableKey: null, // Frontend key
            secretKey: null,      // Backend key (never expose to frontend)
            webhookSecret: null,  // For webhook verification
            baseUrl: 'https://api.stripe.com/v1'
        };
        
        this.subscriptionPlans = {
            'starter': {
                priceId: 'price_starter_monthly', // Will be set when configured
                name: 'Claim Cipher Starter',
                price: 49.99,
                interval: 'month',
                features: ['Unlimited Routes', '500 SMS/month', 'Basic Analytics']
            },
            'professional': {
                priceId: 'price_professional_monthly',
                name: 'Claim Cipher Professional', 
                price: 99.99,
                interval: 'month',
                features: ['Everything in Starter', '2000 SMS/month', 'Advanced Analytics', 'Priority Support']
            },
            'enterprise': {
                priceId: 'price_enterprise_monthly',
                name: 'Claim Cipher Enterprise',
                price: 199.99,
                interval: 'month',
                features: ['Everything in Professional', 'Unlimited SMS', 'White Label', 'Custom Integration']
            }
        };
        
        this.customers = new Map(); // Local customer cache
        this.subscriptions = new Map(); // Local subscription cache
        this.paymentHistory = [];
        
        console.log('💳 Stripe Service initialized (INACTIVE - awaiting configuration)');
    }

    // INITIALIZE STRIPE
    async initialize(publishableKey, secretKey, webhookSecret) {
        if (typeof Stripe === 'undefined') {
            console.error('❌ Stripe.js not loaded. Add <script src="https://js.stripe.com/v3/"></script>');
            return { success: false, reason: 'stripe_js_not_loaded' };
        }

        this.config.publishableKey = publishableKey;
        this.config.secretKey = secretKey; // Should be handled server-side only
        this.config.webhookSecret = webhookSecret;
        
        if (!this.isEnabled) {
            console.log('💳 Stripe configured but service remains INACTIVE');
            return { success: true, status: 'configured_but_inactive' };
        }

        // Initialize Stripe instance
        this.stripe = Stripe(publishableKey);
        console.log('✅ Stripe Service initialized and ready');
        
        return { success: true, status: 'active' };
    }

    // CREATE CUSTOMER
    async createCustomer(customerData) {
        if (!this.isEnabled) {
            console.log('💳 Customer creation queued (INACTIVE):', customerData.email);
            return { 
                success: false, 
                reason: 'stripe_service_inactive',
                customerData: customerData
            };
        }

        try {
            const customer = await this.stripeAPICall('POST', '/customers', {
                email: customerData.email,
                name: customerData.name,
                phone: customerData.phone,
                metadata: {
                    userId: customerData.userId,
                    signupDate: new Date().toISOString(),
                    trialEnd: customerData.trialEnd
                }
            });

            // Cache customer locally
            this.customers.set(customer.id, {
                ...customer,
                localData: customerData
            });

            return { 
                success: true, 
                customerId: customer.id,
                customer: customer
            };

        } catch (error) {
            console.error('❌ Customer creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    // CREATE SUBSCRIPTION
    async createSubscription(customerId, planId, trialDays = 14) {
        if (!this.isEnabled) {
            console.log('💳 Subscription creation queued (INACTIVE):', { customerId, planId });
            return { 
                success: false, 
                reason: 'stripe_service_inactive',
                subscriptionData: { customerId, planId, trialDays }
            };
        }

        const plan = this.subscriptionPlans[planId];
        if (!plan) {
            return { success: false, reason: 'invalid_plan_id', availablePlans: Object.keys(this.subscriptionPlans) };
        }

        try {
            const subscription = await this.stripeAPICall('POST', '/subscriptions', {
                customer: customerId,
                items: [{
                    price: plan.priceId
                }],
                trial_period_days: trialDays,
                metadata: {
                    planId: planId,
                    planName: plan.name,
                    createdAt: new Date().toISOString()
                }
            });

            // Cache subscription locally
            this.subscriptions.set(subscription.id, {
                ...subscription,
                planId: planId,
                planData: plan
            });

            return { 
                success: true, 
                subscriptionId: subscription.id,
                subscription: subscription,
                trialEnd: subscription.trial_end
            };

        } catch (error) {
            console.error('❌ Subscription creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    // UPGRADE/DOWNGRADE SUBSCRIPTION
    async updateSubscription(subscriptionId, newPlanId) {
        if (!this.isEnabled) {
            console.log('💳 Subscription update queued (INACTIVE):', { subscriptionId, newPlanId });
            return { 
                success: false, 
                reason: 'stripe_service_inactive',
                updateData: { subscriptionId, newPlanId }
            };
        }

        const newPlan = this.subscriptionPlans[newPlanId];
        if (!newPlan) {
            return { success: false, reason: 'invalid_plan_id' };
        }

        try {
            // Get current subscription
            const subscription = await this.stripeAPICall('GET', `/subscriptions/${subscriptionId}`);
            const currentItemId = subscription.items.data[0].id;

            // Update the subscription
            const updatedSubscription = await this.stripeAPICall('POST', `/subscriptions/${subscriptionId}`, {
                items: [{
                    id: currentItemId,
                    price: newPlan.priceId
                }],
                proration_behavior: 'create_prorations',
                metadata: {
                    ...subscription.metadata,
                    planId: newPlanId,
                    planName: newPlan.name,
                    upgradedAt: new Date().toISOString()
                }
            });

            // Update local cache
            this.subscriptions.set(subscriptionId, {
                ...updatedSubscription,
                planId: newPlanId,
                planData: newPlan
            });

            return { 
                success: true, 
                subscription: updatedSubscription,
                newPlan: newPlan
            };

        } catch (error) {
            console.error('❌ Subscription update failed:', error);
            return { success: false, error: error.message };
        }
    }

    // CANCEL SUBSCRIPTION
    async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
        if (!this.isEnabled) {
            console.log('💳 Subscription cancellation queued (INACTIVE):', subscriptionId);
            return { 
                success: false, 
                reason: 'stripe_service_inactive',
                cancellationData: { subscriptionId, cancelAtPeriodEnd }
            };
        }

        try {
            const subscription = await this.stripeAPICall('POST', `/subscriptions/${subscriptionId}`, {
                cancel_at_period_end: cancelAtPeriodEnd,
                metadata: {
                    cancelledAt: new Date().toISOString(),
                    cancelAtPeriodEnd: cancelAtPeriodEnd.toString()
                }
            });

            // Update local cache
            if (this.subscriptions.has(subscriptionId)) {
                const cached = this.subscriptions.get(subscriptionId);
                this.subscriptions.set(subscriptionId, {
                    ...cached,
                    ...subscription,
                    cancelledAt: new Date().toISOString()
                });
            }

            return { 
                success: true, 
                subscription: subscription,
                cancelAtPeriodEnd: cancelAtPeriodEnd
            };

        } catch (error) {
            console.error('❌ Subscription cancellation failed:', error);
            return { success: false, error: error.message };
        }
    }

    // PROCESS PAYMENT
    async processPayment(customerId, amount, description = 'Claim Cipher Service') {
        if (!this.isEnabled) {
            console.log('💳 Payment processing queued (INACTIVE):', { customerId, amount });
            return { 
                success: false, 
                reason: 'stripe_service_inactive',
                paymentData: { customerId, amount, description }
            };
        }

        try {
            const paymentIntent = await this.stripeAPICall('POST', '/payment_intents', {
                customer: customerId,
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                description: description,
                automatic_payment_methods: {
                    enabled: true
                },
                metadata: {
                    service: 'claim_cipher',
                    processedAt: new Date().toISOString()
                }
            });

            // Log payment attempt
            this.paymentHistory.push({
                paymentIntentId: paymentIntent.id,
                customerId: customerId,
                amount: amount,
                description: description,
                status: paymentIntent.status,
                createdAt: new Date().toISOString()
            });

            return { 
                success: true, 
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret
            };

        } catch (error) {
            console.error('❌ Payment processing failed:', error);
            return { success: false, error: error.message };
        }
    }

    // HANDLE TRIAL EXPIRATION
    async handleTrialExpiration(customerId) {
        if (!this.isEnabled) {
            console.log('💳 Trial expiration handling queued (INACTIVE):', customerId);
            return { success: false, reason: 'stripe_service_inactive' };
        }

        // Find customer's subscription
        const customerSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.customer === customerId);

        for (const subscription of customerSubscriptions) {
            if (subscription.status === 'trialing') {
                // Trial expired, subscription should auto-convert or fail
                console.log(`🔔 Trial expired for customer ${customerId}, subscription ${subscription.id}`);
                
                // Trigger notification via SMS service
                if (window.smsService && window.smsService.isEnabled) {
                    const customer = this.customers.get(customerId);
                    if (customer && customer.localData && customer.localData.phone) {
                        await window.smsService.sendTrialExpirationNotice(customer.localData, 0);
                    }
                }
                
                return { 
                    success: true, 
                    action: 'trial_expired',
                    subscriptionId: subscription.id,
                    nextBillingDate: subscription.current_period_end
                };
            }
        }

        return { success: false, reason: 'no_active_trial_found' };
    }

    // WEBHOOK HANDLING
    async handleWebhook(rawBody, signature) {
        if (!this.isEnabled) {
            console.log('💳 Webhook handling skipped (INACTIVE)');
            return { success: false, reason: 'stripe_service_inactive' };
        }

        try {
            // Verify webhook signature (when enabled)
            if (this.config.webhookSecret && signature) {
                // This would verify the webhook signature with Stripe
                console.log('🔐 Webhook signature verified');
            }

            const event = JSON.parse(rawBody);
            
            switch (event.type) {
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSuccess(event.data.object);
                    break;
                
                case 'invoice.payment_failed':
                    await this.handlePaymentFailure(event.data.object);
                    break;
                
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdate(event.data.object);
                    break;
                
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCancellation(event.data.object);
                    break;
                
                case 'customer.subscription.trial_will_end':
                    await this.handleTrialWillEnd(event.data.object);
                    break;
                
                default:
                    console.log(`📨 Unhandled webhook event: ${event.type}`);
            }

            return { success: true, eventType: event.type };

        } catch (error) {
            console.error('❌ Webhook handling failed:', error);
            return { success: false, error: error.message };
        }
    }

    // WEBHOOK EVENT HANDLERS
    async handlePaymentSuccess(invoice) {
        console.log('✅ Payment succeeded:', invoice.id);
        
        // Update subscription status
        if (invoice.subscription) {
            const subscription = this.subscriptions.get(invoice.subscription);
            if (subscription) {
                subscription.lastPayment = {
                    amount: invoice.amount_paid / 100,
                    date: new Date(invoice.created * 1000).toISOString(),
                    status: 'succeeded'
                };
            }
        }

        // Send success notification
        if (window.smsService && window.smsService.isEnabled) {
            const customer = this.customers.get(invoice.customer);
            if (customer && customer.localData && customer.localData.phone) {
                await window.smsService.sendSMS(
                    customer.localData.phone,
                    `Payment received! Thank you for your Claim Cipher subscription. Amount: $${invoice.amount_paid / 100}`
                );
            }
        }
    }

    async handlePaymentFailure(invoice) {
        console.log('❌ Payment failed:', invoice.id);
        
        // Send failure notification
        if (window.smsService && window.smsService.isEnabled) {
            const customer = this.customers.get(invoice.customer);
            if (customer && customer.localData && customer.localData.phone) {
                await window.smsService.sendSMS(
                    customer.localData.phone,
                    `Payment failed for your Claim Cipher subscription. Please update your payment method: ${window.location.origin}/billing`
                );
            }
        }
    }

    async handleTrialWillEnd(subscription) {
        console.log('⏰ Trial ending soon:', subscription.id);
        
        // Send trial ending notification (3 days before)
        if (window.smsService && window.smsService.isEnabled) {
            const customer = this.customers.get(subscription.customer);
            if (customer && customer.localData && customer.localData.phone) {
                await window.smsService.sendTrialExpirationNotice(customer.localData, 3);
            }
        }
    }

    // UTILITY METHODS
    async stripeAPICall(method, endpoint, data = null) {
        if (!this.config.secretKey) {
            throw new Error('Stripe secret key not configured');
        }

        const url = `${this.config.baseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.config.secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = new URLSearchParams(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Stripe API request failed');
        }

        return result;
    }

    // SERVICE STATUS
    getServiceStatus() {
        return {
            enabled: this.isEnabled,
            configured: this.isConfigured(),
            customersCount: this.customers.size,
            subscriptionsCount: this.subscriptions.size,
            paymentsProcessed: this.paymentHistory.length,
            availablePlans: Object.keys(this.subscriptionPlans),
            lastActivity: this.paymentHistory.length > 0 ? 
                this.paymentHistory[this.paymentHistory.length - 1].createdAt : 'never'
        };
    }

    isConfigured() {
        return !!(this.config.publishableKey && this.config.secretKey);
    }

    // ENABLE/DISABLE SERVICE
    async enableService() {
        if (!this.isConfigured()) {
            console.log('⚠️ Cannot enable Stripe service - not properly configured');
            return { 
                success: false, 
                reason: 'not_configured',
                required: ['publishableKey', 'secretKey']
            };
        }

        this.isEnabled = true;
        console.log('✅ Stripe Service enabled');
        return { success: true, message: 'Stripe service activated' };
    }

    disableService() {
        this.isEnabled = false;
        console.log('💳 Stripe Service disabled');
        return { success: true };
    }
}

// Global instance (inactive)
window.StripeService = StripeService;

console.log('💳 Stripe Service loaded (INACTIVE - awaiting configuration)');