/**
 * POST /api/social/hashtags
 *
 * Generates platform-optimised hashtags for given platforms.
 * Used by SocialPostModal to pre-populate hashtag fields.
 *
 * Body: { description: string, platforms: string[] }
 * Returns: { hashtags: { twitter: "...", instagram: "...", ... } }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateHashtagsForPlatforms } from '@/lib/social/hashtags';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { description, platforms } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'description is required.' }, { status: 400 });
    }

    const validPlatforms = ['twitter', 'instagram', 'facebook'];
    const filtered = (platforms || []).filter(p => validPlatforms.includes(p));
    if (!filtered.length) {
      return NextResponse.json({ error: 'At least one valid platform is required.' }, { status: 400 });
    }

    const hashtags = await generateHashtagsForPlatforms(description.slice(0, 300), filtered);
    return NextResponse.json({ hashtags });
  } catch (err) {
    console.error('[Social Hashtags]', err);
    return NextResponse.json({ error: 'Failed to generate hashtags.' }, { status: 500 });
  }
}
