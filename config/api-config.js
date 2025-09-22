/**
 * API Configuration for Local Development
 * This file should NOT be committed to git (add to .gitignore)
 *
 * SECURITY NOTE: API keys have been moved to environment configuration
 * Create a .env file from .env.example and add your actual API keys there
 */

window.MILEAGE_CYPHER_CONFIG = {
    // API keys are now loaded from environment configuration
    // See config/env-config.js for secure key loading
    GOOGLE_MAPS_API_KEY: window.ENV_CONFIG?.GOOGLE_MAPS_API_KEY || null
};

// Warning if API key is not configured
if (!window.MILEAGE_CYPHER_CONFIG.GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API key not configured. Create .env file from .env.example');
} else {
    console.log('🗺️ Google Maps API configuration loaded securely');
}