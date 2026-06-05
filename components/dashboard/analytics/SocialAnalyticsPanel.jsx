/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
  PieChart, Pie, Legend,
} from "recharts";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Loader2, TrendingUp, Eye, Users, Zap, RefreshCw } from "@/lib/icons";

// ─── Platform + breakdown colors ──────────────────────────────────────────────
const PLATFORM_META = {
  facebook:  { label: "Facebook",  color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E1306C" },
  x:         { label: "X",         color: "#9CA3AF" },
  twitter:   { label: "X",         color: "#9CA3AF" },
  linkedin:  { label: "LinkedIn",  color: "#0A66C2" },
  tiktok:    { label: "TikTok",    color: "#22D3EE" },
};
const BREAKDOWN = [
  { key: "likes",    label: "Likes",    color: "#16C7E7" },
  { key: "comments", label: "Comments", color: "#7C9CF5" },
  { key: "shares",   label: "Shares",   color: "#34D399" },
  { key: "saves",    label: "Saves",    color: "#F59E0B" },
];

const fmt = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
};

function platformOf(p) {
  return PLATFORM_META[p] || { label: p || "—", color: "#16C7E7" };
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function Kpi({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#1E2A34] bg-[#0D1217] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1E2A34] bg-[#05080B]">
          <Icon className="h-3.5 w-3.5 text-cyan" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-black tracking-tighter tabular-nums text-white">{fmt(value)}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-700">{helper}</p>
    </div>
  );
}

// ─── Dark tooltip ─────────────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1E2A34] bg-[#05080B] px-3 py-2 shadow-xl">
      {label && <p className="mb-1 text-[10px] font-semibold text-white">{label}</p>}
      {payload.map((e, i) => (
        <p key={i} className="text-[10px] tabular-nums" style={{ color: e.color || e.payload?.color || "#B2C0CD" }}>
          {e.name}: {fmt(e.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function SocialAnalyticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("impressions"); // impressions | engagement

  const load = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await fetchWithAuth("/api/social/analytics");
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("[SocialAnalytics]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = data?.totals || {};
  const engagement = (totals.likes || 0) + (totals.comments || 0) + (totals.shares || 0) + (totals.saves || 0);

  const platformData = useMemo(() => {
    const bp = data?.byPlatform || {};
    return Object.entries(bp)
      .map(([k, v]) => ({
        platform: platformOf(k).label,
        color: platformOf(k).color,
        engagement: (v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0),
        impressions: v.impressions || 0,
      }))
      .sort((a, b) => b.engagement - a.engagement);
  }, [data]);

  const donutData = useMemo(
    () => BREAKDOWN.map((b) => ({ name: b.label, value: totals[b.key] || 0, color: b.color }))
      .filter((d) => d.value > 0),
    [data] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const topPosts = useMemo(() => {
    const posts = data?.posts || [];
    const withEng = posts.map((p) => ({
      ...p,
      _eng: (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) + (p.metrics?.saves || 0),
      _imp: p.metrics?.impressions || 0,
    }));
    return withEng.sort((a, b) => (sortBy === "impressions" ? b._imp - a._imp : b._eng - a._eng)).slice(0, 10);
  }, [data, sortBy]);

  // ── States ──
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#1E2A34] bg-[#0D1217] py-20 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
      </div>
    );
  }

  if (!data || data.connectedCount === 0) {
    return (
      <div className="rounded-2xl border border-[#1E2A34] bg-[#0D1217] py-16 text-center">
        <p className="text-sm font-semibold text-white">No connected accounts yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
          Connect a social account from Daily Content and publish a post — its performance will show up here.
        </p>
      </div>
    );
  }

  const hasMetrics = engagement > 0 || (totals.impressions || 0) > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">Social Performance</h2>
          <p className="text-[11px] text-gray-500">
            Across {data.connectedCount} connected account{data.connectedCount !== 1 ? "s" : ""} · lifetime metrics
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-[#1E2A34] bg-[#0D1217] px-3 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:border-cyan/30 hover:text-white cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Impressions" value={totals.impressions} helper="Total views" icon={Eye} />
        <Kpi label="Reach" value={totals.reach} helper="Unique accounts" icon={Users} />
        <Kpi label="Engagement" value={engagement} helper="Likes + comments + shares + saves" icon={Zap} />
        <Kpi label="Smart-link Clicks" value={data.smartLinkClicks} helper="Traffic to your funnel" icon={TrendingUp} />
      </div>

      {!hasMetrics && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-3 text-xs text-gray-400">
          Your posts are published but haven&apos;t gathered engagement yet. Platform metrics (impressions, likes…)
          can take a few hours to populate — check back soon or hit Refresh.
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Engagement by platform */}
        <div className="rounded-2xl border border-[#1E2A34] bg-[#0D1217] p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Engagement by Platform</p>
          {platformData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platformData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="platform" tick={{ fill: "#B2C0CD", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5B6B79", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={<DarkTooltip />} />
                <Bar dataKey="engagement" name="Engagement" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {platformData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-xs text-gray-600">No platform data yet.</p>
          )}
        </div>

        {/* Engagement breakdown donut */}
        <div className="rounded-2xl border border-[#1E2A34] bg-[#0D1217] p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Engagement Breakdown</p>
          {donutData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => <span className="text-[11px] text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-xs text-gray-600">No engagement to break down yet.</p>
          )}
        </div>
      </div>

      {/* Top posts table */}
      <div className="overflow-hidden rounded-2xl border border-[#1E2A34] bg-[#0D1217]">
        <div className="flex items-center justify-between border-b border-[#1E2A34] px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Top Posts</p>
          <div className="flex items-center rounded-lg border border-[#1E2A34] bg-[#05080B] p-0.5">
            {[
              { id: "impressions", label: "Impressions" },
              { id: "engagement", label: "Engagement" },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setSortBy(o.id)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                  sortBy === o.id ? "bg-[#0D1217] text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {topPosts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2A34] text-[9px] uppercase tracking-widest text-gray-600">
                  <th className="px-4 py-2 text-left font-semibold">Post</th>
                  <th className="px-3 py-2 text-left font-semibold">Platform</th>
                  <th className="px-3 py-2 text-right font-semibold">Impr.</th>
                  <th className="px-3 py-2 text-right font-semibold">Likes</th>
                  <th className="px-3 py-2 text-right font-semibold">Comments</th>
                  <th className="px-3 py-2 text-right font-semibold">Shares</th>
                  <th className="px-4 py-2 text-right font-semibold">Engag.</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((p, i) => {
                  const meta = platformOf(p.platform);
                  const row = (
                    <>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {p.mediaUrl ? (
                            <img src={p.mediaUrl} alt="" className="h-9 w-9 shrink-0 rounded-md border border-[#1E2A34] object-cover" loading="lazy" />
                          ) : (
                            <div className="h-9 w-9 shrink-0 rounded-md border border-[#1E2A34] bg-[#05080B]" />
                          )}
                          <span className="line-clamp-1 max-w-[220px] text-xs text-gray-300">
                            {p.caption || "Untitled post"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                          <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs tabular-nums text-gray-300">{fmt(p._imp)}</td>
                      <td className="px-3 py-2.5 text-right text-xs tabular-nums text-gray-400">{fmt(p.metrics?.likes)}</td>
                      <td className="px-3 py-2.5 text-right text-xs tabular-nums text-gray-400">{fmt(p.metrics?.comments)}</td>
                      <td className="px-3 py-2.5 text-right text-xs tabular-nums text-gray-400">{fmt(p.metrics?.shares)}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums text-cyan">{fmt(p._eng)}</td>
                    </>
                  );
                  return (
                    <tr key={p.feedItemId || i} className="border-b border-[#1E2A34]/60 transition-colors last:border-0 hover:bg-white/[0.02]">
                      {row}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-12 text-center text-xs text-gray-600">No posts to rank yet.</p>
        )}
      </div>
    </div>
  );
}
