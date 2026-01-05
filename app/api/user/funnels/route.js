import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * GET /api/user/funnels
 * Get all funnels (businesses) for the current user
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch funnels for this user
        const { data: funnels, error } = await supabaseAdmin
            .from('user_funnels')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get approved section counts for all funnels in one query
        const funnelIds = funnels?.map(f => f.id) || [];
        let approvalCounts = {};

        if (funnelIds.length > 0) {
            // Count approved sections per funnel from vault_content
            const { data: approvalData, error: approvalError } = await supabaseAdmin
                .from('vault_content')
                .select('funnel_id, section_id')
                .in('funnel_id', funnelIds)
                .eq('status', 'approved')
                .eq('is_current_version', true);

            if (!approvalError && approvalData) {
                // Group by funnel_id and count unique sections
                approvalData.forEach(row => {
                    if (!approvalCounts[row.funnel_id]) {
                        approvalCounts[row.funnel_id] = new Set();
                    }
                    approvalCounts[row.funnel_id].add(row.section_id);
                });
            }
        }

        // Enrich funnels with approved_count
        const enrichedFunnels = funnels?.map(funnel => ({
            ...funnel,
            approved_count: approvalCounts[funnel.id]?.size || 0,
            // Also provide completed_steps_count from completed_steps array
            completed_steps_count: Array.isArray(funnel.completed_steps) ? funnel.completed_steps.length : 0
        })) || [];

        return NextResponse.json({
            success: true,
            funnels: enrichedFunnels,
            count: enrichedFunnels.length
        });

    } catch (error) {
        console.error('[API] Get funnels error:', error);
        return NextResponse.json({ error: 'Failed to load funnels' }, { status: 500 });
    }
}

/**
 * POST /api/user/funnels
 * Create a new funnel (business) for the current user
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
        }

        // Check tier limits - user_profiles uses 'id' as the Clerk user ID
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('max_funnels, current_funnel_count')
            .eq('id', userId)
            .single();

        const maxFunnels = profile?.max_funnels || 1;
        const currentCount = profile?.current_funnel_count || 0;

        if (currentCount >= maxFunnels) {
            return NextResponse.json({
                error: 'Funnel limit reached',
                message: `You can only create ${maxFunnels} business(es). Upgrade your plan for more.`
            }, { status: 403 });
        }

        // Create the funnel - columns must match schema exactly
        const { data: funnel, error } = await supabaseAdmin
            .from('user_funnels')
            .insert({
                user_id: userId,
                funnel_name: name.trim(),
                funnel_description: description?.trim() || null,
                questionnaire_completed: false,
                current_step: 1,
                completed_steps: [],
                vault_generated: false,
                vault_generation_status: 'not_started',
                is_active: currentCount === 0, // First funnel is active by default
                is_deleted: false
            })
            .select()
            .single();

        if (error) throw error;

        // Increment funnel count (if we have the helper function, it handles this via trigger)
        // Otherwise, update manually
        await supabaseAdmin
            .from('user_profiles')
            .update({ current_funnel_count: currentCount + 1 })
            .eq('id', userId);

        return NextResponse.json({
            success: true,
            funnel,
            message: 'Business created successfully'
        });

    } catch (error) {
        console.error('[API] Create funnel error:', error);
        return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
    }
}

/**
 * PATCH /api/user/funnels
 * Update funnel choice for a business
 * Body: { funnelId, funnelType }
 */
export async function PATCH(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { funnelId, funnelType } = await req.json();

        if (!funnelId || !funnelType) {
            return NextResponse.json({ error: 'Funnel ID and type are required' }, { status: 400 });
        }

        // Verify ownership
        const { data: funnel, error: verifyError } = await supabaseAdmin
            .from('user_funnels')
            .select('id, user_id')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (verifyError || !funnel) {
            return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 });
        }

        // Update funnel type
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('user_funnels')
            .update({
                selected_funnel_type: funnelType,
                funnel_choice_made_at: new Date().toISOString()
            })
            .eq('id', funnelId)
            .eq('user_id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            funnel: updated,
            message: 'Funnel choice saved successfully'
        });

    } catch (error) {
        console.error('[API] Update funnel choice error:', error);
        return NextResponse.json({ error: 'Failed to save funnel choice' }, { status: 500 });
    }
}

/**
 * DELETE /api/user/funnels?id=xxx
 * Hard delete a funnel (business) and all related data
 * Database has ON DELETE CASCADE, so all related data is automatically deleted:
 * - questionnaire_responses
 * - vault_content
 * - content_edit_history
 * - generation_jobs
 */
export async function DELETE(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const funnelId = searchParams.get('id');

        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID required' }, { status: 400 });
        }

        // Verify ownership before deleting
        const { data: funnel, error: verifyError } = await supabaseAdmin
            .from('user_funnels')
            .select('id, user_id')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (verifyError || !funnel) {
            return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 });
        }

        // Hard delete - CASCADE will remove all related data automatically
        const { error: deleteError } = await supabaseAdmin
            .from('user_funnels')
            .delete()
            .eq('id', funnelId)
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // The database trigger (decrement_funnel_count_trigger) will automatically 
        // decrement the user's current_funnel_count

        return NextResponse.json({
            success: true,
            message: 'Business and all related data permanently deleted'
        });

    } catch (error) {
        console.error('[API] Delete funnel error:', error);
        return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }
}

