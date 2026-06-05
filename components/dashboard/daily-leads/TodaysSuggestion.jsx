"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getTodaysTemplate } from "@/lib/dailyLeads/contentCalendar";
import { Sparkles, Clipboard, CheckCircle } from "@/lib/icons";
import { toast } from "sonner";

/**
 * Rotating "today's suggested post" card. Picks a curated template for today,
 * personalizes it with the user's vault context, and lets them either copy the
 * caption or push the creative brief into the generator.
 *
 * Props:
 *   funnels   array  - user's vault-generated funnels (uses the first by default)
 *   onUseIdea fn({text}) - inject the brief into the generator
 */
export default function TodaysSuggestion({ funnels = [], onUseIdea }) {
  const funnelId = funnels[0]?.id || null;
  const [vaultCtx, setVaultCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!funnelId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetchWithAuth(`/api/daily-leads/generate?funnel_id=${funnelId}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setVaultCtx(data?.missing ? null : data?.vaultContext || null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [funnelId]);

  if (!funnelId) return null;

  const tpl = vaultCtx ? getTodaysTemplate(vaultCtx, "GUIDE") : null;

  const handleCopy = async () => {
    if (!tpl) return;
    try {
      await navigator.clipboard.writeText(tpl.caption);
      setCopied(true);
      toast.success("Caption copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy not supported here.");
    }
  };

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-cyan/15 bg-gradient-to-br from-cyan/[0.04] to-transparent">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-cyan/20 bg-cyan/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cyan/90">
              <Sparkles className="h-2.5 w-2.5" /> Today&apos;s Idea
            </span>
            {tpl && (
              <span className="rounded-full border border-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-600">
                {tpl.category}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-full max-w-md animate-pulse rounded bg-white/5" />
            </div>
          ) : !vaultCtx ? (
            <p className="text-sm text-gray-500">
              Complete your Free Gift setup in the Vault to unlock daily content ideas.
            </p>
          ) : tpl ? (
            <>
              <h3 className="text-base font-bold tracking-tight text-white">{tpl.angle}</h3>
              <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-gray-400">
                {tpl.caption}
              </p>
            </>
          ) : null}
        </div>

        {tpl && (
          <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-stretch">
            <button
              onClick={() => onUseIdea?.({ text: tpl.imageBrief })}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-cyan px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-white cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Use this idea
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-subtle bg-charcoal px-4 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-subtleAlt hover:text-gray-200 cursor-pointer"
            >
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-cyan" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy caption"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
