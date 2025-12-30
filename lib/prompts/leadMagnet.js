/**
 * Lead Magnet - Deterministic Prompt
 * 7-Section structure for value-driven free resource
 * 
 * CRITICAL: This generates REAL, copy-paste ready content
 */

export const leadMagnetPrompt = (data) => `
Create REAL lead magnet (copy-paste ready). NO placeholders. Complete content only.

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
Story: Pit=${data.storyLowMoment || 'NS'} | Discovery=${data.storyDiscovery || 'NS'} | Breakthrough=${data.storyBreakthrough || 'NS'}
Proof: ${data.testimonials || 'NS'}
CTA: ${data.callToAction || 'NS'}

JSON OUTPUT (no markdown, 7 sections):
{
  "leadMagnet": {
    "leadMagnetIdea": {
      "concept": "Value-driven gift/resource concept",
      "coreProblemSolved": "Core problem solved",
      "keyOutcomeDelivered": "Key outcome/quick win",
      "alignmentWithMethod": "How aligns with method",
      "format": "PDF/checklist/video/template"
    },
    "titleAndHook": {
      "mainTitle": "Compelling benefit-focused title",
      "subtitle": "Subtitle clarifying value",
      "alternativeTitles": ["Alt 1", "Alt 2", "Alt 3"],
      "whyItsIrresistible": "Why grabs attention"
    },
    "audienceConnection": {
      "openingHook": "First line speaks to pain/desire",
      "painAcknowledgment": "Acknowledge frustration",
      "desireValidation": "Validate what they want",
      "trustBuilder": "Establish credibility",
      "transitionToValue": "Transition to value"
    },
    "coreContent": {
      "deliverable1": {"title": "Actionable tip 1", "description": "What delivers/why matters", "immediateValue": "Tangible value", "uniquePerspective": "Reflects method"},
      "deliverable2": {"title": "Actionable tip 2", "description": "What delivers/why matters", "immediateValue": "Tangible value", "uniquePerspective": "Reflects method"},
      "deliverable3": {"title": "Actionable tip 3", "description": "What delivers/why matters", "immediateValue": "Tangible value", "uniquePerspective": "Reflects method"},
      "deliverable4": {"title": "Actionable tip 4", "description": "What delivers/why matters", "immediateValue": "Tangible value", "uniquePerspective": "Reflects method"},
      "deliverable5": {"title": "Actionable tip 5", "description": "What delivers/why matters", "immediateValue": "Tangible value", "uniquePerspective": "Reflects method"}
    },
    "leadMagnetCopy": {
      "headline": "Landing page headline",
      "subheadline": "Supporting subhead",
      "bulletPoints": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
      "softCta": "Soft CTA to download/signup",
      "ctaButtonText": "Button text",
      "socialProof": "Proof/credibility statement",
      "privacyNote": "Privacy note"
    },
    "ctaIntegration": {
      "connectionToOffer": "How ties to main offer",
      "hintAtDeeperTransformation": "What's possible with full program",
      "nextStepInvitation": "Invitation to next step",
      "emailOptInValue": "Why email worth it"
    },
    "voiceAndTone": {
      "brandVoiceDescription": "Voice (bold/inspirational/direct/etc)",
      "authenticityMarkers": ["Authentic element 1", "Trust element 2", "Personality element 3"],
      "languageToUse": ["Resonate word 1", "Phrase 2", "Connect phrase 3"],
      "languageToAvoid": ["Too salesy 1", "Breaks trust 2", "Too generic 3"]
    }
  }
}

NO placeholders. Real content only.
`;

export default leadMagnetPrompt;
