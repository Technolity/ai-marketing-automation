/**
 * 8-Week Program Blueprint - Deterministic Prompt
 * 6-Section comprehensive program structure
 * 
 * CRITICAL: This generates REAL business content, not examples
 */

export const offerPrompt = (data) => `
You are generating the ACTUAL 8-Week Program Blueprint for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL program structure that will be used:
- On the sales page
- In the VSL script
- In sales conversations
- For client onboarding
- In marketing materials

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "e.g."
2. Use the business's ACTUAL offer and deliverables from the inputs
3. Every field must contain REAL, usable content - not templates
4. Write AS IF you ARE the business owner describing YOUR program
5. Output MUST be valid JSON - no markdown, no explanations
6. Ensure each week logically builds on the previous, leading to promised outcomes

INPUT DATA (Use this to create the real program):

Industry / Market: ${data.industry || 'Not specified'}
Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}
What the business helps them with: ${data.message || 'Not specified'}
Primary problem the audience faces: ${data.coreProblem || 'Not specified'}
Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}
Unique approach / method: ${data.uniqueAdvantage || 'Not specified'}
Why you do this work (Founder Story): ${data.story || 'Not specified'}
Notable client results / proof: ${data.testimonials || 'Not specified'}
Main program or offer: ${data.offerProgram || 'Not specified'}
Deliverables for participants: ${data.deliverables || 'Not specified'}
Pricing: ${data.pricing || 'Not specified'}
Primary call-to-action: ${data.callToAction || 'Not specified'}
Brand voice / personality: ${data.brandVoice || 'Not specified'}
Business stage: ${data.businessStage || 'Not specified'}

TASK: Create a comprehensive 8-WEEK PROGRAM BLUEPRINT with exactly 6 sections.

Return ONLY valid JSON in this exact structure:
{
  "programBlueprint": {
    "programOverview": {
      "programName": "The official name of the program",
      "primaryOutcome": "The main result participants will achieve by completing this program",
      "uniqueFramework": "The unique approach or framework that differentiates this program",
      "whoItsFor": "Specific description of who this program is designed for"
    },
    
    "weeklyBreakdown": {
      "week1": {
        "theme": "Week 1 theme or focus area",
        "objective": "The specific outcome for this week",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Activity or exercise #1",
          "Assignment #2"
        ],
        "toolsResources": ["Template or resource provided"],
        "checkpoint": "Accountability measure or milestone"
      },
      "week2": {
        "theme": "Week 2 theme building on Week 1",
        "objective": "The specific outcome for this week",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Activity or exercise #1",
          "Assignment #2"
        ],
        "toolsResources": ["Template or resource provided"],
        "checkpoint": "Accountability measure or milestone"
      },
      "week3": {
        "theme": "Week 3 theme building on previous weeks",
        "objective": "The specific outcome for this week",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Activity or exercise #1",
          "Assignment #2"
        ],
        "toolsResources": ["Template or resource provided"],
        "checkpoint": "Accountability measure or milestone"
      },
      "week4": {
        "theme": "Week 4 theme - halfway point",
        "objective": "The specific outcome for this week",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Activity or exercise #1",
          "Assignment #2"
        ],
        "toolsResources": ["Template or resource provided"],
        "checkpoint": "Accountability measure or milestone"
      },
      "week5": {
        "theme": "Week 5 theme building momentum",
        "objective": "The specific outcome for this week",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Activity or exercise #1",
          "Assignment #2"
        ],
        "toolsResources": ["Template or resource provided"],
        "checkpoint": "Accountability measure or milestone"
      },
      "week6": {
        "theme": "Week 6 theme advancing toward completion",
        "objective": "The specific outcome for this week",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Activity or exercise #1",
          "Assignment #2"
        ],
        "toolsResources": ["Template or resource provided"],
        "checkpoint": "Accountability measure or milestone"
      },
      "week7": {
        "theme": "Week 7 theme - refinement and optimization",
        "objective": "The specific outcome for this week",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Activity or exercise #1",
          "Assignment #2"
        ],
        "toolsResources": ["Template or resource provided"],
        "checkpoint": "Accountability measure or milestone"
      },
      "week8": {
        "theme": "Week 8 theme - completion and launch",
        "objective": "The final outcome and transformation achieved",
        "coreLessons": [
          "Core lesson/topic #1",
          "Core lesson/topic #2",
          "Core lesson/topic #3"
        ],
        "activities": [
          "Final activity or exercise #1",
          "Celebration and next steps #2"
        ],
        "toolsResources": ["Final templates and resources"],
        "checkpoint": "Final accountability measure and graduation"
      }
    },
    
    "deliverablesAssets": {
      "coreDeliverables": [
        {
          "item": "Deliverable #1 (e.g., Weekly coaching calls)",
          "description": "What this includes and how it helps",
          "outcomeTied": "How this directly leads to results"
        },
        {
          "item": "Deliverable #2 (e.g., Video lessons)",
          "description": "What this includes and how it helps",
          "outcomeTied": "How this directly leads to results"
        },
        {
          "item": "Deliverable #3 (e.g., Worksheets/templates)",
          "description": "What this includes and how it helps",
          "outcomeTied": "How this directly leads to results"
        },
        {
          "item": "Deliverable #4 (e.g., Community access)",
          "description": "What this includes and how it helps",
          "outcomeTied": "How this directly leads to results"
        }
      ],
      "bonusAssets": [
        {
          "item": "Bonus #1",
          "description": "What this bonus provides",
          "value": "Why it's valuable"
        },
        {
          "item": "Bonus #2",
          "description": "What this bonus provides",
          "value": "Why it's valuable"
        }
      ]
    },
    
    "proofCredibilityIntegration": {
      "howToWeaveInProof": "Strategy for integrating client results and testimonials throughout the program content",
      "keyProofMoments": [
        "Moment #1 where proof reinforces confidence (e.g., after Week 2)",
        "Moment #2 for proof integration (e.g., mid-program)",
        "Moment #3 for final proof push (e.g., during enrollment)"
      ],
      "founderStoryTouchpoints": [
        "Where to reference founder story #1",
        "Where to connect personal experience #2"
      ]
    },
    
    "ctaEnrollmentFraming": {
      "naturalGuidance": "How to naturally guide participants toward the primary call-to-action",
      "transformationEmphasis": "The transformation and results to emphasize during enrollment",
      "primaryCta": "The specific call-to-action",
      "urgencyElement": "The authentic reason to act now"
    },
    
    "programVoiceTone": {
      "voiceDescription": "Description of brand voice (direct, bold, compassionate, inspirational, etc.)",
      "languageGuidelines": [
        "Guideline #1 for maintaining consistent voice",
        "Guideline #2 for keeping language motivating",
        "Guideline #3 for ensuring actionability"
      ],
      "toneForDifferentMoments": {
        "teaching": "Tone to use during lessons and content",
        "motivating": "Tone to use when pushing participants forward",
        "celebrating": "Tone to use when acknowledging wins"
      }
    }
  }
}
`;

export default offerPrompt;
