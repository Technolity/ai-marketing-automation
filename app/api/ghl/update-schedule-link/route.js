/**
 * POST /api/ghl/update-schedule-link
 * Saves the user's booking URL to user_profiles, then replaces the URL in all
 * stored vault content (emails, sms, appointmentReminders) and pushes those
 * sections to GHL one-by-one with a delay to avoid rate limits.
 *
 * Body: { schedule_link: string, funnel_id: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a regex that matches the standard placeholders AND the previously-saved
 * real URL (if any), so updating the link always overwrites the old value.
 */
function buildBookingRegex(oldUrl) {
    const parts = ['\\[BOOKING_LINK\\]', '\\{\\{custom_values\\.schedule_link\\}\\}'];
    if (oldUrl && typeof oldUrl === 'string' && oldUrl.startsWith('http')) {
        parts.push(escapeRegex(oldUrl));
    }
    return new RegExp(parts.join('|'), 'g');
}

function substituteUrl(value, url, regex) {
    if (typeof value !== 'string') return value;
    return value.replace(regex, url);
}

function substituteDeep(node, url, regex) {
    if (typeof node === 'string') return substituteUrl(node, url, regex);
    if (Array.isArray(node)) return node.map((item) => substituteDeep(item, url, regex));
    if (node && typeof node === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(node)) {
            out[k] = substituteDeep(v, url, regex);
        }
        return out;
    }
    return node;
}

export async function POST(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { schedule_link: scheduleLink, funnel_id: funnelId } = body;

    if (!scheduleLink || typeof scheduleLink !== 'string' || !scheduleLink.startsWith('http')) {
        return NextResponse.json({ error: 'Valid schedule_link URL is required' }, { status: 400 });
    }
    if (!funnelId) {
        return NextResponse.json({ error: 'funnel_id is required' }, { status: 400 });
    }

    // ── 1. Fetch old schedule_link BEFORE overwriting (needed for regex) ───────
    let oldScheduleLink = null;
    try {
        const { data: oldRow } = await supabaseAdmin
            .from('user_funnels')
            .select('schedule_link')
            .eq('id', funnelId)
            .eq('user_id', targetUserId)
            .maybeSingle();
        oldScheduleLink = oldRow?.schedule_link || null;
    } catch (_) { /* non-fatal */ }

    // Build regex once per request — matches placeholders + old real URL
    const bookingRegex = buildBookingRegex(oldScheduleLink !== scheduleLink ? oldScheduleLink : null);

    // ── 2. Save the booking URL to user_funnels (per-funnel) ─────────────────
    const { error: funnelUpdateError } = await supabaseAdmin
        .from('user_funnels')
        .update({ schedule_link: scheduleLink })
        .eq('id', funnelId)
        .eq('user_id', targetUserId);

    if (funnelUpdateError) {
        console.error('[UpdateScheduleLink] funnel update error:', funnelUpdateError);
        return NextResponse.json({ error: 'Failed to save schedule link' }, { status: 500 });
    }

    // ── 3. Update vault_content_fields for emails, sms, appointmentReminders ──
    const SECTIONS = ['emails', 'sms', 'appointmentReminders'];
    let updatedFieldCount = 0;

    for (const sectionId of SECTIONS) {
        const { data: fields, error: fetchError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('id, field_value')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true);

        if (fetchError || !fields?.length) continue;

        for (const field of fields) {
            const rawValue = field.field_value;

            let newValue;
            if (typeof rawValue === 'string') {
                try {
                    const parsed = JSON.parse(rawValue);
                    const substituted = substituteDeep(parsed, scheduleLink, bookingRegex);
                    newValue = JSON.stringify(substituted);
                } catch {
                    newValue = substituteUrl(rawValue, scheduleLink, bookingRegex);
                }
            } else {
                newValue = substituteDeep(rawValue, scheduleLink, bookingRegex);
            }

            // Skip write if nothing changed
            const unchanged = typeof newValue === 'string'
                ? newValue === (typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue))
                : JSON.stringify(newValue) === JSON.stringify(rawValue);
            if (unchanged) continue;

            const { error: updateError } = await supabaseAdmin
                .from('vault_content_fields')
                .update({ field_value: newValue })
                .eq('id', field.id);

            if (!updateError) updatedFieldCount++;
        }

        // Also update vault_content JSONB blob for this section
        const { data: vaultRow } = await supabaseAdmin
            .from('vault_content')
            .select('id, content')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true)
            .maybeSingle();

        if (vaultRow?.content) {
            const newContent = substituteDeep(vaultRow.content, scheduleLink, bookingRegex);
            await supabaseAdmin
                .from('vault_content')
                .update({ content: newContent })
                .eq('id', vaultRow.id);
        }
    }

    // ── 4. Push sections to GHL one-by-one with rate-limit delay ─────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const pushed = [];
    const pushErrors = [];

    const GHL_PUSH_ROUTES = [
        { section: 'emails', path: '/api/ghl/push-emails' },
        { section: 'sms', path: '/api/ghl/push-sms' },
        { section: 'appointmentReminders', path: '/api/ghl/push-appointmentReminders' },
    ];

    // Reuse the caller's auth cookie/header for internal requests
    const authHeader = req.headers.get('authorization') || '';
    const cookieHeader = req.headers.get('cookie') || '';

    for (const { section, path } of GHL_PUSH_ROUTES) {
        try {
            const res = await fetch(`${baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authHeader ? { authorization: authHeader } : {}),
                    ...(cookieHeader ? { cookie: cookieHeader } : {}),
                },
                body: JSON.stringify({ funnelId }),
            });

            if (res.ok) {
                pushed.push(section);
            } else {
                const errBody = await res.json().catch(() => ({}));
                pushErrors.push({ section, status: res.status, error: errBody.error || 'Unknown' });
            }
        } catch (err) {
            pushErrors.push({ section, error: err.message });
        }

        // 700ms between pushes to stay within GHL rate limits
        await delay(700);
    }

    return NextResponse.json({
        success: true,
        updated_fields: updatedFieldCount,
        ghl_pushed: pushed,
        ghl_errors: pushErrors.length ? pushErrors : undefined,
    });
}
