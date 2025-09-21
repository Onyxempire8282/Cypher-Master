/**
 * Supabase Configuration
 * Handles database connection and authentication setup
 */

// Wait for Supabase library to load, then initialize
(function() {
    // Check if Supabase is available
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library not loaded');
        return;
    }

    const { createClient } = window.supabase;

    // Supabase configuration
    const supabaseUrl = window.SUPABASE_URL || 'https://your-project-id.supabase.co';
    const supabaseAnonKey = window.SUPABASE_ANON_KEY || 'your-anon-key-here';

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // More secure flow
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'X-Client-Info': 'claim-cipher-app'
        }
    }
    });

    // Database table names
    const TABLES = {
        USERS: 'users',
        USER_PROFILES: 'user_profiles',
        USER_SESSIONS: 'user_sessions',
        CIPHER_DATA: 'cipher_data'
    };

    // Authentication configuration
    const AUTH_CONFIG = {
        redirectTo: `${window.location.origin}/dashboard`,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        providers: ['email'], // Can add Google, GitHub, etc. later
        requireEmailConfirmation: true
    };

    // Export for global access
    window.supabaseClient = supabase;
    window.TABLES = TABLES;
    window.AUTH_CONFIG = AUTH_CONFIG;

    console.log('🔐 Supabase client initialized');
})();