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

const T = {
    cardBg: "#0D1217",
    surface: "#121920",
    border: "#1E2A34",
    cyan: "#16C7E7",
    primary: "#F4F8FB",
    secondary: "#B2C0CD",
    muted: "#5a6a78",
    success: "#34d399",
    danger: "#f87171",
    purple: "#a78bfa",
};

const SOURCE_STYLE = {
    youtube: { background: "rgba(248,113,113,0.12)", color: "#f87171" },
    manual: { background: "rgba(96,165,250,0.12)", color: "#60a5fa" },
    document: { background: "rgba(167,139,250,0.12)", color: "#a78bfa" },
};

const STATUS_STYLE = {
    pending: { background: "rgba(90,106,120,0.12)", color: "#5a6a78" },
    processing: { background: "rgba(22,199,231,0.12)", color: "#16C7E7" },
    completed: { background: "rgba(52,211,153,0.12)", color: "#34d399" },
    failed: { background: "rgba(248,113,113,0.12)", color: "#f87171" },
};

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
            const transcriptsResponse = await fetch('/api/admin/transcripts?limit=100', { credentials: 'include' });
            if (!transcriptsResponse.ok) throw new Error('Failed to fetch knowledge base');
            const transcriptsData = await transcriptsResponse.json();
            setTranscripts(transcriptsData.transcripts || []);

            const statsResponse = await fetch('/api/admin/transcripts/stats', { credentials: 'include' });
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
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Title <ArrowUpDown style={{ width: 12, height: 12 }} />
                    </button>
                ),
                cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            backgroundColor: "rgba(22,199,231,0.08)", border: `1px solid ${T.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <FileText style={{ width: 16, height: 16, color: T.cyan }} />
                        </div>
                        <div>
                            <div style={{ color: T.primary, fontWeight: 500, fontSize: 13 }}>{row.original.title}</div>
                            <div style={{ color: T.muted, fontSize: 12, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                    const st = SOURCE_STYLE[row.original.sourceType] || { background: "rgba(90,106,120,0.12)", color: T.muted };
                    return (
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: "capitalize", ...st }}>
                            {row.original.sourceType}
                        </span>
                    );
                },
            },
            {
                accessorKey: "contentType",
                header: "Type",
                cell: ({ row }) => (
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(22,199,231,0.12)", color: T.cyan }}>
                        {row.original.contentType}
                    </span>
                ),
            },
            {
                accessorKey: "chunks",
                header: "Chunks",
                cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Database style={{ width: 13, height: 13, color: T.muted }} />
                        <span style={{ color: T.primary, fontWeight: 600, fontSize: 13 }}>{row.original.chunks}</span>
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const st = STATUS_STYLE[row.original.status] || STATUS_STYLE.pending;
                    return (
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: "capitalize", ...st }}>
                            {row.original.status}
                        </span>
                    );
                },
            },
            {
                accessorKey: "updatedAt",
                header: "Updated",
                cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.muted, fontSize: 12 }}>
                        <Calendar style={{ width: 12, height: 12 }} />
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
                        style={{
                            padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer",
                            backgroundColor: "rgba(22,199,231,0.08)", border: `1px solid rgba(22,199,231,0.2)`,
                            color: T.cyan, transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.15)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.08)"}
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
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 384 }}>
                    <Loader2 style={{ width: 32, height: 32, color: T.cyan, animation: "spin 1s linear infinite" }} />
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 384, gap: 12 }}>
                    <AlertCircle style={{ width: 44, height: 44, color: T.danger }} />
                    <p style={{ color: T.primary, fontSize: 15 }}>{error}</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>

                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 3, height: 22, backgroundColor: T.cyan, borderRadius: 2 }} />
                                <h1 style={{ color: T.primary, fontSize: 22, fontWeight: 700, margin: 0 }}>Knowledge Base</h1>
                            </div>
                            <p style={{ color: T.secondary, fontSize: 13, marginLeft: 11 }}>
                                Ted McGrath&apos;s knowledge base powered by RAG (Retrieval Augmented Generation)
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/transcripts/add')}
                            style={{
                                display: "flex", alignItems: "center", gap: 7,
                                padding: "9px 18px", backgroundColor: T.cyan,
                                color: "#05080B", fontWeight: 600, fontSize: 13,
                                border: "none", borderRadius: 8, cursor: "pointer",
                                flexShrink: 0,
                            }}
                        >
                            <Plus style={{ width: 15, height: 15 }} />
                            Add Content
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                        {[
                            { label: "Total Transcripts", value: stats.transcripts?.total || 0, color: T.primary, delay: 0 },
                            { label: "Total Chunks", value: stats.chunks?.total || 0, color: T.cyan, delay: 0.07 },
                            { label: "Completed", value: stats.transcripts?.completed || 0, color: T.success, delay: 0.14 },
                            { label: "Avg. Chunks", value: stats.chunks?.average_per_transcript || 0, color: T.primary, delay: 0.21 },
                        ].map(({ label, value, color, delay }) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay }}
                                style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px" }}
                            >
                                <p style={{ color: T.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>{label}</p>
                                <p style={{ color, fontSize: 26, fontWeight: 700, margin: 0 }}>{value}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Search Bar */}
                <div style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ position: "relative" }}>
                        <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: T.muted }} />
                        <input
                            type="text"
                            placeholder="Search knowledge base..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            style={{
                                width: "100%", boxSizing: "border-box",
                                paddingLeft: 42, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                                backgroundColor: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 9, color: T.primary, fontSize: 13, outline: "none",
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = T.cyan}
                            onBlur={e => e.currentTarget.style.borderColor = T.border}
                        />
                    </div>
                </div>

                {/* Table */}
                <div style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
                    {knowledgeData.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", gap: 14 }}>
                            <Database style={{ width: 48, height: 48, color: T.border }} />
                            <h3 style={{ color: T.primary, fontSize: 17, fontWeight: 600, margin: 0 }}>No Knowledge Base Content</h3>
                            <p style={{ color: T.secondary, fontSize: 14, margin: 0 }}>Add Ted McGrath&apos;s transcripts to power AI-generated content</p>
                            <button
                                onClick={() => router.push('/admin/transcripts/add')}
                                style={{
                                    display: "flex", alignItems: "center", gap: 7,
                                    padding: "10px 20px", backgroundColor: T.cyan,
                                    color: "#05080B", fontWeight: 600, fontSize: 13,
                                    border: "none", borderRadius: 9, cursor: "pointer", marginTop: 6,
                                }}
                            >
                                <Plus style={{ width: 15, height: 15 }} />
                                Add First Transcript
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id} style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.surface }}>
                                                {headerGroup.headers.map(header => (
                                                    <th key={header.id} style={{
                                                        padding: "10px 14px", textAlign: "left",
                                                        color: T.muted, fontSize: 11, fontWeight: 600,
                                                        textTransform: "uppercase", letterSpacing: "0.07em",
                                                    }}>
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {table.getRowModel().rows.map(row => (
                                            <tr
                                                key={row.id}
                                                style={{ borderBottom: `1px solid ${T.border}`, transition: "background-color 0.12s ease" }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.03)"}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                            >
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} style={{ padding: "11px 14px", color: T.primary, fontSize: 13 }}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div style={{
                                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                                gap: 12, padding: "12px 16px", borderTop: `1px solid ${T.border}`, backgroundColor: T.surface,
                            }}>
                                <p style={{ color: T.secondary, fontSize: 13, margin: 0 }}>
                                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
                                    {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, knowledgeData.length)}{" "}
                                    of {knowledgeData.length}
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            padding: "6px 12px", backgroundColor: T.cardBg, border: `1px solid ${T.border}`,
                                            borderRadius: 8, color: T.secondary, fontSize: 13, cursor: !table.getCanPreviousPage() ? "not-allowed" : "pointer",
                                            opacity: !table.getCanPreviousPage() ? 0.4 : 1,
                                        }}
                                    >
                                        <ChevronLeft style={{ width: 14, height: 14 }} /> Previous
                                    </button>
                                    <span style={{ color: T.secondary, fontSize: 13 }}>
                                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                                    </span>
                                    <button
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            padding: "6px 12px", backgroundColor: T.cardBg, border: `1px solid ${T.border}`,
                                            borderRadius: 8, color: T.secondary, fontSize: 13, cursor: !table.getCanNextPage() ? "not-allowed" : "pointer",
                                            opacity: !table.getCanNextPage() ? 0.4 : 1,
                                        }}
                                    >
                                        Next <ChevronRight style={{ width: 14, height: 14 }} />
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
