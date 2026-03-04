/**
 * Subscription Utilities
 * Shared helpers for calculating and checking subscription periods.
 */

/**
 * Calculate the end date of a billing period.
 *
 * @param {string|Date} fromDate  - Start date (ISO string or Date object)
 * @param {string} billingCycle   - 'monthly' or 'annual'
 * @returns {string}              - ISO timestamp of period end
 */
export function calculatePeriodEnd(fromDate, billingCycle) {
  const end = new Date(fromDate);
  if (billingCycle === 'annual') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    // Default to monthly
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString();
}

/**
 * Check whether a subscription is currently active based on status and period end.
 * Admins are always considered active.
 *
 * @param {object} profile
 * @param {string} profile.subscription_status
 * @param {string|null} profile.subscription_current_period_end
 * @param {boolean} [isAdmin]
 * @returns {boolean}
 */
export function isSubscriptionActive(profile, isAdmin = false) {
  if (isAdmin) return true;

  const { subscription_status, subscription_current_period_end } = profile || {};

  // Explicitly cancelled or suspended
  if (subscription_status === 'cancelled' || subscription_status === 'suspended') {
    return false;
  }

  // If period end is set and has passed, treat as expired
  if (subscription_current_period_end) {
    const periodEnd = new Date(subscription_current_period_end);
    if (periodEnd < new Date()) return false;
  }

  return true;
}
