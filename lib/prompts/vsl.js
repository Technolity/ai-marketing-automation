/**
 * VSL Script Generator - Optimized for Reliable Generation
 * Generates structured video script components
 */

export const vslPrompt = (data) => `
Generate Video Sales Letter (VSL) script components. Be SPECIFIC and COMPLETE. NO placeholders.

BUSINESS DATA:
• Client: ${data.idealClient || 'Not specified'}
• Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Story: ${data.storyLowMoment || 'NS'} → ${data.storyDiscovery || 'NS'} → ${data.storyBreakthrough || 'NS'}
• Proof: ${data.testimonials || 'Not specified'}
• Offer: ${data.offerProgram || 'Not specified'}
• CTA: ${data.callToAction || 'Book a call'}

Generate JSON (no markdown):
{
  "vslScript": {
    "hookOptions": [
      "Pain-focused hook: 1-2 sentences questioning their current struggle",
      "Curiosity hook: 1-2 sentences challenging a common belief",
      "Promise hook: 1-2 sentences about the transformation possible"
    ],
    "openingStory": "3-4 paragraph personal story: the struggle (pit), the search, the discovery, the breakthrough. 200-300 words. Present tense, immersive.",
    "problemAgitation": "2-3 paragraphs agitating their pain. What they've tried, why it hasn't worked, the real cost of staying stuck. 150-200 words.",
    "threeTips": [
      {
        "tipTitle": "Tip 1 Title",
        "tipContent": "Teaching content - what they need to know (3-4 sentences)",
        "actionStep": "Specific action they can take",
        "bridge": "How this connects to needing your help"
      },
      {
        "tipTitle": "Tip 2 Title",
        "tipContent": "Teaching content - what they need to know (3-4 sentences)",
        "actionStep": "Specific action they can take",
        "bridge": "How this connects to needing your help"
      },
      {
        "tipTitle": "Tip 3 Title",
        "tipContent": "Teaching content - what they need to know (3-4 sentences)",
        "actionStep": "Specific action they can take",
        "bridge": "Why DIY is hard without guidance"
      }
    ],
    "methodReveal": "2-3 paragraphs introducing your unique method/system. What it is, how it works, why it's different. 150-200 words.",
    "socialProof": "2-3 specific client results or testimonials. Include before/after, timeframe, specific outcomes. 100-150 words.",
    "offerPresentation": "Present the offer: what they get, how it works, the transformation promised. 100-150 words.",
    "objectionHandlers": [
      {"objection": "I don't have time", "response": "2-3 sentence response addressing time concern"},
      {"objection": "It's too expensive", "response": "2-3 sentence response reframing investment"},
      {"objection": "I've tried things before", "response": "2-3 sentence response on why this is different"},
      {"objection": "I'm not ready yet", "response": "2-3 sentence response on cost of waiting"}
    ],
    "guarantee": "Your guarantee or risk-reversal statement. 2-3 sentences.",
    "closingSequence": {
      "urgencyClose": "Create urgency (limited spots, deadline, etc.) 2-3 sentences",
      "visionClose": "Paint the future picture of their life after transformation. 3-4 sentences",
      "finalCTA": "Clear call to action with next steps. 2-3 sentences"
    },
    "callToActionName": "Book Your [Specific Call Name]",
    "estimatedLength": "15-20 minutes"
  }
}

All content must be SPECIFIC to the business. No [insert here] or generic placeholders.
`;

export default vslPrompt;
