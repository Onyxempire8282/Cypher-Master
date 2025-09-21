/**
 * Cipher Begins Controller
 * Orchestrates the cinematic professional adjuster onboarding experience
 */

// Authentication service will be available globally once loaded
// import { authService } from './auth-service.js';

class CipherBeginsController {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 7;
        this.isReturningUser = false;
        this.isAuthenticated = false;
        this.selectedColorScheme = 'classic';
        this.userCipher = {
            identity: {},
            territory: {},
            travel: {},
            network: {},
            rates: {},
            contact: {}
        };
        
        this.questions = this.setupQuestions();
        
        // Initialize authentication
        this.setupAuthHandlers();
        this.init();
    }

    /* ================================
       AUTHENTICATION SETUP
       ================================ */

    setupAuthHandlers() {
        // Listen for auth events
        window.addEventListener('auth:signedIn', (event) => {
            this.handleUserSignedIn(event.detail.user);
        });

        window.addEventListener('auth:signedOut', () => {
            this.handleUserSignedOut();
        });

        // Check if user is already authenticated (with delay for authService to load)
        setTimeout(() => {
            this.checkAuthStatus();
        }, 200);
    }

    async checkAuthStatus() {
        const session = await window.authService?.getSession();
        if (session?.user) {
            this.isAuthenticated = true;
            await this.loadUserProfile(session.user.id);
        }
    }

    handleUserSignedIn(user) {
        console.log('✅ User signed in:', user.email);
        this.isAuthenticated = true;
        // Could redirect to dashboard or continue journey
    }

    handleUserSignedOut() {
        console.log('🚪 User signed out');
        this.isAuthenticated = false;
        this.userCipher = {
            identity: {},
            territory: {},
            travel: {},
            network: {},
            rates: {},
            contact: {}
        };
    }

    async loadUserProfile(userId) {
        const result = await window.authService?.getUserProfile(userId);
        if (result.success) {
            this.populateUserCipherFromProfile(result.profile);
        }
    }

    populateUserCipherFromProfile(profile) {
        // Populate userCipher with existing profile data
        if (profile) {
            this.userCipher.identity = {
                fullName: profile.full_name,
                experience: profile.experience_level,
                yearsExperience: profile.years_experience
            };

            if (profile.user_territory?.length > 0) {
                const territory = profile.user_territory[0];
                this.userCipher.territory = {
                    territoryType: territory.territory_type
                };
                this.userCipher.travel = {
                    maxDistance: territory.max_distance
                };
            }

            if (profile.user_network?.length > 0) {
                this.userCipher.network = {
                    firmCount: profile.user_network[0].firm_count
                };
            }

            if (profile.user_preferences?.length > 0) {
                const prefs = profile.user_preferences[0];
                this.userCipher.contact = {
                    deviceType: prefs.device_type
                };
                this.selectedColorScheme = prefs.color_scheme;
            }
        }
    }

    init() {
        console.log('🎤 Cipher Begins Controller initializing...');
        this.setupEventListeners();
        this.checkExistingUser();
    }

    /* ================================
       QUESTION SETUP
       ================================ */

    setupQuestions() {
        return [
            {
                step: 1,
                category: 'identity',
                title: 'What\'s Your Position in the Cipher?',
                subtitle: 'Every cipher has its players. Show us where you stand in the insurance game.',
                type: 'form',
                fields: [
                    {
                        name: 'experience',
                        label: 'Your Cipher Status',
                        type: 'cipher_choice',
                        options: [
                            {
                                value: 'beginner',
                                label: 'Novice 🎒',
                                description: 'New to the game, backpack full of potential',
                                details: 'Fresh in the field (0-2 years) - Ready to learn from the best',
                                benefits: [
                                    'Guided workflows and mentorship',
                                    'Training resources and templates',
                                    'Step-by-step tutorials',
                                    'Community support network'
                                ],
                                visualization: 'novice_cipher_preview',
                                icon: '🎒'
                            },
                            {
                                value: 'seasoned',
                                label: 'Expert 🎤',
                                description: 'Got the mic, knows the flow, owns the stage',
                                details: 'Experienced professional (2-7 years) - Building mastery',
                                benefits: [
                                    'Advanced tools and automations',
                                    'Network expansion opportunities',
                                    'Efficiency optimization features',
                                    'Peer collaboration platform'
                                ],
                                visualization: 'expert_cipher_preview',
                                icon: '🎤'
                            },
                            {
                                value: 'master',
                                label: 'OG 👑',
                                description: 'Legendary status, wisdom flows like water',
                                details: 'Industry veteran (7+ years) - Master of the craft',
                                benefits: [
                                    'Leadership and mentorship tools',
                                    'Business analytics dashboard',
                                    'Industry insights and trends',
                                    'White-label customization'
                                ],
                                visualization: 'og_cipher_preview',
                                icon: '👑'
                            },
                            {
                                value: 'admin',
                                label: 'Business Manager 🏢',
                                description: 'The backbone that keeps everything running smooth',
                                details: 'Administrative professional - Scheduling, billing, coordination',
                                benefits: [
                                    'Appointment scheduling tools',
                                    'Billing & expense management',
                                    'Client communication hub',
                                    'Business reporting dashboard'
                                ],
                                visualization: 'admin_cipher_preview',
                                icon: '🏢'
                            }
                        ],
                        required: true
                    }
                ],
                visualization: 'showCipherPositioning'
            },
            {
                step: 2,
                category: 'identity',
                title: 'Introduce Yourself to the Cipher',
                subtitle: 'Every legend has a name. What should the cipher call you?',
                type: 'form',
                fields: [
                    {
                        name: 'fullName',
                        label: 'Your Professional Name',
                        type: 'text',
                        placeholder: 'Enter your name',
                        required: true
                    },
                    {
                        name: 'yearsExperience',
                        label: 'Years in the Game',
                        type: 'number',
                        placeholder: 'How many years?',
                        required: false
                    }
                ],
                visualization: 'personalizeMainFigure'
            },
            {
                step: 3,
                category: 'territory',
                title: 'Your Territory',
                subtitle: 'Define your professional landscape and operating environment.',
                type: 'form',
                fields: [
                    {
                        name: 'location',
                        label: 'Primary Location',
                        type: 'text',
                        placeholder: 'City, State or ZIP',
                        required: true
                    },
                    {
                        name: 'territoryType',
                        label: 'Territory Type',
                        type: 'choice',
                        options: [
                            { value: 'urban', label: 'Urban', description: 'City environment, high density', icon: '🏙️' },
                            { value: 'rural', label: 'Rural', description: 'Country areas, longer distances', icon: '🌾' },
                            { value: 'mixed', label: 'Mixed', description: 'Combination of urban and rural', icon: '🏘️' }
                        ],
                        required: true
                    }
                ],
                visualization: 'showEnvironment'
            },
            {
                step: 4,
                category: 'travel',
                title: 'Travel Preferences',
                subtitle: 'How far are you willing to travel for the right opportunity?',
                type: 'form',
                fields: [
                    {
                        name: 'maxDistance',
                        label: 'Maximum Travel Distance',
                        type: 'choice',
                        options: [
                            { value: '25', label: '25 miles', description: 'Local area only', icon: '🎯' },
                            { value: '50', label: '50 miles', description: 'Regional coverage', icon: '🗺️' },
                            { value: '100', label: '100 miles', description: 'Extended territory', icon: '🛣️' },
                            { value: 'unlimited', label: 'Unlimited', description: 'Will travel anywhere', icon: '✈️' }
                        ],
                        required: true
                    },
                    {
                        name: 'overnightTravel',
                        label: 'Overnight Travel',
                        type: 'choice',
                        options: [
                            { value: 'yes', label: 'Yes', description: 'Open to overnight assignments', icon: '🏨' },
                            { value: 'no', label: 'No', description: 'Day trips only', icon: '🏠' },
                            { value: 'occasionally', label: 'Occasionally', description: 'For the right opportunity', icon: '🤔' }
                        ],
                        required: true
                    }
                ],
                visualization: 'expandCircle'
            },
            {
                step: 5,
                category: 'network',
                title: 'Your Professional Network',
                subtitle: 'How many firms do you want to work with? We\'ll help you connect.',
                type: 'form',
                fields: [
                    {
                        name: 'firmCount',
                        label: 'Target Number of Firms',
                        type: 'choice',
                        options: [
                            { value: '1-3', label: '1-3 Firms', description: 'Focus on key relationships', icon: '🎯' },
                            { value: '4-6', label: '4-6 Firms', description: 'Balanced portfolio', icon: '⚖️' },
                            { value: '7-10', label: '7-10 Firms', description: 'Diversified network', icon: '🌐' },
                            { value: '10+', label: '10+ Firms', description: 'Maximum opportunities', icon: '🚀' }
                        ],
                        required: true
                    }
                ],
                visualization: 'showConnectedFigures'
            },
            {
                step: 6,
                category: 'rates',
                title: 'Rate Structure',
                subtitle: 'Set your professional rates for different types of assignments.',
                type: 'form',
                fields: [
                    {
                        name: 'hourlyRate',
                        label: 'Hourly Rate',
                        type: 'text',
                        placeholder: '$75/hour',
                        required: true
                    },
                    {
                        name: 'mileageRate',
                        label: 'Mileage Rate',
                        type: 'text',
                        placeholder: '$0.65/mile',
                        required: true
                    },
                    {
                        name: 'specialtyRates',
                        label: 'Specialty Assignment Rate',
                        type: 'text',
                        placeholder: '$125/hour for complex claims',
                        required: false
                    }
                ],
                visualization: 'showEnergyFlows'
            },
            {
                step: 7,
                category: 'contact',
                title: 'Connect Your Cipher',
                subtitle: 'How can the cipher reach you when opportunities arise?',
                type: 'form',
                fields: [
                    {
                        name: 'email',
                        label: 'Email Address',
                        type: 'email',
                        placeholder: 'your.email@domain.com',
                        required: true
                    },
                    {
                        name: 'password',
                        label: 'Create Password',
                        type: 'password',
                        placeholder: 'Enter a secure password',
                        required: true,
                        minLength: 6
                    },
                    {
                        name: 'phone',
                        label: 'Phone Number',
                        type: 'tel',
                        placeholder: '(555) 123-4567',
                        required: false
                    },
                    {
                        name: 'deviceType',
                        label: 'Primary Mobile Device',
                        type: 'choice',
                        options: [
                            { value: 'ios', label: 'iPhone/iPad', description: 'iOS ecosystem', icon: '📱' },
                            { value: 'android', label: 'Android', description: 'Android ecosystem', icon: '🤖' },
                            { value: 'both', label: 'Both', description: 'Use multiple devices', icon: '📱🤖' }
                        ],
                        required: false
                    }
                ],
                visualization: 'completeCipherConnection'
            }
        ];
    }

    /* ================================
       SCREEN MANAGEMENT
       ================================ */

    showScreen(screenId) {
        console.log(`🎬 Showing screen: ${screenId}`);
        
        const allScreens = document.querySelectorAll('.cipher-screen');
        console.log(`📺 Found ${allScreens.length} screens`);
        
        // Add transitioning class for smooth fade out
        allScreens.forEach(screen => {
            if (screen.classList.contains('active')) {
                screen.classList.add('transitioning-out');
            }
        });
        
        // Small delay for smooth transition
        setTimeout(() => {
            allScreens.forEach(screen => {
                screen.classList.remove('active', 'transitioning-out');
                console.log(`📺 Removed active from: ${screen.id}`);
            });
            
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('active', 'transitioning-in');
                console.log(`✅ Activated screen: ${screenId}`);
                
                // Clean up transition classes after animation
                setTimeout(() => {
                    targetScreen.classList.remove('transitioning-in');
                }, 800);
            } else {
                console.error(`❌ Screen not found: ${screenId}`);
            }
        }, 150);
    }

    checkExistingUser() {
        const savedCypher = localStorage.getItem('userCypher');
        if (savedCypher) {
            // User has been here before
            this.showScreen('loginScreen');
        } else {
            // New user
            this.showScreen('welcomeScreen');
        }
    }

    /* ================================
       JOURNEY FLOW
       ================================ */

    // Show login screen for returning users
    showLogin() {
        console.log('🔐 Showing login for returning user');
        this.isReturningUser = true;
        this.showScreen('loginScreen');
    }

    startJourney() {
        console.log('🎤 Begin Your Cypher button clicked!');
        console.log('🎤 Starting cipher journey...');
        
        // Add loading state to button
        const beginButton = document.querySelector('.cipher-btn--hero');
        if (beginButton) {
            beginButton.classList.add('loading');
            beginButton.textContent = 'Initializing Your Cypher...';
        }
        
        // Clear any existing saved data for fresh start
        localStorage.removeItem('userCypher');
        this.userCypher = {
            identity: {},
            territory: {},
            travel: {},
            network: {},
            rates: {},
            mobile: {}
        };
        
        // Small delay for better UX feedback
        setTimeout(() => {
            this.showScreen('journeyScreen');
            this.currentStep = 1;
            this.displayCurrentQuestion();
            this.updateProgress();
            
            // Start visualization immediately
            window.cipherVisualization?.startVisualization();
            
            // Remove loading state
            if (beginButton) {
                beginButton.classList.remove('loading');
                beginButton.textContent = 'Begin Your Cypher Journey';
            }
        }, 800);
    }

    displayCurrentQuestion() {
        console.log(`📝 Displaying question for step ${this.currentStep}`);
        const question = this.questions[this.currentStep - 1];
        console.log('📋 Question data:', question);
        
        const questionContainer = document.getElementById('journeyQuestion');
        console.log('📦 Question container:', questionContainer);
        
        if (!questionContainer) {
            console.error('❌ Journey question container not found!');
            return;
        }
        
        if (!question) {
            console.error('❌ Question data not found for step:', this.currentStep);
            return;
        }
        
        questionContainer.innerHTML = this.generateQuestionHTML(question);
        console.log('✅ Question HTML generated and inserted');
        
        this.setupQuestionListeners(question);
        console.log('✅ Question listeners setup complete');
        
        // Trigger visualization for this step
        if (question.visualization && window.cipherVisualization) {
            window.cipherVisualization[question.visualization](this.userCipher[question.category]);
        }
    }

    generateQuestionHTML(question) {
        let html = `
            <div class="question-content">
                <h2 class="question-title">${question.title}</h2>
                <p class="question-subtitle">${question.subtitle}</p>
                <div class="question-fields">
        `;

        question.fields.forEach(field => {
            if (field.type === 'choice' || field.type === 'cipher_choice') {
                html += this.generateChoiceField(field);
            } else {
                html += this.generateInputField(field);
            }
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    generateInputField(field) {
        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}</label>
                <input 
                    type="${field.type}" 
                    id="${field.name}" 
                    name="${field.name}"
                    class="cipher-input" 
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required' : ''}
                    value="${this.userCipher[this.questions[this.currentStep - 1].category][field.name] || ''}"
                >
            </div>
        `;
    }

    generateChoiceField(field) {
        const currentValue = this.userCipher[this.questions[this.currentStep - 1].category][field.name];
        const isCipherChoice = field.type === 'cipher_choice';
        
        let html = `
            <div class="form-group">
                <label>${field.label}</label>
                <div class="${isCipherChoice ? 'cipher-choice-grid' : 'choice-grid'}" data-field="${field.name}">
        `;

        field.options.forEach(option => {
            if (isCipherChoice) {
                html += `
                    <div class="cipher-choice-card ${currentValue === option.value ? 'selected' : ''}" 
                         data-value="${option.value}">
                        <div class="cipher-choice-header">
                            <div class="cipher-choice-icon">${option.icon}</div>
                            <div class="cipher-choice-label">${option.label}</div>
                        </div>
                        <div class="cipher-choice-description">${option.description}</div>
                        <div class="cipher-choice-details">${option.details}</div>
                        <ul class="cipher-choice-benefits">
                            ${option.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                        </ul>
                    </div>
                `;
            } else {
                html += `
                    <div class="choice-option ${currentValue === option.value ? 'selected' : ''}" 
                         data-value="${option.value}">
                        <div class="choice-icon">${option.icon}</div>
                        <h4>${option.label}</h4>
                        <p>${option.description}</p>
                    </div>
                `;
            }
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    setupQuestionListeners(question) {
        // Setup listeners for input fields
        question.fields.forEach(field => {
            if (field.type !== 'choice') {
                const input = document.getElementById(field.name);
                if (input) {
                    input.addEventListener('input', (e) => {
                        this.updateUserCipher(question.category, field.name, e.target.value);
                    });
                }
            }
        });

        // Setup listeners for choice fields
        document.querySelectorAll('.choice-grid, .cipher-choice-grid').forEach(grid => {
            const fieldName = grid.dataset.field;
            const isCipherChoice = grid.classList.contains('cipher-choice-grid');
            
            grid.addEventListener('click', (e) => {
                const option = e.target.closest(isCipherChoice ? '.cipher-choice-card' : '.choice-option');
                if (option) {
                    // Clear previous selections
                    grid.querySelectorAll(isCipherChoice ? '.cipher-choice-card' : '.choice-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Select current option
                    option.classList.add('selected');
                    
                    // Update user cipher
                    this.updateUserCipher(question.category, fieldName, option.dataset.value);
                    
                    // If this is a cipher choice (experience level), trigger immediate visual feedback
                    if (isCipherChoice && fieldName === 'experience') {
                        this.triggerExperienceVisualization(option.dataset.value);
                    }
                }
            });
        });
    }

    updateUserCipher(category, field, value) {
        if (!this.userCipher[category]) {
            this.userCipher[category] = {};
        }
        this.userCipher[category][field] = value;
        
        console.log(`📝 Updated cipher: ${category}.${field} = ${value}`);
        
        // Trigger real-time visualization updates
        const question = this.questions[this.currentStep - 1];
        if (question.visualization && window.cipherVisualization) {
            window.cipherVisualization[question.visualization](this.userCipher[category]);
        }
        
        // Enable/disable next button based on required fields
        this.validateCurrentStep();
    }

    validateCurrentStep() {
        const question = this.questions[this.currentStep - 1];
        const requiredFields = question.fields.filter(field => field.required);
        const currentData = this.userCipher[question.category] || {};
        
        const isValid = requiredFields.every(field => {
            return currentData[field.name] && currentData[field.name].toString().trim() !== '';
        });
        
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = !isValid;
            nextBtn.classList.toggle('disabled', !isValid);
        }
    }

    /* ================================
       NAVIGATION
       ================================ */

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.displayCurrentQuestion();
            this.updateProgress();
            this.updateNavigationButtons();
        } else {
            // Journey complete
            this.completeJourney();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.displayCurrentQuestion();
            this.updateProgress();
            this.updateNavigationButtons();
        }
    }

    updateProgress() {
        // Update progress line
        const progressLine = document.getElementById('progressLine');
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        if (progressLine) {
            progressLine.style.width = `${progressPercentage}%`;
        }
        
        // Update step indicators
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.textContent = this.currentStep === this.totalSteps ? 'Complete Journey →' : 'Continue →';
        }
        
        // Revalidate current step
        this.validateCurrentStep();
    }

    triggerExperienceVisualization(experience) {
        console.log(`🎤 Triggering visualization for experience: ${experience}`);
        
        // Trigger immediate cipher visualization update
        if (window.cipherVisualization) {
            window.cipherVisualization.styleMainFigure(experience);
        }
        
        // Show experience benefits popup
        this.showExperienceBenefits(experience);
    }

    showExperienceBenefits(experience) {
        const experienceData = {
            'beginner': {
                title: 'Novice Cipher Status Unlocked',
                subtitle: 'Welcome to the cipher! Your journey begins...',
                icon: '🎒',
                benefits: [
                    'Guided workflows activated',
                    'Mentorship network connected',
                    'Training resources loaded',
                    'Community support enabled'
                ]
            },
            'seasoned': {
                title: 'Expert Cipher Status Unlocked', 
                subtitle: 'The mic is yours! Time to show your skills...',
                icon: '🎤',
                benefits: [
                    'Advanced tools activated',
                    'Efficiency mode enabled', 
                    'Professional network expanded',
                    'Performance analytics unlocked'
                ]
            },
            'master': {
                title: 'OG Cipher Status Unlocked',
                subtitle: 'Legendary presence activated. The cipher respects...',
                icon: '👑',
                benefits: [
                    'Leadership suite activated',
                    'Mentorship tools enabled',
                    'Business analytics unlocked',
                    'Industry influence expanded'
                ]
            }
        };

        const data = experienceData[experience];
        if (!data) return;

        // Create and show benefits popup
        const popup = document.createElement('div');
        popup.className = 'cipher-benefits-popup';
        popup.innerHTML = `
            <div class="benefits-overlay">
                <div class="benefits-content">
                    <div class="benefits-header">
                        <div class="benefits-icon">${data.icon}</div>
                        <h3>${data.title}</h3>
                        <p>${data.subtitle}</p>
                    </div>
                    <div class="benefits-list">
                        ${data.benefits.map(benefit => `
                            <div class="benefit-item">
                                <span class="benefit-check">✓</span>
                                <span class="benefit-text">${benefit}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 500);
        }, 4000);
    }

    /* ================================
       JOURNEY COMPLETION
       ================================ */

    async completeJourney() {
        console.log('🎯 Journey completed! Starting transformation...');
        
        // Save user cypher
        localStorage.setItem('userCypher', JSON.stringify(this.userCypher));
        
        // Start blackout transformation sequence
        this.startTransformation();
    }
    
    async startTransformation() {
        console.log('🌟 Starting transformation sequence...');
        
        // First show color scheme selection
        this.showColorSchemeSelection();
    }
    
    async startFinalTransformation() {
        console.log('🌟 Starting final blackout transformation...');
        
        // Show transformation screen
        this.showScreen('transformationScreen');
        
        // Start undecipherable text animation
        this.showUndecipherableText();
        
        // After animation, show final message
        setTimeout(() => {
            this.showFinalMessage();
        }, 3000);
        
        // After final message, redirect to dashboard
        setTimeout(() => {
            this.enterCypher();
        }, 6000);
    }
    
    showUndecipherableText() {
        const undecipherableEl = document.getElementById('undecipherableText');
        const chars = ['᷅', '⚡', '◊', '☩', '▣', '◈', '⬢', '⟐', '◉', '⬣', '▲', '◆', '■', '●', '♦', '▼'];
        let currentText = '';
        
        const interval = setInterval(() => {
            currentText = '';
            for (let i = 0; i < 15; i++) {
                currentText += chars[Math.floor(Math.random() * chars.length)] + ' ';
            }
            undecipherableEl.textContent = currentText;
        }, 100);
        
        // Stop animation after 3 seconds
        setTimeout(() => {
            clearInterval(interval);
        }, 3000);
    }
    
    showFinalMessage() {
        const finalEl = document.getElementById('finalMessage');
        const message = this.isReturningUser ? 'Cypher Already In Progress' : 'The Cypher Is Complete';
        finalEl.innerHTML = `<h1>${message}</h1>`;
    }
    
    showColorSchemeSelection() {
        this.showScreen('colorSchemeScreen');
        this.setupColorSchemeListeners();
    }
    
    setupColorSchemeListeners() {
        const schemes = document.querySelectorAll('.scheme-option');
        const confirmButton = document.getElementById('confirmScheme');
        
        schemes.forEach(scheme => {
            scheme.addEventListener('click', () => {
                // Remove previous selection
                schemes.forEach(s => s.classList.remove('selected'));
                // Select current scheme
                scheme.classList.add('selected');
                this.selectedColorScheme = scheme.dataset.scheme;
                console.log(`🎨 Selected color scheme: ${this.selectedColorScheme}`);
                
                // Enable and highlight the confirm button
                confirmButton.classList.remove('disabled');
                confirmButton.classList.add('pulse');
                
                // Remove pulse after 2 seconds
                setTimeout(() => {
                    confirmButton.classList.remove('pulse');
                }, 2000);
            });
        });
        
        // Select default scheme and set up initial state
        this.selectedColorScheme = 'classic';
        document.querySelector('[data-scheme="classic"]').classList.add('selected');
        
        // Ensure button is enabled
        confirmButton.classList.remove('disabled');
        confirmButton.classList.add('pulse');
        setTimeout(() => {
            confirmButton.classList.remove('pulse');
        }, 3000);
    }
    
    async completeSetup() {
        console.log('🎤 Completing setup with scheme:', this.selectedColorScheme);
        
        try {
            // Save color scheme preference locally for now
            this.userCipher.contact = this.userCipher.contact || {};
            this.userCipher.contact.colorScheme = this.selectedColorScheme;
            localStorage.setItem('colorScheme', this.selectedColorScheme);
            localStorage.setItem('userCipher', JSON.stringify(this.userCipher));
            
            console.log('✅ Profile saved locally');
            
            // Try to save to database if auth service is available
            if (window.authService) {
                console.log('🔐 Auth service available, attempting to save profile...');
                try {
                    // Check if user needs to create account
                    if (!this.isAuthenticated) {
                        await this.createUserAccount();
                    }

                    // Save all collected data securely
                    await this.saveCompleteProfile();
                    console.log('✅ Profile saved to Supabase successfully');
                } catch (authError) {
                    console.warn('⚠️ Authentication failed, continuing locally:', authError.message);
                }
            } else {
                console.log('📦 Auth service not available, using local storage only');
            }
            
            // Continue to transformation
            this.startFinalTransformation();
            
        } catch (error) {
            console.error('❌ Setup completion failed:', error);
            // If anything fails, just go to dashboard anyway
            console.log('🔄 Falling back to direct navigation...');
            setTimeout(() => {
                this.enterCypher();
            }, 1000);
        }
    }

    async createUserAccount() {
        // Get email from the final step or generate a test email
        let email = this.userCipher.contact?.email;
        
        if (!email) {
            // Generate a temporary email for testing
            const timestamp = Date.now();
            email = `cipher_user_${timestamp}@test.local`;
            console.log('📧 Generated test email:', email);
        }

        // Use the password provided by the user
        const password = this.userCipher.contact?.password;
        
        if (!password) {
            throw new Error('Password is required to create account');
        }

        // Create account with collected data
        const result = await window.authService.signUp({
            email: email,
            password: password,
            fullName: this.userCipher.identity.fullName,
            experience: this.userCipher.identity.experience,
            yearsExperience: this.userCipher.identity.yearsExperience,
            territoryType: this.userCipher.territory.territoryType,
            maxDistance: this.userCipher.travel.maxDistance,
            firmCount: this.userCipher.network.firmCount,
            deviceType: this.userCipher.contact.deviceType,
            colorScheme: this.selectedColorScheme
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        this.isAuthenticated = true;
        console.log('✅ User account created successfully');
        
        // Show confirmation to user
        this.showAccountCreated(email, password);
    }

    async saveCompleteProfile() {
        if (!this.isAuthenticated) {
            return;
        }

        const user = window.authService.getCurrentUser();
        if (!user) {
            throw new Error('No authenticated user found');
        }

        // Save complete profile data
        const result = await window.authService.saveUserProfile(user.id, {
            ...this.userCipher.identity,
            ...this.userCipher.territory,
            ...this.userCipher.travel,
            ...this.userCipher.network,
            ...this.userCipher.rates,
            ...this.userCipher.contact,
            colorScheme: this.selectedColorScheme
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        console.log('✅ Complete profile saved to database');
    }

    generateSecurePassword() {
        // Generate a secure random password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    showAccountCreated(email, password) {
        // Show account creation success with password
        const message = `
            <div class="account-created">
                <h3>🎉 Account Created Successfully!</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> <code>${password}</code></p>
                <p>Your login credentials are now ready!</p>
                <p>Check your email to verify your account.</p>
            </div>
        `;
        
        // Could show this in a modal or overlay
        console.log('Account created:', { email, password });
    }

    showError(message) {
        // Show error message to user
        console.error('Error:', message);
        
        // Could show this in a toast or modal
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">❌</span>
                <span class="error-text">${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    enterTransitionMode() {
        const canvas = document.getElementById('cipherCanvas');
        const interfaceEl = document.querySelector('.cipher-interface');
        
        canvas.classList.add('transition-mode');
        interfaceEl.classList.add('transition-mode');
    }

    displayCypherSummary() {
        const summaryContainer = document.getElementById('cipherSummary');
        const cypher = this.userCipher;
        
        summaryContainer.innerHTML = `
            <div class="cypher-stats">
                <div class="stat-item">
                    <span class="stat-icon">👤</span>
                    <div class="stat-details">
                        <strong>${cypher.identity.fullName}</strong>
                        <span>${cypher.identity.experience} level adjuster</span>
                    </div>
                </div>
                
                <div class="stat-item">
                    <span class="stat-icon">🗺️</span>
                    <div class="stat-details">
                        <strong>${cypher.territory.location}</strong>
                        <span>${cypher.territory.territoryType} territory</span>
                    </div>
                </div>
                
                <div class="stat-item">
                    <span class="stat-icon">🚗</span>
                    <div class="stat-details">
                        <strong>${cypher.travel.maxDistance} miles</strong>
                        <span>Max travel distance</span>
                    </div>
                </div>
                
                <div class="stat-item">
                    <span class="stat-icon">🏢</span>
                    <div class="stat-details">
                        <strong>${cypher.network.firmCount}</strong>
                        <span>Target firm network</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupFinaleActions() {
        const finaleAnimation = document.getElementById('finaleAnimation');
        finaleAnimation.innerHTML = `
            <button class="cipher-btn cipher-btn--primary cipher-btn--large" onclick="window.cipherBegins.enterCypher()">
                Enter Your Cypher Dashboard
            </button>
        `;
    }

    enterCypher() {
        console.log('🎤 Entering main cypher dashboard...');
        console.log('🔄 Redirecting to dashboard.html');
        
        // Save final state
        localStorage.setItem('cipherComplete', 'true');
        
        // Trigger post-onboarding events
        this.triggerPostOnboardingEvents();
        
        // Redirect to main application
        try {
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('❌ Navigation failed:', error);
            // Fallback - try different approach
            window.location.assign('dashboard.html');
        }
    }

    triggerPostOnboardingEvents() {
        // Prepare onboarding data for post-onboarding setup
        const onboardingData = {
            userCipher: this.userCipher,
            colorScheme: this.selectedColorScheme,
            isNewUser: true,
            completedAt: new Date().toISOString()
        };
        
        // Save onboarding trigger for master interface
        localStorage.setItem('pendingOnboardingEvents', JSON.stringify(onboardingData));
        
        console.log('✅ Post-onboarding events prepared');
    }

    /* ================================
       LOGIN INTEGRATION
       ================================ */

    handleLogin() {
        console.log('🔐 Login button clicked!');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (email && password) {
            console.log('🔐 Attempting login...');
            // In a real app, this would validate credentials
            // For now, we'll simulate successful login
            this.simulateLogin(email);
        } else {
            alert('Please enter both email and password');
        }
    }

    simulateLogin(email) {
        console.log(`👋 Welcome back, ${email}`);
        
        // Load saved cypher data
        const savedCypher = localStorage.getItem('userCypher');
        if (savedCypher) {
            this.userCipher = JSON.parse(savedCypher);
        }
        
        // Redirect to main app
        this.enterCypher();
    }

    /* ================================
       EVENT LISTENERS
       ================================ */

    setupEventListeners() {
        // Skill level selection now handled in journey flow for better UX
        
        // Setup click listener for Begin Your Cypher button
        const beginButton = document.querySelector('.cipher-btn[onclick*="startJourney"]');
        if (beginButton) {
            beginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.startJourney();
            });
        }
        
        // Setup login button
        const loginButton = document.querySelector('.cipher-btn[onclick*="handleLogin"]');
        if (loginButton) {
            loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Setup "New to the cypher?" link
        const newUserLink = document.querySelector('a[onclick*="welcomeScreen"]');
        if (newUserLink) {
            newUserLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('welcomeScreen');
            });
        }
        
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Enter key handling
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeElement = document.activeElement;
                
                // If focus is on a button, let it handle the click
                if (activeElement && activeElement.classList.contains('cipher-btn')) {
                    return;
                }
                
                // Otherwise, handle journey navigation
                const nextBtn = document.getElementById('nextBtn');
                if (nextBtn && !nextBtn.disabled && document.getElementById('journeyScreen').classList.contains('active')) {
                    this.nextStep();
                }
            }
            
            // Escape key - go back if possible
            if (e.key === 'Escape') {
                const prevBtn = document.getElementById('prevBtn');
                if (prevBtn && prevBtn.style.display !== 'none' && document.getElementById('journeyScreen').classList.contains('active')) {
                    this.previousStep();
                }
            }
            
            // Tab navigation enhancement
            if (e.key === 'Tab') {
                // Let browser handle tab, but add visual feedback
                setTimeout(() => {
                    const focused = document.activeElement;
                    if (focused && focused.classList.contains('choice-option')) {
                        // Add visual feedback for keyboard navigation on choices
                        focused.style.boxShadow = '0 0 0 2px rgba(255, 215, 0, 0.5)';
                    }
                }, 10);
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            // Handle navigation state
        });
    }
}

// Export for global access
window.CipherBeginsController = CipherBeginsController;