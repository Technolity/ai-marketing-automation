/**
 * Million-Dollar Message Generator
 * From prompts.txt questionnaire
 */

export const messagePrompt = (data) => `
Create the Million-Dollar Message - a compelling core message that communicates the unique value of the business.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Based on the questionnaire:
- What is the unique solution being sold?
- What are the 3 pain points the audience has?
- What are the 3 main outcomes or benefits desired?
- What makes this solution different?

Create a powerful marketing message that:
1. Clearly articulates who this is for
2. Addresses their primary pain point
3. Promises the transformation they seek
4. Differentiates from alternatives
5. Creates urgency to act

Return ONLY valid JSON in this exact structure:
{
  "message": {
    "coreMessage": "The primary million-dollar message (1-2 sentences)",
    "tagline": "Short memorable tagline (5-8 words)",
    "elevatorPitch": "30-second elevator pitch (2-3 sentences)",
    "whoThisIsFor": "Clear description of ideal client",
    "problemStatement": "Primary pain point addressed",
    "solutionStatement": "How you solve it differently",
    "transformationPromise": "The outcome they'll achieve",
    "uniqueMechanism": {
      "name": "Name of your unique method/process",
      "description": "What makes it unique",
      "whyItWorks": "Why this approach is more effective"
    },
    "headlines": [
      "Headline variation 1",
      "Headline variation 2",
      "Headline variation 3",
      "Headline variation 4",
      "Headline variation 5"
    ],
    "callToAction": "Primary CTA phrase"
  }
}
`;

export default messagePrompt;
