/**
 * Lead Magnet Generator (Free Gift/Workbook)
 * Creates a 5-page workbook from VSL tips
 */

export const leadMagnetPrompt = (data) => `
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

=== PAGES 2-4: TIP PAGES (One per tip) ===
For each tip page, include:
1. A compelling title for the tip
2. A three-sentence description of the tip
3. Three bullet point benefits for applying the tip
   - Each bullet should have a two-sentence description/clarification
4. A reflection/application question about the personal benefits of applying that tip

=== PAGE 5: CONCLUSION PAGE ===
- Include a robust, inspiring, and motivating summary
- A short paragraph with a call to action to schedule a consultation call
- Use the consultation call name from the VSL
- Final paragraph (center justified): "Click Here to Schedule your Call"

=== TITLE OPTIONS ===
Provide 6 marketable titles for this workbook:
- 2 humorous titles
- 2 controversial titles  
- 2 professional titles

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
  }
}
`;

export default leadMagnetPrompt;
