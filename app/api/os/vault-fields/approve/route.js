import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


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

        return NextResponse.json({
            success: true,
            section_id,
            approved: true
        });

    } catch (error) {
        console.error('[Approve Fields] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
