/**
 * Ideal Client Profile Generator
 * Based on Client Branding Questionnaire from prompts.txt
 */

export const idealClientPrompt = (data) => `
Create a comprehensive Ideal Client Profile based on the client branding questionnaire answers.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

QUESTIONNAIRE ELEMENTS TO ANALYZE:

**Demographics:**
- Age
- Career
- Income
- Sex
- Married
- Kids

**Pain Points Analysis:**
- Three main pain points related to the product
- How these problems affect: personal life, income, career, and wellbeing (drive the knife in)

**Desired Outcomes:**
- Three main outcomes or benefits they want
- How outcomes would impact: personal life, income, career, wellbeing (paint the transformation)

**Personal Style:**
- Is the brand funny, professional, inspiring, dramatic, or a combination?

**Unique Solution:**
- What unique solution is being sold?

**Client Success Stories:**
- Three client success stories for social proof

**Industry Experts:**
- Any industry expert endorsements?

Return ONLY valid JSON in this exact structure:
{
  "idealClient": {
    "demographics": {
      "ageRange": "e.g., 35-55",
      "primaryCareer": "e.g., Business Owner, Executive",
      "incomeLevel": "e.g., $150k-$500k+",
      "gender": "Male/Female/Both",
      "maritalStatus": "Married/Single/Both",
      "hasChildren": "Yes/No/Both",
      "summary": "2-3 sentence demographic summary"
    },
    "psychographics": {
      "values": ["Value 1", "Value 2", "Value 3"],
      "aspirations": ["Aspiration 1", "Aspiration 2"],
      "fears": ["Fear 1", "Fear 2"],
      "frustrations": ["Frustration 1", "Frustration 2"],
      "personalityTraits": ["Trait 1", "Trait 2"]
    },
    "painPoints": {
      "primary": {
        "pain": "Main pain point",
        "personalLifeImpact": "How it affects personal life",
        "incomeImpact": "How it affects income",
        "careerImpact": "How it affects career",
        "wellbeingImpact": "How it affects wellbeing"
      },
      "secondary": {
        "pain": "Second pain point",
        "personalLifeImpact": "",
        "incomeImpact": "",
        "careerImpact": "",
        "wellbeingImpact": ""
      },
      "tertiary": {
        "pain": "Third pain point",
        "personalLifeImpact": "",
        "incomeImpact": "",
        "careerImpact": "",
        "wellbeingImpact": ""
      },
      "knifeStatement": "Powerful emotional statement that 'drives the knife in' on their pain"
    },
    "desiredOutcomes": {
      "primary": {
        "outcome": "Main outcome they want",
        "personalLifeImpact": "How it transforms personal life",
        "incomeImpact": "How it transforms income",
        "careerImpact": "How it transforms career",
        "wellbeingImpact": "How it transforms wellbeing"
      },
      "secondary": {
        "outcome": "",
        "transformations": ""
      },
      "tertiary": {
        "outcome": "",
        "transformations": ""
      },
      "transformationStatement": "Powerful emotional statement painting the transformation"
    },
    "brandVoice": {
      "primaryStyle": "Funny/Professional/Inspiring/Dramatic",
      "toneGuidelines": ["Guideline 1", "Guideline 2"],
      "wordsToUse": ["Word 1", "Word 2"],
      "wordsToAvoid": ["Word 1", "Word 2"]
    },
    "uniqueSolution": {
      "name": "Name of the solution",
      "description": "What makes it unique",
      "keyDifferentiators": ["Differentiator 1", "Differentiator 2"]
    },
    "socialProof": {
      "clientSuccessStories": [
        {
          "clientName": "",
          "businessType": "",
          "challenge": "",
          "solution": "",
          "result": "",
          "quote": ""
        }
      ],
      "expertEndorsements": ["Expert 1", "Expert 2"]
    },
    "avatar": {
      "name": "Give them a name (e.g., 'Successful Sarah')",
      "backstory": "2-3 sentence backstory",
      "dayInTheLife": "What their typical frustrated day looks like",
      "dreamFuture": "What their ideal future looks like after transformation"
    }
  }
}
`;

export default idealClientPrompt;
