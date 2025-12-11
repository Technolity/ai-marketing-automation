/**
 * Email Sequence Generator
 * Creates 18 Nudge Emails + Lead Magnet Fulfillment Emails
 */

export const emailsPrompt = (data) => `
Create a comprehensive email sequence to encourage clients to book a consultation call.
Also include lead magnet fulfillment emails.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== PART 1: LEAD MAGNET FULFILLMENT EMAILS ===

EMAIL A: Congratulations/Fulfillment Email
- Subject Line: Powerful and relevant with 🎉 emoji
- Body: "Hi {{contact.first_name}}" + congratulations + one benefit + encourage immediate download
- Include download link placeholder: [Link]
- CTA for consultation call with one benefit
- P.S.: Reminder to download with link

SMS B: Spam Folder Reminder
- Let them know email was sent
- Mention it's probably in Spam or Promotions folder
- Ask them to find it and move to inbox
- Keep it friendly and humorous

EMAIL C: Forgot to Download (sent next day if not downloaded)
- Subject Line: "Forgot Something?"
- Reminder they ordered the lead magnet
- Create urgency with benefit
- Download link
- Sign off

=== PART 2: 18 NUDGE EMAIL SEQUENCE ===

EMAILS 1-5 (Value-focused, no urgency yet):

Email 1: Welcome Email
- Subject: "Welcome! Your Journey to Success Begins Here"
- Thank for watching video training
- Link to rewatch video
- Share Tip #1 with expansion
- CTA to schedule consultation

Email 2: Second Tip
- Subject: "Here's Your Next Tip to Achieve Success"
- Share Tip #2 with expansion
- Remind about consistency
- CTA to schedule

Email 3: Third Tip
- Subject: "Your Next Step Towards Achieving Your Goals"
- Share Tip #3 with expansion
- CTA to schedule

Email 4: Summary of Tips
- Subject: "Quick Recap: Your First Three Tips for Success"
- Brief recap of all 3 tips
- CTA to schedule

Email 5: Steps to Success
- Subject: "Your Roadmap to Success in [Field]"
- Recap tips briefly
- List all Steps to Success (Step 1-8 as applicable)
- Each step: Title + 1-2 sentence expansion
- CTA to schedule

EMAILS 6-10 (Building urgency):

Email 6: Last Chance to Review
- Subject: "Last Chance: Don't Miss Out on These Crucial Tips and Steps!"
- Full recap of tips AND steps
- Note: This info won't be repeated
- CTA to schedule

Email 7: Join Us and Transform
- Subject: "Your Invitation to Transform Your Journey"
- Why schedule the call: Gain Clarity, Identify Obstacles, Discover Strategies
- CTA to schedule

Email 8: Success Story
- Subject: "Success Story: Achieve Your Goals"
- Share one powerful testimonial
- Before/after scenario
- CTA to schedule

Email 9: 48 Hours Left
- Subject: "URGENT: Last Chance for Your Free Consultation Call!"
- 48 hours warning
- List benefits of the call
- Strong CTA

Email 10: FAQs
- Subject: "Got Questions? Here Are the Answers You Need!"
- List 5 FAQs with answers
- CTA to schedule

EMAILS 11-15 (High urgency, final day):

Email 11: Book by Tomorrow
- Subject: "FINAL NOTICE: Book Your Free Consultation Call by Tomorrow!"
- Final opportunity messaging
- Strong CTA

Email 12: Final Hours
- Subject: "Urgent: Final Hours to Book Your Free Consultation Call!"
- Clock is ticking
- Quick bullet benefits
- CTA

Email 13: Final Hour
- Subject: "Final Hour Alert: Book Your Free Consultation Call Now!"
- One hour warning
- CTA

Email 14: Final Minutes
- Subject: "Last Chance: Book Your Free Consultation Call Now!"
- Final few minutes
- CTA

Email 15: Extension Announcement
- Subject: "Great News! Booking Window Extended"
- Extended due to popular demand
- CTA

EMAILS 16-18 (Last push):

Email 16: Surprise Additional Spots
- Subject: "Surprise! More Spots Opened"
- Additional spots available
- Limited
- CTA

Email 17: Final Day
- Subject: "Final Day! Book Today"
- Only few spots left
- CTA

Email 18: Last Spot
- Subject: "URGENT: Last Spot - Act Now!"
- Only ONE spot remaining
- Final CTA

Return ONLY valid JSON in this structure:
{
  "emailSequence": {
    "fulfillmentEmails": {
      "congratsEmail": {"subjectLine": "", "body": "", "psLine": ""},
      "smsReminder": {"body": ""},
      "forgotEmail": {"subjectLine": "", "body": ""}
    },
    "nudgeEmails": [
      {
        "emailNumber": 1,
        "dayToSend": "Immediately",
        "subjectLine": "Subject line",
        "body": "Full email body with {{contact.first_name}} placeholder"
      }
    ]
  }
}
`;

export default emailsPrompt;
