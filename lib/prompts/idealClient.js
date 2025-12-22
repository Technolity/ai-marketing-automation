/**
 * Ideal Client Profile (ICP) - Master Prompt
 * Deep dive into primary audience, demographics, and psychographics
 */

export const idealClientPrompt = (data) => `
ROLE & CONTEXT

You are a senior brand strategist and direct-response marketer.
Your job is to analyze the inputs below and generate a deep Ideal Client Profile (ICP) that can be used for ads, landing pages, offers, sales scripts, and content.

The ICP must go beyond surface-level demographics and clearly articulate:
- What this audience *thinks*
- What they *fear*
- What they *want*
- What makes them *buy*
- What makes them *hesitate*

INPUT DATA

Industry / Market: ${data.industry || 'Not specified'}

Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}

What the business helps them with (Core Message): ${data.message || 'Not specified'}

Primary problem the audience is facing: ${data.coreProblem || 'Not specified'}

Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}

Unique advantage or differentiation: ${data.uniqueAdvantage || 'Not specified'}

Founder's mission or personal story: ${data.story || 'Not specified'}

Proof points or client results: ${data.testimonials || 'Not specified'}

Current offer or program: ${data.offerProgram || 'Not specified'}

Price point or pricing range: ${data.pricing || 'No price yet'}

Current business stage: ${data.businessStage || 'Not specified'}

Primary CTA the business wants the audience to take: ${data.callToAction || 'Not specified'}

Main acquisition channels: ${data.platforms || 'Not specified'}

Brand voice or personality: ${data.brandVoice || 'Not specified'}

90-day business goal: ${data.goal90Days || 'Not specified'}

TASK

Using the inputs above, create a DEEP IDEAL CLIENT PROFILE with the following sections:

1. Core Audience Snapshot
- Who this person is in one clear sentence
- What stage of life or business they are in
- Why *now* is the moment they're looking for a solution

2. Demographics (only where relevant)
- Age range
- Gender (if applicable)
- Location (if implied)
- Income or business revenue range
- Job title or role
(Only include what actually matters for marketing.)

3. Psychographics (THIS IS THE MOST IMPORTANT SECTION)
- What they are frustrated about right now
- What keeps them stuck or overwhelmed
- What they secretly worry might never change
- What success looks like *in their own words*
- What they're tired of trying or hearing

4. Core Pains & Problems
- The surface problem they complain about
- The deeper, emotional problem underneath
- The real cost of *not* solving this problem

5. Desired Outcomes & Motivations
- Practical results they want
- Emotional outcomes they're chasing
- Status, identity, or lifestyle signals they care about

6. Buying Triggers
- What moments push them to finally take action
- What makes them say "I need help with this now"
- What type of messaging gets their attention instantly

7. Objections & Resistance
- Common reasons they hesitate to buy
- Past bad experiences that made them skeptical
- What they need to believe before saying yes

8. Language & Messaging Hooks
- Phrases they likely use to describe their problem
- Words that resonate emotionally
- Angles that would feel authentic, not salesy

9. Where They Spend Time & Who They Trust
- Platforms they actively consume content on
- Types of creators, brands, or voices they trust
- Content formats they respond to best

10. Summary for Marketers
- How this ICP should be spoken to
- What to avoid saying
- What will immediately build trust and authority

IMPORTANT GUIDELINES

- Do NOT be generic or vague
- Do NOT write like a textbook
- Write as if this ICP will be used to sell a real offer with real money on the line
- Prioritize clarity, emotional insight, and buying psychology
- If information is missing, make smart, realistic assumptions based on the inputs

Return ONLY valid JSON in this structure:
{
  "idealClientProfile": {
    "coreAudienceSnapshot": {
      "whoTheyAre": "One clear sentence describing who this person is",
      "currentStage": "What stage of life or business they are in",
      "whyNow": "Why they are looking for a solution right now"
    },
    "demographics": {
      "ageRange": "Age range",
      "gender": "Gender if applicable",
      "location": "Location if implied",
      "incomeRange": "Income or business revenue range",
      "jobTitle": "Job title or role"
    },
    "psychographics": {
      "currentFrustrations": ["Frustration 1", "Frustration 2", "Frustration 3"],
      "whatKeepsThemStuck": ["Stuck point 1", "Stuck point 2"],
      "secretWorries": ["Secret worry 1", "Secret worry 2"],
      "successInTheirWords": "What success looks like in their own words",
      "tiredOfTrying": ["Thing they're tired of 1", "Thing they're tired of 2"]
    },
    "corePainsAndProblems": {
      "surfaceProblem": "The surface problem they complain about",
      "deeperEmotionalProblem": "The deeper emotional problem underneath",
      "costOfNotSolving": "The real cost of not solving this problem"
    },
    "desiredOutcomesAndMotivations": {
      "practicalResults": ["Result 1", "Result 2", "Result 3"],
      "emotionalOutcomes": ["Emotional outcome 1", "Emotional outcome 2"],
      "statusSignals": ["Status/identity signal 1", "Status/identity signal 2"]
    },
    "buyingTriggers": {
      "actionMoments": ["Moment 1", "Moment 2"],
      "urgencyStatements": ["Statement that makes them say I need help now"],
      "attentionGrabbingMessages": ["Message type 1", "Message type 2"]
    },
    "objectionsAndResistance": {
      "commonHesitations": ["Hesitation 1", "Hesitation 2", "Hesitation 3"],
      "pastBadExperiences": ["Bad experience 1", "Bad experience 2"],
      "beliefsNeededToSayYes": ["Belief 1", "Belief 2"]
    },
    "languageAndMessagingHooks": {
      "phrasesTheyUse": ["Phrase 1", "Phrase 2", "Phrase 3"],
      "emotionalWords": ["Word 1", "Word 2", "Word 3"],
      "authenticAngles": ["Angle 1", "Angle 2"]
    },
    "whereTheySpendTime": {
      "platforms": ["Platform 1", "Platform 2"],
      "trustedVoices": ["Type of creator/brand they trust"],
      "preferredContentFormats": ["Format 1", "Format 2"]
    },
    "summaryForMarketers": {
      "howToSpeakToThem": "How this ICP should be spoken to",
      "whatToAvoid": ["Thing to avoid 1", "Thing to avoid 2"],
      "trustBuilders": ["Trust builder 1", "Trust builder 2"]
    }
  }
}
`;

export default idealClientPrompt;
