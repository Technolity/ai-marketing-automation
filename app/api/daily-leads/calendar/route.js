/**
 * /api/daily-leads/calendar
 * Persisted 30-day content calendars for Daily Leads.
 *
 *   GET    ?funnel_id=  → load the user's current calendar + items
 *   POST               → create/replace a calendar from curated templates or AI topics
 *   PATCH              → update a single item (caption/angle/status/image/post link)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { buildCalendar } from '@/lib/dailyLeads/contentCalendar';

const ITEM_SELECT =
  'id, day_number, category, angle, caption, image_brief, image_url, status, daily_post_id, template_key';

// ── GET: load current calendar for a funnel ──────────────────────────────────
export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id') || null;

    let calQuery = supabaseAdmin
      .from('content_calendars')
      .select('id, funnel_id, title, source, created_at')
      .eq('user_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1);
    calQuery = funnelId ? calQuery.eq('funnel_id', funnelId) : calQuery.is('funnel_id', null);

    const { data: calendar, error: calErr } = await calQuery.maybeSingle();
    if (calErr) throw calErr;
    if (!calendar) return NextResponse.json({ calendar: null, items: [] });

    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('content_calendar_items')
      .select(ITEM_SELECT)
      .eq('calendar_id', calendar.id)
      .order('day_number', { ascending: true });
    if (itemsErr) throw itemsErr;

    return NextResponse.json({ calendar, items: items ?? [] });
  } catch (err) {
    console.error('[DailyLeads Calendar GET]', err);
    return NextResponse.json({ error: 'Failed to load calendar.' }, { status: 500 });
  }
}

// ── POST: create or replace a calendar ───────────────────────────────────────
export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const funnelId = body.funnel_id || null;
    const source = body.source === 'ai' ? 'ai' : 'template';
    const keyword = body.keyword || 'GUIDE';

    // Build the 30 items.
    let items;
    if (source === 'template') {
      const vaultCtx = body.vault_context || {};
      items = buildCalendar(vaultCtx, keyword);
    } else {
      // AI source: client passes topic strings (from /api/daily-leads/topics).
      const topics = Array.isArray(body.topics) ? body.topics : [];
      if (!topics.length) {
        return NextResponse.json({ error: 'No topics provided for AI calendar.' }, { status: 400 });
      }
      items = topics.slice(0, 30).map((topic, i) => ({
        day: i + 1,
        category: 'AI',
        angle: String(topic).trim(),
        caption: '',
        imageBrief: String(topic).trim(),
        templateKey: `ai-${i + 1}`,
      }));
    }

    // Replace any existing calendar for this (user, funnel) — cascade clears items.
    let delQuery = supabaseAdmin.from('content_calendars').delete().eq('user_id', workspaceId);
    delQuery = funnelId ? delQuery.eq('funnel_id', funnelId) : delQuery.is('funnel_id', null);
    await delQuery;

    const { data: calendar, error: calErr } = await supabaseAdmin
      .from('content_calendars')
      .insert({ user_id: workspaceId, funnel_id: funnelId, source, title: '30-Day Calendar' })
      .select('id, funnel_id, title, source, created_at')
      .single();
    if (calErr) throw calErr;

    const rows = items.map((it) => ({
      calendar_id: calendar.id,
      day_number: it.day,
      category: it.category,
      angle: it.angle,
      caption: it.caption,
      image_brief: it.imageBrief,
      status: 'idea',
      template_key: it.templateKey,
    }));

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('content_calendar_items')
      .insert(rows)
      .select(ITEM_SELECT);
    if (insErr) throw insErr;

    const sorted = (inserted ?? []).sort((a, b) => a.day_number - b.day_number);
    return NextResponse.json({ calendar, items: sorted });
  } catch (err) {
    console.error('[DailyLeads Calendar POST]', err);
    return NextResponse.json({ error: 'Failed to create calendar.' }, { status: 500 });
  }
}

// ── PATCH: update one item ───────────────────────────────────────────────────
const ALLOWED_STATUS = ['idea', 'approved', 'image_generated', 'posted'];

export async function PATCH(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const itemId = body.item_id;
    if (!itemId) return NextResponse.json({ error: 'Missing item_id.' }, { status: 400 });

    // Verify ownership via the parent calendar.
    const { data: existing, error: existErr } = await supabaseAdmin
      .from('content_calendar_items')
      .select('id, calendar_id, content_calendars!inner(user_id)')
      .eq('id', itemId)
      .maybeSingle();
    if (existErr) throw existErr;
    if (!existing || existing.content_calendars?.user_id !== workspaceId) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const updates = {};
    if (typeof body.caption === 'string') updates.caption = body.caption;
    if (typeof body.angle === 'string') updates.angle = body.angle;
    if (typeof body.image_url === 'string') updates.image_url = body.image_url;
    if (body.daily_post_id !== undefined) updates.daily_post_id = body.daily_post_id;
    if (typeof body.status === 'string') {
      if (!ALLOWED_STATUS.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('content_calendar_items')
      .update(updates)
      .eq('id', itemId)
      .select(ITEM_SELECT)
      .single();
    if (updErr) throw updErr;

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error('[DailyLeads Calendar PATCH]', err);
    return NextResponse.json({ error: 'Failed to update item.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
