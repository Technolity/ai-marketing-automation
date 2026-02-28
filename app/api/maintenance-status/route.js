import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance-status
 *
 * Public endpoint (no auth required) that returns whether maintenance mode is active.
 * Creates its own Supabase client to ensure a completely fresh connection.
 */
export async function GET() {
    try {
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
            console.error('[MaintenanceStatus] DB error:', error.message);
            return NextResponse.json({ maintenanceMode: false });
        }

        const enabled = data?.setting_value?.maintenanceMode === true;

        return NextResponse.json({ maintenanceMode: enabled });
    } catch (error) {
        console.error('[MaintenanceStatus] Unexpected error:', error.message);
        return NextResponse.json({ maintenanceMode: false });
    }
}
