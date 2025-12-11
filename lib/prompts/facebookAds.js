/**
 * Facebook Ads Generator
 * Creates 10 Short-Form and 10 Long-Form Facebook Ads
 */

export const facebookAdsPrompt = (data) => `
Create Facebook Ads based on the VSL content and client information.
Generate BOTH short-form and long-form ads that are copy-and-paste ready.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== PART 1: 10 SHORT-FORM FACEBOOK ADS ===

Use this template for each short-form ad:
1. A headline that hooks with a question or powerful statement related to a major pain point
2. Call to action right away to access the lead magnet
3. Share 3 benefits with one-sentence explanation for each
4. Insert stats or personal journey (at least two sentences)
5. Include one powerful social proof with enough background details
6. Call to action to opt in (one or two powerful sentences)
7. Sign off with something inspirational about community

IMPORTANT: 
- Write conversationally using complete sentences
- NO headers or subheaders - ready to paste directly into Facebook
- Use professional emojis throughout

=== PART 2: 10 LONG-FORM FACEBOOK ADS ===

Use this framework for each long-form ad:

1. ATTENTION-GRABBING HEADLINE (HOOK)
   - Include a timeframe
   - Make it easy/effortless
   - Speak to burning desire OR address nagging problem
   Example: "How I Generated $40 Million in High-Ticket Sales in Just 14 Days!"

2. IMAGINATION PROMPT (Problem + Emotional Pain)
   - Start with relatable problem/frustration
   - Connect emotionally
   Example: "Have you ever asked yourself, why does my marketing fail?"

3. PERSONAL STRUGGLE (Relatable Story)
   - Share personal struggle with vulnerability
   - Build connection

4. HIGHLIGHT UNIQUE SOLUTION (Benefits + Big Promise)
   - Introduce the system
   - Emphasize transformation
   - Mention AI if applicable

5. PAINT THE PICTURE OF SUCCESS
   - Show clear, desirable outcome
   - Make it visual and tangible

6. SET CLEAR QUALIFICATION (Exclusivity)
   - Define who this is for
   - Push away unqualified prospects
   - Create exclusivity

7. CALL TO ACTION (CTA with Urgency)
   - Encourage immediate action
   - Drive urgency

8. BONUS (P.S. or Final Hook)
   - Add final punch
   - Overcome common objections
   - Personal connection

IMPORTANT:
- Use emojis throughout
- NO section headings - copy-and-paste ready
- Make them long-tail and robust

Return ONLY valid JSON in this structure:
{
  "facebookAds": {
    "shortFormAds": [
      {
        "adNumber": 1,
        "headline": "Attention-grabbing headline",
        "fullAdCopy": "Complete ad copy ready to paste into Facebook"
      }
    ],
    "longFormAds": [
      {
        "adNumber": 1,
        "headline": "Hook headline with timeframe",
        "fullAdCopy": "Complete long-form ad copy ready to paste into Facebook"
      }
    ],
    "visualSuggestions": [
      "Lead Magnet Image: 3D image of the Lead Magnet Book",
      "Video: Quick walkthrough of how the funnel works",
      "Before-and-After Image: Showcase transformation"
    ],
    "targetingRecommendations": {
      "interests": ["Interest 1", "Interest 2"],
      "demographics": "Target demographic description",
      "behaviors": ["Behavior 1", "Behavior 2"]
    }
  }
}
`;

export default facebookAdsPrompt;
