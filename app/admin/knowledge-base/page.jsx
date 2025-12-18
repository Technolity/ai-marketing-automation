"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
    Plus,
    ArrowUpDown,
    FileText,
    Calendar,
    Loader2,
    Database,
    AlertCircle
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminKnowledgeBase() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transcripts, setTranscripts] = useState([]);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && session) {
            fetchKnowledgeBase();
        } else if (!authLoading && !session) {
            setLoading(false);
            setError("Not authenticated");
        }
    }, [authLoading, session]);

    const fetchKnowledgeBase = async () => {
        try {
            setLoading(true);

            // Fetch transcripts (knowledge base source)
            const transcriptsResponse = await fetch('/api/admin/transcripts?limit=100', {
                credentials: 'include'
            });

            if (!transcriptsResponse.ok) {
                throw new Error('Failed to fetch knowledge base');
            }

            const transcriptsData = await transcriptsResponse.json();
            setTranscripts(transcriptsData.transcripts || []);

            // Fetch RAG stats
            const statsResponse = await fetch('/api/admin/transcripts/stats', {
                credentials: 'include'
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.stats);
            }

            setError(null);
        } catch (err) {
            console.error('Error fetching knowledge base:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Transform transcripts into knowledge base format
    const knowledgeData = useMemo(() => {
        return transcripts.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || 'No description',
            sourceType: t.source_type,
            contentType: t.content_types?.[0] || 'General',
            tags: t.tags || [],
            updatedAt: new Date(t.updated_at).toLocaleDateString(),
            chunks: t.total_chunks || 0,
            status: t.status
        }));
    }, [transcripts]);

    const columns = useMemo(
        () => [
            {
                accessorKey: "title",
                header: ({ column }) => (
                    <button
                        className="flex items-center gap-2 hover:text-cyan transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Title
                        <ArrowUpDown className="w-4 h-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-purple-500/20 flex items-center justify-center border border-[#2a2a2d]">
                            <FileText className="w-5 h-5 text-cyan" />
                        </div>
                        <div>
                            <div className="font-medium">{row.original.title}</div>
                            <div className="text-sm text-gray-400 truncate max-w-md">
                                {row.original.description}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "sourceType",
                header: "Source",
                cell: ({ row }) => {
                    const sourceColors = {
                        youtube: "bg-red-500/20 text-red-400",
                        manual: "bg-blue-500/20 text-blue-400",
                        document: "bg-purple-500/20 text-purple-400"
                    };
                    return (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${sourceColors[row.original.sourceType] || "bg-gray-500/20 text-gray-400"}`}>
                            {row.original.sourceType}
                        </span>
                    );
                },
            },
            {
                accessorKey: "contentType",
                header: "Type",
                cell: ({ row }) => (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan/20 text-cyan">
                        {row.original.contentType}
                    </span>
                ),
            },
            {
                accessorKey: "chunks",
                header: "Chunks",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-medium">{row.original.chunks}</span>
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const statusColors = {
                        pending: "bg-gray-500/20 text-gray-400",
                        processing: "bg-cyan/20 text-cyan",
                        completed: "bg-green-500/20 text-green-400",
                        failed: "bg-red-500/20 text-red-400"
                    };
                    return (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[row.original.status] || "bg-gray-500/20 text-gray-400"}`}>
                            {row.original.status}
                        </span>
                    );
                },
            },
            {
                accessorKey: "updatedAt",
                header: "Updated",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {row.original.updatedAt}
                    </div>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <button
                        onClick={() => router.push(`/admin/transcripts/${row.original.id}`)}
                        className="px-3 py-1 bg-cyan/10 hover:bg-cyan/20 text-cyan rounded-lg text-sm font-medium transition-colors"
                    >
                        View Details
                    </button>
                ),
            },
        ],
        [router]
    );

    const table = useReactTable({
        data: knowledgeData,
        columns,
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 text-cyan animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-white text-lg">{error}</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8 min-h-screen">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-white">
                            Knowledge Base
                        </h1>
                        <button
                            onClick={() => router.push('/admin/transcripts/add')}
                            className="px-4 py-2 bg-cyan text-black rounded-lg hover:bg-cyan/90 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Content
                        </button>
                    </div>
                    <p className="text-gray-400">
                        Ted McGrath's knowledge base powered by RAG (Retrieval Augmented Generation)
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
                        >
                            <div className="text-gray-400 text-sm mb-2">Total Transcripts</div>
                            <div className="text-3xl font-bold text-white">{stats.transcripts?.total || 0}</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
                        >
                            <div className="text-gray-400 text-sm mb-2">Total Chunks</div>
                            <div className="text-3xl font-bold text-cyan">{stats.chunks?.total || 0}</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
                        >
                            <div className="text-gray-400 text-sm mb-2">Completed</div>
                            <div className="text-3xl font-bold text-green-500">{stats.transcripts?.completed || 0}</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
                        >
                            <div className="text-gray-400 text-sm mb-2">Avg. Chunks/Transcript</div>
                            <div className="text-3xl font-bold text-white">{stats.chunks?.average_per_transcript || 0}</div>
                        </motion.div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search knowledge base..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#1a1a1c] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-500 focus:border-cyan focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg overflow-hidden">
                    {knowledgeData.length === 0 ? (
                        <div className="text-center py-16">
                            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Knowledge Base Content</h3>
                            <p className="text-gray-400 mb-6">
                                Add Ted McGrath's transcripts to power AI-generated content
                            </p>
                            <button
                                onClick={() => router.push('/admin/transcripts/add')}
                                className="px-6 py-3 bg-cyan text-black rounded-lg hover:bg-cyan/90 transition-colors inline-flex items-center gap-2 font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Add First Transcript
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#1a1a1c] border-b border-[#2a2a2d]">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th
                                                        key={header.id}
                                                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                                                    >
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a2d]">
                                        {table.getRowModel().rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-white"
                                                    >
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-[#2a2a2d] flex items-center justify-between bg-[#1a1a1c]">
                                <div className="text-sm text-gray-400">
                                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                                    {Math.min(
                                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                        knowledgeData.length
                                    )}{" "}
                                    of {knowledgeData.length} results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="px-4 py-2 bg-[#2a2a2d] hover:bg-[#3a3a3d] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-400">
                                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                                    </span>
                                    <button
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="px-4 py-2 bg-[#2a2a2d] hover:bg-[#3a3a3d] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Next
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
