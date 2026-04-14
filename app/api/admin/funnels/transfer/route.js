import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * PUT /api/admin/funnels/transfer
 *
 * Transfers a funnel (and all associated data) from one user to another.
 *
 * Body:
 *   - funnelId:     UUID of the funnel to transfer
 *   - targetUserId: Clerk user ID of the new owner
 *
 * Tables updated:
 *   1. user_funnels
 *   2. vault_content
 *   3. vault_content_fields
 *   4. questionnaire_responses
 *   5. rag_data
 *   6. generation_jobs
 *   7. ghl_push_logs
 *   8. saved_sessions (where answers->>funnel_id matches)
 *
 * NOT transferred (kept under old user):
 *   - ghl_custom_value_mappings
 */
export async function PUT(req) {
    const startTime = Date.now();

    try {
        // ── Auth ────────────────────────────────────────────────
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized access to funnel transfer');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin attempted funnel transfer', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Parse body ──────────────────────────────────────────
        const body = await req.json();
        const { funnelId, targetUserId } = body;

        if (!funnelId) {
            return NextResponse.json({ error: 'funnelId is required' }, { status: 400 });
        }
        if (!targetUserId) {
            return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
        }

        // ── Validate funnel exists & get current owner ──────────
        const { data: funnel, error: funnelError } = await supabase
            .from('user_funnels')
            .select('id, user_id, funnel_name, vault_generation_status')
            .eq('id', funnelId)
            .single();

        if (funnelError || !funnel) {
            adminLogger.warn(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Funnel not found for transfer', { funnelId });
            return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
        }

        const sourceUserId = funnel.user_id;

        if (sourceUserId === targetUserId) {
            return NextResponse.json(
                { error: 'Source and target users are the same' },
                { status: 400 }
            );
        }

        // ── Validate target user exists ─────────────────────────
        const { data: targetUser, error: targetError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, subscription_tier')
            .eq('id', targetUserId)
            .single();

        if (targetError || !targetUser) {
            adminLogger.warn(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Target user not found for transfer', { targetUserId });
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Starting funnel transfer', {
            adminUserId,
            funnelId,
            funnelName: funnel.funnel_name,
            sourceUserId,
            targetUserId,
            targetUserEmail: targetUser.email,
        });

        // ── Perform the transfer across all tables ──────────────
        // Admin transfers bypass max_funnels limits.

        const transferResults = {};
        const errors = [];

        // 1. user_funnels — the primary funnel record
        const { error: e1 } = await supabase
            .from('user_funnels')
            .update({ user_id: targetUserId, updated_at: new Date().toISOString() })
            .eq('id', funnelId);
        if (e1) errors.push({ table: 'user_funnels', error: e1.message });
        else transferResults.user_funnels = 'updated';

        // 2. vault_content
        const { data: vaultUpdated, error: e2 } = await supabase
            .from('vault_content')
            .update({ user_id: targetUserId, updated_at: new Date().toISOString() })
            .eq('funnel_id', funnelId)
            .eq('user_id', sourceUserId)
            .select('id');
        if (e2) errors.push({ table: 'vault_content', error: e2.message });
        else transferResults.vault_content = `${vaultUpdated?.length || 0} rows`;

        // 3. vault_content_fields
        const { data: fieldsUpdated, error: e3 } = await supabase
            .from('vault_content_fields')
            .update({ user_id: targetUserId, updated_at: new Date().toISOString() })
            .eq('funnel_id', funnelId)
            .eq('user_id', sourceUserId)
            .select('id');
        if (e3) errors.push({ table: 'vault_content_fields', error: e3.message });
        else transferResults.vault_content_fields = `${fieldsUpdated?.length || 0} rows`;

        // 4. questionnaire_responses
        const { data: qrUpdated, error: e4 } = await supabase
            .from('questionnaire_responses')
            .update({ user_id: targetUserId, updated_at: new Date().toISOString() })
            .eq('funnel_id', funnelId)
            .eq('user_id', sourceUserId)
            .select('id');
        if (e4) errors.push({ table: 'questionnaire_responses', error: e4.message });
        else transferResults.questionnaire_responses = `${qrUpdated?.length || 0} rows`;

        // 5. rag_data
        const { data: ragUpdated, error: e5 } = await supabase
            .from('rag_data')
            .update({ user_id: targetUserId, updated_at: new Date().toISOString() })
            .eq('funnel_id', funnelId)
            .eq('user_id', sourceUserId)
            .select('id');
        if (e5) errors.push({ table: 'rag_data', error: e5.message });
        else transferResults.rag_data = `${ragUpdated?.length || 0} rows`;

        // 6. generation_jobs
        const { data: jobsUpdated, error: e6 } = await supabase
            .from('generation_jobs')
            .update({ user_id: targetUserId, updated_at: new Date().toISOString() })
            .eq('funnel_id', funnelId)
            .eq('user_id', sourceUserId)
            .select('id');
        if (e6) errors.push({ table: 'generation_jobs', error: e6.message });
        else transferResults.generation_jobs = `${jobsUpdated?.length || 0} rows`;

        // 7. ghl_push_logs
        const { data: pushUpdated, error: e7 } = await supabase
            .from('ghl_push_logs')
            .update({ user_id: targetUserId })
            .eq('funnel_id', funnelId)
            .eq('user_id', sourceUserId)
            .select('id');
        if (e7) errors.push({ table: 'ghl_push_logs', error: e7.message });
        else transferResults.ghl_push_logs = `${pushUpdated?.length || 0} rows`;

        // 8. saved_sessions — transfer sessions belonging to source user
        //    We match on user_id only since saved_sessions doesn't have funnel_id FK.
        //    Transfer all sessions for this source user whose answers reference this funnel.
        const { data: sessions } = await supabase
            .from('saved_sessions')
            .select('id, answers')
            .eq('user_id', sourceUserId);

        let sessionsTransferred = 0;
        if (sessions && sessions.length > 0) {
            const matchingIds = sessions
                .filter(s => {
                    // Check if the session's answers JSON references this funnel ID
                    const answersStr = JSON.stringify(s.answers || {});
                    return answersStr.includes(funnelId);
                })
                .map(s => s.id);

            if (matchingIds.length > 0) {
                const { error: e8 } = await supabase
                    .from('saved_sessions')
                    .update({ user_id: targetUserId, updated_at: new Date().toISOString() })
                    .in('id', matchingIds);
                if (e8) errors.push({ table: 'saved_sessions', error: e8.message });
                else sessionsTransferred = matchingIds.length;
            }
        }
        transferResults.saved_sessions = `${sessionsTransferred} rows`;

        // ── Report ──────────────────────────────────────────────
        if (errors.length > 0) {
            adminLogger.error(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Funnel transfer completed with errors', {
                funnelId,
                sourceUserId,
                targetUserId,
                errors,
                transferResults,
            });

            return NextResponse.json({
                success: false,
                message: 'Transfer completed with some errors. Check the details.',
                errors,
                transferResults,
            }, { status: 207 });
        }

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Funnel transfer completed successfully', {
            adminUserId,
            funnelId,
            funnelName: funnel.funnel_name,
            sourceUserId,
            targetUserId,
            targetUserEmail: targetUser.email,
            transferResults,
            duration: `${duration}ms`,
        });

        adminLogger.logFunnelOperation('transfer', funnelId, sourceUserId, {
            targetUserId,
            targetUserEmail: targetUser.email,
            transferResults,
        });

        return NextResponse.json({
            success: true,
            message: `Funnel "${funnel.funnel_name}" transferred successfully to ${targetUser.full_name || targetUser.email}`,
            transferResults,
            transfer: {
                funnelId,
                funnelName: funnel.funnel_name,
                from: { userId: sourceUserId },
                to: {
                    userId: targetUserId,
                    fullName: targetUser.full_name,
                    email: targetUser.email,
                },
            },
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin funnel transfer failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
