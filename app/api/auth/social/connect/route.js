/**
 * GET /api/auth/social/connect?platform=instagram
 * Generates a PostForMe OAuth URL and redirects the user to connect their account
 */

import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { generateAuthUrl } from '@/lib/social/postForMeClient';

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return new Response(workspaceError, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    const validPlatforms = ['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube', 'threads', 'pinterest'];
    if (!platform || !validPlatforms.includes(platform)) {
      return new Response(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`, { status: 400 });
    }

    // Optional Instagram connection_type override: 'instagram' (default) or 'facebook'.
    const connectionType = searchParams.get('connection_type') || undefined;

    const { url } = await generateAuthUrl(platform, workspaceId, { connectionType });

    // Redirect user to PostForMe OAuth URL
    return new Response(null, {
      status: 302,
      headers: { 'Location': url },
    });
  } catch (error) {
    console.error('[Social Connect] Error:', error.message);
    console.error('[Social Connect] PFM response body:', JSON.stringify(error.body));
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/dashboard/daily-leads?error=connect_failed&message=${encodeURIComponent(error.message)}`,
      },
    });
  }
}

export const dynamic = 'force-dynamic';
