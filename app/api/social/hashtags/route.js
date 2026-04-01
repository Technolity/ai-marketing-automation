/**
 * POST /api/social/hashtags
 * Generates platform-optimized hashtags
 */

import { auth } from '@clerk/nextjs/server';
import { generateHashtagsForPlatforms } from '@/lib/social/hashtags';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, platforms } = await req.json();

    if (!description || !platforms || !Array.isArray(platforms)) {
      return Response.json(
        { error: 'Missing description or platforms' },
        { status: 400 }
      );
    }

    // Generate hashtags for each platform
    const hashtags = await generateHashtagsForPlatforms(description, platforms);

    return Response.json({ hashtags });
  } catch (error) {
    console.error('Hashtag generation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
