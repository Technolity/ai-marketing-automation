/**
 * Ideal Client Profile (ICP) - Deterministic Prompt
 * Structured 10-section deep dive into primary audience
 * 
 * CRITICAL: This generates REAL business content, not examples
 */

export const idealClientPrompt = (data) => `
You are generating the ACTUAL Ideal Client Profile for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL ICP that will be used to:
- Target paid ads on Facebook/Instagram/YouTube
- Write funnel copy that converts
- Create VSL scripts that sell
- Segment email lists
- Build real marketing campaigns with real money

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "e.g.", "such as X", "[Your answer here]"
2. Use SPECIFIC numbers, not vague terms like "various", "many", "several"
3. Every field must contain REAL, usable content - not examples or templates
4. Base EVERYTHING on the user's actual answers provided below
5. Write AS IF you ARE the business owner creating this for your own business
6. Output MUST be valid JSON - no markdown, no explanations, no commentary

INPUT DATA (Use this to create specific, real content):

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
Primary CTA the business wants: ${data.callToAction || 'Not specified'}
Main acquisition channels: ${data.platforms || 'Not specified'}
Brand voice or personality: ${data.brandVoice || 'Not specified'}
90-day business goal: ${data.goal90Days || 'Not specified'}

TASK: Create a DEEP, SPECIFIC Ideal Client Profile with exactly 10 sections.

Return ONLY valid JSON in this exact structure (every field is REQUIRED with real content):
{
  "idealClientProfile": {
    "coreAudienceSnapshot": {
      "whoTheyAre": "A clear, specific one-sentence description of exactly who this person is",
      "lifeOrBusinessStage": "What specific stage of life or business they are currently in",
      "whyNow": "Why THIS moment is when they're actively seeking a solution"
    },
    "demographics": {
      "ageRange": "Specific age range (e.g., 35-50)",
      "gender": "Gender breakdown if relevant (e.g., 70% female, 30% male) or 'All genders'",
      "location": "Geographic areas where they are concentrated",
      "incomeOrRevenue": "Specific income range or business revenue level",
      "jobTitleOrRole": "Their professional title, role, or business type"
    },
    "psychographics": {
      "currentFrustrations": [
        "Specific frustration #1 they are experiencing right now",
        "Specific frustration #2 they deal with daily",
        "Specific frustration #3 that causes them stress"
      ],
      "whatKeepsThemStuck": [
        "Specific thing that keeps them stuck or overwhelmed #1",
        "Specific barrier #2 preventing their progress",
        "Specific obstacle #3 they can't seem to overcome"
      ],
      "secretWorries": [
        "What they secretly worry might never change #1",
        "Private fear they don't admit publicly #2",
        "Deep concern about their future #3"
      ],
      "successInTheirWords": "How they would describe success in their own words, using their language",
      "tiredOfTrying": [
        "What they're tired of trying #1",
        "What they're exhausted hearing about #2",
        "Solutions that have failed them before #3"
      ]
    },
    "corePainsAndProblems": {
      "surfaceProblem": "The obvious problem they complain about openly",
      "deeperEmotionalProblem": "The hidden emotional problem underneath the surface",
      "costOfNotSolving": "The real, tangible cost (time, money, relationships) if they don't solve this"
    },
    "desiredOutcomesAndMotivations": {
      "practicalResults": [
        "Concrete practical result #1 they want",
        "Measurable outcome #2 they're chasing",
        "Tangible result #3 they'd pay for"
      ],
      "emotionalOutcomes": [
        "How they want to FEEL after solving this #1",
        "Emotional state #2 they're chasing",
        "The feeling #3 that would change everything"
      ],
      "statusIdentityLifestyle": [
        "How they want to be seen by others",
        "The identity they're trying to claim",
        "The lifestyle signal that matters to them"
      ]
    },
    "buyingTriggers": {
      "momentsThatPushAction": [
        "Specific moment #1 that makes them finally take action",
        "Triggering event #2 that creates urgency",
        "Situation #3 that makes them say 'enough is enough'"
      ],
      "needHelpNowMoments": [
        "When they say 'I need help with this NOW' #1",
        "Trigger that creates immediate urgency #2",
        "Breaking point that demands action #3"
      ],
      "messagingThatGrabsAttention": [
        "Type of hook that stops their scroll #1",
        "Messaging angle that resonates instantly #2",
        "Phrase that makes them say 'that's me!' #3"
      ]
    },
    "objectionsAndResistance": {
      "reasonsToHesitate": [
        "Common objection #1 - why they hesitate to buy",
        "Common objection #2 - mental barrier to purchasing",
        "Common objection #3 - reason they might say no"
      ],
      "pastBadExperiences": [
        "Previous bad experience #1 that made them skeptical",
        "Past disappointment #2 they carry with them",
        "Trust issue #3 from being burned before"
      ],
      "whatTheyNeedToBelieve": [
        "Belief #1 they need before saying yes",
        "Conviction #2 required to take action",
        "Trust point #3 that must be established"
      ]
    },
    "languageAndMessagingHooks": {
      "phrasesTheyUse": [
        "Exact phrase #1 they use to describe their problem",
        "Words #2 they actually say when frustrated",
        "Language #3 from their vocabulary, not ours"
      ],
      "emotionallyResonantWords": [
        "Word #1 that hits them emotionally",
        "Term #2 that makes them feel understood",
        "Phrase #3 that creates connection"
      ],
      "authenticAngles": [
        "Messaging angle #1 that feels genuine, not salesy",
        "Approach #2 that builds trust immediately",
        "Frame #3 that positions us as ally, not seller"
      ]
    },
    "whereTheySpendTimeAndWhoTheyTrust": {
      "platforms": [
        "Platform #1 they actively consume content on",
        "Platform #2 where they spend significant time",
        "Platform #3 they check regularly"
      ],
      "trustedVoices": [
        "Type of creator/brand #1 they trust",
        "Voice #2 they listen to and respect",
        "Authority figure #3 who influences them"
      ],
      "contentFormatsTheyRespondTo": [
        "Content format #1 they engage with most",
        "Format #2 they prefer consuming",
        "Format #3 that holds their attention"
      ]
    },
    "summaryForMarketers": {
      "howToSpeakToThem": "Clear guidance on the tone, style, and approach that resonates with this ICP",
      "whatToAvoid": [
        "Messaging mistake #1 to avoid at all costs",
        "Approach #2 that will turn them off immediately",
        "Language #3 that breaks trust"
      ],
      "whatBuildsTrustAndAuthority": [
        "Trust builder #1 that establishes immediate credibility",
        "Authority signal #2 that positions you as the solution",
        "Connection point #3 that makes them feel understood"
      ]
    }
  }
}
`;

export default idealClientPrompt;
