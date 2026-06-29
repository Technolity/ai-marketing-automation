/**
 * Coded Funnel — Thank-You page renderer tests + local preview generator.
 *
 * Run with:  npm run test  (or: npx vitest run tests/codedFunnelThankYou.test.js)
 *
 * Besides asserting the renderer behaves, the last test WRITES a real HTML file
 * to the repo root — `coded-funnel-preview.thankyou.html` — so you can double-click
 * it and SEE the page in your browser. No server, no GHL, no login required.
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderThankYouPage } from '@/lib/funnelTemplates/coded-v1/thankYouPage';
import { minifyHtml } from '@/lib/funnelTemplates/escape';

describe('renderThankYouPage', () => {
  it('renders a self-contained HTML document', () => {
    const html = renderThankYouPage();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');           // CSS is inline (self-contained)
    expect(html).toContain('</html>');
  });

  it('uses fallbacks when no data is supplied (page never blank)', () => {
    const html = renderThankYouPage();
    expect(html).toContain('You’re All Set — Thank You!');   // fallback headline
    expect(html).toContain('Your request was received');     // fallback subheadline
  });

  it('escapes hostile copy so it cannot break the page or inject scripts', () => {
    const html = renderThankYouPage({
      copy: { headline: '<script>alert(1)</script> & "stuff" {{custom_values.x}}' },
    });
    expect(html).not.toContain('<script>alert(1)</script>'); // tags neutralized
    expect(html).toContain('&lt;script&gt;');                // shown as text
    expect(html).toContain('&#123;&#123;');                  // {{ de-fanged for GHL
  });

  it('injects brand colors and a readable accent text color', () => {
    const html = renderThankYouPage({ brand: { primary: '#ffffff' } });
    expect(html).toContain('--brand-primary: #ffffff');
    expect(html).toContain('--on-primary: #111111');         // dark text on white accent
  });

  it('embeds the trusted confirmation video raw, with no dashed slot when absent', () => {
    const withVideo = renderThankYouPage({
      embeds: { videoEmbedHtml: '<iframe src="https://example.com/v"></iframe>' },
    });
    expect(withVideo).toContain('<iframe src="https://example.com/v"></iframe>');

    const noVideo = renderThankYouPage();
    expect(noVideo).not.toContain('<iframe');
    expect(noVideo).not.toContain('video goes here');        // no placeholder slot
  });

  it('minified bake output is a single line GHL can render directly', () => {
    const baked = minifyHtml(renderThankYouPage());
    expect(baked).not.toMatch(/\n/);            // no newlines (the GHL-breaking bit)
    expect(baked).not.toMatch(/\t/);            // no tabs
    expect(baked).not.toMatch(/>\s+</);         // no whitespace gaps between tags
    expect(baked.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(baked).toContain('</html>');
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = renderThankYouPage({
      brand: { primary: '#7c3aed', secondary: '#4c1d95', businessName: 'Acme Coaching' },
      copy: {
        headline: 'Thanks — Your Free Gift Is On Its Way!',
        subheadline: 'Check your inbox in the next 5 minutes for the download link.',
        next_steps_text: 'While you wait, watch the welcome video above to get the most out of it.',
        footer_text: 'Copyrighted 2026',
      },
      embeds: { videoEmbedHtml: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>' },
    });
    const out = resolve(process.cwd(), 'coded-funnel-preview.thankyou.html');
    writeFileSync(out, html, 'utf8');
    expect(html.length).toBeGreaterThan(500);
  });
});
