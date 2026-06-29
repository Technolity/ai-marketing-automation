/**
 * Coded Funnel — Design "booking-v1" — V2 EDITORIAL STYLESHEET (from jda-vsl-v2.css).
 *
 * The reference VSL stylesheet, adapted so its fixed palette is driven by the user's
 * 3 brand colors at bake time. Mapping (the page is a forced-dark editorial theme):
 *   --v2-gold / --v2-gold-on-dark  ← brand PRIMARY  (dominant accent: rules, em, tags,
 *                                     markers, buttons, card borders, step hover, stats)
 *   --v2-red                       ← brand ACCENT   (secondary pop + negative/path-bad)
 *   --v2-jet / --v2-jet-card       ← near-black tinted with brand SECONDARY (bg depth)
 * Fonts kept as the reference intends: Playfair Display (display) + Lato (body), via @import.
 *
 * Returned as a RAW stylesheet string (no <style>) → goes into GHL's CSS custom value.
 * `.v2-` prefix avoids GHL class conflicts. Responsive @media blocks preserved verbatim.
 */

import { mix, contrastColor, readableText } from './contrast.js';

export function v2Css({ primary = '#C41E2A', secondary = '#1e1b4b', accent = '#D4A84B' } = {}) {
  // CONTRAST-SAFE palette. The page is dark, so brand colors are lightened until they read,
  // and the CTA text is auto-picked to contrast the CTA background (never dark-on-dark).
  const bg = mix(secondary, '#0b0b0f', 0.78); // matches the --v2-jet color-mix below
  const domAccent = contrastColor(primary, bg, 4.5); // dominant accent: rules, em, tags, markers, CTA
  const popAccent = contrastColor(accent, bg, 4.5);   // secondary pop
  const ctaText = readableText(domAccent);            // text that contrasts the CTA background
  return `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700;1,900&family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap');
:root {
  --brand-primary: ${primary}; --brand-secondary: ${secondary}; --brand-accent: ${accent};
  --v2-cream: #F5F1EA; --v2-cream-deep: #EDE8DF;
  --v2-ink: #0D0C0A; --v2-ink-90: rgba(13,12,10,0.90); --v2-ink-60: rgba(13,12,10,0.60); --v2-ink-30: rgba(13,12,10,0.30); --v2-ink-08: rgba(13,12,10,0.08);
  --v2-jet: color-mix(in srgb, ${secondary} 22%, #0b0b0f);
  --v2-jet-card: color-mix(in srgb, ${secondary} 26%, #15151b);
  --v2-red: ${popAccent};
  --v2-red-dim: color-mix(in srgb, ${popAccent} 14%, transparent);
  --v2-gold: ${domAccent};
  --v2-gold-on-dark: ${domAccent};
  --v2-cta-bg: ${domAccent};
  --v2-cta-text: ${ctaText};
  --v2-cream-on-dark: #F5F1EA; --v2-muted-on-dark: rgba(245,241,234,0.55);
  --v2-ff-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --v2-ff-body: 'Lato', 'Helvetica Neue', Arial, sans-serif;
  --v2-max-w: 960px; --v2-pad-x: 40px; --v2-pad-y: 96px;
  --v2-ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
html, body { margin: 0; padding: 0; background: var(--v2-jet); color: var(--v2-cream-on-dark); }
.v2-section, .v2-section * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
.v2-section { width: 100%; position: relative; overflow: hidden; font-family: var(--v2-ff-body); }
.v2-wrap { max-width: var(--v2-max-w); margin: 0 auto; padding: var(--v2-pad-y) var(--v2-pad-x); position: relative; z-index: 1; }
.v2-wrap--slim { padding-top: 72px; padding-bottom: 72px; }
.v2-wrap--fat { padding-top: 120px; padding-bottom: 120px; }
.v2-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--v2-jet) 90%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid color-mix(in srgb, var(--v2-gold-on-dark) 22%, rgba(245,241,234,0.07)); }
.v2-header-in { max-width: var(--v2-max-w); margin: 0 auto; padding: 12px var(--v2-pad-x); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.v2-brandmark { display: flex; align-items: center; min-width: 0; }
.v2-logo { height: 40px; width: auto; max-width: 200px; object-fit: contain; display: block; }
.v2-logo-txt { font-family: var(--v2-ff-display); font-weight: 900; font-size: 1.15rem; letter-spacing: -0.01em; color: var(--v2-cream-on-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v2-header-cta { font-size: 0.74rem; padding: 11px 20px; flex-shrink: 0; }
@media (max-width: 580px) { .v2-logo { height: 32px; max-width: 150px; } .v2-header-cta { display: none; } }
.v2-light { background-color: var(--v2-cream); }
.v2-lighter { background-color: #FFFFFF; }
.v2-off { background-color: var(--v2-cream-deep); }
.v2-dark { background-color: var(--v2-jet); }
.v2-section::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 200px 200px; }
.v2-kicker { font-family: var(--v2-ff-body); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--v2-ink-60); display: block; margin-bottom: 18px; }
.v2-h1 { font-family: var(--v2-ff-display); font-size: clamp(2.4rem, 6vw, 4.4rem); font-weight: 900; line-height: 1.08; letter-spacing: -0.02em; color: var(--v2-ink); margin: 0 0 24px; }
.v2-h1 em, .v2-h2 em, .v2-h3 em { font-style: italic; color: var(--v2-red); }
.v2-h2 { font-family: var(--v2-ff-display); font-size: clamp(1.8rem, 4vw, 3.2rem); font-weight: 700; line-height: 1.12; letter-spacing: -0.015em; color: var(--v2-ink); margin: 0 0 20px; }
.v2-h3 { font-family: var(--v2-ff-display); font-size: clamp(1.2rem, 2.5vw, 1.8rem); font-weight: 600; line-height: 1.25; letter-spacing: -0.01em; color: var(--v2-ink); margin: 0 0 12px; }
.v2-lead { font-family: var(--v2-ff-body); font-size: clamp(1.05rem, 2vw, 1.22rem); font-weight: 300; line-height: 1.75; color: var(--v2-ink-60); margin: 0 0 32px; }
.v2-body { font-family: var(--v2-ff-body); font-size: 1rem; font-weight: 400; line-height: 1.75; color: var(--v2-ink-60); margin: 0 0 16px; }
.v2-body strong { color: var(--v2-ink); font-weight: 700; }
.v2-rule { width: 48px; height: 3px; background: var(--v2-red); margin: 0 0 32px; border: none; display: block; }
.v2-rule--center { margin-left: auto; margin-right: auto; }
.v2-rule--full { width: 100%; height: 1px; background: var(--v2-ink-08); margin: 56px 0; }
.v2-pullquote { font-family: var(--v2-ff-display); font-size: clamp(1.5rem, 3.5vw, 2.4rem); font-weight: 400; font-style: italic; line-height: 1.35; color: var(--v2-ink); border-left: 4px solid var(--v2-red); padding: 24px 0 24px 36px; margin: 48px 0; }
.v2-chapter { position: absolute; top: -20px; right: var(--v2-pad-x); font-family: var(--v2-ff-display); font-size: clamp(6rem, 18vw, 14rem); font-weight: 900; line-height: 1; pointer-events: none; user-select: none; z-index: 0; }
.v2-btn { display: inline-block; font-family: var(--v2-ff-body); font-size: 0.95rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; cursor: pointer; border: none; position: relative; overflow: hidden; transition: transform 0.28s var(--v2-ease), box-shadow 0.28s var(--v2-ease); }
.v2-btn--primary { background: var(--v2-ink); color: var(--v2-cream); padding: 20px 52px; }
.v2-btn--primary::after { content: ''; position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: var(--v2-red); transform: translateX(-101%); transition: transform 0.38s var(--v2-ease); }
.v2-btn--primary:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(13,12,10,0.25); color: var(--v2-cream); text-decoration: none; }
.v2-btn--primary:hover::after { transform: translateX(0); }
.v2-btn--primary span { position: relative; z-index: 1; }
.v2-btn--inv { background: var(--v2-cta-bg); color: var(--v2-cta-text); padding: 20px 52px; }
.v2-btn--inv::after { display: none; }
.v2-btn--inv:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.4); color: var(--v2-cta-text); text-decoration: none; }
.v2-btn--inv:hover::after { transform: translateX(0); }
.v2-btn--inv span { position: relative; z-index: 1; }
.v2-btn-pulse { animation: v2Pulse 3s ease-in-out infinite; }
@keyframes v2Pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--v2-gold-on-dark) 0%, transparent); } 50% { box-shadow: 0 0 0 10px color-mix(in srgb, var(--v2-gold-on-dark) 16%, transparent); } }
.v2-btn-wrap { margin-top: 48px; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
.v2-btn-wrap--center { align-items: center; text-align: center; }
.v2-btn-note { font-size: 0.76rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--v2-ink-30); }
.v2-list { list-style: none; padding: 0; margin: 0 0 32px; }
.v2-list li { font-family: var(--v2-ff-body); font-size: 1.05rem; font-weight: 400; line-height: 1.6; color: var(--v2-ink-60); padding: 13px 0 13px 32px; border-bottom: 1px solid var(--v2-ink-08); position: relative; }
.v2-list li:first-child { border-top: 1px solid var(--v2-ink-08); }
.v2-list li strong { color: var(--v2-ink); }
.v2-list--check li::before { content: ''; position: absolute; left: 0; top: 18px; width: 14px; height: 14px; border: 2px solid var(--v2-gold-on-dark); }
.v2-list--check li::after { content: ''; position: absolute; left: 4px; top: 21px; width: 6px; height: 3px; border-left: 2px solid var(--v2-gold-on-dark); border-bottom: 2px solid var(--v2-gold-on-dark); transform: rotate(-45deg); }
.v2-list--arrow li::before { content: '→'; position: absolute; left: 0; top: 13px; color: var(--v2-gold-on-dark); font-size: 0.9rem; }
.v2-list--cross li::before { content: '×'; position: absolute; left: 2px; top: 10px; color: #888; font-size: 1.2rem; line-height: 1.3; }
.v2-card { background: #FFFFFF; border: 1px solid var(--v2-ink-08); padding: 32px; position: relative; transition: transform 0.3s var(--v2-ease), box-shadow 0.3s var(--v2-ease); }
.v2-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--v2-red); transform: scaleX(0); transform-origin: left; transition: transform 0.35s var(--v2-ease); }
.v2-card:hover { transform: translateY(-5px); box-shadow: 0 24px 64px rgba(13,12,10,0.12); }
.v2-card:hover::before { transform: scaleX(1); }
.v2-card--dark { background: rgba(255,255,255,0.04); border: 1px solid rgba(245,241,234,0.1); }
.v2-card--dark::before { background: var(--v2-gold-on-dark); }
.v2-step { display: flex; gap: 28px; align-items: flex-start; padding: 28px 0; border-bottom: 1px solid var(--v2-ink-08); transition: background 0.25s ease; }
.v2-step:last-child { border-bottom: none; }
.v2-step:hover { padding-left: 8px; }
.v2-step-num { font-family: var(--v2-ff-display); font-size: 1.6rem; font-weight: 900; color: var(--v2-ink-08); min-width: 40px; line-height: 1.3; transition: color 0.25s ease; }
.v2-step:hover .v2-step-num { color: var(--v2-red); }
.v2-step-title { font-family: var(--v2-ff-body); font-size: 1.05rem; font-weight: 700; color: var(--v2-ink); margin-bottom: 4px; }
.v2-step-desc { font-size: 0.92rem; color: var(--v2-ink-60); line-height: 1.6; margin: 0; }
.v2-stat { padding: 40px 32px; border-top: 3px solid var(--v2-red); background: var(--v2-cream-deep); transition: transform 0.28s var(--v2-ease); }
.v2-stat:hover { transform: translateY(-4px); }
.v2-stat-figure { font-family: var(--v2-ff-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 900; color: var(--v2-ink); line-height: 1; margin-bottom: 8px; }
.v2-stat-label { font-size: 0.82rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--v2-ink-60); }
.v2-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.v2-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.v2-tag { display: inline-block; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: var(--v2-red); border: 1.5px solid var(--v2-red); padding: 4px 12px; margin-bottom: 20px; }
.v2-video-outer { background: var(--v2-jet); padding: 8px; margin: 40px 0; box-shadow: 0 40px 100px rgba(13,12,10,0.22); }
.v2-video-inner { position: relative; width: 100%; padding-bottom: 56.25%; background: #000; overflow: hidden; }
.v2-video-inner iframe, .v2-video-inner video { position: absolute; inset: 0; width: 100%; height: 100%; border: none; object-fit: cover; }
.v2-video-cap { padding: 14px 16px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(245,241,234,0.35); text-align: center; }
.v2-path-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin: 40px 0; }
.v2-path-cell { padding: 36px 32px; transition: transform 0.25s var(--v2-ease); }
.v2-path-cell:hover { transform: scale(1.015); }
.v2-path-label { font-size: 0.7rem; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: var(--v2-ink-30); margin-bottom: 10px; }
.v2-path-text { font-family: var(--v2-ff-display); font-size: clamp(1.1rem, 2.5vw, 1.6rem); font-weight: 700; font-style: italic; color: var(--v2-ink); line-height: 1.25; margin: 0; }
.v2-identity { margin: 32px 0; }
.v2-identity-line { display: flex; align-items: baseline; gap: 20px; padding: 20px 0; border-bottom: 1px solid var(--v2-ink-08); transition: padding-left 0.25s var(--v2-ease); cursor: default; }
.v2-identity-line:last-child { border-bottom: none; }
.v2-identity-line:hover { padding-left: 10px; }
.v2-identity-marker { font-family: var(--v2-ff-display); font-size: 0.95rem; font-weight: 900; font-style: italic; color: var(--v2-red); flex-shrink: 0; min-width: 20px; }
.v2-identity-txt { font-family: var(--v2-ff-body); font-size: clamp(1rem, 2vw, 1.18rem); font-weight: 400; color: var(--v2-ink-60); line-height: 1.45; }
.v2-identity-txt strong { color: var(--v2-ink); font-weight: 700; }
.v2-proof { padding: 36px; background: #FFFFFF; border-top: 4px solid var(--v2-ink); position: relative; transition: transform 0.28s var(--v2-ease), box-shadow 0.28s var(--v2-ease); }
.v2-proof:hover { transform: translateY(-5px); box-shadow: 0 20px 60px rgba(13,12,10,0.1); }
.v2-proof-role { font-size: 0.7rem; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: var(--v2-red); margin-bottom: 14px; display: block; }
.v2-proof-text { font-family: var(--v2-ff-display); font-size: 1.1rem; font-style: italic; line-height: 1.55; color: var(--v2-ink); margin: 0; }
.v2-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
.v2-reveal.v2-in { opacity: 1; transform: translateY(0); }
.v2-delay-1 { transition-delay: 0.10s; } .v2-delay-2 { transition-delay: 0.20s; } .v2-delay-3 { transition-delay: 0.32s; } .v2-delay-4 { transition-delay: 0.45s; } .v2-delay-5 { transition-delay: 0.58s; }
.v2-marquee-wrap { width: 100%; overflow: hidden; background: var(--v2-ink); padding: 20px 0; }
.v2-marquee-track { display: flex; gap: 0; animation: v2Marquee 22s linear infinite; white-space: nowrap; }
.v2-marquee-item { font-family: var(--v2-ff-display); font-size: 1rem; font-weight: 900; font-style: italic; color: rgba(245,241,234,0.25); padding: 0 40px; flex-shrink: 0; }
.v2-marquee-item span { color: var(--v2-gold-on-dark); margin-right: 40px; }
@keyframes v2Marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (max-width: 900px) {
  :root { --v2-pad-x: 28px; --v2-pad-y: 80px; }
  .v2-grid-2, .v2-grid-3, .v2-path-row { grid-template-columns: 1fr; }
  .v2-path-row { gap: 0; }
  .v2-path-cell { padding: 28px 24px; }
  .v2-chapter { font-size: clamp(5rem, 20vw, 9rem); right: 16px; }
}
@media (max-width: 580px) {
  :root { --v2-pad-x: 20px; --v2-pad-y: 64px; }
  .v2-btn--primary, .v2-btn--inv { display: block; width: 100%; text-align: center; padding: 18px 24px; }
  .v2-btn-wrap { align-items: stretch; }
  .v2-btn-wrap--center { align-items: center; }
  .v2-pullquote { padding-left: 20px; }
  .v2-proof { padding: 24px 20px; }
  .v2-card { padding: 24px 20px; }
  .v2-stat { padding: 28px 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .v2-reveal { opacity: 1; transform: none; transition: none; }
  .v2-marquee-track, .v2-btn-pulse { animation: none; }
}
/* ── UNIFIED DARK THEME: all sections jet black, brand-accented ── */
.v2-section, .v2-section.v2-lighter { background-color: var(--v2-jet); }
.v2-section.v2-dark { background-color: var(--v2-jet); }
.v2-section.v2-light { background-color: color-mix(in srgb, var(--brand-primary) 8%, var(--v2-jet)); }
.v2-section.v2-off { background-color: color-mix(in srgb, var(--brand-secondary) 18%, var(--v2-jet)); }
.v2-kicker { color: var(--v2-muted-on-dark); }
.v2-h1, .v2-h2, .v2-h3 { color: var(--v2-cream-on-dark); }
.v2-h1 em, .v2-h2 em, .v2-h3 em { color: var(--v2-gold-on-dark); }
.v2-lead, .v2-body { color: var(--v2-muted-on-dark); }
.v2-body strong { color: var(--v2-cream-on-dark); }
.v2-pullquote { color: var(--v2-cream-on-dark); border-left-color: var(--v2-gold-on-dark); background: transparent; }
.v2-rule { background: var(--v2-gold-on-dark); }
.v2-rule--full { background: rgba(245,241,234,0.08); }
.v2-tag { color: var(--v2-gold-on-dark); border-color: var(--v2-gold-on-dark); }
.v2-card { background: rgba(255,255,255,0.05); border-color: rgba(245,241,234,0.09); }
.v2-card::before { background: var(--v2-gold-on-dark); }
.v2-card:hover { border-color: color-mix(in srgb, var(--v2-gold-on-dark) 38%, transparent); box-shadow: 0 24px 64px rgba(0,0,0,0.45); }
.v2-card .v2-h3 { color: var(--v2-cream-on-dark); }
.v2-card .v2-body { color: var(--v2-muted-on-dark); }
.v2-proof { background: rgba(255,255,255,0.04); border-top: 4px solid var(--v2-gold-on-dark); }
.v2-proof-role { color: var(--v2-gold-on-dark); }
.v2-proof-text { color: var(--v2-cream-on-dark); }
.v2-stat { background: rgba(255,255,255,0.04); border: none; border-top: 3px solid var(--v2-gold-on-dark); }
.v2-stat-figure { color: var(--v2-gold-on-dark); }
.v2-stat-label { color: var(--v2-muted-on-dark); }
.v2-step { border-bottom-color: rgba(245,241,234,0.07); }
.v2-step-num { color: rgba(245,241,234,0.1); }
.v2-step:hover .v2-step-num { color: var(--v2-gold-on-dark); }
.v2-step-title { color: var(--v2-cream-on-dark); }
.v2-step-desc { color: var(--v2-muted-on-dark); }
.v2-list li { color: var(--v2-muted-on-dark); border-bottom-color: rgba(245,241,234,0.07); }
.v2-list li:first-child { border-top-color: rgba(245,241,234,0.07); }
.v2-list li strong { color: var(--v2-cream-on-dark); }
.v2-list--arrow li::before { color: var(--v2-gold-on-dark); }
.v2-path-cell--bad { background: color-mix(in srgb, var(--v2-red) 12%, transparent); border-left: 4px solid color-mix(in srgb, var(--v2-red) 50%, transparent); }
.v2-path-cell--good { background: color-mix(in srgb, var(--v2-gold-on-dark) 12%, transparent); border-left: 4px solid var(--v2-gold-on-dark); }
.v2-path-text { color: var(--v2-cream-on-dark); }
.v2-path-cell--bad .v2-path-text { color: color-mix(in srgb, var(--v2-red) 90%, white); }
.v2-path-cell--good .v2-path-text { color: var(--v2-gold-on-dark); }
.v2-path-label { color: rgba(245,241,234,0.35); }
.v2-path-cell--good .v2-path-label { color: var(--v2-gold-on-dark); }
.v2-identity-line { border-bottom-color: rgba(245,241,234,0.07); }
.v2-identity-marker { color: var(--v2-gold-on-dark); }
.v2-identity-txt { color: var(--v2-muted-on-dark); }
.v2-identity-txt strong { color: var(--v2-cream-on-dark); }
.v2-chapter { display: none; }
.v2-btn-note { color: rgba(245,241,234,0.35); }`;
}
