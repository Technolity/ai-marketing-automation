/**
 * SMS Chunk Merger
 *
 * Combines the 2 chunk results into a single smsSequence object
 * that matches the vault schema.
 */

/**
 * Merge 2 SMS chunk results into final smsSequence
 * @param {Object} chunk1 - SMS 1-5
 * @param {Object} chunk2 - SMS 6-7b + No-Shows
 * @returns {Object} Merged smsSequence object
 */
export function mergeSmsChunks(chunk1, chunk2) {
    console.log('[SmsMerger] Merging 2 chunks of SMS messages...');

    const merged = {
        smsSequence: {
            // Chunk 1: sms1-sms5
            ...(chunk1 || {}),
            // Chunk 2: sms6-smsNoShow2
            ...(chunk2 || {})
        }
    };

    const smsKeys = Object.keys(merged.smsSequence).filter(k => k.startsWith('sms'));
    console.log(`[SmsMerger] Total SMS merged: ${smsKeys.length}/10`);
    console.log('[SmsMerger] Keys:', smsKeys.sort());

    return merged;
}

/**
 * Validate merged SMS sequence
 */
export function validateMergedSms(mergedResult) {
    const sequence = mergedResult?.smsSequence;
    if (!sequence) {
        return { valid: false, error: 'Missing smsSequence wrapper' };
    }

    const expectedSms = [
        'sms1', 'sms2', 'sms3', 'sms4', 'sms5',
        'sms6', 'sms7a', 'sms7b',
        'smsNoShow1', 'smsNoShow2'
    ];

    const missing = [];
    const incomplete = [];

    for (const key of expectedSms) {
        const item = sequence[key];
        if (!item) {
            missing.push(key);
        } else if (!item.message) {
            incomplete.push(key);
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
        smsCount: expectedSms.length
    };
}

export default { mergeSmsChunks, validateMergedSms };
