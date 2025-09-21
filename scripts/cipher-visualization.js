/**
 * Cipher Visualization System
 * Creates the progressive visual building of the user's professional cipher
 */

class CipherVisualization {
    constructor() {
        this.canvas = document.getElementById('cipherCanvas');
        this.environment = document.getElementById('cipherEnvironment');
        this.circle = document.getElementById('cipherCircle');
        this.mainFigure = document.getElementById('mainFigure');
        this.connectedFigures = document.getElementById('connectedFigures');
        this.energyFlows = document.getElementById('energyFlows');
        
        this.isActive = false;
        this.connectedFigureCount = 0;
        this.energyLines = [];
        
        // Hip-hop cipher styles
        this.cipherStyles = {
            beginner: {
                figure: 'novice_rapper',
                position: 'cipher_edge',
                aura: 'learning_glow',
                accessories: ['backpack', 'backwards_hat', 'notebook'],
                animation: 'observing_cipher'
            },
            seasoned: {
                figure: 'expert_rapper',
                position: 'cipher_center',
                aura: 'performance_energy',
                accessories: ['microphone', 'chains', 'spotlight'],
                animation: 'performing_flow'
            },
            master: {
                figure: 'og_rapper',
                position: 'cipher_throne',
                aura: 'divine_presence',
                accessories: ['crown', 'wisdom_aura', 'disciples'],
                animation: 'commanding_presence'
            }
        };
        
        this.init();
    }

    init() {
        console.log('🎨 Cipher Visualization initializing...');
        this.setupEnvironmentLayers();
    }

    setupEnvironmentLayers() {
        const skyLayer = document.getElementById('skyLayer');
        const landscapeLayer = document.getElementById('landscapeLayer');
        const networkLayer = document.getElementById('networkLayer');
        
        // Initialize environment layers
        skyLayer.classList.add('active');
    }

    /* ================================
       VISUALIZATION TRIGGERS
       ================================ */

    startVisualization() {
        console.log('🌟 Starting cipher visualization...');
        this.isActive = true;
        
        // Show initial environment
        this.environment.style.opacity = '1';
        
        // Show cipher circle but start small (will grow with steps)
        this.circle.classList.add('active');
        this.circle.style.width = '150px';
        this.circle.style.height = '150px';
        this.circle.style.opacity = '0.3';
        
        // Start particle system
        if (window.cipherParticles) {
            window.cipherParticles.start();
        }
        
        // Initialize growth tracking
        this.orbGrowthStage = 0;
        this.maxGrowthStage = 7; // Total steps
    }

    showMainFigure(identityData) {
        console.log('👤 Showing main figure...', identityData);
        
        // Activate cipher circle
        this.circle.classList.add('active');
        
        // Show main figure with experience-based styling
        setTimeout(() => {
            this.mainFigure.classList.add('active');
            
            if (identityData.experience) {
                this.styleMainFigure(identityData.experience);
            }
        }, 800);
    }

    styleMainFigure(experience) {
        console.log(`🎤 Styling main figure for experience: ${experience}`);
        
        const figureCore = this.mainFigure.querySelector('.figure-core');

        // Remove existing experience classes
        figureCore.classList.remove('beginner', 'seasoned', 'master', 'novice', 'expert', 'og');

        // Add new cipher style
        figureCore.classList.add(experience);

        // Apply clean orb styling without accessories
        this.applyCipherOrbStyling(experience);

        // Store experience for later reference
        this.currentExperience = experience;
    }

    applyCipherOrbStyling(experience) {
        const figureCore = this.mainFigure.querySelector('.figure-core');
        
        // Clean orb styling based on experience level
        switch (experience) {
            case 'beginner':
                // Novice: Soft green-blue gradient with gentle pulse
                figureCore.style.background = 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(59, 130, 246, 0.3) 50%, rgba(34, 197, 94, 0.2) 100%)';
                figureCore.style.boxShadow = 'inset 0 0 30px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.4)';
                figureCore.style.animation = 'gentlePulse 4s ease-in-out infinite';
                break;
                
            case 'seasoned':
                // Expert: Golden energy with dynamic pulse
                figureCore.style.background = 'radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 165, 0, 0.4) 50%, rgba(255, 215, 0, 0.3) 100%)';
                figureCore.style.boxShadow = 'inset 0 0 40px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.6)';
                figureCore.style.animation = 'energyPulse 3s ease-in-out infinite';
                break;
                
            case 'master':
                // OG: Divine multi-layered aura with complex animation
                figureCore.style.background = 'radial-gradient(circle, rgba(147, 51, 234, 0.5) 0%, rgba(255, 215, 0, 0.4) 30%, rgba(255, 255, 255, 0.3) 60%, rgba(147, 51, 234, 0.2) 100%)';
                figureCore.style.boxShadow = `
                    inset 0 0 50px rgba(147, 51, 234, 0.4),
                    inset 0 0 30px rgba(255, 215, 0, 0.3),
                    0 0 40px rgba(147, 51, 234, 0.6),
                    0 0 60px rgba(255, 215, 0, 0.4)
                `;
                figureCore.style.animation = 'divinePulse 2.5s ease-in-out infinite';
                break;
        }
        
        // Remove all accessories from the orb
        this.clearAllAccessories();
        
        // Instead, add subtle status indicators around the orb
        this.addStatusIndicators(experience);
    }

    clearAllAccessories() {
        // Remove all visual accessories from the figure and circle
        const accessories = this.mainFigure.querySelectorAll('.cipher-accessory');
        const disciples = this.circle.querySelectorAll('[style*="font-size: 8px"]');
        
        accessories.forEach(accessory => accessory.remove());
        disciples.forEach(disciple => disciple.remove());
    }

    addStatusIndicators(experience) {
        // Remove existing status indicators
        const existingIndicators = this.circle.querySelectorAll('.status-indicator');
        existingIndicators.forEach(indicator => indicator.remove());
        
        // Add orbital status indicators around the orb
        const indicators = this.getStatusIndicators(experience);
        
        indicators.forEach((indicator, index) => {
            const statusElement = document.createElement('div');
            statusElement.className = 'status-indicator';
            statusElement.innerHTML = indicator.symbol;
            
            // Position indicators in orbit around the orb
            const angle = (index / indicators.length) * 2 * Math.PI;
            const radius = 180; // Distance from orb center
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            statusElement.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px));
                font-size: 14px;
                opacity: 0.8;
                animation: statusOrbit 20s linear infinite;
                animation-delay: ${index * 0.5}s;
                filter: drop-shadow(0 0 8px ${indicator.color});
                pointer-events: none;
            `;
            
            this.circle.appendChild(statusElement);
        });
    }

    getStatusIndicators(experience) {
        switch (experience) {
            case 'beginner':
                return [
                    { symbol: '📚', color: 'rgba(34, 197, 94, 0.8)' }, // Learning
                    { symbol: '🎯', color: 'rgba(59, 130, 246, 0.8)' }, // Focus
                    { symbol: '🌱', color: 'rgba(34, 197, 94, 0.6)' }  // Growth
                ];
            case 'seasoned':
                return [
                    { symbol: '⚡', color: 'rgba(255, 215, 0, 0.8)' }, // Energy
                    { symbol: '🔥', color: 'rgba(255, 165, 0, 0.8)' }, // Passion
                    { symbol: '🎯', color: 'rgba(255, 215, 0, 0.6)' }, // Precision
                    { symbol: '⭐', color: 'rgba(255, 215, 0, 0.7)' }  // Excellence
                ];
            case 'master':
                return [
                    { symbol: '✨', color: 'rgba(255, 255, 255, 0.9)' }, // Wisdom
                    { symbol: '🌟', color: 'rgba(255, 215, 0, 0.8)' },  // Mastery
                    { symbol: '👁️', color: 'rgba(147, 51, 234, 0.8)' }, // Vision
                    { symbol: '🔮', color: 'rgba(147, 51, 234, 0.6)' }, // Insight
                    { symbol: '⚖️', color: 'rgba(255, 215, 0, 0.7)' }   // Judgment
                ];
            default:
                return [];
        }
    }

    addCipherAccessories(accessories) {
        console.log('🎨 Adding cipher accessories:', accessories);
        
        // Clear existing accessories
        this.clearAccessories();

        accessories.forEach((accessory, index) => {
            setTimeout(() => {
                this.renderAccessory(accessory);
            }, index * 200);
        });
    }

    clearAccessories() {
        // Remove existing accessories
        const existingAccessories = this.mainFigure.querySelectorAll('.cipher-accessory');
        existingAccessories.forEach(accessory => accessory.remove());
    }

    renderAccessory(accessoryType) {
        const accessory = document.createElement('div');
        accessory.className = `cipher-accessory ${accessoryType}`;

        switch(accessoryType) {
            case 'backpack':
                accessory.innerHTML = '🎒';
                accessory.style.cssText = `
                    position: absolute;
                    top: -15px;
                    left: -20px;
                    font-size: 16px;
                    animation: backpackBob 2s ease-in-out infinite;
                    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
                `;
                break;

            case 'backwards_hat':
                accessory.innerHTML = '🧢';
                accessory.style.cssText = `
                    position: absolute;
                    top: -12px;
                    right: -15px;
                    font-size: 14px;
                    transform: rotate(180deg);
                    animation: hatTilt 3s ease-in-out infinite;
                    filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
                `;
                break;

            case 'notebook':
                accessory.innerHTML = '📝';
                accessory.style.cssText = `
                    position: absolute;
                    bottom: -15px;
                    right: -10px;
                    font-size: 12px;
                    animation: noteFlip 4s ease-in-out infinite;
                    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4));
                `;
                break;

            case 'microphone':
                accessory.innerHTML = '🎤';
                accessory.style.cssText = `
                    position: absolute;
                    top: -18px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 18px;
                    animation: micBounce 1.5s ease-in-out infinite;
                    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
                `;
                break;

            case 'chains':
                accessory.innerHTML = '⛓️';
                accessory.style.cssText = `
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 14px;
                    animation: chainSwing 2s ease-in-out infinite;
                    filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
                `;
                break;

            case 'spotlight':
                accessory.innerHTML = '💡';
                accessory.style.cssText = `
                    position: absolute;
                    top: -25px;
                    right: -20px;
                    font-size: 12px;
                    animation: spotlightGlow 2s ease-in-out infinite;
                    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 1));
                `;
                break;

            case 'crown':
                accessory.innerHTML = '👑';
                accessory.style.cssText = `
                    position: absolute;
                    top: -20px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 22px;
                    animation: crownFloat 4s ease-in-out infinite;
                    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 1));
                `;
                break;

            case 'wisdom_aura':
                accessory.innerHTML = '✨';
                accessory.style.cssText = `
                    position: absolute;
                    top: -10px;
                    left: -25px;
                    font-size: 10px;
                    animation: wisdomSparkle 3s ease-in-out infinite;
                    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
                `;
                break;

            case 'disciples':
                // Create multiple small figures around the OG
                for (let i = 0; i < 3; i++) {
                    const disciple = document.createElement('div');
                    disciple.innerHTML = '👤';
                    disciple.style.cssText = `
                        position: absolute;
                        font-size: 8px;
                        color: rgba(255, 215, 0, 0.6);
                        animation: discipleReverence 4s ease-in-out infinite;
                        animation-delay: ${i * 0.5}s;
                    `;
                    
                    // Position disciples around the OG
                    const angle = (i / 3) * 2 * Math.PI;
                    const radius = 35;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    disciple.style.left = `calc(50% + ${x}px)`;
                    disciple.style.top = `calc(50% + ${y}px)`;
                    
                    this.circle.appendChild(disciple);
                }
                return; // Don't add the main accessory element
        }

        this.mainFigure.appendChild(accessory);
    }

    setCipherPosition(position) {
        console.log(`🎤 Setting cipher position: ${position}`);
        
        switch(position) {
            case 'cipher_edge':
                this.mainFigure.style.transform = 'translate(-80%, -50%)';
                this.mainFigure.style.zIndex = '5';
                break;
            case 'cipher_center':
                this.mainFigure.style.transform = 'translate(-50%, -50%)';
                this.mainFigure.style.zIndex = '8';
                break;
            case 'cipher_throne':
                this.mainFigure.style.transform = 'translate(-50%, -60%)';
                this.mainFigure.style.zIndex = '10';
                this.mainFigure.style.scale = '1.2';
                break;
        }
    }

    applyCipherAura(auraType) {
        console.log(`🎤 Applying cipher aura: ${auraType}`);
        
        // Remove existing auras
        const existingAuras = this.mainFigure.querySelectorAll('.cipher-aura');
        existingAuras.forEach(aura => aura.remove());

        const aura = document.createElement('div');
        aura.className = `cipher-aura ${auraType}`;

        switch(auraType) {
            case 'learning_glow':
                aura.style.cssText = `
                    position: absolute;
                    top: -20px;
                    left: -20px;
                    right: -20px;
                    bottom: -20px;
                    border-radius: 50%;
                    background: radial-gradient(circle,
                        rgba(34, 197, 94, 0.2) 0%,
                        rgba(34, 197, 94, 0.1) 50%,
                        transparent 100%);
                    animation: learningPulse 3s ease-in-out infinite;
                    pointer-events: none;
                `;
                break;

            case 'performance_energy':
                aura.style.cssText = `
                    position: absolute;
                    top: -25px;
                    left: -25px;
                    right: -25px;
                    bottom: -25px;
                    border-radius: 50%;
                    background: radial-gradient(circle,
                        rgba(255, 215, 0, 0.3) 0%,
                        rgba(255, 165, 0, 0.2) 50%,
                        transparent 100%);
                    animation: performanceEnergy 2s ease-in-out infinite;
                    pointer-events: none;
                `;
                break;

            case 'divine_presence':
                aura.style.cssText = `
                    position: absolute;
                    top: -35px;
                    left: -35px;
                    right: -35px;
                    bottom: -35px;
                    border-radius: 50%;
                    background: radial-gradient(circle,
                        rgba(147, 51, 234, 0.2) 0%,
                        rgba(255, 215, 0, 0.2) 30%,
                        rgba(255, 255, 255, 0.1) 60%,
                        transparent 100%);
                    animation: divinePresence 4s ease-in-out infinite;
                    pointer-events: none;
                `;
                
                // Add rotating divine aura
                const rotatingAura = document.createElement('div');
                rotatingAura.style.cssText = `
                    position: absolute;
                    top: -30px;
                    left: -30px;
                    right: -30px;
                    bottom: -30px;
                    border-radius: 50%;
                    background: radial-gradient(circle,
                        transparent 60%,
                        rgba(147, 51, 234, 0.1) 70%,
                        rgba(255, 215, 0, 0.1) 80%,
                        transparent 90%);
                    animation: divineAura 6s linear infinite;
                    pointer-events: none;
                `;
                aura.appendChild(rotatingAura);
                break;
        }

        this.mainFigure.appendChild(aura);
    }

    startCipherAnimation(animationType) {
        console.log(`🎤 Starting cipher animation: ${animationType}`);
        
        const figureCore = this.mainFigure.querySelector('.figure-core');
        
        // Remove existing animation classes
        figureCore.classList.remove('observing-cipher', 'performing-flow', 'commanding-presence');
        
        // Add new animation
        figureCore.classList.add(animationType.replace('_', '-'));
    }

    /* ================================
       CIPHER POSITIONING SYSTEM
       ================================ */

    showCipherPositioning() {
        console.log('🎤 Showing cipher positioning preview...');

        // Show empty cipher circle first
        this.circle.classList.add('active');

        // Add positioning indicators
        this.addCipherPositions();

        // Show preview figures for each level
        this.showLevelPreviews();
    }

    addCipherPositions() {
        // Create positioning preview overlay
        const positionPreview = document.createElement('div');
        positionPreview.className = 'cipher-positioning-preview';
        positionPreview.innerHTML = `
            <div class="position-indicator edge" title="Novice Position - Edge of Cipher"></div>
            <div class="position-indicator center" title="Expert Position - Center Stage"></div>
            <div class="position-indicator throne" title="OG Position - Throne"></div>
        `;
        
        this.circle.appendChild(positionPreview);
        
        // Auto-remove preview after 5 seconds
        setTimeout(() => {
            if (positionPreview.parentNode) {
                positionPreview.remove();
            }
        }, 5000);
    }

    showLevelPreviews() {
        // Show preview silhouettes for each experience level
        const levelPreviews = [
            { level: 'novice', icon: '🎒', position: { x: -80, y: 0 } },
            { level: 'expert', icon: '🎤', position: { x: 0, y: 0 } },
            { level: 'og', icon: '👑', position: { x: 0, y: -20 } }
        ];

        levelPreviews.forEach((preview, index) => {
            setTimeout(() => {
                const previewFigure = document.createElement('div');
                previewFigure.className = `level-preview ${preview.level}`;
                previewFigure.innerHTML = preview.icon;
                previewFigure.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(calc(-50% + ${preview.position.x}%), calc(-50% + ${preview.position.y}%));
                    font-size: 24px;
                    opacity: 0.6;
                    animation: previewPulse 2s ease-in-out infinite;
                    pointer-events: none;
                    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.6));
                `;
                
                this.circle.appendChild(previewFigure);
                
                // Remove preview after 4 seconds
                setTimeout(() => {
                    if (previewFigure.parentNode) {
                        previewFigure.remove();
                    }
                }, 4000);
            }, index * 800);
        });
        
        // Add preview pulse animation
        if (!document.querySelector('#previewPulseStyle')) {
            const style = document.createElement('style');
            style.id = 'previewPulseStyle';
            style.textContent = `
                @keyframes previewPulse {
                    0%, 100% { opacity: 0.4; transform: translate(var(--x), var(--y)) scale(1); }
                    50% { opacity: 0.8; transform: translate(var(--x), var(--y)) scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    personalizeMainFigure(identityData) {
        console.log('👤 Personalizing main figure...', identityData);
        
        // Start orb growth from step 2
        this.startOrbGrowth();
        
        // Show main figure if not already shown
        if (!this.mainFigure.classList.contains('active')) {
            this.mainFigure.classList.add('active');
        }
        
        // Add personalization based on name and years of experience
        if (identityData.fullName) {
            this.addNameLabel(identityData.fullName);
        }
        
        if (identityData.yearsExperience) {
            this.addExperienceIndicator(identityData.yearsExperience);
        }
    }

    /* ================================
       PROGRESSIVE ORB GROWTH SYSTEM
       ================================ */

    startOrbGrowth() {
        console.log('🌟 Starting orb growth sequence...');
        this.growOrb(2); // Step 2 - first growth
    }

    growOrb(step) {
        this.orbGrowthStage = step;
        
        // Calculate growth parameters
        const baseSize = 150;
        const growthFactor = (step / this.maxGrowthStage);
        const newSize = baseSize + (250 * growthFactor); // Grows from 150px to 400px
        const newOpacity = 0.3 + (0.7 * growthFactor); // Grows from 0.3 to 1.0
        const pulseIntensity = 0.2 + (0.8 * growthFactor); // Pulse intensity increases
        
        console.log(`🌟 Growing orb to step ${step}: size=${newSize}px, opacity=${newOpacity}`);
        
        // Apply growth animation
        this.circle.style.transition = 'all 2s cubic-bezier(0.23, 1, 0.32, 1)';
        this.circle.style.width = `${newSize}px`;
        this.circle.style.height = `${newSize}px`;
        this.circle.style.opacity = newOpacity.toString();
        
        // Add birthing aura effect
        this.addBirthingAura(step, pulseIntensity);
        
        // Enhanced energy ripples
        this.addEnergyRipples(step);
        
        // Vibration effect for final steps
        if (step >= 6) {
            this.addVibrationEffect(step);
        }
    }

    addBirthingAura(step, intensity) {
        // Remove existing birthing aura
        const existingAura = this.circle.querySelector('.birthing-aura');
        if (existingAura) {
            existingAura.remove();
        }
        
        const birthingAura = document.createElement('div');
        birthingAura.className = 'birthing-aura';
        birthingAura.style.cssText = `
            position: absolute;
            top: -50px;
            left: -50px;
            right: -50px;
            bottom: -50px;
            border-radius: 50%;
            background: radial-gradient(circle,
                rgba(255, 215, 0, ${intensity * 0.3}) 0%,
                rgba(255, 255, 255, ${intensity * 0.2}) 30%,
                rgba(147, 51, 234, ${intensity * 0.1}) 60%,
                transparent 100%);
            animation: birthingPulse ${3 - (step * 0.2)}s ease-in-out infinite;
            pointer-events: none;
        `;
        
        this.circle.appendChild(birthingAura);
    }

    addEnergyRipples(step) {
        // Create energy ripple effects
        for (let i = 0; i < step; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.className = 'energy-ripple';
                ripple.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    border: 2px solid rgba(255, 215, 0, 0.6);
                    border-radius: 50%;
                    animation: rippleExpand 3s ease-out forwards;
                    pointer-events: none;
                `;
                
                this.circle.appendChild(ripple);
                
                // Remove ripple after animation
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.remove();
                    }
                }, 3000);
            }, i * 500);
        }
    }

    addVibrationEffect(step) {
        // Intense vibration effect for final steps
        const vibrationIntensity = (step - 5) * 2; // Increases for steps 6-7
        
        this.circle.style.animation = `orbVibration ${0.5 - (vibrationIntensity * 0.1)}s ease-in-out infinite`;
    }

    addNameLabel(name) {
        // Remove existing name label
        const existingLabel = this.circle.querySelector('.name-label');
        if (existingLabel) {
            existingLabel.remove();
        }
        
        // Add name as a subtle overlay inside the orb
        const nameLabel = document.createElement('div');
        nameLabel.className = 'name-label';
        nameLabel.textContent = name.split(' ')[0]; // First name only
        nameLabel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            font-weight: var(--cipher-font-weight-bold);
            text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: nameGlow 3s ease-in-out infinite;
            pointer-events: none;
            z-index: 2;
        `;
        
        this.circle.appendChild(nameLabel);
    }

    addExperienceIndicator(years) {
        // Remove existing experience indicator
        const existingIndicator = this.circle.querySelector('.experience-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add years as a subtle indicator below the name
        const indicator = document.createElement('div');
        indicator.className = 'experience-indicator';
        indicator.textContent = `${years} years`;
        indicator.style.cssText = `
            position: absolute;
            top: 60%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.7rem;
            font-weight: var(--cipher-font-weight-medium);
            text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: experienceSubtleGlow 4s ease-in-out infinite;
            pointer-events: none;
            z-index: 2;
        `;
        
        this.circle.appendChild(indicator);
    }

    completeCipherConnection(contactData) {
        console.log('📱 Completing cipher connection...', contactData);
        
        // Final orb growth - Step 7
        this.growOrb(7);
        
        // Final enhancements to the cipher
        this.addContactIndicators(contactData);
        this.enhanceAllConnections();
        
        // Show completion celebration
        this.showCompletionCelebration();
    }

    addContactIndicators(contactData) {
        // Add email connectivity indicator
        if (contactData.email) {
            const emailIndicator = document.createElement('div');
            emailIndicator.className = 'contact-indicator email';
            emailIndicator.innerHTML = '📧';
            emailIndicator.style.cssText = `
                position: absolute;
                top: -15px;
                left: -25px;
                font-size: 12px;
                animation: contactPulse 2s ease-in-out infinite;
                filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
            `;
            this.mainFigure.appendChild(emailIndicator);
        }
        
        // Add mobile connectivity indicator
        if (contactData.deviceType) {
            const mobileIcon = contactData.deviceType === 'ios' ? '📱' : 
                             contactData.deviceType === 'android' ? '🤖' : '📱🤖';
            
            const mobileIndicator = document.createElement('div');
            mobileIndicator.className = 'contact-indicator mobile';
            mobileIndicator.innerHTML = mobileIcon;
            mobileIndicator.style.cssText = `
                position: absolute;
                top: -15px;
                right: -25px;
                font-size: 12px;
                animation: contactPulse 2s ease-in-out infinite;
                animation-delay: 0.5s;
                filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6));
            `;
            this.mainFigure.appendChild(mobileIndicator);
        }
        
        // Add contact pulse animation if not exists
        if (!document.querySelector('#contactPulseStyle')) {
            const style = document.createElement('style');
            style.id = 'contactPulseStyle';
            style.textContent = `
                @keyframes contactPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showCompletionCelebration() {
        // Create celebration effect
        const celebration = document.createElement('div');
        celebration.className = 'cipher-completion-celebration';
        celebration.innerHTML = `
            <div class="celebration-ring"></div>
            <div class="celebration-ring" style="animation-delay: 0.5s;"></div>
            <div class="celebration-ring" style="animation-delay: 1s;"></div>
        `;
        
        this.circle.appendChild(celebration);
        
        // Add celebration styles
        const style = document.createElement('style');
        style.textContent = `
            .cipher-completion-celebration {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }
            
            .celebration-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100px;
                height: 100px;
                border: 2px solid rgba(255, 215, 0, 0.8);
                border-radius: 50%;
                animation: celebrationExpand 3s ease-out forwards;
            }
            
            @keyframes celebrationExpand {
                0% {
                    width: 50px;
                    height: 50px;
                    opacity: 1;
                    border-width: 3px;
                }
                100% {
                    width: 400px;
                    height: 400px;
                    opacity: 0;
                    border-width: 1px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Remove celebration after animation
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.remove();
            }
        }, 3500);
    }

    showEnvironment(territoryData) {
        console.log('🗺️ Updating environment...', territoryData);
        
        // Continue orb growth - Step 3
        this.growOrb(3);
        
        const landscapeLayer = document.getElementById('landscapeLayer');
        
        if (territoryData.territoryType) {
            // Clear existing territory classes
            landscapeLayer.classList.remove('urban', 'rural', 'mixed');
            
            // Add new territory type
            landscapeLayer.classList.add(territoryData.territoryType);
            landscapeLayer.classList.add('active');
            
            // Update environment particles based on territory
            this.updateEnvironmentParticles(territoryData.territoryType);
        }
    }

    updateEnvironmentParticles(territoryType) {
        if (window.cipherParticles) {
            window.cipherParticles.updateMode(territoryType);
        }
    }

    expandCircle(travelData) {
        console.log('🚗 Expanding cipher circle...', travelData);
        
        // Continue orb growth - Step 4
        this.growOrb(4);
        
        if (travelData.maxDistance) {
            // Expand circle based on travel distance
            this.circle.classList.add('expanded');
            
            // Calculate expansion size based on distance
            let size = 300; // Base size
            switch (travelData.maxDistance) {
                case '25':
                    size = 350;
                    break;
                case '50':
                    size = 450;
                    break;
                case '100':
                    size = 550;
                    break;
                case 'unlimited':
                    size = 650;
                    break;
            }
            
            // Apply expansion animation
            setTimeout(() => {
                this.circle.style.width = `${size}px`;
                this.circle.style.height = `${size}px`;
            }, 500);
            
            // Add travel indicators
            this.showTravelIndicators(travelData);
        }
    }

    showTravelIndicators(travelData) {
        // Create travel range indicators
        const travelIndicator = document.createElement('div');
        travelIndicator.className = 'travel-range-indicator';
        travelIndicator.innerHTML = `
            <div class="range-ring" style="animation-delay: 0s;"></div>
            <div class="range-ring" style="animation-delay: 0.5s;"></div>
            <div class="range-ring" style="animation-delay: 1s;"></div>
        `;
        
        this.circle.appendChild(travelIndicator);
        
        // Style the range indicator
        const style = document.createElement('style');
        style.textContent = `
            .travel-range-indicator {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            
            .range-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 50%;
                width: 120%;
                height: 120%;
                animation: expandRing 3s ease-out infinite;
                opacity: 0;
            }
            
            @keyframes expandRing {
                0% {
                    width: 100%;
                    height: 100%;
                    opacity: 1;
                }
                100% {
                    width: 200%;
                    height: 200%;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    showConnectedFigures(networkData) {
        console.log('🏢 Showing connected figures...', networkData);
        
        // Continue orb growth - Step 5
        this.growOrb(5);
        
        if (networkData.firmCount) {
            const firmCount = this.getFirmCount(networkData.firmCount);
            
            // Create connected figures based on firm count
            for (let i = 0; i < Math.min(firmCount, 8); i++) {
                setTimeout(() => {
                    this.createConnectedFigure(i, firmCount);
                }, i * 400);
            }
        }
    }

    getFirmCount(firmCountRange) {
        switch (firmCountRange) {
            case '1-3': return 2;
            case '4-6': return 5;
            case '7-10': return 8;
            case '10+': return 8; // Cap visual representation
            default: return 3;
        }
    }

    createConnectedFigure(index, totalCount) {
        const figure = document.createElement('div');
        figure.className = 'connected-figure';
        
        // Position figures around the circle
        const angle = (index / totalCount) * 2 * Math.PI;
        const radius = 120; // Distance from center
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        figure.style.left = `calc(50% + ${x}px - 20px)`;
        figure.style.top = `calc(50% + ${y}px - 20px)`;
        
        // Add firm-specific styling
        const firmColors = [
            'rgba(59, 130, 246, 0.6)', // Blue
            'rgba(34, 197, 94, 0.6)',  // Green
            'rgba(239, 68, 68, 0.6)',  // Red
            'rgba(245, 158, 11, 0.6)', // Yellow
            'rgba(147, 51, 234, 0.6)', // Purple
            'rgba(236, 72, 153, 0.6)', // Pink
            'rgba(20, 184, 166, 0.6)', // Teal
            'rgba(251, 146, 60, 0.6)'  // Orange
        ];
        
        figure.style.background = `linear-gradient(135deg, ${firmColors[index % firmColors.length]}, rgba(16, 33, 62, 0.8))`;
        
        this.connectedFigures.appendChild(figure);
        
        // Animate figure appearance
        setTimeout(() => {
            figure.classList.add('active');
        }, 100);
        
        this.connectedFigureCount++;
    }

    showEnergyFlows(ratesData) {
        console.log('⚡ Showing energy flows...', ratesData);
        
        // Continue orb growth - Step 6
        this.growOrb(6);
        
        // Create energy connections between main figure and connected figures
        const connectedFigures = this.connectedFigures.querySelectorAll('.connected-figure');
        
        connectedFigures.forEach((figure, index) => {
            setTimeout(() => {
                this.createEnergyLine(figure, index);
            }, index * 200);
        });
    }

    createEnergyLine(targetFigure, index) {
        const line = document.createElement('div');
        line.className = 'energy-line';
        
        // Calculate line position and rotation
        const mainRect = this.mainFigure.getBoundingClientRect();
        const targetRect = targetFigure.getBoundingClientRect();
        const circleRect = this.circle.getBoundingClientRect();
        
        // Calculate relative positions within the circle
        const startX = mainRect.left + mainRect.width / 2 - circleRect.left;
        const startY = mainRect.top + mainRect.height / 2 - circleRect.top;
        const endX = targetRect.left + targetRect.width / 2 - circleRect.left;
        const endY = targetRect.top + targetRect.height / 2 - circleRect.top;
        
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.animationDelay = `${index * 0.2}s`;
        
        this.energyFlows.appendChild(line);
        this.energyLines.push(line);
    }

    completeCipher(mobileData) {
        console.log('📱 Completing cipher...', mobileData);
        
        // Final enhancements to the cipher
        this.addMobileIndicators(mobileData);
        this.enhanceAllConnections();
    }

    addMobileIndicators(mobileData) {
        // Add mobile connectivity indicators
        const mobileIndicator = document.createElement('div');
        mobileIndicator.className = 'mobile-indicator';
        mobileIndicator.innerHTML = `
            <div class="mobile-signal">
                <div class="signal-bar"></div>
                <div class="signal-bar"></div>
                <div class="signal-bar"></div>
                <div class="signal-bar"></div>
            </div>
        `;
        
        this.mainFigure.appendChild(mobileIndicator);
        
        // Add mobile styling
        const style = document.createElement('style');
        style.textContent = `
            .mobile-indicator {
                position: absolute;
                top: -10px;
                right: -10px;
                width: 20px;
                height: 20px;
                background: rgba(34, 197, 94, 0.2);
                border-radius: 50%;
                border: 1px solid rgba(34, 197, 94, 0.6);
            }
            
            .mobile-signal {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                gap: 1px;
            }
            
            .signal-bar {
                width: 2px;
                background: rgba(34, 197, 94, 0.8);
                animation: signalPulse 1.5s ease-in-out infinite;
            }
            
            .signal-bar:nth-child(1) { height: 3px; animation-delay: 0s; }
            .signal-bar:nth-child(2) { height: 5px; animation-delay: 0.2s; }
            .signal-bar:nth-child(3) { height: 7px; animation-delay: 0.4s; }
            .signal-bar:nth-child(4) { height: 9px; animation-delay: 0.6s; }
            
            @keyframes signalPulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    enhanceAllConnections() {
        // Enhance all visual elements for the completed cipher
        this.circle.classList.add('completed');
        
        // Add completion glow
        const completionGlow = document.createElement('div');
        completionGlow.className = 'completion-glow';
        completionGlow.style.cssText = `
            position: absolute;
            top: -20px;
            left: -20px;
            right: -20px;
            bottom: -20px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
            animation: completionPulse 4s ease-in-out infinite;
            pointer-events: none;
        `;
        
        this.circle.appendChild(completionGlow);
        
        // Add completion animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes completionPulse {
                0%, 100% { 
                    transform: scale(1); 
                    opacity: 0.3; 
                }
                50% { 
                    transform: scale(1.1); 
                    opacity: 0.8; 
                }
            }
            
            .cipher-circle.completed {
                border-color: rgba(255, 215, 0, 0.8);
                box-shadow: 
                    0 0 50px rgba(255, 215, 0, 0.4),
                    inset 0 0 50px rgba(255, 215, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    /* ================================
       FINALE ANIMATION
       ================================ */

    async playFinaleAnimation() {
        console.log('🎬 Playing finale animation...');
        
        return new Promise((resolve) => {
            // Dramatic camera pullback effect
            this.canvas.style.transition = 'transform 3s cubic-bezier(0.23, 1, 0.32, 1)';
            this.canvas.style.transform = 'scale(0.8) translateZ(-200px)';
            
            // Enhance all elements
            setTimeout(() => {
                this.circle.style.filter = 'brightness(1.5) saturate(1.3)';
                
                // Add finale particles
                if (window.cipherParticles) {
                    window.cipherParticles.playFinale();
                }
            }, 1000);
            
            // Final enhancement
            setTimeout(() => {
                this.addFinaleEffects();
                resolve();
            }, 2500);
        });
    }

    addFinaleEffects() {
        // Add special finale effects
        const finaleOverlay = document.createElement('div');
        finaleOverlay.className = 'finale-overlay';
        finaleOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, 
                transparent 0%, 
                rgba(255, 215, 0, 0.1) 50%, 
                rgba(0, 0, 0, 0.3) 100%);
            pointer-events: none;
            animation: finaleGlow 2s ease-in-out infinite;
        `;
        
        this.canvas.appendChild(finaleOverlay);
        
        // Add finale glow animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes finaleGlow {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    /* ================================
       CLEANUP METHODS
       ================================ */

    reset() {
        // Reset visualization state
        this.connectedFigureCount = 0;
        this.energyLines = [];
        
        // Clear dynamic elements
        this.connectedFigures.innerHTML = '';
        this.energyFlows.innerHTML = '';
        
        // Reset classes
        this.circle.classList.remove('active', 'expanded', 'completed');
        this.mainFigure.classList.remove('active');
    }
}

// Export for global access
window.CipherVisualization = CipherVisualization;