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
Create Signature Story using 6 phases. Build trust, emotional connection, credibility. Real, specific, no fluff.

6 PHASES (use in all formats):
1. Pit – lowest point
2. Search – what tried/failed
3. Drop – wake-up call
4. Search Again – new insight/shift
5. Breakthrough – key realization
6. Outcome – results + who they help now

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
STORY: Pit=${data.storyLowMoment || 'NS'} | Discovery=${data.storyDiscovery || 'NS'} | Breakthrough=${data.storyBreakthrough || 'NS'} | Results=${data.storyResults || 'NS'}
CTA: ${data.callToAction || 'NS'}

RULES:
• Specific moments (not vague struggle)
• Vulnerable but purposeful (no trauma dumping)
• No guru clichés
• Mirror audience pain
• Method is the hero
• NO RÉSUMÉ: one emotional journey, not achievement list

JSON OUTPUT (no markdown):
{
  "signatureStory": {
    "storyBlueprint": {
      "thePit": "Specific lowest point",
      "theSearch": "What tried/failed",
      "theDrop": "Wake-up call",
      "searchAgain": "New insight/shift",
      "theBreakthrough": "Key realization + new approach",
      "theOutcome": "Results + who they help"
    },
    "coreLessonExtracted": "Old belief → New belief → Truth (1-2 sentences)",
    "networkingStory": "60-90s. Fast, conversational. 1-2 sentences per phase. Ends: Now I help [Client] [Outcome] using [Method]",
    "stageStory": "3-5min. Cinematic, emotional. Includes lesson lines. Soft bridge to CTA",
    "oneLinerStory": "15-25s. Pit → breakthrough → outcome. Ends with what they help people do",
    "socialPostVersion": "150-220 words. Hook → pit → breakthrough → lesson. End with engagement question (not pitch)",
    "emailStory": {
      "subjectLine": "Compelling subject",
      "body": "200-350 words. Compressed arc. Soft CTA"
    },
    "pullQuotes": ["Quote 1", "Quote 2", "Quote 3", "Quote 4", "Quote 5"]
  }
}

NO placeholders. Real content only.
`;

export default storyPrompt;
