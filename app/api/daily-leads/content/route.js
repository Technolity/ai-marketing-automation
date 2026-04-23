import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenAIClient } from '@/lib/ai/providerConfig';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { topics, vault_context: vaultCtx, day_offset = 0 } = body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'topics array is required.' }, { status: 400 });
    }

    const niche = vaultCtx?.niche || 'business coaching';
    const transformation = vaultCtx?.transformation || 'achieve their goals';
    const freeGiftName = vaultCtx?.freeGiftName || 'free guide';

    const openai = getOpenAIClient();

    // Process all topics in this batch in a single call for efficiency
    const topicList = topics
      .map((t, i) => `${i + 1}. ${t}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a social media copywriter. For each topic provided, return a JSON object with fields: ' +
            '"caption" (engaging post under 280 chars, include 2 relevant hashtags) and ' +
            '"imagePrompt" (a DALL-E image prompt for a marketing visual that represents this topic). ' +
            'Return a JSON array with one object per topic, in the same order as the input. ' +
            'No markdown, no extra keys.',
        },
        {
          role: 'user',
          content:
            `Niche: ${niche}. Core offer: ${transformation}. Free gift: "${freeGiftName}".\n\n` +
            `Generate caption + imagePrompt for each of these ${topics.length} topics:\n${topicList}`,
        },
      ],
      max_tokens: Math.min(4096, topics.length * 250),
      temperature: 0.78,
      response_format: { type: 'json_object' },
    });

    let items = [];
    try {
      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      // Model may return { items: [...] } or { results: [...] } or similar
      if (Array.isArray(parsed)) {
        items = parsed;
      } else {
        const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        items = arrKey ? parsed[arrKey] : [];
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 500 });
    }

    // Zip with input topics and assign day numbers
    const content = topics.map((topic, i) => ({
      day: day_offset + i + 1,
      topic,
      caption: items[i]?.caption || `Check out our latest on ${topic}. #${niche.replace(/\s+/g, '')} #marketing`,
      imagePrompt: items[i]?.imagePrompt || `Professional marketing visual for ${topic}, ${niche} aesthetic, dark premium background`,
      imageUrl: null,
      approved: false,
    }));

    return NextResponse.json({ content });
  } catch (err) {
    console.error('[DailyLeads Content POST]', err);
    return NextResponse.json({ error: 'Failed to generate content.' }, { status: 500 });
  }
}
