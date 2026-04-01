"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle } from "@/lib/icons";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    limit: 2200,
    color: "text-pink-400",
    borderSelected: "border-pink-500/40",
    bgSelected: "bg-pink-500/[0.08]",
    borderDefault: "border-subtle",
    bgDefault: "bg-charcoal",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    limit: 63206,
    color: "text-blue-400",
    borderSelected: "border-blue-500/40",
    bgSelected: "bg-blue-500/[0.08]",
    borderDefault: "border-subtle",
    bgDefault: "bg-charcoal",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "x",
    label: "X (Twitter)",
    limit: 280,
    color: "text-gray-300",
    borderSelected: "border-white/25",
    bgSelected: "bg-white/[0.06]",
    borderDefault: "border-subtle",
    bgDefault: "bg-charcoal",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

// ─── SocialPostModal ──────────────────────────────────────────────────────────

/**
 * Modal for posting a daily post to social platforms (X, Instagram, Facebook).
 *
 * Props:
 *   post         object   - The daily_post to share (must have id, image_url, caption)
 *   onClose      fn       - Called when modal should close
 *   onPosted     fn(post) - Called with the updated post after successful posting
 *   initialPlatforms string[] - Platforms to pre-select (optional)
 */
export default function SocialPostModal({ post, onClose, onPosted, initialPlatforms = [] }) {
  const [mounted, setMounted]                 = useState(false);
  const [accounts, setAccounts]               = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [socialConnected, setBufferConnected] = useState(false);

  const [selectedPlatforms, setSelectedPlatforms] = useState(initialPlatforms);
  const [caption, setCaption]                 = useState(post.caption);
  const [hashtags, setHashtags]               = useState({});
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  // Ensure image_url is available
  const imageUrl = post.image_url || post.imageUrl;
  console.log('[SocialPostModal] Post data:', { hasPost: !!post, hasCaption: !!post.caption, imageUrl });

  // ── Mount + ESC handler ───────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Load connected accounts ───────────────────────────────────────────────
  useEffect(() => {
    fetchWithAuth("/api/social/connected-accounts")
      .then(r => r.json())
      .then(data => {
        if (data.connected) {
          setAccounts(data.connected);
          setBufferConnected(data.connected.length > 0);
          // Auto-select all connected platforms if none pre-selected
          if (!initialPlatforms.length) {
            setSelectedPlatforms(data.connected);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate hashtags whenever selected platforms change ──────────────────
  const platformKey = selectedPlatforms.slice().sort().join(",");
  useEffect(() => {
    if (!selectedPlatforms.length || loadingAccounts) return;
    setLoadingHashtags(true);
    fetchWithAuth("/api/social/hashtags", {
      method: "POST",
      body: JSON.stringify({
        description: post.caption.slice(0, 300),
        platforms:   selectedPlatforms,
      }),
    })
      .then(r => r.json())
      .then(data => { if (data.hashtags) setHashtags(data.hashtags); })
      .catch(() => {})
      .finally(() => setLoadingHashtags(false));
  }, [platformKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle platform ───────────────────────────────────────────────────────
  const togglePlatform = useCallback((id) => {
    if (!accounts.includes(id)) return; // can't select unconnected platform
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, [accounts]);

  // ── Submit post ───────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!selectedPlatforms.length) {
      toast.error("Select at least one platform.");
      return;
    }
    if (!imageUrl) {
      toast.error("Image URL missing. Please try reopening this modal.");
      return;
    }
    setSubmitting(true);
    const results = [];
    const errors = [];

    for (const platform of selectedPlatforms) {
      try {
        const endpoint = {
          x: "/api/social/post-x",
          instagram: "/api/social/post-instagram",
          facebook: "/api/social/post-facebook",
        }[platform];

        if (!endpoint) {
          errors.push(`Unknown platform: ${platform}`);
          continue;
        }

        const res = await fetchWithAuth(endpoint, {
          method: "POST",
          body: JSON.stringify({
            imageUrl,
            caption: caption + (hashtags[platform] ? `\n\n${hashtags[platform]}` : ""),
            daily_post_id: post.id,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (data.code === "x_not_connected" || data.code === "instagram_not_connected" || data.code === "facebook_not_connected") {
            errors.push(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account not connected`);
          } else {
            errors.push(data.error || `Failed to post to ${platform}`);
          }
        } else {
          results.push(platform);
        }
      } catch (err) {
        errors.push(`${platform}: ${err.message}`);
      }
    }

    setSubmitting(false);

    if (results.length > 0) {
      toast.success(
        `Posted to ${results.length} platform${results.length > 1 ? "s" : ""}!`
      );
      onPosted?.({ ...post, status: "posted" });
      onClose();
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (results.length === 0 && errors.length === 0) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // ── Character count helpers ────────────────────────────────────────────────
  const twitterLimit = 280;
  const overTwitterLimit = selectedPlatforms.includes("x") && caption.length > twitterLimit;

  const connectedServices = new Set(accounts);

  // ─── Modal JSX ─────────────────────────────────────────────────────────────
  const modal = (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-4 top-[8vh] bottom-[8vh] z-[111] mx-auto max-w-lg rounded-2xl border border-subtle bg-grayDark shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Post to Social</h3>
            <p className="text-[10px] text-gray-600 mt-0.5">Publish to X, Instagram, and Facebook</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-subtle bg-charcoal text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* No accounts connected state */}
          {!loadingAccounts && !socialConnected && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400">No social accounts connected</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Connect your X, Instagram, and Facebook accounts from the dashboard to post.
                </p>
              </div>
            </div>
          )}

          {/* Image preview */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="rounded-xl overflow-hidden border border-subtle bg-surface aspect-square max-h-48 flex items-center justify-center">
            <img src={imageUrl} alt="Post image" className="w-full h-full object-contain" />
          </div>

          {/* Platform selection */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 mb-2">
              Select Platforms
            </p>
            {loadingAccounts ? (
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1 h-12 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map(platform => {
                  const isConnected = connectedServices.has(platform.id);
                  const isSelected  = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      disabled={!isConnected}
                      className={`
                        flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium
                        transition-all duration-150 relative
                        ${isSelected
                          ? `${platform.bgSelected} ${platform.borderSelected} ${platform.color}`
                          : isConnected
                            ? `${platform.bgDefault} ${platform.borderDefault} text-gray-500 hover:text-gray-300 hover:border-subtleAlt`
                            : "bg-charcoal border-subtle text-gray-700 opacity-40 cursor-not-allowed"
                        }
                        ${isConnected ? "cursor-pointer" : ""}
                      `}
                    >
                      {platform.icon}
                      <span className="text-[10px]">{platform.label}</span>
                      {!isConnected && (
                        <span className="absolute top-1.5 right-1.5 text-[8px] border border-current/20 rounded px-1 opacity-60">
                          —
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle className="absolute top-1.5 right-1.5 w-3 h-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">Caption</p>
              <div className="flex items-center gap-2">
                {overTwitterLimit && (
                  <span className="text-[9px] font-semibold text-amber-400">
                    Twitter: {caption.length}/{twitterLimit} — will be truncated
                  </span>
                )}
                <span className={`text-[9px] tabular-nums ${overTwitterLimit ? "text-amber-400" : "text-gray-700"}`}>
                  {caption.length} chars
                </span>
              </div>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-subtle text-xs text-gray-200 leading-relaxed resize-none focus:outline-none focus:border-subtleAlt transition-colors"
            />
          </div>

          {/* Hashtags per platform */}
          {selectedPlatforms.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">
                  Hashtags
                </p>
                {loadingHashtags && (
                  <span className="flex items-center gap-1 text-[9px] text-gray-600">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating…
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {selectedPlatforms.map(pid => (
                  <div key={pid}>
                    <p className="text-[9px] uppercase tracking-widest text-gray-700 mb-1 font-semibold">
                      {PLATFORMS.find(p => p.id === pid)?.label}
                    </p>
                    <textarea
                      value={hashtags[pid] || ""}
                      onChange={e => setHashtags(prev => ({ ...prev, [pid]: e.target.value }))}
                      rows={2}
                      placeholder={loadingHashtags ? "Generating…" : "Add hashtags…"}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-subtle text-xs text-gray-400 leading-relaxed resize-none focus:outline-none focus:border-subtleAlt transition-colors placeholder-gray-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-subtle px-5 py-4 shrink-0 space-y-2">
          {!socialConnected && !loadingAccounts && (
            <p className="text-[10px] text-gray-600 text-center">
              Connect social accounts first to enable posting.
            </p>
          )}
          <button
            onClick={handlePost}
            disabled={submitting || !selectedPlatforms.length || !socialConnected || loadingAccounts || !imageUrl || !caption}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan/20 bg-cyan/[0.08] text-sm font-semibold text-cyan hover:bg-cyan/15 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting…
              </>
            ) : (
              <>
                Post Now
                {selectedPlatforms.length > 0 && (
                  <span className="text-[10px] font-normal opacity-70">
                    ({selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""})
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
