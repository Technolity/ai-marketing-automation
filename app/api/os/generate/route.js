import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

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

// All prompts mapped by key for generation
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
};

// Map steps to prompts - for existing business clients looking to grow
const STEP_TO_PROMPT = {
  1: { key: 1, name: "Ideal Client Profile" },
  2: { key: 2, name: "Million-Dollar Message" },
  3: { key: 3, name: "Signature Story" },
  4: { key: 4, name: "8-Week Program Design" },
  5: { key: 5, name: "Sales Scripts" },
  6: { key: 6, name: "Lead Magnet Ideas" },
  7: { key: 7, name: "VSL Script" },
  8: { key: 8, name: "Email Sequence" },
  9: { key: 9, name: "Facebook Ads" },
  10: { key: 10, name: "Funnel Copy" },
  11: { key: 11, name: "Content Ideas" },
  12: { key: 12, name: "12-Month Program" }
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
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step, data, completedSteps } = await req.json();

    // Handle preview mode - generate content based on what user just answered
    if (step === 'preview') {
      const stepsCompleted = completedSteps || 1;
      const previewInfo = STEP_TO_PROMPT[stepsCompleted];

      if (!previewInfo || !osPrompts[previewInfo.key]) {
        return NextResponse.json({
          result: {
            preview: {
              title: "Content Preview",
              message: "Answer more questions to unlock content generation.",
              unlocked: false
            }
          }
        });
      }

      try {
        const prompt = osPrompts[previewInfo.key](data);

        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a world-class business growth strategist helping established businesses scale. Return strictly valid JSON. This is a preview so keep responses concise but valuable."
            },
            { role: "user", content: prompt }
          ],
          model: "gpt-4-turbo-preview",
          response_format: { type: "json_object" },
          max_tokens: 1500,
        });

        const result = JSON.parse(completion.choices[0].message.content);
        return NextResponse.json({
          result: {
            title: previewInfo.name,
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
              title: previewInfo.name,
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
                content: "You are a world-class business growth strategist and marketing expert. You help established business owners scale their products and services. Return strictly valid JSON with detailed, actionable content."
              },
              { role: "user", content: prompt }
            ],
            model: "gpt-4-turbo-preview",
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
          approved: false
        });

      return NextResponse.json({ result: results });
    }

    // Handle individual step generation
    await supabaseAdmin
      .from('intake_answers')
      .insert({
        user_id: user.id,
        slide_id: step,
        answers: data
      });

    const prompt = osPrompts[step](data);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a world-class business growth strategist helping established businesses scale. Return strictly valid JSON with detailed, actionable content."
        },
        { role: "user", content: prompt }
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    await supabaseAdmin
      .from('slide_results')
      .insert({
        user_id: user.id,
        slide_id: step,
        ai_output: result,
        approved: false
      });

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
