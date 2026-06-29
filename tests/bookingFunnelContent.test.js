/**
 * Coded Funnel — booking-v1 VAULT→RENDER bridge tests (funnelCopyMapper).
 *
 * Validates that the three real vault sources — funnelCopy (salesPage−optin / calendar /
 * thankYou), media, and the 3-color palette — reassemble into the renderer's data shape
 * and render into the final HTML. NO database.
 *
 * Run with:  npx vitest run tests/bookingFunnelContent.test.js
 */

import { describe, it, expect } from 'vitest';
import { funnelCopyToRenderData } from '@/lib/funnelTemplates/booking-v1/funnelCopyMapper';
import { renderCodedSegments } from '@/lib/funnelTemplates/coded-v1/registry';
import { assembleSegments } from '@/lib/funnelTemplates/segments';

const render = (pageKey, args) => assembleSegments(renderCodedSegments('booking-v1', pageKey === 'landing' ? 'landing' : pageKey, funnelCopyToRenderData(pageKey, args)));

describe('funnelCopyMapper — salesPage slots collapse into render data', () => {
  it('maps the 3 brand colors through to CSS variables', () => {
    const data = funnelCopyToRenderData('landing', { colorPalette: { primary: '#0a0a0a', secondary: '#111111', accent: '#ff7700' } });
    expect(data.brand).toEqual(expect.objectContaining({ primary: '#0a0a0a', secondary: '#111111', accent: '#ff7700' }));
  });

  it('normalizes palette shapes: {hex} objects and tertiary/accentColor key aliases', () => {
    const a = funnelCopyToRenderData('landing', { colorPalette: { primary: { hex: '#111111' }, secondary: { hex: '#222222' }, tertiary: { hex: '#333333' } } });
    expect(a.brand).toEqual(expect.objectContaining({ primary: '#111111', secondary: '#222222', accent: '#333333' }));
    const b = funnelCopyToRenderData('landing', { colorPalette: { primaryColor: '#aaaaaa', secondaryColor: '#bbbbbb', accentColor: '#cccccc' } });
    expect(b.brand).toEqual(expect.objectContaining({ primary: '#aaaaaa', secondary: '#bbbbbb', accent: '#cccccc' }));
  });

  it('collapses process_1..6 into a steps array, dropping empties', () => {
    const data = funnelCopyToRenderData('landing', { funnelCopy: { salesPage: {
      process_1_headline: 'Diagnose', process_1_subheadline: 'Find the constraint',
      process_2_headline: 'Plan',
      // 3..6 empty → dropped
    } } });
    expect(data.copy.steps).toHaveLength(2);
    expect(data.copy.steps[0]).toEqual({ title: 'Diagnose', text: 'Find the constraint' });
    expect(data.copy.steps[1]).toEqual({ title: 'Plan', text: '' });
  });

  it('collapses testimonials and faq, and maps audience/call bullets', () => {
    const data = funnelCopyToRenderData('landing', { funnelCopy: { salesPage: {
      testimonial_review_1_headline: 'Big win', testimonial_review_1_subheadline_with_name: '“Loved it” — A',
      faq_question_1: 'How long?', faq_answer_1: '30 min',
      audience_callout_for_1: 'Ready to act', call_expectations_is_for_bullet_1: 'A working session',
    } } });
    expect(data.copy.testimonials).toEqual([{ headline: 'Big win', quote: '“Loved it” — A' }]);
    expect(data.copy.faq).toEqual([{ q: 'How long?', a: '30 min' }]);
    expect(data.copy.audience_for).toEqual(['Ready to act']);
    expect(data.copy.call_is).toEqual(['A working session']);
  });

  it('maps media: logo, bio photo, hero video (with alias fallbacks)', () => {
    const data = funnelCopyToRenderData('landing', { media: { logo: 'L.png', bio_author: 'B.jpg', main_vsl: 'https://v/embed/1' } });
    expect(data.media).toEqual({ logoUrl: 'L.png', bioPhotoUrl: 'B.jpg', videoUrl: 'https://v/embed/1' });
  });

  it('calendar page exposes the vault embed as embeds.calendarEmbed', () => {
    const data = funnelCopyToRenderData('calendar', { funnelCopy: { calendarPage: { headline: 'Pick a time', calendar_embedded_code: '<iframe src="cal"></iframe>' } } });
    expect(data.copy.headline).toBe('Pick a time');
    expect(data.embeds.calendarEmbed).toBe('<iframe src="cal"></iframe>');
  });

  it('omits missing fields so the renderer falls back (no blanks)', () => {
    const data = funnelCopyToRenderData('landing', { funnelCopy: { salesPage: {} } });
    expect(data.copy).not.toHaveProperty('hero_headline');
    expect(data.copy).not.toHaveProperty('steps');
  });
});

describe('end-to-end (no DB): vault values render into HTML', () => {
  it('renders salesPage content into the baked landing page', () => {
    const html = render('landing', {
      businessName: 'Acme Coaching',
      colorPalette: { primary: '#0891b2', secondary: '#065f6b', accent: '#f59e0b' },
      funnelCopy: { salesPage: {
        hero_headline_text: 'Scale Past Seven Figures',
        process_1_headline: 'Diagnose', process_1_subheadline: 'Find the bottleneck',
        testimonial_review_1_headline: 'Booked 11 calls', testimonial_review_1_subheadline_with_name: '“Unreal clarity” — Jordan',
        bio_paragraph_text: 'Ten years in the trenches.',
      } },
      media: { logo: 'https://cdn/logo.png', main_vsl: 'https://youtube.com/embed/abc' },
    });
    expect(html).toContain('Scale Past Seven Figures');   // hero from vault
    expect(html).toContain('Diagnose');                   // process step from vault
    expect(html).toContain('Booked 11 calls');            // testimonial from vault
    expect(html).toContain('Ten years in the trenches.'); // bio from vault
    expect(html).toContain('--brand-accent: #f59e0b');    // 3rd color
    expect(html).toContain('src="https://youtube.com/embed/abc"'); // baked hero video
    expect(html).toContain('Acme Coaching');
  });

  it('bakes the calendar embed from the vault, no live tag needed', () => {
    const html = render('calendar', { funnelCopy: { calendarPage: { calendar_embedded_code: '<iframe src="https://book/abc"></iframe>' } } });
    expect(html).toContain('<iframe src="https://book/abc"></iframe>');
    expect(html).not.toContain('{{custom_values.appt_calendar_embed}}'); // baked, not live
  });
});
