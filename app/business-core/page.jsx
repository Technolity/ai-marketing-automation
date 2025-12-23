"use client";
/**
 * Business Core Dashboard
 * 
 * Connected to existing database schema.
 * Uses /api/os/results which reads from saved_sessions.generated_content
 * No mock data - displays actual AI-generated content from database.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, Lock, RefreshCw, Loader2, ChevronRight,
    Users, MessageSquare, BookOpen, Award, Gift, Mic,
    Sparkles, Edit3, ArrowRight, Rocket, PartyPopper, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Business Core phases - mapped to keys in saved_sessions.generated_content
// Numeric keys correspond to osPrompts in generate/route.js:
// 1: idealClient, 2: message, 3: story, 4: offer, 5: salesScripts, 6: leadMagnet
const BUSINESS_CORE_PHASES = [
    { id: 'idealClient', numericKey: 1, title: 'Ideal Client', subtitle: 'WHO you serve', icon: Users },
    { id: 'message', numericKey: 2, title: 'Message', subtitle: 'WHAT you help them with', icon: MessageSquare },
    { id: 'stories', numericKey: 3, title: 'Story', subtitle: 'WHY you do this work', icon: BookOpen },
    { id: 'offer', numericKey: 4, title: 'Offer & Pricing', subtitle: 'Your core offer', icon: Gift },
    { id: 'scripts', numericKey: 5, title: 'Sales Script', subtitle: 'How you close', icon: Mic },
    { id: 'leadMagnet', numericKey: 6, title: 'Lead Magnet', subtitle: 'Your free offer', icon: Gift }
];

// Helper function to normalize data structure
// Handles both numeric keys (1, 2, 3...) and named keys (idealClient, message...)
function normalizeBusinessCoreData(rawData) {
    if (!rawData || typeof rawData !== 'object') return {};
    
    const normalized = {};
    
    // If data uses numeric keys (e.g., { 1: {...}, 2: {...} })
    const hasNumericKeys = Object.keys(rawData).some(key => !isNaN(key));
    
    if (hasNumericKeys) {
        // Map numeric keys to named keys
        BUSINESS_CORE_PHASES.forEach(phase => {
            const numKey = phase.numericKey.toString();
            if (rawData[numKey]) {
                // Extract the actual data from the wrapper
                normalized[phase.id] = rawData[numKey].data || rawData[numKey];
            }
        });
    } else {
        // Data already uses named keys, just return it
        return rawData;
    }
    
    return normalized;
}

export default function BusinessCorePage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [businessCore, setBusinessCore] = useState({});
    const [dataSource, setDataSource] = useState(null);
    const [approvedPhases, setApprovedPhases] = useState([]);
    const [isPhaseOneComplete, setIsPhaseOneComplete] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [expandedPhase, setExpandedPhase] = useState(null);

    // Load business core data from saved_sessions via API
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadBusinessCore = async () => {
            try {
                // This fetches from saved_sessions.generated_content or results_data
                const res = await fetchWithAuth('/api/os/results');
                const result = await res.json();

                if (result.error) {
                    console.error("API error:", result.error);
                    toast.error("Failed to load your Business Core");
                    return;
                }

                if (result.data && Object.keys(result.data).length > 0) {
                    // Normalize data structure (handles both numeric and named keys)
                    const normalizedData = normalizeBusinessCoreData(result.data);
                    console.log('[BusinessCore] Raw data keys:', Object.keys(result.data));
                    console.log('[BusinessCore] Normalized data keys:', Object.keys(normalizedData));
                    setBusinessCore(normalizedData);
                    setDataSource(result.source);
                    console.log('[BusinessCore] Loaded from:', result.source);

                    // Load approvals from database (try API first, then localStorage fallback)
                    try {
                        const approvalsRes = await fetchWithAuth('/api/os/approvals');
                        if (approvalsRes.ok) {
                            const approvalsData = await approvalsRes.json();
                            if (approvalsData.approvals) {
                                setApprovedPhases(approvalsData.approvals.businessCore || []);
                                if ((approvalsData.approvals.businessCore || []).length >= BUSINESS_CORE_PHASES.length) {
                                    setIsPhaseOneComplete(true);
                                }
                            }
                        }
                    } catch (e) {
                        // Fallback to localStorage if API doesn't exist yet
                        const savedApprovals = localStorage.getItem(`business_core_approvals_${session.user.id}`);
                        if (savedApprovals) {
                            const approvals = JSON.parse(savedApprovals);
                            setApprovedPhases(approvals);
                            if (approvals.length >= BUSINESS_CORE_PHASES.length) {
                                setIsPhaseOneComplete(true);
                            }
                        }
                    }
                } else {
                    toast.error("No generated content found. Please complete the intake form first.");
                    router.push('/intake_form');
                }
            } catch (error) {
                console.error("Failed to load business core:", error);
                toast.error("Failed to load your Business Core");
            } finally {
                setIsLoading(false);
            }
        };

        loadBusinessCore();
    }, [session, authLoading, router]);

    const getPhaseStatus = (phaseId, index) => {
        if (approvedPhases.includes(phaseId)) return 'approved';
        if (index === 0 || approvedPhases.includes(BUSINESS_CORE_PHASES[index - 1].id)) {
            return 'current';
        }
        return 'locked';
    };

    const handleApprove = async (phaseId) => {
        const newApprovals = [...approvedPhases, phaseId];
        setApprovedPhases(newApprovals);

        // Save to localStorage (and optionally to database)
        localStorage.setItem(`business_core_approvals_${session.user.id}`, JSON.stringify(newApprovals));

        // Try to save to database
        try {
            await fetchWithAuth('/api/os/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'businessCore',
                    approvals: newApprovals
                })
            });
        } catch (e) {
            console.log('Approvals API not available, using localStorage');
        }

        if (newApprovals.length >= BUSINESS_CORE_PHASES.length) {
            setIsPhaseOneComplete(true);
            toast.success("🎉 Phase One Complete!");
        } else {
            toast.success(`${BUSINESS_CORE_PHASES.find(p => p.id === phaseId)?.title} approved!`);
        }
        setExpandedPhase(null);
    };

    // Regenerate calls existing AI generation endpoints
    const handleRegenerate = async (phaseId) => {
        setIsRegenerating(true);
        try {
            // This would call the existing AI generation endpoint
            const res = await fetchWithAuth(`/api/os/regenerate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: phaseId,
                    sessionId: dataSource?.id
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    setBusinessCore(prev => ({ ...prev, [phaseId]: data.content }));
                    toast.success("Content regenerated!");
                } else {
                    toast.error("Regeneration returned no content");
                }
            } else {
                toast.error("Failed to regenerate - API error");
            }
        } catch (error) {
            console.error("Regeneration error:", error);
            toast.error("Failed to regenerate. Please try again.");
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleEditRegenerate = async (phaseId, index) => {
        const newApprovals = approvedPhases.filter(id => {
            const approvedIndex = BUSINESS_CORE_PHASES.findIndex(p => p.id === id);
            return approvedIndex < index;
        });
        setApprovedPhases(newApprovals);
        localStorage.setItem(`business_core_approvals_${session.user.id}`, JSON.stringify(newApprovals));
        setIsPhaseOneComplete(false);
        toast.info("Redirecting to edit your answers...");
        router.push('/intake_form');
    };

    // Format content from database for display
    const formatContent = (content) => {
        if (!content) return "No content generated for this section.";
        if (typeof content === 'string') return content;
        if (typeof content === 'object') {
            return Object.entries(content)
                .filter(([k, v]) => v && k !== '_contentName' && k !== 'id')
                .map(([k, v]) => {
                    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                    const value = typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
                    return `**${label}:**\n${value}`;
                })
                .join('\n\n');
        }
        return String(content);
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Phase One Complete Screen
    if (isPhaseOneComplete) {
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
                        Phase One Complete! 🎉
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 sm:mb-8 leading-relaxed px-4">
                        Your Business Core is built. Now let's create your funnel.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                        <button
                            onClick={() => router.push('/funnel-recommendation')}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:brightness-110 transition-all shadow-xl shadow-cyan/30"
                        >
                            <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                            Choose My Funnel
                        </button>
                        <button
                            onClick={() => setIsPhaseOneComplete(false)}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#1b1b1d] border border-[#2a2a2d] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#252528] transition-all"
                        >
                            Review Business Core
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
                    onClick={() => router.push('/dashboard')}
                    className="mb-4 sm:mb-6 p-2 -ml-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="sm:hidden">Back</span>
                    <span className="hidden sm:inline">Back to Dashboard</span>
                </button>

                {/* Header */}
                <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-cyan/10 text-cyan text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                        Phase 1 of 2
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 tracking-tighter">
                        Your Business Core
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-xl mx-auto px-4">
                        Review and approve each section. Approval unlocks the next step.
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
                            {approvedPhases.length} of {BUSINESS_CORE_PHASES.length}
                        </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-[#1b1b1d] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(approvedPhases.length / BUSINESS_CORE_PHASES.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-cyan to-green-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Phase Checklist */}
                <div className="space-y-3 sm:space-y-4">
                    {BUSINESS_CORE_PHASES.map((phase, index) => {
                        const status = getPhaseStatus(phase.id, index);
                        const Icon = phase.icon;
                        const isExpanded = expandedPhase === phase.id;
                        const content = businessCore[phase.id];

                        return (
                            <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                  rounded-xl sm:rounded-2xl border overflow-hidden transition-all
                  ${status === 'approved'
                                        ? 'bg-green-500/5 border-green-500/30'
                                        : status === 'current'
                                            ? 'bg-[#1b1b1d] border-cyan/30 shadow-lg shadow-cyan/10'
                                            : 'bg-[#131314] border-[#2a2a2d] opacity-60'
                                    }
                `}
                            >
                                {/* Phase Header */}
                                <button
                                    onClick={() => status !== 'locked' && setExpandedPhase(isExpanded ? null : phase.id)}
                                    disabled={status === 'locked'}
                                    className={`w-full p-4 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-4 text-left ${status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                                >
                                    <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0
                    ${status === 'approved' ? 'bg-green-500/20' : status === 'current' ? 'bg-cyan/20' : 'bg-gray-700/50'}
                  `}>
                                        {status === 'approved' ? (
                                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                        ) : status === 'locked' ? (
                                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                        ) : (
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-base sm:text-lg ${status === 'approved' ? 'text-green-400' : status === 'current' ? 'text-white' : 'text-gray-500'}`}>
                                            {phase.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">{phase.subtitle}</p>
                                    </div>

                                    {status !== 'locked' && (
                                        <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
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
                                            <div className="p-4 sm:p-5 lg:p-6">
                                                {/* Content Preview */}
                                                <div className="bg-[#0e0e0f] rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
                                                    <pre className="text-gray-300 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-sans">
                                                        {formatContent(content)}
                                                    </pre>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                                                    {status === 'current' && (
                                                        <button
                                                            onClick={() => handleApprove(phase.id)}
                                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all text-sm sm:text-base"
                                                        >
                                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            Approve
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleRegenerate(phase.id)}
                                                        disabled={isRegenerating}
                                                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-[#2a2a2d] text-white rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all disabled:opacity-50 text-sm sm:text-base"
                                                    >
                                                        {isRegenerating ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                        <span className="hidden sm:inline">Regenerate</span>
                                                        <span className="sm:hidden">Regen</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleEditRegenerate(phase.id, index)}
                                                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 border border-[#2a2a2d] text-gray-400 rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1b1b1d] transition-all text-sm sm:text-base"
                                                    >
                                                        <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        <span className="hidden sm:inline">Edit + Regenerate</span>
                                                        <span className="sm:hidden">Edit</span>
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

                {/* Bottom CTA */}
                {approvedPhases.length === BUSINESS_CORE_PHASES.length && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 sm:mt-10 lg:mt-12 text-center"
                    >
                        <button
                            onClick={() => setIsPhaseOneComplete(true)}
                            className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 hover:brightness-110 transition-all shadow-2xl shadow-cyan/30 mx-auto"
                        >
                            Continue to Build Funnel
                            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
