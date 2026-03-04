/**
 * TedOS Plan Configuration
 * Maps GHL SaaS Configurator plan IDs to TedOS subscription tiers.
 *
 * GHL SaaS Plans (set up in Agency Dashboard → SaaS Configurator):
 *   TedOS Starter           → $297/mo, $3,057/yr
 *   TedOS Growth            → $497/mo, $5,367/yr
 *   TedOS Scale             → $997/mo, $10,767/yr
 *   TedOS Starter Activation → same price as Starter (initial onboarding variant)
 *   TedOS Growth Activation  → same price as Growth
 *   TedOS Scale Activation   → same price as Scale
 *
 * Both the regular and Activation variants map to the same TedOS tier.
 * The distinction exists in GHL for onboarding/billing purposes only.
 */

export const PLAN_CONFIG = {
  // TedOS Starter — $297/mo
  '69a73f947bfb0815f1adf9c6': {
    tier: 'starter',
    billing_cycle: 'monthly',
    name: 'TedOS Starter',
    max_funnels: 1,
    max_seats: 1,
  },
  // TedOS Growth — $497/mo
  '69a74002b6fc3e679ec2c32b': {
    tier: 'growth',
    billing_cycle: 'monthly',
    name: 'TedOS Growth',
    max_funnels: 3,
    max_seats: 3,
  },
  // TedOS Scale — $997/mo
  '69a7405967cfa343c5bf220b': {
    tier: 'scale',
    billing_cycle: 'monthly',
    name: 'TedOS Scale',
    max_funnels: 10,
    max_seats: 10,
  },
  // TedOS Starter Activation — $3,057/yr
  '69a740c66bdbcc2101cacacd': {
    tier: 'starter',
    billing_cycle: 'annual',
    name: 'TedOS Starter Activation',
    max_funnels: 1,
    max_seats: 1,
  },
  // TedOS Growth Activation — $5,367/yr
  '69a741831d405e0395a72c0f': {
    tier: 'growth',
    billing_cycle: 'annual',
    name: 'TedOS Growth Activation',
    max_funnels: 3,
    max_seats: 3,
  },
  // TedOS Scale Activation — $10,767/yr
  '69a741eba8c8f11ef1e744ec': {
    tier: 'scale',
    billing_cycle: 'annual',
    name: 'TedOS Scale Activation',
    max_funnels: 10,
    max_seats: 10,
  },
};

/**
 * Resolve a plan by GHL plan ID or plan name.
 * Returns the plan config object or null if not found.
 *
 * @param {string} planIdOrName - GHL plan ID or plan name string
 * @returns {{ tier: string, name: string, max_funnels: number, max_seats: number } | null}
 */
export function resolvePlan(planIdOrName) {
  if (!planIdOrName) return null;

  // Direct ID lookup (preferred)
  if (PLAN_CONFIG[planIdOrName]) return PLAN_CONFIG[planIdOrName];

  // Name-based fallback (case-insensitive) in case GHL sends plan name instead of ID
  const normalized = planIdOrName.toLowerCase().trim();
  const match = Object.values(PLAN_CONFIG).find(
    (p) => p.name.toLowerCase() === normalized
  );
  return match || null;
}
