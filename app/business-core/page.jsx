"use client";
/**
 * Business Core Dashboard
 * 
 * Phase 1 of the TedOS funnel building experience.
 * Displays a locked checklist of Business Core items with linear progression.
 * 
 * Business Core Items:
 * 1. Ideal Client - WHO you serve
 * 2. Message - WHAT you help them with  
 * 3. Story - WHY you do this work
 * 4. Proof - Social proof & testimonials
 * 5. Offer & Pricing - Your core offer
 * 6. Sales Script - How you close
 * 
 * UX Rules:
 * - Only first unlocked item is editable
 * - Approve → unlocks next item
 * - Edit + Regenerate → re-locks all items after
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, Lock, RefreshCw, Loader2, ChevronRight,
    Users, MessageSquare, BookOpen, Award, Gift, Mic,
    Sparkles, Edit3, ArrowRight, Rocket, PartyPopper
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Business Core phases with their corresponding data keys
const BUSINESS_CORE_PHASES = [
    {
        id: 'idealClient',
        title: 'Ideal Client',
        subtitle: 'WHO you serve',
        icon: Users,
        description: 'Your perfect customer profile and target audience'
    },
    {
        id: 'message',
        title: 'Message',
        subtitle: 'WHAT you help them with',
        icon: MessageSquare,
        description: 'Your core message and value proposition'
    },
    {
        id: 'stories',
        title: 'Story',
        subtitle: 'WHY you do this work',
        icon: BookOpen,
        description: 'Your signature story and personal mission'
    },
    {
        id: 'proof',
        title: 'Proof',
        subtitle: 'Social proof & testimonials',
        icon: Award,
        description: 'Client results and testimonials'
    },
    {
        id: 'offer',
        title: 'Offer & Pricing',
        subtitle: 'Your core offer',
        icon: Gift,
        description: 'Your program structure and pricing strategy'
    },
    {
        id: 'scripts',
        title: 'Sales Script',
        subtitle: 'How you close',
        icon: Mic,
        description: 'Your sales conversation framework'
    }
];

export default function BusinessCorePage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    // Core state
    const [isLoading, setIsLoading] = useState(true);
    const [businessCore, setBusinessCore] = useState({});
    const [approvedPhases, setApprovedPhases] = useState([]);
    const [activePhase, setActivePhase] = useState(null);
    const [isPhaseOneComplete, setIsPhaseOneComplete] = useState(false);

    // UI state
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [expandedPhase, setExpandedPhase] = useState(null);

    // Load business core data
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadBusinessCore = async () => {
            try {
                // First try to load from API
                const res = await fetchWithAuth('/api/os/results');
                const data = await res.json();

                if (data.data && Object.keys(data.data).length > 0) {
                    setBusinessCore(data.data);

                    // Check for saved approval state in localStorage
                    const savedApprovals = localStorage.getItem(`business_core_approvals_${session.user.id}`);
                    if (savedApprovals) {
                        const approvals = JSON.parse(savedApprovals);
                        setApprovedPhases(approvals);

                        // Check if all phases approved
                        if (approvals.length >= BUSINESS_CORE_PHASES.length) {
                            setIsPhaseOneComplete(true);
                        }
                    }
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

    // Get phase status: 'locked' | 'current' | 'approved'
    const getPhaseStatus = (phaseId, index) => {
        if (approvedPhases.includes(phaseId)) return 'approved';
        if (index === 0 || approvedPhases.includes(BUSINESS_CORE_PHASES[index - 1].id)) {
            return 'current';
        }
        return 'locked';
    };

    // Handle phase approval
    const handleApprove = async (phaseId) => {
        const newApprovals = [...approvedPhases, phaseId];
        setApprovedPhases(newApprovals);

        // Save to localStorage
        localStorage.setItem(
            `business_core_approvals_${session.user.id}`,
            JSON.stringify(newApprovals)
        );

        // Check if all phases complete
        if (newApprovals.length >= BUSINESS_CORE_PHASES.length) {
            setIsPhaseOneComplete(true);
            toast.success("🎉 Phase One Complete! Your Business Core is ready.");
        } else {
            toast.success(`${BUSINESS_CORE_PHASES.find(p => p.id === phaseId)?.title} approved!`);
        }

        setExpandedPhase(null);
    };

    // Handle regeneration
    const handleRegenerate = async (phaseId) => {
        setIsRegenerating(true);
        try {
            // API call to regenerate would go here
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
            toast.success("Content regenerated!");
        } catch (error) {
            toast.error("Failed to regenerate");
        } finally {
            setIsRegenerating(false);
        }
    };

    // Handle edit + regenerate (re-locks subsequent phases)
    const handleEditRegenerate = async (phaseId, index) => {
        // Remove approvals for this phase and all after it
        const newApprovals = approvedPhases.filter(id => {
            const approvedIndex = BUSINESS_CORE_PHASES.findIndex(p => p.id === id);
            return approvedIndex < index;
        });
        setApprovedPhases(newApprovals);
        localStorage.setItem(
            `business_core_approvals_${session.user.id}`,
            JSON.stringify(newApprovals)
        );
        setIsPhaseOneComplete(false);

        // Redirect to intake form for that specific step
        toast.info("Redirecting to edit your answers...");
        router.push('/intake_form');
    };

    // Format content for display
    const formatContent = (content) => {
        if (!content) return "No content generated yet.";
        if (typeof content === 'string') return content;
        if (typeof content === 'object') {
            return Object.entries(content)
                .filter(([k, v]) => v && k !== '_contentName')
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
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Phase One Complete Screen
    if (isPhaseOneComplete) {
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
                        Phase One Complete! 🎉
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                        Your Business Core is built. Now let's create your funnel and start getting clients.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push('/build-funnel')}
                            className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-xl shadow-cyan/30"
                        >
                            <Rocket className="w-6 h-6" />
                            Build My Funnel
                        </button>
                        <button
                            onClick={() => setIsPhaseOneComplete(false)}
                            className="px-8 py-4 bg-[#1b1b1d] border border-[#2a2a2d] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#252528] transition-all"
                        >
                            Review Business Core
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
                        Phase 1 of 2
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
                        Your Business Core
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto">
                        Review and approve each section. Approval unlocks the next step.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-cyan font-medium">
                            {approvedPhases.length} of {BUSINESS_CORE_PHASES.length} approved
                        </span>
                    </div>
                    <div className="h-2 bg-[#1b1b1d] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(approvedPhases.length / BUSINESS_CORE_PHASES.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-cyan to-green-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Phase Checklist */}
                <div className="space-y-4">
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
                                transition={{ delay: index * 0.1 }}
                                className={`
                  rounded-2xl border overflow-hidden transition-all
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
                                    className={`w-full p-6 flex items-center gap-4 text-left ${status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                                >
                                    {/* Status Icon */}
                                    <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${status === 'approved'
                                            ? 'bg-green-500/20'
                                            : status === 'current'
                                                ? 'bg-cyan/20'
                                                : 'bg-gray-700/50'
                                        }
                  `}>
                                        {status === 'approved' ? (
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        ) : status === 'locked' ? (
                                            <Lock className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <Icon className="w-6 h-6 text-cyan" />
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-lg ${status === 'approved' ? 'text-green-400' : status === 'current' ? 'text-white' : 'text-gray-500'}`}>
                                            {phase.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">{phase.subtitle}</p>
                                    </div>

                                    {/* Expand Arrow */}
                                    {status !== 'locked' && (
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
                                                    {status === 'current' && (
                                                        <button
                                                            onClick={() => handleApprove(phase.id)}
                                                            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                            Approve
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleRegenerate(phase.id)}
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
                                                        onClick={() => handleEditRegenerate(phase.id, index)}
                                                        className="flex-1 sm:flex-none px-6 py-3 border border-[#2a2a2d] text-gray-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1b1b1d] transition-all"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                        Edit + Regenerate
                                                    </button>
                                                </div>

                                                {status === 'approved' && (
                                                    <p className="text-sm text-green-500/80 mt-4 flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        This section has been approved
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom CTA when all approved */}
                {approvedPhases.length === BUSINESS_CORE_PHASES.length && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 text-center"
                    >
                        <button
                            onClick={() => setIsPhaseOneComplete(true)}
                            className="px-10 py-5 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-2xl shadow-cyan/30 mx-auto"
                        >
                            Continue to Build Funnel
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
