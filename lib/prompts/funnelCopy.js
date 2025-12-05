/**
 * Funnel Copy Generator
 * Opt-in headlines, Confirmation page, Steps to Success, Testimonials, FAQs, Bio
 */

export const funnelCopyPrompt = (data) => `
Create complete funnel copy including all required elements for the marketing funnel.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

===== OPT-IN PAGE HEADLINES =====
Create 5 compelling headlines for the opt-in page that encourages prospects to download the free ebook/lead magnet.

===== CONFIRMATION PAGE VIDEO SCRIPT =====
Write a 225-word video script for a talking head. This will be inserted into the confirmation page when a client has booked a consultation call.

Framework:
1. **Opening: Warm Welcome** - Introduce speaker and offer thanks for booking
   "Hey there! [Your Name] here. Thanks for booking a consultation call with me. I'm genuinely excited to connect with you!"

2. **Acknowledgement and Humor** - Use appropriate metaphor based on ideal client
   "Now, I know life gets busy. We've all had those days where we plan to be on time and end up juggling more than a circus clown."

3. **Emphasize Importance** - Why this call matters
   "But this call isn't just another item on your to-do list. It's a pivotal step towards [specific benefit]."

4. **Personal Connection** - Use actual social proof example

5. **Expectations and Preparation** - Come prepared with questions

6. **Encouragement with Humor** - Light-hearted remark

7. **Call to Action** - Mark your calendar

8. **Closing: Positive Note** - "See you soon! Remember, showing up is the first step to your success."

===== STEPS TO SUCCESS =====
For each step in the program, use this framework:
Step Number. 3-5 word headline. One sentence description. One sentence highlighting client benefit.

===== TESTIMONIALS =====
For each client success story, create a brief testimonial using ONLY the information provided:
Name of Client. Name of Business if provided. Two sentence endorsement.

===== APPLICATION QUESTIONS =====
Rewrite the application/intake questions so they're professional and usable by a survey form.

===== BIO =====
Create a 200-word marketable bio based on the client information.

===== FAQs =====
Create 7 FAQs that a potential client is likely to ask.
Format: Question followed by Answer. No headings or subheadings.

Return ONLY valid JSON in this exact structure:
{
  "funnelCopy": {
    "optInHeadlines": [
      "Headline 1 - compelling and benefit-focused",
      "Headline 2",
      "Headline 3",
      "Headline 4",
      "Headline 5"
    ],
    "confirmationPageScript": {
      "warmWelcome": "Opening greeting paragraph",
      "acknowledgementAndHumor": "Relatable metaphor paragraph",
      "emphasizeImportance": "Why this call matters paragraph",
      "personalConnection": "Social proof/success story reference",
      "expectations": "Preparation paragraph",
      "encouragementWithHumor": "Light-hearted remark",
      "callToAction": "Mark calendar instruction",
      "closing": "Positive send-off",
      "fullScript": "Complete 225-word teleprompter-ready script"
    },
    "stepsToSuccess": [
      {
        "stepNumber": 1,
        "headline": "3-5 word headline",
        "description": "One sentence description",
        "clientBenefit": "One sentence benefit"
      }
    ],
    "testimonials": [
      {
        "clientName": "Name",
        "businessName": "Business if provided",
        "endorsement": "Two sentence endorsement"
      }
    ],
    "applicationQuestions": [
      {
        "questionNumber": 1,
        "professionalQuestion": "Professional survey question"
      }
    ],
    "bio": "Complete 200-word marketable bio",
    "faqs": [
      {
        "question": "FAQ question",
        "answer": "Comprehensive answer"
      }
    ]
  }
}
`;

export default funnelCopyPrompt;
