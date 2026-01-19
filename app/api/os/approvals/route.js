import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * GET /api/os/approvals
 * Fetch approved sections from vault_content and phase status from user_funnels
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        // Support both funnel_id (new) and session_id (backwards compatibility)
        const funnelId = searchParams.get('funnel_id') || searchParams.get('session_id');

        // Validate UUID format to prevent database errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!funnelId || !uuidRegex.test(funnelId)) {
            console.log(`[Approvals API] Invalid or missing funnel_id: ${funnelId}`);
            return NextResponse.json({ businessCoreApprovals: [], funnelAssetsApprovals: [], funnelApproved: false });
        }

        // Fetch approved sections from vault_content
        const { data: approvedSections, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, phase')
            .eq('funnel_id', funnelId)
            .eq('user_id', userId)
            .eq('status', 'approved')
            .eq('is_current_version', true);

        if (vaultError) {
            console.error('[Approvals API] Error fetching vault_content:', vaultError);
            // Handle table not found or other errors
            if (vaultError.code === 'PGRST205') {
                return NextResponse.json({ businessCoreApprovals: [], funnelAssetsApprovals: [], funnelApproved: false });
            }
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Fetch funnel status from user_funnels
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('phase1_approved, phase2_unlocked')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (funnelError && funnelError.code !== 'PGRST116') {
            console.error('[Approvals API] Error fetching funnel:', funnelError);
        }

        // Define phases by section ID (source of truth)
        const PHASE_1_SECTION_IDS = ['idealClient', 'message', 'story', 'offer'];
        const PHASE_2_SECTION_IDS = ['leadMagnet', 'vsl', 'bio', 'facebookAds', 'emails', 'sms', 'appointmentReminders', 'media', 'funnelCopy'];
        const PHASE_3_SECTION_IDS = ['setterScript', 'salesScripts'];

        // Filter by section ID, not stored phase value (which may be incorrect)
        const businessCoreApprovals = [...new Set(
            approvedSections
                .filter(s => PHASE_1_SECTION_IDS.includes(s.section_id))
                .map(s => s.section_id)
        )];

        const funnelAssetsApprovals = [...new Set(
            approvedSections
                .filter(s => PHASE_2_SECTION_IDS.includes(s.section_id))
                .map(s => s.section_id)
        )];

        const scriptsApprovals = [...new Set(
            approvedSections
                .filter(s => PHASE_3_SECTION_IDS.includes(s.section_id))
                .map(s => s.section_id)
        )];

        // Calculate phase completion
        const phase1Complete = businessCoreApprovals.length >= PHASE_1_SECTION_IDS.length;
        const phase2Complete = funnelAssetsApprovals.length >= PHASE_2_SECTION_IDS.length;
        const phase3Complete = scriptsApprovals.length >= PHASE_3_SECTION_IDS.length;

        console.log('[Approvals API] Returning:', {
            phase1Count: businessCoreApprovals.length,
            phase2Count: funnelAssetsApprovals.length,
            phase3Count: scriptsApprovals.length,
            rawCount: approvedSections.length,
            phase1: businessCoreApprovals,
            phase2: funnelAssetsApprovals,
            phase3: scriptsApprovals
        });

        return NextResponse.json({
            businessCoreApprovals,
            funnelAssetsApprovals,
            scriptsApprovals,
            phase1Complete,
            phase2Complete,
            phase3Complete,
            funnelApproved: funnel?.phase2_unlocked || false
        });

    } catch (error) {
        console.error('[Approvals API] GET unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/os/approvals
 * Mark sections as approved in vault_content and update funnel status
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId: funnelId, businessCoreApprovals, funnelAssetsApprovals, scriptsApprovals, funnelApproved } = body;

        if (!funnelId) {
            return NextResponse.json({ error: 'Missing funnel ID' }, { status: 400 });
        }

        console.log(`[Approvals API] Saving approvals for funnel ${funnelId}`);

        // Update status in vault_content for specified sections
        // SECURITY FIX: Added is_current_version filter to only update current versions
        const allApproved = [...(businessCoreApprovals || []), ...(funnelAssetsApprovals || []), ...(scriptsApprovals || [])];


        if (allApproved.length > 0) {
            const { error: vaultError } = await supabaseAdmin
                .from('vault_content')
                .update({ status: 'approved' })
                .eq('funnel_id', funnelId)
                .eq('user_id', userId)
                .eq('is_current_version', true)
                .in('section_id', allApproved);

            if (vaultError) {
                console.error('[Approvals API] Error updating vault status:', vaultError);
            }
        }

        // Update phase flags in user_funnels
        const updates = {};

        // Phase 1 has 4 sections, Phase 2 has 10 sections
        // DISABLED AUTO-APPROVAL: We now require manual approval of all sections
        if (businessCoreApprovals && businessCoreApprovals.length >= 100) {
            updates.phase1_approved = true;
        }

        // Explicit funnel approval (phase 2 unlock)
        if (funnelApproved !== undefined) {
            updates.phase2_unlocked = funnelApproved;
            if (funnelApproved) {
                updates.vault_generated = true; // Ensure this is set
            }
        }

        if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date().toISOString();
            const { error: funnelError } = await supabaseAdmin
                .from('user_funnels')
                .update(updates)
                .eq('id', funnelId)
                .eq('user_id', userId);

            if (funnelError) {
                console.error('[Approvals API] Error updating funnel status:', funnelError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Approvals API] POST unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
