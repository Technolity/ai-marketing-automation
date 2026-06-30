/**
 * ABFv2 (Appointment Booking Funnel v2) slot key template -- SEPARATE from the 195-key
 * vsl KEY_TEMPLATE. Keys are slot-prefixed `{NN}_abfv2_<base>` so they never collide with
 * the existing funnel's values and so one location can host up to N cloned booking offers.
 *
 * Contents (per the funnel-type decision):
 *  - 11 BAKED page segments (HTML/CSS) -- names come from the renderers (bakedKeys), the
 *    single source of truth. Filled by the bake/push, not a vault field.
 *  - WORKFLOW content reused from the vsl template -- emails + sms + appointmentReminders +
 *    company -- EXCLUDING the optin free-gift delivery emails (free_gift_email_*). The
 *    optin_email_* / optin_sms_* day1-15 entries are the nurture/no-show sequence, KEPT.
 *  - Copy / colors / media are NOT here -- they bake into the HTML, not separate values.
 */

import { KEY_TEMPLATE } from './keyTemplate.js';
import { listBakedFunnelKeys } from '../../funnelTemplates/bakedKeys.js';

export const ABFV2_PREFIX = 'abfv2_';

/** vsl-template sections whose content carries over to the booking funnel's GHL workflows. */
const WORKFLOW_SECTIONS = ['emails', 'sms', 'appointmentReminders', 'company'];

/** Baked page segments -- base name = renderer segment name (e.g. bv1_landing_css). */
const bakedEntries = listBakedFunnelKeys('booking').map((k) => ({
  base: k.name,
  section: 'funnelHtml',
  kind: k.kind,        // 'css' (page CSS field) | 'html' (code element)
  page: k.page,
  source: 'bake',      // value supplied by the bake/push, not the vault
}));

/** Workflow content reused from the vsl template, minus optin free-gift delivery emails. */
const workflowEntries = KEY_TEMPLATE
  .filter((e) => WORKFLOW_SECTIONS.includes(e.section) && !e.base.startsWith('free_gift'))
  .map((e) => ({ base: e.base, section: e.section, vaultPath: e.vaultPath, source: 'vault' }));

/** The full ABFv2 key set (un-prefixed bases). */
export const ABFV2_KEY_TEMPLATE = [...bakedEntries, ...workflowEntries];

/**
 * Slot-specific ABFv2 keys: every base prefixed `{NN}_abfv2_`.
 * @param {number} slotIndex - 1-based slot number (slot 1 => '01_abfv2_').
 * @returns {Array<{base,section,source,kind?,page?,vaultPath?,ghlKey}>}
 */
export function getAbfv2SlotKeys(slotIndex) {
  const prefix = String(slotIndex).padStart(2, '0') + '_' + ABFV2_PREFIX;
  return ABFV2_KEY_TEMPLATE.map((e) => ({ ...e, ghlKey: prefix + e.base }));
}

/** Count summary by section (for admin UI / sanity). */
export function abfv2KeyCounts() {
  return ABFV2_KEY_TEMPLATE.reduce((acc, e) => {
    acc[e.section] = (acc[e.section] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {});
}
