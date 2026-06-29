/**
 * Coded Funnel — CONTRAST rule tests.
 * Proves: text always contrasts its background, brand accents are made visible on the dark
 * page, and the CTA is NEVER dark-text-on-dark — for ANY brand palette (incl. all-dark).
 *
 * Run with:  npx vitest run tests/bookingContrast.test.js
 */

import { describe, it, expect } from 'vitest';
import { contrastRatio, readableText, contrastColor } from '@/lib/funnelTemplates/booking-v1/contrast';
import { renderLandingSegments } from '@/lib/funnelTemplates/booking-v1/landingPage';
import { assembleSegments } from '@/lib/funnelTemplates/segments';

const cssVar = (html, name) => (html.match(new RegExp(name.replace(/[-]/g, '\\$&') + ':\\s*(#[0-9a-fA-F]{6})')) || [])[1];

describe('contrast helpers', () => {
  it('readableText picks cream on dark, near-black on light', () => {
    expect(readableText('#0b0b0f')).toBe('#F5F1EA');
    expect(readableText('#ffffff')).toBe('#0B0B0F');
  });

  it('contrastColor lightens a dark brand color on a dark bg until it reads', () => {
    const out = contrastColor('#10101a', '#0b0b0f', 4.5);
    expect(out.toLowerCase()).not.toBe('#10101a');
    expect(contrastRatio(out, '#0b0b0f')).toBeGreaterThanOrEqual(4);
  });

  it('contrastColor leaves an already-contrasting color unchanged', () => {
    expect(contrastColor('#ffffff', '#0b0b0f', 4.5).toLowerCase()).toBe('#ffffff');
  });
});

describe('every bake is contrast-safe (CTA never dark-on-dark)', () => {
  const palettes = [
    { primary: '#101018', secondary: '#0a0a12', accent: '#1b1b2e' }, // ALL DARK — the reported bug
    { primary: '#C41E2A', secondary: '#1e1b4b', accent: '#D4A84B' }, // template default
    { primary: '#0891b2', secondary: '#082f49', accent: '#f59e0b' }, // mixed
    { primary: '#ffffff', secondary: '#eeeeee', accent: '#fafafa' }, // all light
  ];
  for (const brand of palettes) {
    it(`CTA text contrasts CTA bg · primary ${brand.primary}`, () => {
      const html = assembleSegments(renderLandingSegments({ brand }));
      const ctaBg = cssVar(html, '--v2-cta-bg');
      const ctaText = cssVar(html, '--v2-cta-text');
      expect(ctaBg).toBeTruthy();
      expect(ctaText).toBeTruthy();
      expect(contrastRatio(ctaBg, ctaText)).toBeGreaterThanOrEqual(4.5);
    });

    it(`dominant accent is visible on the dark page · primary ${brand.primary}`, () => {
      const html = assembleSegments(renderLandingSegments({ brand }));
      const accent = cssVar(html, '--v2-gold-on-dark');
      expect(contrastRatio(accent, '#0b0b0f')).toBeGreaterThanOrEqual(3);
    });
  }
});
