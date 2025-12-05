import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

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

        const { fieldLabel, sectionTitle, userContext, userInput } = await req.json();

        const systemPrompt = `You are a marketing expert helping someone fill out their business profile.

Context:
- Section: "${sectionTitle}"
- Field: "${fieldLabel}"
- User's current input/keyword: "${userInput || 'none provided'}"
- Previous answers: ${JSON.stringify(userContext)}

Generate exactly 5 different polished, professional answers for this field.
Each answer should be:
1. Complete and ready to use
2. Specific and detailed (not generic)
3. Different in approach or angle from the others
4. Based on marketing best practices

If the user provided a keyword or partial input, use it as a starting point and expand on it.
If no input provided, infer from their previous answers.

Return ONLY valid JSON in this format:
{
  "suggestions": [
    "First polished answer here",
    "Second polished answer here",
    "Third polished answer here",
    "Fourth polished answer here",
    "Fifth polished answer here"
  ]
}`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate 5 suggestions now." }
            ],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content);
        return NextResponse.json({ suggestions: result.suggestions });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

