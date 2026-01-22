/**
 * GHL Auto-Create Settings API
 * Manage auto-creation of GHL users when users complete onboarding
 * 
 * GET  /api/admin/settings/ghl-auto-create  - Get current setting
 * POST /api/admin/settings/ghl-auto-create  - Toggle setting on/off
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Verify user is admin
 */
async function verifyAdmin(userId) {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin, email')
        .eq('id', userId)
        .single();

    return profile?.is_admin === true ? profile : null;
}

/**
 * GET - Return current auto-create status
 */
export async function GET(req) {
    const requestId = randomUUID().split('-')[0];

    try {
        console.log(`[${requestId}] [Auto-Create Settings] GET request`);

        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[${requestId}] [Auto-Create Settings] Unauthorized`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminProfile = await verifyAdmin(userId);
        if (!adminProfile) {
            console.log(`[${requestId}] [Auto-Create Settings] Forbidden: ${userId}`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Fetch current setting
        const { data: setting, error } = await supabase
            .from('admin_settings')
            .select('*')
            .eq('setting_key', 'ghl_auto_create_users')
            .single();

        if (error) {
            console.error(`[${requestId}] [Auto-Create Settings] DB error:`, error);
            return NextResponse.json({
                error: 'Failed to fetch settings'
            }, { status: 500 });
        }

        console.log(`[${requestId}] [Auto-Create Settings] Current setting:`, setting.setting_value);

        return NextResponse.json({
            success: true,
            enabled: setting.setting_value.enabled || false,
            enabledAt: setting.setting_value.enabled_at || null,
            enabledBy: setting.setting_value.enabled_by || null,
            updatedAt: setting.updated_at
        });

    } catch (error) {
        console.error(`[${requestId}] [Auto-Create Settings] Error:`, error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}

/**
 * POST - Toggle auto-create on/off
 * Body: { enabled: boolean }
 */
export async function POST(req) {
    const requestId = randomUUID().split('-')[0];

    try {
        console.log(`[${requestId}] [Auto-Create Settings] POST request`);

        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[${requestId}] [Auto-Create Settings] Unauthorized`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminProfile = await verifyAdmin(userId);
        if (!adminProfile) {
            console.log(`[${requestId}] [Auto-Create Settings] Forbidden: ${userId}`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            console.log(`[${requestId}] [Auto-Create Settings] Invalid enabled value:`, enabled);
            return NextResponse.json({
                error: 'enabled must be a boolean'
            }, { status: 400 });
        }

        console.log(`[${requestId}] [Auto-Create Settings] Toggling to: ${enabled} by ${adminProfile.email}`);

        // 3. Update setting
        const newValue = {
            enabled: enabled,
            enabled_at: enabled ? new Date().toISOString() : null,
            enabled_by: enabled ? userId : null
        };

        const { data: updatedSetting, error: updateError } = await supabase
            .from('admin_settings')
            .update({
                setting_value: newValue,
                updated_by: userId,
                updated_at: new Date().toISOString()
            })
            .eq('setting_key', 'ghl_auto_create_users')
            .select()
            .single();

        if (updateError) {
            console.error(`[${requestId}] [Auto-Create Settings] Update error:`, updateError);
            return NextResponse.json({
                error: 'Failed to update setting'
            }, { status: 500 });
        }

        console.log(`[${requestId}] [Auto-Create Settings] ✅ Setting updated successfully`);

        // 4. Log the toggle event
        await supabase
            .from('ghl_oauth_logs')
            .insert({
                user_id: userId,
                operation: 'auto_create_toggle',
                status: 'success',
                response_data: {
                    enabled: enabled,
                    toggled_at: new Date().toISOString(),
                    toggled_by: adminProfile.email
                }
            });

        return NextResponse.json({
            success: true,
            enabled: enabled,
            enabledAt: newValue.enabled_at,
            enabledBy: userId,
            message: enabled
                ? '✅ Auto-create enabled - new users will get GHL accounts automatically'
                : '⏸️ Auto-create disabled - manual creation required'
        });

    } catch (error) {
        console.error(`[${requestId}] [Auto-Create Settings] Error:`, error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
