/**
 * Coded Funnel — Sales page renderer tests + local preview generator.
 *
 * Run with:  npm run test  (or: npx vitest run tests/codedFunnelSales.test.js)
 *
 * Besides asserting the renderer behaves, the last test WRITES a real HTML file
 * to the repo root — `coded-funnel-preview.sales.html` — so you can double-click
 * it and SEE the page in your browser. No server, no GHL, no login required.
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderSalesPage } from '@/lib/funnelTemplates/coded-v1/salesPage';
import { minifyHtml } from '@/lib/funnelTemplates/escape';

describe('renderSalesPage', () => {
  it('renders a self-contained HTML document', () => {
    const html = renderSalesPage();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<style>');           // CSS is inline (self-contained)
    expect(html).toContain('</html>');
  });

  it('uses fallbacks when no data is supplied (page never blank)', () => {
    const html = renderSalesPage();
    expect(html).toContain('The Fastest Way To Get The Results You Want'); // fallback hero headline
    expect(html).toContain('Book Your Call Now');                          // fallback CTA
    expect(html).toContain('[ VSL video embeds here ]');                   // labelled VSL slot
  });

  it('escapes hostile copy so it cannot break the page or inject scripts', () => {
    const html = renderSalesPage({
      copy: { hero_headline_text: '<script>alert(1)</script> & "stuff" {{custom_values.x}}' },
    });
    expect(html).not.toContain('<script>alert(1)</script>'); // tags neutralized
    expect(html).toContain('&lt;script&gt;');                // shown as text
    expect(html).toContain('&#123;&#123;');                  // {{ de-fanged for GHL
  });

  it('uses the trusted VSL embed raw (not escaped) when supplied', () => {
    const html = renderSalesPage({
      embeds: { vslEmbedHtml: '<iframe src="https://example.com/vid"></iframe>' },
    });
    expect(html).toContain('<iframe src="https://example.com/vid"></iframe>'); // raw, trusted
    expect(html).not.toContain('[ VSL video embeds here ]');                   // slot replaced
  });

  it('injects brand colors and a readable button text color', () => {
    const html = renderSalesPage({ brand: { primary: '#ffffff' } });
    expect(html).toContain('--brand-primary: #ffffff');
    expect(html).toContain('--on-primary: #111111');         // dark text on white button
  });

  it('CTA buttons link to the #book calendar anchor', () => {
    const html = renderSalesPage();
    expect(html).toContain('href="#book"');
  });

  it('minified bake output is a single line GHL can render directly', () => {
    const baked = minifyHtml(renderSalesPage());
    expect(baked).not.toMatch(/\n/);            // no newlines (the GHL-breaking bit)
    expect(baked).not.toMatch(/\t/);            // no tabs
    expect(baked).not.toMatch(/>\s+</);         // no whitespace gaps between tags
    expect(baked.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(baked).toContain('</html>');
  });

  it('writes a browsable preview file to the repo root', () => {
    const html = renderSalesPage({
      brand: { primary: '#7c3aed', secondary: '#4c1d95', businessName: 'Acme Coaching' },
      copy: {
        hero_headline_text: 'Steal My 3-Step Client-Getting System',
        hero_subheadline_text: 'The exact framework I use to book 20+ calls a month.',
        hero_cta_text: 'Book My Call',
        process_1_headline: 'Discover',
        process_1_subheadline: 'We learn about your business.',
        how_it_works_headline: 'The Simple 3-Step Process',
        bio_paragraph_text: 'I have helped 200+ coaches scale past six figures.',
        testimonial_review_1_headline: 'Booked 30 calls in my first month.',
        testimonial_review_1_subheadline_with_name: 'Jane D., Coach',
        faq_question_1: 'How fast will I see results?',
        faq_answer_1: 'Most clients see momentum in week one.',
        final_cta_headline: 'Ready To Fill Your Calendar?',
        final_cta_text: 'Book My Call',
        footer_text: 'Copyrighted 2026',
      },
    });
    const out = resolve(process.cwd(), 'coded-funnel-preview.sales.html');
    writeFileSync(out, html, 'utf8');
    expect(html.length).toBeGreaterThan(500);
  });
});
