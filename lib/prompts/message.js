/**
 * Million-Dollar Message™ - Master Prompt
 * Core positioning and "Message to Millions" framework
 */

export const messagePrompt = (data) => `
ROLE & STRATEGIC CONTEXT

You are a world-class brand positioning expert and direct-response marketer.
Your job is to synthesize the inputs below and create a Million-Dollar Message — a single, clear, scalable core message that:

- Instantly communicates *who this is for*
- Makes the problem undeniable
- Positions the offer as the obvious solution
- Scales across ads, content, funnels, and sales

This message should feel simple, sharp, emotionally resonant, and commercially powerful — not clever, not fluffy, not generic.

INPUT DATA

Industry / Market: ${data.industry || 'Not specified'}

Who this is for (Ideal Client): ${data.idealClient || 'Not specified'}

What you help them with (Core Capability): ${data.message || 'Not specified'}

The main problem they are facing: ${data.coreProblem || 'Not specified'}

Specific outcomes they want: ${data.outcomes || 'Not specified'}

What makes your approach different: ${data.uniqueAdvantage || 'Not specified'}

Why you do this work (Founder Story / Mission): ${data.story || 'Not specified'}

Proof or client results: ${data.testimonials || 'Not specified'}

Main program or offer: ${data.offerProgram || 'Not specified'}

Price point or price range: ${data.pricing || 'No price yet'}

Primary call-to-action: ${data.callToAction || 'Not specified'}

Brand voice / personality: ${data.brandVoice || 'Not specified'}

Business stage: ${data.businessStage || 'Not specified'}

90-day goal: ${data.goal90Days || 'Not specified'}

TASK

Using the inputs above, create a MILLION-DOLLAR MESSAGE FRAMEWORK with the following sections:

1. The One-Line Million-Dollar Message
A single, clear sentence that answers:
- Who this is for
- What problem it solves
- What outcome it delivers
- Why this approach is different
(This should be usable as a homepage headline or ad hook.)

2. "This Is For You If…" Filter
- 3–5 bullets that clearly qualify the right audience
- Make the wrong people self-disqualify

3. Core Problem Reframe
- How the audience *currently* explains their problem
- Why that explanation is incomplete or misleading
- The deeper truth you help them see

4. The Unique Mechanism / New Way
- Name or clearly define the method, system, or approach
- Explain why it works when other approaches fail
- Position it as the *missing piece*

5. The Outcome Promise (Non-Hype)
- What people can realistically expect if they apply this
- Tangible results without exaggeration or fluff

6. Proof & Credibility Anchors
- How proof, results, experience, or story should be used
- What type of evidence builds trust fastest for this market

7. Objection-Neutralizing Message
- The top 3 objections this audience has
- How the core message should naturally dissolve them

8. Message Angles That Scale
- 5–7 high-leverage angles this message can spin into:
  - Ads
  - Content themes
  - Email hooks
  - Webinar/VSL narratives

9. Call-to-Action Framing
- How the CTA should be positioned to feel obvious and low-resistance
- What emotional state the audience should be in before being asked to act

10. Final "Message to Millions" Summary
- A short paragraph that summarizes the positioning
- Written as if speaking directly to the ideal prospect
- This should sound confident, grounded, and inevitable

IMPORTANT RULES

- Do NOT use generic marketing language
- Do NOT overpromise or use hype
- Do NOT sound like a coach, guru, or consultant unless the brand explicitly is one
- Prioritize clarity > cleverness
- Write as if this message will be scaled with paid ads and real money

If some inputs are missing, make smart, market-aware assumptions — but do not invent unrealistic claims.

Return ONLY valid JSON in this structure:
{
  "millionDollarMessage": {
    "oneLineMessage": "The single, clear headline that answers who, what problem, what outcome, why different",
    "thisIsForYouIf": [
      "Qualifier 1 that resonates with right audience",
      "Qualifier 2",
      "Qualifier 3",
      "Qualifier 4",
      "Qualifier 5"
    ],
    "coreProblemReframe": {
      "howTheyExplainIt": "How the audience currently explains their problem",
      "whyItsIncomplete": "Why that explanation is incomplete or misleading",
      "deeperTruth": "The deeper truth you help them see"
    },
    "uniqueMechanism": {
      "name": "Name of the method, system, or approach",
      "whyItWorks": "Why it works when other approaches fail",
      "missingPiece": "How to position it as the missing piece"
    },
    "outcomePromise": {
      "realisticExpectation": "What people can realistically expect",
      "tangibleResults": ["Result 1", "Result 2", "Result 3"]
    },
    "proofAndCredibility": {
      "howToUseProof": "How proof, results, experience, or story should be used",
      "trustBuildingEvidence": ["Evidence type 1", "Evidence type 2"]
    },
    "objectionNeutralizers": [
      {"objection": "Objection 1", "dissolve": "How the message naturally dissolves it"},
      {"objection": "Objection 2", "dissolve": "How the message naturally dissolves it"},
      {"objection": "Objection 3", "dissolve": "How the message naturally dissolves it"}
    ],
    "messageAngles": {
      "adAngles": ["Ad angle 1", "Ad angle 2"],
      "contentThemes": ["Theme 1", "Theme 2"],
      "emailHooks": ["Email hook 1", "Email hook 2"],
      "webinarNarratives": ["Narrative 1", "Narrative 2"]
    },
    "ctaFraming": {
      "positioning": "How the CTA should be positioned to feel obvious and low-resistance",
      "emotionalState": "What emotional state the audience should be in before being asked to act"
    },
    "messageToMillionsSummary": "A short paragraph summarizing the positioning, written as if speaking directly to the ideal prospect. Confident, grounded, and inevitable."
  }
}
`;

export default messagePrompt;
