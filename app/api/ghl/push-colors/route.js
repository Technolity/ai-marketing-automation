/**
 * Push Colors to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses customValuesMap.js for correct GHL key mapping
 * Uses contentPolisher.js for color validation/formatting
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { COLORS_MAP } from '@/lib/ghl/customValuesMap';
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

        // Get brand colors with priority: vault_content > questionnaire_responses > wizard_answers
        let brandColors = {};

        // FIRST: Try AI-generated colors from vault_content
        const { data: vaultColors } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'colors')
            .eq('field_id', 'colorPalette')
            .eq('is_current_version', true)
            .maybeSingle();

        if (vaultColors?.field_value) {
            console.log('[PushColors] Using AI-generated colors from vault_content');
            try {
                const parsed = typeof vaultColors.field_value === 'string'
                    ? JSON.parse(vaultColors.field_value)
                    : vaultColors.field_value;

                // Convert AI format to simple format
                brandColors = {
                    primary: parsed.primaryColor?.hex || parsed.primary,
                    secondary: parsed.secondaryColor?.hex || parsed.secondary,
                    accent: parsed.accentColor?.hex || parsed.accent
                };
            } catch (e) {
                console.error('[PushColors] Error parsing vault colors:', e);
            }
        }

        // SECOND: Try questionnaire_responses
        if (!brandColors.primary) {
            const { data: questionnaireData } = await supabaseAdmin
                .from('questionnaire_responses')
                .select('answer_text, answer_json')
                .eq('funnel_id', funnelId)
                .in('question_id', [15, 21]) // Brand colors question
                .limit(1)
                .maybeSingle();

            if (questionnaireData) {
                console.log('[PushColors] Using colors from questionnaire_responses');
                const colorText = questionnaireData.answer_text || '';
                brandColors = parseBrandColors(colorText);
            }
        }

        // THIRD: Try wizard_answers fallback
        if (!brandColors.primary) {
            const { data: funnel } = await supabaseAdmin
                .from('user_funnels')
                .select('wizard_answers')
                .eq('id', funnelId)
                .single();

            if (funnel?.wizard_answers) {
                console.log('[PushColors] Using colors from wizard_answers');
                const wa = funnel.wizard_answers;
                const colorInput = wa.brandColors || wa['21'] || wa['15'] || '';
                brandColors = parseBrandColors(colorInput);
            }
        }

        // Final fallback to defaults if still empty
        if (!brandColors.primary) {
            console.log('[PushColors] No brand colors found, using defaults');
            brandColors = {
                primary: '#00BFFF',
                secondary: '#1A1A1D',
                accent: '#FF4500'
            };
        }

        console.log('[PushColors] Brand colors to use:', brandColors);

        // Expand brand colors into full palette with calculated variants
        const palette = expandColorPalette(brandColors);

        // Build custom values using COLORS_MAP
        const customValues = [];

        // Apply smart color mapping to all color fields
        for (const [section, fields] of Object.entries(COLORS_MAP)) {
            console.log(`[PushColors] Processing section: ${section}, fields: ${Object.keys(fields).length}`);

            for (const [field, ghlKey] of Object.entries(fields)) {
                // Get detailed role for this custom value
                const role = getColorRole(ghlKey);

                // Assign color based on role with smart logic
                let colorValue = getColorForRole(role, palette);

                // Validate hex color
                colorValue = ensureValidHex(colorValue, '#000000');

                console.log(`[PushColors]   ${field} → ${ghlKey} = ${colorValue} (${role.context}/${role.element})`);

                customValues.push({
                    key: ghlKey,
                    value: colorValue,
                    existingId: existingMap.get(ghlKey) || existingMap.get(ghlKey.toLowerCase()),
                    role: `${role.context}/${role.element}`
                });
            }
        }

        console.log('[PushColors] Total custom values to push:', customValues.length);
        console.log('[PushColors] Sample mappings:');
        customValues.slice(0, 5).forEach(cv => {
            console.log(`[PushColors]   ${cv.key} = ${cv.value} (${cv.role})`);
        });

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
 * Calculate relative luminance of a color (0-1, where 0 is black, 1 is white)
 * Used for WCAG contrast calculations
 */
function calculateLuminance(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate luminance
    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Get contrasting text color (dark or light) for a given background
 */
function getContrastingTextColor(bgColor) {
    const luminance = calculateLuminance(bgColor);
    // If background is bright (luminance > 0.5), use dark text
    // If background is dark (luminance <= 0.5), use light text
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Validate and normalize hex color
 */
function ensureValidHex(color, fallback = '#000000') {
    if (!color) return fallback;

    // Remove # if present
    const hex = color.replace('#', '');

    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
        console.log(`[PushColors] ⚠ Invalid hex color: ${color}, using fallback: ${fallback}`);
        return fallback;
    }

    return '#' + hex;
}

/**
 * Parse brand colors from string or object format
 */
function parseBrandColors(input) {
    console.log('[PushColors] Parsing brand colors from input:', typeof input, input?.substring?.(0, 100));

    if (typeof input === 'object' && input !== null) {
        return {
            primary: ensureValidHex(input.primary, '#00BFFF'),
            secondary: ensureValidHex(input.secondary, '#1A1A1D'),
            accent: ensureValidHex(input.accent, '#FF4500')
        };
    }

    const colors = { primary: '#00BFFF', secondary: '#1A1A1D', accent: '#FF4500' };

    if (typeof input === 'string' && input.trim()) {
        // Parse "Primary: #00BFFF, Secondary: #1A1A1D" format
        const matches = input.matchAll(/(primary|secondary|accent):\s*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|\w+)/gi);
        for (const match of matches) {
            const key = match[1].toLowerCase();
            colors[key] = ensureValidHex(match[2], colors[key]);
        }

        // Also try to extract any hex codes if no labels found
        const hexMatches = input.match(/#[0-9A-Fa-f]{6}/g);
        if (hexMatches && hexMatches.length >= 2) {
            colors.primary = ensureValidHex(hexMatches[0], colors.primary);
            colors.secondary = ensureValidHex(hexMatches[1], colors.secondary);
            if (hexMatches[2]) {
                colors.accent = ensureValidHex(hexMatches[2], colors.accent);
            }
        }
    }

    console.log('[PushColors] Parsed colors:', colors);
    return colors;
}

/**
 * Expand brand colors into full palette with light/dark variants
 */
function expandColorPalette(brandColors) {
    const { primary, secondary, accent } = brandColors;

    const palette = {
        // Brand colors
        primary,
        secondary,
        accent,

        // Calculated colors
        textLight: '#FFFFFF',
        textDark: '#000000',
        textBody: '#333333',
        bgLight: '#FFFFFF',
        bgDark: secondary, // Use brand secondary as dark bg

        // CTA with auto-contrast
        ctaBg: accent,
        ctaText: getContrastingTextColor(accent),

        // Header (light bg, dark text)
        headerBg: '#F5F5F5',
        headerText: '#000000',

        // Footer (dark bg, light text)
        footerBg: secondary,
        footerText: '#FFFFFF',

        // Cards (slightly darker than white)
        cardBg: '#F9F9F9',
        cardText: '#333333',

        // Borders
        borderPrimary: primary,
        borderLight: '#E0E0E0'
    };

    console.log('[PushColors] Expanded palette:', palette);
    return palette;
}

/**
 * Get detailed color role from GHL custom value key
 * Returns object with { type, context, element }
 */
function getColorRole(ghlKey) {
    const lower = ghlKey.toLowerCase();

    // Determine context (header, footer, body)
    let context = 'body';
    if (lower.includes('header')) context = 'header';
    else if (lower.includes('footer')) context = 'footer';
    else if (lower.includes('card') || lower.includes('testimonial')) context = 'card';

    // Determine element type
    let element = 'text';
    if (lower.includes('background') || lower.includes('_bg_')) element = 'background';
    else if (lower.includes('border')) element = 'border';
    else if (lower.includes('cta')) element = 'cta';
    else if (lower.includes('headline') || lower.includes('heading')) element = 'headline';
    else if (lower.includes('subheadline') || lower.includes('subheading')) element = 'subheadline';
    else if (lower.includes('bullet')) element = 'bullet';
    else if (lower.includes('pill')) element = 'pill';

    const role = { context, element, key: ghlKey };
    console.log(`[PushColors] Role for "${ghlKey}": ${context}/${element}`);
    return role;
}

/**
 * Get color for a specific role based on expanded palette
 * Uses smart logic to ensure proper contrast
 */
function getColorForRole(role, palette) {
    const { context, element } = role;

    // Background colors
    if (element === 'background') {
        if (context === 'header') return palette.headerBg;
        if (context === 'footer') return palette.footerBg;
        if (context === 'card') return palette.cardBg;
        if (element === 'cta') return palette.ctaBg;
        return palette.bgLight; // Default light background
    }

    // CTA colors
    if (element === 'cta') {
        // CTA background uses accent, CTA text uses contrasting color
        if (role.key.toLowerCase().includes('text') || role.key.toLowerCase().includes('colour')) {
            return palette.ctaText;
        }
        return palette.ctaBg;
    }

    // Pill colors (similar to CTA)
    if (element === 'pill') {
        if (role.key.toLowerCase().includes('text')) {
            return palette.ctaText;
        }
        return palette.ctaBg;
    }

    // Text colors
    if (element === 'text' || element === 'headline' || element === 'subheadline' || element === 'bullet') {
        if (context === 'header') return palette.headerText; // Dark text for header
        if (context === 'footer') return palette.footerText; // Light text for footer
        if (context === 'card') return palette.cardText;     // Dark text for cards

        // Headlines are usually darker/bolder
        if (element === 'headline') return palette.primary;

        // Body text
        return palette.textBody;
    }

    // Border colors
    if (element === 'border') {
        return palette.borderPrimary;
    }

    // Default fallback
    console.log(`[PushColors] ⚠ Unhandled role: ${context}/${element}, using default`);
    return palette.textBody;
}
