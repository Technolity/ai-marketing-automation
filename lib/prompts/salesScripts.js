/**
 * Sales Scripts Generator
 * Creates Setter, Closer, and Objection Handling Scripts + Intake Questions
 */

export const salesScriptsPrompt = (data) => `
Create comprehensive sales scripts including setter script, closer script, objection handling, and intake questionnaire.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== PART 1: SETTER SCRIPT (For Discovery Calls) ===
Create a script that:
- Opens with rapport building
- Qualifies the prospect
- Uncovers pain points
- Generates desire for the solution
- Books them for the closer call

=== PART 2: CLOSER SCRIPT ===
Create a script that:
- Builds on the setter call
- Deepens pain awareness
- Presents the solution
- Handles objections
- Closes the sale

=== PART 3: OBJECTION HANDLING ===
Address these 3 main objections with powerful responses:

Objection 1: TIME
- "I don't have time for this"
Response: [Provide specific response that reframes time as investment]

Objection 2: MONEY
- "It's too expensive" / "I can't afford it"
Response: [Provide specific response about value vs cost]

Objection 3: NOT THE RIGHT TIME
- "Now's not the right time" / "I'll have to think about it"
Response: [Provide specific response creating urgency]

=== PART 4: INTAKE QUESTIONNAIRE ===
Rewrite the application questions to be professional and usable in a survey form.
Create 5-7 qualifying questions that filter for qualified leads.

Examples of question types:
- What is your current [situation]?
- What is your #1 goal for the next [timeframe]?
- What has prevented you from achieving this before?
- On a scale of 1-10, how committed are you to [outcome]?
- Are you ready to invest in [solution type]?

=== PART 5: UNIQUE SOLUTION SUMMARY ===
Summarize the key points of the unique solution that can be used in sales conversations.

Return ONLY valid JSON in this structure:
{
  "salesScripts": {
    "setterScript": {
      "opening": "Opening section with rapport building",
      "qualification": "Qualification questions section",
      "painDiscovery": "Pain uncovering section",
      "desireBuilding": "Desire building section",
      "bookingClose": "Transition to booking closer call",
      "fullScript": "Complete setter script"
    },
    "closerScript": {
      "opening": "Opening section",
      "painDeepening": "Pain deepening section",
      "solutionPresentation": "Solution presentation section",
      "objectionHandling": "Objection handling section",
      "close": "Closing section",
      "fullScript": "Complete closer script"
    },
    "objectionResponses": [
      {
        "objection": "Time - I don't have time",
        "response": "Powerful response to time objection"
      },
      {
        "objection": "Money - It's too expensive",
        "response": "Powerful response to money objection"
      },
      {
        "objection": "Not the right time - I need to think about it",
        "response": "Powerful response to timing objection"
      }
    ],
    "intakeQuestionnaire": [
      {
        "questionNumber": 1,
        "question": "Professional survey-ready question",
        "purpose": "What this question filters for"
      }
    ],
    "uniqueSolutionSummary": {
      "headline": "One-line headline",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "primaryBenefit": "Main benefit",
      "differentiator": "What makes it unique"
    }
  }
}
`;

export default salesScriptsPrompt;
