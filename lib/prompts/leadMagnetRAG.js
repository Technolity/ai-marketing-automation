/**
 * RAG-Enhanced Lead Magnet Generator
 * Uses Ted's knowledge base to create lead magnets with proven frameworks
 */

export const leadMagnetPromptRAG = (data, ragContext) => {
  // Base prompt
  let prompt = `You are an expert at creating lead magnets using Ted McGrath's proven frameworks.`;

  // Add RAG context if available
  if (ragContext && ragContext.hasContext) {
    prompt += `\n\n=== TED'S PROVEN FRAMEWORKS ===\n\n`;
    prompt += ragContext.contextText;
    prompt += `\n\n=== END OF TED'S FRAMEWORKS ===\n\n`;
    prompt += `IMPORTANT: Use the frameworks above to guide your creation. Apply Ted's strategies and principles.\n\n`;
  }

  // Add the main instructions
  prompt += `
Create a Lead Magnet (free gift workbook) based on the three tips from the VSL content.
This will be a 5-page workbook that can be pasted into Canva.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Use this framework to create the Lead Magnet:

=== PAGE 1: INTRODUCTION PAGE ===
- Create a robust introductory paragraph
- DO NOT list the three tips that are about to be revealed
- The introduction should be inspiring and motivate the reader to continue
- Set up the transformation they're about to experience
- Use Ted's hook and engagement strategies from the frameworks above

=== PAGES 2-4: TIP PAGES (One per tip) ===
For each tip page, include:
1. A compelling title for the tip (use benefit-driven language from Ted's frameworks)
2. A three-sentence description of the tip
3. Three bullet point benefits for applying the tip
   - Each bullet should have a two-sentence description/clarification
   - Frame benefits using transformation language from Ted's frameworks
4. A reflection/application question about the personal benefits of applying that tip

=== PAGE 5: CONCLUSION PAGE ===
- Include a robust, inspiring, and motivating summary
- A short paragraph with a call to action to schedule a consultation call
- Use the consultation call name from the VSL
- Apply Ted's CTA strategies from the frameworks
- Final paragraph (center justified): "Click Here to Schedule your Call"

=== TITLE OPTIONS ===
Provide 6 marketable titles for this workbook:
- 2 humorous titles (engaging and memorable)
- 2 controversial titles (pattern interrupt, curiosity-driven)
- 2 professional titles (authoritative and clear)

Use Ted's messaging principles to make titles compelling and irresistible.

Return ONLY valid JSON in this structure:
{
  "leadMagnet": {
    "suggestedTitles": {
      "humorous": ["Title 1", "Title 2"],
      "controversial": ["Title 1", "Title 2"],
      "professional": ["Title 1", "Title 2"]
    },
    "pages": {
      "introduction": {
        "headline": "Inspiring headline",
        "content": "Full introductory paragraph that inspires and motivates"
      },
      "tip1": {
        "title": "Tip 1 Title",
        "description": "Three-sentence description",
        "benefits": [
          {"bullet": "Benefit 1", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 2", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 3", "clarification": "Two-sentence clarification"}
        ],
        "reflectionQuestion": "Personal application question"
      },
      "tip2": {
        "title": "Tip 2 Title",
        "description": "Three-sentence description",
        "benefits": [
          {"bullet": "Benefit 1", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 2", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 3", "clarification": "Two-sentence clarification"}
        ],
        "reflectionQuestion": "Personal application question"
      },
      "tip3": {
        "title": "Tip 3 Title",
        "description": "Three-sentence description",
        "benefits": [
          {"bullet": "Benefit 1", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 2", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 3", "clarification": "Two-sentence clarification"}
        ],
        "reflectionQuestion": "Personal application question"
      },
      "conclusion": {
        "summary": "Inspiring and motivating summary paragraph",
        "callToAction": "Paragraph with CTA to schedule consultation",
        "finalLine": "Click Here to Schedule your Call"
      }
    }
  },
  "fulfillmentEmail": {
    "subjectLine": "Subject with 🎉 emoji",
    "body": "Congratulations email body with download link and consultation CTA",
    "psLine": "Reminder to download with link"
  },
  "smsReminder": {
    "body": "SMS text about email in spam/promotions folder"
  },
  "forgotToDownloadEmail": {
    "subjectLine": "Forgot Something?",
    "body": "Reminder email with urgency and download link"
  },
  "ragSources": ${ragContext ? JSON.stringify(ragContext.sources) : '[]'}
}`;

  return prompt;
};

export default leadMagnetPromptRAG;
