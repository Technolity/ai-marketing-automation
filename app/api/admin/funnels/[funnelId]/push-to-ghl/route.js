import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { pushVaultToGHL, pushSectionsToGHL } from '@/lib/ghl/pushSystem';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * POST /api/admin/funnels/:funnelId/push-to-ghl
 *
 * Push vault content to GHL on behalf of a user without requiring
 * the user to be logged in.
 *
 * Body (all optional):
 *   sectionIds?: string[]   — if provided, only push those sections (fast, no AI)
 *                             if omitted, push the full funnel (skipAI=true)
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

        // Get funnel + owner
        const { data: funnel, error: funnelError } = await supabase
            .from('user_funnels')
            .select('id, user_id, funnel_name')
            .eq('id', funnelId)
            .single();

        if (funnelError || !funnel) {
            return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
        }

        // Get owner's active GHL credentials
        const { data: credentials, error: credError } = await supabaseAdmin
            .from('ghl_credentials')
            .select('location_id, access_token')
            .eq('user_id', funnel.user_id)
            .eq('is_active', true)
            .maybeSingle();

        if (credError || !credentials) {
            return NextResponse.json(
                {
                    error: 'User has no active GHL credentials. They must connect their GHL account first.',
                    code: 'NO_CREDENTIALS',
                },
                { status: 400 }
            );
        }

        const { location_id: locationId, access_token: accessToken } = credentials;

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

        // Bump last_used_at on credentials
        await supabaseAdmin
            .from('ghl_credentials')
            .update({ last_used_at: new Date().toISOString() })
            .eq('user_id', funnel.user_id)
            .eq('is_active', true);

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
        });

    } catch (error) {
        console.error('[AdminGHLPush] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
