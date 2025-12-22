/**
 * Facebook Ads - Master Prompt
 * Targeted ad variations with specific templates
 */

export const facebookAdsPrompt = (data) => `
Using the VSL content and lead magnet information, create 10 compelling Facebook ads. Use the template below with data from the inputs. Write compelling Facebook ads that communicate powerfully to the target audience.

Be sure not to skimp on social proof and personal details — provide enough background details to make their use compelling. Use professional emojis throughout the ads as well.

INPUT DATA

Industry / Market: ${data.industry || 'Not specified'}

Who you help (Ideal Client): ${data.idealClient || 'Not specified'}

What you help them with: ${data.message || 'Not specified'}

Primary problem they face: ${data.coreProblem || 'Not specified'}

Outcomes they want: ${data.outcomes || 'Not specified'}

Your unique approach: ${data.uniqueAdvantage || 'Not specified'}

Your story: ${data.story || 'Not specified'}

Client results / testimonials: ${data.testimonials || 'Not specified'}

Lead Magnet Title: ${data.leadMagnetTitle || 'Free Training'}

Main offer: ${data.offerProgram || 'Not specified'}

Brand voice: ${data.brandVoice || 'Not specified'}

FB AD TEMPLATE (for each ad):

1. A headline that hooks the audience with a question or a powerful statement that's related to a major pain point.

2. A Call to action right away to access the lead magnet (use the Lead Magnet Title).

3. Share 3 benefits that will excite the client about accessing the training. Include a one sentence explanation for each point.

4. Insert Stats or personal journey of the creator. This should be at least two sentences long.

5. Include one powerful social proof – be sure to include enough background details to make the proof compelling.

6. Call to action to opt in for the free training – this should be one or two powerful sentences.

7. Sign off with something inspirational to make client feel part of a community.

IMPORTANT: Write conversationally, using complete sentences for each section of the template. Do not include headers or subheaders — the ad should be able to be cut and pasted directly into Facebook.

Create 10 DIFFERENT ads, each with a unique angle:
- Ad 1: Pain point focus
- Ad 2: Outcome/transformation focus
- Ad 3: Story-driven
- Ad 4: Social proof heavy
- Ad 5: Urgency/scarcity
- Ad 6: Question hook
- Ad 7: Bold statement hook
- Ad 8: "Imagine if..." visualization
- Ad 9: Myth-busting
- Ad 10: Direct offer

Return ONLY valid JSON in this structure:
{
  "facebookAds": {
    "ads": [
      {
        "adNumber": 1,
        "angle": "Pain point focus",
        "headline": "Attention-grabbing headline with question or statement",
        "primaryText": "The full ad copy, written conversationally with emojis. Includes: hook, immediate CTA to lead magnet, 3 benefits with one-sentence explanations, stats or personal journey (2+ sentences), one powerful social proof with background details, opt-in CTA (1-2 powerful sentences), inspirational sign-off. Ready to paste directly into Facebook.",
        "callToActionButton": "Learn More / Sign Up / Download",
        "targetAudience": "Who this ad specifically targets"
      },
      {
        "adNumber": 2,
        "angle": "Outcome/transformation focus",
        "headline": "Headline focused on the end result",
        "primaryText": "Full ad copy following the template...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 3,
        "angle": "Story-driven",
        "headline": "Story-based hook headline",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 4,
        "angle": "Social proof heavy",
        "headline": "Results-focused headline",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 5,
        "angle": "Urgency/scarcity",
        "headline": "Urgency-driven headline",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 6,
        "angle": "Question hook",
        "headline": "Compelling question as headline",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 7,
        "angle": "Bold statement hook",
        "headline": "Bold, provocative statement",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 8,
        "angle": "Imagine if... visualization",
        "headline": "Visualization headline",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 9,
        "angle": "Myth-busting",
        "headline": "Myth-busting headline",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      },
      {
        "adNumber": 10,
        "angle": "Direct offer",
        "headline": "Direct, clear offer headline",
        "primaryText": "Full ad copy...",
        "callToActionButton": "Learn More",
        "targetAudience": "Who this ad targets"
      }
    ],
    "imagePrompts": [
      {
        "adNumber": 1,
        "imageDescription": "Description of ideal image for this ad",
        "textOverlay": "Suggested text overlay for the image"
      },
      {
        "adNumber": 2,
        "imageDescription": "Description of ideal image",
        "textOverlay": "Suggested text overlay"
      }
    ],
    "targetingRecommendations": {
      "interests": ["Interest 1", "Interest 2", "Interest 3"],
      "behaviors": ["Behavior 1", "Behavior 2"],
      "demographics": {
        "ageRange": "Age range",
        "location": "Location targeting"
      }
    }
  }
}
`;

export default facebookAdsPrompt;
