import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { mapSessionToCustomValues } from '@/lib/ghl/customValueMapper';
import { updateCustomValues, createGHLSubAccount, importSnapshotToSubAccount } from '@/lib/integrations/ghl';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/ghl/deploy-workflow
 * Deploy content to GHL via OAuth (no more Pabbly)
 * Auto-creates sub-account for existing users who don't have one
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

        // 2. Fetch Data for Mapping
        const [contentResult, sessionResult, imagesResult] = await Promise.all([
            supabaseAdmin
                .from('vault_content')
                .select('section_id, content')
                .eq('funnel_id', funnelId)
                .eq('is_current_version', true),

            supabaseAdmin
                .from('saved_sessions')
                .select('answers, business_name')
                .eq('id', funnelId)
                .single(),

            supabaseAdmin
                .from('generated_images')
                .select('*')
                .eq('session_id', funnelId)
                .eq('status', 'completed')
        ]);

        if (contentResult.error) {
            console.error('[Deploy] Content fetch error:', contentResult.error);
            return NextResponse.json({ error: 'Failed to fetch vault content' }, { status: 500 });
        }

        // 3. Reconstruct Session Data for Mapper
        const vaultContent = contentResult.data || [];
        const session = sessionResult.data || {};
        const images = imagesResult.data || [];

        const resultsData = {};
        vaultContent.forEach(item => {
            const sectionKey = String(item.section_id);
            resultsData[sectionKey] = { data: item.content };
        });

        const sessionData = {
            results_data: resultsData,
            answers: session.answers || {},
            business_name: session.business_name
        };

        // 4. Map to GHL Custom Values
        console.log(`[Deploy] Mapping content for Funnel ${funnelId} to Location ${locationId}`);
        const mappedValues = mapSessionToCustomValues(sessionData, images);
        console.log(`[Deploy] Mapped ${Object.keys(mappedValues).length} custom values`);

        // 5. Update Custom Values via GHL OAuth API
        console.log(`[Deploy] Pushing custom values to GHL via OAuth...`);

        const result = await updateCustomValues(userId, mappedValues);

        if (!result.success) {
            console.error('[Deploy] GHL update failed:', result.error);
            return NextResponse.json({
                error: result.error || 'Failed to update custom values'
            }, { status: 500 });
        }

        console.log(`[Deploy] Successfully updated ${result.updated} custom values`);

        // 6. Log the deployment
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'update_custom_values',
            status: 'success',
            response_data: {
                funnel_id: funnelId,
                location_id: locationId,
                values_updated: result.updated,
                values_failed: result.failed
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Deployment completed',
            updated: result.updated,
            failed: result.failed || 0
        });

    } catch (error) {
        console.error('[Deploy] API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
