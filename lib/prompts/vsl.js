/**
 * Video Sales Letter (VSL) Script Generator
 * Based on Enhanced VSL Framework from Client Branding Questionnaire
 */

export const vslPrompt = (data) => `
Create a comprehensive Video Sales Letter (VSL) script that will be used in a marketing funnel.
The script should be teleprompter-ready with NO video directions, NO headings, and NO subheadings.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Use this Enhanced VSL Framework to create the script:

=== SECTION 1: INTRODUCTION ===
- Pattern Interrupt: Start with a unique, attention-grabbing hook that references a major pain point
- Character Introduction: Introduce the narrator/creator with personality
- Problem Statement: State the problem or challenge the target audience faces
- Emotional Connection: Add a personal story or relatable scenario

=== SECTION 2: SOLUTION PRESENTATION ===
- Benefit Lead: Highlight the primary benefits of the unique solution
- Unique Solution Introduction: Explain why it works (trend, problem-solving, urgency)
- Benefits Highlight: Detail how these benefits impact personal and professional life
- Problem Agitation: Emphasize the depth and impact of the problem to make solution more compelling

=== SECTION 3: PROOF AND CREDIBILITY ===
- Nightmare Story & Breakthrough: Share a story of a major problem and finding the solution
- Client Testimonials/Case Studies: Share success stories with before-and-after scenarios
- Data Points: Include impressive statistics or achievements
- Authority and Expert Testimonials: Add endorsements from industry experts

=== SECTION 4: PRODUCT/SERVICE FEATURES ===
- Detailed Description: Elaborate on the product/service features and processes
- Demonstration: Show the product/service in action if possible
- Psychological Triggers: Introduce elements like scarcity, exclusivity, and social proof

=== SECTION 5: EDUCATION (MOST IMPORTANT - ADD VALUE) ===
Educate the customer and give value through 3 tips:
- Tip #1: [Tip from data] with an action step
- Tip #2: [Tip from data] with an action step
- Tip #3: [Tip from data] with an action step

=== SECTION 6: ENGAGEMENT AND INTERACTION ===
- Direct Engagement: Use interactive elements tailored to audience
- Urgency Creation: Introduce time-sensitive offers or limited availability
- Clear, Compelling Offer: Present a strong, irresistible offer with bonuses
- Steps to Success: List the program steps (Step 1, Step 2, Step 3, Step 4)

=== SECTION 7: CALL TO ACTION (CTA) ===
- Recap & Primary CTA: Summarize key points and state the main action (book free consultation)
- Offer Features & Price: Detail the features and price (if any)
- Bonuses & Secondary CTA: Offer bonuses and alternative action for hesitant viewers
- Guarantee & Risk Reversal: Include a strong guarantee to reduce perceived risk

=== SECTION 8: CLOSING ARGUMENT ===
- The Close: Conclude emphasizing urgency and importance of taking action now
- Create a powerful branded name for the Free Consultation
- Address Customer Objections: Tackle potential objections with solutions
- Reiteration of Value: Emphasize ongoing support and future benefits

=== SECTION 9: POST-CTA ENGAGEMENT ===
- Follow-Up Strategy: Describe the process after CTA is followed (booking, consultation steps)
- Final Persuasion: Reiterate the unique value proposition and long-term benefits
- Close hard on Free Consultation
- Close by handling objections
- Close again with scarcity
- Close again with inspiration about community/changing the world/better life
- Speed the client up with action words

Return ONLY valid JSON in this structure:
{
  "vslScript": {
    "fullScript": "The complete teleprompter-ready VSL script without any headings or directions",
    "estimatedLength": "Estimated video length in minutes",
    "keyHooks": ["Hook 1", "Hook 2", "Hook 3"],
    "emotionalTriggers": ["Trigger 1", "Trigger 2"],
    "callToActionName": "Branded name for the free consultation",
    "objectionHandlers": [
      {"objection": "Time", "response": "Response to time objection"},
      {"objection": "Money", "response": "Response to money objection"},
      {"objection": "Not the right time", "response": "Response"}
    ],
    "urgencyElements": ["Urgency 1", "Urgency 2"],
    "socialProofMentions": ["Proof 1", "Proof 2"]
  }
}
`;

export default vslPrompt;
