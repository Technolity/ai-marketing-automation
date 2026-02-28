/**
 * GHL OAuth Authorization Start
 * Redirects admin to GHL to authorize agency access
 * 
 * GET /api/ghl/oauth/authorize
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

export async function GET(req) {
    try {
        // Verify user is admin
        const { userId } = auth();

        if (!userId) {
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json(
                { error: 'Admin access required for GHL OAuth setup' },
                { status: 403 }
            );
        }

        // Check required env vars
        if (!process.env.GHL_CLIENT_ID || !process.env.GHL_REDIRECT_URI) {
            return NextResponse.json(
                { error: 'GHL OAuth not configured. Set GHL_CLIENT_ID and GHL_REDIRECT_URI.' },
                { status: 500 }
            );
        }

        // Full GHL Marketplace scopes
        const allScopes = [
            'businesses.write', 'businesses.readonly',
            'locations.write', 'locations.readonly',
            'locations/customValues.write', 'locations/customValues.readonly',
            'snapshots.write', 'oauth.write', 'oauth.readonly',
            'users.write', 'users.readonly',
            'contacts.readonly', 'opportunities.readonly',
            'calendars.readonly', 'calendars/events.readonly', 'calendars/events.write',
            'calendars/groups.readonly', 'calendars/groups.write',
            'calendars/resources.readonly', 'calendars/resources.write',
            'companies.readonly', 'campaigns.readonly',
            'conversations.readonly', 'conversations.write',
            'conversations/message.readonly', 'conversations/message.write',
            'conversations/reports.readonly', 'conversations/livechat.write',
            'objects/schema.readonly', 'objects/schema.write',
            'objects/record.readonly', 'objects/record.write',
            'associations.write', 'associations.readonly',
            'associations/relation.readonly', 'associations/relation.write',
            'courses.write', 'courses.readonly',
            'forms.readonly', 'forms.write',
            'invoices.readonly', 'invoices.write',
            'invoices/schedule.readonly', 'invoices/schedule.write',
            'invoices/template.readonly', 'invoices/template.write',
            'invoices/estimate.readonly', 'invoices/estimate.write',
            'links.readonly', 'links.write', 'lc-email.readonly',
            'locations/customFields.readonly', 'locations/customFields.write',
            'locations/tasks.readonly', 'locations/tasks.write',
            'locations/tags.readonly', 'locations/tags.write',
            'locations/templates.readonly',
            'recurring-tasks.readonly', 'recurring-tasks.write',
            'medias.readonly', 'medias.write',
            'funnels/page.readonly', 'funnels/redirect.readonly', 'funnels/redirect.write',
            'funnels/funnel.readonly', 'funnels/pagecount.readonly',
            'payments/orders.readonly', 'payments/orders.write', 'payments/orders.collectPayment',
            'payments/integration.readonly', 'payments/integration.write',
            'payments/transactions.readonly', 'payments/subscriptions.readonly',
            'payments/coupons.readonly', 'payments/coupons.write',
            'payments/custom-provider.readonly', 'payments/custom-provider.write',
            'products.readonly', 'products.write',
            'products/prices.readonly', 'products/prices.write',
            'products/collection.readonly', 'products/collection.write',
            'saas/company.read', 'saas/company.write',
            'saas/location.read', 'saas/location.write',
            'socialplanner/oauth.readonly', 'socialplanner/oauth.write',
            'socialplanner/post.readonly', 'socialplanner/post.write',
            'socialplanner/account.readonly', 'socialplanner/account.write',
            'socialplanner/csv.readonly', 'socialplanner/csv.write',
            'socialplanner/category.readonly', 'socialplanner/category.write',
            'socialplanner/statistics.readonly',
            'socialplanner/tag.readonly', 'socialplanner/tag.write',
            'store/shipping.readonly', 'store/shipping.write',
            'store/setting.readonly', 'store/setting.write',
            'surveys.readonly', 'workflows.readonly',
            'emails/builder.write', 'emails/builder.readonly', 'emails/schedule.readonly',
            'wordpress.site.readonly',
            'blogs/post.write', 'blogs/check-slug.readonly', 'blogs/post-update.write',
            'blogs/category.readonly', 'blogs/author.readonly',
            'blogs/posts.readonly', 'blogs/list.readonly',
            'custom-menu-link.readonly', 'custom-menu-link.write',
            'brand-boards/design-kit.readonly', 'brand-boards/design-kit.write',
            'charges.readonly', 'charges.write',
            'marketplace-installer-details.readonly',
            'marketplace-external-auth-migration.write',
            'twilioaccount.read', 'phonenumbers.read', 'numberpools.read',
            'documents_contracts/list.readonly', 'documents_contracts/sendLink.write',
            'documents_contracts_template/sendLink.write', 'documents_contracts_template/list.readonly',
            'voice-ai-dashboard.readonly', 'voice-ai-agents.readonly', 'voice-ai-agents.write',
            'voice-ai-agent-goals.readonly', 'voice-ai-agent-goals.write',
            'knowledge-bases.write', 'knowledge-bases.readonly',
            'conversation-ai.readonly', 'conversation-ai.write',
            'agent-studio.readonly', 'agent-studio.write',
        ].join(' ');

        // Build authorization URL with full agency scopes
        const params = new URLSearchParams({
            client_id: process.env.GHL_CLIENT_ID,
            redirect_uri: process.env.GHL_REDIRECT_URI,
            response_type: 'code',
            scope: allScopes
        });

        const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?${params}`;

        console.log('[GHL OAuth] Redirecting admin to GHL authorization:', authUrl);

        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('[GHL OAuth] Authorization error:', error);
        return NextResponse.json(
            { error: 'Failed to start OAuth flow' },
            { status: 500 }
        );
    }
}
