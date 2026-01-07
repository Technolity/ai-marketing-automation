import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { pushVaultToGHL } from '@/lib/ghl/pushSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ghl/deploy-funnel
 * Deploy complete vault content to GoHighLevel location
 * Uses pushVaultToGHL with caching for optimal performance
 * 
 * Body:
 * {
 *   funnel_id: string (required)
 *   location_id?: string (auto-fetched if not provided)
 *   access_token?: string (auto-fetched if not provided)
 * }
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        let { funnel_id, location_id, access_token } = body;

        if (!funnel_id) {
            return NextResponse.json({
                error: 'Missing required field: funnel_id'
            }, { status: 400 });
        }

        // === AUTO-FETCH CREDENTIALS IF NOT PROVIDED ===
        if (!location_id || !access_token) {
            console.log('[GHL Deploy] Fetching saved credentials...');

            const { data: credentials, error: credError } = await supabaseAdmin
                .from('ghl_credentials')
                .select('location_id, access_token')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (credError || !credentials) {
                return NextResponse.json({
                    error: 'No GHL credentials found. Please connect your GHL account first.',
                    code: 'NO_CREDENTIALS'
                }, { status: 400 });
            }

            location_id = location_id || credentials.location_id;
            access_token = access_token || credentials.access_token;

            console.log('[GHL Deploy] Using saved credentials for location:', location_id);
        }

        // Verify funnel exists (for logging purposes)
        console.log('[GHL Deploy] Looking for funnel:', funnel_id);

        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id, funnel_name')
            .eq('id', funnel_id)
            .single();

        if (funnelError) {
            console.log('[GHL Deploy] Funnel query error:', funnelError?.message);
            // Continue anyway - funnel might not exist in user_funnels but vault_content might
        }

        const funnelName = funnel?.funnel_name || 'Unknown Funnel';
        console.log('[GHL Deploy] Starting deployment for:', funnelName);

        // Use pushVaultToGHL with caching
        const pushResult = await pushVaultToGHL({
            userId,
            funnelId: funnel_id,
            locationId: location_id,
            accessToken: access_token,
            onProgress: (progress) => {
                console.log('[GHL Deploy]', progress.message);
            }
        });

        // Save deployment record
        await supabaseAdmin
            .from('ghl_deployments')
            .insert({
                funnel_id,
                user_id: userId,
                location_id,
                custom_values_count: pushResult.summary?.total || 0,
                deployment_status: pushResult.cached ? 'cached' : 'success',
                deployed_at: new Date().toISOString(),
                metadata: {
                    operationId: pushResult.operationId,
                    cached: pushResult.cached || false,
                    created: pushResult.summary?.created || 0,
                    updated: pushResult.summary?.updated || 0,
                    skipped: pushResult.summary?.skipped || 0
                }
            });

        // Update funnel
        await supabaseAdmin
            .from('user_funnels')
            .update({
                ghl_deployed: true,
                ghl_location_id: location_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', funnel_id);

        // Update last_used_at on credentials
        await supabaseAdmin
            .from('ghl_credentials')
            .update({ last_used_at: new Date().toISOString() })
            .eq('user_id', userId);

        return NextResponse.json({
            success: true,
            message: pushResult.cached
                ? 'Content unchanged - using cached deployment'
                : 'Successfully deployed to GoHighLevel',
            cached: pushResult.cached || false,
            valuesDeployed: pushResult.summary?.total || 0,
            summary: pushResult.summary,
            funnelName: funnel.funnel_name,
            operationId: pushResult.operationId
        });

    } catch (error) {
        console.error('[GHL Deploy] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
