/**
 * Coded Funnel — booking-v1 QUALIFY page tests + local preview generator.
 * Writes `booking-funnel-preview.qualify.html` to the repo root.
 *
 * Run with:  npx vitest run tests/bookingFunnelQualify.test.js
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderQualifySegments, QUALIFY_FORM_KEY } from '@/lib/funnelTemplates/booking-v1/qualifyPage';
import { assembleSegments } from '@/lib/funnelTemplates/segments';
import { minifyHtml } from '@/lib/funnelTemplates/escape';

const doc = (data) => assembleSegments(renderQualifySegments(data));

describe('renderQualifySegments', () => {
  it('assembles a self-contained HTML document', () => {
    const html = doc();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');
    expect(html).toContain('</html>');
  });

  it('returns the three expected named segments in order', () => {
    const names = renderQualifySegments().map((s) => s.name);
    expect(names).toEqual(['bv1_qualify_css', 'bv1_qualify_body', 'bv1_qualify_foot']);
  });

  it('uses fallbacks when no data is supplied (page never blank)', () => {
    const html = doc();
    expect(html).toContain('A Few Quick Questions First');
    expect(html).toContain('All rights reserved.');
  });

  it('emits the live qualification-form merge tag instead of baking a form', () => {
    const html = doc();
    expect(html).toContain(`{{custom_values.${QUALIFY_FORM_KEY}}}`);
    expect(QUALIFY_FORM_KEY).toBe('appt_qualify_form');
  });

  it('keeps the merge tag literal after minification', () => {
    const body = renderQualifySegments().find((s) => s.name === 'bv1_qualify_body');
    expect(minifyHtml(body.html)).toContain('{{custom_values.appt_qualify_form}}');
  });

  it('escapes hostile copy', () => {
    const html = doc({ copy: { headline: '<script>alert(1)</script> {{custom_values.x}}' } });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&#123;&#123;');
  });

  it('injects brand colors and a readable text color', () => {
    const html = doc({ brand: { primary: '#ffffff' } });
    expect(html).toContain('--brand-primary: #ffffff');
    expect(html).toContain('--on-primary: #111111');
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = doc({
      brand: { primary: '#0891b2', secondary: '#065f6b', businessName: 'Acme Coaching' },
      copy: { headline: 'Tell Us About You', subheadline: 'Two quick questions before we book.' },
    });
    writeFileSync(resolve(process.cwd(), 'booking-funnel-preview.qualify.html'), html, 'utf8');
    expect(html.length).toBeGreaterThan(500);
  });
});
