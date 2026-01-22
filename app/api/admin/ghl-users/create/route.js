/**
 * Create GHL User API
 * Admin-only endpoint to create GHL User accounts for TedOS users
 * 
 * Flow:
 * 1. Verify admin authentication
 * 2. Fetch user profile and subaccount
 * 3. Check if GHL user already exists
 * 4. Create GHL User via API
 * 5. Send TedOS branded email
 * 6. Update database
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Verify user is admin
 */
async function verifyAdmin(userId) {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    return profile?.is_admin === true;
}

/**
 * Get or refresh company access token
 */
async function getCompanyAccessToken() {
    console.log('[GHL User Create] Fetching company OAuth token...');

    const { data: tokenData, error } = await supabase
        .from('ghl_tokens')
        .select('access_token, refresh_token, company_id, expires_at')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !tokenData) {
        console.error('[GHL User Create] No company token found:', error);
        throw new Error('GHL integration not configured');
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    let accessToken = tokenData.access_token;

    if (now >= expiresAt) {
        console.log('[GHL User Create] Token expired, refreshing...');

        const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token
            })
        });

        if (!refreshResponse.ok) {
            const errorText = await refreshResponse.text();
            console.error('[GHL User Create] Token refresh failed:', errorText);
            throw new Error('Failed to refresh GHL token');
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        // Update token in database
        await supabase
            .from('ghl_tokens')
            .update({
                access_token: refreshData.access_token,
                refresh_token: refreshData.refresh_token,
                expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
            })
            .eq('user_type', 'Company')
            .eq('company_id', tokenData.company_id);

        console.log('[GHL User Create] Token refreshed successfully');
    }

    return { accessToken, companyId: tokenData.company_id };
}

/**
 * Create GHL User via API
 */
async function createGHLUser(accessToken, companyId, userData) {
    console.log('[GHL User Create] Creating GHL user for:', userData.email);

    const response = await fetch('https://services.leadconnectorhq.com/users/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
        },
        body: JSON.stringify({
            companyId: companyId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            type: 'account',
            role: 'admin',
            locationIds: [userData.locationId],
            permissions: {
                locationIds: [userData.locationId]
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[GHL User Create] GHL API error:', errorText);

        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch (e) {
            errorData = { message: errorText };
        }

        throw new Error(errorData.message || 'Failed to create GHL user');
    }

    const result = await response.json();
    console.log('[GHL User Create] Full GHL response:', JSON.stringify(result, null, 2));

    // GHL may return the user directly or nested under 'user'
    const userData = result.user || result;
    console.log('[GHL User Create] GHL user created successfully:', userData?.id || userData?._id || 'NO_ID');

    return userData;
}

/**
 * Send TedOS branded welcome email
 */
async function sendWelcomeEmail(userEmail, firstName) {
    console.log('[GHL User Create] Sending welcome email to:', userEmail);

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/ghl-welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: userEmail,
                firstName: firstName
            })
        });

        if (!response.ok) {
            console.error('[GHL User Create] Failed to send email:', await response.text());
            return false;
        }

        console.log('[GHL User Create] Welcome email sent successfully');
        return true;
    } catch (error) {
        console.error('[GHL User Create] Email error:', error);
        return false;
    }
}

export async function POST(req) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`\n[GHL User Create ${requestId}] ========== START ==========`);

    let targetUserId; // Declare here to use in error handler

    try {
        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[GHL User Create ${requestId}] Unauthorized - no userId`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[GHL User Create ${requestId}] Admin user: ${userId}`);

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            console.log(`[GHL User Create ${requestId}] Forbidden - not admin`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        targetUserId = body.userId; // Use outer scope variable

        if (!targetUserId) {
            console.log(`[GHL User Create ${requestId}] Missing targetUserId`);
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        console.log(`[GHL User Create ${requestId}] Target user: ${targetUserId}`);

        // 3. Fetch user profile
        console.log(`[GHL User Create ${requestId}] Fetching user profile...`);
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, first_name, last_name')
            .eq('id', targetUserId)
            .single();

        if (profileError || !userProfile) {
            console.error(`[GHL User Create ${requestId}] User not found:`, profileError);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`[GHL User Create ${requestId}] User email: ${userProfile.email}`);

        // Parse name
        const fullName = userProfile.full_name || '';
        const firstName = userProfile.first_name || fullName.split(' ')[0] || 'User';
        const lastName = userProfile.last_name || fullName.split(' ').slice(1).join(' ') || '';

        // 4. Fetch subaccount
        console.log(`[GHL User Create ${requestId}] Fetching subaccount...`);
        const { data: subaccount, error: subError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .maybeSingle();

        if (subError) {
            console.error(`[GHL User Create ${requestId}] Database error:`, subError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!subaccount) {
            console.log(`[GHL User Create ${requestId}] No subaccount found`);
            return NextResponse.json({
                error: 'No GHL subaccount found',
                message: 'User must have a GHL location before creating user account'
            }, { status: 404 });
        }

        console.log(`[GHL User Create ${requestId}] Location ID: ${subaccount.location_id}`);

        // 5. Check if GHL user already exists
        if (subaccount.ghl_user_created && subaccount.ghl_user_id) {
            console.log(`[GHL User Create ${requestId}] GHL user already exists: ${subaccount.ghl_user_id}`);
            return NextResponse.json({
                error: 'GHL user already exists',
                ghlUserId: subaccount.ghl_user_id
            }, { status: 409 });
        }

        // 6. Get company access token
        const { accessToken, companyId } = await getCompanyAccessToken();

        // 7. Create GHL User
        console.log(`[GHL User Create ${requestId}] Creating GHL user...`);
        const ghlUser = await createGHLUser(accessToken, companyId, {
            firstName,
            lastName,
            email: userProfile.email,
            locationId: subaccount.location_id
        });

        // 8. Send welcome email
        const emailSent = await sendWelcomeEmail(userProfile.email, firstName);

        // 9. Update database
        console.log(`[GHL User Create ${requestId}] Updating database...`);
        const { error: updateError } = await supabase
            .from('ghl_subaccounts')
            .update({
                ghl_user_id: ghlUser.id,
                ghl_user_created: true,
                ghl_user_created_at: new Date().toISOString(),
                ghl_user_email: userProfile.email,
                ghl_user_role: 'admin',
                ghl_user_invited: emailSent,
                ghl_user_invite_sent_at: emailSent ? new Date().toISOString() : null,
                ghl_user_creation_error: null // Clear any previous errors
            })
            .eq('id', subaccount.id);

        if (updateError) {
            console.error(`[GHL User Create ${requestId}] Failed to update database:`, updateError);
            // User was created in GHL but DB update failed - log this critical error
            console.error(`[GHL User Create ${requestId}] CRITICAL: GHL user ${ghlUser.id} created but DB not updated!`);
        }

        console.log(`[GHL User Create ${requestId}] ========== SUCCESS ==========\n`);

        return NextResponse.json({
            success: true,
            ghlUserId: ghlUser.id,
            email: userProfile.email,
            emailSent: emailSent,
            message: 'GHL user created successfully'
        });

    } catch (error) {
        console.error(`[GHL User Create ${requestId}] ========== ERROR ==========`);
        console.error(`[GHL User Create ${requestId}] Error:`, error);
        console.error(`[GHL User Create ${requestId}] Stack:`, error.stack);

        // Update database with error (use targetUserId from outer scope)
        if (targetUserId) {
            try {
                await supabase
                    .from('ghl_subaccounts')
                    .update({
                        ghl_user_creation_error: error.message,
                        ghl_user_last_retry_at: new Date().toISOString()
                    })
                    .eq('user_id', targetUserId);
            } catch (dbError) {
                console.error(`[GHL User Create ${requestId}] Failed to log error to DB:`, dbError);
            }
        }

        return NextResponse.json({
            error: 'Failed to create GHL user',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
