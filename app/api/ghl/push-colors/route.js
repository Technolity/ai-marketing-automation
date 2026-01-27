/**
 * Push Colors to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * ONLY UPDATES existing custom values (never creates new ones)
 *
 * Semantic Color Mapping:
 * - Primary = Main brand color for section backgrounds, CTAs
 * - Secondary = Alternating backgrounds
 * - Tertiary = Text colors
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getLocationToken } from '@/lib/ghl/tokenHelper';

export const dynamic = 'force-dynamic';

/**
 * Fetch existing GHL custom values to get IDs
 */
async function fetchExistingCustomValues(locationId, accessToken) {
    const allValues = [];
    let skip = 0;

    while (allValues.length < 500) {
        const response = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                }
            }
        );

        if (!response.ok) break;

        const data = await response.json();
        const values = data.customValues || [];
        allValues.push(...values);

        if (values.length < 100) break;
        skip += 100;
    }

    return allValues;
}

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

        console.log('[PushColors] ========== START ==========');
        console.log('[PushColors] Funnel ID:', funnelId);

        // Get user's location ID
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return Response.json({ error: 'GHL sub-account not found' }, { status: 400 });
        }

        console.log('[PushColors] Location ID:', subaccount.location_id);

        // Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            console.error('[PushColors] Token error:', tokenResult.error);
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;
        console.log('[PushColors] OAuth token obtained');

        // Fetch existing custom values
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        console.log('[PushColors] Found', existingValues.length, 'existing custom values in GHL');

        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v.id);
            existingMap.set(v.name.toLowerCase(), v.id);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v.id);
        });

        // Get brand colors from vault_content_fields
        const { data: colorField } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'colors')
            .eq('field_id', 'colorPalette')
            .eq('is_current_version', true)
            .maybeSingle();

        if (!colorField?.field_value) {
            return Response.json({ error: 'Brand colors not found. Generate colors first.' }, { status: 404 });
        }

        // Parse color palette
        const palette = typeof colorField.field_value === 'string'
            ? JSON.parse(colorField.field_value)
            : colorField.field_value;

        // Extract hex colors
        const getHex = (val) => (val && typeof val === 'object' ? val.hex : val) || null;
        const primary = getHex(palette.primary) || getHex(palette.primaryColor) || '#000000';
        const secondary = getHex(palette.secondary) || getHex(palette.secondaryColor) || '#6B7280';
        const tertiary = getHex(palette.tertiary) || getHex(palette.accentColor) || '#3B82F6';

        console.log('[PushColors] Brand Colors:');
        console.log('[PushColors]   Primary (backgrounds, CTAs):', primary);
        console.log('[PushColors]   Secondary (alternating):', secondary);
        console.log('[PushColors]   Tertiary (text):', tertiary);

        // Semantic color mappings
        // Primary = Main brand color for section backgrounds, CTA backgrounds
        // Secondary = Alternating backgrounds
        // Tertiary = Text colors
        const colorMappings = {
            // Universal brand colors
            'primary_color': primary,
            'secondary_color': secondary,
            'tertiary_color': tertiary,

            // Optin Page - Primary for CTAs, Tertiary for text
            '03_optin_cta_background_colour': primary,
            '03_optin_cta_text_colour': '#FFFFFF',
            '03_optin_healine_text_colour': tertiary,
            '03_optin_subhealine_text_colour': tertiary,

            // VSL Page - Primary for CTAs, Tertiary for text
            '03_vsl_cta_background_colour': primary,
            '03_vsl_cta_text_colour': '#FFFFFF',
            '03_vsl_hero_headline_text_colour': tertiary,
            '03_vsl_hero_sub_headline_text_colour': tertiary,
            '03_vsl_process_headline_text_colour': tertiary,
            '03_vsl_process_sub_headline_text_colour': tertiary,

            // Components - Secondary for pill backgrounds
            '03_vsl_acknowledge_pill_bg_colour': secondary,
            '03_vsl_acknowledge_pill_text_colour': '#FFFFFF',

            // Headers - Secondary for alternating background
            '03_header_background_color': secondary,
        };

        const customValues = [];
        const notFoundKeys = [];

        console.log('[PushColors] Mapping colors to GHL custom values...');
        for (const [ghlKey, hexValue] of Object.entries(colorMappings)) {
            if (!hexValue) continue;

            const existingId = existingMap.get(ghlKey) || existingMap.get(ghlKey.toLowerCase());

            if (existingId) {
                customValues.push({
                    key: ghlKey,
                    value: hexValue,
                    existingId
                });
                console.log(`[PushColors] ✓ Mapped: ${ghlKey} = ${hexValue}`);
            } else {
                notFoundKeys.push(ghlKey);
                console.log(`[PushColors] ⚠ Skipping: ${ghlKey} (NOT FOUND in GHL)`);
            }
        }

        if (customValues.length === 0) {
            return Response.json({
                error: 'No color custom values found in GHL',
                notFoundKeys,
                hint: 'Make sure the GHL snapshot has the required color custom values'
            }, { status: 400 });
        }

        console.log('[PushColors] Pushing', customValues.length, 'color values to GHL...');

        // Push to GHL (ONLY UPDATE, never create)
        const results = { success: true, updated: 0, skipped: 0, failed: 0, errors: [], notFoundKeys };

        for (const { key, value, existingId } of customValues) {
            try {
                const response = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
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
                    results.updated++;
                    console.log(`[PushColors] ✓ UPDATED: ${key} = ${value}`);
                } else {
                    results.failed++;
                    const err = await response.json().catch(() => ({ message: 'Unknown error' }));
                    results.errors.push({ key, error: err });
                    console.error(`[PushColors] ✗ FAILED: ${key} -`, err);
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ key, error: err.message });
                console.error(`[PushColors] ✗ ERROR: ${key} -`, err.message);
            }
        }

        results.success = results.failed === 0;
        results.skipped = notFoundKeys.length;

        console.log('[PushColors] ========== COMPLETE ==========');
        console.log('[PushColors] Updated:', results.updated);
        console.log('[PushColors] Skipped (not found in GHL):', results.skipped);
        console.log('[PushColors] Failed:', results.failed);

        // Log push operation
        await supabaseAdmin.from('ghl_push_logs').insert({
            user_id: userId,
            funnel_id: funnelId,
            section: 'colors',
            values_pushed: results.updated,
            success: results.success,
        });

        return Response.json({
            success: true,
            ...results,
            colors: { primary, secondary, tertiary },
            message: `Updated ${results.updated} color value(s). ${results.skipped} custom value(s) not found in GHL (will not be created).`
        });

    } catch (error) {
        console.error('[PushColors] FATAL ERROR:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
