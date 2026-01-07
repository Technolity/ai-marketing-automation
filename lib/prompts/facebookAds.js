/**
 * Facebook Ads - 3 Ads (2 Short, 1 Long)
 * Headlines match opt-in hook
 */

export const facebookAdsPrompt = (data) => `
Generate 3 Facebook/Instagram ads. Headlines MUST match the opt-in hook style.

BUSINESS DATA:
• Client: ${data.idealClient || 'Not specified'}
• Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Proof: ${data.testimonials || 'Not specified'}
• Lead Magnet: ${data.leadMagnetTitle || 'Free Training'}
• Opt-In Hook: ${data.optInHeadline || 'Not specified'}

RULES:
• Headlines MUST match the opt-in page hook style
• Conversational, authentic tone
• Use emojis naturally (don't overdo)
• No hype or clickbait
• Strong, clear CTAs

Generate JSON (no markdown):
{
  "shortAd1": {
    "headline": "Short, punchy headline matching opt-in hook (max 40 chars)",
    "primaryText": "~100 word ad: Hook that grabs attention → identify the pain → quick promise → CTA. Conversational tone with natural emojis. Get straight to the point.",
    "cta": "Learn More"
  },
  "shortAd2": {
    "headline": "Different angle headline (max 40 chars)",
    "primaryText": "~100 word ad: Different hook angle → outcome focus → what they'll discover → CTA. Test this against Ad #1.",
    "cta": "Get Access"
  },
  "longAd": {
    "headline": "Story-driven headline (max 40 chars)",
    "primaryText": "~250 word ad: Story hook that draws them in → the problem they're facing → what they've tried → your discovery → the solution → 3 key benefits → social proof → strong CTA. This is your best-performing ad format for cold traffic.",
    "cta": "Download Now"
  }
}

CRITICAL: All content must be SPECIFIC to this business. No placeholders.
`;

export default facebookAdsPrompt;
