/**
 * Unified Authentication Helper
 * Supports both DEV MODE (mock users) and PRODUCTION MODE (Clerk)
 *
 * Usage:
 *   import { requireAuth, requireAdmin } from '@/lib/auth';
 *
 *   const { userId, isAdmin, profile } = await requireAuth(req);
 *   const adminUser = await requireAdmin(req);
 */

import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Check if dev mode is enabled
const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

/**
 * Get authenticated user from request
 * Supports both dev mode (X-User-ID header) and Clerk (session)
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<{userId: string, isAdmin: boolean, profile: object} | null>}
 */
export async function getAuthenticatedUser(req) {
  let userId = null;
  let useClerkId = false;

  // DEV MODE: Extract from X-User-ID header
  if (isDevMode()) {
    userId = req.headers.get('x-user-id') || req.headers.get('X-User-ID');

    if (!userId) {
      console.log('[Auth] Dev mode: No X-User-ID header found');
      return null;
    }

    console.log('[Auth] Dev mode: Using user ID from header:', userId);
  }
  // PRODUCTION: Use Clerk
  else {
    try {
      const auth = getAuth(req);

      if (!auth.userId) {
        console.log('[Auth] Clerk mode: No userId in session');
        return null;
      }

      userId = auth.userId;
      useClerkId = true;
      console.log('[Auth] Clerk mode: Using Clerk user ID:', userId);
    } catch (error) {
      console.error('[Auth] Error getting Clerk auth:', error);
      return null;
    }
  }

  // Fetch user profile from database
  const column = useClerkId ? 'clerk_id' : 'id';
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq(column, userId)
    .maybeSingle();

  if (error) {
    console.error('[Auth] Database error fetching profile:', error);

    // If Clerk user not synced yet, try to sync on-demand
    if (useClerkId && userId) {
      console.log('[Auth] Attempting on-demand user sync for:', userId);
      const synced = await ensureUserSynced(userId);

      if (synced) {
        // Retry query after sync
        const { data: retryProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('clerk_id', userId)
          .maybeSingle();

        if (retryProfile) {
          return {
            userId: retryProfile.clerk_id || retryProfile.id,
            isAdmin: retryProfile.is_admin || false,
            profile: retryProfile
          };
        }
      }
    }

    return null;
  }

  if (!profile) {
    console.log('[Auth] No profile found for user ID:', userId);
    return null;
  }

  return {
    userId: profile.clerk_id || profile.id,
    isAdmin: profile.is_admin || false,
    profile
  };
}

/**
 * Require authenticated user (throws error if not authenticated)
 * Use this for user-facing API routes that require login
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<{userId: string, isAdmin: boolean, profile: object}>}
 * @throws {Error} 'Unauthorized' if not authenticated
 */
export async function requireAuth(req) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Require admin user (throws error if not admin)
 * Use this for admin-only API routes
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<{userId: string, isAdmin: boolean, profile: object}>}
 * @throws {Error} 'Unauthorized' if not authenticated, 'Forbidden' if not admin
 */
export async function requireAdmin(req) {
  const user = await requireAuth(req);

  if (!user.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

/**
 * On-demand user sync (fallback if webhook missed)
 * Fetches user from Clerk and creates profile in database
 *
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<boolean>} true if synced successfully
 */
async function ensureUserSynced(clerkUserId) {
  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .maybeSingle();

    if (existing) {
      console.log('[Auth] User already synced:', clerkUserId);
      return true;
    }

    // Fetch user from Clerk
    console.log('[Auth] Fetching user from Clerk:', clerkUserId);
    const user = await clerkClient.users.getUser(clerkUserId);

    if (!user) {
      console.error('[Auth] User not found in Clerk:', clerkUserId);
      return false;
    }

    // Check if user is admin (member of Admins org)
    const isAdmin = await isUserAdmin(clerkUserId);

    // Insert into database
    console.log('[Auth] Creating user profile for:', user.emailAddresses[0]?.emailAddress);
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        clerk_id: clerkUserId,
        email: user.emailAddresses[0]?.emailAddress,
        full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        avatar_url: user.imageUrl,
        is_admin: isAdmin,
        subscription_tier: 'starter',
        max_funnels: 1
      });

    if (insertError) {
      console.error('[Auth] Error inserting user profile:', insertError);
      return false;
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        isAdmin
      }
    });

    console.log('[Auth] User synced successfully:', clerkUserId);
    return true;
  } catch (error) {
    console.error('[Auth] Error syncing user:', error);
    return false;
  }
}

/**
 * Check if user is member of Admins organization
 *
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<boolean>}
 */
async function isUserAdmin(clerkUserId) {
  try {
    const orgMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId: clerkUserId
    });

    const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';

    return orgMemberships.some(membership =>
      membership.organization.name === adminOrgName &&
      membership.role === 'admin'
    );
  } catch (error) {
    console.error('[Auth] Error checking admin status:', error);
    return false;
  }
}

/**
 * Get user ID from request (convenience function)
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<string | null>}
 */
export async function getUserId(req) {
  const user = await getAuthenticatedUser(req);
  return user ? user.userId : null;
}

/**
 * Check if user is admin (convenience function)
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<boolean>}
 */
export async function isAdmin(req) {
  const user = await getAuthenticatedUser(req);
  return user ? user.isAdmin : false;
}
