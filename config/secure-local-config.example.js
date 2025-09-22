/**
 * Secure Local Configuration Template
 *
 * INSTRUCTIONS:
 * 1. Copy this file to 'secure-local-config.js'
 * 2. Replace placeholder values with your actual API keys
 * 3. NEVER commit the 'secure-local-config.js' file to git
 * 4. Add 'secure-local-config.js' to your .gitignore
 */

window.SECURE_CONFIG = {
    // Replace with your actual Google Maps API key
    GOOGLE_MAPS_API_KEY: 'your_google_maps_api_key_here',

    // Replace with your actual Twilio credentials
    TWILIO_ACCOUNT_SID: 'your_twilio_account_sid_here',
    TWILIO_AUTH_TOKEN: 'your_twilio_auth_token_here',
    TWILIO_FROM_NUMBER: '+1234567890',

    // Replace with your actual Stripe keys
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_publishable_key_here',
    STRIPE_SECRET_KEY: 'sk_test_your_secret_key_here',
    STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret_here'
};

console.log('🔐 Secure local configuration loaded');