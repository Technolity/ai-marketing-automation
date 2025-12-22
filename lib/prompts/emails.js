/**
 * 18-Email Nurture Sequence - Master Prompt
 * Comprehensive email series to convert leads into clients
 */

export const emailsPrompt = (data) => `
You are an expert email copywriter. Using the VSL content and client inputs below, create a comprehensive 18-email nurture sequence that will encourage leads to schedule a free consultation call.

The sequence follows this structure:
- Emails 1-5: Welcome, Tips, and Value
- Emails 6-10: Recap, Invitation, Success Story, Urgency, FAQ
- Emails 11-15: Final Chances and Extended Window
- Emails 16-18: Last Spots and Closing

INPUT DATA

Business Name: ${data.businessName || 'Your Business'}

Industry / Market: ${data.industry || 'Not specified'}

Who you help (Ideal Client): ${data.idealClient || 'Not specified'}

What you help them with: ${data.message || 'Not specified'}

Primary problem they face: ${data.coreProblem || 'Not specified'}

Outcomes they want: ${data.outcomes || 'Not specified'}

Your unique approach: ${data.uniqueAdvantage || 'Not specified'}

Your story: ${data.story || 'Not specified'}

Client results / testimonials: ${data.testimonials || 'Not specified'}

Main offer / program: ${data.offerProgram || 'Not specified'}

Deliverables: ${data.deliverables || 'Not specified'}

Brand voice: ${data.brandVoice || 'Not specified'}

EMAIL FRAMEWORK

Email 1: Welcome Email
- Welcome them for watching the video training
- Share Tip #1 from the VSL with an action step
- Encourage scheduling a free consultation call

Email 2: Follow-up with Second Tip
- Share Tip #2 from the VSL with an action step
- Remind them about the consultation call

Email 3: Follow-up with Third Tip
- Share Tip #3 from the VSL with an action step
- CTA to schedule consultation

Email 4: Summary of Your Actionable Tips
- Quick recap of all three tips
- Encourage implementation and consultation

Email 5: Your Steps to Success
- Recap the three tips
- Outline the program steps (Step 1-4+)
- Strong CTA to schedule

Email 6: Your Last Chance to Review Crucial Tips
- Final reminder of tips and steps
- Emphasize this info won't be repeated

Email 7: Join Us and Transform Your Journey
- Invitation to join the program
- 3 benefits of free consultation (Clarity, Identify Obstacles, Strategies)

Email 8: Success Story
- Share a powerful client testimonial
- Before/after transformation
- CTA to schedule

Email 9: Last Chance (48 Hours)
- Urgency: 48 hours left
- Repeat the 3 consultation benefits
- Strong CTA

Email 10: Got Questions? FAQ
- Address 5 FAQs from the VSL content
- Reminder consultation is still available

Email 11: Last Chance - Final Notice (Tomorrow)
- Offer ends tomorrow
- Urgent CTA

Email 12: Final Hours Left
- Only a few hours remaining
- Quick benefits list

Email 13: Final Hour Alert
- One hour left
- Action-focused CTA

Email 14: Final Minutes
- Last few minutes
- Don't miss out messaging

Email 15: Booking Window Extended
- Good news: extension granted
- Hurry while spots last

Email 16: Surprise! Additional Spots Open
- More spots opened due to demand
- Limited availability

Email 17: Final Day to Book
- Final day messaging
- Spots filling fast

Email 18: Last Spot Remaining
- URGENT: One spot left
- This is the final chance

Important: Use professional emojis throughout. Write conversationally. Use the contact merge field {{contact.first_name}} for personalization. Include [Schedule Link] placeholders for CTAs.

Return ONLY valid JSON in this structure:
{
  "emailSequence": {
    "emails": [
      {
        "emailNumber": 1,
        "dayToSend": "Day 0 (Immediately after opt-in)",
        "subjectLine": "Welcome! Your Journey to Success Begins Here",
        "previewText": "First line preview for inbox",
        "body": "Full email body with proper formatting, personalization {{contact.first_name}}, and [Schedule Link] CTA placeholder"
      },
      {
        "emailNumber": 2,
        "dayToSend": "Day 1",
        "subjectLine": "Here's Your Next Tip to Achieve Success",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 3,
        "dayToSend": "Day 2",
        "subjectLine": "Your Next Step Towards Achieving Your Goals",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 4,
        "dayToSend": "Day 3",
        "subjectLine": "Quick Recap: Your First Three Tips for Success",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 5,
        "dayToSend": "Day 4",
        "subjectLine": "Your Roadmap to Success in [Industry]",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 6,
        "dayToSend": "Day 5",
        "subjectLine": "Last Chance: Don't Miss Out on These Crucial Tips!",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 7,
        "dayToSend": "Day 6",
        "subjectLine": "Your Invitation to Transform Your Journey",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 8,
        "dayToSend": "Day 7",
        "subjectLine": "Success Story: Achieve Your Goals with Our Proven Strategies",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 9,
        "dayToSend": "Day 8",
        "subjectLine": "🚨 URGENT: Last Chance for Your Free Consultation Call!",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 10,
        "dayToSend": "Day 9",
        "subjectLine": "Got Questions? Here Are the Answers You Need!",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 11,
        "dayToSend": "Day 10",
        "subjectLine": "FINAL NOTICE: Book Your Free Consultation Call by Tomorrow!",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 12,
        "dayToSend": "Day 11 (Morning)",
        "subjectLine": "⏰ Urgent: Final Hours to Book Your Free Consultation Call!",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 13,
        "dayToSend": "Day 11 (Afternoon)",
        "subjectLine": "⌛ Final Hour Alert: Book Your Free Consultation Call Now!",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 14,
        "dayToSend": "Day 11 (Evening)",
        "subjectLine": "🔴 Last Chance: Book Your Free Consultation Call Now!",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 15,
        "dayToSend": "Day 12",
        "subjectLine": "🎉 Great News! Booking Window Extended for Your Free Consultation Call",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 16,
        "dayToSend": "Day 13",
        "subjectLine": "✨ Surprise! More Spots Opened for Your Free Consultation Call",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 17,
        "dayToSend": "Day 14",
        "subjectLine": "📅 Final Day! Book Your Free Consultation Call Today",
        "previewText": "Preview text",
        "body": "Full email body"
      },
      {
        "emailNumber": 18,
        "dayToSend": "Day 15",
        "subjectLine": "🚨 URGENT: Last Spot for Free Consultation Call – Act Now!",
        "previewText": "Preview text",
        "body": "Full email body"
      }
    ],
    "tips": {
      "tip1": {
        "title": "Tip #1 Title",
        "content": "Tip content",
        "actionStep": "Action step"
      },
      "tip2": {
        "title": "Tip #2 Title",
        "content": "Tip content",
        "actionStep": "Action step"
      },
      "tip3": {
        "title": "Tip #3 Title",
        "content": "Tip content",
        "actionStep": "Action step"
      }
    },
    "stepsToSuccess": [
      {"step": 1, "title": "Step title", "description": "Step description"},
      {"step": 2, "title": "Step title", "description": "Step description"},
      {"step": 3, "title": "Step title", "description": "Step description"},
      {"step": 4, "title": "Step title", "description": "Step description"}
    ],
    "faqs": [
      {"question": "FAQ 1", "answer": "Answer 1"},
      {"question": "FAQ 2", "answer": "Answer 2"},
      {"question": "FAQ 3", "answer": "Answer 3"},
      {"question": "FAQ 4", "answer": "Answer 4"},
      {"question": "FAQ 5", "answer": "Answer 5"}
    ],
    "successStory": {
      "clientName": "Client name or anonymized",
      "challenge": "What they struggled with",
      "transformation": "What they achieved",
      "quote": "Testimonial quote"
    }
  }
}
`;

export default emailsPrompt;
