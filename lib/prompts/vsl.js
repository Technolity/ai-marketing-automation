/**
 * Video Sales Letter (VSL) Script - Enhanced Framework
 * Complete VSL script based on unique offer
 */

export const vslPrompt = (data) => `
We are creating a Video Sales Letter (VSL) that will be used in a marketing funnel. Viewers have been promised three actionable tips to solve their most difficult challenge.

Using the information provided from the client inputs, populate the framework below and turn it into a full-length VSL script. The script must:

- Be teleprompter-ready — natural, conversational, and persuasive
- Seamlessly incorporate the audience, problem, outcomes, unique approach, founder story, proof, program details, and CTA
- Include the three tips promised to the audience as key sections of the message
- Build trust, credibility, and urgency while addressing common objections
- Avoid headings, subheadings, bullet points, or video directions — the final output should read like one flowing script

Important: The script should sound authentic, engaging, and aligned with the brand voice, keeping the audience hooked from start to finish. Make sure every element of the input data is woven naturally into the narrative so it feels specific and highly relevant to the ideal client.

INPUT DATA

Industry / Market: ${data.industry || 'Not specified'}

Who you help (Ideal Client): ${data.idealClient || 'Not specified'}

What you help them with: ${data.message || 'Not specified'}

Primary problem they face: ${data.coreProblem || 'Not specified'}

Outcomes they want: ${data.outcomes || 'Not specified'}

Your unique approach / method: ${data.uniqueAdvantage || 'Not specified'}

Your story / mission: ${data.story || 'Not specified'}

Client results / proof: ${data.testimonials || 'Not specified'}

Main offer / program: ${data.offerProgram || 'Not specified'}

Deliverables: ${data.deliverables || 'Not specified'}

Pricing: ${data.pricing || 'Not specified'}

Call-to-action: ${data.callToAction || 'Book a free consultation'}

Brand voice: ${data.brandVoice || 'Not specified'}

ENHANCED VSL FRAMEWORK

1. INTRODUCTION
- Pattern Interrupt: Start with a unique, attention-grabbing introduction that makes reference to a pain point
- Character Introduction: Introduce the avatar narrator or character with a humorous or dramatic angle
- Problem Statement: State the problem or challenge the target audience faces
- Emotional Connection: Add a personal story or relatable scenario

2. SOLUTION PRESENTATION
- Benefit Lead: Highlight the primary benefits of your unique solution
- Unique Solution: Introduce your solution, explaining why it works (trend, problem-solving, urgency)
- Benefits Highlight: Detail how these benefits impact the client's personal and professional life
- Problem Agitation: Emphasize the depth and impact of the problem to make the solution more compelling

3. PROOF AND CREDIBILITY
- Nightmare Story & Breakthrough: Share a story of a major problem and the moment of finding your solution
- Client Testimonials/Case Studies: Share success stories with before-and-after scenarios
- Data Points: Include impressive statistics or achievements
- Authority and Expert Testimonials: Add endorsements from industry experts or notable figures

4. PRODUCT/SERVICE FEATURES
- Detailed Description: Elaborate on the product/service features and processes
- Demonstration: Show the product/service in action if possible
- Psychological Triggers: Introduce elements like scarcity, exclusivity, and social proof

5. EDUCATION (THIS IS THE MOST IMPORTANT SECTION - ADD VALUE)
Educate the customer and give value through 3 tips:
- Tip #1: [First actionable tip] with an action step
- Tip #2: [Second actionable tip] with an action step
- Tip #3: [Third actionable tip] with an action step

6. ENGAGEMENT AND INTERACTION
- Direct Engagement: Use interactive elements tailored to your audience
- Urgency Creation: Introduce time-sensitive offers or limited availability
- Clear, Compelling Offer: Present a strong, irresistible offer, including bonuses or special pricing
- Steps to Success: List the program steps (Step 1, Step 2, Step 3, Step 4)

7. CALL TO ACTION (CTA)
- Recap & Primary CTA: Summarize key points and clearly state the main action (e.g., book a free consultation)
- Offer Features & Price: Detail the features of your offer and its price (if any)
- Bonuses & Secondary CTA: Offer bonuses and an alternative action for hesitant viewers
- Guarantee & Risk Reversal: Include a strong guarantee to reduce perceived risk

8. CLOSING ARGUMENT
- The Close: Conclude the VSL, emphasizing the urgency and importance of taking action now
- Create a powerful branded name for the Free Consultation
- Address Customer Objections: Tackle potential objections with your solutions
- Reiteration of Value: Emphasize ongoing support and future benefits

9. POST-CTA ENGAGEMENT
- Follow-Up Strategy: Describe the process after the CTA is followed (booking, consultation steps)
- Final Persuasion: Reiterate the unique value proposition and long-term benefits
- Close hard on the Free Consultation
- Close by handling objections
- Close again with scarcity
- Close again with inspiration about belonging to a community or changing the world or having a better life
- Speed the client up with words that get them to take action now

Return ONLY valid JSON in this structure:
{
  "vslScript": {
    "fullScript": "The complete teleprompter-ready VSL script. This should be 2000-3000 words, written as one flowing narrative without any headings, bullet points, or stage directions. Include all sections seamlessly: pattern interrupt hook, personal story, problem agitation, the 3 tips with action steps, proof/testimonials, offer presentation, bonuses, objection handling, multiple closes with urgency/scarcity/inspiration, and final CTA.",
    "estimatedLength": "Estimated video length (e.g., 15-20 minutes)",
    "keyHooks": ["Attention-grabbing hook 1", "Hook 2", "Hook 3"],
    "threeTips": [
      {
        "tipTitle": "Tip #1 Title",
        "tipContent": "What the tip teaches",
        "actionStep": "Specific action they can take"
      },
      {
        "tipTitle": "Tip #2 Title",
        "tipContent": "What the tip teaches",
        "actionStep": "Specific action they can take"
      },
      {
        "tipTitle": "Tip #3 Title",
        "tipContent": "What the tip teaches",
        "actionStep": "Specific action they can take"
      }
    ],
    "stepsToSuccess": [
      {"step": 1, "title": "Step 1 Title", "description": "What happens in step 1"},
      {"step": 2, "title": "Step 2 Title", "description": "What happens in step 2"},
      {"step": 3, "title": "Step 3 Title", "description": "What happens in step 3"},
      {"step": 4, "title": "Step 4 Title", "description": "What happens in step 4"}
    ],
    "callToActionName": "Branded name for the free consultation (e.g., 'Breakthrough Strategy Session')",
    "emotionalTriggers": ["Trigger 1", "Trigger 2", "Trigger 3"],
    "objectionHandlers": [
      {"objection": "I don't have time", "response": "Response to time objection"},
      {"objection": "I can't afford it", "response": "Response to money objection"},
      {"objection": "It's not the right time", "response": "Response to timing objection"},
      {"objection": "I need to think about it", "response": "Response to hesitation"}
    ],
    "urgencyElements": ["Urgency element 1", "Urgency element 2"],
    "socialProofMentions": ["Social proof 1", "Social proof 2", "Social proof 3"],
    "guarantee": "Description of guarantee or risk reversal"
  }
}
`;

export default vslPrompt;
