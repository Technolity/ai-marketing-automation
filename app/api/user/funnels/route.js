import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

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

        const { data: funnels, error } = await supabaseAdmin
            .from('user_funnels')
            .select(`
                *,
                approved_count:vault_content(count)
            `)
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .eq('vault_content.status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            funnels: funnels || [],
            count: funnels?.length || 0
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
 * DELETE /api/user/funnels?id=xxx
 * Soft delete a funnel (business)
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

        // Verify ownership and soft delete
        const { error } = await supabaseAdmin
            .from('user_funnels')
            .update({
                is_deleted: true,
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', funnelId)
            .eq('user_id', userId);

        if (error) throw error;

        // Decrement funnel count
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('current_funnel_count')
            .eq('id', userId)
            .single();

        if (profile) {
            await supabaseAdmin
                .from('user_profiles')
                .update({ current_funnel_count: Math.max(0, (profile.current_funnel_count || 1) - 1) })
                .eq('id', userId);
        }

        return NextResponse.json({ success: true, message: 'Business deleted' });

    } catch (error) {
        console.error('[API] Delete funnel error:', error);
        return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }
}
