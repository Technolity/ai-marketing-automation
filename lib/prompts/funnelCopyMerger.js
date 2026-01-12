/**
 * Funnel Copy Chunk Merger
 * Combines 4 parallel chunks into final funnelCopy structure
 */

/**
 * Merge 4 funnel copy chunks into complete structure
 * @param {Object} chunk1 - Optin page
 * @param {Object} chunk2 - Sales page
 * @param {Object} chunk3 - Booking page
 * @param {Object} chunk4 - Thank you page
 * @returns {Object} - Merged funnelCopy object
 */
export function mergeFunnelCopyChunks(chunk1, chunk2, chunk3, chunk4) {
    console.log('[FunnelCopyMerger] Merging 4 chunks...');
    console.log('[FunnelCopyMerger] Chunk 1 keys:', Object.keys(chunk1 || {}));
    console.log('[FunnelCopyMerger] Chunk 2 keys:', Object.keys(chunk2 || {}));
    console.log('[FunnelCopyMerger] Chunk 3 keys:', Object.keys(chunk3 || {}));
    console.log('[FunnelCopyMerger] Chunk 4 keys:', Object.keys(chunk4 || {}));

    const merged = {
        funnelCopy: {
            optinPage: chunk1?.optinPage || {},
            salesPage: chunk2?.salesPage || {},
            bookingPage: chunk3?.bookingPage || {},
            thankYouPage: chunk4?.thankYouPage || {}
        }
    };

    // Count total fields merged
    const optinCount = Object.keys(merged.funnelCopy.optinPage).length;
    const salesCount = Object.keys(merged.funnelCopy.salesPage).length;
    const bookingCount = Object.keys(merged.funnelCopy.bookingPage).length;
    const thankYouCount = Object.keys(merged.funnelCopy.thankYouPage).length;
    const totalCount = optinCount + salesCount + bookingCount + thankYouCount;

    console.log('[FunnelCopyMerger] Field counts:', {
        optinPage: optinCount,
        salesPage: salesCount,
        bookingPage: bookingCount,
        thankYouPage: thankYouCount,
        total: totalCount
    });

    console.log('[FunnelCopyMerger] ✓ Merge complete');

    return merged;
}

/**
 * Validate merged funnel copy structure
 * @param {Object} merged - Merged funnelCopy object
 * @returns {Object} - Validation result
 */
export function validateMergedFunnelCopy(merged) {
    const issues = [];
    const warnings = [];

    // Check top-level structure
    if (!merged || !merged.funnelCopy) {
        issues.push('Missing funnelCopy wrapper');
        return { valid: false, issues, warnings, pageCount: 0, fieldCount: 0 };
    }

    const { funnelCopy } = merged;

    // Required pages
    const requiredPages = ['optinPage', 'salesPage', 'bookingPage', 'thankYouPage'];
    requiredPages.forEach(page => {
        if (!funnelCopy[page]) {
            issues.push(`Missing ${page}`);
        } else if (Object.keys(funnelCopy[page]).length === 0) {
            warnings.push(`${page} is empty`);
        }
    });

    // Expected minimum field counts (loose validation)
    const minFieldCounts = {
        optinPage: 3,      // headline, subheadline, cta minimum
        salesPage: 20,     // Large page should have many fields
        bookingPage: 1,    // Just the pill text minimum
        thankYouPage: 5    // headline, sub, few testimonials minimum
    };

    Object.entries(minFieldCounts).forEach(([page, minCount]) => {
        const actualCount = Object.keys(funnelCopy[page] || {}).length;
        if (actualCount < minCount) {
            warnings.push(`${page} has only ${actualCount} fields (expected ${minCount}+)`);
        }
    });

    // Count totals
    const pageCount = requiredPages.filter(p => funnelCopy[p] && Object.keys(funnelCopy[p]).length > 0).length;
    const fieldCount = requiredPages.reduce((sum, p) => sum + Object.keys(funnelCopy[p] || {}).length, 0);

    const valid = issues.length === 0;

    console.log('[FunnelCopyValidator] Validation result:', {
        valid,
        pageCount,
        fieldCount,
        issues,
        warnings
    });

    return {
        valid,
        issues,
        warnings,
        pageCount,
        fieldCount
    };
}

/**
 * Extract field counts from merged structure (for logging)
 */
export function getFieldCounts(merged) {
    if (!merged?.funnelCopy) return {};

    const { funnelCopy } = merged;
    return {
        optinPage: Object.keys(funnelCopy.optinPage || {}).length,
        salesPage: Object.keys(funnelCopy.salesPage || {}).length,
        bookingPage: Object.keys(funnelCopy.bookingPage || {}).length,
        thankYouPage: Object.keys(funnelCopy.thankYouPage || {}).length,
        total: ['optinPage', 'salesPage', 'bookingPage', 'thankYouPage']
            .reduce((sum, p) => sum + Object.keys(funnelCopy[p] || {}).length, 0)
    };
}

export default {
    mergeFunnelCopyChunks,
    validateMergedFunnelCopy,
    getFieldCounts
};
