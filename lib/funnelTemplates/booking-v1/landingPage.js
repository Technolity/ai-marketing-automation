/**
 * Coded Funnel — Design "booking-v1" — Appointment Booking LANDING / VSL Page (SEGMENTS).
 *
 * Editorial dark VSL modelled on the jda-vsl-v2 reference: Playfair Display + Lato, chapter
 * numbers, marquees, alternating bands, gold/red accents — all driven by the user's 3 brand
 * colors (see v2theme.js). Content is 100% from the existing vault funnelCopy.salesPage
 * (via funnelCopyMapper). Fully responsive (the v2 CSS @media blocks are preserved).
 *
 * GHL split: ONE `bv1_landing_css` segment (the v2 stylesheet) + SIX HTML chunks
 * (`bv1_landing_1..6`) — exactly one CSS value + six code elements in GHL. assembleSegments()
 * re-wraps the CSS in <style> for local preview.
 *
 * Self-contained HTML fragments + minify-safe inline JS (semicolons, no line comments).
 * Hero video: media.videoUrl → <video> if a file, <iframe> if an embed URL, else the live
 * `{{custom_values.appt_vsl_embed}}` tag.
 */

import { safeText, mergeTag } from '../escape.js';
import { v2Css } from './v2theme.js';

/** Live, user-controlled custom value used ONLY when no hero video URL is in the vault. */
export const VSL_EMBED_KEY = 'appt_vsl_embed';

const FALLBACK = {
  primary: '#C41E2A', secondary: '#1e1b4b', accent: '#D4A84B', businessName: 'Your Business',
  eyebrow: 'Free Strategy Session',
  hero_headline: 'Book the call that finally gets you unstuck',
  hero_subheadline: 'Watch the short presentation, then book a private 30-minute working session where we map your exact next move — no fluff, no pitch.',
  hero_cta_text: 'Book Your Private Strategy Call', hero_below_cta: 'Limited Spots · No Obligation · No Cost',
  process_headline: 'The system behind the results',
  process_subheadline: 'A simple, repeatable path from stuck to a clear plan.',
  steps: [
    { title: 'Diagnose the real constraint', text: 'We pinpoint the single biggest thing holding your growth back right now.' },
    { title: 'Map the prioritised plan', text: 'You get a clear path — the few moves that actually matter, in order.' },
    { title: 'Take decisive action', text: 'Leave with concrete next steps you can run this week, with or without us.' },
  ],
  how_headline: 'Here’s how it works',
  how_points: ['Book a time that suits you.', 'Hop on a focused 30-minute call.', 'Leave with a clear action plan.'],
  this_is_for_headline: 'This Is For You If…',
  audience_for: ['You’re serious about growth and ready to act.', 'You want a clear plan, not more theory.', 'You value expert eyes on your situation.'],
  audience_not: ['People looking for free advice with no intent to act.', 'Anyone expecting overnight magic.', 'Those unwilling to implement the plan.'],
  call_headline: 'What To Expect On The Call',
  call_is_headline: 'This call is',
  call_is: ['A focused working session.', 'Tailored to your situation.', 'Honest and practical.', 'A real plan you keep either way.'],
  call_not_headline: 'This call is not',
  call_not: ['A disguised sales pitch.', 'Generic, scripted advice.', 'A waste of your time.'],
  bio_headline: 'Meet Your Guide',
  bio_text: 'A decade in the trenches building offers, funnels, and teams that actually convert. No theory — just what’s working right now, distilled into a plan you can use the same week.',
  bio_name: 'Your Host', bio_role: 'Founder & Lead Strategist',
  testimonials_headline: 'Real Results From Real People',
  testimonials_sub: 'A few words from clients who took the call.',
  testimonials: [
    { headline: 'Booked 11 calls in 14 days', quote: 'I came in stuck and left with a plan I could run the same week.' },
    { headline: 'Doubled qualified leads', quote: 'Worth more than programs I’ve paid five figures for.' },
    { headline: '3x pipeline in a quarter', quote: 'The clarity alone was the unlock for our whole team.' },
    { headline: 'From overwhelmed to clear', quote: 'I finally know exactly what to focus on next.' },
  ],
  faq_headline: 'Frequently Asked Questions',
  faq: [
    { q: 'How long is the call?', a: 'About 30 minutes — enough for real clarity without eating your day.' },
    { q: 'Is it actually free?', a: 'Yes. No cost, no obligation. If it’s a fit we’ll talk next steps; if not, you still leave with a plan.' },
    { q: 'Will I get pitched?', a: 'No hard pitch. The call earns its place on value. An offer only comes up if you ask.' },
  ],
  final_headline: 'Book a Private Strategy Call Below',
  final_subheadline: 'On that call, we’ll look at where you are, identify your best opportunity, and map out exactly how this works for you.',
  final_subtext: 'Free · No Obligation · Limited Spots Available',
  footer_text: 'All rights reserved.',
};

function buildJsonLd(businessNameRaw, faqRaw) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Service', name: `Free Strategy Call with ${businessNameRaw}`, provider: { '@type': 'Organization', name: businessNameRaw } },
      { '@type': 'FAQPage', mainEntity: faqRaw.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(graph).replace(/<\//g, '<\\/')}</script>`;
}

const marquee = (items) => {
  const set = items.map((x) => `<span class="v2-marquee-item">${safeText(x)} <span>✦</span></span>`).join('');
  return `<div class="v2-marquee-wrap"><div class="v2-marquee-track">${set}${set}</div></div>`;
};
const checkList = (items) => `<ul class="v2-list v2-list--check">${items.map((x) => `<li>${safeText(x)}</li>`).join('')}</ul>`;
const crossList = (items) => `<ul class="v2-list v2-list--cross">${items.map((x) => `<li>${safeText(x)}</li>`).join('')}</ul>`;
const stepRows = (items) => items.map((s, i) => `<div class="v2-step"><span class="v2-step-num">${String(i + 1).padStart(2, '0')}</span><div><p class="v2-step-title">${safeText(s.title || '')}</p><p class="v2-step-desc">${safeText(s.text || '')}</p></div></div>`).join('');

export function renderLandingSegments(data = {}) {
  const brand = data.brand || {};
  const copy = data.copy || {};
  const media = data.media || {};

  const primary = brand.primary || FALLBACK.primary;
  const secondary = brand.secondary || FALLBACK.secondary;
  const accent = brand.accent || FALLBACK.accent;
  const businessNameRaw = brand.businessName || FALLBACK.businessName;
  const businessName = safeText(businessNameRaw);

  const t = (v, fb) => safeText(v === undefined ? fb : v);
  const arr = (v, fb) => (Array.isArray(v) && v.length ? v : fb);

  const eyebrow = t(copy.eyebrow, FALLBACK.eyebrow);
  const heroHeadline = t(copy.hero_headline, FALLBACK.hero_headline);
  const heroSub = t(copy.hero_subheadline, FALLBACK.hero_subheadline);
  const heroCta = t(copy.hero_cta_text, FALLBACK.hero_cta_text);
  const heroBelow = t(copy.hero_below_cta, FALLBACK.hero_below_cta);
  const videoUrl = media.videoUrl ? safeText(media.videoUrl) : '';
  const bioPhotoUrl = media.bioPhotoUrl ? safeText(media.bioPhotoUrl) : '';
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  const steps = arr(copy.steps, FALLBACK.steps);
  const howPoints = arr(copy.how_points, FALLBACK.how_points);
  const audFor = arr(copy.audience_for, FALLBACK.audience_for);
  const audNot = arr(copy.audience_not, FALLBACK.audience_not);
  const callIs = arr(copy.call_is, FALLBACK.call_is);
  const callNot = arr(copy.call_not, FALLBACK.call_not);
  const testimonials = arr(copy.testimonials, FALLBACK.testimonials);
  const faqRaw = arr(copy.faq, FALLBACK.faq);

  const bioParas = String(copy.bio_text === undefined ? FALLBACK.bio_text : copy.bio_text)
    .split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p class="v2-body">${safeText(p)}</p>`).join('');

  const isFile = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(videoUrl);
  let heroMedia;
  if (!videoUrl) heroMedia = mergeTag(VSL_EMBED_KEY);
  else if (isFile) heroMedia = `<video src="${videoUrl}" playsinline muted loop autoplay></video>`;
  else heroMedia = `<iframe src="${videoUrl}" title="${heroHeadline}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;

  const css = v2Css({ primary, secondary, accent });

  // ── Chunk 1 · HERO (sticky logo header + marquee + hero) ────────
  const header = `<header class="v2-header"><div class="v2-header-in"><span class="v2-brandmark">${logoUrl ? `<img class="v2-logo" src="${logoUrl}" alt="${businessName}" />` : `<span class="v2-logo-txt">${businessName}</span>`}</span><a href="#book" class="v2-btn v2-btn--inv v2-header-cta"><span>${heroCta}</span></a></div></header>`;
  const s1 = `${header}
${marquee([businessNameRaw, eyebrow, heroCta, businessNameRaw])}
<section class="v2-section v2-dark" id="v2-hero">`;
  const s1tail = `
  <div class="v2-chapter">01</div>
  <div class="v2-wrap v2-wrap--fat">
    <div class="v2-reveal v2-delay-1"><span class="v2-tag">${eyebrow}</span></div>
    <h1 class="v2-h1 v2-reveal v2-delay-2">${heroHeadline}</h1>
    <hr class="v2-rule v2-reveal v2-delay-3" />
    <p class="v2-lead v2-reveal v2-delay-3" style="max-width:640px;">${heroSub}</p>
    <div class="v2-reveal v2-delay-4"><div class="v2-video-outer"><div class="v2-video-inner">${heroMedia}</div><div class="v2-video-cap">Watch the full presentation before booking your call</div></div></div>
    <div class="v2-btn-wrap v2-btn-wrap--center v2-reveal v2-delay-5"><a href="#book" class="v2-btn v2-btn--inv v2-btn-pulse"><span>${heroCta}</span></a><span class="v2-btn-note">${heroBelow}</span></div>
  </div>
</section>`;

  // ── Chunk 2 · WHO THIS IS FOR + WHAT TO EXPECT ──────────────────
  const s2 = `<section class="v2-section v2-light" id="v2-who">
  <div class="v2-chapter">02</div>
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-kicker">Who This Is For</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1">${t(copy.this_is_for_headline, FALLBACK.this_is_for_headline)}</h2>
    <hr class="v2-rule v2-reveal v2-delay-2" />
    <div class="v2-reveal v2-delay-2">${checkList(audFor)}</div>
  </div>
</section>
${marquee([t(copy.call_headline, FALLBACK.call_headline), 'No Pressure', 'Just Clarity', 'A Real Plan'])}
<section class="v2-section v2-dark" id="v2-expect">
  <div class="v2-chapter">03</div>
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-kicker">The Call</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1">${t(copy.call_headline, FALLBACK.call_headline)}</h2>
    <hr class="v2-rule v2-reveal v2-delay-1" />
    <div class="v2-grid-2 v2-reveal v2-delay-2">
      <div class="v2-card"><p class="v2-tag">${t(copy.call_is_headline, FALLBACK.call_is_headline)}</p>${checkList(callIs)}</div>
      <div class="v2-card"><p class="v2-tag">${t(copy.call_not_headline, FALLBACK.call_not_headline)}</p>${crossList(callNot)}</div>
    </div>
  </div>
</section>`;

  // ── Chunk 3 · THE METHOD ────────────────────────────────────────
  const s3 = `<section class="v2-section v2-off" id="v2-method">
  <div class="v2-chapter">04</div>
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-kicker">The Method</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1">${t(copy.process_headline, FALLBACK.process_headline)}</h2>
    <p class="v2-lead v2-reveal v2-delay-1">${t(copy.process_subheadline, FALLBACK.process_subheadline)}</p>
    <hr class="v2-rule v2-reveal v2-delay-2" />
    <div class="v2-reveal v2-delay-2">${stepRows(steps)}</div>
    <hr class="v2-rule--full" />
    <div class="v2-reveal"><span class="v2-kicker">How It Works</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1">${t(copy.how_headline, FALLBACK.how_headline)}</h2>
    <div class="v2-reveal v2-delay-2" style="margin-top:24px;">${checkList(howPoints)}</div>
  </div>
</section>`;

  // ── Chunk 4 · PROOF / TESTIMONIALS ──────────────────────────────
  const s4 = `<section class="v2-section v2-dark" id="v2-proof">
  <div class="v2-chapter">05</div>
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-kicker">Testimonials</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1">${t(copy.testimonials_headline, FALLBACK.testimonials_headline)}</h2>
    <p class="v2-lead v2-reveal v2-delay-1">${t(copy.testimonials_sub, FALLBACK.testimonials_sub)}</p>
    <hr class="v2-rule v2-reveal v2-delay-2" />
    <div class="v2-grid-2 v2-reveal v2-delay-2">
      ${testimonials.map((q) => `<div class="v2-proof"><span class="v2-proof-role">${safeText(q.headline || 'Client')}</span><p class="v2-proof-text">${safeText(q.quote || '')}</p></div>`).join('')}
    </div>
  </div>
</section>`;

  // ── Chunk 5 · ABOUT + FAQ ───────────────────────────────────────
  const bioPhoto = bioPhotoUrl
    ? `<div class="v2-video-outer" style="margin:0;"><div style="aspect-ratio:4/5;"><img src="${bioPhotoUrl}" alt="${t(copy.bio_name, FALLBACK.bio_name)}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" /></div></div>`
    : '';
  const s5 = `<section class="v2-section v2-light" id="v2-bio">
  <div class="v2-chapter">06</div>
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-kicker">Your Guide</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1">${t(copy.bio_headline, FALLBACK.bio_headline)}</h2>
    <hr class="v2-rule v2-reveal v2-delay-2" />
    <div class="v2-grid-2 v2-reveal v2-delay-2" style="align-items:center;">
      <div>${bioPhoto}</div>
      <div>${bioParas}<p class="v2-body" style="margin-top:8px;"><strong>${t(copy.bio_name, FALLBACK.bio_name)}</strong> — ${t(copy.bio_role, FALLBACK.bio_role)}</p></div>
    </div>
  </div>
</section>
<section class="v2-section v2-off" id="v2-faq">
  <div class="v2-chapter">07</div>
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-kicker">Questions</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1">${t(copy.faq_headline, FALLBACK.faq_headline)}</h2>
    <hr class="v2-rule v2-reveal v2-delay-2" />
    <div class="v2-reveal v2-delay-2">${faqRaw.map((f) => `<div class="v2-step"><span class="v2-step-num">Q</span><div><p class="v2-step-title">${safeText(f.q || '')}</p><p class="v2-step-desc">${safeText(f.a || '')}</p></div></div>`).join('')}</div>
  </div>
</section>`;

  // ── Chunk 6 · CTA + NOT-FOR + CLOSE (+ reveal script) ───────────
  const outcomes = callIs.slice(0, 4).map((x) => `<div class="v2-card v2-card--dark" style="padding:24px;display:flex;align-items:flex-start;gap:16px;"><span style="color:var(--v2-gold-on-dark);font-family:var(--v2-ff-display);font-style:italic;flex-shrink:0;">→</span><p class="v2-body" style="margin:0;font-size:0.95rem;">${safeText(x)}</p></div>`).join('');
  const s6 = `<section class="v2-section v2-dark" id="book">
  <div class="v2-chapter">08</div>
  <div class="v2-wrap" style="text-align:center;">
    <div class="v2-reveal"><span class="v2-kicker" style="text-align:center;">Ready to Explore This?</span></div>
    <h2 class="v2-h2 v2-reveal v2-delay-1" style="max-width:640px;margin-left:auto;margin-right:auto;">${t(copy.final_headline, FALLBACK.final_headline)}</h2>
    <hr class="v2-rule v2-rule--center v2-reveal v2-delay-2" />
    <p class="v2-lead v2-reveal v2-delay-2" style="max-width:520px;margin-left:auto;margin-right:auto;text-align:center;">${t(copy.final_subheadline, FALLBACK.final_subheadline)}</p>
    <div class="v2-grid-2 v2-reveal v2-delay-3" style="max-width:680px;margin:40px auto;text-align:left;gap:16px;">${outcomes}</div>
    <div class="v2-btn-wrap v2-btn-wrap--center v2-reveal v2-delay-4"><a href="#book" class="v2-btn v2-btn--inv v2-btn-pulse"><span>${heroCta}</span></a><span class="v2-btn-note">${t(copy.final_subtext, FALLBACK.final_subtext)}</span></div>
  </div>
</section>
<section class="v2-section v2-light" id="v2-not-for">
  <div class="v2-chapter">09</div>
  <div class="v2-wrap">
    <div class="v2-reveal"><span class="v2-kicker">A Word of Honesty</span></div>
    <h3 class="v2-h3 v2-reveal v2-delay-1">This Is <em>Not</em> For:</h3>
    <hr class="v2-rule v2-reveal v2-delay-2" />
    <div class="v2-reveal v2-delay-2">${crossList(audNot)}</div>
  </div>
</section>
<section class="v2-section v2-dark" id="v2-close">
  <div class="v2-wrap v2-wrap--fat" style="text-align:center;">
    <div class="v2-reveal v2-delay-1" style="margin-bottom:40px;"><p style="font-family:var(--v2-ff-display);font-size:clamp(1.6rem,4vw,2.8rem);font-weight:900;font-style:italic;color:var(--v2-cream-on-dark);line-height:1.15;margin:0;">${t(copy.final_subtext, FALLBACK.final_subtext)}</p></div>
    <div class="v2-btn-wrap v2-btn-wrap--center v2-reveal v2-delay-2"><a href="#book" class="v2-btn v2-btn--inv v2-btn-pulse"><span>${heroCta}</span></a></div>
    <p class="v2-reveal v2-delay-3" style="margin-top:48px;font-size:0.7rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(245,241,234,0.25);">&copy; ${businessName} · ${t(copy.footer_text, FALLBACK.footer_text)}</p>
  </div>
</section>
${buildJsonLd(businessNameRaw, faqRaw)}
<script>
(function(){
  var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('v2-in');io.unobserve(e.target);}});},{threshold:0.1});
  document.querySelectorAll('#v2-hero .v2-reveal').forEach(function(el){el.classList.add('v2-in');});
  document.querySelectorAll('.v2-reveal').forEach(function(el){io.observe(el);});
})();
</script>`;

  return [
    { name: 'bv1_landing_css', html: css },
    { name: 'bv1_landing_1', html: s1 + s1tail },
    { name: 'bv1_landing_2', html: s2 },
    { name: 'bv1_landing_3', html: s3 },
    { name: 'bv1_landing_4', html: s4 },
    { name: 'bv1_landing_5', html: s5 },
    { name: 'bv1_landing_6', html: s6 },
  ];
}
