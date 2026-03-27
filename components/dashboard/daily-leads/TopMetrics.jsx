"use client";

import { ImageAdd, CheckCircle, TrendingUp } from "@/lib/icons";

const METRICS = [
  { key: "totalGenerated", label: "Generated",  icon: ImageAdd,    helper: "All saved posts" },
  { key: "totalPublished", label: "Published",   icon: CheckCircle, helper: "Marked as posted" },
  { key: "totalClicks",    label: "Clicks",      icon: TrendingUp,  helper: "Smart-link traffic" },
];

export default function TopMetrics({ metrics, loading, quota }) {
  return (
    <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden bg-subtle">
      {METRICS.map(({ key, label, icon: Icon, helper }) => {
        const value = metrics?.[key] ?? 0;
        return (
          <div key={key} className="bg-grayDark px-4 py-3 flex items-center gap-3">
            <Icon className="w-4 h-4 text-gray-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">{label}</p>
              {loading ? (
                <div className="mt-1 h-5 w-10 rounded bg-white/5 animate-pulse" />
              ) : (
                <p className="mt-0.5 text-lg font-bold text-white tabular-nums leading-none">{value.toLocaleString()}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
