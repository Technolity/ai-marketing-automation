/**
 * Direct Email Mapper
 * Maps vault email fields directly to GHL custom values without AI
 * This is more reliable than AI parsing for structured data extraction
 */

import { convertEmailToHtml, isAlreadyHtml } from './emailFormatter.js';

/**
 * Maps vault email section content directly to GHL custom values
 * @param {object} emailsVaultContent - The emails section from vault content
 * @param {object} options - Mapping options
 * @returns {object} - Key-value pairs for GHL custom values
 */
export function mapEmailsToGHLValues(emailsVaultContent, options = {}) {
    const {
        convertToHtml = true // Convert markdown to HTML for GHL
    } = options;

    const result = {};

    // Mapping: 19 vault emails → 15 GHL custom value slots
    // email1-email7 → Optin_Email 1-7
    // email8a → Optin_Email 8 (morning closing email)
    // email9-email14 → Optin_Email 9-14
    // email15a → Optin_Email 15 (final day morning)
    const emailFieldMap = {
        'email1': 1,
        'email2': 2,
        'email3': 3,
        'email4': 4,
        'email5': 5,
        'email6': 6,
        'email7': 7,
        'email8a': 8,  // Day 8 Morning - Why a Call Helps
        'email9': 9,
        'email10': 10,
        'email11': 11,
        'email12': 12,
        'email13': 13,
        'email14': 14,
        'email15a': 15  // Day 15 Morning - Final Day
    };

    console.log('[DirectEmailMapper] Starting email mapping...');
    console.log('[DirectEmailMapper] Available email fields:', Object.keys(emailsVaultContent || {}));
    console.log('[DirectEmailMapper] HTML conversion enabled:', convertToHtml);

    let mappedCount = 0;
    let emptyCount = 0;

    for (const [fieldId, ghlNum] of Object.entries(emailFieldMap)) {
        const email = emailsVaultContent?.[fieldId];

        // Extract subject (keep as plain text)
        const subject = email?.subject || '';

        // Extract preheader/preview text (keep as plain text)
        const preheader = email?.preview || email?.preheader || '';

        // Extract body and optionally convert to HTML
        let body = email?.body || '';
        if (body && convertToHtml && !isAlreadyHtml(body)) {
            body = convertEmailToHtml(body);
            console.log(`[DirectEmailMapper] Converted email ${ghlNum} body to HTML (${body.length} chars)`);
        }

        result[`Optin_Email_Subject ${ghlNum}`] = subject;
        result[`Optin_Email_Body ${ghlNum}`] = body;
        result[`Optin_Email_Preheader ${ghlNum}`] = preheader;

        if (subject || body || preheader) {
            mappedCount++;
            console.log(`[DirectEmailMapper] ✓ ${fieldId} → Optin_Email ${ghlNum}: Subject=${subject.length} chars, Body=${body.length} chars, Preheader=${preheader.length} chars`);
        } else {
            emptyCount++;
            console.log(`[DirectEmailMapper] ○ ${fieldId} → Optin_Email ${ghlNum}: Empty`);
        }
    }

    // Handle Day 8 and Day 15 time-specific variants (Morning/Afternoon/Evening)
    // email8a = Morning, email8b = Afternoon, email8c = Evening
    const email8Variants = [
        { fieldId: 'email8a', suffix: 'Morning' },
        { fieldId: 'email8b', suffix: 'Afternoon' },
        { fieldId: 'email8c', suffix: 'Evening' }
    ];

    for (const variant of email8Variants) {
        const email = emailsVaultContent?.[variant.fieldId];
        if (email) {
            const subject = email?.subject || '';
            const preheader = email?.preview || email?.preheader || '';
            let body = email?.body || '';
            if (body && convertToHtml && !isAlreadyHtml(body)) {
                body = convertEmailToHtml(body);
            }

            result[`Optin_Email_Subject 8 ${variant.suffix}`] = subject;
            result[`Optin_Email_Body 8 ${variant.suffix}`] = body;
            result[`Optin_Email_Preheader 8 ${variant.suffix}`] = preheader;

            if (subject || body || preheader) {
                console.log(`[DirectEmailMapper] ✓ ${variant.fieldId} → Optin_Email 8 ${variant.suffix}: Subject=${subject.length} chars, Body=${body.length} chars, Preheader=${preheader.length} chars`);
            }
        }
    }

    // email15a = Morning, email15b = Afternoon, email15c = Evening
    const email15Variants = [
        { fieldId: 'email15a', suffix: 'Morning' },
        { fieldId: 'email15b', suffix: 'Afternoon' },
        { fieldId: 'email15c', suffix: 'Evening' }
    ];

    for (const variant of email15Variants) {
        const email = emailsVaultContent?.[variant.fieldId];
        if (email) {
            const subject = email?.subject || '';
            const preheader = email?.preview || email?.preheader || '';
            let body = email?.body || '';
            if (body && convertToHtml && !isAlreadyHtml(body)) {
                body = convertEmailToHtml(body);
            }

            result[`Optin_Email_Subject 15 ${variant.suffix}`] = subject;
            result[`Optin_Email_Body 15 ${variant.suffix}`] = body;
            result[`Optin_Email_Preheader 15 ${variant.suffix}`] = preheader;

            if (subject || body || preheader) {
                console.log(`[DirectEmailMapper] ✓ ${variant.fieldId} → Optin_Email 15 ${variant.suffix}: Subject=${subject.length} chars, Body=${body.length} chars, Preheader=${preheader.length} chars`);
            }
        }
    }

    // Free Gift Email - check if it exists in vault
    const freeGiftEmail = emailsVaultContent?.freeGiftEmail;
    let freeGiftBody = freeGiftEmail?.body || '';
    if (freeGiftBody && convertToHtml && !isAlreadyHtml(freeGiftBody)) {
        freeGiftBody = convertEmailToHtml(freeGiftBody);
    }
    result['Free_Gift_Email Subject'] = freeGiftEmail?.subject || '';
    result['Free_Gift_Email Body'] = freeGiftBody;

    console.log(`[DirectEmailMapper] Complete: ${mappedCount} emails mapped, ${emptyCount} empty`);

    return result;
}

/**
 * Validates email content before mapping
 * @param {object} emailsVaultContent - The emails section from vault content
 * @returns {object} - Validation result with warnings
 */
export function validateEmailContent(emailsVaultContent) {
    const warnings = [];
    const stats = {
        total: 0,
        withSubject: 0,
        withBody: 0,
        complete: 0,
        empty: 0
    };

    const emailFields = [
        'email1', 'email2', 'email3', 'email4', 'email5', 'email6', 'email7',
        'email8a', 'email8b', 'email8c',
        'email9', 'email10', 'email11', 'email12', 'email13', 'email14',
        'email15a', 'email15b', 'email15c'
    ];

    for (const fieldId of emailFields) {
        stats.total++;
        const email = emailsVaultContent?.[fieldId];

        if (!email) {
            stats.empty++;
            continue;
        }

        const hasSubject = email.subject && email.subject.trim().length > 0;
        const hasBody = email.body && email.body.trim().length > 0;

        if (hasSubject) stats.withSubject++;
        if (hasBody) stats.withBody++;
        if (hasSubject && hasBody) stats.complete++;

        // Check for potential issues
        if (hasSubject && !hasBody) {
            warnings.push({ fieldId, issue: 'Has subject but no body' });
        }
        if (!hasSubject && hasBody) {
            warnings.push({ fieldId, issue: 'Has body but no subject' });
        }
        if (email.subject && email.subject.length > 100) {
            warnings.push({ fieldId, issue: `Subject too long: ${email.subject.length} chars` });
        }
    }

    return { stats, warnings };
}

/**
 * Get unmapped email fields (ones not sent to GHL)
 * These are the extra closing emails that could be used elsewhere
 */
export function getUnmappedEmails(emailsVaultContent) {
    // All emails are now mapped to GHL (including time-specific variants)
    // email8a/b/c → Optin_Email 8 Morning/Afternoon/Evening
    // email15a/b/c → Optin_Email 15 Morning/Afternoon/Evening
    // No unmapped fields remain

    return {};
}

export default {
    mapEmailsToGHLValues,
    validateEmailContent,
    getUnmappedEmails
};
