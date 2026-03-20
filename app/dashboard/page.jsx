"use client";
import Link from 'next/link';
import Image from 'next/image';
/**
 * Dashboard Page - V3 (Tabbed Layout)
 * 
 * Features:
 * - Tab 1: Marketing Engines (Funnels/Vaults list)
 * - Tab 2: Live Performance (Analytics widgets)
 * - Clerk Profile Integration
 * - Tier Controls
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    Loader2, Plus, FolderOpen, ChevronRight, Sparkles,
    Clock, CheckCircle2, Lock, Building2, Trash2,
    ExternalLink, Settings, Users, Rocket,
    BarChart3, Zap, Pencil, Check, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserButton } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import GHLWidgets from "@/components/dashboard/GHLWidgets";
import LaunchBuilderButton from "@/components/LaunchBuilderButton";
import DeployedFunnelCard from "@/components/vault/DeployedFunnelCard";
import PlanBadge from "@/components/PlanBadge";

// Tab definitions
const TABS = [
    {
        id: 'engines',
        label: 'Marketing Engines',
        icon: Rocket,
        description: 'Your AI-generated marketing systems — funnels, emails, scripts, and automations.'
    },
    {
        id: 'performance',
        label: 'Live Performance',
        icon: BarChart3,
        description: 'Real-time analytics — leads, revenue, appointments, and pipeline performance.'
    }
];

// Tier limits
const TIER_LIMITS = {
    free: 1,
    tier1: 1,
    tier2: 3,
    tier3: 10
};

export default function Dashboard() {
    const router = useRouter();
    const { session, user, loading: authLoading, isProfileComplete, isTeamMember, workspaceName, isAdmin } = useAuth();

    const [activeTab, setActiveTab] = useState('engines');
    const [isLoading, setIsLoading] = useState(true);
    const [businesses, setBusinesses] = useState([]);
    const [userTier, setUserTier] = useState('tier1');
    const [canManageTeam, setCanManageTeam] = useState(false);
    const [maxFunnels, setMaxFunnels] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [hasDeployedFunnel, setHasDeployedFunnel] = useState(false);
    const [builderLocationId, setBuilderLocationId] = useState('');
    const [editingFunnelId, setEditingFunnelId] = useState(null);
    const [editNameValue, setEditNameValue] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const editInputRef = useRef(null);
    const tabRefs = useRef({});
    const prefersReducedMotion = useReducedMotion();



    const loadUserData = useCallback(async () => {
        try {
            // Load user profile for tier info
            const profileRes = await fetchWithAuth('/api/user/profile');
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setUserTier(profileData.subscription_tier || 'tier1');
                setMaxFunnels(profileData.max_funnels || TIER_LIMITS[profileData.subscription_tier] || 1);
                setCanManageTeam(['growth', 'scale'].includes(profileData.subscription_tier) || isAdmin);
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

                // Check if any funnel has been deployed
                const deployed = userFunnels.some(f => f.deployed_at);
                setHasDeployedFunnel(deployed);

                // Fetch builder location_id if there's a deployed funnel
                if (deployed) {
                    try {
                        const builderRes = await fetchWithAuth('/api/builder/location');
                        if (builderRes.ok) {
                            const builderData = await builderRes.json();
                            if (builderData.available && builderData.locationId) {
                                setBuilderLocationId(builderData.locationId);
                            }
                        }
                    } catch (err) {
                        console.error('[Dashboard] Builder location fetch error:', err);
                    }
                }
            }
        } catch (error) {
            console.error('[Dashboard] Load error:', error);
            toast.error("Failed to load your businesses");
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, router]);

    useEffect(() => {
        if (authLoading) return;

        if (isAdmin) {
            setCanManageTeam(true);
        }

        if (!session) {
            router.push("/auth/login");
            return;
        }

        // Redirect to onboarding if profile is incomplete
        if (isProfileComplete === false) {
            console.log('[Dashboard] Profile incomplete, redirecting to onboarding');
            router.push("/onboarding");
            return;
        }

        loadUserData();
    }, [session, authLoading, router, isProfileComplete, isAdmin, loadUserData]);

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

            toast.success("Marketing Engine deleted");
            await loadUserData(); // Reload from server to sync counts
        } catch (error) {
            console.error('[Dashboard] Delete error:', error);
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(null);
        }
    };

    const startEditing = (business) => {
        setEditingFunnelId(business.id);
        setEditNameValue(business.funnel_name);
        setTimeout(() => editInputRef.current?.focus(), 50);
    };

    const cancelEditing = () => {
        setEditingFunnelId(null);
        setEditNameValue('');
    };

    const handleRenameBusiness = async (funnelId) => {
        const trimmed = editNameValue.trim();
        if (!trimmed) {
            toast.error('Name cannot be empty');
            return;
        }

        // Find the current name to check if it actually changed
        const current = businesses.find(b => b.id === funnelId);
        if (current && current.funnel_name === trimmed) {
            cancelEditing();
            return;
        }

        setIsSavingName(true);
        try {
            const res = await fetchWithAuth('/api/user/funnels', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelId, name: trimmed })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to rename');
            }

            toast.success('Marketing Engine name updated');
            // Optimistically update local state
            setBusinesses(prev => prev.map(b => b.id === funnelId ? { ...b, funnel_name: trimmed } : b));
            cancelEditing();
        } catch (error) {
            console.error('[Dashboard] Rename error:', error);
            toast.error(error.message || 'Failed to rename');
        } finally {
            setIsSavingName(false);
        }
    };

    const getProgressPercentage = (business) => {
        if (business.deployed_at) return 100;
        if (business.vault_generated) {
            const approvedCount = business.approved_count || 0;
            // Total sections: Phase 1 (4) + Phase 2 (10) + Phase 3 (2) = 16
            return Math.min(100, Math.round((approvedCount / 16) * 100));
        }
        const completedSteps = business.completed_steps_count || 0;
        return Math.min(100, Math.round((completedSteps / 20) * 100));
    };

    const getBusinessStatus = (business) => {
        if (business.deployed_at) return 'deployed';
        if (business.vault_generated) return 'complete';
        if (business.completed_steps_count > 0) return 'in-progress';
        return 'new';
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-surface">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    const canCreateMore = businesses.length < maxFunnels;

    return (
        <div className="min-h-screen bg-surface relative selection:bg-cyan/20 selection:text-cyan">
            {/* Softened Mesh Gradient Overlays */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />

            {/* Subtle top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent opacity-50" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pb-12">
                {/* Unified Header & Nav */}
                <header className="flex items-center justify-between py-6 mb-10 border-b border-white/5">
                    {/* Left: Brand */}
                    <Link href="/" className="flex items-center gap-4 group cursor-pointer">
                        <Image src="/tedos-logo.png" alt="TedOS" width={56} height={56} className="h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]" priority />
                        <div className="h-8 w-px bg-white/10" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-cyan via-white to-cyan bg-clip-text text-transparent tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">
                            Console
                        </span>
                    </Link>

                    {/* Center: Tabs */}
                    <div className="hidden md:flex bg-grayDark/80 backdrop-blur-md border border-white/5 rounded-full p-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-cyan/40 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white/10 rounded-full border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                            transition={{ type: "spring", bounce: 0, duration: 0.6 }} // Slower, no bounce
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan' : 'text-gray-500'}`} />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: User & Tiers */}
                    <div className="flex items-center gap-5">
                        {canManageTeam && (
                            <button
                                onClick={() => router.push('/team')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-gray-200 hover:text-white hover:border-cyan/30 hover:bg-cyan/10 transition-all focus:outline-none focus:ring-2 focus:ring-cyan/40"
                            >
                                <Users className="w-3.5 h-3.5 text-cyan" />
                                <span className="hidden sm:inline">Manage Team</span>
                            </button>
                        )}
                        <PlanBadge tier={userTier} />

                        <div className="p-0.5 rounded-full bg-gradient-to-b from-white/10 to-transparent">
                            <div className="p-0.5 rounded-full bg-surface">
                                <UserButton
                                    afterSignOutUrl="/auth/login"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-9 h-9 ring-2 ring-white/5 hover:ring-cyan/30 transition-all"
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {isTeamMember && workspaceName && (
                    <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-950/30 px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-300" />
                            <div>
                                <p className="text-sm text-blue-200 font-semibold">Team Member Workspace</p>
                                <p className="text-xs text-blue-300/80">You are working inside <span className="font-semibold">{workspaceName}</span>.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/team')}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-200 border border-blue-500/30 hover:bg-blue-500/30 transition"
                        >
                            View Team
                        </button>
                    </div>
                )}

                {/* Mobile Tab Fallback (if needed, mainly for very small screens) */}
                <div className="md:hidden mb-8">
                    <div className="flex gap-1 bg-grayDark border border-white/5 rounded-xl p-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan/40 ${isActive ? 'bg-white/10 text-white' : 'text-gray-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'engines' ? (
                        <motion.div
                            key="engines"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* Marketing Engines Header */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-1">Your Marketing Engines</h2>
                                    <p className="text-gray-400 text-sm">
                                        {businesses.length} active of {maxFunnels} allowed slots
                                    </p>
                                </div>

                                {canCreateMore && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-cyan to-blue-500 text-black text-sm font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan/50"
                                    >
                                        <Plus className="w-4 h-4" />
                                        New Marketing Engine
                                    </button>
                                )}
                            </div>

                            {/* Interactive Business List - Updated Card Design */}
                            <div className="space-y-4">
                                {businesses.map((business, index) => {
                                    const status = getBusinessStatus(business);
                                    const progress = getProgressPercentage(business);

                                    return (
                                        <motion.div
                                            key={business.id}
                                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: prefersReducedMotion ? 0 : index * 0.1, duration: prefersReducedMotion ? 0.15 : 0.4, ease: "easeOut" }}
                                            className="group relative bg-grayDark/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-elevated hover:border-white/10 transition-colors duration-300 shadow-lg shadow-black/20"
                                        >
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                                {/* Icon Box */}
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-inner ${status === 'deployed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                    status === 'complete' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        status === 'in-progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-cyan/5 text-cyan border border-cyan/10'
                                                    }`}>
                                                    {status === 'deployed' ? <Rocket className="w-7 h-7" /> :
                                                        status === 'complete' ? <CheckCircle2 className="w-7 h-7" /> :
                                                            status === 'in-progress' ? <Clock className="w-7 h-7" /> :
                                                                <Sparkles className="w-7 h-7" />}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 py-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {editingFunnelId === business.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    ref={editInputRef}
                                                                    type="text"
                                                                    value={editNameValue}
                                                                    onChange={(e) => setEditNameValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleRenameBusiness(business.id);
                                                                        if (e.key === 'Escape') cancelEditing();
                                                                    }}
                                                                    disabled={isSavingName}
                                                                    className="text-xl font-semibold text-white tracking-tight bg-white/5 border border-cyan/30 rounded-lg px-3 py-1 focus:outline-none focus:border-cyan/60 focus:ring-2 focus:ring-cyan/50 transition-all w-64"
                                                                />
                                                                <button
                                                                    onClick={() => handleRenameBusiness(business.id)}
                                                                    disabled={isSavingName}
                                                                    className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-400/40"
                                                                    title="Save"
                                                                >
                                                                    {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditing}
                                                                    disabled={isSavingName}
                                                                    className="p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group/name">
                                                                <h3 className="text-xl font-semibold text-white truncate tracking-tight">{business.funnel_name}</h3>
                                                                <button
                                                                    onClick={() => startEditing(business)}
                                                                    className="p-1 text-gray-500 hover:text-cyan opacity-0 group-hover/name:opacity-100 transition-all rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:opacity-100"
                                                                    title="Edit name"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${status === 'deployed' ? 'bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                                                            status === 'complete' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                'bg-white/5 text-gray-400 border-white/5'
                                                            }`}>
                                                            {status === 'deployed' ? 'LIVE' : status === 'complete' ? 'Active' : 'Building'}
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="w-full max-w-sm">
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1.5">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${status === 'deployed' || status === 'complete' ? 'bg-green-500' : 'bg-cyan'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-400 font-medium">
                                                            {progress}% Complete
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions - Always Visible for Better UX */}
                                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                                    <button
                                                        onClick={() => handleDeleteBusiness(business.id, business.funnel_name)}
                                                        className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/30"
                                                        title="Delete Marketing Engine"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                    <div className="h-10 w-px bg-white/10" />

                                                    {status === 'deployed' ? (
                                                        <a
                                                            href={builderLocationId ? `https://app.tedos.ai/v2/location/${builderLocationId}/funnels-websites/funnels` : 'https://app.tedos.ai'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-black rounded-xl text-sm font-black hover:brightness-110 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all flex items-center gap-2 shadow-md"
                                                        >
                                                            <ExternalLink className="w-4.5 h-4.5" />
                                                            Go to Builder
                                                        </a>
                                                    ) : (
                                                        <button
                                                            onClick={() => router.push(`/vault?funnel_id=${business.id}`)}
                                                            className="px-5 py-2.5 bg-white/5 hover:bg-cyan/10 text-gray-200 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
                                                        >
                                                            <FolderOpen className="w-4.5 h-4.5" />
                                                            Open Vault
                                                        </button>
                                                    )}

                                                    {status !== 'complete' && status !== 'deployed' && (
                                                        <button
                                                            onClick={() => router.push(`/intake_form?funnel_id=${business.id}`)}
                                                            className="px-5 py-2.5 bg-gradient-to-r from-cyan to-blue-500 text-white rounded-xl text-sm font-bold hover:brightness-110 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2 shadow-md focus:outline-none focus:ring-2 focus:ring-cyan/50"
                                                        >
                                                            Continue
                                                            <ChevronRight className="w-4.5 h-4.5" />
                                                        </button>
                                                    )}

                                                    {/* Secondary Vault Link for Deployed Items */}
                                                    {status === 'deployed' && (
                                                        <button
                                                            onClick={() => router.push(`/vault?funnel_id=${business.id}`)}
                                                            className="px-3 py-2.5 text-gray-400 hover:text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                                                            title="View Vault Assets"
                                                        >
                                                            <FolderOpen className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="performance"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                        >
                            <GHLWidgets />
                        </motion.div>
                    )}
                </AnimatePresence>
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
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="bg-grayDark rounded-3xl border border-white/10 p-8 w-full max-w-md shadow-2xl shadow-black/50"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-cyan/5 rounded-2xl flex items-center justify-center mb-6 border border-cyan/10">
                                <Building2 className="w-8 h-8 text-cyan" />
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-3">Create New Brand</h2>
                            <p className="text-gray-400 mb-8 text-base">
                                What's your brand or business called?
                            </p>

                            <input
                                type="text"
                                value={newBusinessName}
                                onChange={(e) => setNewBusinessName(e.target.value)}
                                placeholder="e.g. Acme Coaching, Sarah's Wellness"
                                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/50 transition-all mb-8 text-lg"
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateBusiness()}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-5 py-3.5 bg-white/5 text-gray-300 rounded-xl font-semibold hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateBusiness}
                                    disabled={isCreating || !newBusinessName.trim()}
                                    className="flex-1 px-5 py-3.5 bg-gradient-to-r from-cyan to-blue-500 text-white rounded-xl font-bold hover:brightness-110 hover:shadow-lg hover:shadow-cyan/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan/50"
                                >
                                    {isCreating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "Create Brand"
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
