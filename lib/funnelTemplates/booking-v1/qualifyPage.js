/**
 * Coded Funnel — Design "booking-v1" — Qualification / Application Page (SEGMENTS).
 *
 * Funnel step 1 of 2. A focused application page: minimal nav, one job — fill the form.
 * HYBRID: the form is a LIVE merge tag ({{custom_values.appt_qualify_form}}); the user
 * pastes their GHL form embed there. Everything else is baked. Shares the dark editorial
 * system via theme.js. Segments: head / body / foot.
 *
 * Input `data`: { brand:{primary,secondary,businessName}, copy:{eyebrow,headline,
 *   subheadline,reassurance[],footer_text}, media:{logoUrl} }
 */

import { safeText, readableTextColor, mergeTag } from '../escape.js';
import { themeCss, miniTopbar, pageFoot } from './theme.js';

/** The user-controlled custom value the qualification form lives in (NOT baked by us). */
export const QUALIFY_FORM_KEY = 'appt_qualify_form';

const FALLBACK = {
  eyebrow: 'Application',
  headline: 'A Few Quick Questions First',
  subheadline: 'This helps us make sure the call is a great use of your time. It takes under a minute.',
  reassurance: ['Takes 60 seconds', '100% confidential', 'No obligation'],
  footer_text: 'All rights reserved.',
  primary: '#3b82f6',
  secondary: '#1e1b4b',
  businessName: 'Your Business',
};

const PAGE_CSS = `
  main.narrow { max-width: 680px; margin: 0 auto; padding: clamp(48px, 9vw, 96px) 0; }
  .q-panel { text-align: center; }
  .q-panel h1 { margin-bottom: 14px; }
  .q-panel .sub { margin-bottom: 30px; }
  .form { text-align: left; min-height: 160px; border-top: 1px solid var(--line); padding-top: 26px; }
`;

export function renderQualifySegments(data = {}) {
  const brand = data.brand || {};
  const copy = data.copy || {};
  const media = data.media || {};

  const primary = brand.primary || FALLBACK.primary;
  const secondary = brand.secondary || FALLBACK.secondary;
  const onPrimary = readableTextColor(primary);
  const businessName = safeText(brand.businessName || FALLBACK.businessName);
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  const eyebrow = safeText(copy.eyebrow || FALLBACK.eyebrow);
  const headline = safeText(copy.headline || FALLBACK.headline);
  const subheadline = safeText(copy.subheadline || FALLBACK.subheadline);
  const footer = safeText(copy.footer_text || FALLBACK.footer_text);
  const reassurance = Array.isArray(copy.reassurance) ? copy.reassurance : FALLBACK.reassurance;

  const trustHtml = reassurance
    .map((t) => `<li><svg viewBox="0 0 24 24" class="tick" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>${safeText(t)}</li>`)
    .join('');

  const css = themeCss(primary, secondary, undefined, onPrimary, undefined, PAGE_CSS);
  const body = `${miniTopbar({ logoUrl, businessName, step: 'Step 1 of 2 · Application' })}
<main class="narrow">
  <div class="panel q-panel reveal">
    <span class="eyebrow">${eyebrow}</span>
    <h1>${headline}</h1>
    <p class="sub">${subheadline}</p>
    <div class="form">${mergeTag(QUALIFY_FORM_KEY)}</div>
    <ul class="trust">${trustHtml}</ul>
  </div>
</main>`;
  const foot = pageFoot({ businessName, footer });

  return [
    { name: 'bv1_qualify_css', html: css },
    { name: 'bv1_qualify_body', html: body },
    { name: 'bv1_qualify_foot', html: foot },
  ];
}
