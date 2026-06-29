/**
 * Coded Funnel — Design "coded-v1" — Thank-You Page renderer
 *
 * Returns ONE self-contained HTML document (its own <style>, no external CSS)
 * as a string. That string is what eventually gets pushed into a single GHL
 * custom value and rendered raw inside the GHL page's Custom Code element.
 *
 * Input `data` shape (all optional — every field has a fallback so the page
 * never renders blank):
 *   {
 *     brand:  { primary, secondary, businessName },
 *     copy:   { headline, subheadline, next_steps_text, footer_text },
 *     media:  { logoUrl },
 *     embeds: { videoEmbedHtml }   // raw confirmation/welcome video embed, trusted
 *   }
 */

import { safeText, rawEmbed, readableTextColor } from '../escape.js';

const FALLBACK = {
  headline: 'You’re All Set — Thank You!',
  subheadline: 'Your request was received. Check your inbox in the next few minutes.',
  next_steps_text: 'Watch the short welcome video above, then keep an eye on your email for what to do next.',
  footer_text: 'All rights reserved.',
  primary: '#2563eb',
  secondary: '#1e3a8a',
  businessName: 'Your Business',
};

export function renderThankYouPage(data = {}) {
  const brand = data.brand || {};
  const copy = data.copy || {};
  const media = data.media || {};
  const embeds = data.embeds || {};

  // Resolve colors and the readable text color that sits ON the primary color.
  const primary = brand.primary || FALLBACK.primary;
  const secondary = brand.secondary || FALLBACK.secondary;
  const onPrimary = readableTextColor(primary);
  const businessName = safeText(brand.businessName || FALLBACK.businessName);

  // Resolve copy: prefer real vault values, fall back to safe defaults. All escaped.
  const headline = safeText(copy.headline || FALLBACK.headline);
  const subheadline = safeText(copy.subheadline || FALLBACK.subheadline);
  const nextSteps = safeText(copy.next_steps_text || FALLBACK.next_steps_text);
  const footer = safeText(copy.footer_text || FALLBACK.footer_text);

  // Logo is a URL attribute, not body text → escape it the same way (handles quotes).
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  // The confirmation/welcome video embed is TRUSTED raw HTML. If absent, render
  // nothing for it — no dashed placeholder slot needed on a thank-you page.
  const videoBlock = embeds.videoEmbedHtml
    ? `<div class="video">${rawEmbed(embeds.videoEmbedHtml)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${headline}</title>
<style>
  :root {
    --brand-primary: ${primary};
    --brand-secondary: ${secondary};
    --on-primary: ${onPrimary};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    background: linear-gradient(160deg, var(--brand-secondary) 0%, var(--brand-primary) 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    max-width: 620px;
    width: 100%;
    padding: 40px 32px;
    text-align: center;
  }
  .logo { max-height: 56px; margin-bottom: 24px; }
  .check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: var(--brand-primary);
    color: var(--on-primary);
    font-size: 38px;
    font-weight: 700;
    line-height: 1;
  }
  h1 { font-size: 30px; line-height: 1.2; margin-bottom: 16px; }
  .sub { font-size: 17px; color: #4b5563; margin-bottom: 28px; }
  .video {
    width: 100%;
    margin: 0 auto 28px;
    border-radius: 12px;
    overflow: hidden;
  }
  .video iframe,
  .video video {
    display: block;
    width: 100%;
    border: none;
  }
  .next-steps {
    font-size: 16px;
    line-height: 1.5;
    color: #374151;
    background: #f3f4f6;
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }
  footer { margin-top: 28px; font-size: 12px; color: #9ca3af; }
  @media (max-width: 480px) {
    .card { padding: 28px 20px; }
    h1 { font-size: 24px; }
    .check { width: 60px; height: 60px; font-size: 32px; }
  }
</style>
</head>
<body>
  <main class="card">
    ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="${businessName}" />` : ''}
    <div class="check" aria-hidden="true">&#10003;</div>
    <h1>${headline}</h1>
    <p class="sub">${subheadline}</p>
    ${videoBlock}
    <p class="next-steps">${nextSteps}</p>
    <footer>${footer} &middot; ${businessName}</footer>
  </main>
</body>
</html>`;
}
