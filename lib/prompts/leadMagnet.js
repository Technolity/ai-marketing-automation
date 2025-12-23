/**
 * Lead Magnet - Deterministic Prompt
 * Complete lead magnet with workbook content, emails, and SMS
 * 
 * CRITICAL: This generates REAL, copy-paste ready content
 */

export const leadMagnetPrompt = (data) => `
You are creating the ACTUAL lead magnet for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL lead magnet that will be:
- Downloaded by thousands of prospects
- Used to build an email list
- The entry point into a sales funnel
- Converted into a PDF workbook

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "[Your answer here]"
2. Write ACTUAL workbook content - not outlines
3. All emails and SMS must be COMPLETE and ready to send
4. Every field must contain REAL, usable content
5. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA:

Industry / Market: ${data.industry || 'Not specified'}
Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}
What the business helps them with: ${data.message || 'Not specified'}
Primary problem the audience faces: ${data.coreProblem || 'Not specified'}
Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}
Unique approach / method: ${data.uniqueAdvantage || 'Not specified'}
Founder Story: ${data.story || 'Not specified'}
Client results / proof: ${data.testimonials || 'Not specified'}
Main program or offer: ${data.offerProgram || 'Not specified'}
Primary call-to-action: ${data.callToAction || 'Not specified'}
Brand voice / personality: ${data.brandVoice || 'Not specified'}
Business stage: ${data.businessStage || 'Not specified'}

Return ONLY valid JSON:

{
  "leadMagnet": {
    "concept": {
      "type": "5-Page Workbook",
      "mainIdea": "The specific transformation this workbook delivers",
      "problemItSolves": "The immediate problem the reader can solve after completing this",
      "connectionToOffer": "How this naturally leads to wanting the main program"
    },
    "titleOptions": [
      {
        "title": "The [Specific Outcome] Blueprint",
        "subtitle": "How to [achieve result] in [timeframe] without [common obstacle]",
        "whyItWorks": "Benefit-driven, specific, creates curiosity"
      },
      {
        "title": "[Number] Steps to [Desired Result]",
        "subtitle": "The exact framework used by [type of successful people]",
        "whyItWorks": "Clear, actionable, leverages social proof"
      },
      {
        "title": "The [Problem] Solution Guide",
        "subtitle": "Stop [pain point] and start [desired state] today",
        "whyItWorks": "Directly addresses their main pain"
      },
      {
        "title": "Unlock Your [Desired Outcome]",
        "subtitle": "A proven workbook to [specific result] in [timeframe]",
        "whyItWorks": "Transformation-focused, time-bound"
      },
      {
        "title": "The [Audience Type]'s Playbook for [Result]",
        "subtitle": "Everything you need to [achieve outcome] starting today",
        "whyItWorks": "Speaks directly to target audience"
      },
      {
        "title": "From [Before State] to [After State]",
        "subtitle": "The [number]-step system for [specific transformation]",
        "whyItWorks": "Before/after creates desire"
      }
    ],
    "selectedTitle": "The best title from above - use this one",
    "selectedSubtitle": "The matching subtitle",
    "workbookContent": {
      "page1_Introduction": {
        "headline": "Welcome to Your [Transformation] Journey",
        "content": "Write 200-300 words introducing the workbook. Acknowledge their struggle, validate their desire for change, establish your credibility briefly, and explain what they'll achieve by completing this workbook. End with excitement about their transformation.",
        "authorSignature": "To your success, [Name]"
      },
      "page2_Assessment": {
        "headline": "Where Are You Now?",
        "introduction": "Before we dive into the solution, let's get clear on where you're starting from. Answer these questions honestly - there are no wrong answers, only clarity.",
        "questions": [
          {
            "question": "On a scale of 1-10, how satisfied are you with your current [relevant area]?",
            "purpose": "Establish baseline"
          },
          {
            "question": "What's your biggest frustration with [their main problem area]?",
            "purpose": "Identify primary pain"
          },
          {
            "question": "If this problem was solved in the next 90 days, what would change?",
            "purpose": "Clarify desired outcome"
          },
          {
            "question": "What have you tried before that didn't work?",
            "purpose": "Acknowledge past attempts"
          },
          {
            "question": "What's this problem costing you (time, money, stress, opportunity)?",
            "purpose": "Quantify the pain"
          }
        ],
        "closingNote": "Great work! Now that you know where you're starting from, let's build your roadmap to [desired outcome]."
      },
      "page3_Framework": {
        "headline": "The [Branded Name] Framework",
        "introduction": "Here's the exact framework that's helped [number]+ [audience type] achieve [specific result]. Follow these steps in order for the best results.",
        "step1": {
          "title": "Step 1: [Action-Oriented Title]",
          "explanation": "Detailed explanation of what to do in this step (100-150 words). Include the what, why, and how.",
          "actionItem": "Specific action they should take right now",
          "commonMistake": "The mistake most people make here and how to avoid it"
        },
        "step2": {
          "title": "Step 2: [Action-Oriented Title]",
          "explanation": "Detailed explanation of this step (100-150 words)",
          "actionItem": "Specific action for this step",
          "commonMistake": "The common mistake to avoid"
        },
        "step3": {
          "title": "Step 3: [Action-Oriented Title]",
          "explanation": "Detailed explanation of this step (100-150 words)",
          "actionItem": "Specific action for this step",
          "commonMistake": "The common mistake to avoid"
        }
      },
      "page4_Implementation": {
        "headline": "Your Action Plan",
        "introduction": "Now it's time to put this into action. Use this planning page to map out your next 7 days.",
        "planningTemplate": {
          "day1_2": "What you'll focus on in the first two days",
          "day3_4": "What you'll tackle in days three and four",
          "day5_6": "What you'll implement in days five and six",
          "day7": "Review, adjust, and plan your next week"
        },
        "commitmentStatement": "I, _____________, commit to implementing this framework and achieving [specific result] by [date]. My first action step is _____________ and I will complete it by _____________.",
        "proTip": "A specific tip that increases success rate"
      },
      "page5_NextSteps": {
        "headline": "What's Next? Your Path to [Bigger Result]",
        "content": "You've taken an important first step. But here's the truth: this workbook gives you the foundation, but to really achieve [bigger transformation], you need [what they need]. That's exactly what we help with in [Program Name].",
        "programTeaser": "Brief, compelling description of the main offer and the results it delivers",
        "testimonial": "A short client success story that demonstrates the result",
        "callToAction": "Ready to take the next step? Book your free [Call Name] and let's create your personalized plan for [specific result].",
        "ctaButton": "[Call Name] - Book Now",
        "urgencyNote": "We only take on [number] new clients per month, so if this resonates, don't wait."
      }
    },
    "landingPageCopy": {
      "headline": "The main headline for the opt-in page",
      "subheadline": "Supporting subheadline that adds specificity",
      "bulletPoints": [
        "The #1 mistake [audience] make that keeps them stuck at [problem state] (and how to fix it)",
        "The exact [number]-step framework used by [successful people reference]",
        "How to [specific quick win] in just [short timeframe] - even if you've tried everything",
        "The hidden [insight] that [outcome] (most [audience] never realize this)"
      ],
      "ctaButtonText": "Get My Free Workbook",
      "socialProof": "[Number]+ [audience type] have used this framework to [achieve result]",
      "privacyNote": "We respect your privacy. Unsubscribe anytime."
    },
    "fulfillmentEmail": {
      "subject": "Your [Lead Magnet Name] is ready! 🎉",
      "previewText": "Download now + a quick tip to get started",
      "body": "Hey {{contact.first_name}},\\n\\nYou did it! Your copy of [Lead Magnet Name] is ready and waiting for you.\\n\\n👉 [DOWNLOAD LINK]\\n\\nHere's my challenge to you: Don't just download it and let it sit. Open it right now and complete Page 2 (the Assessment) before you do anything else.\\n\\nWhy? Because clarity is the first step to transformation. And that assessment will give you clarity you didn't have 5 minutes ago.\\n\\nI'll check in with you tomorrow with a tip that'll help you get even more out of the workbook.\\n\\nTo your success,\\n[Name]\\n\\nP.S. If you want to fast-track your results, you can book a free [Call Name] with our team. We'll help you create a personalized plan for [specific result]. [CALENDAR LINK]"
    },
    "reminderEmail": {
      "subject": "Did you get a chance to download this?",
      "previewText": "Your workbook is still waiting...",
      "body": "Hey {{contact.first_name}},\\n\\nI noticed you signed up for [Lead Magnet Name] but haven't downloaded it yet.\\n\\nNo judgment - I know how busy things get!\\n\\nBut I also know that [their problem] doesn't fix itself by waiting. And this workbook has the exact framework that's helped [number]+ [audience type] [achieve result].\\n\\nHere's your link again:\\n\\n👉 [DOWNLOAD LINK]\\n\\nTake 10 minutes today. Your future self will thank you.\\n\\n[Name]\\n\\nP.S. If you're ready to go deeper, book a free [Call Name] and let's map out your path to [result]. [CALENDAR LINK]"
    },
    "smsFollowUp": {
      "message": "Hey {{contact.first_name}}! Your [Lead Magnet Name] is ready. Download it here: [LINK] - don't let it collect digital dust! 😊"
    },
    "adCopy": {
      "facebookAd": "Struggling with [specific problem]? 😤\\n\\nI just released a free workbook that shows you exactly how to [achieve result] in [timeframe].\\n\\nInside you'll discover:\\n✅ The #1 mistake keeping you stuck\\n✅ The [number]-step framework for [outcome]\\n✅ Your personalized action plan\\n\\n[Number]+ [audience type] have already grabbed their copy.\\n\\n👉 Get yours free: [LINK]",
      "instagramAd": "Free workbook alert! 📚✨\\n\\nIf you're a [target audience] who wants to [desired outcome]...\\n\\nThis is for you 👇\\n\\n• [Benefit 1]\\n• [Benefit 2]\\n• [Benefit 3]\\n\\nNo fluff. Just a proven framework that works.\\n\\nLink in bio to grab your copy! 🔗",
      "linkedInAd": "After helping [number]+ [audience type] achieve [result], I've compiled everything into a free workbook.\\n\\nIf you're struggling with [problem] and ready to [outcome], this is the framework that's made the biggest difference for my clients.\\n\\nDownload your free copy: [LINK]"
    }
  }
}
`;

export default leadMagnetPrompt;
