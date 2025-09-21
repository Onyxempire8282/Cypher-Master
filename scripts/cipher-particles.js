/**
 * Cipher Particles System
 * Creates sophisticated ambient particle effects for the cipher visualization
 */

class CipherParticles {
    constructor() {
        this.container = document.getElementById('cipherParticles');
        this.particles = [];
        this.isActive = false;
        this.mode = 'default';
        this.maxParticles = 50;
        
        this.init();
    }

    init() {
        console.log('✨ Cipher Particles System initializing...');
        this.setupParticleStyles();
    }

    setupParticleStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .cipher-particle {
                position: absolute;
                pointer-events: none;
                border-radius: 50%;
                opacity: 0;
                will-change: transform, opacity;
            }
            
            .particle-gold {
                background: radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, rgba(255, 215, 0, 0.2) 100%);
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
            }
            
            .particle-blue {
                background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.2) 100%);
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
            }
            
            .particle-green {
                background: radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(34, 197, 94, 0.2) 100%);
                box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
            }
            
            .particle-white {
                background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%);
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
            }
            
            .particle-data {
                background: linear-gradient(45deg, rgba(255, 215, 0, 0.6), rgba(59, 130, 246, 0.6));
                width: 8px !important;
                height: 2px !important;
                border-radius: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    /* ================================
       PARTICLE SYSTEM CONTROL
       ================================ */

    start() {
        console.log('🌟 Starting particle system...');
        this.isActive = true;
        this.generateParticles();
        this.startAnimationLoop();
    }

    stop() {
        this.isActive = false;
        this.clearParticles();
    }

    updateMode(newMode) {
        console.log(`✨ Updating particle mode to: ${newMode}`);
        this.mode = newMode;
        this.adjustParticlesForMode();
    }

    /* ================================
       PARTICLE GENERATION
       ================================ */

    generateParticles() {
        if (!this.isActive) return;

        const particleCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < particleCount; i++) {
            if (this.particles.length < this.maxParticles) {
                setTimeout(() => {
                    this.createParticle();
                }, i * 200);
            }
        }

        // Schedule next generation
        setTimeout(() => {
            this.generateParticles();
        }, 2000 + Math.random() * 3000);
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'cipher-particle';
        
        const particleData = this.generateParticleData();
        this.applyParticleProperties(particle, particleData);
        
        this.container.appendChild(particle);
        this.particles.push({
            element: particle,
            data: particleData
        });
        
        // Start particle animation
        this.animateParticle(particle, particleData);
    }

    generateParticleData() {
        const types = this.getParticleTypesForMode();
        const type = types[Math.floor(Math.random() * types.length)];
        
        return {
            type: type,
            size: this.getParticleSizeForType(type),
            startX: Math.random() * window.innerWidth,
            startY: window.innerHeight + 20,
            endX: Math.random() * window.innerWidth,
            endY: -20,
            duration: 8000 + Math.random() * 4000,
            delay: Math.random() * 2000,
            opacity: 0.4 + Math.random() * 0.4,
            drift: (Math.random() - 0.5) * 200,
            spin: Math.random() * 360
        };
    }

    getParticleTypesForMode() {
        switch (this.mode) {
            case 'urban':
                return ['white', 'blue', 'gold'];
            case 'rural':
                return ['green', 'gold', 'white'];
            case 'mixed':
                return ['gold', 'blue', 'green', 'white'];
            case 'finale':
                return ['gold', 'data', 'blue'];
            default:
                return ['gold', 'blue', 'white'];
        }
    }

    getParticleSizeForType(type) {
        switch (type) {
            case 'data':
                return { width: 8, height: 2 };
            case 'gold':
                return { width: 6, height: 6 };
            case 'blue':
                return { width: 4, height: 4 };
            case 'green':
                return { width: 5, height: 5 };
            case 'white':
                return { width: 3, height: 3 };
            default:
                return { width: 4, height: 4 };
        }
    }

    applyParticleProperties(particle, data) {
        particle.classList.add(`particle-${data.type}`);
        particle.style.width = `${data.size.width}px`;
        particle.style.height = `${data.size.height}px`;
        particle.style.left = `${data.startX}px`;
        particle.style.top = `${data.startY}px`;
    }

    /* ================================
       PARTICLE ANIMATION
       ================================ */

    animateParticle(particle, data) {
        const animation = particle.animate([
            {
                transform: `translate(0, 0) rotate(0deg)`,
                opacity: 0
            },
            {
                transform: `translate(${data.drift * 0.2}px, ${window.innerHeight * -0.2}px) rotate(${data.spin * 0.3}deg)`,
                opacity: data.opacity,
                offset: 0.1
            },
            {
                transform: `translate(${data.drift * 0.8}px, ${window.innerHeight * -0.8}px) rotate(${data.spin * 0.7}deg)`,
                opacity: data.opacity * 0.8,
                offset: 0.9
            },
            {
                transform: `translate(${data.drift}px, ${window.innerHeight * -1.2}px) rotate(${data.spin}deg)`,
                opacity: 0
            }
        ], {
            duration: data.duration,
            delay: data.delay,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });

        animation.addEventListener('finish', () => {
            this.removeParticle(particle);
        });
    }

    removeParticle(particleElement) {
        const index = this.particles.findIndex(p => p.element === particleElement);
        if (index > -1) {
            this.particles.splice(index, 1);
        }
        
        if (particleElement.parentNode) {
            particleElement.parentNode.removeChild(particleElement);
        }
    }

    /* ================================
       MODE-SPECIFIC ADJUSTMENTS
       ================================ */

    adjustParticlesForMode() {
        switch (this.mode) {
            case 'urban':
                this.maxParticles = 30;
                break;
            case 'rural':
                this.maxParticles = 40;
                break;
            case 'mixed':
                this.maxParticles = 35;
                break;
            case 'finale':
                this.maxParticles = 80;
                break;
            default:
                this.maxParticles = 50;
        }
    }

    /* ================================
       SPECIAL EFFECTS
       ================================ */

    playFinale() {
        console.log('🎆 Playing finale particle effects...');
        this.mode = 'finale';
        this.maxParticles = 100;
        
        // Burst of finale particles
        this.createFinaleParticleBurst();
        
        // Enhanced generation rate
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createFinaleParticle();
            }, i * 100);
        }
    }

    createFinaleParticleBurst() {
        const center = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 100 + Math.random() * 200;
            
            const particle = document.createElement('div');
            particle.className = 'cipher-particle particle-gold';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.left = `${center.x}px`;
            particle.style.top = `${center.y}px`;
            
            this.container.appendChild(particle);
            
            const endX = center.x + Math.cos(angle) * radius;
            const endY = center.y + Math.sin(angle) * radius;
            
            const animation = particle.animate([
                {
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1
                },
                {
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1,
                    offset: 0.2
                },
                {
                    transform: `translate(${endX - center.x}px, ${endY - center.y}px) scale(0.5)`,
                    opacity: 0
                }
            ], {
                duration: 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            animation.addEventListener('finish', () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }
    }

    createFinaleParticle() {
        const particle = document.createElement('div');
        particle.className = 'cipher-particle';
        
        const types = ['gold', 'data', 'blue'];
        const type = types[Math.floor(Math.random() * types.length)];
        particle.classList.add(`particle-${type}`);
        
        const size = type === 'data' ? { width: 12, height: 3 } : { width: 8, height: 8 };
        particle.style.width = `${size.width}px`;
        particle.style.height = `${size.height}px`;
        
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight + 20;
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        
        this.container.appendChild(particle);
        
        const animation = particle.animate([
            {
                transform: 'translate(0, 0) rotate(0deg) scale(0)',
                opacity: 0
            },
            {
                transform: 'translate(0, -100px) rotate(90deg) scale(1)',
                opacity: 0.8,
                offset: 0.1
            },
            {
                transform: `translate(${(Math.random() - 0.5) * 300}px, -${window.innerHeight + 100}px) rotate(360deg) scale(0.5)`,
                opacity: 0
            }
        ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        animation.addEventListener('finish', () => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
    }

    /* ================================
       DATA FLOW PARTICLES
       ================================ */

    createDataFlowEffect(fromElement, toElement) {
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        const startX = fromRect.left + fromRect.width / 2;
        const startY = fromRect.top + fromRect.height / 2;
        const endX = toRect.left + toRect.width / 2;
        const endY = toRect.top + toRect.height / 2;
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createDataParticle(startX, startY, endX, endY);
            }, i * 100);
        }
    }

    createDataParticle(startX, startY, endX, endY) {
        const particle = document.createElement('div');
        particle.className = 'cipher-particle particle-data';
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        
        this.container.appendChild(particle);
        
        const animation = particle.animate([
            {
                transform: 'translate(-50%, -50%) scale(0)',
                opacity: 0
            },
            {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1,
                offset: 0.1
            },
            {
                transform: `translate(${endX - startX - 4}px, ${endY - startY - 1}px) scale(0.5)`,
                opacity: 0
            }
        ], {
            duration: 1500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        animation.addEventListener('finish', () => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
    }

    /* ================================
       UTILITY METHODS
       ================================ */

    startAnimationLoop() {
        // Performance monitoring for particles
        setInterval(() => {
            if (this.particles.length > this.maxParticles * 1.5) {
                console.log(`🧹 Cleaning up excess particles: ${this.particles.length}`);
                this.cleanupExcessParticles();
            }
        }, 5000);
    }

    cleanupExcessParticles() {
        const excessCount = this.particles.length - this.maxParticles;
        for (let i = 0; i < excessCount; i++) {
            if (this.particles[i]) {
                this.removeParticle(this.particles[i].element);
            }
        }
    }

    clearParticles() {
        this.particles.forEach(particle => {
            if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        });
        this.particles = [];
    }

    /* ================================
       PERFORMANCE OPTIMIZATION
       ================================ */

    setPerformanceMode(mode) {
        switch (mode) {
            case 'high':
                this.maxParticles = 80;
                break;
            case 'medium':
                this.maxParticles = 50;
                break;
            case 'low':
                this.maxParticles = 20;
                break;
        }
        
        // Adjust existing particles if over limit
        if (this.particles.length > this.maxParticles) {
            this.cleanupExcessParticles();
        }
    }
}

// Export for global access
window.CipherParticles = CipherParticles;