/**
 * Coded Funnel — booking-v1 THANK YOU page tests + local preview generator.
 * Writes `booking-funnel-preview.thankYou.html` to the repo root.
 *
 * Run with:  npx vitest run tests/bookingFunnelThankYou.test.js
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderThankYouSegments } from '@/lib/funnelTemplates/booking-v1/thankYouPage';
import { assembleSegments } from '@/lib/funnelTemplates/segments';

const doc = (data) => assembleSegments(renderThankYouSegments(data));

describe('renderThankYouSegments', () => {
  it('assembles a self-contained HTML document', () => {
    const html = doc();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');
    expect(html).toContain('</html>');
  });

  it('returns one css value + one html chunk (small page: 1 code element)', () => {
    const names = renderThankYouSegments().map((s) => s.name);
    expect(names).toEqual(['bv1_thankyou_css', 'bv1_thankyou_main']);
  });

  it('uses fallbacks when no data is supplied (page never blank)', () => {
    const html = doc();
    expect(html).toContain('You’re Booked!');
    expect(html).toContain('What happens next');
    expect(html).toContain('All rights reserved.');
  });

  it('escapes hostile copy', () => {
    const html = doc({ copy: { headline: '<script>alert(1)</script> {{custom_values.x}}' } });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&#123;&#123;');
  });

  it('injects brand colors into the stylesheet', () => {
    const html = doc({ brand: { primary: '#ffffff', accent: '#11ccaa' } });
    expect(html).toContain('--brand-primary: #ffffff');
    expect(html).toContain('--v2-gold-on-dark: #ffffff');
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = doc({
      brand: { primary: '#0891b2', secondary: '#065f6b', businessName: 'Acme Coaching' },
      copy: {
        headline: 'You’re All Set! 🎉',
        subheadline: 'Your call is confirmed — check your email for details.',
        next_steps_text: 'Add the invite to your calendar and bring your top question.',
      },
    });
    writeFileSync(resolve(process.cwd(), 'booking-funnel-preview.thankYou.html'), html, 'utf8');
    expect(html.length).toBeGreaterThan(500);
  });
});
