import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { auth } from '@clerk/nextjs';

// Import multi-provider AI config
import { getAvailableProvider, AI_PROVIDERS, getOpenAIClient, getClaudeClient, getGeminiClient } from '@/lib/ai/providerConfig';

// Import RAG retrieval helpers
import { getRelevantContext, injectContextIntoPrompt, getKnowledgeBaseStats } from '@/lib/rag/retrieve';

// Import JSON parser with error recovery
import { parseJsonSafe } from '@/lib/utils/jsonParser';

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
import { masterPrompt } from '@/lib/prompts/masterPrompt';

// Legacy OpenAI client (fallback)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Multi-provider AI generation with fallback
 * Tries providers in order: OpenAI -> Claude -> Gemini
 */
async function generateWithProvider(systemPrompt, userPrompt, options = {}) {
  const providers = ['OPENAI', 'CLAUDE', 'GEMINI'];
  let lastError = null;

  for (const providerKey of providers) {
    const config = AI_PROVIDERS[providerKey];

    // Skip if provider is not enabled or doesn't have an API key
    if (!config.enabled || !config.apiKey) {
      console.log(`[AI] Skipping ${providerKey}: enabled=${config.enabled}, hasKey=${!!config.apiKey}`);
      continue;
    }

    console.log(`[AI] Trying ${config.name} for generation...`);

    try {
      switch (providerKey) {
        case 'OPENAI': {
          const client = getOpenAIClient();
          const completion = await client.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            model: config.models.text,
            response_format: options.jsonMode ? { type: "json_object" } : undefined,
            max_tokens: options.maxTokens || 6000, // Increased from 1500 for large content structures
            temperature: options.temperature || 0.7,
          });
          console.log(`[AI] ${config.name} succeeded!`);
          return completion.choices[0].message.content;
        }

        case 'CLAUDE': {
          const client = getClaudeClient();
          const response = await client.messages.create({
            model: config.models.text,
            max_tokens: options.maxTokens || 6000, // Increased from 1500 for large content structures
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt + (options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : '') }],
            temperature: options.temperature || 0.7
          });
          console.log(`[AI] ${config.name} succeeded!`);
          return response.content[0].text;
        }

        case 'GEMINI': {
          const client = getGeminiClient();
          const model = client.getGenerativeModel({
            model: config.models.text,
            generationConfig: {
              temperature: options.temperature || 0.7,
              maxOutputTokens: options.maxTokens || 6000 // Increased from 1500 for large content structures
            }
          });
          const fullPrompt = `${systemPrompt}\n\n${userPrompt}${options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : ''}`;
          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          console.log(`[AI] ${config.name} succeeded!`);
          return response.text();
        }
      }
    } catch (error) {
      console.error(`[AI] ${config.name} failed:`, error.message);
      lastError = error;
      // Continue to next provider
    }
  }

  // All providers failed
  throw lastError || new Error('No AI providers available. Please configure at least one provider in .env.local');
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second

// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = MAX_RETRIES, retryDelay = RETRY_DELAY_MS) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on authentication errors or invalid requests
      if (error.status === 401 || error.status === 400) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

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

// Map content keys to RAG content types
const CONTENT_TYPE_MAP = {
  1: 'ideal-client',
  2: 'message',
  3: 'story',
  4: 'offer',
  5: 'sales-script',
  6: 'lead-magnet',
  7: 'vsl',
  8: 'email',
  9: 'facebook-ads',
  10: 'funnel-copy',
  11: 'lead-generation',
  12: 'offer',
  13: 'lead-generation',
  14: 'message',
  15: 'message',
  16: 'email'
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

  // Step 4: Core Problem - Generate Problem Analysis
  4: {
    promptFn: (data) => `Based on this business info:
    Industry: ${safeStringify(data.industry)}
    Client: ${safeStringify(data.idealClient)}
    Message: ${safeStringify(data.message)}
    Core Problem: ${safeStringify(data.coreProblem)}
    
    Create a Problem Analysis in JSON:
    {
      "problemAnalysis": {
        "primaryProblem": "Main problem the client faces",
        "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
        "consequences": "What happens if problem isn't solved",
        "emotionalImpact": "How this problem makes them feel",
        "problemAwareness": "How aware is the market of this problem"
      }
    }`,
    name: "Problem Analysis"
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
        // Check if RAG knowledge base is available
        const kbStats = await getKnowledgeBaseStats();
        const useRAG = kbStats.is_ready && kbStats.total_chunks > 0;

        console.log(`[RAG PREVIEW] Knowledge base status: ${useRAG ? 'ENABLED' : 'DISABLED'} (${kbStats.total_chunks} chunks)`);

        let prompt;
        let systemPrompt = "You are an elite business growth strategist and expert copywriter (performing at the level of world-class marketers like Ted McGrath). Your goal is to generate HIGHLY SPECIFIC, ACTIONABLE, and UNIQUE marketing assets that use proven frameworks and real-world strategies. Avoid generic advice. Return strictly valid JSON. CRITICAL: Your response must start with { and end with }. NO explanations, NO conversational text, NO markdown blocks, NO questions. ONLY the JSON object.";

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

        // RAG Enhancement: Get relevant context from Ted's knowledge base for preview
        if (useRAG && previewConfig.key && CONTENT_TYPE_MAP[previewConfig.key]) {
          try {
            const ragContext = await getRelevantContext(CONTENT_TYPE_MAP[previewConfig.key], data);
            if (ragContext && ragContext.hasContext) {
              prompt = injectContextIntoPrompt(prompt, ragContext);
              console.log(`[RAG PREVIEW] Enhanced preview with ${ragContext.sources?.length || 0} frameworks`);
            }
          } catch (ragError) {
            console.error(`[RAG PREVIEW] Failed to enhance preview:`, ragError.message);
            // Continue without RAG if it fails
          }
        }

        // Use multi-provider AI generation with fallback
        const rawContent = await generateWithProvider(systemPrompt, prompt, {
          jsonMode: true,
          maxTokens: 6000, // Increased from 1500 to handle large JSON structures like offer blueprints
          temperature: 0.7
        });

        // Use safe JSON parser with error recovery
        let result;
        try {
          result = parseJsonSafe(rawContent, {
            throwOnError: true,
            logErrors: true
          });
        } catch (parseError) {
          console.error('[Preview] JSON parsing failed:', parseError.message);
          console.error('[Preview] Raw content (first 1000 chars):', rawContent.substring(0, 1000));

          // If parsing fails, retry with a simpler prompt
          console.log('[Preview] Retrying with simplified prompt...');
          const retryContent = await generateWithProvider(
            "You are a business strategist. CRITICAL: Your ENTIRE response must be ONLY valid JSON. First character: { Last character: } NO explanations. NO markdown blocks. NO conversational text like 'I understand' or 'Here you go'. NO questions. JUST the JSON object. START NOW with {",
            prompt,
            { jsonMode: true, maxTokens: 4000, temperature: 0.5 }
          );

          result = parseJsonSafe(retryContent, {
            throwOnError: true,
            logErrors: true
          });
        }

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
        console.error('Error details:', err.message, err.stack);

        // Return the actual error to help debug
        return NextResponse.json({
          error: true,
          message: `Preview generation failed: ${err.message}`,
          details: err.stack?.substring(0, 500),
          result: {
            preview: {
              title: previewConfig.name,
              message: `Error: ${err.message}. Please check your API keys and try again.`,
              unlocked: false,
              error: true
            }
          }
        }, { status: 500 });
      }
    }

    // Handle 'fill-missing' - generate only specified missing sections
    if (step === 'fill-missing') {
      const { missingSections, existingContent } = await req.json().then(r => ({
        missingSections: r.missingSections || [],
        existingContent: r.existingContent || {},
        data: r.data
      })).catch(() => ({}));

      // Re-parse to get data
      const body = await req.clone().json();
      const userData = body.data || data;
      const sectionsToGenerate = body.missingSections || [];

      if (!sectionsToGenerate || sectionsToGenerate.length === 0) {
        return NextResponse.json({
          error: 'No missing sections specified',
          result: {}
        }, { status: 400 });
      }

      console.log(`[FILL-MISSING] Generating ${sectionsToGenerate.length} missing sections:`, sectionsToGenerate);

      // Check if RAG knowledge base is available
      const kbStats = await getKnowledgeBaseStats();
      const useRAG = kbStats.is_ready && kbStats.total_chunks > 0;

      const results = {};
      const successfulItems = [];
      const failedItems = [];

      // Generate only the missing sections
      const promises = sectionsToGenerate.map(async (key) => {
        const numKey = parseInt(key);
        if (!osPrompts[numKey]) {
          console.warn(`[FILL-MISSING] No prompt found for section ${numKey}`);
          return { key: numKey, success: false, error: 'No prompt available' };
        }

        try {
          let basePrompt = osPrompts[numKey](userData);

          // RAG Enhancement
          if (useRAG && CONTENT_TYPE_MAP[numKey]) {
            try {
              const ragContext = await getRelevantContext(CONTENT_TYPE_MAP[numKey], userData);
              if (ragContext && ragContext.hasContext) {
                basePrompt = injectContextIntoPrompt(basePrompt, ragContext);
                console.log(`[FILL-MISSING] Enhanced prompt ${numKey} with RAG`);
              }
            } catch (ragError) {
              console.error(`[FILL-MISSING] RAG failed for ${numKey}:`, ragError.message);
            }
          }

          // Generate content with retry
          const rawContent = await retryWithBackoff(async () => {
            return await generateWithProvider(
              "You are an elite business growth strategist and expert copywriter. Generate HIGHLY SPECIFIC, ACTIONABLE content. CRITICAL: Return ONLY valid JSON with properly escaped strings.",
              basePrompt,
              { jsonMode: true, maxTokens: 4000, temperature: 0.7 }
            );
          });

          const parsedResult = parseJsonSafe(rawContent, {
            throwOnError: false,
            logErrors: true,
            defaultValue: null
          });

          if (!parsedResult) {
            throw new Error(`Failed to parse JSON for section ${numKey}`);
          }

          return {
            key: numKey,
            result: parsedResult,
            name: CONTENT_NAMES[numKey] || `Section ${numKey}`,
            success: true
          };
        } catch (err) {
          console.error(`[FILL-MISSING] Error generating section ${numKey}:`, err.message);
          return {
            key: numKey,
            result: null,
            name: CONTENT_NAMES[numKey] || `Section ${numKey}`,
            success: false,
            error: err.message
          };
        }
      });

      const allResults = await Promise.all(promises);

      allResults.forEach(({ key, result, name, success, error }) => {
        if (success && result) {
          results[key] = {
            name,
            data: result
          };
          successfulItems.push(name);
        } else {
          failedItems.push({ name, key, error });
        }
      });

      console.log(`[FILL-MISSING] Completed: ${successfulItems.length}/${sectionsToGenerate.length} successful`);

      return NextResponse.json({
        result: results,
        metadata: {
          requested: sectionsToGenerate.length,
          successful: successfulItems.length,
          failed: failedItems.length,
          failedItems: failedItems.length > 0 ? failedItems : undefined
        }
      });
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

      // Check if RAG knowledge base is available
      const kbStats = await getKnowledgeBaseStats();
      const useRAG = kbStats.is_ready && kbStats.total_chunks > 0;

      console.log(`[RAG] Knowledge base status: ${useRAG ? 'ENABLED' : 'DISABLED'} (${kbStats.total_chunks} chunks)`);

      // Generate all artifacts in parallel (all 14 prompts)
      const promptKeys = Object.keys(osPrompts).map(Number);
      const results = {};

      const promises = promptKeys.map(async (key) => {
        try {
          let basePrompt = osPrompts[key](data);

          // RAG Enhancement: Get relevant context from Ted's knowledge base
          if (useRAG && CONTENT_TYPE_MAP[key]) {
            try {
              const ragContext = await getRelevantContext(CONTENT_TYPE_MAP[key], data);
              if (ragContext && ragContext.hasContext) {
                basePrompt = injectContextIntoPrompt(basePrompt, ragContext);
                console.log(`[RAG] Enhanced prompt ${key} (${CONTENT_TYPE_MAP[key]}) with ${ragContext.sources?.length || 0} frameworks`);
              }
            } catch (ragError) {
              console.error(`[RAG] Failed to enhance prompt ${key}:`, ragError.message);
              // Continue without RAG if it fails
            }
          }

          // Use multi-provider AI generation with retry logic
          // Email sequence needs more tokens due to 18 emails with full copy
          const isEmailSequence = key === 8 || CONTENT_NAMES[key] === 'Email Sequence';
          const tokenLimit = isEmailSequence ? 8000 : 4000;

          const rawContent = await retryWithBackoff(async () => {
            return await generateWithProvider(
              "You are an elite business growth strategist and expert copywriter (performing at the level of world-class marketers like Ted McGrath). Your goal is to generate HIGHLY SPECIFIC, ACTIONABLE, and UNIQUE marketing assets that convert. Avoid generic, fluffy, or textbook advice. Your output must be ready to use immediately to generate revenue. CRITICAL: Return ONLY valid JSON with properly escaped strings. Do not include newlines within string values - use \\n instead. Ensure all quotes within strings are escaped.",
              basePrompt,
              { jsonMode: true, maxTokens: tokenLimit, temperature: 0.7 }
            );
          });
          const parsedResult = parseJsonSafe(rawContent, {
            throwOnError: false,
            logErrors: true,
            defaultValue: null
          });

          if (!parsedResult) {
            throw new Error(`Failed to parse JSON for ${CONTENT_NAMES[key]}`);
          }

          return {
            key,
            result: parsedResult,
            name: CONTENT_NAMES[key],
            success: true,
            error: null
          };
        } catch (err) {
          console.error(`Error generating ${CONTENT_NAMES[key]} after ${MAX_RETRIES} attempts:`, err);
          return {
            key,
            result: null,
            name: CONTENT_NAMES[key],
            success: false,
            error: err.message
          };
        }
      });

      const allResults = await Promise.all(promises);

      // Track successful and failed generations
      const successfulItems = [];
      const failedItems = [];

      allResults.forEach(({ key, result, name, success, error }) => {
        if (success && result) {
          results[key] = {
            name,
            data: result
          };
          successfulItems.push(name);
        } else {
          failedItems.push({ name, error });
        }
      });

      // Save results even if some items failed (partial save)
      const totalItems = allResults.length;
      const successCount = successfulItems.length;
      const failCount = failedItems.length;

      console.log(`[GENERATION PHASE 1] Completed: ${successCount}/${totalItems} individual sections successful, ${failCount} failed`);

      if (failedItems.length > 0) {
        console.log('[GENERATION PHASE 1] Failed items:', failedItems.map(f => f.name).join(', '));
      }

      // PHASE 2: Master Aggregation and Polishing
      // Generate comprehensive final marketing system using master prompt
      let masterSystem = null;

      if (successCount >= 10) { // Only run master prompt if we have at least 10 sections
        try {
          console.log('[GENERATION PHASE 2] Starting master aggregation...');

          // Get RAG context for master prompt (general business strategy context)
          let masterRagContext = null;
          if (useRAG) {
            try {
              masterRagContext = await getRelevantContext('master-strategy', data);
              if (masterRagContext && masterRagContext.hasContext) {
                console.log(`[GENERATION PHASE 2] Enhanced master prompt with ${masterRagContext.sources?.length || 0} frameworks`);
              }
            } catch (ragError) {
              console.error(`[GENERATION PHASE 2] Failed to enhance master prompt:`, ragError.message);
            }
          }

          // Generate master prompt with all individual sections
          const masterPromptText = masterPrompt(data, results, masterRagContext);

          // Generate master marketing system using multi-provider
          const masterRawContent = await retryWithBackoff(async () => {
            return await generateWithProvider(
              "You are Ted McGrath, an elite business growth strategist and master synthesizer. You take individual marketing components and create comprehensive, cohesive marketing systems that are greater than the sum of their parts. You ensure every element works together perfectly and is grounded in proven frameworks. CRITICAL: Return ONLY valid JSON with properly escaped strings. Do not include newlines within string values - use \\n instead. Ensure all quotes within strings are escaped.",
              masterPromptText,
              { jsonMode: true, maxTokens: 4000, temperature: 0.7 }
            );
          });
          masterSystem = parseJsonSafe(masterRawContent, {
            throwOnError: false,
            logErrors: true,
            defaultValue: null
          });

          if (masterSystem) {
            console.log('[GENERATION PHASE 2] Master marketing system generated successfully');
          } else {
            console.error('[GENERATION PHASE 2] Failed to parse master system JSON');
            throw new Error('Master system JSON parsing failed');
          }

          // Add master system to results
          results['master'] = {
            name: 'Complete Marketing System',
            data: masterSystem
          };

        } catch (masterError) {
          console.error('[GENERATION PHASE 2] Master aggregation failed:', masterError.message);
          // Continue without master system if it fails - individual sections still available
        }
      } else {
        console.log('[GENERATION PHASE 2] Skipped - not enough successful sections for master aggregation');
      }

      // Save successful results to database (including master system if generated)
      if (successCount > 0) {
        await supabaseAdmin
          .from('slide_results')
          .insert({
            user_id: user.id,
            slide_id: 99,
            ai_output: results,
            approved: true
          });
      }

      // Return results with metadata about success/failure
      return NextResponse.json({
        result: results,
        metadata: {
          total: totalItems,
          successful: successCount,
          failed: failCount,
          failedItems: failedItems.length > 0 ? failedItems : undefined,
          partialSave: failCount > 0 && successCount > 0,
          hasMasterSystem: masterSystem !== null,
          phase1Complete: true,
          phase2Complete: masterSystem !== null
        }
      });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
