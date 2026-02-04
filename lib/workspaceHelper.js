/**
 * Workspace Access Helper
 * 
 * Validates and resolves workspace access for team member scenarios.
 * Used by API routes to determine which user's data to fetch/modify.
 */

import { supabase } from '@/lib/supabaseServiceRole';

/**
 * Validates if a user has access to a target workspace
 * @param {string} authUserId - The authenticated user's ID
 * @param {string} targetWorkspaceId - The workspace/owner ID to access
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateWorkspaceAccess(authUserId, targetWorkspaceId) {
    console.log(`[WorkspaceHelper] Validating access: authUser=${authUserId}, target=${targetWorkspaceId}`);

    // Same user - always allowed
    if (authUserId === targetWorkspaceId) {
        console.log('[WorkspaceHelper] Same user, access granted');
        return { valid: true };
    }

    // Check if authUser is a team member of targetWorkspaceId
    const { data: seat, error } = await supabase
        .from('organization_seats')
        .select('id, status')
        .eq('seat_user_id', authUserId)
        .eq('owner_user_id', targetWorkspaceId)
        .eq('status', 'active')
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[WorkspaceHelper] Database error:', error);
        return { valid: false, error: 'Failed to validate access' };
    }

    if (seat) {
        console.log('[WorkspaceHelper] Valid team member access');
        return { valid: true };
    }

    console.log('[WorkspaceHelper] Access denied - not a team member');
    return { valid: false, error: 'You do not have access to this workspace' };
}

/**
 * Resolves the effective workspace ID for a request
 * @param {string} authUserId - The authenticated user's ID
 * @param {string|null} requestedWorkspaceId - Optional workspace ID from request
 * @returns {Promise<{workspaceId: string, isTeamMember: boolean, error?: string}>}
 */
export async function resolveWorkspace(authUserId, requestedWorkspaceId = null) {
    console.log(`[WorkspaceHelper] Resolving workspace: authUser=${authUserId}, requested=${requestedWorkspaceId}`);

    // If specific workspace requested, validate access
    if (requestedWorkspaceId && requestedWorkspaceId !== authUserId) {
        const access = await validateWorkspaceAccess(authUserId, requestedWorkspaceId);
        if (!access.valid) {
            return { workspaceId: null, isTeamMember: false, error: access.error };
        }
        return { workspaceId: requestedWorkspaceId, isTeamMember: true };
    }

    // Check if user is a team member (should use owner's workspace)
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, role_owner_id')
        .eq('id', authUserId)
        .single();

    if (profile?.role === 'team_member' && profile?.role_owner_id) {
        console.log(`[WorkspaceHelper] User is team_member, using owner workspace: ${profile.role_owner_id}`);
        return { workspaceId: profile.role_owner_id, isTeamMember: true };
    }

    // Default: use own workspace
    console.log('[WorkspaceHelper] Using own workspace');
    return { workspaceId: authUserId, isTeamMember: false };
}

/**
 * Gets user role and workspace info
 * @param {string} userId - The user's ID
 * @returns {Promise<{role: string, ownerId: string|null, workspaceId: string}>}
 */
export async function getUserWorkspaceInfo(userId) {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, role_owner_id')
        .eq('id', userId)
        .single();

    const role = profile?.role || 'owner';
    const ownerId = profile?.role_owner_id || null;
    const workspaceId = role === 'team_member' && ownerId ? ownerId : userId;

    return { role, ownerId, workspaceId };
}
