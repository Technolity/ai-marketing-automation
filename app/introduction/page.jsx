"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppNavbar from "@/components/AppNavbar";

export default function IntroductionPage() {
    const router = useRouter();
    const { session, authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[Introduction] Page mounted');
        console.log('[Introduction] Auth loading:', authLoading);

        if (authLoading) {
            console.log('[Introduction] Waiting for auth to complete...');
            return;
        }

        if (!session) {
            console.log('[Introduction] No session found, redirecting to login');
            router.push("/auth/login");
            return;
        }

        console.log('[Introduction] User authenticated, showing introduction page');
        setIsLoading(false);
    }, [session, authLoading, router]);

    const handleStartQuestionnaire = () => {
        console.log('[Introduction] Starting questionnaire, navigating to /intake_form');
        router.push("/intake_form");
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f]">
            <AppNavbar />
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 relative overflow-hidden pt-20">
                {/* Background glow effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan/8 rounded-full blur-[150px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-5xl w-full relative z-10"
                >
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
                                Let's build your complete marketing system in just 12 minutes. Answer
                                simple questions, and watch AI create everything you need.
                            </p>
                        </div>

                        {/* Video Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mb-10 text-center"
                        >
                            <div className="p-6 bg-[#1b1b1d] rounded-xl border border-[#2a2a2d] inline-block">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Video className="w-5 h-5 text-cyan" />
                                    <span>Watch the intro video to see the power of TedOS</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-center"
                        >
                            <motion.button
                                onClick={handleStartQuestionnaire}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-cyan hover:brightness-110 text-black px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 mx-auto transition-all shadow-lg shadow-cyan/30"
                            >
                                Start Questionnaire
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>

                            <p className="text-gray-500 text-sm mt-4">
                                Takes 10-15 minutes • Save your progress anytime
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
