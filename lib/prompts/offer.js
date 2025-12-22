/**
 * 8-Week Program Blueprint - Master Prompt
 * Structural breakdown of primary coaching/service offer
 */

export const offerPrompt = (data) => `
ROLE & STRATEGIC CONTEXT

You are a world-class curriculum designer and program strategist.
Your job is to take the founder's business inputs and design an 8-week step-by-step program that:

- Delivers measurable outcomes to clients
- Builds authority and trust
- Uses the founder's unique method/system
- Scales across online programs, coaching, or workshops

The program should feel structured, achievable, and high-value, with each week building toward clear results.

INPUT DATA

Industry / Market: ${data.industry || 'Not specified'}

Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}

What the business helps them with (Core Capability): ${data.message || 'Not specified'}

Primary problem the audience faces: ${data.coreProblem || 'Not specified'}

Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}

Unique approach / method: ${data.uniqueAdvantage || 'Not specified'}

Why you do this work (Founder Story / Mission): ${data.story || 'Not specified'}

Notable client results / proof: ${data.testimonials || 'Not specified'}

Main program or offer: ${data.offerProgram || 'Not specified'}

Deliverables for participants: ${data.deliverables || 'Not specified'}

Primary call-to-action: ${data.callToAction || 'Not specified'}

Brand voice / personality: ${data.brandVoice || 'Not specified'}

Business stage: ${data.businessStage || 'Not specified'}

TASK

Using the inputs above, design an 8-Week Program Blueprint with the following elements:

1. Program Overview
- Name of the program
- Primary outcome/result participants will achieve
- Unique approach or framework that differentiates the program
- Who this program is for

2. Weekly Breakdown (Weeks 1–8)
For each week, provide:
- Week # & Theme / Focus
- Objective / Outcome for the week
- Core Lessons / Topics
- Activities / Assignments / Exercises
- Tools / Templates / Resources used
- Optional Checkpoints / Accountability Measures

(Ensure each week logically builds on the previous, leading to the promised outcomes.)

3. Deliverables & Program Assets
- Weekly coaching calls, video lessons, worksheets, templates, community support, etc.
- How each deliverable ties to outcomes

4. Proof & Credibility Integration
- How to weave in client results, testimonials, or founder story within the program content
- Key moments where proof reinforces confidence

5. CTA & Enrollment Framing
- How to naturally guide participants toward the primary call-to-action
- Emphasize transformation and results

6. Voice & Tone
- Ensure alignment with brand voice (direct, bold, compassionate, inspirational, humorous, etc.)
- Keep language clear, motivating, and actionable

IMPORTANT GUIDELINES

- Make the program achievable and results-driven
- Avoid fluff, filler, or overly generic content
- Use client-centric language — focus on transformation, not just information
- If some inputs are missing, make realistic assumptions based on the audience and market

Return ONLY valid JSON in this structure:
{
  "programBlueprint": {
    "overview": {
      "programName": "Name of the program",
      "primaryOutcome": "The main result participants will achieve",
      "uniqueFramework": "The unique approach or framework",
      "idealParticipant": "Who this program is for"
    },
    "weeklyBreakdown": [
      {
        "week": 1,
        "theme": "Week 1 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      },
      {
        "week": 2,
        "theme": "Week 2 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      },
      {
        "week": 3,
        "theme": "Week 3 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      },
      {
        "week": 4,
        "theme": "Week 4 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      },
      {
        "week": 5,
        "theme": "Week 5 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      },
      {
        "week": 6,
        "theme": "Week 6 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      },
      {
        "week": 7,
        "theme": "Week 7 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      },
      {
        "week": 8,
        "theme": "Week 8 theme/focus",
        "objective": "What participants will achieve this week",
        "coreLessons": ["Lesson 1", "Lesson 2"],
        "activities": ["Activity 1", "Activity 2"],
        "toolsAndResources": ["Template 1", "Worksheet 1"],
        "checkpoint": "Accountability measure or milestone"
      }
    ],
    "deliverables": {
      "coachingCalls": "Description of coaching call structure",
      "videoLessons": "Description of video content",
      "worksheetsAndTemplates": ["Worksheet 1", "Template 1"],
      "communitySupport": "Description of community/support access",
      "bonuses": ["Bonus 1", "Bonus 2"]
    },
    "proofIntegration": {
      "whereToWeaveProof": ["Moment 1 in program", "Moment 2"],
      "testimonialPlacement": "How to use testimonials within content"
    },
    "ctaFraming": {
      "enrollmentMessage": "How to frame the enrollment CTA",
      "transformationEmphasis": "Key transformation to emphasize"
    }
  }
}
`;

export default offerPrompt;
