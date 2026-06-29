/**
 * Coded Funnel — Design "booking-v1" — Thank You / Confirmation Page (SEGMENTS, v2 editorial).
 *
 * Small page → ONE HTML chunk + ONE CSS value: segments [bv1_thankyou_css, bv1_thankyou_main].
 * Same v2 editorial system + brand colors as the landing. Fed by funnelCopy.thankYouPage
 * (headline, subheadline, footer) + the optional thank-you video from media (media.videoUrl, baked).
 * Fully responsive.
 */

import { safeText } from '../escape.js';
import { v2Css } from './v2theme.js';

const FALLBACK = {
  eyebrow: 'You’re Booked',
  headline: 'You’re Booked! 🎉',
  subheadline: 'Check your inbox for the calendar invite and call details.',
  next_steps: [
    'Check your email for the calendar invite and Zoom link.',
    'Add the call to your calendar so it’s not missed.',
    'Come ready with your single biggest goal and obstacle.',
  ],
  footer_text: 'All rights reserved.',
  primary: '#C41E2A', secondary: '#1e1b4b', accent: '#D4A84B', businessName: 'Your Business',
};

const REVEAL = `<script>(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('v2-in');io.unobserve(e.target);}});},{threshold:0.1});document.querySelectorAll('.v2-reveal').forEach(function(el){io.observe(el);});})();</script>`;

export function renderThankYouSegments(data = {}) {
  const brand = data.brand || {};
  const copy = data.copy || {};
  const media = data.media || {};

  const primary = brand.primary || FALLBACK.primary;
  const secondary = brand.secondary || FALLBACK.secondary;
  const accent = brand.accent || FALLBACK.accent;
  const businessName = safeText(brand.businessName || FALLBACK.businessName);
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  const eyebrow = safeText(copy.eyebrow || FALLBACK.eyebrow);
  const headline = safeText(copy.headline || FALLBACK.headline);
  const subheadline = safeText(copy.subheadline || FALLBACK.subheadline);
  const footer = safeText(copy.footer_text || FALLBACK.footer_text);
  const steps = Array.isArray(copy.next_steps) ? copy.next_steps : FALLBACK.next_steps;
  const videoUrl = media.videoUrl ? safeText(media.videoUrl) : '';

  const stepRows = steps.map((s, i) => `<div class="v2-step"><span class="v2-step-num">${String(i + 1).padStart(2, '0')}</span><div><p class="v2-step-title">${safeText(s)}</p></div></div>`).join('');
  const videoHtml = videoUrl
    ? `<div class="v2-reveal v2-delay-2"><div class="v2-video-outer"><div class="v2-video-inner"><iframe src="${videoUrl}" title="${headline}" allow="autoplay; fullscreen" allowfullscreen></iframe></div></div></div>`
    : '';

  const css = v2Css({ primary, secondary, accent });
  const header = `<header class="v2-header"><div class="v2-header-in"><span class="v2-brandmark">${logoUrl ? `<img class="v2-logo" src="${logoUrl}" alt="${businessName}" />` : `<span class="v2-logo-txt">${businessName}</span>`}</span></div></header>`;
  const main = `${header}
<section class="v2-section v2-dark">
  <div class="v2-wrap" style="text-align:center;">
    <div class="v2-reveal"><span class="v2-tag">${eyebrow}</span></div>
    <h1 class="v2-h1 v2-reveal v2-delay-1" style="margin-left:auto;margin-right:auto;max-width:640px;">${headline}</h1>
    <hr class="v2-rule v2-rule--center v2-reveal v2-delay-2" />
    <p class="v2-lead v2-reveal v2-delay-2" style="max-width:520px;margin-left:auto;margin-right:auto;">${subheadline}</p>
    ${videoHtml}
    <div class="v2-card v2-reveal v2-delay-3" style="text-align:left;max-width:620px;margin:40px auto 0;">
      <p class="v2-tag">What happens next</p>
      ${stepRows}
    </div>
    <p class="v2-reveal" style="margin-top:48px;font-size:0.7rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(245,241,234,0.25);">&copy; ${businessName} · ${footer}</p>
  </div>
</section>
${REVEAL}`;

  return [
    { name: 'bv1_thankyou_css', html: css },
    { name: 'bv1_thankyou_main', html: main },
  ];
}
