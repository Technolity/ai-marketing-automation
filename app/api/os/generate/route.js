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
  14: contentPillarsPrompt
  // 15: customPrompt // To add custom prompts: 1. Import above, 2. Add here with next ID, 3. Add to CONTENT_NAMES below
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

  // Step 1: Only know niche/topic
  1: {
    promptFn: (data) => `Based on this business niche/topic:
    Topic: ${data.topicArea || 'not specified'}
    
    Create a brief Niche Positioning analysis in JSON:
    {
      "nichePositioning": {
        "niche": "The specific niche",
        "marketSize": "Estimated market size/demand",
        "uniqueAngle": "Potential unique positioning angle",
        "topCompetitors": ["Competitor 1", "Competitor 2"],
        "opportunityScore": "1-10 rating with brief explanation"
      }
    }`,
    name: "Niche Positioning"
  },

  // Step 2: Know niche + ideal client description
  2: {
    promptFn: (data) => `Based on this business info:
    Topic: ${safeStringify(data.topicArea) || 'not specified'}
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

  // Step 3: NOW have pain points! Generate Ideal Client Profile
  3: {
    key: 1,
    name: "Ideal Client Profile"
  },

  // Step 4: Have transformation - Generate Million Dollar Message
  4: {
    key: 2,
    name: "Million-Dollar Message"
  },

  // Step 5: Have unique mechanism - Generate 8-Week Program outline
  5: {
    key: 4,
    name: "8-Week Program Preview"
  },

  // Step 6: Have story - Generate Signature Story
  6: {
    key: 3,
    name: "Signature Story"
  },

  // Step 7: Have outcomes - Generate Sales Scripts preview
  7: {
    promptFn: (data) => `Based on this coaching/consulting business:
    Topic: ${safeStringify(data.topicArea)}
    Client: ${safeStringify(data.idealClient)}
    Problem: ${safeStringify(data.problem)}
    Transformation: ${safeStringify(data.transformation)}
    Unique Mechanism: ${safeStringify(data.uniqueMechanism)}
    Main Outcome: ${safeStringify(data.mainOutcome)}
    
    Create a Sales Framework Preview in JSON:
    {
      "salesFramework": {
        "openingHook": "Attention-grabbing opener",
        "buildRapport": "Questions to build connection",
        "uncoverPain": "Questions to reveal pain points",
        "presentSolution": "How to position your offer",
        "handleObjections": ["Objection 1 -> Response", "Objection 2 -> Response"],
        "closeStrong": "Closing technique"
      }
    }`,
    name: "Sales Framework Preview"
  },

  // Step 8: Have pricing - Generate Offer Pricing Strategy
  8: {
    promptFn: (data) => `Based on this coaching/consulting business:
    Topic: ${safeStringify(data.topicArea)}
    Transformation: ${safeStringify(data.transformation)}
    Main Outcome: ${safeStringify(data.mainOutcome)}
    Price Point: ${safeStringify(data.pricing)}
    
    Create an Offer Pricing Strategy in JSON:
    {
      "pricingStrategy": {
        "recommendedPrice": "Optimal price with justification",
        "valueStack": ["Value item 1", "Value item 2", "Value item 3"],
        "pricingTiers": {
          "basic": { "price": "$X", "includes": ["..."] },
          "premium": { "price": "$Y", "includes": ["..."] },
          "vip": { "price": "$Z", "includes": ["..."] }
        },
        "guaranteeType": "Risk reversal strategy",
        "paymentOptions": ["Full pay", "Payment plan option"]
      }
    }`,
    name: "Offer Pricing Strategy"
  },

  // Step 9: Have communication style - Generate Lead Magnet Ideas
  9: {
    key: 6,
    name: "Lead Magnet Ideas"
  },

  // Step 10: Have platforms - Generate Ads Preview
  10: {
    key: 9,
    name: "Facebook Ads Preview"
  },

  // Step 11: Have dream client - Generate Email Preview
  11: {
    promptFn: (data) => `Based on this business:
    Topic: ${safeStringify(data.topicArea)}
    Client: ${safeStringify(data.idealClient)}
    Dream Client: ${safeStringify(data.dreamClient)}
    Problem: ${safeStringify(data.problem)}
    Transformation: ${safeStringify(data.transformation)}
    
    Create a 3-Email Preview Sequence in JSON:
    {
      "emailPreview": {
        "email1": {
          "subject": "Subject line",
          "hook": "Opening hook",
          "mainPoint": "Core message",
          "cta": "Call to action"
        },
        "email2": {
          "subject": "Subject line",
          "hook": "Opening hook", 
          "mainPoint": "Core message",
          "cta": "Call to action"
        },
        "email3": {
          "subject": "Subject line",
          "hook": "Opening hook",
          "mainPoint": "Core message",
          "cta": "Call to action"
        }
      }
    }`,
    name: "Email Sequence Preview"
  },

  // Step 12: All data available - final generation happens via 'all'
  12: null
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
