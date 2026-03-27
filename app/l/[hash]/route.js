import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// GET /l/[hash] — public smart link redirect with click tracking
export async function GET(req, { params }) {
  const { hash } = params;

  if (!hash) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('smart_links')
      .select('id, destination_url, clicks')
      .eq('short_hash', hash)
      .single();

    if (error || !data) {
      // Unknown hash — redirect to homepage
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Atomically increment clicks (fire-and-forget, don't block redirect)
    supabaseAdmin
      .from('smart_links')
      .update({ clicks: data.clicks + 1 })
      .eq('id', data.id)
      .then(() => {})
      .catch(err => console.error('[SmartLink] Click increment failed:', err.message));

    return NextResponse.redirect(data.destination_url, { status: 302 });
  } catch (err) {
    console.error('[SmartLink Redirect]', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
