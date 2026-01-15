/**
 * Pabbly Integration Helper
 * Triggers Pabbly automation webhook for GHL sub-account creation
 */

/**
 * Trigger Pabbly automation with user data
 * @param {Object} userData - The user data to send to Pabbly
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function triggerPabblyAutomation(userData) {
    const webhookUrl = process.env.PABBLY_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('[Pabbly] PABBLY_WEBHOOK_URL not configured, skipping automation');
        return { success: false, error: 'Webhook URL not configured' };
    }

    try {
        console.log('[Pabbly] Triggering automation for user:', userData.email);

        const payload = {
            // User identity
            clerkId: userData.clerkId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,

            // Contact info
            phone: userData.phone,
            countryCode: userData.countryCode,
            fullPhone: `${userData.countryCode}${userData.phone}`,

            // Business info
            businessName: userData.businessName || `${userData.firstName}'s Business`,

            // Address
            address: userData.address,
            city: userData.city,
            state: userData.state,
            postalCode: userData.postalCode,
            country: userData.country,

            // Full address formatted
            fullAddress: [
                userData.address,
                userData.city,
                userData.state,
                userData.postalCode,
                userData.country
            ].filter(Boolean).join(', '),

            // Timezone
            timezone: userData.timezone,

            // Metadata
            createdAt: new Date().toISOString(),
            source: 'tedos_signup'
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Pabbly] Webhook failed:', response.status, errorText);
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
        }

        console.log('[Pabbly] Automation triggered successfully for:', userData.email);
        return { success: true };

    } catch (error) {
        console.error('[Pabbly] Error triggering automation:', error);
        return { success: false, error: error.message };
    }
}
