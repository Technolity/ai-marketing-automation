"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Building2,
    ExternalLink,
    RotateCcw,
    Loader2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

const statusColors = {
    synced: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    permanently_failed: "bg-red-500/20 text-red-400 border-red-500/30",
    not_synced: "bg-gray-500/20 text-gray-400 border-gray-500/30"
};

const statusIcons = {
    synced: CheckCircle,
    pending: Clock,
    failed: AlertTriangle,
    permanently_failed: XCircle,
    not_synced: Building2
};

export default function AdminGHLAccounts() {
    const { session, loading: authLoading } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [stats, setStats] = useState({ synced: 0, pending: 0, failed: 0, permanently_failed: 0, total: 0 });
    const [isRetrying, setIsRetrying] = useState(null); // userId being retried

    useEffect(() => {
        if (!authLoading && session) {
            fetchAccounts();
        }
    }, [authLoading, session, pagination.page, globalFilter]);

    const fetchAccounts = async () => {
        if (!session) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: globalFilter
            });

            const response = await fetchWithAuth(`/api/admin/ghl-accounts?${params}`);

            if (!response.ok) throw new Error('Failed to fetch accounts');

            const data = await response.json();
            setAccounts(data.accounts || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0
            }));
            setStats(data.stats || {});
        } catch (err) {
            console.error('Error fetching accounts:', err);
            toast.error("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (userId) => {
        if (isRetrying) return;
        setIsRetrying(userId);

        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/retry', {
                method: 'POST',
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Retry failed');
            }

            const result = await response.json();
            toast.success("Retry initiated successfully!");

            // Refresh list to show updated status
            fetchAccounts();
        } catch (err) {
            console.error('Retry error:', err);
            toast.error(err.message || "Failed to retry creation");
        } finally {
            setIsRetrying(null);
        }
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "full_name",
                header: "User",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-white">{row.original.full_name || 'No Name'}</span>
                        <span className="text-sm text-gray-500">{row.original.email}</span>
                        {row.original.business_name && (
                            <span className="text-xs text-cyan mt-0.5">{row.original.business_name}</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "ghl_location_id",
                header: "GHL Location",
                cell: ({ row }) => {
                    const locationId = row.original.ghl_location_id;
                    if (!locationId) return <span className="text-gray-600 italic">No Location ID</span>;

                    return (
                        <a
                            href={`https://app.gohighlevel.com/location/${locationId}/dashboard`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#2a2a2d] hover:bg-[#3a3a3d] transition-colors text-sm font-mono text-gray-300 hover:text-white w-fit"
                        >
                            <span>{locationId}</span>
                            <ExternalLink className="w-3 h-3 text-cyan" />
                        </a>
                    );
                },
            },
            {
                accessorKey: "ghl_sync_status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.original.ghl_sync_status || 'not_synced';
                    const StatusIcon = statusIcons[status] || Building2;

                    return (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "retry_info",
                header: "Retries",
                cell: ({ row }) => {
                    const { ghl_retry_count, ghl_next_retry_at, ghl_sync_status } = row.original;

                    if (ghl_sync_status === 'synced') return <span className="text-gray-600">-</span>;

                    return (
                        <div className="flex flex-col gap-1 text-xs">
                            {ghl_retry_count > 0 && (
                                <span className="text-gray-400">Attempts: {ghl_retry_count}/5</span>
                            )}
                            {ghl_next_retry_at && new Date(ghl_next_retry_at) > new Date() && (
                                <span className="text-cyan">
                                    Next: {new Date(ghl_next_retry_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    );
                }
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => {
                    const status = row.original.ghl_sync_status;
                    const canRetry = ['failed', 'permanently_failed', 'pending'].includes(status);

                    if (!canRetry) return null;

                    return (
                        <button
                            onClick={() => handleRetry(row.original.id)}
                            disabled={isRetrying === row.original.id}
                            className="p-2 hover:bg-cyan/10 text-cyan rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Retry Creation"
                        >
                            <RotateCcw className={`w-4 h-4 ${isRetrying === row.original.id ? 'animate-spin' : ''}`} />
                        </button>
                    );
                },
            },
        ],
        [isRetrying]
    );

    const table = useReactTable({
        data: accounts,
        columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">GHL Sub-Accounts</h1>
                        <p className="text-gray-400">Monitor and manage automated sub-account creation.</p>
                    </div>
                    <button
                        onClick={fetchAccounts}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg transition-colors border border-[#2a2a2d]"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Status Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1b1b1d] rounded-xl p-4 border border-green-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Synced
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.synced || 0}</p>
                        </div>
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-[#1b1b1d] rounded-xl p-4 border border-orange-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-orange-400 text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Failed
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.failed || 0}</p>
                        </div>
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <AlertTriangle className="w-16 h-16 text-orange-500" />
                        </div>
                    </div>
                    <div className="bg-[#1b1b1d] rounded-xl p-4 border border-yellow-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-yellow-400 text-sm font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Pending
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.pending || 0}</p>
                        </div>
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <Clock className="w-16 h-16 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d] relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Total
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.total || 0}</p>
                        </div>
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <Building2 className="w-16 h-16 text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user, email, or location ID..."
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
                    />
                </div>

                {/* Table */}
                <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden">
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
                                            <tr key={headerGroup.id} className="border-b border-[#2a2a2d] bg-[#131314]">
                                                {headerGroup.headers.map((header) => (
                                                    <th key={header.id} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a2d]">
                                        {table.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                                                    No accounts found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map((row) => (
                                                <tr key={row.id} className="hover:bg-[#202022] transition-colors">
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
                            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a2d] bg-[#131314]">
                                <p className="text-sm text-gray-400">
                                    {pagination.total > 0 ? (
                                        <>Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries</>
                                    ) : (
                                        'No entries'
                                    )}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        disabled={pagination.page <= 1}
                                        className="p-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-white font-medium px-2">
                                        Page {pagination.page} of {pagination.totalPages || 1}
                                    </span>
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="p-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
