/**
 * Closer Script Chunk Merger
 *
 * Combines the 2 chunk results into a single closerScript object
 * that matches the vault schema (salesScripts section).
 */

/**
 * Merge 2 closer script chunk results into final salesScripts
 * @param {Object} chunk1 - Discovery + Stakes fields
 * @param {Object} chunk2 - Pitch + Close fields
 * @returns {Object} Merged salesScripts object
 */
export function mergeCloserChunks(chunk1, chunk2) {
    console.log('[CloserMerger] Merging 2 chunks of closer script...');

    // Debug: Log discoveryQuestions structure
    console.log('[CloserMerger] Chunk1 discoveryQuestions sample:',
        JSON.stringify(chunk1?.discoveryQuestions?.slice(0, 2), null, 2)
    );

    // Normalize discoveryQuestions to ensure all subfields are present
    const normalizedQuestions = (chunk1?.discoveryQuestions || []).map((q, idx) => {
        if (typeof q === 'object' && q !== null) {
            return {
                label: q.label || `Question ${idx + 1}`,
                question: q.question || '', // CRITICAL: Preserve the question field
                lookingFor: q.lookingFor || 'Listen for specific pain points and emotional triggers',
                ifVague: q.ifVague || 'Can you give me a specific example?'
            };
        }
        // If string, treat as the question text
        return {
            label: `Question ${idx + 1}`,
            question: typeof q === 'string' ? q : '',
            lookingFor: 'Listen for specific pain points and emotional triggers',
            ifVague: 'Can you give me a specific example?'
        };
    });

    console.log('[CloserMerger] Normalized questions sample:',
        normalizedQuestions.slice(0, 2).map(q => ({ label: q.label, hasQuestion: !!q.question }))
    );

    const merged = {
        salesScripts: {
            // Chunk 1: Discovery + Stakes
            agendaPermission: chunk1?.agendaPermission || '',
            discoveryQuestions: normalizedQuestions,
            stakesImpact: chunk1?.stakesImpact || '',
            commitmentScale: chunk1?.commitmentScale || '',
            decisionGate: chunk1?.decisionGate || '',
            recapConfirmation: chunk1?.recapConfirmation || '',
            // Chunk 2: Pitch + Close
            pitchScript: chunk2?.pitchScript || '',
            proofLine: chunk2?.proofLine || '',
            investmentClose: chunk2?.investmentClose || '',
            nextSteps: chunk2?.nextSteps || '',
            objectionHandling: Array.isArray(chunk2?.objectionHandling) ? chunk2.objectionHandling : []
        }
    };

    const fieldCount = Object.keys(merged.salesScripts).filter(k => {
        const val = merged.salesScripts[k];
        if (typeof val === 'string') return val.length > 0;
        if (Array.isArray(val)) return val.length > 0;
        return false;
    }).length;

    console.log(`[CloserMerger] Total fields merged: ${fieldCount}/11`);

    return merged;
}

/**
 * Validate merged closer script
 */
export function validateMergedCloser(mergedResult) {
    const script = mergedResult?.salesScripts;
    if (!script) {
        return { valid: false, error: 'Missing salesScripts wrapper' };
    }

    const expectedFields = [
        'agendaPermission', 'discoveryQuestions', 'stakesImpact', 'commitmentScale',
        'decisionGate', 'recapConfirmation', 'pitchScript', 'proofLine',
        'investmentClose', 'nextSteps', 'objectionHandling'
    ];

    const missing = [];
    const incomplete = [];

    for (const field of expectedFields) {
        const value = script[field];
        if (value === undefined || value === null) {
            missing.push(field);
        } else if (typeof value === 'string' && value.trim() === '') {
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

export default { mergeCloserChunks, validateMergedCloser };
