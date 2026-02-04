import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * API Route: /api/users/sync
 * Creates or updates user profile in Supabase when user logs in
 * Handles users created directly in Clerk dashboard
 */
export async function POST(req) {
  try {
    console.log('[User Sync API] Sync request received');
    const { userId } = auth();

    if (!userId) {
      console.log('[User Sync API] No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[User Sync API] User ID:', userId);

    // Get user data from request body
    const body = await req.json();
    const { email, fullName } = body;

    console.log('[User Sync API] User data:', { email, fullName });

    // Check if user already exists by Clerk user ID
    const { data: existingUserById, error: fetchByIdError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchByIdError && fetchByIdError.code !== 'PGRST116') {
      console.error('[User Sync API] Error fetching user by ID:', fetchByIdError);
    }

    // If user exists by ID, just update
    if (existingUserById) {
      console.log('[User Sync API] User exists by ID, updating...');

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          email: email || existingUserById.email,
          full_name: fullName || existingUserById.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[User Sync API] Error updating user:', updateError);
        throw updateError;
      }

      const updatedUser = { ...existingUserById, email, full_name: fullName };

      const isComplete = !!(
        updatedUser.business_name &&
        updatedUser.address &&
        updatedUser.phone &&
        updatedUser.city &&
        updatedUser.country
      );

      console.log('[User Sync API] User updated. Profile complete:', isComplete, 'Role:', updatedUser.role);
      return NextResponse.json({
        success: true,
        message: 'User updated',
        user: updatedUser,
        isProfileComplete: isComplete,
        role: updatedUser.role || 'owner',
        roleOwnerId: updatedUser.role_owner_id || null
      });
    }

    // User doesn't exist by ID - check if email already exists
    if (email) {
      const { data: existingUserByEmail, error: fetchByEmailError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchByEmailError && fetchByEmailError.code !== 'PGRST116') {
        console.error('[User Sync API] Error fetching user by email:', fetchByEmailError);
      }

      // If email exists with different ID (Clerk dashboard user case or local dev)
      if (existingUserByEmail) {
        console.log('[User Sync API] Email exists with different Clerk ID');
        console.log('[User Sync API] Old ID:', existingUserByEmail.id, 'New ID:', userId);

        // Instead of deleting, UPDATE the Clerk ID on the existing profile
        // This preserves all user data when Clerk ID changes (e.g., local dev, re-auth)
        console.log('[User Sync API] Updating Clerk ID on existing profile (preserving data)...');

        const { error: updateIdError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUserByEmail.id);

        if (updateIdError) {
          console.error('[User Sync API] Error updating Clerk ID:', updateIdError);
          // If update fails (e.g., id conflict), continue to create new profile
        } else {
          console.log('[User Sync API] Clerk ID updated successfully, preserving all user data');

          // Also update foreign keys in related tables
          const tablesToUpdate = [
            'ghl_subaccount_logs', 'slide_results', 'intake_answers',
            'funnel_tracking', 'vault_content', 'funnels', 'saved_sessions',
            'ghl_subaccounts', 'ghl_oauth_logs'
          ];

          for (const table of tablesToUpdate) {
            await supabaseAdmin.from(table).update({ user_id: userId }).eq('user_id', existingUserByEmail.id);
          }

          const isComplete = !!(
            existingUserByEmail.business_name &&
            existingUserByEmail.address &&
            existingUserByEmail.phone &&
            existingUserByEmail.city &&
            existingUserByEmail.country
          );

          console.log('[User Sync API] Profile migrated. Complete:', isComplete, 'Role:', existingUserByEmail.role);
          return NextResponse.json({
            success: true,
            message: 'User migrated with new Clerk ID',
            user: { ...existingUserByEmail, id: userId },
            isProfileComplete: isComplete,
            role: existingUserByEmail.role || 'owner',
            roleOwnerId: existingUserByEmail.role_owner_id || null
          });
        }
      }
    }

    // Create new user profile
    console.log('[User Sync API] Creating new user profile...');

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: email || null,
        full_name: fullName || null,
        is_admin: false,
        subscription_tier: 'starter',
        max_funnels: 1,
        generation_count: 0,
        last_generation_at: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('[User Sync API] Error creating user:', insertError);

      // If still getting duplicate email error, try updating by email instead
      if (insertError.message?.includes('duplicate key')) {
        console.log('[User Sync API] Duplicate key - attempting update by email');

        const { error: fallbackUpdateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            id: userId,
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);

        if (fallbackUpdateError) {
          // Last resort - just return success to allow user to proceed
          console.error('[User Sync API] Fallback update failed:', fallbackUpdateError);
          return NextResponse.json({
            success: true,
            message: 'User sync partial - please contact support if issues persist',
            user: { id: userId, email }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'User updated via email fallback',
          user: { id: userId, email, full_name: fullName }
        });
      }

      throw insertError;
    }

    // Helper to check completeness
    const checkCompleteness = (u) => !!(
      u.business_name &&
      u.address &&
      u.phone &&
      u.city &&
      u.country
    );

    const isComplete = checkCompleteness(newUser || existingUserById || {});

    const finalUser = newUser || existingUserById || {};
    console.log('[User Sync API] User created/updated. Profile complete:', isComplete, 'Role:', finalUser.role);
    return NextResponse.json({
      success: true,
      message: 'User synced',
      user: finalUser,
      isProfileComplete: isComplete,
      role: finalUser.role || 'owner',
      roleOwnerId: finalUser.role_owner_id || null
    });

  } catch (error) {
    console.error('[User Sync API] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to sync user'
    }, { status: 500 });
  }
}
