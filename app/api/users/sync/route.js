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

    // User doesn't exist by ID - check if email already exists (Clerk dashboard user case)
    if (email) {
      const { data: existingUserByEmail, error: fetchByEmailError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchByEmailError && fetchByEmailError.code !== 'PGRST116') {
        console.error('[User Sync API] Error fetching user by email:', fetchByEmailError);
      }

      // If email exists, update the ID to the new Clerk user ID (handles Clerk dashboard users)
      if (existingUserByEmail) {
        console.log('[User Sync API] Email exists with different ID, updating ID to new Clerk user...');

        const { error: updateIdError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            id: userId,
            full_name: fullName || existingUserByEmail.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);

        if (updateIdError) {
          console.error('[User Sync API] Error updating user ID:', updateIdError);
          throw updateIdError;
        }

        console.log('[User Sync API] User ID updated for existing email');
        return NextResponse.json({
          success: true,
          message: 'User updated',
          user: { ...existingUserByEmail, id: userId, full_name: fullName }
        });
      }
    }

    // Create new user - no existing profile by ID or email
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
