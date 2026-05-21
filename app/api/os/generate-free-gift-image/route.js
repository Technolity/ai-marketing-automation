import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

async function fetchLeadMagnetFields(funnelId) {
  const { data } = await supabaseAdmin
    .from('vault_content')
    .select('content')
    .eq('funnel_id', funnelId)
    .eq('section_id', 'leadMagnet')
    .eq('is_current_version', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lm = data?.content?.leadMagnet || data?.content;
  const concept = lm?.concept || {};
  const landing = lm?.landingPageCopy || {};
  return {
    name: concept?.title || lm?.title || landing?.headline || '',
    subtitle: concept?.subtitle || landing?.subheadline || '',
  };
}

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

function createProviderError(provider, status, message, extra = {}) {
  const error = new Error(message);
  error.provider = provider;
  error.status = status;
  Object.assign(error, extra);
  return error;
}

// ─── Gemini image generation (same pattern as daily-leads/generate) ───────────

async function generateWithGemini(prompt, referenceImages = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const parts = [{ text: prompt }];
  for (const img of referenceImages) {
    if (img?.base64 && img?.mimeType) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts }],
      }),
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.error?.message || `Gemini image request failed with status ${response.status}`;
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterMatch = message.match(/Please retry in ([\d.]+)s/i);
    const retryAfterSeconds = retryAfterHeader
      ? Number(retryAfterHeader)
      : retryAfterMatch
      ? Math.ceil(Number(retryAfterMatch[1]))
      : null;

    throw createProviderError('gemini', response.status, message, {
      model: GEMINI_IMAGE_MODEL,
      retryAfterSeconds,
      quotaExceeded:
        response.status === 429 || /quota exceeded|rate limit|billing/i.test(message),
    });
  }

  const responseParts = payload?.candidates?.[0]?.content?.parts ?? [];
  for (const part of responseParts) {
    const base64 =
      part?.inlineData?.data || part?.inline_data?.data;
    const mimeType =
      part?.inlineData?.mimeType ||
      part?.inlineData?.mime_type ||
      part?.inline_data?.mimeType ||
      part?.inline_data?.mime_type;
    if (base64) return { buffer: Buffer.from(base64, 'base64'), mimeType: mimeType || 'image/png' };
  }

  const textOnly = responseParts
    .map(p => p?.text)
    .filter(Boolean)
    .join(' ')
    .trim();

  if (textOnly) throw new Error(`Gemini returned text instead of an image: ${textOnly}`);
  throw new Error('Gemini returned no image data');
}

// ─── Full book-cover prompt (mirrors buildNanoBananaPrompt from daily-leads) ──

function buildFreeGiftImagePrompt(freeGiftName, subtitle, styleTags = [], refImageLabels = [], accentColor = '#CC0000') {
  const styleSpec = styleTags.length > 0
    ? `Visual style modifiers to apply throughout: ${styleTags.join(', ')}.`
    : 'Visual style: dark premium editorial aesthetic.';

  const bgDescription = `Very dark near-black base (#0D0D0D) with a faint ${accentColor} warmth at the edges`;
  const spineDescription = `Right spine color: dark ${accentColor} at 30% opacity, just distinguishable from the cover`;

  return `A realistic 3D hardcover book mockup, ultra-realistic rendering, high detail, sharp focus, professional product mockup style. Aspect ratio 2:3 portrait.

ORIENTATION & CAMERA:
- Book standing upright, slightly angled to the right at 10–20 degrees
- Full front cover visible with the spine thickness clearly showing on the RIGHT side
- Perspective view — NOT flat. Camera positioned at eye level with a slight top-down tilt
- Centered framing: full book visible with small equal margins on all sides
- DO NOT crop the book, DO NOT show it floating in mid-air at a dramatic angle

SURFACE & BACKGROUND:
- Book sits on a dark surface with a soft drop shadow beneath it, creating a subtle grounded effect
- Background: smooth dark gradient from near-black to deep ${accentColor}, with soft ${accentColor} glow accents and faint diagonal light streaks
- No distracting elements — background is atmospheric only

LIGHTING:
- Cinematic directional lighting from upper-left
- Soft highlights along the top edge and right spine edge of the book
- Subtle reflections on the cover surface to emphasize depth and realism
- ${accentColor} colored rim light on the spine edge
- ${styleSpec}

CONTENT TO DISPLAY:

Top Badge: FREE GUIDE
Headline: ${freeGiftName.toUpperCase()}
${subtitle ? `Subheadline: ${subtitle}` : ''}

DESIGN RULES FOR THE TOP BADGE:
- Small thin-bordered rectangular label at the very top of the cover
- Text in white, all caps, small tracking

DESIGN RULES FOR THE HEADLINE:
- Break the headline across 2-3 lines naturally
- The single most powerful or emotional word/phrase goes on its own line in ${accentColor}
- All other headline text is white
- Font: extra-bold condensed, takes up the top 40–50% of the cover below the badge

${subtitle ? `DESIGN RULES FOR THE SUBHEADLINE:
- Displayed in the center zone in off-white/light gray
- Elegant smaller font beneath a thin glowing ${accentColor} horizontal divider line` : ''}

COLORS:
- Cover background: ${bgDescription}
- Primary accent: ${accentColor} — used for headline word, divider line, and edge glow
- ${spineDescription}
- Atmospheric glow: ${accentColor} radiating upward from the bottom center of the cover

FOREGROUND COMPOSITION ON THE COVER:
- A cinematic, photorealistic hero object or scene that directly represents "${freeGiftName}"
- High-end studio photography aesthetic with ${accentColor} accent lighting
- Object sits in the bottom 35% of the cover, leaving the upper portion clean for headline text
- All foreground elements cleanly arranged, balanced, and centered on the lower half
- Depth layering: foreground objects overlap slightly to create a 3D layered effect
- Objects realistically lit matching cover lighting — no flat or cartoon rendering

STYLE: Dark, cinematic, premium, high-contrast. Photorealistic 3D render. No flat design.${
    refImageLabels.length > 0
      ? `\n\nREFERENCE IMAGES ATTACHED — ${refImageLabels.length} image${refImageLabels.length > 1 ? 's are' : ' is'} provided alongside this prompt. Use them as specified:\n${refImageLabels.map((label, i) => `- Image ${i + 1}: ${label}`).join('\n')}`
      : ''
  }`;
}

// ─── POST — generate free gift cover image ────────────────────────────────────

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      funnel_id,
      style_tags,
      reference_images,
    } = body;

    let free_gift_name = body.free_gift_name || '';
    let free_gift_subtitle = body.free_gift_subtitle || '';

    if (!free_gift_name && funnel_id) {
      const lm = await fetchLeadMagnetFields(funnel_id);
      free_gift_name = lm.name;
      free_gift_subtitle = free_gift_subtitle || lm.subtitle;
    }

    if (!free_gift_name) {
      free_gift_name = 'Free Gift';
    }

    const refImages = Array.isArray(reference_images)
      ? reference_images.filter(img => img?.base64 && img?.mimeType)
      : [];

    const styleTags = Array.isArray(style_tags) && style_tags.length > 0 ? style_tags : [];
    const refImageLabels = refImages.map((img, i) =>
      `User-provided reference image ${i + 1} ("${img.name || 'image'}") — incorporate as described`
    );

    const prompt = buildFreeGiftImagePrompt(free_gift_name, free_gift_subtitle, styleTags, refImageLabels);

    // Generate image with Gemini
    const { buffer } = await generateWithGemini(prompt, refImages);

    // Upload to Supabase storage
    const filename = `${workspaceId}/free-gift-image-${Date.now()}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('daily-post-images')
      .upload(filename, buffer, { contentType: 'image/png', upsert: false });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('daily-post-images')
      .getPublicUrl(filename);

    return NextResponse.json({ image_url: urlData.publicUrl, success: true });
  } catch (err) {
    console.error('[GenerateFreeGiftImage]', err.message);

    if (err?.provider === 'gemini' && err?.quotaExceeded) {
      const retrySuffix = err.retryAfterSeconds
        ? ` Retry after about ${err.retryAfterSeconds}s.`
        : '';
      return NextResponse.json(
        {
          error:
            'Gemini image generation is unavailable right now. ' +
            'Enable billing or image quota on the linked Google project.' +
            retrySuffix,
          code: 'gemini_quota_exceeded',
          retry_after_seconds: err.retryAfterSeconds ?? null,
        },
        { status: err.status || 429 }
      );
    }

    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
  }
}
