"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useSearchParams, useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    RotateCcw,
    Trash2,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    Eye,
    ArrowLeft,
    FolderKanban,
    X,
    Sparkles,
    XCircle,
    TrendingUp
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const statusColors = {
    not_started: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

// Toast notification component
function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : type === 'error'
                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                        : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                }`}
        >
            {type === 'success' && <CheckCircle className="w-5 h-5" />}
            {type === 'error' && <XCircle className="w-5 h-5" />}
            <p className="font-medium">{message}</p>
            <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
                <XCircle className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

const statusIcons = {
    not_started: AlertCircle,
    pending: PlayCircle,
    in_progress: Loader2,
    completed: CheckCircle,
    failed: AlertCircle,
};

export default function AdminFunnels() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filterUserId = searchParams.get('userId');

    const { session, loading: authLoading } = useAuth();
    const [funnels, setFunnels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [statusStats, setStatusStats] = useState({});
    const [selectedFunnel, setSelectedFunnel] = useState(null);
    const [showVaultModal, setShowVaultModal] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!authLoading && session) {
            fetchFunnels();
        }
    }, [authLoading, session, pagination.page, statusFilter, filterUserId]);

    const fetchFunnels = async () => {
        if (!session) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (filterUserId) params.append('userId', filterUserId);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetchWithAuth(`/api/admin/funnels?${params}`);

            if (!response.ok) throw new Error('Failed to fetch funnels');

            const data = await response.json();
            setFunnels(data.funnels || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0
            }));
            setStatusStats(data.statusStats || {});
        } catch (err) {
            console.error('Error fetching funnels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFunnelAction = async (funnelId, action) => {
        try {
            const response = await fetchWithAuth('/api/admin/funnels', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelId, action })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to perform action');
            }

            const actionLabels = {
                reset_status: 'Funnel status reset',
                delete: 'Funnel deleted',
                retry_generation: 'Generation retry initiated',
                force_complete: 'Funnel marked as complete'
            };

            setToast({ message: actionLabels[action] || 'Action completed successfully!', type: 'success' });
            console.log(`✓ Action '${action}' completed for funnel ${funnelId}`);

            // Refresh funnels list
            fetchFunnels();
        } catch (error) {
            console.error(`Error performing action ${action}:`, error);
            setToast({ message: `Failed: ${error.message}`, type: 'error' });
        }
    };

    const handleViewVault = (funnel) => {
        setSelectedFunnel(funnel);
        setShowVaultModal(true);
    };

    const filteredFunnels = useMemo(() => {
        if (!searchQuery) return funnels;
        return funnels.filter(funnel =>
            funnel.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            funnel.user_profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            funnel.user_profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [funnels, searchQuery]);

    const columns = useMemo(
        () => [
            {
                accessorKey: "business_name",
                header: "Business Name",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium text-white">
                            {row.original.business_name || 'Unnamed Funnel'}
                        </div>
                        <div className="text-xs text-gray-500">
                            ID: {row.original.id.substring(0, 8)}...
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "user_profiles",
                header: "User",
                cell: ({ row }) => (
                    <div>
                        <div className="text-white">
                            {row.original.user_profiles?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {row.original.user_profiles?.email}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "vault_generation_status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.original.vault_generation_status || 'not_started';
                    const StatusIcon = statusIcons[status];
                    return (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize inline-flex items-center gap-1.5 ${statusColors[status]}`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
                            {status.replace('_', ' ')}
                        </span>
                    );
                },
            },
            {
                accessorKey: "vault_items_count",
                header: "Vault Items",
                cell: ({ row }) => (
                    <span className="text-gray-400">
                        {row.original.vault_items_count || 0} items
                    </span>
                ),
            },
            {
                accessorKey: "created_at",
                header: "Created",
                cell: ({ row }) => (
                    <span className="text-gray-400">
                        {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        }) : 'N/A'}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewVault(row.original)}
                            className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all group border border-transparent hover:border-cyan/30"
                            title="View vault content"
                        >
                            <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan transition-colors" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleFunnelAction(row.original.id, 'reset_status')}
                            className="p-2.5 hover:bg-blue-500/20 rounded-xl transition-all group border border-transparent hover:border-blue-500/30"
                            title="Reset to not started"
                        >
                            <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </motion.button>

                        {row.original.vault_generation_status === 'failed' && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleFunnelAction(row.original.id, 'retry_generation')}
                                className="p-2.5 hover:bg-yellow-500/20 rounded-xl transition-all group border border-transparent hover:border-yellow-500/30"
                                title="Retry generation"
                            >
                                <PlayCircle className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                if (confirm(`Are you sure you want to delete the funnel "${row.original.business_name}"? This action cannot be undone.`)) {
                                    handleFunnelAction(row.original.id, 'delete');
                                }
                            }}
                            className="p-2.5 hover:bg-red-500/20 rounded-xl transition-all group border border-transparent hover:border-red-500/30"
                            title="Delete funnel"
                        >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                        </motion.button>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: filteredFunnels,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
    });

    return (
        <AdminLayout>
            {/* Toast Notifications */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        {filterUserId && (
                            <motion.button
                                whileHover={{ scale: 1.05, x: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/admin/users')}
                                className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all border border-transparent hover:border-cyan/30"
                            >
                                <ArrowLeft className="w-5 h-5 text-cyan" />
                            </motion.button>
                        )}
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 via-cyan/20 to-purple-500/30 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/20"
                        >
                            <FolderKanban className="w-7 h-7 text-purple-400" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                                {filterUserId ? 'User Funnels' : 'Funnel Management'}
                            </h1>
                            <p className="text-gray-400 text-sm sm:text-base mt-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                Monitor and manage funnel generation
                            </p>
                        </div>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchFunnels}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-cyan/20 hover:from-purple-500/30 hover:to-cyan/30 rounded-xl transition-all border border-purple-500/30 shadow-lg shadow-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="font-medium text-white">Refresh</span>
                    </motion.button>
                </motion.div>

                {/* Status Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(statusStats).map(([status, count], idx) => {
                        const gradients = {
                            not_started: 'from-gray-500/10 to-gray-500/5',
                            pending: 'from-yellow-500/10 to-yellow-500/5',
                            in_progress: 'from-blue-500/10 to-cyan/5',
                            completed: 'from-emerald-500/10 to-green-500/5',
                            failed: 'from-red-500/10 to-red-500/5'
                        };
                        return (
                            <motion.button
                                key={status}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                                className={`bg-gradient-to-br ${gradients[status]} rounded-2xl p-5 border transition-all shadow-lg ${statusFilter === status
                                        ? 'border-cyan/50 shadow-cyan/20 ring-2 ring-cyan/30'
                                        : statusColors[status]?.split(' ')[2] || 'border-gray-500/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className={`text-sm font-semibold uppercase tracking-wide ${statusColors[status]?.split(' ')[1]}`}>
                                        {status.replace('_', ' ')}
                                    </p>
                                    <TrendingUp className={`w-4 h-4 ${statusColors[status]?.split(' ')[1]}`} />
                                </div>
                                <p className={`text-4xl font-bold ${statusColors[status]?.split(' ')[1]}`}>
                                    {count || 0}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">funnels</p>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                    <input
                        type="text"
                        placeholder="Search by business name, user name, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#0e0e0f] border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    />
                </motion.div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                            <p className="text-gray-400 text-lg font-medium">Loading funnels...</p>
                            <p className="text-gray-500 text-sm mt-1">Please wait</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <div className="max-h-[calc(100vh-550px)] overflow-y-auto custom-scrollbar">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-[#0e0e0f] to-[#1a1a1c] sticky top-0 z-10 border-b border-purple-500/20">
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map((header) => (
                                                        <th key={header.id} className="px-6 py-4 text-left text-xs font-bold text-purple-400 uppercase tracking-wider whitespace-nowrap">
                                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                        </th>
                                                    ))}
                                                </tr>
                                            ))}
                                        </thead>
                                        <tbody>
                                            {table.getRowModel().rows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={columns.length} className="px-6 py-16 text-center">
                                                        <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                                        <p className="text-gray-400 text-lg font-medium">No funnels found</p>
                                                        <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                table.getRowModel().rows.map((row, idx) => (
                                                    <motion.tr
                                                        key={row.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.02 }}
                                                        className="border-b border-purple-500/5 hover:bg-[#0e0e0f]/50 transition-all"
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <td key={cell.id} className="px-6 py-4">
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </td>
                                                        ))}
                                                    </motion.tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a2d]">
                                <p className="text-sm text-gray-400">
                                    Total: {pagination.total} funnels
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
                </motion.div>

                {/* Vault Content Modal */}
                {showVaultModal && selectedFunnel && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-[#2a2a2d] flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Vault Content</h2>
                                    <p className="text-gray-400 text-sm">{selectedFunnel.business_name}</p>
                                </div>
                                <button
                                    onClick={() => setShowVaultModal(false)}
                                    className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {selectedFunnel.vault_items?.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedFunnel.vault_items.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="bg-[#0e0e0f] rounded-lg p-4 border border-[#2a2a2d]"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-cyan">{item.phase_name}</h3>
                                                    <span className={`px-2 py-1 rounded text-xs ${statusColors[item.status]}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Created: {new Date(item.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                        <p className="text-gray-400">No vault content generated yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
