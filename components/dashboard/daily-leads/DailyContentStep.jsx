"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, ImageIcon } from "@/lib/icons";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

const BATCH_SIZE = 5;

// ─── Individual content card ──────────────────────────────────────────────────

function ContentCard({ item }) {
  const isReady = !!item.caption;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`rounded-xl border bg-[#0D1217] overflow-hidden flex flex-col ${
        isReady ? "border-[#1E2A34]" : "border-[#1E2A34]/50"
      }`}
    >
      {/* Day badge + image area */}
      <div className="relative aspect-[4/3] bg-[#05080B] flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={`Day ${item.day}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <ImageIcon className="w-6 h-6 text-gray-600" />
            <span className="text-[9px] text-gray-700 uppercase tracking-widest">Image placeholder</span>
          </div>
        )}

        {/* Day badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[10px] font-bold text-white backdrop-blur-sm">
          Day {item.day}
        </div>

        {/* Ready indicator */}
        {isReady && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          </div>
        )}

        {/* Generating shimmer */}
        {!isReady && (
          <div className="absolute inset-0 bg-[#05080B]/80 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#16C7E7] animate-spin opacity-60" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#16C7E7]/60 truncate">
          {item.topic}
        </p>
        {isReady ? (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">
            {item.caption.length > 100 ? `${item.caption.slice(0, 100)}…` : item.caption}
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-full" />
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-3/4" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── DailyContentStep ─────────────────────────────────────────────────────────

export default function DailyContentStep({ topics, funnelId, vaultCtx, onContentReady }) {
  const [content, setContent] = useState(() =>
    topics.map((topic, i) => ({
      day: i + 1,
      topic,
      caption: null,
      imagePrompt: null,
      imageUrl: null,
      approved: false,
    }))
  );
  const [generated, setGenerated] = useState(0);
  const [done, setDone] = useState(false);
  const ranRef = useRef(false);

  const total = topics.length;
  const progressPct = total > 0 ? Math.round((generated / total) * 100) : 0;

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      let completedCount = 0;

      for (let start = 0; start < topics.length; start += BATCH_SIZE) {
        const batchTopics = topics.slice(start, start + BATCH_SIZE);

        try {
          const res = await fetchWithAuth("/api/daily-leads/content", {
            method: "POST",
            body: JSON.stringify({
              funnel_id: funnelId,
              topics: batchTopics,
              vault_context: vaultCtx,
              day_offset: start,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Batch failed");

          const batchContent = data.content;

          setContent(prev => {
            const next = [...prev];
            batchContent.forEach(item => {
              const idx = item.day - 1;
              if (idx >= 0 && idx < next.length) {
                next[idx] = { ...next[idx], ...item };
              }
            });
            return next;
          });

          completedCount += batchTopics.length;
          setGenerated(completedCount);
        } catch (err) {
          console.error("[DailyContentStep] batch error:", err);
          toast.error(`Batch failed (days ${start + 1}–${start + batchTopics.length}). Some topics skipped.`);
          // Still advance counter so progress reflects skipped items
          completedCount += batchTopics.length;
          setGenerated(completedCount);
        }
      }

      setDone(true);
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReview = () => {
    onContentReady(content);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header + progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Designing 30 Days of Content</h3>
            <p className="text-xs text-gray-500">
              Generating captions and image prompts in batches of {BATCH_SIZE}. You can review once all{" "}
              {total} days are ready.
            </p>
          </div>
          {done && (
            <button
              onClick={handleReview}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16C7E7] hover:bg-white text-black text-xs font-semibold transition-colors duration-150 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Review Content
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#16C7E7]"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-gray-400 shrink-0">
            {generated}/{total}
          </span>
          {!done && <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin shrink-0" />}
          {done && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {content.map(item => (
          <ContentCard key={item.day} item={item} />
        ))}
      </div>

      {/* CTA at bottom for easy access on long grids */}
      {done && (
        <div className="flex justify-end pt-2 border-t border-[#1E2A34]">
          <button
            onClick={handleReview}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#16C7E7] hover:bg-white text-black text-xs font-semibold transition-colors duration-150 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            All content ready — Review
          </button>
        </div>
      )}
    </div>
  );
}
