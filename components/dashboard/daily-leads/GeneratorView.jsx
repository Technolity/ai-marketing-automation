/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Download, Clipboard, CheckCircle, AlertCircle,
  Loader2, RefreshCw, ChevronDown, Rocket, ImageAdd, X, ArrowUp,
} from "@/lib/icons";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_MODELS = [
  { id: "dall-e-3",     label: "DALL·E 3",     badge: "Best", provider: "OpenAI",  available: true },
  { id: "dall-e-2",     label: "DALL·E 2",     badge: "Fast", provider: "OpenAI",  available: true },
  { id: "nano-banana",  label: "Nano Banana",  badge: "New",  provider: "Google",  available: true },
];

const STYLE_TAGS = [
  "Cinematic", "Bold", "Minimalist", "Vibrant", "Dark Premium",
  "Neon Glow", "Clean & Sharp", "Luxury", "High Contrast", "3D Render",
];

const POST_TYPES = [
  { id: "free_gift", label: "Free Gift Ad" },
  { id: "general",  label: "General Post" },
];

const ASPECT_RATIOS = [
  { id: "1024x1024", label: "1:1" },
  { id: "1024x1792", label: "4:5" },
  { id: "1792x1024", label: "16:9" },
];

// ─── ModelDropdown (portal — renders below the button, never clipped) ──────────

function ModelDropdown({ selected, onSelect }) {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const btnRef            = useRef(null);
  const model = AI_MODELS.find(m => m.id === selected) || AI_MODELS[0];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (document.getElementById("model-dropdown-portal")?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on any scroll so the dropdown doesn't float detached from its button
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 208) });
    }
    setOpen(v => !v);
  };

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          id="model-dropdown-portal"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1 }}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: 208, zIndex: 9999 }}
          className="rounded-xl border border-subtle bg-elevated shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-subtle">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">Image Model</p>
          </div>
          {AI_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { onSelect(m.id); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                m.id === selected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
              }`}
            >
              <div>
                <p className={`text-[11px] font-semibold ${m.id === selected ? "text-white" : "text-gray-400"}`}>{m.label}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">via {m.provider}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] border border-subtle rounded px-1.5 py-0.5 text-gray-600">{m.badge}</span>
                {m.id === selected && <CheckCircle className="w-3 h-3 text-cyan" />}
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-subtle bg-charcoal hover:bg-elevated hover:border-subtleAlt transition-colors duration-150 cursor-pointer"
      >
        <span className="text-[11px] font-medium text-gray-300">{model.label}</span>
        <span className="text-[9px] text-gray-600 border border-subtle rounded px-1 py-0.5 leading-none">{model.badge}</span>
        <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {mounted && createPortal(menu, document.body)}
    </>
  );
}

// ─── FunnelSelector ───────────────────────────────────────────────────────────

function FunnelSelector({ funnels, selectedId, onSelect, loadingCtx }) {
  const [open, setOpen] = useState(false);
  const selected = funnels.find(f => f.id === selectedId);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!funnels.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-subtle bg-charcoal hover:bg-elevated hover:border-subtleAlt transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Rocket className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-xs font-medium text-gray-300 truncate">
            {selected ? selected.funnel_name : "Select funnel…"}
          </span>
          {loadingCtx && <Loader2 className="w-3 h-3 text-gray-600 animate-spin shrink-0" />}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-600 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-subtle bg-elevated shadow-xl shadow-black/40 z-30 overflow-hidden max-h-52 overflow-y-auto"
          >
            {funnels.map(f => (
              <button
                key={f.id}
                onClick={() => { onSelect(f.id); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  f.id === selectedId ? "bg-cyan/5 text-cyan" : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200"
                }`}
              >
                <span className="text-xs truncate">{f.funnel_name}</span>
                {f.id === selectedId && <CheckCircle className="w-3 h-3 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ContextBlock ─────────────────────────────────────────────────────────────

function ContextBlock({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${highlight ? "border-cyan/20 bg-cyan/[0.03]" : "border-subtle bg-charcoal"}`}>
      <p className={`text-[9px] font-semibold uppercase tracking-widest mb-1 ${highlight ? "text-cyan/60" : "text-gray-600"}`}>
        {label}
      </p>
      <p className="text-xs text-gray-300 leading-snug line-clamp-2">{value}</p>
    </div>
  );
}

// ─── Canvas States ────────────────────────────────────────────────────────────

function GeneratingCanvas({ step }) {
  const steps = [
    "Reading vault context…",
    "Building image prompt…",
    "Generating image…",
    "Writing caption…",
    "Saving post…",
  ];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-surface">
      <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      <div className="text-center">
        <p className="text-sm font-medium text-white mb-1">Generating your post</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-gray-500"
          >
            {steps[step] || steps[0]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyCanvas({ hasContext, noFunnel }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface border-2 border-dashed border-subtle">
      <div className="w-11 h-11 rounded-xl border border-subtle bg-charcoal flex items-center justify-center">
        <ImageAdd className="w-5 h-5 text-gray-600" />
      </div>
      <div className="text-center px-8">
        <p className="text-sm font-medium text-gray-500 mb-1">
          {noFunnel ? "Select a funnel" : !hasContext ? "Vault setup required" : "Your image appears here"}
        </p>
        <p className="text-xs text-gray-600 leading-relaxed max-w-[200px]">
          {noFunnel
            ? "Choose a marketing engine from the sidebar"
            : !hasContext
            ? "Complete your Free Gift setup in the Vault first"
            : "Describe what you want and hit generate"}
        </p>
      </div>
    </div>
  );
}

function ImageCanvas({ post, onDownload, downloading }) {
  const [copied, setCopied] = useState(false);

  const handleCopyImg = async () => {
    try {
      const res = await fetch(post.image_url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      toast.success("Image copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy not supported — use Download instead.");
    }
  };

  return (
    <div className="relative w-full h-full group">
      <img src={post.image_url} alt="Generated post" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4 gap-2">
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 text-xs font-medium text-white hover:bg-black transition-colors cursor-pointer"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Download
        </button>
        <button
          onClick={handleCopyImg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 text-xs font-medium text-white hover:bg-black transition-colors cursor-pointer"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-cyan" /> : <Clipboard className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {post.status === "posted" && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 border border-white/15 text-[10px] font-medium text-white backdrop-blur-sm">
          <CheckCircle className="w-3 h-3 text-cyan" />
          Posted
        </div>
      )}
    </div>
  );
}

// ─── CaptionPanel ─────────────────────────────────────────────────────────────

function CaptionPanel({ post, quota, onMarkPosted, onRefine, onReset }) {
  const [caption, setCaption]       = useState(post.caption);
  const [copied, setCopied]         = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    toast.success("Caption copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) { toast.error("Describe what you'd like to change."); return; }
    setFeedbackMode(false);
    onRefine(feedbackText.trim());
    setFeedbackText("");
  };

  return (
    <div className="mt-3 rounded-xl border border-subtle bg-grayDark p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">Caption</p>
        <span className="text-[10px] text-gray-700 tabular-nums">{caption.length} chars</span>
      </div>

      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        rows={4}
        className="w-full px-3 py-2.5 rounded-lg bg-surface border border-subtle text-xs text-gray-200 leading-relaxed resize-none focus:outline-none focus:border-subtleAlt transition-colors mb-3"
      />

      {quota && (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-0.5 flex-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan/50 transition-all duration-500"
              style={{ width: `${((quota.limit - quota.used) / quota.limit) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-600 tabular-nums">{quota.remaining}/{quota.limit} left</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {feedbackMode ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-500">
              What would you like to change?
            </p>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              autoFocus
              rows={3}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmitFeedback(); }}
              placeholder="e.g. Make the headline more urgent, use a darker background, show a laptop instead of the current object, fix the orientation..."
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-subtle text-xs text-gray-200 leading-relaxed resize-none focus:outline-none focus:border-subtleAlt transition-colors placeholder-gray-700"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => { setFeedbackMode(false); setFeedbackText(""); }}
                className="flex-1 py-2 rounded-lg border border-subtle bg-charcoal text-xs font-medium text-gray-500 hover:text-gray-300 hover:border-subtleAlt transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedbackText.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-cyan/20 bg-cyan/[0.05] text-xs font-medium text-cyan hover:bg-cyan/10 transition-colors cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
            <p className="text-[9px] text-gray-700 text-center">
              Ctrl+Enter to submit · Previous image used as reference
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 gap-1.5"
          >
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-subtle bg-charcoal text-xs font-medium text-gray-400 hover:text-gray-200 hover:border-subtleAlt hover:bg-elevated transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-cyan" /> : <Clipboard className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Caption"}
            </button>

            <button
              onClick={() => setFeedbackMode(true)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-cyan/20 bg-cyan/[0.05] text-xs font-medium text-cyan hover:bg-cyan/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>

            {post.status !== "posted" ? (
              <button
                onClick={() => onMarkPosted(post.id)}
                className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-subtle bg-charcoal text-xs font-medium text-gray-400 hover:text-gray-200 hover:border-subtleAlt hover:bg-elevated transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark Posted
              </button>
            ) : (
              <button
                onClick={onReset}
                className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-subtle bg-charcoal text-xs font-medium text-gray-400 hover:text-gray-200 hover:border-subtleAlt hover:bg-elevated transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                New Post
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main GeneratorView ───────────────────────────────────────────────────────

export default function GeneratorView({ funnels = [], onPostCreated }) {
  const [generating, setGenerating]           = useState(false);
  const [stepIndex, setStepIndex]             = useState(0);
  const [post, setPost]                       = useState(null);
  const [quota, setQuota]                     = useState(null);
  const [vaultCtx, setVaultCtx]               = useState(null);
  const [missingVault, setMissingVault]       = useState(false);
  const [selectedFunnelId, setSelectedFunnelId] = useState(null);
  const [loadingCtx, setLoadingCtx]           = useState(false);
  const [downloading, setDownloading]         = useState(false);
  const [userDescription, setUserDescription] = useState("");
  const [selectedModel, setSelectedModel]     = useState("dall-e-3");
  const [selectedStyles, setSelectedStyles]   = useState([]);
  const [postType, setPostType]               = useState("free_gift");
  const [aspectRatio, setAspectRatio]         = useState("1024x1024");
  const [referenceImages, setReferenceImages] = useState([]);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup preview object URLs on unmount
  useEffect(() => {
    return () => { referenceImages.forEach(img => URL.revokeObjectURL(img.preview)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (funnels.length > 0 && !selectedFunnelId) setSelectedFunnelId(funnels[0].id);
  }, [funnels, selectedFunnelId]);

  useEffect(() => {
    if (!selectedFunnelId) return;
    let cancelled = false;
    setLoadingCtx(true);
    setMissingVault(false);

    fetchWithAuth(`/api/daily-leads/generate?funnel_id=${selectedFunnelId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.missing) { setVaultCtx(null); setMissingVault(true); }
        else setVaultCtx(data.vaultContext);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCtx(false); });

    return () => { cancelled = true; };
  }, [selectedFunnelId]);

  const toggleStyle = (tag) =>
    setSelectedStyles(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 4 ? [...prev, tag] : prev
    );

  const handleRefImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const slots = 4 - referenceImages.length;
    const toProcess = files.slice(0, slots);
    const processed = await Promise.all(
      toProcess.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const [header, base64] = ev.target.result.split(',');
          const mimeType = header.match(/:(.*?);/)[1];
          resolve({ name: file.name, mimeType, base64, preview: URL.createObjectURL(file) });
        };
        reader.readAsDataURL(file);
      }))
    );
    setReferenceImages(prev => [...prev, ...processed]);
    e.target.value = '';
  }, [referenceImages.length]);

  const removeRefImage = useCallback((index) => {
    setReferenceImages(prev => {
      URL.revokeObjectURL(prev[index]?.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const stepForward = useCallback(() => {
    let i = 0;
    const timer = setInterval(() => { i++; setStepIndex(i); if (i >= 4) clearInterval(timer); }, 1800);
    return timer;
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    setStepIndex(0);
    const timer = stepForward();
    try {
      const res = await fetchWithAuth("/api/daily-leads/generate", {
        method: "POST",
        body: JSON.stringify({
          funnel_id: selectedFunnelId,
          post_type: postType,
          model: selectedModel,
          aspect_ratio: aspectRatio,
          style_tags: selectedStyles,
          user_description: userDescription.trim() || undefined,
          keyword: postType === "free_gift" ? "GUIDE" : "TIPS",
          reference_images: referenceImages.map(({ name, mimeType, base64 }) => ({ name, mimeType, base64 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "missing_vault_context") { setMissingVault(true); toast.error("Complete your Vault Free Gift setup first."); }
        else toast.error(data.error || "Generation failed");
        return;
      }
      setPost(data.post);
      setQuota(data.quota);
      onPostCreated?.(data.post);
      toast.success("Post generated!");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      clearInterval(timer);
      setGenerating(false);
    }
  }, [selectedFunnelId, postType, selectedModel, aspectRatio, selectedStyles, userDescription, stepForward, onPostCreated]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); if (canGenerate) generate(); }
  };

  const handleMarkPosted = useCallback(async (postId) => {
    await fetchWithAuth("/api/daily-leads/posts", {
      method: "PATCH",
      body: JSON.stringify({ post_id: postId, status: "posted" }),
    });
    setPost(prev => prev ? { ...prev, status: "posted" } : prev);
    toast.success("Marked as posted!");
  }, []);

  const handleDownload = async () => {
    if (!post?.image_url) return;
    setDownloading(true);
    try {
      const res = await fetch(post.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `post-${post.id.slice(0, 8)}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed"); }
    finally { setDownloading(false); }
  };

  const refine = useCallback(async (feedbackText) => {
    setGenerating(true);
    setStepIndex(0);
    const timer = stepForward();
    try {
      const res = await fetchWithAuth("/api/daily-leads/generate", {
        method: "POST",
        body: JSON.stringify({
          funnel_id: selectedFunnelId,
          post_type: postType,
          model: selectedModel,
          aspect_ratio: aspectRatio,
          style_tags: selectedStyles,
          user_description: feedbackText,
          keyword: postType === "free_gift" ? "GUIDE" : "TIPS",
          reference_images: referenceImages.map(({ name, mimeType, base64 }) => ({ name, mimeType, base64 })),
          is_refinement: true,
          previous_image_url: post?.image_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Regeneration failed");
        return;
      }
      setPost(data.post);
      setQuota(data.quota);
      onPostCreated?.(data.post);
      toast.success("Post updated!");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      clearInterval(timer);
      setGenerating(false);
    }
  }, [selectedFunnelId, postType, selectedModel, aspectRatio, selectedStyles, referenceImages, stepForward, onPostCreated, post]);

  const canGenerate = !generating && !!selectedFunnelId && !missingVault && !loadingCtx;
  const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);

  return (
    <div className="flex flex-col xl:flex-row gap-3 mb-10 min-h-[640px]">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <div className="xl:w-[300px] shrink-0 flex flex-col rounded-2xl border border-subtle bg-grayDark">

        {/* Funnel header */}
        <div className="px-4 pt-4 pb-3 border-b border-subtle rounded-t-2xl">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Engine</p>
          <FunnelSelector
            funnels={funnels}
            selectedId={selectedFunnelId}
            onSelect={(id) => { setSelectedFunnelId(id); setPost(null); }}
            loadingCtx={loadingCtx}
          />
        </div>

        {/* Context scroll area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">

          {loadingCtx && [70, 55, 82].map((w, i) => (
            <div key={i} className="rounded-lg border border-subtle bg-charcoal p-3 animate-pulse">
              <div className="h-1.5 w-10 bg-white/10 rounded mb-2" />
              <div className="h-3 bg-white/[0.05] rounded" style={{ width: `${w}%` }} />
            </div>
          ))}

          {!loadingCtx && missingVault && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" />
                <div>
                  <p className="text-xs font-medium text-white mb-0.5">Vault not set up</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-2">
                    Complete the Free Gift section in the Vault to enable generation.
                  </p>
                  <a
                    href={selectedFunnelId ? `/vault?funnel_id=${selectedFunnelId}` : "/vault"}
                    className="text-[10px] font-semibold text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    Open Vault →
                  </a>
                </div>
              </div>
            </div>
          )}

          {!loadingCtx && vaultCtx && (
            <>
              <ContextBlock label="Free Gift" value={vaultCtx.freeGiftName} highlight />
              <ContextBlock label="Target Niche" value={vaultCtx.niche} />
              <ContextBlock label="Core Promise" value={vaultCtx.transformation} />

              {/* Style modifier tags */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">Style</p>
                  {selectedStyles.length > 0 && (
                    <button
                      onClick={() => setSelectedStyles([])}
                      className="text-[9px] text-gray-600 hover:text-gray-400 cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {STYLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleStyle(tag)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors duration-150 cursor-pointer ${
                        selectedStyles.includes(tag)
                          ? "border-cyan/25 bg-cyan/[0.06] text-cyan"
                          : "border-subtle bg-charcoal text-gray-500 hover:text-gray-300 hover:border-subtleAlt"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedStyles.length >= 4 && (
                  <p className="text-[9px] text-gray-700 mt-1.5">Max 4 styles</p>
                )}
              </div>
            </>
          )}

          {/* Quota indicator */}
          {quota && (
            <div className="flex items-center gap-2 pt-1">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                quota.remaining > 3 ? "bg-cyan" : quota.remaining > 0 ? "bg-amber-400" : "bg-red-500"
              }`} />
              <div className="flex-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan/40 transition-all duration-500"
                  style={{ width: `${(quota.remaining / quota.limit) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-600 tabular-nums">{quota.remaining}/{quota.limit}</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-subtle p-3 rounded-b-2xl">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleRefImageUpload}
          />

          <div className="rounded-xl border border-subtle bg-surface overflow-hidden focus-within:border-subtleAlt transition-colors duration-150">
            {/* Reference image thumbnails */}
            {referenceImages.length > 0 && (
              <div className="flex items-center gap-2 px-3 pt-2.5 flex-wrap">
                {referenceImages.map((img, i) => (
                  <div key={i} className="relative w-9 h-9 rounded-md overflow-hidden border border-subtle shrink-0 group/thumb">
                    <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeRefImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={userDescription}
              onChange={e => setUserDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={!vaultCtx || generating}
              placeholder={
                vaultCtx
                  ? 'Describe the image… "dark background, bold typography"'
                  : "Select a funnel first…"
              }
              className="w-full px-3 pt-3 pb-2 text-xs text-gray-300 leading-relaxed resize-none bg-transparent focus:outline-none placeholder-gray-700 disabled:opacity-40"
            />
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ModelDropdown selected={selectedModel} onSelect={setSelectedModel} />

                {/* Reference image upload — shown for Nano Banana */}
                {selectedModel === "nano-banana" && referenceImages.length < 4 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Add reference images (logo, author photo, etc.)"
                    className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-subtle bg-charcoal text-gray-500 hover:text-gray-300 hover:border-subtleAlt transition-colors cursor-pointer"
                  >
                    <ImageAdd className="w-3 h-3" />
                    <span className="text-[9px] font-medium">
                      {referenceImages.length > 0 ? `${referenceImages.length}/4` : "Refs"}
                    </span>
                  </button>
                )}
                {selectedStyles.length > 0 && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    {selectedStyles.slice(0, 2).map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded border border-subtle text-[9px] text-gray-500 whitespace-nowrap">
                        {s}
                      </span>
                    ))}
                    {selectedStyles.length > 2 && (
                      <span className="text-[9px] text-gray-700">+{selectedStyles.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={generate}
                disabled={!canGenerate}
                title="Generate (Ctrl+Enter)"
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-cyan hover:bg-white transition-colors duration-150 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:bg-white/10 disabled:hover:bg-white/10"
              >
                {generating
                  ? <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                  : <ArrowUp className="w-3.5 h-3.5 text-black" />
                }
              </button>
            </div>
          </div>
          <p className="text-[9px] text-gray-700 mt-1.5 text-center">
            {selectedModel === "nano-banana"
              ? "Ctrl+Enter · Brand colors & vault media auto-included"
              : "Ctrl+Enter · Vault context applied automatically"}
          </p>
        </div>
      </div>

      {/* ══ CANVAS ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Controls bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Post type */}
          <div className="flex items-center rounded-lg border border-subtle bg-grayDark p-0.5">
            {POST_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPostType(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  postType === id
                    ? "bg-elevated text-white border border-subtle"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-subtle" />

          {/* Aspect ratio */}
          <div className="flex items-center rounded-lg border border-subtle bg-grayDark p-0.5">
            {ASPECT_RATIOS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setAspectRatio(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  aspectRatio === id
                    ? "bg-elevated text-white border border-subtle"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {selectedFunnel && (
            <>
              <div className="w-px h-4 bg-subtle" />
              <span className="text-[10px] text-gray-600 truncate max-w-[180px]">{selectedFunnel.funnel_name}</span>
            </>
          )}

          {post && !generating && (
            <button
              onClick={() => setPost(null)}
              className="ml-auto flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Canvas container */}
        <div className="flex-1 rounded-2xl border border-subtle overflow-hidden" style={{ minHeight: 380 }}>
          {generating ? (
            <GeneratingCanvas step={stepIndex} />
          ) : post ? (
            <ImageCanvas post={post} onDownload={handleDownload} downloading={downloading} />
          ) : (
            <EmptyCanvas hasContext={!!vaultCtx} noFunnel={!selectedFunnelId} />
          )}
        </div>

        {/* Caption */}
        {post && !generating && (
          <CaptionPanel
            post={post}
            quota={quota}
            onMarkPosted={handleMarkPosted}
            onRefine={refine}
            onReset={() => setPost(null)}
          />
        )}
      </div>
    </div>
  );
}
