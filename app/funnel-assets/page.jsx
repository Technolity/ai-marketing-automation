"use client";
/**
 * Funnel Assets Generation Screen
 * 
 * Connected to existing database schema.
 * Uses /api/os/results for data and existing AI endpoints for regeneration.
 * No mock data fallbacks.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, Lock, RefreshCw, Loader2, ChevronRight,
    Megaphone, Gift, Layout, Video, Mail, MessageSquare,
    Sparkles, Edit3, ArrowRight, Eye, PartyPopper, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Funnel asset types - mapped to saved_sessions.generated_content keys
const FUNNEL_ASSETS = [
    { id: 'ads', title: 'Ad Copy', subtitle: 'Ad variations', icon: Megaphone },
    { id: 'leadMagnet', title: 'Lead Magnet', subtitle: 'Value proposition', icon: Gift },
    { id: 'optinPage', title: 'Opt-in Page', subtitle: 'Lead capture', icon: Layout },
    { id: 'salesPage', title: 'Sales Page', subtitle: 'Complete copy', icon: Video },
    { id: 'emails', title: 'Email Sequence', subtitle: 'Nurture sequence', icon: Mail },
    { id: 'sms', title: 'SMS Sequence', subtitle: 'Text follow-ups', icon: MessageSquare }
];

export default function FunnelAssetsPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [generatedAssets, setGeneratedAssets] = useState({});
    const [dataSource, setDataSource] = useState(null);
    const [approvedAssets, setApprovedAssets] = useState([]);
    const [expandedAsset, setExpandedAsset] = useState(null);
    const [isAllComplete, setIsAllComplete] = useState(false);
    const [generatingAsset, setGeneratingAsset] = useState(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Load assets from database
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadAssets = async () => {
            try {
                // Load from database via API
                const res = await fetchWithAuth('/api/os/results');
                const result = await res.json();

                if (result.error) {
                    console.error("API error:", result.error);
                    toast.error("Failed to load assets");
                    return;
                }

                if (result.data && Object.keys(result.data).length > 0) {
                    setGeneratedAssets(result.data);
                    setDataSource(result.source);
                    console.log('[FunnelAssets] Loaded from:', result.source);
                }

                // Load approvals
                try {
                    const approvalsRes = await fetchWithAuth('/api/os/approvals');
                    if (approvalsRes.ok) {
                        const approvalsData = await approvalsRes.json();
                        if (approvalsData.approvals?.funnelAssets) {
                            setApprovedAssets(approvalsData.approvals.funnelAssets);
                            if (approvalsData.approvals.funnelAssets.length >= FUNNEL_ASSETS.length) {
                                setIsAllComplete(true);
                            }
                        }
                    }
                } catch (e) {
                    // Fallback to localStorage
                    const savedApprovals = localStorage.getItem(`funnel_approvals_${session.user.id}`);
                    if (savedApprovals) {
                        const approvals = JSON.parse(savedApprovals);
                        setApprovedAssets(approvals);
                        if (approvals.length >= FUNNEL_ASSETS.length) {
                            setIsAllComplete(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load assets:", error);
                toast.error("Failed to load assets");
            } finally {
                setIsLoading(false);
            }
        };

        loadAssets();
    }, [session, authLoading, router]);

    const getAssetStatus = (assetId, index) => {
        if (generatingAsset === assetId) return 'generating';
        if (approvedAssets.includes(assetId)) return 'approved';
        if (generatedAssets[assetId]) return 'ready';
        if (index === 0) return 'ready';
        const prevAsset = FUNNEL_ASSETS[index - 1];
        if (approvedAssets.includes(prevAsset.id)) return 'ready';
        return 'locked';
    };

    // Generate asset via existing AI endpoint
    const generateAsset = async (assetId) => {
        setGeneratingAsset(assetId);

        try {
            const res = await fetchWithAuth('/api/os/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: assetId,
                    sessionId: dataSource?.id
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    setGeneratedAssets(prev => ({ ...prev, [assetId]: data.content }));
                    toast.success(`${FUNNEL_ASSETS.find(a => a.id === assetId)?.title} generated!`);
                } else {
                    toast.error("Generation returned no content");
                }
            } else {
                toast.error("Generation failed - check API");
            }
        } catch (error) {
            console.error("Generation error:", error);
            toast.error("Failed to generate content");
        } finally {
            setGeneratingAsset(null);
        }
    };

    const handleApprove = async (assetId, index) => {
        const newApprovals = [...approvedAssets, assetId];
        setApprovedAssets(newApprovals);
        localStorage.setItem(`funnel_approvals_${session.user.id}`, JSON.stringify(newApprovals));

        // Try to save to database
        try {
            await fetchWithAuth('/api/os/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'funnelAssets',
                    approvals: newApprovals
                })
            });
        } catch (e) {
            console.log('Approvals API not available');
        }

        if (newApprovals.length >= FUNNEL_ASSETS.length) {
            setIsAllComplete(true);
            toast.success("🎉 All funnel assets ready!");
        } else {
            toast.success(`${FUNNEL_ASSETS.find(a => a.id === assetId)?.title} approved!`);
            // Auto-generate next if not already generated
            const nextAsset = FUNNEL_ASSETS[index + 1];
            if (nextAsset && !generatedAssets[nextAsset.id]) {
                await generateAsset(nextAsset.id);
            }
        }
        setExpandedAsset(null);
    };

    const handleRegenerate = async (assetId) => {
        setIsRegenerating(true);
        await generateAsset(assetId);
        setIsRegenerating(false);
    };

    const formatContent = (content) => {
        if (!content) return "No content generated yet.";
        if (typeof content === 'string') return content;
        return Object.entries(content)
            .filter(([k]) => k !== 'id' && k !== '_contentName')
            .map(([k, v]) => `**${k}:** ${typeof v === 'object' ? JSON.stringify(v, null, 2) : v}`)
            .join('\n\n');
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // All Complete Screen
    if (isAllComplete) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-xl w-full"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30"
                    >
                        <PartyPopper className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 tracking-tighter px-4">
                        Funnel Assets Ready! 🎉
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 sm:mb-8 leading-relaxed px-4">
                        All content generated. Let's build your funnel!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                        <button
                            onClick={() => router.push('/build-funnel')}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:brightness-110 transition-all shadow-xl shadow-cyan/30"
                        >
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                            Build My Funnel
                        </button>
                        <button
                            onClick={() => router.push('/vault')}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#1b1b1d] border border-[#2a2a2d] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#252528] transition-all"
                        >
                            View in Vault
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8 xl:p-12">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => router.push('/funnel-recommendation')}
                    className="mb-4 sm:mb-6 p-2 -ml-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="sm:hidden">Back</span>
                    <span className="hidden sm:inline">Back to Funnel Selection</span>
                </button>

                {/* Header */}
                <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-cyan/10 text-cyan text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                        Building Your Funnel
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 tracking-tighter">
                        Funnel Assets
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-xl mx-auto px-4">
                        Approve each asset to unlock the next.
                    </p>
                    {dataSource && (
                        <p className="text-xs text-gray-600 mt-2">
                            Data from: {dataSource.name || dataSource.type}
                        </p>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-8 sm:mb-10 lg:mb-12">
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-cyan font-medium">
                            {approvedAssets.length} of {FUNNEL_ASSETS.length}
                        </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-[#1b1b1d] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(approvedAssets.length / FUNNEL_ASSETS.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-cyan to-green-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Asset Checklist */}
                <div className="space-y-3 sm:space-y-4">
                    {FUNNEL_ASSETS.map((asset, index) => {
                        const status = getAssetStatus(asset.id, index);
                        const Icon = asset.icon;
                        const isExpanded = expandedAsset === asset.id;
                        const content = generatedAssets[asset.id];

                        return (
                            <motion.div
                                key={asset.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                  rounded-xl sm:rounded-2xl border overflow-hidden transition-all
                  ${status === 'approved'
                                        ? 'bg-green-500/5 border-green-500/30'
                                        : status === 'generating'
                                            ? 'bg-cyan/5 border-cyan/30 animate-pulse'
                                            : status === 'ready'
                                                ? 'bg-[#1b1b1d] border-cyan/30 shadow-lg shadow-cyan/10'
                                                : 'bg-[#131314] border-[#2a2a2d] opacity-60'
                                    }
                `}
                            >
                                <button
                                    onClick={() => status !== 'locked' && status !== 'generating' && setExpandedAsset(isExpanded ? null : asset.id)}
                                    disabled={status === 'locked' || status === 'generating'}
                                    className={`w-full p-4 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-4 text-left ${status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                                >
                                    <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0
                    ${status === 'approved' ? 'bg-green-500/20' : status === 'generating' ? 'bg-cyan/20' : status === 'ready' ? 'bg-cyan/20' : 'bg-gray-700/50'}
                  `}>
                                        {status === 'generating' ? (
                                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan animate-spin" />
                                        ) : status === 'approved' ? (
                                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                        ) : status === 'locked' ? (
                                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                        ) : (
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-base sm:text-lg ${status === 'approved' ? 'text-green-400' : status === 'generating' ? 'text-cyan' : status === 'ready' ? 'text-white' : 'text-gray-500'}`}>
                                            {asset.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">{asset.subtitle}</p>
                                    </div>

                                    {status !== 'locked' && status !== 'generating' && (
                                        <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isExpanded && status !== 'locked' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-[#2a2a2d]"
                                        >
                                            <div className="p-4 sm:p-5 lg:p-6">
                                                <div className="bg-[#0e0e0f] rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
                                                    <pre className="text-gray-300 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-sans">
                                                        {formatContent(content)}
                                                    </pre>
                                                </div>

                                                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                                                    {status === 'ready' && (
                                                        <button
                                                            onClick={() => handleApprove(asset.id, index)}
                                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all text-sm sm:text-base"
                                                        >
                                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            Approve
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleRegenerate(asset.id)}
                                                        disabled={isRegenerating}
                                                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-[#2a2a2d] text-white rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all disabled:opacity-50 text-sm sm:text-base"
                                                    >
                                                        {isRegenerating ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                        <span className="hidden sm:inline">Regenerate</span>
                                                        <span className="sm:hidden">Regen</span>
                                                    </button>

                                                    <button
                                                        onClick={() => toast.info("Edit mode coming soon!")}
                                                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 border border-[#2a2a2d] text-gray-400 rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1b1b1d] transition-all text-sm sm:text-base"
                                                    >
                                                        <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
