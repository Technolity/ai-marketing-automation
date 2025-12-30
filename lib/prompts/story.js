/**
 * Story Prompt - Signature Story Framework
 * 
 * PURPOSE: Create a Signature Story that builds trust, emotional connection, 
 * and credibility — showing the founder's transformation in a way the audience 
 * sees themselves in — and positioning the offer as the natural next step.
 * 
 * FRAMEWORK (6 Phases):
 * 1. The Pit – stuck / lowest point
 * 2. The Search – what they tried, what failed
 * 3. The Drop – second low / wake-up call
 * 4. Search Again – new insight, decision, or shift
 * 5. The Breakthrough – key realization + new approach
 * 6. The Outcome – personal + professional results, and who they now help
 */

export const storyPrompt = (data) => `
You are creating the ACTUAL Signature Story for a real business founder.

PURPOSE:
Create a Signature Story that builds trust, emotional connection, and credibility — showing the founder's transformation in a way the audience sees themselves in — and positioning the offer as the natural next step (without sounding salesy).

Tone: real, specific, lived-in. No motivation fluff.

===== STORY FRAMEWORK (NON-NEGOTIABLE) =====

Structure every version using the same 6 phases:
1. The Pit – stuck / lowest point
2. The Search – what they tried, what failed
3. The Drop – second low / wake-up call
4. Search Again – new insight, decision, or shift
5. The Breakthrough – key realization + new approach
6. The Outcome – personal + professional results, and who they now help

This is ONE story, adapted to different lengths.

===== INPUT DATA (SOURCE OF TRUTH) =====

Industry / Market: ${data.industry || '[DETAIL NEEDED]'}
Ideal Client: ${data.idealClient || '[DETAIL NEEDED]'}
Core capability (what you help with): ${data.message || '[DETAIL NEEDED]'}
Core problem the audience faces: ${data.coreProblem || '[DETAIL NEEDED]'}
Desired outcomes: ${data.outcomes || '[DETAIL NEEDED]'}
Unique approach / method: ${data.uniqueAdvantage || '[DETAIL NEEDED]'}
Founder's turning point / mission (Source Data):
- The Pit (Low Moment): ${data.storyLowMoment || '[DETAIL NEEDED]'}
- The Search (Discovery): ${data.storyDiscovery || '[DETAIL NEEDED]'}
- The Breakthrough: ${data.storyBreakthrough || '[DETAIL NEEDED]'}
- The Outcome: ${data.storyResults || '[DETAIL NEEDED]'}
Proof or client results (if any): ${data.testimonials || 'Not provided'}
Main offer or program: ${data.offerProgram || '[DETAIL NEEDED]'}
Primary CTA: ${data.callToAction || '[DETAIL NEEDED]'}
Brand voice: ${data.brandVoice || 'Not specified'}
Business stage: ${data.businessStage || 'Not specified'}

===== TASK SEQUENCE =====

1. Build the Story Blueprint - Map inputs into the 6 story phases (chronological, concrete)
2. Extract the Core Lesson - 1-2 sentences covering: Old belief → New belief → Truth the audience needs to hear
3. Write the Story in Multiple Formats - Adapt the same story to each format

===== STORY RULES (NON-NEGOTIABLE) =====

- Be specific (real moments, not vague struggle)
- Vulnerable but purposeful (no trauma dumping)
- No guru clichés
- Mirror the audience's pain
- Show credibility through details and results
- Make the method the hero
- CTA must feel like the natural next step
- NO RÉSUMÉ RULE: This is one emotional journey — not a list of achievements

===== OUTPUT FORMAT (STRICT JSON) =====

Return ONLY valid JSON with this exact structure:

{
  "signatureStory": {
    "storyBlueprint": {
      "thePit": "Stuck / lowest point moment - specific and concrete",
      "theSearch": "What they tried, what failed",
      "theDrop": "Second low / wake-up call moment",
      "searchAgain": "New insight, decision, or shift",
      "theBreakthrough": "Key realization + new approach discovered",
      "theOutcome": "Personal + professional results, and who they now help"
    },
    "coreLessonExtracted": "1-2 sentences: Old belief → New belief → Truth the audience needs to hear",
    "networkingStory": "60-90 second version. Fast, conversational. 1-2 sentences per phase. Ends with: Now I help [Ideal Client] achieve [Outcome] using [Unique Advantage].",
    "stageStory": "3-5 minute version. Cinematic, emotional, detailed. Includes 1-2 strong lesson lines. Ends with soft bridge to offer + CTA.",
    "oneLinerStory": "15-25 second version. Pit → breakthrough → outcome (compressed). Ends with what they now help people do.",
    "socialPostVersion": "150-220 words. Hook → pit → breakthrough → lesson. End with an engagement question (not a pitch).",
    "emailStory": {
      "subjectLine": "Compelling email subject line",
      "body": "200-350 words. Compressed arc. Soft CTA tied to the primary call-to-action."
    },
    "pullQuotes": [
      "Quotable line 1 from the story",
      "Quotable line 2 from the story",
      "Quotable line 3 from the story",
      "Quotable line 4 from the story",
      "Quotable line 5 from the story"
    ]
  }
}

===== HARD LIMITS =====

- No placeholder text like "[insert]" — use real content from inputs
- No motivation fluff or guru clichés
- No markdown formatting — pure JSON only
- Each format must follow the same 6-phase structure, just compressed differently
- Pull quotes must be specific and quotable, not generic
`;

export default storyPrompt;
