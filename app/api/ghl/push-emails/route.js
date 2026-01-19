/**
 * Push Emails to GHL Custom Values
 * Pushes only email content with AI polishing
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { EMAIL_MAP } from '@/lib/ghl/customValuesMap';
import { polishEmailContent, polishTextContent } from '@/lib/ghl/contentPolisher';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { funnelId } = await req.json();

        if (!funnelId) {
            return Response.json({ error: 'funnelId is required' }, { status: 400 });
        }

        console.log('[PushEmails] Starting push for funnel:', funnelId);

        // Get GHL credentials
        const { data: credentials, error: credError } = await supabaseAdmin
            .from('ghl_credentials')
            .select('location_id, access_token')
            .eq('user_id', userId)
            .single();

        if (credError || !credentials) {
            return Response.json({ error: 'GHL not connected' }, { status: 400 });
        }

        // Get email content from vault
        const { data: vaultContent, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('content')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'emails')
            .single();

        if (vaultError || !vaultContent) {
            return Response.json({ error: 'Email content not found' }, { status: 404 });
        }

        // Build custom values payload
        const customValues = [];
        const content = vaultContent.content;

        // Process email sequences
        for (const [sequence, emails] of Object.entries(EMAIL_MAP)) {
            const sequenceContent = content[sequence] || {};

            for (const [emailKey, ghlKeys] of Object.entries(emails)) {
                const emailContent = sequenceContent[emailKey] || content[emailKey] || {};

                if (typeof ghlKeys === 'object') {
                    // Email with subject, preheader, body
                    if (ghlKeys.subject && emailContent.subject) {
                        const polished = await polishTextContent(emailContent.subject, 'headline');
                        customValues.push({ key: ghlKeys.subject, value: polished });
                    }
                    if (ghlKeys.preheader && emailContent.preheader) {
                        const polished = await polishTextContent(emailContent.preheader, 'paragraph');
                        customValues.push({ key: ghlKeys.preheader, value: polished });
                    }
                    if (ghlKeys.body && emailContent.body) {
                        const polished = await polishTextContent(emailContent.body, 'email');
                        customValues.push({ key: ghlKeys.body, value: polished });
                    }
                } else {
                    // Simple string key
                    if (emailContent) {
                        const polished = await polishTextContent(emailContent, 'email');
                        customValues.push({ key: ghlKeys, value: polished });
                    }
                }
            }
        }

        console.log('[PushEmails] Pushing', customValues.length, 'email values to GHL');

        // Push to GHL
        const pushResults = await pushToGHL(
            credentials.location_id,
            credentials.access_token,
            customValues
        );

        // Log push operation
        await supabaseAdmin
            .from('ghl_push_logs')
            .insert({
                user_id: userId,
                funnel_id: funnelId,
                section: 'emails',
                values_pushed: customValues.length,
                success: pushResults.success,
                error: pushResults.error || null,
            });

        return Response.json({
            success: true,
            pushed: customValues.length,
            details: pushResults,
        });

    } catch (error) {
        console.error('[PushEmails] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Push values to GHL Custom Values API
 */
async function pushToGHL(locationId, accessToken, customValues) {
    const results = { success: true, pushed: 0, failed: 0, errors: [] };

    for (const { key, value } of customValues) {
        try {
            const response = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${key}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28',
                    },
                    body: JSON.stringify({ value }),
                }
            );

            if (response.ok) {
                results.pushed++;
            } else {
                results.failed++;
                const err = await response.json();
                results.errors.push({ key, error: err });
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ key, error: err.message });
        }
    }

    results.success = results.failed === 0;
    return results;
}
