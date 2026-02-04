import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';


export const dynamic = 'force-dynamic';

/**
 * GET /api/os/results
 * Fetch generated vault content for a user's funnel
 * 
 * Query params:
 * - funnel_id: (optional) specific funnel to get results for
 * 
 * Schema: vault_content table stores content per section with versioning
 * This API aggregates all current versions into a single object
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        // Support both funnel_id and session_id for backwards compatibility
        const funnelId = searchParams.get('funnel_id') || searchParams.get('session_id');
        const requestedWorkspaceId = searchParams.get('workspace_id');

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId, requestedWorkspaceId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[Results API] Fetching results for target user ${targetUserId} (Auth: ${userId})`);

        let targetFunnelId = funnelId;

        // If no funnel_id provided, get the TARGET USER'S active funnel
        if (!targetFunnelId) {
            const { data: activeFunnel, error } = await supabaseAdmin
                .from('user_funnels')
                .select('id, funnel_name')
                .eq('user_id', targetUserId)
                .eq('is_active', true)
                .eq('is_deleted', false)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[Results API] Active funnel error:', error);
            }

            if (activeFunnel) {
                targetFunnelId = activeFunnel.id;
            } else {
                // Fallback: get latest funnel
                const { data: latestFunnel } = await supabaseAdmin
                    .from('user_funnels')
                    .select('id, funnel_name')
                    .eq('user_id', targetUserId)
                    .eq('is_deleted', false)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (latestFunnel) {
                    targetFunnelId = latestFunnel.id;
                }
            }
        }

        if (!targetFunnelId) {
            console.log('[Results API] No funnel found for user');
            return NextResponse.json({
                source: null,
                data: {}
            });
        }

        // Fetch funnel details
        const { data: funnel } = await supabaseAdmin
            .from('user_funnels')
            .select('id, funnel_name, vault_generated, phase1_approved, phase2_unlocked, selected_funnel_type, deployed_at')
            .eq('id', targetFunnelId)
            .eq('user_id', targetUserId)
            .single();

        // Fetch all current vault content for this funnel
        const { data: vaultContent, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, section_title, content, phase, status, is_locked')
            .eq('funnel_id', targetFunnelId)
            .eq('user_id', targetUserId)
            .eq('is_current_version', true)
            .order('numeric_key', { ascending: true });

        if (vaultError) {
            console.error('[Results API] Vault content error:', vaultError);
            // If table doesn't exist, return empty
            if (vaultError.code === 'PGRST205') {
                return NextResponse.json({
                    source: funnel ? { type: 'funnel', name: funnel.funnel_name, id: funnel.id } : null,
                    data: {}
                });
            }
            throw vaultError;
        }

        // Fetch populated fields to verify granular data existence
        const { data: populatedFields } = await supabaseAdmin
            .from('vault_content_fields')
            .select('section_id')
            .eq('funnel_id', targetFunnelId)
            .eq('is_current_version', true);

        const populatedSections = new Set(populatedFields?.map(f => f.section_id) || []);

        // Aggregate content by section_id
        // CRITICAL FIX: Include status field for approval persistence
        const aggregatedData = {};
        if (vaultContent && vaultContent.length > 0) {
            for (const item of vaultContent) {
                // Structure data to include status for normalizeData processing
                aggregatedData[item.section_id] = {
                    data: item.content,
                    status: item.status  // Include status for approval persistence
                };

                // Inject _isPopulated flag if granular fields exist
                if (populatedSections.has(item.section_id)) {
                    if (aggregatedData[item.section_id].data && typeof aggregatedData[item.section_id].data === 'object') {
                        aggregatedData[item.section_id].data._isPopulated = true;
                    }
                }
            }
        }

        console.log(`[Results API] Found ${vaultContent?.length || 0} vault sections`);

        return NextResponse.json({
            source: funnel ? {
                type: 'funnel',
                name: funnel.funnel_name,
                id: funnel.id,
                vault_generated: funnel.vault_generated,
                phase1_approved: funnel.phase1_approved,
                phase2_unlocked: funnel.phase2_unlocked,
                selected_funnel_type: funnel.selected_funnel_type,
                has_funnel_choice: !!funnel.selected_funnel_type,
                deployed_at: funnel.deployed_at
            } : null,
            data: aggregatedData
        });

    } catch (error) {
        console.error('[Results API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

