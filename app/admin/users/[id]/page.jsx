"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    Shield,
    ShieldOff,
    Building2,
    FolderKanban,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Save,
    TrendingUp,
    Sparkles,
    Eye,
    RotateCcw,
    Trash2,
    PlayCircle,
    Crown
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const tierColors = {
    starter: "bg-green-500/20 text-green-400 border-green-500/30",
    growth: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    scale: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

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

export default function AdminUserDetail() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id;

    const { session, loading: authLoading } = useAuth();
    const [user, setUser] = useState(null);
    const [funnels, setFunnels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [funnelsLoading, setFunnelsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState({});

    // Editable fields state
    const [editTier, setEditTier] = useState('');
    const [editMaxFunnels, setEditMaxFunnels] = useState('');
    const [editIsAdmin, setEditIsAdmin] = useState(false);

    // Fetch user data
    const fetchUser = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                userId: userId
            });

            const response = await fetchWithAuth(`/api/admin/users?${params}`);
            if (!response.ok) throw new Error('Failed to fetch user');

            const data = await response.json();
            const found = data.users?.[0];

            if (!found) {
                setError('User not found');
                return;
            }

            setUser(found);
            setEditTier(found.subscription_tier || 'starter');
            setEditMaxFunnels(found.max_funnels ?? '');
            setEditIsAdmin(found.is_admin || false);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session, userId]);

    // Fetch user funnels
    const fetchFunnels = useCallback(async () => {
        if (!session) return;
        setFunnelsLoading(true);

        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '50',
                userId
            });

            const response = await fetchWithAuth(`/api/admin/funnels?${params}`);
            if (!response.ok) throw new Error('Failed to fetch funnels');

            const data = await response.json();
            setFunnels(data.funnels || []);
        } catch (err) {
            console.error('Error fetching funnels:', err);
        } finally {
            setFunnelsLoading(false);
        }
    }, [session, userId]);

    useEffect(() => {
        if (!authLoading && session) {
            fetchUser();
            fetchFunnels();
        }
    }, [authLoading, session, fetchUser, fetchFunnels]);

    // Save field update
    const handleFieldUpdate = useCallback(async (field, value) => {
        setSaving(prev => ({ ...prev, [field]: true }));

        try {
            const response = await fetchWithAuth('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'update_field',
                    field,
                    value
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update field');
            }

            const data = await response.json();
            setUser(prev => ({ ...prev, [field]: value }));
            setToast({ message: `Updated ${field.replace('_', ' ')} successfully!`, type: 'success' });
            return data;
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setToast({ message: `Failed: ${error.message}`, type: 'error' });
            throw error;
        } finally {
            setSaving(prev => {
                const newState = { ...prev };
                delete newState[field];
                return newState;
            });
        }
    }, [userId]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-10 h-10 text-cyan animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (error || !user) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-red-400 text-lg font-medium mb-2">{error || 'User not found'}</p>
                    <button
                        onClick={() => router.push('/admin/users')}
                        className="mt-4 px-5 py-2.5 bg-cyan/10 text-cyan rounded-xl hover:bg-cyan/20 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Users
                    </button>
                </div>
            </AdminLayout>
        );
    }

    const joinedDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
        : 'N/A';

    return (
        <AdminLayout>
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Back Button + Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05, x: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/admin/users')}
                            className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all border border-transparent hover:border-cyan/30"
                        >
                            <ArrowLeft className="w-5 h-5 text-cyan" />
                        </motion.button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                                User Details
                            </h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan" />
                                Manage user profile and feature access
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* User Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-cyan/20 p-6 sm:p-8 shadow-xl"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan/30 via-purple-500/20 to-cyan/30 flex items-center justify-center border border-cyan/30 shadow-lg shadow-cyan/10 flex-shrink-0">
                            <User className="w-10 h-10 text-cyan" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-bold text-white truncate">
                                    {user.full_name || 'No Name'}
                                </h2>
                                {user.is_admin && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        Admin
                                    </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${tierColors[user.subscription_tier || 'starter']}`}>
                                    {user.subscription_tier || 'starter'}
                                </span>
                            </div>

                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{user.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span>Joined {joinedDate}</span>
                                </div>
                                {user.business_name && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Building2 className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{user.business_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                            <div className="bg-[#0e0e0f] rounded-xl p-4 border border-cyan/10 text-center min-w-[100px]">
                                <p className="text-2xl font-bold text-cyan">{user.current_funnel_count || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">Funnels</p>
                            </div>
                            <div className="bg-[#0e0e0f] rounded-xl p-4 border border-purple-500/10 text-center min-w-[100px]">
                                <p className="text-2xl font-bold text-purple-400">{user.max_funnels ?? '∞'}</p>
                                <p className="text-xs text-gray-500 mt-1">Max Funnels</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Feature Access Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-purple-500/20 p-6 sm:p-8 shadow-xl"
                >
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-400" />
                        Feature Access & Settings
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Subscription Tier */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Subscription Tier</label>
                            <div className="flex items-center gap-2">
                                <select
                                    value={editTier}
                                    onChange={(e) => setEditTier(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-[#0e0e0f] border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="growth">Growth</option>
                                    <option value="scale">Scale</option>
                                </select>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleFieldUpdate('subscription_tier', editTier)}
                                    disabled={saving.subscription_tier || editTier === user.subscription_tier}
                                    className="p-2.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl border border-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    {saving.subscription_tier
                                        ? <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                        : <Save className="w-4 h-4 text-purple-400" />
                                    }
                                </motion.button>
                            </div>
                        </div>

                        {/* Max Funnels */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Max Funnels</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={editMaxFunnels}
                                    onChange={(e) => setEditMaxFunnels(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-[#0e0e0f] border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                    placeholder="e.g. 5"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleFieldUpdate('max_funnels', Number(editMaxFunnels))}
                                    disabled={saving.max_funnels || String(editMaxFunnels) === String(user.max_funnels)}
                                    className="p-2.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl border border-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    {saving.max_funnels
                                        ? <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                        : <Save className="w-4 h-4 text-purple-400" />
                                    }
                                </motion.button>
                            </div>
                        </div>

                        {/* Admin Toggle */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Admin Role</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const newVal = !editIsAdmin;
                                        setEditIsAdmin(newVal);
                                        handleFieldUpdate('is_admin', newVal);
                                    }}
                                    disabled={saving.is_admin}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-medium ${editIsAdmin
                                        ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                                        : 'bg-[#0e0e0f] border-gray-600/30 text-gray-400 hover:bg-gray-600/10'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {saving.is_admin ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : editIsAdmin ? (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Admin
                                        </>
                                    ) : (
                                        <>
                                            <ShieldOff className="w-4 h-4" />
                                            Regular User
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* User Funnels */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-cyan/20 overflow-hidden shadow-xl"
                >
                    <div className="p-6 sm:p-8 border-b border-cyan/10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FolderKanban className="w-5 h-5 text-cyan" />
                            User Funnels
                            <span className="text-sm font-normal text-gray-500 ml-1">
                                ({funnels.length} total)
                            </span>
                        </h3>
                    </div>

                    {funnelsLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                        </div>
                    ) : funnels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <FolderKanban className="w-14 h-14 text-gray-600 mb-4" />
                            <p className="text-gray-400 text-lg font-medium">No funnels yet</p>
                            <p className="text-gray-500 text-sm mt-1">This user hasn't created any funnels.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-[#0e0e0f] border-b border-cyan/10">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-cyan uppercase tracking-wider">Business Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-cyan uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-cyan uppercase tracking-wider">Vault Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-cyan uppercase tracking-wider">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {funnels.map((funnel, idx) => {
                                        const status = funnel.vault_generation_status || 'not_started';
                                        return (
                                            <motion.tr
                                                key={funnel.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border-b border-cyan/5 hover:bg-[#0e0e0f]/50 transition-all"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-white">{funnel.business_name || 'Unnamed'}</p>
                                                        <p className="text-xs text-gray-500">ID: {funnel.id?.substring(0, 8)}...</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[status]}`}>
                                                        {status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-400">
                                                        {funnel.vault_items_count || 0} items
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-400">
                                                        {funnel.created_at
                                                            ? new Date(funnel.created_at).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })
                                                            : 'N/A'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
}
