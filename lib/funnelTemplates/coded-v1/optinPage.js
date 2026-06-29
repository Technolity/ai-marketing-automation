/**
 * Coded Funnel — Design "coded-v1" — Opt-in Page renderer
 *
 * Returns ONE self-contained HTML document (its own <style>, no external CSS)
 * as a string. That string is what eventually gets pushed into a single GHL
 * custom value and rendered raw inside the GHL page's Custom Code element.
 *
 * Input `data` shape (all optional — every field has a fallback so the page
 * never renders blank):
 *   {
 *     brand:  { primary, secondary, businessName },
 *     copy:   { headline_text, subheadline_text, cta_button_text,
 *               popup_form_headline, footer_text },
 *     media:  { logoUrl },
 *     embeds: { optinFormHtml }   // raw GHL form embed code, trusted
 *   }
 */

import { safeText, rawEmbed, readableTextColor } from '../escape.js';

const FALLBACK = {
  headline_text: 'Get Your Free Gift Today',
  subheadline_text: 'Enter your details below and we’ll send it straight to your inbox.',
  cta_button_text: 'Send Me My Free Gift',
  popup_form_headline: 'Where should we send it?',
  footer_text: 'All rights reserved.',
  primary: '#2563eb',
  secondary: '#1e3a8a',
  businessName: 'Your Business',
};

export function renderOptinPage(data = {}) {
  const brand = data.brand || {};
  const copy = data.copy || {};
  const media = data.media || {};
  const embeds = data.embeds || {};

  // Resolve colors and the readable text color that sits ON the primary button.
  const primary = brand.primary || FALLBACK.primary;
  const secondary = brand.secondary || FALLBACK.secondary;
  const onPrimary = readableTextColor(primary);
  const businessName = safeText(brand.businessName || FALLBACK.businessName);

  // Resolve copy: prefer real vault values, fall back to safe defaults. All escaped.
  const headline = safeText(copy.headline_text || FALLBACK.headline_text);
  const subheadline = safeText(copy.subheadline_text || FALLBACK.subheadline_text);
  const ctaText = safeText(copy.cta_button_text || FALLBACK.cta_button_text);
  const formHeadline = safeText(copy.popup_form_headline || FALLBACK.popup_form_headline);
  const footer = safeText(copy.footer_text || FALLBACK.footer_text);

  // Logo is a URL attribute, not body text → escape it the same way (handles quotes).
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  // The GHL opt-in form embed is TRUSTED raw HTML. If absent, show a labelled slot
  // so the page is obviously "form goes here" instead of silently empty.
  const formBlock = embeds.optinFormHtml
    ? rawEmbed(embeds.optinFormHtml)
    : '<div class="form-slot">[ GHL opt-in form embeds here ]</div>';

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
    max-width: 560px;
    width: 100%;
    padding: 40px 32px;
    text-align: center;
  }
  .logo { max-height: 56px; margin-bottom: 24px; }
  h1 { font-size: 30px; line-height: 1.2; margin-bottom: 16px; }
  .sub { font-size: 17px; color: #4b5563; margin-bottom: 28px; }
  .form-headline { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #374151; }
  .form-slot {
    border: 2px dashed #cbd5e1;
    border-radius: 10px;
    padding: 28px;
    color: #94a3b8;
    font-size: 14px;
    margin-bottom: 24px;
  }
  .cta {
    display: inline-block;
    width: 100%;
    background: var(--brand-primary);
    color: var(--on-primary);
    font-size: 18px;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    padding: 16px 24px;
    cursor: pointer;
    text-decoration: none;
  }
  footer { margin-top: 28px; font-size: 12px; color: #9ca3af; }
  @media (max-width: 480px) {
    .card { padding: 28px 20px; }
    h1 { font-size: 24px; }
  }
</style>
</head>
<body>
  <main class="card">
    ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="${businessName}" />` : ''}
    <h1>${headline}</h1>
    <p class="sub">${subheadline}</p>
    <p class="form-headline">${formHeadline}</p>
    ${formBlock}
    <a class="cta" href="#optin-form">${ctaText}</a>
    <footer>${footer} &middot; ${businessName}</footer>
  </main>
</body>
</html>`;
}
