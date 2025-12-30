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
 * - What Makes Them Pay (2 bullets)
 * - How to Talk to Them (3 coffee-talk lines)
 */
export const idealClientSchema = z.object({
  idealClientSnapshot: z.object({
    bestIdealClient: z.string().min(20).max(500).describe("One sentence describing the ideal premium buyer"),
    topChallenges: z.array(z.string().min(10).max(300)).length(3).describe("Exactly 3 top challenges they face"),
    whatTheyWant: z.array(z.string().min(10).max(300)).length(3).describe("Exactly 3 desired outcomes"),
    whatMakesThemPay: z.array(z.string().min(10).max(300)).length(2).describe("Exactly 2 payment triggers"),
    howToTalkToThem: z.array(z.string().min(20).max(400)).length(3).describe("Exactly 3 coffee-talk lines")
  }).strict()
}).strict();

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
  }).strict()
}).strict();

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
    }).strict().describe("A) STORY BLUEPRINT - Bullet outline using 6 phases"),
    networkingStory: z.string().min(200).max(600).describe("B) 60-90s Networking Story - Fast, conversational, 1-2 sentences per phase"),
    stageStory: z.string().min(800).max(2000).describe("C) 3-5 min Stage/Podcast Story - Cinematic, emotional, detailed with lesson lines"),
    oneLinerStory: z.string().min(50).max(200).describe("D) 15-25s One-Liner Story - Pit → breakthrough → outcome (compressed)"),
    socialPostVersion: z.string().min(150).max(500).describe("E) Social Post Version - 150-220 words, hook → pit → breakthrough → lesson"),
    emailStory: z.object({
      subjectLine: z.string().min(5).max(100).describe("Email subject line"),
      body: z.string().min(200).max(800).describe("F) Short Email Story - 200-350 words, compressed arc")
    }).strict(),
    pullQuotes: z.array(z.string().min(10).max(200)).min(5).max(7).describe("G) Signature Pull Quotes - 5-7 short, quotable lines")
  }).strict()
}).strict();

/**
 * Schema 4: Signature Offer
 * Output Format:
 * - Offer Name
 * - Who It's For
 * - The Promise
 * - Offer Mode (Transformation or Service Delivery)
 * - 7-Step Blueprint (names only)
 * - Tier 1 Signature Offer (Live Group)
 * - CTA
 */
export const offerSchema = z.object({
  signatureOffer: z.object({
    offerName: z.string().min(5).max(100).describe("Branded system/offer name"),
    whoItsFor: z.string().min(20).max(300).describe("Who this offer is for - specific ideal client"),
    thePromise: z.string().min(50).max(500).describe("The transformation promise - In X weeks, I help [IC] go from [problem] to [outcome]"),
    offerMode: z.enum(['Transformation', 'Service Delivery']).describe("Offer type"),
    sevenStepBlueprint: z.object({
      step1: z.string().min(5).max(100).describe("Step 1 name"),
      step2: z.string().min(5).max(100).describe("Step 2 name"),
      step3: z.string().min(5).max(100).describe("Step 3 name"),
      step4: z.string().min(5).max(100).describe("Step 4 name"),
      step5: z.string().min(5).max(100).describe("Step 5 name"),
      step6: z.string().min(5).max(100).describe("Step 6 name"),
      step7: z.string().min(5).max(100).describe("Step 7 name")
    }).strict().describe("7-Step Blueprint - names only"),
    tier1SignatureOffer: z.object({
      delivery: z.string().min(10).max(200).describe("Delivery format - Live group (8 weeks)"),
      whatTheyGet: z.string().min(50).max(800).describe("What they get - complete list of deliverables"),
      recommendedPrice: z.string().min(5).max(100).describe("Recommended price range")
    }).strict().describe("Tier 1 Signature Offer (Live Group)"),
    cta: z.string().min(10).max(200).describe("Call to action")
  }).strict()
}).strict();

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
export const salesScriptSchema = z.object({
  closerCallScript: z.object({
    quickOutline: z.object({
      callGoal: z.string().min(20).max(300).describe("Goal of this call - 1 sentence"),
      callFlow: z.object({
        part1_openingPermission: z.string().min(50).max(800).describe("Part 1: Opening + Permission"),
        part2_discovery: z.string().min(100).max(1500).describe("Part 2: Discovery (7 questions)"),
        part3_challengesStakes: z.string().min(50).max(800).describe("Part 3: Challenges + Stakes"),
        part4_recapConfirmation: z.string().min(50).max(800).describe("Part 4: Recap + Confirmation"),
        part5_threeStepPlan: z.string().min(50).max(800).describe("Part 5: 3-Step Plan"),
        part6_closeNextSteps: z.string().min(50).max(800).describe("Part 6: Paid-in-Full Close + Next Steps")
      }).strict().describe("Call Flow - 6 parts")
    }).strict().describe("QUICK CALL OUTLINE (SHOW FIRST)")
  }).strict()
}).strict();

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
      }).strict().describe("Call Flow - 10 steps"),
      setterMindset: z.string().min(30).max(500).describe("Setter mindset: Be curious. Lead with service. Don't pitch. Book the call.")
    }).strict().describe("QUICK SETTER CALL OUTLINE (SHOW FIRST)")
  }).strict()
}).strict();

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
}).strict();

export const leadMagnetSchema = z.object({
  leadMagnet: z.object({
    leadMagnetIdea: z.object({
      concept: z.string().min(20).max(500).describe("Clear concept for value-driven gift"),
      coreProblemSolved: z.string().min(20).max(300).describe("Core problem solved"),
      keyOutcomeDelivered: z.string().min(20).max(300).describe("Key outcome delivered"),
      alignmentWithMethod: z.string().min(20).max(500).describe("Alignment with unique method"),
      format: z.string().min(5).max(100).describe("PDF guide, checklist, video training, template, etc.")
    }).strict(),
    titleAndHook: z.object({
      mainTitle: z.string().min(10).max(200).describe("Compelling benefit-focused title"),
      subtitle: z.string().min(10).max(300).describe("Optional subtitle for clarity"),
      alternativeTitles: z.array(z.string().min(10).max(200)).length(3).describe("Exactly 3 alternative titles"),
      whyItsIrresistible: z.string().min(20).max(500).describe("Why this title will grab attention")
    }).strict(),
    audienceConnection: z.object({
      openingHook: z.string().min(20).max(500).describe("Powerful first line about pain/desire"),
      painAcknowledgment: z.string().min(20).max(500).describe("Acknowledgment of frustration"),
      desireValidation: z.string().min(20).max(500).describe("Validation of what they want"),
      trustBuilder: z.string().min(20).max(500).describe("Credibility statement"),
      transitionToValue: z.string().min(20).max(500).describe("Transition into what they'll receive")
    }).strict(),
    coreContent: z.object({
      deliverable1: leadMagnetDeliverableSchema,
      deliverable2: leadMagnetDeliverableSchema,
      deliverable3: leadMagnetDeliverableSchema,
      deliverable4: leadMagnetDeliverableSchema,
      deliverable5: leadMagnetDeliverableSchema
    }).strict(),
    leadMagnetCopy: z.object({
      headline: z.string().min(10).max(200).describe("Main headline for landing page"),
      subheadline: z.string().min(20).max(300).describe("Supporting subheadline"),
      bulletPoints: z.array(z.string().min(10).max(200)).length(4).describe("Exactly 4 bullet points"),
      softCta: z.string().min(10).max(200).describe("Soft call-to-action"),
      ctaButtonText: z.string().min(5).max(50).describe("Button text"),
      socialProof: z.string().min(20).max(300).describe("Credibility statement"),
      urgencyElement: z.string().min(10).max(200).describe("Limited time message"),
      privacyNote: z.string().min(10).max(200).describe("Privacy statement")
    }).strict(),
    ctaIntegration: z.object({
      connectionToOffer: z.string().min(20).max(500).describe("Tie to main program"),
      hintAtDeeperTransformation: z.string().min(20).max(500).describe("Hint at full program potential"),
      nextStepInvitation: z.string().min(20).max(500).describe("Invitation after consuming lead magnet"),
      emailOptInValue: z.string().min(20).max(500).describe("Why email is worth it")
    }).strict(),
    voiceAndTone: z.object({
      brandVoiceDescription: z.string().min(20).max(500).describe("Brand voice characteristics"),
      authenticityMarkers: z.array(z.string().min(5).max(200)).length(3).describe("Exactly 3 authenticity markers"),
      languageToUse: z.array(z.string().min(3).max(100)).length(3).describe("Exactly 3 language examples to use"),
      languageToAvoid: z.array(z.string().min(3).max(100)).length(3).describe("Exactly 3 language examples to avoid")
    }).strict()
  }).strict()
}).strict();

/**
 * Schema 7: VSL (Video Sales Letter)
 * Fields: Full script (2500-3500 words), 3 tips, 3 hooks, objection handlers, 3 closes
 */
const vslTipSchema = z.object({
  tipTitle: z.string().min(10).max(100).describe("Tip title (e.g., 'Tip #1: [Specific Title]')"),
  tipContent: z.string().min(50).max(800).describe("Core teaching"),
  actionStep: z.string().min(20).max(500).describe("Specific implementation"),
  whyItWorks: z.string().min(20).max(500).describe("Why this matters")
}).strict();

const vslStepSchema = z.object({
  step: z.number().int().min(1).max(4),
  title: z.string().min(5).max(100).describe("Step title"),
  description: z.string().min(20).max(500).describe("What happens"),
  benefit: z.string().min(20).max(300).describe("Result")
}).strict();

const objectionHandlerSchema = z.object({
  objection: z.string().min(10).max(200).describe("Common objection"),
  response: z.string().min(50).max(800).describe("Complete response"),
  placementInScript: z.string().min(10).max(200).describe("Where to place in script")
}).strict();

export const vslSchema = z.object({
  vslScript: z.object({
    fullScript: z.string().min(2500).max(5000).describe("2500-3500 word complete teleprompter script - NO HEADINGS, NO FORMATTING"),
    estimatedLength: z.string().min(5).max(50).describe("Estimated video length (e.g., '18-22 minutes')"),
    hookOptions: z.array(z.string().min(20).max(500)).length(3).describe("Exactly 3 hook options"),
    threeTips: z.array(vslTipSchema).length(3).describe("Exactly 3 tips"),
    stepsToSuccess: z.array(vslStepSchema).length(4).describe("Exactly 4 steps to success"),
    callToActionName: z.string().min(10).max(200).describe("CTA name (e.g., 'Book Your [Branded Call Name]')"),
    objectionHandlers: z.array(objectionHandlerSchema).min(3).max(10).describe("3-10 objection handlers"),
    urgencyElements: z.array(z.string().min(20).max(300)).length(3).describe("Exactly 3 urgency elements"),
    socialProofMentions: z.array(z.string().min(20).max(300)).min(3).max(10).describe("3-10 social proof mentions"),
    guarantee: z.string().min(50).max(500).describe("Guarantee statement"),
    closingSequence: z.object({
      urgencyClose: z.string().min(50).max(800).describe("Urgency close script"),
      scarcityClose: z.string().min(50).max(800).describe("Scarcity close script"),
      inspirationClose: z.string().min(50).max(800).describe("Inspiration close script")
    }).strict()
  }).strict()
}).strict();

/**
 * Schema 8: Email & SMS Sequences
 * Fields: 18 emails, 3 tips, 4 success steps, 5 FAQs, success story
 */
const emailTipSchema = z.object({
  title: z.string().min(10).max(100).describe("Specific actionable title"),
  content: z.string().min(50).max(800).describe("Full explanation"),
  actionStep: z.string().min(20).max(500).describe("Specific action")
}).strict();

const emailStepSchema = z.object({
  step: z.number().int().min(1).max(4),
  title: z.string().min(5).max(100).describe("Step name"),
  description: z.string().min(20).max(500).describe("Result")
}).strict();

const faqSchema = z.object({
  question: z.string().min(10).max(200).describe("FAQ question"),
  answer: z.string().min(20).max(800).describe("Complete answer")
}).strict();

const successStorySchema = z.object({
  clientName: z.string().min(5).max(100).describe("Client name or type"),
  beforeState: z.string().min(20).max(500).describe("Specific before state"),
  transformation: z.string().min(20).max(500).describe("Results achieved"),
  timeframe: z.string().min(5).max(100).describe("How long it took"),
  quote: z.string().min(20).max(500).describe("Client quote or paraphrase")
}).strict();

const emailItemSchema = z.object({
  emailNumber: z.number().int().min(1).max(18),
  dayToSend: z.string().min(3).max(50).describe("Day to send (e.g., 'Day 1', 'Day 3')"),
  purpose: z.string().min(10).max(300).describe("Email purpose"),
  subjectLine: z.string().min(5).max(100).describe("Subject line"),
  previewText: z.string().min(10).max(200).describe("Preview text"),
  body: z.string().min(200).max(1000).describe("200-400 words - complete body with {{contact.first_name}}")
}).strict();

export const emailsSchema = z.object({
  emailSequence: z.object({
    tips: z.object({
      tip1: emailTipSchema,
      tip2: emailTipSchema,
      tip3: emailTipSchema
    }).strict(),
    stepsToSuccess: z.array(emailStepSchema).length(4).describe("Exactly 4 success steps"),
    faqs: z.array(faqSchema).length(5).describe("Exactly 5 FAQs"),
    successStory: successStorySchema,
    emails: z.array(emailItemSchema).length(18).describe("Exactly 18 emails")
  }).strict()
}).strict();

/**
 * Schema 9: Facebook Ads
 * Fields: 10 unique ad variations with different angles
 */
const facebookAdSchema = z.object({
  adNumber: z.number().int().min(1).max(10),
  angle: z.string().min(10).max(200).describe("Angle description (pain/outcome/story/proof/urgency/question/etc.)"),
  headline: z.string().min(10).max(100).describe("Ad headline"),
  primaryText: z.string().min(300).max(1500).describe("Full ad copy (500+ words of complete, conversational copy with emojis)"),
  callToActionButton: z.string().min(5).max(50).describe("Button text (Learn More/Download/Sign Up/etc.)"),
  targetAudience: z.string().min(20).max(300).describe("Description of target audience")
}).strict();

export const facebookAdsSchema = z.object({
  facebookAds: z.object({
    ads: z.array(facebookAdSchema).length(10).describe("Exactly 10 unique ad variations")
  }).strict()
}).strict();

/**
 * Schema 10: Funnel Page Copy
 * Fields: 5 opt-in headlines, thank you page, confirmation script, 7 FAQs, 4 success steps
 */
const funnelStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(4),
  headline: z.string().min(10).max(100).describe("Step headline"),
  description: z.string().min(20).max(500).describe("Step description"),
  benefit: z.string().min(20).max(300).describe("Benefit")
}).strict();

export const funnelCopySchema = z.object({
  funnelCopy: z.object({
    optInHeadlines: z.array(z.string().min(10).max(200)).length(5).describe("Exactly 5 opt-in headline variations"),
    optInPageCopy: z.object({
      headline: z.string().min(10).max(200).describe("Main attention-grabbing headline"),
      subheadline: z.string().min(20).max(300).describe("Supporting text"),
      heroSection: z.string().min(50).max(500).describe("2-3 sentences hook"),
      bulletPoints: z.array(z.string().min(10).max(200)).length(4).describe("Exactly 4 bullet points"),
      ctaButtonText: z.string().min(5).max(50).describe("CTA button text"),
      socialProof: z.string().min(20).max(300).describe("Numbers + social proof"),
      urgencyElement: z.string().min(10).max(200).describe("Limited time message"),
      privacyNote: z.string().min(10).max(200).describe("Privacy statement")
    }).strict(),
    thankYouPageCopy: z.object({
      headline: z.string().min(10).max(200).describe("Confirmation headline"),
      subheadline: z.string().min(20).max(300).describe("Confirmation message"),
      message: z.string().min(50).max(500).describe("What to do while waiting"),
      nextSteps: z.array(z.string().min(10).max(200)).length(3).describe("Exactly 3 next steps"),
      bridgeToCall: z.string().min(50).max(500).describe("Bridge to consultation"),
      ctaButtonText: z.string().min(5).max(50).describe("CTA button")
    }).strict(),
    confirmationPageScript: z.object({
      fullScript: z.string().min(200).max(1000).describe("90-120 second teleprompter-ready script"),
      keyPoints: z.array(z.string().min(10).max(300)).min(5).max(10).describe("5-10 key points"),
      estimatedLength: z.string().min(5).max(50).describe("Estimated length (e.g., '90-120 seconds')")
    }).strict(),
    faqs: z.array(faqSchema).length(7).describe("Exactly 7 FAQs"),
    stepsToSuccess: z.array(funnelStepSchema).length(4).describe("Exactly 4 success steps"),
    salesPageCopy: z.object({
      heroHeadline: z.string().min(10).max(200).describe("Main transformation headline")
    }).strict()
  }).strict()
}).strict();

/**
 * Schema 16: Appointment Reminders
 * Fields: 7 timed emails (confirmation + 6 reminders), 3 content tips, 3 preparation steps
 */
const reminderTipSchema = z.object({
  title: z.string().min(10).max(100).describe("Specific actionable tip"),
  briefRecap: z.string().min(20).max(500).describe("2-3 sentence recap from video training")
}).strict();

const reminderEmailSchema = z.object({
  timing: z.string().min(5).max(100).describe("When to send (e.g., 'Immediately upon booking', '48 hours before')"),
  subject: z.string().min(5).max(100).describe("Subject line"),
  previewText: z.string().min(10).max(200).describe("Preview text"),
  body: z.string().min(100).max(1000).describe("Complete email body")
}).strict();

export const appointmentRemindersSchema = z.object({
  appointmentReminders: z.object({
    contentTips: z.object({
      tip1: reminderTipSchema,
      tip2: reminderTipSchema,
      tip3: reminderTipSchema
    }).strict(),
    keyFeatures: z.array(z.string().min(10).max(200)).length(3).describe("Exactly 3 key features"),
    preparationSteps: z.array(z.string().min(10).max(300)).length(3).describe("Exactly 3 preparation steps"),
    confirmationEmail: reminderEmailSchema.describe("Sent immediately upon booking"),
    reminder48Hours: reminderEmailSchema.describe("Sent 48 hours before"),
    reminder24Hours: reminderEmailSchema.describe("Sent 24 hours before"),
    reminder1Hour: reminderEmailSchema.describe("Sent 1 hour before"),
    reminder10Minutes: reminderEmailSchema.describe("Sent 10 minutes before"),
    startingNow: reminderEmailSchema.describe("Sent at appointment time"),
    noShowFollowUp: reminderEmailSchema.describe("Sent 15 minutes after missed")
  }).strict()
}).strict();

/**
 * Schema 15: Professional Bio
 * Fields: 4 bio lengths, 4 achievements, personal touch, 3 social versions
 */
export const bioSchema = z.object({
  bio: z.object({
    fullBio: z.string().min(150).max(500).describe("Complete 200-word professional bio in third person"),
    shortBio: z.string().min(50).max(200).describe("75-word condensed version"),
    speakerBio: z.string().min(100).max(400).describe("150-word speaking introduction"),
    oneLiner: z.string().min(20).max(200).describe("One powerful sentence identity + value"),
    keyAchievements: z.array(z.string().min(10).max(200)).length(4).describe("Exactly 4 achievements (quantified)"),
    personalTouch: z.object({
      humanElement: z.string().min(20).max(300).describe("Relatable personal detail"),
      missionStatement: z.string().min(20).max(300).describe("Deeper 'why' beyond money"),
      valueStatement: z.string().min(20).max(300).describe("Core belief guiding work")
    }).strict(),
    socialMediaVersions: z.object({
      instagram: z.string().min(50).max(150).describe("150 char max with emojis"),
      linkedin: z.string().min(50).max(300).describe("2-3 sentence professional"),
      twitter: z.string().min(50).max(160).describe("160 character punchy version")
    }).strict()
  }).strict()
}).strict();

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
  facebookAds: facebookAdsSchema,
  funnelCopy: funnelCopySchema,
  appointmentReminders: appointmentRemindersSchema,
  bio: bioSchema
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
  const validation = validateVaultContent(sectionId, content);

  if (validation.success) {
    return validation.data;
  }

  // If validation fails, try to extract only valid fields
  // This is a fallback - ideally validation should pass
  console.warn(`[Schema] Validation failed for ${sectionId}, attempting to extract valid fields:`, validation.errors);

  // Return original content as fallback
  // In production, you might want to implement more sophisticated field extraction
  return content;
}
