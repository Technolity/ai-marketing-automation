/**
 * GHL Deploy Workflow - Refactored
 * Now uses pushVaultToGHL directly instead of internal fetch calls
 * This eliminates the HTML 404 errors from internal API calls
 * 
 * Flow:
 * 1. Verify user has GHL sub-account
 * 2. Get OAuth access token
 * 3. Call pushVaultToGHL directly with all vault content
 * 4. Log deployment and return results
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { pushVaultToGHL } from '@/lib/ghl/pushSystem';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Increase timeout to 120 seconds for full push

/**
 * Get location access token for GHL API calls (OAuth)
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

    // Check for HTML response (GHL error page)
    const contentType = locationTokenResponse.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        const htmlBody = await locationTokenResponse.text();
        console.error('[Deploy] getLocationToken: GHL returned HTML:', htmlBody.substring(0, 200));
        return { success: false, error: 'GHL OAuth returned HTML - token may be invalid or expired' };
    }

    if (!locationTokenResponse.ok) {
        const responseText = await locationTokenResponse.text();
        if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
            console.error('[Deploy] getLocationToken: HTML error:', responseText.substring(0, 200));
            return { success: false, error: 'GHL OAuth returned HTML error page' };
        }
        try {
            const errorData = JSON.parse(responseText);
            return { success: false, error: errorData.message || 'Failed to generate location token' };
        } catch {
            return { success: false, error: `Failed to generate location token: ${responseText.substring(0, 100)}` };
        }
    }

    const responseText = await locationTokenResponse.text();
    if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
        console.error('[Deploy] getLocationToken: Unexpected HTML response:', responseText.substring(0, 200));
        return { success: false, error: 'GHL returned HTML - re-authorization may be required' };
    }

    const locationTokenData = JSON.parse(responseText);

    if (!locationTokenData.access_token) {
        return { success: false, error: 'Location token response missing access_token' };
    }

    return {
        success: true,
        access_token: locationTokenData.access_token,
        location_id: locationId || subaccount.location_id
    };
}

export async function POST(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const funnelId = body.funnelId || body.funnel_id || body.sessionId || body.session_id;

        if (!funnelId) {
            return NextResponse.json({ error: 'funnelId is required' }, { status: 400 });
        }

        console.log(`[Deploy] Starting deployment for funnel ${funnelId}, user ${userId}`);

        // 1. Verify user has GHL sub-account
        const { data: subaccount, error: subError } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount?.location_id) {
            console.error('[Deploy] No sub-account found:', subError);
            return NextResponse.json({
                error: 'GHL sub-account not found. Please complete onboarding first.',
                needsSetup: true
            }, { status: 400 });
        }

        const locationId = subaccount.location_id;
        console.log(`[Deploy] Using location: ${locationId}`);

        // 2. Get OAuth access token
        const tokenResult = await getLocationToken(userId, locationId);
        if (!tokenResult.success) {
            console.error('[Deploy] Token error:', tokenResult.error);
            return NextResponse.json({
                error: tokenResult.error,
                needsReauth: true
            }, { status: 401 });
        }

        console.log('[Deploy] Got OAuth token, calling pushVaultToGHL directly...');

        // 3. Call pushVaultToGHL directly (no more internal fetch calls!)
        const pushResult = await pushVaultToGHL({
            userId,
            funnelId,
            locationId,
            accessToken: tokenResult.access_token,
            updateOnly: true, // Only update existing values, don't create new ones
            skipAI: false, // Use AI polishing for values
            onProgress: (progress) => {
                console.log(`[Deploy] Progress: ${progress.step} - ${progress.message}`);
            }
        });

        const duration = Math.round((Date.now() - startTime) / 1000);

        const totalUpdated = pushResult.updated?.length || 0;
        const totalCreated = pushResult.created?.length || 0;
        const totalFailed = pushResult.failed?.length || 0;
        const totalPushed = totalUpdated + totalCreated;

        console.log(`[Deploy] Completed in ${duration}s - Updated: ${totalUpdated}, Created: ${totalCreated}, Failed: ${totalFailed}`);

        // 4. Log deployment
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: userId,
            event_type: 'deploy_completed',
            location_id: locationId,
            metadata: {
                funnel_id: funnelId,
                total_pushed: totalPushed,
                total_updated: totalUpdated,
                total_created: totalCreated,
                total_failed: totalFailed,
                duration_seconds: duration,
                success: totalFailed === 0,
                operation_id: pushResult.operationId
            }
        });

        // 5. Update funnel deployment status
        await supabaseAdmin
            .from('user_funnels')
            .update({
                deployed_at: new Date().toISOString(),
                deployment_status: totalFailed === 0 ? 'deployed' : 'partial'
            })
            .eq('id', funnelId);

        return NextResponse.json({
            success: totalFailed === 0,
            message: totalFailed === 0
                ? `Successfully deployed ${totalPushed} values to GHL!`
                : `Deployment completed with ${totalFailed} errors`,
            summary: {
                total: totalPushed,
                updated: totalUpdated,
                created: totalCreated,
                failed: totalFailed,
                skipped: pushResult.skipped || 0,
                duration: `${duration}s`
            },
            operationId: pushResult.operationId,
            updatedValues: pushResult.updated?.slice(0, 10), // First 10 for debugging
            failedValues: pushResult.failed,
            locationId
        });

    } catch (error) {
        console.error('[Deploy] Fatal error:', error);
        return NextResponse.json({
            error: error.message || 'Deployment failed',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
