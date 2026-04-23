"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle, AlertCircle, Loader2, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

const REPORT_TYPES = [
  { value: "bug", label: "Bug Report", dot: "#EF4444" },
  { value: "feedback", label: "Feedback", dot: "#00E5FF" },
  { value: "feature", label: "Feature Request", dot: "#A78BFA" },
];

const MAX_FILE_SIZE = 3 * 1024 * 1024;

function FeedbackForm({ defaultEmail = "" }) {
  const [type, setType] = useState("bug");
  const [email, setEmail] = useState(defaultEmail);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const remaining = 3 - images.length;
    Array.from(files).slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > MAX_FILE_SIZE) { setErrorMsg(`${file.name} exceeds 3 MB limit.`); return; }
      const reader = new FileReader();
      reader.onload = (e) =>
        setImages((prev) => [...prev, { name: file.name, preview: e.target.result, data: e.target.result, mimeType: file.type }]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));
  const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim() || !description.trim()) return;
    if (description.trim().length < 10) { setErrorMsg("Please describe in more detail."); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          type,
          description: description.trim(),
          images: images.map(({ name, data, mimeType }) => ({ name, data, mimeType })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit.");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-3 py-2">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Report submitted — thank you!
        </div>
        <p className="text-[#8b8b93] text-xs leading-relaxed">We've received your report and notified the team.</p>
        <button
          onClick={() => { setStatus("idle"); setDescription(""); setImages([]); setType("bug"); }}
          className="text-cyan text-xs underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-1.5 flex-wrap">
        {REPORT_TYPES.map(({ value, label, dot }) => (
          <button key={value} type="button" onClick={() => setType(value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
            style={{
              background: type === value ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.04)",
              border: type === value ? `1px solid ${dot}` : "1px solid rgba(255,255,255,0.08)",
              color: type === value ? dot : "#8b8b93",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot, opacity: type === value ? 1 : 0.4 }} />
            {label}
          </button>
        ))}
      </div>

      <input
        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com" required
        className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-[#4a4a52] outline-none bg-white/[0.04] border border-cyan/[0.15] focus:border-cyan/50 transition-colors"
      />

      <textarea
        value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the issue or feedback..." required rows={3}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-[#4a4a52] outline-none resize-none leading-relaxed bg-white/[0.04] border border-cyan/[0.15] focus:border-cyan/50 transition-colors"
      />

      {images.length < 3 && (
        <div
          onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg cursor-pointer group bg-cyan/[0.03] border border-dashed border-cyan/20 hover:border-cyan/40 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-[#4a4a52] group-hover:text-cyan transition-colors shrink-0" />
          <span className="text-[11px] text-[#4a4a52] group-hover:text-[#8b8b93] transition-colors">
            Add screenshots ({images.length}/3) — drop or click
          </span>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, idx) => (
            <div key={idx} className="relative group/img shrink-0">
              <img src={img.preview} alt={img.name} className="w-16 h-12 object-cover rounded-md border border-cyan/20" />
              <button type="button" onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <button type="submit" disabled={status === "loading"}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed bg-cyan/10 border border-cyan/25 text-cyan hover:bg-cyan/[0.18]"
      >
        {status === "loading" ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : "Submit Report →"}
      </button>
    </form>
  );
}

export default function BugReportModal({ collapsed = false }) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const defaultEmail = user?.emailAddresses?.[0]?.emailAddress || "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={collapsed ? "Report a bug" : undefined}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-[12px] border border-transparent transition-all",
          collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
          "text-[#8b8b93] hover:border-white/[0.07] hover:bg-white/[0.03] hover:text-white"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] group-hover:text-[#f0f0f2] transition-colors">
          <Bug className="h-3.5 w-3.5 shrink-0" />
        </div>
        {!collapsed && (
          <span className="text-[13px] font-medium truncate">Report a bug</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-[24px] border border-white/[0.08] bg-[#111214] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-red-500/20 bg-red-500/10">
                    <Bug className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white leading-tight">Report an Issue</h3>
                    <p className="text-[11px] text-[#8b8b93] mt-0.5">Bug, feedback, or feature request</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#0d0e0f] text-[#8b8b93] hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <FeedbackForm defaultEmail={defaultEmail} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
