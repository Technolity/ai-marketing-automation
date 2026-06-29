/**
 * Coded Funnel — Design "coded-v1" — Calendar / Booking Page renderer
 *
 * Returns ONE self-contained HTML document (its own <style>, no external CSS)
 * as a string. That string is what eventually gets pushed into a single GHL
 * custom value and rendered raw inside the GHL page's Custom Code element.
 *
 * The page wrapper carries id="book" so sales-page CTAs that link with
 * href="#book" anchor straight onto the booking calendar.
 *
 * Input `data` shape (all optional — every field has a fallback so the page
 * never renders blank):
 *   {
 *     brand:  { primary, secondary, businessName },
 *     copy:   { headline, subheadline, footer_text },
 *     media:  { logoUrl },
 *     embeds: { calendarEmbedHtml }   // raw GHL calendar embed code, trusted
 *   }
 */

import { safeText, rawEmbed, readableTextColor } from '../escape.js';

const FALLBACK = {
  headline: 'Book Your Free Strategy Call',
  subheadline: 'Pick a time that works for you below and we’ll see you on the call.',
  footer_text: 'All rights reserved.',
  primary: '#2563eb',
  secondary: '#1e3a8a',
  businessName: 'Your Business',
};

export function renderCalendarPage(data = {}) {
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
  const footer = safeText(copy.footer_text || FALLBACK.footer_text);

  // Logo is a URL attribute, not body text → escape it the same way (handles quotes).
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  // The GHL calendar embed is TRUSTED raw HTML. If absent, show a labelled slot
  // so the page is obviously "calendar goes here" instead of silently empty.
  const calendarBlock = embeds.calendarEmbedHtml
    ? rawEmbed(embeds.calendarEmbedHtml)
    : '<div class="calendar-slot">[ GHL calendar embeds here ]</div>';

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
    max-width: 760px;
    width: 100%;
    padding: 40px 32px;
    text-align: center;
  }
  .logo { max-height: 56px; margin-bottom: 24px; }
  h1 { font-size: 30px; line-height: 1.2; margin-bottom: 16px; }
  .sub { font-size: 17px; color: #4b5563; margin-bottom: 32px; }
  .calendar {
    margin: 0 auto 28px;
    border-top: 4px solid var(--brand-primary);
    padding-top: 8px;
  }
  .calendar-slot {
    border: 2px dashed #cbd5e1;
    border-radius: 10px;
    padding: 80px 28px;
    color: #94a3b8;
    font-size: 15px;
  }
  footer { margin-top: 8px; font-size: 12px; color: #9ca3af; }
  @media (max-width: 480px) {
    .card { padding: 28px 20px; }
    h1 { font-size: 24px; }
    .calendar-slot { padding: 56px 16px; }
  }
</style>
</head>
<body>
  <main class="card" id="book">
    ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="${businessName}" />` : ''}
    <h1>${headline}</h1>
    <p class="sub">${subheadline}</p>
    <div class="calendar">
      ${calendarBlock}
    </div>
    <footer>${footer} &middot; ${businessName}</footer>
  </main>
</body>
</html>`;
}
