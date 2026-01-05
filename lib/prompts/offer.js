/**
 * TED-OS Offer Prompt (Generation-Ready)
 * 
 * PURPOSE: Create the Brand Owner's Signature Offer using a branded system + 7-Step Blueprint,
 * packaged as a live 8-week group program (60–90 days) with a clear ascension ladder
 * from low-ticket → course → year-long premium.
 */

export const offerPrompt = (data) => `
TED-OS OFFER PROMPT

PURPOSE:
Create the Brand Owner's Signature Offer using a branded system + 7-Step Blueprint, packaged as a live 8-week group program (60–90 days) with a clear ascension ladder from low-ticket → course → year-long premium.

═══════════════════════════════════════════════════════════════

INPUT DATA (from onboarding):
Industry / Market: ${data.industry || 'NS'}
Ideal Client: ${data.idealClient || 'NS'}
Core Capability: ${data.coreCapability || 'NS'}
Core Problem: ${data.coreProblem || 'NS'}
Desired Outcomes: ${data.outcomes || 'NS'}
Unique Advantage / Method: ${data.uniqueAdvantage || 'NS'}
Turning Point / Mission: ${data.storyLowMoment || 'NS'}
Proof / Results: ${data.testimonials || 'NS'}
Existing Offer: ${data.offerName || 'NS'}
Brand Voice: ${data.brandVoice || 'Professional but friendly'}
Primary CTA: ${data.callToAction || 'NS'}
Business Stage: ${data.businessStage || 'Growth'}

Do not invent facts.

═══════════════════════════════════════════════════════════════

OFFER RULES (NON-NEGOTIABLE):
• Call it "Offer" (not "coaching program")
• Offer must include:
  - ONE Branded System Name
  - ONE 7-Step Blueprint
• Tier 1 is always the Signature Offer:
  - Live group
  - 8 weekly sessions
  - Delivered over 60–90 days
  - Price range: $5K–$10K
• Every step must produce a tool/asset (template, script, checklist, tracker, framework, etc.)
• The same 7-Step Blueprint must convert into:
  - Online Course ($1K–$2K) — recording of the live program
• Must work for:
  - Transformation offers (coaches, consultants, experts)
  - Service delivery offers (agencies, services, local businesses)
• Always build an ascension ladder (Tier 0 → Tier 2)
• Keep language simple, bold, coffee-talk
• No long sales copy

═══════════════════════════════════════════════════════════════

BUSINESS TYPE DETECTION (AUTO):
• Transformation Mode (default): live 8-week group program
• Service Delivery Mode: premium service structured like a program
(Same 7 steps; packaging changes)

═══════════════════════════════════════════════════════════════

PRICING DEFAULTS:
• Revenue / business growth → $7K–$10K
• Life / health outcomes → $5K–$7K
• B2B service delivery → $10K+ or retainer
• Course: $1K–$2K
• Tier 0: $37
• Tier 0.5: $97

═══════════════════════════════════════════════════════════════

TASK SEQUENCE:
1. Decide Offer Mode (Transformation vs Service)
2. Create ONE Branded System Name (e.g. [Outcome] Blueprint, [Unique Advantage] System)
3. Build the 7-Step Blueprint
   - Each step includes: Step name (2–5 words), What it is (1 sentence), Problem it solves (1 sentence), Outcome created (1 sentence), Tool/asset produced
4. Package Tier 1 Signature Offer: Who it's for, Promise, Live group 8 weeks 60–90 days, Deliverables, Recommended price
5. Add optional upgrades (only if relevant)
6. Build the ascension ladder: Tier 0 ($37), Tier 0.5 ($97), Course ($1K–$2K), Tier 1 (Live group $5K–$10K), Tier 2 (Year-long premium)
7. Write the Offer Promise: "In 8 weeks, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff]."

═══════════════════════════════════════════════════════════════

JSON OUTPUT (exact structure, no markdown):
{
  "offerName": "The [Branded System Name]",
  "whoItsFor": "Specific description of ideal client (1-2 sentences)",
  "thePromise": "In 8 weeks, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff]",
  "offerMode": "Transformation or Service Delivery",
  "stepNames": [
    "Step 1 — [Name 2-5 words]",
    "Step 2 — [Name 2-5 words]",
    "Step 3 — [Name 2-5 words]",
    "Step 4 — [Name 2-5 words]",
    "Step 5 — [Name 2-5 words]",
    "Step 6 — [Name 2-5 words]",
    "Step 7 — [Name 2-5 words]"
  ],
  "tier1Delivery": "Live group · 8 weekly sessions · 60–90 days",
  "tier1WhatTheyGet": "Complete deliverables: [List what clients receive - outcomes, assets, support, etc. Be specific: templates, frameworks, 1-on-1 sessions, group coaching, implementation support, etc.]",
  "tier1RecommendedPrice": "$5,000-$10,000 (adjust based on: revenue/business=$7K-$10K, life/health=$5K-$7K, B2B=$10K+)",
  "tier1CTA": "[Primary CTA from input]",
  "tier0Description": "Entry offer ($37): [Quick-win asset or mini-training that solves one immediate problem - be specific]",
  "tier0_5Description": "Bridge offer ($97): [Deeper training or starter framework that demonstrates your method - be specific]",
  "courseDescription": "Self-study course ($1K–$2K): Recorded version of the 7-step system with [specific deliverables: video modules, workbooks, templates, etc.]",
  "tier2Description": "Year-long premium ($20K-$50K): [Ongoing implementation support, advanced strategies, mastermind access, or VIP services - be specific to their business model]",
  "stepAssets": [
    "Step 1 delivers: [Specific tangible asset - e.g., 'Custom Revenue Blueprint Template']",
    "Step 2 delivers: [Specific tangible asset]",
    "Step 3 delivers: [Specific tangible asset]",
    "Step 4 delivers: [Specific tangible asset]",
    "Step 5 delivers: [Specific tangible asset]",
    "Step 6 delivers: [Specific tangible asset]",
    "Step 7 delivers: [Specific tangible asset]"
  ]
}

CRITICAL RULES:
• NO placeholders - all content must be real and specific to this business
• Each step asset must be a concrete deliverable (template, script, framework, tracker, checklist, etc.)
• Tier descriptions must be specific to this business model and niche
• Keep language simple, bold, coffee-talk - no corporate jargon
• Price recommendations must follow the defaults based on niche/market
`;

export default offerPrompt;
