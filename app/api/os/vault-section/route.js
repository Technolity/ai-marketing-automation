import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * PATCH /api/os/vault-section
 * Update a specific vault section's content
 * Used by AI Feedback Chat to persist refined content
 */
export async function PATCH(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sectionId, content, funnelId } = body;

        console.log(`[VaultSection] Updating section: ${sectionId} for user: ${userId}`);

        if (!sectionId || !content) {
            return NextResponse.json({
                error: 'Missing required fields: sectionId and content'
            }, { status: 400 });
        }

        // Find the target funnel (use provided ID or get active funnel)
        let targetFunnelId = funnelId;

        if (!targetFunnelId) {
            const { data: activeFunnel } = await supabaseAdmin
                .from('user_funnels')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .eq('is_deleted', false)
                .single();

            if (activeFunnel) {
                targetFunnelId = activeFunnel.id;
            } else {
                // Fallback: get latest funnel
                const { data: latestFunnel } = await supabaseAdmin
                    .from('user_funnels')
                    .select('id')
                    .eq('user_id', userId)
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
            return NextResponse.json({
                error: 'No funnel found for user'
            }, { status: 404 });
        }

        // Update the vault_content table
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('vault_content')
            .select('id, content, version')
            .eq('funnel_id', targetFunnelId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[VaultSection] Fetch error:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 });
        }

        if (existing) {
            // Update existing record
            const { error: updateError } = await supabaseAdmin
                .from('vault_content')
                .update({
                    content: content,
                    updated_at: new Date().toISOString(),
                    version: (existing.version || 1) + 1
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[VaultSection] Update error:', updateError);
                return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
            }

            console.log(`[VaultSection] Updated section ${sectionId} in funnel ${targetFunnelId}`);
        } else {
            // Insert new record (shouldn't happen often, but handle gracefully)
            const { error: insertError } = await supabaseAdmin
                .from('vault_content')
                .insert({
                    funnel_id: targetFunnelId,
                    user_id: userId,
                    section_id: sectionId,
                    section_title: sectionId,
                    content: content,
                    phase: 1,
                    status: 'generated',
                    is_current_version: true
                });

            if (insertError) {
                console.error('[VaultSection] Insert error:', insertError);
                return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
            }

            console.log(`[VaultSection] Created section ${sectionId} in funnel ${targetFunnelId}`);
        }

        return NextResponse.json({
            success: true,
            sectionId,
            funnelId: targetFunnelId
        });

    } catch (error) {
        console.error('[VaultSection] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
