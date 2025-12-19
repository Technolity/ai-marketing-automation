"use client";
/**
 * Funnel Recommendation Screen
 * 
 * Fully responsive for mobile, tablet, desktop, and foldable devices.
 * Recommends funnel based on business type with collapsed alternatives.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket, ChevronDown, CheckCircle, Loader2, Sparkles,
    BookOpen, Video, Mail, Gift, Megaphone, Layout, Star, ArrowRight, ArrowLeft
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

    const determineBestFunnel = (data) => {
        const industry = (data.industry || '').toLowerCase();
        const offer = (data.offer?.programType || data.offerProgram?.programType || '').toLowerCase();

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
        return FUNNEL_TYPES.find(f => f.id === 'free-book');
    };

    const handleBuildFunnel = async () => {
        setIsBuilding(true);
        localStorage.setItem('selected_funnel_type', selectedFunnel.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(`Building your ${selectedFunnel.title}...`);
        router.push('/funnel-assets');
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8 xl:p-12">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => router.push('/business-core')}
                    className="mb-4 sm:mb-6 p-2 -ml-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="sm:hidden">Back</span>
                    <span className="hidden sm:inline">Back to Business Core</span>
                </button>

                {/* Header */}
                <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan/30"
                    >
                        <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 tracking-tighter">
                        Recommended Funnel
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-xl mx-auto px-4">
                        Based on your business, we recommend the following funnel.
                    </p>
                </div>

                {/* Recommended Funnel Card */}
                {recommendedFunnel && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
              p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 mb-6 sm:mb-8 transition-all cursor-pointer
              ${selectedFunnel?.id === recommendedFunnel.id
                                ? 'bg-cyan/10 border-cyan shadow-xl shadow-cyan/20'
                                : 'bg-[#1b1b1d] border-[#2a2a2d] hover:border-cyan/50'
                            }
            `}
                        onClick={() => setSelectedFunnel(recommendedFunnel)}
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-cyan/20 flex items-center justify-center flex-shrink-0">
                                <recommendedFunnel.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-cyan" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                    <h2 className="text-xl sm:text-2xl font-bold">{recommendedFunnel.title}</h2>
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3" /> RECOMMENDED
                                    </span>
                                </div>
                                <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">{recommendedFunnel.description}</p>

                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {recommendedFunnel.features.map((feature, idx) => (
                                        <span key={idx} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#2a2a2d] text-gray-300 text-xs sm:text-sm rounded-lg flex items-center gap-1 sm:gap-2">
                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                                            <span className="truncate">{feature}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {selectedFunnel?.id === recommendedFunnel.id && (
                                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-cyan flex-shrink-0 hidden sm:block" />
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Show Other Options */}
                <div className="mb-6 sm:mb-8">
                    <button
                        onClick={() => setShowAlternatives(!showAlternatives)}
                        className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                    >
                        <span>See other funnel options</span>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showAlternatives && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 sm:space-y-4 overflow-hidden"
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
                        p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border cursor-pointer transition-all
                        ${isSelected
                                                    ? 'bg-cyan/10 border-cyan'
                                                    : 'bg-[#131314] border-[#2a2a2d] hover:border-gray-600'
                                                }
                      `}
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-cyan/20' : 'bg-[#2a2a2d]'}`}>
                                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'text-cyan' : 'text-gray-400'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-bold text-sm sm:text-base ${isSelected ? 'text-white' : 'text-gray-300'}`}>{funnel.title}</h3>
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate">{funnel.description}</p>
                                                </div>
                                                {isSelected && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-cyan flex-shrink-0" />}
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
                        className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 hover:brightness-110 transition-all shadow-2xl shadow-cyan/30 mx-auto disabled:opacity-50"
                    >
                        {isBuilding ? (
                            <>
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                Building...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span className="hidden sm:inline">Build {selectedFunnel?.title || 'Funnel'}</span>
                                <span className="sm:hidden">Build Funnel</span>
                                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </>
                        )}
                    </button>

                    <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 px-4">
                        We'll generate all assets for your funnel in the next step
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
