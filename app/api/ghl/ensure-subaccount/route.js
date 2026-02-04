import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount, importSnapshotToSubAccount, createGHLUser, sendGHLWelcomeEmail } from '@/lib/integrations/ghl';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/ghl/ensure-subaccount
 *
 * Ensures user has a GHL sub-account.
 * Creates one if missing (for users who onboarded before OAuth integration).
 * Team members will access their owner's GHL sub-account (read-only check, no creation).
 * Called from dashboard/vault when user needs to deploy.
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, isTeamMember, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[Ensure SubAccount] Check for target user ${targetUserId} (Auth: ${userId}, IsTeamMember: ${isTeamMember})`);

        // 1. Check if target user (owner if team member) has a sub-account
        const { data: existingSubaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (existingSubaccount) {
            console.log('[Ensure SubAccount] Target user has sub-account:', existingSubaccount.location_id);

            // Check if GHL user account has been created
            let userCreated = existingSubaccount.ghl_user_created || false;
            let ghlUserId = existingSubaccount.ghl_user_id;

            // IMPORTANT: Only create GHL user for the owner, not for team members
            if (!userCreated && !isTeamMember) {
                console.log('[Ensure SubAccount] GHL user not created yet, creating now...');

                // Get user profile for user creation
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('first_name, last_name, email')
                    .eq('id', targetUserId)
                    .single();

                if (profile && profile.email) {
                    // Create GHL user account
                    console.log('[Ensure SubAccount Phase: User Creation] Attempting GHL user creation for:', profile.email);
                    const userResult = await createGHLUser({
                        firstName: profile.first_name,
                        lastName: profile.last_name || '',
                        email: profile.email,
                        locationId: existingSubaccount.location_id
                    });

                    if (userResult.success) {
                        // Check if user was just created vs already existed
                        if (userResult.userAlreadyExists) {
                            console.log('[Ensure SubAccount Phase: User Creation] GHL user already exists, skipping email');
                            userCreated = true; // Treat as created for flow purposes
                        } else {
                            console.log('[Ensure SubAccount Phase: User Creation] GHL user created:', userResult.userId);

                            // Send welcome email ONLY for newly created users
                            console.log('[Ensure SubAccount Phase: Email] Sending welcome email...');
                            await sendGHLWelcomeEmail(profile.email, profile.first_name);
                            console.log('[Ensure SubAccount Phase: Email] Welcome email sent!');

                            // Update database
                            await supabase
                                .from('ghl_subaccounts')
                                .update({
                                    ghl_user_created: true,
                                    ghl_user_id: userResult.userId,
                                    user_created_at: new Date().toISOString()
                                })
                                .eq('id', existingSubaccount.id);

                            userCreated = true;
                            ghlUserId = userResult.userId;
                        }
                    } else {
                        console.error('[Ensure SubAccount Phase: User Creation] Failed to create GHL user:', userResult.error);
                        // Continue anyway - don't block the flow
                    }
                }
            }

            return NextResponse.json({
                success: true,
                exists: true,
                locationId: existingSubaccount.location_id,
                locationName: existingSubaccount.location_name,
                snapshotImported: existingSubaccount.snapshot_imported,
                userCreated: userCreated,
                ghlUserId: ghlUserId,
                isTeamMember: isTeamMember
            });
        }

        // CRITICAL: Team members cannot create sub-accounts - only owners can
        if (isTeamMember) {
            console.log('[Ensure SubAccount] Team member attempted access but owner has no GHL setup');
            return NextResponse.json({
                success: false,
                error: 'Owner has not set up GHL integration yet. Please contact your workspace owner.',
                needsOwnerSetup: true
            }, { status: 403 });
        }

        // 2. Get user profile for sub-account creation (only for owners)
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({
                error: 'User profile not found. Please complete onboarding first.'
            }, { status: 404 });
        }

        // Check if profile is complete enough to create sub-account
        if (!profile.first_name || !profile.email) {
            return NextResponse.json({
                error: 'Profile incomplete. Please complete your profile first.',
                needsOnboarding: true
            }, { status: 400 });
        }

        console.log('[Ensure SubAccount] Creating sub-account for existing user:', profile.email);

        // 3. Create sub-account
        const ghlResult = await createGHLSubAccount({
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

        if (!ghlResult.success) {
            console.error('[Ensure SubAccount] Failed:', ghlResult.error);
            return NextResponse.json({
                success: false,
                error: ghlResult.error
            }, { status: 500 });
        }

        console.log('[Ensure SubAccount] Sub-account created:', ghlResult.locationId);

        // 4. Auto-import snapshot if configured
        let snapshotImported = false;
        const snapshotId = process.env.GHL_SNAPSHOT_ID;

        if (snapshotId) {
            console.log('[Ensure SubAccount] Importing snapshot...');
            try {
                const snapshotResult = await importSnapshotToSubAccount(userId, snapshotId);
                snapshotImported = snapshotResult.success;
                if (snapshotResult.success) {
                    console.log('[Ensure SubAccount] Snapshot imported successfully');
                } else {
                    console.error('[Ensure SubAccount] Snapshot import failed:', snapshotResult.error);
                }
            } catch (snapErr) {
                console.error('[Ensure SubAccount] Snapshot import error:', snapErr);
            }
        }

        // 5. Create GHL user account
        let userCreated = false;
        let ghlUserId = null;

        console.log('[Ensure SubAccount Phase: User Creation] Creating GHL user account...');
        const userResult = await createGHLUser({
            firstName: profile.first_name,
            lastName: profile.last_name || '',
            email: profile.email,
            locationId: ghlResult.locationId
        });

        if (userResult.success) {
            // Check if user was just created vs already existed
            if (userResult.userAlreadyExists) {
                console.log('[Ensure SubAccount Phase: User Creation] GHL user already exists, skipping email');
                userCreated = true; // Treat as created for flow purposes
            } else {
                console.log('[Ensure SubAccount Phase: User Creation] GHL user created:', userResult.userId);
                ghlUserId = userResult.userId;
                userCreated = true;

                // Send welcome email ONLY for newly created users
                console.log('[Ensure SubAccount Phase: Email] Sending welcome email...');
                const emailSent = await sendGHLWelcomeEmail(profile.email, profile.first_name);
                console.log('[Ensure SubAccount Phase: Email] Welcome email sent:', emailSent);

                // Update subaccount record with user info
                await supabase
                    .from('ghl_subaccounts')
                    .update({
                        ghl_user_created: true,
                        ghl_user_id: userResult.userId,
                        user_created_at: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                    .eq('location_id', ghlResult.locationId);
            }
        } else {
            console.error('[Ensure SubAccount Phase: User Creation] Failed to create GHL user:', userResult.error);
            // Continue anyway - don't block the flow since subaccount was created
        }

        // 6. Update profile to mark GHL as setup
        await supabase
            .from('user_profiles')
            .update({ ghl_setup_triggered_at: new Date().toISOString() })
            .eq('id', userId);

        return NextResponse.json({
            success: true,
            exists: false,
            created: true,
            locationId: ghlResult.locationId,
            locationName: ghlResult.locationName,
            snapshotImported: snapshotImported,
            userCreated: userCreated,
            ghlUserId: ghlUserId
        });

    } catch (error) {
        console.error('[Ensure SubAccount] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/ghl/ensure-subaccount
 *
 * Check if user has a GHL sub-account without creating one.
 * Team members will check their owner's GHL sub-account.
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, isTeamMember, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[Ensure SubAccount GET] Check for target user ${targetUserId} (Auth: ${userId})`);

        const { data: subaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (subaccount) {
            return NextResponse.json({
                hasSubaccount: true,
                locationId: subaccount.location_id,
                locationName: subaccount.location_name,
                snapshotImported: subaccount.snapshot_imported,
                customValuesSynced: subaccount.custom_values_synced,
                isTeamMember: isTeamMember
            });
        }

        return NextResponse.json({
            hasSubaccount: false,
            isTeamMember: isTeamMember,
            needsOwnerSetup: isTeamMember
        });

    } catch (error) {
        console.error('[Ensure SubAccount GET] Error:', error);
        return NextResponse.json({
            hasSubaccount: false,
            error: error.message
        }, { status: 500 });
    }
}
