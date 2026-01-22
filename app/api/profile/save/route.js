/**
 * Profile Save API
 * Saves user profile data and creates GHL sub-account via OAuth
 *
 * POST /api/profile/save
 * Body: { firstName, lastName, businessName, phone, countryCode, address, city, state, postalCode, country, timezone }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount } from '@/lib/integrations/ghl';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  try {
    // 1. Verify authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const {
      firstName,
      lastName,
      businessName,
      phone,
      countryCode,
      address,
      city,
      state,
      postalCode,
      country,
      timezone
    } = body;

    // 3. Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({
        error: 'First name and last name are required'
      }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({
        error: 'Address is required'
      }, { status: 400 });
    }

    // 4. Get user profile to get email and GHL status
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('email, ghl_setup_triggered_at')
      .eq('id', userId)
      .single();

    if (fetchError || !existingProfile) {
      console.error('[Profile Save] User profile not found:', fetchError);
      return NextResponse.json({
        error: 'User profile not found'
      }, { status: 404 });
    }

    const email = existingProfile.email;
    const fullName = `${firstName} ${lastName}`.trim();

    // 5. Update user profile in database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        business_name: businessName || null,
        phone: phone || null,
        country_code: countryCode || null,
        address: address,
        city: city || null,
        state: state || null,
        postal_code: postalCode || null,
        country: country || null,
        timezone: timezone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Profile Save] Database update error:', updateError);
      return NextResponse.json({
        error: 'Failed to save profile',
        details: updateError.message
      }, { status: 500 });
    }

    console.log(`[Profile Save] Profile updated successfully for user: ${email}`);

    // 6. Create GHL sub-account via OAuth (Only if not already created)
    if (!existingProfile.ghl_setup_triggered_at) {
      console.log(`[Profile Save] Creating GHL sub-account for user...`);

      // Set flag BEFORE calling GHL to prevent race condition
      const triggeredAt = new Date().toISOString();
      await supabase
        .from('user_profiles')
        .update({ ghl_setup_triggered_at: triggeredAt })
        .eq('id', userId);

      console.log(`[Profile Save] Flag set at ${triggeredAt}, now creating sub-account...`);

      // Get snapshot ID from environment
      const snapshotId = process.env.GHL_SNAPSHOT_ID;
      if (snapshotId) {
        console.log(`[Profile Save] Will include snapshot ${snapshotId} in sub-account creation`);
      }

      try {
        const ghlResult = await createGHLSubAccount({
          userId: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          businessName: businessName || `${firstName}'s Business`,
          address: address,
          city: city,
          state: state,
          postalCode: postalCode,
          country: country,
          timezone: timezone,
          snapshotId: snapshotId  // Include snapshot during creation
        });

        if (ghlResult.success) {
          console.log(`[Profile Save] GHL sub-account created: ${ghlResult.locationId}`);
          if (snapshotId) {
            console.log(`[Profile Save] Snapshot was included during sub-account creation`);
          }
        } else {
          console.error(`[Profile Save] GHL sub-account creation failed:`, ghlResult.error);
          // Clear the flag to allow retry on next profile save
          await supabase
            .from('user_profiles')
            .update({ ghl_setup_triggered_at: null })
            .eq('id', userId);
          console.log(`[Profile Save] Flag cleared to allow retry`);
        }
      } catch (ghlError) {
        console.error('[Profile Save] GHL error:', ghlError);
        // Clear the flag to allow retry
        await supabase
          .from('user_profiles')
          .update({ ghl_setup_triggered_at: null })
          .eq('id', userId);
      }
    } else {
      console.log(`[Profile Save] GHL sub-account already exists - skipped`);
    }

    // 7. Auto-create GHL User if enabled (after subaccount creation)
    try {
      // Check if auto-create is enabled
      const { data: autoCreateSetting } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'ghl_auto_create_users')
        .single();

      const autoCreateEnabled = autoCreateSetting?.setting_value?.enabled || false;

      if (autoCreateEnabled) {
        console.log(`[Profile Save] Auto-create is ENABLED - checking if GHL user needed`);

        // Get user's subaccount to check if it exists and if user already created
        const { data: subaccount } = await supabase
          .from('ghl_subaccounts')
          .select('location_id, ghl_user_created, ghl_user_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (subaccount && !subaccount.ghl_user_created) {
          console.log(`[Profile Save] Subaccount exists, GHL user not created yet - creating...`);

          // Import and use helper function for better error handling
          const { createGHLUserForUser } = await import('@/lib/ghl/createUser');

          // Call asynchronously (don't block the profile save response)
          createGHLUserForUser(userId, 'profile-save')
            .then((result) => {
              if (result.success) {
                console.log(`[Profile Save] ✅ GHL user created: ${result.ghlUserId}`);
              } else {
                console.error(`[Profile Save] ❌ GHL user creation failed:`, result.error);
              }
            })
            .catch(err => {
              console.error(`[Profile Save] ❌ Error in GHL user creation:`, err.message);
            });

          console.log(`[Profile Save] GHL user creation initiated (async)`);
        } else if (subaccount && subaccount.ghl_user_created) {
          console.log(`[Profile Save] GHL user already created - skipped`);
        } else {
          console.log(`[Profile Save] No active subaccount found - GHL user creation skipped`);
        }
      } else {
        console.log(`[Profile Save] Auto-create is DISABLED - manual creation required`);
      }
    } catch (autoCreateError) {
      // Don't fail the profile save if auto-create check fails
      console.error('[Profile Save] Auto-create check error:', autoCreateError.message);
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully'
    });

  } catch (error) {
    console.error('[Profile Save] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
