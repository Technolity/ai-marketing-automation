import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

const POST_SELECT = `
  id,
  image_url,
  caption,
  keyword,
  post_date,
  status,
  created_at,
  funnel_id,
  smart_links ( id, short_hash, clicks, destination_url )
`;

// GET /api/daily-leads/posts - list posts + aggregate metrics
export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return NextResponse.json({ error: workspaceError }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;

    const { data: posts, error: postsErr, count } = await supabaseAdmin
      .from('daily_posts')
      .select(POST_SELECT, { count: 'exact' })
      .eq('user_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsErr) throw postsErr;

    const { data: metrics, error: metricsErr } = await supabaseAdmin
      .from('daily_posts')
      .select('status, smart_links ( clicks )')
      .eq('user_id', workspaceId);

    if (metricsErr) throw metricsErr;

    const totalGenerated = metrics?.length ?? 0;
    const totalPublished = metrics?.filter(post => post.status === 'posted').length ?? 0;
    const totalClicks = metrics?.reduce((sum, post) => {
      const clicks = post.smart_links?.clicks ?? 0;
      return sum + clicks;
    }, 0) ?? 0;

    const today = new Date().toISOString().split('T')[0];
    const { data: quota, error: quotaErr } = await supabaseAdmin
      .from('post_generations_quota')
      .select('generation_count')
      .eq('user_id', workspaceId)
      .eq('quota_date', today)
      .maybeSingle();

    if (quotaErr) throw quotaErr;

    const used = quota?.generation_count ?? 0;

    return NextResponse.json({
      posts: posts ?? [],
      pagination: { page, limit, total: count ?? 0 },
      metrics: { totalGenerated, totalPublished, totalClicks },
      quota: { used, limit: 10, remaining: Math.max(0, 10 - used) },
    });
  } catch (err) {
    console.error('[DailyLeads Posts GET]', err);
    return NextResponse.json({ error: 'Failed to load posts.' }, { status: 500 });
  }
}

// PATCH /api/daily-leads/posts - update caption and/or status
export async function PATCH(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return NextResponse.json({ error: workspaceError }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || body.post_id;
    const status = body.status;
    const caption = typeof body.caption === 'string' ? body.caption.trim() : undefined;

    if (!id || (status === undefined && caption === undefined)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const updates = {};
    if (status !== undefined) {
      if (!['draft', 'posted'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }
      updates.status = status;
    }

    if (caption !== undefined) {
      if (!caption) {
        return NextResponse.json({ error: 'Caption cannot be empty.' }, { status: 400 });
      }
      updates.caption = caption;
    }

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('daily_posts')
      .select('id')
      .eq('id', id)
      .eq('user_id', workspaceId)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (!existing) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('daily_posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', workspaceId)
      .select(POST_SELECT)
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ post: updated });
  } catch (err) {
    console.error('[DailyLeads Posts PATCH]', err);
    return NextResponse.json({ error: 'Failed to update post.' }, { status: 500 });
  }
}

// DELETE /api/daily-leads/posts?id=xxx
export async function DELETE(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return NextResponse.json({ error: workspaceError }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('daily_posts')
      .select('id, image_url')
      .eq('id', id)
      .eq('user_id', workspaceId)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (!existing) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    if (existing.image_url?.includes('daily-post-images')) {
      const path = existing.image_url.split('daily-post-images/')[1];
      if (path) {
        await supabaseAdmin.storage
          .from('daily-post-images')
          .remove([path])
          .catch(() => {});
      }
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('daily_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', workspaceId);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DailyLeads Posts DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete post.' }, { status: 500 });
  }
}
