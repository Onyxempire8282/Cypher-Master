/**
 * Color Scheme Manager
 * Ensures consistent color scheme application across all pages
 */

class ColorSchemeManager {
    constructor() {
        this.currentScheme = 'classic';
        this.init();
    }

    init() {
        console.log('🎨 Initializing Color Scheme Manager...');
        
        // Load saved scheme
        this.loadColorScheme();
        
        // Apply to current page
        this.applyColorScheme();
        
        // Listen for storage changes (cross-tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'colorScheme') {
                this.currentScheme = e.newValue || 'classic';
                this.applyColorScheme();
            }
        });
        
        console.log('✅ Color Scheme Manager ready - scheme:', this.currentScheme);
    }

    loadColorScheme() {
        // Try multiple sources
        const savedScheme = localStorage.getItem('colorScheme');
        const userCipher = localStorage.getItem('userCipher');
        
        if (savedScheme) {
            this.currentScheme = savedScheme;
        } else if (userCipher) {
            try {
                const cipher = JSON.parse(userCipher);
                this.currentScheme = cipher.colorScheme || 'classic';
            } catch (error) {
                console.warn('⚠️ Failed to parse userCipher for color scheme');
                this.currentScheme = 'classic';
            }
        }
        
        // Ensure valid scheme
        const validSchemes = ['classic', 'emerald', 'platinum', 'crimson'];
        if (!validSchemes.includes(this.currentScheme)) {
            this.currentScheme = 'classic';
        }
    }

    applyColorScheme() {
        // Remove existing scheme classes
        document.body.classList.remove('scheme-classic', 'scheme-emerald', 'scheme-platinum', 'scheme-crimson');
        
        // Remove existing data attribute
        document.body.removeAttribute('data-color-scheme');
        
        // Apply new scheme
        document.body.setAttribute('data-color-scheme', this.currentScheme);
        document.body.classList.add(`scheme-${this.currentScheme}`);
        
        // Update CSS custom properties for immediate effect
        this.updateCSSProperties();
        
        console.log(`🎨 Applied color scheme: ${this.currentScheme}`);
    }

    updateCSSProperties() {
        const schemeColors = {
            'classic': { 
                accent: '#ffd700', 
                border: 'rgba(255, 215, 0, 0.3)',
                shadow: 'rgba(255, 215, 0, 0.1)'
            },
            'emerald': { 
                accent: '#10b981', 
                border: 'rgba(16, 185, 129, 0.3)',
                shadow: 'rgba(16, 185, 129, 0.1)'
            },
            'platinum': { 
                accent: '#9ca3af', 
                border: 'rgba(156, 163, 175, 0.3)',
                shadow: 'rgba(156, 163, 175, 0.1)'
            },
            'crimson': { 
                accent: '#ef4444', 
                border: 'rgba(239, 68, 68, 0.3)',
                shadow: 'rgba(239, 68, 68, 0.1)'
            }
        };

        const colors = schemeColors[this.currentScheme];
        if (colors) {
            document.documentElement.style.setProperty('--cipher-accent', colors.accent);
            document.documentElement.style.setProperty('--glass-accent', colors.accent);
            document.documentElement.style.setProperty('--glass-border', colors.border);
            document.documentElement.style.setProperty('--glass-shadow', colors.shadow);
        }
    }

    setColorScheme(scheme) {
        if (!['classic', 'emerald', 'platinum', 'crimson'].includes(scheme)) {
            console.warn('⚠️ Invalid color scheme:', scheme);
            return;
        }

        this.currentScheme = scheme;
        
        // Save to localStorage
        localStorage.setItem('colorScheme', scheme);
        
        // Update userCipher if it exists
        const userCipher = localStorage.getItem('userCipher');
        if (userCipher) {
            try {
                const cipher = JSON.parse(userCipher);
                cipher.colorScheme = scheme;
                localStorage.setItem('userCipher', JSON.stringify(cipher));
            } catch (error) {
                console.warn('⚠️ Failed to update userCipher with color scheme');
            }
        }
        
        // Apply immediately
        this.applyColorScheme();
        
        console.log(`🎨 Color scheme changed to: ${scheme}`);
    }

    getCurrentScheme() {
        return this.currentScheme;
    }
}

// Auto-initialize on all pages
let colorSchemeManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        colorSchemeManager = new ColorSchemeManager();
        window.colorSchemeManager = colorSchemeManager;
    });
} else {
    colorSchemeManager = new ColorSchemeManager();
    window.colorSchemeManager = colorSchemeManager;
}

// Make available globally
window.ColorSchemeManager = ColorSchemeManager;