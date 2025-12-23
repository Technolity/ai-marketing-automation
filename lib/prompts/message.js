/**
 * Million-Dollar Message™ - Deterministic Prompt
 * Core positioning and message framework
 * 
 * CRITICAL: This generates REAL business content, not examples
 */

export const messagePrompt = (data) => `
You are generating the ACTUAL Million-Dollar Message for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL core message that will be used:
- As the homepage headline
- In every ad campaign
- Throughout the sales funnel
- In pitch decks and sales calls
- Across all marketing materials

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "e.g.", "such as X"
2. Use SPECIFIC language from the user's actual industry and market
3. Every field must contain REAL, usable content - not templates
4. Write AS IF you ARE the business owner - this is YOUR message
5. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA (Use this to create specific, real content):

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

TASK: Create a MILLION-DOLLAR MESSAGE framework with every field filled with real, specific content.

Return ONLY valid JSON in this exact structure:
{
  "millionDollarMessage": {
    "corePromise": "One clear sentence that IS the offer - the main promise that will be used everywhere",
    "mechanism": "The specific method/system name (branded if possible)",
    "whyNow": "The urgency driver - why they need to act now",
    "whoItsFor": "Clear, specific target description",
    "proofElement": "The credibility signal that makes this believable",
    "oneLineMessage": "I help [specific audience] [achieve specific outcome] in [timeframe] using [unique method], without [common pain/obstacle]",
    "thisIsForYouIf": [
      "You're a [specific role] doing $[specific revenue range] who wants to [specific goal]",
      "You've tried [common failed approach] but still struggle with [specific problem]",
      "You know [insight they have] but haven't figured out how to [desired outcome]",
      "You're ready to invest in [what they need] because you're tired of [pain point]",
      "You want [specific outcome] in the next [specific timeframe]"
    ],
    "thisIsNotForYouIf": [
      "You're looking for a get-rich-quick scheme",
      "You're not willing to implement what you learn",
      "You're just starting out with no existing [relevant foundation]"
    ],
    "coreProblemReframe": {
      "howTheyExplainIt": "What they SAY their problem is",
      "whyItsIncomplete": "Why that explanation misses the real issue",
      "deeperTruth": "The actual root cause you help them see"
    },
    "uniqueMechanism": {
      "name": "The [Branded Name] Method/System/Framework",
      "whatItIs": "A [type of thing] that [what it does]",
      "whyItWorks": "Unlike [alternative 1] or [alternative 2], this works because [specific reason]",
      "keyComponents": [
        "Component 1: [Name] - [What it does]",
        "Component 2: [Name] - [What it does]",
        "Component 3: [Name] - [What it does]"
      ],
      "differentiation": "Unlike agencies that [common approach], unlike courses that [another approach], unlike DIY that [third approach], this [your unique approach]"
    },
    "outcomePromise": {
      "tangibleResult": "The specific, measurable outcome they can expect",
      "timeframe": "Realistic timeline to see results",
      "conditions": "What they need to do/have for this to work"
    },
    "proofAndCredibility": {
      "clientResults": [
        "[Client type] went from [before] to [after] in [time]",
        "[Client type] achieved [specific result] using this method",
        "[Number] clients have [achieved outcome]"
      ],
      "founderCredibility": "Why you're the person to teach this",
      "methodValidation": "How long this method has been tested/refined"
    },
    "objectionNeutralizers": [
      {
        "objection": "I don't have time",
        "dissolve": "This actually saves time by [specific mechanism]. Most clients report [specific time savings]."
      },
      {
        "objection": "It's too expensive",
        "dissolve": "One [result] covers the entire investment. Most see ROI within [timeframe]."
      },
      {
        "objection": "I've tried similar things before",
        "dissolve": "Unlike [what they tried], this focuses on [key difference] which is why [result]."
      }
    ],
    "messageAngles": {
      "painFocused": "Tired of [specific pain]? Here's why [conventional wisdom] is wrong...",
      "outcomeFocused": "How [target audience] are getting [specific outcome] in [timeframe]...",
      "curiousityDriven": "The [counterintuitive insight] that's helping [audience] [achieve result]...",
      "proofDriven": "How [client example] went from [before] to [after] in [time]...",
      "contrarian": "Why [common belief] is costing you [what they're losing]..."
    },
    "ctaFraming": {
      "actionToTake": "Book a free [Call Name]",
      "whatHappensNext": "On this call, we'll [specific agenda]",
      "whyTakeAction": "So you can [immediate benefit] and stop [current pain]",
      "urgencyElement": "[Reason to act now, not later]"
    },
    "elevatorPitch": "I help [specific audience] [achieve specific outcome] using [unique method]. Unlike [common alternative], my approach [key difference] which means [unique benefit]. Most clients see [specific result] within [timeframe].",
    "messageToMillionsSummary": "A 2-3 sentence summary of the entire positioning, written as if speaking directly to the ideal prospect. Confident, clear, compelling."
  }
}
`;

export default messagePrompt;
