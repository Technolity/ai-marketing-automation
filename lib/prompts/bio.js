/**
 * Bio Generator - Optimized for Reliable Generation
 * Professional bio versions for different platforms
 */

export const bioPrompt = (data) => `
Generate professional bio content. Write in THIRD PERSON. Be SPECIFIC. NO placeholders.

BUSINESS DATA:
• Name: ${data.founderName || data.businessName || 'The Founder'}
• Business: ${data.businessName || 'The Business'}
• Industry: ${data.industry || 'Not specified'}
• Helps: ${data.idealClient || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Story: ${data.storyLowMoment || 'NS'} → ${data.storyBreakthrough || 'NS'}
• Proof: ${data.testimonials || 'Not specified'}
• Offer: ${data.offerProgram || 'Not specified'}

IMPORTANT: The Name field contains a person's full name (e.g., "Ryan Pryor").
DO NOT extract or infer location information from person names.
If a city/location is not explicitly provided in the business data, do not guess or infer it from names.

Generate JSON (no markdown):
{
  "bio": {
    "fullBio": "Complete 150-200 word professional bio in third person. Structure: Who they are → What they're known for → Their method/expertise → Key achievement → Personal why → What drives them today. Polished and ready for website About page.",
    "shortBio": "75-word condensed version: who they are, who they help, key credential, what makes them unique. Perfect for social media.",
    "speakerBio": "100-150 word version for speaking introductions. Focus on credentials, achievements, and audience value.",
    "oneLiner": "[Name] is a [credential] who helps [audience] [achieve outcome] through [unique method].",
    "keyAchievements": [
      "Quantified achievement 1 (e.g., Helped 500+ clients)",
      "Achievement 2 (e.g., Generated $X in results)",
      "Achievement 3 (e.g., Featured in [publication])",
      "Credential or recognition",
      "Additional achievement or milestone"
    ],
    "socialMediaVersions": {
      "instagram": "150 char max with emojis - what they do + who they help + CTA",
      "linkedin": "2-3 sentence professional summary focused on credibility",
      "twitter": "160 char punchy bio - what they're known for"
    },
    "personalTouch": {
      "humanElement": "Personal detail that makes them relatable (e.g., When not working, they...)",
      "missionStatement": "Their deeper why - the reason they do this beyond money"
    }
  }
}

All content must be SPECIFIC to the person/business. No [insert] or generic placeholders.
`;

export default bioPrompt;
