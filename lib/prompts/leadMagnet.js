/**
 * Lead Magnet Creation - Master Prompt
 * Value-driven gift ideas and copy to build email list
 */

export const leadMagnetPrompt = (data) => `
ROLE & STRATEGIC CONTEXT

You are a senior marketing strategist and direct-response copywriter.
Your task is to design a high-value lead magnet (e.g., guide, checklist, mini-course, template, or toolkit) that:

- Attracts the ideal audience
- Builds trust and credibility
- Converts readers into email subscribers
- Aligns with the founder's unique approach and brand voice

The output should include idea, title, and persuasive copy that can be used for landing pages, ads, and email opt-ins.

INPUT DATA

Industry / Market: ${data.industry || 'Not specified'}

Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}

What the business helps them with (Core Capability): ${data.message || 'Not specified'}

Primary problem the audience faces: ${data.coreProblem || 'Not specified'}

Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}

Unique approach / method: ${data.uniqueAdvantage || 'Not specified'}

Why you do this work (Founder Story / Mission): ${data.story || 'Not specified'}

Notable client results / proof (if any): ${data.testimonials || 'Not specified'}

Main program or offer: ${data.offerProgram || 'Not specified'}

Primary call-to-action: ${data.callToAction || 'Not specified'}

Brand voice / personality: ${data.brandVoice || 'Not specified'}

Business stage: ${data.businessStage || 'Not specified'}

TASK

Using the inputs above, create a Lead Magnet blueprint with the following elements:

1. Lead Magnet Idea
- A clear concept for a value-driven gift or free resource
- Should solve a core problem or deliver a key outcome for the audience
- Must align with the founder's unique method or approach

2. Title & Hook
- A compelling, benefit-focused title
- Optional subtitle that clarifies value
- Should feel irresistible and credible

3. Audience Connection
- A short intro that speaks directly to the ideal client's pain, desires, or frustration
- Establishes trust and relatability immediately

4. Core Content / Deliverables
- Outline 3–5 actionable tips, steps, templates, or exercises
- Each element should provide immediate, tangible value
- Highlight founder's unique perspective or method

5. Lead Magnet Copy
- Persuasive copy for the landing page, opt-in form, or ad
- Include:
  - Headline
  - Subheadline
  - Bullet points of what the subscriber will get
  - Soft call-to-action to download or sign up

6. CTA Integration
- Tie the lead magnet naturally to the main program or offer
- Encourage email opt-in while hinting at deeper transformation

7. Voice & Tone
- Ensure alignment with brand voice (bold, inspirational, direct, humorous, compassionate, authoritative, etc.)
- Copy should feel authentic, not salesy

IMPORTANT GUIDELINES

- Do not be generic; focus on solving a real problem for the audience
- Avoid fluff or overly long copy
- Make the lead magnet actionable and immediately useful
- If some inputs are missing, make smart assumptions based on the audience and market

Return ONLY valid JSON in this structure:
{
  "leadMagnet": {
    "concept": {
      "type": "Guide / Checklist / Template / Mini-Course / Toolkit",
      "idea": "Clear concept description",
      "problemItSolves": "The core problem this addresses",
      "alignmentWithMethod": "How it connects to the unique approach"
    },
    "titleAndHook": {
      "mainTitle": "Compelling, benefit-focused title",
      "subtitle": "Optional subtitle that clarifies value",
      "alternativeTitles": ["Alternative title 1", "Alternative title 2", "Alternative title 3"]
    },
    "audienceConnection": {
      "openingStatement": "Short intro that speaks to their pain/desires",
      "relatabilityHook": "What makes this feel like it was made for them",
      "trustBuilder": "Why they should trust this resource"
    },
    "coreContent": {
      "deliverables": [
        {
          "item": "Tip/Step/Template 1",
          "description": "What it provides",
          "value": "The immediate benefit"
        },
        {
          "item": "Tip/Step/Template 2",
          "description": "What it provides",
          "value": "The immediate benefit"
        },
        {
          "item": "Tip/Step/Template 3",
          "description": "What it provides",
          "value": "The immediate benefit"
        },
        {
          "item": "Tip/Step/Template 4",
          "description": "What it provides",
          "value": "The immediate benefit"
        },
        {
          "item": "Tip/Step/Template 5",
          "description": "What it provides",
          "value": "The immediate benefit"
        }
      ],
      "uniquePerspective": "How the founder's unique method is woven in"
    },
    "landingPageCopy": {
      "headline": "Main headline for landing page",
      "subheadline": "Supporting subheadline",
      "bulletPoints": [
        "What they'll get - Benefit 1",
        "What they'll get - Benefit 2",
        "What they'll get - Benefit 3",
        "What they'll get - Benefit 4"
      ],
      "ctaButtonText": "Get Instant Access / Download Now / etc.",
      "privacyNote": "We respect your privacy statement"
    },
    "ctaIntegration": {
      "connectionToMainOffer": "How this ties to the main program/offer",
      "nextStepHint": "Subtle hint at deeper transformation available"
    },
    "adCopy": {
      "facebookAdVersion": "Short, punchy ad copy for Facebook (2-3 sentences with CTA)",
      "instagramAdVersion": "Instagram-optimized version with emojis",
      "emailSubjectLines": ["Subject line 1", "Subject line 2", "Subject line 3"]
    }
  }
}
`;

export default leadMagnetPrompt;
