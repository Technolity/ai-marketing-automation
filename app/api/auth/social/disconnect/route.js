/**
 * POST /api/auth/social/disconnect
 * Disconnects a social account via Post for Me API
 * Body: { platform: 'instagram' | 'facebook' | 'x' }
 */

import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { getConnectedAccounts, disconnectAccount } from '@/lib/social/postForMeClient';

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

    const { platform } = await req.json();
    if (!platform) {
      return Response.json({ error: 'Missing platform' }, { status: 400 });
    }

    // Find the account ID for this platform + workspace
    const accounts = await getConnectedAccounts(workspaceId);
    const account = accounts.find(a => a.platform === platform);

    if (!account) {
      return Response.json({ error: `No connected ${platform} account found` }, { status: 404 });
    }

    await disconnectAccount(account.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error('[Social Disconnect] Error:', error.message);
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}

export const dynamic = 'force-dynamic';
