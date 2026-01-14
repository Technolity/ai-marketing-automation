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

      console.log('[User Sync API] User updated successfully');
      return NextResponse.json({
        success: true,
        message: 'User updated',
        user: { ...existingUserById, email, full_name: fullName }
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

      // If email exists with different ID (Clerk dashboard user case)
      if (existingUserByEmail) {
        console.log('[User Sync API] Email exists with different Clerk ID');
        console.log('[User Sync API] Old ID:', existingUserByEmail.id, 'New ID:', userId);

        // Clean up old foreign key references first
        const oldUserId = existingUserByEmail.id;

        // Delete related records that block the update
        console.log('[User Sync API] Cleaning up old foreign key references...');

        // Delete from ghl_subaccount_logs
        await supabaseAdmin
          .from('ghl_subaccount_logs')
          .delete()
          .eq('user_id', oldUserId);

        // Delete from slide_results
        await supabaseAdmin
          .from('slide_results')
          .delete()
          .eq('user_id', oldUserId);

        // Delete from intake_answers
        await supabaseAdmin
          .from('intake_answers')
          .delete()
          .eq('user_id', oldUserId);

        // Delete from funnel_tracking
        await supabaseAdmin
          .from('funnel_tracking')
          .delete()
          .eq('user_id', oldUserId);

        // Delete from vault_content
        await supabaseAdmin
          .from('vault_content')
          .delete()
          .eq('user_id', oldUserId);

        // Delete from funnels
        await supabaseAdmin
          .from('funnels')
          .delete()
          .eq('user_id', oldUserId);

        // Now delete the old user profile
        const { error: deleteError } = await supabaseAdmin
          .from('user_profiles')
          .delete()
          .eq('id', oldUserId);

        if (deleteError) {
          console.error('[User Sync API] Error deleting old profile:', deleteError);
          // Continue anyway - try to create new profile
        } else {
          console.log('[User Sync API] Old profile and related data deleted');
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

    console.log('[User Sync API] User created successfully:', newUser.id);
    return NextResponse.json({
      success: true,
      message: 'User created',
      user: newUser
    });

  } catch (error) {
    console.error('[User Sync API] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to sync user'
    }, { status: 500 });
  }
}
