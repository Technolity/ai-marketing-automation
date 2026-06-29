/**
 * Coded Funnel template registry.
 *
 * Maps a designId + pageKey to the renderer that produces that page's HTML.
 * Adding a new design later = add a top-level entry here; the deploy pipeline and
 * the admin test tool both resolve pages through this registry, so nothing else
 * has to change.
 *
 * Two render MODES exist, declared per page:
 *   - 'doc'      → page exposes `render(data)` returning ONE full HTML string
 *                  (one GHL custom value). This is the original coded-v1 model.
 *   - 'segments' → page exposes `renderSegments(data)` returning an ordered array
 *                  of { name, html } chunks (one GHL custom value EACH), for pages
 *                  too large to fit a single value. This is the booking-v1 model.
 *
 * renderCodedPage() still works for BOTH modes (it assembles segment pages back
 * into one doc), so every existing caller is unaffected.
 */

import { renderOptinPage } from './optinPage';
import { renderSalesPage } from './salesPage';
import { renderCalendarPage } from './calendarPage';
import { renderThankYouPage } from './thankYouPage';
import { renderLandingSegments } from '../booking-v1/landingPage';
import { renderQualifySegments } from '../booking-v1/qualifyPage';
import { renderCalendarSegments } from '../booking-v1/calendarPage';
import { renderThankYouSegments } from '../booking-v1/thankYouPage';
import { assembleSegments } from '../segments';

export const DESIGNS = {
    'coded-v1': {
        label: 'Coded v1',
        // Order here = funnel page order (optin → sales → calendar → thank-you).
        pages: {
            optin: { label: 'Opt-in', render: renderOptinPage },
            sales: { label: 'Sales', render: renderSalesPage },
            calendar: { label: 'Calendar', render: renderCalendarPage },
            thankYou: { label: 'Thank You', render: renderThankYouPage },
        },
    },
    'booking-v1': {
        label: 'Booking v1',
        // Order here = funnel page order (landing → qualify → calendar → thank-you).
        // Every page is segments-mode (multiple custom values per page).
        pages: {
            landing: { label: 'Landing', renderSegments: renderLandingSegments },
            qualify: { label: 'Qualify', renderSegments: renderQualifySegments },
            calendar: { label: 'Calendar', renderSegments: renderCalendarSegments },
            thankYou: { label: 'Thank You', renderSegments: renderThankYouSegments },
        },
    },
};

/** Resolve a page entry or throw a clear error. Internal helper. */
function getPage(designId, pageKey) {
    const design = DESIGNS[designId];
    if (!design) throw new Error(`Unknown coded-funnel design: ${designId}`);
    const page = design.pages[pageKey];
    if (!page) throw new Error(`Unknown page "${pageKey}" for design "${designId}"`);
    return page;
}

/** 'doc' if the page renders one string, 'segments' if it renders a chunk array. */
export function pageRenderMode(designId, pageKey) {
    const page = getPage(designId, pageKey);
    return typeof page.renderSegments === 'function' ? 'segments' : 'doc';
}

/** List page keys+labels for a design (for UI dropdowns). */
export function listPages(designId) {
    const design = DESIGNS[designId];
    if (!design) return [];
    return Object.entries(design.pages).map(([key, p]) => ({ key, label: p.label }));
}

/**
 * Render one page to its named segments: [{ name, html }, ...].
 * A 'doc'-mode page is wrapped as a single segment named 'full' so callers can
 * treat every design uniformly.
 */
export function renderCodedSegments(designId, pageKey, data = {}) {
    const page = getPage(designId, pageKey);
    if (typeof page.renderSegments === 'function') return page.renderSegments(data);
    return [{ name: 'full', html: page.render(data) }];
}

/**
 * Render one page to a full HTML string. Throws on an unknown design/page.
 * For segments-mode pages, the chunks are assembled back into one document — the
 * same concatenation GHL performs — so legacy callers and previews keep working.
 */
export function renderCodedPage(designId, pageKey, data = {}) {
    const page = getPage(designId, pageKey);
    if (typeof page.render === 'function') return page.render(data);
    return assembleSegments(page.renderSegments(data));
}
