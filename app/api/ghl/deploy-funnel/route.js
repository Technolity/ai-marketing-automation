import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapSessionToCustomValues, formatForGHLAPI } from '@/lib/ghl/customValueMapper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ghl/deploy-funnel
 * Deploy complete vault content to GoHighLevel location
 * Maps all vault content and media to 161 custom values
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { funnel_id, location_id, access_token } = body;

        if (!funnel_id || !location_id || !access_token) {
            return NextResponse.json({
                error: 'Missing required fields: funnel_id, location_id, access_token'
            }, { status: 400 });
        }

        console.log('[GHL Deploy] Starting deployment for funnel:', funnel_id);

        // 1. Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id, funnel_name, funnel_type')
            .eq('id', funnel_id)
            .eq('user_id', userId)
            .single();

        if (funnelError || !funnel) {
            return NextResponse.json({ error: 'Funnel not found or unauthorized' }, { status: 404 });
        }

        // 2. Fetch all vault content sections
        const { data: vaultSections, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('*')
            .eq('funnel_id', funnel_id)
            .eq('is_current_version', true)
            .order('section_id', { ascending: true });

        if (vaultError) {
            console.error('[GHL Deploy] Error fetching vault content:', vaultError);
            return NextResponse.json({ error: 'Failed to fetch vault content' }, { status: 500 });
        }

        // 3. Fetch all media fields
        const { data: mediaFields, error: mediaError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('*')
            .eq('funnel_id', funnel_id)
            .eq('section_id', 'media')
            .eq('is_current_version', true);

        if (mediaError) {
            console.error('[GHL Deploy] Error fetching media:', mediaError);
        }

        // 4. Reconstruct session-like object for mapper
        const sessionData = {};
        vaultSections.forEach(section => {
            if (section.content) {
                sessionData[section.section_id] = section.content;
            }
        });

        // 5. Add media to session data
        if (mediaFields && mediaFields.length > 0) {
            sessionData.media = {};
            mediaFields.forEach(field => {
                if (field.field_value) {
                    sessionData.media[field.field_id] = field.field_value;
                }
            });
        }

        console.log('[GHL Deploy] Session data prepared:', Object.keys(sessionData));

        // 6. Map to GHL custom values (161 values)
        const customValuesMap = await mapSessionToCustomValues(sessionData, funnel_id);

        // 7. Format for GHL API
        const formattedValues = formatForGHLAPI(customValuesMap);

        console.log('[GHL Deploy] Mapped custom values:', Object.keys(formattedValues).length);

        // 8. Push to GHL
        const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${location_id}/customValues`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
            },
            body: JSON.stringify(formattedValues)
        });

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[GHL Deploy] GHL API error:', errorText);
            return NextResponse.json({
                error: 'Failed to push to GHL',
                details: errorText
            }, { status: ghlResponse.status });
        }

        const ghlResult = await ghlResponse.json();
        console.log('[GHL Deploy] Successfully pushed to GHL');

        // 9. Save deployment record
        const { error: deployError } = await supabaseAdmin
            .from('ghl_deployments')
            .insert({
                funnel_id,
                user_id: userId,
                location_id,
                custom_values_count: Object.keys(formattedValues).length,
                deployment_status: 'success',
                deployed_at: new Date().toISOString()
            });

        if (deployError) {
            console.error('[GHL Deploy] Error saving deployment record:', deployError);
            // Don't fail the request, just log it
        }

        // 10. Update funnel to mark as deployed
        await supabaseAdmin
            .from('user_funnels')
            .update({
                ghl_deployed: true,
                ghl_location_id: location_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', funnel_id);

        return NextResponse.json({
            success: true,
            message: 'Successfully deployed to GoHighLevel',
            valuesDeployed: Object.keys(formattedValues).length,
            funnelName: funnel.funnel_name
        });

    } catch (error) {
        console.error('[GHL Deploy] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
