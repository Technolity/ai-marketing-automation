"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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
    Edit,
    Plus,
    ArrowUpDown,
    FileText,
    Calendar
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

// Mock knowledge base data
const mockKnowledge = [
    { id: 1, title: "SaaS Marketing Best Practices", industry: "Technology", contentType: "Guide", updatedAt: "2024-04-10" },
    { id: 2, title: "Fitness Industry Trends 2024", industry: "Health & Fitness", contentType: "Article", updatedAt: "2024-04-08" },
    { id: 3, title: "E-commerce Email Templates", industry: "Retail", contentType: "Template", updatedAt: "2024-04-05" },
    { id: 4, title: "Real Estate Lead Magnets", industry: "Real Estate", contentType: "Resource", updatedAt: "2024-04-03" },
    { id: 5, title: "Legal Services Value Props", industry: "Legal", contentType: "Guide", updatedAt: "2024-04-01" },
    { id: 6, title: "Healthcare Compliance Copy", industry: "Healthcare", contentType: "Template", updatedAt: "2024-03-28" },
    { id: 7, title: "Finance Industry Pain Points", industry: "Finance", contentType: "Research", updatedAt: "2024-03-25" },
    { id: 8, title: "Agency Positioning Framework", industry: "Marketing", contentType: "Framework", updatedAt: "2024-03-22" },
];

const industryColors = {
    Technology: "bg-blue-500/20 text-blue-400",
    "Health & Fitness": "bg-red-500/20 text-red-400",
    Retail: "bg-orange-500/20 text-orange-400",
    "Real Estate": "bg-purple-500/20 text-purple-400",
    Legal: "bg-indigo-500/20 text-indigo-400",
    Healthcare: "bg-teal-500/20 text-teal-400",
    Finance: "bg-yellow-500/20 text-yellow-400",
    Marketing: "bg-cyan/20 text-cyan",
};

const contentTypeColors = {
    Guide: "bg-green-500/20 text-green-400",
    Article: "bg-blue-500/20 text-blue-400",
    Template: "bg-purple-500/20 text-purple-400",
    Resource: "bg-orange-500/20 text-orange-400",
    Research: "bg-pink-500/20 text-pink-400",
    Framework: "bg-cyan/20 text-cyan",
};

export default function AdminKnowledgeBase() {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([]);

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
                        <span className="font-medium">{row.original.title}</span>
                    </div>
                ),
            },
            {
                accessorKey: "industry",
                header: "Industry",
                cell: ({ row }) => (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${industryColors[row.original.industry] || "bg-gray-500/20 text-gray-400"}`}>
                        {row.original.industry}
                    </span>
                ),
            },
            {
                accessorKey: "contentType",
                header: "Content Type",
                cell: ({ row }) => (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${contentTypeColors[row.original.contentType] || "bg-gray-500/20 text-gray-400"}`}>
                        {row.original.contentType}
                    </span>
                ),
            },
            {
                accessorKey: "updatedAt",
                header: "Last Updated",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(row.original.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </div>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <button className="flex items-center gap-2 px-4 py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan rounded-lg transition-colors text-sm font-medium">
                        <Edit className="w-4 h-4" />
                        Edit
                    </button>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: mockKnowledge,
        columns,
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageSize: 8,
            },
        },
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
                        <p className="text-gray-400">Manage content templates and industry-specific resources.</p>
                    </div>
                    <Link
                        href="/admin/knowledge-base/add"
                        className="flex items-center gap-2 px-6 py-3 bg-cyan hover:brightness-110 text-black rounded-xl font-semibold transition-all shadow-lg shadow-cyan/20"
                    >
                        <Plus className="w-5 h-5" />
                        Add Content
                    </Link>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search knowledge base..."
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
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="border-b border-[#2a2a2d]">
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-6 py-4 text-left text-sm font-semibold text-gray-400"
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
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-[#2a2a2d] hover:bg-[#0e0e0f] transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-6 py-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a2d]">
                        <p className="text-sm text-gray-400">
                            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                mockKnowledge.length
                            )}{" "}
                            of {mockKnowledge.length} items
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm text-gray-400">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
