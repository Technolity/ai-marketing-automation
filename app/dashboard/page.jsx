"use client";
import Link from 'next/link';
/**
 * Dashboard Page - V2
 * 
 * Features:
 * - GHL Metrics Widgets (Pipeline Value, Opps)
 * - Interactive Business List (nifty list view)
 * - Clerk Profile Integration
 * - Tier Controls
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Plus, FolderOpen, ChevronRight, Sparkles,
    Clock, CheckCircle2, Lock, Building2, Trash2,
    Crown, ExternalLink, Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserButton } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import GHLWidgets from "@/components/dashboard/GHLWidgets";

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
                // If user has no businesses, redirect to introduction
                if (userFunnels.length === 0) {
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
            toast.error("Please enter a marketing engine name");
            return;
        }

        if (businesses.length >= maxFunnels) {
            toast.error(`You've reached your limit of ${maxFunnels} marketing engine(s). Upgrade to create more.`);
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
            toast.success("Marketing Engine created! Let's build your assets.");
            setShowCreateModal(false);
            setNewBusinessName('');
            loadUserData(); // Reload list
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
            toast.success("Marketing Engine deleted");
        } catch (error) {
            console.error('[Dashboard] Delete error:', error);
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(null);
        }
    };

    const getProgressPercentage = (business) => {
        if (business.vault_generated) {
            const approvedCount = business.approved_count || 0;
            return Math.min(100, Math.round((approvedCount / 13) * 100));
        }
        const completedSteps = business.completed_steps_count || 0;
        return Math.min(100, Math.round((completedSteps / 20) * 100));
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
        <div className="min-h-screen bg-[#0e0e0f] relative overflow-hidden">
            {/* Mesh Gradient Overlays */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-0 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-6 group cursor-pointer transition-opacity hover:opacity-80">
                        <img src="/tedos-logo.png" alt="TedOS" className="h-16 w-auto object-contain" />
                        <div className="h-10 w-px bg-white/10" />
                        <span className="text-3xl font-bold text-white tracking-tight">Console</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {userTier !== 'tier1' && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md">
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">
                                    {userTier === 'tier2' ? 'Pro' : 'Enterprise'}
                                </span>
                            </div>
                        )}

                        {/* Clerk User Button */}
                        <div className="p-1 rounded-full bg-white/5 border border-white/10 hover:border-cyan/50 transition-colors">
                            <UserButton
                                afterSignOutUrl="/auth/login"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9"
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* GHL Metrics Widgets */}
                <GHLWidgets />

                {/* Businesses Section */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white mb-1">Your Marketing Engines</h2>
                        <p className="text-gray-400 text-sm">
                            {businesses.length} active of {maxFunnels} allowed slots
                        </p>
                    </div>

                    {canCreateMore && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-cyan to-blue-500 text-black text-sm font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Marketing Engine
                        </button>
                    )}
                </div>

                {/* Interactive Business List */}
                <div className="space-y-3">
                    {businesses.map((business, index) => {
                        const status = getBusinessStatus(business);
                        const progress = getProgressPercentage(business);

                        return (
                            <motion.div
                                key={business.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-[#161617]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 hover:bg-white/5 hover:border-cyan/20 transition-all cursor-default"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon Box */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${status === 'complete' ? 'bg-green-500/10 text-green-400' :
                                        status === 'in-progress' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-cyan/10 text-cyan'
                                        }`}>
                                        {status === 'complete' ? <CheckCircle2 className="w-6 h-6" /> :
                                            status === 'in-progress' ? <Clock className="w-6 h-6" /> :
                                                <Sparkles className="w-6 h-6" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-white truncate">{business.funnel_name}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${status === 'complete' ? 'bg-green-500/20 text-green-400' :
                                                'bg-white/5 text-gray-400'
                                                }`}>
                                                {status === 'complete' ? 'Active' : 'Building'}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-3 mt-1.5 max-w-xs">
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${status === 'complete' ? 'bg-green-500' : 'bg-cyan'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-500">{progress}%</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={() => handleDeleteBusiness(business.id, business.funnel_name)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete Marketing Engine"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div className="h-8 w-px bg-white/10 mx-1" />

                                        <button
                                            onClick={() => router.push(`/vault?funnel_id=${business.id}`)}
                                            className="px-4 py-2 bg-white/5 hover:bg-cyan/10 text-gray-300 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                        >
                                            <FolderOpen className="w-4 h-4" />
                                            Open Vault
                                        </button>

                                        {status !== 'complete' && (
                                            <button
                                                onClick={() => router.push(`/intake_form?funnel_id=${business.id}`)}
                                                className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2"
                                            >
                                                Continue
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Create Modal */}
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
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-8 w-full max-w-md shadow-2xl shadow-cyan/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 bg-cyan/10 rounded-2xl flex items-center justify-center mb-6">
                                <Building2 className="w-7 h-7 text-cyan" />
                            </div>

                            <h2 className="text-2xl font-black text-white mb-2">Create New Brand</h2>
                            <p className="text-gray-400 mb-6 font-medium">
                                What's your brand or business called?
                            </p>

                            <input
                                type="text"
                                value={newBusinessName}
                                onChange={(e) => setNewBusinessName(e.target.value)}
                                placeholder="e.g. Acme Coaching, Sarah's Wellness"
                                className="w-full px-4 py-4 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors mb-6 font-medium"
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateBusiness()}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-[#2a2a2d] text-white rounded-xl font-bold hover:bg-[#3a3a3d] transition-colors"
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
                                            Create Brand
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
