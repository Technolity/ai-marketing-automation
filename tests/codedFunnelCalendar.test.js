/**
 * Coded Funnel — Calendar / booking page renderer tests + local preview generator.
 *
 * Run with:  npm run test  (or: npx vitest run tests/codedFunnelCalendar.test.js)
 *
 * Besides asserting the renderer behaves, the last test WRITES a real HTML file
 * to the repo root — `coded-funnel-preview.calendar.html` — so you can double-click
 * it and SEE the page in your browser. No server, no GHL, no login required.
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderCalendarPage } from '@/lib/funnelTemplates/coded-v1/calendarPage';
import { minifyHtml } from '@/lib/funnelTemplates/escape';

describe('renderCalendarPage', () => {
  it('renders a self-contained HTML document', () => {
    const html = renderCalendarPage();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');           // CSS is inline (self-contained)
    expect(html).toContain('</html>');
  });

  it('uses fallbacks when no data is supplied (page never blank)', () => {
    const html = renderCalendarPage();
    expect(html).toContain('Book Your Free Strategy Call');   // fallback headline
    expect(html).toContain('All rights reserved.');           // fallback footer
  });

  it('escapes hostile copy so it cannot break the page or inject scripts', () => {
    const html = renderCalendarPage({
      copy: { headline: '<script>alert(1)</script> & "stuff" {{custom_values.x}}' },
    });
    expect(html).not.toContain('<script>alert(1)</script>'); // tags neutralized
    expect(html).toContain('&lt;script&gt;');                // shown as text
    expect(html).toContain('&#123;&#123;');                  // {{ de-fanged for GHL
  });

  it('shows the dashed calendar slot when no embed is supplied', () => {
    const html = renderCalendarPage();
    expect(html).toContain('[ GHL calendar embeds here ]');
    expect(html).toContain('calendar-slot');
  });

  it('injects the raw calendar embed when one is supplied', () => {
    const embed = '<iframe src="https://api.leadconnectorhq.com/widget/booking/abc123"></iframe>';
    const html = renderCalendarPage({ embeds: { calendarEmbedHtml: embed } });
    expect(html).toContain(embed);                            // raw, unescaped
    expect(html).not.toContain('[ GHL calendar embeds here ]');
  });

  it('anchors at id="book" so sales-page CTAs (href="#book") land here', () => {
    const html = renderCalendarPage();
    expect(html).toContain('id="book"');
  });

  it('injects brand colors and a readable text color', () => {
    const html = renderCalendarPage({ brand: { primary: '#ffffff' } });
    expect(html).toContain('--brand-primary: #ffffff');
    expect(html).toContain('--on-primary: #111111');         // dark text on white
  });

  it('minified bake output is a single line GHL can render directly', () => {
    const baked = minifyHtml(renderCalendarPage());
    expect(baked).not.toMatch(/\n/);            // no newlines (the GHL-breaking bit)
    expect(baked).not.toMatch(/\t/);            // no tabs
    expect(baked).not.toMatch(/>\s+</);         // no whitespace gaps between tags
    expect(baked.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(baked).toContain('</html>');
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = renderCalendarPage({
      brand: { primary: '#7c3aed', secondary: '#4c1d95', businessName: 'Acme Coaching' },
      copy: {
        headline: 'Book Your Free Coaching Call',
        subheadline: 'Grab a 30-minute slot and let’s map out your next 90 days.',
        footer_text: 'Copyrighted 2026',
      },
    });
    const out = resolve(process.cwd(), 'coded-funnel-preview.calendar.html');
    writeFileSync(out, html, 'utf8');
    expect(html.length).toBeGreaterThan(500);
  });
});
