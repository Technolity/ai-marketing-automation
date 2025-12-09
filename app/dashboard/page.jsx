"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import {
    Loader2, Play, Sparkles, ArrowRight, MessageSquare, Target, Gift, Video
} from "lucide-react";
import { toast } from "sonner";
import OSWizard from "@/components/OSWizard";

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [isLoading, setIsLoading] = useState(true);
    const [hasExistingData, setHasExistingData] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkUserData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    router.push("/auth/login");
                    return;
                }

                if (!mounted) return;

                // Check localStorage first for existing data
                const localProgress = localStorage.getItem(`wizard_progress_${session.user.id}`);
                if (localProgress) {
                    try {
                        const parsed = JSON.parse(localProgress);
                        if (parsed.completedSteps && parsed.completedSteps.length > 0) {
                            setHasExistingData(true);
                            setShowWelcome(false);
                            setIsLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.warn('Invalid local progress data');
                    }
                }

                // Check database for saved sessions
                try {
                    const sessionsRes = await fetch("/api/os/sessions", {
                        headers: {
                            "Authorization": `Bearer ${session.access_token}`
                        }
                    });

                    if (sessionsRes.ok && mounted) {
                        const sessionsData = await sessionsRes.json();
                        if (sessionsData.sessions && sessionsData.sessions.length > 0) {
                            const mostRecent = sessionsData.sessions[0];
                            if (mostRecent.completed_steps && mostRecent.completed_steps.length > 0) {
                                setHasExistingData(true);
                                setShowWelcome(false);
                            } else {
                                setHasExistingData(false);
                                setShowWelcome(true);
                            }
                        } else {
                            setHasExistingData(false);
                            setShowWelcome(true);
                        }
                    } else if (mounted) {
                        setHasExistingData(false);
                        setShowWelcome(true);
                    }
                } catch (err) {
                    console.log('API error, showing welcome screen:', err);
                    if (mounted) {
                        setHasExistingData(false);
                        setShowWelcome(true);
                    }
                }

                if (mounted) setIsLoading(false);
            } catch (error) {
                console.error('Check user data error:', error);
                if (mounted) {
                    setShowWelcome(true);
                    setIsLoading(false);
                }
            }
        };

        checkUserData();

        return () => {
            mounted = false;
        };
    }, [supabase, router]);

    // Show loading spinner
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Show welcome screen for new users
    if (showWelcome) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center px-6 relative overflow-hidden pt-20">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan/8 rounded-full blur-[150px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-5xl w-full relative z-10"
                >
                    {/* Welcome Card */}
                    <div className="glass-card p-12 rounded-3xl border border-cyan/30">
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan/20 text-cyan mb-6"
                            >
                                <Sparkles className="w-10 h-10" />
                            </motion.div>
                            <h1 className="text-5xl font-bold mb-4 text-white">
                                Welcome to <span className="text-cyan text-glow">TedOS</span>
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                                Let's build your complete marketing system in just 12 minutes.
                                Answer simple questions, and watch AI create everything you need.
                            </p>
                        </div>

                        {/* Video Placeholder */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mb-10"
                        >
                            <div className="relative aspect-video bg-gradient-to-br from-cyan/10 to-cyan/5 rounded-2xl border border-cyan/30 overflow-hidden group cursor-pointer hover:border-cyan/50 transition-all">
                                {/* Video Thumbnail/Placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan/20 group-hover:bg-cyan/30 transition-all mb-4">
                                            <Video className="w-12 h-12 text-cyan" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Meet Ted</h3>
                                        <p className="text-gray-400">
                                            Watch this 2-minute intro to see what TedOS will do for you
                                        </p>
                                        <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-cyan/10 hover:bg-cyan/20 text-cyan rounded-full transition-all">
                                            <Play className="w-5 h-5" />
                                            <span className="font-semibold">Play Introduction</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 text-center mt-4">
                                💡 Pro tip: Have your business info ready for faster completion
                            </p>
                        </motion.div>

                        {/* Start Button - Moved to TOP */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-center mb-10"
                        >
                            <button
                                onClick={async () => {
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (session) {
                                        // Set flag to start at step 1
                                        localStorage.setItem(`start_questionnaire_${session.user.id}`, 'true');
                                    }
                                    setShowWelcome(false);
                                    setHasExistingData(true);
                                    toast.success("Let's build your business!");
                                }}
                                className="inline-flex items-center gap-3 px-10 py-5 bg-cyan hover:brightness-110 text-black font-bold text-xl rounded-full shadow-glow-xl transition-all"
                            >
                                Start Questionnaire
                                <ArrowRight className="w-6 h-6" />
                            </button>
                            <p className="text-sm text-gray-500 mt-4">
                                Takes 10-15 minutes • Save your progress anytime • No credit card required
                            </p>
                        </motion.div>

                        {/* What You'll Create */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="mb-10"
                        >
                            <h3 className="text-2xl font-bold text-white mb-6 text-center">
                                What You'll Create Today:
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    { icon: MessageSquare, title: "Your Message", desc: "Million-dollar positioning & unique story" },
                                    { icon: Target, title: "Your Offer", desc: "High-ticket program & pricing strategy" },
                                    { icon: Gift, title: "Your Funnel", desc: "Complete sales system with copy & emails" }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 + i * 0.1 }}
                                        className="bg-[#1b1b1d] p-6 rounded-xl border border-[#2a2a2d] hover:border-cyan/30 transition-all"
                                    >
                                        <item.icon className="w-8 h-8 text-cyan mb-3" />
                                        <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Show OSWizard for users with data
    return <OSWizard />;
}
