/**
 * Signature Story Generator
 * Creates Personal Story for VSL and Marketing
 */

export const storyPrompt = (data) => `
Create a powerful Signature Story based on the personal story framework.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== SIGNATURE STORY FRAMEWORK ===

The story should follow this arc:

1. THE LOSS/MAJOR PROBLEM
- A moment where you faced a significant loss or major problem
- Set the scene emotionally
- Make it relatable to the ideal client

2. THE SEARCH FOR ANSWERS
- What you did to find solutions
- The struggle and frustration
- The things that didn't work

3. THE BREAKTHROUGH
- The major breakthrough of finding the solution
- The "aha moment"
- What made it click

4. THE TRANSFORMATION
- How this changed your life
- The specific results achieved
- The new reality

=== THREE VERSIONS ===

Create 3 versions of the signature story:
1. SHORT VERSION (100 words) - For ads and social media
2. MEDIUM VERSION (300 words) - For opt-in pages and emails
3. LONG VERSION (500+ words) - For VSL and sales pages

Each version should:
- Be emotionally compelling
- Connect with the ideal client's pain
- Show the transformation is possible
- Build credibility and trust
- Lead naturally to the solution/offer

Return ONLY valid JSON in this structure:
{
  "signatureStory": {
    "shortVersion": {
      "story": "100-word version",
      "hook": "Opening hook line",
      "transformation": "Key transformation statement"
    },
    "mediumVersion": {
      "story": "300-word version",
      "hook": "Opening hook line",
      "painMoment": "The low point",
      "breakthrough": "The aha moment",
      "transformation": "The result"
    },
    "longVersion": {
      "story": "500+ word version",
      "sections": {
        "opening": "Hook and scene setting",
        "problem": "The loss/major problem",
        "search": "Looking for answers",
        "breakthrough": "Finding the solution",
        "transformation": "Results and new life",
        "connection": "How this relates to helping others"
      }
    },
    "pullQuotes": [
      "Powerful quote from the story",
      "Another powerful quote",
      "Third powerful quote"
    ],
    "emotionalTriggers": [
      "Trigger 1",
      "Trigger 2",
      "Trigger 3"
    ]
  }
}
`;

export default storyPrompt;
