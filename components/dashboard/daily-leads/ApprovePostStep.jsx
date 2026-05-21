"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCircle, Loader2, ImageIcon } from "@/lib/icons";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

// ─── Individual review card ───────────────────────────────────────────────────

function ReviewCard({ item, onApproveToggle, onPostNow, posting }) {
  const [caption, setCaption] = useState(item.caption || "");
  const [captionDirty, setCaptionDirty] = useState(false);

  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
    setCaptionDirty(e.target.value !== (item.caption || ""));
  };

  const handlePost = () => {
    onPostNow(item.day, caption.trim() || item.caption);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`rounded-xl border overflow-hidden flex flex-col transition-colors duration-200 ${
        item.approved
          ? "border-emerald-500/30 bg-emerald-500/[0.03]"
          : "border-[#1E2A34] bg-[#0D1217]"
      }`}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-[#05080B] flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={`Day ${item.day}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <ImageIcon className="w-5 h-5 text-gray-600" />
          </div>
        )}

        {/* Day badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[10px] font-bold text-white backdrop-blur-sm">
          Day {item.day}
        </div>

        {/* Approved overlay tick */}
        <AnimatePresence>
          {item.approved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status badge */}
        {item.posted && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-[#16C7E7]/30 text-[9px] font-semibold text-[#16C7E7] backdrop-blur-sm">
            <CheckCircle className="w-2.5 h-2.5" /> Posted
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#16C7E7]/60 truncate">
          {item.topic}
        </p>

        {/* Editable caption */}
        <div className="flex-1">
          <textarea
            value={caption}
            onChange={handleCaptionChange}
            rows={4}
            className={`w-full px-2.5 py-2 rounded-lg text-[11px] text-gray-300 leading-relaxed resize-none focus:outline-none transition-colors bg-[#05080B] border ${
              captionDirty
                ? "border-amber-400/30 focus:border-amber-400/50"
                : "border-[#1E2A34]/80 focus:border-[#1E2A34]"
            }`}
          />
          {captionDirty && (
            <p className="text-[9px] text-amber-400/60 mt-0.5">Unsaved edit</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            onClick={() => onApproveToggle(item.day)}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors duration-150 cursor-pointer ${
              item.approved
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/5"
                : "border-[#1E2A34] bg-[#05080B] text-gray-500 hover:text-gray-200 hover:border-[#2A3A46]"
            }`}
          >
            <Check className="w-3 h-3" />
            {item.approved ? "Approved" : "Approve"}
          </button>

          {!item.posted && (
            <button
              onClick={handlePost}
              disabled={posting}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#16C7E7]/20 bg-[#16C7E7]/[0.05] text-[11px] font-semibold text-[#16C7E7] hover:bg-[#16C7E7]/10 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {posting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )}
              {posting ? "Posting…" : "Post Now"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── ApprovePostStep ──────────────────────────────────────────────────────────

export default function ApprovePostStep({ content, funnelId, onDone }) {
  const [items, setItems] = useState(() =>
    content.map(c => ({ ...c, posted: false }))
  );
  const [postingDay, setPostingDay] = useState(null);

  const approvedCount = items.filter(i => i.approved).length;
  const total = items.length;

  const handleApproveToggle = (day) => {
    setItems(prev =>
      prev.map(i => i.day === day ? { ...i, approved: !i.approved } : i)
    );
  };

  const handlePostNow = async (day, captionOverride) => {
    setPostingDay(day);
    try {
      const item = items.find(i => i.day === day);
      if (!item) return;

      // The existing PATCH endpoint expects { post_id, status } or { id, caption }
      // For wizard-created content without an existing post_id, we create via generate endpoint
      // then mark posted. Here we optimistically mark as posted and surface via onDone.
      // If the item already has a real post ID from a prior save, we call PATCH.
      if (item.postId) {
        const res = await fetchWithAuth("/api/daily-leads/posts", {
          method: "PATCH",
          body: JSON.stringify({
            id: item.postId,
            status: "posted",
            ...(captionOverride !== item.caption ? { caption: captionOverride } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to mark posted");
        setItems(prev =>
          prev.map(i => i.day === day ? { ...i, posted: true, approved: true, caption: captionOverride } : i)
        );
        onDone?.({ ...item, status: "posted", caption: captionOverride });
      } else {
        // No DB record yet — just mark locally
        setItems(prev =>
          prev.map(i =>
            i.day === day ? { ...i, posted: true, approved: true, caption: captionOverride } : i
          )
        );
        toast.success(`Day ${day} marked as posted.`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to post.");
    } finally {
      setPostingDay(null);
    }
  };

  const handleApproveAll = () => {
    setItems(prev => prev.map(i => ({ ...i, approved: true })));
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Summary bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#1E2A34] bg-[#0D1217]">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Approved</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {approvedCount}
              <span className="text-sm font-normal text-gray-600"> / {total}</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-32 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              animate={{ width: total > 0 ? `${(approvedCount / total) * 100}%` : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApproveAll}
            className="px-3 py-1.5 rounded-lg border border-[#1E2A34] bg-[#05080B] text-[11px] font-medium text-gray-400 hover:text-white hover:border-[#2A3A46] transition-colors cursor-pointer"
          >
            Approve All
          </button>
          <button
            onClick={() => onDone?.()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#16C7E7] hover:bg-white text-black text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Check className="w-3 h-3" />
            Done
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map(item => (
          <ReviewCard
            key={item.day}
            item={item}
            onApproveToggle={handleApproveToggle}
            onPostNow={handlePostNow}
            posting={postingDay === item.day}
          />
        ))}
      </div>

      <div className="flex justify-end pt-2 border-t border-[#1E2A34]">
        <button
          onClick={() => onDone?.()}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#16C7E7] hover:bg-white text-black text-xs font-semibold transition-colors duration-150 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Done — {approvedCount}/{total} Approved
        </button>
      </div>
    </div>
  );
}
