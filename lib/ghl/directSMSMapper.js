/**
 * Direct SMS Mapper
 * Maps vault SMS fields directly to GHL custom values without AI
 * This is more reliable than AI parsing for structured data extraction
 */

/**
 * Maps vault SMS section content directly to GHL custom values
 * @param {object} smsVaultContent - The sms section from vault content
 * @returns {object} - Key-value pairs for GHL custom values
 */
export function mapSMSToGHLValues(smsVaultContent) {
    const result = {};

    // Mapping: 19 vault SMS → 15 GHL custom value slots (same structure as emails)
    // sms1-sms7 → Optin_SMS_1-7
    // sms8a → Optin_SMS_8_Morning (morning closing SMS)
    // sms9-sms14 → Optin_SMS_9-14
    // sms15a → Optin_SMS_15_Morning (final day morning)
    const smsFieldMap = {
        'sms1': 1,
        'sms2': 2,
        'sms3': 3,
        'sms4': 4,
        'sms5': 5,
        'sms6': 6,
        'sms7': 7,
        'sms8a': 8,  // Day 8 Morning - Why a Call Helps
        'sms9': 9,
        'sms10': 10,
        'sms11': 11,
        'sms12': 12,
        'sms13': 13,
        'sms14': 14,
        'sms15a': 15  // Day 15 Morning - Final Day
    };

    console.log('[DirectSMSMapper] Starting SMS mapping...');
    console.log('[DirectSMSMapper] Available SMS fields:', Object.keys(smsVaultContent || {}));

    let mappedCount = 0;
    let emptyCount = 0;

    for (const [fieldId, ghlNum] of Object.entries(smsFieldMap)) {
        const sms = smsVaultContent?.[fieldId];

        // Extract message body (SMS only has message content, no subject/preheader)
        const message = sms?.message || sms?.body || '';

        result[`Optin_SMS_${ghlNum}`] = message;

        if (message) {
            mappedCount++;
            console.log(`[DirectSMSMapper] ✓ ${fieldId} → Optin_SMS_${ghlNum}: ${message.length} chars`);
        } else {
            emptyCount++;
            console.log(`[DirectSMSMapper] ○ ${fieldId} → Optin_SMS_${ghlNum}: Empty`);
        }
    }

    // Handle Day 8 time-specific variants (Morning/Afternoon/Evening)
    // sms8a = Morning, sms8b = Afternoon, sms8c = Evening
    const sms8Variants = [
        { fieldId: 'sms8a', suffix: 'Morning' },
        { fieldId: 'sms8b', suffix: 'Afternoon' },
        { fieldId: 'sms8c', suffix: 'Evening' }
    ];

    for (const variant of sms8Variants) {
        const sms = smsVaultContent?.[variant.fieldId];
        if (sms) {
            const message = sms?.message || sms?.body || '';
            result[`Optin_SMS_8_${variant.suffix}`] = message;

            if (message) {
                console.log(`[DirectSMSMapper] ✓ ${variant.fieldId} → Optin_SMS_8_${variant.suffix}: ${message.length} chars`);
            }
        }
    }

    // Handle Day 15 time-specific variants (Morning/Afternoon/Evening)
    // sms15a = Morning, sms15b = Afternoon, sms15c = Evening
    const sms15Variants = [
        { fieldId: 'sms15a', suffix: 'Morning' },
        { fieldId: 'sms15b', suffix: 'Afternoon' },
        { fieldId: 'sms15c', suffix: 'Evening' }
    ];

    for (const variant of sms15Variants) {
        const sms = smsVaultContent?.[variant.fieldId];
        if (sms) {
            const message = sms?.message || sms?.body || '';
            result[`Optin_SMS_15_${variant.suffix}`] = message;

            if (message) {
                console.log(`[DirectSMSMapper] ✓ ${variant.fieldId} → Optin_SMS_15_${variant.suffix}: ${message.length} chars`);
            }
        }
    }

    console.log(`[DirectSMSMapper] Complete: ${mappedCount} SMS mapped, ${emptyCount} empty`);

    return result;
}

/**
 * Validates SMS content before mapping
 * @param {object} smsVaultContent - The sms section from vault content
 * @returns {object} - Validation result with warnings
 */
export function validateSMSContent(smsVaultContent) {
    const warnings = [];
    const stats = {
        total: 0,
        withMessage: 0,
        empty: 0,
        tooLong: 0  // SMS should typically be under 160 chars
    };

    const smsFields = [
        'sms1', 'sms2', 'sms3', 'sms4', 'sms5', 'sms6', 'sms7',
        'sms8a', 'sms8b', 'sms8c',
        'sms9', 'sms10', 'sms11', 'sms12', 'sms13', 'sms14',
        'sms15a', 'sms15b', 'sms15c'
    ];

    for (const fieldId of smsFields) {
        stats.total++;
        const sms = smsVaultContent?.[fieldId];

        if (!sms) {
            stats.empty++;
            continue;
        }

        const message = sms?.message || sms?.body || '';
        const hasMessage = message && message.trim().length > 0;

        if (hasMessage) {
            stats.withMessage++;

            // Check for SMS length (160 chars = 1 SMS, 306 chars = 2 SMS segments)
            if (message.length > 160) {
                stats.tooLong++;
                const segments = Math.ceil(message.length / 153); // 153 chars per segment for multi-part
                warnings.push({
                    fieldId,
                    issue: `SMS is ${message.length} chars (${segments} segments). Consider shortening.`
                });
            }
        } else {
            stats.empty++;
        }
    }

    return { stats, warnings };
}

export default {
    mapSMSToGHLValues,
    validateSMSContent
};
