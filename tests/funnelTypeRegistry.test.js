/**
 * Funnel type → engine routing tests.
 * Run with:  npx vitest run tests/funnelTypeRegistry.test.js
 */

import { describe, it, expect } from 'vitest';
import {
  ENGINES, getFunnelConfig, getFunnelEngine, isBakedFunnel, shouldHideOptin,
} from '@/lib/funnelTemplates/funnelTypeRegistry';

describe('funnelTypeRegistry', () => {
  it('routes the existing vsl funnel to the custom-values engine, untouched', () => {
    expect(getFunnelEngine('vsl')).toBe(ENGINES.CUSTOM_VALUES);
    expect(isBakedFunnel('vsl')).toBe(false);
    expect(shouldHideOptin('vsl')).toBe(false);
    expect(getFunnelConfig('vsl').pages).toContain('optin');
  });

  it('routes the new booking funnel to the baked engine', () => {
    expect(getFunnelEngine('booking')).toBe(ENGINES.BAKED);
    expect(isBakedFunnel('booking')).toBe(true);
    expect(getFunnelConfig('booking').design).toBe('booking-v1');
  });

  it('booking funnel has 3 pages, no optin and no qualify', () => {
    const pages = getFunnelConfig('booking').pages;
    expect(pages).toEqual(['landing', 'calendar', 'thankYou']);
    expect(pages).not.toContain('optin');
    expect(pages).not.toContain('qualify');
  });

  it('booking hides optin (page + gift emails + optin SMS)', () => {
    expect(shouldHideOptin('booking')).toBe(true);
  });

  it('unknown / missing type falls back to the default (vsl / custom-values)', () => {
    expect(getFunnelEngine(undefined)).toBe(ENGINES.CUSTOM_VALUES);
    expect(getFunnelEngine('made-up')).toBe(ENGINES.CUSTOM_VALUES);
    expect(isBakedFunnel(null)).toBe(false);
  });
});
