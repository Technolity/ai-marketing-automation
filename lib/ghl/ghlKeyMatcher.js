/**
 * GHL Key Matcher - Shared utility for finding GHL custom values
 *
 * GHL uses inconsistent naming conventions across custom values.
 * This utility provides 11-level fallback matching to find the correct value ID.
 *
 * Examples of GHL naming variations:
 * - "03_vsl_bio_image" vs "03 VSL Bio Image" vs "03 VSL bio Image"
 * - "subheadline" vs "Sub-Headline" vs "sub_headline"
 * - "Optin" vs "Opt In"
 */

/**
 * Build an enhanced lookup map from GHL custom values
 * Stores multiple format variants for each value
 *
 * @param {Array} existingValues - Array of {id, name} from GHL API
 * @returns {Map} Map with multiple key formats pointing to {id, name}
 */
export function buildExistingMap(existingValues) {
    const existingMap = new Map();

    existingValues.forEach(v => {
        const entry = { id: v.id, name: v.name };

        // Store by name in various formats
        existingMap.set(v.name, entry);
        existingMap.set(v.name.toLowerCase(), entry);
        existingMap.set(v.name.replace(/\s+/g, '_'), entry);
        existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), entry);
        // Remove dashes and spaces
        existingMap.set(v.name.replace(/[-\s]+/g, '_').toLowerCase(), entry);
        // Handle "Sub -Headline" -> "sub_headline"
        existingMap.set(v.name.replace(/\s*-\s*/g, '_').replace(/\s+/g, '_').toLowerCase(), entry);
    });

    return existingMap;
}

/**
 * Convert a key to GHL's naming format
 * Based on actual GHL custom value names:
 * - "03 Optin Sub-Headline Text" (Optin as one word)
 * - "03 VSL hero Sub-Headline Text" (hero lowercase)
 * - "03 VSL Process 1 Sub-Headline"
 */
function toGhlFormat(key) {
    return key
        // First handle double underscores → space-dash-space (like "Sub - Headline")
        .replace(/__/g, ' - ')
        // Then regular underscores to spaces
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        // Specific word transforms for GHL naming
        .replace(/Subheadline/gi, 'Sub-Headline')  // Hyphenated Sub-Headline
        .replace(/Subtext/gi, 'Sub-Text')
        .replace(/Thankyou/gi, 'Thankyou')
        // Keep Optin as one word (NOT "Opt In") based on actual GHL names
        .replace(/Opt In/gi, 'Optin')
        .replace(/Vsl/gi, 'VSL')
        .replace(/Cta/gi, 'CTA')
        .replace(/Faq/gi, 'FAQ')
        .replace(/Calender/gi, 'Calender')  // GHL spelling
        .replace(/\bAbove\b/g, 'above')  // GHL uses lowercase 'above'
        // GHL uses lowercase 'hero' in "03 VSL hero Sub-Headline Text"
        .replace(/\bHero\b/g, 'hero');
}


/**
 * Find existing GHL custom value using 11-level fallback matching
 *
 * @param {Map} existingMap - Map from buildExistingMap()
 * @param {string} ghlKey - The GHL key to find (e.g., "03_vsl_bio_image")
 * @returns {{id: string, name: string}|null} The existing value entry or null if not found
 */
export function findExistingId(existingMap, ghlKey) {
    // 1. Exact match
    if (existingMap.has(ghlKey)) return existingMap.get(ghlKey);

    // 2. Lowercase
    const lower = ghlKey.toLowerCase();
    if (existingMap.has(lower)) return existingMap.get(lower);

    // 3. Replace spaces with underscores
    const spacesToUnder = ghlKey.replace(/\s+/g, '_');
    if (existingMap.has(spacesToUnder)) return existingMap.get(spacesToUnder);

    // 4. Lowercase + replace spaces
    const lowerUnder = lower.replace(/\s+/g, '_');
    if (existingMap.has(lowerUnder)) return existingMap.get(lowerUnder);

    // 5. Replace underscores with spaces (GHL Title Case format)
    const underToSpaces = ghlKey.replace(/_/g, ' ');
    if (existingMap.has(underToSpaces)) return existingMap.get(underToSpaces);

    // 6. Title Case with spaces: "03_vsl_bio_image" → "03 VSL Bio Image"
    const titleCase = ghlKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    if (existingMap.has(titleCase)) return existingMap.get(titleCase);

    // 7. Lowercase with spaces
    const lowerSpaces = ghlKey.replace(/_/g, ' ').toLowerCase();
    if (existingMap.has(lowerSpaces)) return existingMap.get(lowerSpaces);

    // 8. Try matching without prefix (03_ or 02_)
    const withoutPrefix = ghlKey.replace(/^0[23]_/, '');
    const titleCaseNoPrefix = withoutPrefix.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    // Try "03 " + titleCase version
    if (existingMap.has('03 ' + titleCaseNoPrefix)) return existingMap.get('03 ' + titleCaseNoPrefix);
    if (existingMap.has('02 ' + titleCaseNoPrefix)) return existingMap.get('02 ' + titleCaseNoPrefix);

    // 9. Handle GHL's hyphenated naming: "subheadline" → "Sub-Headline"
    const ghlFormat = toGhlFormat(ghlKey);
    if (existingMap.has(ghlFormat)) return existingMap.get(ghlFormat);
    const ghlFormatLower = ghlFormat.toLowerCase();
    if (existingMap.has(ghlFormatLower)) return existingMap.get(ghlFormatLower);

    // 10. Try with 03/02 prefix in GHL format
    const ghlFormatNoPrefix = toGhlFormat(withoutPrefix);
    if (existingMap.has('03 ' + ghlFormatNoPrefix)) return existingMap.get('03 ' + ghlFormatNoPrefix);
    if (existingMap.has('02 ' + ghlFormatNoPrefix)) return existingMap.get('02 ' + ghlFormatNoPrefix);

    // 11. Try lowercase hero → "hero" (GHL keeps some words lowercase)
    const ghlFormatLowerHero = ghlFormat.replace(/Hero/g, 'hero');
    if (existingMap.has(ghlFormatLowerHero)) return existingMap.get(ghlFormatLowerHero);

    // 12. Try lowercase sub-headline variant: "sub-Headline" instead of "Sub-Headline"
    const ghlFormatLowerSub = ghlFormat.replace(/Sub-Headline/g, 'sub-Headline');
    if (existingMap.has(ghlFormatLowerSub)) return existingMap.get(ghlFormatLowerSub);
    if (existingMap.has('03 ' + ghlFormatNoPrefix.replace(/Sub-Headline/g, 'sub-Headline'))) {
        return existingMap.get('03 ' + ghlFormatNoPrefix.replace(/Sub-Headline/g, 'sub-Headline'));
    }

    // 13. Try "Sub - Headline" with spaces around dash
    const ghlFormatSpaceDash = ghlFormat.replace(/Sub-Headline/g, 'Sub - Headline');
    if (existingMap.has(ghlFormatSpaceDash)) return existingMap.get(ghlFormatSpaceDash);

    // 14. Try "Sub-Text" variants (GHL sometimes uses lowercase "Sub-text")
    const ghlFormatSubText = ghlFormat.replace(/Sub-Text/g, 'Sub-text');
    if (existingMap.has(ghlFormatSubText)) return existingMap.get(ghlFormatSubText);
    if (existingMap.has(ghlFormatSubText.toLowerCase())) return existingMap.get(ghlFormatSubText.toLowerCase());
    const ghlFormatSubTextSpace = ghlFormat.replace(/Sub-Text/g, 'Sub - Text');
    if (existingMap.has(ghlFormatSubTextSpace)) return existingMap.get(ghlFormatSubTextSpace);

    return null;
}

/**
 * Fetch existing GHL custom values with pagination
 *
 * @param {string} locationId - GHL location ID
 * @param {string} accessToken - OAuth access token
 * @param {number} maxPages - Maximum pages to fetch (default 5, max 500 values)
 * @returns {Promise<Array>} Array of custom values {id, name, value}
 */
export async function fetchExistingCustomValues(locationId, accessToken, maxPages = 5) {
    const allValues = [];
    let skip = 0;
    let page = 0;

    while (page < maxPages) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout per page

        try {
            const resp = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Version': '2021-07-28'
                    },
                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!resp.ok) {
                console.log(`[GHLKeyMatcher] Warning: Failed to fetch page ${page + 1}`);
                break;
            }

            // Check for HTML response (GHL error page)
            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                console.error('[GHLKeyMatcher] GHL returned HTML instead of JSON');
                break;
            }

            const data = await resp.json();
            const values = data.customValues || [];
            allValues.push(...values);

            console.log(`[GHLKeyMatcher] Fetched page ${page + 1}: ${values.length} values (total: ${allValues.length})`);

            if (values.length < 100) break;
            skip += 100;
            page++;
        } catch (e) {
            clearTimeout(timeout);
            console.log(`[GHLKeyMatcher] Warning: Timeout/error fetching page ${page + 1}:`, e.message);
            break;
        }
    }

    console.log(`[GHLKeyMatcher] Total existing values found: ${allValues.length}`);
    return allValues;
}

/**
 * Update a single GHL custom value
 *
 * @param {string} locationId - GHL location ID
 * @param {string} accessToken - OAuth access token
 * @param {string} existingId - ID of the custom value to update
 * @param {string} ghlKey - The key name (for logging)
 * @param {string} value - The new value
 * @returns {Promise<{success: boolean, key: string, error?: string}>}
 */
export async function updateCustomValue(locationId, accessToken, existingId, ghlKey, value) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const resp = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({ name: ghlKey, value: String(value) }),
                signal: controller.signal,
            }
        );

        clearTimeout(timeout);
        return { success: resp.ok, key: ghlKey };
    } catch (e) {
        clearTimeout(timeout);
        return { success: false, key: ghlKey, error: e.message };
    }
}

export default {
    buildExistingMap,
    findExistingId,
    fetchExistingCustomValues,
    updateCustomValue,
};
