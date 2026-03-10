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
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const statusColors = {
    not_started: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
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
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${type === 'success'
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
    const [editValue, setEditValue] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [toast, setToast] = useState(null);

    // ── Version History state ────────────────────────────────
    // historyField: { sectionId } — which section's history is being viewed
    const [historyField, setHistoryField] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    // Section-level snapshots from vault_content
    const [historySectionVersions, setHistorySectionVersions] = useState([]);
    // Field-level versions from vault_content_fields
    const [historyFieldVersions, setHistoryFieldVersions] = useState([]);
    // Available field_ids in vault_content_fields for the dropdown
    const [historyAvailableFields, setHistoryAvailableFields] = useState([]);
    // Active tab: 'sections' or 'fields'
    const [historyTab, setHistoryTab] = useState('sections');
    // Selected field_id filter for the fields tab
    const [historyFieldFilter, setHistoryFieldFilter] = useState(null);
    // The version object selected for preview
    const [selectedHistoryVersion, setSelectedHistoryVersion] = useState(null);
    const [restoringVersion, setRestoringVersion] = useState(false);
    // ── Bulk Approve state ────────────────────────────────────
    const [approvingSection, setApprovingSection] = useState(null); // section_id currently being approved

    const fetchFunnels = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (filterUserId) params.append('userId', filterUserId);
            if (statusFilter) params.append('status', statusFilter);
            if (debouncedSearch) params.append('search', debouncedSearch);

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
    }, [session, pagination.page, pagination.limit, filterUserId, statusFilter, debouncedSearch]);

    // Debounced search handler
    const handleSearchChange = useCallback((value) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 400);
    }, []);

    useEffect(() => {
        if (!authLoading && session) {
            fetchFunnels();
        }
    }, [authLoading, session, fetchFunnels]);

    const handleFunnelAction = useCallback(async (funnelId, action) => {
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

            const actionLabels = {
                reset_status: 'Funnel status reset',
                delete: 'Funnel deleted',
                retry_generation: 'Generation retry initiated',
                force_complete: 'Funnel marked as complete'
            };

            setToast({ message: actionLabels[action] || 'Action completed successfully!', type: 'success' });
            console.log(`✓ Action '${action}' completed for funnel ${funnelId}`);

            // Refresh funnels list
            fetchFunnels();
        } catch (error) {
            console.error(`Error performing action ${action}:`, error);
            setToast({ message: `Failed: ${error.message}`, type: 'error' });
        }
    }, [fetchFunnels]);

    const handleViewVault = (funnel) => {
        setSelectedFunnel(funnel);
        setExpandedSections(new Set());
        setEditingItem(null);
        // Reset version history state when opening a new funnel
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
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    // ── Version History Handlers ─────────────────────────────

    /**
     * Fetch ALL version history (both section + field-level) for a section.
     * Called when admin clicks "History" on a section inside the vault modal.
     */
    const handleFetchHistory = useCallback(async (sectionId) => {
        if (!selectedFunnel) return;

        console.log(`[AdminHistory] Fetching FULL history for section=${sectionId}`);
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
                throw new Error(errData.error || 'Failed to fetch history');
            }

            const data = await response.json();
            const sv = data.sectionVersions || [];
            const fv = data.fieldVersions || [];
            const af = data.availableFieldIds || [];

            console.log(`[AdminHistory] Got ${sv.length} section versions + ${fv.length} field versions across ${af.length} fields`);

            setHistorySectionVersions(sv);
            setHistoryFieldVersions(fv);
            setHistoryAvailableFields(af);

            // Default to 'fields' tab if field-level data exists, else 'sections'
            if (fv.length > 0) {
                setHistoryTab('fields');
                // Default to the first available field
                if (af.length > 0) setHistoryFieldFilter(af[0]);
            } else {
                setHistoryTab('sections');
            }
        } catch (error) {
            console.error('[AdminHistory] Error fetching history:', error);
            setToast({ message: `Failed to load history: ${error.message}`, type: 'error' });
            setHistoryField(null);
        } finally {
            setHistoryLoading(false);
        }
    }, [selectedFunnel]);

    /**
     * Restore a previously saved version.
     * Determines the correct source (vault_content vs vault_content_fields) from the active tab.
     */
    const handleRestoreVersion = useCallback(async (targetVersion) => {
        if (!selectedFunnel || !historyField) return;

        // Determine source from the active tab
        const source = historyTab === 'fields' ? 'vault_content_fields' : 'vault_content';
        const label = historyTab === 'fields'
            ? `${historyFieldFilter} (v${targetVersion})`
            : `section snapshot v${targetVersion}`;

        const confirmed = confirm(
            `Are you sure you want to restore ${label}?\n\nThis will make the old data the current active version for the user.`
        );
        if (!confirmed) return;

        console.log(`[AdminHistory] Restoring ${historyField.sectionId} to v${targetVersion} (source: ${source})`);
        setRestoringVersion(true);

        try {
            const response = await fetchWithAuth(
                `/api/admin/funnels/${selectedFunnel.id}/vault/restore`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionId: historyField.sectionId,
                        fieldId: historyTab === 'fields' ? historyFieldFilter : null,
                        targetVersion,
                        source,
                    }),
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to restore version');
            }

            setToast({ message: `Restored to version ${targetVersion} successfully!`, type: 'success' });

            // Re-fetch history to reflect the new state
            await handleFetchHistory(historyField.sectionId);

            // Refresh the funnel data so the modal reflects the restored content
            fetchFunnels();
        } catch (error) {
            console.error('[AdminHistory] Error restoring version:', error);
            setToast({ message: `Restore failed: ${error.message}`, type: 'error' });
        } finally {
            setRestoringVersion(false);
        }
    }, [selectedFunnel, historyField, historyTab, historyFieldFilter, handleFetchHistory, fetchFunnels]);

    /** Close the history panel and go back to normal content view */
    const closeHistory = useCallback(() => {
        setHistoryField(null);
        setHistorySectionVersions([]);
        setHistoryFieldVersions([]);
        setHistoryAvailableFields([]);
        setSelectedHistoryVersion(null);
        setHistoryFieldFilter(null);
    }, []);

    // ── Bulk Approve Handler ──────────────────────────────────
    const handleBulkApprove = useCallback(async (sectionId) => {
        if (!selectedFunnel) return;

        const confirmed = confirm(
            `Approve ALL fields in section "${sectionId}"?\n\nThis will mark every current-version field as approved and sync the vault_content status.`
        );
        if (!confirmed) return;

        console.log(`[AdminBulkApprove] Approving section=${sectionId} for funnel=${selectedFunnel.id}`);
        setApprovingSection(sectionId);

        try {
            const response = await fetchWithAuth(
                `/api/admin/funnels/${selectedFunnel.id}/vault/approve`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionId,
                        approved: true,
                    }),
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to approve section');
            }

            const result = await response.json();
            console.log(`[AdminBulkApprove] ✓ Section ${sectionId} approved:`, result);
            setToast({ message: `Section "${sectionId}" approved (${result.updatedCount} fields)`, type: 'success' });

            // Refresh funnel data to reflect new approval status
            fetchFunnels();
        } catch (error) {
            console.error('[AdminBulkApprove] Error:', error);
            setToast({ message: `Approve failed: ${error.message}`, type: 'error' });
        } finally {
            setApprovingSection(null);
        }
    }, [selectedFunnel, fetchFunnels]);

    const handleStartEdit = (item) => {
        setEditingItem(item.id);
        setEditValue(JSON.stringify(item.content, null, 2));
    };

    /**
     * Save edits to vault content.
     * @param {Object} item - The vault_content item being edited
     * @param {boolean} approve - If true, also approve the content via admin fields endpoint
     */
    const handleSaveEdit = async (item, approve = false) => {
        setSavingEdit(true);
        try {
            let parsedContent;
            try {
                parsedContent = JSON.parse(editValue);
            } catch {
                setToast({ message: 'Invalid JSON format', type: 'error' });
                setSavingEdit(false);
                return;
            }

            // Step 1: Save the vault_content (section-level JSON) as before
            console.log(`[AdminEdit] Saving vault content for section ${item.section_id}, approve=${approve}`);
            const response = await fetchWithAuth('/api/admin/funnels', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnelId: selectedFunnel.id,
                    action: 'update_vault_content',
                    vaultItemId: item.id,
                    content: parsedContent
                })
            });

            if (!response.ok) throw new Error('Failed to save vault content');

            // Step 2: If approve=true, also bulk-approve all fields in this section
            if (approve) {
                console.log(`[AdminEdit] Also approving section ${item.section_id}`);
                const approveResp = await fetchWithAuth(
                    `/api/admin/funnels/${selectedFunnel.id}/vault/approve`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sectionId: item.section_id,
                            approved: true,
                        }),
                    }
                );

                if (!approveResp.ok) {
                    const errData = await approveResp.json();
                    console.warn('[AdminEdit] Approval failed (content was saved):', errData.error);
                    setToast({ message: `Content saved but approval failed: ${errData.error}`, type: 'error' });
                    setEditingItem(null);
                    fetchFunnels();
                    return;
                }

                const approveResult = await approveResp.json();
                console.log(`[AdminEdit] ✓ Section approved: ${approveResult.updatedCount} fields`);
                setToast({ message: `Content saved & approved (${approveResult.updatedCount} fields)!`, type: 'success' });
            } else {
                setToast({ message: 'Vault content saved as draft!', type: 'success' });
            }

            setEditingItem(null);
            fetchFunnels();
        } catch (error) {
            console.error('[AdminEdit] Error saving vault content:', error);
            setToast({ message: `Save failed: ${error.message}`, type: 'error' });
        } finally {
            setSavingEdit(false);
        }
    };

    const renderContentValue = (value, level = 0) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-500 italic">null</span>;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-gray-500 italic">[]</span>;
            return (
                <ul className="list-disc list-inside space-y-1 ml-4">
                    {value.map((item, idx) => (
                        <li key={idx} className="text-gray-300">
                            {typeof item === 'object' ? renderContentValue(item, level + 1) : String(item)}
                        </li>
                    ))}
                </ul>
            );
        }
        if (typeof value === 'object') {
            return (
                <div className={`space-y-2 ${level > 0 ? 'ml-4 pl-4 border-l border-gray-700' : ''}`}>
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k}>
                            <span className="text-cyan font-medium">{k}:</span>{' '}
                            <span className="text-gray-300">{renderContentValue(v, level + 1)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        if (typeof value === 'string' && value.length > 200) {
            return <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{value}</p>;
        }
        return <span className="text-gray-300">{String(value)}</span>;
    };



    const columns = useMemo(
        () => [
            {
                accessorKey: "funnel_name",
                header: "Funnel Name",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium text-white">
                            {row.original.funnel_name || 'Unnamed Funnel'}
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
                id: "progress_status",
                header: "Progress & Status",
                cell: ({ row }) => {
                    const progress = row.original.progress_percent || 0;
                    const isDeployed = row.original.is_deployed;
                    const vaultItems = row.original.vault_items_count || 0;

                    const barColor = progress >= 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-cyan' : 'bg-gray-600';
                    const textColor = progress >= 100 ? 'text-emerald-400' : progress > 0 ? 'text-cyan' : 'text-gray-500';

                    return (
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {/* Progress bar */}
                            <div className="flex items-center gap-2.5">
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-bold ${textColor} min-w-[32px] text-right`}>
                                    {progress}%
                                </span>
                            </div>
                            {/* Deployment badge */}
                            <div className="flex items-center gap-1.5">
                                {isDeployed ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        <Rocket className="w-3 h-3" />
                                        Deployed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                                        Not Deployed
                                    </span>
                                )}
                                {vaultItems > 0 && (
                                    <span className="text-[10px] text-gray-500">
                                        {vaultItems} sections
                                    </span>
                                )}
                            </div>
                        </div>
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
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewVault(row.original)}
                            className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all group border border-transparent hover:border-cyan/30"
                            title="View vault content"
                        >
                            <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan transition-colors" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                if (confirm(`Are you sure you want to reset the funnel "${row.original.business_name || 'Unnamed'}" to not started?`)) {
                                    handleFunnelAction(row.original.id, 'reset_status');
                                }
                            }}
                            className="p-2.5 hover:bg-blue-500/20 rounded-xl transition-all group border border-transparent hover:border-blue-500/30"
                            title="Reset to not started"
                        >
                            <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </motion.button>

                        {row.original.vault_generation_status === 'failed' && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleFunnelAction(row.original.id, 'retry_generation')}
                                className="p-2.5 hover:bg-yellow-500/20 rounded-xl transition-all group border border-transparent hover:border-yellow-500/30"
                                title="Retry generation"
                            >
                                <PlayCircle className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                if (confirm(`Are you sure you want to delete the funnel "${row.original.business_name}"? This action cannot be undone.`)) {
                                    handleFunnelAction(row.original.id, 'delete');
                                }
                            }}
                            className="p-2.5 hover:bg-red-500/20 rounded-xl transition-all group border border-transparent hover:border-red-500/30"
                            title="Delete funnel"
                        >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                        </motion.button>
                    </div>
                ),
            },
        ],
        [handleFunnelAction]
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
                        {filterUserId && (
                            <motion.button
                                whileHover={{ scale: 1.05, x: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/admin/users')}
                                className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all border border-transparent hover:border-cyan/30"
                            >
                                <ArrowLeft className="w-5 h-5 text-cyan" />
                            </motion.button>
                        )}
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 via-cyan/20 to-purple-500/30 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/20"
                        >
                            <FolderKanban className="w-7 h-7 text-purple-400" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                                {filterUserId ? 'User Funnels' : 'Funnel Management'}
                            </h1>
                            <p className="text-gray-400 text-sm sm:text-base mt-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                Monitor and manage funnel generation
                            </p>
                        </div>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchFunnels}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-cyan/20 hover:from-purple-500/30 hover:to-cyan/30 rounded-xl transition-all border border-purple-500/30 shadow-lg shadow-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="font-medium text-white">Refresh</span>
                    </motion.button>
                </motion.div>

                {/* Status Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(statusStats).map(([status, count], idx) => {
                        const gradients = {
                            not_started: 'from-gray-500/10 to-gray-500/5',
                            pending: 'from-yellow-500/10 to-yellow-500/5',
                            in_progress: 'from-blue-500/10 to-cyan/5',
                            completed: 'from-emerald-500/10 to-green-500/5',
                            failed: 'from-red-500/10 to-red-500/5'
                        };
                        return (
                            <motion.button
                                key={status}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                                className={`bg-gradient-to-br ${gradients[status]} rounded-2xl p-5 border transition-all shadow-lg ${statusFilter === status
                                    ? 'border-cyan/50 shadow-cyan/20 ring-2 ring-cyan/30'
                                    : statusColors[status]?.split(' ')[2] || 'border-gray-500/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className={`text-sm font-semibold uppercase tracking-wide ${statusColors[status]?.split(' ')[1]}`}>
                                        {status.replace('_', ' ')}
                                    </p>
                                    <TrendingUp className={`w-4 h-4 ${statusColors[status]?.split(' ')[1]}`} />
                                </div>
                                <p className={`text-2xl sm:text-3xl font-bold ${statusColors[status]?.split(' ')[1]}`}>
                                    {count || 0}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">funnels</p>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                    <input
                        type="text"
                        placeholder="Search by funnel name, user name, or email..."
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#0e0e0f] border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    />
                </motion.div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                            <p className="text-gray-400 text-lg font-medium">Loading funnels...</p>
                            <p className="text-gray-500 text-sm mt-1">Please wait</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <div>
                                    <table className="w-full min-w-[800px]">
                                        <thead className="bg-gradient-to-r from-[#0e0e0f] to-[#1a1a1c] sticky top-0 z-10 border-b border-purple-500/20">
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map((header) => (
                                                        <th key={header.id} className="px-4 py-3 text-left text-xs font-bold text-purple-400 uppercase tracking-wider whitespace-nowrap">
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
                                                        <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                                        <p className="text-gray-400 text-lg font-medium">No funnels found</p>
                                                        <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                table.getRowModel().rows.map((row, idx) => (
                                                    <motion.tr
                                                        key={row.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.02 }}
                                                        className="border-b border-purple-500/5 hover:bg-[#0e0e0f]/50 transition-all"
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <td key={cell.id} className="px-4 py-3">
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 border-t border-[#2a2a2d]">
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
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-[#2a2a2d] flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold">Vault Content</h2>
                                    <p className="text-gray-400 text-sm">
                                        {selectedFunnel.funnel_name || 'Unnamed Funnel'}
                                        <span className="mx-2">·</span>
                                        {selectedFunnel.user_profiles?.full_name || selectedFunnel.user_profiles?.email || ''}
                                        <span className="mx-2">·</span>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs ${statusColors[selectedFunnel.vault_generation_status] || statusColors.not_started}`}>
                                            {selectedFunnel.vault_generation_status || 'not_started'}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowVaultModal(false)}
                                    className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="overflow-y-auto flex-1 p-6">
                                {selectedFunnel.vault_items?.length > 0 ? (
                                    <div className="space-y-3">
                                        {/* Group by phase */}
                                        {(() => {
                                            const phases = {};
                                            selectedFunnel.vault_items.forEach(item => {
                                                const p = item.phase || 1;
                                                if (!phases[p]) phases[p] = [];
                                                phases[p].push(item);
                                            });
                                            return Object.entries(phases).map(([phase, items]) => (
                                                <div key={phase} className="space-y-2">
                                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">
                                                        Phase {phase} · {items.length} section{items.length !== 1 ? 's' : ''}
                                                    </h3>
                                                    {items.map(item => {
                                                        const isExpanded = expandedSections.has(item.id);
                                                        const isEditing = editingItem === item.id;
                                                        return (
                                                            <div key={item.id} className="bg-[#0e0e0f] rounded-xl border border-[#2a2a2d] overflow-hidden">
                                                                {/* Section Header - Click to expand */}
                                                                <button
                                                                    onClick={() => toggleSection(item.id)}
                                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1b1b1d] transition-colors text-left"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <FileText className="w-5 h-5 text-cyan shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <span className="font-medium text-white block truncate">
                                                                                {item.section_title || item.section_id}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                v{item.version} · {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[item.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                                                            {item.status}
                                                                        </span>
                                                                        {isExpanded ? (
                                                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                                                        ) : (
                                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                                        )}
                                                                    </div>
                                                                </button>

                                                                {/* Expanded Content */}
                                                                <AnimatePresence>
                                                                    {isExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="border-t border-[#2a2a2d]"
                                                                        >
                                                                            <div className="p-4">
                                                                                {/* Action bar */}
                                                                                <div className="flex items-center justify-end gap-2 mb-3">
                                                                                    {isEditing ? (
                                                                                        <>
                                                                                            <button
                                                                                                onClick={() => setEditingItem(null)}
                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg transition-colors"
                                                                                            >
                                                                                                <X className="w-3.5 h-3.5" />
                                                                                                Cancel
                                                                                            </button>
                                                                                            {/* Save Draft — saves JSON without changing approval */}
                                                                                            <button
                                                                                                onClick={() => handleSaveEdit(item, false)}
                                                                                                disabled={savingEdit}
                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan/20 hover:bg-cyan/30 text-cyan rounded-lg transition-colors disabled:opacity-50"
                                                                                            >
                                                                                                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                                                Save Draft
                                                                                            </button>
                                                                                            {/* Save & Approve — saves JSON AND marks all fields as approved */}
                                                                                            <button
                                                                                                onClick={() => handleSaveEdit(item, true)}
                                                                                                disabled={savingEdit}
                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                                                                                            >
                                                                                                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                                                                                Save & Approve
                                                                                            </button>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            {/* History button — opens field-level version history */}
                                                                                            {historyField?.sectionId === item.section_id ? (
                                                                                                <button
                                                                                                    onClick={closeHistory}
                                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                                                                                                >
                                                                                                    <X className="w-3.5 h-3.5" />
                                                                                                    Close History
                                                                                                </button>
                                                                                            ) : (
                                                                                                <button
                                                                                                    onClick={() => handleFetchHistory(item.section_id)}
                                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#2a2a2d] hover:bg-purple-500/20 hover:text-purple-400 rounded-lg transition-colors"
                                                                                                >
                                                                                                    <History className="w-3.5 h-3.5" />
                                                                                                    History
                                                                                                </button>
                                                                                            )}

                                                                                            {/* Bulk Approve button — approves ALL fields in this section */}
                                                                                            <button
                                                                                                onClick={() => handleBulkApprove(item.section_id)}
                                                                                                disabled={approvingSection === item.section_id}
                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                                                                                            >
                                                                                                {approvingSection === item.section_id
                                                                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                                    : <ShieldCheck className="w-3.5 h-3.5" />
                                                                                                }
                                                                                                {approvingSection === item.section_id ? 'Approving...' : 'Bulk Approve'}
                                                                                            </button>

                                                                                            <button
                                                                                                onClick={() => handleStartEdit(item)}
                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg transition-colors"
                                                                                            >
                                                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                                                Edit JSON
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>

                                                                                {/* ── Version History Panel (Tabbed: Sections + Fields) ─── */}
                                                                                {historyField?.sectionId === item.section_id && !isEditing && (() => {
                                                                                    // Compute visible versions based on active tab + field filter
                                                                                    const activeVersions = historyTab === 'sections'
                                                                                        ? historySectionVersions
                                                                                        : historyFieldFilter
                                                                                            ? historyFieldVersions.filter(v => v.field_id === historyFieldFilter)
                                                                                            : historyFieldVersions;

                                                                                    return (
                                                                                        <div className="mb-4 bg-[#1b1b1d] border border-purple-500/20 rounded-xl p-4 space-y-4">

                                                                                            {/* ── Tab switcher ──────────────────────────── */}
                                                                                            <div className="flex items-center gap-1 bg-[#0e0e0f] p-1 rounded-lg w-fit">
                                                                                                <button
                                                                                                    onClick={() => { setHistoryTab('sections'); setSelectedHistoryVersion(null); }}
                                                                                                    className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${historyTab === 'sections'
                                                                                                        ? 'bg-purple-500/20 text-purple-400 shadow-sm'
                                                                                                        : 'text-gray-500 hover:text-gray-300'
                                                                                                        }`}
                                                                                                >
                                                                                                    Section Snapshots ({historySectionVersions.length})
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => { setHistoryTab('fields'); setSelectedHistoryVersion(null); }}
                                                                                                    className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${historyTab === 'fields'
                                                                                                        ? 'bg-purple-500/20 text-purple-400 shadow-sm'
                                                                                                        : 'text-gray-500 hover:text-gray-300'
                                                                                                        }`}
                                                                                                >
                                                                                                    Field History ({historyFieldVersions.length})
                                                                                                </button>
                                                                                            </div>

                                                                                            {/* ── Tab info / field filter ───────────────── */}
                                                                                            {historyTab === 'sections' ? (
                                                                                                <p className="text-[11px] text-gray-500 leading-relaxed">
                                                                                                    Full section snapshots from each generation/regeneration. Each version contains the entire section content.
                                                                                                </p>
                                                                                            ) : (
                                                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                                                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Field:</label>
                                                                                                    {historyAvailableFields.length > 0 ? (
                                                                                                        <select
                                                                                                            value={historyFieldFilter || ''}
                                                                                                            onChange={(e) => {
                                                                                                                setHistoryFieldFilter(e.target.value);
                                                                                                                setSelectedHistoryVersion(null);
                                                                                                            }}
                                                                                                            className="bg-[#0e0e0f] border border-[#2a2a2d] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-400 transition-colors min-w-[200px]"
                                                                                                        >
                                                                                                            {historyAvailableFields.map(fid => (
                                                                                                                <option key={fid} value={fid}>{fid}</option>
                                                                                                            ))}
                                                                                                        </select>
                                                                                                    ) : (
                                                                                                        <span className="text-xs text-gray-500 italic">No field-level edits recorded yet</span>
                                                                                                    )}
                                                                                                    <span className="text-xs text-gray-500">
                                                                                                        {activeVersions.length} version{activeVersions.length !== 1 ? 's' : ''}
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* ── Version list ──────────────────────────── */}
                                                                                            {historyLoading ? (
                                                                                                <div className="flex items-center justify-center py-8">
                                                                                                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                                                                                </div>
                                                                                            ) : activeVersions.length === 0 ? (
                                                                                                <p className="text-gray-500 text-sm text-center py-4">
                                                                                                    {historyTab === 'sections'
                                                                                                        ? 'No section snapshots found.'
                                                                                                        : 'No field-level history found. Field edits are tracked after the versioning system was enabled.'}
                                                                                                </p>
                                                                                            ) : (
                                                                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                                                                    {activeVersions.map((ver) => {
                                                                                                        const isSelected = selectedHistoryVersion?.id === ver.id;
                                                                                                        const isCurrent = ver.is_current_version;
                                                                                                        return (
                                                                                                            <button
                                                                                                                key={ver.id}
                                                                                                                onClick={() => setSelectedHistoryVersion(ver)}
                                                                                                                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all text-xs ${isSelected
                                                                                                                    ? 'border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/30'
                                                                                                                    : 'border-[#2a2a2d] bg-[#0e0e0f] hover:border-gray-600'
                                                                                                                    }`}
                                                                                                            >
                                                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                                                    <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                                                                                    <span className="font-medium text-white">v{ver.version}</span>
                                                                                                                    {/* Show field_id label on fields tab */}
                                                                                                                    {historyTab === 'fields' && ver.field_id && (
                                                                                                                        <span className="px-1.5 py-0.5 bg-[#2a2a2d] text-gray-400 rounded text-[10px]">
                                                                                                                            {ver.field_id}
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                    {isCurrent && (
                                                                                                                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-semibold">
                                                                                                                            CURRENT
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                    {ver.is_approved && (
                                                                                                                        <span className="px-1.5 py-0.5 bg-cyan/20 text-cyan rounded text-[10px] font-semibold">
                                                                                                                            APPROVED
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                    {/* Section status badge */}
                                                                                                                    {historyTab === 'sections' && ver.status && (
                                                                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${ver.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400'
                                                                                                                            : ver.status === 'generated' ? 'bg-blue-500/10 text-blue-400'
                                                                                                                                : 'bg-gray-500/10 text-gray-400'
                                                                                                                            }`}>
                                                                                                                            {ver.status}
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <span className="text-gray-500 shrink-0">
                                                                                                                    {new Date(ver.updated_at || ver.created_at).toLocaleString('en-US', {
                                                                                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                                                                                        hour: '2-digit', minute: '2-digit'
                                                                                                                    })}
                                                                                                                </span>
                                                                                                            </button>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            )}

                                                                                            {/* ── Selected version preview + restore ────── */}
                                                                                            {selectedHistoryVersion && (
                                                                                                <div className="border-t border-[#2a2a2d] pt-4 space-y-3">
                                                                                                    <div className="flex items-center justify-between">
                                                                                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                                                            Preview — v{selectedHistoryVersion.version}
                                                                                                            {selectedHistoryVersion.is_current_version && ' (Current)'}
                                                                                                            {historyTab === 'fields' && selectedHistoryVersion.field_id && (
                                                                                                                <span className="ml-2 text-purple-400">{selectedHistoryVersion.field_id}</span>
                                                                                                            )}
                                                                                                        </h4>
                                                                                                        {/* Restore button for non-current versions */}
                                                                                                        {!selectedHistoryVersion.is_current_version && (
                                                                                                            <button
                                                                                                                onClick={() => handleRestoreVersion(selectedHistoryVersion.version)}
                                                                                                                disabled={restoringVersion}
                                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg transition-colors disabled:opacity-50"
                                                                                                            >
                                                                                                                {restoringVersion ? (
                                                                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                                                ) : (
                                                                                                                    <Undo2 className="w-3.5 h-3.5" />
                                                                                                                )}
                                                                                                                Restore this version
                                                                                                            </button>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    {/* Read-only JSON view */}
                                                                                                    <div className="max-h-64 overflow-y-auto bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-3 custom-scrollbar">
                                                                                                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                                                                                                            {(() => {
                                                                                                                // For section versions use .content, for field versions use .field_value
                                                                                                                const previewData = historyTab === 'sections'
                                                                                                                    ? selectedHistoryVersion.content
                                                                                                                    : selectedHistoryVersion.field_value;
                                                                                                                return typeof previewData === 'object'
                                                                                                                    ? JSON.stringify(previewData, null, 2)
                                                                                                                    : String(previewData ?? 'null');
                                                                                                            })()}
                                                                                                        </pre>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}

                                                                                {/* Content display or editor (shown when NOT in history mode for this section) */}
                                                                                {isEditing ? (
                                                                                    <textarea
                                                                                        value={editValue}
                                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                                        className="w-full h-96 p-4 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-sm text-gray-300 font-mono resize-y focus:outline-none focus:border-cyan transition-colors"
                                                                                        spellCheck={false}
                                                                                    />
                                                                                ) : historyField?.sectionId !== item.section_id ? (
                                                                                    <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                                                                        {item.content ? (
                                                                                            renderContentValue(item.content)
                                                                                        ) : (
                                                                                            <p className="text-gray-500 italic">No content data</p>
                                                                                        )}
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
