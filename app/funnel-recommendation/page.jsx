"use client";
/**
 * Funnel Recommendation Screen
 * 
 * - VSL Funnel: Active and deployable
 * - All other funnels: Locked (under maintenance)
 * 
 * After selecting VSL, user can deploy to GHL directly.
 * NEW: Selective push - users can choose which values to push
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket, ChevronDown, CheckCircle, Loader2, Sparkles,
    BookOpen, Video, Mail, Gift, Megaphone, Layout, Star,
    ArrowRight, ArrowLeft, Lock, AlertTriangle, Wrench,
    Upload, X, Eye, EyeOff, Copy, Check, Clock, Shield, Zap,
    Filter, Search, CheckSquare, Square, Settings, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useSearchParams } from "next/navigation";
import GHLCredentialsForm from "@/components/GHLCredentialsForm";
import GHLPushProgress from "@/components/GHLPushProgress";

// Available funnel types - VSL is the only active one
const FUNNEL_TYPES = [
    {
        id: 'vsl',
        title: 'Marketing Funnel',
        icon: Video,
        description: 'Video sales letter to convert viewers into buyers',
        bestFor: ['courses', 'high-ticket', 'digital products'],
        features: ['Marketing Funnel Page', 'Order Form', 'Upsell Pages', 'Email Follow-up'],
        locked: false
    },
    {
        id: 'free-book',
        title: 'Free Book Funnel',
        icon: BookOpen,
        description: 'Offer a free book or guide to capture leads',
        bestFor: ['coaches', 'consultants', 'authors'],
        features: ['Landing Page', 'Opt-in Form', 'Thank You Page', 'Email Sequence'],
        locked: true,
        lockReason: 'Under maintenance'
    },
    {
        id: 'webinar',
        title: 'Webinar Funnel',
        icon: Megaphone,
        description: 'Live or automated webinar to sell programs',
        bestFor: ['coaches', 'agencies', 'high-ticket services'],
        features: ['Registration Page', 'Thank You Page', 'Webinar Room', 'Offer Page'],
        locked: true,
        lockReason: 'Coming soon'
    },
    {
        id: 'lead-magnet',
        title: 'Lead Magnet Funnel',
        icon: Gift,
        description: 'Free resource to build your email list fast',
        bestFor: ['any business', 'list building'],
        features: ['Squeeze Page', 'Thank You Page', 'Email Nurture'],
        locked: true,
        lockReason: 'Under maintenance'
    },
    {
        id: 'application',
        title: 'Application Funnel',
        icon: Layout,
        description: 'Qualify leads before booking discovery calls',
        bestFor: ['agencies', 'high-ticket coaching'],
        features: ['Sales Page', 'Application Form', 'Calendar Booking'],
        locked: true,
        lockReason: 'Coming soon'
    }
];

export default function FunnelRecommendationPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [businessData, setBusinessData] = useState(null);
    const [selectedFunnel, setSelectedFunnel] = useState(null);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const [funnelId, setFunnelId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadData = async () => {
            const fId = searchParams.get('funnel_id');
            try {
                const res = await fetchWithAuth(`/api/os/results${fId ? `?funnel_id=${fId}` : ''}`);
                const data = await res.json();

                if (data.data) {
                    // Simple normalization for media (key 18)
                    const normalized = { ...data.data };
                    if (normalized['18']) {
                        normalized.media = normalized['18'].data || normalized['18'];
                    }
                    setBusinessData(normalized);
                    // Default to VSL since it's the only active funnel
                    setSelectedFunnel(FUNNEL_TYPES.find(f => f.id === 'vsl'));

                    // Set funnel ID - prioritize URL param, fallback to source.id
                    const urlFunnelId = searchParams.get('funnel_id');
                    if (urlFunnelId) {
                        setFunnelId(urlFunnelId);
                    } else if (data.source?.id) {
                        setFunnelId(data.source.id);
                    }
                }
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [session, authLoading, router, searchParams]);

    const handleSelectFunnel = (funnel) => {
        if (funnel.locked) {
            toast.error(`${funnel.title} is ${funnel.lockReason}`);
            return;
        }
        setSelectedFunnel(funnel);
    };

    // Save funnel choice and proceed to vault
    const handleSaveFunnelChoice = async () => {
        if (!selectedFunnel || selectedFunnel.locked) {
            toast.error("Please select an available funnel");
            return;
        }

        if (!funnelId) {
            toast.error("No funnel ID found");
            return;
        }

        setIsSaving(true);

        try {
            // Save funnel choice to database
            const res = await fetchWithAuth('/api/user/funnels', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnelId: funnelId,
                    funnelType: selectedFunnel.id
                })
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`${selectedFunnel.title} selected! Redirecting to vault...`);

                // Redirect to vault - Phase 2 will now be unlocked
                setTimeout(() => {
                    router.push(`/vault?funnel_id=${funnelId}&phase=2`);
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to save funnel choice');
            }
        } catch (error) {
            console.error("Save funnel choice error:", error);
            toast.error(error.message || "Failed to save funnel choice");
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // VSL Funnel is always the recommended one
    const vslFunnel = FUNNEL_TYPES.find(f => f.id === 'vsl');
    const otherFunnels = FUNNEL_TYPES.filter(f => f.id !== 'vsl');

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => {
                        const fId = searchParams.get('funnel_id') || funnelId;
                        router.push(fId ? `/vault?funnel_id=${fId}` : '/vault');
                    }}
                    className="mb-6 p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Vault
                </button>

                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan/30"
                    >
                        <Rocket className="w-10 h-10 text-white" />
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tighter">
                        Choose Your Funnel
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Select the funnel type that fits your business. This will unlock Phase 2 Marketing Assets in your vault.
                    </p>
                </div>

                {/* Funnel Selection */}
                <>
                    {/* VSL Funnel - Recommended */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectFunnel(vslFunnel)}
                        className={`p-6 rounded-2xl border-2 mb-6 cursor-pointer transition-all ${selectedFunnel?.id === 'vsl'
                            ? 'bg-cyan/10 border-cyan shadow-xl shadow-cyan/20'
                            : 'bg-[#1b1b1d] border-[#2a2a2d] hover:border-cyan/50'
                            }`}
                    >
                        <div className="flex items-start gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-cyan/20 flex items-center justify-center flex-shrink-0">
                                <Video className="w-7 h-7 text-cyan" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{vslFunnel.title}</h2>
                                    <span className="px-3 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3" /> RECOMMENDED
                                    </span>
                                </div>
                                <p className="text-gray-400 mb-4">{vslFunnel.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {vslFunnel.features.map((feature, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-[#2a2a2d] text-gray-300 text-sm rounded-lg flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {selectedFunnel?.id === 'vsl' && (
                                <CheckCircle className="w-8 h-8 text-cyan flex-shrink-0" />
                            )}
                        </div>
                    </motion.div>

                    {/* Other Funnels - Locked */}
                    <div className="mb-8">
                        <button
                            onClick={() => setShowAlternatives(!showAlternatives)}
                            className="w-full flex items-center justify-center gap-2 py-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <span>See other funnel options</span>
                            <ChevronDown className={`w-5 h-5 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showAlternatives && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    {otherFunnels.map((funnel, idx) => {
                                        const Icon = funnel.icon;
                                        return (
                                            <motion.div
                                                key={funnel.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="p-5 rounded-xl border bg-[#131314] border-[#2a2a2d] opacity-60 cursor-not-allowed"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                                                        <Lock className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-gray-500">{funnel.title}</h3>
                                                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded flex items-center gap-1">
                                                                <Wrench className="w-3 h-3" />
                                                                {funnel.lockReason}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{funnel.description}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Continue Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center"
                    >
                        <button
                            onClick={handleSaveFunnelChoice}
                            disabled={!selectedFunnel || selectedFunnel.locked || isSaving}
                            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-2xl shadow-cyan/30 mx-auto disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    Continue to Vault
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                        <p className="text-sm text-gray-500 mt-4">
                            This will unlock Phase 2 marketing assets
                        </p>
                    </motion.div>
                </>

            </div>

            {/* Matrix Decoration */}
            <div className="absolute top-10 right-10 opacity-10">
                <Shield className="w-20 h-20 text-green-400" />
            </div>
            <div className="absolute bottom-10 left-10 opacity-10">
                <Zap className="w-20 h-20 text-cyan" />
            </div>
        </div>
    );
}

/**
 * Premium Success View with Countdown Redirection
 */
function StepComplete({ isActive, sessionId, router }) {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!isActive) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(`/vault?phase=2${sessionId ? `&session_id=${sessionId}` : ''}`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, sessionId, router]);

    if (!isActive) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-8 bg-[#0c0c0d] border border-white/5 rounded-[2.5rem] relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent pointer-events-none" />

            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-500 text-black flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]"
            >
                <CheckCircle className="w-12 h-12" />
            </motion.div>

            <h2 className="text-4xl font-black mb-4 tracking-tight">MISSION ACCOMPLISHED</h2>
            <p className="text-gray-400 mb-12 max-w-md mx-auto leading-relaxed text-lg">
                Your marketing funnel has been successfully deployed to GoHighLevel. All assets are synchronized and ready for use.
            </p>

            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={() => router.push(`/vault?phase=2${sessionId ? `&session_id=${sessionId}` : ''}`)}
                    className="px-10 py-5 bg-white text-black rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
                >
                    Proceed to Assets
                    <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Clock className="w-4 h-4" />
                    Auto-redirecting in {countdown}s...
                </div>
            </div>

            {/* Matrix Decoration */}
            <div className="absolute top-10 right-10 opacity-10">
                <Shield className="w-20 h-20 text-green-400" />
            </div>
            <div className="absolute bottom-10 left-10 opacity-10">
                <Zap className="w-20 h-20 text-cyan" />
            </div>
        </motion.div>
    );
}
