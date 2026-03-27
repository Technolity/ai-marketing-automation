import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

const HASH_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789';
const HASH_LEN = 7;

function generateHash() {
  return Array.from({ length: HASH_LEN }, () =>
    HASH_CHARS[Math.floor(Math.random() * HASH_CHARS.length)]
  ).join('');
}

async function uniqueHash() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const hash = generateHash();
    const { data, error } = await supabaseAdmin
      .from('smart_links')
      .select('id')
      .eq('short_hash', hash)
      .maybeSingle();

    if (error) throw error;
    if (!data) return hash;
  }

  throw new Error('Could not generate unique hash after 10 attempts');
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return NextResponse.json({ error: workspaceError }, { status: 403 });
    }

    const { destination_url, post_id } = await req.json();
    if (!destination_url) {
      return NextResponse.json({ error: 'destination_url is required.' }, { status: 400 });
    }

    try {
      new URL(destination_url);
    } catch {
      return NextResponse.json({ error: 'Invalid destination URL.' }, { status: 400 });
    }

    if (post_id) {
      const { data: post, error: postError } = await supabaseAdmin
        .from('daily_posts')
        .select('id')
        .eq('id', post_id)
        .eq('user_id', workspaceId)
        .maybeSingle();

      if (postError) throw postError;
      if (!post) {
        return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
      }
    }

    const hash = await uniqueHash();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tedos.ai';

    const { data, error } = await supabaseAdmin
      .from('smart_links')
      .insert({
        user_id: workspaceId,
        post_id: post_id ?? null,
        short_hash: hash,
        destination_url,
      })
      .select()
      .single();

    if (error) throw error;

    if (post_id) {
      await supabaseAdmin
        .from('daily_posts')
        .update({ smart_link_id: data.id })
        .eq('id', post_id)
        .eq('user_id', workspaceId);
    }

    return NextResponse.json({
      smart_link: data,
      short_url: `${siteUrl}/l/${hash}`,
    });
  } catch (err) {
    console.error('[SmartLinks Create]', err);
    return NextResponse.json({ error: 'Failed to create smart link.' }, { status: 500 });
  }
}
