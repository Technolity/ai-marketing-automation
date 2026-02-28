import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// Use the same Supabase client as the rest of the admin system
const supabase = getSupabaseClient();

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
            console.log('[MaintenanceStatus] Returning cached value:', maintenanceCache.enabled);
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
                console.log('[MaintenanceStatus] Table not found, returning false');
                maintenanceCache = { enabled: false, timestamp: now };
                return NextResponse.json({ maintenanceMode: false });
            }
            console.error('[MaintenanceStatus] DB error:', error.message, error.code);
            // On error, default to NOT in maintenance (fail-open)
            return NextResponse.json({ maintenanceMode: false });
        }

        console.log('[MaintenanceStatus] Raw DB data:', JSON.stringify(data));

        const enabled = data?.setting_value?.maintenanceMode === true;

        console.log('[MaintenanceStatus] maintenanceMode resolved to:', enabled);

        // Update cache
        maintenanceCache = { enabled, timestamp: now };

        return NextResponse.json({ maintenanceMode: enabled });
    } catch (error) {
        console.error('[MaintenanceStatus] Unexpected error:', error.message);
        return NextResponse.json({ maintenanceMode: false });
    }
}
