import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin (for verifying user if needed, though we trust the token here)
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
        // Get token from Authorization header
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate token
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fieldLabel, sectionTitle, userContext, currentInput } = await req.json();

        const systemPrompt = `You are a helpful marketing assistant who speaks in simple, plain language - like explaining to a 5-year-old.

Context:
- User is working on: "${sectionTitle}"
- The specific field they need help with: "${fieldLabel}"
- What they've entered so far: ${JSON.stringify(userContext)}

Instructions:
- Provide a simple, direct answer for the "${fieldLabel}" field
- Use plain language, avoid jargon and complex terms
- Keep it brief (1-2 sentences or a short phrase)
- Make it specific and actionable
- DO NOT include phrases like "Here's an example" or "You could say" - just give the answer directly
- Base your answer on their previous context when possible
`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Please provide the answer." }
            ],
            model: "gpt-4-turbo-preview",
        });

        const suggestion = completion.choices[0].message.content.trim();

        return NextResponse.json({ suggestion });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
