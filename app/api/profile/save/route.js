/**
 * Profile Save API
 * Saves user profile data and triggers Pabbly automation
 *
 * POST /api/profile/save
 * Body: { firstName, lastName, businessName, phone, countryCode, address, city, state, postalCode, country, timezone }
 *
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   error?: string
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { triggerPabblyAutomation } from '@/lib/integrations/pabbly';

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

    // 6. Trigger Pabbly automation (Only if not already triggered)
    if (!existingProfile.ghl_setup_triggered_at) {
      console.log(`[Profile Save] Triggering Pabbly automation for the first time...`);
      try {
        const pabblyResult = await triggerPabblyAutomation({
          clerkId: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          countryCode: countryCode,
          businessName: businessName || `${firstName}'s Business`,
          address: address,
          city: city,
          state: state,
          postalCode: postalCode,
          country: country,
          timezone: timezone
        });

        if (pabblyResult.success) {
          console.log(`[Profile Save] Pabbly automation triggered successfully for: ${email}`);

          // Mark as triggered to prevent duplicates
          await supabase
            .from('user_profiles')
            .update({ ghl_setup_triggered_at: new Date().toISOString() })
            .eq('id', userId);

        } else {
          console.error(`[Profile Save] Pabbly automation failed:`, pabblyResult.error);
          // We don't mark as triggered so it can try again next time? 
          // Or maybe we should allow retries. For now, let's allow retry if it failed.
        }
      } catch (pabblyError) {
        console.error('[Profile Save] Pabbly automation error:', pabblyError);
      }
    } else {
      console.log(`[Profile Save] Pabbly automation skipped - already triggered at ${existingProfile.ghl_setup_triggered_at}`);
    }

    // 7. Return success
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
