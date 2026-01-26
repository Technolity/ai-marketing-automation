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
    Loader2,
    Layers,
    UserPlus,
    UserCheck,
    X,
    CheckSquare,
    FileCheck,
    FileX,
    Download
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
    const [isImportingSnapshot, setIsImportingSnapshot] = useState(null); // userId for snapshot import
    const [isMarkingSnapshot, setIsMarkingSnapshot] = useState(null); // userId for manual snapshot marking

    // GHL User Creation state
    const [isCreatingUser, setIsCreatingUser] = useState(null); // userId being created
    const [isRetryingUser, setIsRetryingUser] = useState(null); // userId being retried
    const [selectedUsers, setSelectedUsers] = useState([]); // For bulk selection
    const [isBulkCreating, setIsBulkCreating] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(null); // { total, completed, failed, results }

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

    const handleImportSnapshot = async (userId) => {
        if (isImportingSnapshot) return;
        setIsImportingSnapshot(userId);

        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/import-snapshot', {
                method: 'POST',
                body: JSON.stringify({ userId, force: true }) // Always pass force=true from UI
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Snapshot import failed');
            }

            const result = await response.json();

            // Check snapshot status and show appropriate message
            if (result.alreadyImported) {
                toast.info("Snapshot already imported for this user");
            } else if (result.snapshotStatus === 'confirmed') {
                toast.success("✅ Snapshot imported and confirmed by GHL!");
            } else if (result.snapshotStatus === 'pending') {
                toast.info("⏱️ Snapshot import in progress - may take a few minutes");
            } else if (result.snapshotStatus === 'failed') {
                toast.error("❌ Snapshot import failed");
            } else {
                toast.success("Snapshot import initiated");
            }

            // Refresh list
            fetchAccounts();
        } catch (err) {
            console.error('Snapshot import error:', err);
            toast.error(err.message || "Failed to import snapshot");
        } finally {
            setIsImportingSnapshot(null);
        }
    };

    const handleMarkSnapshotImported = async (userId) => {
        if (isMarkingSnapshot) return;
        setIsMarkingSnapshot(userId);

        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/mark-snapshot-imported', {
                method: 'POST',
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to mark snapshot as imported');
            }

            const result = await response.json();
            toast.success("✅ Snapshot marked as imported successfully!");

            // Refresh list
            fetchAccounts();
        } catch (err) {
            console.error('Mark snapshot error:', err);
            toast.error(err.message || "Failed to mark snapshot as imported");
        } finally {
            setIsMarkingSnapshot(null);
        }
    };

    const handleCreateBuilderLogin = async (userId) => {
        if (isCreatingUser) return;
        setIsCreatingUser(userId);

        try {
            const response = await fetchWithAuth('/api/admin/ghl-users/create', {
                method: 'POST',
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create GHL user');
            }

            const result = await response.json();
            toast.success(`Builder login created for user! Email sent to ${result.email}`);

            // Refresh list
            fetchAccounts();
        } catch (err) {
            console.error('Create user error:', err);
            toast.error(err.message || "Failed to create builder login");
        } finally {
            setIsCreatingUser(null);
        }
    };

    const handleRetryUserCreation = async (userId) => {
        if (isRetryingUser) return;
        setIsRetryingUser(userId);

        try {
            const response = await fetchWithAuth('/api/admin/ghl-users/retry', {
                method: 'POST',
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Retry failed');
            }

            const result = await response.json();
            toast.success("Builder login created successfully!");

            fetchAccounts();
        } catch (err) {
            console.error('Retry user error:', err);
            toast.error(err.message || "Failed to retry creation");
        } finally {
            setIsRetryingUser(null);
        }
    };

    const handleBulkCreateUsers = async () => {
        if (isBulkCreating || selectedUsers.length === 0) return;

        setIsBulkCreating(true);
        setBulkProgress({ total: selectedUsers.length, completed: 0, failed: 0, results: [] });

        try {
            const response = await fetchWithAuth('/api/admin/ghl-users/create-bulk', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedUsers })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Bulk creation failed');
            }

            const result = await response.json();
            const { summary } = result;

            setBulkProgress({
                total: summary.total,
                completed: summary.successful,
                failed: summary.failed,
                results: summary.results
            });

            if (summary.successful > 0) {
                toast.success(`Created ${summary.successful} builder login${summary.successful > 1 ? 's' : ''}!`);
            }

            if (summary.failed > 0) {
                toast.error(`${summary.failed} creation${summary.failed > 1 ? 's' : ''} failed. Check the results.`);
            }

            // Refresh list
            fetchAccounts();
        } catch (err) {
            console.error('Bulk create error:', err);
            toast.error(err.message || "Bulk creation failed");
            setBulkProgress(null);
        } finally {
            setIsBulkCreating(false);
            setSelectedUsers([]);
        }
    };

    const handleBulkImportSnapshots = async () => {
        if (isBulkCreating || selectedUsers.length === 0) return;

        setIsBulkCreating(true);
        setBulkProgress({ total: selectedUsers.length, completed: 0, failed: 0, results: [] });

        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/import-snapshot-bulk', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedUsers })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Bulk snapshot import failed');
            }

            const result = await response.json();

            setBulkProgress({
                total: result.total,
                completed: result.successful,
                failed: result.failed,
                results: result.results
            });

            if (result.successful > 0) {
                toast.success(`Imported snapshots for ${result.successful} user${result.successful > 1 ? 's' : ''}!`);
            }

            if (result.failed > 0) {
                toast.error(`${result.failed} snapshot import${result.failed > 1 ? 's' : ''} failed. Check the results.`);
            }

            // Refresh list
            fetchAccounts();
        } catch (err) {
            console.error('Bulk snapshot import error:', err);
            toast.error(err.message || "Bulk snapshot import failed");
            setBulkProgress(null);
        } finally {
            setIsBulkCreating(false);
            setSelectedUsers([]);
        }
    };

    const handleBulkSetupSubaccounts = async () => {
        if (isBulkCreating || selectedUsers.length === 0) return;

        setIsBulkCreating(true);
        setBulkProgress({ total: selectedUsers.length, completed: 0, failed: 0, results: [] });

        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/setup-bulk', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedUsers })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Bulk setup failed');
            }

            const result = await response.json();

            setBulkProgress({
                total: result.total,
                completed: result.successful,
                failed: result.failed,
                results: result.results
            });

            let message = [];
            if (result.created > 0) message.push(`${result.created} subaccount${result.created > 1 ? 's' : ''} created`);
            if (result.imported > 0) message.push(`${result.imported} snapshot${result.imported > 1 ? 's' : ''} imported`);
            if (result.skipped > 0) message.push(`${result.skipped} skipped`);

            if (result.successful > 0) {
                toast.success(message.join(', '));
            }

            if (result.failed > 0) {
                toast.error(`${result.failed} operation${result.failed > 1 ? 's' : ''} failed. Check the results.`);
            }

            // Refresh list
            fetchAccounts();
        } catch (err) {
            console.error('Bulk setup error:', err);
            toast.error(err.message || "Bulk setup failed");
            setBulkProgress(null);
        } finally {
            setIsBulkCreating(false);
            setSelectedUsers([]);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        const selectableUsers = accounts.filter(acc => acc.has_subaccount);
        if (selectedUsers.length === selectableUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(selectableUsers.map(acc => acc.id));
        }
    };

    const closeBulkModal = () => {
        setBulkProgress(null);
        setSelectedUsers([]);
    };

    const columns = useMemo(
        () => [
            {
                id: "select",
                header: () => (
                    <input
                        type="checkbox"
                        checked={selectedUsers.length > 0 && selectedUsers.length === accounts.filter(acc => acc.has_subaccount).length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-600 bg-[#0e0e0f] text-cyan focus:ring-cyan focus:ring-offset-0"
                    />
                ),
                cell: ({ row }) => {
                    const canCreate = row.original.can_create_user;
                    if (!canCreate) return null;

                    return (
                        <input
                            type="checkbox"
                            checked={selectedUsers.includes(row.original.id)}
                            onChange={() => toggleUserSelection(row.original.id)}
                            className="w-4 h-4 rounded border-gray-600 bg-[#0e0e0f] text-cyan focus:ring-cyan focus:ring-offset-0"
                        />
                    );
                },
            },
            {
                accessorKey: "profile_complete",
                header: "Profile",
                cell: ({ row }) => {
                    const hasRequiredFields = row.original.first_name &&
                                             row.original.last_name &&
                                             row.original.address &&
                                             row.original.email;

                    if (hasRequiredFields) {
                        return (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                                <FileCheck className="w-3 h-3" />
                                Complete
                            </div>
                        );
                    }

                    return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-orange-500/20 text-orange-400 border-orange-500/30">
                            <FileX className="w-3 h-3" />
                            Incomplete
                        </div>
                    );
                }
            },
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
                accessorKey: "snapshot_status",
                header: "Snapshot",
                cell: ({ row }) => {
                    const { has_subaccount, snapshot_imported, snapshot_status } = row.original;

                    // No sub-account yet
                    if (!has_subaccount) {
                        return <span className="text-gray-600 text-xs">No account</span>;
                    }

                    // Snapshot imported
                    if (snapshot_imported) {
                        return (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="w-3 h-3" />
                                Imported
                            </div>
                        );
                    }

                    // Snapshot failed
                    if (snapshot_status === 'failed') {
                        return (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30">
                                <XCircle className="w-3 h-3" />
                                Failed
                            </div>
                        );
                    }

                    // Snapshot pending
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Clock className="w-3 h-3" />
                            Pending
                        </div>
                    );
                }
            },
            {
                accessorKey: "builder_login",
                header: "Builder Login",
                cell: ({ row }) => {
                    const hasGHLUser = row.original.has_ghl_user;
                    const invited = row.original.ghl_user_invited;
                    const error = row.original.ghl_user_creation_error;

                    if (error) {
                        return (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30" title={error}>
                                <XCircle className="w-3 h-3" />
                                Failed
                            </div>
                        );
                    }

                    if (hasGHLUser) {
                        return (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                                <UserCheck className="w-3 h-3" />
                                {invited ? 'Created' : 'Active'}
                            </div>
                        );
                    }

                    return <span className="text-gray-600 text-xs">Not Created</span>;
                }
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const status = row.original.ghl_sync_status;
                    const hasSubaccount = row.original.has_subaccount;
                    const snapshotImported = row.original.snapshot_imported;
                    const snapshotStatus = row.original.snapshot_status;
                    const hasGHLUser = row.original.has_ghl_user;
                    const userCreationError = row.original.ghl_user_creation_error;

                    const canRetry = ['failed', 'permanently_failed', 'pending', 'not_synced'].includes(status) && !hasSubaccount;
                    const canImportSnapshot = hasSubaccount;
                    const canMarkSnapshot = hasSubaccount && !snapshotImported; // Show manual mark button
                    const canCreateUser = hasSubaccount && !hasGHLUser; // Show for ALL users with subaccount
                    const canRetryUser = hasSubaccount && userCreationError && !hasGHLUser;

                    return (
                        <div className="flex items-center gap-1">
                            {/* Retry Subaccount button */}
                            {canRetry && (
                                <button
                                    onClick={() => handleRetry(row.original.id)}
                                    disabled={isRetrying === row.original.id}
                                    className="p-2 hover:bg-cyan/10 text-cyan rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Create Sub-Account"
                                >
                                    <RotateCcw className={`w-4 h-4 ${isRetrying === row.original.id ? 'animate-spin' : ''}`} />
                                </button>
                            )}

                            {/* Import Snapshot button */}
                            {canImportSnapshot && (
                                <button
                                    onClick={() => handleImportSnapshot(row.original.id)}
                                    disabled={isImportingSnapshot === row.original.id}
                                    className="p-2 hover:bg-purple-500/10 text-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={snapshotImported ? "Re-Import Snapshot" : "Import Snapshot"}
                                >
                                    {isImportingSnapshot === row.original.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Layers className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {/* Manual Mark Snapshot as Imported button */}
                            {canMarkSnapshot && (
                                <button
                                    onClick={() => handleMarkSnapshotImported(row.original.id)}
                                    disabled={isMarkingSnapshot === row.original.id}
                                    className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Mark Snapshot as Imported (Manual)"
                                >
                                    {isMarkingSnapshot === row.original.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckSquare className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {/* Create Builder Login button - Show for ALL users with subaccount */}
                            {canCreateUser && (
                                <button
                                    onClick={() => handleCreateBuilderLogin(row.original.id)}
                                    disabled={isCreatingUser === row.original.id}
                                    className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Create Builder Login"
                                >
                                    {isCreatingUser === row.original.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <UserPlus className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {/* Retry User Creation button */}
                            {canRetryUser && (
                                <button
                                    onClick={() => handleRetryUserCreation(row.original.id)}
                                    disabled={isRetryingUser === row.original.id}
                                    className="p-2 hover:bg-orange-500/10 text-orange-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Retry Builder Login Creation"
                                >
                                    <RotateCcw className={`w-4 h-4 ${isRetryingUser === row.original.id ? 'animate-spin' : ''}`} />
                                </button>
                            )}

                            {/* Show checkmark if everything is done */}
                            {hasSubaccount && snapshotImported && hasGHLUser && (
                                <span className="text-green-400 p-2">
                                    <CheckCircle className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                    );
                },
            },
        ],
        [isRetrying, isImportingSnapshot, isMarkingSnapshot, isCreatingUser, isRetryingUser, selectedUsers, accounts]
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

            {/* Bulk Selection Toolbar */}
            {selectedUsers.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-[#1b1b1d] border border-cyan/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{selectedUsers.length}</span>
                            <span className="text-gray-400">user{selectedUsers.length > 1 ? 's' : ''} selected</span>
                        </div>

                        {selectedUsers.length > 50 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                Max 50 users at once
                            </div>
                        )}

                        <button
                            onClick={handleBulkCreateUsers}
                            disabled={isBulkCreating || selectedUsers.length > 50}
                            className="px-4 py-2 bg-gradient-to-r from-cyan to-blue-500 text-black font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isBulkCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Create Builder Logins
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleBulkImportSnapshots}
                            disabled={isBulkCreating || selectedUsers.length > 50}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isBulkCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Import Snapshots
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setSelectedUsers([])}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                            title="Clear selection"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Progress Modal */}
            {bulkProgress && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-8 w-full max-w-2xl shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Bulk Creation Progress</h2>
                            {bulkProgress.completed + bulkProgress.failed === bulkProgress.total && (
                                <button
                                    onClick={closeBulkModal}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Progress bar */}
                            <div>
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                    <span>Processing: {bulkProgress.completed + bulkProgress.failed} / {bulkProgress.total}</span>
                                    <span>{Math.round(((bulkProgress.completed + bulkProgress.failed) / bulkProgress.total) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-[#2a2a2d] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan to-blue-500 transition-all duration-300"
                                        style={{ width: `${((bulkProgress.completed + bulkProgress.failed) / bulkProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-green-400">{bulkProgress.completed}</div>
                                    <div className="text-xs text-gray-400">Successful</div>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-red-400">{bulkProgress.failed}</div>
                                    <div className="text-xs text-gray-400">Failed</div>
                                </div>
                                <div className="bg-[#2a2a2d] border border-[#3a3a3d] rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-white">{bulkProgress.total}</div>
                                    <div className="text-xs text-gray-400">Total</div>
                                </div>
                            </div>

                            {/* Results list (only show if complete) */}
                            {bulkProgress.completed + bulkProgress.failed === bulkProgress.total && bulkProgress.results && (
                                <div className="mt-4 max-h-60 overflow-y-auto">
                                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Results:</h3>
                                    <div className="space-y-2">
                                        {bulkProgress.results.map((result, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg flex items-center justify-between ${result.success
                                                    ? 'bg-green-500/10 border border-green-500/30'
                                                    : 'bg-red-500/10 border border-red-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {result.success ? (
                                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-400" />
                                                    )}
                                                    <span className="text-sm text-white">
                                                        {result.email || result.userId}
                                                    </span>
                                                </div>
                                                {!result.success && result.error && (
                                                    <span className="text-xs text-red-400">{result.error}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Close button when complete */}
                            {bulkProgress.completed + bulkProgress.failed === bulkProgress.total && (
                                <button
                                    onClick={closeBulkModal}
                                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-cyan to-blue-500 text-black font-bold rounded-lg hover:brightness-110 transition-all"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
