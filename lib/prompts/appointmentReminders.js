/**
 * Appointment Reminders - Email Show-up Sequence
 * Strategic touchpoints to ensure leads show up for their calls
 */

export const appointmentRemindersPrompt = (data) => `
The client has booked a free consultation. The goal is to create a reminder sequence to make sure they show up to the free consultation.

The sequence includes several email reminders:
- Confirmation Email: Sent immediately upon booking
- 48 Hours Before: Reminder with program steps
- 24 Hours Before: Reminder with success stories
- 1 Hour Before: Key insights reminder
- 10 Minutes Before: Final checklist
- Starting Now: Join the session

The purpose of these emails is to:
- Remind them to show up
- Give them content that will inspire them to show up
- Share success stories that inspire them to show up
- Remind them what's going to be accomplished on the free consultation
- Share stats/credentials to build credibility

INPUT DATA

Brand/Service Name: ${data.businessName || 'Your Business'}

Industry: ${data.industry || 'Not specified'}

Service/Consultation Name: ${data.offerProgram || 'Free Strategy Session'}

Main benefit or goal: ${data.outcomes || 'Transform your results'}

Unique value proposition: ${data.uniqueAdvantage || 'Not specified'}

Key features of the service: ${data.deliverables || 'Not specified'}

Client testimonials/success stories: ${data.testimonials || 'Not specified'}

Your name/team name: ${data.businessName || 'The Team'}

Video training link placeholder: [Video Link]

Booking link placeholder: [Booking Link]

3 Key Tips from VSL:
- Tip 1: Based on your unique approach
- Tip 2: Based on your method
- Tip 3: Based on outcomes

Return ONLY valid JSON in this structure:
{
  "appointmentReminders": {
    "confirmationEmail": {
      "timing": "Immediately upon booking",
      "subject": "🌟 Your Exclusive Appointment Confirmation - [Brand Name]",
      "body": "Full email body with personalization [Client's Name], brand placeholders [Brand/Service Name], [Service/Consultation Name], welcome message, why this matters section explaining unique value, preparation instructions with [Video Link] if applicable, what they'll discover (3 key aspects), next steps section, signature with [Your Team Name]"
    },
    "reminder48Hours": {
      "timing": "48 hours before appointment",
      "subject": "🚀 Just 48 Hours to Go - Prepare for Your [Service Name]!",
      "body": "Full email body with reminder, What Awaits You section (3 key features), Exciting Opportunities section, main goal reminder, signature"
    },
    "reminder24Hours": {
      "timing": "24 hours before appointment",
      "subject": "⌛ Countdown Begins: 24 Hours to Your [Service Name]!",
      "body": "Full email body with A Sneak Peek section (3 key things they'll discover/learn/explore), Get Ready section with main goal and preparation tips, signature"
    },
    "reminder1Hour": {
      "timing": "1 hour before appointment",
      "subject": "⌛ One Hour Left: Key Insights Await in Your [Service Name]!",
      "body": "Full email body with 3 Essential Insights from the video training (Content Tip 1, 2, 3 - brief recap of significant points), Last-Minute Preparations checklist (quiet setting, questions ready, open-minded), Join Your Session Here with [Booking Link], signature"
    },
    "reminder10Minutes": {
      "timing": "10 minutes before appointment",
      "subject": "⏰ [Brand Name]: Your Session Begins in 10 Minutes - Don't Miss Out!",
      "body": "Full email body with Quick Recap of What's Ahead (3 Key Features/Benefits), Last-Minute Checklist (comfortable environment, materials ready, questions noted), Join Us Here with [Session Link], signature"
    },
    "startingNow": {
      "timing": "At appointment time",
      "subject": "🚀 It's Time: Your [Service Name] with [Brand Name]",
      "body": "Short, urgent email. The moment has arrived, service is starting now, main benefits reminder, Join Us Now with [Session Link], excited to get started signature"
    },
    "contentTips": {
      "tip1": {
        "title": "Content Tip 1 Title",
        "briefRecap": "A brief recap of a significant point or tip from the video - unique approach, valuable strategy, or insightful observation"
      },
      "tip2": {
        "title": "Content Tip 2 Title",
        "briefRecap": "Another critical aspect or piece of advice that adds substantial value or offers a new perspective"
      },
      "tip3": {
        "title": "Content Tip 3 Title",
        "briefRecap": "A third important element - could focus on common misconception, innovative solution, or practical advice"
      }
    },
    "keyFeatures": [
      "Key aspect or feature of the service 1",
      "Key aspect or feature of the service 2",
      "Key aspect or feature of the service 3"
    ],
    "preparationSteps": [
      "Watch the video training in full",
      "Think about your biggest challenge",
      "Prepare questions you want to ask"
    ]
  }
}
`;

export default appointmentRemindersPrompt;
