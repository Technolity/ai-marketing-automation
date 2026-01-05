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
  "networkingStory": "60-90s fast conversational story. 1-2 sentences per phase. Ends: 'Now I help [Client] [Outcome] using [Method]'",
  "stageStory": "3-5 minute story (450-600 words). STYLE LOCK MANDATORY: Write 100% in present tense. Tell as lived scenes (moment-to-moment), NOT summary. Casual spoken voice (like talking to a friend). Paint scenes with specific details (where they are, what they see/hear/feel). Can take place in one location or move locations naturally. Include at least 6 lines of dialogue (other people + Brand Owner). Include one collapse moment (can't ignore it anymore) + one decision moment (chooses to change). Include one symbolic object detail (coffee cup, spreadsheet, phone screen, etc.). NO marketing language (no 'empower/scale/transform/high-ticket'). NO call-to-action at end. End emotionally, not salesy. Structure: 1) Cold open inside PIT as scene (start mid-moment), 2) Search: show what they try and why it fails (as scenes, not list), 3) Breakthrough: specific turning-point scene with dialogue, 4) Results: what changes after (measurable if provided), 5) Close with: 'That's why I do what I do.'",
  "oneLinerStory": "15-25s. Pit → breakthrough → results. Ends with what they help people do",
  "socialPostVersion": "150-220 words with line breaks for engagement. Hook → pit → breakthrough → lesson. End with engagement question, not pitch",
  "pullQuotes": ["Quote 1", "Quote 2", "Quote 3", "Quote 4", "Quote 5"]
}

FACT RULE: Use only facts the Brand Owner provided for numbers/claims. If missing, keep results general but vivid.

NO placeholders. Real content only.
`;

export default storyPrompt;
