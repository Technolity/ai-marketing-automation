"use client";
import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  Bug, MessageSquare, Lightbulb, Trash2, ChevronRight,
  X, AlertCircle, CheckCircle2, Clock, RefreshCw, Loader2,
  ImageIcon,
} from "@/lib/icons";

/* ── constants ── */
const STATUS_TABS = [
  { value: "all",         label: "All Reports" },
  { value: "new",         label: "New"         },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved"    },
];

const TYPE_META = {
  bug:      { label: "Bug Report",      Icon: Bug,           color: "#f87171", bg: "rgba(248,113,113,0.12)"   },
  feedback: { label: "Feedback",         Icon: MessageSquare, color: "#16C7E7", bg: "rgba(22,199,231,0.1)"    },
  feature:  { label: "Feature Request", Icon: Lightbulb,     color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

const STATUS_META = {
  new:         { label: "New",         Icon: AlertCircle,  color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  in_progress: { label: "In Progress", Icon: Clock,        color: "#16C7E7", bg: "rgba(22,199,231,0.1)"   },
  resolved:    { label: "Resolved",    Icon: CheckCircle2, color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
};

/* ── components ── */
function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.feedback;
  const { Icon } = m;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-poppins text-[11px] font-semibold shrink-0"
      style={{ background: m.bg, color: m.color }}
    >
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.new;
  const { Icon } = m;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-poppins text-[11px] font-semibold"
      style={{ background: m.bg, color: m.color }}
    >
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

function ImageModal({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
        style={{ background: "rgba(255,255,255,0.08)" }}
        aria-label="Close image"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      <img
        src={src}
        alt="Attachment"
        className="max-w-full max-h-[85vh] rounded-xl object-contain"
        style={{ boxShadow: "0 0 60px rgba(0,0,0,0.8)" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function DetailDrawer({ report, onClose, onStatusChange }) {
  const [status, setStatus] = useState(report.status);
  const [note,   setNote]   = useState(report.admin_note || "");
  const [saving, setSaving] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/admin/feedback", {
        method: "PATCH",
        body: JSON.stringify({ id: report.id, status, admin_note: note }),
      });
      if (res.ok) {
        const { report: updated } = await res.json();
        onStatusChange(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const m = TYPE_META[report.type] || TYPE_META.feedback;
  const created = new Date(report.created_at).toLocaleString();

  return (
    <>
      {imgSrc && <ImageModal src={imgSrc} onClose={() => setImgSrc(null)} />}

      <div
        className="fixed inset-0 z-[100]"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      <div
        className="fixed top-0 right-0 h-full w-full max-w-[520px] z-[110] flex flex-col overflow-hidden"
        style={{ background: "#121920", borderLeft: "1px solid #1E2A34" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-6 shrink-0"
          style={{ borderBottom: "1px solid #1E2A34" }}
        >
          <div className="flex flex-col gap-2">
            <TypeBadge type={report.type} />
            <p style={{ color: "#B2C0CD", fontSize: 12 }}>{report.email} · {created}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: "#B2C0CD" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Description */}
          <div>
            <p style={{ color: "#5a6a78", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Description
            </p>
            <div
              className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ background: "rgba(22,199,231,0.03)", border: "1px solid rgba(22,199,231,0.08)", color: "#F4F8FB" }}
            >
              {report.description}
            </div>
          </div>

          {/* Attachments */}
          {report.image_urls?.length > 0 && (
            <div>
              <p style={{ color: "#5a6a78", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Attachments ({report.image_urls.length})
              </p>
              <div className="flex gap-3 flex-wrap">
                {report.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setImgSrc(url)}
                    className="relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 focus:outline-none group/img"
                    style={{ border: "1px solid rgba(22,199,231,0.2)" }}
                    aria-label={`View attachment ${i + 1}`}
                  >
                    <img src={url} alt={`Attachment ${i + 1}`} className="w-28 h-20 object-cover block" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status update */}
          <div>
            <p style={{ color: "#5a6a78", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Update Status
            </p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS_META).map(([val, meta]) => {
                const { Icon } = meta;
                return (
                  <button
                    key={val}
                    onClick={() => setStatus(val)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                    style={{
                      background: status === val ? meta.bg : "rgba(255,255,255,0.04)",
                      border: `1px solid ${status === val ? meta.color : "#1E2A34"}`,
                      color: status === val ? meta.color : "#5a6a78",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <p style={{ color: "#5a6a78", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Internal Note
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note (not visible to user)..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none resize-none leading-relaxed transition-colors"
              style={{
                background: "#0D1217",
                border: "1px solid #1E2A34",
                color: "#F4F8FB",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(22,199,231,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2A34")}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 shrink-0 flex gap-3" style={{ borderTop: "1px solid #1E2A34" }}>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#16C7E7", color: "#05080B" }}
          >
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
            style={{ border: "1px solid #1E2A34", color: "#B2C0CD", background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F4F8FB")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#B2C0CD")}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

/* ── main page ── */
export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [reports,   setReports]   = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async (tab) => {
    setLoading(true);
    try {
      const q = tab === "all" ? "" : `&status=${tab}`;
      const res = await fetchWithAuth(`/api/admin/feedback?limit=50${q}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  const handleTabChange = (tab) => { setActiveTab(tab); };

  const handleStatusChange = (updated) => {
    setReports((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setSelected(updated);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetchWithAuth(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setTotal((t) => t - 1);
        if (selected?.id === id) setSelected(null);
      }
    } finally {
      setDeleting(null);
    }
  };

  const counts = reports.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6" style={{ width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 3, height: 22, backgroundColor: "#16C7E7", borderRadius: 2, flexShrink: 0 }} />
              <h1 style={{ color: "#F4F8FB", fontSize: 22, fontWeight: 700, margin: 0 }}>Feedback & Reports</h1>
            </div>
            <p style={{ color: "#B2C0CD", fontSize: 13, marginLeft: 11 }}>
              {total} report{total !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => load(activeTab)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors disabled:opacity-50"
            style={{ background: "#121920", border: "1px solid #1E2A34", color: "#B2C0CD" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(({ value, label }) => {
            const count = value === "all" ? total : (counts[value] || 0);
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200"
                style={{
                  background: isActive ? "rgba(22,199,231,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? "rgba(22,199,231,0.3)" : "#1E2A34"}`,
                  color: isActive ? "#16C7E7" : "#5a6a78",
                }}
              >
                {label}
                {count > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: isActive ? "rgba(22,199,231,0.2)" : "rgba(255,255,255,0.06)",
                      color: isActive ? "#16C7E7" : "#5a6a78",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#16C7E7" }} />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 10 }}>
            <MessageSquare style={{ width: 36, height: 36, color: "#1E2A34" }} />
            <p style={{ color: "#B2C0CD", fontSize: 14 }}>No reports found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const tMeta = TYPE_META[report.type] || TYPE_META.feedback;
              const { Icon: TIcon } = tMeta;
              const created = new Date(report.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });

              return (
                <div
                  key={report.id}
                  className="group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
                  style={{ backgroundColor: "#0D1217", border: "1px solid #1E2A34" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#16C7E7")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E2A34")}
                  onClick={() => setSelected(report)}
                >
                  {/* Type icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: tMeta.bg }}
                  >
                    <TIcon className="w-4 h-4" style={{ color: tMeta.color }} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <TypeBadge type={report.type} />
                      <StatusBadge status={report.status} />
                      {report.image_urls?.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: "#5a6a78" }}>
                          <ImageIcon className="w-3 h-3" />
                          {report.image_urls.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mb-1" style={{ color: "#B2C0CD" }}>{report.email}</p>
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#F4F8FB" }}>
                      {report.description}
                    </p>
                  </div>

                  {/* Date + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px]" style={{ color: "#5a6a78" }}>{created}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                        disabled={deleting === report.id}
                        className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors hover:bg-red-500/15"
                        aria-label="Delete report"
                      >
                        {deleting === report.id
                          ? <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" style={{ color: "#f87171" }} />}
                      </button>
                      <ChevronRight className="w-4 h-4" style={{ color: "#5a6a78" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </AdminLayout>
  );
}
