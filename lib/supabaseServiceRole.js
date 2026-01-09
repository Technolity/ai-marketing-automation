// lib/supabaseServiceRole.js
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Service Role Client with Connection Pooling
 *
 * Uses Supavisor (connection pooler) for production to prevent connection exhaustion.
 * Falls back to direct connection for development.
 */

// Determine which URL to use
const getSupabaseUrl = () => {
    // In production or when explicitly enabled, use pooler
    if (process.env.USE_SUPABASE_POOLER === 'true') {
        if (!process.env.SUPABASE_POOLER_URL) {
            console.warn('⚠️  USE_SUPABASE_POOLER is true but SUPABASE_POOLER_URL is not set. Falling back to direct connection.');
            return process.env.NEXT_PUBLIC_SUPABASE_URL;
        }
        console.log('✅ Using Supabase Pooler (Connection Pooling Enabled)');
        return process.env.SUPABASE_POOLER_URL;
    }

    // Development: use direct connection
    console.log('ℹ️  Using Direct Supabase Connection (Development Mode)');
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
};

const supabaseUrl = getSupabaseUrl();

export const supabase = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                // Add connection timeout
                'x-connection-timeout': '30'
            }
        }
    }
);
