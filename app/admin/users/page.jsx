"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    Eye,
    ArrowUpDown,
    User,
    Loader2,
    RefreshCw,
    FolderKanban,
    CheckCircle,
    XCircle,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import EditableCell from "@/components/admin/EditableCell";

// Design tokens
const T = {
    cardBg: "#0D1217",
    surface: "#121920",
    border: "#1E2A34",
    cyan: "#16C7E7",
    textPrimary: "#F4F8FB",
    textSecondary: "#B2C0CD",
    textMuted: "#5a6a78",
    rowHover: "rgba(22,199,231,0.03)",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",
    purple: "#a78bfa",
};

const TIER_STYLES = {
    starter: { bg: "rgba(52,211,153,0.12)", color: "#34d399", border: "rgba(52,211,153,0.25)" },
    growth:  { bg: "rgba(22,199,231,0.12)",  color: "#16C7E7", border: "rgba(22,199,231,0.25)" },
    scale:   { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
};

// Toast notification component
function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: {
            backgroundColor: "rgba(52,211,153,0.12)",
            border: "1px solid rgba(52,211,153,0.25)",
            color: T.success,
        },
        error: {
            backgroundColor: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: T.danger,
        },
        info: {
            backgroundColor: "rgba(22,199,231,0.12)",
            border: "1px solid rgba(22,199,231,0.25)",
            color: T.cyan,
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            style={{
                position: "fixed",
                top: 16,
                right: 16,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 500,
                ...(styles[type] || styles.info),
            }}
        >
            {type === "success" && <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
            {type === "error" && <XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
            <span>{message}</span>
            <button
                onClick={onClose}
                style={{ marginLeft: 6, opacity: 0.7, cursor: "pointer", background: "none", border: "none", color: "inherit", display: "flex" }}
            >
                <XCircle style={{ width: 14, height: 14 }} />
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
    const [searchInput, setSearchInput] = useState("");
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [tierStats, setTierStats] = useState({ starter: 0, growth: 0, scale: 0 });
    const [savingFields, setSavingFields] = useState({});
    const [toast, setToast] = useState(null);
    const debounceRef = useRef(null);

    // Debounced search handler
    const handleSearchChange = useCallback((value) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setGlobalFilter(value);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 400);
    }, []);

    const fetchUsers = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: globalFilter,
            });

            const response = await fetchWithAuth(`/api/admin/users?${params}`, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error("Failed to fetch users");

            const data = await response.json();
            setUsers(data.users || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0,
            }));
            setTierStats(data.tierStats || {});
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    }, [session, pagination.page, pagination.limit, globalFilter]);

    useEffect(() => {
        if (!authLoading && session) {
            fetchUsers();
        }
    }, [authLoading, session, fetchUsers]);

    // Handle field updates via inline editing
    const handleFieldUpdate = useCallback(async (field, value, userId) => {
        setSavingFields(prev => ({ ...prev, [`${userId}-${field}`]: true }));

        try {
            const response = await fetchWithAuth("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    action: "update_field",
                    field,
                    value,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update field");
            }

            const data = await response.json();

            setUsers(prev =>
                prev.map(user => (user.id === userId ? { ...user, [field]: value } : user))
            );

            setToast({ message: `Updated ${field} successfully!`, type: "success" });
            console.log(`Updated ${field} for user ${userId}:`, value);
            return data;
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setToast({ message: `Failed to update: ${error.message}`, type: "error" });
            throw error;
        } finally {
            setSavingFields(prev => {
                const newState = { ...prev };
                delete newState[`${userId}-${field}`];
                return newState;
            });
        }
    }, []);

    const handleViewFunnels = useCallback(
        (userId) => {
            router.push(`/admin/funnels?userId=${userId}`);
        },
        [router]
    );

    const columns = useMemo(
        () => [
            {
                accessorKey: "full_name",
                header: ({ column }) => (
                    <button
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: T.textSecondary,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            padding: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.cyan)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.textSecondary)}
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown style={{ width: 14, height: 14 }} />
                    </button>
                ),
                cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                backgroundColor: T.surface,
                                border: `1px solid ${T.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <User style={{ width: 16, height: 16, color: T.textSecondary }} />
                        </div>
                        <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 500 }}>
                            {row.original.full_name || "No Name"}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ row }) => (
                    <span style={{ color: T.textSecondary, fontSize: 13 }}>{row.original.email}</span>
                ),
            },
            {
                accessorKey: "subscription_tier",
                header: "Tier",
                cell: ({ row }) => (
                    <EditableCell
                        value={row.original.subscription_tier || "starter"}
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
                        validation={{ required: true, min: 0, max: 1000, integer: true }}
                        displayFormatter={val =>
                            val !== null && val !== undefined ? val : "Unlimited"
                        }
                    />
                ),
            },
            {
                accessorKey: "current_funnel_count",
                header: "Funnels",
                cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: T.textSecondary, fontSize: 13 }}>
                            {row.original.current_funnel_count || 0}
                        </span>
                        {row.original.max_funnels && (
                            <span style={{ color: T.textMuted, fontSize: 12 }}>
                                / {row.original.max_funnels}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "is_admin",
                header: "Role",
                cell: ({ row }) => {
                    const isAdmin = row.original.is_admin;
                    return (
                        <span
                            style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: isAdmin
                                    ? "rgba(248,113,113,0.12)"
                                    : "rgba(90,106,120,0.15)",
                                color: isAdmin ? T.danger : T.textMuted,
                                border: `1px solid ${isAdmin ? "rgba(248,113,113,0.25)" : "rgba(90,106,120,0.25)"}`,
                            }}
                        >
                            {isAdmin ? "Admin" : "User"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "created_at",
                header: "Joined",
                cell: ({ row }) => (
                    <span style={{ color: T.textSecondary, fontSize: 13 }}>
                        {row.original.created_at
                            ? new Date(row.original.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                              })
                            : "N/A"}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ActionButton
                            title="View user's funnels"
                            hoverBg="rgba(167,139,250,0.12)"
                            hoverBorder="rgba(167,139,250,0.3)"
                            onClick={() => handleViewFunnels(row.original.id)}
                        >
                            <FolderKanban style={{ width: 15, height: 15 }} />
                        </ActionButton>
                        <ActionButton
                            title="View details"
                            hoverBg="rgba(22,199,231,0.12)"
                            hoverBorder="rgba(22,199,231,0.3)"
                            hoverColor={T.cyan}
                            onClick={() => router.push(`/admin/users/${row.original.id}`)}
                        >
                            <Eye style={{ width: 15, height: 15 }} />
                        </ActionButton>
                    </div>
                ),
            },
        ],
        [handleFieldUpdate, handleViewFunnels, router]
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

            <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
                {/* Page Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div
                                style={{
                                    width: 3,
                                    height: 22,
                                    backgroundColor: T.cyan,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                }}
                            />
                            <h1
                                style={{
                                    color: T.textPrimary,
                                    fontSize: 22,
                                    fontWeight: 700,
                                    margin: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                User Management
                            </h1>
                        </div>
                        <p style={{ color: T.textSecondary, fontSize: 13, marginLeft: 11, margin: 0, marginTop: 2, marginLeft: 11 }}>
                            Manage users and subscription tiers
                        </p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            backgroundColor: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: 10,
                            color: T.textSecondary,
                            fontSize: 13,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        <RefreshCw
                            style={{ width: 15, height: 15 }}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* Tier Stat Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    <TierCard label="Starter" count={tierStats.starter || 0} accentColor={T.success} />
                    <TierCard label="Growth" count={tierStats.growth || 0} accentColor={T.cyan} />
                    <TierCard label="Scale" count={tierStats.scale || 0} accentColor={T.purple} />
                </div>

                {/* Search */}
                <div style={{ position: "relative" }}>
                    <Search
                        style={{
                            position: "absolute",
                            left: 14,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: T.textMuted,
                            width: 16,
                            height: 16,
                            pointerEvents: "none",
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchInput}
                        onChange={e => handleSearchChange(e.target.value)}
                        onFocus={e => (e.target.style.borderColor = T.cyan)}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                        style={{
                            width: "100%",
                            padding: "10px 14px 10px 40px",
                            backgroundColor: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: 10,
                            color: T.textPrimary,
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s",
                        }}
                    />
                </div>

                {/* Table */}
                <div
                    style={{
                        backgroundColor: T.cardBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        overflow: "hidden",
                    }}
                >
                    {loading ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: 320,
                                gap: 12,
                            }}
                        >
                            <Loader2
                                style={{ width: 36, height: 36, color: T.cyan }}
                                className="animate-spin"
                            />
                            <p style={{ color: T.textSecondary, fontSize: 14, margin: 0 }}>
                                Loading users...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        minWidth: 800,
                                        borderCollapse: "collapse",
                                    }}
                                >
                                    <thead>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <tr
                                                key={headerGroup.id}
                                                style={{
                                                    backgroundColor: T.surface,
                                                    borderBottom: `1px solid ${T.border}`,
                                                }}
                                            >
                                                {headerGroup.headers.map(header => (
                                                    <th
                                                        key={header.id}
                                                        style={{
                                                            padding: "12px 20px",
                                                            textAlign: "left",
                                                            color: T.textSecondary,
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.06em",
                                                            whiteSpace: "nowrap",
                                                        }}
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
                                        {table.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={columns.length}
                                                    style={{ padding: "64px 24px", textAlign: "center" }}
                                                >
                                                    <Users
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            color: T.textMuted,
                                                            margin: "0 auto 12px",
                                                            display: "block",
                                                        }}
                                                    />
                                                    <p style={{ color: T.textSecondary, fontSize: 14, margin: "0 0 4px" }}>
                                                        No users found
                                                    </p>
                                                    <p style={{ color: T.textMuted, fontSize: 12, margin: 0 }}>
                                                        Try adjusting your search query
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map(row => (
                                                <tr
                                                    key={row.id}
                                                    style={{ borderBottom: `1px solid ${T.border}` }}
                                                    onMouseEnter={e =>
                                                        (e.currentTarget.style.backgroundColor = T.rowHover)
                                                    }
                                                    onMouseLeave={e =>
                                                        (e.currentTarget.style.backgroundColor = "transparent")
                                                    }
                                                >
                                                    {row.getVisibleCells().map(cell => (
                                                        <td
                                                            key={cell.id}
                                                            style={{ padding: "14px 20px" }}
                                                        >
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "14px 20px",
                                    borderTop: `1px solid ${T.border}`,
                                    backgroundColor: T.surface,
                                    flexWrap: "wrap",
                                    gap: 12,
                                }}
                            >
                                <span style={{ color: T.textSecondary, fontSize: 13 }}>
                                    Total:{" "}
                                    <span style={{ color: T.cyan }}>{pagination.total}</span>{" "}
                                    users
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button
                                        disabled={pagination.page <= 1}
                                        onClick={() =>
                                            setPagination(p => ({ ...p, page: p.page - 1 }))
                                        }
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "6px 10px",
                                            backgroundColor: T.surface,
                                            border: `1px solid ${T.border}`,
                                            borderRadius: 8,
                                            color: T.textSecondary,
                                            cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                                            opacity: pagination.page <= 1 ? 0.4 : 1,
                                        }}
                                    >
                                        <ChevronLeft style={{ width: 16, height: 16 }} />
                                    </button>
                                    <span
                                        style={{
                                            padding: "6px 14px",
                                            backgroundColor: T.cardBg,
                                            border: `1px solid ${T.border}`,
                                            borderRadius: 8,
                                            color: T.textPrimary,
                                            fontSize: 13,
                                        }}
                                    >
                                        Page {pagination.page} of {pagination.totalPages || 1}
                                    </span>
                                    <button
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() =>
                                            setPagination(p => ({ ...p, page: p.page + 1 }))
                                        }
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "6px 10px",
                                            backgroundColor: T.surface,
                                            border: `1px solid ${T.border}`,
                                            borderRadius: 8,
                                            color: T.textSecondary,
                                            cursor:
                                                pagination.page >= pagination.totalPages
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity:
                                                pagination.page >= pagination.totalPages ? 0.4 : 1,
                                        }}
                                    >
                                        <ChevronRight style={{ width: 16, height: 16 }} />
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

// --- Sub-components ---

function TierCard({ label, count, accentColor }) {
    return (
        <div
            style={{
                backgroundColor: "#0D1217",
                border: "1px solid #1E2A34",
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: 12,
                padding: "18px 20px",
            }}
        >
            <p
                style={{
                    color: "#5a6a78",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "0 0 8px",
                }}
            >
                {label}
            </p>
            <p
                style={{
                    color: "#F4F8FB",
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: 1,
                    margin: 0,
                }}
            >
                {count}
            </p>
            <p style={{ color: "#B2C0CD", fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                active users
            </p>
        </div>
    );
}

function ActionButton({ children, title, hoverBg, hoverBorder, hoverColor, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            title={title}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "7px",
                borderRadius: 8,
                border: `1px solid ${hovered ? hoverBorder : "transparent"}`,
                backgroundColor: hovered ? hoverBg : "transparent",
                color: hovered ? (hoverColor || "#a78bfa") : "#5a6a78",
                cursor: "pointer",
                transition: "background-color 0.12s, border-color 0.12s, color 0.12s",
            }}
        >
            {children}
        </button>
    );
}
