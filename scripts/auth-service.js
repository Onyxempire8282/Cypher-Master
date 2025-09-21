/**
 * Authentication Service
 * Handles all authentication operations with Supabase
 */

// Use globally available window.supabaseClient client and config
// These will be available after window.supabaseClient-config.js loads

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Listen for auth changes
        this.setupAuthListener();
        
        console.log('🔐 AuthService initialized');
    }

    /* ================================
       AUTHENTICATION METHODS
       ================================ */

    async signUp(userData) {
        try {
            console.log('🔑 Attempting user registration...');
            
            if (!window.supabaseClient) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        experience_level: userData.experience
                    },
                    emailRedirectTo: window.window.AUTH_CONFIG.emailRedirectTo
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            console.log('✅ User registration successful:', data.user?.email);
            
            // Save complete profile data
            if (data.user && !error) {
                await this.saveUserProfile(data.user.id, userData);
            }

            return {
                success: true,
                user: data.user,
                message: 'Registration successful! Please check your email to verify your account.',
                requiresVerification: !data.session
            };

        } catch (error) {
            console.error('❌ Registration failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async signIn(email, password) {
        try {
            console.log('🔑 Attempting user login...');
            
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw new Error(error.message);
            }

            console.log('✅ User login successful:', data.user?.email);
            
            this.currentUser = data.user;
            this.isAuthenticated = true;

            // Update last login
            await this.updateLastLogin(data.user.id);

            return {
                success: true,
                user: data.user,
                session: data.session
            };

        } catch (error) {
            console.error('❌ Login failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async signOut() {
        try {
            console.log('🚪 Signing out user...');
            
            const { error } = await window.supabaseClient.auth.signOut();

            if (error) {
                throw new Error(error.message);
            }

            this.currentUser = null;
            this.isAuthenticated = false;

            console.log('✅ User signed out successfully');
            
            return { success: true };

        } catch (error) {
            console.error('❌ Sign out failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`
            });

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                message: 'Password reset email sent!'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /* ================================
       USER PROFILE METHODS
       ================================ */

    async saveUserProfile(userId, profileData) {
        try {
            console.log('💾 Saving user profile data...');

            // Insert/update main profile
            const { error: profileError } = await window.supabaseClient
                .from('user_profiles')
                .upsert({
                    id: userId,
                    full_name: profileData.fullName,
                    experience_level: profileData.experience,
                    years_experience: profileData.yearsExperience,
                    is_profile_complete: false,
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                throw new Error(profileError.message);
            }

            // Save territory data if exists
            if (profileData.territoryType) {
                await this.saveUserTerritory(userId, profileData);
            }

            // Save network data if exists
            if (profileData.firmCount) {
                await this.saveUserNetwork(userId, profileData);
            }

            // Save preferences if exists
            if (profileData.colorScheme || profileData.deviceType) {
                await this.saveUserPreferences(userId, profileData);
            }

            console.log('✅ User profile saved successfully');
            return { success: true };

        } catch (error) {
            console.error('❌ Failed to save profile:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async saveUserTerritory(userId, data) {
        const { error } = await window.supabaseClient
            .from('user_territory')
            .upsert({
                user_id: userId,
                territory_type: data.territoryType,
                max_distance: data.maxDistance,
                travel_preferences: {
                    willing_to_travel: data.maxDistance !== 'local'
                }
            });

        if (error) throw new Error(error.message);
    }

    async saveUserNetwork(userId, data) {
        const { error } = await window.supabaseClient
            .from('user_network')
            .upsert({
                user_id: userId,
                firm_count: data.firmCount,
                network_preferences: {
                    preferred_firm_size: data.firmCount
                }
            });

        if (error) throw new Error(error.message);
    }

    async saveUserPreferences(userId, data) {
        const { error } = await window.supabaseClient
            .from('user_preferences')
            .upsert({
                user_id: userId,
                device_type: data.deviceType,
                color_scheme: data.colorScheme || 'classic',
                app_settings: {
                    notifications_enabled: true,
                    theme: data.colorScheme || 'classic'
                }
            });

        if (error) throw new Error(error.message);
    }

    async getUserProfile(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('user_profiles')
                .select(`
                    *,
                    user_territory(*),
                    user_network(*),
                    user_rates(*),
                    user_preferences(*)
                `)
                .eq('id', userId)
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                profile: data
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /* ================================
       SESSION MANAGEMENT
       ================================ */

    setupAuthListener() {
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 Auth state changed:', event);

            switch (event) {
                case 'SIGNED_IN':
                    this.currentUser = session?.user || null;
                    this.isAuthenticated = true;
                    await this.handleSignIn(session);
                    break;

                case 'SIGNED_OUT':
                    this.currentUser = null;
                    this.isAuthenticated = false;
                    this.handleSignOut();
                    break;

                case 'TOKEN_REFRESHED':
                    console.log('🔄 Token refreshed');
                    break;

                case 'USER_UPDATED':
                    this.currentUser = session?.user || null;
                    break;
            }
        });
    }

    async handleSignIn(session) {
        // Update session tracking
        if (session?.user) {
            await this.updateUserSession(session.user.id);
        }

        // Emit custom event for app to handle
        window.dispatchEvent(new CustomEvent('auth:signedIn', {
            detail: { user: session?.user }
        }));
    }

    handleSignOut() {
        // Clear any cached data
        localStorage.removeItem('userCipher');
        
        // Emit custom event
        window.dispatchEvent(new CustomEvent('auth:signedOut'));
    }

    async updateUserSession(userId) {
        await window.supabaseClient
            .from('user_sessions')
            .upsert({
                user_id: userId,
                last_active: new Date().toISOString(),
                session_data: {
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            });
    }

    async updateLastLogin(userId) {
        await window.supabaseClient
            .from('user_profiles')
            .update({
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
    }

    /* ================================
       UTILITY METHODS
       ================================ */

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    async getSession() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        return session;
    }

    async refreshSession() {
        const { data, error } = await window.supabaseClient.auth.refreshSession();
        return { data, error };
    }
}

// Create and make auth service globally available
const authService = new AuthService();

// Export for global access
window.authService = authService;

console.log('✅ Authentication service ready');