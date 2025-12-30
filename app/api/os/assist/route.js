import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs';
import { generateWithProvider } from '@/lib/ai/sharedAiUtils';

// Note: Using generateWithProvider from sharedAiUtils for timeout handling and provider fallback

export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
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

        // Use shared AI utilities for timeout handling and provider fallback
        const response = await generateWithProvider(
            systemPrompt,
            "Generate 5 suggestions now.",
            { jsonMode: true, maxTokens: 1000 }
        );

        const result = JSON.parse(response);
        return NextResponse.json({ suggestions: result.suggestions });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
