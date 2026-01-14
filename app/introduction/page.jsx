"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Zap, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

export default function IntroductionPage() {
    const router = useRouter();
    const { session, authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showNameInput, setShowNameInput] = useState(false);
    const [businessName, setBusinessName] = useState("");

    useEffect(() => {
        if (authLoading) return;

        if (!session) {
            router.push("/auth/login");
            return;
        }

        setIsLoading(false);
    }, [session, authLoading, router]);

    const handleBeginSetup = () => {
        setShowNameInput(true);
    };

    const handleStartQuestionnaire = async () => {
        if (!businessName.trim()) {
            toast.error("Please name your business");
            return;
        }

        setIsCreating(true);
        try {
            // Create the first business
            const res = await fetchWithAuth('/api/user/funnels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: businessName.trim(),
                    description: ''
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create business');
            }

            const data = await res.json();

            // Navigate to questionnaire with funnel ID
            router.push(`/intake_form?funnel_id=${data.funnel.id}`);
        } catch (error) {
            console.error('[Introduction] Create error:', error);
            toast.error(error.message || "Failed to create business");
            setIsCreating(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const steps = [
        "Name your business",
        "Answer 20 quick questions",
        "Review your generated assets",
        "Launch your funnel"
    ];

    return (
        <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center px-6">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-2xl w-full relative z-10"
            >
                {/* Main Headline */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, ease: "easeOut" }}
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



                {/* Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, ease: "easeOut" }}
                    className="space-y-3 mb-10"
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.08, ease: "easeOut" }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-9 h-9 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0 border border-cyan/30">
                                <span className="text-cyan font-bold text-sm">{index + 1}</span>
                            </div>
                            <p className="text-base md:text-lg text-gray-200 font-medium">{step}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA Section */}
                <AnimatePresence mode="wait">
                    {!showNameInput ? (
                        <motion.div
                            key="begin-button"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: 0.8, ease: "easeOut" }}
                            className="text-center"
                        >
                            <motion.button
                                onClick={handleBeginSetup}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="w-full bg-gradient-to-r from-cyan to-blue-500 hover:brightness-110 text-black px-10 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan/30"
                            >
                                Begin Setup
                                <ArrowRight className="w-6 h-6" />
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="name-input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ ease: "easeOut" }}
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-cyan/10 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Name Your Business</h3>
                                    <p className="text-gray-500 text-sm">This helps us personalize your content</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="e.g. My Coaching Business"
                                className="w-full px-4 py-4 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors mb-4 text-lg"
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleStartQuestionnaire()}
                            />

                            <motion.button
                                onClick={handleStartQuestionnaire}
                                disabled={isCreating || !businessName.trim()}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="w-full bg-gradient-to-r from-cyan to-blue-500 hover:brightness-110 text-black px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Start Questionnaire
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

