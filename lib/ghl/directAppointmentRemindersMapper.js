/**
 * Direct Appointment Reminders Mapper
 * Maps vault appointmentReminders fields directly to GHL custom values without AI
 * Handles both email and SMS reminders for the booking funnel
 */

import { convertEmailToHtml, isAlreadyHtml } from './emailFormatter.js';

/**
 * Maps vault appointmentReminders section content directly to GHL custom values
 * @param {object} appointmentRemindersContent - The appointmentReminders section from vault content
 * @param {object} options - Mapping options
 * @returns {object} - Key-value pairs for GHL custom values
 */
export function mapAppointmentRemindersToGHLValues(appointmentRemindersContent, options = {}) {
    const {
        convertToHtml = true // Convert markdown to HTML for email bodies
    } = options;

    const result = {};

    console.log('[AppointmentRemindersMapper] Starting appointment reminders mapping...');
    console.log('[AppointmentRemindersMapper] Available fields:', Object.keys(appointmentRemindersContent || {}));

    // Mapping for appointment reminder emails
    // Each reminder has: subject, body, preheader
    const emailReminders = [
        { vaultField: 'emailWhenBooked', ghlKey: 'When Call Booked' },
        { vaultField: 'email48HourBefore', ghlKey: '48 Hour before Call Time' },
        { vaultField: 'email24HourBefore', ghlKey: '24 Hour before Call Time' },
        { vaultField: 'email1HourBefore', ghlKey: '1 Hour before Call Time' },
        { vaultField: 'email10MinBefore', ghlKey: '10 min before Call Time' },
        { vaultField: 'emailAtCallTime', ghlKey: 'at Call Time' }
    ];

    let emailsMapped = 0;
    for (const reminder of emailReminders) {
        const email = appointmentRemindersContent?.[reminder.vaultField];

        if (email) {
            const subject = email?.subject || '';
            const preheader = email?.preview || email?.preheader || '';
            let body = email?.body || '';

            // Convert body to HTML if needed
            if (body && convertToHtml && !isAlreadyHtml(body)) {
                body = convertEmailToHtml(body);
            }

            result[`Email Subject ${reminder.ghlKey}`] = subject;
            result[`Email Body ${reminder.ghlKey}`] = body;
            result[`Email PreHeader ${reminder.ghlKey}`] = preheader;

            if (subject || body || preheader) {
                emailsMapped++;
                console.log(`[AppointmentRemindersMapper] ✓ Email ${reminder.ghlKey}: Subject=${subject.length} chars, Body=${body.length} chars, PreHeader=${preheader.length} chars`);
            }
        }
    }

    // Mapping for appointment reminder SMS
    // Each SMS has just a message
    const smsReminders = [
        { vaultField: 'smsWhenBooked', ghlKey: 'When Call Booked' },
        { vaultField: 'sms48HourBefore', ghlKey: '48 Hour before Call Time' },
        { vaultField: 'sms24HourBefore', ghlKey: '24 Hour before Call Time' },
        { vaultField: 'sms1HourBefore', ghlKey: '1 Hour before Call Time' },
        { vaultField: 'sms10MinBefore', ghlKey: '10 Min before Call Time' },
        { vaultField: 'smsAtCallTime', ghlKey: 'at Call Time' }
    ];

    let smsMapped = 0;
    for (const reminder of smsReminders) {
        const sms = appointmentRemindersContent?.[reminder.vaultField];

        if (sms) {
            const message = sms?.message || sms?.body || '';
            result[`SMS ${reminder.ghlKey}`] = message;

            if (message) {
                smsMapped++;
                console.log(`[AppointmentRemindersMapper] ✓ SMS ${reminder.ghlKey}: ${message.length} chars`);
            }
        }
    }

    console.log(`[AppointmentRemindersMapper] Complete: ${emailsMapped} emails + ${smsMapped} SMS mapped`);

    return result;
}

/**
 * Validates appointment reminder content before mapping
 * @param {object} appointmentRemindersContent - The appointmentReminders section from vault content
 * @returns {object} - Validation result with warnings
 */
export function validateAppointmentRemindersContent(appointmentRemindersContent) {
    const warnings = [];
    const stats = {
        totalEmails: 6,
        totalSMS: 6,
        completeEmails: 0,
        completeSMS: 0,
        emptyEmails: 0,
        emptySMS: 0
    };

    const emailFields = [
        'emailWhenBooked',
        'email48HourBefore',
        'email24HourBefore',
        'email1HourBefore',
        'email10MinBefore',
        'emailAtCallTime'
    ];

    const smsFields = [
        'smsWhenBooked',
        'sms48HourBefore',
        'sms24HourBefore',
        'sms1HourBefore',
        'sms10MinBefore',
        'smsAtCallTime'
    ];

    // Validate emails
    for (const fieldId of emailFields) {
        const email = appointmentRemindersContent?.[fieldId];

        if (!email || (!email.subject && !email.body)) {
            stats.emptyEmails++;
        } else {
            const hasSubject = email.subject && email.subject.trim().length > 0;
            const hasBody = email.body && email.body.trim().length > 0;

            if (hasSubject && hasBody) {
                stats.completeEmails++;
            } else if (hasSubject && !hasBody) {
                warnings.push({ fieldId, issue: 'Has subject but no body' });
            } else if (!hasSubject && hasBody) {
                warnings.push({ fieldId, issue: 'Has body but no subject' });
            }
        }
    }

    // Validate SMS
    for (const fieldId of smsFields) {
        const sms = appointmentRemindersContent?.[fieldId];

        if (!sms || !sms.message) {
            stats.emptySMS++;
        } else {
            const message = sms.message || sms.body || '';
            if (message.trim().length > 0) {
                stats.completeSMS++;

                // Check SMS length
                if (message.length > 160) {
                    const segments = Math.ceil(message.length / 153);
                    warnings.push({
                        fieldId,
                        issue: `SMS is ${message.length} chars (${segments} segments)`
                    });
                }
            } else {
                stats.emptySMS++;
            }
        }
    }

    return { stats, warnings };
}

export default {
    mapAppointmentRemindersToGHLValues,
    validateAppointmentRemindersContent
};
