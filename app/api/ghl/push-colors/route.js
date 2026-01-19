/**
 * Push Colors to GHL Custom Values
 * Pushes only color values with AI validation for contrast
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { COLORS_MAP } from '@/lib/ghl/customValuesMap';
import { validateAndFormatColor, ensureReadableColor } from '@/lib/ghl/contentPolisher';

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

        console.log('[PushColors] Starting push for funnel:', funnelId);

        // Get GHL credentials
        const { data: credentials, error: credError } = await supabaseAdmin
            .from('ghl_credentials')
            .select('location_id, access_token')
            .eq('user_id', userId)
            .single();

        if (credError || !credentials) {
            return Response.json({ error: 'GHL not connected' }, { status: 400 });
        }

        // Get colors from user profile (intake form questionnaire)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('brand_colors, questionnaire_data')
            .eq('user_id', userId)
            .single();

        if (profileError) {
            return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Extract colors from profile or questionnaire
        const colors = extractColors(profile);

        // Build custom values payload with AI validation
        const customValues = [];

        for (const [page, colorMap] of Object.entries(COLORS_MAP)) {
            for (const [field, ghlKey] of Object.entries(colorMap)) {
                const role = getColorRole(field);
                let colorValue = colors[field] || colors[role] || getDefaultForRole(role);

                // Validate and convert to HEX
                colorValue = validateAndFormatColor(colorValue, role);

                // Ensure readable if it's a text color on white background
                if (role === 'text' || field.includes('Text') || field.includes('headline')) {
                    colorValue = ensureReadableColor(colorValue, role);
                }

                customValues.push({
                    key: ghlKey,
                    value: colorValue,
                });
            }
        }

        console.log('[PushColors] Pushing', customValues.length, 'color values to GHL');

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
                section: 'colors',
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
        console.error('[PushColors] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Extract colors from profile data
 */
function extractColors(profile) {
    const colors = {};

    // From brand_colors field
    if (profile.brand_colors) {
        Object.assign(colors, profile.brand_colors);
    }

    // From questionnaire (Q15)
    if (profile.questionnaire_data?.brandColors) {
        const brandColors = profile.questionnaire_data.brandColors;
        if (typeof brandColors === 'string') {
            // Parse "Primary: #00BFFF, Secondary: #1A1A1D" format
            const parts = brandColors.split(',');
            parts.forEach(part => {
                const match = part.match(/(\w+):\s*(#?[\w]+)/i);
                if (match) {
                    colors[match[1].toLowerCase()] = match[2];
                }
            });
        } else if (typeof brandColors === 'object') {
            Object.assign(colors, brandColors);
        }
    }

    return colors;
}

function getColorRole(field) {
    if (field.includes('text') || field.includes('Text')) return 'text';
    if (field.includes('background') || field.includes('Background') || field.includes('bg')) return 'background';
    if (field.includes('cta') || field.includes('CTA') || field.includes('button') || field.includes('Button')) return 'button';
    if (field.includes('border') || field.includes('Border')) return 'border';
    return 'text';
}

function getDefaultForRole(role) {
    const defaults = {
        text: '#000000',
        headline: '#000000',
        background: '#FFFFFF',
        button: '#00BFFF',
        cta: '#00BFFF',
        border: '#E0E0E0',
    };
    return defaults[role] || '#000000';
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
