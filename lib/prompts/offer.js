/**
 * Offer Prompt - Signature Offer Framework
 * 
 * PURPOSE: Create the Brand Owner's Signature Offer using a branded system 
 * + 7-Step Blueprint, packaged as a live 8-week group program (60-90 days) 
 * with a clear ascension ladder from low-ticket → course → year-long premium.
 * 
 * OFFER RULES:
 * - ONE Branded System Name
 * - ONE 7-Step Blueprint
 * - Every step produces a tool/asset
 * - Tier 1 is always the Signature Offer (live group, 8 weeks, $5K-$10K)
 */

export const offerPrompt = (data) => `
You are creating the ACTUAL Signature Offer for a real business.

PURPOSE:
Create the Brand Owner's Signature Offer using a branded system + 7-Step Blueprint, packaged as a live 8-week group program (60–90 days) with a clear ascension ladder from low-ticket → course → year-long premium.

===== INPUT DATA (SOURCE OF TRUTH) =====

Industry / Market: ${data.industry || '[DETAIL NEEDED]'}
Ideal Client: ${data.idealClient || '[DETAIL NEEDED]'}
Core capability (what you help with): ${data.message || '[DETAIL NEEDED]'}
Core problem: ${data.coreProblem || '[DETAIL NEEDED]'}
Desired outcomes: ${data.outcomes || '[DETAIL NEEDED]'}
Unique advantage / method: ${data.uniqueAdvantage || '[DETAIL NEEDED]'}
Turning point / mission (Source Data):
- The Pit: ${data.storyLowMoment || 'Not provided'}
- The Discovery: ${data.storyDiscovery || 'Not provided'}
- The Breakthrough: ${data.storyBreakthrough || 'Not provided'}
- The Outcome: ${data.storyResults || 'Not provided'}
Proof or results (if any): ${data.testimonials || 'Not provided'}
Existing offer (if any): ${data.offerProgram || 'Not provided'}
Brand voice: ${data.brandVoice || 'Not specified'}
Primary CTA: ${data.callToAction || '[DETAIL NEEDED]'}
Business stage: ${data.businessStage || 'Not specified'}

===== OFFER RULES (NON-NEGOTIABLE) =====

1. Call it "Offer" (not "coaching program")
2. Offer MUST include:
   - ONE Branded System Name
   - ONE 7-Step Blueprint
3. Tier 1 is always the Signature Offer:
   - Live group
   - 8 weekly sessions
   - Delivered over 60-90 days
   - Price range: $5K-$10K
4. Every step MUST produce a tool/asset (template, script, checklist, tracker, framework, etc.)
5. Same 7-Step Blueprint converts into Course ($1K-$2K)
6. Keep language simple, bold, coffee-talk
7. No long sales copy

===== BUSINESS TYPE DETECTION =====

Auto-detect based on inputs:
- Transformation Mode (default): live 8-week group program (coaches, consultants, experts)
- Service Delivery Mode: premium service structured like a program (agencies, services, local businesses)
Same 7 steps; packaging changes.

===== PRICING DEFAULTS =====

- Revenue / business growth → $7K-$10K
- Life / health outcomes → $5K-$7K
- B2B service delivery → $10K+ or retainer
- Course: $1K-$2K
- Tier 0: $37
- Tier 0.5: $97

===== TASK SEQUENCE =====

1. Decide Offer Mode (Transformation vs Service)
2. Create ONE Branded System Name (e.g. [Outcome] Blueprint, [Unique Advantage] System)
3. Build the 7-Step Blueprint with: step name, what it is, problem solved, outcome, tool/asset
4. Package Tier 1 Signature Offer
5. Build ascension ladder: Tier 0 → 0.5 → Course → Tier 1 → Tier 2
6. Write the Offer Promise: "In 8 weeks, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff]."

===== OUTPUT FORMAT (STRICT JSON) =====

Return ONLY valid JSON with this exact structure:

{
  "signatureOffer": {
    "offerName": "The branded system/offer name",
    "whoItsFor": "Specific description of ideal client for this offer",
    "thePromise": "In 8 weeks, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff].",
    "offerMode": "Transformation or Service Delivery",
    "sevenStepBlueprint": [
      {
        "stepNumber": 1,
        "stepName": "Step name (2-5 words)",
        "whatItIs": "What this step is (1 sentence)",
        "problemSolved": "Problem it solves (1 sentence)",
        "outcomeCreated": "Outcome created (1 sentence)",
        "toolAsset": "Tool/asset produced (template, script, checklist, etc.)"
      },
      {
        "stepNumber": 2,
        "stepName": "Step name",
        "whatItIs": "What this step is",
        "problemSolved": "Problem it solves",
        "outcomeCreated": "Outcome created",
        "toolAsset": "Tool/asset produced"
      },
      {
        "stepNumber": 3,
        "stepName": "Step name",
        "whatItIs": "What this step is",
        "problemSolved": "Problem it solves",
        "outcomeCreated": "Outcome created",
        "toolAsset": "Tool/asset produced"
      },
      {
        "stepNumber": 4,
        "stepName": "Step name",
        "whatItIs": "What this step is",
        "problemSolved": "Problem it solves",
        "outcomeCreated": "Outcome created",
        "toolAsset": "Tool/asset produced"
      },
      {
        "stepNumber": 5,
        "stepName": "Step name",
        "whatItIs": "What this step is",
        "problemSolved": "Problem it solves",
        "outcomeCreated": "Outcome created",
        "toolAsset": "Tool/asset produced"
      },
      {
        "stepNumber": 6,
        "stepName": "Step name",
        "whatItIs": "What this step is",
        "problemSolved": "Problem it solves",
        "outcomeCreated": "Outcome created",
        "toolAsset": "Tool/asset produced"
      },
      {
        "stepNumber": 7,
        "stepName": "Step name",
        "whatItIs": "What this step is",
        "problemSolved": "Problem it solves",
        "outcomeCreated": "Outcome created",
        "toolAsset": "Tool/asset produced"
      }
    ],
    "tier1SignatureOffer": {
      "delivery": "Live group (8 weeks, 60-90 days)",
      "whatTheyGet": "List of deliverables they receive",
      "recommendedPrice": "$X,XXX - $X,XXX"
    },
    "ascensionLadder": {
      "tier0": {
        "name": "Entry offer name",
        "price": "$37",
        "description": "What they get"
      },
      "tier05": {
        "name": "Low-ticket offer name",
        "price": "$97",
        "description": "What they get"
      },
      "course": {
        "name": "Course name",
        "price": "$1,000 - $2,000",
        "description": "Recording of live program + resources"
      },
      "tier2": {
        "name": "Premium year-long offer name",
        "price": "$15,000 - $25,000",
        "description": "Year-long premium experience"
      }
    },
    "cta": "The primary call to action from inputs"
  }
}

===== HARD LIMITS =====

- No placeholder text like "[insert]" — use real content
- No long sales copy paragraphs
- No markdown formatting — pure JSON only
- Every step MUST have a concrete tool/asset
- Prices must be specific ranges, not vague
`;

export default offerPrompt;
