/**
 * Push Colors to GHL Custom Values
 * Uses OAuth via ghl_subaccounts (same as deploy-workflow)
 * Uses customValuesMap.js for correct GHL key mapping
 * Uses contentPolisher.js for color validation/formatting
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { COLORS_MAP } from '@/lib/ghl/customValuesMap';
import { validateAndFormatColor } from '@/lib/ghl/contentPolisher';

export const dynamic = 'force-dynamic';

/**
 * Get location access token for GHL API calls (OAuth)
 */
async function getLocationToken(userId, locationId) {
    const { data: subaccount } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (!subaccount) {
        return { success: false, error: 'No sub-account found for user' };
    }

    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!tokenData?.company_id) {
        return { success: false, error: 'No agency token found' };
    }

    const response = await fetch(
        'https://services.leadconnectorhq.com/oauth/locationToken',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({
                companyId: tokenData.company_id,
                locationId: locationId || subaccount.location_id,
            }),
        }
    );

    if (!response.ok) {
        return { success: false, error: 'Failed to generate location token' };
    }

    const data = await response.json();
    return {
        success: true,
        access_token: data.access_token,
        location_id: locationId || subaccount.location_id
    };
}

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

        console.log('[PushColors] Starting push for funnel:', funnelId);

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

        // Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;

        // Fetch existing custom values
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v.id);
            existingMap.set(v.name.toLowerCase(), v.id);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v.id);
        });

        // Get brand colors from user profile or funnel wizard answers
        const { data: funnel } = await supabaseAdmin
            .from('user_funnels')
            .select('wizard_answers')
            .eq('id', funnelId)
            .single();

        // Extract brand colors from wizard answers
        let brandColors = {};
        if (funnel?.wizard_answers) {
            const wa = funnel.wizard_answers;
            // Look for brandColors in various locations
            if (wa.brandColors) {
                brandColors = parseBrandColors(wa.brandColors);
            } else if (wa['15']) {
                brandColors = parseBrandColors(wa['15']);
            }
        }

        // Build custom values using COLORS_MAP
        const customValues = [];

        // Apply brand colors to all color fields
        for (const [section, fields] of Object.entries(COLORS_MAP)) {
            for (const [field, ghlKey] of Object.entries(fields)) {
                // Determine color role and apply appropriate color
                const role = getColorRole(field);
                let colorValue = getColorForRole(role, brandColors);

                // Validate and format color
                colorValue = validateAndFormatColor(colorValue, role);

                customValues.push({
                    key: ghlKey,
                    value: colorValue,
                    existingId: existingMap.get(ghlKey) || existingMap.get(ghlKey.toLowerCase())
                });
            }
        }

        console.log('[PushColors] Pushing', customValues.length, 'values');

        // Push to GHL
        const results = { success: true, pushed: 0, updated: 0, created: 0, failed: 0, errors: [] };

        for (const { key, value, existingId } of customValues) {
            try {
                let response;

                if (existingId) {
                    response = await fetch(
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
                    if (response.ok) { results.updated++; results.pushed++; }
                } else {
                    response = await fetch(
                        `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                                'Version': '2021-07-28',
                            },
                            body: JSON.stringify({ name: key, value }),
                        }
                    );
                    if (response.ok) { results.created++; results.pushed++; }
                }

                if (!response.ok) {
                    results.failed++;
                    const err = await response.json().catch(() => ({}));
                    results.errors.push({ key, error: err });
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ key, error: err.message });
            }
        }

        results.success = results.failed === 0;

        // Log push
        await supabaseAdmin.from('ghl_push_logs').insert({
            user_id: userId,
            funnel_id: funnelId,
            section: 'colors',
            values_pushed: results.pushed,
            success: results.success,
        });

        return Response.json({ success: true, ...results });

    } catch (error) {
        console.error('[PushColors] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Parse brand colors from string or object format
 */
function parseBrandColors(input) {
    if (typeof input === 'object') return input;

    const colors = { primary: '#00BFFF', secondary: '#1A1A1D', accent: '#FF4500' };

    if (typeof input === 'string') {
        // Parse "Primary: #00BFFF, Secondary: #1A1A1D" format
        const matches = input.matchAll(/(\w+):\s*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|\w+)/g);
        for (const match of matches) {
            const key = match[1].toLowerCase();
            colors[key] = match[2];
        }
    }

    return colors;
}

/**
 * Get color role from field name
 */
function getColorRole(field) {
    const lowerField = field.toLowerCase();
    if (lowerField.includes('background') || lowerField.includes('bg')) return 'background';
    if (lowerField.includes('cta') || lowerField.includes('button')) return 'cta';
    if (lowerField.includes('border')) return 'border';
    if (lowerField.includes('headline')) return 'headline';
    return 'text';
}

/**
 * Get color for a specific role based on brand colors
 */
function getColorForRole(role, brandColors) {
    const { primary = '#00BFFF', secondary = '#1A1A1D', accent = '#FF4500' } = brandColors;

    switch (role) {
        case 'cta': return accent;
        case 'background': return secondary;
        case 'headline': return primary;
        case 'border': return primary;
        default: return '#333333'; // Default text color
    }
}
