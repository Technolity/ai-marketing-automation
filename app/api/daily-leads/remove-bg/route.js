import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    if (!process.env.REMOVE_BG_API_KEY) {
      return NextResponse.json({ error: 'Background removal is not configured.' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : null;
    if (!imageUrl) return NextResponse.json({ error: 'image_url is required.' }, { status: 400 });

    // Call remove.bg API
    const removeBgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl, size: 'auto' }),
    });

    if (!removeBgRes.ok) {
      const err = await removeBgRes.json().catch(() => ({}));
      const message = err?.errors?.[0]?.title || `remove.bg returned ${removeBgRes.status}`;
      return NextResponse.json({ error: message }, { status: removeBgRes.status });
    }

    // Response is raw PNG binary with transparency
    const pngBuffer = Buffer.from(await removeBgRes.arrayBuffer());

    // Save to Supabase storage alongside the original
    const filename = `${workspaceId}/${Date.now()}-nobg.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('daily-post-images')
      .upload(filename, pngBuffer, { contentType: 'image/png', upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('daily-post-images')
      .getPublicUrl(filename);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('[RemoveBG]', err);
    return NextResponse.json({ error: 'Background removal failed.' }, { status: 500 });
  }
}
