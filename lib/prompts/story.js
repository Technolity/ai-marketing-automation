/**
 * Signature Story - Deterministic Prompt
 * 7-Section story framework for authentic brand positioning
 * 
 * CRITICAL: This generates REAL business content, not examples
 */

export const storyPrompt = (data) => `
You are generating the ACTUAL Signature Story for a real business founder.

THIS IS NOT AN EXAMPLE. This is the REAL story that will be used:
- In the VSL script
- On the About page
- In ad campaigns
- During sales calls
- In email sequences
- For authority positioning

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "e.g."
2. Use the founder's ACTUAL story from the inputs
3. Every field must contain REAL, usable narrative - not templates
4. Write AS IF you ARE the founder telling YOUR story
5. Output MUST be valid JSON - no markdown, no explanations
6. Keep story aligned with brand voice
7. Maintain readability and emotional resonance

INPUT DATA (Use this to craft the real story):

Industry / Market: ${data.industry || 'Not specified'}
Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}
What you help them with: ${data.message || 'Not specified'}
The main problem your audience faces: ${data.coreProblem || 'Not specified'}
Specific results your audience wants: ${data.outcomes || 'Not specified'}
Your unique approach / method: ${data.uniqueAdvantage || 'Not specified'}
Why you do this work (personal story / mission): ${data.story || 'Not specified'}
Notable client results / proof: ${data.testimonials || 'Not specified'}
Your main program or offer: ${data.offerProgram || 'Not specified'}
Primary call-to-action: ${data.callToAction || 'Not specified'}
Brand voice / personality: ${data.brandVoice || 'Not specified'}
Current business stage: ${data.businessStage || 'Not specified'}

TASK: Create a SIGNATURE STORY with exactly 7 sections. Every field must have real, compelling content.

Return ONLY valid JSON in this exact structure:
{
  "signatureStory": {
    "originMoment": {
      "definingExperience": "The defining personal or professional experience that led to this mission - be vivid and specific",
      "relatableStruggle": "The struggle, pain point, or challenge that makes this relatable",
      "turningPoint": "The specific moment or event that changed everything"
    },
    
    "emotionalStruggle": {
      "obstaclesFaced": [
        "Specific obstacle #1 the founder had to overcome",
        "Specific obstacle #2 that created frustration",
        "Specific obstacle #3 that nearly stopped progress"
      ],
      "fearsAndDoubts": [
        "Fear #1 that haunted the journey",
        "Doubt #2 that crept in during hard times"
      ],
      "connectionToAudience": "How these struggles mirror what the audience experiences today"
    },
    
    "discoveryBreakthrough": {
      "howSolutionWasFound": "The story of how the founder discovered the solution",
      "uniqueInsight": "The unique method, approach, or insight that changed everything",
      "whyItsLearnable": "Why this breakthrough is relatable and learnable, not mystical or exclusive"
    },
    
    "missionAndWhy": {
      "whyYouHelp": "Why the founder now dedicates themselves to helping this audience",
      "deeperPurpose": "The purpose beyond money or status - the real driving force",
      "authenticityMarkers": [
        "Authenticity signal #1 that shows genuine care",
        "Authenticity signal #2 that demonstrates empathy",
        "Authority marker #1 that establishes credibility"
      ]
    },
    
    "clientProofResults": {
      "clientWin1": {
        "clientType": "Type of client (industry, role, situation)",
        "challenge": "What they were struggling with before",
        "result": "The transformation or result achieved",
        "timeframe": "How long it took"
      },
      "clientWin2": {
        "clientType": "Second client example",
        "challenge": "Their starting challenge",
        "result": "Their outcome",
        "timeframe": "Timeline to results"
      },
      "clientWin3": {
        "clientType": "Third client example",
        "challenge": "The problem they faced",
        "result": "What they achieved",
        "timeframe": "Time to achieve"
      }
    },
    
    "ctaTieIn": {
      "naturalTransition": "How to transition from story to the audience's next step naturally",
      "nextStepInvitation": "The invitation to join the program, service, or community",
      "continuingTransformation": "How taking action continues the transformation story"
    },
    
    "voiceAndTone": {
      "brandVoiceDescription": "Description of the brand voice (direct, bold, compassionate, humorous, etc.)",
      "emotionalTone": "The emotional tone to maintain throughout the story",
      "fullStoryScript": "The complete signature story as a flowing first-person narrative (400-600 words). Start with the origin struggle, move through the emotional challenges, hit the breakthrough, show the transformation, connect to why you help others now. Ready to use in a VSL or sales page.",
      "shortVersion": "100-150 word condensed version for social media, podcast intros, or quick pitches",
      "oneSentence": "The entire story condensed into one powerful sentence"
    }
  }
}
`;

export default storyPrompt;
