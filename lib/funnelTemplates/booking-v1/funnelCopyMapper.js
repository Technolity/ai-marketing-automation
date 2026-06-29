/**
 * Coded Funnel — Design "booking-v1" — VAULT → RENDER DATA (the bake bridge).
 *
 * The baked booking funnel REUSES the existing vault content — no new section, no new
 * prompt. This maps the three real vault sources into the shape the renderers consume:
 *
 *   1. funnelCopy  → text (salesPage minus optin, calendarPage, thankYouPage)
 *   2. media       → logo / bio photo / hero video / thankyou video  (URLs; blank = fallback)
 *   3. colorPalette→ brand.primary / .secondary / .accent (3 universal brand colors)
 *
 * Repeating salesPage slots (process_1..6, testimonial_1..4, faq_1..4, audience/call
 * bullets, how-it-works points) collapse back into arrays here, dropping empties.
 *
 * Pure transform — NO database access (caller fetches the vault rows). Keeps the
 * shared-prod-DB rule trivially safe: this file can never write anything.
 */

const filled = (v) => (typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null);
/** Set key only if filled, so missing values fall through to the renderer's fallback. */
const put = (obj, key, v) => { if (filled(v)) obj[key] = v; };
/** Collapse numbered slots 1..n into an array of objects/strings, dropping empty items. */
function collect(n, fn) {
  const out = [];
  for (let i = 1; i <= n; i++) { const item = fn(i); if (item !== null) out.push(item); }
  return out;
}

/** salesPage (minus optin) → landing render data. */
function mapLanding(sp = {}) {
  const copy = {};
  // Hero
  put(copy, 'hero_headline', sp.hero_headline_text);
  put(copy, 'hero_subheadline', sp.hero_subheadline_text);
  put(copy, 'hero_cta_text', sp.cta_text);
  put(copy, 'hero_below_cta', sp.hero_below_cta_sub_text);
  // Process / method
  put(copy, 'process_headline', sp.process_headline);
  put(copy, 'process_subheadline', sp.process_subheadline);
  const steps = collect(6, (i) => {
    const title = sp[`process_${i}_headline`]; const text = sp[`process_${i}_subheadline`];
    return (filled(title) || filled(text)) ? { title: title || '', text: text || '' } : null;
  });
  if (steps.length) copy.steps = steps;
  // How it works
  put(copy, 'how_headline', sp.how_it_works_headline);
  put(copy, 'how_sub', sp.how_it_works_subheadline_above_cta);
  const howPoints = collect(3, (i) => (filled(sp[`how_it_works_point_${i}`]) ? sp[`how_it_works_point_${i}`] : null));
  if (howPoints.length) copy.how_points = howPoints;
  // Audience callout (is / isn't for you)
  put(copy, 'this_is_for_headline', sp.this_is_for_headline);
  put(copy, 'audience_headline', sp.audience_callout_headline);
  put(copy, 'audience_for_headline', sp.audience_callout_for_headline);
  put(copy, 'audience_not_headline', sp.audience_callout_not_headline);
  put(copy, 'audience_cta_sub', sp.audience_callout_cta_sub_text);
  const audFor = collect(3, (i) => (filled(sp[`audience_callout_for_${i}`]) ? sp[`audience_callout_for_${i}`] : null));
  const audNot = collect(3, (i) => (filled(sp[`audience_callout_not_${i}`]) ? sp[`audience_callout_not_${i}`] : null));
  if (audFor.length) copy.audience_for = audFor;
  if (audNot.length) copy.audience_not = audNot;
  // Call expectations
  put(copy, 'call_headline', sp.call_expectations_headline);
  put(copy, 'call_is_headline', sp.call_expectations_is_for_headline);
  put(copy, 'call_not_headline', sp.call_expectations_not_for_headline);
  const callIs = collect(3, (i) => (filled(sp[`call_expectations_is_for_bullet_${i}`]) ? sp[`call_expectations_is_for_bullet_${i}`] : null));
  const callNot = collect(3, (i) => (filled(sp[`call_expectations_not_for_bullet_${i}`]) ? sp[`call_expectations_not_for_bullet_${i}`] : null));
  if (callIs.length) copy.call_is = callIs;
  if (callNot.length) copy.call_not = callNot;
  // Bio
  put(copy, 'bio_headline', sp.bio_headline_text);
  put(copy, 'bio_text', sp.bio_paragraph_text);
  // Testimonials (headline + "quote — name")
  put(copy, 'testimonials_headline', sp.testimonial_headline_text);
  put(copy, 'testimonials_sub', sp.testimonial_subheadline_text);
  const testimonials = collect(4, (i) => {
    const headline = sp[`testimonial_review_${i}_headline`]; const quote = sp[`testimonial_review_${i}_subheadline_with_name`];
    return (filled(headline) || filled(quote)) ? { headline: headline || '', quote: quote || '' } : null;
  });
  if (testimonials.length) copy.testimonials = testimonials;
  // FAQ
  put(copy, 'faq_headline', sp.faq_headline_text);
  const faq = collect(4, (i) => {
    const q = sp[`faq_question_${i}`]; const a = sp[`faq_answer_${i}`];
    return (filled(q) || filled(a)) ? { q: q || '', a: a || '' } : null;
  });
  if (faq.length) copy.faq = faq;
  // Final CTA + footer
  put(copy, 'final_headline', sp.final_cta_headline);
  put(copy, 'final_subheadline', sp.final_cta_subheadline);
  put(copy, 'final_subtext', sp.final_cta_subtext);
  put(copy, 'footer_text', sp.footer_text);
  return copy;
}

/** calendarPage → calendar render data. */
function mapCalendar(cp = {}) {
  const copy = {};
  put(copy, 'headline', cp.headline);
  put(copy, 'footer_text', cp.footer_text);
  return copy;
}

/** thankYouPage → thank-you render data. */
function mapThankYou(tp = {}) {
  const copy = {};
  put(copy, 'headline', tp.headline);
  put(copy, 'subheadline', tp.subheadline);
  put(copy, 'footer_text', tp.footer_text);
  return copy;
}

/**
 * Build the render-data object for one booking page from the vault.
 * @param {'landing'|'calendar'|'thankYou'} pageKey
 * @param {object} args
 * @param {object} args.funnelCopy   the funnelCopy section content { salesPage, calendarPage, thankYouPage }
 * @param {object} args.media        the media section { logo, bio_author, main_vsl, thankyou_video, ... } (URLs)
 * @param {object} args.colorPalette { primary, secondary, accent }
 * @param {string} args.businessName from user_profiles.business_name
 * @returns {{ brand, copy, media, embeds }}
 */
export function funnelCopyToRenderData(pageKey, { funnelCopy = {}, media = {}, colorPalette = {}, businessName } = {}) {
  // Normalize the palette exactly like push-colors: a value may be a string hex OR an
  // object { hex }, and the 3rd color is keyed tertiary / accent / accentColor. Without
  // this, brand.primary could be "[object Object]" or the accent undefined → broken CSS vars.
  const cp = colorPalette || {};
  const hex = (v) => (v && typeof v === 'object' ? v.hex : v) || null;
  const brand = {};
  put(brand, 'primary', hex(cp.primary) || hex(cp.primaryColor));
  put(brand, 'secondary', hex(cp.secondary) || hex(cp.secondaryColor));
  put(brand, 'accent', hex(cp.accent) || hex(cp.tertiary) || hex(cp.accentColor));
  put(brand, 'businessName', businessName);

  const logoUrl = media.logo || media.logo_url || media.logoUrl;
  const bioPhotoUrl = media.bio_author || media.author_photo_url || media.profile_photo;
  const heroVideoUrl = media.main_vsl || media.main_video_url;
  const thankYouVideoUrl = media.thankyou_video || media.thankyou_video_url;

  if (pageKey === 'calendar') {
    const m = {}; put(m, 'logoUrl', logoUrl);
    const embeds = {}; put(embeds, 'calendarEmbed', (funnelCopy.calendarPage || {}).calendar_embedded_code);
    return { brand, copy: mapCalendar(funnelCopy.calendarPage), media: m, embeds };
  }
  if (pageKey === 'thankYou') {
    const m = {}; put(m, 'logoUrl', logoUrl); put(m, 'videoUrl', thankYouVideoUrl);
    return { brand, copy: mapThankYou(funnelCopy.thankYouPage), media: m, embeds: {} };
  }
  // landing
  const m = {}; put(m, 'logoUrl', logoUrl); put(m, 'bioPhotoUrl', bioPhotoUrl); put(m, 'videoUrl', heroVideoUrl);
  return { brand, copy: mapLanding(funnelCopy.salesPage), media: m, embeds: {} };
}
