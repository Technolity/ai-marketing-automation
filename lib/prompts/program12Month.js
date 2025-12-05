/**
 * 12-Month Program Blueprint Generator
 */

export const program12MonthPrompt = (data) => `
Create a comprehensive 12-month program blueprint for scaling and transformation.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Design a program that:
- Builds progressively over 12 months
- Includes clear milestones and outcomes
- Provides ongoing support structure
- Creates long-term client success

Return ONLY valid JSON in this exact structure:
{
  "program12Month": {
    "programName": "Premium program name",
    "tagline": "Compelling tagline",
    "overview": "Program description",
    "yearlyGoal": "Primary transformation by end of year",
    "quarters": [
      {
        "quarter": 1,
        "theme": "Quarter theme",
        "focus": "Primary focus",
        "months": [
          {
            "month": 1,
            "title": "Month 1 Title",
            "objectives": [],
            "deliverables": [],
            "milestones": []
          }
        ],
        "quarterOutcome": "Expected outcome by end of quarter"
      }
    ],
    "supportStructure": {
      "groupCalls": "Weekly/Monthly call structure",
      "oneOnOne": "1:1 sessions included",
      "community": "Community access details",
      "resources": ["Resource 1", "Resource 2"]
    },
    "pricing": {
      "investment": "Annual investment",
      "paymentOptions": [],
      "valueProposition": "Total value delivered"
    }
  }
}
`;

export default program12MonthPrompt;
