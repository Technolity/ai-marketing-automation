import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getOpenAIClient, getGeminiClient } from '@/lib/ai/providerConfig';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import sharp from 'sharp';

const DAILY_LIMIT = 10;
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extensionForMimeType(mimeType = 'image/png') {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

function createProviderError(provider, status, message, extra = {}) {
  const error = new Error(message);
  error.provider = provider;
  error.status = status;
  Object.assign(error, extra);
  return error;
}

async function getOrCreateQuota(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabaseAdmin
    .from('post_generations_quota')
    .select('generation_count')
    .eq('user_id', userId)
    .eq('quota_date', today)
    .maybeSingle();

  if (error) throw error;
  return { count: data?.generation_count ?? 0, today };
}

async function getVaultContext(userId, funnelId = null) {
  const sectionQuery = sectionId => {
    let query = supabaseAdmin
      .from('vault_content')
      .select('content, funnel_id, user_id')
      .eq('section_id', sectionId)
      .eq('is_current_version', true);

    if (funnelId) {
      query = query.eq('funnel_id', funnelId);
    } else {
      query = query.eq('user_id', userId);
    }

    return query
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  };

  const [leadMagnetResult, idealClientResult, messageResult, mediaResult, colorsResult] = await Promise.all([
    sectionQuery('leadMagnet'),
    sectionQuery('idealClient'),
    sectionQuery('message'),
    sectionQuery('media'),
    sectionQuery('colors'),
  ]);

  const leadMagnet = leadMagnetResult.data?.content;
  const idealClient = idealClientResult.data?.content;
  const message = messageResult.data?.content;
  const media = mediaResult.data?.content;
  const colors = colorsResult.data?.content;

  const freeGiftName =
    leadMagnet?.leadMagnet?.concept?.title ||
    leadMagnet?.leadMagnet?.titleAndHook?.mainTitle ||
    leadMagnet?.titleAndHook?.mainTitle ||
    null;

  if (!freeGiftName) return null;

  const resolvedFunnelId =
    funnelId ||
    leadMagnetResult.data?.funnel_id ||
    idealClientResult.data?.funnel_id ||
    messageResult.data?.funnel_id ||
    null;

  const vaultOwnerId =
    leadMagnetResult.data?.user_id ||
    idealClientResult.data?.user_id ||
    messageResult.data?.user_id ||
    userId;

  const bestIdealClient =
    idealClient?.bestIdealClient ||
    idealClient?.idealClientSnapshot?.bestIdealClient ||
    idealClient?.idealClient?.idealClientSnapshot?.bestIdealClient;

  const niche = bestIdealClient?.roleIdentity || bestIdealClient?.ageLifeStage || null;

  const transformation =
    typeof message?.oneLineMessage === 'string'
      ? message.oneLineMessage
      : message?.message?.oneLineMessage || null;

  // Media assets from vault
  const productImageUrl =
    media?.product_image_url ||
    media?.product_mockup?.product_image_url ||
    null;
  const logoUrl =
    media?.logo_url ||
    media?.logo?.logo_url ||
    null;
  const authorPhotoUrl =
    media?.author_photo_url ||
    media?.bio_author?.author_photo_url ||
    null;

  // Brand colors from vault
  const colorPalette = colors?.colorPalette || null;
  const brandAccent = colorPalette?.primary || null;
  const brandSecondary = colorPalette?.secondary || null;

  // Funnel name
  let funnelName = null;
  if (resolvedFunnelId) {
    const { data: funnelData } = await supabaseAdmin
      .from('user_funnels')
      .select('funnel_name')
      .eq('id', resolvedFunnelId)
      .maybeSingle();
    funnelName = funnelData?.funnel_name || null;
  }

  return {
    funnelId: resolvedFunnelId,
    vaultOwnerId,
    freeGiftName,
    niche,
    transformation,
    productImageUrl,
    logoUrl,
    authorPhotoUrl,
    brandAccent,
    brandSecondary,
    funnelName,
  };
}

function resolveStyleTheme(niche = '') {
  const n = niche.toLowerCase();
  if (n.includes('finance') || n.includes('wealth') || n.includes('invest') || n.includes('money'))
    return 'deep blue and gold';
  if (n.includes('health') || n.includes('fitness') || n.includes('wellness') || n.includes('coach'))
    return 'black and electric orange';
  if (n.includes('tech') || n.includes('ai') || n.includes('software') || n.includes('saas'))
    return 'midnight blue and cyan';
  if (n.includes('real estate') || n.includes('property'))
    return 'charcoal and gold';
  return 'deep red and black';
}

// ─── Pipeline Step 1: Generate structured copy ────────────────────────────────
// Returns: { headline, subheadline, cta, badge, background_prompt }

async function generateCopy(openai, ctx, postType, userDescription) {
  const gift = ctx?.freeGiftName || 'Free Guide';
  const niche = ctx?.niche || 'business coaching';
  const transformation = ctx?.transformation || 'achieve their goals';
  const isGift = postType === 'free_gift';

  const userPrompt = isGift
    ? `Generate social media ad image overlay text for a FREE digital product.
Product name: "${gift}"
Audience niche: ${niche}
Core transformation: ${transformation}
${userDescription ? `Creative direction from user: ${userDescription}` : ''}

Return JSON only, no markdown:
{
  "headline": "ALL CAPS headline, 4-7 words, bold and benefit-driven",
  "subheadline": "One clear benefit sentence, 10-15 words, title case",
  "cta": "Action CTA phrase, 2-4 words, ALL CAPS",
  "badge": "1-2 words ALL CAPS label (e.g. FREE, NEW, LIVE)",
  "background_prompt": "Detailed description for an AI image generator to create a PURE VISUAL background. Must describe only abstract shapes, environments, lighting, textures. Absolutely ZERO text, ZERO words, ZERO letters, ZERO numbers anywhere in the image. The background should match the ${niche} niche aesthetic with cinematic lighting and premium feel."
}`
    : `Generate social media post image overlay text.
Niche: ${niche}
Core message: ${transformation}
${userDescription ? `Direction: ${userDescription}` : ''}

Return JSON only, no markdown:
{
  "headline": "ALL CAPS headline, 4-7 words, aspirational and punchy",
  "subheadline": "Inspirational sentence, 10-15 words, title case",
  "cta": "Engagement phrase, 2-4 words, ALL CAPS",
  "badge": "1-2 word label ALL CAPS (TIPS, GUIDE, FREE, etc)",
  "background_prompt": "Description for an AI image generator. Pure visual scene matching ${niche} — cinematic, premium, atmospheric. ZERO text, ZERO words, ZERO letters anywhere in the image."
}`;

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a marketing creative director specializing in high-converting social media ads. ' +
            'Return only valid JSON, no markdown formatting, no explanation.',
        },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.72,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(resp.choices[0]?.message?.content || '{}');
    // Ensure all fields have values
    return {
      headline: parsed.headline || (isGift ? 'GET THIS FREE TODAY' : 'LEVEL UP YOUR RESULTS'),
      subheadline: parsed.subheadline || `The proven system for ${transformation}`,
      cta: parsed.cta || (isGift ? 'CLAIM FREE' : 'READ MORE'),
      badge: parsed.badge || (isGift ? 'FREE' : 'TIPS'),
      background_prompt: parsed.background_prompt || `Abstract dark premium background for ${niche}, cinematic lighting, no text`,
    };
  } catch {
    return {
      headline: isGift ? 'GET THIS FREE TODAY' : 'LEVEL UP YOUR RESULTS',
      subheadline: isGift ? `Claim your free copy of ${gift}` : `The proven path to ${transformation}`,
      cta: isGift ? 'CLAIM FREE' : 'READ MORE',
      badge: isGift ? 'FREE' : 'TIPS',
      background_prompt: `Dark cinematic abstract background for ${niche}, premium marketing aesthetic`,
    };
  }
}

// ─── Pipeline Step 1 (Gemini variant) ────────────────────────────────────────

async function generateCopyGemini(ctx, postType, userDescription) {
  const gemini = getGeminiClient();
  const gift = ctx?.freeGiftName || 'Free Guide';
  const niche = ctx?.niche || 'business coaching';
  const transformation = ctx?.transformation || 'achieve their goals';
  const isGift = postType === 'free_gift';

  const userPrompt = isGift
    ? `Generate social media ad image overlay text for a FREE digital product.
Product name: "${gift}"
Audience niche: ${niche}
Core transformation: ${transformation}
${userDescription ? `Creative direction from user: ${userDescription}` : ''}

Return JSON only, no markdown:
{
  "headline": "ALL CAPS headline, 4-7 words, bold and benefit-driven",
  "subheadline": "One clear benefit sentence, 10-15 words, title case",
  "cta": "Action CTA phrase, 2-4 words, ALL CAPS",
  "badge": "1-2 words ALL CAPS label (e.g. FREE, NEW, LIVE)",
  "background_prompt": "Detailed description for an AI image generator to create a PURE VISUAL background. Must describe only abstract shapes, environments, lighting, textures. Absolutely ZERO text, ZERO words, ZERO letters, ZERO numbers anywhere in the image. The background should match the ${niche} niche aesthetic with cinematic lighting and premium feel."
}`
    : `Generate social media post image overlay text.
Niche: ${niche}
Core message: ${transformation}
${userDescription ? `Direction: ${userDescription}` : ''}

Return JSON only, no markdown:
{
  "headline": "ALL CAPS headline, 4-7 words, aspirational and punchy",
  "subheadline": "Inspirational sentence, 10-15 words, title case",
  "cta": "Engagement phrase, 2-4 words, ALL CAPS",
  "badge": "1-2 word label ALL CAPS (TIPS, GUIDE, FREE, etc)",
  "background_prompt": "Description for an AI image generator. Pure visual scene matching ${niche} — cinematic, premium, atmospheric. ZERO text, ZERO words, ZERO letters anywhere in the image."
}`;

  try {
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
      systemInstruction:
        'You are a marketing creative director specializing in high-converting social media ads. ' +
        'Return only valid JSON, no markdown formatting, no explanation.',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.72, maxOutputTokens: 400 },
    });
    const result = await model.generateContent(userPrompt);
    const parsed = JSON.parse(result.response.text());
    return {
      headline: parsed.headline || (isGift ? 'GET THIS FREE TODAY' : 'LEVEL UP YOUR RESULTS'),
      subheadline: parsed.subheadline || `The proven system for ${transformation}`,
      cta: parsed.cta || (isGift ? 'CLAIM FREE' : 'READ MORE'),
      badge: parsed.badge || (isGift ? 'FREE' : 'TIPS'),
      background_prompt: parsed.background_prompt || `Abstract dark premium background for ${niche}, cinematic lighting, no text`,
    };
  } catch {
    return {
      headline: isGift ? 'GET THIS FREE TODAY' : 'LEVEL UP YOUR RESULTS',
      subheadline: isGift ? `Claim your free copy of ${gift}` : `The proven path to ${transformation}`,
      cta: isGift ? 'CLAIM FREE' : 'READ MORE',
      badge: isGift ? 'FREE' : 'TIPS',
      background_prompt: `Dark cinematic abstract background for ${niche}, premium marketing aesthetic`,
    };
  }
}

async function generateCaptionGemini(ctx, keyword) {
  const gemini = getGeminiClient();
  const niche = ctx?.niche || 'your industry';
  const gift = ctx?.freeGiftName || 'my free guide';
  const transformation = ctx?.transformation || 'transform your results';

  const model = gemini.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    systemInstruction:
      'You are a high-converting social media copywriter specializing in lead generation. ' +
      'Write engaging captions that stop the scroll and drive comment-based lead generation. ' +
      'Keep captions under 220 words. Use line breaks for readability. End with the exact CTA provided.',
    generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
  });

  const result = await model.generateContent(
    `Write a compelling social media caption for a ${niche} expert giving away "${gift}". ` +
    `Theme: help people ${transformation}. ` +
    `The caption must end with this exact CTA line: "Comment ${keyword} and I'll send it straight to your DMs." ` +
    'Do NOT include hashtags. Do NOT use emojis. Return only the caption text.'
  );
  return result.response.text().trim();
}

// ─── Fetch remote image as base64 (for vault reference images) ───────────────

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = (res.headers.get('content-type') || 'image/png').split(';')[0];
    return { mimeType: contentType, base64: buffer.toString('base64') };
  } catch {
    return null;
  }
}

// ─── Nano Banana prompt (full book cover — AI renders text + visuals) ─────────

function buildNanoBananaPrompt(copy, ctx, styleTags, postType = 'free_gift', refinementFeedback = null, refImageLabels = []) {
  const accentColor    = ctx.brandAccent   || '#CC0000';
  const secondaryColor = ctx.brandSecondary || null;
  const brandName      = ctx.funnelName || ctx.niche || 'Expert';
  const freeGiftName   = ctx.freeGiftName || 'Free Guide';
  const niche          = ctx.niche || 'business coaching';
  const topBadgeText   = postType === 'free_gift' ? 'FREE GUIDE' : 'TIPS & STRATEGY';

  // Background: very dark near-black with subtle brand undertone
  const bgDescription = secondaryColor
    ? `Very dark near-black base (#0a0a0a) with a very subtle ${secondaryColor} undertone`
    : `Very dark near-black base (#0D0D0D) with a faint ${accentColor} warmth at the edges`;

  // Spine (right side): secondary brand color or darker shade of accent
  const spineDescription = secondaryColor
    ? `Right spine color: deep ${secondaryColor}, slightly lighter than the front cover`
    : `Right spine color: dark ${accentColor} at 30% opacity, just distinguishable from the cover`;

  // Hero graphic: use AI-generated scene description from Step 1 if available,
  // otherwise derive from vault context
  const heroDescription = copy.background_prompt
    ? `${copy.background_prompt}
- Light rays and glow in ${accentColor} emanate from behind/beneath the hero object
- Hero sits in the bottom 35% of the cover with clear dark space above it for text`
    : `A cinematic, photorealistic hero object or scene that directly represents "${freeGiftName}" for the ${niche} market
- High-end studio photography aesthetic with ${accentColor} accent lighting
- Object sits in the bottom 35% of the cover, leaving the upper portion clean for headline text`;

  // Style tags woven into the visual specification, not appended as an afterthought
  const styleSpec = styleTags.length > 0
    ? `Visual style modifiers to apply throughout: ${styleTags.join(', ')}.`
    : 'Visual style: dark premium editorial aesthetic.';

  return `A realistic 3D hardcover book mockup, ultra-realistic rendering, high detail, sharp focus, professional product mockup style. Aspect ratio 2:3 portrait.

ORIENTATION & CAMERA:
- Book standing upright, slightly angled to the right at 10–20 degrees
- Full front cover visible with the spine thickness clearly showing on the RIGHT side
- Perspective view — NOT flat. Camera positioned at eye level with a slight top-down tilt
- Centered framing: full book visible with small equal margins on all sides
- DO NOT crop the book, DO NOT show it floating in mid-air at a dramatic angle

SURFACE & BACKGROUND:
- Book sits on a dark surface with a soft drop shadow beneath it, creating a subtle grounded effect
- Background: smooth dark gradient from near-black to deep ${accentColor || '#8B0000'}, with soft ${accentColor || '#CC0000'} glow accents and faint diagonal light streaks
- No distracting elements — background is atmospheric only

LIGHTING:
- Cinematic directional lighting from upper-left
- Soft highlights along the top edge and right spine edge of the book
- Subtle reflections on the cover surface to emphasize depth and realism
- ${accentColor || '#CC0000'} colored rim light on the spine edge
- ${styleSpec}

CONTENT TO DISPLAY:

Top Badge: ${topBadgeText}
Headline: ${copy.headline}
Subheadline: ${copy.subheadline}
Brand Name: ${brandName}

DESIGN RULES FOR THE TOP BADGE:
- Small thin-bordered rectangular label at the very top of the cover
- Text in white, all caps, small tracking — same style as the reference image badge

DESIGN RULES FOR THE HEADLINE:
- Break the headline across 2-3 lines naturally
- The single most powerful or emotional word/phrase goes on its own line in ${accentColor}
- All other headline text is white
- Font: extra-bold condensed, takes up the top 40–50% of the cover below the badge

DESIGN RULES FOR THE SUBHEADLINE:
- Displayed in the center zone in off-white/light gray
- Elegant smaller font beneath a thin glowing ${accentColor} horizontal divider line

COLORS:
- Cover background: ${bgDescription}
- Primary accent: ${accentColor} — used for headline word, divider line, and edge glow
- ${spineDescription}
- Atmospheric glow: ${accentColor} radiating upward from the bottom center of the cover

FOREGROUND COMPOSITION ON THE COVER:
- ${heroDescription}
- All foreground elements are cleanly arranged, balanced, and centered on the lower half of the cover
- Depth layering: foreground objects overlap slightly to create a 3D layered effect
- Objects are realistically lit matching the cover lighting — no flat or cartoon rendering

BRAND NAME:
- Displayed at the very bottom center of the cover in large white bold text
- Subtle ${accentColor} underline or glow beneath the brand name

STYLE: Dark, cinematic, premium, high-contrast. Photorealistic 3D render. No flat design.${
  refImageLabels.length > 0
    ? `\n\nREFERENCE IMAGES ATTACHED — ${refImageLabels.length} image${refImageLabels.length > 1 ? 's are' : ' is'} provided alongside this prompt. You MUST use them as specified:\n${refImageLabels.map((label, i) => `- Image ${i + 1}: ${label}`).join('\n')}`
    : ''
}${
  refinementFeedback
    ? `\n\nREFINEMENT INSTRUCTIONS: The first reference image is the PREVIOUS VERSION of this design. Preserve everything that looks good. Apply ONLY these specific changes: "${refinementFeedback}"`
    : ''
}`;
}

// ─── Pipeline Step 2: Build background image prompt ──────────────────────────
// When the user has a product image in the vault, we only need an atmospheric
// background (the product will be composited separately).
// When they don't, we ask DALL-E to generate a 3D book/guide mockup.

function buildBackgroundPrompt(copy, ctx, styleTags, hasProductImage) {
  const niche    = ctx?.niche     || 'business coaching';
  const gift     = ctx?.freeGiftName || 'Free Guide';
  const theme    = resolveStyleTheme(niche);
  const noText   =
    'CRITICAL: The image must contain ZERO text, ZERO words, ZERO letters, ZERO numbers anywhere. ' +
    'Any text in the image makes it completely unusable.';
  const styleHint = styleTags.length > 0 ? `Style modifiers: ${styleTags.join(', ')}.` : '';

  if (hasProductImage) {
    // User has their own product image — just need a clean background to put it on.
    const base = copy.background_prompt ||
      `Clean premium background for a ${niche} marketing ad.`;
    const visual =
      `Simple dark atmospheric background: ${theme} color palette. ` +
      'Subtle radial gradient or spotlight effect from center. ' +
      'No objects, no books, no people — pure background texture only. ' +
      `Clear space in the center for a product image. Premium, high-contrast.`;
    return [base, noText, visual, styleHint].filter(Boolean).join('\n\n');
  }

  // No product image — generate a 3D book/guide mockup as the hero visual.
  const base =
    `A premium 3D hardcover book or guide mockup for "${gift}", targeted at the ${niche} market. ` +
    `The book is the CENTRAL HERO of the image, shown in slight perspective (3/4 angle) with realistic drop shadow and depth. ` +
    `The book cover features ${theme} color scheme with professional design elements relevant to ${niche}. ` +
    `Background: simple dark gradient — NOT a landscape or nature scene. ` +
    `Leave the TOP 30% and BOTTOM 25% of the image relatively clean and dark for text overlay. ` +
    `The book sits in the CENTER-LOWER portion of the image. ` +
    `Do NOT show multiple copies of the book — just one centered book mockup.`;

  return [base, noText, styleHint].filter(Boolean).join('\n\n');
}

// ─── Pipeline Step 3: Composite text over background using sharp + SVG ──────────
// Renders a marketing template with pixel-perfect Geist typography.

// ─── SVG text helpers ─────────────────────────────────────────────────────────

function xmlEsc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Naive word-wrap: split text into lines of at most maxChars characters.
function wrapText(text, maxChars) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (candidate.length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = candidate;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─── Pipeline Step 3: Composite text overlay using sharp + SVG ────────────────
// Reference layout: headline centered at top, clear middle for book/product,
// product title + CTA at bottom, FREE circle badge bottom-right corner.

async function compositeImage(bgBuffer, copy, size, postType, productImageUrl) {
  const [width, height] = size.split('x').map(Number);
  const cx      = width / 2;
  const pad     = Math.round(Math.min(width, height) * 0.044);
  const isGift  = postType === 'free_gift';

  // ── Headline (top zone) ───────────────────────────────────────────────────
  const hlSize     = Math.round(Math.min(width, height) * 0.057);
  const hlLineH    = hlSize * 1.22;
  const hlChars    = Math.floor((width - pad * 2) / (hlSize * 0.54));
  const hlLines    = wrapText(copy.headline?.toUpperCase() || 'GET THIS FREE TODAY', hlChars);
  const hlBlockH   = hlLines.length * hlLineH;
  // top zone = 0–28% — vertically center text within it
  const topZoneH   = Math.round(height * 0.28);
  const hlStartY   = Math.round((topZoneH - hlBlockH) / 2) + Math.round(hlSize * 0.88);

  // ── Bottom zone (72%–100%) ────────────────────────────────────────────────
  const bottomZoneTop = Math.round(height * 0.72);

  // Product / guide title (subheadline displayed as book title)
  const titleSize  = Math.round(Math.min(width, height) * 0.027);
  const titleLineH = titleSize * 1.3;
  const titleChars = Math.floor((width - pad * 2) / (titleSize * 0.58));
  const titleLines = wrapText(copy.subheadline?.toUpperCase() || '', titleChars);
  const titleBlockH = titleLines.length * titleLineH;

  // CTA button
  const ctaFont    = Math.round(Math.min(width, height) * 0.017);
  const ctaPadH    = 28;
  const ctaPadV    = 11;
  const ctaText    = xmlEsc((copy.cta || 'CLAIM FREE').toUpperCase());
  const ctaW       = Math.max(160, ctaText.length * (ctaFont * 0.62) + ctaPadH * 2);
  const ctaH       = ctaFont + ctaPadV * 2;

  // Layout bottom-up from image bottom
  const ctaY   = height - pad - ctaH;
  const titleY = ctaY - 14 - titleBlockH;

  // FREE circle badge — bottom-right, anchored above CTA row
  const badgeR  = Math.round(Math.min(width, height) * 0.068);
  const badgeCX = width - pad - badgeR;
  const badgeCY = bottomZoneTop + badgeR + 8;

  // Accent divider under headline
  const accentW  = Math.round(width * 0.16);
  const accentY  = hlStartY + (hlLines.length - 1) * hlLineH + Math.round(hlSize * 0.32);

  // Headline tspans
  const hlTspans = hlLines.map((line, i) =>
    `<tspan x="${cx}" dy="${i === 0 ? 0 : hlLineH}">${xmlEsc(line)}</tspan>`
  ).join('');

  // Title tspans
  const titleTspans = titleLines.map((line, i) =>
    `<tspan x="${cx}" dy="${i === 0 ? 0 : titleLineH}">${xmlEsc(line)}</tspan>`
  ).join('');

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Double-vignette: dark top + dark bottom, transparent middle -->
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#000" stop-opacity="0.88"/>
      <stop offset="27%"  stop-color="#000" stop-opacity="0.08"/>
      <stop offset="68%"  stop-color="#000" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.92"/>
    </linearGradient>
  </defs>

  <!-- Vignette overlay -->
  <rect width="${width}" height="${height}" fill="url(#vig)"/>

  <!-- ── TOP: Headline ────────────────────────────────────────────────── -->
  <text x="${cx}" y="${hlStartY}"
        text-anchor="middle"
        font-family="Arial Black, Arial, Helvetica, sans-serif"
        font-size="${hlSize}" font-weight="900"
        fill="#ffffff" letter-spacing="-0.5">${hlTspans}</text>

  <!-- Cyan accent line below headline -->
  <rect x="${cx - accentW / 2}" y="${accentY}" width="${accentW}" height="3" rx="1.5" fill="#00E5FF"/>

  <!-- ── BOTTOM: Product / guide title ────────────────────────────────── -->
  ${titleLines.length ? `
  <text x="${cx}" y="${titleY}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${titleSize}" font-weight="700"
        fill="rgba(255,255,255,0.92)" letter-spacing="1.2">${titleTspans}</text>` : ''}

  <!-- CTA button (centered) -->
  <rect x="${cx - ctaW / 2}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="10" fill="#00E5FF"/>
  <text x="${cx}" y="${ctaY + ctaPadV + ctaFont * 0.78}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${ctaFont}" font-weight="900"
        fill="#000000" letter-spacing="1.5">${ctaText}</text>

  <!-- FREE circle badge (bottom-right) -->
  ${isGift ? `
  <circle cx="${badgeCX}" cy="${badgeCY}" r="${badgeR}" fill="#22C55E"/>
  <text x="${badgeCX}" y="${badgeCY - Math.round(badgeR * 0.12)}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Arial Black, Arial, Helvetica, sans-serif"
        font-size="${Math.round(badgeR * 0.52)}" font-weight="900"
        fill="#ffffff">FREE</text>
  <text x="${badgeCX}" y="${badgeCY + Math.round(badgeR * 0.40)}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${Math.round(badgeR * 0.27)}" font-weight="700"
        fill="rgba(255,255,255,0.85)">GUIDE</text>
  ` : ''}
</svg>`;

  // Build composite layers: bg → optional product image → SVG text overlay
  const composites = [{ input: Buffer.from(svg), blend: 'over' }];

  if (productImageUrl) {
    try {
      const prodBuf = Buffer.from(
        await fetch(productImageUrl).then(r => r.arrayBuffer())
      );
      // Fit product image into the middle zone (28%–72%), 58% of the shorter dimension wide
      const prodSize  = Math.round(Math.min(width, height) * 0.58);
      const midTop    = Math.round(height * 0.27);
      const midH      = Math.round(height * 0.45);
      const prodLeft  = Math.round((width - prodSize) / 2);
      const prodTop   = midTop + Math.round((midH - prodSize) / 2);

      const resized = await sharp(prodBuf)
        .resize(prodSize, prodSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      // Insert BEFORE the SVG overlay so text renders on top
      composites.unshift({ input: resized, top: Math.max(0, prodTop), left: prodLeft, blend: 'over' });
    } catch (e) {
      console.warn('[DailyLeads] Product image composite failed, skipping:', e.message);
    }
  }

  return await sharp(bgBuffer)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .composite(composites)
    .png({ quality: 90 })
    .toBuffer();
}

// ─── Gemini image generation ──────────────────────────────────────────────────

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

// ─── Caption generation (for the social post text, separate from image) ────────

function buildCaptionPrompt(ctx, keyword) {
  const niche = ctx?.niche || 'your industry';
  const gift = ctx?.freeGiftName || 'my free guide';
  const transformation = ctx?.transformation || 'transform your results';

  return [
    {
      role: 'system',
      content:
        'You are a high-converting social media copywriter specializing in lead generation. ' +
        'Write engaging captions that stop the scroll and drive comment-based lead generation. ' +
        'Keep captions under 220 words. Use line breaks for readability. End with the exact CTA provided.',
    },
    {
      role: 'user',
      content:
        `Write a compelling social media caption for a ${niche} expert giving away "${gift}". ` +
        `Theme: help people ${transformation}. ` +
        `The caption must end with this exact CTA line: "Comment ${keyword} and I'll send it straight to your DMs." ` +
        'Do NOT include hashtags. Do NOT use emojis. Return only the caption text.',
    },
  ];
}

// ─── GET — fetch vault context preview ───────────────────────────────────────

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id') || null;

    const vaultCtx = await getVaultContext(workspaceId, funnelId);
    if (!vaultCtx) return NextResponse.json({ vaultContext: null, missing: true });

    return NextResponse.json({ vaultContext: vaultCtx, missing: false });
  } catch (err) {
    console.error('[DailyLeads Context GET]', err);
    return NextResponse.json({ error: 'Failed to load vault context.' }, { status: 500 });
  }
}

// ─── POST — generate post (3-step pipeline) ───────────────────────────────────

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const keyword      = (body.keyword || 'GUIDE').toUpperCase().trim();
    const funnelId     = body.funnel_id || null;
    const postType     = body.post_type || 'free_gift';
    const model        = body.model || 'dall-e-3';
    const styleTags    = Array.isArray(body.style_tags) ? body.style_tags.slice(0, 4) : [];
    const userDescription =
      typeof body.user_description === 'string' ? body.user_description.trim() : null;

    const isNanoBanana = model === 'nano-banana';
    const isDalle2     = model === 'dall-e-2';
    const requestedSize = body.aspect_ratio || '1024x1024';
    const size = isDalle2 || isNanoBanana
      ? '1024x1024'
      : ['1024x1024', '1024x1792', '1792x1024'].includes(requestedSize)
      ? requestedSize
      : '1024x1024';

    // ── Quota check ──────────────────────────────────────────────────────────
    const { count, today } = await getOrCreateQuota(workspaceId);
    if (count >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily limit reached (${DAILY_LIMIT} generations/day). Try again tomorrow.`,
          quota: { used: count, limit: DAILY_LIMIT },
        },
        { status: 429 }
      );
    }

    // ── Vault context ────────────────────────────────────────────────────────
    const vaultCtx = await getVaultContext(workspaceId, funnelId);
    if (!vaultCtx?.freeGiftName) {
      return NextResponse.json(
        {
          error: 'missing_vault_context',
          message: 'Complete your Free Gift setup in the Vault before generating posts.',
        },
        { status: 422 }
      );
    }

    const openai = isNanoBanana ? null : getOpenAIClient();

    // ── Reference images (nano-banana only) ──────────────────────────────────
    // Merge user-uploaded reference images with vault media images fetched server-side
    const isRefinement     = body.is_refinement === true;
    const previousImageUrl = typeof body.previous_image_url === 'string' ? body.previous_image_url : null;
    const userRefImages    = Array.isArray(body.reference_images) ? body.reference_images : [];
    let allRefImages  = [];
    let refImageLabels = []; // parallel array — same index as allRefImages, tells the model what each image is

    if (isNanoBanana) {
      // Previous image (refinement) — comes first so model sees it as the baseline to improve
      const prevImg = (isRefinement && previousImageUrl) ? await fetchImageAsBase64(previousImageUrl) : null;
      if (prevImg) {
        allRefImages.push(prevImg);
        refImageLabels.push('PREVIOUS VERSION of this design — study it carefully, keep what worked, apply only the requested changes');
      }

      // Vault images — fetched in a known order so labels match
      const vaultSlots = [
        { url: vaultCtx.logoUrl,        label: 'Brand logo — render this exact logo on the book cover instead of plain text for the brand name (place it at the bottom of the cover, centered)' },
        { url: vaultCtx.authorPhotoUrl, label: 'Author/expert headshot — do NOT place on the front cover; use for brand style reference only' },
        { url: vaultCtx.productImageUrl,label: 'Product or guide cover image — use as the hero visual in the bottom third of the book cover' },
      ];
      for (const slot of vaultSlots) {
        if (!slot.url) continue;
        const img = await fetchImageAsBase64(slot.url);
        if (img) { allRefImages.push(img); refImageLabels.push(slot.label); }
      }

      // User-uploaded images — user describes their purpose in the text prompt
      for (const img of userRefImages) {
        if (img?.base64 && img?.mimeType) {
          allRefImages.push(img);
          refImageLabels.push(`User-provided reference image ("${img.name || 'image'}") — incorporate exactly as described by the user in the prompt above`);
        }
      }
    }

    // For refinements: annotate the user description so copy generation knows the context
    const effectiveDescription = isRefinement && userDescription
      ? `REFINEMENT — keep what worked in the previous version, apply these specific changes: ${userDescription}`
      : userDescription;

    let imageUrl = null;
    let caption  = null;
    let imageGenerated = false;

    try {
      // ── STEP 1: Generate structured copy (headline, subheadline, cta, badge, bg prompt) ──
      const copy = isNanoBanana
        ? await generateCopyGemini(vaultCtx, postType, effectiveDescription)
        : await generateCopy(openai, vaultCtx, postType, effectiveDescription);

      // ── STEP 2: Generate image ────────────────────────────────────────────
      let bgBuffer;

      if (isNanoBanana) {
        // Full book cover rendered by AI — no compositing needed
        const imgPrompt = buildNanoBananaPrompt(copy, vaultCtx, styleTags, postType, isRefinement && previousImageUrl ? userDescription : null, refImageLabels);
        const { buffer } = await generateWithGemini(imgPrompt, allRefImages);
        bgBuffer = buffer;
      } else {
        const hasProductImage = !!vaultCtx.productImageUrl;
        const bgPrompt = buildBackgroundPrompt(copy, vaultCtx, styleTags, hasProductImage);
        const imageGenParams = {
          model,
          prompt: bgPrompt,
          n: 1,
          size,
          response_format: 'url',
        };
        if (!isDalle2) {
          imageGenParams.quality = 'standard';
          imageGenParams.style   = 'vivid';
        }
        const imageResp = await openai.images.generate(imageGenParams);
        const tempUrl   = imageResp.data[0]?.url;
        if (!tempUrl) throw new Error('DALL-E did not return an image URL');
        bgBuffer = Buffer.from(await fetch(tempUrl).then(r => r.arrayBuffer()));
      }

      // ── STEP 3: Composite SVG text overlay (DALL-E only — Nano Banana renders full image) ──
      const finalBuffer = isNanoBanana
        ? bgBuffer
        : await compositeImage(bgBuffer, copy, size, postType, vaultCtx.productImageUrl);

      // ── Upload final composited image to Supabase storage ──
      const filename = `${workspaceId}/${Date.now()}-${model}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('daily-post-images')
        .upload(filename, finalBuffer, { contentType: 'image/png', upsert: false });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      const { data: urlData } = supabaseAdmin.storage
        .from('daily-post-images')
        .getPublicUrl(filename);

      imageUrl       = urlData.publicUrl;
      imageGenerated = true;
    } catch (imgErr) {
      console.error('[DailyLeads] Image generation failed:', imgErr.message, imgErr.stack?.split('\n')[1]);

      if (imgErr?.provider === 'gemini' && imgErr?.quotaExceeded) {
        const retrySuffix = imgErr.retryAfterSeconds
          ? ` Retry after about ${imgErr.retryAfterSeconds}s.`
          : '';
        return NextResponse.json(
          {
            error:
              'Gemini image generation is unavailable for this API key/project right now. ' +
              'Enable billing or image quota on the linked Google project, or switch to DALL·E 3.' +
              retrySuffix,
            code: 'gemini_quota_exceeded',
            provider: 'gemini',
            model: imgErr.model || GEMINI_IMAGE_MODEL,
            retry_after_seconds: imgErr.retryAfterSeconds ?? null,
            details: imgErr.message,
          },
          { status: imgErr.status || 429 }
        );
      }

      return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 });
    }

    // ── Caption generation (social post text — separate from image overlay text) ──
    try {
      if (isNanoBanana) {
        caption = await generateCaptionGemini(vaultCtx, keyword);
      } else {
        const captionResp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: buildCaptionPrompt(vaultCtx, keyword),
          max_tokens: 400,
          temperature: 0.8,
        });
        caption = captionResp.choices[0]?.message?.content?.trim() || '';
      }
    } catch (captionErr) {
      console.error('[DailyLeads] Caption generation failed:', captionErr.message);
      if (imageGenerated) {
        return NextResponse.json(
          { error: 'Caption generation failed. Your image was generated — please try again.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 });
    }

    // ── Save post to database ────────────────────────────────────────────────
    const { data: post, error: insertError } = await supabaseAdmin
      .from('daily_posts')
      .insert({
        user_id:   workspaceId,
        funnel_id: funnelId ?? vaultCtx.funnelId ?? null,
        image_url: imageUrl,
        caption,
        keyword,
        post_date: today,
        status:    'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DailyLeads] Insert failed:', insertError.message);
      return NextResponse.json({ error: 'Failed to save post.' }, { status: 500 });
    }

    // ── Increment quota ──────────────────────────────────────────────────────
    try {
      await supabaseAdmin
        .from('post_generations_quota')
        .upsert(
          { user_id: workspaceId, quota_date: today, generation_count: count + 1 },
          { onConflict: 'user_id,quota_date' }
        );
    } catch (quotaErr) {
      console.warn('[DailyLeads] Quota increment failed silently:', quotaErr.message);
    }

    return NextResponse.json({
      post,
      quota: { used: count + 1, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - (count + 1) },
      vaultContext: { freeGiftName: vaultCtx.freeGiftName, niche: vaultCtx.niche },
    });
  } catch (err) {
    console.error('[DailyLeads Generate] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
