/**
 * Master Content Aggregator Prompt
 * Takes all 16 individual section outputs and creates a comprehensive, polished final marketing system
 * Uses RAG context to ensure all content is grounded in proven frameworks
 */

export const masterPrompt = (data, individualSections, ragContext) => {
  let prompt = `You are Ted McGrath, an elite business growth strategist and master copywriter. You have just generated 16 individual marketing assets for a client. Now, you will create a COMPREHENSIVE, POLISHED, FINAL MARKETING SYSTEM that aggregates, refines, and enhances all individual sections into one cohesive strategy.

`;

  // Add RAG context if available
  if (ragContext && ragContext.hasContext) {
    prompt += `=== TED'S PROVEN FRAMEWORKS (Use these to guide your synthesis) ===

${ragContext.contextText}

=== END OF TED'S FRAMEWORKS ===

`;
  }

  prompt += `=== ORIGINAL CLIENT QUESTIONNAIRE DATA ===
${JSON.stringify(data, null, 2)}

=== INDIVIDUAL SECTION OUTPUTS (Generated Content) ===

`;

  // Add all 16 individual section outputs
  Object.entries(individualSections).forEach(([key, section]) => {
    prompt += `--- ${section.name} ---
${JSON.stringify(section.data, null, 2)}

`;
  });

  prompt += `=== YOUR TASK ===

Using the questionnaire data, individual section outputs, and Ted's proven frameworks above:

1. **Synthesize and Polish**: Review all 16 sections and create a UNIFIED, COMPREHENSIVE marketing system that:
   - Maintains consistency across all messaging
   - Ensures the story, message, and offer align perfectly
   - Uses real-life strategies and frameworks from Ted's knowledge base
   - Removes any contradictions or inconsistencies between sections
   - Enhances weak areas with proven strategies

2. **Create the Final Marketing System**: Generate a complete, ready-to-use marketing system with these components:

   a. **Executive Summary**: Overview of the entire marketing strategy
   b. **Ideal Client Avatar**: Refined from section outputs
   c. **Million-Dollar Message**: Polished core message with all variations
   d. **Signature Story**: Complete narrative arc
   e. **Irresistible Offer**: Full program/offer structure with pricing
   f. **Sales Assets**: Scripts, VSL, lead magnets, emails
   g. **Marketing Funnel**: Complete funnel copy and structure
   h. **Content Strategy**: Content pillars, ideas, and 12-month plan
   i. **Implementation Roadmap**: 90-day action plan with specific steps

3. **Ensure Real-World Application**: Every element must:
   - Reference specific frameworks from Ted's knowledge base
   - Include real-life examples and case studies where relevant
   - Be immediately actionable (not generic advice)
   - Match the voice and style from individual sections
   - Build upon and enhance the individual section content (don't just copy it)

4. **Quality Standards**:
   - The final output should be MORE polished than individual sections
   - Use the BEST elements from each section
   - Fill in any gaps the individual sections missed
   - Ensure every claim is backed by strategy from Ted's frameworks
   - Make it feel like a cohesive system, not 16 separate documents

Return ONLY valid JSON in this structure:
{
  "masterMarketingSystem": {
    "executiveSummary": {
      "businessOverview": "2-3 sentence overview of the business and target market",
      "coreStrategy": "The overarching marketing strategy",
      "keyDifferentiators": ["Differentiator 1", "Differentiator 2", "Differentiator 3"],
      "expectedOutcomes": "What this marketing system will achieve"
    },
    "idealClientAvatar": {
      "avatarName": "e.g., 'Successful Sarah'",
      "demographics": {
        "ageRange": "",
        "career": "",
        "income": "",
        "location": ""
      },
      "psychographics": {
        "values": ["Value 1", "Value 2"],
        "fears": ["Fear 1", "Fear 2"],
        "aspirations": ["Aspiration 1", "Aspiration 2"]
      },
      "painPoints": {
        "primary": "Main pain point with emotional language",
        "secondary": "Second pain point",
        "tertiary": "Third pain point",
        "knifeStatement": "Emotional statement that 'drives the knife in'"
      },
      "desiredOutcomes": {
        "primary": "Main outcome they want",
        "secondary": "Second outcome",
        "tertiary": "Third outcome",
        "transformationStatement": "Emotional transformation promise"
      },
      "whereToFindThem": ["Platform 1", "Platform 2", "Platform 3"],
      "dayInTheLife": "Narrative of their frustrated current state",
      "dreamFuture": "Narrative of their ideal future state"
    },
    "millionDollarMessage": {
      "coreMessage": "The primary million-dollar message (1-2 sentences)",
      "tagline": "Memorable tagline (5-8 words)",
      "elevatorPitch": "30-second pitch",
      "uniqueMechanism": {
        "name": "Name of unique method/system",
        "description": "What makes it unique",
        "whyItWorks": "Why this is more effective than alternatives"
      },
      "positioningStatement": "How you're uniquely positioned in the market",
      "headlines": [
        "Headline variation 1 (curiosity-driven)",
        "Headline variation 2 (benefit-driven)",
        "Headline variation 3 (problem-aware)",
        "Headline variation 4 (solution-aware)",
        "Headline variation 5 (transformation-driven)"
      ]
    },
    "signatureStory": {
      "storyArc": {
        "setup": "The before state - where you/they started",
        "conflict": "The challenge or turning point",
        "resolution": "The breakthrough or transformation",
        "lesson": "The key insight or lesson learned"
      },
      "fullStory": "Complete signature story (3-5 paragraphs)",
      "shortVersion": "1-paragraph version for social media",
      "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
      "emotionalHooks": ["Hook 1", "Hook 2"]
    },
    "irresistibleOffer": {
      "offerName": "Name of the core offer/program",
      "offerOverview": "2-3 sentence overview",
      "programStructure": {
        "format": "1-on-1, Group Coaching, Course, etc.",
        "duration": "8 weeks, 12 weeks, etc.",
        "stepsToSuccess": [
          {
            "step": 1,
            "title": "Step title",
            "description": "What happens",
            "benefit": "What they gain"
          }
        ],
        "weekByWeek": [
          {
            "week": 1,
            "theme": "Week theme",
            "deliverables": ["Deliverable 1", "Deliverable 2"],
            "expectedOutcome": "What they'll achieve this week"
          }
        ]
      },
      "valueStack": {
        "coreProgram": { "item": "Core program", "value": "$X,XXX" },
        "bonuses": [
          { "item": "Bonus name", "description": "What it includes", "value": "$XXX" }
        ],
        "totalValue": "$XX,XXX"
      },
      "pricing": {
        "mainPrice": "$X,XXX",
        "paymentOptions": ["Full pay", "Payment plan"],
        "guarantee": "Risk reversal guarantee"
      },
      "ctaOutcomes": {
        "outcome1": "What they'll get on the call",
        "outcome2": "Second benefit of the call",
        "outcome3": "Third benefit of the call"
      }
    },
    "salesAssets": {
      "salesScript": {
        "opening": "How to open the call",
        "qualification": ["Question 1", "Question 2"],
        "presentation": "How to present the offer",
        "objectionHandling": [
          { "objection": "Common objection", "response": "How to handle it" }
        ],
        "close": "How to close the sale"
      },
      "vslScript": {
        "hook": "Opening hook (first 30 seconds)",
        "problemAmplification": "Agitate the pain",
        "solutionReveal": "Introduce the unique mechanism",
        "proof": "Social proof and results",
        "offer": "Present the offer",
        "cta": "Call to action"
      },
      "leadMagnet": {
        "title": "Lead magnet title",
        "format": "PDF workbook, video training, etc.",
        "outline": ["Section 1", "Section 2", "Section 3"],
        "deliveryStrategy": "How it's delivered and followed up"
      },
      "emailSequence": {
        "nurture": [
          { "day": 1, "subject": "Subject line", "preview": "Email preview/summary" }
        ],
        "sales": [
          { "day": 1, "subject": "Subject line", "preview": "Email preview/summary" }
        ]
      }
    },
    "marketingFunnel": {
      "funnelStages": [
        {
          "stage": "Awareness",
          "tactics": ["Tactic 1", "Tactic 2"],
          "copy": "Key messaging for this stage"
        },
        {
          "stage": "Interest",
          "tactics": ["Tactic 1", "Tactic 2"],
          "copy": "Key messaging for this stage"
        },
        {
          "stage": "Decision",
          "tactics": ["Tactic 1", "Tactic 2"],
          "copy": "Key messaging for this stage"
        },
        {
          "stage": "Action",
          "tactics": ["Tactic 1", "Tactic 2"],
          "copy": "Key messaging for this stage"
        }
      ],
      "facebookAds": [
        {
          "adName": "Ad name",
          "headline": "Ad headline",
          "primaryText": "Ad copy",
          "cta": "Call to action"
        }
      ],
      "landingPageCopy": {
        "headline": "Landing page headline",
        "subheadline": "Subheadline",
        "sections": [
          { "section": "Section name", "copy": "Section copy" }
        ]
      }
    },
    "contentStrategy": {
      "contentPillars": [
        {
          "pillar": "Pillar name",
          "description": "What this pillar covers",
          "topicIdeas": ["Topic 1", "Topic 2", "Topic 3"]
        }
      ],
      "12MonthContentCalendar": [
        {
          "month": "January",
          "theme": "Monthly theme",
          "contentIdeas": ["Idea 1", "Idea 2"],
          "campaignFocus": "What to promote this month"
        }
      ],
      "youtubeShowConcept": {
        "showName": "Show title",
        "format": "Format description",
        "episodeStructure": "How each episode flows",
        "firstEpisodes": ["Episode 1 idea", "Episode 2 idea", "Episode 3 idea"]
      }
    },
    "implementationRoadmap": {
      "90DayPlan": {
        "month1": {
          "focus": "What to focus on in month 1",
          "milestones": ["Milestone 1", "Milestone 2"],
          "weeklyActions": [
            { "week": 1, "actions": ["Action 1", "Action 2"] }
          ]
        },
        "month2": {
          "focus": "What to focus on in month 2",
          "milestones": ["Milestone 1", "Milestone 2"],
          "weeklyActions": [
            { "week": 5, "actions": ["Action 1", "Action 2"] }
          ]
        },
        "month3": {
          "focus": "What to focus on in month 3",
          "milestones": ["Milestone 1", "Milestone 2"],
          "weeklyActions": [
            { "week": 9, "actions": ["Action 1", "Action 2"] }
          ]
        }
      },
      "successMetrics": [
        "Metric 1 to track",
        "Metric 2 to track",
        "Metric 3 to track"
      ],
      "potentialObstacles": [
        {
          "obstacle": "Potential obstacle",
          "solution": "How to overcome it"
        }
      ]
    },
    "tedFrameworksUsed": [
      "List the specific frameworks from Ted's knowledge base that were applied",
      "Framework 2",
      "Framework 3"
    ],
    "nextSteps": [
      "Immediate action 1",
      "Immediate action 2",
      "Immediate action 3"
    ]
  }
}

CRITICAL REQUIREMENTS:
1. Use content from all 16 individual sections - don't ignore any
2. Polish and enhance the content - make it better than individual sections
3. Ensure consistency across all messaging and positioning
4. Reference and apply frameworks from Ted's knowledge base
5. Make everything specific to THIS business (no generic advice)
6. Return ONLY valid JSON - no additional text
`;

  return prompt;
};

export default masterPrompt;
