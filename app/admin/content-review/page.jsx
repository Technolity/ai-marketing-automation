"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    FileText,
    Check,
    Clock,
    User,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    Filter
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

// Content type names mapping
const CONTENT_NAMES = {
    1: "Ideal Client Profile",
    2: "Core Message",
    3: "Signature Story",
    4: "Offer & Program",
    5: "Sales Scripts",
    6: "Free Gift",
    7: "Video Sales Letter (VSL)",
    8: "Email Sequences",
    9: "Facebook Ads",
    10: "Funnel Copy",
    11: "Content Ideas",
    12: "12-Month Program",
    13: "YouTube Show",
    14: "Content Pillars",
    15: "Professional Bio",
    16: "Appointment Reminders"
};

export default function AdminContentReview() {
    const { session, loading: authLoading } = useAuth();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    // Expandable state
    const [expandedSessions, setExpandedSessions] = useState(new Set());
    const [expandedContent, setExpandedContent] = useState(new Set());

    useEffect(() => {
        if (!authLoading && session) {
            fetchContents();
        }
    }, [authLoading, session, pagination.page, statusFilter]);

    const fetchContents = async () => {
        if (!session) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter
            });

            const response = await fetchWithAuth(`/api/admin/content-review?${params}`);
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

    const handleApprove = async (id) => {
        try {
            const response = await fetchWithAuth('/api/admin/content-review', {
                method: 'PUT',
                body: JSON.stringify({ id, approved: true })
            });

            if (!response.ok) throw new Error('Failed to approve content');

            toast.success('Content approved');
            fetchContents();
        } catch (err) {
            console.error('Error approving content:', err);
            toast.error('Failed to approve content');
        }
    };

    const handleReject = async (id) => {
        try {
            const response = await fetchWithAuth('/api/admin/content-review', {
                method: 'PUT',
                body: JSON.stringify({ id, approved: false })
            });

            if (!response.ok) throw new Error('Failed to reject content');

            toast.success('Content marked as pending');
            fetchContents();
        } catch (err) {
            console.error('Error rejecting content:', err);
            toast.error('Failed to reject content');
        }
    };

    const toggleSession = (sessionId) => {
        const newExpanded = new Set(expandedSessions);
        if (newExpanded.has(sessionId)) {
            newExpanded.delete(sessionId);
        } else {
            newExpanded.add(sessionId);
        }
        setExpandedSessions(newExpanded);
    };

    const toggleContent = (contentKey) => {
        const newExpanded = new Set(expandedContent);
        if (newExpanded.has(contentKey)) {
            newExpanded.delete(contentKey);
        } else {
            newExpanded.add(contentKey);
        }
        setExpandedContent(newExpanded);
    };

    // Group by session
    const groupedContents = contents.reduce((acc, item) => {
        const key = `${item.userId}-${item.slideId}`;
        if (!acc[key]) {
            acc[key] = {
                userId: item.userId,
                userName: item.userName,
                userEmail: item.userEmail,
                slideId: item.slideId,
                items: []
            };
        }
        acc[key].items.push(item);
        return acc;
    }, {});

    // Filter contents
    const filteredGroups = Object.entries(groupedContents).filter(([key, group]) => {
        if (!globalFilter) return true;
        const searchLower = globalFilter.toLowerCase();
        return (
            group.userName?.toLowerCase().includes(searchLower) ||
            group.userEmail?.toLowerCase().includes(searchLower)
        );
    });

    const renderContentValue = (value, level = 0) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-500 italic">null</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-gray-500 italic">[]</span>;
            }
            return (
                <ul className="list-disc list-inside space-y-1 ml-4">
                    {value.map((item, idx) => (
                        <li key={idx} className="text-gray-300">
                            {typeof item === 'object' ? renderContentValue(item, level + 1) : item}
                        </li>
                    ))}
                </ul>
            );
        }

        if (typeof value === 'object') {
            return (
                <div className={`space-y-2 ${level > 0 ? 'ml-4 pl-4 border-l border-gray-700' : ''}`}>
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k}>
                            <span className="text-cyan font-medium">{k}:</span>{' '}
                            <span className="text-gray-300">{renderContentValue(v, level + 1)}</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof value === 'string' && value.length > 200) {
            return (
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {value}
                </p>
            );
        }

        return <span className="text-gray-300">{String(value)}</span>;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Content Review</h1>
                        <p className="text-gray-400">Review and approve AI-generated marketing content.</p>
                    </div>
                    <button
                        onClick={fetchContents}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by user name or email..."
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-12 pr-8 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl text-white focus:outline-none focus:border-cyan transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending Only</option>
                            <option value="approved">Approved Only</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No content found</p>
                    </div>
                ) : (
                    <>
                        {/* Content Groups */}
                        <div className="space-y-4">
                            {filteredGroups.map(([key, group]) => {
                                const isExpanded = expandedSessions.has(key);
                                const allApproved = group.items.every(item => item.approved);

                                return (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden"
                                    >
                                        {/* Session Header */}
                                        <button
                                            onClick={() => toggleSession(key)}
                                            className="w-full flex items-center justify-between p-6 hover:bg-[#0e0e0f] transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/20 to-purple-500/20 flex items-center justify-center border border-[#2a2a2d]">
                                                    <FileText className="w-6 h-6 text-cyan" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-semibold text-lg">
                                                        {group.slideId === 99 ? 'Complete Marketing System' : `Step ${group.slideId} Content`}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-4 h-4" />
                                                            {group.userName}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            {allApproved ? (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                                    <span className="text-green-400">All Approved</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="w-4 h-4 text-yellow-400" />
                                                                    <span className="text-yellow-400">Pending Review</span>
                                                                </>
                                                            )}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded Content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="border-t border-[#2a2a2d]"
                                                >
                                                    <div className="p-6 space-y-4">
                                                        {group.items.map((item) => {
                                                            const output = item.aiOutput || {};
                                                            const contentKeys = Object.keys(output).filter(k => !['name', 'data'].includes(k));

                                                            // Handle slide 99 (all content types)
                                                            if (group.slideId === 99) {
                                                                return (
                                                                    <div key={item.id} className="space-y-3">
                                                                        {Object.entries(output).map(([contentKey, contentData]) => {
                                                                            const contentId = `${item.id}-${contentKey}`;
                                                                            const isContentExpanded = expandedContent.has(contentId);
                                                                            const contentName = CONTENT_NAMES[contentKey] || contentData.name || `Content ${contentKey}`;

                                                                            return (
                                                                                <div
                                                                                    key={contentKey}
                                                                                    className="bg-[#0e0e0f] rounded-xl border border-[#2a2a2d] overflow-hidden"
                                                                                >
                                                                                    {/* Content Type Header */}
                                                                                    <button
                                                                                        onClick={() => toggleContent(contentId)}
                                                                                        className="w-full flex items-center justify-between p-4 hover:bg-[#1b1b1d] transition-colors"
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <FileText className="w-5 h-5 text-cyan" />
                                                                                            <span className="font-medium">{contentName}</span>
                                                                                        </div>
                                                                                        {isContentExpanded ? (
                                                                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                                                                        ) : (
                                                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                                                        )}
                                                                                    </button>

                                                                                    {/* Content Data */}
                                                                                    <AnimatePresence>
                                                                                        {isContentExpanded && (
                                                                                            <motion.div
                                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                                transition={{ duration: 0.2 }}
                                                                                                className="border-t border-[#2a2a2d] p-4 max-h-96 overflow-y-auto"
                                                                                            >
                                                                                                {renderContentValue(contentData.data || contentData)}
                                                                                            </motion.div>
                                                                                        )}
                                                                                    </AnimatePresence>
                                                                                </div>
                                                                            );
                                                                        })}

                                                                        {/* Approval Buttons */}
                                                                        <div className="flex items-center justify-end gap-3 pt-2">
                                                                            {item.approved ? (
                                                                                <>
                                                                                    <span className="flex items-center gap-2 text-green-400 text-sm">
                                                                                        <CheckCircle className="w-4 h-4" />
                                                                                        Approved
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() => handleReject(item.id)}
                                                                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                                                                                    >
                                                                                        <XCircle className="w-4 h-4" />
                                                                                        Mark Pending
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleApprove(item.id)}
                                                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors text-sm font-medium"
                                                                                >
                                                                                    <Check className="w-4 h-4" />
                                                                                    Approve All
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Handle individual step content
                                                            return (
                                                                <div key={item.id} className="bg-[#0e0e0f] rounded-xl p-4 border border-[#2a2a2d]">
                                                                    <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                                                                        {renderContentValue(output)}
                                                                    </div>
                                                                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2a2a2d]">
                                                                        {item.approved ? (
                                                                            <>
                                                                                <span className="flex items-center gap-2 text-green-400 text-sm">
                                                                                    <CheckCircle className="w-4 h-4" />
                                                                                    Approved
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => handleReject(item.id)}
                                                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                                                                                >
                                                                                    <XCircle className="w-4 h-4" />
                                                                                    Mark Pending
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleApprove(item.id)}
                                                                                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors text-sm font-medium"
                                                                            >
                                                                                <Check className="w-4 h-4" />
                                                                                Approve
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
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
