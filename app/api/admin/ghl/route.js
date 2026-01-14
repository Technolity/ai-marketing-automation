import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin API for managing GHL Agency credentials
 * Only accessible by admins
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function isAdmin(userId) {
    const { data } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
    return data?.is_admin === true;
}

/**
 * GET - Fetch current GHL agency credentials status
 */
export async function GET() {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!await isAdmin(userId)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Fetch active agency credentials
        const { data, error } = await supabase
            .from('ghl_agency_credentials')
            .select('id, agency_id, agency_name, is_active, created_at, updated_at, last_used_at')
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('[Admin GHL] Error fetching credentials:', error);
            throw error;
        }

        // Also check env var fallback
        const hasEnvToken = !!process.env.GHL_AGENCY_TOKEN;
        const hasEnvAgencyId = !!process.env.GHL_AGENCY_ID;

        return NextResponse.json({
            isConnected: !!data || (hasEnvToken && hasEnvAgencyId),
            source: data ? 'database' : (hasEnvToken ? 'environment' : 'none'),
            credentials: data ? {
                agencyId: data.agency_id,
                agencyName: data.agency_name,
                createdAt: data.created_at,
                lastUsedAt: data.last_used_at
            } : hasEnvToken ? {
                agencyId: process.env.GHL_AGENCY_ID || 'Not set',
                agencyName: 'From Environment',
                createdAt: null,
                lastUsedAt: null
            } : null
        });

    } catch (error) {
        console.error('[Admin GHL] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch GHL status' }, { status: 500 });
    }
}

/**
 * POST - Save new GHL agency credentials
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!await isAdmin(userId)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { agencyId, agencyName, accessToken } = await req.json();

        if (!agencyId || !accessToken) {
            return NextResponse.json({
                error: 'Agency ID and Access Token (PIT) are required'
            }, { status: 400 });
        }

        // Deactivate any existing credentials
        await supabase
            .from('ghl_agency_credentials')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('is_active', true);

        // Insert new credentials
        const { data, error } = await supabase
            .from('ghl_agency_credentials')
            .upsert({
                agency_id: agencyId,
                agency_name: agencyName || 'TedOS Agency',
                access_token: accessToken,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'agency_id'
            })
            .select()
            .single();

        if (error) {
            console.error('[Admin GHL] Error saving credentials:', error);
            throw error;
        }

        console.log('[Admin GHL] Agency credentials saved:', agencyId);

        return NextResponse.json({
            success: true,
            message: 'GHL Agency credentials saved successfully',
            credentials: {
                agencyId: data.agency_id,
                agencyName: data.agency_name,
                createdAt: data.created_at
            }
        });

    } catch (error) {
        console.error('[Admin GHL] Error saving credentials:', error);
        return NextResponse.json({ error: 'Failed to save GHL credentials' }, { status: 500 });
    }
}

/**
 * DELETE - Disconnect GHL agency
 */
export async function DELETE() {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!await isAdmin(userId)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Deactivate all credentials
        const { error } = await supabase
            .from('ghl_agency_credentials')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('is_active', true);

        if (error) {
            throw error;
        }

        console.log('[Admin GHL] Agency credentials deactivated');

        return NextResponse.json({
            success: true,
            message: 'GHL Agency disconnected'
        });

    } catch (error) {
        console.error('[Admin GHL] Error disconnecting:', error);
        return NextResponse.json({ error: 'Failed to disconnect GHL' }, { status: 500 });
    }
}
