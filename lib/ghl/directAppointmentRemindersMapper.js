/**
 * Direct Appointment Reminders Mapper
 * Maps vault appointmentReminders fields directly to GHL custom values without AI
 * Handles both email and SMS reminders for the booking funnel
 *
 * Vault schema uses named keys:
 *   - Emails: confirmationEmail, reminder48Hours, reminder24Hours, reminder1Hour, reminder10Minutes, startingNow, noShowFollowUp
 *   - SMS: smsReminders.confirmationSms, reminder48HoursSms, reminder24HoursSms, reminder1HourSms, reminder10MinSms, startingNowSms
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
    // Keys match vault schema named fields from appointmentRemindersSchema
    const emailReminders = [
        { vaultField: 'confirmationEmail', ghlKey: 'When Call Booked' },
        { vaultField: 'reminder48Hours',   ghlKey: '48 Hour before Call Time' },
        { vaultField: 'reminder24Hours',   ghlKey: '24 Hour before Call Time' },
        { vaultField: 'reminder1Hour',     ghlKey: '1 Hour before Call Time' },
        { vaultField: 'reminder10Minutes', ghlKey: '10 min before Call Time' },
        { vaultField: 'startingNow',       ghlKey: 'at Call Time' },
        { vaultField: 'noShowFollowUp',    ghlKey: 'No Show' }
    ];

    let emailsMapped = 0;
    for (const reminder of emailReminders) {
        const email = appointmentRemindersContent?.[reminder.vaultField];

        if (email) {
            const subject = email?.subject || '';
            const preheader = email?.previewText || email?.preview || email?.preheader || '';
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
    // SMS reminders are nested inside smsReminders sub-object
    const smsSource = appointmentRemindersContent?.smsReminders || {};

    const smsReminders = [
        { vaultField: 'confirmationSms',    ghlKey: 'When Call Booked' },
        { vaultField: 'reminder48HoursSms', ghlKey: '48 Hour before Call Time' },
        { vaultField: 'reminder24HoursSms', ghlKey: '24 Hour before Call Time' },
        { vaultField: 'reminder1HourSms',   ghlKey: '1 Hour before Call Time' },
        { vaultField: 'reminder10MinSms',   ghlKey: '10 Min before Call Time' },
        { vaultField: 'startingNowSms',     ghlKey: 'at Call Time' }
    ];

    let smsMapped = 0;
    for (const reminder of smsReminders) {
        const sms = smsSource?.[reminder.vaultField];

        if (sms) {
            const message = typeof sms === 'string' ? sms : (sms?.message || sms?.body || '');
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
        totalEmails: 7,
        totalSMS: 6,
        completeEmails: 0,
        completeSMS: 0,
        emptyEmails: 0,
        emptySMS: 0
    };

    const emailFields = [
        'confirmationEmail',
        'reminder48Hours',
        'reminder24Hours',
        'reminder1Hour',
        'reminder10Minutes',
        'startingNow',
        'noShowFollowUp'
    ];

    const smsFields = [
        'confirmationSms',
        'reminder48HoursSms',
        'reminder24HoursSms',
        'reminder1HourSms',
        'reminder10MinSms',
        'startingNowSms'
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

    // Validate SMS (from smsReminders sub-object)
    const smsSource = appointmentRemindersContent?.smsReminders || {};
    for (const fieldId of smsFields) {
        const sms = smsSource?.[fieldId];

        if (!sms) {
            stats.emptySMS++;
        } else {
            const message = typeof sms === 'string' ? sms : (sms?.message || sms?.body || '');
            if (message.trim().length > 0) {
                stats.completeSMS++;

                // Check SMS length
                if (message.length > 300) {
                    warnings.push({
                        fieldId,
                        issue: `SMS is ${message.length} chars (exceeds 300 char limit)`
                    });
                }
            } else {
                stats.emptySMS++;
            }
        }
    }

    return { stats, warnings };
}

const directAppointmentRemindersMapper = {
    mapAppointmentRemindersToGHLValues,
    validateAppointmentRemindersContent
};
export default directAppointmentRemindersMapper;