import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for admin operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Cache for admin verification (expires after 2 minutes)
const adminVerifyCache = new Map();
const VERIFY_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Verify if a user is an admin by checking the database
 * @param {string} userId - The Clerk User ID
 * @returns {Promise<boolean>} - True if admin, false otherwise
 */
export async function verifyAdmin(userId) {
    if (!userId) return false;

    // Check cache first
    const cached = adminVerifyCache.get(userId);
    if (cached && Date.now() - cached.timestamp < VERIFY_CACHE_DURATION) {
        return cached.isAdmin;
    }

    try {
        // Look up admin status from user_profiles
        // Note: With the new schema, we assume `id` is the Clerk User ID (text)
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', userId)
            .maybeSingle();

        const isAdmin = profile?.is_admin || false;

        // Cache the result
        adminVerifyCache.set(userId, {
            isAdmin,
            timestamp: Date.now()
        });

        return isAdmin;
    } catch (error) {
        console.error('Admin verification error:', error);
        return false;
    }
}

/**
 * Get Supabase client for database operations (Service Role)
 */
export function getSupabaseClient() {
    return supabase;
}
