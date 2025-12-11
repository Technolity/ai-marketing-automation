/**
 * Offer/Program Blueprint Generator
 * Creates 8-Week Program with Steps to Success
 */

export const offerPrompt = (data) => `
Create a comprehensive program blueprint and offer structure.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== STEPS TO SUCCESS ===
Based on the program information, create the Steps to Success blueprint.

For each step, provide:
1. Step Number
2. Step Title (3-5 words)
3. One sentence description of what happens in this step
4. One sentence highlighting the benefit/result client experiences

Create 4-8 steps depending on the complexity of the program.

=== 8-WEEK PROGRAM STRUCTURE ===
Create a detailed 8-week program breakdown:

Week 1: Foundation/Getting Started
Week 2: Core Concept 1
Week 3: Core Concept 2
Week 4: Implementation
Week 5: Core Concept 3
Week 6: Core Concept 4
Week 7: Advanced Application
Week 8: Integration & Launch

For each week include:
- Theme/Title
- Main topic covered
- Deliverables (calls, materials, etc.)
- Homework/Action items
- Expected outcome

=== OFFER STRUCTURE ===
Create the irresistible offer package:

1. Core Program Value
2. Bonus Items (3-5 bonuses)
3. Guarantee/Risk Reversal
4. Pricing Strategy (if applicable)
5. Payment Options

=== CTA OUTCOMES ===
Define the 3 outcomes promised on the consultation call:

Outcome 1: We'll get clear about your #1 visionary goal
Outcome 2: We'll uncover the primary obstacle keeping you from reaching your vision
Outcome 3: We'll create a strategic plan and path forward to overcome that obstacle

Return ONLY valid JSON in this structure:
{
  "programBlueprint": {
    "stepsToSuccess": [
      {
        "stepNumber": 1,
        "title": "3-5 word title",
        "description": "One sentence description",
        "benefit": "One sentence benefit"
      }
    ],
    "weekByWeek": [
      {
        "week": 1,
        "theme": "Week theme",
        "mainTopic": "What's covered",
        "deliverables": ["Deliverable 1", "Deliverable 2"],
        "homework": "Action items",
        "expectedOutcome": "What they'll achieve"
      }
    ],
    "offerStructure": {
      "coreProgramName": "Program name",
      "coreProgramDescription": "What the core program includes",
      "bonuses": [
        {
          "name": "Bonus name",
          "description": "What it includes",
          "value": "Perceived value"
        }
      ],
      "guarantee": {
        "type": "Money-back/Results guarantee",
        "duration": "30 days/60 days/etc",
        "description": "Full guarantee language"
      },
      "pricingOptions": [
        {
          "tier": "Standard/Premium/VIP",
          "price": "$X,XXX",
          "includes": ["Item 1", "Item 2"]
        }
      ]
    },
    "consultationOutcomes": {
      "outcome1": "Get clear about #1 visionary goal",
      "outcome2": "Uncover primary obstacle",
      "outcome3": "Create strategic plan forward"
    },
    "uniqueSolution": {
      "name": "Solution name",
      "description": "What makes it unique",
      "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"]
    }
  }
}
`;

export default offerPrompt;
