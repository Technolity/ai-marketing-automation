/**
 * Push Funnel Copy to GHL Custom Values
 * Pushes only funnel copy content (no colors, media, emails, or SMS)
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { FUNNEL_COPY_MAP, MEDIA_MAP } from '@/lib/ghl/customValuesMap';
import { polishTextContent } from '@/lib/ghl/contentPolisher';

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

        console.log('[PushFunnelCopy] Starting push for funnel:', funnelId);

        // Get GHL credentials
        const { data: credentials, error: credError } = await supabaseAdmin
            .from('ghl_credentials')
            .select('location_id, access_token')
            .eq('user_id', userId)
            .single();

        if (credError || !credentials) {
            return Response.json({ error: 'GHL not connected' }, { status: 400 });
        }

        // Get funnel copy content from vault
        const { data: vaultContent, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('content')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'funnelCopy')
            .single();

        if (vaultError || !vaultContent) {
            return Response.json({ error: 'Funnel copy content not found' }, { status: 404 });
        }

        // Build custom values payload
        const customValues = [];
        const content = vaultContent.content;

        // Process each page in funnel copy
        for (const [page, fieldMap] of Object.entries(FUNNEL_COPY_MAP)) {
            const pageContent = content[page] || {};

            for (const [field, ghlKey] of Object.entries(fieldMap)) {
                const rawValue = pageContent[field];
                if (rawValue) {
                    // Polish content with AI
                    const fieldType = field.includes('headline') ? 'headline' :
                        field.includes('bullet') ? 'bullet' : 'paragraph';
                    const polishedValue = await polishTextContent(rawValue, fieldType);

                    customValues.push({
                        key: ghlKey,
                        value: polishedValue,
                    });
                }
            }
        }

        console.log('[PushFunnelCopy] Pushing', customValues.length, 'values to GHL');

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
                section: 'funnelCopy',
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
        console.error('[PushFunnelCopy] Error:', error);
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
