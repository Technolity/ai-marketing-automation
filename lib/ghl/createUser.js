/**
 * Helper function to create GHL user (shared logic)
 * Used by both admin API and profile save auto-create
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Create GHL user for a given TedOS user
 * @param {string} userId - TedOS user ID
 * @param {string} requestId - Optional request ID for logging
 * @returns {Promise<{success: boolean, ghlUserId?: string, email?: string, error?: string}>}
 */
export async function createGHLUserForUser(userId, requestId = 'helper') {
    try {
        console.log(`[${requestId}] [GHL User Helper] Creating GHL user for: ${userId}`);

        // 1. Get user profile
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('email, first_name, last_name, full_name')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            console.error(`[${requestId}] [GHL User Helper] User not found:`, userError);
            return { success: false, error: 'User not found' };
        }

        // 2. Get active subaccount
        const { data: subaccount, error: subError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount) {
            console.error(`[${requestId}] [GHL User Helper] No active subaccount:`, subError);
            return { success: false, error: 'No active subaccount found' };
        }

        // 3. Check if user already created
        if (subaccount.ghl_user_created) {
            console.log(`[${requestId}] [GHL User Helper] User already created`);
            return {
                success: true,
                alreadyExists: true,
                ghlUserId: subaccount.ghl_user_id,
                email: user.email
            };
        }

        // 4. Get agency OAuth token
        const { data: tokenData, error: tokenError } = await supabase
            .from('ghl_tokens')
            .select('*')
            .eq('user_type', 'Company')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (tokenError || !tokenData) {
            console.error(`[${requestId}] [GHL User Helper] No agency token:`, tokenError);
            return { success: false, error: 'No agency token found' };
        }

        // 5. Create GHL user via API
        const userName = user.full_name || `${user.first_name} ${user.last_name}`.trim();

        console.log(`[${requestId}] [GHL User Helper] Calling GHL API...`);

        const response = await fetch(
            `https://services.leadconnectorhq.com/users/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    companyId: tokenData.company_id,
                    firstName: user.first_name || userName.split(' ')[0] || 'User',
                    lastName: user.last_name || userName.split(' ').slice(1).join(' ') || '',
                    email: user.email,
                    type: 'account',
                    role: 'admin',
                    locationIds: [subaccount.location_id],
                    permissions: {
                        campaignsEnabled: true,
                        campaignsReadOnly: false,
                        contactsEnabled: true,
                        workflowsEnabled: true,
                        workflowsReadOnly: false,
                        triggersEnabled: true,
                        funnelsEnabled: true,
                        websitesEnabled: true,
                        opportunitiesEnabled: true,
                        dashboardStatsEnabled: true,
                        bulkRequestsEnabled: true,
                        appointmentsEnabled: true,
                        reviewsEnabled: true,
                        onlineListingsEnabled: true,
                        phoneCallEnabled: true,
                        conversationsEnabled: true,
                        assignedDataOnly: false,
                        adwordsReportingEnabled: false,
                        membershipEnabled: false,
                        facebookAdsReportingEnabled: false,
                        attributionsReportingEnabled: false,
                        settingsEnabled: true,
                        tagsEnabled: true,
                        leadValueEnabled: true,
                        marketingEnabled: true,
                        agentReportingEnabled: true,
                        botService: true,
                        socialPlanner: true,
                        bloggingEnabled: true,
                        invoiceEnabled: true,
                        affiliateManagerEnabled: false,
                        contentAiEnabled: true,
                        refundsEnabled: false,
                        recordPaymentEnabled: true,
                        cancelSubscriptionEnabled: true,
                        paymentsEnabled: true,
                        communitiesEnabled: false,
                        exportPaymentsEnabled: true
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[${requestId}] [GHL User Helper] GHL API error:`, errorData);

            // Save error to database
            await supabase
                .from('ghl_subaccounts')
                .update({
                    ghl_user_creation_error: errorData.message || 'Unknown error',
                    updated_at: new Date().toISOString()
                })
                .eq('id', subaccount.id);

            return { success: false, error: errorData.message || 'GHL API error' };
        }

        const result = await response.json();
        const ghlUserData = result.user || result;
        const ghlUserId = ghlUserData.id || ghlUserData._id;

        console.log(`[${requestId}] [GHL User Helper] ✅ GHL user created: ${ghlUserId}`);

        // 6. Update database
        await supabase
            .from('ghl_subaccounts')
            .update({
                ghl_user_id: ghlUserId,
                ghl_user_created: true,
                ghl_user_created_at: new Date().toISOString(),
                ghl_user_email: user.email,
                ghl_user_creation_error: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', subaccount.id);

        // 7. Send welcome email (async, don't wait)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/ghl-welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                userName: userName,
                locationId: subaccount.location_id
            })
        }).catch(err => {
            console.error(`[${requestId}] [GHL User Helper] Email send error:`, err.message);
        });

        return {
            success: true,
            ghlUserId: ghlUserId,
            email: user.email
        };

    } catch (error) {
        console.error(`[${requestId}] [GHL User Helper] Unexpected error:`, error);
        return { success: false, error: error.message };
    }
}
