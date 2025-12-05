/**
 * Facebook Ads Generator - Short Form & Long Form
 * Uses the complete framework from prompts.txt
 */

export const facebookAdsPrompt = (data) => `
Create Facebook Ads using the VSL content. Generate 10 SHORT-FORM and 10 LONG-FORM ads.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

===== SHORT-FORM ADS TEMPLATE =====

For each of the 10 short-form ads, use this template:

1. A headline that hooks the audience with a question or a powerful statement that's related to a major pain point

2. A Call to action right away to access the lead magnet

3. Share 3 benefits that will excite the client about accessing the training. Include a one sentence explanation for each point.

4. Insert Stats or personal journey of the creator. This should be at least two sentences long.

5. Include one powerful social proof – be sure to include enough background details to make the proof compelling.

6. Call to action to opt in for the free training – this should be one or two powerful sentences

7. Sign off with something inspirational to make client feel part of a community.

IMPORTANT: Write conversationally, using complete sentences for each section. Do NOT include headers or subheaders. Each ad should be copy-paste ready for Facebook. Use professional emojis throughout.

===== LONG-FORM ADS FRAMEWORK =====

For each of the 10 long-form ads, use this framework:

**1. Attention-Grabbing Headline (Hook)**
The hook should have: 1) a time frame 2) make it easy or effortless 3) speak to the burning desire or address the nagging problem
Example: "How I Generated $40 Million in High-Ticket Sales with This Unique Funnel that Floods Your Business with Appointments in Just 14 Days!"

**2. Imagination Prompt (Problem + Emotional Pain)**
Start with a relatable problem or frustration that connects emotionally.
Paint the frustrating morning/day scenario.

**3. Personal Struggle (Relatable Story)**
Share a personal struggle, a story that shows vulnerability, and builds connection.
Show the "before" state and the moment of discovery.

**4. Highlight the Unique Solution (Benefits + Big Promise)**
Introduce the solution (your system) and emphasize the transformation.
Include the big promise and timeline.

**5. Paint the Picture of Success (Visualize the Result)**
Show a clear, desirable outcome that your audience can picture.
"Imagine launching this funnel in just 3 days and seeing your calendar fill up..."

**6. Set a Clear Qualification (Exclusivity)**
Define who this is for and create exclusivity, pushing away unqualified prospects.
Include price point qualifications.

**7. Call to Action (CTA with Urgency)**
Encourage immediate action, driving urgency and making the offer appealing.

**8. Bonus (P.S. or Final Hook)**
Add a final punch or bonus information to overcome common objections or create a personal connection.

IMPORTANT: Do not include section headings so each ad is copy-and-paste ready. Use emojis throughout.

Return ONLY valid JSON in this exact structure:
{
  "facebookAds": {
    "shortFormAds": [
      {
        "adNumber": 1,
        "hook": "Attention-grabbing headline/question",
        "ctaToLeadMagnet": "Call to action for lead magnet",
        "benefits": [
          {"benefit": "", "explanation": ""},
          {"benefit": "", "explanation": ""},
          {"benefit": "", "explanation": ""}
        ],
        "statsOrJourney": "Personal stats or journey (2+ sentences)",
        "socialProof": "Compelling testimonial with background",
        "optInCTA": "Powerful opt-in call to action",
        "inspirationalClose": "Community-building close",
        "fullAdCopy": "Complete copy-paste ready ad with emojis"
      }
    ],
    "longFormAds": [
      {
        "adNumber": 1,
        "headline": "Hook with timeframe + ease + desire",
        "imaginationPrompt": "Relatable problem scenario with emotional paint",
        "personalStruggle": "Vulnerable story showing before + discovery",
        "uniqueSolution": "Your system + transformation promise",
        "successVisualization": "Clear picture of results",
        "qualification": "Who this is for / not for with price points",
        "cta": "Urgent call to action",
        "ps": "Final objection handler or connection",
        "fullAdCopy": "Complete long-form ad ready to paste with emojis"
      }
    ],
    "imageConcepts": [
      {
        "concept": "Lead Magnet Image: 3D image of the book/report",
        "description": ""
      },
      {
        "concept": "Video: Quick walkthrough of funnel and results",
        "description": ""
      },
      {
        "concept": "Before-and-After: Overworked to calendar filled",
        "description": ""
      }
    ]
  }
}
`;

export default facebookAdsPrompt;
