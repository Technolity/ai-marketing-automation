/**
 * Coded Funnel — booking-v1 CALENDAR page tests + local preview generator.
 * Writes `booking-funnel-preview.calendar.html` to the repo root.
 *
 * Run with:  npx vitest run tests/bookingFunnelCalendar.test.js
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderCalendarSegments, CALENDAR_EMBED_KEY } from '@/lib/funnelTemplates/booking-v1/calendarPage';
import { assembleSegments } from '@/lib/funnelTemplates/segments';
import { minifyHtml } from '@/lib/funnelTemplates/escape';

const doc = (data) => assembleSegments(renderCalendarSegments(data));

describe('renderCalendarSegments', () => {
  it('assembles a self-contained HTML document', () => {
    const html = doc();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');
    expect(html).toContain('</html>');
  });

  it('returns one css value + one html chunk (small page: 1 code element)', () => {
    const names = renderCalendarSegments().map((s) => s.name);
    expect(names).toEqual(['bv1_calendar_css', 'bv1_calendar_main']);
  });

  it('uses fallbacks when no data is supplied (page never blank)', () => {
    const html = doc();
    expect(html).toContain('Book Your Free Strategy Call');
    expect(html).toContain('All rights reserved.');
  });

  it('emits the live calendar merge tag instead of baking an embed', () => {
    const html = doc();
    expect(html).toContain(`{{custom_values.${CALENDAR_EMBED_KEY}}}`);
    expect(CALENDAR_EMBED_KEY).toBe('appt_calendar_embed');
  });

  it('keeps the merge tag literal after minification', () => {
    const body = renderCalendarSegments().find((s) => s.name === 'bv1_calendar_main');
    expect(minifyHtml(body.html)).toContain('{{custom_values.appt_calendar_embed}}');
  });

  it('escapes hostile copy', () => {
    const html = doc({ copy: { headline: '<script>alert(1)</script> {{custom_values.x}}' } });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&#123;&#123;');
  });

  it('anchors at id="book" so landing CTAs (href="#book") land here', () => {
    expect(doc()).toContain('id="book"');
  });

  it('injects brand colors into the stylesheet', () => {
    const html = doc({ brand: { primary: '#ffffff', secondary: '#222244', accent: '#11ccaa' } });
    expect(html).toContain('--brand-primary: #ffffff');
    expect(html).toContain('--brand-accent: #11ccaa');
    expect(html).toContain('--v2-gold-on-dark: #ffffff'); // primary drives the dominant accent
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = doc({
      brand: { primary: '#0891b2', secondary: '#065f6b', businessName: 'Acme Coaching' },
      copy: { headline: 'Pick Your Time', subheadline: 'Grab a 30-minute slot below.' },
    });
    writeFileSync(resolve(process.cwd(), 'booking-funnel-preview.calendar.html'), html, 'utf8');
    expect(html.length).toBeGreaterThan(500);
  });
});
