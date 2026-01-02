/**
 * Facebook Ads - Optimized for Reliable Generation
 * Generates ad copy components ready for Meta Ads Manager
 */

export const facebookAdsPrompt = (data) => `
Generate Facebook ad copy. Be SPECIFIC and COMPLETE. NO placeholders.

BUSINESS DATA:
• Client: ${data.idealClient || 'Not specified'}
• Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Proof: ${data.testimonials || 'Not specified'}
• Lead Magnet: ${data.leadMagnetTitle || 'Free Training'}
• Offer: ${data.offerProgram || 'Not specified'}

Generate JSON (no markdown):
{
  "facebookAds": {
    "hookBank": [
      "Pain hook: Question about specific struggle",
      "Curiosity hook: Bold statement challenging belief",
      "Promise hook: Outcome-focused opening",
      "Story hook: Personal journey opening",
      "Social proof hook: Results-focused opening"
    ],
    "bulletBenefits": [
      "✅ Benefit 1 - One sentence impact",
      "✅ Benefit 2 - One sentence impact",
      "✅ Benefit 3 - One sentence impact",
      "✅ Benefit 4 - One sentence impact",
      "✅ Benefit 5 - One sentence impact"
    ],
    "ads": [
      {
        "angle": "Pain Point Focus",
        "headline": "Short headline about pain (max 40 chars)",
        "primaryText": "Complete 150-200 word ad. Pain hook → CTA to lead magnet → 3 benefits with explanations → Brief story/stats → Social proof mention → Strong CTA. Conversational with emojis.",
        "callToAction": "Learn More"
      },
      {
        "angle": "Transformation Focus",
        "headline": "Short headline about outcome (max 40 chars)",
        "primaryText": "Complete 150-200 word ad. Outcome hook → Pain they're leaving behind → What's possible → 3 benefits → Proof → CTA. Conversational with emojis.",
        "callToAction": "Download"
      },
      {
        "angle": "Story Focus",
        "headline": "Short story-hook headline (max 40 chars)",
        "primaryText": "Complete 150-200 word ad. Story opening → Discovery → How you can help → 3 benefits → Client result → CTA. Conversational with emojis.",
        "callToAction": "Learn More"
      },
      {
        "angle": "Social Proof Focus",
        "headline": "Short proof headline (max 40 chars)",
        "primaryText": "Complete 150-200 word ad. Results hook → Testimonial → What's inside → 3 benefits → CTA. Conversational with emojis.",
        "callToAction": "Sign Up"
      },
      {
        "angle": "Direct Offer",
        "headline": "Free resource headline (max 40 chars)",
        "primaryText": "Complete 150-200 word ad. Direct offer → What they get → 3 benefits → Why free → Proof → CTA. Conversational with emojis.",
        "callToAction": "Get Access"
      }
    ],
    "targetingRecommendations": {
      "interests": ["3-5 relevant interests"],
      "behaviors": ["2-3 relevant behaviors"],
      "ageRange": "Recommend based on ideal client"
    }
  }
}

All content must be SPECIFIC to the business. Use {{contact.first_name}} where appropriate.
Use emojis naturally but don't overdo it. Make ads conversational and authentic.
`;

export default facebookAdsPrompt;
