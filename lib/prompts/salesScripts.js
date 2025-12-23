/**
 * Sales Script - Deterministic Prompt
 * High-converting scripts for enrollment calls
 * 
 * CRITICAL: This generates REAL sales scripts, not examples
 */

export const salesScriptsPrompt = (data) => `
You are writing the ACTUAL sales call script for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL script that will be:
- Used by sales reps on live calls
- Read during discovery conversations
- Used to close real deals worth $${data.pricing || '5,000-25,000'}

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD"
2. The "fullScript" must be ready to use as-is on a sales call
3. Write conversationally - this is a CONVERSATION, not a presentation
4. Include specific probing questions based on the actual industry
5. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA:

Business Name: ${data.businessName || 'Your Business'}
Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
What you help them with: ${data.message || 'Not specified'}
Primary problem they face: ${data.coreProblem || 'Not specified'}
Outcomes they want: ${data.outcomes || 'Not specified'}
Your unique approach: ${data.uniqueAdvantage || 'Not specified'}
Main offer / program: ${data.offerProgram || 'Not specified'}
Deliverables: ${data.deliverables || 'Not specified'}
Pricing: ${data.pricing || 'Not specified'}
Brand voice: ${data.brandVoice || 'Not specified'}

Return ONLY valid JSON:

{
  "salesScript": {
    "callIntroduction": {
      "greeting": "Hey [Name], this is [Rep Name] with [Company]. Thanks for booking this call! Before we dive in, I just want to let you know I'm recording this so I can give you my full attention instead of taking notes. Is that cool with you?",
      "callObjectives": "Perfect. So here's what I'd love to accomplish in the next 30-45 minutes: First, I want to understand what's going on in your business right now and what you're trying to achieve. Then, if it makes sense, I'll share how we might be able to help. Sound good?",
      "permissionQuestion": "Before I ask you a bunch of questions, is there anything specific you're hoping to get out of this call?"
    },
    "discoveryQuestions": {
      "openingQuestion": "So tell me, what made you decide to book this call today? What's going on that made you think now is the time to look into this?",
      "goalQuestion": "If we fast-forward 90 days from now and everything went exactly the way you wanted, what would be different in your business?",
      "goalProbes": [
        "That's interesting - why is that goal so important to you right now?",
        "What would achieving that mean for you personally, not just the business?",
        "Help me understand - why 90 days? What's driving that timeline?",
        "And what happens if you DON'T hit that goal in the next 90 days?"
      ],
      "businessQuestions": [
        "Tell me a bit about your business - what do you do, who do you help?",
        "What are you typically charging for your [product/service]?",
        "And who's your ideal client? Like, if I said 'describe your perfect customer,' what would you say?",
        "How are you currently getting clients? What's your main source?",
        "Roughly where are you at revenue-wise? Monthly or annual, whatever's easier to think about."
      ],
      "painQuestions": [
        "What's the biggest thing getting in the way of hitting that goal right now?",
        "How long has that been an issue?",
        "What have you tried so far to fix it?",
        "And how did that go? Why do you think it didn't work?",
        "What's this costing you - not just in money, but time, stress, opportunity cost?"
      ]
    },
    "challengesAndCommitment": {
      "obstacleQuestion": "So if I'm hearing you right, the main thing standing between you and [their goal] is [their obstacle]. Is that accurate?",
      "depthProbes": [
        "How long have you been dealing with this?",
        "What do you think this has cost you over the past year - in revenue, time, missed opportunities?",
        "If nothing changes in the next 6-12 months, where does that leave you?"
      ],
      "commitmentQuestion": "On a scale of 1-10, how committed are you to actually solving this and hitting your goal?",
      "commitmentRaisers": [
        "What would need to happen for that to be a 10?",
        "What's holding you back from being all-in right now?",
        "If you knew for certain this would work, would you be at a 10?"
      ]
    },
    "transitionToSolution": {
      "recap": "Okay, so let me make sure I've got this right. You're currently at [current state], and you want to get to [goal state] in the next [timeframe]. The main thing in your way is [obstacle], and you've tried [what they tried] but it didn't work because [reason]. You're at about a [number] in terms of commitment. Does that sound right?",
      "transitionStatement": "Well, here's the good news - what you just described is exactly what we help people with. Can I share a bit about how we do that and you can tell me if it makes sense for your situation?"
    },
    "solutionPresentation": {
      "introStatement": "So what we've developed is called the [Program Name]. It's specifically designed for [their situation] who want to [their goal].",
      "mechanismExplanation": "The reason most people struggle with [their problem] is because they're focused on [wrong approach]. What we do differently is [unique mechanism]. That's why our clients typically see [result] within [timeframe].",
      "solutionSteps": [
        {
          "step": 1,
          "name": "Step 1: [Name]",
          "explanation": "First, we [what you do in step 1]. This is important because [why it matters for them specifically].",
          "relateToGoal": "For you, this means [how it addresses their specific situation]."
        },
        {
          "step": 2,
          "name": "Step 2: [Name]",
          "explanation": "Then, we [what you do in step 2]. Most of our clients find this is where the magic happens because [reason].",
          "relateToGoal": "Based on what you told me about [their situation], this is probably where you'll see the biggest shift."
        },
        {
          "step": 3,
          "name": "Step 3: [Name]",
          "explanation": "After that, we [what you do in step 3]. This is what takes you from [before] to [after].",
          "relateToGoal": "This is where you'll start seeing [specific result they want]."
        },
        {
          "step": 4,
          "name": "Step 4: [Name]",
          "explanation": "Finally, we [what you do in step 4]. This ensures [long-term result].",
          "relateToGoal": "So you're not just hitting your goal once - you're set up for [ongoing success]."
        }
      ],
      "confirmationQuestion": "Based on what you've told me about your situation, can you see how this would help you get from where you are to where you want to be?"
    },
    "investmentAndClose": {
      "investmentTransition": "So let me tell you what's included and what the investment looks like.",
      "valueStack": "When you join, you get [deliverable 1], which alone is worth [value]. You also get [deliverable 2], plus [deliverable 3]. We're also including [bonus 1] and [bonus 2] for anyone who joins this week.",
      "investmentStatement": "The total investment for everything is [price]. We offer [payment options] to make it manageable.",
      "closingQuestion": "So here's my question for you: Based on everything we've talked about - your goal of [their goal], the fact that [their obstacle] has been costing you [what it costs], and seeing how the [Program Name] directly addresses that - are you ready to get started?",
      "silenceInstruction": "Then stay quiet. Let them respond."
    },
    "objectionHandling": {
      "money": {
        "response": "I totally get it - it's a real investment. Let me ask you this though: what's it costing you to NOT solve this? You told me earlier that [reference their pain]. If you stay where you are for another 6-12 months, what does that look like? ... And on the flip side, if this works and you [achieve their goal], what's that worth to you?"
      },
      "time": {
        "response": "That's one of the most common concerns I hear. Here's the thing - you're already spending time on this, right? The question is whether you're spending it on things that work. Most of our clients find they actually save time because they're not constantly trying new things that don't work. The program is designed for busy people - we're talking [time commitment] per week."
      },
      "thinkAboutIt": {
        "response": "Of course, I want you to feel good about this. Help me understand though - what specifically do you need to think about? Is it the money, the timing, whether it'll work for you, or something else?"
      },
      "talkToSpouse": {
        "response": "Absolutely, that makes sense. What do you think their main concerns would be? ... And if they were on this call with us right now, what questions would they have?"
      }
    },
    "fullScript": "Write the complete, flowing sales call script here as one continuous conversation. Include all sections woven together naturally. This should be 1000-1500 words and read like an actual conversation between two people. NO HEADERS. NO BULLETS. Just the dialogue and natural transitions. Start with the greeting and flow through discovery, solution presentation, and close."
  }
}
`;

export default salesScriptsPrompt;
