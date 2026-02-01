/**
 * Dependency Graph - Reverse Dependency Mapping
 * 
 * Tracks which sections depend on which "source" sections.
 * Used to determine what needs updating when a source section changes.
 * 
 * DEBUG LOGGING: All operations are extensively logged for debugging.
 */

/**
 * REVERSE DEPENDENCY MAP
 * Key = Source Section (the one being changed)
 * Value = Array of sections that DEPEND on the source
 */
export const DEPENDENCY_MAP = {
    // Core Sections - affect many downstream sections
    idealClient: [
        'message',      // Message tone and language depend on avatar
        'story',        // Story relevance depends on audience
        'offer',        // Offer positioning depends on audience
        'vsl',
        'funnelCopy',
        'emails',
        'sms',
        'facebookAds',
        'setterScript',
        'salesScripts',
        'bio'
    ],

    message: [
        'story',
        'offer',
        'vsl',
        'funnelCopy',
        'emails',
        'sms',
        'facebookAds',
        'setterScript',
        'salesScripts',
        'bio'
    ],

    story: [
        'vsl',
        'funnelCopy',
        'bio'
    ],

    offer: [
        'vsl',
        'funnelCopy',
        'salesScripts',  // Closer script needs offer details
        'emails'
    ],

    // Lead Magnet - Critical for Sales Funnels
    leadMagnet: [
        'funnelCopy',    // Opt-in page references the free gift
        'emails',        // "Here's your [Free Gift]" emails
        'sms',           // SMS mentions the download
        'facebookAds',   // Ads promote the free gift
        'setterScript',  // "I saw you downloaded [Free Gift]..."
        'vsl'            // VSL may reference it
    ],

    // VSL affects funnel copy (consistency)
    vsl: [
        'funnelCopy'     // Sales page should match VSL messaging
    ],

    // Bio affects funnel copy and ads
    bio: [
        'funnelCopy'     // About section pulls from bio
    ]
};

/**
 * ATOMIC FIELDS - Fields that can be safely "Find & Replace" without regeneration
 * Key = Section ID
 * Value = Array of field paths that support atomic replacement
 */
export const ATOMIC_FIELDS = {
    leadMagnet: [
        'mainTitle',
        'titleAndHook.mainTitle',
        'concept.title'
    ],
    offer: [
        'offerName',
        'name',
        'tier1Investment',
        'tier1RecommendedPrice',
        'pricing'
    ],
    bio: [
        'name',
        'founderName'
    ],
    intakeForm: [
        'businessName',
        'business_name'
    ]
};

/**
 * Get all sections affected by a change to the source section
 * 
 * @param {string} sourceSectionId - The section that was changed
 * @returns {string[]} Array of affected section IDs
 */
export function getAffectedSections(sourceSectionId) {
    console.log(`[DependencyGraph] Getting affected sections for: ${sourceSectionId}`);

    const affected = DEPENDENCY_MAP[sourceSectionId] || [];

    console.log(`[DependencyGraph] Affected sections:`, affected.length > 0 ? affected : 'None');

    return affected;
}

/**
 * Check if a field change can be handled with atomic replacement
 * 
 * @param {string} sectionId - The section being changed
 * @param {string} fieldPath - The field path being changed (e.g., 'mainTitle')
 * @returns {boolean} True if atomic replacement is safe
 */
export function isAtomicField(sectionId, fieldPath) {
    const atomicFieldsForSection = ATOMIC_FIELDS[sectionId] || [];
    const isAtomic = atomicFieldsForSection.some(field =>
        fieldPath === field || fieldPath.endsWith(field) || field.endsWith(fieldPath)
    );

    console.log(`[DependencyGraph] Field ${sectionId}.${fieldPath} atomic? ${isAtomic}`);

    return isAtomic;
}

/**
 * Detect the type of change and determine the update strategy
 * 
 * @param {string} sectionId - The section being changed
 * @param {Object} oldData - Previous content
 * @param {Object} newData - New content
 * @returns {Object} Change detection result
 */
export function detectChangeType(sectionId, oldData, newData) {
    console.log(`[DependencyGraph] Detecting change type for: ${sectionId}`);

    const result = {
        hasChanges: false,
        atomicChanges: [],      // Field changes that can be find/replaced
        deepChanges: [],        // Field changes that require regeneration
        affectedSections: []
    };

    if (!oldData || !newData) {
        console.log(`[DependencyGraph] Missing data for comparison`);
        return result;
    }

    const atomicFieldDefs = ATOMIC_FIELDS[sectionId] || [];

    // Compare atomic fields
    for (const fieldPath of atomicFieldDefs) {
        const oldValue = getNestedValue(oldData, fieldPath);
        const newValue = getNestedValue(newData, fieldPath);

        if (oldValue && newValue && oldValue !== newValue) {
            console.log(`[DependencyGraph] Atomic change detected: ${fieldPath}`);
            console.log(`[DependencyGraph]   Old: "${oldValue}"`);
            console.log(`[DependencyGraph]   New: "${newValue}"`);

            result.hasChanges = true;
            result.atomicChanges.push({
                fieldPath,
                oldValue: String(oldValue),
                newValue: String(newValue)
            });
        }
    }

    // If there are atomic changes, get affected sections
    if (result.atomicChanges.length > 0) {
        result.affectedSections = getAffectedSections(sectionId);
    }

    console.log(`[DependencyGraph] Change detection result:`, {
        hasChanges: result.hasChanges,
        atomicChangesCount: result.atomicChanges.length,
        affectedSectionsCount: result.affectedSections.length
    });

    return result;
}

/**
 * Helper: Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
        if (value && typeof value === 'object') {
            value = value[part];
        } else {
            return undefined;
        }
    }

    return value;
}

export default {
    DEPENDENCY_MAP,
    ATOMIC_FIELDS,
    getAffectedSections,
    isAtomicField,
    detectChangeType
};
