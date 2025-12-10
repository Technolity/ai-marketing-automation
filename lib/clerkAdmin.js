/**
 * Clerk Admin Helper
 * Manages admin status via Clerk Organizations
 *
 * Usage:
 *   import { isUserAdmin, syncAdminStatus } from '@/lib/clerkAdmin';
 *
 *   const isAdmin = await isUserAdmin(clerkUserId);
 *   await syncAdminStatus(clerkUserId, true);
 */

import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Check if user is a member of the Admins organization
 *
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<boolean>} true if user is admin
 */
export async function isUserAdmin(clerkUserId) {
  try {
    // Get all organization memberships for the user
    const orgMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId: clerkUserId
    });

    // Get admin organization name from env
    const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';

    // Check if user is admin in the Admins organization
    const isAdmin = orgMemberships.some(membership =>
      membership.organization.name === adminOrgName &&
      membership.role === 'admin'
    );

    console.log(`[ClerkAdmin] User ${clerkUserId} admin status:`, isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('[ClerkAdmin] Error checking admin status:', error);
    return false;
  }
}

/**
 * Sync admin status to database and Clerk metadata
 * Call this when organization membership changes
 *
 * @param {string} clerkUserId - Clerk user ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<boolean>} true if synced successfully
 */
export async function syncAdminStatus(clerkUserId, isAdmin) {
  try {
    console.log(`[ClerkAdmin] Syncing admin status for ${clerkUserId}:`, isAdmin);

    // Update database
    const { error: dbError } = await supabase
      .from('user_profiles')
      .update({
        is_admin: isAdmin,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerkUserId);

    if (dbError) {
      console.error('[ClerkAdmin] Database update error:', dbError);
      return false;
    }

    // Update Clerk publicMetadata
    // This allows instant access to admin status without database query
    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        isAdmin,
        updatedAt: new Date().toISOString()
      }
    });

    console.log(`[ClerkAdmin] Admin status synced successfully for ${clerkUserId}`);
    return true;
  } catch (error) {
    console.error('[ClerkAdmin] Error syncing admin status:', error);
    return false;
  }
}

/**
 * Get all admins from the Admins organization
 *
 * @returns {Promise<Array<{userId: string, email: string, name: string}>>}
 */
export async function getAllAdmins() {
  try {
    const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';

    // Get all organizations
    const organizations = await clerkClient.organizations.getOrganizationList();

    // Find the Admins organization
    const adminOrg = organizations.find(org => org.name === adminOrgName);

    if (!adminOrg) {
      console.log(`[ClerkAdmin] Admins organization "${adminOrgName}" not found`);
      return [];
    }

    // Get all members of the Admins organization
    const members = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: adminOrg.id
    });

    // Filter for admin role only
    const admins = members
      .filter(member => member.role === 'admin')
      .map(member => ({
        userId: member.publicUserData.userId,
        email: member.publicUserData.identifier,
        name: `${member.publicUserData.firstName || ''} ${member.publicUserData.lastName || ''}`.trim()
      }));

    console.log(`[ClerkAdmin] Found ${admins.length} admins in organization`);
    return admins;
  } catch (error) {
    console.error('[ClerkAdmin] Error getting all admins:', error);
    return [];
  }
}

/**
 * Add user to Admins organization (make them admin)
 *
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<boolean>} true if added successfully
 */
export async function makeUserAdmin(clerkUserId) {
  try {
    const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';

    // Get all organizations
    const organizations = await clerkClient.organizations.getOrganizationList();

    // Find the Admins organization
    const adminOrg = organizations.find(org => org.name === adminOrgName);

    if (!adminOrg) {
      console.error(`[ClerkAdmin] Admins organization "${adminOrgName}" not found`);
      console.log('[ClerkAdmin] Please create the organization in Clerk Dashboard');
      return false;
    }

    // Add user to organization with admin role
    await clerkClient.organizations.createOrganizationMembership({
      organizationId: adminOrg.id,
      userId: clerkUserId,
      role: 'admin'
    });

    // Sync admin status
    await syncAdminStatus(clerkUserId, true);

    console.log(`[ClerkAdmin] User ${clerkUserId} added to Admins organization`);
    return true;
  } catch (error) {
    console.error('[ClerkAdmin] Error making user admin:', error);
    return false;
  }
}

/**
 * Remove user from Admins organization (revoke admin access)
 *
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<boolean>} true if removed successfully
 */
export async function revokeAdminAccess(clerkUserId) {
  try {
    const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';

    // Get user's organization memberships
    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId: clerkUserId
    });

    // Find membership in Admins organization
    const adminMembership = memberships.find(
      membership => membership.organization.name === adminOrgName
    );

    if (!adminMembership) {
      console.log(`[ClerkAdmin] User ${clerkUserId} is not in Admins organization`);
      return true; // Already not an admin
    }

    // Remove from organization
    await clerkClient.organizationMemberships.deleteOrganizationMembership({
      organizationMembershipId: adminMembership.id
    });

    // Sync admin status
    await syncAdminStatus(clerkUserId, false);

    console.log(`[ClerkAdmin] User ${clerkUserId} removed from Admins organization`);
    return true;
  } catch (error) {
    console.error('[ClerkAdmin] Error revoking admin access:', error);
    return false;
  }
}

/**
 * Check if Admins organization exists
 *
 * @returns {Promise<boolean>}
 */
export async function checkAdminOrganizationExists() {
  try {
    const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';
    const organizations = await clerkClient.organizations.getOrganizationList();
    const exists = organizations.some(org => org.name === adminOrgName);

    if (!exists) {
      console.warn(`[ClerkAdmin] Admins organization "${adminOrgName}" does not exist`);
      console.log('[ClerkAdmin] Please create it in Clerk Dashboard → Organizations');
    }

    return exists;
  } catch (error) {
    console.error('[ClerkAdmin] Error checking organization:', error);
    return false;
  }
}
