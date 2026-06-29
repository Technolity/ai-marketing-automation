/**
 * Funnel type → ENGINE routing. The single switch that decides whether a funnel is
 * dressed by the OLD ~90-custom-value model or the NEW coded/baked model.
 *
 * Source of truth = user_funnels.selected_funnel_type (saved at funnel-recommendation).
 * Generation, vault preview, and deploy all branch on this — read it here, never
 * hardcode the decision elsewhere.
 *
 * Both architectures coexist (user decision, June 2026): the existing 'vsl' funnel
 * keeps the custom-values engine untouched; NEW funnel types use the baked engine.
 */

export const ENGINES = {
  CUSTOM_VALUES: 'custom-values', // existing: one custom value per field, GHL builder paints the page
  BAKED: 'baked',                 // new: TedOS bakes full HTML, splits into segment custom values
};

/**
 * Behavior config per funnel type. `pages` lists the funnel's page keys in order.
 * `hideOptin` tells the vault UI / generation to suppress optin page + free-gift
 * emails + optin SMS for this type. `contentSection` is the vault section the baked
 * render reads from (booking REUSES the existing funnelCopy content — no new section).
 */
export const FUNNEL_TYPE_CONFIG = {
  vsl: {
    id: 'vsl',
    label: 'Appointment Generating Funnel with Free Gift',
    engine: ENGINES.CUSTOM_VALUES,
    recommended: true,
    pages: ['optin', 'sales', 'calendar', 'thankYou'],
    hideOptin: false,
  },
  booking: {
    id: 'booking',
    label: 'Appointment Booking Funnel',
    engine: ENGINES.BAKED,
    design: 'booking-v1',
    // No optin, no qualify — VSL/appointment-booking landing, then calendar, then thanks.
    pages: ['landing', 'calendar', 'thankYou'],
    hideOptin: true,
    contentSection: 'funnelCopy', // reuse existing funnelCopy (salesPage − optin) + calendar + thankYou
  },
};

/** Default when a funnel has no selected_funnel_type yet (oldest funnels). */
export const DEFAULT_FUNNEL_TYPE = 'vsl';

/** Resolve the full config for a type (falls back to the default type). */
export function getFunnelConfig(type) {
  return FUNNEL_TYPE_CONFIG[type] || FUNNEL_TYPE_CONFIG[DEFAULT_FUNNEL_TYPE];
}

/** Which rendering engine this funnel type uses. */
export function getFunnelEngine(type) {
  return getFunnelConfig(type).engine;
}

/** True if this funnel type is rendered by the new baked engine. */
export function isBakedFunnel(type) {
  return getFunnelEngine(type) === ENGINES.BAKED;
}

/** True if the vault UI / generation should hide optin page + gift emails + optin SMS. */
export function shouldHideOptin(type) {
  return Boolean(getFunnelConfig(type).hideOptin);
}
