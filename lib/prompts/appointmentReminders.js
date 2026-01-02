/**
 * Appointment Reminders - Optimized for Reliable Generation
 * Show-up sequence to ensure leads attend calls
 */

export const appointmentRemindersPrompt = (data) => `
Generate appointment reminder sequence. Be SPECIFIC and COMPLETE. NO placeholders except [Video Link], [Booking Link], [Session Link].

BUSINESS DATA:
• Business: ${data.businessName || 'Your Business'}
• Offer: ${data.offerProgram || 'Free Strategy Session'}
• Outcomes: ${data.outcomes || 'Transform results'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Proof: ${data.testimonials || 'Not specified'}

Use {{contact.first_name}} for personalization.

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
        "body": "Complete 100-150 word confirmation email with what to expect, how to prepare, and encouragement"
      },
      {
        "name": "24-Hour Reminder",
        "timing": "24 hours before",
        "subject": "⏰ Tomorrow's the day!",
        "body": "Complete 100-150 word reminder with preparation checklist and value preview"
      },
      {
        "name": "1-Hour Reminder",
        "timing": "1 hour before",
        "subject": "⌛ 1 hour to go!",
        "body": "Complete 75-100 word final reminder with checklist and session link placeholder"
      },
      {
        "name": "Starting Now",
        "timing": "At appointment time",
        "subject": "🚀 We're starting NOW",
        "body": "Complete 50-75 word urgent join reminder with session link"
      },
      {
        "name": "No-Show Follow-up",
        "timing": "15 min after missed",
        "subject": "We missed you - everything okay?",
        "body": "Complete 100-150 word caring follow-up with reschedule link"
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
