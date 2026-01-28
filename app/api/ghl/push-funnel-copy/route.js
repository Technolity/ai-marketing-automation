/**
 * Push Funnel Copy to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses customValuesMap.js for correct GHL key mapping
 * Uses contentPolisher.js for AI polishing
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { FUNNEL_COPY_MAP, UNIVERSAL_MAP } from '@/lib/ghl/customValuesMap';
import { polishTextContent } from '@/lib/ghl/contentPolisher';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues } from '@/lib/ghl/ghlKeyMatcher';


export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for large funnel copy

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

        // Get user's location ID from ghl_subaccounts
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return Response.json({ error: 'GHL sub-account not found. Please complete onboarding.' }, { status: 400 });
        }

        // Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;

        // Fetch existing custom values to get IDs for updating
        console.log('[PushFunnelCopy] Fetching existing custom values...');
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);

        // Build map for quick lookup using shared utility (returns {id, name} objects)
        // This uses the enhanced 11-level key matching from ghlKeyMatcher.js
        const existingMap = buildExistingMap(existingValues);

        console.log(`[PushFunnelCopy] Found ${existingValues.length} existing custom values`);

        // Log summary of prefixed values (only counts, not full listing for performance)
        const count03 = existingValues.filter(v => v.name.startsWith('03_')).length;
        const count02 = existingValues.filter(v => v.name.startsWith('02_')).length;
        console.log(`[PushFunnelCopy] Prefix summary: ${count03} with 03_, ${count02} with 02_, ${existingValues.length - count03 - count02} other`);


        // Get funnel copy content from vault_content_fields (granular storage)
        const { data: fields, error: fieldsError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'funnelCopy')
            .eq('is_current_version', true);

        if (fieldsError) {
            console.error('[PushFunnelCopy] Database error:', fieldsError);
            return Response.json({ error: 'Failed to fetch funnel copy fields' }, { status: 500 });
        }

        if (!fields || fields.length === 0) {
            return Response.json({ error: 'Funnel copy content not found' }, { status: 404 });
        }

        // Reconstruct content structure from individual fields
        // Fields are stored as: optinPage, salesPage, calendarPage, thankYouPage (each is a JSON object)
        // IMPORTANT: Filter out nested field entries (those with dots in field_id)
        // Nested fields like "optinPage.footer_company_name" are already merged into their parent "optinPage"
        const content = {};

        for (const field of fields) {
            const { field_id, field_value } = field;

            // Skip nested field entries - they're already in the parent object
            if (field_id.includes('.')) {
                console.log('[PushFunnelCopy] Skipping nested field entry:', field_id);
                continue;
            }

            // Parse field value (may be JSON string or object)
            let parsedValue = field_value;
            if (typeof field_value === 'string') {
                try {
                    parsedValue = JSON.parse(field_value);
                } catch (e) {
                    // If not JSON, use as-is
                    parsedValue = field_value;
                }
            }

            content[field_id] = parsedValue;
        }

        console.log('[PushFunnelCopy] Reconstructed content from', Object.keys(content).length, 'parent fields:', Object.keys(content));

        // Get user's company email from user_profiles
        const { data: userProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('business_email')
            .eq('user_id', userId)
            .single();

        const companyEmail = userProfile?.business_email || '';
        console.log('[PushFunnelCopy] Company email from user_profiles:', companyEmail || '(not set)');

        // Build custom values payload using customValuesMap
        const customValues = [];

        // Add universal fields first (company_email, etc.)
        console.log('[PushFunnelCopy] ========== UNIVERSAL FIELDS ==========');
        for (const [field, ghlKey] of Object.entries(UNIVERSAL_MAP)) {
            let value = null;
            if (field === 'company_email') {
                value = companyEmail;
            }
            // company_name and logo_image are handled elsewhere

            if (value) {
                const existingId = findExistingId(ghlKey);

                customValues.push({
                    key: ghlKey,
                    value: value,
                    existingId: existingId || null
                });
                console.log(`[PushFunnelCopy]   ✓ ${field} → ${ghlKey} = ${value}`);
            }
        }

        console.log('[PushFunnelCopy] ========== MAPPING PAGES ==========');
        console.log('[PushFunnelCopy] Available pages in FUNNEL_COPY_MAP:', Object.keys(FUNNEL_COPY_MAP));
        console.log('[PushFunnelCopy] Available pages in content:', Object.keys(content));

        // Process each page in funnel copy (optinPage, salesPage, calendarPage, thankYouPage)
        for (const [page, fieldMap] of Object.entries(FUNNEL_COPY_MAP)) {
            const pageContent = content[page] || {};
            const fieldCount = Object.keys(pageContent).length;

            console.log(`[PushFunnelCopy] Processing ${page}: ${fieldCount} fields available`);

            if (fieldCount === 0) {
                console.log(`[PushFunnelCopy] ⚠ SKIPPING ${page} - No content found in vault`);
                continue;
            }

            let pageMapped = 0;
            for (const [field, ghlKey] of Object.entries(fieldMap)) {
                const rawValue = pageContent[field];
                if (rawValue) {
                    // Polish content with AI (skip for calendar_embedded_code and image fields)
                    const skipPolish = field.includes('calendar_embedded') || field.includes('_image') || field.includes('video_link');
                    const fieldType = field.includes('headline') ? 'headline' :
                        field.includes('bullet') ? 'bullet' : 'paragraph';
                    const polishedValue = skipPolish ? rawValue : await polishTextContent(rawValue, fieldType);

                    // Find existing value using shared utility (returns {id, name} object)
                    const match = findExistingId(existingMap, ghlKey);

                    customValues.push({
                        key: ghlKey,
                        value: polishedValue,
                        existingId: match?.id || null,
                        ghlName: match?.name || ghlKey  // Use actual GHL name for API body
                    });

                    pageMapped++;
                    console.log(`[PushFunnelCopy]   ✓ ${page}.${field} → ${ghlKey}`);
                } else {
                    console.log(`[PushFunnelCopy]   ⚠ ${page}.${field} → ${ghlKey} (NO VALUE in vault)`);
                }
            }

            console.log(`[PushFunnelCopy] ${page} complete: ${pageMapped} fields mapped`);
        }

        console.log('[PushFunnelCopy] ========== TOTAL: Pushing', customValues.length, 'values to GHL ==========');

        // Log matching status for each custom value we're trying to push
        console.log('[PushFunnelCopy] ========== MATCHING STATUS ==========');
        const matched = customValues.filter(cv => cv.existingId);
        const notMatched = customValues.filter(cv => !cv.existingId);

        console.log(`[PushFunnelCopy] ✓ MATCHED (${matched.length}): Will be updated`);
        matched.forEach(cv => {
            console.log(`  ✓ "${cv.key}" → Found in GHL (ID: ${cv.existingId})`);
        });

        console.log(`[PushFunnelCopy] ✗ NOT MATCHED (${notMatched.length}): Will be skipped`);
        notMatched.forEach(cv => {
            console.log(`  ✗ "${cv.key}" → NOT FOUND in GHL (tried: "${cv.key}", "${cv.key.toLowerCase()}", "${cv.key.toLowerCase().replace(/\s+/g, '_')}")`);
        });
        console.log('[PushFunnelCopy] ========== END MATCHING STATUS ==========');

        // Push to GHL
        const pushResults = await pushToGHL(locationId, accessToken, customValues);

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
            pushed: pushResults.pushed,
            updated: pushResults.updated,
            failed: pushResults.failed,
            details: pushResults,
        });

    } catch (error) {
        console.error('[PushFunnelCopy] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Push values to GHL Custom Values API
 * ONLY updates existing values (never creates new ones)
 */
async function pushToGHL(locationId, accessToken, customValues) {
    const results = { success: true, pushed: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

    for (const { key, value, existingId, ghlName } of customValues) {
        try {
            // ONLY UPDATE existing values (never create)
            if (!existingId) {
                results.skipped++;
                console.log(`[PushFunnelCopy] SKIPPED: ${key} (not found in GHL)`);
                continue;
            }

            const response = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28',
                    },
                    // GHL API requires both 'name' and 'value' for PUT requests
                    body: JSON.stringify({ name: ghlName, value }),
                }
            );

            if (response.ok) {
                results.updated++;
                results.pushed++;
                console.log(`[PushFunnelCopy] UPDATED: ${key}`);
            } else {
                results.failed++;
                const err = await response.json().catch(() => ({ message: 'Unknown error' }));
                results.errors.push({ key, error: err });
                console.log(`[PushFunnelCopy] FAILED: ${key} - ${JSON.stringify(err)}`);
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ key, error: err.message });
            console.log(`[PushFunnelCopy] ERROR: ${key} - ${err.message}`);
        }
    }

    results.success = results.failed === 0;
    return results;
}
