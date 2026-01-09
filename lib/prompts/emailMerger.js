/**
 * Email Chunk Merger
 *
 * Combines the 4 chunk results into a single emailSequence object
 * that matches the vault schema with named keys (email1, email2, ..., email15c).
 */

/**
 * Merge 4 email chunk results into final emailSequence
 * @param {Object} chunk1 - Emails 1-4 (email1, email2, email3, email4)
 * @param {Object} chunk2 - Emails 5-8c (email5, email6, email7, email8a, email8b, email8c)
 * @param {Object} chunk3 - Emails 9-12 (email9, email10, email11, email12)
 * @param {Object} chunk4 - Emails 13-15c (email13, email14, email15a, email15b, email15c)
 * @returns {Object} Merged emailSequence object with all 19 named email keys
 */
export function mergeEmailChunks(chunk1, chunk2, chunk3, chunk4) {
    console.log('[EmailMerger] Merging 4 chunks with named keys (email1, email2, ..., email15c)...');

    // Merge all email objects from all chunks
    const merged = {
        emailSequence: {
            // Chunk 1: emails 1-4
            ...(chunk1 || {}),
            // Chunk 2: emails 5-8c
            ...(chunk2 || {}),
            // Chunk 3: emails 9-12
            ...(chunk3 || {}),
            // Chunk 4: emails 13-15c
            ...(chunk4 || {})
        }
    };

    // Count how many emails we got
    const emailKeys = Object.keys(merged.emailSequence).filter(k => k.startsWith('email'));
    const totalEmails = emailKeys.length;

    console.log('[EmailMerger] Chunk contents:', {
        chunk1: Object.keys(chunk1 || {}).filter(k => k.startsWith('email')),
        chunk2: Object.keys(chunk2 || {}).filter(k => k.startsWith('email')),
        chunk3: Object.keys(chunk3 || {}).filter(k => k.startsWith('email')),
        chunk4: Object.keys(chunk4 || {}).filter(k => k.startsWith('email')),
    });

    console.log(`[EmailMerger] Total emails merged: ${totalEmails}/19`);
    console.log('[EmailMerger] Email keys:', emailKeys.sort());

    return merged;
}

/**
 * Validate merged email sequence has all required email keys
 */
export function validateMergedEmails(mergedResult) {
    const sequence = mergedResult?.emailSequence;
    if (!sequence) {
        return { valid: false, error: 'Missing emailSequence wrapper' };
    }

    // Expected 19 emails with specific keys
    const expectedEmails = [
        'email1', 'email2', 'email3', 'email4',
        'email5', 'email6', 'email7', 'email8a', 'email8b', 'email8c',
        'email9', 'email10', 'email11', 'email12',
        'email13', 'email14', 'email15a', 'email15b', 'email15c'
    ];

    const missing = [];
    const incomplete = [];

    for (const emailKey of expectedEmails) {
        const email = sequence[emailKey];
        if (!email) {
            missing.push(emailKey);
        } else if (!email.subject || !email.body) {
            incomplete.push(emailKey);
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
        emailCount: expectedEmails.length
    };
}

export default { mergeEmailChunks, validateMergedEmails };
