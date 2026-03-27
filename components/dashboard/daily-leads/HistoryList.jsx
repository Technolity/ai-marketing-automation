/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle, Clock, TrendingUp, Trash2, Loader2,
  Download, Clipboard, X, Upload,
} from "@/lib/icons";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClicks(smartLinks) {
  if (Array.isArray(smartLinks)) return smartLinks.reduce((s, l) => s + (l?.clicks || 0), 0);
  return smartLinks?.clicks ?? 0;
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Social Platform Config ───────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    color: "text-pink-400",
    border: "border-pink-500/20",
    bg: "bg-pink-500/[0.05] hover:bg-pink-500/10",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/[0.05] hover:bg-blue-500/10",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    color: "text-gray-300",
    border: "border-white/10",
    bg: "bg-white/[0.03] hover:bg-white/[0.06]",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "text-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/[0.05] hover:bg-sky-500/10",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

// ─── Post Detail Modal ────────────────────────────────────────────────────────

function PostDetailModal({ post: initialPost, onClose, onMarkPosted, onDelete }) {
  const [post, setPost]           = useState(initialPost);
  const [marking, setMarking]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [caption, setCaption]     = useState(initialPost.caption);
  const [mounted, setMounted]     = useState(false);
  const clicks = getClicks(post.smart_links);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleMarkPosted = async () => {
    setMarking(true);
    try {
      const res = await fetchWithAuth("/api/daily-leads/posts", {
        method: "PATCH",
        body: JSON.stringify({ id: post.id, status: "posted" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed.");
      const updated = data.post || { ...post, status: "posted" };
      setPost(updated);
      onMarkPosted(updated);
      toast.success("Marked as posted.");
    } catch (err) { toast.error(err.message); }
    finally { setMarking(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/daily-leads/posts?id=${post.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed."); }
      onDelete(post.id);
      onClose();
      toast.success("Post deleted.");
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(post.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `post-${post.id.slice(0, 8)}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed."); }
    finally { setDownloading(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    toast.success("Caption copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  // Social posting coming soon — OAuth flows not yet built

  const modal = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-4 inset-y-4 z-[101] mx-auto max-w-5xl rounded-2xl border border-subtle bg-grayDark shadow-2xl shadow-black/60 flex flex-col overflow-hidden md:inset-y-8"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-subtle shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {post.status === "posted" ? (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-cyan">
                <CheckCircle className="w-3 h-3" /> Posted
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                <Clock className="w-3 h-3" /> Draft
              </span>
            )}
            <span className="text-[10px] text-gray-600">{fmt(post.post_date)}</span>
            {post.keyword && (
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-widest border border-subtle rounded px-1.5 py-0.5 text-gray-500">
                CTA: {post.keyword}
              </span>
            )}
            {clicks > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <TrendingUp className="w-3 h-3" /> {clicks} click{clicks !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-subtle bg-charcoal text-gray-500 hover:text-white hover:border-subtleAlt transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto grid md:grid-cols-[2fr,3fr] min-h-0">

          {/* Left — Image */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-subtle bg-surface">
            <div className="flex-1 flex items-center justify-center p-4 min-h-[200px] md:min-h-0">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full h-full object-contain rounded-xl"
                style={{ maxHeight: 420 }}
              />
            </div>
            <div className="px-4 pb-4 flex gap-2 border-t border-subtle pt-3 shrink-0">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-subtle bg-charcoal text-xs font-medium text-gray-400 hover:text-gray-200 hover:border-subtleAlt transition-colors cursor-pointer disabled:opacity-40"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download
              </button>
            </div>
          </div>

          {/* Right — Caption + Share + Actions */}
          <div className="flex flex-col">

            {/* Caption */}
            <div className="p-5 flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">Caption</p>
                <span className="text-[9px] text-gray-700 tabular-nums">{caption.length} chars</span>
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={7}
                className="w-full px-3 py-2.5 rounded-lg bg-surface border border-subtle text-xs text-gray-200 leading-relaxed resize-none focus:outline-none focus:border-subtleAlt transition-colors"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-subtle bg-charcoal text-xs font-medium text-gray-400 hover:text-gray-200 hover:border-subtleAlt transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-cyan" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Caption"}
                </button>
                {post.status !== "posted" && (
                  <button
                    onClick={handleMarkPosted}
                    disabled={marking}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-cyan/20 bg-cyan/[0.05] text-xs font-medium text-cyan hover:bg-cyan/10 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Mark Posted
                  </button>
                )}
              </div>
            </div>

            {/* Share to Social */}
            <div className="border-t border-subtle px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-3.5 h-3.5 text-gray-600" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  Share to Social Media
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PLATFORMS.map(platform => (
                  <div
                    key={platform.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium opacity-35 cursor-not-allowed select-none ${platform.color} ${platform.border} ${platform.bg}`}
                  >
                    {platform.icon}
                    <span>{platform.label}</span>
                    <span className="ml-auto text-[9px] border border-current/20 rounded px-1 py-0.5">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-700 mt-2 leading-relaxed">
                One-click social posting is coming soon. Connect and authorize your accounts to publish directly from your workspace.
              </p>
            </div>

            {/* Danger zone */}
            <div className="border-t border-subtle px-5 py-4 shrink-0">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-subtle bg-charcoal text-xs font-medium text-gray-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/[0.04] transition-colors cursor-pointer disabled:opacity-40"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Post
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ post, onOpen, onDelete, onMarkPosted }) {
  const [deleting, setDeleting] = useState(false);
  const [marking, setMarking]   = useState(false);
  const clicks = getClicks(post.smart_links);
  const snippet = post.caption.length > 120
    ? `${post.caption.slice(0, 120).trim()}…`
    : post.caption;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/daily-leads/posts?id=${post.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed."); }
      onDelete(post.id);
      toast.success("Post deleted.");
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const handleMarkPosted = async (e) => {
    e.stopPropagation();
    setMarking(true);
    try {
      const res = await fetchWithAuth("/api/daily-leads/posts", {
        method: "PATCH",
        body: JSON.stringify({ id: post.id, status: "posted" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed.");
      onMarkPosted(data.post || { ...post, status: "posted" });
      toast.success("Marked as posted.");
    } catch (err) { toast.error(err.message); }
    finally { setMarking(false); }
  };

  return (
    <motion.tr
      layout
      exit={{ opacity: 0 }}
      onClick={() => onOpen(post)}
      className="group border-b border-subtle last:border-b-0 hover:bg-charcoal transition-colors duration-150 cursor-pointer"
    >
      {/* Thumbnail */}
      <td className="px-4 py-3 w-12 shrink-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-subtle bg-surface shrink-0">
          <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      </td>

      {/* Status + date */}
      <td className="px-2 py-3 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          {post.status === "posted" ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-cyan">
              <CheckCircle className="w-2.5 h-2.5" /> Posted
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
              <Clock className="w-2.5 h-2.5" /> Draft
            </span>
          )}
          <span className="text-[10px] text-gray-700">{fmt(post.post_date)}</span>
        </div>
      </td>

      {/* Caption snippet */}
      <td className="px-4 py-3 max-w-0 w-full">
        <p className="text-xs text-gray-400 leading-relaxed truncate">{snippet}</p>
        {(post.keyword || clicks > 0) && (
          <div className="flex items-center gap-2 mt-0.5">
            {post.keyword && (
              <span className="text-[9px] uppercase tracking-widest text-gray-600 font-semibold">
                CTA: {post.keyword}
              </span>
            )}
            {clicks > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-gray-600">
                <TrendingUp className="w-2.5 h-2.5" /> {clicks}
              </span>
            )}
          </div>
        )}
      </td>

      {/* Hover actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {post.status !== "posted" && (
            <button
              onClick={handleMarkPosted}
              disabled={marking}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cyan/20 bg-cyan/[0.05] text-[10px] font-medium text-cyan hover:bg-cyan/10 transition-colors cursor-pointer disabled:opacity-40"
            >
              {marking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Post
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-subtle bg-charcoal text-gray-600 hover:text-red-400 hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-40"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── HistoryList ──────────────────────────────────────────────────────────────

export default function HistoryList({ posts: initialPosts, loading, onRefresh, onPostChanged }) {
  const [posts, setPosts]               = useState(initialPosts ?? []);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => { setPosts(initialPosts ?? []); }, [initialPosts]);

  const handleDelete = useCallback((id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    onRefresh?.();
  }, [onRefresh]);

  const handleMarkPosted = useCallback((updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    setSelectedPost(prev => prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev);
    onPostChanged ? onPostChanged(updatedPost) : onRefresh?.();
  }, [onPostChanged, onRefresh]);

  if (loading) {
    return (
      <div className="divide-y divide-subtle">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2 w-16 rounded bg-white/5" />
              <div className="h-2 w-3/4 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No posts yet</p>
        <p className="mt-1 text-xs text-gray-600">Generate your first creative above — it will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            <AnimatePresence mode="popLayout">
              {posts.map(post => (
                <HistoryRow
                  key={post.id}
                  post={post}
                  onOpen={setSelectedPost}
                  onDelete={handleDelete}
                  onMarkPosted={handleMarkPosted}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onMarkPosted={handleMarkPosted}
          onDelete={(id) => { handleDelete(id); setSelectedPost(null); }}
        />
      )}
    </>
  );
}
