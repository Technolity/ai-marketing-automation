/**
 * GET /api/social/connected-accounts
 * Returns connected social accounts via Post for Me API
 */

import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { getConnectedAccounts } from '@/lib/social/postForMeClient';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return Response.json({ error: workspaceError }, { status: 403 });
    }

    const accounts = await getConnectedAccounts(workspaceId);

    // Build response compatible with existing SocialPostModal format
    const accountMap = { x: null, instagram: null, facebook: null };
    const connected = [];

    for (const account of accounts) {
      const platform = account.platform;
      if (platform in accountMap) {
        accountMap[platform] = {
          id: account.id,           // spc_... PostForMe ID
          username: account.username,
          profile_photo_url: account.profile_photo_url,
          connected_at: account.created_at,
        };
        connected.push(platform);
      }
    }

    return Response.json({
      success: true,
      accounts: accountMap,
      connected,
      platforms: {
        x: !!accountMap.x,
        instagram: !!accountMap.instagram,
        facebook: !!accountMap.facebook,
      },
    });
  } catch (error) {
    console.error('[Connected Accounts] Error:', error.message);
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}

export const dynamic = 'force-dynamic';
