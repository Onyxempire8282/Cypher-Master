/**
 * Cipher Begins Event Handlers
 * Separated for clean debugging and TripleTen standards
 */

class CipherBeginsEvents {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        // Wait for DOM and controller to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        try {
            // Primary CTA - Begin Journey
            const beginJourneyBtn = document.querySelector('[data-action="begin-journey"]');
            if (beginJourneyBtn) {
                beginJourneyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.cipherBegins) {
                        window.cipherBegins.startJourney();
                    }
                });
            }

            // Secondary CTA - Show Login
            const showLoginBtn = document.querySelector('[data-action="show-login"]');
            if (showLoginBtn) {
                showLoginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.cipherBegins) {
                        window.cipherBegins.showLogin();
                    }
                });
            }

            // Navigation buttons
            const prevBtn = document.getElementById('prevBtn');
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.cipherBegins) {
                        window.cipherBegins.previousStep();
                    }
                });
            }

            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.cipherBegins) {
                        window.cipherBegins.nextStep();
                    }
                });
            }

            // Color scheme confirmation
            const confirmSchemeBtn = document.getElementById('confirmScheme');
            if (confirmSchemeBtn) {
                confirmSchemeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.cipherBegins) {
                        window.cipherBegins.completeSetup();
                    }
                });
            }

            // Login form submit
            const loginSubmitBtn = document.querySelector('[data-action="handle-login"]');
            if (loginSubmitBtn) {
                loginSubmitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.cipherBegins) {
                        window.cipherBegins.handleLogin();
                    }
                });
            }

            // Back to welcome screen
            const backToWelcomeLink = document.querySelector('[data-action="back-to-welcome"]');
            if (backToWelcomeLink) {
                backToWelcomeLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.cipherBegins) {
                        window.cipherBegins.showScreen('welcomeScreen');
                    }
                });
            }

            // Color scheme selection
            const colorSchemes = document.querySelectorAll('.scheme-option');
            colorSchemes.forEach(scheme => {
                scheme.addEventListener('click', (e) => {
                    const schemeType = e.currentTarget.dataset.scheme;
                    if (window.cipherBegins && schemeType) {
                        window.cipherBegins.selectColorScheme(schemeType);
                    }
                });
            });

            console.log('✅ Cipher Begins events bound successfully');

        } catch (error) {
            console.error('❌ Error binding Cipher Begins events:', error);
        }
    }
}

// Initialize events when this file loads
window.cipherBeginsEvents = new CipherBeginsEvents();