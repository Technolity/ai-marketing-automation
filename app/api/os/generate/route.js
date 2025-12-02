import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { osPrompts } from '@/lib/osPrompts';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    // const supabase = createRouteHandlerClient({ cookies });

    try {
        // TEMPORARY: Bypass Auth for testing
        /*
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        */

        const { step, data } = await req.json();

        // TEMPORARY: Bypass DB Insert
        /*
        const { error: intakeError } = await supabase
          .from('intake_answers')
          .insert({
            user_id: session.user.id,
            slide_id: step,
            answers: data
          });
    
        if (intakeError) throw intakeError;
        */

        // 2. Generate AI Content
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

        // TEMPORARY: Bypass DB Insert
        /*
        const { error: resultError } = await supabase
          .from('slide_results')
          .insert({
            user_id: session.user.id,
            slide_id: step,
            ai_output: result,
            approved: false
          });
    
        if (resultError) throw resultError;
        */

        return NextResponse.json({ result });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
