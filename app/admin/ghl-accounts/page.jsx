"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    useReactTable,
    getCoreRowModel,
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
    Download,
    Edit,
    Filter,
    Link2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

const T = {
    cardBg: "#0D1217",
    surface: "#121920",
    border: "#1E2A34",
    cyan: "#16C7E7",
    primary: "#F4F8FB",
    secondary: "#B2C0CD",
    muted: "#5a6a78",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",
    purple: "#a78bfa",
    orange: "#fb923c",
    amber: "#f59e0b",
};

const STATUS_STYLE = {
    synced: { background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" },
    pending: { background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
    failed: { background: "rgba(251,146,60,0.12)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" },
    permanently_failed: { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" },
    not_synced: { background: "rgba(90,106,120,0.12)", color: "#5a6a78", border: "1px solid rgba(90,106,120,0.25)" }
};

const statusIcons = {
    synced: CheckCircle,
    pending: Clock,
    failed: AlertTriangle,
    permanently_failed: XCircle,
    not_synced: Building2
};

function Badge({ children, style: extraStyle }) {
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500,
            ...extraStyle
        }}>
            {children}
        </div>
    );
}

function ActionBtn({ onClick, disabled, title, color = T.cyan, children }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: 30, height: 30, borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color, opacity: disabled ? 0.4 : 1,
                backgroundColor: hovered && !disabled ? `${color}18` : "transparent",
                transition: "background-color 0.15s ease",
            }}
        >
            {children}
        </button>
    );
}

export default function AdminGHLAccounts() {
    const { session, loading: authLoading } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const debounceRef = useRef(null);
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [stats, setStats] = useState({ synced: 0, pending: 0, failed: 0, permanently_failed: 0, total: 0 });
    const [isRetrying, setIsRetrying] = useState(null);
    const [isImportingSnapshot, setIsImportingSnapshot] = useState(null);
    const [isMarkingSnapshot, setIsMarkingSnapshot] = useState(null);
    const [isCreatingUser, setIsCreatingUser] = useState(null);
    const [isRetryingUser, setIsRetryingUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isBulkCreating, setIsBulkCreating] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(null);
    const [activeFilter, setActiveFilter] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isRefreshingToken, setIsRefreshingToken] = useState(null);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkingUser, setLinkingUser] = useState(null);
    const [linkLocationId, setLinkLocationId] = useState('');
    const [isLinkingLocation, setIsLinkingLocation] = useState(false);

    const fetchAccounts = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: debouncedSearch,
                ...(activeFilter && { filter: activeFilter })
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
    }, [session, pagination.page, pagination.limit, debouncedSearch, activeFilter]);

    const handleSearchChange = useCallback((value) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 400);
    }, []);

    useEffect(() => {
        if (!authLoading && session) fetchAccounts();
    }, [authLoading, session, fetchAccounts]);

    const handleRetry = useCallback(async (userId) => {
        if (isRetrying) return;
        setIsRetrying(userId);
        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/retry', {
                method: 'POST', body: JSON.stringify({ userId })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Retry failed'); }
            toast.success("Retry initiated successfully!");
            fetchAccounts();
        } catch (err) { toast.error(err.message || "Failed to retry creation"); }
        finally { setIsRetrying(null); }
    }, [isRetrying, fetchAccounts]);

    const handleImportSnapshot = useCallback(async (userId) => {
        if (isImportingSnapshot) return;
        setIsImportingSnapshot(userId);
        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/import-snapshot', {
                method: 'POST', body: JSON.stringify({ userId, force: true })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Snapshot import failed'); }
            const result = await response.json();
            if (result.alreadyImported) toast.info("Snapshot already imported for this user");
            else if (result.snapshotStatus === 'confirmed') toast.success("Snapshot imported and confirmed!");
            else if (result.snapshotStatus === 'pending') toast.info("Snapshot import in progress");
            else if (result.snapshotStatus === 'failed') toast.error("Snapshot import failed");
            else toast.success("Snapshot import initiated");
            fetchAccounts();
        } catch (err) { toast.error(err.message || "Failed to import snapshot"); }
        finally { setIsImportingSnapshot(null); }
    }, [isImportingSnapshot, fetchAccounts]);

    const handleMarkSnapshotImported = useCallback(async (userId) => {
        if (isMarkingSnapshot) return;
        setIsMarkingSnapshot(userId);
        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/mark-snapshot-imported', {
                method: 'POST', body: JSON.stringify({ userId })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed to mark snapshot'); }
            toast.success("Snapshot marked as imported!");
            fetchAccounts();
        } catch (err) { toast.error(err.message || "Failed to mark snapshot"); }
        finally { setIsMarkingSnapshot(null); }
    }, [isMarkingSnapshot, fetchAccounts]);

    const handleCreateBuilderLogin = useCallback(async (userId) => {
        if (isCreatingUser) return;
        setIsCreatingUser(userId);
        try {
            const response = await fetchWithAuth('/api/admin/ghl-users/create', {
                method: 'POST', body: JSON.stringify({ userId })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed to create GHL user'); }
            const result = await response.json();
            toast.success(`Builder login created! Email sent to ${result.email}`);
            fetchAccounts();
        } catch (err) { toast.error(err.message || "Failed to create builder login"); }
        finally { setIsCreatingUser(null); }
    }, [isCreatingUser, fetchAccounts]);

    const handleRetryUserCreation = useCallback(async (userId) => {
        if (isRetryingUser) return;
        setIsRetryingUser(userId);
        try {
            const response = await fetchWithAuth('/api/admin/ghl-users/retry', {
                method: 'POST', body: JSON.stringify({ userId })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Retry failed'); }
            toast.success("Builder login created successfully!");
            fetchAccounts();
        } catch (err) { toast.error(err.message || "Failed to retry creation"); }
        finally { setIsRetryingUser(null); }
    }, [isRetryingUser, fetchAccounts]);

    const handleRefreshToken = useCallback(async (userId, companyId) => {
        if (isRefreshingToken) return;
        setIsRefreshingToken(userId);
        try {
            const response = await fetchWithAuth('/api/admin/ghl-accounts/refresh-token', {
                method: 'POST', body: JSON.stringify({ userId, companyId })
            });
            if (!response.ok) {
                const error = await response.json();
                if (error.reauthorizeRequired) toast.error("Token expired. User needs to re-authorize.");
                else throw new Error(error.error || 'Token refresh failed');
                return;
            }
            const result = await response.json();
            toast.success(`Token refreshed! Expires: ${new Date(result.expiresAt).toLocaleString()}`);
            fetchAccounts();
        } catch (err) { toast.error(err.message || "Failed to refresh token"); }
        finally { setIsRefreshingToken(null); }
    }, [isRefreshingToken, fetchAccounts]);

    const openLinkModal = useCallback((user) => {
        setLinkingUser(user);
        setLinkLocationId(user.ghl_location_id || '');
        setLinkModalOpen(true);
    }, []);

    const closeLinkModal = () => {
        setLinkModalOpen(false);
        setLinkingUser(null);
        setLinkLocationId('');
    };

    const handleLinkLocation = async () => {
        if (!linkingUser || !linkLocationId.trim()) return;
        setIsLinkingLocation(true);
        try {
            const response = await fetchWithAuth('/api/admin/ghl-subaccounts/link', {
                method: 'POST', body: JSON.stringify({ userId: linkingUser.id, locationId: linkLocationId.trim() })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed to link location'); }
            const result = await response.json();
            toast.success(`Linked to "${result.locationName}"`);
            closeLinkModal();
            fetchAccounts();
        } catch (err) { toast.error(err.message || 'Failed to link location'); }
        finally { setIsLinkingLocation(false); }
    };

    const handleBulkCreateUsers = async () => {
        if (isBulkCreating || selectedUsers.length === 0) return;
        setIsBulkCreating(true);
        setBulkProgress({ total: selectedUsers.length, completed: 0, failed: 0, results: [] });
        try {
            const response = await fetchWithAuth('/api/admin/ghl-users/create-bulk', {
                method: 'POST', body: JSON.stringify({ userIds: selectedUsers })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Bulk creation failed'); }
            const result = await response.json();
            const { summary } = result;
            setBulkProgress({ total: summary.total, completed: summary.successful, failed: summary.failed, results: summary.results });
            if (summary.successful > 0) toast.success(`Created ${summary.successful} builder login${summary.successful > 1 ? 's' : ''}!`);
            if (summary.failed > 0) toast.error(`${summary.failed} creation${summary.failed > 1 ? 's' : ''} failed.`);
            fetchAccounts();
        } catch (err) {
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
                method: 'POST', body: JSON.stringify({ userIds: selectedUsers })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Bulk snapshot import failed'); }
            const result = await response.json();
            setBulkProgress({ total: result.total, completed: result.successful, failed: result.failed, results: result.results });
            if (result.successful > 0) toast.success(`Imported snapshots for ${result.successful} user${result.successful > 1 ? 's' : ''}!`);
            if (result.failed > 0) toast.error(`${result.failed} snapshot import${result.failed > 1 ? 's' : ''} failed.`);
            fetchAccounts();
        } catch (err) {
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
                method: 'POST', body: JSON.stringify({ userIds: selectedUsers })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Bulk setup failed'); }
            const result = await response.json();
            setBulkProgress({ total: result.total, completed: result.successful, failed: result.failed, results: result.results });
            let message = [];
            if (result.created > 0) message.push(`${result.created} subaccount${result.created > 1 ? 's' : ''} created`);
            if (result.imported > 0) message.push(`${result.imported} snapshot${result.imported > 1 ? 's' : ''} imported`);
            if (result.skipped > 0) message.push(`${result.skipped} skipped`);
            if (result.successful > 0) toast.success(message.join(', '));
            if (result.failed > 0) toast.error(`${result.failed} operation${result.failed > 1 ? 's' : ''} failed.`);
            fetchAccounts();
        } catch (err) {
            toast.error(err.message || "Bulk setup failed");
            setBulkProgress(null);
        } finally {
            setIsBulkCreating(false);
            setSelectedUsers([]);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const toggleSelectAll = useCallback(() => {
        const selectableUsers = accounts.filter(acc => acc.has_subaccount);
        if (selectedUsers.length === selectableUsers.length) setSelectedUsers([]);
        else setSelectedUsers(selectableUsers.map(acc => acc.id));
    }, [accounts, selectedUsers.length]);

    const closeBulkModal = () => { setBulkProgress(null); setSelectedUsers([]); };

    const openEditModal = useCallback((user) => {
        setEditingUser(user);
        setEditFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            business_name: user.business_name || '',
            address: user.address || '',
            city: user.city || '',
            country: user.country || '',
            phone: user.phone || ''
        });
        setEditModalOpen(true);
    }, []);

    const closeEditModal = () => { setEditModalOpen(false); setEditingUser(null); setEditFormData({}); };

    const handleSaveProfile = async (triggerOnboarding = false) => {
        if (!editingUser) return;
        setIsSavingProfile(true);
        try {
            const response = await fetchWithAuth('/api/admin/users', {
                method: 'PUT',
                body: JSON.stringify({ userId: editingUser.id, action: 'update_profile', profileData: editFormData })
            });
            if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed to update profile'); }
            toast.success('Profile updated successfully!');
            if (triggerOnboarding) {
                if (!editingUser.has_subaccount) {
                    toast.info('Creating sub-account...');
                    await handleRetry(editingUser.id);
                } else if (!editingUser.snapshot_imported) {
                    toast.info('Importing snapshot...');
                    await handleImportSnapshot(editingUser.id);
                } else {
                    toast.success('User already fully onboarded!');
                }
            }
            closeEditModal();
            fetchAccounts();
        } catch (err) {
            toast.error(err.message || 'Failed to save profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const filterOptions = [
        { value: '', label: 'All Users' },
        { value: 'profile_complete', label: 'Profile Complete' },
        { value: 'profile_incomplete', label: 'Profile Incomplete' },
        { value: 'has_subaccount', label: 'Has Sub-Account' },
        { value: 'no_subaccount', label: 'No Sub-Account' },
        { value: 'snapshot_imported', label: 'Snapshot Imported' },
        { value: 'snapshot_pending', label: 'Snapshot Pending' },
        { value: 'user_created', label: 'Builder Login Created' },
        { value: 'user_pending', label: 'Builder Login Pending' }
    ];

    const columns = useMemo(
        () => [
            {
                id: "select",
                header: () => (
                    <input
                        type="checkbox"
                        checked={selectedUsers.length > 0 && selectedUsers.length === accounts.filter(acc => acc.has_subaccount).length}
                        onChange={toggleSelectAll}
                        style={{ width: 15, height: 15, cursor: "pointer", accentColor: T.cyan }}
                    />
                ),
                cell: ({ row }) => {
                    if (!row.original.can_create_user) return null;
                    return (
                        <input
                            type="checkbox"
                            checked={selectedUsers.includes(row.original.id)}
                            onChange={() => toggleUserSelection(row.original.id)}
                            style={{ width: 15, height: 15, cursor: "pointer", accentColor: T.cyan }}
                        />
                    );
                },
            },
            {
                accessorKey: "profile_complete",
                header: "Profile",
                cell: ({ row }) => {
                    const hasRequired = row.original.first_name && row.original.last_name && row.original.address && row.original.email;
                    return hasRequired ? (
                        <Badge style={{ background: "rgba(52,211,153,0.12)", color: T.success, border: "1px solid rgba(52,211,153,0.25)" }}>
                            <FileCheck style={{ width: 11, height: 11 }} /> Complete
                        </Badge>
                    ) : (
                        <Badge style={{ background: "rgba(251,146,60,0.12)", color: T.orange, border: "1px solid rgba(251,146,60,0.25)" }}>
                            <FileX style={{ width: 11, height: 11 }} /> Incomplete
                        </Badge>
                    );
                }
            },
            {
                accessorKey: "full_name",
                header: "User",
                cell: ({ row }) => (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: T.primary, fontWeight: 500, fontSize: 13 }}>{row.original.full_name || 'No Name'}</span>
                        <span style={{ color: T.muted, fontSize: 12 }}>{row.original.email}</span>
                        {row.original.business_name && (
                            <span style={{ color: T.cyan, fontSize: 11 }}>{row.original.business_name}</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "ghl_location_id",
                header: "GHL Location",
                cell: ({ row }) => {
                    const locationId = row.original.ghl_location_id;
                    if (!locationId) return <span style={{ color: T.muted, fontStyle: "italic", fontSize: 12 }}>No Location ID</span>;
                    return (
                        <a
                            href={`https://app.gohighlevel.com/location/${locationId}/dashboard`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "3px 10px", borderRadius: 6,
                                backgroundColor: T.surface, border: `1px solid ${T.border}`,
                                fontSize: 12, fontFamily: "monospace", color: T.secondary,
                                textDecoration: "none", transition: "border-color 0.15s ease",
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = T.cyan}
                            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                        >
                            {locationId}
                            <ExternalLink style={{ width: 11, height: 11, color: T.cyan }} />
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
                    const st = STATUS_STYLE[status] || STATUS_STYLE.not_synced;
                    return (
                        <Badge style={st}>
                            <StatusIcon style={{ width: 11, height: 11 }} />
                            <span style={{ textTransform: "capitalize" }}>{status.replace(/_/g, ' ')}</span>
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "retry_info",
                header: "Retries",
                cell: ({ row }) => {
                    const { ghl_retry_count, ghl_next_retry_at, ghl_sync_status } = row.original;
                    if (ghl_sync_status === 'synced') return <span style={{ color: T.muted, fontSize: 12 }}>—</span>;
                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11 }}>
                            {ghl_retry_count > 0 && (
                                <span style={{ color: T.secondary }}>Attempts: {ghl_retry_count}/5</span>
                            )}
                            {ghl_next_retry_at && new Date(ghl_next_retry_at) > new Date() && (
                                <span style={{ color: T.cyan }}>
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
                    if (!has_subaccount) return <span style={{ color: T.muted, fontSize: 12 }}>No account</span>;
                    if (snapshot_imported) return (
                        <Badge style={{ background: "rgba(52,211,153,0.12)", color: T.success, border: "1px solid rgba(52,211,153,0.25)" }}>
                            <CheckCircle style={{ width: 11, height: 11 }} /> Imported
                        </Badge>
                    );
                    if (snapshot_status === 'failed') return (
                        <Badge style={{ background: "rgba(248,113,113,0.12)", color: T.danger, border: "1px solid rgba(248,113,113,0.25)" }}>
                            <XCircle style={{ width: 11, height: 11 }} /> Failed
                        </Badge>
                    );
                    return (
                        <Badge style={{ background: "rgba(251,191,36,0.12)", color: T.warning, border: "1px solid rgba(251,191,36,0.25)" }}>
                            <Clock style={{ width: 11, height: 11 }} /> Pending
                        </Badge>
                    );
                }
            },
            {
                accessorKey: "builder_login",
                header: "Builder Login",
                cell: ({ row }) => {
                    const { has_ghl_user: hasGHLUser, ghl_user_invited: invited, ghl_user_creation_error: error } = row.original;
                    if (error) return (
                        <Badge style={{ background: "rgba(248,113,113,0.12)", color: T.danger, border: "1px solid rgba(248,113,113,0.25)" }} title={error}>
                            <XCircle style={{ width: 11, height: 11 }} /> Failed
                        </Badge>
                    );
                    if (hasGHLUser) return (
                        <Badge style={{ background: "rgba(52,211,153,0.12)", color: T.success, border: "1px solid rgba(52,211,153,0.25)" }}>
                            <UserCheck style={{ width: 11, height: 11 }} /> {invited ? 'Created' : 'Active'}
                        </Badge>
                    );
                    return <span style={{ color: T.muted, fontSize: 12 }}>Not Created</span>;
                }
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const { ghl_sync_status: status, has_subaccount: hasSubaccount, snapshot_imported: snapshotImported,
                        snapshot_status: snapshotStatus, has_ghl_user: hasGHLUser, ghl_user_creation_error: userCreationError } = row.original;
                    const canRetry = ['failed', 'permanently_failed', 'pending', 'not_synced'].includes(status) && !hasSubaccount;
                    const canImportSnapshot = hasSubaccount;
                    const canMarkSnapshot = hasSubaccount && !snapshotImported;
                    const canCreateUser = hasSubaccount && !hasGHLUser;
                    const canRetryUser = hasSubaccount && userCreationError && !hasGHLUser;

                    return (
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {canRetry && (
                                <ActionBtn onClick={() => handleRetry(row.original.id)} disabled={isRetrying === row.original.id} title="Create Sub-Account" color={T.cyan}>
                                    <RotateCcw style={{ width: 14, height: 14, animation: isRetrying === row.original.id ? "spin 1s linear infinite" : "none" }} />
                                </ActionBtn>
                            )}
                            {canImportSnapshot && (
                                <ActionBtn onClick={() => handleImportSnapshot(row.original.id)} disabled={isImportingSnapshot === row.original.id} title={snapshotImported ? "Re-Import Snapshot" : "Import Snapshot"} color={T.purple}>
                                    {isImportingSnapshot === row.original.id
                                        ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                                        : <Layers style={{ width: 14, height: 14 }} />}
                                </ActionBtn>
                            )}
                            {canMarkSnapshot && (
                                <ActionBtn onClick={() => handleMarkSnapshotImported(row.original.id)} disabled={isMarkingSnapshot === row.original.id} title="Mark Snapshot as Imported" color="#60a5fa">
                                    {isMarkingSnapshot === row.original.id
                                        ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                                        : <CheckSquare style={{ width: 14, height: 14 }} />}
                                </ActionBtn>
                            )}
                            {canCreateUser && (
                                <ActionBtn onClick={() => handleCreateBuilderLogin(row.original.id)} disabled={isCreatingUser === row.original.id} title="Create Builder Login" color={T.success}>
                                    {isCreatingUser === row.original.id
                                        ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                                        : <UserPlus style={{ width: 14, height: 14 }} />}
                                </ActionBtn>
                            )}
                            {canRetryUser && (
                                <ActionBtn onClick={() => handleRetryUserCreation(row.original.id)} disabled={isRetryingUser === row.original.id} title="Retry Builder Login" color={T.orange}>
                                    <RotateCcw style={{ width: 14, height: 14, animation: isRetryingUser === row.original.id ? "spin 1s linear infinite" : "none" }} />
                                </ActionBtn>
                            )}
                            {hasSubaccount && (
                                <ActionBtn onClick={() => handleRefreshToken(row.original.id, row.original.company_id)} disabled={isRefreshingToken === row.original.id} title="Refresh OAuth Token" color={T.success}>
                                    <RefreshCw style={{ width: 14, height: 14, animation: isRefreshingToken === row.original.id ? "spin 1s linear infinite" : "none" }} />
                                </ActionBtn>
                            )}
                            <ActionBtn onClick={() => openLinkModal(row.original)} title="Link External Location" color={T.amber}>
                                <Link2 style={{ width: 14, height: 14 }} />
                            </ActionBtn>
                            <ActionBtn onClick={() => openEditModal(row.original)} title="Edit Profile" color="#60a5fa">
                                <Edit style={{ width: 14, height: 14 }} />
                            </ActionBtn>
                            {hasSubaccount && snapshotImported && hasGHLUser && (
                                <span style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <CheckCircle style={{ width: 14, height: 14, color: T.success }} />
                                </span>
                            )}
                        </div>
                    );
                },
            },
        ],
        [isRetrying, isImportingSnapshot, isMarkingSnapshot, isCreatingUser, isRetryingUser, isRefreshingToken, selectedUsers, accounts, openEditModal, openLinkModal, handleRetry, handleImportSnapshot, handleMarkSnapshotImported, handleCreateBuilderLogin, handleRetryUserCreation, handleRefreshToken, toggleSelectAll]
    );

    const table = useReactTable({
        data: accounts,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
    });

    const STAT_CARDS = [
        { label: "Synced", value: stats.synced || 0, icon: CheckCircle, color: T.success, bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
        { label: "Failed", value: stats.failed || 0, icon: AlertTriangle, color: T.orange, bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
        { label: "Pending", value: stats.pending || 0, icon: Clock, color: T.warning, bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)" },
        { label: "Total", value: stats.total || 0, icon: Building2, color: T.secondary, bg: "rgba(178,192,205,0.06)", border: T.border },
    ];

    return (
        <AdminLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 3, height: 22, backgroundColor: T.cyan, borderRadius: 2 }} />
                            <h1 style={{ color: T.primary, fontSize: 22, fontWeight: 700, margin: 0 }}>GHL Sub-Accounts</h1>
                        </div>
                        <p style={{ color: T.secondary, fontSize: 13, marginLeft: 11 }}>Monitor and manage automated sub-account creation.</p>
                    </div>
                    <button
                        onClick={fetchAccounts}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "9px 16px", backgroundColor: T.surface,
                            border: `1px solid ${T.border}`, borderRadius: 8,
                            color: T.secondary, fontSize: 13, cursor: "pointer",
                        }}
                    >
                        <RefreshCw style={{ width: 14, height: 14, animation: loading ? "spin 1s linear infinite" : "none" }} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
                    {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, border }) => (
                        <div key={label} style={{
                            backgroundColor: T.cardBg, borderRadius: 12, padding: 18,
                            border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Icon style={{ width: 15, height: 15, color }} />
                                </div>
                                <span style={{ color: T.secondary, fontSize: 12, fontWeight: 500 }}>{label}</span>
                            </div>
                            <p style={{ color: T.primary, fontSize: 26, fontWeight: 700, margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Search and Filter */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                        <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: T.muted }} />
                        <input
                            type="text"
                            placeholder="Search by user, email, or business name..."
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            style={{
                                width: "100%", boxSizing: "border-box",
                                paddingLeft: 42, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                                backgroundColor: T.cardBg, border: `1px solid ${T.border}`,
                                borderRadius: 10, color: T.primary, fontSize: 13, outline: "none",
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = T.cyan}
                            onBlur={e => e.currentTarget.style.borderColor = T.border}
                        />
                    </div>
                    <div style={{ position: "relative", minWidth: 0, flex: "0 1 200px" }}>
                        <Filter style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: T.muted, pointerEvents: "none" }} />
                        <select
                            value={activeFilter}
                            onChange={(e) => setActiveFilter(e.target.value)}
                            style={{
                                width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                                backgroundColor: T.cardBg, border: `1px solid ${T.border}`,
                                borderRadius: 10, color: T.primary, fontSize: 13, outline: "none",
                                appearance: "none", cursor: "pointer",
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = T.cyan}
                            onBlur={e => e.currentTarget.style.borderColor = T.border}
                        >
                            {filterOptions.map(opt => (
                                <option key={opt.value} value={opt.value} style={{ backgroundColor: T.surface }}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
                            <Loader2 style={{ width: 32, height: 32, color: T.cyan, animation: "spin 1s linear infinite" }} />
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
                                        {table.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} style={{ padding: "48px 24px", textAlign: "center", color: T.muted, fontSize: 14 }}>
                                                    No accounts found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map(row => (
                                                <tr
                                                    key={row.id}
                                                    style={{ borderBottom: `1px solid ${T.border}`, transition: "background-color 0.12s ease" }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.03)"}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                                >
                                                    {row.getVisibleCells().map(cell => (
                                                        <td key={cell.id} style={{ padding: "10px 14px", fontSize: 13 }}>
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
                            <div style={{
                                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                                gap: 12, padding: "12px 16px", borderTop: `1px solid ${T.border}`, backgroundColor: T.surface,
                            }}>
                                <p style={{ color: T.secondary, fontSize: 13, margin: 0 }}>
                                    {pagination.total > 0
                                        ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`
                                        : 'No entries'}
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        disabled={pagination.page <= 1}
                                        style={{
                                            padding: "6px 10px", backgroundColor: T.cardBg, border: `1px solid ${T.border}`,
                                            borderRadius: 8, color: T.secondary, cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                                            opacity: pagination.page <= 1 ? 0.4 : 1, display: "flex", alignItems: "center",
                                        }}
                                    >
                                        <ChevronLeft style={{ width: 16, height: 16 }} />
                                    </button>
                                    <span style={{ color: T.primary, fontSize: 13, fontWeight: 500, padding: "0 8px" }}>
                                        Page {pagination.page} of {pagination.totalPages || 1}
                                    </span>
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                        style={{
                                            padding: "6px 10px", backgroundColor: T.cardBg, border: `1px solid ${T.border}`,
                                            borderRadius: 8, color: T.secondary, cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                                            opacity: pagination.page >= pagination.totalPages ? 0.4 : 1, display: "flex", alignItems: "center",
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

            {/* Bulk Selection Toolbar */}
            {selectedUsers.length > 0 && (
                <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
                    <div style={{
                        backgroundColor: T.cardBg, border: `1px solid rgba(22,199,231,0.3)`,
                        borderRadius: 14, padding: "14px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: T.primary, fontWeight: 600, fontSize: 14 }}>{selectedUsers.length}</span>
                            <span style={{ color: T.secondary, fontSize: 13 }}>user{selectedUsers.length > 1 ? 's' : ''} selected</span>
                        </div>

                        {selectedUsers.length > 50 && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                                backgroundColor: "rgba(251,146,60,0.12)", color: T.orange,
                                borderRadius: 6, fontSize: 12,
                            }}>
                                <AlertTriangle style={{ width: 12, height: 12 }} /> Max 50 users at once
                            </div>
                        )}

                        <button
                            onClick={handleBulkCreateUsers}
                            disabled={isBulkCreating || selectedUsers.length > 50}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 16px", backgroundColor: T.cyan,
                                color: "#05080B", fontWeight: 600, fontSize: 13,
                                border: "none", borderRadius: 8, cursor: isBulkCreating ? "not-allowed" : "pointer",
                                opacity: isBulkCreating || selectedUsers.length > 50 ? 0.5 : 1,
                            }}
                        >
                            {isBulkCreating ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <UserPlus style={{ width: 14, height: 14 }} />}
                            Create Builder Logins
                        </button>

                        <button
                            onClick={handleBulkImportSnapshots}
                            disabled={isBulkCreating || selectedUsers.length > 50}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 16px", backgroundColor: "rgba(167,139,250,0.15)",
                                border: `1px solid rgba(167,139,250,0.3)`,
                                color: T.purple, fontWeight: 600, fontSize: 13,
                                borderRadius: 8, cursor: isBulkCreating ? "not-allowed" : "pointer",
                                opacity: isBulkCreating || selectedUsers.length > 50 ? 0.5 : 1,
                            }}
                        >
                            {isBulkCreating ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Download style={{ width: 14, height: 14 }} />}
                            Import Snapshots
                        </button>

                        <button
                            onClick={() => setSelectedUsers([])}
                            style={{
                                width: 30, height: 30, borderRadius: 8, border: "none",
                                backgroundColor: "rgba(248,113,113,0.1)", color: T.danger,
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                            }}
                        >
                            <X style={{ width: 14, height: 14 }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Progress Modal */}
            {bulkProgress && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                            <h2 style={{ color: T.primary, fontSize: 18, fontWeight: 700, margin: 0 }}>Bulk Creation Progress</h2>
                            {bulkProgress.completed + bulkProgress.failed === bulkProgress.total && (
                                <button onClick={closeBulkModal} style={{ width: 32, height: 32, borderRadius: 8, border: "none", backgroundColor: "rgba(255,255,255,0.05)", color: T.secondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <X style={{ width: 16, height: 16 }} />
                                </button>
                            )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: T.secondary, fontSize: 13 }}>Processing: {bulkProgress.completed + bulkProgress.failed} / {bulkProgress.total}</span>
                                    <span style={{ color: T.secondary, fontSize: 13 }}>{Math.round(((bulkProgress.completed + bulkProgress.failed) / bulkProgress.total) * 100)}%</span>
                                </div>
                                <div style={{ height: 6, backgroundColor: T.surface, borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", backgroundColor: T.cyan, borderRadius: 99,
                                        width: `${((bulkProgress.completed + bulkProgress.failed) / bulkProgress.total) * 100}%`,
                                        transition: "width 0.3s ease",
                                    }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                {[
                                    { label: "Successful", value: bulkProgress.completed, color: T.success, bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
                                    { label: "Failed", value: bulkProgress.failed, color: T.danger, bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
                                    { label: "Total", value: bulkProgress.total, color: T.primary, bg: T.surface, border: T.border },
                                ].map(({ label, value, color, bg, border }) => (
                                    <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                                        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
                                        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{label}</div>
                                    </div>
                                ))}
                            </div>

                            {bulkProgress.completed + bulkProgress.failed === bulkProgress.total && bulkProgress.results && (
                                <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                                    <p style={{ color: T.muted, fontSize: 12, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Results</p>
                                    {bulkProgress.results.map((result, index) => (
                                        <div key={index} style={{
                                            padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
                                            backgroundColor: result.success ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                                            border: `1px solid ${result.success ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {result.success
                                                    ? <CheckCircle style={{ width: 14, height: 14, color: T.success }} />
                                                    : <XCircle style={{ width: 14, height: 14, color: T.danger }} />}
                                                <span style={{ color: T.primary, fontSize: 13 }}>{result.email || result.userId}</span>
                                            </div>
                                            {!result.success && result.error && (
                                                <span style={{ fontSize: 11, color: T.danger }}>{result.error}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {bulkProgress.completed + bulkProgress.failed === bulkProgress.total && (
                                <button
                                    onClick={closeBulkModal}
                                    style={{
                                        width: "100%", padding: "11px 0", backgroundColor: T.cyan,
                                        color: "#05080B", fontWeight: 600, fontSize: 14,
                                        border: "none", borderRadius: 10, cursor: "pointer",
                                    }}
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {editModalOpen && editingUser && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div style={{
                        backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28,
                        width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ color: T.primary, fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Profile</h3>
                            <button onClick={closeEditModal} style={{ width: 32, height: 32, borderRadius: 8, border: "none", backgroundColor: "rgba(255,255,255,0.05)", color: T.secondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <X style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                {[
                                    { label: "First Name", key: "first_name", type: "text" },
                                    { label: "Last Name", key: "last_name", type: "text" },
                                ].map(({ label, key, type }) => (
                                    <ModalInput key={key} label={label} type={type} value={editFormData[key] || ''} onChange={v => setEditFormData(p => ({ ...p, [key]: v }))} />
                                ))}
                            </div>
                            {[
                                { label: "Email", key: "email", type: "email" },
                                { label: "Business Name *", key: "business_name", type: "text" },
                                { label: "Address *", key: "address", type: "text" },
                            ].map(({ label, key, type }) => (
                                <ModalInput key={key} label={label} type={type} value={editFormData[key] || ''} onChange={v => setEditFormData(p => ({ ...p, [key]: v }))} />
                            ))}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                {[
                                    { label: "City", key: "city", type: "text" },
                                    { label: "Country", key: "country", type: "text" },
                                ].map(({ label, key, type }) => (
                                    <ModalInput key={key} label={label} type={type} value={editFormData[key] || ''} onChange={v => setEditFormData(p => ({ ...p, [key]: v }))} />
                                ))}
                            </div>
                            <ModalInput label="Phone" type="tel" value={editFormData.phone || ''} onChange={v => setEditFormData(p => ({ ...p, phone: v }))} />
                        </div>

                        <div style={{ marginTop: 20, padding: 14, backgroundColor: T.surface, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                            {[
                                { label: "Profile", ok: editFormData.first_name && editFormData.last_name && editFormData.email && editFormData.business_name && editFormData.address },
                                { label: "Sub-Account", ok: editingUser.has_subaccount },
                                { label: "Snapshot", ok: editingUser.snapshot_imported, warn: editingUser.has_subaccount && !editingUser.snapshot_imported },
                            ].map(({ label, ok, warn }) => (
                                <p key={label} style={{ margin: 0, fontSize: 13, color: T.secondary }}>
                                    {label}: <span style={{ color: ok ? T.success : warn ? T.warning : T.orange, fontWeight: 600 }}>
                                        {ok ? "Complete ✓" : label === "Snapshot" && !editingUser.has_subaccount ? "Waiting for Sub-Account" : warn ? "Pending Import" : "Not Created"}
                                    </span>
                                </p>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                            <button onClick={closeEditModal} style={{ flex: 1, padding: "10px 0", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.secondary, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={() => handleSaveProfile(false)} disabled={isSavingProfile} style={{ flex: 1, padding: "10px 0", backgroundColor: T.cyan, border: "none", borderRadius: 10, color: "#05080B", fontSize: 14, fontWeight: 700, cursor: isSavingProfile ? "not-allowed" : "pointer", opacity: isSavingProfile ? 0.6 : 1 }}>
                                {isSavingProfile ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite", margin: "0 auto", display: "block" }} /> : "Save"}
                            </button>
                            {(!editingUser.has_subaccount || !editingUser.snapshot_imported) && (
                                <button
                                    onClick={() => handleSaveProfile(true)}
                                    disabled={isSavingProfile || !editFormData.business_name || !editFormData.address}
                                    style={{
                                        flex: 1, padding: "10px 0",
                                        backgroundColor: "rgba(22,199,231,0.15)", border: `1px solid rgba(22,199,231,0.3)`,
                                        borderRadius: 10, color: T.cyan, fontSize: 13, fontWeight: 700,
                                        cursor: isSavingProfile ? "not-allowed" : "pointer",
                                        opacity: isSavingProfile || !editFormData.business_name || !editFormData.address ? 0.5 : 1,
                                    }}
                                >
                                    {!editingUser.has_subaccount ? 'Save & Create' : 'Save & Import'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Link External Location Modal */}
            {linkModalOpen && linkingUser && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div style={{ backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ color: T.primary, fontSize: 17, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                <Link2 style={{ width: 16, height: 16, color: T.amber }} />
                                Link External Location
                            </h3>
                            <button onClick={closeLinkModal} style={{ width: 32, height: 32, borderRadius: 8, border: "none", backgroundColor: "rgba(255,255,255,0.05)", color: T.secondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <X style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        <div style={{ padding: 14, backgroundColor: T.surface, borderRadius: 10, marginBottom: 14 }}>
                            <p style={{ color: T.muted, fontSize: 12, margin: "0 0 4px" }}>User</p>
                            <p style={{ color: T.primary, fontWeight: 600, fontSize: 14, margin: "0 0 2px" }}>{linkingUser.full_name || 'No Name'}</p>
                            <p style={{ color: T.secondary, fontSize: 13, margin: 0 }}>{linkingUser.email}</p>
                            {linkingUser.ghl_location_id && (
                                <p style={{ color: T.muted, fontSize: 12, margin: "6px 0 0", fontFamily: "monospace" }}>Current: {linkingUser.ghl_location_id}</p>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, marginBottom: 18 }}>
                            <AlertTriangle style={{ width: 15, height: 15, color: T.amber, flexShrink: 0, marginTop: 1 }} />
                            <p style={{ color: "rgba(245,158,11,0.85)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                                This will replace the user&apos;s current GHL sub-account connection. Ensure the new location has the correct SaaS plan in your Agency Dashboard.
                            </p>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", color: T.secondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>GHL Location ID</label>
                            <input
                                type="text"
                                value={linkLocationId}
                                onChange={(e) => setLinkLocationId(e.target.value)}
                                placeholder="Paste the GHL Location ID here..."
                                autoFocus
                                style={{
                                    width: "100%", boxSizing: "border-box",
                                    padding: "10px 14px", backgroundColor: T.surface,
                                    border: `1px solid ${T.border}`, borderRadius: 8,
                                    color: T.primary, fontFamily: "monospace", fontSize: 13, outline: "none",
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = T.amber}
                                onBlur={e => e.currentTarget.style.borderColor = T.border}
                            />
                            <p style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
                                Find this in GHL → Settings → Business Info or from the URL: app.gohighlevel.com/location/<strong>LOCATION_ID</strong>/dashboard
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={closeLinkModal} style={{ flex: 1, padding: "10px 0", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.secondary, fontSize: 14, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleLinkLocation}
                                disabled={isLinkingLocation || !linkLocationId.trim()}
                                style={{
                                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    padding: "10px 0", backgroundColor: T.amber, border: "none",
                                    borderRadius: 10, color: "#05080B", fontSize: 14, fontWeight: 700,
                                    cursor: isLinkingLocation || !linkLocationId.trim() ? "not-allowed" : "pointer",
                                    opacity: isLinkingLocation || !linkLocationId.trim() ? 0.5 : 1,
                                }}
                            >
                                {isLinkingLocation ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Link2 style={{ width: 15, height: 15 }} />}
                                Link Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function ModalInput({ label, type, value, onChange }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label style={{ display: "block", color: "#B2C0CD", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "9px 12px", backgroundColor: "#121920",
                    border: `1px solid ${focused ? "#16C7E7" : "#1E2A34"}`,
                    borderRadius: 8, color: "#F4F8FB", fontSize: 13, outline: "none",
                    transition: "border-color 0.15s ease",
                }}
            />
        </div>
    );
}
