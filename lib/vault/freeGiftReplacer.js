/**
 * Free Gift Title Replacer
 * 
 * Replaces [Free Gift] placeholders with the actual Lead Magnet title
 * throughout generated vault content.
 */

/**
 * Replace all instances of [Free Gift] placeholder with actual title
 * @param {string|object|array} content - Content to process
 * @param {string} leadMagnetTitle - The actual Lead Magnet title
 * @returns {string|object|array} Content with placeholders replaced
 */
export function replaceFreeGiftPlaceholder(content, leadMagnetTitle) {
    // If no title provided, return content as-is
    if (!leadMagnetTitle || typeof leadMagnetTitle !== 'string') {
        return content;
    }

    // Handle different content types
    if (typeof content === 'string') {
        // Replace case-insensitive [Free Gift] with actual title
        return content.replace(/\[Free Gift\]/gi, leadMagnetTitle);
    }

    if (Array.isArray(content)) {
        // Recursively process arrays
        return content.map(item => replaceFreeGiftPlaceholder(item, leadMagnetTitle));
    }

    if (typeof content === 'object' && content !== null) {
        // Recursively process objects
        const result = {};
        for (const [key, value] of Object.entries(content)) {
            result[key] = replaceFreeGiftPlaceholder(value, leadMagnetTitle);
        }
        return result;
    }

    // Return primitives as-is
    return content;
}

/**
 * Extract Lead Magnet title from vault data
 * @param {object} vaultData - Full vault data object
 * @returns {string|null} Lead Magnet title or null
 */
export function getLeadMagnetTitle(vaultData) {
    if (!vaultData || typeof vaultData !== 'object') {
        return null;
    }

    // Try to get from leadMagnet section
    const leadMagnet = vaultData.leadMagnet;
    if (!leadMagnet) return null;

    // Check for mainTitle (most common field)
    if (leadMagnet.mainTitle && typeof leadMagnet.mainTitle === 'string') {
        return leadMagnet.mainTitle.trim();
    }

    // Fallback: check titleAndHook.mainTitle (nested structure)
    if (leadMagnet.titleAndHook?.mainTitle && typeof leadMagnet.titleAndHook.mainTitle === 'string') {
        return leadMagnet.titleAndHook.mainTitle.trim();
    }

    // Fallback: check leadMagnetIdea.concept
    if (leadMagnet.leadMagnetIdea?.concept && typeof leadMagnet.leadMagnetIdea.concept === 'string') {
        return leadMagnet.leadMagnetIdea.concept.trim();
    }

    return null;
}

/**
 * Apply Free Gift replacement to vault data
 * @param {object} vaultData - Full vault data object
 * @returns {object} Vault data with [Free Gift] replaced
 */
export function applyFreeGiftReplacement(vaultData) {
    if (!vaultData || typeof vaultData !== 'object') {
        return vaultData;
    }

    // Extract Lead Magnet title
    const leadMagnetTitle = getLeadMagnetTitle(vaultData);

    if (!leadMagnetTitle) {
        // No title found, return as-is
        return vaultData;
    }

    // Apply replacement to all sections except leadMagnet itself
    const result = {};
    for (const [sectionId, sectionContent] of Object.entries(vaultData)) {
        if (sectionId === 'leadMagnet') {
            // Don't replace in the Lead Magnet section itself
            result[sectionId] = sectionContent;
        } else {
            // Replace in all other sections
            result[sectionId] = replaceFreeGiftPlaceholder(sectionContent, leadMagnetTitle);
        }
    }

    return result;
}
