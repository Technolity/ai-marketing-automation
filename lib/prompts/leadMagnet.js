/**
 * Lead Magnet - Deterministic Prompt
 * 7-Section structure for value-driven free resource
 * 
 * CRITICAL: This generates REAL, copy-paste ready content
 */

export const leadMagnetPrompt = (data) => `
You are creating the ACTUAL lead magnet for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL lead magnet that will be:
- Downloaded by thousands of prospects
- Used to build an email list
- The entry point into a sales funnel
- Converted into a PDF or digital asset

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "[Your answer here]"
2. Write ACTUAL content - not outlines
3. All copy must be COMPLETE and ready to use
4. Every field must contain REAL, usable content
5. Output MUST be valid JSON - no markdown, no explanations
6. Ensure alignment with brand voice throughout

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

Return ONLY valid JSON with exactly 7 sections:

{
  "leadMagnet": {
    "leadMagnetIdea": {
      "concept": "A clear concept for the value-driven gift or free resource",
      "coreProblemSolved": "The core problem this lead magnet solves for the audience",
      "keyOutcomeDelivered": "The key outcome or quick win the audience will achieve",
      "alignmentWithMethod": "How this aligns with the founder's unique method or approach",
      "format": "The format (PDF guide, checklist, video training, template, etc.)"
    },
    
    "titleAndHook": {
      "mainTitle": "A compelling, benefit-focused title that feels irresistible",
      "subtitle": "Optional subtitle that clarifies the value and adds specificity",
      "alternativeTitles": [
        "Alternative title option #1",
        "Alternative title option #2",
        "Alternative title option #3"
      ],
      "whyItsIrresistible": "Why this title/hook will grab attention and feel credible"
    },
    
    "audienceConnection": {
      "openingHook": "A powerful first line that speaks directly to their pain or desire",
      "painAcknowledgment": "Acknowledgment of their current frustration or struggle",
      "desireValidation": "Validation of what they want to achieve",
      "trustBuilder": "Brief statement that establishes credibility and relatability",
      "transitionToValue": "Smooth transition into what they're about to receive"
    },
    
    "coreContent": {
      "deliverable1": {
        "title": "First actionable tip, step, or element",
        "description": "What this delivers and why it matters",
        "immediateValue": "The tangible value they get immediately",
        "uniquePerspective": "How this reflects the founder's unique method"
      },
      "deliverable2": {
        "title": "Second actionable element",
        "description": "What this delivers and why it matters",
        "immediateValue": "The tangible value they get immediately",
        "uniquePerspective": "How this reflects the founder's unique method"
      },
      "deliverable3": {
        "title": "Third actionable element",
        "description": "What this delivers and why it matters",
        "immediateValue": "The tangible value they get immediately",
        "uniquePerspective": "How this reflects the founder's unique method"
      },
      "deliverable4": {
        "title": "Fourth actionable element (if applicable)",
        "description": "What this delivers and why it matters",
        "immediateValue": "The tangible value they get immediately",
        "uniquePerspective": "How this reflects the founder's unique method"
      },
      "deliverable5": {
        "title": "Fifth actionable element (if applicable)",
        "description": "What this delivers and why it matters",
        "immediateValue": "The tangible value they get immediately",
        "uniquePerspective": "How this reflects the founder's unique method"
      }
    },
    
    "leadMagnetCopy": {
      "headline": "The main headline for the landing page or opt-in form",
      "subheadline": "Supporting subheadline that adds clarity and urgency",
      "bulletPoints": [
        "Benefit bullet #1 - what they'll learn or get",
        "Benefit bullet #2 - what problem this solves",
        "Benefit bullet #3 - what quick win they'll achieve",
        "Benefit bullet #4 - what unique insight they'll discover"
      ],
      "softCta": "The soft call-to-action to download or sign up",
      "ctaButtonText": "Button text for the opt-in",
      "socialProof": "Brief social proof or credibility statement",
      "privacyNote": "Privacy/unsubscribe note"
    },
    
    "ctaIntegration": {
      "connectionToOffer": "How the lead magnet naturally ties to the main program or offer",
      "hintAtDeeperTransformation": "The hint at what's possible with the full program",
      "nextStepInvitation": "The invitation to take the next step after consuming the lead magnet",
      "emailOptInValue": "Why giving their email is worth it"
    },
    
    "voiceAndTone": {
      "brandVoiceDescription": "Description of the brand voice (bold, inspirational, direct, humorous, etc.)",
      "authenticityMarkers": [
        "Element #1 that makes the copy feel authentic, not salesy",
        "Element #2 that builds trust through genuine value",
        "Element #3 that reflects the founder's personality"
      ],
      "languageToUse": [
        "Word or phrase #1 that resonates with this audience",
        "Word or phrase #2 to use throughout",
        "Word or phrase #3 that builds connection"
      ],
      "languageToAvoid": [
        "Word or phrase #1 to avoid (too salesy)",
        "Word or phrase #2 to avoid (breaks trust)",
        "Word or phrase #3 to avoid (too generic)"
      ]
    }
  }
}
`;

export default leadMagnetPrompt;
