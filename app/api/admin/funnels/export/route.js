import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/funnels/export
 *
 * Exports funnel data (vault content + wizard answers) as JSON or CSV.
 *
 * Query params:
 *   - format: 'json' | 'csv' (default: 'json')
 *   - userId: optional — filter to a single user
 *   - funnelId: optional — export a single funnel
 *   - status: optional — filter by vault_generation_status
 *   - search: optional — search funnel name / user name / email
 */
export async function GET(req) {
    const startTime = Date.now();

    try {
        // ── Auth ────────────────────────────────────────────────
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized access to admin funnels export');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin attempted funnels export', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Parse params ────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const format = (searchParams.get('format') || 'json').toLowerCase();
        const userId = searchParams.get('userId');
        const funnelId = searchParams.get('funnelId');
        const status = searchParams.get('status');
        const search = searchParams.get('search') || '';

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Admin export requested', {
            adminUserId,
            format,
            userId,
            funnelId,
            status,
            search,
        });

        // ── Build funnels query ─────────────────────────────────
        let query = supabase
            .from('user_funnels')
            .select(`
                id,
                user_id,
                funnel_name,
                funnel_description,
                wizard_answers,
                questionnaire_completed,
                questionnaire_completed_at,
                current_step,
                completed_steps,
                vault_generated,
                vault_generated_at,
                vault_generation_status,
                selected_funnel_type,
                created_at,
                updated_at,
                user_profiles!inner(
                    id,
                    full_name,
                    email,
                    subscription_tier
                )
            `);

        // Single funnel export
        if (funnelId) {
            query = query.eq('id', funnelId);
        }

        // Filter by user
        if (userId) {
            query = query.eq('user_id', userId);
        }

        // Filter by vault generation status
        if (status) {
            query = query.eq('vault_generation_status', status);
        }

        // Search
        if (search) {
            const { data: matchingUsers } = await supabase
                .from('user_profiles')
                .select('id')
                .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

            const matchingUserIds = (matchingUsers || []).map(u => u.id);

            if (matchingUserIds.length > 0) {
                query = query.or(`funnel_name.ilike.%${search}%,user_id.in.(${matchingUserIds.join(',')})`);
            } else {
                query = query.ilike('funnel_name', `%${search}%`);
            }
        }

        query = query.order('created_at', { ascending: false });

        const { data: funnels, error: funnelsError } = await query;

        if (funnelsError) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch funnels for export', {
                error: funnelsError.message,
            });
            throw funnelsError;
        }

        if (!funnels || funnels.length === 0) {
            return NextResponse.json({ error: 'No funnels found matching the criteria' }, { status: 404 });
        }

        // ── Fetch vault content for all matched funnels ─────────
        const funnelIds = funnels.map(f => f.id);

        const { data: allVaultContent, error: vaultError } = await supabase
            .from('vault_content')
            .select('id, funnel_id, section_id, section_title, content, phase, status, version, is_current_version, created_at, updated_at')
            .in('funnel_id', funnelIds)
            .eq('is_current_version', true)
            .order('phase', { ascending: true })
            .order('numeric_key', { ascending: true });

        if (vaultError) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch vault content for export', {
                error: vaultError.message,
            });
            throw vaultError;
        }

        // Map vault items to their funnels
        const vaultByFunnel = {};
        (allVaultContent || []).forEach(item => {
            if (!vaultByFunnel[item.funnel_id]) {
                vaultByFunnel[item.funnel_id] = [];
            }
            vaultByFunnel[item.funnel_id].push(item);
        });

        // ── Assemble export payload ─────────────────────────────
        const exportData = funnels.map(funnel => ({
            funnel_id: funnel.id,
            funnel_name: funnel.funnel_name,
            funnel_description: funnel.funnel_description,
            selected_funnel_type: funnel.selected_funnel_type,
            vault_generation_status: funnel.vault_generation_status,
            questionnaire_completed: funnel.questionnaire_completed,
            questionnaire_completed_at: funnel.questionnaire_completed_at,
            created_at: funnel.created_at,
            updated_at: funnel.updated_at,
            user: {
                user_id: funnel.user_profiles?.id,
                full_name: funnel.user_profiles?.full_name,
                email: funnel.user_profiles?.email,
                subscription_tier: funnel.user_profiles?.subscription_tier,
            },
            wizard_answers: funnel.wizard_answers || {},
            vault_content: (vaultByFunnel[funnel.id] || []).map(v => ({
                section_id: v.section_id,
                section_title: v.section_title,
                phase: v.phase,
                status: v.status,
                version: v.version,
                content: v.content,
                updated_at: v.updated_at,
            })),
        }));

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        // ── Format: CSV ─────────────────────────────────────────
        if (format === 'csv') {
            const csvRows = [];

            // Header row
            csvRows.push([
                'funnel_id',
                'funnel_name',
                'funnel_description',
                'selected_funnel_type',
                'vault_generation_status',
                'questionnaire_completed',
                'created_at',
                'user_id',
                'user_full_name',
                'user_email',
                'subscription_tier',
                'wizard_answers',
                'vault_section_id',
                'vault_section_title',
                'vault_phase',
                'vault_status',
                'vault_version',
                'vault_content',
            ].join(','));

            // Data rows — one row per vault section (funnel info repeated)
            exportData.forEach(funnel => {
                const vaultItems = funnel.vault_content;

                if (vaultItems.length === 0) {
                    // Still emit a row for the funnel even if no vault content
                    csvRows.push(buildCsvRow(funnel, null));
                } else {
                    vaultItems.forEach(vaultItem => {
                        csvRows.push(buildCsvRow(funnel, vaultItem));
                    });
                }
            });

            const csvString = csvRows.join('\n');
            const fileName = funnelId
                ? `funnel_export_${funnelId.substring(0, 8)}_${timestamp}.csv`
                : `funnels_export_${timestamp}.csv`;

            return new Response(csvString, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                },
            });
        }

        // ── Format: JSON (default) ──────────────────────────────
        const jsonString = JSON.stringify(exportData, null, 2);
        const fileName = funnelId
            ? `funnel_export_${funnelId.substring(0, 8)}_${timestamp}.json`
            : `funnels_export_${timestamp}.json`;

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Export completed', {
            format,
            funnelCount: exportData.length,
            duration: `${Date.now() - startTime}ms`,
        });

        return new Response(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin funnels export failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── CSV helpers ─────────────────────────────────────────────────

/**
 * Escape a value for safe inclusion in a CSV cell.
 * Wraps in quotes and escapes internal quotes.
 */
function escapeCsv(value) {
    if (value === null || value === undefined) return '""';
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Wrap in double-quotes; escape any existing double-quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
}

function buildCsvRow(funnel, vaultItem) {
    return [
        escapeCsv(funnel.funnel_id),
        escapeCsv(funnel.funnel_name),
        escapeCsv(funnel.funnel_description),
        escapeCsv(funnel.selected_funnel_type),
        escapeCsv(funnel.vault_generation_status),
        escapeCsv(funnel.questionnaire_completed),
        escapeCsv(funnel.created_at),
        escapeCsv(funnel.user?.user_id),
        escapeCsv(funnel.user?.full_name),
        escapeCsv(funnel.user?.email),
        escapeCsv(funnel.user?.subscription_tier),
        escapeCsv(funnel.wizard_answers),
        escapeCsv(vaultItem?.section_id || ''),
        escapeCsv(vaultItem?.section_title || ''),
        escapeCsv(vaultItem?.phase || ''),
        escapeCsv(vaultItem?.status || ''),
        escapeCsv(vaultItem?.version || ''),
        escapeCsv(vaultItem?.content || ''),
    ].join(',');
}
