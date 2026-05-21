import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export async function GET(req) {
  const { userId } = await auth();
  if (!userId || !(await verifyAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const page   = parseInt(searchParams.get('page') || '1');
  const limit  = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('feedback_reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Admin Feedback GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data, total: count, page, limit });
}

export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId || !(await verifyAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status, admin_note } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update = { status };
  if (admin_note !== undefined) update.admin_note = admin_note;
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString();
    update.resolved_by = userId;
  }

  const { data, error } = await supabaseAdmin
    .from('feedback_reports')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Admin Feedback PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}

export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId || !(await verifyAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Delete images from storage first
  const { data: report } = await supabaseAdmin
    .from('feedback_reports')
    .select('image_urls')
    .eq('id', id)
    .single();

  if (report?.image_urls?.length > 0) {
    const paths = report.image_urls.map((url) => {
      const parts = url.split('/feedback-images/');
      return parts[1] || '';
    }).filter(Boolean);

    if (paths.length > 0) {
      await supabaseAdmin.storage.from('feedback-images').remove(paths);
    }
  }

  const { error } = await supabaseAdmin
    .from('feedback_reports')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Admin Feedback DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
