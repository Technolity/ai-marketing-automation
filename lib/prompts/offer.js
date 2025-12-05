/**
 * 8-Week Program/Offer Generator
 * From prompts.txt Steps to Success framework
 */

export const offerPrompt = (data) => `
Create the Irresistible Offer - an 8-week program structure and compelling offer stack.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

Steps to Success from Questionnaire:
Use the steps the program uses to deliver results (The Program's Blueprint)

Create:
1. Complete program structure with weekly breakdown
2. Compelling offer stack with bonuses
3. Pricing strategy
4. Guarantee structure
5. Urgency elements

Return ONLY valid JSON in this exact structure:
{
  "offer": {
    "programName": "Catchy program name",
    "tagline": "Program tagline",
    "overview": "2-3 sentence program description",
    "duration": "8 weeks",
    "deliveryMethod": "How it's delivered",
    "weeklyBreakdown": [
      {
        "week": 1,
        "title": "Week 1 Title",
        "focus": "Main focus of the week",
        "outcomes": ["Outcome 1", "Outcome 2"],
        "deliverables": ["What they get this week"]
      },
      {
        "week": 2,
        "title": "Week 2 Title",
        "focus": "",
        "outcomes": [],
        "deliverables": []
      },
      {
        "week": 3,
        "title": "Week 3 Title",
        "focus": "",
        "outcomes": [],
        "deliverables": []
      },
      {
        "week": 4,
        "title": "Week 4 Title",
        "focus": "",
        "outcomes": [],
        "deliverables": []
      },
      {
        "week": 5,
        "title": "Week 5 Title",
        "focus": "",
        "outcomes": [],
        "deliverables": []
      },
      {
        "week": 6,
        "title": "Week 6 Title",
        "focus": "",
        "outcomes": [],
        "deliverables": []
      },
      {
        "week": 7,
        "title": "Week 7 Title",
        "focus": "",
        "outcomes": [],
        "deliverables": []
      },
      {
        "week": 8,
        "title": "Week 8 Title",
        "focus": "",
        "outcomes": [],
        "deliverables": []
      }
    ],
    "coreFeatures": [
      {
        "feature": "Feature name",
        "description": "What it is",
        "benefit": "Why it matters",
        "value": "Perceived value"
      }
    ],
    "bonuses": [
      {
        "name": "Bonus name",
        "description": "What it is",
        "value": "$XXX value",
        "whyIncluded": "Why they get it"
      }
    ],
    "pricing": {
      "investmentAmount": "Price",
      "paymentOptions": ["Pay in full", "Payment plan"],
      "valueStack": "Total value of everything",
      "savings": "What they save"
    },
    "guarantee": {
      "type": "Money-back / Results guarantee",
      "duration": "30 days / 60 days",
      "terms": "What's required",
      "riskReversal": "Why it's risk-free"
    },
    "urgency": {
      "scarcity": "Limited spots / Limited time",
      "deadline": "When offer expires",
      "consequence": "What happens if they wait"
    },
    "callToAction": {
      "primaryCTA": "Main action",
      "consultationName": "Branded consultation name",
      "nextStep": "What happens after they click"
    }
  }
}
`;

export default offerPrompt;
