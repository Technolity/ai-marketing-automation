/**
 * Appointment Reminders - Optimized for Reliable Generation
 * Show-up sequence to ensure leads attend calls
 */

export const appointmentRemindersPrompt = (data) => `
Generate appointment reminder sequence. Be SPECIFIC and COMPLETE.

BUSINESS DATA:
• Business: ${data.businessName || 'Your Business'}
• Offer: ${data.offerProgram || 'Free Strategy Session'}
• Outcomes: ${data.outcomes || 'Transform results'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Proof: ${data.testimonials || 'Not specified'}

=== FORMATTING REQUIREMENTS ===
**CRITICAL: Format all email bodies using proper HTML tags:**
• Wrap each paragraph in <p></p> tags
• Use <strong></strong> for emphasis (not bold or **)
• Use <ul><li></li></ul> for bulleted lists (like preparation checklists)
• Use <ol><li></li></ol> for numbered lists
• Use <a href="{{custom_values.schedule_link}}" target="_blank">link text</a> for booking/reschedule links
• Use <a href="{{custom_values.session_link}}" target="_blank">link text</a> for session/call join links
• Use {{contact.first_name}} for personalization
• NO markdown formatting (no **, no #, no -, use HTML tags only)
• Each paragraph should be wrapped in <p></p> tags with proper line breaks between them

**Example HTML structure:**
<p>Hey {{contact.first_name}},</p>

<p><strong>Your call is confirmed!</strong></p>

<p>
Here's what to prepare:
</p>

<ul>
  <li>Watch the training video</li>
  <li>Think about your #1 goal</li>
  <li>Write 2-3 questions</li>
</ul>

<p>
<strong>
<a href="{{custom_values.session_link}}" target="_blank">
Join your call here
</a>
</strong>
</p>

Generate JSON (no markdown):
{
  "appointmentReminders": {
    "contentTips": {
      "tip1": {"title": "Tip 1 Title", "briefRecap": "2-3 sentence explanation of valuable insight"},
      "tip2": {"title": "Tip 2 Title", "briefRecap": "2-3 sentence explanation of key strategy"},
      "tip3": {"title": "Tip 3 Title", "briefRecap": "2-3 sentence explanation of important concept"}
    },
    "keyBenefits": [
      "Benefit they'll get from the call",
      "Second benefit",
      "Third benefit"
    ],
    "preparationSteps": [
      "Watch training video",
      "Think about #1 goal",
      "Write 2-3 questions"
    ],
    "emails": [
      {
        "name": "Confirmation",
        "timing": "Immediately",
        "subject": "🎉 Confirmed! Your call is booked",
        "preheader": "Plain text preview (no HTML)",
        "body": "<p>Hey {{contact.first_name}},</p>\n\n<p><strong>Your call is confirmed!</strong></p>\n\n<p>\nComplete 100-150 word HTML-formatted confirmation email with what to expect, how to prepare, and encouragement. Use <ul><li> for preparation steps.\n</p>\n\n<p>\n<strong>\n<a href=\"{{custom_values.schedule_link}}\" target=\"_blank\">\nView your booking\n</a>\n</strong>\n</p>"
      },
      {
        "name": "24-Hour Reminder",
        "timing": "24 hours before",
        "subject": "⏰ Tomorrow's the day!",
        "preheader": "Plain text preview (no HTML)",
        "body": "<p>Hey {{contact.first_name}},</p>\n\n<p>Complete 100-150 word HTML-formatted reminder with preparation checklist using <ul><li> and value preview. End with session link using {{custom_values.session_link}}</p>"
      },
      {
        "name": "1-Hour Reminder",
        "timing": "1 hour before",
        "subject": "⌛ 1 hour to go!",
        "preheader": "Plain text preview (no HTML)",
        "body": "<p>Hey {{contact.first_name}},</p>\n\n<p>Complete 75-100 word HTML-formatted final reminder with checklist using <ul><li> and session link using {{custom_values.session_link}}</p>"
      },
      {
        "name": "Starting Now",
        "timing": "At appointment time",
        "subject": "🚀 We're starting NOW",
        "preheader": "Plain text preview (no HTML)",
        "body": "<p>Hey {{contact.first_name}},</p>\n\n<p><strong>We're starting NOW!</strong></p>\n\n<p>Complete 50-75 word HTML-formatted urgent join reminder with <strong><a href=\"{{custom_values.session_link}}\" target=\"_blank\">Join now</a></strong></p>"
      },
      {
        "name": "No-Show Follow-up",
        "timing": "15 min after missed",
        "subject": "We missed you - everything okay?",
        "preheader": "Plain text preview (no HTML)",
        "body": "<p>Hey {{contact.first_name}},</p>\n\n<p>Complete 100-150 word HTML-formatted caring follow-up with reschedule link using <strong><a href=\"{{custom_values.schedule_link}}\" target=\"_blank\">Reschedule here</a></strong></p>"
      }
    ],
    "smsReminders": {
      "reminder1Day": "Short SMS text for 24hr reminder (under 160 chars)",
      "reminder1Hour": "Short SMS text for 1hr reminder (under 160 chars)",
      "reminderNow": "Short SMS text for now reminder (under 160 chars)"
    }
  }
}

All content must be SPECIFIC to the business. Emails should be conversational and encouraging.
`;

export default appointmentRemindersPrompt;
