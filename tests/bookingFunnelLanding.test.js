/**
 * Coded Funnel — booking-v1 LANDING page tests (v2 editorial design) + preview generator.
 * Writes `booking-funnel-preview.landing.html` to the repo root.
 *
 * Run with:  npx vitest run tests/bookingFunnelLanding.test.js
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderLandingSegments, VSL_EMBED_KEY } from '@/lib/funnelTemplates/booking-v1/landingPage';
import { assembleSegments } from '@/lib/funnelTemplates/segments';

const doc = (data) => assembleSegments(renderLandingSegments(data));

describe('renderLandingSegments (v2 editorial)', () => {
  it('assembles a self-contained HTML document (CSS re-wrapped for preview)', () => {
    const html = doc();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');
    expect(html).toContain('</html>');
  });

  it('returns ONE css value + SIX HTML chunks (GHL: 1 CSS field + 6 code elements)', () => {
    const names = renderLandingSegments().map((s) => s.name);
    expect(names[0]).toBe('bv1_landing_css');
    expect(names.filter((n) => /^bv1_landing_[1-6]$/.test(n))).toHaveLength(6);
    expect(names[names.length - 1]).toBe('bv1_landing_6');
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses fallbacks when no data supplied (page never blank)', () => {
    const html = doc();
    expect(html).toContain('Book the call that finally gets you unstuck'); // hero fallback
    expect(html).toContain('All rights reserved.');                        // footer fallback
  });

  it('renders the salesPage-based sections in the v2 structure', () => {
    const html = doc();
    expect(html).toContain('Who This Is For');
    expect(html).toContain('The Method');
    expect(html).toContain('What To Expect On The Call');
    expect(html).toContain('Real Results From Real People'); // testimonials
    expect(html).toContain('Meet Your Guide');               // bio
    expect(html).toContain('Frequently Asked Questions');    // faq
    expect(html).toContain('v2-marquee-track');              // marquee craft
    expect(html).toContain('v2-step-num');                   // numbered method steps
  });

  it('has exactly one <h1> (SEO heading hygiene)', () => {
    expect((doc().match(/<h1/g) || []).length).toBe(1);
  });

  it('emits JSON-LD structured data', () => {
    const html = doc();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"FAQPage"');
  });

  it('injects all THREE brand colors into the stylesheet', () => {
    const html = doc({ brand: { primary: '#ff7700', secondary: '#222244', accent: '#11ccaa' } });
    expect(html).toContain('--brand-primary: #ff7700');
    expect(html).toContain('--brand-secondary: #222244');
    expect(html).toContain('--brand-accent: #11ccaa');
    expect(html).toContain('--v2-gold-on-dark: #ff7700'); // primary drives the dominant accent
    expect(html).toContain('--v2-red: #11ccaa');          // accent drives the secondary pop
  });

  it('uses the reference fonts (Playfair Display + Lato)', () => {
    const html = doc();
    expect(html).toContain('Playfair Display');
    expect(html).toContain('Lato');
  });

  it('falls back to a live VSL merge tag when no video URL is supplied', () => {
    const html = doc();
    expect(html).toContain(`{{custom_values.${VSL_EMBED_KEY}}}`);
    expect(VSL_EMBED_KEY).toBe('appt_vsl_embed');
  });

  it('bakes a video iframe when an embed URL is supplied, video tag for a file', () => {
    expect(doc({ media: { videoUrl: 'https://youtube.com/embed/xyz' } })).toContain('<iframe src="https://youtube.com/embed/xyz"');
    expect(doc({ media: { videoUrl: 'https://cdn.example.com/v.mp4' } })).toContain('<video src="https://cdn.example.com/v.mp4"');
  });

  it('renders the client logo in a size-robust header, with a wordmark fallback', () => {
    const withLogo = doc({ media: { logoUrl: 'https://cdn/acme.png' }, brand: { businessName: 'Acme' } });
    expect(withLogo).toContain('class="v2-logo"');
    expect(withLogo).toContain('src="https://cdn/acme.png"');
    expect(withLogo).toContain('.v2-logo { height: 40px; width: auto; max-width: 200px; object-fit: contain;'); // size-robust
    const noLogo = doc({ brand: { businessName: 'Acme Co' } });
    expect(noLogo).toContain('v2-logo-txt');
    expect(noLogo).toContain('Acme Co');
  });

  it('escapes hostile copy', () => {
    const html = doc({ copy: { hero_headline: '<script>alert(1)</script> {{custom_values.x}}' } });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&#123;&#123;');
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = doc({
      brand: { primary: '#C41E2A', secondary: '#1b1b2e', accent: '#D4A84B', businessName: 'Acme Coaching' },
      copy: { hero_headline: 'Turn Your Experience Into a Profitable Practice', hero_subheadline: 'Book a private strategy call and leave with a real plan.' },
    });
    writeFileSync(resolve(process.cwd(), 'booking-funnel-preview.landing.html'), html, 'utf8');
    expect(html.length).toBeGreaterThan(3000);
  });
});
