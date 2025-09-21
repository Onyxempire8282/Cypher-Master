/**
 * Cipher Begins Initialization
 * Separated initialization logic for clean debugging
 */

// Initialize the Cipher Begins experience immediately
console.log('🎤 Initializing Cipher Begins...');

function initializeCipher() {
    try {
        console.log('🎤 The Cipher Begins...');
        
        // Check if classes are available
        if (typeof CipherBeginsController === 'undefined') {
            console.log('⏳ CipherBeginsController not yet loaded, retrying...');
            setTimeout(initializeCipher, 50);
            return;
        }
        
        if (typeof CipherVisualization === 'undefined') {
            console.log('⏳ CipherVisualization not yet loaded, retrying...');
            setTimeout(initializeCipher, 50);
            return;
        }
        
        if (typeof CipherParticles === 'undefined') {
            console.log('⏳ CipherParticles not yet loaded, retrying...');
            setTimeout(initializeCipher, 50);
            return;
        }
        
        window.cipherBegins = new CipherBeginsController();
        window.cipherVisualization = new CipherVisualization();
        window.cipherParticles = new CipherParticles();
        console.log('✅ Cipher initialization complete');
    } catch (error) {
        console.error('❌ Cipher initialization failed:', error);
        // Retry after a short delay
        setTimeout(initializeCipher, 100);
    }
}

// Try to initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeCipher);
} else {
    initializeCipher();
}