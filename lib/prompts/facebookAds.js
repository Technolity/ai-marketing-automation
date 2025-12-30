/**
 * Facebook Ads - Deterministic Prompt
 * Complete ad copy ready for Meta Ads Manager
 * 
 * CRITICAL: Every ad must be complete and ready to paste
 */

export const facebookAdsPrompt = (data) => `
You are writing ACTUAL Facebook ads for a real business.

THIS IS NOT AN EXAMPLE. These are REAL ads that will be:
- Pasted directly into Meta Ads Manager
- Shown to thousands of potential customers
- Used to generate real leads and sales

CRITICAL RULES:
1. NO "[insert]", "for example", "TBD" or any placeholders
2. Each ad must be COMPLETE and ready to paste as-is
3. NO headings, NO labels, NO section markers in the primaryText
4. Write conversationally with emojis
5. Every ad must have a different angle but same quality
6. Output MUST be valid JSON

INPUT DATA:

Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
What you help them with: ${data.message || 'Not specified'}
Primary problem they face: ${data.coreProblem || 'Not specified'}
Outcomes they want: ${data.outcomes || 'Not specified'}
Your unique approach: ${data.uniqueAdvantage || 'Not specified'}
Your story (Source Data):
- The Pit: ${data.storyLowMoment || 'Not specified'}
- The Discovery: ${data.storyDiscovery || 'Not specified'}
- The Breakthrough: ${data.storyBreakthrough || 'Not specified'}
- The Outcome: ${data.storyResults || 'Not specified'}
Client results / testimonials: ${data.testimonials || 'Not specified'}
Lead Magnet Title: ${data.leadMagnetTitle || 'Free Training'}
Main offer: ${data.offerProgram || 'Not specified'}
Brand voice: ${data.brandVoice || 'Not specified'}

AD STRUCTURE (follow for each ad):
1. Hook (question or bold statement about their pain)
2. Immediate CTA to the lead magnet
3. Three benefits with one-sentence explanations
4. Stats or personal journey (2+ sentences)
5. One compelling social proof story
6. Strong opt-in CTA
7. Inspirational sign-off

Return ONLY valid JSON with 10 COMPLETE ads:

{
  "facebookAds": {
    "ads": [
      {
        "adNumber": 1,
        "angle": "Pain point focus",
        "headline": "Struggling with [specific pain]? This changes everything.",
        "primaryText": "Are you a [target audience] dealing with [specific pain point]? 😤\\n\\nI've been there. And I know how frustrating it is to [specific frustration].\\n\\nThat's why I created [Lead Magnet Name] - a free [type of resource] that shows you exactly how to [specific outcome].\\n\\n👉 Click below to get instant access\\n\\nInside, you'll discover:\\n\\n✅ [Benefit 1] - [One sentence explanation of why this matters]\\n\\n✅ [Benefit 2] - [One sentence explanation]\\n\\n✅ [Benefit 3] - [One sentence explanation]\\n\\nI've spent [years/time] figuring this out the hard way. [Personal stat or journey detail]. Now I've helped [number]+ [audience type] achieve [result].\\n\\nLike [Client Name], who [specific result with numbers]. Before working with me, they were [before state]. Now? [After state]. 🔥\\n\\n👇 Grab your free copy now - it takes 30 seconds\\n\\n[No email required / Just click / etc.]\\n\\nLet's get you [outcome]. 💪\\n\\nTo your success,\\n[Name]",
        "callToActionButton": "Learn More",
        "targetAudience": "People experiencing this specific pain point"
      },
      {
        "adNumber": 2,
        "angle": "Outcome/transformation focus",
        "headline": "What if you could [desired outcome] in [timeframe]?",
        "primaryText": "Imagine waking up to [desired situation]. 🌟\\n\\nNo more [current pain]. No more [frustration]. Just [desired state].\\n\\nThat's exactly what's happening for [audience type] who use [Lead Magnet Name].\\n\\n👉 Get it free here\\n\\nHere's what you'll learn:\\n\\n✅ [Benefit 1] - [Why it matters]\\n\\n✅ [Benefit 2] - [Impact]\\n\\n✅ [Benefit 3] - [Result]\\n\\n[Number] years ago, I was [your before state]. Today, [your after state]. The difference? [Key insight].\\n\\n[Client testimonial or result] - that's the kind of transformation that's possible when you have the right framework.\\n\\n👇 Your transformation starts with one click\\n\\nJoin [number]+ [audience] who've already grabbed their copy.\\n\\n[Name]",
        "callToActionButton": "Download",
        "targetAudience": "Aspirational - people focused on what's possible"
      },
      {
        "adNumber": 3,
        "angle": "Story-driven",
        "headline": "I almost gave up on [goal]. Then this happened...",
        "primaryText": "[Number] years ago, I was [specific struggle]. 😔\\n\\nI had tried [what you tried]. Spent [money/time] on [failed approaches]. Nothing worked.\\n\\nI was ready to [give up/accept defeat/etc.].\\n\\nThen I discovered [key insight].\\n\\nEverything changed.\\n\\nNow I help [audience type] skip the struggle and get straight to [result]. 🎯\\n\\n👉 I put everything I learned into [Lead Magnet Name]\\n\\nIt's free, and inside you'll find:\\n\\n✅ [Benefit 1]\\n\\n✅ [Benefit 2]\\n\\n✅ [Benefit 3]\\n\\n[Client Name] used this exact framework to [specific result]. [Brief detail about their journey].\\n\\n👇 Get your copy now - no strings attached\\n\\nYour story doesn't have to end like mine almost did.\\n\\n[Name]",
        "callToActionButton": "Learn More",
        "targetAudience": "People who resonate with struggle stories"
      },
      {
        "adNumber": 4,
        "angle": "Social proof heavy",
        "headline": "[Number]+ [audience] can't be wrong",
        "primaryText": "Real talk: [Number]+ [audience type] have used [Lead Magnet Name] to [achieve result]. 📊\\n\\nHere's what they're saying:\\n\\n\"[Testimonial quote 1]\" - [Client type]\\n\\n\"[Testimonial quote 2]\" - [Client type]\\n\\n👉 Want the same results? Get your free copy\\n\\nInside you'll discover:\\n\\n✅ [Benefit 1] - [Impact]\\n\\n✅ [Benefit 2] - [Impact]\\n\\n✅ [Benefit 3] - [Impact]\\n\\nWe've generated [impressive stat] in [results/revenue/outcomes] for our clients. This isn't theory - it's proven.\\n\\n👇 Join them. Download now.\\n\\nYour success story is next. 🚀\\n\\n[Name]",
        "callToActionButton": "Sign Up",
        "targetAudience": "Skeptics who need proof"
      },
      {
        "adNumber": 5,
        "angle": "Urgency/scarcity",
        "headline": "🚨 Limited time: Free [resource] available now",
        "primaryText": "I don't usually give this away for free. 👀\\n\\nBut for a limited time, I'm making [Lead Magnet Name] available at no cost.\\n\\n👉 Grab it before it's gone\\n\\nWhy am I doing this? Because I know what it's like to [struggle]. And I want to help more [audience type] break through.\\n\\nInside, you'll get:\\n\\n✅ [Benefit 1]\\n\\n✅ [Benefit 2]\\n\\n✅ [Benefit 3]\\n\\nThis is the same framework that helped [Client Name] go from [before] to [after] in just [timeframe].\\n\\n⏰ Fair warning: This offer won't last forever. I typically charge [price] for this level of content.\\n\\n👇 Get it free while you can\\n\\n[Name]",
        "callToActionButton": "Get Offer",
        "targetAudience": "Action-takers motivated by scarcity"
      },
      {
        "adNumber": 6,
        "angle": "Question hook",
        "headline": "Are you still [painful situation]?",
        "primaryText": "Let me guess... 🤔\\n\\n• You're [pain point 1]\\n• You've tried [failed approach]\\n• You're wondering if [outcome] is even possible for you\\n\\nSound familiar?\\n\\nYou're not alone. That was me [timeframe] ago.\\n\\nBut here's what I discovered: [Key insight].\\n\\n👉 I broke it all down in [Lead Magnet Name]\\n\\nInside you'll learn:\\n\\n✅ [Benefit 1]\\n\\n✅ [Benefit 2]\\n\\n✅ [Benefit 3]\\n\\n[Client Name] was asking the same questions. Now they're [result]. The difference? Taking action.\\n\\n👇 Stop wondering. Start knowing.\\n\\nGet your free copy now.\\n\\n[Name]",
        "callToActionButton": "Learn More",
        "targetAudience": "People who see themselves in the questions"
      },
      {
        "adNumber": 7,
        "angle": "Bold statement hook",
        "headline": "Everything you've been told about [topic] is wrong",
        "primaryText": "Hot take: Most [audience type] fail at [goal] because they're doing it completely wrong. 🎯\\n\\nThey think [common belief].\\n\\nBut the truth? [Contrarian insight].\\n\\n👉 I explain exactly why in [Lead Magnet Name]\\n\\nThis free [resource type] reveals:\\n\\n✅ [Benefit 1] - [Impact]\\n\\n✅ [Benefit 2] - [Impact]\\n\\n✅ [Benefit 3] - [Impact]\\n\\nI've spent [years] testing this with [number]+ clients. The data is clear: [Bold claim backed by results].\\n\\n[Client Name] switched to this approach and [specific result].\\n\\n👇 Ready to see what actually works?\\n\\nDownload now. It's free.\\n\\n[Name]",
        "callToActionButton": "Download",
        "targetAudience": "Contrarian thinkers, frustrated with conventional advice"
      },
      {
        "adNumber": 8,
        "angle": "Imagine if... visualization",
        "headline": "Picture this: [Desired future state]",
        "primaryText": "Close your eyes and imagine... 🌅\\n\\nYou wake up and [specific desired morning]. Your [area of life] is [positive state]. You feel [positive emotion].\\n\\nNo more [current pain].\\nNo more [current frustration].\\nJust [desired state].\\n\\nThat's not a fantasy. It's what's possible when you [key action].\\n\\n👉 [Lead Magnet Name] shows you exactly how\\n\\nInside:\\n\\n✅ [Benefit 1]\\n\\n✅ [Benefit 2]\\n\\n✅ [Benefit 3]\\n\\n[Client Name] went from [before - paint the negative picture] to [after - paint the positive picture]. In [timeframe].\\n\\n👇 Your new reality is one click away\\n\\nDream it. Then do it. 💫\\n\\n[Name]",
        "callToActionButton": "Learn More",
        "targetAudience": "Dreamers ready to take action"
      },
      {
        "adNumber": 9,
        "angle": "Myth-busting",
        "headline": "Stop believing these [topic] myths",
        "primaryText": "If you believe [common myth]... you're sabotaging yourself. ❌\\n\\nHere are the myths keeping [audience type] stuck:\\n\\n❌ Myth: [Common belief 1]\\n✅ Truth: [Reality]\\n\\n❌ Myth: [Common belief 2]\\n✅ Truth: [Reality]\\n\\n❌ Myth: [Common belief 3]\\n✅ Truth: [Reality]\\n\\n👉 I bust all the myths in [Lead Magnet Name]\\n\\nPlus you'll discover:\\n\\n✅ [Benefit 1]\\n\\n✅ [Benefit 2]\\n\\n✅ [Benefit 3]\\n\\n[Client Name] believed these myths too. Then they [action taken]. Result? [Specific outcome].\\n\\n👇 Stop being held back by bad information\\n\\nGet the truth. Free.\\n\\n[Name]",
        "callToActionButton": "Download",
        "targetAudience": "Skeptics, critical thinkers"
      },
      {
        "adNumber": 10,
        "angle": "Direct offer",
        "headline": "Free [resource]: The [outcome] blueprint",
        "primaryText": "Want [outcome]? Here's exactly how to get it. 📋\\n\\nI just released [Lead Magnet Name] - a step-by-step [resource type] that shows you:\\n\\n✅ [Benefit 1] - [One line explanation]\\n\\n✅ [Benefit 2] - [One line explanation]\\n\\n✅ [Benefit 3] - [One line explanation]\\n\\n👉 It's 100% free. No catch.\\n\\nWhy free? Because I know once you see the results, you'll want more. And that's when we can talk about [next step].\\n\\nBut even if you never buy anything from me, this will help you [outcome].\\n\\n[Number]+ [audience type] have already downloaded it.\\n\\n[Client Name] used it to [specific result].\\n\\n👇 Your turn. Get instant access.\\n\\n[Name]",
        "callToActionButton": "Get Access",
        "targetAudience": "Direct buyers, people who know what they want"
      }
    ],
    "imagePrompts": [
      {
        "adNumber": 1,
        "imageDescription": "Professional person looking frustrated at computer, then smiling with results",
        "textOverlay": "Free [Resource Type] Inside",
        "colorScheme": "Brand colors with high contrast"
      },
      {
        "adNumber": 2,
        "imageDescription": "Before/after transformation visual or aspirational outcome image",
        "textOverlay": "[Outcome] in [Timeframe]",
        "colorScheme": "Bright, optimistic colors"
      },
      {
        "adNumber": 3,
        "imageDescription": "Authentic photo of founder or relatable person",
        "textOverlay": "My Story",
        "colorScheme": "Warm, personal tones"
      }
    ],
    "targetingRecommendations": {
      "interests": ["Specific interest 1 related to industry", "Interest 2", "Interest 3", "Competitors or related brands"],
      "behaviors": ["Engaged shoppers", "Business page admins", "Frequent buyers"],
      "demographics": {
        "ageRange": "Specific range based on ICP",
        "locations": "Target countries/regions",
        "incomeLevel": "If targeting business owners: Top 25%"
      },
      "lookalikeAudiences": [
        "Lookalike of email list",
        "Lookalike of past purchasers",
        "Lookalike of website visitors"
      ]
    }
  }
}

CRITICAL OUTPUT INSTRUCTIONS:
- Output ONLY the JSON object above, starting with the opening brace {
- NO explanations before or after the JSON
- NO markdown code blocks like \`\`\`json
- NO conversational text like "I understand" or "Here you go"
- NO questions like "Would you like me to..."
- Your ENTIRE response should be JUST the JSON object
- First character of your response must be {
- Last character of your response must be }
- Everything between must be valid JSON

START YOUR RESPONSE NOW WITH { (no other text):
`;

export default facebookAdsPrompt;
