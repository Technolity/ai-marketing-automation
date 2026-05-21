"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, X, Check } from "@/lib/icons";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

// ─── Single editable topic pill ───────────────────────────────────────────────

function TopicPill({ topic, index, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(topic);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== topic) onChange(index, trimmed);
    else setDraft(topic);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.12 }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1E2A34] bg-[#0D1217] group"
    >
      <span className="text-[10px] font-semibold text-[#16C7E7]/70 w-5 shrink-0 tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { setDraft(topic); setEditing(false); }
          }}
          className="flex-1 min-w-0 bg-transparent text-xs text-white focus:outline-none"
        />
      ) : (
        <button
          onClick={() => { setDraft(topic); setEditing(true); }}
          className="flex-1 min-w-0 text-left text-xs text-gray-300 hover:text-white transition-colors truncate cursor-text"
        >
          {topic}
        </button>
      )}

      <button
        onClick={() => onRemove(index)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 cursor-pointer"
        title="Remove topic"
      >
        <X className="w-3 h-3 text-gray-500 hover:text-red-400" />
      </button>
    </motion.div>
  );
}

// ─── TopicsStep ───────────────────────────────────────────────────────────────

export default function TopicsStep({ vaultCtx, funnelId, onTopicsGenerated, initialTopics, mode = "generate" }) {
  const [topics, setTopics] = useState(() => initialTopics ?? []);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(() => (initialTopics?.length ?? 0) > 0);

  const MIN_TOPICS = 20;
  const canApprove = topics.length >= MIN_TOPICS;

  const handleGenerate = async () => {
    if (!vaultCtx) { toast.error("Vault context not loaded yet."); return; }
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/daily-leads/topics", {
        method: "POST",
        body: JSON.stringify({ funnel_id: funnelId, vault_context: vaultCtx }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate topics");
      setTopics(data.topics);
      setGenerated(true);
      toast.success("30 topics generated!");
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, newValue) => {
    setTopics(prev => prev.map((t, i) => (i === index ? newValue : t)));
  };

  const handleRemove = (index) => {
    setTopics(prev => prev.filter((_, i) => i !== index));
  };

  const handleApprove = () => {
    if (!canApprove) return;
    onTopicsGenerated(topics);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {mode === "approve" ? "Approve Your Monthly Topics" : "Generate Monthly Topics"}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
            {mode === "approve"
              ? "Review the topics below. Edit any inline by clicking on them, remove ones you don\u2019t want, then click \u201cApprove Topics\u201d to continue."
              : "AI will generate 30 content ideas based on your niche, offer, and free gift. Click any topic to edit it inline, or remove topics you don\u2019t want."}
          </p>
        </div>
        {!generated && mode !== "approve" && (
          <button
            onClick={handleGenerate}
            disabled={loading || !vaultCtx}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16C7E7] hover:bg-white text-black text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate 30 Topics
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-lg border border-[#1E2A34] bg-[#0D1217] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Topic grid */}
      {!loading && topics.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
              {topics.length} topics — click to edit, × to remove
            </p>
            {mode !== "approve" && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-[10px] text-[#16C7E7] hover:text-white transition-colors cursor-pointer"
              >
                Regenerate all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AnimatePresence>
              {topics.map((topic, i) => (
                <TopicPill
                  key={`${i}-${topic}`}
                  topic={topic}
                  index={i}
                  onChange={handleChange}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1E2A34]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${canApprove ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className="text-xs text-gray-500">
                {canApprove
                  ? `${topics.length} topics ready to approve`
                  : `Minimum ${MIN_TOPICS} topics required (${topics.length} remaining)`}
              </span>
            </div>

            <button
              onClick={handleApprove}
              disabled={!canApprove}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#16C7E7] hover:bg-white text-black text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Topics
            </button>
          </div>
        </>
      )}

      {/* Empty state before generation */}
      {!loading && topics.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border border-dashed border-[#1E2A34]">
          <div className="w-12 h-12 rounded-xl border border-[#1E2A34] bg-[#0D1217] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">No topics yet</p>
            <p className="text-xs text-gray-600">
              Click &quot;Generate 30 Topics&quot; to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
