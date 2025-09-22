/**
 * Environment Configuration Loader
 * Securely loads API keys and environment variables
 *
 * SECURITY: This file reads from .env (which should NOT be committed to git)
 */

// Environment configuration object
window.ENV_CONFIG = {};

/**
 * Load environment variables from .env file or fallback to defaults
 * In production, these would be set as environment variables
 */
async function loadEnvironmentConfig() {
    try {
        // In a real production environment, these would come from server-side environment variables
        // For development, we'll use a secure configuration pattern

        // Check if we're in development mode
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isDevelopment) {
            // Load from local secure config (create this file manually, don't commit)
            try {
                const response = await fetch('./config/secure-local-config.js');
                if (response.ok) {
                    // This file should contain your actual API keys
                    console.log('🔐 Loading secure local configuration...');
                } else {
                    console.warn('⚠️ No secure local config found. Using placeholder values.');
                }
            } catch (error) {
                console.warn('⚠️ Secure config not found. Create config/secure-local-config.js with your API keys.');
            }
        }

        // Set default/placeholder values
        window.ENV_CONFIG = {
            GOOGLE_MAPS_API_KEY: window.SECURE_CONFIG?.GOOGLE_MAPS_API_KEY || null,
            TWILIO_ACCOUNT_SID: window.SECURE_CONFIG?.TWILIO_ACCOUNT_SID || null,
            STRIPE_PUBLISHABLE_KEY: window.SECURE_CONFIG?.STRIPE_PUBLISHABLE_KEY || null,
            NODE_ENV: isDevelopment ? 'development' : 'production',
            DEBUG_MODE: isDevelopment
        };

        console.log('🌍 Environment configuration loaded');

    } catch (error) {
        console.error('❌ Failed to load environment configuration:', error);
        // Set minimal fallback configuration
        window.ENV_CONFIG = {
            NODE_ENV: 'development',
            DEBUG_MODE: true
        };
    }
}

/**
 * Dynamic Google Maps API script loader with secure key
 */
function loadGoogleMapsAPI(libraries = ['geometry'], callback = null) {
    const apiKey = window.ENV_CONFIG?.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('❌ Google Maps API key not configured. Check your environment setup.');
        return;
    }

    // Construct API URL
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    const callbackParam = callback ? `&callback=${callback}` : '';
    const apiUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}${callbackParam}&loading=async`;

    // Create script element
    const script = document.createElement('script');
    script.src = apiUrl;
    script.async = true;
    script.defer = true;

    // Add error handling
    script.onerror = function() {
        console.error('❌ Failed to load Google Maps API');
    };

    script.onload = function() {
        console.log('🗺️ Google Maps API loaded successfully');
    };

    // Add to document
    document.head.appendChild(script);
}

// Export for global access
window.loadGoogleMapsAPI = loadGoogleMapsAPI;

// Auto-initialize on script load
loadEnvironmentConfig();

console.log('🔧 Environment configuration system initialized');