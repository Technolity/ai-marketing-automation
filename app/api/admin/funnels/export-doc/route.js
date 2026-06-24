import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';
import { renderClientDoc } from '@/lib/clientDocRenderer';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/funnels/export-doc
 *
 * Admin-only. Renders a polished, client-facing document (HTML, print-to-PDF)
 * of ALL vault sections for the chosen scope, then downloads it.
 *
 * Scope (at least one required — we never dump the whole DB):
 *   - funnelId: a single funnel (most common)
 *   - userId:   all of one user's funnels
 *   - search:   match funnel name / user name / email
 */
export async function GET(req) {
    const startTime = Date.now();

    try {
        // ── Auth ────────────────────────────────────────────────
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin attempted funnels doc export', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Parse params ────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const funnelId = searchParams.get('funnelId');
        const userId = searchParams.get('userId');
        const search = searchParams.get('search') || '';

        if (!funnelId && !userId && !search) {
            return NextResponse.json(
                { error: 'Provide a funnelId, userId, or search to scope the document.' },
                { status: 400 }
            );
        }

        // ── Build funnels query ─────────────────────────────────
        let query = supabase
            .from('user_funnels')
            .select(`
                id,
                user_id,
                funnel_name,
                funnel_description,
                selected_funnel_type,
                vault_generation_status,
                questionnaire_completed,
                created_at,
                user_profiles!inner(
                    id,
                    full_name,
                    email,
                    subscription_tier
                )
            `);

        if (funnelId) query = query.eq('id', funnelId);
        if (userId) query = query.eq('user_id', userId);

        if (search) {
            const { data: matchingUsers } = await supabase
                .from('user_profiles')
                .select('id')
                .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
            const matchingUserIds = (matchingUsers || []).map((u) => u.id);
            if (matchingUserIds.length > 0) {
                query = query.or(`funnel_name.ilike.%${search}%,user_id.in.(${matchingUserIds.join(',')})`);
            } else {
                query = query.ilike('funnel_name', `%${search}%`);
            }
        }

        query = query.order('created_at', { ascending: false });

        const { data: funnels, error: funnelsError } = await query;
        if (funnelsError) throw funnelsError;

        if (!funnels || funnels.length === 0) {
            return NextResponse.json({ error: 'No funnels found matching the criteria' }, { status: 404 });
        }

        // ── Fetch vault content for matched funnels ─────────────
        const funnelIds = funnels.map((f) => f.id);
        const { data: allVaultContent, error: vaultError } = await supabase
            .from('vault_content')
            .select('funnel_id, section_id, section_title, content, phase, status, is_current_version')
            .in('funnel_id', funnelIds)
            .eq('is_current_version', true)
            .order('phase', { ascending: true })
            .order('numeric_key', { ascending: true });

        if (vaultError) throw vaultError;

        const vaultByFunnel = {};
        (allVaultContent || []).forEach((item) => {
            (vaultByFunnel[item.funnel_id] ||= []).push(item);
        });

        // ── Assemble the shape the renderer expects ─────────────
        const exportData = funnels.map((funnel) => ({
            funnel_name: funnel.funnel_name,
            funnel_description: funnel.funnel_description,
            selected_funnel_type: funnel.selected_funnel_type,
            user: {
                full_name: funnel.user_profiles?.full_name,
                email: funnel.user_profiles?.email,
                subscription_tier: funnel.user_profiles?.subscription_tier,
            },
            vault_content: (vaultByFunnel[funnel.id] || []).map((v) => ({
                section_id: v.section_id,
                section_title: v.section_title,
                phase: v.phase,
                status: v.status,
                content: v.content,
            })),
        }));

        const generatedOn = new Date().toISOString().slice(0, 10);
        const html = renderClientDoc(exportData, { generatedOn });

        // ── Filename ────────────────────────────────────────────
        const slug = (s) => String(s || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'content';
        const baseName =
            funnels.length === 1 ? slug(funnels[0].funnel_name) : slug(funnels[0].user_profiles?.full_name || funnels[0].user_profiles?.email);
        const fileName = `${baseName}-content-${generatedOn}.html`;

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Admin client-doc export completed', {
            adminUserId,
            funnelCount: funnels.length,
            duration: `${Date.now() - startTime}ms`,
        });

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        adminLogger.error(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Client-doc export failed', { error: error.message });
        return NextResponse.json({ error: 'Failed to render document' }, { status: 500 });
    }
}
