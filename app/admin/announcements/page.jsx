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

const TYPE_CONFIG = {
    info: { label: "Info", icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    success: { label: "Success", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    warning: { label: "Warning", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    discount: { label: "Discount", icon: Tag, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
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
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                            <p className="text-sm text-gray-400">
                                Manage global notifications for all users
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan to-blue-500 text-black font-semibold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-cyan/20"
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
                            className="overflow-hidden mb-8"
                        >
                            <form
                                onSubmit={handleCreate}
                                className="bg-[#131314] border border-[#1b1b1d] rounded-2xl p-6 space-y-5"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="e.g., 🎉 New Feature Released!"
                                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
                                    <textarea
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="Describe the update, discount, or news..."
                                        rows={3}
                                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 outline-none transition-all resize-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                                    <div className="flex gap-3 flex-wrap">
                                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                                            const Icon = cfg.icon;
                                            const isSelected = form.type === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, type: key })}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                                        isSelected
                                                            ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                                                            : "bg-[#0e0e0f] border-[#2a2a2d] text-gray-400 hover:border-gray-500"
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {cfg.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan to-blue-500 text-black font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                                    >
                                        {creating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        Publish Announcement
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Announcements List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No announcements yet</p>
                        <p className="text-sm mt-1">Click "New Announcement" to create one.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((a) => {
                            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
                            const Icon = cfg.icon;
                            return (
                                <motion.div
                                    key={a.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-[#131314] border rounded-2xl p-5 transition-all ${
                                        a.is_active ? cfg.border : "border-[#1b1b1d] opacity-60"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                                <Icon className={`w-4 h-4 ${cfg.color}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-white truncate">{a.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {a.is_active ? (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 line-clamp-2">{a.message}</p>
                                                <p className="text-xs text-gray-600 mt-2">
                                                    Created {new Date(a.created_at).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleToggle(a.id, a.is_active)}
                                                disabled={togglingId === a.id}
                                                title={a.is_active ? "Deactivate" : "Activate"}
                                                className={`p-2 rounded-xl transition-all ${
                                                    a.is_active
                                                        ? "hover:bg-emerald-500/10 text-emerald-400"
                                                        : "hover:bg-gray-500/10 text-gray-500"
                                                }`}
                                            >
                                                {togglingId === a.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : a.is_active ? (
                                                    <ToggleRight className="w-5 h-5" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                disabled={deletingId === a.id}
                                                title="Delete"
                                                className="p-2 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                                            >
                                                {deletingId === a.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
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
