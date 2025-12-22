/**
 * Sales Script - Master Prompt
 * High-converting scripts for enrollment calls and sales meetings
 */

export const salesScriptsPrompt = (data) => `
ROLE & STRATEGIC CONTEXT

You are a top-tier sales coach. Your task is to create a personalized, high-converting sales call script for a client based on their business, offer, and goals. The script should follow the proven structure of a successful sales call: building rapport, uncovering the client's #1 goal and challenges, presenting a solution, showing value, and guiding to a decision.

Instructions:
1. Use the information provided about the client's business, ideal customer, offer, pricing, and goals to create the script.
2. Make the script conversational, natural, and teleprompter-ready for a sales rep.
3. Include discovery questions, probing for deeper understanding, and checkpoints to confirm understanding.
4. Show how the client's product/service solves the prospect's #1 challenge and helps achieve their main goal.
5. Include a clear transition to presenting the offer, pricing, and bonuses (if any).
6. Maintain persuasive structure without using headings, subheadings, or stage directions in the final script.

INPUT DATA

Business Name: ${data.businessName || 'Your Business'}

Industry / Market: ${data.industry || 'Not specified'}

Who you help (Ideal Client): ${data.idealClient || 'Not specified'}

What you help them with: ${data.message || 'Not specified'}

Primary problem they face: ${data.coreProblem || 'Not specified'}

Outcomes they want: ${data.outcomes || 'Not specified'}

Your unique approach: ${data.uniqueAdvantage || 'Not specified'}

Main offer / program: ${data.offerProgram || 'Not specified'}

Deliverables: ${data.deliverables || 'Not specified'}

Pricing: ${data.pricing || 'Not specified'}

Brand voice: ${data.brandVoice || 'Not specified'}

SALES SCRIPT STRUCTURE

1. Call Introduction & Permission
- Greeting and recording disclosure
- Share call objectives (clarify #1 goal, identify biggest challenge, map out plan)
- Get permission to proceed

2. Discovery Questions
- What inspired them to explore this solution today?
- What's their #1 goal for the next 90 days?
- Probes: Why is this goal important? What would achieving this change? Tell me more about that.

Business / Context Questions:
- Tell me about your business
- Products/Services & Price Points
- Target market / ideal client
- Delivery method / fulfillment
- Current revenue / financial status

If new business:
- Where are you in getting started?
- Planned product/service

3. Challenges & Commitment
- What's the main obstacle preventing them from achieving their goal?
- Probes: How long have you been facing this challenge? What is this costing you?
- How committed are they to achieving this goal? (1-10)
- Questions to raise commitment to 10

4. Solution Presentation
- Recap: #1 goal, biggest challenge, commitment level
- Introduce the offer/program
- Present solution steps that relate to their specific goal

5. Investment & Bonuses
- Present the investment/pricing
- List bonuses for taking action today
- Ask if they're ready to take the step

6. Client Agreement / Next Steps
- Confirm understanding of deliverables, commitments, expectations
- Confirm next steps / schedule / onboarding process

Return ONLY valid JSON in this structure:
{
  "salesScript": {
    "callIntroduction": {
      "greeting": "Natural greeting with recording disclosure",
      "callObjectives": "Statement of what you'll accomplish on the call",
      "permissionQuestion": "Question to get permission to proceed"
    },
    "discoveryQuestions": {
      "openingQuestion": "What inspired them to explore this solution",
      "goalQuestion": "Their #1 goal question",
      "goalProbes": ["Probe 1", "Probe 2", "Probe 3"],
      "businessQuestions": [
        "Tell me about your business",
        "Products/Services & Price Points",
        "Target market question",
        "Delivery method question",
        "Current revenue question"
      ],
      "newBusinessQuestions": [
        "Where are you in getting started?",
        "Planned product/service?"
      ]
    },
    "challengesAndCommitment": {
      "obstacleQuestion": "Main obstacle question",
      "probes": ["How long have you faced this?", "What is this costing you?"],
      "commitmentQuestion": "How committed are you (1-10)?",
      "commitmentRaisers": ["What would it take to get you to a 10?"]
    },
    "solutionPresentation": {
      "recap": "Recap statement template",
      "transitionStatement": "Let me show you how we can help",
      "solutionSteps": [
        {"step": 1, "feature": "Core Feature 1", "benefit": "How it relates to their goal"},
        {"step": 2, "feature": "Core Feature 2", "benefit": "How it relates to their goal"},
        {"step": 3, "feature": "Core Feature 3", "benefit": "How it relates to their goal"},
        {"step": 4, "feature": "Core Feature 4", "benefit": "How it relates to their goal"}
      ],
      "confirmationQuestion": "Do you see how these steps help you achieve your goal?"
    },
    "investmentAndBonuses": {
      "investmentStatement": "The investment for this program is [Price/Payment Terms]",
      "bonuses": ["Bonus 1", "Bonus 2", "Bonus 3"],
      "closingQuestion": "Are you ready to take this step and achieve your goal?"
    },
    "clientAgreement": {
      "confirmDeliverables": "Confirm understanding of what they're getting",
      "confirmCommitments": "Confirm their commitments and expectations",
      "nextSteps": "Schedule/Onboarding process details"
    },
    "fullScript": "The complete sales script written as one flowing, natural conversation. Ready to be used as-is on a sales call. Include all sections seamlessly integrated. This should be 800-1200 words."
  }
}
`;

export default salesScriptsPrompt;
