/**
 * YouTube Show Blueprint Generator
 */

export const youtubeShowPrompt = (data) => `
Create a complete YouTube show blueprint for authority building and lead generation.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Design a YouTube show that:
- Positions you as the authority
- Attracts ideal clients
- Provides genuine value
- Drives viewers to take action

Return ONLY valid JSON in this exact structure:
{
  "youtubeShow": {
    "showName": "Catchy show name",
    "tagline": "Show tagline",
    "format": "Interview/Solo/Hybrid",
    "frequency": "Weekly/Bi-weekly",
    "averageLength": "20-45 minutes",
    "targetAudience": "Who watches",
    "uniqueAngle": "What makes this different",
    "segments": [
      {
        "name": "Segment name",
        "duration": "5 minutes",
        "purpose": "Why include this"
      }
    ],
    "episodeIdeas": [
      {
        "title": "Episode title",
        "description": "What it covers",
        "keyTakeaways": [],
        "cta": "Episode call to action"
      }
    ],
    "thumbnailStyle": "Visual style description",
    "intro": "Show intro script (30 seconds)",
    "outro": "Show outro script with CTA",
    "productionNotes": {
      "equipment": "Recommended equipment",
      "setting": "Background/location",
      "style": "Visual style guidelines"
    }
  }
}
`;

export default youtubeShowPrompt;
