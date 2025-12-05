/**
 * Content Ideas Generator
 */

export const contentIdeasPrompt = (data) => `
Generate 30 content ideas across multiple platforms based on the client's business and expertise.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Create content ideas that:
- Address pain points and desired outcomes
- Showcase expertise and unique solution
- Build authority and trust
- Drive engagement and leads

Return ONLY valid JSON in this exact structure:
{
  "contentIdeas": {
    "socialMedia": {
      "educational": [
        {"title": "", "hook": "", "format": "carousel/video/reel", "keyPoints": []}
      ],
      "storytelling": [
        {"title": "", "hook": "", "format": "", "keyPoints": []}
      ],
      "promotional": [
        {"title": "", "hook": "", "format": "", "keyPoints": []}
      ]
    },
    "videoContent": {
      "youtube": [
        {"title": "", "description": "", "keyPoints": [], "cta": ""}
      ],
      "shortForm": [
        {"title": "", "hook": "", "duration": "60 seconds"}
      ]
    },
    "blogPosts": [
      {"title": "", "outline": [], "targetKeywords": []}
    ],
    "emailNewsletter": [
      {"subject": "", "mainTopic": "", "cta": ""}
    ],
    "contentCalendar": {
      "week1": [],
      "week2": [],
      "week3": [],
      "week4": []
    }
  }
}
`;

export default contentIdeasPrompt;
