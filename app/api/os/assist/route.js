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

        const { fieldLabel, sectionTitle, userContext, userInput, fieldName } = await req.json();

        // Special handling for Brand Colors - convert color names to hex codes
        const isBrandColorsField = fieldName === 'brandColors' ||
                                   sectionTitle === 'Brand Colors' ||
                                   fieldLabel?.toLowerCase().includes('brand color');

        let systemPrompt;

        if (isBrandColorsField) {
            systemPrompt = `You are a brand design expert helping someone define their brand colors.

Current Task:
- Section: "${sectionTitle}"
- Field: "${fieldLabel}"
- User typed colors: "${userInput || 'none provided'}"

SPECIAL INSTRUCTIONS FOR BRAND COLORS:
1. Identify ALL color names mentioned by the user (e.g., "blue", "red", "gold", "navy")
2. Convert each color name to its appropriate HEX code
3. Provide 5 different variations that include the HEX codes
4. Use standard, professional hex codes for common colors:
   - Blue: #0066CC or #0070FF
   - Red: #FF0000 or #DC143C
   - Green: #00A550 or #228B22
   - Black: #000000
   - White: #FFFFFF
   - Gold: #FFD700 or #B8860B
   - Navy: #000080 or #001F3F
   - Purple: #9B59B6 or #6A0DAD
   - Orange: #FF6B35 or #FF8C00
   - Gray: #808080 or #555555
   - Pink: #FF69B4 or #FFC0CB
   - Yellow: #FFFF00 or #FFD700
   - Teal: #008080 or #20B2AA
   - Brown: #8B4513 or #A0522D

5. Each suggestion should list the colors with their hex codes
6. Format: "Color Name (#HEXCODE), Color Name (#HEXCODE)"

Example:
- User types: "blue and gold"
- Output suggestions:
  1. "Navy Blue (#000080), Gold (#FFD700)"
  2. "Sky Blue (#0070FF), Metallic Gold (#B8860B)"
  3. "Royal Blue (#0066CC), Bright Gold (#FFD700)"
  etc.

Return ONLY valid JSON in this format:
{
  "suggestions": [
    "First color combination with hex codes",
    "Second color combination with hex codes",
    "Third color combination with hex codes",
    "Fourth color combination with hex codes",
    "Fifth color combination with hex codes"
  ]
}`;
        } else {
            systemPrompt = `You are a marketing expert helping someone fill out their business profile.

Current Task:
- Section: "${sectionTitle}"
- Field: "${fieldLabel}"
- User typed: "${userInput || 'none provided'}"

${userContext && Object.keys(userContext).length > 0 ? `Background context (use only if relevant): ${JSON.stringify(userContext)}` : ''}

CRITICAL RULES:
1. Your PRIMARY focus is on what the user ACTUALLY TYPED: "${userInput}"
2. Take their exact keywords, phrases, and ideas and polish them into 5 complete, professional versions
3. DO NOT invent new topics or concepts they didn't mention
4. DO NOT add irrelevant information from their previous answers unless it directly relates to what they typed
5. STAY ON TOPIC - if they wrote "software solutions", all 5 suggestions should be about software solutions

Generate exactly 5 different polished versions that:
- Keep the core idea from their input
- Expand and enhance what THEY wrote (not what you think they meant)
- Make it more professional and compelling
- Each offer a slightly different angle or phrasing
- Are complete, ready-to-use answers

Example:
- If they type "software solutions", give 5 variations about software solutions
- If they type "coaching for busy moms", give 5 variations about coaching for busy moms
- If they type "I help people lose weight", give 5 variations about helping people lose weight

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
        }

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
