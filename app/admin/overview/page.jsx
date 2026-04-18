"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
    Users,
    Building2,
    FileText,
    Activity,
    TrendingUp,
    TrendingDown,
    ExternalLink,
    AlertCircle,
    Loader2
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import LaunchBuilderButton from "@/components/LaunchBuilderButton";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    cardBg:        "#0D1217",
    surfaceBg:     "#121920",
    border:        "#1E2A34",
    activeHighlight: "#10333E",
    cyan:          "#16C7E7",
    textPrimary:   "#F4F8FB",
    textSecondary: "#B2C0CD",
    textMuted:     "#5a6a78",
    error:         "#f87171",
    success:       "#34d399",
    warning:       "#fbbf24",
    purple:        "#a78bfa",
};

// ── Shared style helpers ──────────────────────────────────────────────────────
const sectionLabel = {
    color: T.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: 0,
};

export default function AdminOverview() {
    const { session, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats]     = useState(null);
    const [error, setError]     = useState(null);

    useEffect(() => {
        if (!authLoading && session) {
            fetchStats();
        } else if (!authLoading && !session) {
            setLoading(false);
            setError("Not authenticated");
        }
    }, [authLoading, session]);

    const fetchStats = async () => {
        try {
            const controller = new AbortController();
            const timeoutId  = setTimeout(() => controller.abort(), 15000);

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
            if (err.name === "AbortError") {
                setError("Request timed out. Please try again.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const radarData = stats ? [
        { subject: "Users",    value: Math.min(Math.round((stats.users?.total || 0) / 10), 100) },
        { subject: "Content",  value: Math.min(Math.round((stats.content?.total || 0) / 50), 100) },
        { subject: "Weekly\nGrowth", value: Math.min(Math.round(((stats.users?.thisWeek || 0) / Math.max(stats.users?.total || 1, 1)) * 2000), 100) },
        { subject: "Paid %",   value: Math.min(Math.round(((stats.users?.byTier?.growth || 0) + (stats.users?.byTier?.scale || 0)) / Math.max(stats.users?.total || 1, 1) * 100), 100) },
        { subject: "Sessions", value: Math.min(Math.round((stats.businesses?.total || 0) / 5), 100) },
    ] : [];

    const tierPills = stats ? [
        { name: "Starter", count: stats.users?.byTier?.starter || 0, color: "#5a6a78" },
        { name: "Growth",  count: stats.users?.byTier?.growth  || 0, color: T.cyan },
        { name: "Scale",   count: stats.users?.byTier?.scale   || 0, color: T.purple },
    ] : [];

    const paidCount =
        (stats?.users?.byTier?.growth || 0) + (stats?.users?.byTier?.scale || 0);

    const STATS_CARDS = stats
        ? [
            {
                label:  "Total Users",
                value:  stats.users?.total?.toLocaleString() || "0",
                change: `+${stats.users?.thisWeek || 0} this week`,
                up:     true,
                icon:   Users,
            },
            {
                label:  "Marketing Engines",
                value:  stats.businesses?.total?.toLocaleString() || "0",
                change: `${stats.businesses?.completed || 0} completed`,
                up:     true,
                icon:   Building2,
            },
            {
                label:  "Content Generated",
                value:  stats.content?.total?.toLocaleString() || "0",
                change: `+${stats.content?.thisWeek || 0} this week`,
                up:     true,
                icon:   FileText,
            },
            {
                label:  "Paid Users",
                value:  paidCount.toLocaleString(),
                change: `${Math.round(
                    (paidCount / Math.max(stats.users?.total || 1, 1)) * 100
                )}% of total`,
                up:     true,
                icon:   Activity,
            },
        ]
        : [];

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 384 }}>
                    <Loader2 style={{ width: 32, height: 32, color: T.cyan }} className="animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <AdminLayout>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 384, gap: 12 }}>
                    <AlertCircle style={{ width: 40, height: 40, color: T.error }} />
                    <p style={{ color: T.error, margin: 0 }}>{error}</p>
                    <button
                        onClick={fetchStats}
                        style={{
                            marginTop: 8,
                            padding: "8px 20px",
                            border: `1px solid ${T.border}`,
                            backgroundColor: T.surfaceBg,
                            color: T.textSecondary,
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
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
                style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}
            >
                {/* ── Page header ─────────────────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <div style={{
                                width: 3,
                                height: 22,
                                backgroundColor: T.cyan,
                                borderRadius: 2,
                                flexShrink: 0,
                            }} />
                            <h1 style={{ color: T.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>
                                Dashboard Overview
                            </h1>
                        </div>
                        <p style={{ color: T.textSecondary, fontSize: 13, marginLeft: 13, marginTop: 2, marginBottom: 0 }}>
                            Welcome back. Here's what's happening with TedOS today.
                        </p>
                    </div>
                </div>

                {/* ── GHL Builder card ────────────────────────────────────── */}
                <div style={{
                    backgroundColor: T.cardBg,
                    border: `1px solid ${T.border}`,
                    borderLeft: `3px solid ${T.purple}`,
                    borderRadius: 12,
                    padding: "20px 24px",
                }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <ExternalLink style={{ width: 16, height: 16, color: T.purple, flexShrink: 0 }} />
                                <p style={{ color: T.textPrimary, fontSize: 15, fontWeight: 600, margin: 0 }}>
                                    GHL Builder Access
                                </p>
                            </div>
                            <p style={{ color: T.textMuted, fontSize: 13, margin: 0, marginLeft: 24 }}>
                                Open your GoHighLevel subaccount builder with a single click
                            </p>
                        </div>
                        <div><LaunchBuilderButton /></div>
                    </div>
                </div>

                {/* ── Stat cards ──────────────────────────────────────────── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 16,
                }}>
                    {STATS_CARDS.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.07, 0.15) }}
                                style={{
                                    backgroundColor: T.cardBg,
                                    border: `1px solid ${T.border}`,
                                    borderLeft: `3px solid ${T.cyan}`,
                                    borderRadius: 12,
                                    padding: "20px 24px",
                                }}
                            >
                                {/* icon row */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 8,
                                        backgroundColor: T.surfaceBg,
                                        border: `1px solid ${T.border}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        <Icon style={{ width: 18, height: 18, color: T.cyan }} />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {stat.up
                                            ? <TrendingUp style={{ width: 14, height: 14, color: T.success }} />
                                            : <TrendingDown style={{ width: 14, height: 14, color: T.error }} />}
                                        <span style={{ color: stat.up ? T.success : T.error, fontSize: 12 }}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>

                                <p style={{ color: T.textPrimary, fontSize: 32, fontWeight: 700, lineHeight: 1, margin: 0 }}>
                                    {stat.value}
                                </p>
                                <p style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6, marginBottom: 0 }}>
                                    {stat.label}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Charts row ──────────────────────────────────────────── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 20,
                }}>
                    {/* inner grid: bar chart (2/3) + radar (1/3) */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
                            gap: 20,
                        }}
                        className="charts-inner-grid"
                    >
                        {/* Weekly Activity BarChart */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                backgroundColor: T.cardBg,
                                border: `1px solid ${T.border}`,
                                borderRadius: 12,
                                padding: 24,
                            }}
                        >
                            <p style={{ ...sectionLabel, marginBottom: 20 }}>Weekly Activity</p>

                            {stats?.weeklyActivity && stats.weeklyActivity.length > 0 ? (
                                <div style={{ height: 280, width: "100%" }}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={280}>
                                        <BarChart data={stats.weeklyActivity} barGap={4} barSize={16}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={T.border}
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="name"
                                                stroke={T.textMuted}
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: T.textSecondary }}
                                            />
                                            <YAxis
                                                stroke={T.textMuted}
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: T.textSecondary }}
                                                width={30}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: T.cardBg,
                                                    border: `1px solid ${T.border}`,
                                                    borderRadius: 8,
                                                    color: T.textPrimary,
                                                    fontSize: 12,
                                                }}
                                                cursor={{ fill: "rgba(22,199,231,0.04)" }}
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: 12, color: T.textSecondary, paddingTop: 16 }}
                                            />
                                            <Bar
                                                dataKey="users"
                                                name="New Users"
                                                fill={T.cyan}
                                                fillOpacity={0.85}
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="content"
                                                name="Content"
                                                fill={T.purple}
                                                fillOpacity={0.85}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>No activity data available</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Platform Health RadarChart */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            style={{
                                backgroundColor: T.cardBg,
                                border: `1px solid ${T.border}`,
                                borderRadius: 12,
                                padding: 24,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <p style={{ ...sectionLabel, marginBottom: 20 }}>Platform Health</p>

                            {radarData.length > 0 ? (
                                <>
                                    {/* Radar chart — fixed size, centred */}
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <RadarChart
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            data={radarData}
                                            width={280}
                                            height={260}
                                        >
                                            <PolarGrid stroke={T.border} strokeOpacity={0.8} />
                                            <PolarAngleAxis
                                                dataKey="subject"
                                                tick={{ fill: T.textSecondary, fontSize: 11, fontWeight: 500 }}
                                            />
                                            <PolarRadiusAxis
                                                angle={90}
                                                domain={[0, 100]}
                                                tick={{ fill: T.textMuted, fontSize: 9 }}
                                                tickCount={4}
                                                stroke={T.border}
                                            />
                                            <Radar
                                                name="Platform"
                                                dataKey="value"
                                                stroke={T.cyan}
                                                fill={T.cyan}
                                                fillOpacity={0.15}
                                                strokeWidth={2}
                                                dot={{ fill: T.cyan, r: 3 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: T.cardBg,
                                                    border: `1px solid ${T.border}`,
                                                    borderRadius: 8,
                                                    color: T.textPrimary,
                                                    fontSize: 12,
                                                }}
                                                formatter={(value) => [`${value}/100`, "Score"]}
                                            />
                                        </RadarChart>
                                    </div>

                                    {/* Tier pills */}
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: 8,
                                        marginTop: 16,
                                        flexWrap: "wrap",
                                    }}>
                                        {tierPills.map((tier) => (
                                            <div
                                                key={tier.name}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    backgroundColor: T.surfaceBg,
                                                    border: `1px solid ${T.border}`,
                                                    borderRadius: 20,
                                                    padding: "4px 10px",
                                                }}
                                            >
                                                <div style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: "50%",
                                                    backgroundColor: tier.color,
                                                    flexShrink: 0,
                                                }} />
                                                <span style={{ color: T.textSecondary, fontSize: 12 }}>{tier.name}</span>
                                                <span style={{ color: T.textPrimary, fontSize: 12, fontWeight: 600 }}>{tier.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>No platform data available</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* ── Quick Stats ─────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                        backgroundColor: T.cardBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        padding: 24,
                    }}
                >
                    <p style={{ ...sectionLabel, marginBottom: 16 }}>Quick Stats</p>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: 12,
                    }}>
                        {[
                            { label: "New Users This Week",  value: stats?.users?.thisWeek    || 0, color: T.cyan   },
                            { label: "New Users This Month", value: stats?.users?.thisMonth   || 0, color: T.cyan   },
                            { label: "Completed Businesses", value: stats?.businesses?.completed || 0, color: T.success },
                            { label: "Content This Week",    value: stats?.content?.thisWeek  || 0, color: T.purple },
                        ].map(({ label, value, color }) => (
                            <div
                                key={label}
                                style={{
                                    backgroundColor: T.surfaceBg,
                                    borderRadius: 10,
                                    padding: 16,
                                }}
                            >
                                <p style={{ color: T.textSecondary, fontSize: 12, margin: 0, marginBottom: 6 }}>{label}</p>
                                <p style={{ color, fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1 }}>
                                    {value.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Responsive chart grid fix ─────────────────────────────── */}
            <style>{`
                @media (max-width: 768px) {
                    .charts-inner-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
