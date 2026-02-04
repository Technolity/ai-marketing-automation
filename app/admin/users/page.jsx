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
    MoreHorizontal,
    Eye,
    ArrowUpDown,
    User,
    Loader2,
    RefreshCw,
    FolderKanban
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import EditableCell from "@/components/admin/EditableCell";

const tierColors = {
    starter: "bg-gray-500/20 text-gray-400",
    growth: "bg-cyan/20 text-cyan",
    scale: "bg-purple-500/20 text-purple-400",
};

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

            console.log(`✓ Updated ${field} for user ${userId}:`, value);
            return data;

        } catch (error) {
            console.error(`Error updating ${field}:`, error);
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
                        <button
                            onClick={() => handleViewFunnels(row.original.id)}
                            className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors group"
                            title="View user's funnels"
                        >
                            <FolderKanban className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                        </button>
                        <button className="p-2 hover:bg-cyan/10 rounded-lg transition-colors group">
                            <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan" />
                        </button>
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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Users</h1>
                        <p className="text-gray-400">Manage all registered users and their subscriptions.</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Tier Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d]">
                        <p className="text-gray-400 text-sm">Starter</p>
                        <p className="text-2xl font-bold text-gray-400">{tierStats.starter || 0}</p>
                    </div>
                    <div className="bg-[#1b1b1d] rounded-xl p-4 border border-cyan/20">
                        <p className="text-gray-400 text-sm">Growth</p>
                        <p className="text-2xl font-bold text-cyan">{tierStats.growth || 0}</p>
                    </div>
                    <div className="bg-[#1b1b1d] rounded-xl p-4 border border-purple-500/20">
                        <p className="text-gray-400 text-sm">Scale</p>
                        <p className="text-2xl font-bold text-purple-400">{tierStats.scale || 0}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
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
                                                    No users found
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
                                    Total: {pagination.total} users
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
            </div>
        </AdminLayout>
    );
}
