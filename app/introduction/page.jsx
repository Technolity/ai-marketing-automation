"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function IntroductionPage() {
    const router = useRouter();
    const { session, authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!session) {
            router.push("/auth/login");
            return;
        }

        setIsLoading(false);
    }, [session, authLoading, router]);

    const handleStartQuestions = () => {
        router.push("/intake_form");
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const steps = [
        "Answer 20 questions",
        "Review what's created",
        "Launch your funnel"
    ];

    return (
        <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center px-6">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl w-full relative z-10"
            >
                {/* Main Headline */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                        TedOS will generate your message, offer, content, and funnel for you.
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-cyan">
                        <Zap className="w-5 h-5" />
                        <p className="text-lg md:text-xl font-medium">
                            Most users are live in under an hour.
                        </p>
                    </div>
                </motion.div>

                {/* AI Ted Video Placeholder */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="aspect-video bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent" />
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-20 h-20 rounded-full bg-cyan/20 flex items-center justify-center border border-cyan/30"
                        >
                            <Play className="w-8 h-8 text-cyan ml-1" fill="currentColor" />
                        </motion.button>
                        <p className="absolute bottom-4 text-gray-500 text-sm">AI Ted Video (30-45 seconds)</p>
                    </div>
                </motion.div>

                {/* Simplified 3 Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4 mb-10"
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0 border border-cyan/30">
                                <span className="text-cyan font-bold">{index + 1}</span>
                            </div>
                            <p className="text-lg md:text-xl text-gray-200 font-medium">{step}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Begin Setup CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="text-center"
                >
                    <motion.button
                        onClick={handleStartQuestions}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-cyan hover:brightness-110 text-black px-10 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan/30"
                    >
                        Begin Setup
                        <ArrowRight className="w-6 h-6" />
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    );
}
