import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { pushVaultToGHL } from '@/lib/ghl/pushSystem';
import { createGHLSubAccount, importSnapshotToSubAccount } from '@/lib/integrations/ghl';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Get location access token for GHL API calls
 */
async function getLocationToken(userId, locationId) {
    // Get user's sub-account
    const { data: subaccount, error: subError } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (subError || !subaccount) {
        return { success: false, error: 'No sub-account found for user' };
    }

    // Get agency token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (tokenError || !tokenData) {
        return { success: false, error: 'No agency token found' };
    }

    const companyId = tokenData.company_id;
    if (!companyId) {
        return { success: false, error: 'companyId not found in agency token' };
    }

    // Generate location token
    const locationTokenResponse = await fetch(
        'https://services.leadconnectorhq.com/oauth/locationToken',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({
                companyId: companyId,
                locationId: locationId || subaccount.location_id,
            }),
        }
    );

    if (!locationTokenResponse.ok) {
        const errorData = await locationTokenResponse.json().catch(() => ({}));
        return { success: false, error: errorData.message || 'Failed to generate location token' };
    }

    const locationTokenData = await locationTokenResponse.json();

    if (!locationTokenData.access_token) {
        return { success: false, error: 'Location token response missing access_token' };
    }

    return { success: true, access_token: locationTokenData.access_token };
}

/**
 * POST /api/ghl/deploy-workflow
 * Deploy content to GHL via OAuth (no more Pabbly)
 * Uses pushVaultToGHL which generates correct newSchema keys
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { funnelId } = await req.json();
        if (!funnelId) {
            return NextResponse.json({ error: 'Missing funnelId' }, { status: 400 });
        }

        // 1. Get or Create User's GHL Location ID
        let locationId = null;

        // Try ghl_subaccounts first (OAuth created)
        let { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id, location_name')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (subaccount && subaccount.location_id) {
            locationId = subaccount.location_id;
            console.log('[Deploy] Found Location ID in ghl_subaccounts:', locationId);
        } else {
            // No sub-account exists - try to create one for this existing user
            console.log('[Deploy] No sub-account found, attempting to create for existing user...');

            // Get user profile
            const { data: profile } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile && profile.first_name && profile.email) {
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

                if (result.success) {
                    locationId = result.locationId;
                    console.log('[Deploy] Sub-account created for existing user:', locationId);

                    // Also import snapshot if configured
                    const snapshotId = process.env.GHL_SNAPSHOT_ID;
                    if (snapshotId) {
                        try {
                            await importSnapshotToSubAccount(userId, snapshotId);
                            console.log('[Deploy] Snapshot imported for new sub-account');
                        } catch (snapErr) {
                            console.error('[Deploy] Snapshot import error:', snapErr);
                        }
                    }

                    // Update profile flag
                    await supabaseAdmin
                        .from('user_profiles')
                        .update({ ghl_setup_triggered_at: new Date().toISOString() })
                        .eq('id', userId);
                } else {
                    console.error('[Deploy] Failed to create sub-account:', result.error);
                }
            }

            // Fallback to legacy sources if still no locationId
            if (!locationId) {
                // Try legacy ghl_subaccount_logs
                const { data: logEntry } = await supabaseAdmin
                    .from('ghl_subaccount_logs')
                    .select('location_id')
                    .eq('user_id', userId)
                    .not('location_id', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (logEntry && logEntry.location_id) {
                    locationId = logEntry.location_id;
                    console.log('[Deploy] Found Location ID in legacy logs:', locationId);
                } else {
                    // Try user_profiles.ghl_location_id
                    const { data: profile2 } = await supabaseAdmin
                        .from('user_profiles')
                        .select('ghl_location_id')
                        .eq('id', userId)
                        .single();

                    if (profile2 && profile2.ghl_location_id) {
                        locationId = profile2.ghl_location_id;
                        console.log('[Deploy] Found Location ID in user_profiles:', locationId);
                    }
                }
            }
        }

        if (!locationId) {
            return NextResponse.json({
                error: 'Unable to create GHL sub-account. Please complete your profile first.',
                needsSetup: true
            }, { status: 400 });
        }

        // 2. Get Access Token for the location
        console.log('[Deploy] Getting access token for location:', locationId);
        const tokenResult = await getLocationToken(userId, locationId);

        if (!tokenResult.success) {
            console.error('[Deploy] Failed to get location token:', tokenResult.error);
            return NextResponse.json({
                error: tokenResult.error || 'Failed to authenticate with GHL. Please reconnect your account.',
                needsReauth: true
            }, { status: 401 });
        }

        const accessToken = tokenResult.access_token;

        // 3. Use pushVaultToGHL which generates CORRECT newSchema keys
        // This uses promptEngine + inferenceEngine + newSchema.js for proper key mapping
        console.log(`[Deploy] Starting vault push for Funnel ${funnelId} to Location ${locationId}`);

        const pushResult = await pushVaultToGHL({
            userId,
            funnelId,
            locationId,
            accessToken,
            updateOnly: false,  // Allow creating new values if they don't exist
            skipAI: true,       // FAST DEPLOY: Skip AI generation, use direct mappings only
            onProgress: (progress) => {
                console.log(`[Deploy] Progress: ${progress.step} - ${progress.message}`);
            }
        });

        if (!pushResult.success) {
            console.error('[Deploy] pushVaultToGHL failed:', pushResult.error);
            return NextResponse.json({
                error: pushResult.error || 'Failed to push vault content to GHL'
            }, { status: 500 });
        }

        console.log(`[Deploy] Successfully pushed vault content:`, pushResult.summary);

        // 4. Log the deployment
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'push_vault_to_ghl',
            status: 'success',
            response_data: {
                funnel_id: funnelId,
                location_id: locationId,
                ...pushResult.summary
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Deployment completed',
            ...pushResult.summary
        });

    } catch (error) {
        console.error('[Deploy] API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
