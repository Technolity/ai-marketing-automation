/**
 * Bio Generator - Deterministic Prompt
 * Complete marketable bio ready to use
 * 
 * CRITICAL: This generates REAL, copy-paste ready bio content
 */

export const bioPrompt = (data) => `
You are writing the ACTUAL bio for a real business founder.

THIS IS NOT AN EXAMPLE. This is the REAL bio that will be:
- Used on websites and sales pages
- Displayed on social media profiles
- Read before speaking engagements
- Included in press materials

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD"
2. Write in third person (professional bio style)
3. Include specific numbers and achievements
4. Make it feel authentic and relatable, not salesy
5. Output MUST be valid JSON

INPUT DATA:

Founder Name: ${data.founderName || data.businessName || 'The Founder'}
Business Name: ${data.businessName || 'The Business'}
Industry / Market: ${data.industry || 'Not specified'}
Who they help: ${data.idealClient || 'Not specified'}
What they help them with: ${data.message || 'Not specified'}
Unique approach / method: ${data.uniqueAdvantage || 'Not specified'}
Personal story / mission (Source Data):
- The Pit: ${data.storyLowMoment || 'Not specified'}
- The Discovery: ${data.storyDiscovery || 'Not specified'}
- The Breakthrough: ${data.storyBreakthrough || 'Not specified'}
- The Outcome: ${data.storyResults || 'Not specified'}
Client results / proof: ${data.testimonials || 'Not specified'}
Main program or offer: ${data.offerProgram || 'Not specified'}
Brand voice / personality: ${data.brandVoice || 'Professional'}
Years of experience: ${data.yearsExperience || 'Several years'}

Return ONLY valid JSON:

{
  "bio": {
    "fullBio": "Write a complete 200-word professional bio in third person. Structure: Start with who they are and what they're known for. Add their unique expertise/method. Include specific achievements and numbers. Share the personal 'why' behind their work. End with what drives them today. This must be complete, polished, and ready to copy-paste onto a website.",
    "shortBio": "A 75-word condensed version that captures the essence - who they are, who they help, key credential, and what makes them unique. Perfect for social media bios or quick introductions.",
    "speakerBio": "A 150-word version designed for speaking introductions. More emphasis on credentials, notable achievements, and what value they bring to audiences.",
    "oneLiner": "One powerful sentence that captures their identity and value proposition. Example format: '[Name] is a [credential] who helps [audience] [achieve outcome] through [unique method].'",
    "keyAchievements": [
      "Specific, quantified achievement #1 (e.g., 'Helped 500+ coaches grow to 6-figures')",
      "Specific achievement #2 (e.g., 'Generated $10M+ in client revenue')",
      "Specific achievement #3 (e.g., 'Author of [Book Title]' or 'Featured in [Publications]')",
      "Specific credential or recognition (e.g., 'Certified [credential]' or 'Award winner')"
    ],
    "personalTouch": {
      "humanElement": "The relatable personal detail that makes them human (e.g., 'When not [working], you'll find them [hobby/personal detail]')",
      "missionStatement": "Their deeper 'why' - the reason they do this work beyond money",
      "valueStatement": "The core belief or principle that guides their work"
    },
    "socialMediaVersions": {
      "instagram": "Instagram bio - 150 characters max with emojis: [Emoji] [Title/What they do] [Emoji] Helping [audience] [outcome] [Emoji] [CTA or hook]",
      "linkedin": "LinkedIn summary opening - professional, credibility-focused, 2-3 sentences that make people want to connect",
      "twitter": "Twitter bio - 160 characters, punchy and memorable, includes what they're known for"
    }
  }
}
`;

export default bioPrompt;
