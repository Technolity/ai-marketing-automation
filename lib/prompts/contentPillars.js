/**
 * Content Pillars Generator
 */

export const contentPillarsPrompt = (data) => `
Create the core content pillars that will guide all content creation.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Design content pillars that:
- Align with expertise and unique solution
- Address ideal client pain points
- Build authority in key areas
- Support the customer journey

Return ONLY valid JSON in this exact structure:
{
  "contentPillars": {
    "pillars": [
      {
        "name": "Pillar name",
        "description": "What this pillar covers",
        "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
        "audienceQuestion": "What question does this answer?",
        "contentFormats": ["Blog", "Video", "Social"],
        "exampleTitles": ["Title 1", "Title 2", "Title 3"]
      }
    ],
    "contentRatio": {
      "educational": "40%",
      "inspirational": "20%",
      "promotional": "20%",
      "entertainment": "20%"
    },
    "brandVoice": {
      "tone": "Professional yet approachable",
      "personality": ["Trait 1", "Trait 2"],
      "doSay": ["Phrase to use"],
      "dontSay": ["Phrase to avoid"]
    },
    "keyMessages": [
      "Core message 1",
      "Core message 2",
      "Core message 3"
    ],
    "hashtags": {
      "branded": ["#YourBrand"],
      "industry": ["#Industry"],
      "niche": ["#Niche"]
    }
  }
}
`;

export default contentPillarsPrompt;
