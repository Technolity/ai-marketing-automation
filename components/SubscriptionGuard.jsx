"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionLockedPage from "./SubscriptionLockedPage";

/**
 * SubscriptionGuard
 *
 * Wraps the entire app. On mount, fetches the user's subscription status
 * from /api/user/profile. If the subscription is cancelled, suspended, or
 * the billing period has expired, shows SubscriptionLockedPage.
 *
 * Admins always bypass this check.
 * Routes starting with /admin, /auth, /sign-in, /sign-up, and / are always allowed.
 * Users who have never been on a paid plan (no subscription_status) also pass through
 * — this guard only activates for GHL SaaS-provisioned accounts.
 *
 * The check runs once per session (on first protected route visit).
 * Subsequent navigations reuse the cached result — no repeated API calls.
 */

const ALWAYS_ALLOWED = ['/admin', '/auth', '/sign-in', '/sign-up', '/'];

function isAlwaysAllowed(pathname) {
    if (pathname === '/') return true;
    return ALWAYS_ALLOWED.some((prefix) => prefix !== '/' && pathname.startsWith(prefix));
}

export default function SubscriptionGuard({ children }) {
    const { isAdmin, loading: authLoading } = useAuth();
    const pathname = usePathname();
    const hasFetched = useRef(false);
    const [subscriptionState, setSubscriptionState] = useState({
        checked: false,
        locked: false,
        status: null,
        periodEnd: null,
        cancelledAt: null,
        tier: null,
        billingCycle: null,
    });

    useEffect(() => {
        // Skip check for always-allowed paths and admins
        if (isAlwaysAllowed(pathname) || isAdmin) return;
        // Only fetch once per session — subsequent navigations reuse cached result
        if (hasFetched.current) return;
        hasFetched.current = true;

        let isMounted = true;

        const checkSubscription = async () => {
            try {
                const res = await fetch('/api/user/profile', { cache: 'no-store' });
                if (!res.ok) {
                    // Not authenticated or error — let Clerk/auth handle it, don't block
                    if (isMounted) setSubscriptionState((s) => ({ ...s, checked: true, locked: false }));
                    return;
                }
                const profile = await res.json();

                const status = profile.subscription_status;
                const periodEnd = profile.subscription_current_period_end || null;
                const cancelledAt = profile.subscription_cancelled_at || null;
                const tier = profile.subscription_tier || null;
                const billingCycle = profile.billing_cycle || null;

                // Only enforce for GHL SaaS-provisioned accounts
                if (!profile.ghl_saas_provisioned) {
                    if (isMounted) setSubscriptionState((s) => ({ ...s, checked: true, locked: false }));
                    return;
                }

                // Check if locked
                const isCancelledOrSuspended = status === 'cancelled' || status === 'suspended';
                const isPeriodExpired = periodEnd ? new Date(periodEnd) < new Date() : false;
                const locked = isCancelledOrSuspended || isPeriodExpired;

                if (isMounted) {
                    setSubscriptionState({ checked: true, locked, status, periodEnd, cancelledAt, tier, billingCycle });
                }
            } catch {
                // Fail open — don't block the site if check fails
                if (isMounted) setSubscriptionState((s) => ({ ...s, checked: true, locked: false }));
            }
        };

        checkSubscription();

        return () => { isMounted = false; };
    }, [pathname, isAdmin]);

    // Always-allowed paths pass through immediately
    if (isAlwaysAllowed(pathname)) return <>{children}</>;

    // Admins always pass through
    if (!authLoading && isAdmin) return <>{children}</>;

    // Wait for auth + subscription check
    if (authLoading || !subscriptionState.checked) {
        return <SubscriptionLoadingScreen />;
    }

    // Locked — show blocked page
    if (subscriptionState.locked) {
        return (
            <SubscriptionLockedPage
                status={subscriptionState.status}
                periodEnd={subscriptionState.periodEnd}
                cancelledAt={subscriptionState.cancelledAt}
                tier={subscriptionState.tier}
                billingCycle={subscriptionState.billingCycle}
            />
        );
    }

    return <>{children}</>;
}

function SubscriptionLoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9998] bg-[#0a0a0b] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-cyan rounded-full animate-spin" />
        </div>
    );
}
