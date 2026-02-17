import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';


export const dynamic = 'force-dynamic';

// Section title mapping for vault_content
const SECTION_TITLES = {
    idealClient: 'Ideal Client',
    message: 'Message',
    story: 'Story',
    offer: 'Offer & Pricing',
    salesScripts: 'Closer Script',
    leadMagnet: 'Free Gift',
    vsl: 'Video Script',
    emails: 'Email Sequences',
    facebookAds: 'Ad Copy',
    funnelCopy: 'Funnel Page Copy',
    bio: 'Professional Bio',
    appointmentReminders: 'Appointment Reminders',
    setterScript: 'Setter Script',
    sms: 'SMS Sequences',
    media: 'Upload Images and Videos',
    colors: 'Brand Colors'
};

/**
 * POST /api/os/vault-section-approve
 * Approve all fields in a section
 *
 * Body:
 * - funnel_id (required)
 * - section_id (required)
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
        return Response.json({ error: workspaceError }, { status: 403 });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { funnel_id, section_id } = body;

    if (!funnel_id || !section_id) {
        return Response.json({ error: 'funnel_id and section_id are required' }, { status: 400 });
    }

    console.log('[VaultSectionApprove] Approving section:', { userId: targetUserId, funnel_id, section_id });

    try {
        // Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnel_id)
            .eq('user_id', targetUserId)
            .single();

        if (funnelError || !funnel) {
            return Response.json({ error: 'Funnel not found' }, { status: 404 });
        }

        // Approve all current version fields in this section
        const { data: approvedFields, error: updateError } = await supabaseAdmin
            .from('vault_content_fields')
            .update({ is_approved: true })
            .eq('funnel_id', funnel_id)
            .eq('user_id', targetUserId)
            .eq('section_id', section_id)
            .eq('is_current_version', true)
            .select();

        if (updateError) {
            console.error('[VaultSectionApprove] Update error:', updateError);
            throw updateError;
        }

        // ALSO update vault_content.status to 'approved' for Dashboard progress tracking
        // For media section (and others), create vault_content row if it doesn't exist
        // SECURITY FIX: Added user_id filter to prevent cross-user data access
        const { data: existingContent, error: checkError } = await supabaseAdmin
            .from('vault_content')
            .select('id')
            .eq('funnel_id', funnel_id)
            .eq('user_id', targetUserId)
            .eq('section_id', section_id)
            .eq('is_current_version', true)
            .maybeSingle();

        if (!existingContent) {
            // No vault_content row exists (e.g., for media section), create one
            const sectionTitle = SECTION_TITLES[section_id] || section_id;

            const { error: insertError } = await supabaseAdmin
                .from('vault_content')
                .insert({
                    funnel_id,
                    user_id: targetUserId,
                    section_id,
                    section_title: sectionTitle,
                    content: {}, // Empty content for sections like media
                    status: 'approved',
                    is_current_version: true,
                    version: 1
                });

            if (insertError) {
                console.error('[VaultSectionApprove] vault_content insert error:', insertError);
            }
        } else {
            // Update existing row
            const { error: vaultContentError } = await supabaseAdmin
                .from('vault_content')
                .update({ status: 'approved' })
                .eq('funnel_id', funnel_id)
                .eq('section_id', section_id)
                .eq('user_id', targetUserId)
                .eq('is_current_version', true);

            if (vaultContentError) {
                console.error('[VaultSectionApprove] vault_content update warning:', vaultContentError);
            }
        }

        console.log('[VaultSectionApprove] Section approved:', {
            section_id,
            fieldsApproved: approvedFields?.length || 0
        });

        return new Response(JSON.stringify({
            success: true,
            section_id,
            fieldsApproved: approvedFields?.length || 0
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[VaultSectionApprove] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
