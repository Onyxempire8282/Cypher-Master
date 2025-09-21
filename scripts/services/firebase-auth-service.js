class FirebaseAuthService {
    constructor() {
        this.isEnabled = false; // DISABLED UNTIL CONFIGURED
        this.firebase = null;
        this.auth = null;
        this.db = null;
        
        this.config = {
            apiKey: null,
            authDomain: null,
            projectId: null,
            storageBucket: null,
            messagingSenderId: null,
            appId: null,
            measurementId: null
        };
        
        this.currentUser = null;
        this.authStateListeners = [];
        this.userProfiles = new Map(); // Cache user profiles
        
        console.log('🔥 Firebase Auth Service initialized (INACTIVE - awaiting configuration)');
    }

    // INITIALIZE FIREBASE
    async initialize(firebaseConfig) {
        this.config = { ...this.config, ...firebaseConfig };
        
        if (!this.isEnabled) {
            console.log('🔥 Firebase configured but service remains INACTIVE');
            return { success: true, status: 'configured_but_inactive' };
        }

        try {
            // Load Firebase SDK
            await this.loadFirebaseSDK();
            
            // Initialize Firebase app
            this.firebase = firebase.initializeApp(this.config);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
            
            console.log('✅ Firebase Auth initialized');
            return { success: true, status: 'active' };
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    // AUTHENTICATION METHODS

    // EMAIL/PASSWORD REGISTRATION
    async registerWithEmail(email, password, userProfile = {}) {
        if (!this.isEnabled) {
            console.log('🔥 User registration queued (INACTIVE):', email);
            return { 
                success: false, 
                reason: 'firebase_auth_inactive',
                userData: { email, userProfile }
            };
        }

        try {
            // Create user account
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user profile in Firestore
            const fullProfile = {
                uid: user.uid,
                email: user.email,
                ...userProfile,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                subscriptionTier: 'trial',
                trialStartDate: firebase.firestore.FieldValue.serverTimestamp(),
                trialEndDate: this.calculateTrialEndDate(),
                isActive: true
            };
            
            await this.db.collection('users').doc(user.uid).set(fullProfile);
            
            // Send email verification
            await user.sendEmailVerification();
            
            // Cache profile locally
            this.userProfiles.set(user.uid, fullProfile);
            
            // Integrate with subscription manager
            if (window.subscriptionManager?.isEnabled) {
                await window.subscriptionManager.registerUser({
                    id: user.uid,
                    email: user.email,
                    name: userProfile.name,
                    phone: userProfile.phone
                });
            }

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    profile: fullProfile,
                    emailVerified: user.emailVerified
                }
            };
            
        } catch (error) {
            console.error('❌ Email registration failed:', error);
            return { success: false, error: error.message, code: error.code };
        }
    }

    // EMAIL/PASSWORD SIGN IN
    async signInWithEmail(email, password) {
        if (!this.isEnabled) {
            console.log('🔥 Sign in queued (INACTIVE):', email);
            return { success: false, reason: 'firebase_auth_inactive' };
        }

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Load user profile
            const profile = await this.getUserProfile(user.uid);
            
            // Update last login
            await this.updateUserProfile(user.uid, {
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    profile: profile,
                    emailVerified: user.emailVerified
                }
            };
            
        } catch (error) {
            console.error('❌ Email sign in failed:', error);
            return { success: false, error: error.message, code: error.code };
        }
    }

    // GOOGLE SIGN IN
    async signInWithGoogle() {
        if (!this.isEnabled) {
            console.log('🔥 Google sign in queued (INACTIVE)');
            return { success: false, reason: 'firebase_auth_inactive' };
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if this is a new user
            const isNewUser = result.additionalUserInfo.isNewUser;
            
            if (isNewUser) {
                // Create user profile for new Google users
                const profile = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    provider: 'google',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscriptionTier: 'trial',
                    trialStartDate: firebase.firestore.FieldValue.serverTimestamp(),
                    trialEndDate: this.calculateTrialEndDate(),
                    isActive: true
                };
                
                await this.db.collection('users').doc(user.uid).set(profile);
                this.userProfiles.set(user.uid, profile);
                
                // Register with subscription manager
                if (window.subscriptionManager?.isEnabled) {
                    await window.subscriptionManager.registerUser({
                        id: user.uid,
                        email: user.email,
                        name: user.displayName,
                        phone: null // Will be collected later
                    });
                }
            } else {
                // Load existing profile
                await this.getUserProfile(user.uid);
                
                // Update last login
                await this.updateUserProfile(user.uid, {
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    isNewUser: isNewUser
                }
            };
            
        } catch (error) {
            console.error('❌ Google sign in failed:', error);
            return { success: false, error: error.message, code: error.code };
        }
    }

    // PHONE AUTHENTICATION (SMS VERIFICATION)
    async signInWithPhone(phoneNumber, recaptchaVerifier) {
        if (!this.isEnabled) {
            console.log('🔥 Phone sign in queued (INACTIVE):', phoneNumber);
            return { success: false, reason: 'firebase_auth_inactive' };
        }

        try {
            const confirmationResult = await this.auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
            
            return {
                success: true,
                confirmationResult: confirmationResult,
                message: 'SMS sent successfully'
            };
            
        } catch (error) {
            console.error('❌ Phone sign in failed:', error);
            return { success: false, error: error.message, code: error.code };
        }
    }

    // VERIFY SMS CODE
    async verifySMSCode(confirmationResult, smsCode) {
        if (!this.isEnabled) {
            return { success: false, reason: 'firebase_auth_inactive' };
        }

        try {
            const result = await confirmationResult.confirm(smsCode);
            const user = result.user;
            
            // Handle new phone user
            const isNewUser = !await this.getUserProfile(user.uid);
            
            if (isNewUser) {
                const profile = {
                    uid: user.uid,
                    phone: user.phoneNumber,
                    provider: 'phone',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscriptionTier: 'trial',
                    trialStartDate: firebase.firestore.FieldValue.serverTimestamp(),
                    trialEndDate: this.calculateTrialEndDate(),
                    isActive: true
                };
                
                await this.db.collection('users').doc(user.uid).set(profile);
                this.userProfiles.set(user.uid, profile);
            }

            return {
                success: true,
                user: {
                    uid: user.uid,
                    phone: user.phoneNumber,
                    isNewUser: isNewUser
                }
            };
            
        } catch (error) {
            console.error('❌ SMS verification failed:', error);
            return { success: false, error: error.message, code: error.code };
        }
    }

    // PASSWORD RESET
    async resetPassword(email) {
        if (!this.isEnabled) {
            console.log('🔥 Password reset queued (INACTIVE):', email);
            return { success: false, reason: 'firebase_auth_inactive' };
        }

        try {
            await this.auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Password reset email sent' };
            
        } catch (error) {
            console.error('❌ Password reset failed:', error);
            return { success: false, error: error.message, code: error.code };
        }
    }

    // SIGN OUT
    async signOut() {
        if (!this.isEnabled) {
            return { success: false, reason: 'firebase_auth_inactive' };
        }

        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true, message: 'Signed out successfully' };
            
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            return { success: false, error: error.message };
        }
    }

    // USER PROFILE MANAGEMENT

    // GET USER PROFILE
    async getUserProfile(uid) {
        if (!this.isEnabled) {
            return null;
        }

        // Check cache first
        if (this.userProfiles.has(uid)) {
            return this.userProfiles.get(uid);
        }

        try {
            const doc = await this.db.collection('users').doc(uid).get();
            
            if (doc.exists) {
                const profile = doc.data();
                this.userProfiles.set(uid, profile);
                return profile;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Failed to get user profile:', error);
            return null;
        }
    }

    // UPDATE USER PROFILE
    async updateUserProfile(uid, updates) {
        if (!this.isEnabled) {
            return { success: false, reason: 'firebase_auth_inactive' };
        }

        try {
            await this.db.collection('users').doc(uid).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update cache
            if (this.userProfiles.has(uid)) {
                const cached = this.userProfiles.get(uid);
                this.userProfiles.set(uid, { ...cached, ...updates });
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Failed to update user profile:', error);
            return { success: false, error: error.message };
        }
    }

    // AUTH STATE MANAGEMENT
    handleAuthStateChange(user) {
        this.currentUser = user;
        
        // Notify all listeners
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });

        // Update UI state
        if (user) {
            console.log('🔥 User signed in:', user.email || user.phoneNumber);
            this.getUserProfile(user.uid); // Load/cache profile
        } else {
            console.log('🔥 User signed out');
            this.userProfiles.clear(); // Clear cache
        }
    }

    // ADD AUTH STATE LISTENER
    addAuthStateListener(callback) {
        this.authStateListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    // UTILITY METHODS
    calculateTrialEndDate() {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial
        return firebase.firestore.Timestamp.fromDate(trialEnd);
    }

    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            if (typeof firebase !== 'undefined') {
                resolve();
                return;
            }

            // Load Firebase SDK
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
            script.onload = () => {
                // Load additional Firebase services
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
                authScript.onload = () => {
                    const firestoreScript = document.createElement('script');
                    firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
                    firestoreScript.onload = resolve;
                    firestoreScript.onerror = reject;
                    document.head.appendChild(firestoreScript);
                };
                authScript.onerror = reject;
                document.head.appendChild(authScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // SERVICE STATUS
    getServiceStatus() {
        return {
            enabled: this.isEnabled,
            configured: !!(this.config.apiKey && this.config.projectId),
            currentUser: this.currentUser ? {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                emailVerified: this.currentUser.emailVerified
            } : null,
            profilesCached: this.userProfiles.size,
            authListeners: this.authStateListeners.length
        };
    }

    // ENABLE/DISABLE SERVICE
    async enableService() {
        if (!this.config.apiKey || !this.config.projectId) {
            console.log('⚠️ Cannot enable Firebase Auth - not properly configured');
            return { success: false, reason: 'not_configured' };
        }

        this.isEnabled = true;
        console.log('✅ Firebase Auth Service enabled');
        return { success: true, message: 'Firebase Auth service activated' };
    }

    disableService() {
        this.isEnabled = false;
        this.currentUser = null;
        this.userProfiles.clear();
        console.log('🔥 Firebase Auth Service disabled');
        return { success: true };
    }
}

// Global instance (inactive)
window.FirebaseAuthService = FirebaseAuthService;

console.log('🔥 Firebase Auth Service loaded (INACTIVE - awaiting configuration)');