import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { pushVaultToGHL, pushSectionsToGHL } from '@/lib/ghl/pushSystem';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * Resolve a location-scoped GHL access token for any location.
 * Mirrors the pattern in deploy-workflow/route.js:
 *   1. Get the global agency token (user_type='Company') from ghl_tokens
 *   2. Exchange it for a location token via GHL's /oauth/locationToken
 * Retries once with a refreshed agency token if the first attempt fails.
 */
async function resolveLocationToken(locationId) {
    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('id, access_token, refresh_token, expires_at, company_id')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!tokenData?.access_token || !tokenData?.company_id) {
        return { success: false, error: 'No agency token found in ghl_tokens' };
    }

    let agencyToken = tokenData.access_token;

    // Refresh agency token if expired or about to expire within 5 min
    if (new Date(tokenData.expires_at) <= new Date(Date.now() + 5 * 60 * 1000)) {
        try {
            const refreshResp = await fetch('https://services.leadconnectorhq.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GHL_CLIENT_ID,
                    client_secret: process.env.GHL_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: tokenData.refresh_token,
                    user_type: 'Company',
                }).toString(),
            });
            if (refreshResp.ok) {
                const refreshed = await refreshResp.json();
                agencyToken = refreshed.access_token;
                const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
                await supabaseAdmin
                    .from('ghl_tokens')
                    .update({ access_token: agencyToken, refresh_token: refreshed.refresh_token, expires_at: expiresAt, updated_at: new Date().toISOString() })
                    .eq('id', tokenData.id);
            }
        } catch (e) {
            console.warn('[AdminGHLPush] Agency token refresh failed:', e.message);
        }
    }

    // Exchange agency token for location-scoped token
    const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${agencyToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
        },
        body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        return { success: false, error: `GHL locationToken ${resp.status}: ${txt.substring(0, 200)}` };
    }

    const data = await resp.json();
    return { success: true, access_token: data.access_token };
}

/**
 * POST /api/admin/funnels/:funnelId/push-to-ghl
 *
 * Push vault content to GHL on behalf of a user without requiring
 * the user to be logged in. Credentials are resolved from:
 *   - ghl_subaccounts  → location_id
 *   - ghl_tokens       → agency token → location access token
 *
 * Body:
 *   sectionIds?: string[]   — push only these sections (no AI, fast)
 *                             omit to push the full funnel (skipAI=true)
 */
export async function POST(req, { params }) {
    try {
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { funnelId } = params;
        const body = await req.json().catch(() => ({}));
        const { sectionIds } = body;

        // 1. Get funnel + owner
        const { data: funnel, error: funnelError } = await supabase
            .from('user_funnels')
            .select('id, user_id, funnel_name')
            .eq('id', funnelId)
            .single();

        if (funnelError || !funnel) {
            return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
        }

        // 2. Resolve location_id from ghl_subaccounts (source of truth for GHL mapping)
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id, agency_id')
            .eq('user_id', funnel.user_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!subaccount?.location_id) {
            // Fallback: check user_profiles.ghl_location_id
            const { data: profile } = await supabaseAdmin
                .from('user_profiles')
                .select('ghl_location_id')
                .eq('id', funnel.user_id)
                .maybeSingle();

            if (!profile?.ghl_location_id) {
                return NextResponse.json(
                    {
                        error: 'User has no GHL sub-account mapped. They need to complete GHL setup first.',
                        code: 'NO_SUBACCOUNT',
                    },
                    { status: 400 }
                );
            }
            subaccount.location_id = profile.ghl_location_id;
        }

        const locationId = subaccount.location_id;

        // 3. Get a valid location-scoped access token
        const tokenResult = await resolveLocationToken(locationId);
        if (!tokenResult.success) {
            return NextResponse.json(
                { error: `Could not obtain GHL access token: ${tokenResult.error}`, code: 'TOKEN_ERROR' },
                { status: 400 }
            );
        }

        const accessToken = tokenResult.access_token;

        // 4. Push
        let pushResult;

        if (Array.isArray(sectionIds) && sectionIds.length > 0) {
            pushResult = await pushSectionsToGHL({
                userId: funnel.user_id,
                funnelId,
                locationId,
                accessToken,
                sectionIds,
                onProgress: p => console.log(`[AdminGHLPush] ${p.message}`),
            });
        } else {
            pushResult = await pushVaultToGHL({
                userId: funnel.user_id,
                funnelId,
                locationId,
                accessToken,
                skipAI: true,
                onProgress: p => console.log(`[AdminGHLPush] ${p.message}`),
            });
        }

        const isPartial = Array.isArray(sectionIds) && sectionIds.length > 0;
        const message = pushResult.cached
            ? 'Content unchanged — no update needed'
            : isPartial
                ? `Pushed ${sectionIds.join(', ')} to GHL`
                : 'Full funnel pushed to GHL';

        return NextResponse.json({
            success: true,
            message,
            cached: pushResult.cached || false,
            summary: pushResult.summary,
            details: pushResult.details,
            funnelName: funnel.funnel_name,
            locationId,
        });

    } catch (error) {
        console.error('[AdminGHLPush] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
