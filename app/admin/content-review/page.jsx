"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
    FileText,
    Edit,
    Save,
    X,
    Check,
    Clock,
    User,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

export default function AdminContentReview() {
    const { session, loading: authLoading } = useAuth();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editedContent, setEditedContent] = useState("");
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    useEffect(() => {
        if (!authLoading && session) {
            fetchContents();
        }
    }, [authLoading, session, pagination.page, globalFilter]);

    const fetchContents = async () => {
        if (!session) return;

        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            const response = await fetch(`/api/admin/content-review?${params}`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed to fetch content');

            const data = await response.json();
            setContents(data.content || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0
            }));
        } catch (err) {
            console.error('Error fetching content:', err);
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditedContent(typeof item.aiOutput === 'string' ? item.aiOutput : JSON.stringify(item.aiOutput, null, 2));
    };

    const handleSave = async (id) => {
        try {
            const response = await fetch('/api/admin/content-review', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    id,
                    aiOutput: editedContent,
                    approved: true
                })
            });

            if (!response.ok) throw new Error('Failed to save content');

            toast.success('Content saved and approved');
            setEditingId(null);
            setEditedContent("");
            fetchContents(); // Refresh list
        } catch (err) {
            console.error('Error saving content:', err);
            toast.error('Failed to save content');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditedContent("");
    };

    const handleApprove = async (id) => {
        try {
            const response = await fetch('/api/admin/content-review', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    id,
                    approved: true
                })
            });

            if (!response.ok) throw new Error('Failed to approve content');

            toast.success('Content approved');
            fetchContents(); // Refresh list
        } catch (err) {
            console.error('Error approving content:', err);
            toast.error('Failed to approve content');
        }
    };

    const statusColors = {
        true: "bg-green-500/20 text-green-400",
        false: "bg-yellow-500/20 text-yellow-400",
    };

    // Filter contents based on search
    const filteredContents = contents.filter(item => {
        if (!globalFilter) return true;
        const searchLower = globalFilter.toLowerCase();
        return (
            item.userName?.toLowerCase().includes(searchLower) ||
            item.userEmail?.toLowerCase().includes(searchLower) ||
            item.slideId?.toString().includes(searchLower)
        );
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Content Review</h1>
                        <p className="text-gray-400">Review and approve AI-generated content from users.</p>
                    </div>
                    <button
                        onClick={fetchContents}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user name or email..."
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                    </div>
                ) : filteredContents.length === 0 ? (
                    <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No content found</p>
                    </div>
                ) : (
                    <>
                        {/* Content Cards */}
                        <div className="space-y-6">
                            {filteredContents.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-[#2a2a2d] gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/20 to-purple-500/20 flex items-center justify-center border border-[#2a2a2d]">
                                                <FileText className="w-6 h-6 text-cyan" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Slide {item.slideId} Content</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {item.userName || item.userEmail}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        }) : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.approved]}`}>
                                                {item.approved ? 'Approved' : 'Pending'}
                                            </span>
                                            {editingId !== item.id && !item.approved && (
                                                <button
                                                    onClick={() => handleApprove(item.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            )}
                                            {editingId !== item.id && (
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {editingId === item.id ? (
                                            <div className="space-y-4">
                                                <textarea
                                                    value={editedContent}
                                                    onChange={(e) => setEditedContent(e.target.value)}
                                                    rows={12}
                                                    className="w-full px-4 py-3 bg-[#0e0e0f] border border-cyan rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none font-mono text-sm"
                                                />
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={handleCancel}
                                                        className="flex items-center gap-2 px-4 py-2 bg-[#0e0e0f] hover:bg-[#2a2a2d] text-gray-300 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleSave(item.id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-cyan hover:brightness-110 text-black rounded-lg font-semibold transition-all"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Save & Approve
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-[#0e0e0f] rounded-xl p-4 border border-[#2a2a2d]">
                                                <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono leading-relaxed max-h-96 overflow-y-auto">
                                                    {typeof item.aiOutput === 'string' ? item.aiOutput : JSON.stringify(item.aiOutput, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 bg-[#1b1b1d] rounded-xl border border-[#2a2a2d]">
                            <p className="text-sm text-gray-400">
                                Total: {pagination.total} items
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page <= 1}
                                    className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-gray-400">
                                    Page {pagination.page} of {pagination.totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
