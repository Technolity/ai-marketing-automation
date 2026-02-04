"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    MoreHorizontal,
    Eye,
    ArrowUpDown,
    User,
    Loader2,
    RefreshCw,
    FolderKanban,
    Sparkles,
    CheckCircle,
    XCircle,
    Users,
    TrendingUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import EditableCell from "@/components/admin/EditableCell";

const tierColors = {
    starter: "bg-green-500/20 text-green-400 border-green-500/30",
    growth: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    scale: "bg-purple-500/20 text-purple-400 border-purple-500/30",
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
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${
                type === 'success'
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

export default function AdminUsers() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [tierStats, setTierStats] = useState({ starter: 0, growth: 0, scale: 0 });
    const [savingFields, setSavingFields] = useState({});
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!authLoading && session) {
            fetchUsers();
        }
    }, [authLoading, session, pagination.page, globalFilter]);

    const fetchUsers = async () => {
        if (!session) return;

        setLoading(true);
        try {
            // Use AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: globalFilter
            });

            const response = await fetchWithAuth(`/api/admin/users?${params}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data.users || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0
            }));
            setTierStats(data.tierStats || {});
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle field updates via inline editing
    const handleFieldUpdate = async (field, value, userId) => {
        setSavingFields(prev => ({ ...prev, [`${userId}-${field}`]: true }));

        try {
            const response = await fetchWithAuth('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'update_field',
                    field,
                    value
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update field');
            }

            const data = await response.json();

            // Optimistic update: update local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, [field]: value } : user
            ));

            setToast({ message: `Updated ${field} successfully!`, type: 'success' });
            console.log(`✓ Updated ${field} for user ${userId}:`, value);
            return data;

        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setToast({ message: `Failed to update: ${error.message}`, type: 'error' });
            throw error;
        } finally {
            setSavingFields(prev => {
                const newState = { ...prev };
                delete newState[`${userId}-${field}`];
                return newState;
            });
        }
    };

    const handleViewFunnels = (userId) => {
        router.push(`/admin/funnels?userId=${userId}`);
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "full_name",
                header: ({ column }) => (
                    <button
                        className="flex items-center gap-2 hover:text-cyan transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown className="w-4 h-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan/20 to-purple-500/20 flex items-center justify-center border border-[#2a2a2d]">
                            <User className="w-5 h-5 text-cyan" />
                        </div>
                        <span className="font-medium">{row.original.full_name || 'No Name'}</span>
                    </div>
                ),
            },
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ row }) => (
                    <span className="text-gray-400">{row.original.email}</span>
                ),
            },
            {
                accessorKey: "subscription_tier",
                header: "Tier",
                cell: ({ row }) => (
                    <EditableCell
                        value={row.original.subscription_tier || 'starter'}
                        type="select"
                        field="subscription_tier"
                        userId={row.original.id}
                        onSave={handleFieldUpdate}
                        validation={{ required: true }}
                    />
                ),
            },
            {
                accessorKey: "max_funnels",
                header: "Max Funnels",
                cell: ({ row }) => (
                    <EditableCell
                        value={row.original.max_funnels}
                        type="number"
                        field="max_funnels"
                        userId={row.original.id}
                        onSave={handleFieldUpdate}
                        validation={{
                            required: true,
                            min: 0,
                            max: 1000,
                            integer: true
                        }}
                        displayFormatter={(val) => val !== null && val !== undefined ? val : 'Unlimited'}
                    />
                ),
            },
            {
                accessorKey: "current_funnel_count",
                header: "Funnels",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                            {row.original.current_funnel_count || 0}
                        </span>
                        {row.original.max_funnels && (
                            <span className="text-xs text-gray-500">
                                / {row.original.max_funnels}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "is_admin",
                header: "Role",
                cell: ({ row }) => (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.original.is_admin ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {row.original.is_admin ? 'Admin' : 'User'}
                    </span>
                ),
            },
            {
                accessorKey: "created_at",
                header: "Joined",
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
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewFunnels(row.original.id)}
                            className="p-2.5 hover:bg-purple-500/20 rounded-xl transition-all group border border-transparent hover:border-purple-500/30"
                            title="View user's funnels"
                        >
                            <FolderKanban className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all group border border-transparent hover:border-cyan/30"
                            title="View details"
                        >
                            <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan transition-colors" />
                        </motion.button>
                    </div>
                ),
            },
        ],
        [handleFieldUpdate, handleViewFunnels]
    );

    const table = useReactTable({
        data: users,
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
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan/30 via-purple-500/20 to-cyan/30 flex items-center justify-center border border-cyan/30 shadow-lg shadow-cyan/20"
                        >
                            <Users className="w-7 h-7 text-cyan" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                                User Management
                            </h1>
                            <p className="text-gray-400 text-sm sm:text-base mt-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan" />
                                Manage users and subscriptions
                            </p>
                        </div>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchUsers}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan/20 to-purple-500/20 hover:from-cyan/30 hover:to-purple-500/30 rounded-xl transition-all border border-cyan/30 shadow-lg shadow-cyan/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 text-cyan ${loading ? 'animate-spin' : ''}`} />
                        <span className="font-medium text-white">Refresh</span>
                    </motion.button>
                </motion.div>

                {/* Tier Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl p-6 border border-green-500/30 shadow-lg shadow-green-500/5"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-green-400 text-sm font-semibold uppercase tracking-wide">Starter</p>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <p className="text-4xl font-bold text-green-400">{tierStats.starter || 0}</p>
                        <p className="text-gray-400 text-xs mt-1">Active users</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-gradient-to-br from-blue-500/10 to-cyan/5 rounded-2xl p-6 border border-blue-500/30 shadow-lg shadow-blue-500/5"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wide">Growth</p>
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-4xl font-bold text-blue-400">{tierStats.growth || 0}</p>
                        <p className="text-gray-400 text-xs mt-1">Active users</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-6 border border-purple-500/30 shadow-lg shadow-purple-500/5"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-purple-400 text-sm font-semibold uppercase tracking-wide">Scale</p>
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-4xl font-bold text-purple-400">{tierStats.scale || 0}</p>
                        <p className="text-gray-400 text-xs mt-1">Active users</p>
                    </motion.div>
                </div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan/50" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#0e0e0f] border border-cyan/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all"
                    />
                </motion.div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-cyan/20 overflow-hidden shadow-xl"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <Loader2 className="w-12 h-12 text-cyan animate-spin mb-4" />
                            <p className="text-gray-400 text-lg font-medium">Loading users...</p>
                            <p className="text-gray-500 text-sm mt-1">Please wait</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <div className="max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-[#0e0e0f] to-[#1a1a1c] sticky top-0 z-10 border-b border-cyan/20">
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map((header) => (
                                                        <th key={header.id} className="px-6 py-4 text-left text-xs font-bold text-cyan uppercase tracking-wider whitespace-nowrap">
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
                                                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                                        <p className="text-gray-400 text-lg font-medium">No users found</p>
                                                        <p className="text-gray-500 text-sm mt-2">Try adjusting your search query</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                table.getRowModel().rows.map((row, idx) => (
                                                    <motion.tr
                                                        key={row.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.02 }}
                                                        className="border-b border-cyan/5 hover:bg-[#0e0e0f]/50 transition-all"
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
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-cyan/10 bg-[#0e0e0f]/50">
                                <p className="text-sm font-medium">
                                    <span className="text-gray-400">Total:</span>{' '}
                                    <span className="text-cyan">{pagination.total}</span>{' '}
                                    <span className="text-gray-400">users</span>
                                </p>
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        disabled={pagination.page <= 1}
                                        className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-cyan/30"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-cyan" />
                                    </motion.button>
                                    <div className="px-4 py-2 bg-cyan/10 border border-cyan/30 rounded-xl">
                                        <span className="text-sm font-semibold text-white">
                                            Page {pagination.page} of {pagination.totalPages || 1}
                                        </span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-cyan/30"
                                    >
                                        <ChevronRight className="w-5 h-5 text-cyan" />
                                    </motion.button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
}
