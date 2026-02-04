"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
    X
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const statusColors = {
    not_started: "bg-gray-500/20 text-gray-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    in_progress: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
};

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

            console.log(`✓ Action '${action}' completed for funnel ${funnelId}`);

            // Refresh funnels list
            fetchFunnels();
        } catch (error) {
            console.error(`Error performing action ${action}:`, error);
            alert(`Failed to ${action}: ${error.message}`);
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
                        <button
                            onClick={() => handleViewVault(row.original)}
                            className="p-2 hover:bg-cyan/10 rounded-lg transition-colors group"
                            title="View vault content"
                        >
                            <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan" />
                        </button>

                        <button
                            onClick={() => handleFunnelAction(row.original.id, 'reset_status')}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group"
                            title="Reset to not started"
                        >
                            <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                        </button>

                        {row.original.vault_generation_status === 'failed' && (
                            <button
                                onClick={() => handleFunnelAction(row.original.id, 'retry_generation')}
                                className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors group"
                                title="Retry generation"
                            >
                                <PlayCircle className="w-4 h-4 text-gray-400 group-hover:text-yellow-400" />
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (confirm(`Are you sure you want to delete the funnel "${row.original.business_name}"? This action cannot be undone.`)) {
                                    handleFunnelAction(row.original.id, 'delete');
                                }
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                            title="Delete funnel"
                        >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                        </button>
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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {filterUserId && (
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                {filterUserId ? 'User Funnels' : 'All Funnels'}
                            </h1>
                            <p className="text-gray-400">
                                Manage and monitor funnel generation status
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchFunnels}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Status Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(statusStats).map(([status, count]) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                            className={`bg-[#1b1b1d] rounded-xl p-4 border transition-all ${
                                statusFilter === status ? 'border-cyan' : 'border-[#2a2a2d]'
                            }`}
                        >
                            <p className="text-gray-400 text-sm capitalize">{status.replace('_', ' ')}</p>
                            <p className={`text-2xl font-bold ${statusColors[status]?.split(' ')[1]}`}>
                                {count || 0}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by business name, user name, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
                    />
                </div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden"
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id} className="border-b border-[#2a2a2d]">
                                                {headerGroup.headers.map((header) => (
                                                    <th key={header.id} className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {table.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                                                    <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                                    <p>No funnels found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map((row) => (
                                                <tr key={row.id} className="border-b border-[#2a2a2d] hover:bg-[#0e0e0f] transition-colors">
                                                    {row.getVisibleCells().map((cell) => (
                                                        <td key={cell.id} className="px-6 py-4">
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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
