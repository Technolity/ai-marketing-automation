/**
 * Admin Manual GHL Sub-Account Creation
 * 
 * POST /api/admin/ghl-accounts/manual-create
 * 
 * Creates a GHL sub-account for a user under the Agency plan (non-SaaS),
 * optionally imports the snapshot and creates a builder login,
 * and overrides the user's subscription tier on the platform.
 * 
 * Body: {
 *   userId: string,               // Clerk user ID
 *   subscriptionTier: 'starter' | 'growth' | 'scale',
 *   importSnapshot?: boolean,      // default true
 *   createBuilderLogin?: boolean   // default true
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import {
    createGHLSubAccount,
    importSnapshotToSubAccount,
    createGHLUser,
    sendGHLWelcomeEmail
} from '@/lib/integrations/ghl';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes — sub-account + snapshot + user creation can take time

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(userId) {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    return profile?.is_admin === true;
}

/**
 * GET /api/admin/ghl-accounts/manual-create?email=...
 * 
 * Search user_profiles directly by email — finds users regardless of GHL status.
 * Returns profile info and whether they already have a sub-account.
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email')?.trim();

        if (!email) {
            return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
        }

        // Search user_profiles directly — case-insensitive exact match
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, first_name, last_name, business_name, phone, address, city, country, ghl_sync_status, ghl_location_id, subscription_tier, subscription_status')
            .ilike('email', email)
            .is('deleted_at', null)
            .maybeSingle();

        if (profileError) {
            console.error('[Manual Create Search] DB error:', profileError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!profile) {
            return NextResponse.json({ found: false, error: 'No user found with this email address.' });
        }

        // Check if they already have an active sub-account
        const { data: existingSubaccount } = await supabase
            .from('ghl_subaccounts')
            .select('location_id, location_name')
            .eq('user_id', profile.id)
            .eq('is_active', true)
            .maybeSingle();

        const hasSubaccount = !!(existingSubaccount?.location_id || profile.ghl_location_id);

        return NextResponse.json({
            found: true,
            user: {
                ...profile,
                has_subaccount: hasSubaccount,
                ghl_location_id: existingSubaccount?.location_id || profile.ghl_location_id || null,
                ghl_location_name: existingSubaccount?.location_name || null
            }
        });

    } catch (error) {
        console.error('[Manual Create Search] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req) {
    const startTime = Date.now();

    try {
        // 1. Auth check
        const { userId: adminId } = auth();
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse body
        const body = await req.json();
        const {
            userId,
            subscriptionTier = 'starter',
            importSnapshot = true,
            createBuilderLogin = true
        } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const validTiers = ['starter', 'growth', 'scale'];
        if (!validTiers.includes(subscriptionTier)) {
            return NextResponse.json({
                error: `Invalid subscription tier. Must be one of: ${validTiers.join(', ')}`
            }, { status: 400 });
        }

        console.log(`[Admin Manual Create] Starting for userId: ${userId}, tier: ${subscriptionTier}`);

        // 3. Look up user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        if (!profile.email) {
            return NextResponse.json({
                error: 'Profile incomplete — email is required to create a GHL sub-account'
            }, { status: 400 });
        }

        // 4. Check if sub-account already exists
        const { data: existingSubaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (existingSubaccount) {
            return NextResponse.json({
                error: 'User already has an active sub-account',
                locationId: existingSubaccount.location_id,
                locationName: existingSubaccount.location_name
            }, { status: 409 });
        }

        // 5. Create sub-account via GHL Agency OAuth
        console.log(`[Admin Manual Create] Creating sub-account for: ${profile.email}`);

        const createResult = await createGHLSubAccount({
            userId,
            email: profile.email,
            firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'User',
            lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
            phone: profile.phone || '',
            businessName: profile.business_name || `${profile.first_name || 'User'}'s Business`,
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            postalCode: profile.postal_code || '',
            country: profile.country || 'US',
            timezone: profile.timezone || 'America/New_York'
        });

        if (!createResult.success) {
            console.error(`[Admin Manual Create] Sub-account creation failed:`, createResult.error);
            return NextResponse.json({
                error: `Sub-account creation failed: ${createResult.error}`
            }, { status: 500 });
        }

        const locationId = createResult.locationId;
        const locationName = createResult.locationName;
        console.log(`[Admin Manual Create] Sub-account created: ${locationId}`);

        // 6. Override subscription tier and status on user_profiles
        console.log(`[Admin Manual Create] Setting subscription tier to: ${subscriptionTier}`);

        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                subscription_tier: subscriptionTier,
                subscription_status: 'active',
                ghl_setup_triggered_at: new Date().toISOString(),
                ghl_sync_status: 'synced'
            })
            .eq('id', userId);

        if (updateError) {
            console.error('[Admin Manual Create] Profile update error:', updateError);
            // Non-fatal — sub-account was already created
        }

        // 7. Optionally import snapshot
        let snapshotImported = false;
        let snapshotError = null;

        if (importSnapshot) {
            const snapshotId = process.env.GHL_SNAPSHOT_ID;
            if (snapshotId) {
                console.log(`[Admin Manual Create] Importing snapshot: ${snapshotId}`);
                try {
                    const snapshotResult = await importSnapshotToSubAccount(userId, snapshotId);
                    snapshotImported = snapshotResult.success;
                    if (!snapshotResult.success) {
                        snapshotError = snapshotResult.error;
                        console.warn('[Admin Manual Create] Snapshot import failed:', snapshotError);
                    } else {
                        console.log('[Admin Manual Create] Snapshot imported successfully');
                    }
                } catch (err) {
                    snapshotError = err.message;
                    console.error('[Admin Manual Create] Snapshot import error:', err);
                }
            } else {
                snapshotError = 'GHL_SNAPSHOT_ID not configured in environment';
                console.warn('[Admin Manual Create] No GHL_SNAPSHOT_ID configured');
            }
        }

        // 8. Optionally create builder login
        let builderLoginCreated = false;
        let builderLoginError = null;

        if (createBuilderLogin && locationId) {
            console.log(`[Admin Manual Create] Creating builder login for: ${profile.email}`);
            try {
                const userResult = await createGHLUser({
                    firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'User',
                    lastName: profile.last_name || '',
                    email: profile.email,
                    locationId: locationId
                });

                if (userResult.success) {
                    builderLoginCreated = true;
                    console.log('[Admin Manual Create] Builder login created');

                    // Update sub-account record
                    await supabase
                        .from('ghl_subaccounts')
                        .update({
                            ghl_user_created: true,
                            ghl_user_id: userResult.userId || null,
                            ghl_user_invited: true
                        })
                        .eq('user_id', userId)
                        .eq('is_active', true);

                    // Send welcome email
                    try {
                        await sendGHLWelcomeEmail(profile.email, profile.first_name || 'User');
                    } catch (emailErr) {
                        console.warn('[Admin Manual Create] Welcome email failed:', emailErr.message);
                    }
                } else if (userResult.userAlreadyExists) {
                    builderLoginCreated = true;
                    console.log('[Admin Manual Create] Builder login already exists');
                } else {
                    builderLoginError = userResult.error;
                    console.warn('[Admin Manual Create] Builder login failed:', builderLoginError);
                }
            } catch (err) {
                builderLoginError = err.message;
                console.error('[Admin Manual Create] Builder login error:', err);
            }
        }

        // 9. Log to ghl_oauth_logs for audit trail
        try {
            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'admin_manual_create',
                status: 'success',
                response_data: {
                    location_id: locationId,
                    location_name: locationName,
                    subscription_tier: subscriptionTier,
                    snapshot_imported: snapshotImported,
                    builder_login_created: builderLoginCreated,
                    admin_id: adminId,
                    duration_ms: Date.now() - startTime
                }
            });
        } catch (logErr) {
            console.warn('[Admin Manual Create] Audit log failed:', logErr.message);
        }

        console.log(`[Admin Manual Create] Complete in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            success: true,
            locationId,
            locationName,
            subscriptionTier,
            snapshotImported,
            snapshotError,
            builderLoginCreated,
            builderLoginError
        });

    } catch (error) {
        console.error('[Admin Manual Create] Unhandled error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
