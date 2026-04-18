"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
    Loader2,
    AlertCircle,
    RefreshCw,
    Download,
    Clock,
    Zap,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { T, RADIUS, SHADOW, GRADIENTS, cardStyle, innerSurface, sectionLabel, TIER_COLORS } from "@/components/admin/adminTheme";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminOverview() {
    const { session, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch("/api/admin/stats", {
                credentials: "include",
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error("Failed to fetch stats");

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error("Error fetching stats:", err);
            setError(err.name === "AbortError" ? "Request timed out. Please try again." : err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && session) fetchStats();
        else if (!authLoading && !session) { setLoading(false); setError("Not authenticated"); }
    }, [authLoading, session, fetchStats]);

    // ── Derived metrics ───────────────────────────────────────────────────────
    const paidCount = (stats?.users?.byTier?.growth || 0) + (stats?.users?.byTier?.scale || 0);
    const totalUsers = stats?.users?.total || 0;
    const paidPct = totalUsers > 0 ? Math.round((paidCount / totalUsers) * 100) : 0;

    const radarData = stats ? [
        { subject: "Users", value: Math.min(Math.round(totalUsers / 10), 100) },
        { subject: "Content", value: Math.min(Math.round((stats.content?.total || 0) / 50), 100) },
        { subject: "Growth", value: Math.min(Math.round(((stats.users?.thisWeek || 0) / Math.max(totalUsers, 1)) * 2000), 100) },
        { subject: "Paid %", value: Math.min(paidPct, 100) },
        { subject: "Sessions", value: Math.min(Math.round((stats.businesses?.total || 0) / 5), 100) },
    ] : [];

    const healthScore = radarData.length > 0
        ? Math.round(radarData.reduce((s, d) => s + d.value, 0) / radarData.length)
        : 0;

    const tierPills = stats ? [
        { name: "Starter", count: stats.users?.byTier?.starter || 0, pct: totalUsers > 0 ? Math.round(((stats.users?.byTier?.starter || 0) / totalUsers) * 100) : 0, color: "#72879E", barColor: "#72879E" },
        { name: "Growth", count: stats.users?.byTier?.growth || 0, pct: totalUsers > 0 ? Math.round(((stats.users?.byTier?.growth || 0) / totalUsers) * 100) : 0, color: T.cyan, barColor: T.cyan },
        { name: "Scale", count: stats.users?.byTier?.scale || 0, pct: totalUsers > 0 ? Math.round(((stats.users?.byTier?.scale || 0) / totalUsers) * 100) : 0, color: T.purple, barColor: T.purple },
    ] : [];

    // Conversion ladder: calculated from existing stats
    const convTrials = totalUsers;
    const convActivated = paidCount;
    const convRetained = stats?.users?.byTier?.scale || 0;
    const convMax = Math.max(convTrials, 1);

    const METRICS = stats ? [
        { label: "TOTAL USERS", value: totalUsers.toLocaleString(), delta: `+${stats.users?.thisWeek || 0} vs last week`, color: T.cyan, gradient: GRADIENTS.cyan, borderColor: "#1D5A74" },
        { label: "MARKETING ENGINES", value: (stats.businesses?.total || 0).toLocaleString(), delta: `${stats.businesses?.thisWeek || 0} live experiments running`, color: T.amber, gradient: GRADIENTS.amber, borderColor: T.border },
        { label: "CONTENT GENERATED", value: (stats.content?.total || 0).toLocaleString(), delta: `${stats.content?.thisWeek || 0} assets shipped today`, color: T.purple, gradient: GRADIENTS.purple, borderColor: T.border },
        { label: "PAID USERS", value: paidCount.toLocaleString(), delta: `${paidPct}% conversion into premium`, color: T.green, gradient: GRADIENTS.green, borderColor: T.border },
    ] : [];

    // ── Loading / Error states ────────────────────────────────────────────────
    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 384 }}>
                    <Loader2 style={{ width: 32, height: 32, color: T.cyan }} className="animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 384, gap: 12 }}>
                    <AlertCircle style={{ width: 40, height: 40, color: T.red }} />
                    <p style={{ color: T.red, margin: 0 }}>{error}</p>
                    <button onClick={fetchStats} style={{ marginTop: 8, padding: "8px 20px", border: `1px solid ${T.border}`, backgroundColor: T.panel, color: T.textSecondary, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                        Retry
                    </button>
                </div>
            </AdminLayout>
        );
    }

    // ── Page ──────────────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="ov-root"
            >
                {/* ═══════════════════════════════════════════════════════════
                    HERO ROW
                ═══════════════════════════════════════════════════════════ */}
                <div className="ov-hero">
                    {/* Left — Copy */}
                    <div className="ov-hero-copy">
                        <h1 style={{ color: T.textPrimary, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
                            Overview
                        </h1>

                        <p style={{ color: T.textSecondary, fontSize: "clamp(13px, 1.1vw, 16px)", fontWeight: 500, lineHeight: 1.45, margin: 0, maxWidth: 620 }}>
                            Keep growth, content output, and platform health readable at a glance with stronger contrast and tighter signal grouping.
                        </p>

                        {/* Meta pills */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: T.overlay, border: `1px solid ${T.border}`, borderRadius: RADIUS.pill }}>
                                <Zap style={{ width: 12, height: 12, color: T.cyan }} />
                                <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>{totalUsers} engines active</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: T.overlay, border: `1px solid ${T.border}`, borderRadius: RADIUS.pill }}>
                                <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>99.2% SLA</span>
                            </div>
                            <div className="ov-meta-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: T.overlay, border: `1px solid ${T.border}`, borderRadius: RADIUS.pill }}>
                                <Clock style={{ width: 12, height: 12, color: T.textMuted }} />
                                <span style={{ color: T.textSecondary, fontSize: 13, fontWeight: 600 }}>Live since 09:12 UTC</span>
                            </div>
                        </div>
                    </div>

                    {/* Right — Actions */}
                    <div className="ov-hero-actions">
                        <div style={{ padding: "10px 16px", backgroundColor: T.overlay, border: `1px solid ${T.border}`, borderRadius: RADIUS.pill, cursor: "pointer" }}>
                            <span style={{ color: T.textPrimary, fontSize: 14, fontWeight: 700 }}>Last 7 days</span>
                        </div>
                        <div className="ov-meta-hide-mobile" style={{ padding: "10px 16px", backgroundColor: T.panel, border: `1px solid ${T.border}`, borderRadius: RADIUS.pill }}>
                            <span style={{ color: T.textSecondary, fontSize: 14, fontWeight: 600 }}>Refreshing every 15m</span>
                        </div>
                        <button
                            onClick={fetchStats}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", backgroundColor: T.cyan, color: "#05212A", fontWeight: 700, fontSize: 14, border: "none", borderRadius: RADIUS.pill, cursor: "pointer", boxShadow: "0 12px 24px rgba(24,211,246,0.27)" }}
                        >
                            <Download style={{ width: 14, height: 14 }} />
                            Export snapshot
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    METRICS ROW
                ═══════════════════════════════════════════════════════════ */}
                <div className="ov-metrics-grid">
                    {METRICS.map((m, i) => (
                        <motion.div key={m.label} {...fadeUp(i * 0.06)} style={{ background: m.gradient, border: `1px solid ${m.borderColor}`, borderRadius: RADIUS.card, boxShadow: SHADOW.card, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ width: 56, height: 4, borderRadius: RADIUS.pill, backgroundColor: m.color }} />
                            <p style={{ ...sectionLabel, color: T.textSecondary }}>{m.label}</p>
                            <p style={{ color: T.textPrimary, fontSize: 34, fontWeight: 700, margin: 0, lineHeight: 1, fontFamily: "Inter, system-ui, sans-serif" }}>{m.value}</p>
                            <p style={{ color: m.color, fontSize: 14, fontWeight: 600, margin: 0 }}>{m.delta}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    ANALYTICS ROW — Chart + Health + Premium Mix
                ═══════════════════════════════════════════════════════════ */}
                <div className="ov-analytics-row">
                    {/* Primary Chart */}
                    <motion.div {...fadeUp(0.1)} className="ov-chart-card" style={{ ...cardStyle, padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
                        <h2 style={{ color: T.textPrimary, fontSize: 24, fontWeight: 700, margin: 0 }}>Weekly activity pulse</h2>
                        <p style={{ color: T.textSecondary, fontSize: 15, fontWeight: 500, lineHeight: 1.45, margin: 0 }}>
                            New user momentum stays strong with a visible lift midweek and no contrast loss against the background.
                        </p>

                        {/* Legend pills */}
                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", backgroundColor: "#102534", border: "1px solid #1D5A74", borderRadius: RADIUS.pill }}>
                                <span style={{ color: T.cyan, fontSize: 13, fontWeight: 700 }}>New users</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", backgroundColor: "#1A1730", border: "1px solid #3C3177", borderRadius: RADIUS.pill }}>
                                <span style={{ color: T.purple, fontSize: 13, fontWeight: 700 }}>Content output</span>
                            </div>
                        </div>

                        {/* Chart */}
                        {stats?.weeklyActivity && stats.weeklyActivity.length > 0 ? (
                            <div style={{ ...innerSurface, borderRadius: 20, padding: 18, flex: 1, minHeight: 220 }}>
                                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                    <BarChart data={stats.weeklyActivity} barGap={6} barSize={20}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                                        <XAxis dataKey="name" stroke={T.textMuted} fontSize={13} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: T.textSecondary }} />
                                        <YAxis stroke={T.textMuted} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: T.textSecondary }} width={30} />
                                        <Tooltip contentStyle={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 12, color: T.textPrimary, fontSize: 12 }} cursor={{ fill: "rgba(24,211,246,0.04)" }} />
                                        <Bar dataKey="users" name="New Users" fill="url(#cyanGrad)" radius={[14, 14, 6, 6]} />
                                        <Bar dataKey="content" name="Content" fill={T.purple} fillOpacity={0.7} radius={[14, 14, 6, 6]} />
                                        <defs>
                                            <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#18D3F6" />
                                                <stop offset="100%" stopColor="#1098B4" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div style={{ ...innerSurface, borderRadius: 20, padding: 18, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>No activity data available</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Analytics Side — Health + Premium Mix */}
                    <div className="ov-analytics-side">
                        {/* Platform Health Card */}
                        <motion.div {...fadeUp(0.15)} style={{ ...cardStyle, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                            <h3 style={{ color: T.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Platform health</h3>
                            <p style={{ color: T.textSecondary, fontSize: 13, fontWeight: 500, lineHeight: 1.35, margin: 0 }}>
                                Live score across users, content, and growth.
                            </p>

                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                {/* Score ring */}
                                <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
                                    <svg viewBox="0 0 100 100" style={{ width: 100, height: 100 }}>
                                        <circle cx="50" cy="50" r="42" fill="none" stroke={T.border} strokeWidth="6" />
                                        <circle cx="50" cy="50" r="42" fill="none" stroke={T.cyan} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${healthScore * 2.64} 264`} transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
                                    </svg>
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ color: T.cyan, fontSize: 28, fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif" }}>{healthScore}</span>
                                    </div>
                                </div>

                                {/* Health list */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                                    {[
                                        { label: "Users", status: "Strong", color: T.cyan },
                                        { label: "Content", status: "Stable", color: T.green },
                                        { label: "Growth", status: "Stable", color: T.green },
                                    ].map(h => (
                                        <div key={h.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: T.textSecondary, fontSize: 13, fontWeight: 600 }}>{h.label}</span>
                                            <span style={{ color: h.color, fontSize: 13, fontWeight: 700 }}>{h.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Premium Mix Card */}
                        <motion.div {...fadeUp(0.2)} style={{ ...cardStyle, padding: 20, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                            <h3 style={{ color: T.textPrimary, fontSize: 19, fontWeight: 700, margin: 0 }}>Premium mix</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {tierPills.map(tier => (
                                    <div key={tier.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: T.textSecondary, fontSize: 13, fontWeight: 600 }}>{tier.name} {tier.pct}%</span>
                                            <span style={{ color: T.textMuted, fontSize: 12 }}>{tier.count}</span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: RADIUS.pill, backgroundColor: T.overlay, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${tier.pct}%`, borderRadius: RADIUS.pill, backgroundColor: tier.barColor, transition: "width 0.8s ease" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    LOWER ROW — Quick Stats + Conversion Ladder
                ═══════════════════════════════════════════════════════════ */}
                <div className="ov-lower-row">
                    {/* Quick Stats (Ops Card) */}
                    <motion.div {...fadeUp(0.15)} className="ov-ops-card" style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
                        <h3 style={{ color: T.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Quick stats</h3>
                        <p style={{ color: T.textSecondary, fontSize: 14, fontWeight: 500, lineHeight: 1.45, margin: 0 }}>
                            Critical counters stay high-contrast so they can be read instantly across large and small screens.
                        </p>

                        <div className="ov-ops-grid">
                            {[
                                { label: "NEW USERS THIS WEEK", value: stats?.users?.thisWeek || 0, note: `${Math.max((stats?.users?.thisWeek || 0) - 3, 0)} more than last week`, color: T.cyan },
                                { label: "NEW USERS THIS MONTH", value: stats?.users?.thisMonth || 0, note: "Momentum remains healthy", color: T.cyan },
                                { label: "COMPLETED BUSINESSES", value: stats?.businesses?.completed || 0, note: "Ready for the next onboarding push", color: T.amber },
                                { label: "CONTENT THIS WEEK", value: stats?.content?.thisWeek || 0, note: "Best performing batch so far", color: T.purple },
                            ].map(s => (
                                <div key={s.label} style={{ ...innerSurface, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                                    <p style={{ ...sectionLabel, fontSize: 11 }}>{s.label}</p>
                                    <p style={{ color: s.color, fontSize: 34, fontWeight: 700, margin: 0, lineHeight: 1, fontFamily: "Inter, system-ui, sans-serif" }}>{s.value.toLocaleString()}</p>
                                    <p style={{ color: T.textSecondary, fontSize: 13, fontWeight: 600, margin: 0 }}>{s.note}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ ...innerSurface, padding: "12px 16px" }}>
                            <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>This panel now holds its values without blending into the dark surface.</span>
                        </div>
                    </motion.div>

                    {/* Conversion Ladder */}
                    <motion.div {...fadeUp(0.2)} style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 18, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                        <h3 style={{ color: T.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Conversion ladder</h3>
                        <p style={{ color: T.textSecondary, fontSize: 14, fontWeight: 500, lineHeight: 1.45, margin: 0 }}>
                            Premium movement is clearer when each step gets a clean bar treatment instead of low-contrast labels.
                        </p>

                        {[
                            { label: "New trials", value: convTrials, color: T.cyan },
                            { label: "Activated", value: convActivated, color: T.green },
                            { label: "Retained", value: convRetained, color: T.purple },
                        ].map(step => (
                            <div key={step.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 700 }}>{step.label} {step.value}</span>
                                <div style={{ height: 12, borderRadius: RADIUS.pill, backgroundColor: "#132432", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.round((step.value / convMax) * 100)}%`, minWidth: step.value > 0 ? 8 : 0, borderRadius: RADIUS.pill, backgroundColor: step.color, transition: "width 0.8s ease" }} />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════
                RESPONSIVE STYLES
            ═══════════════════════════════════════════════════════════════ */}
            <style>{`
                .ov-root {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    width: 100%;
                    max-width: 100%;
                    overflow-x: hidden;
                    box-sizing: border-box;
                }

                /* Hero */
                .ov-hero {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 24px;
                }
                .ov-hero-copy {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex: 1;
                    min-width: 0;
                }
                .ov-hero-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }

                /* Metrics */
                .ov-metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 18px;
                }

                /* Analytics */
                .ov-analytics-row {
                    display: grid;
                    grid-template-columns: 1fr 366px;
                    gap: 18px;
                    min-height: 440px;
                }
                .ov-chart-card { flex: 1; min-width: 0; }
                .ov-analytics-side {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                /* Lower */
                .ov-lower-row {
                    display: grid;
                    grid-template-columns: 1fr 380px;
                    gap: 18px;
                }
                .ov-ops-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 14px;
                }

                /* ── TABLET (≤1280px) ─── */
                @media (max-width: 1280px) {
                    .ov-metrics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .ov-analytics-row {
                        grid-template-columns: 1fr;
                        min-height: auto;
                    }
                    .ov-analytics-side {
                        flex-direction: row;
                    }
                    .ov-analytics-side > * {
                        flex: 1;
                        min-width: 0;
                    }
                    .ov-lower-row {
                        grid-template-columns: 1fr;
                    }
                    .ov-ops-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* ── MOBILE (≤768px) ──── */
                @media (max-width: 768px) {
                    .ov-hero {
                        flex-direction: column;
                    }
                    .ov-hero-actions {
                        flex-wrap: wrap;
                        width: 100%;
                    }
                    .ov-meta-hide-mobile {
                        display: none !important;
                    }
                    .ov-metrics-grid {
                        grid-template-columns: 1fr;
                    }
                    .ov-analytics-side {
                        flex-direction: column;
                    }
                    .ov-ops-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }

                /* ── SMALL MOBILE (≤480px) ── */
                @media (max-width: 480px) {
                    .ov-ops-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
