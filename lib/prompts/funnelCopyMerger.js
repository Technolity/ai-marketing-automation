/**
 * Funnel Copy Chunk Merger
 * Combines 4 parallel chunks into final funnelCopy structure
 *
 * 80-Field Structure (text-only):
 * - Chunk 1: optinPage (5 fields) + calendarPage (3 fields) + thankYouPage (3 fields)
 * - Chunk 2: salesPage_part1 (23 fields - Hero + Process + How It Works)
 * - Chunk 3: salesPage_part2 (22 fields - Audience + Call Expectations + Bio)
 * - Chunk 4: salesPage_part3 (23 fields - Testimonials + FAQ + Final CTA + Footer)
 * Note: Media handled separately
 */

/**
 * Merge 4 funnel copy chunks into complete structure
 * @param {Object} chunk1 - Optin page (5 fields) + Calendar page (3 fields) + Thank You page (3 fields)
 * @param {Object} chunk2 - Sales page part 1 (23 fields)
 * @param {Object} chunk3 - Sales page part 2 (22 fields)
 * @param {Object} chunk4 - Sales page part 3 (23 fields)
 * @returns {Object} - Merged funnelCopy object with all pages
 */
export function mergeFunnelCopyChunks(chunk1, chunk2, chunk3, chunk4) {
    console.log('[FunnelCopyMerger] ========== MERGING NEW STRUCTURE ==========');

    // Unwrap chunks that AI may have wrapped in funnelCopy
    const unwrap = (chunk) => {
        if (!chunk) return {};
        if (chunk.funnelCopy && typeof chunk.funnelCopy === 'object') {
            console.log('[FunnelCopyMerger] Unwrapping chunk that was wrapped in funnelCopy');
            return chunk.funnelCopy;
        }
        return chunk;
    };

    const c1 = unwrap(chunk1);
    const c2 = unwrap(chunk2);
    const c3 = unwrap(chunk3);
    const c4 = unwrap(chunk4);

    console.log('[FunnelCopyMerger] Chunk 1 (optinPage + calendarPage + thankYouPage) keys:', Object.keys(c1));
    console.log('[FunnelCopyMerger] Chunk 2 (salesPage_part1) keys:', Object.keys(c2));
    console.log('[FunnelCopyMerger] Chunk 3 (salesPage_part2) keys:', Object.keys(c3));
    console.log('[FunnelCopyMerger] Chunk 4 (salesPage_part3) keys:', Object.keys(c4));

    // Extract pages from chunk1 (now contains optinPage, calendarPage, thankYouPage)
    const optinPage = c1?.optinPage || {};
    const calendarPage = c1?.calendarPage || c1?.bookingPage || {}; // Support legacy
    const thankYouPage = c1?.thankYouPage || {};

    // Merge all three salesPage parts from chunks 2, 3, 4
    const salesPage = {
        ...(c2?.salesPage_part1 || {}),
        ...(c3?.salesPage_part2 || {}),
        ...(c4?.salesPage_part3 || {})
    };

    const merged = {
        optinPage,
        salesPage,
        calendarPage,
        thankYouPage
    };

    // Count fields
    const optinCount = Object.keys(optinPage).length;
    const salesCount = Object.keys(salesPage).length;
    const calendarCount = Object.keys(calendarPage).length;
    const thankYouCount = Object.keys(thankYouPage).length;
    const totalCount = optinCount + salesCount + calendarCount + thankYouCount;

    console.log('[FunnelCopyMerger] ========== MERGE RESULTS ==========');
    console.log('[FunnelCopyMerger] optinPage fields:', optinCount, '(expected: 5)');
    console.log('[FunnelCopyMerger] salesPage fields:', salesCount, '(expected: 69)');
    console.log('[FunnelCopyMerger] calendarPage fields:', calendarCount, '(expected: 3)');
    console.log('[FunnelCopyMerger] thankYouPage fields:', thankYouCount, '(expected: 3)');
    console.log('[FunnelCopyMerger] Total fields:', totalCount, '(expected: 80)');

    // Validate expected field counts
    if (optinCount !== 5) {
        console.warn('[FunnelCopyMerger] ⚠️ WARNING: optinPage has', optinCount, 'fields (expected: 5)');
    }
    if (salesCount !== 69) {
        console.warn('[FunnelCopyMerger] ⚠️ WARNING: salesPage has', salesCount, 'fields (expected: 69)');
    }
    if (calendarCount !== 3) {
        console.warn('[FunnelCopyMerger] ⚠️ WARNING: calendarPage has', calendarCount, 'fields (expected: 3)');
    }
    if (thankYouCount !== 3) {
        console.warn('[FunnelCopyMerger] ⚠️ WARNING: thankYouPage has', thankYouCount, 'fields (expected: 3)');
    }
    if (totalCount === 80) {
        console.log('[FunnelCopyMerger] ✅ All 80 fields successfully merged');
    }

    console.log('[FunnelCopyMerger] ========== MERGE COMPLETE ==========');

    return merged;
}

/**
 * Validate merged funnel copy structure (80-field structure)
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

    // Required pages in NEW structure (all 4 pages)
    const requiredPages = ['optinPage', 'salesPage', 'calendarPage', 'thankYouPage'];

    requiredPages.forEach(page => {
        if (!merged[page]) {
            issues.push(`Missing ${page}`);
        } else if (Object.keys(merged[page]).length === 0) {
            warnings.push(`${page} is empty`);
        }
    });

    // Expected exact field counts for 80-field structure
    const expectedFieldCounts = {
        optinPage: 5,          // headline_text, subheadline_text, cta_button_text, popup_form_headline, footer_text
        salesPage: 69,         // All VSL/Sales page text fields + footer_text
        calendarPage: 3,       // headline, calendar_embedded_code, footer_text
        thankYouPage: 3        // headline, subheadline, footer_text
    };

    Object.entries(expectedFieldCounts).forEach(([page, expectedCount]) => {
        const actualCount = Object.keys(merged[page] || {}).length;
        if (actualCount !== expectedCount) {
            warnings.push(`${page} has ${actualCount} fields (expected: ${expectedCount})`);
        }
    });

    // Check for empty fields (calendar embed can be empty)
    const emptyFields = [];

    // Check optinPage
    for (const [key, value] of Object.entries(merged.optinPage || {})) {
        if (!value) emptyFields.push(`optinPage.${key}`);
    }

    // Check salesPage
    for (const [key, value] of Object.entries(merged.salesPage || {})) {
        if (!value) emptyFields.push(`salesPage.${key}`);
    }

    // Check calendarPage
    for (const [key, value] of Object.entries(merged.calendarPage || {})) {
        if (!value && key !== 'calendar_embedded_code') {
            emptyFields.push(`calendarPage.${key}`);
        }
    }

    // Check thankYouPage
    for (const [key, value] of Object.entries(merged.thankYouPage || {})) {
        if (!value) emptyFields.push(`thankYouPage.${key}`);
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
    console.log('[FunnelCopyValidator] Page count:', pageCount, '(expected: 4)');
    console.log('[FunnelCopyValidator] Total fields:', fieldCount, '(expected: 80)');
    if (issues.length > 0) {
        console.log('[FunnelCopyValidator] ❌ Issues:', issues);
    }
    if (warnings.length > 0) {
        console.log('[FunnelCopyValidator] ⚠️ Warnings:', warnings);
    }
    if (valid && fieldCount === 80 && emptyFields.length === 0) {
        console.log('[FunnelCopyValidator] ✅ Perfect! All 80 fields present and populated');
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
 * 80-field structure: optinPage + salesPage + calendarPage + thankYouPage
 */
export function getFieldCounts(merged) {
    if (!merged || typeof merged !== 'object') return {};

    return {
        optinPage: Object.keys(merged.optinPage || {}).length,
        salesPage: Object.keys(merged.salesPage || {}).length,
        calendarPage: Object.keys(merged.calendarPage || {}).length,
        thankYouPage: Object.keys(merged.thankYouPage || {}).length,
        total: Object.keys(merged.optinPage || {}).length +
            Object.keys(merged.salesPage || {}).length +
            Object.keys(merged.calendarPage || {}).length +
            Object.keys(merged.thankYouPage || {}).length
    };
}

export default {
    mergeFunnelCopyChunks,
    validateMergedFunnelCopy,
    getFieldCounts
};


