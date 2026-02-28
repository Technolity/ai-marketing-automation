import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lightweight Supabase client for checking maintenance mode
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// In-memory cache to avoid hammering DB on every page load
let maintenanceCache = { enabled: false, timestamp: 0 };
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * GET /api/maintenance-status
 *
 * Public endpoint (no auth required) that returns whether maintenance mode is active.
 * Cached for 30 seconds to prevent excessive DB queries.
 */
export async function GET() {
    try {
        const now = Date.now();

        // Return cached value if fresh
        if (now - maintenanceCache.timestamp < CACHE_TTL) {
            return NextResponse.json({ maintenanceMode: maintenanceCache.enabled });
        }

        // Fetch the 'general' settings row from admin_settings
        const { data, error } = await supabase
            .from('admin_settings')
            .select('setting_value')
            .eq('setting_key', 'general')
            .maybeSingle();

        if (error) {
            // If table doesn't exist yet, maintenance is off
            if (error.code === '42P01') {
                maintenanceCache = { enabled: false, timestamp: now };
                return NextResponse.json({ maintenanceMode: false });
            }
            console.error('[MaintenanceStatus] Error fetching:', error);
            // On error, default to NOT in maintenance (fail-open)
            return NextResponse.json({ maintenanceMode: false });
        }

        const enabled = data?.setting_value?.maintenanceMode === true;

        // Update cache
        maintenanceCache = { enabled, timestamp: now };

        return NextResponse.json({ maintenanceMode: enabled });
    } catch (error) {
        console.error('[MaintenanceStatus] Unexpected error:', error);
        return NextResponse.json({ maintenanceMode: false });
    }
}
