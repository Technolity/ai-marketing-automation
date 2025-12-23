/**
 * Signature Story - Deterministic Prompt
 * Personal origin story with Story Spine framework
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

TASK: Create a SIGNATURE STORY using the Story Spine framework.

Return ONLY valid JSON in this exact structure:
{
  "signatureStory": {
    "storySpine": {
      "lossOrStruggleMoment": "The specific painful moment or failure that started everything - be vivid and specific",
      "whatYouTried": "The failed attempts and approaches that didn't work - show the journey",
      "breakthrough": "The discovery or insight that changed everything - the aha moment",
      "resultFromBreakthrough": "What happened after implementing the breakthrough - your personal transformation",
      "lessonLearned": "The key teaching/principle that came from this experience"
    },
    "emotionalJourney": {
      "darkestMoment": "The lowest point - specific situation, how you felt, what you almost did",
      "turningPoint": "The exact moment things shifted - what triggered the change",
      "transformation": "How you changed as a person/professional - before vs after"
    },
    "credibilityMarkers": {
      "yearsOfExperience": "Specific number of years doing this work",
      "clientsHelped": "Number or type of clients served",
      "biggestWin": "Most impressive result or achievement",
      "uniqueCredential": "What qualifies you specifically to help"
    },
    "connectionToAudience": {
      "sharedStruggle": "How your story mirrors what your audience is experiencing",
      "whyYouUnderstand": "Why you truly get their pain",
      "whyYouCare": "The deeper reason you're passionate about helping them"
    },
    "missionStatement": {
      "mission": "Your purpose beyond making money",
      "whyItMatters": "Why this work is important to you",
      "whatYoureBuilding": "The bigger vision you're working toward"
    },
    "clientProof": [
      {
        "clientType": "The type of client (industry, role, situation)",
        "beforeState": "Where they were struggling - specific and vivid",
        "afterState": "The result they achieved - with numbers if possible",
        "timeframe": "How long it took",
        "keyQuote": "A specific thing they said or would say"
      },
      {
        "clientType": "Second client example",
        "beforeState": "Their starting point",
        "afterState": "Their transformation",
        "timeframe": "Timeline",
        "keyQuote": "Their words"
      }
    ],
    "fullStoryScript": "Write the complete signature story in first person as a flowing narrative. This should be 400-600 words, ready to use in a VSL or sales page. Start with the struggle, move through the failed attempts, hit the breakthrough, show the transformation, connect to why you help others now, and end with a call to action. NO HEADINGS. NO BULLET POINTS. Just the story, word for word, ready to read.",
    "shortVersion": "A 100-150 word condensed version of the story for social media bios, podcast intros, or quick pitches. Same flow, just tighter.",
    "oneSentenceVersion": "The entire story condensed into one powerful sentence."
  }
}
`;

export default storyPrompt;
