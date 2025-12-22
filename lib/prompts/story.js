/**
 * Signature Story - Master Prompt
 * Personal origin story crafted for maximum trust and connection
 */

export const storyPrompt = (data) => `
ROLE & STRATEGIC CONTEXT

You are a master storyteller, brand strategist, and direct-response copywriter.
Your job is to take the founder's personal and business inputs below and craft a Signature Story that:

- Builds trust instantly
- Creates emotional connection with the audience
- Highlights the founder's credibility and mission
- Positions the offer as the natural solution to the audience's problem

The story should feel authentic, relatable, and inspiring, not generic or overly salesy.

INPUT DATA

Industry / Market: ${data.industry || 'Not specified'}

Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}

What you help them with (Core Capability): ${data.message || 'Not specified'}

The main problem your audience faces: ${data.coreProblem || 'Not specified'}

Specific results your audience wants: ${data.outcomes || 'Not specified'}

Your unique approach / method: ${data.uniqueAdvantage || 'Not specified'}

Why you do this work (personal story / mission): ${data.story || 'Not specified'}

Notable client results / proof: ${data.testimonials || 'Not specified'}

Your main program or offer: ${data.offerProgram || 'Not specified'}

Primary call-to-action: ${data.callToAction || 'Not specified'}

Brand voice / personality: ${data.brandVoice || 'Not specified'}

Current business stage: ${data.businessStage || 'Not specified'}

TASK

Using the inputs above, craft a Signature Story that includes the following elements:

1. The Origin Moment
- The defining personal or professional experience that led the founder to this mission
- Highlight a relatable struggle, pain point, or turning point

2. The Emotional Struggle
- The obstacles, fears, or frustrations the founder faced
- Show vulnerability and authenticity
- Connect these struggles to the audience's own pain

3. The Discovery / Breakthrough
- How the founder found a solution
- The unique method, approach, or insight that changed everything
- Position it as relatable and learnable, not mystical

4. The Mission & "Why"
- Why the founder now helps this audience
- The deeper purpose beyond money or status
- Show authenticity, empathy, and authority

5. Client Proof / Results
- Include 1–3 notable client wins or successes
- Demonstrate that the method works in the real world

6. The Call-to-Action Tie-In
- Transition from story to the audience's next step naturally
- Show how joining the program, service, or community continues the transformation

7. Voice & Tone
- Keep story aligned with brand voice (direct, bold, compassionate, humorous, etc.)
- Maintain readability and emotional resonance

IMPORTANT GUIDELINES

- Do not be generic or overly motivational
- Avoid fluff or "guru speak"
- Focus on human relatability, credibility, and audience connection
- If some inputs are missing, make smart, realistic assumptions based on the audience and market

Return ONLY valid JSON in this structure:
{
  "signatureStory": {
    "originMoment": {
      "definingExperience": "The defining personal or professional experience",
      "relatableStruggle": "The relatable struggle, pain point, or turning point"
    },
    "emotionalStruggle": {
      "obstacles": ["Obstacle 1", "Obstacle 2"],
      "fears": ["Fear 1", "Fear 2"],
      "vulnerabilityMoment": "A moment of vulnerability and authenticity",
      "connectionToAudience": "How these struggles connect to the audience's pain"
    },
    "discoveryBreakthrough": {
      "howTheySolvedIt": "How the founder found a solution",
      "uniqueInsight": "The unique method, approach, or insight that changed everything",
      "whyItsLearnable": "Why it's relatable and learnable, not mystical"
    },
    "missionAndWhy": {
      "whyTheyHelp": "Why the founder now helps this audience",
      "deeperPurpose": "The deeper purpose beyond money or status",
      "authenticityMarkers": ["Authenticity marker 1", "Authenticity marker 2"]
    },
    "clientProof": [
      {
        "clientDescription": "Brief description of client",
        "challenge": "What they struggled with",
        "result": "What they achieved"
      },
      {
        "clientDescription": "Brief description of client 2",
        "challenge": "What they struggled with",
        "result": "What they achieved"
      }
    ],
    "ctaTieIn": {
      "transitionStatement": "Natural transition from story to audience's next step",
      "transformationContinuation": "How joining continues the transformation"
    },
    "fullStoryScript": "The complete signature story written in first person, flowing naturally from origin to CTA. This should be 400-600 words, compelling, and ready to use on a sales page or VSL.",
    "shortVersion": "A 100-150 word condensed version for social media or quick pitches"
  }
}
`;

export default storyPrompt;
