import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { mapSessionToCustomValues } from '@/lib/ghl/customValueMapper';
import { updateCustomValues } from '@/lib/integrations/ghl';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/ghl/deploy-workflow
 * Deploy content to GHL via OAuth (no more Pabbly)
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

        // 1. Get User's GHL Location ID from ghl_subaccounts (OAuth created)
        let locationId = null;

        // Try ghl_subaccounts first (OAuth created)
        const { data: subaccount, error: subError } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id, location_name')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (subaccount && subaccount.location_id) {
            locationId = subaccount.location_id;
            console.log('[Deploy] Found Location ID in ghl_subaccounts:', locationId);
        } else {
            // Fallback to legacy ghl_subaccount_logs
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
                // Final fallback to user_profiles
                const { data: profile } = await supabaseAdmin
                    .from('user_profiles')
                    .select('ghl_location_id')
                    .eq('id', userId)
                    .single();

                if (profile && profile.ghl_location_id) {
                    locationId = profile.ghl_location_id;
                }
            }
        }

        if (!locationId) {
            return NextResponse.json({
                error: 'No GHL Location ID found. Please ensure your account setup is complete.'
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
