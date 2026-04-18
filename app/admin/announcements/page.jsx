"use client";
import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Megaphone,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Info,
    CheckCircle,
    AlertTriangle,
    Tag,
    Loader2,
    X
} from "lucide-react";
import { T as _T } from "@/components/admin/adminTheme";

const TYPE_CONFIG = {
    info:     { label: "Info",     icon: Info,          color: _T.blue || "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  },
    success:  { label: "Success",  icon: CheckCircle,   color: _T.green, bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)"  },
    warning:  { label: "Warning",  icon: AlertTriangle, color: _T.amber, bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)"  },
    discount: { label: "Discount", icon: Tag,            color: _T.purple, bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", message: "", type: "info" });
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/announcements");
            const data = await res.json();
            setAnnouncements(data.announcements || []);
        } catch (err) {
            console.error("Failed to fetch announcements:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) return;
        setCreating(true);

        try {
            const res = await fetch("/api/admin/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setForm({ title: "", message: "", type: "info" });
                setShowForm(false);
                fetchAnnouncements();
            }
        } catch (err) {
            console.error("Failed to create announcement:", err);
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id, currentActive) => {
        setTogglingId(id);
        try {
            await fetch(`/api/admin/announcements/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !currentActive }),
            });
            fetchAnnouncements();
        } catch (err) {
            console.error("Failed to toggle announcement:", err);
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;
        setDeletingId(id);
        try {
            await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
            fetchAnnouncements();
        } catch (err) {
            console.error("Failed to delete announcement:", err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: 860, margin: "0 auto", width: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 3, height: 22, backgroundColor: "#16C7E7", borderRadius: 2, flexShrink: 0 }} />
                            <h1 style={{ color: "#F4F8FB", fontSize: 22, fontWeight: 700, margin: 0 }}>Announcements</h1>
                        </div>
                        <p style={{ color: "#B2C0CD", fontSize: 13, margin: 0, marginLeft: 11 }}>
                            Manage global notifications for all users
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "9px 18px",
                            backgroundColor: showForm ? "#121920" : "#16C7E7",
                            border: showForm ? "1px solid #1E2A34" : "none",
                            borderRadius: 10,
                            color: showForm ? "#B2C0CD" : "#05080B",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? "Cancel" : "New Announcement"}
                    </button>
                </div>

                {/* Create Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: "hidden", marginBottom: 28 }}
                        >
                            <form
                                onSubmit={handleCreate}
                                style={{
                                    backgroundColor: "#0D1217",
                                    border: "1px solid #1E2A34",
                                    borderRadius: 14,
                                    padding: 24,
                                }}
                            >
                                {/* Title */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ color: "#B2C0CD", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="e.g., New Feature Released!"
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            backgroundColor: "#121920",
                                            border: "1px solid #1E2A34",
                                            borderRadius: 10,
                                            color: "#F4F8FB",
                                            fontSize: 14,
                                            outline: "none",
                                            boxSizing: "border-box",
                                            transition: "border-color 0.15s",
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = "#16C7E7")}
                                        onBlur={(e) => (e.target.style.borderColor = "#1E2A34")}
                                    />
                                </div>

                                {/* Message */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ color: "#B2C0CD", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Message
                                    </label>
                                    <textarea
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="Describe the update, discount, or news..."
                                        rows={3}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            backgroundColor: "#121920",
                                            border: "1px solid #1E2A34",
                                            borderRadius: 10,
                                            color: "#F4F8FB",
                                            fontSize: 14,
                                            outline: "none",
                                            resize: "none",
                                            boxSizing: "border-box",
                                            transition: "border-color 0.15s",
                                            fontFamily: "inherit",
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = "#16C7E7")}
                                        onBlur={(e) => (e.target.style.borderColor = "#1E2A34")}
                                    />
                                </div>

                                {/* Type selector */}
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ color: "#B2C0CD", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Type
                                    </label>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                                            const Icon = cfg.icon;
                                            const isSelected = form.type === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, type: key })}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        padding: "7px 14px",
                                                        borderRadius: 9,
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        transition: "all 0.15s",
                                                        backgroundColor: isSelected ? cfg.bg : "#121920",
                                                        border: `1px solid ${isSelected ? cfg.border : "#1E2A34"}`,
                                                        color: isSelected ? cfg.color : "#5a6a78",
                                                    }}
                                                >
                                                    <Icon style={{ width: 14, height: 14 }} />
                                                    {cfg.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "9px 20px",
                                            backgroundColor: "#16C7E7",
                                            color: "#05080B",
                                            border: "none",
                                            borderRadius: 10,
                                            fontWeight: 600,
                                            fontSize: 14,
                                            cursor: creating ? "not-allowed" : "pointer",
                                            opacity: creating ? 0.6 : 1,
                                            transition: "opacity 0.15s",
                                        }}
                                    >
                                        {creating ? (
                                            <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                                        ) : (
                                            <Plus style={{ width: 16, height: 16 }} />
                                        )}
                                        Publish
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Announcements List */}
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
                        <Loader2 style={{ color: "#16C7E7" }} className="w-8 h-8 animate-spin" />
                    </div>
                ) : announcements.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
                        <Megaphone style={{ width: 40, height: 40, color: "#1E2A34" }} />
                        <p style={{ color: "#B2C0CD", fontSize: 15, fontWeight: 500, margin: 0 }}>No announcements yet</p>
                        <p style={{ color: "#5a6a78", fontSize: 13, margin: 0 }}>Click "New Announcement" to create one.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {announcements.map((a) => {
                            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
                            const Icon = cfg.icon;
                            const formattedDate = new Date(a.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            });

                            return (
                                <motion.div
                                    key={a.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        backgroundColor: "#0D1217",
                                        border: `1px solid ${a.is_active ? cfg.border : "#1E2A34"}`,
                                        borderLeft: `3px solid ${a.is_active ? cfg.color : "#1E2A34"}`,
                                        borderRadius: 12,
                                        padding: "16px 20px",
                                        opacity: a.is_active ? 1 : 0.55,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                                        {/* Left: icon + content */}
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 9,
                                                backgroundColor: cfg.bg,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                <Icon style={{ width: 16, height: 16, color: cfg.color }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                                    <span style={{ color: "#F4F8FB", fontWeight: 600, fontSize: 14 }}>{a.title}</span>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: 999,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        backgroundColor: cfg.bg,
                                                        color: cfg.color,
                                                    }}>
                                                        {cfg.label}
                                                    </span>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: 999,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        backgroundColor: a.is_active ? "rgba(52,211,153,0.12)" : "rgba(90,106,120,0.15)",
                                                        color: a.is_active ? "#34d399" : "#5a6a78",
                                                    }}>
                                                        {a.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                                <p style={{
                                                    color: "#B2C0CD",
                                                    fontSize: 13,
                                                    lineHeight: 1.5,
                                                    margin: 0,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}>
                                                    {a.message}
                                                </p>
                                                <p style={{ color: "#5a6a78", fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                                                    Created {formattedDate}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: action buttons */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                            {/* Toggle */}
                                            <button
                                                onClick={() => handleToggle(a.id, a.is_active)}
                                                disabled={togglingId === a.id}
                                                title={a.is_active ? "Deactivate" : "Activate"}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 8,
                                                    border: "none",
                                                    backgroundColor: "transparent",
                                                    color: a.is_active ? "#34d399" : "#5a6a78",
                                                    cursor: togglingId === a.id ? "not-allowed" : "pointer",
                                                    transition: "background-color 0.15s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = a.is_active
                                                        ? "rgba(52,211,153,0.1)"
                                                        : "rgba(90,106,120,0.1)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                }}
                                            >
                                                {togglingId === a.id ? (
                                                    <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                                                ) : a.is_active ? (
                                                    <ToggleRight style={{ width: 18, height: 18 }} />
                                                ) : (
                                                    <ToggleLeft style={{ width: 18, height: 18 }} />
                                                )}
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                disabled={deletingId === a.id}
                                                title="Delete"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 8,
                                                    border: "none",
                                                    backgroundColor: "transparent",
                                                    color: "#5a6a78",
                                                    cursor: deletingId === a.id ? "not-allowed" : "pointer",
                                                    transition: "background-color 0.15s, color 0.15s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                                                    e.currentTarget.style.color = "#f87171";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                    e.currentTarget.style.color = "#5a6a78";
                                                }}
                                            >
                                                {deletingId === a.id ? (
                                                    <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                                                ) : (
                                                    <Trash2 style={{ width: 18, height: 18 }} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
