/**
 * SMS Chunk Merger
 *
 * Combines the 2 chunk results into a single smsSequence object
 * that matches the vault schema.
 */

/**
 * Merge 3 SMS chunk results into final smsSequence
 * @param {Object} chunk1 - SMS 1-7b
 * @param {Object} chunk2 - SMS 8a-12
 * @param {Object} chunk3 - SMS 13-15c + No-Shows
 * @returns {Object} Merged smsSequence object
 */
export function mergeSmsChunks(chunk1, chunk2, chunk3) {
    console.log('[SmsMerger] Merging 3 chunks of SMS messages...');

    // Unwrap chunks that AI may have wrapped in smsSequence
    const unwrap = (chunk) => {
        if (!chunk) return {};
        if (chunk.smsSequence && typeof chunk.smsSequence === 'object') {
            console.log('[SmsMerger] Unwrapping chunk that was wrapped in smsSequence');
            return chunk.smsSequence;
        }
        return chunk;
    };

    const c1 = unwrap(chunk1);
    const c2 = unwrap(chunk2);
    const c3 = unwrap(chunk3);

    const merged = {
        smsSequence: {
            ...c1,
            ...c2,
            ...c3
        }
    };

    const smsKeys = Object.keys(merged.smsSequence).filter(k => k.startsWith('sms'));
    console.log(`[SmsMerger] Total SMS merged: ${smsKeys.length}/23`);
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
        'sms8a', 'sms8b', 'sms8c',
        'sms9', 'sms10', 'sms11', 'sms12', 'sms13', 'sms14',
        'sms15a', 'sms15b', 'sms15c',
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

const smsMerger = { mergeSmsChunks, validateMergedSms };

export default smsMerger;
