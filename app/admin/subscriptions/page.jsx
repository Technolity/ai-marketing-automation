"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle,
    XCircle,
    RefreshCw,
    CalendarDays,
    PlayCircle,
    PauseCircle,
    BadgeCheck,
    BadgeX,
    Filter,
    Users,
} from "lucide-react";
import AdminLayout from '@/components/admin/AdminLayout';
import { T as _T } from '@/components/admin/adminTheme';
import EditableCell from "@/components/admin/EditableCell";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: 'active',    label: 'Active'    },
    { value: 'suspended', label: 'Suspended' },
    { value: 'cancelled', label: 'Cancelled' },
];

const CYCLE_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual',  label: 'Annual'  },
];

// ── Helper components ──────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    const styles = {
        success: {
            backgroundColor: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.25)',
            color: _T.green,
        },
        error: {
            backgroundColor: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: _T.red,
        },
        info: {
            backgroundColor: 'rgba(96,165,250,0.12)',
            border: '1px solid rgba(96,165,250,0.25)',
            color: _T.blue,
        },
    }[type] || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderRadius: 12,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                ...styles,
            }}
        >
            {type === 'success' && <CheckCircle style={{ width: 20, height: 20, flexShrink: 0 }} />}
            {type === 'error'   && <XCircle     style={{ width: 20, height: 20, flexShrink: 0 }} />}
            <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{message}</p>
            <button
                onClick={onClose}
                style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: 0, display: 'flex' }}
            >
                <XCircle style={{ width: 16, height: 16 }} />
            </button>
        </motion.div>
    );
}

function StatusBadge({ status }) {
    const cfg = {
        active:    { bg: 'rgba(52,211,153,0.12)',  color: _T.green,  label: 'Active'    },
        suspended: { bg: 'rgba(251,191,36,0.12)',  color: _T.amber,  label: 'Suspended' },
        cancelled: { bg: 'rgba(239,68,68,0.12)',   color: _T.red,  label: 'Cancelled' },
    }[status] || { bg: 'rgba(90,106,120,0.15)', color: _T.textMuted, label: status || '—' };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'capitalize',
            backgroundColor: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.color}30`,
            letterSpacing: '0.02em',
        }}>
            {cfg.label}
        </span>
    );
}

function CycleBadge({ cycle }) {
    const cfg = {
        monthly: { bg: 'rgba(96,165,250,0.12)',  color: _T.blue,  label: 'Monthly' },
        annual:  { bg: 'rgba(167,139,250,0.12)', color: _T.purple,  label: 'Annual'  },
    }[cycle] || { bg: 'rgba(90,106,120,0.15)', color: _T.textMuted, label: cycle || '—' };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'capitalize',
            backgroundColor: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.color}30`,
            letterSpacing: '0.02em',
        }}>
            {cfg.label}
        </span>
    );
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch { return iso; }
}

function isPastDue(iso) {
    if (!iso) return false;
    return new Date(iso) < new Date();
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminSubscriptions() {
    const { session, loading: authLoading } = useAuth();

    // Data
    const [users, setUsers]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [stats, setStats]         = useState({ active: 0, suspended: 0, cancelled: 0, monthly: 0, annual: 0, total: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // Filters
    const [searchInput, setSearchInput]     = useState('');
    const [globalFilter, setGlobalFilter]   = useState('');
    const [statusFilter, setStatusFilter]   = useState('all');
    const [cycleFilter, setCycleFilter]     = useState('all');
    const [tierFilter, setTierFilter]       = useState('all');

    // Bulk select
    const [selectedIds, setSelectedIds]     = useState(new Set());
    const [bulkLoading, setBulkLoading]     = useState(false);

    // Actions
    const [actionLoading, setActionLoading] = useState({});
    const [toast, setToast]                 = useState(null);

    // Hover state for rows
    const [hoveredRow, setHoveredRow]       = useState(null);

    // Search focus state
    const [searchFocused, setSearchFocused] = useState(false);

    const debounceRef = useRef(null);

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page:          pagination.page.toString(),
                limit:         pagination.limit.toString(),
                search:        globalFilter,
                status:        statusFilter,
                billing_cycle: cycleFilter,
                tier:          tierFilter,
            });

            const res = await fetchWithAuth(`/api/admin/subscriptions?${params}`);
            if (!res.ok) throw new Error('Failed to fetch subscriptions');

            const data = await res.json();
            setUsers(data.users || []);
            setStats(data.stats || {});
            setPagination(prev => ({
                ...prev,
                total:      data.pagination?.total      || 0,
                totalPages: data.pagination?.totalPages || 0,
            }));
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
            showToast('error', 'Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    }, [session, pagination.page, pagination.limit, globalFilter, statusFilter, cycleFilter, tierFilter]);

    useEffect(() => {
        if (!authLoading && session) fetchData();
    }, [authLoading, session, fetchData]);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const showToast = (type, message) => setToast({ type, message });

    const handleSearchChange = (value) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setGlobalFilter(value);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 400);
    };

    const applyStatFilter = (type, value) => {
        setPagination(prev => ({ ...prev, page: 1 }));
        if (type === 'status') {
            setStatusFilter(prev => prev === value ? 'all' : value);
        } else if (type === 'cycle') {
            setCycleFilter(prev => prev === value ? 'all' : value);
        }
    };

    // ── Field save (single) ──────────────────────────────────────────────────

    const handleFieldSave = useCallback(async (field, value, userId) => {
        const res = await fetchWithAuth('/api/admin/subscriptions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action: 'update_field', field, value }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to update');
        }

        const data = await res.json();

        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, ...data.user } : u
        ));
        showToast('success', `Updated ${field.replace(/_/g, ' ')} successfully`);
        return data;
    }, []);

    // ── Extend period ────────────────────────────────────────────────────────

    const handleExtendPeriod = useCallback(async (userId) => {
        setActionLoading(prev => ({ ...prev, [`extend-${userId}`]: true }));
        try {
            const res = await fetchWithAuth('/api/admin/subscriptions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'extend_period' }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to extend period');
            }

            const data = await res.json();
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data.user } : u));
            showToast('success', 'Period extended by 1 cycle');
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [`extend-${userId}`]: false }));
        }
    }, []);

    // ── Quick activate / suspend ─────────────────────────────────────────────

    const handleQuickStatus = useCallback(async (userId, newStatus) => {
        setActionLoading(prev => ({ ...prev, [`status-${userId}`]: true }));
        try {
            const res = await fetchWithAuth('/api/admin/subscriptions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'update_field', field: 'subscription_status', value: newStatus }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }

            const data = await res.json();
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data.user } : u));
            showToast('success', `Status set to ${newStatus}`);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [`status-${userId}`]: false }));
        }
    }, []);

    // ── Bulk action ──────────────────────────────────────────────────────────

    const handleBulkAction = useCallback(async (value) => {
        if (!selectedIds.size) return;
        setBulkLoading(true);
        try {
            const res = await fetchWithAuth('/api/admin/subscriptions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulk_update',
                    field: 'subscription_status',
                    userIds: Array.from(selectedIds),
                    value,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }

            const data = await res.json();
            showToast('success', `${data.updated} users updated to ${value}`);
            setSelectedIds(new Set());
            fetchData();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setBulkLoading(false);
        }
    }, [selectedIds, fetchData]);

    // ── Select helpers ───────────────────────────────────────────────────────

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === users.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(users.map(u => u.id)));
        }
    };

    const allSelected = users.length > 0 && selectedIds.size === users.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    // ── Stat card definitions ────────────────────────────────────────────────

    const statCards = [
        {
            key: 'active',
            label: 'Active',
            value: stats.active,
            type: 'status',
            color: _T.green,
            isSelected: statusFilter === 'active',
        },
        {
            key: 'suspended',
            label: 'Suspended',
            value: stats.suspended,
            type: 'status',
            color: _T.amber,
            isSelected: statusFilter === 'suspended',
        },
        {
            key: 'cancelled',
            label: 'Cancelled',
            value: stats.cancelled,
            type: 'status',
            color: _T.red,
            isSelected: statusFilter === 'cancelled',
        },
        {
            key: 'monthly',
            label: 'Monthly',
            value: stats.monthly,
            type: 'cycle',
            color: _T.blue,
            isSelected: cycleFilter === 'monthly',
        },
        {
            key: 'annual',
            label: 'Annual',
            value: stats.annual,
            type: 'cycle',
            color: _T.purple,
            isSelected: cycleFilter === 'annual',
        },
    ];

    // ── Select dropdown shared style ─────────────────────────────────────────

    const selectStyle = {
        padding: '9px 12px',
        backgroundColor: _T.panel,
        border: '1px solid #1E2A34',
        borderRadius: 10,
        color: _T.textPrimary,
        fontSize: 13,
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <div style={{ width: "100%", maxWidth: "100%", overflowX: "auto", boxSizing: "border-box" }}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ marginBottom: 24 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 3, height: 22, backgroundColor: _T.cyan, borderRadius: 2 }} />
                            <h1 style={{ color: _T.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Subscriptions</h1>
                        </div>
                        <p style={{ color: _T.textSecondary, fontSize: 13, marginLeft: 11, margin: 0 }}>
                            Manage subscription status, billing cycles, and period dates
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            backgroundColor: _T.panel,
                            border: '1px solid #1E2A34',
                            borderRadius: 10,
                            color: _T.textSecondary,
                            fontSize: 13,
                            cursor: 'pointer',
                            opacity: loading ? 0.5 : 1,
                            flexShrink: 0,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3" style={{ marginBottom: 20 }}>
                    {statCards.map(card => (
                        <button
                            key={card.key}
                            onClick={() => applyStatFilter(card.type, card.key)}
                            style={{
                                padding: '16px 18px',
                                backgroundColor: card.isSelected ? 'rgba(22,199,231,0.06)' : '#0D1217',
                                border: `1px solid ${card.isSelected ? card.color : '#1E2A34'}`,
                                borderLeft: `3px solid ${card.color}`,
                                borderRadius: 12,
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                width: '100%',
                            }}
                        >
                            <p style={{
                                color: _T.textSecondary,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: 6,
                                margin: '0 0 6px 0',
                            }}>
                                {card.label}
                            </p>
                            <p style={{
                                color: card.color,
                                fontSize: 26,
                                fontWeight: 700,
                                lineHeight: 1,
                                margin: 0,
                            }}>
                                {card.value}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap gap-3" style={{ marginBottom: 16 }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                        <Search style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 15,
                            height: 15,
                            color: _T.textMuted,
                            pointerEvents: 'none',
                        }} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchInput}
                            onChange={e => handleSearchChange(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            style={{
                                width: '100%',
                                padding: '9px 12px 9px 34px',
                                backgroundColor: _T.panel,
                                border: `1px solid ${searchFocused ? '#16C7E7' : '#1E2A34'}`,
                                borderRadius: 10,
                                color: _T.textPrimary,
                                fontSize: 13,
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.15s',
                            }}
                        />
                    </div>

                    {/* Status filter */}
                    <div style={{ position: 'relative' }}>
                        <Filter style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 13,
                            height: 13,
                            color: _T.textMuted,
                            pointerEvents: 'none',
                        }} />
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            style={{ ...selectStyle, paddingLeft: 28 }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Billing cycle filter */}
                    <select
                        value={cycleFilter}
                        onChange={e => { setCycleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        style={selectStyle}
                    >
                        <option value="all">All Cycles</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                    </select>

                    {/* Tier filter */}
                    <select
                        value={tierFilter}
                        onChange={e => { setTierFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        style={selectStyle}
                    >
                        <option value="all">All Tiers</option>
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="scale">Scale</option>
                    </select>
                </div>

                {/* Bulk action bar */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 16px',
                                backgroundColor: 'rgba(22,199,231,0.08)',
                                border: '1px solid rgba(22,199,231,0.2)',
                                borderRadius: 10,
                                marginBottom: 16,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Users style={{ width: 16, height: 16, color: _T.cyan, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: _T.cyan, fontWeight: 500 }}>
                                {selectedIds.size} user{selectedIds.size > 1 ? 's' : ''} selected
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                                <button
                                    onClick={() => handleBulkAction('active')}
                                    disabled={bulkLoading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(52,211,153,0.12)',
                                        border: '1px solid rgba(52,211,153,0.25)',
                                        borderRadius: 8,
                                        color: _T.green,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        opacity: bulkLoading ? 0.5 : 1,
                                    }}
                                >
                                    {bulkLoading ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <PlayCircle style={{ width: 12, height: 12 }} />}
                                    Activate
                                </button>
                                <button
                                    onClick={() => handleBulkAction('suspended')}
                                    disabled={bulkLoading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(251,191,36,0.12)',
                                        border: '1px solid rgba(251,191,36,0.25)',
                                        borderRadius: 8,
                                        color: _T.amber,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        opacity: bulkLoading ? 0.5 : 1,
                                    }}
                                >
                                    {bulkLoading ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <PauseCircle style={{ width: 12, height: 12 }} />}
                                    Suspend
                                </button>
                                <button
                                    onClick={() => handleBulkAction('cancelled')}
                                    disabled={bulkLoading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(239,68,68,0.12)',
                                        border: '1px solid rgba(239,68,68,0.25)',
                                        borderRadius: 8,
                                        color: _T.red,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        opacity: bulkLoading ? 0.5 : 1,
                                    }}
                                >
                                    {bulkLoading ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <XCircle style={{ width: 12, height: 12 }} />}
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: _T.panel,
                                        border: '1px solid #1E2A34',
                                        borderRadius: 8,
                                        color: _T.textSecondary,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div style={{
                    backgroundColor: _T.card,
                    border: '1px solid #1E2A34',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 20,
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                            <Loader2 style={{ width: 24, height: 24, color: _T.cyan }} className="animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: _T.textMuted }}>
                            <BadgeCheck style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.3 }} />
                            <p style={{ fontSize: 13, margin: 0 }}>No subscriptions found</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {/* Checkbox header */}
                                        <th style={{
                                            backgroundColor: _T.panel,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            borderBottom: '1px solid #1E2A34',
                                            width: 40,
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={el => { if (el) el.indeterminate = someSelected; }}
                                                onChange={toggleSelectAll}
                                                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: _T.cyan }}
                                            />
                                        </th>
                                        {['User', 'Status', 'Tier', 'Billing', 'Period End', 'Last Renewed', 'GHL', 'Actions'].map(col => (
                                            <th key={col} style={{
                                                backgroundColor: _T.panel,
                                                color: _T.textSecondary,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                borderBottom: '1px solid #1E2A34',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => {
                                        const isSelected    = selectedIds.has(user.id);
                                        const pastDue       = isPastDue(user.subscription_current_period_end);
                                        const statusLoading = actionLoading[`status-${user.id}`];
                                        const extendLoading = actionLoading[`extend-${user.id}`];
                                        const isHovered     = hoveredRow === user.id;

                                        const rowBg = isSelected
                                            ? 'rgba(22,199,231,0.05)'
                                            : isHovered
                                            ? 'rgba(22,199,231,0.03)'
                                            : 'transparent';

                                        return (
                                            <tr
                                                key={user.id}
                                                onMouseEnter={() => setHoveredRow(user.id)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                                style={{
                                                    borderBottom: '1px solid #1E2A34',
                                                    backgroundColor: rowBg,
                                                    transition: 'background 0.15s',
                                                }}
                                            >
                                                {/* Checkbox */}
                                                <td style={{ padding: '13px 16px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(user.id)}
                                                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: _T.cyan }}
                                                    />
                                                </td>

                                                {/* User */}
                                                <td style={{ padding: '13px 16px' }}>
                                                    <p style={{ color: _T.textPrimary, fontSize: 13, fontWeight: 500, margin: '0 0 2px 0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {user.full_name || '—'}
                                                    </p>
                                                    <p style={{ color: _T.textSecondary, fontSize: 11, margin: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {user.email}
                                                    </p>
                                                </td>

                                                {/* Status — editable */}
                                                <td style={{ padding: '13px 16px', color: _T.textPrimary, fontSize: 13 }}>
                                                    <EditableCell
                                                        value={user.subscription_status || 'active'}
                                                        type="select"
                                                        field="subscription_status"
                                                        userId={user.id}
                                                        onSave={handleFieldSave}
                                                        options={STATUS_OPTIONS}
                                                        displayFormatter={(v) => <StatusBadge status={v} />}
                                                    />
                                                </td>

                                                {/* Tier — editable */}
                                                <td style={{ padding: '13px 16px', color: _T.textPrimary, fontSize: 13 }}>
                                                    <EditableCell
                                                        value={user.subscription_tier || 'starter'}
                                                        type="select"
                                                        field="subscription_tier"
                                                        userId={user.id}
                                                        onSave={handleFieldSave}
                                                    />
                                                </td>

                                                {/* Billing cycle — editable */}
                                                <td style={{ padding: '13px 16px', color: _T.textPrimary, fontSize: 13 }}>
                                                    <EditableCell
                                                        value={user.billing_cycle || 'monthly'}
                                                        type="select"
                                                        field="billing_cycle"
                                                        userId={user.id}
                                                        onSave={handleFieldSave}
                                                        options={CYCLE_OPTIONS}
                                                        displayFormatter={(v) => <CycleBadge cycle={v} />}
                                                    />
                                                </td>

                                                {/* Period end — editable */}
                                                <td style={{ padding: '13px 16px', fontSize: 13 }}>
                                                    <EditableCell
                                                        value={user.subscription_current_period_end || ''}
                                                        type="text"
                                                        field="subscription_current_period_end"
                                                        userId={user.id}
                                                        onSave={handleFieldSave}
                                                        displayFormatter={(v) => (
                                                            <span style={{
                                                                fontSize: 12,
                                                                color: !v ? '#5a6a78' : pastDue ? '#f87171' : '#B2C0CD',
                                                                fontWeight: pastDue && v ? 500 : 400,
                                                            }}>
                                                                {formatDate(v)}
                                                                {pastDue && v && <span style={{ marginLeft: 4, color: _T.red }}>!</span>}
                                                            </span>
                                                        )}
                                                    />
                                                </td>

                                                {/* Last renewed — read-only */}
                                                <td style={{ padding: '13px 16px' }}>
                                                    <span style={{ fontSize: 12, color: _T.textSecondary }}>
                                                        {formatDate(user.subscription_renewed_at)}
                                                    </span>
                                                </td>

                                                {/* GHL provisioned */}
                                                <td style={{ padding: '13px 16px' }}>
                                                    {user.ghl_saas_provisioned
                                                        ? <BadgeCheck style={{ width: 16, height: 16, color: _T.green }} />
                                                        : <BadgeX     style={{ width: 16, height: 16, color: _T.textMuted }} />
                                                    }
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: '13px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {/* Activate / Suspend toggle */}
                                                        {user.subscription_status !== 'active' ? (
                                                            <ActionBtn
                                                                onClick={() => handleQuickStatus(user.id, 'active')}
                                                                disabled={statusLoading}
                                                                title="Activate"
                                                                hoverBg="rgba(52,211,153,0.1)"
                                                                color="#34d399"
                                                                defaultBg="rgba(52,211,153,0.07)"
                                                            >
                                                                {statusLoading
                                                                    ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                                                                    : <PlayCircle style={{ width: 14, height: 14 }} />
                                                                }
                                                            </ActionBtn>
                                                        ) : (
                                                            <ActionBtn
                                                                onClick={() => handleQuickStatus(user.id, 'suspended')}
                                                                disabled={statusLoading}
                                                                title="Suspend"
                                                                hoverBg="rgba(251,191,36,0.1)"
                                                                color="#fbbf24"
                                                                defaultBg="rgba(251,191,36,0.07)"
                                                            >
                                                                {statusLoading
                                                                    ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                                                                    : <PauseCircle style={{ width: 14, height: 14 }} />
                                                                }
                                                            </ActionBtn>
                                                        )}

                                                        {/* Extend period */}
                                                        <ActionBtn
                                                            onClick={() => handleExtendPeriod(user.id)}
                                                            disabled={extendLoading}
                                                            title="Extend period by 1 cycle"
                                                            hoverBg="rgba(22,199,231,0.1)"
                                                            color="#16C7E7"
                                                            defaultBg="rgba(22,199,231,0.07)"
                                                        >
                                                            {extendLoading
                                                                ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                                                                : <CalendarDays style={{ width: 14, height: 14 }} />
                                                            }
                                                        </ActionBtn>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: _T.panel,
                        border: '1px solid #1E2A34',
                        borderRadius: 10,
                    }}>
                        <p style={{ color: _T.textSecondary, fontSize: 12, margin: 0 }}>
                            Showing{' '}
                            <span style={{ color: _T.cyan, fontWeight: 600 }}>
                                {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>
                            {' '}of{' '}
                            <span style={{ color: _T.cyan, fontWeight: 600 }}>{pagination.total}</span>
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1 || loading}
                                style={{
                                    padding: 7,
                                    backgroundColor: _T.card,
                                    border: '1px solid #1E2A34',
                                    borderRadius: 8,
                                    color: _T.textSecondary,
                                    cursor: pagination.page <= 1 || loading ? 'not-allowed' : 'pointer',
                                    opacity: pagination.page <= 1 || loading ? 0.4 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ChevronLeft style={{ width: 16, height: 16 }} />
                            </button>
                            <span style={{ fontSize: 13, color: _T.textSecondary, padding: '0 8px' }}>
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages || loading}
                                style={{
                                    padding: 7,
                                    backgroundColor: _T.card,
                                    border: '1px solid #1E2A34',
                                    borderRadius: 8,
                                    color: _T.textSecondary,
                                    cursor: pagination.page >= pagination.totalPages || loading ? 'not-allowed' : 'pointer',
                                    opacity: pagination.page >= pagination.totalPages || loading ? 0.4 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ChevronRight style={{ width: 16, height: 16 }} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        key={toast.message}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}

// ── Small action button with hover state ───────────────────────────────────────

function ActionBtn({ onClick, disabled, title, hoverBg, color, defaultBg, children }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: hovered ? hoverBg : defaultBg,
                border: 'none',
                color: color,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
            }}
        >
            {children}
        </button>
    );
}
