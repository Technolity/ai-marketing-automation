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
6. Results – personal + professional results + who they help now

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
STORY: Pit=${data.storyLowMoment || 'NS'} | Discovery=${data.storyDiscovery || 'NS'} | Breakthrough=${data.storyBigIdea || 'NS'} | Method=${data.storyBreakthrough || 'NS'} | Results=${data.storyResults || 'NS'}
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
  "bigIdea": "The key insight/breakthrough concept (1-2 sentences)",
  "networkingStory": "📍 Use for: Networking events, podcasts, casual conversations. 60-90s fast conversational story. Use markdown bold phase headers (e.g., **The Pit:** ..., **The Search:** ..., **The Breakthrough:** ..., **The Outcome:** ...). 1-2 sentences per phase. Ends: 'Now I help [Client] [Outcome] using [Method]'",
  "stageStory": "📍 Use for: Speaking engagements, podcasts, webinars. 3-5 minute story (450-600 words). STYLE: 100% present tense, tell as lived scenes, include dialogue, paint specific details. End emotionally, not salesy.",
  "socialPostVersion": "📍 Use for: Social media posts. 150-220 words with line breaks for engagement. Hook → pit → breakthrough → lesson. End with engagement question, not pitch"
}

FACT RULE: Use only facts the Brand Owner provided for numbers/claims. If missing, keep results general but vivid.

NO placeholders. Real content only.
`;

export default storyPrompt;
