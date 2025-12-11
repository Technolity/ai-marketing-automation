/**
 * Funnel Copy Generator
 * Creates Opt-in Headlines, Confirmation Page Script, FAQs, and Funnel Page Copy
 */

export const funnelCopyPrompt = (data) => `
Create comprehensive funnel copy including opt-in headlines, confirmation page script, and FAQs.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== PART 1: OPT-IN PAGE HEADLINES ===
Create 5 compelling headlines for an opt-in page that encourages prospects to download the free ebook/lead magnet.
Each headline should:
- Create curiosity
- Speak to the transformation
- Reference the lead magnet benefit

=== PART 2: CONFIRMATION PAGE VIDEO SCRIPT ===
Write a 225-word video script for a talking head video on the confirmation page (after client books consultation).
Use this framework:

1. OPENING: Warm Welcome
   - Introduce the speaker
   - Thank them for booking the consultation call (use branded call name)
   - Example: "Hey there! [Name] here. Thanks for booking a consultation call with me!"

2. ACKNOWLEDGEMENT AND HUMOR
   - Use appropriate metaphor based on ideal client's profession
   - Example: "Now, I know life gets busy. We've all had those days..."

3. EMPHASIZE IMPORTANCE
   - Highlight why this call matters
   - Mention specific benefit and key points to cover
   - Example: "But this call isn't just another item on your to-do list..."

4. PERSONAL CONNECTION
   - Use an actual social proof example from client data
   - Build trust and show transformation is possible

5. EXPECTATIONS AND PREPARATION
   - Tell them to come prepared with questions
   - Make them feel valued

6. ENCOURAGEMENT WITH HUMOR
   - Light-hearted remark related to client's profession/personality

7. CALL TO ACTION
   - Mark calendar, set alarm, etc.
   - Build anticipation

8. CLOSING: Positive Note
   - "See you soon! Remember, showing up is the first step to your success."

IMPORTANT: 
- NO video directions
- Teleprompter ready
- NO subheadings in final script

=== PART 3: 7 FAQs FOR VSL PAGE ===
Create 7 FAQs that potential clients are likely to ask.
Format: Question followed by Answer (no headers or subheadings)

=== PART 4: STEPS TO SUCCESS SECTION ===
Create Steps to Success for the VSL Sales Page.
For each step use this framework:
- Step Number
- 3-5 word headline
- One sentence description
- One sentence benefit the client experiences

Return ONLY valid JSON in this structure:
{
  "funnelCopy": {
    "optInHeadlines": [
      "Headline 1",
      "Headline 2",
      "Headline 3",
      "Headline 4",
      "Headline 5"
    ],
    "confirmationPageScript": {
      "fullScript": "Complete 225-word teleprompter-ready script",
      "keyPoints": ["Point 1", "Point 2", "Point 3"]
    },
    "faqs": [
      {"question": "Question 1?", "answer": "Answer 1"},
      {"question": "Question 2?", "answer": "Answer 2"},
      {"question": "Question 3?", "answer": "Answer 3"},
      {"question": "Question 4?", "answer": "Answer 4"},
      {"question": "Question 5?", "answer": "Answer 5"},
      {"question": "Question 6?", "answer": "Answer 6"},
      {"question": "Question 7?", "answer": "Answer 7"}
    ],
    "stepsToSuccess": [
      {
        "stepNumber": 1,
        "headline": "3-5 word headline",
        "description": "One sentence description",
        "benefit": "One sentence benefit"
      }
    ],
    "optInPageCopy": {
      "headline": "Main headline",
      "subheadline": "Supporting subheadline",
      "bulletPoints": ["Bullet 1", "Bullet 2", "Bullet 3"],
      "ctaButton": "CTA button text"
    },
    "thankYouPageCopy": {
      "headline": "Thank you headline",
      "message": "Thank you message",
      "nextSteps": "What to expect next"
    }
  }
}
`;

export default funnelCopyPrompt;
