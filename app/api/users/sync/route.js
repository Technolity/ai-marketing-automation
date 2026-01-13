import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * API Route: /api/users/sync
 * Creates or updates user profile in Supabase when user logs in
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

    // Get user data from request body (optional - can also fetch from Clerk)
    const body = await req.json();
    const { email, fullName } = body;

    console.log('[User Sync API] User data:', { email, fullName });

    // Check if user already exists in Supabase (using user_profiles table)
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      console.error('[User Sync API] Error fetching user:', fetchError);
      throw fetchError;
    }

    if (existingUser) {
      console.log('[User Sync API] User already exists, updating...');

      // Update existing user
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          email: email || existingUser.email,
          full_name: fullName || existingUser.full_name,
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
        user: { ...existingUser, email, full_name: fullName }
      });
    }

    // Create new user
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
