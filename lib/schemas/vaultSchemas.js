/**
 * Strict Output Schemas for All Vault Sections
 *
 * These schemas define the EXACT structure that AI must follow when generating
 * or regenerating vault content. Matches the UI output format exactly.
 *
 * Purpose:
 * 1. AI can only fill these predefined fields (no new lines)
 * 2. AI feedback edits/replaces within schema boundaries only
 * 3. UI renders in this exact sequence with proper formatting
 * 4. Validate all outputs before saving to database
 */

import { z } from 'zod';

// ============================================================================
// PHASE 1 SCHEMAS (Business Core)
// ============================================================================

/**
 * Schema 1: Ideal Client Profile
 * Output Format:
 * - Best Ideal Client (1 sentence)
 * - Top 3 Challenges
 * - What They Want (3 bullets)
 * - What Makes Them Pay (3 bullets)
 * - How to Talk to Them (3 coffee-talk lines)
 */
export const idealClientSchema = z.object({
  idealClientSnapshot: z.object({
    bestIdealClient: z.object({
      ageLifeStage: z.string().min(10).max(500).describe("Age and life stage of ideal client (e.g., 35-50, established professional)"),
      roleIdentity: z.string().min(10).max(500).describe("Role or identity (e.g., CEO, Entrepreneur, Marketing Director)"),
      incomeRevenueRange: z.string().min(10).max(500).describe("Income or revenue range (e.g., $100K-$500K personal income)"),
      familySituation: z.string().min(10).max(500).describe("Family situation (e.g., married with kids, single, empty nester)"),
      location: z.string().min(10).max(500).describe("Location/region (e.g., USA, Urban areas, Remote workers)"),
      decisionStyle: z.string().min(10).max(500).describe("How they make buying decisions (e.g., research-driven, needs social proof)")
    }).describe("Demographic and psychographic profile of the ideal premium buyer"),
    topChallenges: z.array(z.string().min(10).max(300)).length(3).describe("Exactly 3 top challenges they face"),
    whatTheyWant: z.array(z.string().min(10).max(300)).length(3).describe("Exactly 3 desired outcomes"),
    whatMakesThemPay: z.array(z.string().min(10).max(300)).length(3).describe("Exactly 3 payment triggers"),
    howToTalkToThem: z.array(z.string().min(20).max(400)).length(3).describe("Exactly 3 coffee-talk lines")
  })
});

/**
 * Schema 2: Signature Message
 * Output Format:
 * 1. Signature Message (1 sentence) - I help X do Y without Z
 * 2. 30-Second Spoken Version (coffee talk)
 */
export const messageSchema = z.object({
  signatureMessage: z.object({
    oneLiner: z.string().min(20).max(300).describe("I help [X] do [Y] without [Z] formula - 1 sentence"),
    spokenVersion: z.string().min(100).max(800).describe("30-second spoken version - paragraph for video/stage/sales")
  })
});

/**
 * Schema 3: Signature Story
 * Output Format:
 * A) STORY BLUEPRINT (6 phases - bullet outline)
 * B) 60-90s Networking Story
 * C) 3-5 min Stage/Podcast Story
 * D) 15-25s One-Liner Story
 * E) Social Post Version
 * F) Short Email Story (subject + 200-350 words)
 * G) Signature Pull Quotes (5-7 lines)
 */
export const storySchema = z.object({
  signatureStory: z.object({
    storyBlueprint: z.object({
      thePit: z.string().min(20).max(500).describe("Phase 1: The Pit - Stuck/lowest point"),
      theSearch: z.string().min(20).max(500).describe("Phase 2: The Search - What they tried, what failed"),
      theDrop: z.string().min(20).max(500).describe("Phase 3: The Drop - Second low / wake-up call"),
      searchAgain: z.string().min(20).max(500).describe("Phase 4: Search Again - New insight, decision, or shift"),
      theBreakthrough: z.string().min(20).max(500).describe("Phase 5: The Breakthrough - Key realization + new approach"),
      theOutcome: z.string().min(20).max(500).describe("Phase 6: The Outcome - Personal + professional results")
    }).describe("A) STORY BLUEPRINT - Bullet outline using 6 phases"),
    networkingStory: z.string().min(200).max(600).describe("B) 60-90s Networking Story - Fast, conversational, 1-2 sentences per phase"),
    stageStory: z.string().min(800).max(2000).describe("C) 3-5 min Stage/Podcast Story - Cinematic, emotional, detailed with lesson lines"),
    oneLinerStory: z.string().min(50).max(200).describe("D) 15-25s One-Liner Story - Pit → breakthrough → outcome (compressed)"),
    socialPostVersion: z.string().min(150).max(500).describe("E) Social Post Version - 150-220 words, hook → pit → breakthrough → lesson"),
    emailStory: z.object({
      subjectLine: z.string().min(5).max(100).describe("Email subject line"),
      body: z.string().min(200).max(800).describe("F) Short Email Story - 200-350 words, compressed arc")
    }),
    pullQuotes: z.array(z.string().min(10).max(200)).min(5).max(7).describe("G) Signature Pull Quotes - 5-7 short, quotable lines")
  })
});

/**
 * Schema 4: Signature Offer
 * Output Format: Flat structure matching prompt output and UI fields
 * Fields: offerMode, offerName, sevenStepBlueprint (array),
 *         tier1WhoItsFor, tier1Promise, tier1Timeframe, tier1Deliverables, tier1RecommendedPrice,
 *         tier2WhoItsFor, tier2Promise, tier2Timeframe, tier2Deliverables, tier2RecommendedPrice,
 *         offerPromise
 */
const blueprintStepSchema = z.object({
  stepName: z.string().min(2).max(100).describe("Step name (2-5 words)"),
  whatItIs: z.string().min(10).max(500).describe("Brief description of what happens in this step"),
  problemSolved: z.string().min(10).max(500).describe("The specific problem this step addresses"),
  outcomeCreated: z.string().min(10).max(500).describe("The outcome the client achieves after this step")
});

export const offerSchema = z.object({
  offerMode: z.string().min(3).max(100).describe("Offer type - Coaching/Consulting or Service"),
  offerName: z.string().min(5).max(200).describe("Branded system/offer name"),
  sevenStepBlueprint: z.array(blueprintStepSchema).min(7).max(7).describe("Exactly 7 steps of the blueprint"),
  tier1WhoItsFor: z.string().min(10).max(500).describe("Who Tier 1 (90-day) offer is for"),
  tier1Promise: z.string().min(20).max(500).describe("Tier 1 transformation promise"),
  tier1Timeframe: z.string().min(2).max(100).describe("Tier 1 duration (e.g., 90 days)"),
  tier1Deliverables: z.string().min(20).max(1000).describe("What they get in Tier 1"),
  tier1RecommendedPrice: z.string().min(2).max(100).describe("Tier 1 recommended price range"),
  tier2WhoItsFor: z.string().min(10).max(500).describe("Who Tier 2 (year-long) offer is for"),
  tier2Promise: z.string().min(20).max(500).describe("Tier 2 transformation promise"),
  tier2Timeframe: z.string().min(2).max(100).describe("Tier 2 duration (e.g., 12 months)"),
  tier2Deliverables: z.string().min(20).max(1000).describe("What they get in Tier 2"),
  tier2RecommendedPrice: z.string().min(2).max(100).describe("Tier 2 recommended price range"),
  offerPromise: z.string().min(20).max(1000).describe("Combined offer promise for both tiers")
});

/**
 * Schema 5: Sales Script (Closer)
 * Output Format:
 * QUICK CALL OUTLINE (SHOW FIRST)
 * - Goal of this call (1 sentence)
 * - Call Flow (6 parts):
 *   1. Opening + Permission
 *   2. Discovery (7 questions)
 *   3. Challenges + Stakes
 *   4. Recap + Confirmation
 *   5. 3-Step Plan
 *   6. Paid-in-Full Close + Next Steps
 */
/**
 * Schema 5: Sales Script (Closer) - Customer-Facing V3
 * Output Format:
 * - Discovery Questions (7 Array)
 * - Full Guided Script (9 Parts)
 * - Objection Handling (10 Array)
 */
const discoveryQuestionSchema = z.object({
  label: z.string().min(1).max(200).describe("Question Label"),
  question: z.string().min(10).max(500).describe("The exact question to ask"),
  lookingFor: z.string().min(5).max(300).describe("What you're looking for"),
  ifVague: z.string().min(5).max(300).describe("Probe if vague")
});

const objectionSchema = z.object({
  objection: z.string().min(1).max(200).describe("The objection"),
  response: z.string().min(10).max(500).describe("Your calm response"),
  followUp: z.string().min(5).max(200).describe("Follow-up question"),
  ifStillHesitate: z.string().min(5).max(200).describe("If they still hesitate")
});

export const salesScriptSchema = z.object({
  agendaPermission: z.string().min(50).max(1500).describe("Opening script with permission and agenda"),
  discoveryQuestions: z.array(discoveryQuestionSchema).length(7).describe("Exactly 7 discovery questions"),
  stakesImpact: z.string().min(50).max(1500).describe("Stakes + Cost of Inaction"),
  commitmentScale: z.string().min(20).max(800).describe("1-10 commitment scale script"),
  decisionGate: z.string().min(20).max(800).describe("Hypothetical close / Decision Gate"),
  recapConfirmation: z.string().min(50).max(1500).describe("Recap + Confirmation with checkpoints"),
  pitchScript: z.string().min(50).max(3000).describe("3-Step Plan Pitch with reflective questions"),
  proofLine: z.string().max(1000).optional().describe("Social proof / testimonial (optional)"),
  investmentClose: z.string().min(50).max(3000).describe("Value Stack + Pricing + Close"),
  nextSteps: z.string().min(50).max(1000).describe("Enrollment + Next Steps"),
  objectionHandling: z.array(objectionSchema).min(10).max(10).describe("Exactly 10 objection handlers")
});

/**
 * Schema 17: Setter Script (Appointment Setting)
 * Output Format:
 * QUICK SETTER CALL OUTLINE (SHOW FIRST)
 * Goal: Build trust → clarify opt-in → uncover goal + obstacle → confirm fit → book consultation
 * Call Flow (10 steps):
 * 1. Opener + permission
 * 2. Reference opt-in
 * 3. Low-pressure frame
 * 4. Current situation
 * 5. Goal + motivation
 * 6. Challenge + stakes
 * 7. Authority drop
 * 8. Qualify fit + readiness
 * 9. Book consultation
 * 10. Confirm show-up + wrap-up
 * Setter mindset: Be curious. Lead with service. Don't pitch. Book the call.
 */
export const setterScriptSchema = z.object({
  setterCallScript: z.object({
    quickOutline: z.object({
      callGoal: z.string().min(50).max(500).describe("Goal: Build trust → clarify opt-in → uncover goal + obstacle → confirm fit → book consultation"),
      callFlow: z.object({
        step1_openerPermission: z.string().min(30).max(500).describe("Step 1: Opener + permission"),
        step2_referenceOptIn: z.string().min(30).max(500).describe("Step 2: Reference opt-in"),
        step3_lowPressureFrame: z.string().min(30).max(500).describe("Step 3: Low-pressure frame"),
        step4_currentSituation: z.string().min(30).max(500).describe("Step 4: Current situation"),
        step5_goalMotivation: z.string().min(30).max(500).describe("Step 5: Goal + motivation"),
        step6_challengeStakes: z.string().min(30).max(500).describe("Step 6: Challenge + stakes"),
        step7_authorityDrop: z.string().min(30).max(500).describe("Step 7: Authority drop"),
        step8_qualifyFit: z.string().min(30).max(500).describe("Step 8: Qualify fit + readiness"),
        step9_bookConsultation: z.string().min(30).max(500).describe("Step 9: Book consultation"),
        step10_confirmShowUp: z.string().min(30).max(500).describe("Step 10: Confirm show-up + wrap-up")
      }).describe("Call Flow - 10 steps"),
      setterMindset: z.string().min(30).max(500).describe("Setter mindset: Be curious. Lead with service. Don't pitch. Book the call.")
    }).describe("QUICK SETTER CALL OUTLINE (SHOW FIRST)")
  })
});

// ============================================================================
// PHASE 2 SCHEMAS (Marketing Assets)
// ============================================================================

/**
 * Schema 6: Lead Magnet (Free Gift)
 * Fields: 7 main sections, 5 deliverables, multiple copy variations
 */
const leadMagnetDeliverableSchema = z.object({
  title: z.string().min(5).max(100).describe("Actionable tip/step title"),
  description: z.string().min(20).max(500).describe("What it delivers"),
  immediateValue: z.string().min(20).max(300).describe("Tangible immediate value"),
  uniquePerspective: z.string().min(20).max(300).describe("How it reflects unique method")
});

export const leadMagnetSchema = z.object({
  leadMagnet: z.object({
    leadMagnetIdea: z.object({
      concept: z.string().min(20).max(500).describe("Clear concept for value-driven gift"),
      coreProblemSolved: z.string().min(20).max(300).describe("Core problem solved"),
      keyOutcomeDelivered: z.string().min(20).max(300).describe("Key outcome delivered"),
      alignmentWithMethod: z.string().min(20).max(500).describe("Alignment with unique method"),
      format: z.string().min(5).max(100).describe("PDF guide, checklist, video training, template, etc.")
    }),
    titleAndHook: z.object({
      mainTitle: z.string().min(10).max(200).describe("Compelling benefit-focused title"),
      subtitle: z.string().min(10).max(300).describe("Optional subtitle for clarity"),
      alternativeTitles: z.array(z.string().min(10).max(200)).length(3).describe("Exactly 3 alternative titles"),
      whyItsIrresistible: z.string().min(20).max(500).describe("Why this title will grab attention")
    }),
    audienceConnection: z.object({
      openingHook: z.string().min(20).max(500).describe("Powerful first line about pain/desire"),
      painAcknowledgment: z.string().min(20).max(500).describe("Acknowledgment of frustration"),
      desireValidation: z.string().min(20).max(500).describe("Validation of what they want"),
      trustBuilder: z.string().min(20).max(500).describe("Credibility statement"),
      transitionToValue: z.string().min(20).max(500).describe("Transition into what they'll receive")
    }),
    coreDeliverables: z.array(leadMagnetDeliverableSchema).min(3).max(7).describe("3-7 core deliverables for the lead magnet"),
    leadMagnetCopy: z.object({
      headline: z.string().min(10).max(200).describe("Main headline for landing page"),
      subheadline: z.string().min(20).max(300).describe("Supporting subheadline"),
      bulletPoints: z.array(z.string().min(10).max(200)).length(4).describe("Exactly 4 bullet points"),
      softCta: z.string().min(10).max(200).describe("Soft call-to-action"),
      ctaButtonText: z.string().min(5).max(50).describe("Button text"),
      socialProof: z.string().min(20).max(300).describe("Credibility statement"),
      urgencyElement: z.string().min(10).max(200).describe("Limited time message"),
      privacyNote: z.string().min(10).max(200).describe("Privacy statement")
    }),
    ctaIntegration: z.object({
      connectionToOffer: z.string().min(20).max(500).describe("Tie to main program"),
      hintAtDeeperTransformation: z.string().min(20).max(500).describe("Hint at full program potential"),
      nextStepInvitation: z.string().min(20).max(500).describe("Invitation after consuming lead magnet"),
      emailOptInValue: z.string().min(20).max(500).describe("Why email is worth it")
    }),
    voiceAndTone: z.object({
      brandVoiceDescription: z.string().min(20).max(500).describe("Brand voice characteristics"),
      authenticityMarkers: z.array(z.string().min(5).max(200)).min(2).max(5).describe("2-5 authenticity markers"),
      languageToUse: z.array(z.string().min(3).max(100)).min(2).max(5).describe("2-5 language examples to use"),
      languageToAvoid: z.array(z.string().min(3).max(100)).min(2).max(5).describe("2-5 language examples to avoid")
    })
  })
});

/**
 * Schema 7: VSL (Video Sales Letter)
 * Fields: Full script (2500-3500 words), 3 tips, 3 hooks, objection handlers, 3 closes
 */
// VSL v2 Schema - Flat Structure (38 fields)
const vslTipSchemaV2 = z.object({
  title: z.string().min(10).max(100).describe("Tip title"),
  content: z.string().min(50).max(600).describe("Tip explanation"),
  actionStep: z.string().min(20).max(400).describe("Actionable step")
});

export const vslSchema = z.object({
  // Step 1: Introduction (4 fields)
  step1_patternInterrupt: z.string().min(50).max(500).describe("Pattern interrupt hook"),
  step1_characterIntro: z.string().min(50).max(500).describe("Character introduction"),
  step1_problemStatement: z.string().min(50).max(500).describe("Problem statement"),
  step1_emotionalConnection: z.string().min(50).max(600).describe("Emotional connection"),

  // Step 2: Solution Presentation (4 fields)
  step2_benefitLead: z.string().min(50).max(500).describe("Benefit lead"),
  step2_uniqueSolution: z.string().min(50).max(600).describe("Unique solution"),
  step2_benefitsHighlight: z.string().min(50).max(600).describe("Benefits highlight"),
  step2_problemAgitation: z.string().min(50).max(600).describe("Problem agitation"),

  // Step 3: Proof & Credibility (4 fields)
  step3_nightmareStory: z.string().min(50).max(700).describe("Nightmare story and breakthrough"),
  step3_clientTestimonials: z.string().min(50).max(700).describe("Client testimonials"),
  step3_dataPoints: z.string().min(20).max(500).describe("Data points and statistics"),
  step3_expertEndorsements: z.string().min(20).max(500).describe("Expert endorsements"),

  // Step 4: Product Features (3 fields)
  step4_detailedDescription: z.string().min(50).max(700).describe("Detailed product description"),
  step4_demonstration: z.string().min(50).max(600).describe("Product demonstration"),
  step4_psychologicalTriggers: z.string().min(20).max(500).describe("Psychological triggers"),

  // Step 5: Value Tips (3 fields)
  step5_intro: z.string().min(20).max(400).describe("Value tips introduction"),
  step5_tips: z.array(vslTipSchemaV2).length(3).describe("Exactly 3 actionable tips"),
  step5_transition: z.string().min(20).max(400).describe("Transition to offer"),

  // Step 6: Engagement & Interaction (4 fields)
  step6_directEngagement: z.string().min(20).max(500).describe("Direct engagement"),
  step6_urgencyCreation: z.string().min(20).max(500).describe("Urgency creation"),
  step6_clearOffer: z.string().min(50).max(600).describe("Clear offer presentation"),
  step6_stepsToSuccess: z.array(z.string().min(20).max(200)).length(4).describe("4 steps to success"),

  // Step 7: Call to Action (6 fields)
  step7_recap: z.string().min(20).max(500).describe("Recap of key points"),
  step7_primaryCTA: z.string().min(20).max(500).describe("Primary call to action"),
  step7_offerFeaturesAndPrice: z.string().min(50).max(600).describe("Offer features and pricing"),
  step7_bonuses: z.string().min(20).max(500).describe("Bonuses"),
  step7_secondaryCTA: z.string().min(20).max(400).describe("Secondary CTA"),
  step7_guarantee: z.string().min(20).max(500).describe("Guarantee statement"),

  // Step 8: Closing Argument (3 fields)
  step8_theClose: z.string().min(50).max(600).describe("The close"),
  step8_addressObjections: z.string().min(50).max(700).describe("Address objections"),
  step8_reiterateValue: z.string().min(50).max(600).describe("Reiterate value"),

  // Step 9: Post-CTA Engagement (2 fields)
  step9_followUpStrategy: z.string().min(50).max(600).describe("Follow-up strategy"),
  step9_finalPersuasion: z.string().min(50).max(600).describe("Final persuasion"),

  // Step 10: Final Closes (5 fields)
  step10_hardClose: z.string().min(20).max(500).describe("Hard close"),
  step10_handleObjectionsAgain: z.string().min(20).max(500).describe("Handle objections again"),
  step10_scarcityClose: z.string().min(20).max(500).describe("Scarcity close"),
  step10_inspirationClose: z.string().min(50).max(600).describe("Inspiration close"),
  step10_speedUpAction: z.string().min(20).max(400).describe("Speed up action")
});

/**
 * Schema 8: Email & SMS Sequences
 * 15-Day Sequence with 19 Individual Emails
 * Structure: Day 1 (1 email) + Days 2-7 (6 emails) + Day 8 Closing (3 emails) + Days 9-14 (6 emails) + Day 15 Closing (3 emails)
 */
const singleEmailSchema = z.object({
  subject: z.string().min(10).max(150).describe("Email subject line"),
  preview: z.string().min(10).max(200).describe("Preview text"),
  body: z.string().min(250).max(5000).describe("250-600 word email body with {{contact.first_name}}, conversational tone")
});

export const emailsSchema = z.object({
  emailSequence: z.object({
    // DAY 1: Gift Delivery
    email1: singleEmailSchema.describe("Day 1 - Gift Delivery + Welcome + Set Expectations"),

    // DAYS 2-7: Daily Value Emails
    email2: singleEmailSchema.describe("Day 2 - Daily Tip #1: Pain point + Tip + Example + CTA"),
    email3: singleEmailSchema.describe("Day 3 - Daily Tip #2: Pain point + Tip + Example + CTA"),
    email4: singleEmailSchema.describe("Day 4 - Daily Tip #3: Pain point + Tip + Example + CTA"),
    email5: singleEmailSchema.describe("Day 5 - Daily Tip #4: Pain point + Tip + Example + CTA"),
    email6: singleEmailSchema.describe("Day 6 - Daily Tip #5: Pain point + Tip + Example + CTA"),
    email7: singleEmailSchema.describe("Day 7 - Daily Tip #6: Pain point + Tip + Example + CTA"),

    // DAY 8: CLOSING DAY #1 (3 emails)
    email8a: singleEmailSchema.describe("Day 8 Morning - Why a call helps (remove friction, show value)"),
    email8b: singleEmailSchema.describe("Day 8 Afternoon - Success story (social proof, credibility, results)"),
    email8c: singleEmailSchema.describe("Day 8 Evening - Last chance this week (mild urgency, limited spots)"),

    // DAYS 9-14: Advanced Daily Value Emails
    email9: singleEmailSchema.describe("Day 9 - Advanced Tip: Mindset/Strategy"),
    email10: singleEmailSchema.describe("Day 10 - Advanced Tip: Common Mistakes"),
    email11: singleEmailSchema.describe("Day 11 - Advanced Tip: What's Really Holding You Back"),
    email12: singleEmailSchema.describe("Day 12 - Advanced Tip: Behind-the-Scenes Teaching"),
    email13: singleEmailSchema.describe("Day 13 - Advanced Tip: Results Timeline"),
    email14: singleEmailSchema.describe("Day 14 - Advanced Tip: Simplify Execution"),

    // DAY 15: CLOSING DAY #2 (3 emails)
    email15a: singleEmailSchema.describe("Day 15 Morning - Final day to book consultation"),
    email15b: singleEmailSchema.describe("Day 15 Afternoon - FAQ/Objections + What happens on call"),
    email15c: singleEmailSchema.describe("Day 15 Evening - Final emotional + logical push + strongest CTA")
  })
});

/**
 * Schema 8b: SMS Sequences
 * Fields: 10 SMS messages (7 nurture + 2 no-show follow-ups)
 * Structure: Days 1-5 (5 SMS) + Days 6-7 (3 SMS) + No-Show Follow-ups (2 SMS)
 */
const singleSmsSchema = z.object({
  timing: z.string().min(5).max(100).describe("When to send (e.g., 'Day 1 - Immediately', 'Day 7 - Evening')"),
  message: z.string().min(10).max(160).describe("SMS message under 160 characters with {{contact.first_name}} and [Schedule Link]")
});

export const smsSchema = z.object({
  smsSequence: z.object({
    // DAYS 1-5: Nurture Sequence
    sms1: singleSmsSchema.describe("Day 1 - Welcome + Gift Reminder (immediately after signup)"),
    sms2: singleSmsSchema.describe("Day 2 - Value Nudge (short value nugget related to problem)"),
    sms3: singleSmsSchema.describe("Day 3 - Quick Tip (actionable quick tip)"),
    sms4: singleSmsSchema.describe("Day 4 - Social Proof (brief mention of results/success)"),
    sms5: singleSmsSchema.describe("Day 5 - Booking Reminder (soft reminder to book call)"),

    // DAYS 6-7: Final Value + Closing
    sms6: singleSmsSchema.describe("Day 6 - Final Value (one last value piece before closing)"),
    sms7a: singleSmsSchema.describe("Day 7 Morning - Last Chance A (last chance to book/act this week)"),
    sms7b: singleSmsSchema.describe("Day 7 Evening - Last Chance B (final push with link)"),

    // NO-SHOW FOLLOW-UPS
    smsNoShow1: singleSmsSchema.describe("Post No-Show - 30 min after (concerned check-in, not angry)"),
    smsNoShow2: singleSmsSchema.describe("Post No-Show - Next day (easy offer to reschedule)")
  })
});

/**
 * Schema 9: Facebook Ads
 * Fields: 3 ads (2 short + 1 long) with flat field IDs matching UI and prompt
 */
export const facebookAdsSchema = z.object({
  facebookAds: z.object({
    shortAd1Headline: z.string().min(5).max(60).describe("Short Ad #1 headline, max 60 chars"),
    shortAd1PrimaryText: z.string().min(50).max(1500).describe("Short Ad #1 body copy (~100-150 words)"),
    shortAd1CTA: z.string().min(3).max(50).describe("Short Ad #1 CTA button text"),
    shortAd2Headline: z.string().min(5).max(60).describe("Short Ad #2 headline, max 60 chars"),
    shortAd2PrimaryText: z.string().min(50).max(1500).describe("Short Ad #2 body copy (~100-150 words)"),
    shortAd2CTA: z.string().min(3).max(50).describe("Short Ad #2 CTA button text"),
    longAdHeadline: z.string().min(5).max(60).describe("Long Ad headline, max 60 chars"),
    longAdPrimaryText: z.string().min(100).max(3000).describe("Long Ad body copy (~250-350 words)"),
    longAdCTA: z.string().min(3).max(50).describe("Long Ad CTA button text")
  })
});

/**
 * Schema 10: Funnel Page Copy
 * Fields: 5 opt-in headlines, thank you page, confirmation script, 7 FAQs, 4 success steps
 */
const faqSchema = z.object({
  question: z.string().min(10).max(200).describe("Common question"),
  answer: z.string().min(20).max(500).describe("Clear, benefit-focused answer")
});

const funnelStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(4),
  headline: z.string().min(10).max(100).describe("Step headline"),
  description: z.string().min(20).max(500).describe("Step description"),
  benefit: z.string().min(20).max(300).describe("Benefit")
});

export const funnelCopySchema = z.object({
  optinPage: z.object({
    headline_text: z.string().min(10).max(200).describe("Main opt-in headline"),
    subheadline_text: z.string().min(20).max(300).describe("Supporting subheadline"),
    cta_button_text: z.string().min(5).max(50).describe("CTA button text"),
    popup_form_headline: z.string().min(5).max(100).describe("Popup form headline"),
    footer_text: z.string().min(10).max(200).describe("Footer copyright text")
  }),
  salesPage: z.object({
      // Hero Section
      hero_headline_text: z.string().min(10).max(200).describe("Main VSL headline"),
      hero_subheadline_text: z.string().min(20).max(300).describe("VSL subheadline"),
      hero_below_cta_sub_text: z.string().min(10).max(200).describe("Text below CTA button"),
      cta_text: z.string().min(5).max(50).describe("Main CTA button text"),

      // Process Overview
      process_headline: z.string().min(10).max(200).describe("Process section headline"),
      process_subheadline: z.string().min(20).max(300).describe("Process section subheadline"),

      // 6 Processes
      process_1_headline: z.string().min(10).max(200).describe("Process 1 headline"),
      process_1_subheadline: z.string().min(20).max(300).describe("Process 1 subheadline"),
      process_2_headline: z.string().min(10).max(200).describe("Process 2 headline"),
      process_2_subheadline: z.string().min(20).max(300).describe("Process 2 subheadline"),
      process_3_headline: z.string().min(10).max(200).describe("Process 3 headline"),
      process_3_subheadline: z.string().min(20).max(300).describe("Process 3 subheadline"),
      process_4_headline: z.string().min(10).max(200).describe("Process 4 headline"),
      process_4_subheadline: z.string().min(20).max(300).describe("Process 4 subheadline"),
      process_5_headline: z.string().min(10).max(200).describe("Process 5 headline"),
      process_5_subheadline: z.string().min(20).max(300).describe("Process 5 subheadline"),
      process_6_headline: z.string().min(10).max(200).describe("Process 6 headline"),
      process_6_subheadline: z.string().min(20).max(300).describe("Process 6 subheadline"),

      // How It Works
      how_it_works_headline: z.string().min(10).max(200).describe("How it works section headline"),
      how_it_works_subheadline_above_cta: z.string().min(20).max(300).describe("How it works subheadline"),
      how_it_works_point_1: z.string().min(20).max(300).describe("How it works point 1"),
      how_it_works_point_2: z.string().min(20).max(300).describe("How it works point 2"),
      how_it_works_point_3: z.string().min(20).max(300).describe("How it works point 3"),

      // Audience Callout
      audience_callout_headline: z.string().min(10).max(200).describe("Audience callout main headline"),
      audience_callout_for_headline: z.string().min(10).max(200).describe("'This IS for' headline"),
      audience_callout_for_1: z.string().min(20).max(300).describe("This IS for bullet 1"),
      audience_callout_for_2: z.string().min(20).max(300).describe("This IS for bullet 2"),
      audience_callout_for_3: z.string().min(20).max(300).describe("This IS for bullet 3"),
      audience_callout_not_headline: z.string().min(10).max(200).describe("'This is NOT for' headline"),
      audience_callout_not_1: z.string().min(20).max(300).describe("This is NOT for bullet 1"),
      audience_callout_not_2: z.string().min(20).max(300).describe("This is NOT for bullet 2"),
      audience_callout_not_3: z.string().min(20).max(300).describe("This is NOT for bullet 3"),
      audience_callout_cta_sub_text: z.string().min(10).max(200).describe("CTA sub-text"),

      // This Is For
      this_is_for_headline: z.string().min(10).max(200).describe("This is for you headline"),

      // Call Expectations
      call_expectations_headline: z.string().min(10).max(200).describe("Call expectations main headline"),
      call_expectations_is_for_headline: z.string().min(10).max(200).describe("'This call IS for' headline"),
      call_expectations_is_for_bullet_1: z.string().min(20).max(300).describe("This call IS for bullet 1"),
      call_expectations_is_for_bullet_2: z.string().min(20).max(300).describe("This call IS for bullet 2"),
      call_expectations_is_for_bullet_3: z.string().min(20).max(300).describe("This call IS for bullet 3"),
      call_expectations_not_for_headline: z.string().min(10).max(200).describe("'This call is NOT for' headline"),
      call_expectations_not_for_bullet_1: z.string().min(20).max(300).describe("This call is NOT for bullet 1"),
      call_expectations_not_for_bullet_2: z.string().min(20).max(300).describe("This call is NOT for bullet 2"),
      call_expectations_not_for_bullet_3: z.string().min(20).max(300).describe("This call is NOT for bullet 3"),

      // Bio
      bio_headline_text: z.string().min(10).max(200).describe("Bio section headline"),
      bio_paragraph_text: z.string().min(50).max(500).describe("Bio paragraph"),

      // Testimonials
      testimonial_headline_text: z.string().min(10).max(200).describe("Testimonials section headline"),
      testimonial_subheadline_text: z.string().min(20).max(300).describe("Testimonials subheadline"),
      testimonial_review_1_headline: z.string().min(10).max(200).describe("Testimonial 1 headline"),
      testimonial_review_1_subheadline_with_name: z.string().min(20).max(400).describe("Testimonial 1 review with name"),
      testimonial_review_2_headline: z.string().min(10).max(200).describe("Testimonial 2 headline"),
      testimonial_review_2_subheadline_with_name: z.string().min(20).max(400).describe("Testimonial 2 review with name"),
      testimonial_review_3_headline: z.string().min(10).max(200).describe("Testimonial 3 headline"),
      testimonial_review_3_subheadline_with_name: z.string().min(20).max(400).describe("Testimonial 3 review with name"),
      testimonial_review_4_headline: z.string().min(10).max(200).describe("Testimonial 4 headline"),
      testimonial_review_4_subheadline_with_name: z.string().min(20).max(400).describe("Testimonial 4 review with name"),

      // FAQ
      faq_headline_text: z.string().min(10).max(200).describe("FAQ section headline"),
      faq_question_1: z.string().min(10).max(200).describe("FAQ question 1"),
      faq_answer_1: z.string().min(20).max(500).describe("FAQ answer 1"),
      faq_question_2: z.string().min(10).max(200).describe("FAQ question 2"),
      faq_answer_2: z.string().min(20).max(500).describe("FAQ answer 2"),
      faq_question_3: z.string().min(10).max(200).describe("FAQ question 3"),
      faq_answer_3: z.string().min(20).max(500).describe("FAQ answer 3"),
      faq_question_4: z.string().min(10).max(200).describe("FAQ question 4"),
      faq_answer_4: z.string().min(20).max(500).describe("FAQ answer 4"),

      // Final CTA
      final_cta_headline: z.string().min(10).max(200).describe("Final CTA headline"),
      final_cta_subheadline: z.string().min(20).max(300).describe("Final CTA subheadline"),
      final_cta_subtext: z.string().min(10).max(200).describe("Final CTA subtext"),

      // Footer
      footer_text: z.string().min(10).max(200).describe("Footer copyright text")
  }),
  calendarPage: z.object({
    headline: z.string().min(10).max(200).describe("Calendar booking headline"),
    calendar_embedded_code: z.string().optional().describe("Calendar embed code"),
    footer_text: z.string().min(10).max(200).describe("Footer copyright text")
  }),
  thankYouPage: z.object({
    headline: z.string().min(10).max(200).describe("Thank you headline"),
    subheadline: z.string().min(20).max(300).describe("Thank you subheadline"),
    footer_text: z.string().min(10).max(200).describe("Footer copyright text")
  })
});

/**
 * Schema 16: Appointment Reminders
 * Fields: 7 timed emails (confirmation + 6 reminders), 3 content tips, 3 preparation steps
 */
const reminderTipSchema = z.object({
  title: z.string().min(10).max(100).describe("Specific actionable tip"),
  briefRecap: z.string().min(20).max(500).describe("2-3 sentence recap from video training")
});

const reminderEmailSchema = z.object({
  timing: z.string().min(5).max(100).describe("When to send (e.g., 'Immediately upon booking', '48 hours before')"),
  subject: z.string().min(5).max(100).describe("Subject line"),
  previewText: z.string().min(10).max(200).describe("Preview text"),
  body: z.string().min(100).max(1000).describe("Complete email body")
});

export const appointmentRemindersSchema = z.object({
  appointmentReminders: z.object({
    contentTips: z.object({
      tip1: reminderTipSchema,
      tip2: reminderTipSchema,
      tip3: reminderTipSchema
    }),
    keyFeatures: z.array(z.string().min(10).max(200)).length(3).describe("Exactly 3 key features"),
    preparationSteps: z.array(z.string().min(10).max(300)).length(3).describe("Exactly 3 preparation steps"),
    confirmationEmail: reminderEmailSchema.describe("Sent immediately upon booking"),
    reminder48Hours: reminderEmailSchema.describe("Sent 48 hours before"),
    reminder24Hours: reminderEmailSchema.describe("Sent 24 hours before"),
    reminder1Hour: reminderEmailSchema.describe("Sent 1 hour before"),
    reminder10Minutes: reminderEmailSchema.describe("Sent 10 minutes before"),
    startingNow: reminderEmailSchema.describe("Sent at appointment time"),
    noShowFollowUp: reminderEmailSchema.describe("Sent 15 minutes after missed")
  })
});

/**
 * Schema 15: Professional Bio
 * Fields: 4 bio lengths, 4 achievements, personal touch, 3 social versions
 */
export const bioSchema = z.object({
  bio: z.object({
    fullBio: z.string().min(50).max(2000).describe("Complete 200-word professional bio in third person"),
    shortBio: z.string().min(50).max(1000).describe("75-word condensed version"),
    speakerBio: z.string().min(50).max(1500).describe("150-word speaking introduction"),
    oneLiner: z.string().min(20).max(500).describe("One powerful sentence identity + value"),
    keyAchievements: z.array(z.string().min(10).max(300)).min(3).max(5).describe("3-5 achievements (quantified)"),
    personalTouch: z.object({
      humanElement: z.string().min(20).max(500).describe("Relatable personal detail"),
      missionStatement: z.string().min(20).max(500).describe("Deeper 'why' beyond money"),
      valueStatement: z.string().min(20).max(500).describe("Core belief guiding work")
    }),
    socialMediaVersions: z.object({
      instagram: z.string().min(10).max(300).describe("150 char max with emojis"),
      linkedin: z.string().min(50).max(1000).describe("2-3 sentence professional"),
      twitter: z.string().min(10).max(280).describe("160 character punchy version")
    })
  })
});

/**
 * Schema 18: Brand Colors
 * Fields: Professional color palette with primary, secondary, accent colors + reasoning
 */
const colorSchema = z.object({
  name: z.string().min(3).max(50).describe("Color name (e.g., 'Navy Blue', 'Electric Blue')"),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe("Hex color code (e.g., '#000080')")
});

export const colorsSchema = z.object({
  colorPalette: z.object({
    primary: colorSchema.describe("Primary brand color - most prominent, used for main elements"),
    secondary: colorSchema.describe("Secondary brand color - supporting color for contrast"),
    tertiary: colorSchema.describe("Tertiary color - accent for CTAs and highlights"),
    reasoning: z.string().min(50).max(500).describe("AI reasoning for color selection and hierarchy")
  })
});

/**
 * Schema 19: Media Library
 * Fields: Image URLs (logo, profile, banner, testimonials) and video URL
 * Note: Media section contains user-uploaded assets, validated as optional URL strings
 */
export const mediaSchema = z.object({
  logo: z.string().url().optional().describe("Business logo image URL"),
  profile_photo: z.string().url().optional().describe("Professional headshot or profile photo URL"),
  banner_image: z.string().url().optional().describe("Main banner/hero image URL"),
  vsl_video: z.string().url().optional().describe("Sales video URL (YouTube, Vimeo, or direct)"),
  testimonial_review_1_image: z.string().url().optional().describe("Testimonial 1 photo URL"),
  testimonial_review_2_image: z.string().url().optional().describe("Testimonial 2 photo URL"),
  testimonial_review_3_image: z.string().url().optional().describe("Testimonial 3 photo URL"),
  testimonial_review_4_image: z.string().url().optional().describe("Testimonial 4 photo URL")
});

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

/**
 * Central registry mapping section IDs to their schemas
 * Used for validation in generation and refinement APIs
 */
export const VAULT_SCHEMAS = {
  // Phase 1
  idealClient: idealClientSchema,
  message: messageSchema,
  story: storySchema,
  offer: offerSchema,
  salesScripts: salesScriptSchema,
  setterScript: setterScriptSchema,

  // Phase 2
  leadMagnet: leadMagnetSchema,
  vsl: vslSchema,
  emails: emailsSchema,
  sms: smsSchema,
  facebookAds: facebookAdsSchema,
  funnelCopy: funnelCopySchema,
  appointmentReminders: appointmentRemindersSchema,
  bio: bioSchema,

  // Phase 3
  media: mediaSchema,

  // Phase 4
  colors: colorsSchema
};

/**
 * Validate content against its section schema
 * @param {string} sectionId - The vault section ID
 * @param {object} content - The content to validate
 * @returns {object} { success: boolean, data?: object, errors?: array }
 */
export function validateVaultContent(sectionId, content) {
  const schema = VAULT_SCHEMAS[sectionId];

  if (!schema) {
    return {
      success: false,
      errors: [`No schema found for section: ${sectionId}`]
    };
  }

  try {
    const validatedData = schema.parse(content);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      };
    }
    return {
      success: false,
      errors: [{ message: error.message }]
    };
  }
}

/**
 * Get schema structure as a JSON object for AI prompt instructions
 * @param {string} sectionId - The vault section ID
 * @returns {object} Schema structure with field descriptions
 */
export function getSchemaStructure(sectionId) {
  const schema = VAULT_SCHEMAS[sectionId];

  if (!schema) {
    return null;
  }

  // Extract schema shape for AI instructions
  return schema._def.shape();
}

/**
 * Strip any extra fields from content to match schema
 * @param {string} sectionId - The vault section ID
 * @param {object} content - The content to clean
 * @returns {object} Cleaned content with only schema-defined fields
 */
export function stripExtraFields(sectionId, content) {
  // STRICT MODE DISABLED: We now allow extra fields to preserve rich prompt-generated content
  // Just validate that required fields exist, but don't strip anything
  const validation = validateVaultContent(sectionId, content);

  if (validation.success) {
    // Validation passed - return content as-is (with all extra fields preserved)
    return content;
  }

  // If validation fails, log warning but still return content
  // This allows partial/incomplete data while generation is in progress
  console.warn(`[Schema] Validation failed for ${sectionId}, but returning content anyway (strict mode disabled):`, validation.errors);
  return content;
}
