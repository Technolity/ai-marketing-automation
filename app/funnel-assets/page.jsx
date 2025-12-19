"use client";
/**
 * Funnel Assets Generation Screen
 * 
 * After selecting a funnel type, this screen generates each asset
 * in a checklist format with approve/regenerate/edit options.
 * 
 * Assets include:
 * - Ads (3 variations)
 * - Free Gift / Lead Magnet
 * - Opt-in Page
 * - VSL Page
 * - Email Sequence (5-15 emails)
 * - SMS Sequence
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, Lock, RefreshCw, Loader2, ChevronRight,
    Megaphone, Gift, Layout, Video, Mail, MessageSquare,
    Sparkles, Edit3, ArrowRight, Eye, PartyPopper
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Funnel asset types in order of generation
const FUNNEL_ASSETS = [
    {
        id: 'ads',
        title: 'Ad Copy',
        subtitle: '3 variations for testing',
        icon: Megaphone,
        description: 'Facebook, Instagram, and Google ad copy'
    },
    {
        id: 'leadMagnet',
        title: 'Free Gift / Lead Magnet',
        subtitle: 'Value proposition for opt-in',
        icon: Gift,
        description: 'Your irresistible free offer'
    },
    {
        id: 'optinPage',
        title: 'Opt-in Page',
        subtitle: 'Lead capture page copy',
        icon: Layout,
        description: 'Headlines, bullets, and CTA'
    },
    {
        id: 'vslPage',
        title: 'VSL / Sales Page',
        subtitle: 'Video sales letter or sales page',
        icon: Video,
        description: 'Complete sales page copy'
    },
    {
        id: 'emails',
        title: 'Email Sequence',
        subtitle: '5-15 day nurture sequence',
        icon: Mail,
        description: 'Follow-up emails to convert leads'
    },
    {
        id: 'sms',
        title: 'SMS Sequence',
        subtitle: 'Text message follow-ups',
        icon: MessageSquare,
        description: 'Short, punchy SMS messages'
    }
];

export default function FunnelAssetsPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    // Core state
    const [isLoading, setIsLoading] = useState(true);
    const [generatedAssets, setGeneratedAssets] = useState({});
    const [approvedAssets, setApprovedAssets] = useState([]);
    const [expandedAsset, setExpandedAsset] = useState(null);
    const [isAllComplete, setIsAllComplete] = useState(false);

    // Generation state
    const [generatingAsset, setGeneratingAsset] = useState(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Load existing assets
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadAssets = async () => {
            try {
                // Check for saved assets in localStorage
                const savedAssets = localStorage.getItem(`funnel_assets_${session.user.id}`);
                const savedApprovals = localStorage.getItem(`funnel_approvals_${session.user.id}`);

                if (savedAssets) {
                    setGeneratedAssets(JSON.parse(savedAssets));
                }
                if (savedApprovals) {
                    const approvals = JSON.parse(savedApprovals);
                    setApprovedAssets(approvals);
                    if (approvals.length >= FUNNEL_ASSETS.length) {
                        setIsAllComplete(true);
                    }
                }

                // Start generating first asset if none exist
                if (!savedAssets || Object.keys(JSON.parse(savedAssets || '{}')).length === 0) {
                    await generateAsset(FUNNEL_ASSETS[0].id);
                }
            } catch (error) {
                console.error("Failed to load assets:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAssets();
    }, [session, authLoading, router]);

    // Get asset status: 'locked' | 'generating' | 'ready' | 'approved'
    const getAssetStatus = (assetId, index) => {
        if (generatingAsset === assetId) return 'generating';
        if (approvedAssets.includes(assetId)) return 'approved';
        if (generatedAssets[assetId]) return 'ready';
        if (index === 0) return 'ready'; // First one is always unlocked

        // Unlock if previous is approved
        const prevAsset = FUNNEL_ASSETS[index - 1];
        if (approvedAssets.includes(prevAsset.id)) return 'ready';

        return 'locked';
    };

    // Generate a specific asset
    const generateAsset = async (assetId) => {
        setGeneratingAsset(assetId);

        try {
            // Simulated generation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock generated content
            const mockContent = {
                ads: {
                    headline: "Stop Struggling With [Problem]...",
                    body: "Discover how [Outcome] is possible in just [Timeframe]...",
                    cta: "Get Free Access →"
                },
                leadMagnet: {
                    title: "The Ultimate Guide to [Topic]",
                    description: "5 secrets to achieving [Outcome]..."
                },
                optinPage: {
                    headline: "Free: [Lead Magnet Title]",
                    subheadline: "Learn the exact system used by...",
                    bullets: ["Bullet 1", "Bullet 2", "Bullet 3"]
                },
                vslPage: {
                    hook: "What if I told you...",
                    story: "I used to struggle with...",
                    offer: "Introducing [Program Name]..."
                },
                emails: {
                    subject1: "Welcome! Here's your [Lead Magnet]",
                    subject2: "Don't make this mistake...",
                    subject3: "[First Name], quick question..."
                },
                sms: {
                    message1: "Hey [Name]! Got your download?",
                    message2: "Quick reminder about..."
                }
            };

            const newAssets = {
                ...generatedAssets,
                [assetId]: mockContent[assetId] || { content: "Generated content for " + assetId }
            };

            setGeneratedAssets(newAssets);
            localStorage.setItem(`funnel_assets_${session.user.id}`, JSON.stringify(newAssets));

            toast.success(`${FUNNEL_ASSETS.find(a => a.id === assetId)?.title} generated!`);
        } catch (error) {
            toast.error("Failed to generate asset");
        } finally {
            setGeneratingAsset(null);
        }
    };

    // Approve an asset
    const handleApprove = async (assetId, index) => {
        const newApprovals = [...approvedAssets, assetId];
        setApprovedAssets(newApprovals);
        localStorage.setItem(`funnel_approvals_${session.user.id}`, JSON.stringify(newApprovals));

        // Check if all complete
        if (newApprovals.length >= FUNNEL_ASSETS.length) {
            setIsAllComplete(true);
            toast.success("🎉 All funnel assets ready!");
        } else {
            toast.success(`${FUNNEL_ASSETS.find(a => a.id === assetId)?.title} approved!`);

            // Auto-generate next asset
            const nextAsset = FUNNEL_ASSETS[index + 1];
            if (nextAsset && !generatedAssets[nextAsset.id]) {
                await generateAsset(nextAsset.id);
            }
        }

        setExpandedAsset(null);
    };

    // Regenerate an asset
    const handleRegenerate = async (assetId) => {
        setIsRegenerating(true);
        await generateAsset(assetId);
        setIsRegenerating(false);
    };

    // Format content for display
    const formatContent = (content) => {
        if (!content) return "Generating...";
        if (typeof content === 'string') return content;
        return Object.entries(content)
            .map(([k, v]) => `**${k}:** ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join('\n\n');
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // All Complete Screen
    if (isAllComplete) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30"
                    >
                        <PartyPopper className="w-16 h-16 text-white" />
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter">
                        Funnel Assets Ready! 🎉
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                        All your funnel content has been generated and approved. Let's build your funnel!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push('/build-funnel')}
                            className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-xl shadow-cyan/30"
                        >
                            <Sparkles className="w-6 h-6" />
                            Build My Funnel
                        </button>
                        <button
                            onClick={() => router.push('/vault')}
                            className="px-8 py-4 bg-[#1b1b1d] border border-[#2a2a2d] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#252528] transition-all"
                        >
                            View in Vault
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan/10 text-cyan text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Building Your Funnel
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
                        Funnel Assets
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto">
                        Approve each asset to unlock the next. All content is customized for your business.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-cyan font-medium">
                            {approvedAssets.length} of {FUNNEL_ASSETS.length} approved
                        </span>
                    </div>
                    <div className="h-2 bg-[#1b1b1d] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(approvedAssets.length / FUNNEL_ASSETS.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-cyan to-green-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Asset Checklist */}
                <div className="space-y-4">
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
                                transition={{ delay: index * 0.1 }}
                                className={`
                  rounded-2xl border overflow-hidden transition-all
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
                                {/* Asset Header */}
                                <button
                                    onClick={() => status !== 'locked' && status !== 'generating' && setExpandedAsset(isExpanded ? null : asset.id)}
                                    disabled={status === 'locked' || status === 'generating'}
                                    className={`w-full p-6 flex items-center gap-4 text-left ${status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                                >
                                    <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${status === 'approved'
                                            ? 'bg-green-500/20'
                                            : status === 'generating'
                                                ? 'bg-cyan/20'
                                                : status === 'ready'
                                                    ? 'bg-cyan/20'
                                                    : 'bg-gray-700/50'
                                        }
                  `}>
                                        {status === 'generating' ? (
                                            <Loader2 className="w-6 h-6 text-cyan animate-spin" />
                                        ) : status === 'approved' ? (
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        ) : status === 'locked' ? (
                                            <Lock className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <Icon className="w-6 h-6 text-cyan" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-lg ${status === 'approved' ? 'text-green-400' : status === 'generating' ? 'text-cyan' : status === 'ready' ? 'text-white' : 'text-gray-500'}`}>
                                            {asset.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">{asset.subtitle}</p>
                                    </div>

                                    {status !== 'locked' && status !== 'generating' && (
                                        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    )}
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && status !== 'locked' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-[#2a2a2d]"
                                        >
                                            <div className="p-6">
                                                {/* Content Preview */}
                                                <div className="bg-[#0e0e0f] rounded-xl p-6 mb-6 max-h-64 overflow-y-auto">
                                                    <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-sans">
                                                        {formatContent(content)}
                                                    </pre>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-3">
                                                    {status === 'ready' && (
                                                        <button
                                                            onClick={() => handleApprove(asset.id, index)}
                                                            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                            Approve
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleRegenerate(asset.id)}
                                                        disabled={isRegenerating}
                                                        className="flex-1 sm:flex-none px-6 py-3 bg-[#2a2a2d] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all disabled:opacity-50"
                                                    >
                                                        {isRegenerating ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="w-5 h-5" />
                                                        )}
                                                        Regenerate
                                                    </button>

                                                    <button
                                                        onClick={() => toast.info("Edit mode coming soon!")}
                                                        className="flex-1 sm:flex-none px-6 py-3 border border-[#2a2a2d] text-gray-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1b1b1d] transition-all"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
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
