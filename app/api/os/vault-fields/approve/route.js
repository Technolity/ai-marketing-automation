import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getSyncTargets, getNestedValue, applySyncToTarget } from '@/lib/vault/fieldSync';


export const dynamic = 'force-dynamic';

/**
 * POST /api/os/vault-fields/approve
 * Mark all fields in a section as approved
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { funnel_id, section_id } = await req.json();

        if (!funnel_id || !section_id) {
            return NextResponse.json({ error: 'Missing funnel_id or section_id' }, { status: 400 });
        }

        console.log(`[Approve Fields] Approving section ${section_id} for funnel ${funnel_id}`);

        // Mark all fields in this section as approved (current version only)
        const { error: updateError } = await supabaseAdmin
            .from('vault_content_fields')
            .update({ is_approved: true })
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('user_id', userId)
            .eq('is_current_version', true);

        if (updateError) {
            console.error('[Approve Fields] Update error:', updateError);
            return NextResponse.json({ error: 'Failed to approve fields' }, { status: 500 });
        }

        // Also mark the section as approved in vault_content (current version only)
        const { error: sectionError } = await supabaseAdmin
            .from('vault_content')
            .update({ status: 'approved' })
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('user_id', userId)
            .eq('is_current_version', true);

        // Ignore error if vault_content doesn't have this section yet
        if (sectionError) {
            console.log('[Approve Fields] vault_content update skipped:', sectionError.message);
        }

        console.log(`[Approve Fields] Successfully approved ${section_id}`);

        // FEATURE: Auto-sync fields to dependent sections
        // When Lead Magnet Free Gift is approved, sync to Facebook Ads
        const syncResults = [];

        if (section_id === 'leadMagnet') {
            try {
                console.log('[Approve Fields] Checking for field sync targets...');

                // Fetch the approved lead magnet content
                const { data: leadMagnetContent, error: fetchError } = await supabaseAdmin
                    .from('vault_content')
                    .select('content')
                    .eq('funnel_id', funnel_id)
                    .eq('section_id', 'leadMagnet')
                    .eq('user_id', userId)
                    .eq('is_current_version', true)
                    .single();

                if (!fetchError && leadMagnetContent) {
                    const freeGiftTitle = getNestedValue(leadMagnetContent.content, 'freeGift.title');

                    if (freeGiftTitle) {
                        console.log(`[Approve Fields] Found Free Gift title: "${freeGiftTitle}"`);

                        // Get sync targets for freeGift.title
                        const syncTargets = getSyncTargets('leadMagnet', 'freeGift.title');

                        for (const target of syncTargets) {
                            console.log(`[Approve Fields] Syncing to ${target.targetSection}.${target.targetField}`);

                            // Fetch target section content
                            const { data: targetData, error: targetFetchError } = await supabaseAdmin
                                .from('vault_content')
                                .select('content')
                                .eq('funnel_id', funnel_id)
                                .eq('section_id', target.targetSection)
                                .eq('user_id', userId)
                                .eq('is_current_version', true)
                                .single();

                            if (!targetFetchError && targetData) {
                                // Apply sync transformation
                                const updatedContent = applySyncToTarget(
                                    'leadMagnet',
                                    'freeGift.title',
                                    freeGiftTitle,
                                    targetData.content
                                );

                                // Update target section
                                const { error: syncUpdateError } = await supabaseAdmin
                                    .from('vault_content')
                                    .update({ content: updatedContent })
                                    .eq('funnel_id', funnel_id)
                                    .eq('section_id', target.targetSection)
                                    .eq('user_id', userId)
                                    .eq('is_current_version', true);

                                if (syncUpdateError) {
                                    console.error(`[Approve Fields] Sync update failed for ${target.targetSection}:`, syncUpdateError);
                                    syncResults.push({
                                        target: target.targetSection,
                                        success: false,
                                        error: syncUpdateError.message
                                    });
                                } else {
                                    console.log(`[Approve Fields] Successfully synced to ${target.targetSection}`);
                                    syncResults.push({
                                        target: target.targetSection,
                                        success: true,
                                        field: target.targetField,
                                        value: freeGiftTitle
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (syncError) {
                console.error('[Approve Fields] Sync error:', syncError);
                // Non-blocking - approval still succeeds even if sync fails
            }
        }

        return NextResponse.json({
            success: true,
            section_id,
            approved: true,
            syncApplied: syncResults.length > 0,
            syncResults: syncResults.length > 0 ? syncResults : undefined
        });

    } catch (error) {
        console.error('[Approve Fields] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
