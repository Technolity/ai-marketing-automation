/**
 * Section Dependencies - Maps which sections depend on values from other sections
 * 
 * When a dependent field is updated, sections that use it can be triggered for regeneration
 * or have specific values replaced.
 */

export const SECTION_DEPENDENCIES = {
    // Offer name is used in multiple scripts
    'offer.offerName': {
        usedIn: ['setterScript', 'salesScripts', 'emails', 'vsl'],
        replacement: {
            placeholder: /\{offer_name\}|your program|the program|our program/gi,
            sourceField: 'offer.offerName'
        }
    },

    // Lead Magnet title is referenced in ads, emails, SMS
    'leadMagnet.mainTitle': {
        usedIn: ['facebookAds', 'emails', 'sms', 'funnelCopy'],
        replacement: {
            placeholder: /\{lead_magnet\}|free gift|your free guide|the free guide/gi,
            sourceField: 'leadMagnet.mainTitle'
        }
    },

    // Message one-liner is used in bio and various copy
    'message.oneLineMessage': {
        usedIn: ['bio', 'funnelCopy'],
        replacement: {
            placeholder: /\{one_liner\}/gi,
            sourceField: 'message.oneLineMessage'
        }
    }
};

/**
 * Get all sections that depend on a given field
 * @param {string} fieldPath - e.g., 'offer.offerName'
 * @returns {string[]} - Array of section IDs that use this field
 */
export function getDependentSections(fieldPath) {
    const dependency = SECTION_DEPENDENCIES[fieldPath];
    return dependency?.usedIn || [];
}

/**
 * Replace placeholder values in content with actual values from dependencies
 * @param {object} content - Section content to process
 * @param {object} allVaultData - Full vault data for looking up values
 * @returns {object} - Content with placeholders replaced
 */
export function resolveDependencies(content, allVaultData) {
    if (!content || typeof content !== 'object') return content;

    let contentStr = JSON.stringify(content);

    // Apply each dependency replacement
    for (const [fieldPath, config] of Object.entries(SECTION_DEPENDENCIES)) {
        if (!config.replacement) continue;

        // Get the source value
        const [sectionId, fieldId] = fieldPath.split('.');
        const sourceValue = allVaultData?.[sectionId]?.[fieldId];

        if (sourceValue && typeof sourceValue === 'string') {
            // Replace placeholders with actual value
            contentStr = contentStr.replace(config.replacement.placeholder, sourceValue);
        }
    }

    return JSON.parse(contentStr);
}

/**
 * Check if editing this field should notify user about dependent sections
 * @param {string} sectionId - Section being edited
 * @param {string} fieldId - Field being edited
 * @returns {object|null} - Dependency info if dependencies exist
 */
export function checkDependencyImpact(sectionId, fieldId) {
    const fieldPath = `${sectionId}.${fieldId}`;
    const dependency = SECTION_DEPENDENCIES[fieldPath];

    if (dependency && dependency.usedIn.length > 0) {
        return {
            fieldPath,
            affectedSections: dependency.usedIn,
            message: `Updating "${fieldId}" may affect ${dependency.usedIn.length} other sections: ${dependency.usedIn.join(', ')}`
        };
    }

    return null;
}
