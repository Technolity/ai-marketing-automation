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
    "keyFeatures": [
      "Benefit they'll get from the call",
      "Second benefit",
      "Third benefit"
    ],
    "preparationSteps": [
      "Watch training video",
      "Think about #1 goal",
      "Write 2-3 questions"
    ],
    "confirmationEmail": {
      "timing": "Immediately upon booking",
      "subject": "🎉 Confirmed! Your call is booked",
      "previewText": "Plain text preview (no HTML)",
      "body": "<p>Hey {{contact.first_name}},</p>\\n\\n<p><strong>Your call is confirmed!</strong></p>\\n\\n<p>\\nComplete 100-150 word HTML-formatted confirmation email with what to expect, how to prepare, and encouragement. Use <ul><li> for preparation steps.\\n</p>\\n\\n<p>\\n<strong>\\n<a href=\\"{{custom_values.schedule_link}}\\" target=\\"_blank\\">\\nView your booking\\n</a>\\n</strong>\\n</p>"
    },
    "reminder48Hours": {
      "timing": "48 hours before",
      "subject": "📅 Your call is in 2 days!",
      "previewText": "Plain text preview (no HTML)",
      "body": "<p>Hey {{contact.first_name}},</p>\\n\\n<p>Complete 100-150 word HTML-formatted 48hr reminder with value preview and preparation tips. End with session link using {{custom_values.session_link}}</p>"
    },
    "reminder24Hours": {
      "timing": "24 hours before",
      "subject": "⏰ Tomorrow's the day!",
      "previewText": "Plain text preview (no HTML)",
      "body": "<p>Hey {{contact.first_name}},</p>\\n\\n<p>Complete 100-150 word HTML-formatted reminder with preparation checklist using <ul><li> and value preview. End with session link using {{custom_values.session_link}}</p>"
    },
    "reminder1Hour": {
      "timing": "1 hour before",
      "subject": "⌛ 1 hour to go!",
      "previewText": "Plain text preview (no HTML)",
      "body": "<p>Hey {{contact.first_name}},</p>\\n\\n<p>Complete 75-100 word HTML-formatted final reminder with checklist using <ul><li> and session link using {{custom_values.session_link}}</p>"
    },
    "reminder10Minutes": {
      "timing": "10 minutes before",
      "subject": "🔔 Starting in 10 minutes!",
      "previewText": "Plain text preview (no HTML)",
      "body": "<p>Hey {{contact.first_name}},</p>\\n\\n<p>Complete 50-75 word HTML-formatted quick reminder with <strong><a href=\\"{{custom_values.session_link}}\\" target=\\"_blank\\">Join here</a></strong></p>"
    },
    "startingNow": {
      "timing": "At appointment time",
      "subject": "🚀 We're starting NOW",
      "previewText": "Plain text preview (no HTML)",
      "body": "<p>Hey {{contact.first_name}},</p>\\n\\n<p><strong>We're starting NOW!</strong></p>\\n\\n<p>Complete 50-75 word HTML-formatted urgent join reminder with <strong><a href=\\"{{custom_values.session_link}}\\" target=\\"_blank\\">Join now</a></strong></p>"
    },
    "noShowFollowUp": {
      "timing": "15 min after missed",
      "subject": "We missed you - everything okay?",
      "previewText": "Plain text preview (no HTML)",
      "body": "<p>Hey {{contact.first_name}},</p>\\n\\n<p>Complete 100-150 word HTML-formatted caring follow-up with reschedule link using <strong><a href=\\"{{custom_values.schedule_link}}\\" target=\\"_blank\\">Reschedule here</a></strong></p>"
    },
    "smsReminders": {
      "confirmationSms": {"timing": "Immediately upon booking", "message": "Hey {{contact.first_name}}! Your call is confirmed. Watch the video training before we connect: {{custom_values.session_link}}"},
      "reminder48HoursSms": {"timing": "48 hours before", "message": "Hey {{contact.first_name}}, your call is in 2 days! Make sure to prepare. {{custom_values.session_link}}"},
      "reminder24HoursSms": {"timing": "24 hours before", "message": "Hey {{contact.first_name}}, your call is tomorrow! Quick prep: think about your #1 goal. {{custom_values.session_link}}"},
      "reminder1HourSms": {"timing": "1 hour before", "message": "Hey {{contact.first_name}}, 1 hour until your call! Get ready and join here: {{custom_values.session_link}}"},
      "reminder10MinSms": {"timing": "10 minutes before", "message": "Hey {{contact.first_name}}, starting in 10 min! Join here: {{custom_values.session_link}}"},
      "startingNowSms": {"timing": "At appointment time", "message": "Hey {{contact.first_name}}, we're LIVE now! Join here: {{custom_values.session_link}}"}
    }
  }
}

All content must be SPECIFIC to the business. Emails should be conversational and encouraging. SMS messages must be under 300 characters.
`;

export default appointmentRemindersPrompt;
