/**
 * Coded Funnel — Opt-in page renderer tests + local preview generator.
 *
 * Run with:  npm run test  (or: npx vitest run tests/codedFunnelOptin.test.js)
 *
 * Besides asserting the renderer behaves, the last test WRITES a real HTML file
 * to the repo root — `coded-funnel-preview.optin.html` — so you can double-click
 * it and SEE the page in your browser. No server, no GHL, no login required.
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderOptinPage } from '@/lib/funnelTemplates/coded-v1/optinPage';
import { minifyHtml } from '@/lib/funnelTemplates/escape';

describe('renderOptinPage', () => {
  it('renders a self-contained HTML document', () => {
    const html = renderOptinPage();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');           // CSS is inline (self-contained)
    expect(html).toContain('</html>');
  });

  it('uses fallbacks when no data is supplied (page never blank)', () => {
    const html = renderOptinPage();
    expect(html).toContain('Get Your Free Gift Today');     // fallback headline
    expect(html).toContain('Send Me My Free Gift');         // fallback CTA
  });

  it('escapes hostile copy so it cannot break the page or inject scripts', () => {
    const html = renderOptinPage({
      copy: { headline_text: '<script>alert(1)</script> & "stuff" {{custom_values.x}}' },
    });
    expect(html).not.toContain('<script>alert(1)</script>'); // tags neutralized
    expect(html).toContain('&lt;script&gt;');                // shown as text
    expect(html).toContain('&#123;&#123;');                  // {{ de-fanged for GHL
  });

  it('injects brand colors and a readable button text color', () => {
    const html = renderOptinPage({ brand: { primary: '#ffffff' } });
    expect(html).toContain('--brand-primary: #ffffff');
    expect(html).toContain('--on-primary: #111111');         // dark text on white button
  });

  it('minified bake output is a single line GHL can render directly', () => {
    const baked = minifyHtml(renderOptinPage());
    expect(baked).not.toMatch(/\n/);            // no newlines (the GHL-breaking bit)
    expect(baked).not.toMatch(/\t/);            // no tabs
    expect(baked).not.toMatch(/>\s+</);         // no whitespace gaps between tags
    expect(baked.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(baked).toContain('</html>');
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = renderOptinPage({
      brand: { primary: '#7c3aed', secondary: '#4c1d95', businessName: 'Acme Coaching' },
      copy: {
        headline_text: 'Steal My 3-Step Client-Getting System',
        subheadline_text: 'The exact framework I use to book 20+ calls a month.',
        cta_button_text: 'Get Instant Access',
        popup_form_headline: 'Enter your best email:',
        footer_text: 'Copyrighted 2026',
      },
    });
    const out = resolve(process.cwd(), 'coded-funnel-preview.optin.html');
    writeFileSync(out, html, 'utf8');
    expect(html.length).toBeGreaterThan(500);
  });
});
