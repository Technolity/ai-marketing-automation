import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { osPrompts } from '@/lib/osPrompts';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // Get token from Authorization header
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step, data } = await req.json();

    // Save inputs to intake_answers
    const { error: intakeError } = await supabaseAdmin
      .from('intake_answers')
      .insert({
        user_id: user.id,
        slide_id: step,
        answers: data
      });

    if (intakeError) {
      console.error("Intake Error:", intakeError);
    }

    // Generate AI Content
    const prompt = osPrompts[step](data);

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a world-class marketing expert. Return strictly valid JSON." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4-1106-preview",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Save result to slide_results
    const { error: resultError } = await supabaseAdmin
      .from('slide_results')
      .insert({
        user_id: user.id,
        slide_id: step,
        ai_output: result,
        approved: false
      });

    if (resultError) throw resultError;

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
