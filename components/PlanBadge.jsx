"use client";
import { useState, useEffect, useRef } from "react";
import { Zap, Star, Crown, ArrowUpRight, TrendingUp, CalendarDays, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PlanBadge - Classic Edition
 *
 * Shows the user's current plan name + an upgrade dropdown.
 * Refined with a structural, rectangular aesthetic.
 */

let tierCache = null;

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
        border: 'border-cyan/30',
        bg: 'bg-cyan/5',
        priceMonthly: '$297/mo',
        priceAnnual: '$3,057/yr',
    },
    growth: {
        label: 'TedOS Growth',
        shortLabel: 'Growth',
        icon: Star,
        color: 'text-blue-400',
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        priceMonthly: '$497/mo',
        priceAnnual: '$5,367/yr',
    },
    scale: {
        label: 'TedOS Scale',
        shortLabel: 'Scale',
        icon: Crown,
        color: 'text-cyan',
        border: 'border-cyan/20',
        bg: 'bg-cyan/5',
        priceMonthly: '$997/mo',
        priceAnnual: '$10,767/yr',
    },
};

const TIER_ORDER = ['starter', 'growth', 'scale'];
const UPGRADE_URL = process.env.NEXT_PUBLIC_GHL_UPGRADE_URL || null;

export default function PlanBadge({ tier: tierProp }) {
    const [tier, setTier] = useState(
        tierProp ? normalizeTier(tierProp) : (tierCache || null)
    );
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

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

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

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
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 border transition-all",
                    meta.border,
                    meta.bg,
                    "hover:bg-white/10"
                )}
            >
                <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", meta.color)}>
                    {meta.shortLabel}
                </span>
                {upgradeOptions.length > 0 && (
                    <TrendingUp className="w-3 h-3 text-gray-600" />
                )}
            </button>

            {open && (
                <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#111113] border border-white/10 shadow-2xl z-50 overflow-hidden">
                    {/* Current plan */}
                    <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                        <p className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-600 mb-2">Current Status</p>
                        <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", meta.color)} />
                            <span className="text-xs font-black uppercase tracking-widest text-white">{meta.label}</span>
                        </div>
                    </div>

                    {/* Upgrade options */}
                    {upgradeOptions.length > 0 ? (
                        <div className="p-1">
                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-600 px-4 py-3">
                                Available Upgrades
                            </p>
                            {upgradeOptions.map((opt) => {
                                const OptIcon = opt.icon;
                                return (
                                    <div key={opt.tier} className="mb-2 last:mb-0 border border-white/5 bg-white/[0.01]">
                                        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                                            <OptIcon className={cn("w-3 h-3", opt.color)} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", opt.color)}>{opt.label}</span>
                                        </div>
                                        <div className="p-1 space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => UPGRADE_URL && window.open(UPGRADE_URL, '_blank')}
                                                disabled={!UPGRADE_URL}
                                                className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-white/5 transition-colors disabled:opacity-30"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw className="w-3 h-3 text-gray-600" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Monthly</span>
                                                </div>
                                                <span className="text-[10px] font-black text-white">{opt.priceMonthly}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => UPGRADE_URL && window.open(UPGRADE_URL, '_blank')}
                                                disabled={!UPGRADE_URL}
                                                className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-white/5 transition-colors disabled:opacity-30"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="w-3 h-3 text-gray-600" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Annual</span>
                                                </div>
                                                <span className="text-[10px] font-black text-white">{opt.priceAnnual}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-5 py-4 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-cyan" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Maximum Tier Reached</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
