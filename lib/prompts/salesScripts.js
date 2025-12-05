/**
 * Sales Scripts Generator
 * Appointment Show-Up Email & Text Sequence from prompts.txt
 */

export const salesScriptsPrompt = (data) => `
Create a sequence of emails and text messages to ensure that a client shows up for their scheduled appointment. The client has booked a free consultation.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

===== BOOKING CONFIRMATION EMAIL (Sent Immediately) =====
Subject: 🌟 Your Exclusive Appointment Confirmation - [Brand/Service Name]
- Hi {{contact.name}}
- Welcome aboard! Successfully scheduled appointment
- Why This Matters: Unique value of the service
- Prepare for Your Appointment: Preparation steps
- Details: When, Where
- You'll discover: Key aspects (3 bullets)
- Your Next Steps
- Looking forward to our session

===== BOOKING CONFIRMATION SMS =====
- Hi {{contact.name}}
- Thanks for booking
- Important email sent with details
- Check inbox and spam folder
- Put appointment in calendar

===== 48-HOUR REMINDER EMAIL =====
Subject: 🚀 Just 48 Hours to Go - Prepare for Your [Service/Consultation Name]!
- Just a reminder, in 48 hours...
- What Awaits You (list steps of program)
- This is what we'll talk about on the free consult
- Exciting Opportunities
- Great chance to achieve main benefit

===== 48-HOUR REMINDER SMS =====
- Quick reminder consultation coming up in 48 hours
- Check calendar for appointment

===== 24-HOUR REMINDER EMAIL =====
Subject: ⌛ Countdown Begins: 24 Hours to Your [Service/Consultation Name]!
- Almost time! In just 24 hours...
- A Sneak Peek (key features)
- Get Ready: Main goal preparation
- Details: When, Where

===== DAY OF - 1-HOUR REMINDER EMAIL =====
Subject: ⌛ One Hour Left: Key Insights Await!
- Appointment just one hour away!
- Three key insights from video they might have missed:
  - Essential Insight #1 (tip from VSL)
  - Essential Insight #2
  - Essential Insight #3
- Last-Minute Preparations: quiet setting, questions ready
- Join Your Session Here: [Link]
- Details: When, Where

===== 1-HOUR REMINDER SMS =====
- Looking forward to meeting in about an hour
- Details sent in email
- Check inbox or spam folder

===== 10-MINUTE REMINDER EMAIL =====
Subject: ⏰ Your Session Begins in 10 Minutes - Don't Miss Out!
- Just 10 minutes away!
- Quick Recap of What's Ahead (3 benefits)
- Last-Minute Checklist: comfortable environment, materials, questions
- Join Us Here: [Link]
- Details: When, Where

===== 10-MINUTE REMINDER SMS =====
- Time to find your quiet place
- Email sent with details
- Looking forward to the call!

===== STARTING NOW EMAIL =====
Subject: 🚀 It's Time: Your [Service/Consultation Name] Starts Now!
- The moment has arrived!
- Join Us Now: [Link]
- We're here to ensure you get the most
- Details: When, Where

Return ONLY valid JSON in this exact structure:
{
  "showUpSequence": {
    "bookingConfirmation": {
      "email": {
        "subject": "🌟 Subject line",
        "body": "Complete email with placeholders",
        "details": "When/Where section"
      },
      "sms": "Complete SMS text"
    },
    "reminder48Hours": {
      "email": {
        "subject": "🚀 Subject line",
        "body": "Complete email with steps of program",
        "keyPoints": ["What they'll learn/discover"]
      },
      "sms": "Complete SMS text"
    },
    "reminder24Hours": {
      "email": {
        "subject": "⌛ Subject line",
        "body": "Complete email",
        "sneakPeek": ["Key feature 1", "Key feature 2", "Key feature 3"]
      }
    },
    "reminder1Hour": {
      "email": {
        "subject": "⌛ Subject line",
        "body": "Complete email with 3 VSL insights",
        "essentialInsights": [
          {"insight": "Insight 1", "content": ""},
          {"insight": "Insight 2", "content": ""},
          {"insight": "Insight 3", "content": ""}
        ]
      },
      "sms": "Complete SMS text"
    },
    "reminder10Minutes": {
      "email": {
        "subject": "⏰ Subject line",
        "body": "Complete email",
        "lastMinuteChecklist": ["Quiet environment", "Materials ready", "Questions prepared"]
      },
      "sms": "Complete SMS text"
    },
    "startingNow": {
      "email": {
        "subject": "🚀 Subject line",
        "body": "Complete email with join link"
      }
    }
  }
}
`;

export default salesScriptsPrompt;
