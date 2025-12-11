/**
 * Bio Generator
 * Creates a 200-word marketable bio
 */

export const bioPrompt = (data) => `
Create a 200-word marketable bio for the client based on their information.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== BIO REQUIREMENTS ===
- Exactly 200 words (can be slightly more or less)
- Professional and marketable
- Highlight achievements and expertise
- Include personal story elements
- Mention unique approach/method
- Include results they've achieved for clients
- End with what they're passionate about

=== TONE ===
Match the brand voice from the client information:
- If funny: Add personality and wit
- If professional: Keep it polished and authoritative
- If inspiring: Make it motivational
- If dramatic: Add flair and impact

Return ONLY valid JSON in this structure:
{
  "bio": {
    "fullBio": "Complete 200-word bio",
    "shortBio": "50-word condensed version for social media",
    "oneLiner": "One sentence bio for quick intros",
    "keyAchievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
    "personalTouch": "The personal element that makes them relatable"
  }
}
`;

export default bioPrompt;
