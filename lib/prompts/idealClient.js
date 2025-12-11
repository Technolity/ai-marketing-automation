/**
 * Ideal Client Profile Generator
 * Based on Client Branding Questionnaire
 */

export const idealClientPrompt = (data) => `
Create a comprehensive Ideal Client Profile based on the client branding questionnaire answers.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

=== SECTION 1: DEMOGRAPHICS ===
Based on the client information, define:
- Age range
- Career/profession
- Income level
- Gender
- Marital status
- Children

=== SECTION 2: PERSONAL STYLE ===
Determine the brand voice:
- Is it funny, professional, inspiring, dramatic, or combination?

=== SECTION 3: PAIN POINTS ANALYSIS ===
Identify 3 main pain points related to the product:
For each pain point, analyze how it affects:
- Personal life
- Income
- Career
- Wellbeing
Create a powerful "knife statement" that drives deep into their pain

=== SECTION 4: DESIRED OUTCOMES ===
Identify 3 main outcomes/benefits they want:
For each outcome, analyze how it would impact:
- Personal life
- Income
- Career
- Wellbeing
Create a powerful "transformation statement" painting the after picture

=== SECTION 5: UNIQUE SOLUTION ===
Define what unique solution is being sold

=== SECTION 6: SOCIAL PROOF ===
Format 3 client success stories for testimonials
Include any industry expert endorsements

=== SECTION 7: AVATAR CREATION ===
Give the ideal client:
- A name (e.g., "Successful Sarah")
- A backstory
- A "day in the life" (frustrated state)
- A "dream future" (after transformation)

Return ONLY valid JSON in this structure:
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
  },
  "testimonials": [
    {
      "clientName": "Name",
      "businessName": "Business if provided",
      "endorsement": "Two sentence endorsement using only provided info"
    }
  ]
}
`;

export default idealClientPrompt;
