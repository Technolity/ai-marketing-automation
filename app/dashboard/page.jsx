"use client";
/**
 * Dashboard Page - Funnel/Business-Based View
 * 
 * New UX:
 * - Shows user's businesses (funnels) as cards
 * - Each business = folder with its own vault content
 * - Tier controls: limit on number of businesses
 * - No save/load sessions - everything auto-saved per business
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Plus, FolderOpen, ChevronRight, Sparkles,
    Clock, CheckCircle2, Lock, Building2, Trash2,
    AlertTriangle, Crown, ChevronDown, Beaker
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import { SAMPLE_DATA_OPTIONS } from "@/lib/sampleData";

// Tier limits
const TIER_LIMITS = {
    free: 1,
    tier1: 1,
    tier2: 3,
    tier3: 10
};

export default function Dashboard() {
    const router = useRouter();
    const { session, user, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [businesses, setBusinesses] = useState([]);
    const [userTier, setUserTier] = useState('tier1');
    const [maxFunnels, setMaxFunnels] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [showSampleDropdown, setShowSampleDropdown] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!session) {
            router.push("/auth/login");
            return;
        }

        loadUserData();
    }, [session, authLoading, router]);

    const loadUserData = async () => {
        try {
            // Load user profile for tier info
            const profileRes = await fetchWithAuth('/api/user/profile');
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setUserTier(profileData.subscription_tier || 'tier1');
                setMaxFunnels(profileData.max_funnels || TIER_LIMITS[profileData.subscription_tier] || 1);
            }

            // Load user's businesses/funnels
            const funnelsRes = await fetchWithAuth('/api/user/funnels');
            if (funnelsRes.ok) {
                const funnelsData = await funnelsRes.json();
                const userFunnels = funnelsData.funnels || [];

                // If user has no businesses, redirect to introduction to create their first one
                if (userFunnels.length === 0) {
                    console.log('[Dashboard] No businesses found, redirecting to introduction');
                    router.replace('/introduction');
                    return;
                }

                setBusinesses(userFunnels);
            }
        } catch (error) {
            console.error('[Dashboard] Load error:', error);
            toast.error("Failed to load your businesses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBusiness = async () => {
        if (!newBusinessName.trim()) {
            toast.error("Please enter a business name");
            return;
        }

        if (businesses.length >= maxFunnels) {
            toast.error(`You've reached your limit of ${maxFunnels} business(es). Upgrade to create more.`);
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetchWithAuth('/api/user/funnels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBusinessName.trim(),
                    description: ''
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create business');
            }

            const data = await res.json();
            toast.success("Business created! Let's build your assets.");
            setShowCreateModal(false);
            setNewBusinessName('');

            // Navigate to intake form with new funnel ID
            router.push(`/intake_form?funnel_id=${data.funnel.id}`);
        } catch (error) {
            console.error('[Dashboard] Create error:', error);
            toast.error(error.message || "Failed to create business");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBusiness = async (funnelId, businessName) => {
        if (!confirm(`Are you sure you want to delete "${businessName}"? This cannot be undone.`)) {
            return;
        }

        setIsDeleting(funnelId);
        try {
            const res = await fetchWithAuth(`/api/user/funnels?id=${funnelId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Delete failed');

            setBusinesses(prev => prev.filter(b => b.id !== funnelId));
            toast.success("Business deleted");
        } catch (error) {
            console.error('[Dashboard] Delete error:', error);
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(null);
        }
    };

    const getProgressPercentage = (business) => {
        if (business.vault_generated) {
            // After generation, progress is based on vault approvals (13 sections total)
            const approvedCount = business.approved_count || 0;
            return Math.min(100, Math.round((approvedCount / 13) * 100));
        }
        // Before generation, progress is based on intake steps (20 steps total)
        const completedSteps = business.completed_steps_count || 0;
        const totalSteps = 20;
        return Math.min(100, Math.round((completedSteps / totalSteps) * 100));
    };

    const getBusinessStatus = (business) => {
        if (business.vault_generated) return 'complete';
        if (business.completed_steps_count > 0) return 'in-progress';
        return 'new';
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    const canCreateMore = businesses.length < maxFunnels;

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-[#0e0e0f] relative overflow-hidden">
            {/* Mesh Gradient Overlays */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="flex flex-col items-start gap-1 mb-4">
                            {/* Logo */}
                            <img
                                src="/tedos-logo.png"
                                alt="TedOS"
                                className="h-20 w-auto object-contain -ml-2"
                            />

                            {/* Dashboard Text */}
                            <h1 className="text-2xl md:text-3xl font-black text-cyan tracking-tight uppercase">
                                Dashboard
                            </h1>
                        </div>
                        <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                            Manage your business assets and marketing systems.
                            You have used <span className="text-cyan font-bold">{businesses.length}</span> of <span className="text-white font-bold">{maxFunnels}</span> available slots.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {userTier !== 'tier1' && (
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md shadow-xl shadow-black/20">
                                <Crown className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent italic uppercase tracking-wider">
                                    {userTier === 'tier2' ? 'Pro' : userTier === 'tier3' ? 'Enterprise' : 'Premium'}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={() => canCreateMore ? setShowCreateModal(true) : toast.error('Upgrade to create more businesses')}
                            disabled={!canCreateMore}
                            className={`group relative px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all duration-500 overflow-hidden ${canCreateMore
                                ? 'bg-white text-black hover:scale-[1.02] shadow-2xl shadow-cyan/20'
                                : 'bg-[#1b1b1d] text-gray-600 cursor-not-allowed border border-white/5'
                                }`}
                        >
                            {canCreateMore && (
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                            )}
                            {canCreateMore ? (
                                <>
                                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                                    <span>New Business</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    <span>Limit Reached</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>


                {/* Empty State */}
                {businesses.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 bg-cyan/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Building2 className="w-10 h-10 text-cyan" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Create Your First Business</h2>
                        <p className="text-gray-400 max-w-md mx-auto mb-8">
                            Answer 20 quick questions about your business, and TedOS will generate your complete marketing vault with messages, scripts, funnels, and more.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-500 text-black rounded-xl font-black flex items-center gap-3 mx-auto hover:brightness-110 transition-all"
                        >
                            <Sparkles className="w-5 h-5" />
                            Create Your First Business
                        </button>
                    </motion.div>
                )}

                {/* Business Cards Grid */}
                {businesses.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {businesses.map((business, index) => {
                            const status = getBusinessStatus(business);
                            const progress = getProgressPercentage(business);

                            return (
                                <motion.div
                                    key={business.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative group bg-[#161617]/40 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden transition-all duration-500 hover:border-cyan/40 hover:translate-y-[-4px] hover:shadow-[0_20px_50px_-12px_rgba(0,255,255,0.15)] shadow-2xl shadow-black/40"
                                >
                                    {/* Card Header */}
                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg ${status === 'complete' ? 'bg-green-500/10' :
                                                    status === 'in-progress' ? 'bg-amber-500/10' :
                                                        'bg-cyan/10'
                                                    }`}>
                                                    {status === 'complete' ? (
                                                        <CheckCircle2 className="w-7 h-7 text-green-400" />
                                                    ) : status === 'in-progress' ? (
                                                        <Clock className="w-7 h-7 text-amber-400" />
                                                    ) : (
                                                        <FolderOpen className="w-7 h-7 text-cyan" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white group-hover:text-cyan transition-colors">{business.funnel_name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`w-2 h-2 rounded-full ${status === 'complete' ? 'bg-green-400 animate-pulse' :
                                                            status === 'in-progress' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                                                        <p className="text-sm text-gray-500 font-medium">
                                                            {status === 'complete' ? 'Vault Ready' :
                                                                status === 'in-progress' ? `${progress}% Complete` :
                                                                    'Awaiting Setup'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBusiness(business.id, business.funnel_name);
                                                }}
                                                disabled={isDeleting === business.id}
                                                className="p-3 text-gray-600 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-transparent hover:border-red-500/20"
                                            >
                                                {isDeleting === business.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Progress Indicator */}
                                        <div className="mb-8">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[10px] uppercase tracking-widest font-black text-gray-600">Progress</span>
                                                <span className="text-sm font-bold text-gray-400">{progress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className={`h-full bg-gradient-to-r ${status === 'complete' ? 'from-green-500 to-emerald-400' : 'from-cyan to-blue-500'} rounded-full`}
                                                />
                                            </div>
                                        </div>

                                        {/* Card Action */}
                                        <button
                                            onClick={() => {
                                                if (status === 'complete') {
                                                    router.push(`/vault?funnel_id=${business.id}`);
                                                } else {
                                                    router.push(`/intake_form?funnel_id=${business.id}`);
                                                }
                                            }}
                                            className="w-full group/btn relative py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300"
                                        >
                                            <span className="text-sm font-black text-white uppercase tracking-widest group-hover/btn:translate-x-[-4px] transition-transform">
                                                {status === 'complete' ? 'Access Vault' :
                                                    status === 'in-progress' ? 'Resume Build' :
                                                        'Begin Integration'}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-cyan group-hover/btn:translate-x-[4px] transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Add New Card (if can create more) */}
                        {canCreateMore && businesses.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: businesses.length * 0.1 }}
                                onClick={() => setShowCreateModal(true)}
                                className="group relative bg-white/[0.02] backdrop-blur-md rounded-[2rem] border-2 border-dashed border-white/10 min-h-[280px] flex flex-col items-center justify-center gap-5 hover:border-cyan/40 hover:bg-white/[0.05] transition-all duration-500 overflow-hidden shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 border border-white/10 group-hover:bg-cyan/20 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                                    <Plus className="w-8 h-8 text-gray-400 group-hover:text-cyan transition-colors" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-gray-500 group-hover:text-white font-black uppercase tracking-widest text-xs mb-1 transition-colors">
                                        Grow Your Empire
                                    </span>
                                    <span className="text-gray-400 group-hover:text-gray-200 font-medium text-sm transition-colors px-6">
                                        Add Another Business
                                    </span>
                                </div>
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Business Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-8 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 bg-cyan/10 rounded-2xl flex items-center justify-center mb-6">
                                <Building2 className="w-7 h-7 text-cyan" />
                            </div>

                            <h2 className="text-2xl font-black text-white mb-2">Create New Business</h2>
                            <p className="text-gray-400 mb-6">
                                Give your business a name. You'll answer questions about it next.
                            </p>

                            <input
                                type="text"
                                value={newBusinessName}
                                onChange={(e) => setNewBusinessName(e.target.value)}
                                placeholder="e.g. My Coaching Business"
                                className="w-full px-4 py-4 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors mb-6"
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateBusiness()}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-[#2a2a2d] text-white rounded-xl font-medium hover:bg-[#3a3a3d] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateBusiness}
                                    disabled={isCreating || !newBusinessName.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan to-blue-500 text-black rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Create
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
