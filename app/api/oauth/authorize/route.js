import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/authorize
 * 
 * Redirects the user to GHL's OAuth authorization page.
 * The user will be prompted to log into GHL and approve the requested scopes.
 */
export async function GET(req) {
    try {
        // Check if user is authenticated
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                error: 'Please log in first',
                message: 'You must be logged into your account before connecting to GoHighLevel',
                redirectTo: '/auth/login'
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        // Optional: pass user_type preference (Company or Location)
        const userType = searchParams.get('user_type') || 'Location';

        const clientId = process.env.GHL_CLIENT_ID;
        const redirectUri = process.env.GHL_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            return NextResponse.json({
                error: 'GHL OAuth not configured. Missing GHL_CLIENT_ID or GHL_REDIRECT_URI.'
            }, { status: 500 });
        }

        // Full GHL Marketplace scopes
        const scopes = [
            // --- Existing core scopes ---
            'businesses.write',
            'businesses.readonly',
            'locations.write',
            'locations.readonly',
            'locations/customValues.write',
            'locations/customValues.readonly',
            'snapshots.write',
            'oauth.write',
            'oauth.readonly',
            'users.write',
            'users.readonly',
            'contacts.readonly',
            'opportunities.readonly',

            // --- Calendars ---
            'calendars.readonly',
            'calendars/events.readonly',
            'calendars/events.write',
            'calendars/groups.readonly',
            'calendars/groups.write',
            'calendars/resources.readonly',
            'calendars/resources.write',

            // --- Companies ---
            'companies.readonly',

            // --- Campaigns ---
            'campaigns.readonly',

            // --- Conversations ---
            'conversations.readonly',
            'conversations.write',
            'conversations/message.readonly',
            'conversations/message.write',
            'conversations/reports.readonly',
            'conversations/livechat.write',

            // --- Objects / Associations ---
            'objects/schema.readonly',
            'objects/schema.write',
            'objects/record.readonly',
            'objects/record.write',
            'associations.write',
            'associations.readonly',
            'associations/relation.readonly',
            'associations/relation.write',

            // --- Courses ---
            'courses.write',
            'courses.readonly',

            // --- Forms ---
            'forms.readonly',
            'forms.write',

            // --- Invoices ---
            'invoices.readonly',
            'invoices.write',
            'invoices/schedule.readonly',
            'invoices/schedule.write',
            'invoices/template.readonly',
            'invoices/template.write',
            'invoices/estimate.readonly',
            'invoices/estimate.write',

            // --- Links ---
            'links.readonly',
            'links.write',

            // --- Email ---
            'lc-email.readonly',

            // --- Locations extras ---
            'locations/customFields.readonly',
            'locations/customFields.write',
            'locations/tasks.readonly',
            'locations/tasks.write',
            'locations/tags.readonly',
            'locations/tags.write',
            'locations/templates.readonly',

            // --- Recurring tasks ---
            'recurring-tasks.readonly',
            'recurring-tasks.write',

            // --- Media ---
            'medias.readonly',
            'medias.write',

            // --- Funnels ---
            'funnels/page.readonly',
            'funnels/redirect.readonly',
            'funnels/redirect.write',
            'funnels/funnel.readonly',
            'funnels/pagecount.readonly',

            // --- Payments ---
            'payments/orders.readonly',
            'payments/orders.write',
            'payments/orders.collectPayment',
            'payments/integration.readonly',
            'payments/integration.write',
            'payments/transactions.readonly',
            'payments/subscriptions.readonly',
            'payments/coupons.readonly',
            'payments/coupons.write',
            'payments/custom-provider.readonly',
            'payments/custom-provider.write',

            // --- Products ---
            'products.readonly',
            'products.write',
            'products/prices.readonly',
            'products/prices.write',
            'products/collection.readonly',
            'products/collection.write',

            // --- SaaS ---
            'saas/company.read',
            'saas/company.write',
            'saas/location.read',
            'saas/location.write',

            // --- Social Planner ---
            'socialplanner/oauth.readonly',
            'socialplanner/oauth.write',
            'socialplanner/post.readonly',
            'socialplanner/post.write',
            'socialplanner/account.readonly',
            'socialplanner/account.write',
            'socialplanner/csv.readonly',
            'socialplanner/csv.write',
            'socialplanner/category.readonly',
            'socialplanner/category.write',
            'socialplanner/statistics.readonly',
            'socialplanner/tag.readonly',
            'socialplanner/tag.write',

            // --- Store ---
            'store/shipping.readonly',
            'store/shipping.write',
            'store/setting.readonly',
            'store/setting.write',

            // --- Surveys ---
            'surveys.readonly',

            // --- Workflows ---
            'workflows.readonly',

            // --- Emails builder ---
            'emails/builder.write',
            'emails/builder.readonly',
            'emails/schedule.readonly',

            // --- WordPress / Blogs ---
            'wordpress.site.readonly',
            'blogs/post.write',
            'blogs/check-slug.readonly',
            'blogs/post-update.write',
            'blogs/category.readonly',
            'blogs/author.readonly',
            'blogs/posts.readonly',
            'blogs/list.readonly',

            // --- Custom menu ---
            'custom-menu-link.readonly',
            'custom-menu-link.write',

            // --- Brand boards ---
            'brand-boards/design-kit.readonly',
            'brand-boards/design-kit.write',

            // --- Charges ---
            'charges.readonly',
            'charges.write',

            // --- Marketplace ---
            'marketplace-installer-details.readonly',
            'marketplace-external-auth-migration.write',

            // --- Twilio ---
            'twilioaccount.read',
            'phonenumbers.read',
            'numberpools.read',

            // --- Documents / Contracts ---
            'documents_contracts/list.readonly',
            'documents_contracts/sendLink.write',
            'documents_contracts_template/sendLink.write',
            'documents_contracts_template/list.readonly',

            // --- Voice AI ---
            'voice-ai-dashboard.readonly',
            'voice-ai-agents.readonly',
            'voice-ai-agents.write',
            'voice-ai-agent-goals.readonly',
            'voice-ai-agent-goals.write',

            // --- Knowledge bases ---
            'knowledge-bases.write',
            'knowledge-bases.readonly',

            // --- Conversation AI ---
            'conversation-ai.readonly',
            'conversation-ai.write',

            // --- Agent Studio ---
            'agent-studio.readonly',
            'agent-studio.write',
        ].join(' ');

        // Create state parameter with user ID (Base64 encoded for safety)
        const state = Buffer.from(JSON.stringify({
            userId,
            timestamp: Date.now()
        })).toString('base64');

        // Build GHL authorization URL
        const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', scopes);
        authUrl.searchParams.set('state', state);

        console.log('[OAuth Authorize] Redirecting user:', userId);
        console.log('[OAuth Authorize] Requested scopes:', scopes);
        console.log('[OAuth Authorize] User type:', userType);

        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error('[OAuth Authorize] Error:', error);
        return NextResponse.json({
            error: 'Failed to initiate OAuth flow',
            message: error.message
        }, { status: 500 });
    }
}
