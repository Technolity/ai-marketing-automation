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
    const { vault_context: vaultCtx } = body;

    if (!vaultCtx) {
      return NextResponse.json({ error: 'vault_context is required.' }, { status: 400 });
    }

    const niche = vaultCtx.niche || 'business coaching';
    const transformation = vaultCtx.transformation || 'achieve their goals';
    const freeGiftName = vaultCtx.freeGiftName || 'free guide';

    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a social media content strategist. Generate 30 unique, engaging social media post topics for a monthly content calendar. ' +
            'Return ONLY a JSON array of 30 strings. No markdown, no numbering.',
        },
        {
          role: 'user',
          content:
            `Niche: ${niche}. Offer: ${transformation}. Free Gift: ${freeGiftName}. ` +
            'Create 30 varied topics covering: education, inspiration, proof, behind-the-scenes, FAQ, and calls-to-action. ' +
            'Each topic should be a short, punchy post idea (max 12 words). Mix the categories throughout.',
        },
      ],
      max_tokens: 1200,
      temperature: 0.85,
      response_format: { type: 'json_object' },
    });

    let topics = [];
    try {
      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      // The model may return { topics: [...] } or just an array at the root key
      if (Array.isArray(parsed)) {
        topics = parsed;
      } else {
        const firstKey = Object.keys(parsed)[0];
        topics = Array.isArray(parsed[firstKey]) ? parsed[firstKey] : [];
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 500 });
    }

    if (topics.length === 0) {
      return NextResponse.json({ error: 'AI returned no topics.' }, { status: 500 });
    }

    // Ensure exactly 30 (pad with generics if the model returned fewer)
    while (topics.length < 30) {
      topics.push(`${niche} tip #${topics.length + 1}`);
    }
    topics = topics.slice(0, 30).map(t => String(t).trim());

    return NextResponse.json({ topics });
  } catch (err) {
    console.error('[DailyLeads Topics POST]', err);
    return NextResponse.json({ error: 'Failed to generate topics.' }, { status: 500 });
  }
}
