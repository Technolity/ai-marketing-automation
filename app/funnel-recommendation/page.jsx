"use client";
/**
 * Funnel Recommendation Screen
 * 
 * After Phase 1 (Business Core) is complete, this screen recommends
 * the best funnel type based on the user's business type.
 * 
 * Features:
 * - Recommends a funnel based on business answers
 * - Shows collapsed section with alternative options
 * - "Build Recommended Funnel" CTA
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket, ChevronDown, CheckCircle, Loader2, Sparkles,
    BookOpen, Video, Mail, Gift, Megaphone, Layout, Star, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Available funnel types
const FUNNEL_TYPES = [
    {
        id: 'free-book',
        title: 'Free Book Funnel',
        icon: BookOpen,
        description: 'Offer a free book or guide to capture leads',
        bestFor: ['coaches', 'consultants', 'authors', 'experts'],
        features: ['Landing Page', 'Opt-in Form', 'Thank You Page', 'Email Sequence']
    },
    {
        id: 'vsl',
        title: 'VSL Funnel',
        icon: Video,
        description: 'Video sales letter to convert viewers into buyers',
        bestFor: ['courses', 'high-ticket', 'digital products'],
        features: ['VSL Page', 'Order Form', 'Upsell Pages', 'Email Follow-up']
    },
    {
        id: 'webinar',
        title: 'Webinar Funnel',
        icon: Megaphone,
        description: 'Live or automated webinar to sell programs',
        bestFor: ['coaches', 'agencies', 'high-ticket services'],
        features: ['Registration Page', 'Thank You Page', 'Webinar Room', 'Offer Page']
    },
    {
        id: 'lead-magnet',
        title: 'Lead Magnet Funnel',
        icon: Gift,
        description: 'Free resource to build your email list fast',
        bestFor: ['any business', 'list building', 'nurture first'],
        features: ['Squeeze Page', 'Thank You Page', 'Email Nurture Sequence']
    },
    {
        id: 'application',
        title: 'Application Funnel',
        icon: Layout,
        description: 'Qualify leads before booking discovery calls',
        bestFor: ['agencies', 'high-ticket coaching', 'done-for-you services'],
        features: ['Sales Page', 'Application Form', 'Calendar Booking', 'Follow-up Sequences']
    }
];

export default function FunnelRecommendationPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [businessData, setBusinessData] = useState(null);
    const [recommendedFunnel, setRecommendedFunnel] = useState(null);
    const [selectedFunnel, setSelectedFunnel] = useState(null);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const [isBuilding, setIsBuilding] = useState(false);

    // Load business data and determine recommendation
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadData = async () => {
            try {
                const res = await fetchWithAuth('/api/os/results');
                const data = await res.json();

                if (data.data) {
                    setBusinessData(data.data);

                    // Determine best funnel based on business type
                    const recommended = determineBestFunnel(data.data);
                    setRecommendedFunnel(recommended);
                    setSelectedFunnel(recommended);
                }
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [session, authLoading, router]);

    // Logic to determine best funnel based on business data
    const determineBestFunnel = (data) => {
        // Check business type indicators
        const industry = (data.industry || '').toLowerCase();
        const offer = (data.offer?.programType || data.offerProgram?.programType || '').toLowerCase();

        // Matches for different funnels
        if (industry.includes('coach') || industry.includes('consultant')) {
            return FUNNEL_TYPES.find(f => f.id === 'free-book');
        }
        if (industry.includes('agency') || offer.includes('done-for-you')) {
            return FUNNEL_TYPES.find(f => f.id === 'application');
        }
        if (offer.includes('course') || offer.includes('digital')) {
            return FUNNEL_TYPES.find(f => f.id === 'vsl');
        }
        if (industry.includes('trainer') || industry.includes('speaker')) {
            return FUNNEL_TYPES.find(f => f.id === 'webinar');
        }

        // Default to Free Book Funnel
        return FUNNEL_TYPES.find(f => f.id === 'free-book');
    };

    // Handle building the funnel
    const handleBuildFunnel = async () => {
        setIsBuilding(true);

        // Save selected funnel type to localStorage for the build process
        localStorage.setItem('selected_funnel_type', selectedFunnel.id);

        // Simulate a brief delay for UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success(`Building your ${selectedFunnel.title}...`);
        router.push('/funnel-assets');
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan/30"
                    >
                        <Rocket className="w-10 h-10 text-white" />
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
                        Recommended Funnel
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto">
                        Based on your business, we recommend the following funnel to get you results fastest.
                    </p>
                </div>

                {/* Recommended Funnel Card */}
                {recommendedFunnel && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
              p-8 rounded-3xl border-2 mb-8 transition-all cursor-pointer
              ${selectedFunnel?.id === recommendedFunnel.id
                                ? 'bg-cyan/10 border-cyan shadow-xl shadow-cyan/20'
                                : 'bg-[#1b1b1d] border-[#2a2a2d] hover:border-cyan/50'
                            }
            `}
                        onClick={() => setSelectedFunnel(recommendedFunnel)}
                    >
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-cyan/20 flex items-center justify-center flex-shrink-0">
                                <recommendedFunnel.icon className="w-8 h-8 text-cyan" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{recommendedFunnel.title}</h2>
                                    <span className="px-3 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3" /> RECOMMENDED
                                    </span>
                                </div>
                                <p className="text-gray-400 mb-4">{recommendedFunnel.description}</p>

                                <div className="flex flex-wrap gap-2">
                                    {recommendedFunnel.features.map((feature, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-[#2a2a2d] text-gray-300 text-sm rounded-lg flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {selectedFunnel?.id === recommendedFunnel.id && (
                                <CheckCircle className="w-8 h-8 text-cyan flex-shrink-0" />
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Show Other Options */}
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
                                {FUNNEL_TYPES.filter(f => f.id !== recommendedFunnel?.id).map((funnel, idx) => {
                                    const Icon = funnel.icon;
                                    const isSelected = selectedFunnel?.id === funnel.id;

                                    return (
                                        <motion.div
                                            key={funnel.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => setSelectedFunnel(funnel)}
                                            className={`
                        p-6 rounded-2xl border cursor-pointer transition-all
                        ${isSelected
                                                    ? 'bg-cyan/10 border-cyan'
                                                    : 'bg-[#131314] border-[#2a2a2d] hover:border-gray-600'
                                                }
                      `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-cyan/20' : 'bg-[#2a2a2d]'}`}>
                                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-cyan' : 'text-gray-400'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{funnel.title}</h3>
                                                    <p className="text-sm text-gray-500">{funnel.description}</p>
                                                </div>
                                                {isSelected && <CheckCircle className="w-6 h-6 text-cyan" />}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Build Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <button
                        onClick={handleBuildFunnel}
                        disabled={isBuilding || !selectedFunnel}
                        className="px-10 py-5 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-2xl shadow-cyan/30 mx-auto disabled:opacity-50"
                    >
                        {isBuilding ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Building...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6" />
                                Build {selectedFunnel?.title || 'Funnel'}
                                <ArrowRight className="w-6 h-6" />
                            </>
                        )}
                    </button>

                    <p className="text-sm text-gray-500 mt-4">
                        We'll generate all assets for your funnel in the next step
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
