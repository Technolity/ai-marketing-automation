"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
    ChevronDown,
    ChevronUp,
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
    TrendingUp,
    Edit3,
    Save,
    FileText,
    Rocket,
    History,
    Clock,
    Undo2,
    ShieldCheck,
    Download,
    ArrowRightLeft,
    UserCheck,
    CloudOff,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { T as _T } from "@/components/admin/adminTheme";

/* ── design tokens ── */
const T = {
    appBg:    _T.bg,
    cardBg:   _T.card,
    surface:  _T.panel,
    border:   _T.border,
    cyan:     _T.cyan,
    primary:  _T.textPrimary,
    secondary:_T.textSecondary,
    muted:    _T.textMuted,
    success:  _T.green,
    warning:  _T.amber,
    danger:   _T.red,
    purple:   _T.purple,
};

const statusBadgeStyle = {
    not_started: { bg: "rgba(90,106,120,0.15)", color: _T.textMuted, border: "rgba(90,106,120,0.3)" },
    pending:     { bg: "rgba(251,191,36,0.12)",  color: _T.amber, border: "rgba(251,191,36,0.3)" },
    in_progress: { bg: "rgba(22,199,231,0.1)",   color: _T.cyan, border: "rgba(22,199,231,0.3)" },
    completed:   { bg: "rgba(52,211,153,0.12)",  color: _T.green, border: "rgba(52,211,153,0.3)" },
    failed:      { bg: "rgba(248,113,113,0.12)", color: _T.red, border: "rgba(248,113,113,0.3)" },
};

function statusStyle(status) {
    return statusBadgeStyle[status] || statusBadgeStyle.not_started;
}

/* ── Toast ── */
function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: { bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.3)",  color: "#34d399" },
        error:   { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.3)", color: "#f87171" },
        info:    { bg: "rgba(22,199,231,0.12)",  border: "rgba(22,199,231,0.3)",  color: "#16C7E7" },
    };
    const s = styles[type] || styles.info;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
        >
            {type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
            {type === "error"   && <XCircle     className="w-4 h-4 shrink-0" />}
            {type === "info"    && <AlertCircle className="w-4 h-4 shrink-0" />}
            <p className="text-sm font-medium" style={{ color: T.primary }}>{message}</p>
            <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
                <XCircle className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export default function AdminFunnels() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filterUserId = searchParams.get("userId");

    const { session, loading: authLoading } = useAuth();
    const [funnels, setFunnels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const debounceRef = useRef(null);
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [statusStats, setStatusStats] = useState({});
    const [selectedFunnel, setSelectedFunnel] = useState(null);
    const [showVaultModal, setShowVaultModal] = useState(false);
    const [expandedSections, setExpandedSections] = useState(new Set());
    const [editingItem, setEditingItem] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [toast, setToast] = useState(null);

    const [historyField, setHistoryField] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySectionVersions, setHistorySectionVersions] = useState([]);
    const [historyFieldVersions, setHistoryFieldVersions] = useState([]);
    const [historyAvailableFields, setHistoryAvailableFields] = useState([]);
    const [historyTab, setHistoryTab] = useState("sections");
    const [historyFieldFilter, setHistoryFieldFilter] = useState(null);
    const [selectedHistoryVersion, setSelectedHistoryVersion] = useState(null);
    const [restoringVersion, setRestoringVersion] = useState(false);
    const [approvingSection, setApprovingSection] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferFunnel, setTransferFunnel] = useState(null);
    const [transferSearch, setTransferSearch] = useState("");
    const [transferSearchResults, setTransferSearchResults] = useState([]);
    const [transferSearching, setTransferSearching] = useState(false);
    const [transferTargetUser, setTransferTargetUser] = useState(null);
    const [transferring, setTransferring] = useState(false);
    const transferSearchRef = useRef(null);

    const fetchFunnels = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (filterUserId) params.append("userId", filterUserId);
            if (statusFilter) params.append("status", statusFilter);
            if (debouncedSearch) params.append("search", debouncedSearch);

            const response = await fetchWithAuth(`/api/admin/funnels?${params}`);
            if (!response.ok) throw new Error("Failed to fetch funnels");

            const data = await response.json();
            setFunnels(data.funnels || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0,
            }));
            setStatusStats(data.statusStats || {});
        } catch (err) {
            console.error("Error fetching funnels:", err);
        } finally {
            setLoading(false);
        }
    }, [session, pagination.page, pagination.limit, filterUserId, statusFilter, debouncedSearch]);

    const handleSearchChange = useCallback((value) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 400);
    }, []);

    useEffect(() => {
        if (!authLoading && session) fetchFunnels();
    }, [authLoading, session, fetchFunnels]);

    const handleFunnelAction = useCallback(async (funnelId, action) => {
        try {
            const response = await fetchWithAuth("/api/admin/funnels", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ funnelId, action }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to perform action");
            }
            const actionLabels = {
                reset_status: "Funnel status reset",
                delete: "Funnel deleted",
                retry_generation: "Generation retry initiated",
                force_complete: "Funnel marked as complete",
                undeploy: "Funnel undeployed — user can now re-deploy",
            };
            setToast({ message: actionLabels[action] || "Action completed successfully!", type: "success" });
            fetchFunnels();
        } catch (error) {
            console.error(`Error performing action ${action}:`, error);
            setToast({ message: `Failed: ${error.message}`, type: "error" });
        }
    }, [fetchFunnels]);

    const handleViewVault = (funnel) => {
        setSelectedFunnel(funnel);
        setExpandedSections(new Set());
        setEditingItem(null);
        setHistoryField(null);
        setHistorySectionVersions([]);
        setHistoryFieldVersions([]);
        setHistoryAvailableFields([]);
        setSelectedHistoryVersion(null);
        setShowVaultModal(true);
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    const handleFetchHistory = useCallback(async (sectionId) => {
        if (!selectedFunnel) return;
        setHistoryField({ sectionId });
        setHistoryLoading(true);
        setSelectedHistoryVersion(null);
        setHistoryFieldFilter(null);
        try {
            const params = new URLSearchParams({ sectionId });
            const response = await fetchWithAuth(
                `/api/admin/funnels/${selectedFunnel.id}/vault/history?${params}`
            );
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch history");
            }
            const data = await response.json();
            const sv = data.sectionVersions || [];
            const fv = data.fieldVersions || [];
            const af = data.availableFieldIds || [];
            setHistorySectionVersions(sv);
            setHistoryFieldVersions(fv);
            setHistoryAvailableFields(af);
            if (fv.length > 0) {
                setHistoryTab("fields");
                if (af.length > 0) setHistoryFieldFilter(af[0]);
            } else {
                setHistoryTab("sections");
            }
        } catch (error) {
            console.error("[AdminHistory] Error:", error);
            setToast({ message: `Failed to load history: ${error.message}`, type: "error" });
            setHistoryField(null);
        } finally {
            setHistoryLoading(false);
        }
    }, [selectedFunnel]);

    const handleRestoreVersion = useCallback(async (targetVersion) => {
        if (!selectedFunnel || !historyField) return;
        const source = historyTab === "fields" ? "vault_content_fields" : "vault_content";
        const label = historyTab === "fields"
            ? `${historyFieldFilter} (v${targetVersion})`
            : `section snapshot v${targetVersion}`;
        const confirmed = confirm(`Are you sure you want to restore ${label}?\n\nThis will make the old data the current active version for the user.`);
        if (!confirmed) return;
        setRestoringVersion(true);
        try {
            const response = await fetchWithAuth(
                `/api/admin/funnels/${selectedFunnel.id}/vault/restore`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sectionId: historyField.sectionId,
                        fieldId: historyTab === "fields" ? historyFieldFilter : null,
                        targetVersion,
                        source,
                    }),
                }
            );
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to restore version");
            }
            setToast({ message: `Restored to version ${targetVersion} successfully!`, type: "success" });
            await handleFetchHistory(historyField.sectionId);
            fetchFunnels();
        } catch (error) {
            setToast({ message: `Restore failed: ${error.message}`, type: "error" });
        } finally {
            setRestoringVersion(false);
        }
    }, [selectedFunnel, historyField, historyTab, historyFieldFilter, handleFetchHistory, fetchFunnels]);

    const closeHistory = useCallback(() => {
        setHistoryField(null);
        setHistorySectionVersions([]);
        setHistoryFieldVersions([]);
        setHistoryAvailableFields([]);
        setSelectedHistoryVersion(null);
        setHistoryFieldFilter(null);
    }, []);

    const handleBulkApprove = useCallback(async (sectionId) => {
        if (!selectedFunnel) return;
        const confirmed = confirm(`Approve ALL fields in section "${sectionId}"?\n\nThis will mark every current-version field as approved and sync the vault_content status.`);
        if (!confirmed) return;
        setApprovingSection(sectionId);
        try {
            const response = await fetchWithAuth(
                `/api/admin/funnels/${selectedFunnel.id}/vault/approve`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sectionId, approved: true }),
                }
            );
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to approve section");
            }
            const result = await response.json();
            setToast({ message: `Section "${sectionId}" approved (${result.updatedCount} fields)`, type: "success" });
            fetchFunnels();
        } catch (error) {
            setToast({ message: `Approve failed: ${error.message}`, type: "error" });
        } finally {
            setApprovingSection(null);
        }
    }, [selectedFunnel, fetchFunnels]);

    const handleExport = useCallback(async (format = "json", singleFunnelId = null) => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ format });
            if (singleFunnelId) {
                params.append("funnelId", singleFunnelId);
            } else {
                if (filterUserId) params.append("userId", filterUserId);
                if (statusFilter) params.append("status", statusFilter);
                if (debouncedSearch) params.append("search", debouncedSearch);
            }
            const response = await fetchWithAuth(`/api/admin/funnels/export?${params}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Export failed");
            }
            const blob = await response.blob();
            const contentDisposition = response.headers.get("Content-Disposition") || "";
            const fileNameMatch = contentDisposition.match(/filename="(.+?)"/);
            const fileName = fileNameMatch ? fileNameMatch[1] : `funnels_export.${format}`;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setToast({ message: `Export downloaded successfully (${format.toUpperCase()})`, type: "success" });
        } catch (error) {
            setToast({ message: `Export failed: ${error.message}`, type: "error" });
        } finally {
            setExporting(false);
        }
    }, [filterUserId, statusFilter, debouncedSearch]);

    const openTransferModal = useCallback((funnel) => {
        setTransferFunnel(funnel);
        setTransferSearch("");
        setTransferSearchResults([]);
        setTransferTargetUser(null);
        setShowTransferModal(true);
    }, []);

    const searchUsersForTransfer = useCallback(async (query) => {
        if (!query || query.length < 2) { setTransferSearchResults([]); return; }
        setTransferSearching(true);
        try {
            const res = await fetchWithAuth(`/api/admin/users?search=${encodeURIComponent(query)}&limit=8`);
            const data = await res.json();
            const filtered = (data.users || []).filter(u => u.id !== transferFunnel?.user_id);
            setTransferSearchResults(filtered);
        } catch (err) {
            setTransferSearchResults([]);
        } finally {
            setTransferSearching(false);
        }
    }, [transferFunnel]);

    useEffect(() => {
        if (!showTransferModal) return;
        const timer = setTimeout(() => { searchUsersForTransfer(transferSearch); }, 400);
        return () => clearTimeout(timer);
    }, [transferSearch, showTransferModal, searchUsersForTransfer]);

    const handleTransfer = useCallback(async () => {
        if (!transferFunnel || !transferTargetUser) return;
        const confirmed = confirm(`Are you sure you want to transfer the funnel "${transferFunnel.funnel_name || "Unnamed"}" from ${transferFunnel.user_profiles?.full_name || transferFunnel.user_profiles?.email || "Unknown"} to ${transferTargetUser.full_name || transferTargetUser.email}?\n\nThis will reassign all vault content, questionnaire answers, and associated data.`);
        if (!confirmed) return;
        setTransferring(true);
        try {
            const res = await fetchWithAuth("/api/admin/funnels/transfer", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ funnelId: transferFunnel.id, targetUserId: transferTargetUser.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Transfer failed");
            setToast({ message: data.message || "Funnel transferred successfully", type: "success" });
            setShowTransferModal(false);
            setTransferFunnel(null);
            setTransferTargetUser(null);
            fetchFunnels();
        } catch (error) {
            setToast({ message: `Transfer failed: ${error.message}`, type: "error" });
        } finally {
            setTransferring(false);
        }
    }, [transferFunnel, transferTargetUser, fetchFunnels]);

    const handleStartEdit = (item) => {
        setEditingItem(item.id);
        setEditValue(JSON.stringify(item.content, null, 2));
    };

    const handleSaveEdit = async (item, approve = false) => {
        setSavingEdit(true);
        try {
            let parsedContent;
            try { parsedContent = JSON.parse(editValue); }
            catch { setToast({ message: "Invalid JSON format", type: "error" }); setSavingEdit(false); return; }

            const response = await fetchWithAuth("/api/admin/funnels", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ funnelId: selectedFunnel.id, action: "update_vault_content", vaultItemId: item.id, content: parsedContent }),
            });
            if (!response.ok) throw new Error("Failed to save vault content");

            if (approve) {
                const approveResp = await fetchWithAuth(
                    `/api/admin/funnels/${selectedFunnel.id}/vault/approve`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sectionId: item.section_id, approved: true }),
                    }
                );
                if (!approveResp.ok) {
                    const errData = await approveResp.json();
                    setToast({ message: `Content saved but approval failed: ${errData.error}`, type: "error" });
                    setEditingItem(null);
                    fetchFunnels();
                    return;
                }
                const approveResult = await approveResp.json();
                setToast({ message: `Content saved & approved (${approveResult.updatedCount} fields)!`, type: "success" });
            } else {
                setToast({ message: "Vault content saved as draft!", type: "success" });
            }
            setEditingItem(null);
            fetchFunnels();
        } catch (error) {
            setToast({ message: `Save failed: ${error.message}`, type: "error" });
        } finally {
            setSavingEdit(false);
        }
    };

    const renderContentValue = (value, level = 0) => {
        if (value === null || value === undefined) return <span style={{ color: T.muted, fontStyle: "italic" }}>null</span>;
        if (Array.isArray(value)) {
            if (value.length === 0) return <span style={{ color: T.muted, fontStyle: "italic" }}>[]</span>;
            return (
                <ul className="list-disc list-inside space-y-1 ml-4">
                    {value.map((item, idx) => (
                        <li key={idx} style={{ color: T.secondary }}>
                            {typeof item === "object" ? renderContentValue(item, level + 1) : String(item)}
                        </li>
                    ))}
                </ul>
            );
        }
        if (typeof value === "object") {
            return (
                <div className={`space-y-2 ${level > 0 ? "ml-4 pl-4" : ""}`}
                    style={level > 0 ? { borderLeft: `1px solid ${T.border}` } : {}}>
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k}>
                            <span style={{ color: T.cyan, fontWeight: 500 }}>{k}:</span>{" "}
                            <span style={{ color: T.secondary }}>{renderContentValue(v, level + 1)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        if (typeof value === "string" && value.length > 200) {
            return <p style={{ color: T.secondary, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{value}</p>;
        }
        return <span style={{ color: T.secondary }}>{String(value)}</span>;
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "funnel_name",
                header: "Funnel Name",
                cell: ({ row }) => (
                    <div>
                        <div style={{ fontWeight: 500, color: T.primary }}>
                            {row.original.funnel_name || "Unnamed Funnel"}
                        </div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
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
                        <div style={{ color: T.primary }}>
                            {row.original.user_profiles?.full_name || "Unknown"}
                        </div>
                        <div style={{ fontSize: 12, color: T.muted }}>
                            {row.original.user_profiles?.email}
                        </div>
                    </div>
                ),
            },
            {
                id: "progress_status",
                header: "Progress & Status",
                cell: ({ row }) => {
                    const progress = row.original.progress_percent || 0;
                    const isDeployed = row.original.is_deployed;
                    const vaultItems = row.original.vault_items_count || 0;
                    const barColor = progress >= 100 ? T.success : progress > 0 ? T.cyan : T.muted;
                    const textColor = progress >= 100 ? T.success : progress > 0 ? T.cyan : T.muted;
                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{ width: `${progress}%`, height: "100%", backgroundColor: barColor, borderRadius: 3, transition: "width 0.5s" }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: textColor, minWidth: 32, textAlign: "right" }}>{progress}%</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {isDeployed ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "rgba(52,211,153,0.15)", color: T.success, border: "1px solid rgba(52,211,153,0.3)" }}>
                                        <Rocket className="w-3 h-3" /> Deployed
                                    </span>
                                ) : (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 500, background: "rgba(90,106,120,0.1)", color: T.muted, border: `1px solid ${T.border}` }}>
                                        Not Deployed
                                    </span>
                                )}
                                {vaultItems > 0 && (
                                    <span style={{ fontSize: 10, color: T.muted }}>{vaultItems} sections</span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "created_at",
                header: "Created",
                cell: ({ row }) => (
                    <span style={{ color: T.secondary, fontSize: 13 }}>
                        {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ActionBtn title="View vault content" hoverColor="rgba(22,199,231,0.15)" onClick={() => handleViewVault(row.original)}>
                            <Eye className="w-4 h-4" style={{ color: T.secondary }} />
                        </ActionBtn>
                        <ActionBtn title="Export funnel data (JSON)" hoverColor="rgba(52,211,153,0.15)" onClick={() => handleExport("json", row.original.id)} disabled={exporting}>
                            <Download className="w-4 h-4" style={{ color: T.secondary }} />
                        </ActionBtn>
                        <ActionBtn title="Transfer funnel to another user" hoverColor="rgba(251,146,60,0.15)" onClick={() => openTransferModal(row.original)}>
                            <ArrowRightLeft className="w-4 h-4" style={{ color: T.secondary }} />
                        </ActionBtn>
                        <ActionBtn title="Reset to not started" hoverColor="rgba(96,165,250,0.15)" onClick={() => { if (confirm(`Reset funnel "${row.original.business_name || "Unnamed"}" to not started?`)) handleFunnelAction(row.original.id, "reset_status"); }}>
                            <RotateCcw className="w-4 h-4" style={{ color: T.secondary }} />
                        </ActionBtn>
                        {row.original.is_deployed && (
                            <ActionBtn title="Undeploy funnel" hoverColor="rgba(167,139,250,0.15)" onClick={() => { if (confirm(`Undeploy "${row.original.funnel_name || "Unnamed"}"?\n\nThis clears the deployed_at timestamp so the user can trigger a full new deployment from the Vault — WITHOUT unapproving any of their sections.\n\nProceed?`)) handleFunnelAction(row.original.id, "undeploy"); }}>
                                <CloudOff className="w-4 h-4" style={{ color: T.secondary }} />
                            </ActionBtn>
                        )}
                        {row.original.vault_generation_status === "failed" && (
                            <ActionBtn title="Retry generation" hoverColor="rgba(251,191,36,0.15)" onClick={() => handleFunnelAction(row.original.id, "retry_generation")}>
                                <PlayCircle className="w-4 h-4" style={{ color: T.secondary }} />
                            </ActionBtn>
                        )}
                        <ActionBtn title="Delete funnel" hoverColor="rgba(248,113,113,0.15)" onClick={() => { if (confirm(`Delete funnel "${row.original.business_name}"? This action cannot be undone.`)) handleFunnelAction(row.original.id, "delete"); }}>
                            <Trash2 className="w-4 h-4" style={{ color: T.secondary }} />
                        </ActionBtn>
                    </div>
                ),
            },
        ],
        [handleFunnelAction, handleExport, exporting, openTransferModal]
    );

    const table = useReactTable({
        data: funnels,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
    });

    return (
        <AdminLayout>
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <div className="space-y-6" style={{ width: "100%", maxWidth: "100%", overflowX: "auto", boxSizing: "border-box" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {filterUserId && (
                            <button
                                onClick={() => router.push("/admin/users")}
                                style={{ padding: 8, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                                <ArrowLeft className="w-4 h-4" style={{ color: T.cyan }} />
                            </button>
                        )}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 3, height: 22, backgroundColor: T.cyan, borderRadius: 2, flexShrink: 0 }} />
                                <h1 style={{ color: T.primary, fontSize: 22, fontWeight: 700, margin: 0 }}>
                                    {filterUserId ? "User Funnels" : "Funnel Management"}
                                </h1>
                            </div>
                            <p style={{ color: T.secondary, fontSize: 13, marginLeft: 11 }}>Monitor and manage funnel generation</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Export dropdown */}
                        <div className="relative group">
                            <button
                                disabled={exporting || loading}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.secondary, fontSize: 13, cursor: "pointer", opacity: (exporting || loading) ? 0.5 : 1 }}
                            >
                                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                <span style={{ color: T.primary, fontWeight: 500 }}>{exporting ? "Exporting..." : "Export"}</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 180, backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 50, overflow: "hidden" }}
                                className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <button onClick={() => handleExport("json")} disabled={exporting}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left hover:bg-white/5"
                                    style={{ color: T.secondary }}>
                                    <FileText className="w-4 h-4" /> Export as JSON
                                </button>
                                <button onClick={() => handleExport("csv")} disabled={exporting}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left hover:bg-white/5"
                                    style={{ color: T.secondary, borderTop: `1px solid ${T.border}` }}>
                                    <FileText className="w-4 h-4" /> Export as CSV
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={fetchFunnels}
                            disabled={loading}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.secondary, fontSize: 13, cursor: "pointer", opacity: loading ? 0.5 : 1 }}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            <span style={{ color: T.primary, fontWeight: 500 }}>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Status Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(statusStats).map(([status, count], idx) => {
                        const s = statusStyle(status);
                        const isActive = statusFilter === status;
                        return (
                            <motion.button
                                key={status}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * idx }}
                                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                                style={{
                                    backgroundColor: s.bg,
                                    border: `1px solid ${isActive ? T.cyan : s.border}`,
                                    borderRadius: 12,
                                    padding: "16px 18px",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    boxShadow: isActive ? `0 0 0 2px rgba(22,199,231,0.2)` : "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: s.color }}>
                                        {status.replace("_", " ")}
                                    </p>
                                    <TrendingUp className="w-3.5 h-3.5" style={{ color: s.color }} />
                                </div>
                                <p style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{count || 0}</p>
                                <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>funnels</p>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Search */}
                <div style={{ position: "relative" }}>
                    <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: T.muted }} />
                    <input
                        type="text"
                        placeholder="Search by funnel name, user name, or email..."
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        style={{ width: "100%", paddingLeft: 44, paddingRight: 16, paddingTop: 11, paddingBottom: 11, backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, color: T.primary, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = T.cyan)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                    />
                </div>

                {/* Table */}
                <div style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 12 }}>
                            <Loader2 className="w-10 h-10 animate-spin" style={{ color: T.cyan }} />
                            <p style={{ color: T.secondary, fontSize: 14 }}>Loading funnels...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th key={header.id} style={{ backgroundColor: T.surface, color: T.secondary, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "11px 16px", borderBottom: `1px solid ${T.border}`, textAlign: "left", whiteSpace: "nowrap" }}>
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {table.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} style={{ padding: "60px 24px", textAlign: "center" }}>
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                                        <FolderKanban style={{ width: 36, height: 36, color: T.border }} />
                                                        <p style={{ color: T.secondary, fontSize: 14 }}>No funnels found</p>
                                                        <p style={{ color: T.muted, fontSize: 12 }}>Try adjusting your search or filters</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map((row) => (
                                                <tr key={row.id}
                                                    style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.03)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <td key={cell.id} style={{ color: T.primary, fontSize: 13, padding: "13px 16px" }}>
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                                <p style={{ fontSize: 13, color: T.secondary }}>Total: {pagination.total} funnels</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <PaginationBtn onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </PaginationBtn>
                                    <span style={{ fontSize: 13, color: T.secondary }}>Page {pagination.page} of {pagination.totalPages || 1}</span>
                                    <PaginationBtn onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages}>
                                        <ChevronRight className="w-4 h-4" />
                                    </PaginationBtn>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Vault Content Modal */}
            {showVaultModal && selectedFunnel && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ backgroundColor: T.cardBg, borderRadius: 16, border: `1px solid ${T.border}`, maxWidth: 900, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
                    >
                        {/* Modal Header */}
                        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
                            <div>
                                <h2 style={{ color: T.primary, fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4 }}>Vault Content</h2>
                                <p style={{ color: T.secondary, fontSize: 13, margin: 0 }}>
                                    {selectedFunnel.funnel_name || "Unnamed Funnel"}
                                    <span style={{ margin: "0 8px" }}>·</span>
                                    {selectedFunnel.user_profiles?.full_name || selectedFunnel.user_profiles?.email || ""}
                                    <span style={{ margin: "0 8px" }}>·</span>
                                    <span style={{ ...statusStyle(selectedFunnel.vault_generation_status), padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, display: "inline-block" }}>
                                        {selectedFunnel.vault_generation_status || "not_started"}
                                    </span>
                                </p>
                            </div>
                            <button onClick={() => setShowVaultModal(false)} style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surface)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                <X className="w-5 h-5" style={{ color: T.secondary }} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ overflowY: "auto", flex: 1, padding: 24 }}>
                            {selectedFunnel.vault_items?.length > 0 ? (
                                <div className="space-y-3">
                                    {(() => {
                                        const phases = {};
                                        selectedFunnel.vault_items.forEach(item => {
                                            const p = item.phase || 1;
                                            if (!phases[p]) phases[p] = [];
                                            phases[p].push(item);
                                        });
                                        return Object.entries(phases).map(([phase, items]) => (
                                            <div key={phase} className="space-y-2">
                                                <h3 style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 4px" }}>
                                                    Phase {phase} · {items.length} section{items.length !== 1 ? "s" : ""}
                                                </h3>
                                                {items.map(item => {
                                                    const isExpanded = expandedSections.has(item.id);
                                                    const isEditing = editingItem === item.id;
                                                    const ss = statusStyle(item.status);
                                                    return (
                                                        <div key={item.id} style={{ backgroundColor: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                                                            <button
                                                                onClick={() => toggleSection(item.id)}
                                                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)")}
                                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                            >
                                                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                                                    <FileText className="w-4 h-4 shrink-0" style={{ color: T.cyan }} />
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <span style={{ fontWeight: 500, color: T.primary, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                            {item.section_title || item.section_id}
                                                                        </span>
                                                                        <span style={{ fontSize: 11, color: T.muted }}>
                                                                            v{item.version} · {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, backgroundColor: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                                                                        {item.status}
                                                                    </span>
                                                                    {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: T.muted }} /> : <ChevronDown className="w-4 h-4" style={{ color: T.muted }} />}
                                                                </div>
                                                            </button>

                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        style={{ borderTop: `1px solid ${T.border}` }}
                                                                    >
                                                                        <div style={{ padding: 16 }}>
                                                                            {/* Action bar */}
                                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginBottom: 12 }}>
                                                                                {isEditing ? (
                                                                                    <>
                                                                                        <SmallBtn onClick={() => setEditingItem(null)}>
                                                                                            <X className="w-3 h-3" /> Cancel
                                                                                        </SmallBtn>
                                                                                        <SmallBtn onClick={() => handleSaveEdit(item, false)} disabled={savingEdit} color={T.cyan} colorBg="rgba(22,199,231,0.1)">
                                                                                            {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Draft
                                                                                        </SmallBtn>
                                                                                        <SmallBtn onClick={() => handleSaveEdit(item, true)} disabled={savingEdit} color={T.success} colorBg="rgba(52,211,153,0.1)">
                                                                                            {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />} Save & Approve
                                                                                        </SmallBtn>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        {historyField?.sectionId === item.section_id ? (
                                                                                            <SmallBtn onClick={closeHistory} color={T.purple} colorBg="rgba(167,139,250,0.1)">
                                                                                                <X className="w-3 h-3" /> Close History
                                                                                            </SmallBtn>
                                                                                        ) : (
                                                                                            <SmallBtn onClick={() => handleFetchHistory(item.section_id)}>
                                                                                                <History className="w-3 h-3" /> History
                                                                                            </SmallBtn>
                                                                                        )}
                                                                                        <SmallBtn onClick={() => handleBulkApprove(item.section_id)} disabled={approvingSection === item.section_id} color={T.success} colorBg="rgba(52,211,153,0.08)">
                                                                                            {approvingSection === item.section_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                                                                            {approvingSection === item.section_id ? "Approving..." : "Bulk Approve"}
                                                                                        </SmallBtn>
                                                                                        <SmallBtn onClick={() => handleStartEdit(item)}>
                                                                                            <Edit3 className="w-3 h-3" /> Edit JSON
                                                                                        </SmallBtn>
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            {/* Version History Panel */}
                                                                            {historyField?.sectionId === item.section_id && !isEditing && (() => {
                                                                                const activeVersions = historyTab === "sections"
                                                                                    ? historySectionVersions
                                                                                    : historyFieldFilter
                                                                                        ? historyFieldVersions.filter(v => v.field_id === historyFieldFilter)
                                                                                        : historyFieldVersions;
                                                                                return (
                                                                                    <div style={{ marginBottom: 16, backgroundColor: T.cardBg, border: `1px solid rgba(167,139,250,0.2)`, borderRadius: 10, padding: 14 }} className="space-y-3">
                                                                                        {/* Tab switcher */}
                                                                                        <div style={{ display: "flex", gap: 4, backgroundColor: T.surface, padding: 4, borderRadius: 8, width: "fit-content" }}>
                                                                                            {["sections", "fields"].map(tab => (
                                                                                                <button key={tab} onClick={() => { setHistoryTab(tab); setSelectedHistoryVersion(null); }}
                                                                                                    style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer", transition: "all 0.15s", backgroundColor: historyTab === tab ? "rgba(167,139,250,0.2)" : "transparent", color: historyTab === tab ? T.purple : T.muted }}>
                                                                                                    {tab === "sections" ? `Section Snapshots (${historySectionVersions.length})` : `Field History (${historyFieldVersions.length})`}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>

                                                                                        {historyTab === "sections" ? (
                                                                                            <p style={{ fontSize: 11, color: T.muted }}>Full section snapshots from each generation/regeneration.</p>
                                                                                        ) : (
                                                                                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                                                                                <label style={{ fontSize: 11, color: T.secondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Field:</label>
                                                                                                {historyAvailableFields.length > 0 ? (
                                                                                                    <select value={historyFieldFilter || ""} onChange={(e) => { setHistoryFieldFilter(e.target.value); setSelectedHistoryVersion(null); }}
                                                                                                        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.primary, fontSize: 11, borderRadius: 8, padding: "4px 10px", outline: "none", minWidth: 200 }}>
                                                                                                        {historyAvailableFields.map(fid => (
                                                                                                            <option key={fid} value={fid}>{fid}</option>
                                                                                                        ))}
                                                                                                    </select>
                                                                                                ) : (
                                                                                                    <span style={{ fontSize: 11, color: T.muted, fontStyle: "italic" }}>No field-level edits recorded yet</span>
                                                                                                )}
                                                                                                <span style={{ fontSize: 11, color: T.muted }}>{activeVersions.length} version{activeVersions.length !== 1 ? "s" : ""}</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {historyLoading ? (
                                                                                            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                                                                                                <Loader2 className="w-5 h-5 animate-spin" style={{ color: T.purple }} />
                                                                                            </div>
                                                                                        ) : activeVersions.length === 0 ? (
                                                                                            <p style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                                                                                                {historyTab === "sections" ? "No section snapshots found." : "No field-level history found."}
                                                                                            </p>
                                                                                        ) : (
                                                                                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                                                                {activeVersions.map((ver) => {
                                                                                                    const isSelected = selectedHistoryVersion?.id === ver.id;
                                                                                                    return (
                                                                                                        <button key={ver.id} onClick={() => setSelectedHistoryVersion(ver)}
                                                                                                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, border: `1px solid ${isSelected ? "rgba(167,139,250,0.5)" : T.border}`, backgroundColor: isSelected ? "rgba(167,139,250,0.08)" : T.surface, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                                                                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                                                                                <Clock className="w-3 h-3" style={{ color: T.muted, flexShrink: 0 }} />
                                                                                                                <span style={{ fontWeight: 500, color: T.primary, fontSize: 12 }}>v{ver.version}</span>
                                                                                                                {historyTab === "fields" && ver.field_id && (
                                                                                                                    <span style={{ padding: "1px 6px", backgroundColor: T.cardBg, color: T.secondary, borderRadius: 4, fontSize: 10 }}>{ver.field_id}</span>
                                                                                                                )}
                                                                                                                {ver.is_current_version && (
                                                                                                                    <span style={{ padding: "1px 6px", backgroundColor: "rgba(52,211,153,0.15)", color: T.success, borderRadius: 4, fontSize: 10, fontWeight: 700 }}>CURRENT</span>
                                                                                                                )}
                                                                                                                {ver.is_approved && (
                                                                                                                    <span style={{ padding: "1px 6px", backgroundColor: "rgba(22,199,231,0.1)", color: T.cyan, borderRadius: 4, fontSize: 10, fontWeight: 700 }}>APPROVED</span>
                                                                                                                )}
                                                                                                                {historyTab === "sections" && ver.status && (
                                                                                                                    <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, ...statusStyle(ver.status) }}>{ver.status}</span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>
                                                                                                                {new Date(ver.updated_at || ver.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                                                                            </span>
                                                                                                        </button>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        )}

                                                                                        {selectedHistoryVersion && (
                                                                                            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }} className="space-y-3">
                                                                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                                                                    <h4 style={{ fontSize: 11, fontWeight: 600, color: T.secondary, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                                                                                                        Preview — v{selectedHistoryVersion.version}
                                                                                                        {selectedHistoryVersion.is_current_version && " (Current)"}
                                                                                                        {historyTab === "fields" && selectedHistoryVersion.field_id && (
                                                                                                            <span style={{ marginLeft: 8, color: T.purple }}>{selectedHistoryVersion.field_id}</span>
                                                                                                        )}
                                                                                                    </h4>
                                                                                                    {!selectedHistoryVersion.is_current_version && (
                                                                                                        <button onClick={() => handleRestoreVersion(selectedHistoryVersion.version)} disabled={restoringVersion}
                                                                                                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", fontSize: 11, backgroundColor: "rgba(251,191,36,0.12)", color: T.warning, border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, cursor: "pointer", opacity: restoringVersion ? 0.5 : 1 }}>
                                                                                                            {restoringVersion ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
                                                                                                            Restore this version
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div style={{ maxHeight: 220, overflowY: "auto", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                                                                                                    <pre style={{ fontSize: 11, color: T.secondary, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                                                                                                        {(() => {
                                                                                                            const previewData = historyTab === "sections" ? selectedHistoryVersion.content : selectedHistoryVersion.field_value;
                                                                                                            return typeof previewData === "object" ? JSON.stringify(previewData, null, 2) : String(previewData ?? "null");
                                                                                                        })()}
                                                                                                    </pre>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}

                                                                            {/* Content display */}
                                                                            {isEditing ? (
                                                                                <textarea
                                                                                    value={editValue}
                                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                                    style={{ width: "100%", height: 360, padding: 14, backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.secondary, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                                                                                    onFocus={(e) => (e.currentTarget.style.borderColor = T.cyan)}
                                                                                    onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                                                                                    spellCheck={false}
                                                                                />
                                                                            ) : historyField?.sectionId !== item.section_id ? (
                                                                                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                                                                                    {item.content ? renderContentValue(item.content) : <p style={{ color: T.muted, fontStyle: "italic" }}>No content data</p>}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
                                    <FolderKanban style={{ width: 36, height: 36, color: T.border }} />
                                    <p style={{ color: T.secondary, fontSize: 14 }}>No vault content generated yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && transferFunnel && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ padding: 8, backgroundColor: "rgba(251,146,60,0.1)", borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)" }}>
                                    <ArrowRightLeft className="w-4 h-4" style={{ color: "#fb923c" }} />
                                </div>
                                <div>
                                    <h3 style={{ color: T.primary, fontSize: 16, fontWeight: 700, margin: 0 }}>Transfer Funnel</h3>
                                    <p style={{ color: T.muted, fontSize: 11, margin: "2px 0 0" }}>Reassign ownership to another user</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowTransferModal(false); setTransferFunnel(null); setTransferTargetUser(null); }}
                                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surface)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                <X className="w-4 h-4" style={{ color: T.secondary }} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: 24 }} className="space-y-4">
                            <div style={{ padding: "12px 14px", backgroundColor: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                                <p style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Funnel Being Transferred</p>
                                <p style={{ fontSize: 13, fontWeight: 500, color: T.primary, margin: 0 }}>{transferFunnel.funnel_name || "Unnamed Funnel"}</p>
                                <p style={{ fontSize: 11, color: T.muted, margin: "4px 0 0" }}>
                                    Current owner: <span style={{ color: T.secondary }}>{transferFunnel.user_profiles?.full_name || transferFunnel.user_profiles?.email || "Unknown"}</span>
                                </p>
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: T.secondary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Search Target User</label>
                                <div style={{ position: "relative" }}>
                                    <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: T.muted }} />
                                    <input ref={transferSearchRef} type="text" value={transferSearch} onChange={(e) => setTransferSearch(e.target.value)}
                                        placeholder="Search by name or email..."
                                        style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.primary, outline: "none", boxSizing: "border-box" }}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(251,146,60,0.5)")}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                                        autoFocus />
                                    {transferSearching && <Loader2 style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#fb923c" }} className="animate-spin" />}
                                </div>

                                {transferSearchResults.length > 0 && !transferTargetUser && (
                                    <div style={{ marginTop: 6, maxHeight: 180, overflowY: "auto", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                                        {transferSearchResults.map((user) => (
                                            <button key={user.id} onClick={() => { setTransferTargetUser(user); setTransferSearchResults([]); }}
                                                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${T.border}` }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(251,146,60,0.07)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                                <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fb923c", flexShrink: 0 }}>
                                                    {(user.full_name || user.email || "?")[0]?.toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, color: T.primary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.full_name || "No Name"}</p>
                                                    <p style={{ fontSize: 11, color: T.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                                                </div>
                                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, backgroundColor: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: T.purple }}>
                                                    {user.subscription_tier || "starter"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {transferSearch.length >= 2 && transferSearchResults.length === 0 && !transferSearching && !transferTargetUser && (
                                    <p style={{ fontSize: 11, color: T.muted, textAlign: "center", padding: "10px 0" }}>No users found</p>
                                )}
                            </div>

                            {transferTargetUser && (
                                <div style={{ padding: "12px 14px", backgroundColor: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ padding: 7, backgroundColor: "rgba(52,211,153,0.1)", borderRadius: "50%" }}>
                                                <UserCheck className="w-4 h-4" style={{ color: T.success }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Transfer To</p>
                                                <p style={{ fontSize: 13, fontWeight: 500, color: T.primary, margin: "2px 0 0" }}>{transferTargetUser.full_name || "No Name"}</p>
                                                <p style={{ fontSize: 11, color: T.secondary, margin: 0 }}>{transferTargetUser.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setTransferTargetUser(null); setTransferSearch(""); }}
                                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surface)}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                            <X className="w-4 h-4" style={{ color: T.muted }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${T.border}` }}>
                            <button onClick={() => { setShowTransferModal(false); setTransferFunnel(null); setTransferTargetUser(null); }}
                                style={{ padding: "9px 14px", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.secondary, fontSize: 13, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={handleTransfer} disabled={!transferTargetUser || transferring}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "linear-gradient(135deg, #f97316, #f59e0b)", color: "#05080B", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: (!transferTargetUser || transferring) ? 0.4 : 1 }}>
                                {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                                {transferring ? "Transferring..." : "Confirm Transfer"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
}

/* ── small helpers ── */
function ActionBtn({ children, onClick, title, hoverColor = "rgba(255,255,255,0.06)", disabled = false }) {
    return (
        <button onClick={onClick} title={title} disabled={disabled}
            style={{ padding: 8, borderRadius: 8, background: "transparent", border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "background 0.15s", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = hoverColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            {children}
        </button>
    );
}

function SmallBtn({ children, onClick, disabled = false, color = "#B2C0CD", colorBg = "rgba(255,255,255,0.05)" }) {
    return (
        <button onClick={onClick} disabled={disabled}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 11, backgroundColor: colorBg, color, border: `1px solid ${colorBg}`, borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = disabled ? "0.5" : "1"; }}>
            {children}
        </button>
    );
}

function PaginationBtn({ children, onClick, disabled }) {
    return (
        <button onClick={onClick} disabled={disabled}
            style={{ padding: 6, backgroundColor: "#121920", border: "1px solid #1E2A34", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, color: "#B2C0CD", display: "flex", alignItems: "center", transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#1E2A34"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#121920"; }}>
            {children}
        </button>
    );
}
