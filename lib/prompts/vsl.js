/**
 * VSL Script Generator - Enhanced 10-Step Framework (v2 - Flat Structure)
 * Fully conversational Video Sales Letter with 38 separate editable fields
 */

export const vslPrompt = (data) => `
Generate a Video Sales Letter (VSL) script following the Enhanced 10-Step Framework.
Write as if speaking to a friend - 100% conversational, immersive, and personal.

=== BUSINESS DATA ===
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• Desired Outcomes: ${data.outcomes || 'Not specified'}
• Unique Method: ${data.uniqueAdvantage || 'Not specified'}
• Story: ${data.storyLowMoment || 'NS'} → ${data.storyDiscovery || 'NS'} → ${data.storyBreakthrough || 'NS'}
• Proof/Testimonials: ${data.testimonials || 'Not specified'}
• Offer/Program: ${data.offerProgram || 'Not specified'}
• Deliverables: ${data.deliverables || 'Not specified'}
• CTA: ${data.callToAction || 'Book a free consultation'}

=== STYLE RULES ===
• 100% conversational - like talking to a friend over coffee
• Present tense, immersive storytelling
• NO marketing jargon or hype
• Short sentences, natural pauses
• Direct, personal tone ("you" focused)

=== GENERATE FLAT JSON (no markdown, no nested objects) ===
{
  "step1_patternInterrupt": "Start with a unique, attention-grabbing statement that references their pain point. Something unexpected that makes them stop scrolling. 2-3 sentences.",
  "step1_characterIntro": "Introduce yourself with personality - a humorous or dramatic angle that makes you relatable. 2-3 sentences.",
  "step1_problemStatement": "State the problem or challenge your target audience faces. Be specific and vivid. 2-3 sentences.",
  "step1_emotionalConnection": "Share a personal story or relatable scenario that creates connection. 3-4 sentences.",

  "step2_benefitLead": "Highlight the primary benefits of your unique solution. Lead with the transformation. 2-3 sentences.",
  "step2_uniqueSolution": "Introduce your solution, explaining why it works (trend, problem-solving, urgency). 3-4 sentences.",
  "step2_benefitsHighlight": "Detail how these benefits impact their personal and professional life. Paint the picture. 3-4 sentences.",
  "step2_problemAgitation": "Emphasize the depth and impact of the problem to make your solution more compelling. What happens if they DON'T solve this? 3-4 sentences.",

  "step3_nightmareStory": "Share a story of a major problem and the moment of finding your solution. The struggle, the search, the discovery. 4-5 sentences.",
  "step3_clientTestimonials": "Share 2-3 success stories with before-and-after scenarios. Specific results, timeframes, transformations. 4-5 sentences.",
  "step3_dataPoints": "Include 2-3 impressive statistics or achievements. Numbers create credibility. 2-3 sentences.",
  "step3_expertEndorsements": "Add endorsements from industry experts or notable figures if available. Or mention credibility markers. 2-3 sentences.",

  "step4_detailedDescription": "Elaborate on your product/service features and processes. What do they actually get? 4-5 sentences.",
  "step4_demonstration": "Describe or paint the picture of the product/service in action. What does the experience look like? 3-4 sentences.",
  "step4_psychologicalTriggers": "Introduce elements of scarcity, exclusivity, and social proof naturally. 2-3 sentences.",

  "step5_intro": "Set up why you're about to give them real value. 1-2 sentences.",
  "step5_tips": [
    {
      "title": "Tip #1: Catchy Title",
      "content": "Explain the tip in detail. What is it, why it matters, how it helps. 3-4 sentences.",
      "actionStep": "Give them a specific, actionable step they can take RIGHT NOW. 2-3 sentences."
    },
    {
      "title": "Tip #2: Catchy Title",
      "content": "Explain the second tip in detail. 3-4 sentences.",
      "actionStep": "Specific action step for tip 2. 2-3 sentences."
    },
    {
      "title": "Tip #3: Catchy Title",
      "content": "Explain the third tip in detail. 3-4 sentences.",
      "actionStep": "Specific action step for tip 3. 2-3 sentences."
    }
  ],
  "step5_transition": "Transition from value to offer. Now that they've gotten value, invite them to go deeper. 2-3 sentences.",

  "step6_directEngagement": "Create interactive elements - ask questions, invite reflection, make them feel part of something. 2-3 sentences.",
  "step6_urgencyCreation": "Introduce time-sensitive elements or limited availability naturally. 2-3 sentences.",
  "step6_clearOffer": "Present your strong, irresistible offer including any bonuses or special pricing. 3-4 sentences.",
  "step6_stepsToSuccess": [
    "Step 1: [First step of your program/offer]",
    "Step 2: [Second step]",
    "Step 3: [Third step]",
    "Step 4: [Fourth step]"
  ],

  "step7_recap": "Summarize the key points of everything you've shared. 2-3 sentences.",
  "step7_primaryCTA": "Clearly state the main action - e.g., 'Book your free consultation now.' Make it compelling. 2-3 sentences.",
  "step7_offerFeaturesAndPrice": "Detail the features of your offer and its price (position value vs. cost). 3-4 sentences.",
  "step7_bonuses": "List any bonuses they get. Make each one feel valuable. 2-3 items.",
  "step7_secondaryCTA": "Offer an alternative action for hesitant viewers. 2 sentences.",
  "step7_guarantee": "Include a strong guarantee to reduce perceived risk. Be specific about what you guarantee. 2-3 sentences.",

  "step8_theClose": "Conclude with urgency and importance of taking action NOW. Create a powerful branded name for the Free Consultation. 3-4 sentences.",
  "step8_addressObjections": "Tackle 2-3 potential objections with your solutions. 'You might be thinking... but here's the truth...' 4-5 sentences.",
  "step8_reiterateValue": "Emphasize ongoing support and future benefits. What's their life like after working with you? 3-4 sentences.",

  "step9_followUpStrategy": "Describe what happens after they take action (booking process, consultation steps, what to expect). 3-4 sentences.",
  "step9_finalPersuasion": "Reiterate your unique value proposition and long-term benefits one more time. 3-4 sentences.",

  "step10_hardClose": "Close hard on the Free Consultation. Direct, confident, clear. 2-3 sentences.",
  "step10_handleObjectionsAgain": "Handle the biggest remaining objection. 2-3 sentences.",
  "step10_scarcityClose": "Close again with scarcity - limited spots, closing soon, etc. 2-3 sentences.",
  "step10_inspirationClose": "Close with inspiration - belonging to a community, changing the world, having a better life. 3-4 sentences.",
  "step10_speedUpAction": "End with words that create urgency and get them to take action NOW. Short, punchy, powerful. 2-3 sentences."
}

=== CRITICAL REMINDERS ===
• ALL content must be SPECIFIC to this business - no placeholders or [insert X]
• Generate FLAT structure - all fields at top level (step1_patternInterrupt, step2_benefitLead, etc.)
• Only step5_tips and step6_stepsToSuccess are arrays - everything else is strings
• Each field should be complete, standalone content - no "..." placeholders
• The tips in Step 5 should provide REAL, actionable value
• Use the business data provided above throughout
• The Free Consultation should have a branded name (e.g., "Strategy Session", "Breakthrough Call", etc.)

=== ABSOLUTELY CRITICAL - JSON STRUCTURE ===
DO NOT use nested objects like step1_introduction: { patternInterrupt: "...", characterIntro: "..." }
INSTEAD use flat structure: step1_patternInterrupt: "...", step1_characterIntro: "..."
ALL 38 fields must be at the ROOT level of the JSON object.
`;

export default vslPrompt;
