/**
 * Setter Script Chunk Merger
 *
 * Combines the 2 chunk results into a single setterScript object
 * that matches the vault schema.
 */

/**
 * Merge 2 setter script chunk results into final setterScript
 * @param {Object} chunk1 - Call Flow fields (callGoal to primaryGoal)
 * @param {Object} chunk2 - Qualification + Objections fields
 * @returns {Object} Merged setterScript object
 */
export function mergeSetterChunks(chunk1, chunk2) {
    console.log('[SetterMerger] Merging 2 chunks of setter script...');

    // Unwrap chunks that AI may have wrapped in setterScript/setterCallScript
    const unwrap = (chunk) => {
        if (!chunk) return {};
        if (chunk.setterScript && typeof chunk.setterScript === 'object') {
            console.log('[SetterMerger] Unwrapping chunk that was wrapped in setterScript');
            return chunk.setterScript;
        }
        if (chunk.setterCallScript && typeof chunk.setterCallScript === 'object') {
            console.log('[SetterMerger] Unwrapping chunk that was wrapped in setterCallScript');
            return chunk.setterCallScript;
        }
        return chunk;
    };

    const c1 = unwrap(chunk1);
    const c2 = unwrap(chunk2);

    const merged = {
        setterScript: {
            // Chunk 1: Call Flow
            callGoal: c1?.callGoal || '',
            setterMindset: c1?.setterMindset || '',
            openingOptIn: c1?.openingOptIn || {},
            permissionPurpose: c1?.permissionPurpose || {},
            currentSituation: c1?.currentSituation || {},
            primaryGoal: c1?.primaryGoal || {},
            // Chunk 2: Qualification + Objections
            primaryObstacle: c2?.primaryObstacle || {},
            authorityDrop: c2?.authorityDrop || {},
            fitReadiness: c2?.fitReadiness || {},
            bookCall: c2?.bookCall || {},
            confirmShowUp: c2?.confirmShowUp || {},
            objectionHandling: Array.isArray(c2?.objectionHandling) ? c2.objectionHandling : []
        }
    };

    const fieldCount = Object.keys(merged.setterScript).filter(k => {
        const val = merged.setterScript[k];
        if (typeof val === 'string') return val.length > 0;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object') return Object.keys(val).length > 0;
        return false;
    }).length;

    console.log(`[SetterMerger] Total fields merged: ${fieldCount}/12`);

    return merged;
}

/**
 * Validate merged setter script
 */
export function validateMergedSetter(mergedResult) {
    const script = mergedResult?.setterScript;
    if (!script) {
        return { valid: false, error: 'Missing setterScript wrapper' };
    }

    const expectedFields = [
        'callGoal', 'setterMindset', 'openingOptIn', 'permissionPurpose',
        'currentSituation', 'primaryGoal', 'primaryObstacle', 'authorityDrop',
        'fitReadiness', 'bookCall', 'confirmShowUp', 'objectionHandling'
    ];

    const missing = [];
    const incomplete = [];

    for (const field of expectedFields) {
        const value = script[field];
        if (value === undefined || value === null) {
            missing.push(field);
        } else if (typeof value === 'string' && value.trim() === '') {
            incomplete.push(field);
        } else if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
            incomplete.push(field);
        } else if (Array.isArray(value) && value.length === 0) {
            incomplete.push(field);
        }
    }

    if (missing.length > 0 || incomplete.length > 0) {
        return {
            valid: false,
            error: `Missing: ${missing.length}, Incomplete: ${incomplete.length}`,
            missing,
            incomplete
        };
    }

    return {
        valid: true,
        fieldCount: expectedFields.length
    };
}

export default { mergeSetterChunks, validateMergedSetter };
