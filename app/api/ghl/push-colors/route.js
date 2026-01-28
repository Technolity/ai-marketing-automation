/**
 * Push Colors to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * ONLY UPDATES existing custom values (never creates new ones)
 *
 * SIMPLIFIED: Only 3 universal color custom values:
 * - primary_color (backgrounds, headers, CTAs)
 * - secondary_color (alternating backgrounds)
 * - tertiary_color (text colors)
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues } from '@/lib/ghl/ghlKeyMatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

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

        // Fetch existing custom values using shared utility
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        console.log('[PushColors] Found', existingValues.length, 'existing custom values in GHL');

        // ========== LOG COLOR-RELATED CUSTOM VALUES ==========
        console.log('[PushColors] ========== COLOR CUSTOM VALUES IN GHL ==========');
        const colorRelated = existingValues.filter(v =>
            v.name.toLowerCase().includes('color') ||
            v.name.toLowerCase().includes('primary') ||
            v.name.toLowerCase().includes('secondary') ||
            v.name.toLowerCase().includes('tertiary')
        );
        console.log(`[PushColors] Found ${colorRelated.length} color-related custom values:`);
        colorRelated.forEach(v => {
            console.log(`  - "${v.name}" (ID: ${v.id})`);
        });
        console.log('[PushColors] ========== END COLOR CUSTOM VALUES ==========');

        // Build enhanced lookup map with 11-level matching
        const existingMap = buildExistingMap(existingValues);

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

        console.log('[PushColors] ========== BRAND COLORS ==========');
        console.log('[PushColors] Primary (backgrounds, headers, CTAs):', primary);
        console.log('[PushColors] Secondary (alternating backgrounds):', secondary);
        console.log('[PushColors] Tertiary (text colors):', tertiary);

        // SIMPLIFIED: Only 3 universal color custom values
        // GHL uses these colors across ALL pages via CSS variables
        const colorMappings = {
            'primary_color': primary,
            'secondary_color': secondary,
            'tertiary_color': tertiary,
        };

        const customValues = [];
        const notFoundKeys = [];

        console.log('[PushColors] ========== MAPPING COLORS ==========');
        for (const [ghlKey, hexValue] of Object.entries(colorMappings)) {
            if (!hexValue) continue;

            // Use enhanced 11-level key matching
            const existingId = findExistingId(existingMap, ghlKey);

            if (existingId) {
                customValues.push({
                    key: ghlKey,
                    value: hexValue,
                    existingId
                });
                console.log(`[PushColors] ✓ Mapped: ${ghlKey} = ${hexValue} (ID: ${existingId})`);
            } else {
                notFoundKeys.push(ghlKey);
                console.log(`[PushColors] ✗ NOT FOUND: ${ghlKey} (tried 11 naming variations)`);
            }
        }
        console.log('[PushColors] ========== END MAPPING ==========');

        if (customValues.length === 0) {
            return Response.json({
                error: 'No color custom values found in GHL',
                notFoundKeys,
                hint: 'Make sure primary_color, secondary_color, and tertiary_color exist in GHL'
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
            message: `Updated ${results.updated} color value(s). These colors will be used across all pages in your funnel.`
        });

    } catch (error) {
        console.error('[PushColors] FATAL ERROR:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
