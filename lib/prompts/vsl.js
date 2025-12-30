/**
 * Video Sales Letter (VSL) Script - Deterministic Prompt
 * Complete teleprompter-ready VSL script
 * 
 * CRITICAL: Output is teleprompter-ready - NO headings, NO formatting, NO directions
 */

export const vslPrompt = (data) => `
You are writing the ACTUAL VSL script for a real business that will be read into a camera.

THIS IS NOT AN EXAMPLE. This is the REAL script that will be:
- Read directly into a teleprompter
- Recorded as a video
- Used to sell a real product/service
- Seen by thousands of potential customers

CRITICAL RULES FOR THE FULL SCRIPT:
1. NO headings, NO subheadings, NO section markers, NO "[SECTION NAME]"
2. NO bullet points, NO numbered lists within the script
3. NO stage directions like "[pause here]" or "[show emotion]"
4. NO "[INSERT HERE]", "for example", "TBD", or any placeholders
5. NO explanations or meta-commentary
6. JUST THE WORDS that will be spoken, flowing naturally from one sentence to the next
7. Write it EXACTLY as it will be read - conversational, persuasive, complete

THE SCRIPT MUST INCLUDE (woven naturally, not as sections):
- Pattern interrupt opening hook
- Personal story with vulnerability
- Problem agitation (dig into the pain)
- The 3 tips with action steps (promised value)
- Your unique mechanism/method reveal
- Social proof and testimonials
- Offer presentation with bonuses
- Objection handling
- Multiple closes (urgency, scarcity, inspiration)
- Final call to action

INPUT DATA:

Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
What you help them with: ${data.message || 'Not specified'}
Primary problem they face: ${data.coreProblem || 'Not specified'}
Outcomes they want: ${data.outcomes || 'Not specified'}
Your unique approach / method: ${data.uniqueAdvantage || 'Not specified'}
Your story / mission (Source Data):
- The Pit: ${data.storyLowMoment || 'Not specified'}
- The Discovery: ${data.storyDiscovery || 'Not specified'}
- The Breakthrough: ${data.storyBreakthrough || 'Not specified'}
- The Outcome: ${data.storyResults || 'Not specified'}
Client results / proof: ${data.testimonials || 'Not specified'}
Main offer / program: ${data.offerProgram || 'Not specified'}
Deliverables: ${data.deliverables || 'Not specified'}
Pricing: ${data.pricing || 'Not specified'}
Call-to-action: ${data.callToAction || 'Book a free consultation'}
Brand voice: ${data.brandVoice || 'Not specified'}

Return ONLY valid JSON. The "fullScript" field MUST be the complete, teleprompter-ready script with NO formatting:

{
  "vslScript": {
    "fullScript": "Start the script here with the pattern interrupt hook. Write the ENTIRE VSL as one continuous, flowing narrative. This should be 2500-3500 words. Begin with an attention-grabbing question or statement about their pain. Then share your personal story - be vulnerable about your struggle. Agitate the problem deeply. Transition into the three tips you promised, giving each tip with a clear action step they can implement. Reveal your unique mechanism and why it works. Share client success stories with specific results. Present your offer with enthusiasm, stack the value, reveal the price. Handle the top objections naturally within the script. Close multiple times - once on urgency, once on scarcity, once on inspiration about their future. End with a clear call to action. Remember: NO HEADINGS. NO BULLETS. NO DIRECTIONS. Just the script, word for word, exactly as it will be spoken.",
    "estimatedLength": "18-22 minutes",
    "hookOptions": [
      "If you're a [specific audience] struggling with [specific problem], stay with me for the next few minutes because what I'm about to share changed everything for me and thousands of others.",
      "What if I told you that everything you've been taught about [topic] is actually keeping you stuck? I know that sounds crazy, but by the end of this video, you'll see exactly what I mean.",
      "I'm going to share the three biggest mistakes [audience] make when trying to [goal], and more importantly, the simple shift that can change everything in the next 30 days."
    ],
    "threeTips": [
      {
        "tipTitle": "Tip #1: [Specific, Actionable Title]",
        "tipContent": "The core teaching of this tip - what they need to understand",
        "actionStep": "The specific thing they should do right now to implement this",
        "whyItWorks": "Why this makes such a big difference"
      },
      {
        "tipTitle": "Tip #2: [Specific, Actionable Title]",
        "tipContent": "The core teaching of this tip",
        "actionStep": "The specific implementation step",
        "whyItWorks": "The impact this has"
      },
      {
        "tipTitle": "Tip #3: [Specific, Actionable Title]",
        "tipContent": "The core teaching of this tip",
        "actionStep": "The specific implementation step",
        "whyItWorks": "The impact this has"
      }
    ],
    "stepsToSuccess": [
      {
        "step": 1,
        "title": "Step Title",
        "description": "What happens in this step",
        "benefit": "The result they get from this step"
      },
      {
        "step": 2,
        "title": "Step Title",
        "description": "What happens in this step",
        "benefit": "The result they get from this step"
      },
      {
        "step": 3,
        "title": "Step Title",
        "description": "What happens in this step",
        "benefit": "The result they get from this step"
      },
      {
        "step": 4,
        "title": "Step Title",
        "description": "What happens in this step",
        "benefit": "The result they get from this step"
      }
    ],
    "callToActionName": "Book Your [Branded Call Name]",
    "objectionHandlers": [
      {
        "objection": "I don't have time",
        "response": "This system is designed for busy professionals. Most clients spend just 3-5 hours per week, and the templates cut your work in half. Plus, think about all the time you're currently wasting on strategies that don't work.",
        "placementInScript": "After presenting the program details"
      },
      {
        "objection": "I can't afford it / It's too expensive",
        "response": "One new client at your price point covers the entire investment. Most of our clients see ROI within 30-60 days. The real question is: can you afford NOT to have a system that works?",
        "placementInScript": "After revealing the price"
      },
      {
        "objection": "I've tried things like this before",
        "response": "I get it. I tried dozens of things before I figured this out too. The difference is that this system focuses on [key differentiator] first, which is why our clients get results when other approaches failed them.",
        "placementInScript": "After sharing proof"
      },
      {
        "objection": "Now isn't the right time",
        "response": "Here's what I've learned: there's never a perfect time. But every month you wait is another month of [specific pain they're experiencing]. The clients who got the best results are the ones who decided to act even when it felt scary.",
        "placementInScript": "During the final close"
      }
    ],
    "urgencyElements": [
      "We only take on X new clients per month to ensure everyone gets the support they need",
      "This special pricing is only available for the next [timeframe]",
      "The longer you wait, the longer you stay stuck in [current painful situation]"
    ],
    "socialProofMentions": [
      "[Client Name/Type] went from [before state] to [after state] in just [timeframe]",
      "We've helped [number] clients achieve [specific result]",
      "[Testimonial quote with specific result]"
    ],
    "guarantee": "Our [Name of Guarantee] Guarantee: If you [specific action requirements] and don't see [specific result], we'll [what you'll do]. We're confident because this system has worked for hundreds of clients just like you.",
    "closingSequence": {
      "urgencyClose": "The script text for the urgency-based close",
      "scarcityClose": "The script text for the scarcity-based close",
      "inspirationClose": "The script text for the vision/inspiration-based close",
      "finalCTA": "The final call to action script text"
    }
  }
}
`;

export default vslPrompt;
