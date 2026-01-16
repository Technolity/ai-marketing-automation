import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount, importSnapshotToSubAccount } from '@/lib/integrations/ghl';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Admin user IDs (add your admin Clerk IDs here)
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];

async function isAdmin(userId) {
    if (ADMIN_USER_IDS.includes(userId)) return true;

    // Fallback: check admin flag in database
    const { data } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    return data?.is_admin === true;
}

/**
 * GET /api/admin/ghl-subaccounts
 * 
 * Lists all users and their GHL sub-account status.
 * Admin can see who has sub-accounts and who doesn't.
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId || !await isAdmin(userId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all'; // 'all', 'missing', 'created', 'failed'

        // Get all user profiles with their GHL sub-account status
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select(`
        id,
        email,
        full_name,
        business_name,
        ghl_setup_triggered_at,
        created_at
      `)
            .order('created_at', { ascending: false });

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // Get all existing sub-accounts
        const { data: subaccounts } = await supabase
            .from('ghl_subaccounts')
            .select('user_id, location_id, location_name, snapshot_imported, created_at')
            .eq('is_active', true);

        // Get recent OAuth logs for failures
        const { data: failedLogs } = await supabase
            .from('ghl_oauth_logs')
            .select('user_id, error_message, created_at')
            .eq('operation', 'create_subaccount')
            .eq('status', 'failure')
            .order('created_at', { ascending: false })
            .limit(100);

        // Create a map for quick lookup
        const subaccountMap = new Map();
        subaccounts?.forEach(sa => {
            subaccountMap.set(sa.user_id, sa);
        });

        const failureMap = new Map();
        failedLogs?.forEach(log => {
            if (!failureMap.has(log.user_id)) {
                failureMap.set(log.user_id, log);
            }
        });

        // Build enriched list
        const users = profiles.map(profile => {
            const subaccount = subaccountMap.get(profile.id);
            const failure = failureMap.get(profile.id);

            let status = 'pending';
            if (subaccount) {
                status = 'created';
            } else if (failure) {
                status = 'failed';
            } else if (profile.ghl_setup_triggered_at) {
                status = 'triggered_no_subaccount';
            }

            return {
                userId: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                businessName: profile.business_name,
                profileCreatedAt: profile.created_at,
                ghlTriggeredAt: profile.ghl_setup_triggered_at,
                status: status,
                subaccount: subaccount ? {
                    locationId: subaccount.location_id,
                    locationName: subaccount.location_name,
                    snapshotImported: subaccount.snapshot_imported,
                    createdAt: subaccount.created_at
                } : null,
                lastError: failure?.error_message || null,
                lastErrorAt: failure?.created_at || null
            };
        });

        // Apply filter
        let filteredUsers = users;
        if (filter === 'missing') {
            filteredUsers = users.filter(u => !u.subaccount);
        } else if (filter === 'created') {
            filteredUsers = users.filter(u => u.subaccount);
        } else if (filter === 'failed') {
            filteredUsers = users.filter(u => u.status === 'failed');
        }

        // Summary stats
        const stats = {
            total: users.length,
            created: users.filter(u => u.subaccount).length,
            missing: users.filter(u => !u.subaccount).length,
            failed: users.filter(u => u.status === 'failed').length
        };

        return NextResponse.json({
            users: filteredUsers,
            stats
        });

    } catch (error) {
        console.error('[Admin GHL] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/ghl-subaccounts
 * 
 * Admin action to create sub-account for a specific user.
 * Body: { userId: string, importSnapshot?: boolean }
 */
export async function POST(req) {
    try {
        const { userId: adminId } = auth();
        if (!adminId || !await isAdmin(adminId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId, importSnapshot = true } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        console.log(`[Admin GHL] Creating sub-account for user: ${userId}`);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        if (!profile.first_name || !profile.email) {
            return NextResponse.json({
                error: 'Profile incomplete - missing name or email'
            }, { status: 400 });
        }

        // Check if sub-account already exists
        const { data: existingSubaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (existingSubaccount) {
            return NextResponse.json({
                success: true,
                alreadyExists: true,
                locationId: existingSubaccount.location_id,
                message: 'Sub-account already exists'
            });
        }

        // Create sub-account
        const result = await createGHLSubAccount({
            userId: userId,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name || '',
            phone: profile.phone || '',
            businessName: profile.business_name || `${profile.first_name}'s Business`,
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            postalCode: profile.postal_code || '',
            country: profile.country || 'US',
            timezone: profile.timezone || 'America/New_York'
        });

        if (!result.success) {
            console.error(`[Admin GHL] Failed to create sub-account for ${userId}:`, result.error);
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }

        console.log(`[Admin GHL] Sub-account created: ${result.locationId}`);

        // Import snapshot if requested
        let snapshotImported = false;
        if (importSnapshot) {
            const snapshotId = process.env.GHL_SNAPSHOT_ID;
            if (snapshotId) {
                try {
                    const snapshotResult = await importSnapshotToSubAccount(userId, snapshotId);
                    snapshotImported = snapshotResult.success;
                    console.log(`[Admin GHL] Snapshot import: ${snapshotImported ? 'success' : 'failed'}`);
                } catch (snapErr) {
                    console.error('[Admin GHL] Snapshot import error:', snapErr);
                }
            }
        }

        // Update profile flag
        await supabase
            .from('user_profiles')
            .update({ ghl_setup_triggered_at: new Date().toISOString() })
            .eq('id', userId);

        return NextResponse.json({
            success: true,
            locationId: result.locationId,
            locationName: result.locationName,
            snapshotImported: snapshotImported
        });

    } catch (error) {
        console.error('[Admin GHL] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/ghl-subaccounts
 * 
 * Admin action to reset GHL status for a user (mark sub-account inactive).
 * This allows retrying sub-account creation.
 * Body: { userId: string }
 */
export async function DELETE(req) {
    try {
        const { userId: adminId } = auth();
        if (!adminId || !await isAdmin(adminId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        console.log(`[Admin GHL] Resetting GHL status for user: ${userId}`);

        // Mark any existing sub-accounts as inactive
        await supabase
            .from('ghl_subaccounts')
            .update({ is_active: false })
            .eq('user_id', userId);

        // Clear the triggered flag to allow retry
        await supabase
            .from('user_profiles')
            .update({ ghl_setup_triggered_at: null })
            .eq('id', userId);

        return NextResponse.json({
            success: true,
            message: 'GHL status reset - user can now retry sub-account creation'
        });

    } catch (error) {
        console.error('[Admin GHL Reset] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
