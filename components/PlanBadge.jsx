"use client";
import { useState, useEffect, useRef } from "react";
import { Zap, Star, Crown, ArrowUpRight, TrendingUp, CalendarDays, RefreshCw } from "lucide-react";

/**
 * PlanBadge
 *
 * Shows the user's current plan name + an upgrade dropdown.
 * Used in the dashboard header and AppNavbar.
 *
 * - If `tier` prop is provided (already loaded), uses it directly.
 * - Otherwise fetches /api/user/profile once and caches the result.
 * - Each upgrade tier shows both Monthly and Annual (Activation) options.
 * - Old tier naming (tier1/tier2/tier3) is normalized to starter/growth/scale.
 */

// Module-level cache — survives re-renders and component remounts within a session
let tierCache = null;

// Normalize old tier naming to new naming
const normalizeTier = (t) => {
    const map = { tier1: 'starter', tier2: 'growth', tier3: 'scale' };
    return map[t] || t;
};

const PLAN_META = {
    starter: {
        label: 'TedOS Starter',
        shortLabel: 'Starter',
        icon: Zap,
        color: 'text-cyan',
        border: 'border-cyan/20',
        bg: 'bg-cyan/5',
        priceMonthly: '$297/mo',
        priceAnnual: '$3,057/yr',
    },
    growth: {
        label: 'TedOS Growth',
        shortLabel: 'Growth',
        icon: Star,
        color: 'text-purple-400',
        border: 'border-purple-500/20',
        bg: 'bg-purple-500/10',
        priceMonthly: '$497/mo',
        priceAnnual: '$5,367/yr',
    },
    scale: {
        label: 'TedOS Scale',
        shortLabel: 'Scale',
        icon: Crown,
        color: 'text-amber-400',
        border: 'border-amber-500/20',
        bg: 'bg-amber-500/10',
        priceMonthly: '$997/mo',
        priceAnnual: '$10,767/yr',
    },
};

const TIER_ORDER = ['starter', 'growth', 'scale'];

export default function PlanBadge({ tier: tierProp }) {
    const [tier, setTier] = useState(
        tierProp ? normalizeTier(tierProp) : (tierCache || null)
    );
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Sync tier prop → state + cache
    useEffect(() => {
        if (tierProp) {
            const normalized = normalizeTier(tierProp);
            tierCache = normalized;
            setTier(normalized);
            return;
        }
        if (tierCache) {
            setTier(tierCache);
            return;
        }
        // Fetch once if no prop and no cache
        fetch('/api/user/profile', { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.subscription_tier) {
                    const normalized = normalizeTier(data.subscription_tier);
                    tierCache = normalized;
                    setTier(normalized);
                }
            })
            .catch(() => {});
    }, [tierProp]);

    // Click-outside to close dropdown
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Don't render until we know the tier
    if (!tier || !PLAN_META[tier]) return null;

    const meta = PLAN_META[tier];
    const Icon = meta.icon;
    const currentIndex = TIER_ORDER.indexOf(tier);
    const upgradeOptions = TIER_ORDER.slice(currentIndex + 1).map((t) => ({
        ...PLAN_META[t],
        tier: t,
    }));

    return (
        <div ref={ref} className="relative hidden sm:block">
            <button
                onClick={() => setOpen((o) => !o)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${meta.border} ${meta.bg} hover:opacity-80 transition-opacity`}
            >
                <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>
                    {meta.shortLabel}
                </span>
                {upgradeOptions.length > 0 && (
                    <TrendingUp className="w-3 h-3 text-gray-500" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#111113] border border-[#2a2a2d] shadow-2xl z-50 overflow-hidden">
                    {/* Current plan */}
                    <div className="px-4 py-3 border-b border-[#1f1f22]">
                        <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Current Plan</p>
                        <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                            <span className="text-sm font-semibold text-white">{meta.label}</span>
                            <span className={`text-xs ${meta.color} ml-auto`}>{meta.priceMonthly}</span>
                        </div>
                    </div>

                    {/* Upgrade options or top-plan message */}
                    {upgradeOptions.length > 0 ? (
                        <div className="p-2">
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 px-2 py-1.5">
                                Upgrade Plan
                            </p>
                            {upgradeOptions.map((opt) => {
                                const OptIcon = opt.icon;
                                return (
                                    <div key={opt.tier} className="mb-1 last:mb-0">
                                        {/* Tier header */}
                                        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                                            <div className={`w-6 h-6 rounded-lg ${opt.bg} border ${opt.border} flex items-center justify-center flex-shrink-0`}>
                                                <OptIcon className={`w-3 h-3 ${opt.color}`} />
                                            </div>
                                            <span className={`text-xs font-bold ${opt.color}`}>{opt.label}</span>
                                        </div>
                                        {/* Monthly option */}
                                        <button
                                            type="button"
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group ml-2 w-full text-left"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs text-gray-300 font-medium">Monthly</span>
                                                <span className="text-xs text-gray-500 ml-2">{opt.priceMonthly}</span>
                                            </div>
                                            <ArrowUpRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                        </button>
                                        {/* Annual option */}
                                        <button
                                            type="button"
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group ml-2 w-full text-left"
                                        >
                                            <CalendarDays className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs text-gray-300 font-medium">Annual</span>
                                                <span className="text-xs text-gray-500 ml-2">{opt.priceAnnual}</span>
                                            </div>
                                            <ArrowUpRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-4 py-3 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-gray-400">You&apos;re on the highest plan</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
