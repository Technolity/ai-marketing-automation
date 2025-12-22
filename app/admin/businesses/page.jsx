"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    MoreHorizontal,
    Building2,
    ArrowUpDown,
    Globe,
    User,
    Loader2,
    RefreshCw,
    X,
    Download,
    Trash2,
    Edit,
    FileText
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminBusinesses() {
    const { session, loading: authLoading } = useAuth();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    // View details modal
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);

    // Actions menu
    const [menuOpen, setMenuOpen] = useState(null);

    useEffect(() => {
        if (!authLoading && session) {
            fetchBusinesses();
        }
    }, [authLoading, session, pagination.page, globalFilter]);

    const fetchBusinesses = async () => {
        if (!session) return;

        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: globalFilter
            });

            const response = await fetchWithAuth(`/api/admin/businesses?${params}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed to fetch businesses');

            const data = await response.json();
            setBusinesses(data.businesses || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0
            }));
        } catch (err) {
            console.error('Error fetching businesses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (business) => {
        setSelectedBusiness(business);
        setViewModalOpen(true);
    };

    const handleExportSession = (business) => {
        const dataStr = JSON.stringify(business, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${business.session_name.replace(/[^a-z0-9]/gi, '_')}_export.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteSession = async (businessId) => {
        if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;

        try {
            const response = await fetchWithAuth(`/api/admin/businesses/${businessId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete session');

            fetchBusinesses(); // Refresh list
        } catch (err) {
            console.error('Error deleting session:', err);
            alert('Failed to delete session');
        }
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "session_name",
                header: ({ column }) => (
                    <button
                        className="flex items-center gap-2 hover:text-cyan transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Business/Session Name
                        <ArrowUpDown className="w-4 h-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-blue-500/20 flex items-center justify-center border border-[#2a2a2d]">
                            <Building2 className="w-5 h-5 text-cyan" />
                        </div>
                        <span className="font-medium">{row.original.session_name || 'Untitled Session'}</span>
                    </div>
                ),
            },
            {
                accessorKey: "industry",
                header: "Industry",
                cell: ({ row }) => (
                    <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit bg-cyan/20 text-cyan">
                        <Globe className="w-3 h-3" />
                        {row.original.industry || 'Not specified'}
                    </span>
                ),
            },
            {
                accessorKey: "user_name",
                header: "Owner",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-white">
                            <User className="w-4 h-4" />
                            {row.original.user_name || 'No Name'}
                        </div>
                        <span className="text-xs text-gray-500">{row.original.user_email}</span>
                    </div>
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
                header: "",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => handleViewDetails(row.original)}
                            className="p-2 hover:bg-cyan/10 rounded-lg transition-colors group"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(menuOpen === row.original.id ? null : row.original.id)}
                                className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                                title="More Actions"
                            >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </button>
                            {menuOpen === row.original.id && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setMenuOpen(null)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg shadow-xl z-50">
                                        <button
                                            onClick={() => {
                                                handleViewDetails(row.original);
                                                setMenuOpen(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2a2d] transition-colors flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View Full Details
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleExportSession(row.original);
                                                setMenuOpen(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2a2d] transition-colors flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Export JSON
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.open(`/funnel_copy?sessionId=${row.original.id}`, '_blank');
                                                setMenuOpen(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2a2d] transition-colors flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            View Content
                                        </button>
                                        <div className="border-t border-[#2a2a2d] my-1" />
                                        <button
                                            onClick={() => {
                                                handleDeleteSession(row.original.id);
                                                setMenuOpen(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Session
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: businesses,
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
                        <h1 className="text-3xl font-bold mb-2">Businesses</h1>
                        <p className="text-gray-400">View and manage all registered businesses from user sessions.</p>
                    </div>
                    <button
                        onClick={fetchBusinesses}
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
                        placeholder="Search businesses by name, industry, or owner..."
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
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
                                                    No businesses found
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
                                    Total: {pagination.total} businesses
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

                {/* View Details Modal */}
                {viewModalOpen && selectedBusiness && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-[#2a2a2d] flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">{selectedBusiness.session_name}</h2>
                                    <p className="text-gray-400 text-sm">Session ID: {selectedBusiness.id}</p>
                                </div>
                                <button
                                    onClick={() => setViewModalOpen(false)}
                                    className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Industry</label>
                                            <p className="text-white font-medium">{selectedBusiness.industry}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Status</label>
                                            <p className="text-white font-medium">{selectedBusiness.status}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Owner</label>
                                            <p className="text-white font-medium">{selectedBusiness.user_name}</p>
                                            <p className="text-gray-500 text-sm">{selectedBusiness.user_email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Steps Completed</label>
                                            <p className="text-white font-medium">{selectedBusiness.stepsCompleted} / 20</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Created</label>
                                            <p className="text-white font-medium">
                                                {new Date(selectedBusiness.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-1 block">Last Updated</label>
                                            <p className="text-white font-medium">
                                                {new Date(selectedBusiness.updated_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Questionnaire Answers */}
                                    {selectedBusiness.results_data?.answers && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-cyan" />
                                                Questionnaire Answers
                                            </h3>
                                            <div className="bg-[#0e0e0f] rounded-xl p-4 border border-[#2a2a2d] max-h-96 overflow-y-auto">
                                                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                                    {JSON.stringify(selectedBusiness.results_data.answers, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Generated Content Summary */}
                                    {selectedBusiness.results_data?.content && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Generated Content</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.keys(selectedBusiness.results_data.content).map((key) => (
                                                    <div
                                                        key={key}
                                                        className="p-3 bg-[#0e0e0f] rounded-lg border border-[#2a2a2d]"
                                                    >
                                                        <p className="text-sm text-cyan font-medium mb-1">{key}</p>
                                                        <p className="text-xs text-gray-400">Content generated</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-[#2a2a2d] flex gap-3">
                                <button
                                    onClick={() => handleExportSession(selectedBusiness)}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export JSON
                                </button>
                                <button
                                    onClick={() => window.open(`/funnel_copy?sessionId=${selectedBusiness.id}`, '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    View Content Page
                                </button>
                                <button
                                    onClick={() => setViewModalOpen(false)}
                                    className="ml-auto px-4 py-2 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
