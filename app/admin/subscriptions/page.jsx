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
import AdminLayout from "@/components/admin/AdminLayout";
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

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${
                type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
            }`}
        >
            {type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {type === 'error'   && <XCircle     className="w-5 h-5 flex-shrink-0" />}
            <p className="font-medium text-sm">{message}</p>
            <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
                <XCircle className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

function StatusBadge({ status }) {
    const cfg = {
        active:    { cls: 'bg-green-500/20 text-green-400 border-green-500/30',   label: 'Active'    },
        suspended: { cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Suspended' },
        cancelled: { cls: 'bg-red-500/20 text-red-400 border-red-500/30',          label: 'Cancelled' },
    }[status] || { cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: status || '—' };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function CycleBadge({ cycle }) {
    const cfg = {
        monthly: { cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     label: 'Monthly' },
        annual:  { cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Annual'  },
    }[cycle] || { cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: cycle || '—' };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${cfg.cls}`}>
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

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">Subscriptions</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manage subscription status, billing cycles, and period dates
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1d] border border-[#2a2a2d] rounded-xl text-gray-400 hover:text-white hover:border-cyan/40 transition-all text-sm disabled:opacity-50 self-start sm:self-auto whitespace-nowrap"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { key: 'active',    label: 'Active',     value: stats.active,    type: 'status', color: 'border-green-500/30 hover:border-green-500/60',  num: 'text-green-400',  bg: statusFilter === 'active'    ? 'bg-green-500/10'  : '' },
                        { key: 'suspended', label: 'Suspended',  value: stats.suspended, type: 'status', color: 'border-orange-500/30 hover:border-orange-500/60', num: 'text-orange-400', bg: statusFilter === 'suspended' ? 'bg-orange-500/10' : '' },
                        { key: 'cancelled', label: 'Cancelled',  value: stats.cancelled, type: 'status', color: 'border-red-500/30 hover:border-red-500/60',       num: 'text-red-400',    bg: statusFilter === 'cancelled' ? 'bg-red-500/10'    : '' },
                        { key: 'monthly',   label: 'Monthly',    value: stats.monthly,   type: 'cycle',  color: 'border-blue-500/30 hover:border-blue-500/60',     num: 'text-blue-400',   bg: cycleFilter   === 'monthly'  ? 'bg-blue-500/10'   : '' },
                        { key: 'annual',    label: 'Annual',     value: stats.annual,    type: 'cycle',  color: 'border-purple-500/30 hover:border-purple-500/60', num: 'text-purple-400', bg: cycleFilter   === 'annual'   ? 'bg-purple-500/10' : '' },
                    ].map(card => (
                        <button
                            key={card.key}
                            onClick={() => applyStatFilter(card.type, card.key)}
                            className={`p-4 rounded-xl bg-[#111113] border transition-all text-left ${card.color} ${card.bg}`}
                        >
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                            <p className={`text-2xl font-bold ${card.num}`}>{card.value}</p>
                        </button>
                    ))}
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchInput}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[#111113] border border-[#2a2a2d] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan/40"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="pl-8 pr-4 py-2 bg-[#111113] border border-[#2a2a2d] rounded-xl text-sm text-white focus:outline-none focus:border-cyan/40 appearance-none cursor-pointer"
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
                        className="px-4 py-2 bg-[#111113] border border-[#2a2a2d] rounded-xl text-sm text-white focus:outline-none focus:border-cyan/40 appearance-none cursor-pointer"
                    >
                        <option value="all">All Cycles</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                    </select>

                    {/* Tier filter */}
                    <select
                        value={tierFilter}
                        onChange={e => { setTierFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        className="px-4 py-2 bg-[#111113] border border-[#2a2a2d] rounded-xl text-sm text-white focus:outline-none focus:border-cyan/40 appearance-none cursor-pointer"
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
                            className="flex flex-wrap items-center gap-3 px-4 py-3 bg-cyan/10 border border-cyan/30 rounded-xl"
                        >
                            <Users className="w-4 h-4 text-cyan flex-shrink-0" />
                            <span className="text-sm text-cyan font-medium">
                                {selectedIds.size} user{selectedIds.size > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex flex-wrap items-center gap-2 ml-auto">
                                <button
                                    onClick={() => handleBulkAction('active')}
                                    disabled={bulkLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                                    Activate
                                </button>
                                <button
                                    onClick={() => handleBulkAction('suspended')}
                                    disabled={bulkLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-400 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PauseCircle className="w-3 h-3" />}
                                    Suspend
                                </button>
                                <button
                                    onClick={() => handleBulkAction('cancelled')}
                                    disabled={bulkLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="px-3 py-1.5 bg-[#1a1a1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] rounded-lg text-gray-400 text-xs transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="bg-[#111113] border border-[#1f1f22] rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-6 h-6 text-cyan animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                            <BadgeCheck className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">No subscriptions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#1f1f22]">
                                        {/* Checkbox */}
                                        <th className="px-4 py-3 text-left w-10">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={el => { if (el) el.indeterminate = someSelected; }}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-600 accent-cyan cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">User</th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Tier</th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Billing</th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Period End</th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Last Renewed</th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">GHL</th>
                                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, idx) => {
                                        const isSelected = selectedIds.has(user.id);
                                        const pastDue    = isPastDue(user.subscription_current_period_end);
                                        const statusLoading  = actionLoading[`status-${user.id}`];
                                        const extendLoading  = actionLoading[`extend-${user.id}`];

                                        return (
                                            <tr
                                                key={user.id}
                                                className={`border-b border-[#1a1a1d] transition-colors ${
                                                    isSelected ? 'bg-cyan/5' : 'hover:bg-[#161618]'
                                                }`}
                                            >
                                                {/* Checkbox */}
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(user.id)}
                                                        className="w-4 h-4 rounded border-gray-600 accent-cyan cursor-pointer"
                                                    />
                                                </td>

                                                {/* User */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-white truncate max-w-[160px]">
                                                        {user.full_name || '—'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[160px]">{user.email}</p>
                                                </td>

                                                {/* Status — editable */}
                                                <td className="px-4 py-3">
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

                                                {/* Tier — editable (uses built-in SUBSCRIPTION_TIERS in EditableCell) */}
                                                <td className="px-4 py-3">
                                                    <EditableCell
                                                        value={user.subscription_tier || 'starter'}
                                                        type="select"
                                                        field="subscription_tier"
                                                        userId={user.id}
                                                        onSave={handleFieldSave}
                                                    />
                                                </td>

                                                {/* Billing cycle — editable */}
                                                <td className="px-4 py-3">
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
                                                <td className="px-4 py-3">
                                                    <EditableCell
                                                        value={user.subscription_current_period_end || ''}
                                                        type="text"
                                                        field="subscription_current_period_end"
                                                        userId={user.id}
                                                        onSave={handleFieldSave}
                                                        displayFormatter={(v) => (
                                                            <span className={`text-xs ${
                                                                !v ? 'text-gray-600'
                                                                : pastDue ? 'text-red-400 font-medium'
                                                                : 'text-gray-300'
                                                            }`}>
                                                                {formatDate(v)}
                                                                {pastDue && v && <span className="ml-1 text-red-500">⚠</span>}
                                                            </span>
                                                        )}
                                                    />
                                                </td>

                                                {/* Last renewed — read-only */}
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(user.subscription_renewed_at)}
                                                    </span>
                                                </td>

                                                {/* GHL provisioned */}
                                                <td className="px-4 py-3">
                                                    {user.ghl_saas_provisioned
                                                        ? <BadgeCheck className="w-4 h-4 text-green-400" />
                                                        : <BadgeX     className="w-4 h-4 text-gray-600"  />
                                                    }
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Activate / Suspend toggle */}
                                                        {user.subscription_status !== 'active' ? (
                                                            <button
                                                                onClick={() => handleQuickStatus(user.id, 'active')}
                                                                disabled={statusLoading}
                                                                title="Activate"
                                                                className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors disabled:opacity-50"
                                                            >
                                                                {statusLoading
                                                                    ? <Loader2  className="w-3.5 h-3.5 animate-spin" />
                                                                    : <PlayCircle className="w-3.5 h-3.5" />
                                                                }
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleQuickStatus(user.id, 'suspended')}
                                                                disabled={statusLoading}
                                                                title="Suspend"
                                                                className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors disabled:opacity-50"
                                                            >
                                                                {statusLoading
                                                                    ? <Loader2    className="w-3.5 h-3.5 animate-spin" />
                                                                    : <PauseCircle className="w-3.5 h-3.5" />
                                                                }
                                                            </button>
                                                        )}

                                                        {/* Extend period */}
                                                        <button
                                                            onClick={() => handleExtendPeriod(user.id)}
                                                            disabled={extendLoading}
                                                            title="Extend period by 1 cycle"
                                                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors disabled:opacity-50"
                                                        >
                                                            {extendLoading
                                                                ? <Loader2    className="w-3.5 h-3.5 animate-spin" />
                                                                : <CalendarDays className="w-3.5 h-3.5" />
                                                            }
                                                        </button>
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
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1 || loading}
                                className="p-2 rounded-lg bg-[#111113] border border-[#2a2a2d] text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-400 px-2">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages || loading}
                                className="p-2 rounded-lg bg-[#111113] border border-[#2a2a2d] text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
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
