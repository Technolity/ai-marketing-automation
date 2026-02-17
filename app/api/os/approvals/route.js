import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/os/approvals
 * Fetch approved sections from vault_content and phase status from user_funnels
 * Team members will see their owner's approvals
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[Approvals API] Fetching approvals for target user ${targetUserId} (Auth: ${userId})`);

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
        let approvedSections = [];
        try {
            const { data, error: vaultError } = await supabaseAdmin
                .from('vault_content')
                .select('section_id, phase')
                .eq('funnel_id', funnelId)
                .eq('user_id', targetUserId)
                .eq('status', 'approved')
                .eq('is_current_version', true);

            if (vaultError) {
                console.error('[Approvals API] Error fetching vault_content:', vaultError);
                // Handle table/column not found errors
                if (vaultError.code === 'PGRST205' ||
                    vaultError.code === '42703' ||
                    vaultError.code === '42P01' ||
                    vaultError.message?.includes('does not exist') ||
                    vaultError.message?.includes('column')) {
                    // Try without is_current_version filter
                    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
                        .from('vault_content')
                        .select('section_id, phase')
                        .eq('funnel_id', funnelId)
                        .eq('user_id', targetUserId)
                        .eq('status', 'approved');

                    if (!fallbackError) {
                        approvedSections = fallbackData || [];
                    } else {
                        console.error('[Approvals API] Fallback also failed:', fallbackError);
                        return NextResponse.json({ businessCoreApprovals: [], funnelAssetsApprovals: [], funnelApproved: false });
                    }
                } else {
                    return NextResponse.json({ error: 'Database error' }, { status: 500 });
                }
            } else {
                approvedSections = data || [];
            }
        } catch (queryError) {
            console.error('[Approvals API] Query exception:', queryError);
            return NextResponse.json({ businessCoreApprovals: [], funnelAssetsApprovals: [], funnelApproved: false });
        }

        // Fetch funnel status from user_funnels
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('phase1_approved, phase2_unlocked')
            .eq('id', funnelId)
            .eq('user_id', targetUserId)
            .single();

        if (funnelError && funnelError.code !== 'PGRST116') {
            console.error('[Approvals API] Error fetching funnel:', funnelError);
        }

        // Define phases by section ID (source of truth)
        const PHASE_1_SECTION_IDS = ['idealClient', 'message', 'story', 'offer'];
        const PHASE_2_SECTION_IDS = ['leadMagnet', 'vsl', 'bio', 'facebookAds', 'emails', 'sms', 'appointmentReminders', 'media', 'funnelCopy', 'colors'];
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
 * Team members can approve their owner's content
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[Approvals API] Saving approvals for target user ${targetUserId} (Auth: ${userId})`);

        const body = await req.json();
        const { sessionId: funnelId, businessCoreApprovals, funnelAssetsApprovals, scriptsApprovals, funnelApproved, resetSections } = body;

        if (!funnelId) {
            return NextResponse.json({ error: 'Missing funnel ID' }, { status: 400 });
        }

        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnelId)
            .eq('user_id', targetUserId)
            .single();

        if (funnelError || !funnel) {
            return NextResponse.json({ error: 'Funnel not found or unauthorized' }, { status: 404 });
        }

        // SMART REGENERATION: If resetSections is provided, only reset those specific sections
        // This preserves approvals for sections that didn't change during regeneration
        if (resetSections && Array.isArray(resetSections) && resetSections.length > 0) {
            console.log(`[Approvals API] Smart regen: Resetting ${resetSections.length} sections:`, resetSections);

            const { error: resetError } = await supabaseAdmin
                .from('vault_content')
                .update({ status: 'generated' })
                .eq('funnel_id', funnelId)
                .eq('user_id', targetUserId)
                .eq('is_current_version', true)
                .in('section_id', resetSections);

            if (resetError) {
                console.error('[Approvals API] Error resetting sections:', resetError);
                return NextResponse.json({ error: 'Failed to reset sections' }, { status: 500 });
            }

            console.log('[Approvals API] ✅ Successfully reset approvals for changed sections only');
            return NextResponse.json({ success: true, resetCount: resetSections.length });
        }

        console.log(`[Approvals API] Saving approvals for funnel ${funnelId}`);

        // Update status in vault_content for specified sections
        // SECURITY FIX: Added is_current_version filter to only update current versions
        const allApproved = [...(businessCoreApprovals || []), ...(funnelAssetsApprovals || []), ...(scriptsApprovals || [])];

        // Ensure approved sections have a vault_content row (needed for manual sections like media)
        if (allApproved.length > 0) {
            const { data: existingRows } = await supabaseAdmin
                .from('vault_content')
                .select('section_id')
                .eq('funnel_id', funnelId)
                .eq('user_id', targetUserId)
                .eq('is_current_version', true)
                .in('section_id', allApproved);

            const existingSet = new Set((existingRows || []).map(r => r.section_id));
            const missingSections = allApproved.filter(id => !existingSet.has(id));

            if (missingSections.length > 0) {
                const rowsToInsert = missingSections.map(section_id => ({
                    funnel_id: funnelId,
                    user_id: targetUserId,
                    section_id,
                    section_title: section_id,
                    content: {},
                    status: 'approved',
                    is_current_version: true,
                    version: 1
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('vault_content')
                    .insert(rowsToInsert);

                if (insertError) {
                    console.error('[Approvals API] Error inserting missing approved sections:', insertError);
                }
            }
        }

        // Define all possible sections
        const PHASE_1_SECTION_IDS = ['idealClient', 'message', 'story', 'offer'];
        const PHASE_2_SECTION_IDS = ['leadMagnet', 'vsl', 'bio', 'facebookAds', 'emails', 'sms', 'appointmentReminders', 'media', 'funnelCopy', 'colors'];
        const PHASE_3_SECTION_IDS = ['setterScript', 'salesScripts'];
        const allSections = [...PHASE_1_SECTION_IDS, ...PHASE_2_SECTION_IDS, ...PHASE_3_SECTION_IDS];

        // RACE CONDITION FIX: Fetch sections currently in 'generating' status.
        // These are being actively regenerated by regenerate-dependent and MUST NOT
        // be overwritten back to 'approved' or 'generated' by a concurrent saveApprovals call.
        let generatingSet = new Set();
        try {
            const { data: generatingSections } = await supabaseAdmin
                .from('vault_content')
                .select('section_id')
                .eq('funnel_id', funnelId)
                .eq('user_id', targetUserId)
                .eq('is_current_version', true)
                .eq('status', 'generating');

            generatingSet = new Set((generatingSections || []).map(s => s.section_id));
            if (generatingSet.size > 0) {
                console.log(`[Approvals API] ⚠️ Protecting ${generatingSet.size} generating sections:`, [...generatingSet]);
            }
        } catch (genErr) {
            console.error('[Approvals API] Error checking generating sections:', genErr);
        }

        // Filter out generating sections — never overwrite their status
        const safeApproved = allApproved.filter(s => !generatingSet.has(s));
        const unapprovedSections = allSections.filter(s => !allApproved.includes(s) && !generatingSet.has(s));

        // Set approved sections to 'approved' (excluding generating ones)
        if (safeApproved.length > 0) {
            const { error: vaultError } = await supabaseAdmin
                .from('vault_content')
                .update({ status: 'approved' })
                .eq('funnel_id', funnelId)
                .eq('user_id', targetUserId)
                .eq('is_current_version', true)
                .in('section_id', safeApproved);

            if (vaultError) {
                console.error('[Approvals API] Error updating approved vault status:', vaultError);
            }
        }

        // Set unapproved sections to 'generated' (excluding generating ones)
        if (unapprovedSections.length > 0) {
            const { error: pendingError } = await supabaseAdmin
                .from('vault_content')
                .update({ status: 'generated' })
                .eq('funnel_id', funnelId)
                .eq('user_id', targetUserId)
                .eq('is_current_version', true)
                .in('section_id', unapprovedSections);

            if (pendingError) {
                console.error('[Approvals API] Error updating pending vault status:', pendingError);
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
                .eq('user_id', targetUserId);

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
