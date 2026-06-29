/**
 * Coded Funnel — Design "booking-v1" — Calendar / Booking Page (SEGMENTS, v2 editorial).
 *
 * Small page → ONE HTML chunk + ONE CSS value: segments [bv1_calendar_css, bv1_calendar_main].
 * Same v2 editorial system + brand colors as the landing (shared v2theme.js). The calendar
 * embed is BAKED from the vault (funnelCopy.calendarPage.calendar_embedded_code via the mapper
 * → data.embeds.calendarEmbed); if blank it falls back to the live {{custom_values.appt_calendar_embed}}
 * tag. Section carries id="book" so landing CTAs (href="#book") anchor here. Fully responsive.
 */

import { safeText, mergeTag, rawEmbed } from '../escape.js';
import { v2Css } from './v2theme.js';

/** The user-controlled custom value the calendar embed lives in when not baked from vault. */
export const CALENDAR_EMBED_KEY = 'appt_calendar_embed';

const FALLBACK = {
  eyebrow: 'Pick Your Time',
  headline: 'Book Your Free Strategy Call',
  subheadline: 'Choose a slot that works for you — we’ll send a calendar invite straight away.',
  recap_headline: 'On this call you’ll get',
  recap_points: [
    'A clear diagnosis of your #1 growth constraint',
    'A prioritised 90-day action plan',
    'The exact next moves to make this week',
  ],
  footer_text: 'All rights reserved.',
  primary: '#C41E2A', secondary: '#1e1b4b', accent: '#D4A84B', businessName: 'Your Business',
};

const REVEAL = `<script>(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('v2-in');io.unobserve(e.target);}});},{threshold:0.1});document.querySelectorAll('.v2-reveal').forEach(function(el){io.observe(el);});})();</script>`;

export function renderCalendarSegments(data = {}) {
  const brand = data.brand || {};
  const copy = data.copy || {};
  const embeds = data.embeds || {};
  const media = data.media || {};

  const primary = brand.primary || FALLBACK.primary;
  const secondary = brand.secondary || FALLBACK.secondary;
  const accent = brand.accent || FALLBACK.accent;
  const businessName = safeText(brand.businessName || FALLBACK.businessName);
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  const eyebrow = safeText(copy.eyebrow || FALLBACK.eyebrow);
  const headline = safeText(copy.headline || FALLBACK.headline);
  const subheadline = safeText(copy.subheadline || FALLBACK.subheadline);
  const recapHeadline = safeText(copy.recap_headline || FALLBACK.recap_headline);
  const footer = safeText(copy.footer_text || FALLBACK.footer_text);
  const recapPoints = Array.isArray(copy.recap_points) ? copy.recap_points : FALLBACK.recap_points;

  const calBlock = embeds.calendarEmbed ? rawEmbed(embeds.calendarEmbed) : mergeTag(CALENDAR_EMBED_KEY);
  const recapHtml = `<ul class="v2-list v2-list--check">${recapPoints.map((p) => `<li>${safeText(p)}</li>`).join('')}</ul>`;

  const css = v2Css({ primary, secondary, accent });
  const header = `<header class="v2-header"><div class="v2-header-in"><span class="v2-brandmark">${logoUrl ? `<img class="v2-logo" src="${logoUrl}" alt="${businessName}" />` : `<span class="v2-logo-txt">${businessName}</span>`}</span></div></header>`;
  const main = `${header}
<section class="v2-section v2-dark" id="book">
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-tag">${eyebrow}</span></div>
    <h1 class="v2-h1 v2-reveal v2-delay-1">${headline}</h1>
    <hr class="v2-rule v2-reveal v2-delay-2" />
    <p class="v2-lead v2-reveal v2-delay-2" style="max-width:620px;">${subheadline}</p>
    <div class="v2-grid-2 v2-reveal v2-delay-3" style="align-items:start;gap:24px;">
      <div class="v2-video-outer" style="margin:0;"><div style="min-height:480px;background:#0b0b0f;">${calBlock}</div></div>
      <div class="v2-card"><p class="v2-tag">${recapHeadline}</p>${recapHtml}</div>
    </div>
    <p class="v2-reveal" style="margin-top:48px;font-size:0.7rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(245,241,234,0.25);">&copy; ${businessName} · ${footer}</p>
  </div>
</section>
${REVEAL}`;

  return [
    { name: 'bv1_calendar_css', html: css },
    { name: 'bv1_calendar_main', html: main },
  ];
}
