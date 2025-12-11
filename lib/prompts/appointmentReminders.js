/**
 * Appointment Show-Up Sequence Generator
 * Creates reminder emails and SMS to ensure clients show up for consultation
 */

export const appointmentRemindersPrompt = (data) => `
Create a sequence of emails and text messages to ensure clients show up for their scheduled consultation.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== REMINDER SEQUENCE OVERVIEW ===
1. Immediate booking confirmation
2. 48 hours before
3. 24 hours before
4. Morning of appointment
5. 1 hour before
6. 10 minutes before
7. Starting now

=== EMAIL 1: IMMEDIATE BOOKING CONFIRMATION ===
Subject: 🌟 Your Exclusive Appointment Confirmation - [Brand Name]

Include:
- Welcome message
- Confirmation of [Service/Consultation Name]
- Why this matters paragraph
- Prepare for appointment section (mention video to watch)
- Details section: {{appointment.start_time}}, {{appointment.meeting_location}}
- What they'll discover (3 bullets)
- Next steps to prepare
- Sign off

SMS 1: Immediate Confirmation
- Thanks for booking
- Important email sent
- Check inbox and spam
- Put in calendar

=== EMAIL 2: 48-HOUR REMINDER ===
Subject: 🚀 Just 48 Hours to Go - Prepare for Your [Consultation]!

Include:
- Reminder of upcoming session
- What awaits them (3 points)
- Exciting opportunities (2-3 bullets)
- Main goal reminder
- Sign off

SMS 2: 48-Hour Text
- Quick reminder
- 48 hours away
- Check calendar

=== EMAIL 3: 24-HOUR REMINDER ===
Subject: ⌛ Countdown Begins: 24 Hours to Your [Consultation]!

Include:
- Almost time message
- Sneak peek (3 bullets)
- Get ready section
- Details reminder
- Sign off

=== EMAIL 4: MORNING OF (Day of) ===
- Reminder it's today
- What to expect
- Preparation tips
- Meeting link

=== EMAIL 5: 1-HOUR REMINDER ===
Subject: ⌛ One Hour Left: Key Insights Await!

Include:
- One hour warning
- 3 essential insights from video they might have missed
- Last-minute preparations (quiet setting, questions ready)
- Join session link
- Details reminder

SMS 5: 1-Hour Text
- Looking forward to meeting in one hour
- Email sent with details
- Check inbox

=== EMAIL 6: 10-MINUTE REMINDER ===
Subject: ⏰ Your Session Begins in 10 Minutes - Don't Miss Out!

Include:
- Almost time message
- Quick recap (3 key benefits)
- Last-minute checklist
- Join link
- Warm regards

SMS 6: 10-Minute Text
- Time to find quiet place
- Email sent with details
- Looking forward to call

=== EMAIL 7: STARTING NOW ===
Subject: 🚀 It's Time: Your [Consultation] with [Brand]

Include:
- The moment has arrived
- Join now link
- We're ready message
- Excited sign off

Return ONLY valid JSON in this structure:
{
  "appointmentReminders": {
    "immediateConfirmation": {
      "email": {
        "subjectLine": "Subject with emoji",
        "body": "Full email body with {{appointment.start_time}} and {{appointment.meeting_location}} placeholders"
      },
      "sms": {
        "body": "SMS text with {{contact.name}} placeholder"
      }
    },
    "hours48": {
      "email": {
        "subjectLine": "",
        "body": ""
      },
      "sms": {
        "body": ""
      }
    },
    "hours24": {
      "email": {
        "subjectLine": "",
        "body": ""
      }
    },
    "morningOf": {
      "email": {
        "subjectLine": "",
        "body": ""
      }
    },
    "hour1": {
      "email": {
        "subjectLine": "",
        "body": ""
      },
      "sms": {
        "body": ""
      }
    },
    "minutes10": {
      "email": {
        "subjectLine": "",
        "body": ""
      },
      "sms": {
        "body": ""
      }
    },
    "startingNow": {
      "email": {
        "subjectLine": "",
        "body": ""
      }
    }
  }
}
`;

export default appointmentRemindersPrompt;
