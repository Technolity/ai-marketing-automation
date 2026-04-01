/**
 * Get Connected Social Media Accounts
 * Returns info about connected X, Instagram, and Facebook accounts
 */

import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve workspace (for multi-tenant support)
    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return Response.json({ error: workspaceError }, { status: 403 });
    }

    // Get all connected auth tokens
    const { data: tokens, error } = await supabaseAdmin
      .from('social_auth_tokens')
      .select('platform, account_username, account_id, connected_at')
      .eq('user_id', workspaceId);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('[Connected Accounts] Found tokens:', tokens?.map(t => t.platform) || []);

    // Organize by platform
    const accounts = {
      x: null,
      instagram: null,
      facebook: null
    };

    const connected = [];

    if (tokens && tokens.length > 0) {
      for (const token of tokens) {
        accounts[token.platform] = {
          username: token.account_username,
          account_id: token.account_id,
          connected_at: token.connected_at
        };
        connected.push(token.platform);
      }
    }

    console.log('[Connected Accounts] Returning:', { connected, platforms: Object.keys(accounts).filter(k => accounts[k]) });

    return Response.json({
      success: true,
      accounts,
      connected,
      platforms: {
        x: !!accounts.x,
        instagram: !!accounts.instagram,
        facebook: !!accounts.facebook
      }
    });
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
