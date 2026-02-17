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

/**
 * Human-readable section names for UI display
 */
export const SECTION_NAMES = {
    idealClient: 'Ideal Client Profile',
    message: 'Million-Dollar Message',
    story: 'Personal Story',
    offer: 'Offer & Program',
    salesScripts: 'Sales Scripts',
    leadMagnet: 'Lead Magnet',
    vsl: 'VSL Script',
    emails: 'Email Sequence',
    facebookAds: 'Facebook Ads',
    funnelCopy: 'Funnel Copy',
    bio: 'Professional Bio',
    appointmentReminders: 'Appointment Reminders',
    setterScript: 'Setter Script',
    sms: 'SMS Sequences',
    media: 'Media Library',
    colors: 'Brand Colors',
};

/**
 * FIELD-LEVEL DEPENDENCIES
 * When a specific field within a section changes, this gives more targeted impact info.
 * If a field is listed here, we use this instead of the broad section-level map.
 */
export const FIELD_DEPENDENCIES = {
    'offer.offerName': {
        affectedSections: ['setterScript', 'salesScripts', 'emails', 'vsl', 'funnelCopy'],
        reason: 'Uses your offer/program name'
    },
    'leadMagnet.mainTitle': {
        affectedSections: ['facebookAds', 'emails', 'sms', 'funnelCopy', 'setterScript'],
        reason: 'References your lead magnet title'
    },
    'message.oneLineMessage': {
        affectedSections: ['bio', 'funnelCopy', 'facebookAds'],
        reason: 'Uses your one-line message'
    },
    'offer.sevenStepBlueprint': {
        affectedSections: ['vsl', 'salesScripts', 'funnelCopy'],
        reason: 'References your 7-step blueprint'
    },
    'story.bigIdea': {
        affectedSections: ['vsl', 'bio', 'funnelCopy'],
        reason: 'Uses your core transformation story'
    },
    'idealClient.avatarOverview': {
        affectedSections: ['message', 'facebookAds', 'emails', 'funnelCopy'],
        reason: 'Uses your ideal client description'
    },
};

/**
 * Calculate the dependency impact of changing a specific section/field.
 * Returns which sections should be offered for regeneration.
 * 
 * @param {string} sectionId - The section being refined
 * @param {string|null} fieldId - Specific field being refined (null = whole section)
 * @returns {{ hasImpact: boolean, affectedSections: Array<{ sectionId: string, sectionName: string, reason: string }>, isFieldLevel: boolean }}
 */
export function calculateDependencyImpact(sectionId, fieldId = null) {
    console.log(`[DependencyGraph] Calculating impact for ${sectionId}${fieldId ? '.' + fieldId : ''}`);

    const result = {
        hasImpact: false,
        affectedSections: [],
        isFieldLevel: false,
    };

    // 1. Check field-level dependencies first (more precise)
    if (fieldId && fieldId !== 'all') {
        const fieldPath = `${sectionId}.${fieldId}`;
        const fieldDep = FIELD_DEPENDENCIES[fieldPath];

        if (fieldDep) {
            result.isFieldLevel = true;
            for (const affectedId of fieldDep.affectedSections) {
                if (affectedId === sectionId) continue; // Skip self
                result.affectedSections.push({
                    sectionId: affectedId,
                    sectionName: SECTION_NAMES[affectedId] || affectedId,
                    reason: fieldDep.reason,
                });
            }
        }
    }

    // 2. If no field-level match, fall back to section-level map
    if (!result.isFieldLevel) {
        const consumers = DEPENDENCY_MAP[sectionId] || [];
        for (const consumerId of consumers) {
            if (consumerId === sectionId) continue; // Skip self
            result.affectedSections.push({
                sectionId: consumerId,
                sectionName: SECTION_NAMES[consumerId] || consumerId,
                reason: `Depends on ${SECTION_NAMES[sectionId] || sectionId}`,
            });
        }
    }

    result.hasImpact = result.affectedSections.length > 0;

    console.log(`[DependencyGraph] Impact result:`, {
        hasImpact: result.hasImpact,
        isFieldLevel: result.isFieldLevel,
        affectedCount: result.affectedSections.length,
        affected: result.affectedSections.map(s => s.sectionId),
    });

    return result;
}

/**
 * Get the human-readable name for a section
 */
export function getSectionName(sectionId) {
    return SECTION_NAMES[sectionId] || sectionId;
}

export default {
    DEPENDENCY_MAP,
    ATOMIC_FIELDS,
    SECTION_NAMES,
    FIELD_DEPENDENCIES,
    getAffectedSections,
    isAtomicField,
    detectChangeType,
    calculateDependencyImpact,
    getSectionName
};
