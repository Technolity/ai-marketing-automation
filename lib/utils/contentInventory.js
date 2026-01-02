/**
 * Content Inventory Utility
 * 
 * Helps track which content sections are complete, missing, or partial.
 * Used by generation flow to ensure all required content is present.
 */

// Required content sections mapped by numeric key
// Keys 1-16 correspond to osPrompts in generate/route.js
export const CONTENT_SECTIONS = {
    // Business Core (6 sections) - Required for Phase 1
    1: { name: 'Ideal Client Profile', category: 'businessCore', required: true },
    2: { name: 'Million-Dollar Message', category: 'businessCore', required: true },
    3: { name: 'Signature Story', category: 'businessCore', required: true },
    4: { name: '8-Week Program', category: 'businessCore', required: true },
    5: { name: 'Closer Script', category: 'businessCore', required: true },
    6: { name: 'Lead Magnet', category: 'businessCore', required: true },

    // Marketing Assets (4 sections) - Required for Phase 2
    7: { name: 'VSL Script', category: 'marketing', required: true },
    8: { name: 'Email Sequence', category: 'marketing', required: true },
    9: { name: 'Facebook Ads', category: 'marketing', required: true },
    10: { name: 'Funnel Copy', category: 'marketing', required: true },

    // Extended Content (6 sections) - Optional
    11: { name: 'Content Ideas', category: 'extended', required: false },
    12: { name: '12-Month Program', category: 'extended', required: false },
    13: { name: 'YouTube Show', category: 'extended', required: false },
    14: { name: 'Content Pillars', category: 'extended', required: false },
    15: { name: 'Bio', category: 'extended', required: false },
    16: { name: 'Appointment Reminders', category: 'extended', required: false }
};

// Section keys by category
export const BUSINESS_CORE_KEYS = [1, 2, 3, 4, 5, 6];
export const MARKETING_KEYS = [7, 8, 9, 10];
export const EXTENDED_KEYS = [11, 12, 13, 14, 15, 16];
export const ALL_REQUIRED_KEYS = [...BUSINESS_CORE_KEYS, ...MARKETING_KEYS];

/**
 * Check if a section has valid content
 * @param {any} content - The content to check
 * @returns {boolean} - True if content exists and is not empty
 */
function hasValidContent(content) {
    if (!content) return false;
    if (typeof content === 'object') {
        // Check if object has data property (API response format)
        if (content.data) {
            return Object.keys(content.data).length > 0;
        }
        // Check if object itself has keys
        return Object.keys(content).length > 0;
    }
    return Boolean(content);
}

/**
 * Inventory all content sections
 * @param {Object} content - The generated content object (keyed by section number or name)
 * @returns {Object} - Inventory with complete, missing, partial arrays and stats
 */
export function inventoryContent(content) {
    const inventory = {
        complete: [],
        missing: [],
        partial: [],
        byCategory: {
            businessCore: { complete: [], missing: [] },
            marketing: { complete: [], missing: [] },
            extended: { complete: [], missing: [] }
        },
        stats: {
            total: Object.keys(CONTENT_SECTIONS).length,
            complete: 0,
            missing: 0,
            requiredComplete: 0,
            requiredMissing: 0
        }
    };

    if (!content || typeof content !== 'object') {
        // Everything is missing
        Object.entries(CONTENT_SECTIONS).forEach(([key, section]) => {
            inventory.missing.push({ key: parseInt(key), ...section });
            inventory.byCategory[section.category].missing.push(parseInt(key));
            if (section.required) inventory.stats.requiredMissing++;
        });
        inventory.stats.missing = inventory.stats.total;
        return inventory;
    }

    // Check each section
    Object.entries(CONTENT_SECTIONS).forEach(([key, section]) => {
        const numKey = parseInt(key);

        // Content can be keyed by number or by name
        const sectionContent = content[numKey] || content[key] || content[section.name];

        if (hasValidContent(sectionContent)) {
            inventory.complete.push({ key: numKey, ...section, content: sectionContent });
            inventory.byCategory[section.category].complete.push(numKey);
            inventory.stats.complete++;
            if (section.required) inventory.stats.requiredComplete++;
        } else {
            inventory.missing.push({ key: numKey, ...section });
            inventory.byCategory[section.category].missing.push(numKey);
            inventory.stats.missing++;
            if (section.required) inventory.stats.requiredMissing++;
        }
    });

    return inventory;
}

/**
 * Check if Business Core is complete (sections 1-6)
 * @param {Object} content - The generated content
 * @returns {boolean} - True if all 6 Business Core sections are present
 */
export function isBusinessCoreComplete(content) {
    const inventory = inventoryContent(content);
    return inventory.byCategory.businessCore.missing.length === 0;
}

/**
 * Check if all required content is complete (sections 1-10)
 * @param {Object} content - The generated content
 * @returns {boolean} - True if all required sections are present
 */
export function isAllRequiredComplete(content) {
    const inventory = inventoryContent(content);
    return inventory.stats.requiredMissing === 0;
}

/**
 * Get list of missing section keys
 * @param {Object} content - The generated content
 * @param {string} category - Optional category filter ('businessCore', 'marketing', 'extended', 'required')
 * @returns {number[]} - Array of missing section keys
 */
export function getMissingSectionKeys(content, category = null) {
    const inventory = inventoryContent(content);

    if (category === 'businessCore') {
        return inventory.byCategory.businessCore.missing;
    }
    if (category === 'marketing') {
        return inventory.byCategory.marketing.missing;
    }
    if (category === 'extended') {
        return inventory.byCategory.extended.missing;
    }
    if (category === 'required') {
        return inventory.missing
            .filter(s => s.required)
            .map(s => s.key);
    }

    return inventory.missing.map(s => s.key);
}

/**
 * Log content inventory to console (for debugging)
 * @param {Object} content - The generated content
 * @param {string} label - Label for the log
 */
export function logContentInventory(content, label = 'Content Inventory') {
    const inventory = inventoryContent(content);

    console.group(`📊 [${label}]`);
    console.log(`Complete: ${inventory.stats.complete}/${inventory.stats.total}`);
    console.log(`Required Complete: ${inventory.stats.requiredComplete}/10`);

    if (inventory.complete.length > 0) {
        console.log('✅ Complete sections:', inventory.complete.map(s => s.name).join(', '));
    }

    if (inventory.missing.length > 0) {
        console.warn('❌ Missing sections:', inventory.missing.map(s => `${s.key}: ${s.name}`).join(', '));
    }

    console.log('By Category:', {
        businessCore: `${inventory.byCategory.businessCore.complete.length}/6`,
        marketing: `${inventory.byCategory.marketing.complete.length}/4`,
        extended: `${inventory.byCategory.extended.complete.length}/6`
    });

    console.groupEnd();

    return inventory;
}

/**
 * Merge step preview content into final content structure
 * @param {Object} savedContent - Object with step1, step2, etc. keys
 * @returns {Object} - Merged content with numeric keys
 */
export function mergeStepPreviews(savedContent) {
    const merged = {};

    if (!savedContent || typeof savedContent !== 'object') {
        console.warn('[mergeStepPreviews] No saved content to merge');
        return merged;
    }

    // Map step numbers to content section keys
    const STEP_TO_SECTION = {
        1: null, // Industry - no direct section
        2: 1,    // Ideal Client -> Section 1
        3: 2,    // Message -> Section 2
        4: null, // Core Problem - preview only
        5: null, // Outcomes - preview only
        6: null, // Unique Advantage - preview only
        7: 3,    // Story -> Section 3
        8: null, // Testimonials - preview only
        9: 4,    // Offer/Program -> Section 4
        10: null, // Deliverables - preview only
        11: null, // Pricing - preview only
        12: null, // Assets - preview only
        13: null, // Revenue - preview only
        14: null, // Brand Voice - preview only
        15: null, // Brand Colors - preview only
        16: null, // CTA - preview only
        17: 9,   // Platforms -> FB Ads Section 9
        18: null, // 90-Day Goal - preview only
        19: null, // Business Stage - preview only
        20: null  // Final - handled separately
    };

    Object.keys(savedContent).forEach(key => {
        if (key.startsWith('step')) {
            const stepNum = parseInt(key.replace('step', ''));
            const sectionKey = STEP_TO_SECTION[stepNum];

            if (sectionKey && savedContent[key]) {
                merged[sectionKey] = savedContent[key];
                console.log(`[mergeStepPreviews] Merged step${stepNum} -> section ${sectionKey}`);
            }
        } else if (!isNaN(parseInt(key))) {
            // Already has numeric keys
            merged[key] = savedContent[key];
        }
    });

    // Also copy any 'final' content if present
    if (savedContent.final) {
        Object.assign(merged, savedContent.final);
    }

    return merged;
}
