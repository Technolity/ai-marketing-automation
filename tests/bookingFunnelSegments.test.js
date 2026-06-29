/**
 * Coded Funnel — booking-v1 SEGMENT contract tests.
 *
 * These assert the things that are NEW vs coded-v1: segment shape, safe split
 * boundaries, per-segment minification, and the literal merge-tag survival rule.
 *
 * Run with:  npx vitest run tests/bookingFunnelSegments.test.js
 */

import { describe, it, expect } from 'vitest';
import { renderCodedSegments, renderCodedPage, pageRenderMode } from '@/lib/funnelTemplates/coded-v1/registry';
import { assembleSegments, minifySegments, isSegments } from '@/lib/funnelTemplates/segments';
import { minifyHtml, mergeTag } from '@/lib/funnelTemplates/escape';

const PAGES = ['landing', 'qualify', 'calendar', 'thankYou'];

describe('booking-v1 segment contract', () => {
  it('every page is segments-mode', () => {
    for (const page of PAGES) {
      expect(pageRenderMode('booking-v1', page)).toBe('segments');
    }
  });

  it('every page returns a valid non-empty { name, html } array', () => {
    for (const page of PAGES) {
      const segs = renderCodedSegments('booking-v1', page);
      expect(isSegments(segs)).toBe(true);
      // names are unique and use the GHL-safe charset
      const names = segs.map((s) => s.name);
      expect(new Set(names).size).toBe(names.length);
      for (const n of names) expect(n).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('assembled segments form one self-contained document', () => {
    for (const page of PAGES) {
      const doc = assembleSegments(renderCodedSegments('booking-v1', page));
      expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(doc).toContain('<style>');
      expect(doc.trimEnd().endsWith('</html>')).toBe(true);
    }
  });

  it('renderCodedPage assembles segments-mode pages back into the same document', () => {
    const viaPage = renderCodedPage('booking-v1', 'calendar');
    const viaAssemble = assembleSegments(renderCodedSegments('booking-v1', 'calendar'));
    expect(viaPage).toBe(viaAssemble);
  });

  it('splits only at safe boundaries (no segment cuts a tag in half)', () => {
    for (const page of PAGES) {
      const segs = renderCodedSegments('booking-v1', page);
      for (const s of segs) {
        const firstLt = s.html.indexOf('<');
        if (firstLt === -1) continue; // pure-text/empty segment — nothing to split
        const lastGt = s.html.lastIndexOf('>');
        // Boundary safety: nothing before the first '<' may be a stray '>' (would mean
        // the segment STARTS mid-tag), and nothing after the last '>' may be a '<'
        // (would mean it ENDS mid-tag). Interior '<'/'>' inside JS/CSS are fine.
        expect(s.html.slice(0, firstLt).includes('>')).toBe(false);
        expect(s.html.slice(lastGt + 1).includes('<')).toBe(false);
      }
    }
  });

  it('minifies each segment to a single line independently', () => {
    for (const page of PAGES) {
      const minified = minifySegments(renderCodedSegments('booking-v1', page), minifyHtml);
      for (const s of minified) {
        expect(s.html).not.toMatch(/\n/);
        expect(s.html).not.toMatch(/\t/);
        expect(s.html).not.toMatch(/>\s+</);
      }
      // assembling the minified chunks still yields a valid doc
      const doc = assembleSegments(minified);
      expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(doc).toContain('</html>');
    }
  });

  it('keeps live-embed merge tags LITERAL through render and minify', () => {
    const calBody = renderCodedSegments('booking-v1', 'calendar').find((s) => s.name === 'bv1_calendar_main');
    expect(calBody.html).toContain('{{custom_values.appt_calendar_embed}}');
    expect(minifyHtml(calBody.html)).toContain('{{custom_values.appt_calendar_embed}}');

    const qualBody = renderCodedSegments('booking-v1', 'qualify').find((s) => s.name === 'bv1_qualify_body');
    expect(qualBody.html).toContain('{{custom_values.appt_qualify_form}}');
    expect(minifyHtml(qualBody.html)).toContain('{{custom_values.appt_qualify_form}}');
  });

  it('mergeTag accepts safe keys and rejects unsafe ones', () => {
    expect(mergeTag('appt_calendar_embed')).toBe('{{custom_values.appt_calendar_embed}}');
    expect(() => mergeTag('bad key')).toThrow();
    expect(() => mergeTag('"><script>')).toThrow();
    expect(() => mergeTag('Uppercase')).toThrow();
  });
});
