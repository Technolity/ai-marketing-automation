import { toEmbedUrl } from '@/lib/utils/videoUrl';

export function getSlotPrefixes(slotIndex) {
    const slotPrefix = String(slotIndex).padStart(2, '0') + '_';
    const basePrefix = slotIndex === 3 ? '' : slotPrefix;
    return { slotPrefix, basePrefix };
}

function addValue(target, key, value) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && !value.trim()) return;
    target[key] = value;
}

export function extractSmsMessage(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        return value.message || value.body || value.text || '';
    }
    return String(value);
}

function getHex(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        return value.hex || value.value || value.color || '';
    }
    return String(value);
}

function getContentSection(vaultContent, sectionId, wrapperKey) {
    const section = vaultContent?.[sectionId] || {};
    return section?.[wrapperKey] || section;
}

function parseVaultFieldValue(field) {
    const raw = field?.field_value;
    if (raw === null || raw === undefined) return raw;
    if (typeof raw !== 'string') return raw;

    const trimmed = raw.trim();
    if (!trimmed) return raw;
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return raw;

    try {
        return JSON.parse(trimmed);
    } catch {
        return raw;
    }
}

function hasMeaningfulValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return Boolean(value.trim());
    if (typeof value === 'number' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.some(hasMeaningfulValue);
    if (typeof value === 'object') return Object.values(value).some(hasMeaningfulValue);
    return false;
}

const SECTION_WRAPPER_KEYS = {
    emails: 'emailSequence',
    sms: 'smsSequence',
    appointmentReminders: 'appointmentReminders',
};

export function mergeVaultFieldRowsIntoContent(vaultContent = {}, fieldRows = []) {
    const merged = { ...vaultContent };

    for (const row of fieldRows || []) {
        if (!row?.section_id || !row?.field_id) continue;

        const parsedValue = parseVaultFieldValue(row);
        if (!hasMeaningfulValue(parsedValue)) continue;

        const wrapperKey = SECTION_WRAPPER_KEYS[row.section_id];
        const currentSection = merged[row.section_id] && typeof merged[row.section_id] === 'object'
            ? { ...merged[row.section_id] }
            : {};

        if (wrapperKey) {
            const currentWrapped = currentSection[wrapperKey] && typeof currentSection[wrapperKey] === 'object'
                ? { ...currentSection[wrapperKey] }
                : { ...currentSection };

            if (row.field_id === wrapperKey && parsedValue && typeof parsedValue === 'object') {
                Object.assign(currentWrapped, parsedValue);
            } else {
                currentWrapped[row.field_id] = parsedValue;
            }

            merged[row.section_id] = {
                ...currentSection,
                [wrapperKey]: currentWrapped,
            };
        } else {
            merged[row.section_id] = {
                ...currentSection,
                [row.field_id]: parsedValue,
            };
        }
    }

    return merged;
}

function addEmailValues(values, baseKey, ghlKeys, email) {
    if (!email || typeof email !== 'object') return;

    addValue(values, baseKey(ghlKeys.subject), email.subject);
    addValue(values, baseKey(ghlKeys.preheader), email.preview || email.previewText || email.preheader);
    addValue(values, baseKey(ghlKeys.body), email.body);
}

const EMAIL_FIELD_TO_GHL = {
    email1: { subject: 'optin_email_subject_1', preheader: 'optin_email_preheader_1', body: 'optin_email_body_1' },
    email2: { subject: 'optin_email_subject_2', preheader: 'optin_email_preheader_2', body: 'optin_email_body_2' },
    email3: { subject: 'optin_email_subject_3', preheader: 'optin_email_preheader_3', body: 'optin_email_body_3' },
    email4: { subject: 'optin_email_subject_4', preheader: 'optin_email_preheader_4', body: 'optin_email_body_4' },
    email5: { subject: 'optin_email_subject_5', preheader: 'optin_email_preheader_5', body: 'optin_email_body_5' },
    email6: { subject: 'optin_email_subject_6', preheader: 'optin_email_preheader_6', body: 'optin_email_body_6' },
    email7: { subject: 'optin_email_subject_7', preheader: 'optin_email_preheader_7', body: 'optin_email_body_7' },
    email8a: { subject: 'optin_email_subject_8_morning', preheader: 'optin_email_preheader_8_morning', body: 'optin_email_body_8_morning' },
    email8b: { subject: 'optin_email_subject_8_afternoon', preheader: 'optin_email_preheader_8_afternoon', body: 'optin_email_body_8_afternoon' },
    email8c: { subject: 'optin_email_subject_8_evening', preheader: 'optin_email_preheader_8_evening', body: 'optin_email_body_8_evening' },
    email9: { subject: 'optin_email_subject_9', preheader: 'optin_email_preheader_9', body: 'optin_email_body_9' },
    email10: { subject: 'optin_email_subject_10', preheader: 'optin_email_preheader_10', body: 'optin_email_body_10' },
    email11: { subject: 'optin_email_subject_11', preheader: 'optin_email_preheader_11', body: 'optin_email_body_11' },
    email12: { subject: 'optin_email_subject_12', preheader: 'optin_email_preheader_12', body: 'optin_email_body_12' },
    email13: { subject: 'optin_email_subject_13', preheader: 'optin_email_preheader_13', body: 'optin_email_body_13' },
    email14: { subject: 'optin_email_subject_14', preheader: 'optin_email_preheader_14', body: 'optin_email_body_14' },
    email15a: { subject: 'optin_email_subject_15_morning', preheader: 'optin_email_preheader_15_morning', body: 'optin_email_body_15_morning' },
    email15b: { subject: 'optin_email_subject_15_afternoon', preheader: 'optin_email_preheader_15_afternoon', body: 'optin_email_body_15_afternoon' },
    email15c: { subject: 'optin_email_subject_15_evening', preheader: 'optin_email_preheader_15_evening', body: 'optin_email_body_15_evening' },
};

const SMS_FIELD_TO_GHL = {
    sms1: 'optin_sms_1',
    sms2: 'optin_sms_2',
    sms3: 'optin_sms_3',
    sms4: 'optin_sms_4',
    sms5: 'optin_sms_5',
    sms6: 'optin_sms_6',
    sms7a: 'optin_sms_7',
    sms7b: 'optin_sms_7_evening',
    sms8a: 'optin_sms_8_morning',
    sms8b: 'optin_sms_8_afternoon',
    sms8c: 'optin_sms_8_evening',
    sms9: 'optin_sms_9',
    sms10: 'optin_sms_10',
    sms11: 'optin_sms_11',
    sms12: 'optin_sms_12',
    sms13: 'optin_sms_13',
    sms14: 'optin_sms_14',
    sms15a: 'optin_sms_15_morning',
    sms15b: 'optin_sms_15_afternoon',
    sms15c: 'optin_sms_15_evening',
};

const APPOINTMENT_SMS_FIELD_TO_GHL = {
    confirmationSms: 'sms_when_call_booked',
    reminderBooked: 'sms_when_call_booked',
    reminder48HoursSms: 'sms_48_hour_before_call_time',
    reminder48Hour: 'sms_48_hour_before_call_time',
    reminder24HoursSms: 'sms_24_hour_before_call_time',
    reminder1Day: 'sms_24_hour_before_call_time',
    reminder1HourSms: 'sms_1_hour_before_call_time',
    reminder1Hour: 'sms_1_hour_before_call_time',
    reminder10MinSms: 'sms_10_min_before_call_time',
    reminder10Min: 'sms_10_min_before_call_time',
    startingNowSms: 'sms_at_call_time',
    reminderNow: 'sms_at_call_time',
};

export function buildSlotDeployCustomValues({
    vaultContent = {},
    mediaFromFields = {},
    userProfile = {},
    colorPaletteFromFields = null,
    defaultMediaValues = {},
    slotIndex = 3,
} = {}) {
    const { slotPrefix, basePrefix } = getSlotPrefixes(slotIndex);
    const values = {};
    const baseKey = (key) => basePrefix + key;
    const prefixedKey = (key) => slotPrefix + key;

    const colorsContent = colorPaletteFromFields || vaultContent.colors?.colorPalette || vaultContent.colors || vaultContent.colorPalette;
    if (colorsContent && typeof colorsContent === 'object') {
        addValue(values, baseKey('primary_color'), getHex(colorsContent.primary || colorsContent.primaryColor));
        addValue(values, baseKey('secondary_color'), getHex(colorsContent.secondary || colorsContent.secondaryColor));
        addValue(values, baseKey('tertiary_color'), getHex(colorsContent.tertiary || colorsContent.tertiaryColor || colorsContent.accentColor));
    }

    const mediaContent = getContentSection(vaultContent, 'media', 'media');
    const combinedMedia = {
        ...defaultMediaValues,
        ...mediaContent,
        ...mediaFromFields,
    };
    addValue(values, baseKey('logo_image'), combinedMedia.logo || combinedMedia.logoUrl || combinedMedia.logo_url);
    addValue(values, prefixedKey('vsl_bio_image'), combinedMedia.profile_photo || combinedMedia.bio_author || combinedMedia.bioPhoto || combinedMedia.bio_photo);
    // `banner_image` is the LIVE vault field_id for the Free Gift / opt-in image
    // (see VAULT_FIELD_STRUCTURES.media). `product_mockup` etc. are legacy aliases.
    // Listing banner_image FIRST fixes the "free gift image reverts to default" bug:
    // the deploy was looking only for product_mockup and never found the real image.
    addValue(values, prefixedKey('optin_mockup_image'), combinedMedia.banner_image || combinedMedia.product_mockup || combinedMedia.mockup || combinedMedia.mockupImage || combinedMedia.optin_mockup);
    addValue(values, prefixedKey('vsl_video_link'), toEmbedUrl(combinedMedia.main_vsl || combinedMedia.vslVideo || combinedMedia.vsl_video || combinedMedia.mainVideo));
    addValue(values, prefixedKey('thankyou_page_video_link'), toEmbedUrl(combinedMedia.thankyou_video || combinedMedia.thankYouVideo || combinedMedia.thank_you_video || combinedMedia.confirmationVideo));

    for (let i = 1; i <= 4; i++) {
        addValue(
            values,
            prefixedKey(`vsl_testimonial_review_${i}_image`),
            combinedMedia[`testimonial_review_${i}_image`] || combinedMedia[`testimonial${i}Photo`] || combinedMedia[`testimonial_${i}_photo`]
        );
    }

    addValue(values, baseKey('company_name'), userProfile.business_name || userProfile.company_name || userProfile.businessName);
    addValue(values, prefixedKey('company_email'), userProfile.email || userProfile.company_email);

    return values;
}

/**
 * Build GHL custom values for Phase 3 campaign content only:
 * emails, SMS, and appointment reminders.
 * Separated from buildSlotDeployCustomValues so Phase 2 (funnel) and
 * Phase 3 (campaigns) each push to their own distinct GHL key sets.
 */
export function buildCampaignCustomValues({ vaultContent = {}, slotIndex = 3 } = {}) {
    const { basePrefix } = getSlotPrefixes(slotIndex);
    const values = {};
    const baseKey = (key) => basePrefix + key;

    const emailSequence = getContentSection(vaultContent, 'emails', 'emailSequence');
    const freeGiftEmail = emailSequence.freeGift || emailSequence.freeGiftEmail || vaultContent.emails?.freeGiftEmail;
    if (freeGiftEmail) {
        addValue(values, baseKey('free_gift_email_subject'), freeGiftEmail.subject);
        addValue(values, baseKey('free_gift_email_body'), freeGiftEmail.body);
    }

    for (const [fieldId, ghlKeys] of Object.entries(EMAIL_FIELD_TO_GHL)) {
        const email = emailSequence[fieldId];
        addEmailValues(values, baseKey, ghlKeys, email);
    }

    const day8BaseEmail = emailSequence.email8 || emailSequence.day8 || emailSequence.email8a;
    addEmailValues(values, baseKey, {
        subject: 'optin_email_subject_8',
        preheader: 'optin_email_preheader_8',
        body: 'optin_email_body_8',
    }, day8BaseEmail);

    const smsSequence = getContentSection(vaultContent, 'sms', 'smsSequence');
    for (const [fieldId, ghlBaseKey] of Object.entries(SMS_FIELD_TO_GHL)) {
        addValue(values, baseKey(ghlBaseKey), extractSmsMessage(smsSequence[fieldId]));
    }

    const appointmentReminders = getContentSection(vaultContent, 'appointmentReminders', 'appointmentReminders');
    const smsReminders = appointmentReminders.smsReminders || {};
    for (const [fieldId, ghlBaseKey] of Object.entries(APPOINTMENT_SMS_FIELD_TO_GHL)) {
        addValue(values, baseKey(ghlBaseKey), extractSmsMessage(smsReminders[fieldId]));
    }

    return values;
}
