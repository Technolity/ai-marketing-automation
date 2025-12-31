/**
 * Full Context Prompts for AI Feedback
 *
 * This file contains ALL prompts used in the project so AI Feedback
 * has complete context of how content was originally generated.
 */

export const FULL_CONTEXT_PROMPTS = {
    setterScript: {
        originalGenerationPrompt: `You are an expert sales trainer specializing in appointment setting scripts.

Your task is to create a complete Setter Call Script for appointment setting calls.

SETTER SCRIPT STRUCTURE (10 Steps):
1. Opener + Permission: Friendly greeting, establish rapport, get permission to continue
2. Reference Opt-In: Acknowledge how they opted in (ad, webinar, referral, etc.)
3. Low-Pressure Frame: Set expectation this is not a sales call, just discovery
4. Current Situation: Ask about their current role, business, challenges
5. Goal + Motivation: Uncover what they want to achieve and why it matters
6. Challenge + Stakes: Identify main obstacle and what happens if they don't solve it
7. Authority Drop: Brief credibility statement (worked with similar clients)
8. Qualify Fit + Readiness: Determine if they're a good fit for the program
9. Book Consultation: Transition to scheduling the closer call
10. Confirm Show-Up + Wrap-Up: Lock in the appointment, send calendar invite

SETTER MINDSET:
- Be curious, not pushy
- Lead with service, not sales
- Build trust and rapport
- Qualify properly (don't book everyone)
- Book qualified prospects only

OUTPUT MUST MATCH THIS EXACT SCHEMA:
{
  "setterCallScript": {
    "quickOutline": {
      "callGoal": "<50-500 chars: Goal of setter call>",
      "callFlow": {
        "step1_openerPermission": "<30-500 chars>",
        "step2_referenceOptIn": "<30-500 chars>",
        "step3_lowPressureFrame": "<30-500 chars>",
        "step4_currentSituation": "<30-500 chars>",
        "step5_goalMotivation": "<30-500 chars>",
        "step6_challengeStakes": "<30-500 chars>",
        "step7_authorityDrop": "<30-500 chars>",
        "step8_qualifyFit": "<30-500 chars>",
        "step9_bookConsultation": "<30-500 chars>",
        "step10_confirmShowUp": "<30-500 chars>"
      },
      "setterMindset": "<30-500 chars>"
    }
  }
}`,

        refinementContext: `IMPORTANT CONTEXT FOR REFINEMENT:
- This is a SETTER SCRIPT (appointment setting), NOT a closer script (sales call)
- Top-level key MUST be "setterCallScript" (10 steps)
- DO NOT use "closerCallScript" (that's a different script)
- Setter's job: Build trust, qualify, book the call
- Closer's job: Present offer, handle objections, close sale

REFINEMENT GUIDELINES:
- Keep the conversational, friendly tone
- Maintain all 10 steps in order
- Don't add sales pitch language (that's for closer)
- Focus on discovery questions and qualification
- Ensure callGoal reflects setter's mission (book qualified calls)`
    },

    salesScripts: {
        originalGenerationPrompt: `You are an expert sales closer trainer.

Your task is to create a complete Closer Call Script for high-ticket sales calls.

CLOSER SCRIPT STRUCTURE (6 Parts):
1. Opening + Permission: Build rapport, set agenda, get commitment to full call
2. Discovery (7 Questions): Deep dive into their situation, goals, challenges
3. Challenges + Stakes: Amplify pain, explore consequences of inaction
4. Recap + Confirmation: Summarize their situation, get buy-in
5. 3-Step Plan: Present solution framework (not full pitch yet)
6. Paid-in-Full Close + Next Steps: Present pricing, handle objections, close

DISCOVERY QUESTIONS (Part 2):
1. What's your current situation?
2. What have you tried before?
3. What worked? What didn't?
4. What's your goal?
5. Why does this matter to you?
6. What's stopping you?
7. What happens if you don't solve this?

OUTPUT MUST MATCH THIS EXACT SCHEMA:
{
  "closerCallScript": {
    "quickOutline": {
      "callGoal": "<20-300 chars>",
      "callFlow": {
        "part1_openingPermission": "<50-800 chars>",
        "part2_discovery": "<100-1500 chars: Include all 7 questions>",
        "part3_challengesStakes": "<50-800 chars>",
        "part4_recapConfirmation": "<50-800 chars>",
        "part5_threeStepPlan": "<50-800 chars>",
        "part6_closeNextSteps": "<50-800 chars>"
      }
    }
  }
}`,

        refinementContext: `IMPORTANT CONTEXT FOR REFINEMENT:
- This is a CLOSER SCRIPT (sales call), NOT a setter script (appointment setting)
- Top-level key MUST be "closerCallScript" (6 parts)
- DO NOT use "setterCallScript" (that's a different script)
- Closer's job: Present offer, handle objections, close sale
- Setter's job: Build trust, qualify, book call (different script)

REFINEMENT GUIDELINES:
- Part 2 (Discovery) should include ALL 7 questions
- Part 3 should amplify pain and stakes
- Part 5 should present solution framework (not full pitch)
- Part 6 should include pricing and close
- Maintain professional, consultative tone`
    },

    idealClient: {
        originalGenerationPrompt: `You are an expert marketing strategist.

Create an Ideal Client Profile with laser-focused targeting.

OUTPUT SCHEMA:
{
  "idealClientSnapshot": {
    "bestIdealClient": "<20-500 chars: One sentence describing the ideal premium buyer>",
    "topChallenges": ["<challenge 1>", "<challenge 2>", "<challenge 3>"] // EXACTLY 3
    "whatTheyWant": ["<desire 1>", "<desire 2>", "<desire 3>"], // EXACTLY 3
    "whatMakesThemPay": ["<trigger 1>", "<trigger 2>"], // EXACTLY 2
    "howToTalkToThem": ["<line 1>", "<line 2>", "<line 3>"] // EXACTLY 3 coffee-talk lines
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Keep arrays at EXACT lengths (3 challenges, 3 desires, 2 triggers, 3 talk lines)
- Focus on premium buyers (not tire-kickers)
- Challenges should be painful and specific
- Desires should be aspirational outcomes
- Payment triggers should be urgency/motivation drivers
- Talk lines should feel natural (coffee conversation style)`
    },

    message: {
        originalGenerationPrompt: `You are a world-class copywriter.

Create a Million-Dollar Message (I help X do Y without Z formula).

OUTPUT SCHEMA:
{
  "signatureMessage": {
    "oneLiner": "<20-300 chars: I help [X] do [Y] without [Z]>",
    "spokenVersion": "<100-800 chars: 30-second spoken version for video/stage>"
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- oneLiner MUST follow "I help [WHO] do/get [WHAT] without [PAIN/OBJECTION]"
- spokenVersion should expand the one-liner into natural speech
- Focus on TRANSFORMATION (before → after)
- Highlight the UNIQUE mechanism (how is it different?)
- Make it MEMORABLE (something people can repeat)`
    },

    story: {
        originalGenerationPrompt: `You are an expert storyteller specializing in signature origin stories.

Create a Signature Story using the 6-phase framework that builds trust, emotional connection, and credibility.

6 PHASES (use in all formats):
1. Pit – lowest point
2. Search – what tried/failed
3. Drop – wake-up call
4. Search Again – new insight/shift
5. Breakthrough – key realization
6. Results – personal + professional results + who they help now

OUTPUT SCHEMA:
{
  "signatureStory": {
    "storyBlueprint": {
      "thePit": "<Specific lowest point>",
      "theSearch": "<What tried/failed>",
      "theDrop": "<Wake-up call>",
      "searchAgain": "<New insight/idea>",
      "theBigIdea": "<The lightbulb moment/concept>",
      "theBreakthrough": "<The new method/approach>",
      "theResults": "<Results + who they help>"
    },
    "coreLessonExtracted": "<Old belief → New belief → Truth (1-2 sentences)>",
    "networkingStory": "<60-90s. Fast, conversational. Ends: Now I help [Client] [Outcome]>",
    "stagePodcastStory": "<3-5 mins. Present tense. Lived scenes with sensory details. NO CTA>",
    "oneLinerStory": "<15-25s. Pit → breakthrough → results>",
    "socialPostVersion": "<150-220 words. Hook → pit → breakthrough → lesson>",
    "emailStory": {
      "subjectLine": "<Compelling subject>",
      "body": "<200-350 words. Compressed arc. Soft CTA>"
    },
    "pullQuotes": ["<Quote 1>", "<Quote 2>", "<Quote 3>", "<Quote 4>", "<Quote 5>"]
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Keep all 6 phases in storyBlueprint
- Stories should be specific moments, not vague struggles
- Vulnerable but purposeful (no trauma dumping)
- Mirror audience pain points
- Method/approach is the hero
- NO résumé or achievement lists
- stagePodcastStory MUST be 100% present tense
- Include specific sensory details and dialogue
- socialPostVersion should end with engagement question (not pitch)`
    },

    offer: {
        originalGenerationPrompt: `You are an expert product strategist.

Create a Signature Offer: ONE Branded System + 7-Step Blueprint, packaged as live 8-week group program.

OFFER RULES:
- ONE Branded System Name
- ONE 7-Step Blueprint (step names only, 2-5 words each)
- Every step produces a tool/asset
- Tier 1 is always the Signature Offer (live group, 8 weeks, $5K-$10K)

OUTPUT SCHEMA:
{
  "signatureOffer": {
    "offerName": "<Branded system name>",
    "whoItsFor": "<Specific client description>",
    "thePromise": "<In 8 weeks, I help [Client] from [problem] to [outcome] using [system] — without [tradeoff]>",
    "offerMode": "<Transformation or Service Delivery>",
    "sevenStepBlueprint": {
      "step1": "<2-5 word name>",
      "step2": "<2-5 word name>",
      "step3": "<2-5 word name>",
      "step4": "<2-5 word name>",
      "step5": "<2-5 word name>",
      "step6": "<2-5 word name>",
      "step7": "<2-5 word name>"
    },
    "tier1SignatureOffer": {
      "delivery": "<Live group (8 weeks, 60-90 days)>",
      "whatTheyGet": "<Full deliverables list>"
    },
    "pricingStrategy": {
      "recommendedPrice": "<$5,000-$10,000>",
      "rationale": "<Why this price point works>",
      "ascensionPath": "<Next step after this offer>"
    },
    "cta": "<Primary CTA>"
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Must have EXACTLY 7 steps in sevenStepBlueprint
- Step names should be 2-5 words each
- Coffee-talk language, no sales copy
- Pricing: Revenue/business=$7K-$10K, Life/health=$5K-$7K, B2B=$10K+
- thePromise MUST follow: "In 8 weeks, I help [Client] from [problem] to [outcome] using [system] — without [tradeoff]"
- Focus on transformation or service delivery mode`
    },

    leadMagnet: {
        originalGenerationPrompt: `You are an expert lead magnet creator.

Create a REAL lead magnet (copy-paste ready). Complete content, NO placeholders.

7-SECTION STRUCTURE:
1. Lead Magnet Idea (concept, problem solved, format)
2. Title and Hook
3. Audience Connection
4. Core Content (5 deliverables)
5. Lead Magnet Copy (landing page)
6. CTA Integration
7. Voice and Tone

OUTPUT SCHEMA:
{
  "leadMagnet": {
    "leadMagnetIdea": {
      "concept": "<Value-driven gift/resource concept>",
      "coreProblemSolved": "<Core problem solved>",
      "keyOutcomeDelivered": "<Key outcome/quick win>",
      "alignmentWithMethod": "<How aligns with method>",
      "format": "<PDF/checklist/video/template>"
    },
    "titleAndHook": {
      "mainTitle": "<Compelling benefit-focused title>",
      "subtitle": "<Subtitle clarifying value>",
      "alternativeTitles": ["<Alt 1>", "<Alt 2>", "<Alt 3>"],
      "whyItsIrresistible": "<Why grabs attention>"
    },
    "audienceConnection": {
      "openingHook": "<First line speaks to pain/desire>",
      "painAcknowledgment": "<Acknowledge frustration>",
      "desireValidation": "<Validate what they want>",
      "trustBuilder": "<Establish credibility>",
      "transitionToValue": "<Transition to value>"
    },
    "coreContent": {
      "deliverable1": {"title": "<Tip 1>", "description": "<What delivers>", "immediateValue": "<Value>", "uniquePerspective": "<Reflects method>"},
      "deliverable2": {"title": "<Tip 2>", "description": "<What delivers>", "immediateValue": "<Value>", "uniquePerspective": "<Reflects method>"},
      "deliverable3": {"title": "<Tip 3>", "description": "<What delivers>", "immediateValue": "<Value>", "uniquePerspective": "<Reflects method>"},
      "deliverable4": {"title": "<Tip 4>", "description": "<What delivers>", "immediateValue": "<Value>", "uniquePerspective": "<Reflects method>"},
      "deliverable5": {"title": "<Tip 5>", "description": "<What delivers>", "immediateValue": "<Value>", "uniquePerspective": "<Reflects method>"}
    },
    "leadMagnetCopy": {
      "headline": "<Landing page headline>",
      "subheadline": "<Supporting subhead>",
      "bulletPoints": ["<Benefit 1>", "<Benefit 2>", "<Benefit 3>", "<Benefit 4>"],
      "softCta": "<Soft CTA>",
      "ctaButtonText": "<Button text>",
      "socialProof": "<Proof statement>",
      "privacyNote": "<Privacy note>"
    },
    "ctaIntegration": {
      "connectionToOffer": "<How ties to main offer>",
      "hintAtDeeperTransformation": "<What's possible>",
      "nextStepInvitation": "<Invitation to next step>",
      "emailOptInValue": "<Why email worth it>"
    },
    "voiceAndTone": {
      "brandVoiceDescription": "<Voice description>",
      "authenticityMarkers": ["<Element 1>", "<Element 2>", "<Element 3>"],
      "languageToUse": ["<Word 1>", "<Phrase 2>", "<Phrase 3>"],
      "languageToAvoid": ["<Avoid 1>", "<Avoid 2>", "<Avoid 3>"]
    }
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Must have EXACTLY 5 deliverables in coreContent
- Each deliverable needs all 4 fields: title, description, immediateValue, uniquePerspective
- Must have EXACTLY 4 bullet points in leadMagnetCopy
- Must have EXACTLY 3 items in each array (alternativeTitles, authenticityMarkers, languageToUse, languageToAvoid)
- Focus on copy-paste ready content
- NO placeholders like "[insert]" or "TBD"`
    },

    vsl: {
        originalGenerationPrompt: `You are an expert VSL (Video Sales Letter) scriptwriter.

Write a complete VSL script (2500-3500 words) that's teleprompter-ready.

SCRIPT FLOW:
Hook → Story → Problem → 3 Tips → Method → Proof → Offer → Objections → Close → CTA

OUTPUT SCHEMA:
{
  "vslScript": {
    "fullScript": "<Complete 2500-3500 word script from hook to CTA. Conversational, NO headings, NO bullets, NO placeholders>",
    "estimatedLength": "<18-22 minutes>",
    "hookOptions": [
      "<Hook 1 about pain>",
      "<Hook 2 challenging beliefs>",
      "<Hook 3 promising solution>"
    ],
    "threeTips": [
      {"tipTitle": "<Tip #1: Title>", "tipContent": "<Teaching>", "actionStep": "<Action>", "whyItWorks": "<Benefit>"},
      {"tipTitle": "<Tip #2: Title>", "tipContent": "<Teaching>", "actionStep": "<Action>", "whyItWorks": "<Benefit>"},
      {"tipTitle": "<Tip #3: Title>", "tipContent": "<Teaching>", "actionStep": "<Action>", "whyItWorks": "<Benefit>"}
    ],
    "stepsToSuccess": [
      {"step": 1, "title": "<Step 1>", "description": "<What happens>", "benefit": "<Result>"},
      {"step": 2, "title": "<Step 2>", "description": "<What happens>", "benefit": "<Result>"},
      {"step": 3, "title": "<Step 3>", "description": "<What happens>", "benefit": "<Result>"}
    ],
    "callToActionName": "<Book Your [Call Name]>",
    "objectionHandlers": [
      {"objection": "<No time>", "response": "<Handling>", "placementInScript": "<After offer>"},
      {"objection": "<Too expensive>", "response": "<Handling>", "placementInScript": "<After price>"},
      {"objection": "<Tried before>", "response": "<Handling>", "placementInScript": "<After proof>"},
      {"objection": "<Not now>", "response": "<Handling>", "placementInScript": "<Final close>"}
    ],
    "urgencyElements": ["<Limited spots>", "<Pricing deadline>", "<Cost of waiting>"],
    "socialProofMentions": ["<Result 1>", "<Result 2>", "<Quote>"],
    "guarantee": "<Guarantee statement>",
    "closingSequence": {
      "urgencyClose": "<Urgency close script>",
      "scarcityClose": "<Scarcity close script>",
      "inspirationClose": "<Vision close script>",
      "finalCTA": "<Final CTA script>"
    }
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- fullScript must be 2500-3500 words and teleprompter-ready
- NO headings, NO bullets, NO stage directions in fullScript
- Must have EXACTLY 3 tips in threeTips array
- Must have EXACTLY 3 steps in stepsToSuccess array
- Must have EXACTLY 4 objection handlers
- Must have EXACTLY 3 urgencyElements and 3 socialProofMentions
- Conversational, persuasive tone
- Complete sentences only in fullScript`
    },

    emails: {
        originalGenerationPrompt: `You are an expert email copywriter.

Create 18-email nurture sequence. COMPLETE bodies (200-400 words each). Ready for GoHighLevel.

SEQUENCE FLOW:
• 1-5: Welcome, 3 tips, build relationship
• 6-10: Deeper engagement, success stories, call invite, FAQ
• 11-15: Urgency - time running out
• 16-18: Final push - last spots, closing

Use {{contact.first_name}} for personalization. Use [Schedule Link] for booking.

OUTPUT SCHEMA:
{
  "emailSequence": {
    "tips": {
      "tip1": {"title": "<Tip 1>", "content": "<2-3 sentences>", "actionStep": "<Action>"},
      "tip2": {"title": "<Tip 2>", "content": "<2-3 sentences>", "actionStep": "<Action>"},
      "tip3": {"title": "<Tip 3>", "content": "<2-3 sentences>", "actionStep": "<Action>"}
    },
    "stepsToSuccess": [
      {"step": 1, "title": "<Step 1>", "description": "<What happens + result>"},
      {"step": 2, "title": "<Step 2>", "description": "<What happens + result>"},
      {"step": 3, "title": "<Step 3>", "description": "<What happens + result>"},
      {"step": 4, "title": "<Step 4>", "description": "<What happens + result>"}
    ],
    "faqs": [
      {"question": "<How long?>", "answer": "<Complete answer>"},
      {"question": "<What if tried?>", "answer": "<Why different>"},
      {"question": "<Time commitment?>", "answer": "<Specific time>"},
      {"question": "<What if doesn't work?>", "answer": "<Guarantee>"},
      {"question": "<Why call vs buy?>", "answer": "<Consultation value>"}
    ],
    "successStory": {
      "clientName": "<Client type>",
      "beforeState": "<Before>",
      "transformation": "<Results>",
      "timeframe": "<How long>",
      "quote": "<Client quote>"
    },
    "emails": [
      {"emailNumber": 1, "dayToSend": "<Day 0>", "purpose": "<Welcome + Tip 1>", "subjectLine": "<Subject>", "previewText": "<Preview>", "body": "<COMPLETE 200-400 word body>"},
      ... 17 more emails with COMPLETE bodies
    ]
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Must have EXACTLY 18 emails in emails array
- Each email body must be COMPLETE (200-400 words), NO placeholders
- Must have EXACTLY 3 tips, 4 stepsToSuccess, 5 faqs
- Use {{contact.first_name}} for personalization
- Use [Schedule Link] for booking links
- Sequence flow: Days 0-4 (welcome/tips), 5-9 (engagement), 10-14 (urgency), 15-17 (final push)
- Every email must have: emailNumber, dayToSend, purpose, subjectLine, previewText, body`
    },

    facebookAds: {
        originalGenerationPrompt: `You are an expert Facebook ads copywriter.

Write ACTUAL Facebook ads for a real business - COMPLETE and ready to paste into Meta Ads Manager.

CRITICAL: NO placeholders like "[insert]" or "TBD". Each ad must be COMPLETE.

AD STRUCTURE (for each ad):
1. Hook (question or bold statement)
2. Immediate CTA to lead magnet
3. Three benefits with explanations
4. Stats or personal journey (2+ sentences)
5. Social proof story
6. Strong opt-in CTA
7. Inspirational sign-off

OUTPUT SCHEMA:
{
  "facebookAds": {
    "ads": [
      {
        "adNumber": 1,
        "angle": "<Pain point focus>",
        "headline": "<Headline>",
        "primaryText": "<COMPLETE ad copy with emojis, NO labels, NO section markers>",
        "callToActionButton": "<Learn More / Download / Sign Up>",
        "targetAudience": "<Who this resonates with>"
      },
      ... 9 more complete ads
    ],
    "imagePrompts": [
      {"adNumber": 1, "imageDescription": "<Image desc>", "textOverlay": "<Text>", "colorScheme": "<Colors>"},
      {"adNumber": 2, "imageDescription": "<Image desc>", "textOverlay": "<Text>", "colorScheme": "<Colors>"},
      {"adNumber": 3, "imageDescription": "<Image desc>", "textOverlay": "<Text>", "colorScheme": "<Colors>"}
    ],
    "targetingRecommendations": {
      "interests": ["<Interest 1>", "<Interest 2>", "<Interest 3>"],
      "behaviors": ["<Behavior 1>", "<Behavior 2>"],
      "demographics": {"ageRange": "<Range>", "locations": "<Locations>", "incomeLevel": "<Income>"},
      "lookalikeAudiences": ["<Lookalike 1>", "<Lookalike 2>", "<Lookalike 3>"]
    }
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Must have EXACTLY 10 ads in ads array
- Each primaryText must be COMPLETE with NO placeholders
- NO headings or labels in primaryText (it's the raw ad copy)
- Use emojis for visual appeal
- Must have EXACTLY 3 imagePrompts
- targetingRecommendations: 3+ interests, 2+ behaviors, 3 lookalike audiences
- Each ad should have different angle but same quality
- primaryText should be conversational and engaging`
    },

    funnelCopy: {
        originalGenerationPrompt: `You are an expert funnel copywriter.

Generate complete, ready-to-use funnel copy for all pages. NO placeholders.

OUTPUT SCHEMA:
{
  "funnelCopy": {
    "optInHeadlines": [
      "<Headline 1>", "<Headline 2>", "<Headline 3>", "<Headline 4>", "<Headline 5>"
    ],
    "optInPageCopy": {
      "headline": "<Main headline>",
      "subheadline": "<Supporting text>",
      "heroSection": "<2-3 hook sentences>",
      "bulletPoints": ["<Bullet 1>", "<Bullet 2>", "<Bullet 3>", "<Bullet 4>"],
      "ctaButtonText": "<Get Instant Access>",
      "socialProof": "<Social proof statement>",
      "urgencyElement": "<Urgency statement>",
      "privacyNote": "<Privacy note>"
    },
    "thankYouPageCopy": {
      "headline": "<You're In!>",
      "subheadline": "<Subhead>",
      "message": "<What to do next>",
      "nextSteps": ["<Step 1>", "<Step 2>", "<Step 3>"],
      "bridgeToCall": "<Bridge to booking>",
      "ctaButtonText": "<Book My Free Call>"
    },
    "confirmationPageScript": {
      "fullScript": "<Complete 90-120 second script>",
      "keyPoints": ["<Point 1>", "<Point 2>", "<Point 3>", "<Point 4>", "<Point 5>", "<Point 6>"],
      "estimatedLength": "<90-120 seconds>"
    },
    "faqs": [
      {"question": "<Question 1>", "answer": "<Complete answer>"},
      {"question": "<Question 2>", "answer": "<Complete answer>"},
      ... 5 more FAQs
    ],
    "stepsToSuccess": [
      {"stepNumber": 1, "headline": "<Step 1>", "description": "<Desc>", "benefit": "<Benefit>"},
      {"stepNumber": 2, "headline": "<Step 2>", "description": "<Desc>", "benefit": "<Benefit>"},
      {"stepNumber": 3, "headline": "<Step 3>", "description": "<Desc>", "benefit": "<Benefit>"},
      {"stepNumber": 4, "headline": "<Step 4>", "description": "<Desc>", "benefit": "<Benefit>"}
    ],
    "salesPageCopy": {
      "heroHeadline": "<Headline>",
      "heroSubheadline": "<Subhead>",
      "problemSection": "<2-3 paragraphs>",
      "solutionSection": "<Solution intro>",
      "offerSection": "<What they get>",
      "testimonialSection": "<Where to place>",
      "ctaSection": "<Final CTA>"
    }
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Must have EXACTLY 5 optInHeadlines
- Must have EXACTLY 4 bulletPoints in optInPageCopy
- Must have EXACTLY 3 nextSteps in thankYouPageCopy
- Must have EXACTLY 6 keyPoints in confirmationPageScript
- Must have EXACTLY 7 FAQs
- Must have EXACTLY 4 stepsToSuccess
- All copy should be complete and ready to use
- NO placeholders like "[insert]" or "TBD"`
    },

    appointmentReminders: {
        originalGenerationPrompt: `You are an expert appointment reminder sequence writer.

Write ACTUAL appointment reminder emails for a real business - sent through GoHighLevel to ensure leads attend calls.

CRITICAL: NO placeholders except [Video Link], [Booking Link], [Session Link]. Use {{contact.first_name}} for personalization.

OUTPUT SCHEMA:
{
  "appointmentReminders": {
    "contentTips": {
      "tip1": {"title": "<Tip #1: Title>", "briefRecap": "<2-3 sentence explanation>"},
      "tip2": {"title": "<Tip #2: Title>", "briefRecap": "<2-3 sentence explanation>"},
      "tip3": {"title": "<Tip #3: Title>", "briefRecap": "<2-3 sentence explanation>"}
    },
    "keyFeatures": [
      "<Feature/benefit 1>", "<Feature/benefit 2>", "<Feature/benefit 3>"
    ],
    "preparationSteps": [
      "<Prep step 1>", "<Prep step 2>", "<Prep step 3>"
    ],
    "confirmationEmail": {
      "timing": "<Immediately upon booking>",
      "subject": "<Subject line>",
      "previewText": "<Preview text>",
      "body": "<COMPLETE 150-300 word email body>"
    },
    "reminder48Hours": {
      "timing": "<48 hours before>",
      "subject": "<Subject>",
      "previewText": "<Preview>",
      "body": "<COMPLETE body>"
    },
    "reminder24Hours": {
      "timing": "<24 hours before>",
      "subject": "<Subject>",
      "previewText": "<Preview>",
      "body": "<COMPLETE body>"
    },
    "reminder1Hour": {
      "timing": "<1 hour before>",
      "subject": "<Subject>",
      "previewText": "<Preview>",
      "body": "<COMPLETE body>"
    },
    "reminder10Minutes": {
      "timing": "<10 minutes before>",
      "subject": "<Subject>",
      "previewText": "<Preview>",
      "body": "<COMPLETE body>"
    },
    "startingNow": {
      "timing": "<At appointment time>",
      "subject": "<Subject>",
      "previewText": "<Preview>",
      "body": "<COMPLETE body>"
    },
    "noShowFollowUp": {
      "timing": "<15 minutes after missed>",
      "subject": "<Subject>",
      "previewText": "<Preview>",
      "body": "<COMPLETE body>"
    }
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- Must have EXACTLY 3 contentTips, 3 keyFeatures, 3 preparationSteps
- All email bodies must be COMPLETE (150-300 words)
- Use {{contact.first_name}} for personalization
- Use [Video Link], [Booking Link], [Session Link] for dynamic links
- NO other placeholders allowed
- Sequence: confirmation → 48hrs → 24hrs → 1hr → 10min → now → no-show
- Each email must have: timing, subject, previewText, body`
    },

    bio: {
        originalGenerationPrompt: `You are an expert bio writer.

Write the ACTUAL bio for a real business founder - ready to use on websites, social media, and press materials.

CRITICAL: Write in third person. NO placeholders. Include specific numbers and achievements.

OUTPUT SCHEMA:
{
  "bio": {
    "fullBio": "<200-word professional bio in third person. Structure: who they are → expertise/method → achievements/numbers → personal 'why' → what drives them today>",
    "shortBio": "<75-word condensed version for social media>",
    "speakerBio": "<150-word version for speaking introductions with emphasis on credentials>",
    "oneLiner": "<One powerful sentence: '[Name] is a [credential] who helps [audience] [achieve outcome] through [unique method]'>",
    "keyAchievements": [
      "<Achievement 1 with numbers>",
      "<Achievement 2 with numbers>",
      "<Achievement 3 with numbers>",
      "<Credential or recognition>"
    ],
    "personalTouch": {
      "humanElement": "<Relatable personal detail>",
      "missionStatement": "<Deeper 'why'>",
      "valueStatement": "<Core belief/principle>"
    },
    "socialMediaVersions": {
      "instagram": "<150 chars max with emojis>",
      "linkedin": "<2-3 sentences, professional>",
      "twitter": "<160 chars, punchy>"
    }
  }
}`,

        refinementContext: `REFINEMENT GUIDELINES:
- fullBio must be 200 words, third person
- shortBio must be 75 words
- speakerBio must be 150 words
- Must have EXACTLY 4 keyAchievements
- All bios should include specific numbers and achievements
- Make it authentic and relatable, not salesy
- instagram version: 150 chars max
- twitter version: 160 chars max
- NO placeholders like "[insert]" or "TBD"`
    }
};

/**
 * Get full context prompt for a section
 */
export function getFullContextPrompt(sectionId) {
    return FULL_CONTEXT_PROMPTS[sectionId] || {
        originalGenerationPrompt: 'No context available for this section.',
        refinementContext: 'Use the current schema structure as a guide.'
    };
}

/**
 * Build enhanced AI Feedback prompt with full project context
 */
export function buildEnhancedFeedbackPrompt({
    sectionId,
    currentContent,
    userFeedback,
    conversationHistory = [],
    intakeData = {}
}) {
    const contextInfo = getFullContextPrompt(sectionId);

    const systemPrompt = `You are an expert marketing and sales consultant with FULL CONTEXT of this project.

ORIGINAL GENERATION INSTRUCTIONS FOR THIS SECTION:
${contextInfo.originalGenerationPrompt}

REFINEMENT CONTEXT:
${contextInfo.refinementContext}

YOUR ROLE IN AI FEEDBACK:
1. You have complete context of how this content was originally generated
2. You understand the exact schema requirements
3. You can make intelligent refinements based on user feedback
4. You can ADD new fields if they fit the schema (ask first)
5. You can SUGGEST improvements proactively
6. You maintain conversation memory across multiple refinement rounds

FLEXIBILITY:
- You CAN modify any field the user mentions
- You CAN add new content if it fits the schema structure
- You CAN suggest additional improvements beyond user's request
- You MUST stay within schema boundaries (don't add unsupported fields)
- You SHOULD explain WHY you made certain changes

CONVERSATION STYLE:
- Be friendly and helpful like a skilled consultant
- Explain your reasoning briefly
- Ask clarifying questions if feedback is ambiguous
- Suggest improvements proactively when you see opportunities
- Remember previous refinements in this conversation`;

    const businessContext = Object.entries(intakeData)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

    const conversationContext = conversationHistory
        .slice(-5)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

    const userPrompt = `CURRENT CONTENT:
${typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent, null, 2)}

${businessContext ? `BUSINESS CONTEXT:\n${businessContext}\n` : ''}
${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}\n` : ''}
USER'S FEEDBACK:
${userFeedback}

INSTRUCTIONS:
1. Analyze the user's feedback carefully
2. Make targeted improvements to the content
3. If adding new fields, ensure they fit the schema
4. Explain what you changed and why
5. Return ONLY valid JSON matching the schema structure shown in ORIGINAL GENERATION INSTRUCTIONS
6. DO NOT wrap in markdown code blocks`;

    return { systemPrompt, userPrompt };
}
