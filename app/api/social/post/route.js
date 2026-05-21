/**
 * POST /api/social/post
 * Posts to one or more social platforms via Post for Me API
 *
 * Body:
 *   platforms    string[]  - ['instagram', 'facebook', 'x']
 *   caption      string    - Post caption/text
 *   imageUrl     string    - Public image URL
 *   daily_post_id string   - Optional: mark daily post as posted on success
 */

import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import {
  getConnectedAccounts,
  uploadMediaFromUrl,
  createPost,
} from '@/lib/social/postForMeClient';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return Response.json({ error: workspaceError }, { status: 403 });
    }

    const { platforms, caption, imageUrl, daily_post_id } = await req.json();

    if (!platforms?.length || !caption || !imageUrl) {
      return Response.json(
        { error: 'Missing required fields: platforms, caption, imageUrl' },
        { status: 400 }
      );
    }

    // Get connected accounts for this workspace
    const accounts = await getConnectedAccounts(workspaceId);

    // Match requested platforms to connected account IDs
    const accountIds = [];
    const notConnected = [];

    for (const platform of platforms) {
      const account = accounts.find(a => a.platform === platform);
      if (account) {
        accountIds.push(account.id);
      } else {
        notConnected.push(platform);
      }
    }

    if (accountIds.length === 0) {
      return Response.json(
        { error: `None of the requested platforms are connected: ${notConnected.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload image to PostForMe CDN
    let mediaUrl = imageUrl;
    try {
      mediaUrl = await uploadMediaFromUrl(imageUrl);
    } catch (uploadError) {
      console.error('[Social Post] Image upload failed, using original URL:', uploadError.message);
      // Fall back to passing the original URL directly
    }

    // Build per-platform caption overrides (X has 280 char limit)
    const platformConfigs = {};
    if (platforms.includes('x') && caption.length > 280) {
      platformConfigs.x = {
        caption: caption.substring(0, 277) + '...',
      };
    }

    // Post to all selected platforms in one call
    const result = await createPost({
      accountIds,
      caption,
      mediaUrl,
      platformConfigs,
      externalId: daily_post_id,
    });

    // Mark daily post as posted if provided
    if (daily_post_id) {
      await supabaseAdmin
        .from('daily_posts')
        .update({ status: 'posted', posted_at: new Date() })
        .eq('id', daily_post_id)
        .catch(err => console.error('[Social Post] Failed to mark post:', err.message));
    }

    return Response.json({
      success: true,
      post_id: result.data?.id || result.id,
      platforms_posted: platforms.filter(p => !notConnected.includes(p)),
      platforms_skipped: notConnected,
    });
  } catch (error) {
    console.error('[Social Post] Error:', error.message, error.body);
    return Response.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
