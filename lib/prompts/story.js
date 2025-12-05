/**
 * Signature Story Generator
 * From prompts.txt questionnaire
 */

export const storyPrompt = (data) => `
Create the Signature Story - a personal narrative that connects with the audience and establishes credibility.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Personal Story Elements from Questionnaire:
- A moment where you faced a loss or major problem
- What you did to search for the answers
- The major breakthrough of finding the solution
- How did this change your life — tell me the results

Create a compelling signature story that:
1. Opens with a relatable hook
2. Shows vulnerability through the struggle
3. Reveals the journey to discovery
4. Celebrates the breakthrough moment
5. Connects to the audience's similar struggles
6. Bridges to your solution

Return ONLY valid JSON in this exact structure:
{
  "story": {
    "hook": "Attention-grabbing opening line",
    "theStruggle": {
      "situation": "What the situation was",
      "painPoints": "Specific challenges faced",
      "emotionalState": "How it felt",
      "stakes": "What was at risk"
    },
    "theSearch": {
      "whatWasTried": "Solutions attempted that didn't work",
      "frustrations": "Why they didn't work",
      "turningPoint": "What led to the breakthrough"
    },
    "theBreakthrough": {
      "discovery": "What was discovered",
      "realization": "The 'aha moment'",
      "firstResults": "Initial success indicators"
    },
    "theTransformation": {
      "results": "Specific measurable outcomes",
      "lifeChanges": "How life is different now",
      "emotionalChange": "How it feels now"
    },
    "theBridge": {
      "connectionToAudience": "How this relates to them",
      "promise": "What you can help them achieve",
      "callToAction": "Next step invitation"
    },
    "fullStory": "Complete 500-word signature story in narrative form",
    "shortVersion": "2-minute version (200 words)",
    "oneLineVersion": "Single sentence version"
  }
}
`;

export default storyPrompt;
