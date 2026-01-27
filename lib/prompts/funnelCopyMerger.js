/**
 * Funnel Copy Chunk Merger
 * Combines 4 parallel chunks into final funnelCopy structure
 *
 * NEW 79-Field Structure:
 * - Chunk 1: optinPage (4 fields)
 * - Chunk 2: salesPage_part1 (23 fields - Hero + Process + How It Works)
 * - Chunk 3: salesPage_part2 (23 fields - Audience + Call Expectations + Bio)
 * - Chunk 4: salesPage_part3 (29 fields - Testimonials + FAQ + Final CTA + Video)
 */

/**
 * Merge 4 funnel copy chunks into complete structure
 * @param {Object} chunk1 - Optin page (4 fields)
 * @param {Object} chunk2 - Sales page part 1 (23 fields)
 * @param {Object} chunk3 - Sales page part 2 (23 fields)
 * @param {Object} chunk4 - Sales page part 3 (29 fields)
 * @returns {Object} - Merged funnelCopy object with optinPage + salesPage
 */
export function mergeFunnelCopyChunks(chunk1, chunk2, chunk3, chunk4) {
    console.log('[FunnelCopyMerger] ========== MERGING NEW 79-FIELD STRUCTURE ==========');
    console.log('[FunnelCopyMerger] Chunk 1 (optinPage) keys:', Object.keys(chunk1 || {}));
    console.log('[FunnelCopyMerger] Chunk 2 (salesPage_part1) keys:', Object.keys(chunk2 || {}));
    console.log('[FunnelCopyMerger] Chunk 3 (salesPage_part2) keys:', Object.keys(chunk3 || {}));
    console.log('[FunnelCopyMerger] Chunk 4 (salesPage_part3) keys:', Object.keys(chunk4 || {}));

    // Extract optinPage from chunk1
    const optinPage = chunk1?.optinPage || {};

    // Merge all three salesPage parts from chunks 2, 3, 4
    const salesPage = {
        ...(chunk2?.salesPage_part1 || {}),
        ...(chunk3?.salesPage_part2 || {}),
        ...(chunk4?.salesPage_part3 || {})
    };

    const merged = {
        optinPage,
        salesPage
    };

    // Count fields
    const optinCount = Object.keys(optinPage).length;
    const salesCount = Object.keys(salesPage).length;
    const totalCount = optinCount + salesCount;

    console.log('[FunnelCopyMerger] ========== MERGE RESULTS ==========');
    console.log('[FunnelCopyMerger] optinPage fields:', optinCount, '(expected: 4)');
    console.log('[FunnelCopyMerger] salesPage fields:', salesCount, '(expected: 75)');
    console.log('[FunnelCopyMerger] Total fields:', totalCount, '(expected: 79)');

    // Validate expected field counts
    if (optinCount !== 4) {
        console.warn('[FunnelCopyMerger] ⚠️ WARNING: optinPage has', optinCount, 'fields (expected: 4)');
    }
    if (salesCount !== 75) {
        console.warn('[FunnelCopyMerger] ⚠️ WARNING: salesPage has', salesCount, 'fields (expected: 75)');
    }
    if (totalCount === 79) {
        console.log('[FunnelCopyMerger] ✅ All 79 fields successfully merged');
    }

    console.log('[FunnelCopyMerger] ========== MERGE COMPLETE ==========');

    return merged;
}

/**
 * Validate merged funnel copy structure (NEW 79-field structure)
 * @param {Object} merged - Merged funnelCopy object
 * @returns {Object} - Validation result
 */
export function validateMergedFunnelCopy(merged) {
    const issues = [];
    const warnings = [];

    // Check top-level structure - NEW format doesn't have funnelCopy wrapper
    if (!merged || typeof merged !== 'object') {
        issues.push('Invalid merged structure');
        return { valid: false, issues, warnings, pageCount: 0, fieldCount: 0 };
    }

    // Required pages in NEW structure (only optinPage and salesPage)
    const requiredPages = ['optinPage', 'salesPage'];

    requiredPages.forEach(page => {
        if (!merged[page]) {
            issues.push(`Missing ${page}`);
        } else if (Object.keys(merged[page]).length === 0) {
            warnings.push(`${page} is empty`);
        }
    });

    // Expected exact field counts for NEW 79-field structure
    const expectedFieldCounts = {
        optinPage: 4,    // headline_text, subheadline_text, cta_button_text, mockup_image
        salesPage: 75    // All VSL/Sales page fields
    };

    Object.entries(expectedFieldCounts).forEach(([page, expectedCount]) => {
        const actualCount = Object.keys(merged[page] || {}).length;
        if (actualCount !== expectedCount) {
            warnings.push(`${page} has ${actualCount} fields (expected: ${expectedCount})`);
        }
    });

    // Check for empty fields (except image/video URLs)
    const emptyFields = [];

    // Check optinPage
    for (const [key, value] of Object.entries(merged.optinPage || {})) {
        if (!value && key !== 'mockup_image') {
            emptyFields.push(`optinPage.${key}`);
        }
    }

    // Check salesPage
    for (const [key, value] of Object.entries(merged.salesPage || {})) {
        // Allow empty values for image and video fields
        if (!value && !key.includes('image') && !key.includes('video')) {
            emptyFields.push(`salesPage.${key}`);
        }
    }

    if (emptyFields.length > 0) {
        warnings.push(`Found ${emptyFields.length} empty text fields: ${emptyFields.join(', ')}`);
    }

    // Count totals
    const pageCount = requiredPages.filter(p => merged[p] && Object.keys(merged[p]).length > 0).length;
    const fieldCount = requiredPages.reduce((sum, p) => sum + Object.keys(merged[p] || {}).length, 0);

    const valid = issues.length === 0;

    console.log('[FunnelCopyValidator] ========== VALIDATION RESULT ==========');
    console.log('[FunnelCopyValidator] Valid:', valid);
    console.log('[FunnelCopyValidator] Page count:', pageCount, '(expected: 2)');
    console.log('[FunnelCopyValidator] Total fields:', fieldCount, '(expected: 79)');
    if (issues.length > 0) {
        console.log('[FunnelCopyValidator] ❌ Issues:', issues);
    }
    if (warnings.length > 0) {
        console.log('[FunnelCopyValidator] ⚠️ Warnings:', warnings);
    }
    if (valid && fieldCount === 79 && emptyFields.length === 0) {
        console.log('[FunnelCopyValidator] ✅ Perfect! All 79 fields present and populated');
    }

    return {
        valid,
        issues,
        warnings,
        pageCount,
        fieldCount,
        emptyFieldCount: emptyFields.length
    };
}

/**
 * Extract field counts from merged structure (for logging)
 * NEW 79-field structure: optinPage + salesPage only
 */
export function getFieldCounts(merged) {
    if (!merged || typeof merged !== 'object') return {};

    return {
        optinPage: Object.keys(merged.optinPage || {}).length,
        salesPage: Object.keys(merged.salesPage || {}).length,
        total: Object.keys(merged.optinPage || {}).length + Object.keys(merged.salesPage || {}).length
    };
}

export default {
    mergeFunnelCopyChunks,
    validateMergedFunnelCopy,
    getFieldCounts
};
