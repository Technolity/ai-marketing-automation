import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Strict no-cache headers to prevent CDN/browser from serving stale status
const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
};

/**
 * Simple retry helper with exponential backoff
 */
async function fetchWithRetry(fn, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === maxRetries) throw err;
            // Exponential backoff: 500ms, 1000ms
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
    }
}

/**
 * GET /api/maintenance-status
 *
 * Public endpoint (no auth required) that returns whether maintenance mode is active.
 * Creates its own Supabase client to ensure a completely fresh connection.
 * Includes retry logic for transient network/fetch errors.
 * CRITICAL: Every response includes strict no-cache headers so toggling
 *           maintenance off takes effect immediately for all users.
 */
export async function GET() {
    try {
        const result = await fetchWithRetry(async () => {
            // Create a fresh client every time to avoid any module-level caching
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            const { data, error } = await supabase
                .from('admin_settings')
                .select('setting_key, setting_value')
                .eq('setting_key', 'general')
                .maybeSingle();

            if (error) {
                // Throw so the retry logic can catch transient DB errors
                throw new Error(`DB error: ${error.message}`);
            }

            return data;
        });

        const enabled = result?.setting_value?.maintenanceMode === true;

        return NextResponse.json({ maintenanceMode: enabled }, { headers: NO_CACHE_HEADERS });
    } catch (error) {
        // Fail-open: if all retries exhausted, assume maintenance is OFF
        console.error('[MaintenanceStatus] All retries failed:', error.message);
        return NextResponse.json({ maintenanceMode: false }, { headers: NO_CACHE_HEADERS });
    }
}
