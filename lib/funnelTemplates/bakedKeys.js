/**
 * Derive the GHL custom-value KEY LIST for a baked funnel type.
 *
 * The list is produced by actually rendering each page's segments (with EMPTY
 * content) and reading the segment names — the SAME renderers the bake/push use.
 * That means this list can NEVER drift from what the bake produces: if a renderer
 * renames or adds a segment, both the "create placeholders" step and the eventual
 * "push real HTML" step see the change automatically.
 *
 * Pure / DB-free. Safe to import into any admin route.
 */

import { getFunnelConfig } from './funnelTypeRegistry';
import { renderCodedSegments } from './coded-v1/registry';
import { isCssSegment } from './segments';
import { funnelCopyToRenderData } from './booking-v1/funnelCopyMapper';

/** Empty render payload — renderers fall back to placeholder copy, so names still emit. */
const EMPTY_CONTENT = { funnelCopy: {}, media: {}, colorPalette: {}, businessName: '' };

/**
 * List every custom value a baked funnel type needs in GHL, in funnel-page order.
 * @param {string} funnelType - e.g. 'booking'
 * @returns {Array<{ name, kind, page }>} kind = 'css' (→ GHL CSS field) | 'html' (→ code element)
 */
export function listBakedFunnelKeys(funnelType = 'booking') {
    const cfg = getFunnelConfig(funnelType);
    const design = cfg.design || 'booking-v1';
    const keys = [];
    for (const page of cfg.pages) {
        const data = funnelCopyToRenderData(page, EMPTY_CONTENT);
        const segments = renderCodedSegments(design, page, data);
        for (const seg of segments) {
            keys.push({ name: seg.name, kind: isCssSegment(seg.name) ? 'css' : 'html', page });
        }
    }
    return keys;
}

/**
 * Group the key list by page for display, with a per-page split of which value
 * goes into GHL's CSS editor vs the page's custom-code element.
 * @returns {Array<{ page, css: string[], html: string[] }>}
 */
export function groupBakedFunnelKeys(funnelType = 'booking') {
    const grouped = new Map();
    for (const k of listBakedFunnelKeys(funnelType)) {
        if (!grouped.has(k.page)) grouped.set(k.page, { page: k.page, css: [], html: [] });
        grouped.get(k.page)[k.kind].push(k.name);
    }
    return Array.from(grouped.values());
}
