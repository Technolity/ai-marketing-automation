/**
 * VSL Script Generator - Conversational Video Script
 * Fully conversational, spoken language format
 */

export const vslPrompt = (data) => `
Generate a Video Sales Letter (VSL) script. FULLY CONVERSATIONAL - write as if speaking to a friend.

BUSINESS DATA:
• Client: ${data.idealClient || 'Not specified'}
• Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Story: ${data.storyLowMoment || 'NS'} → ${data.storyDiscovery || 'NS'} → ${data.storyBreakthrough || 'NS'}
• Proof: ${data.testimonials || 'Not specified'}
• Offer: ${data.offerProgram || 'Not specified'}
• CTA: ${data.callToAction || 'Book a call'}

STYLE RULES:
• 100% conversational - like talking to a friend over coffee
• Present tense, immersive storytelling
• NO marketing jargon or hype
• NO "tips" or "secrets" format
• Short sentences, natural pauses
• Direct, personal tone ("you" focused)

Generate JSON (no markdown):
{
  "hookOptions": [
    "Pain hook: 1-2 sentences that address their immediate struggle",
    "Curiosity hook: 1-2 sentences that challenge what they believe",
    "Promise hook: 1-2 sentences about the transformation ahead"
  ],
  "whoItsFor": "2-3 paragraphs describing exactly who this video is for. Be specific about their situation, struggles, and desires. Make them feel seen and understood. Start with 'This video is for you if...'",
  "whoItsNotFor": "1-2 paragraphs describing who should NOT watch. Be direct but not rude. This creates exclusivity and qualifies the right viewers. Start with 'This video is NOT for you if...'",
  "openingStory": "3-4 paragraph personal story connecting to their struggle. Present tense, conversational. The pit, the search, the breakthrough. 200-300 words. Like you're telling a friend what happened.",
  "problemAgitation": "2-3 paragraphs agitating their pain. What they've tried, why it hasn't worked, the real cost of staying stuck. 150-200 words. Make them feel the weight of the problem.",
  "methodReveal": "2-3 paragraphs introducing your solution. What you discovered, how it works, why it's different. 150-200 words. Position yourself as the guide, not the hero.",
  "socialProof": "2-3 specific client results or testimonials. Include before/after, timeframe, specific outcomes. 100-150 words. Real stories, not generic praise.",
  "offerPresentation": "2-3 paragraphs presenting what you offer. What they get, how it works, the transformation promised. 100-150 words. Clear and compelling.",
  "strongCTA": "2-3 paragraphs with a strong call to action. What to do next, why now, what happens when they take action. Create urgency without being pushy. Paint the future picture. End with clear next steps."
}

CRITICAL: All content must be SPECIFIC to this business. No placeholders or generic filler.
`;

export default vslPrompt;
