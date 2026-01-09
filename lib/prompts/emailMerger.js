/**
 * Email Chunk Merger
 * 
 * Combines the 4 chunk results into a single emailSequence object
 * that matches the expected schema.
 */

/**
 * Merge 4 email chunk results into final emailSequence
 * @param {Object} chunk1 - Emails 1-4
 * @param {Object} chunk2 - Emails 5-8c
 * @param {Object} chunk3 - Emails 9-12
 * @param {Object} chunk4 - Emails 13-15c
 * @returns {Object} Merged emailSequence object
 */
export function mergeEmailChunks(chunk1, chunk2, chunk3, chunk4) {
    console.log('[EmailMerger] Merging 4 chunks...');

    // Extract emails from each chunk, handling different response formats
    const emails1 = extractEmails(chunk1);
    const emails2 = extractEmails(chunk2);
    const emails3 = extractEmails(chunk3);
    const emails4 = extractEmails(chunk4);

    console.log('[EmailMerger] Chunk sizes:', {
        chunk1: Object.keys(emails1).length,
        chunk2: Object.keys(emails2).length,
        chunk3: Object.keys(emails3).length,
        chunk4: Object.keys(emails4).length
    });

    const merged = {
        emailSequence: {
            ...emails1,
            ...emails2,
            ...emails3,
            ...emails4
        }
    };

    const totalEmails = Object.keys(merged.emailSequence).length;
    console.log(`[EmailMerger] Total emails merged: ${totalEmails}/19`);

    // Validate we have all expected emails
    const expectedEmails = [
        'email1', 'email2', 'email3', 'email4',
        'email5', 'email6', 'email7', 'email8a', 'email8b', 'email8c',
        'email9', 'email10', 'email11', 'email12',
        'email13', 'email14', 'email15a', 'email15b', 'email15c'
    ];

    const missingEmails = expectedEmails.filter(e => !merged.emailSequence[e]);
    if (missingEmails.length > 0) {
        console.warn('[EmailMerger] Missing emails:', missingEmails);
    }

    return merged;
}

/**
 * Extract emails from a chunk result, handling nested structures
 */
function extractEmails(chunkResult) {
    if (!chunkResult) return {};

    // If result has emailSequence wrapper, unwrap it
    if (chunkResult.emailSequence) {
        return chunkResult.emailSequence;
    }

    // If result has emails wrapper, unwrap it
    if (chunkResult.emails) {
        return chunkResult.emails;
    }

    // If it's already flat email objects, return as-is
    if (chunkResult.email1 || chunkResult.email5 || chunkResult.email9 || chunkResult.email13) {
        return chunkResult;
    }

    // Fallback: try to find email keys
    const emailKeys = Object.keys(chunkResult).filter(k => k.startsWith('email'));
    if (emailKeys.length > 0) {
        const emails = {};
        for (const key of emailKeys) {
            emails[key] = chunkResult[key];
        }
        return emails;
    }

    console.warn('[EmailMerger] Could not extract emails from chunk:', Object.keys(chunkResult));
    return {};
}

/**
 * Validate merged email sequence has required fields
 */
export function validateMergedEmails(mergedResult) {
    const sequence = mergedResult?.emailSequence;
    if (!sequence) {
        return { valid: false, error: 'Missing emailSequence wrapper' };
    }

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

    return { valid: true, emailCount: expectedEmails.length };
}

export default { mergeEmailChunks, validateMergedEmails };
