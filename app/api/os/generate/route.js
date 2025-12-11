import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { auth } from '@clerk/nextjs';

// Import individual prompts from the prompts directory
import { idealClientPrompt } from '@/lib/prompts/idealClient';
import { messagePrompt } from '@/lib/prompts/message';
import { storyPrompt } from '@/lib/prompts/story';
import { offerPrompt } from '@/lib/prompts/offer';
import { salesScriptsPrompt } from '@/lib/prompts/salesScripts';
import { leadMagnetPrompt } from '@/lib/prompts/leadMagnet';
import { vslPrompt } from '@/lib/prompts/vsl';
import { emailsPrompt } from '@/lib/prompts/emails';
import { facebookAdsPrompt } from '@/lib/prompts/facebookAds';
import { funnelCopyPrompt } from '@/lib/prompts/funnelCopy';
import { contentIdeasPrompt } from '@/lib/prompts/contentIdeas';
import { program12MonthPrompt } from '@/lib/prompts/program12Month';
import { youtubeShowPrompt } from '@/lib/prompts/youtubeShow';
import { contentPillarsPrompt } from '@/lib/prompts/contentPillars';
import { bioPrompt } from '@/lib/prompts/bio';
import { appointmentRemindersPrompt } from '@/lib/prompts/appointmentReminders';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// All prompts mapped by key for final generation
const osPrompts = {
  1: idealClientPrompt,
  2: messagePrompt,
  3: storyPrompt,
  4: offerPrompt,
  5: salesScriptsPrompt,
  6: leadMagnetPrompt,
  7: vslPrompt,
  8: emailsPrompt,
  9: facebookAdsPrompt,
  10: funnelCopyPrompt,
  11: contentIdeasPrompt,
  12: program12MonthPrompt,
  13: youtubeShowPrompt,
  14: contentPillarsPrompt,
  15: bioPrompt,
  16: appointmentRemindersPrompt
};

// CORRECTED: Map each step to what content CAN be properly generated with available data
// Step preview generates content relevant to data gathered SO FAR

// Helper function to safely stringify values for prompts
const safeStringify = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const STEP_TO_PREVIEW = {

  // Step 1: Industry
  1: {
    promptFn: (data) => `Based on this business industry/field:
    Industry: ${data.industry || 'not specified'}
    
    Create a brief Industry Analysis in JSON:
    {
      "industryAnalysis": {
        "industry": "The specific industry",
        "marketSize": "Estimated market size/demand",
        "uniqueAngle": "Potential unique positioning angle",
        "topCompetitors": ["Competitor 1", "Competitor 2"],
        "opportunityScore": "1-10 rating with brief explanation"
      }
    }`,
    name: "Industry Analysis"
  },

  // Step 2: Ideal Client
  2: {
    promptFn: (data) => `Based on this business info:
    Industry: ${safeStringify(data.industry) || 'not specified'}
    Ideal Client: ${safeStringify(data.idealClient) || 'not specified'}
    
    Create a Target Market Summary in JSON:
    {
      "targetMarket": {
        "primaryAudience": "Who exactly they serve",
        "demographics": "Key demographic traits",
        "psychographics": "Mindset, values, beliefs",
        "buyingPower": "Estimated investment capacity",
        "whereToFindThem": ["Platform 1", "Platform 2", "Platform 3"]
      }
    }`,
    name: "Target Market Summary"
  },

  // Step 3: Message
  3: {
    key: 2,
    name: "Core Message"
  },

  // Step 4: Core Problem - Generate Ideal Client Profile
  4: {
    key: 1,
    name: "Ideal Client Profile"
  },

  // Step 5: Outcomes
  5: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Client: ${safeStringify(data.idealClient)}
    Message: ${safeStringify(data.message)}
    Problem: ${safeStringify(data.coreProblem)}
    Outcomes: ${safeStringify(data.outcomes)}
    
    Create an Outcomes Framework in JSON:
    {
      "outcomesFramework": {
        "primaryOutcome": "Main result achieved",
        "secondaryOutcomes": ["Outcome 2", "Outcome 3"],
        "timeframe": "Expected timeline",
        "proofPoints": ["How to measure success"]
      }
    }`,
    name: "Outcomes Framework"
  },

  // Step 6: Unique Advantage
  6: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Client: ${safeStringify(data.idealClient)}
    Problem: ${safeStringify(data.coreProblem)}
    Unique Advantage: ${safeStringify(data.uniqueAdvantage)}
    
    Create a Unique Positioning Analysis in JSON:
    {
      "uniquePositioning": {
        "uniqueMechanism": "What makes them different",
        "competitiveAdvantage": "Why clients choose them",
        "positioning": "Market position statement"
      }
    }`,
    name: "Unique Positioning"
  },

  // Step 7: Story - Generate Signature Story
  7: {
    key: 3,
    name: "Signature Story"
  },

  // Step 8: Testimonials
  8: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Client: ${safeStringify(data.idealClient)}
    Outcomes: ${safeStringify(data.outcomes)}
    Testimonials: ${safeStringify(data.testimonials)}
    
    Create a Social Proof Strategy in JSON:
    {
      "socialProof": {
        "caseStudyIdeas": ["Case study 1", "Case study 2"],
        "testimonialFramework": "How to collect testimonials",
        "proofElements": ["Proof element 1", "Proof element 2"]
      }
    }`,
    name: "Social Proof Strategy"
  },

  // Step 9: Offer/Program
  9: {
    key: 4,
    name: "8-Week Program Preview"
  },

  // Step 10: Deliverables
  10: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Offer: ${safeStringify(data.offerProgram)}
    Deliverables: ${safeStringify(data.deliverables)}
    
    Create a Deliverables Structure in JSON:
    {
      "deliverablesStructure": {
        "coreDeliverables": ["Deliverable 1", "Deliverable 2"],
        "bonuses": ["Bonus 1", "Bonus 2"],
        "supportStructure": "How support is provided"
      }
    }`,
    name: "Deliverables Structure"
  },

  // Step 11: Pricing
  11: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Outcomes: ${safeStringify(data.outcomes)}
    Offer: ${safeStringify(data.offerProgram)}
    Pricing: ${safeStringify(data.pricing)}
    
    Create a Pricing Strategy in JSON:
    {
      "pricingStrategy": {
        "recommendedPrice": "Optimal price with justification",
        "valueStack": ["Value item 1", "Value item 2"],
        "pricingTiers": {
          "basic": { "price": "$X", "includes": ["..."] },
          "premium": { "price": "$Y", "includes": ["..."] }
        },
        "paymentOptions": ["Full pay", "Payment plan"]
      }
    }`,
    name: "Pricing Strategy"
  },

  // Step 12: Assets
  12: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Current Assets: ${safeStringify(data.assets)}
    
    Create a Marketing Assets Gap Analysis in JSON:
    {
      "assetsAnalysis": {
        "existingAssets": ["Asset 1", "Asset 2"],
        "missingAssets": ["Missing 1", "Missing 2"],
        "priorityOrder": ["Priority 1", "Priority 2"]
      }
    }`,
    name: "Assets Gap Analysis"
  },

  // Step 13: Revenue
  13: {
    promptFn: (data) => `Based on this business stage:
    Industry: ${safeStringify(data.industry)}
    Revenue: ${safeStringify(data.revenue)}
    
    Create a Growth Strategy in JSON:
    {
      "growthStrategy": {
        "currentStage": "Business stage",
        "nextMilestone": "Next revenue goal",
        "strategies": ["Strategy 1", "Strategy 2"]
      }
    }`,
    name: "Growth Strategy"
  },

  // Step 14: Brand Voice
  14: {
    promptFn: (data) => `Based on this brand:
    Industry: ${safeStringify(data.industry)}
    Brand Voice: ${safeStringify(data.brandVoice)}
    
    Create a Brand Voice Guide in JSON:
    {
      "brandVoice": {
        "tone": "Voice description",
        "doSay": ["Phrase 1", "Phrase 2"],
        "dontSay": ["Avoid 1", "Avoid 2"],
        "exampleHeadlines": ["Headline 1", "Headline 2"]
      }
    }`,
    name: "Brand Voice Guide"
  },

  // Step 15: Brand Colors
  15: {
    promptFn: (data) => `Based on this brand:
    Industry: ${safeStringify(data.industry)}
    Brand Colors: ${safeStringify(data.brandColors)}
    
    Create a Visual Style Guide in JSON:
    {
      "visualStyle": {
        "primaryColors": ["Color 1", "Color 2"],
        "accentColors": ["Accent 1"],
        "mood": "Visual mood description",
        "styleNotes": "Additional style guidance"
      }
    }`,
    name: "Visual Style Guide"
  },

  // Step 16: Call to Action
  16: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Offer: ${safeStringify(data.offerProgram)}
    CTA: ${safeStringify(data.callToAction)}
    
    Create CTA Variations in JSON:
    {
      "ctaVariations": {
        "primaryCTA": "Main call to action",
        "alternatives": ["CTA 2", "CTA 3"],
        "urgencyElements": ["Urgency 1", "Urgency 2"]
      }
    }`,
    name: "CTA Variations"
  },

  // Step 17: Platforms
  17: {
    key: 9,
    name: "Facebook Ads Preview"
  },

  // Step 18: 90-Day Goal
  18: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    90-Day Goal: ${safeStringify(data.goal90Days)}
    
    Create a 90-Day Action Plan in JSON:
    {
      "actionPlan": {
        "mainGoal": "Primary objective",
        "milestones": ["Week 4 milestone", "Week 8 milestone", "Week 12 milestone"],
        "dailyActions": ["Action 1", "Action 2"],
        "metrics": ["Metric to track 1", "Metric to track 2"]
      }
    }`,
    name: "90-Day Action Plan"
  },

  // Step 19: Business Stage
  19: {
    promptFn: (data) => `Based on this business:
    Industry: ${safeStringify(data.industry)}
    Business Stage: ${safeStringify(data.businessStage)}
    Revenue: ${safeStringify(data.revenue)}
    
    Create Stage-Specific Recommendations in JSON:
    {
      "stageRecommendations": {
        "currentStage": "Stage name",
        "priorities": ["Priority 1", "Priority 2"],
        "avoid": ["Thing to avoid 1"],
        "focusAreas": ["Focus 1", "Focus 2"]
      }
    }`,
    name: "Stage Recommendations"
  },

  // Step 20: All data available - final generation happens via 'all'
  20: null
};

// Content titles for display
const CONTENT_NAMES = {
  1: 'Ideal Client Profile',
  2: 'Million-Dollar Message',
  3: 'Signature Story',
  4: '8-Week Program',
  5: 'Sales Scripts',
  6: 'Lead Magnets',
  7: 'VSL Script',
  8: 'Email Sequence',
  9: 'Facebook Ads',
  10: 'Funnel Copy',
  11: 'Content Ideas',
  12: '12-Month Program',
  13: 'YouTube Show',
  14: 'Content Pillars'
};

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = { id: userId };

    const { step, data, completedSteps } = await req.json();

    // Handle preview mode - generate content based on completed steps
    if (step === 'preview') {
      const stepsCompleted = completedSteps || 1;
      const previewConfig = STEP_TO_PREVIEW[stepsCompleted];

      // No preview for step 12 (full generation happens)
      if (!previewConfig) {
        return NextResponse.json({
          result: {
            preview: {
              title: "Ready for Full Generation",
              message: "All questions answered! Click 'Generate All Content' to create your complete marketing system.",
              unlocked: false
            }
          }
        });
      }

      try {
        let prompt;
        let systemPrompt = "You are an elite business growth strategist and expert copywriter. Your goal is to generate HIGHLY SPECIFIC, ACTIONABLE, and UNIQUE marketing assets. Avoid generic advice. Return strictly valid JSON.";

        // Check if this step has a custom prompt function or uses a preset prompt
        if (previewConfig.promptFn) {
          prompt = previewConfig.promptFn(data);
        } else if (previewConfig.key && osPrompts[previewConfig.key]) {
          prompt = osPrompts[previewConfig.key](data);
        } else {
          return NextResponse.json({
            result: {
              preview: {
                title: "Preview Unavailable",
                message: "Continue to unlock content generation.",
                unlocked: false
              }
            }
          });
        }

        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          max_tokens: 1500,
        });

        const result = JSON.parse(completion.choices[0].message.content);
        return NextResponse.json({
          result: {
            title: previewConfig.name,
            content: result,
            stepsCompleted: stepsCompleted,
            unlocked: true
          }
        });
      } catch (err) {
        console.error('Preview generation error:', err);
        return NextResponse.json({
          result: {
            preview: {
              title: previewConfig.name,
              message: "Preview generation in progress...",
              unlocked: false
            }
          }
        });
      }
    }

    // Handle 'all' - generate all content at once for business growth
    if (step === 'all') {
      await supabaseAdmin
        .from('intake_answers')
        .insert({
          user_id: user.id,
          slide_id: 99,
          answers: data
        });

      // Generate all artifacts in parallel (all 14 prompts)
      const promptKeys = Object.keys(osPrompts).map(Number);
      const results = {};

      const promises = promptKeys.map(async (key) => {
        try {
          const prompt = osPrompts[key](data);
          const completion = await openai.chat.completions.create({
            messages: [
              {
                role: "system",
                content: "You are an elite business growth strategist and expert copywriter (performing at the level of world-class marketers). Your goal is to generate HIGHLY SPECIFIC, ACTIONABLE, and UNIQUE marketing assets that convert. Avoid generic, fluffy, or textbook advice. Your output must be ready to use immediately to generate revenue. Return strictly valid JSON."
              },
              { role: "user", content: prompt }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
          });

          return { key, result: JSON.parse(completion.choices[0].message.content), name: CONTENT_NAMES[key] };
        } catch (err) {
          console.error(`Error generating ${CONTENT_NAMES[key]}:`, err);
          return { key, result: null, name: CONTENT_NAMES[key] };
        }
      });

      const allResults = await Promise.all(promises);
      allResults.forEach(({ key, result, name }) => {
        if (result) {
          results[key] = {
            name,
            data: result
          };
        }
      });

      await supabaseAdmin
        .from('slide_results')
        .insert({
          user_id: user.id,
          slide_id: 99,
          ai_output: results,
          approved: true
        });


      return NextResponse.json({ result: results });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
