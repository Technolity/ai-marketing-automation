"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Zap, Loader2, Building2, X } from "lucide-react";
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
    const [activeVideo, setActiveVideo] = useState(null);
    const [mainVideoPlaying, setMainVideoPlaying] = useState(false);

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

    const previewVideos = [
        {
            id: 'sK6Zegk4itQ',
            title: 'Create a New Marketing Engine',
            description: 'Set up your first marketing engine',
        },
        {
            id: 'nNp_gUwnM00',
            title: 'How to Build (The 20 Questions)',
            description: 'Walk through the process before you start',
        },
    ];

    const steps = [
        "Name your business",
        "Answer 20 quick questions",
        "Review your generated assets",
        "Launch your funnel"
    ];

    return (
        <>
        <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center px-6">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(800px,100vw)] h-[min(800px,100vw)] bg-cyan/5 rounded-full blur-[120px] pointer-events-none overflow-hidden" />

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

                {/* Welcome Video Embed */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, ease: "easeOut" }}
                    className="mb-8 rounded-2xl overflow-hidden border border-[#2a2a2d] shadow-2xl shadow-black/40"
                >
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        {mainVideoPlaying ? (
                            <>
                                <iframe
                                    src="https://www.youtube-nocookie.com/embed/BeoQjnwRA3g?rel=0&modestbranding=1&autoplay=1&controls=0&iv_load_policy=3"
                                    title="Welcome to TedOS"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    className="absolute inset-0 w-full h-full border-0"
                                />
                                {/* Mask top YouTube title area */}
                                <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, #0e0e0f 30%, transparent 100%)' }} />
                            </>
                        ) : (
                            <button
                                onClick={() => setMainVideoPlaying(true)}
                                className="absolute inset-0 w-full h-full group"
                            >
                                <img
                                    src="https://img.youtube.com/vi/BeoQjnwRA3g/maxresdefault.jpg"
                                    alt="Welcome to TedOS"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full bg-cyan/90 group-hover:bg-cyan group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl shadow-cyan/40">
                                        <Play className="w-8 h-8 text-black fill-black ml-1" />
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Before You Begin — Thumbnail Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, ease: "easeOut" }}
                    className="mb-8"
                >
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Before you begin — watch these 2 guides
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {previewVideos.map((video) => (
                            <button
                                key={video.id}
                                onClick={() => setActiveVideo(video)}
                                className="rounded-xl overflow-hidden border border-[#2a2a2d] bg-[#1b1b1d] group text-left"
                            >
                                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                    <img
                                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-cyan/90 group-hover:bg-cyan group-hover:scale-110 transition-all flex items-center justify-center shadow-lg shadow-cyan/30">
                                            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-white text-sm font-semibold leading-tight">{video.title}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{video.description}</p>
                                </div>
                            </button>
                        ))}
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

        {/* Thumbnail Card Video Modal */}

        <AnimatePresence>
            {activeVideo && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setActiveVideo(null)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
                    />
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none"
                    >
                        <div
                            className="pointer-events-auto w-full max-w-3xl bg-[#0e0e0f] rounded-2xl border border-[#2a2a2d] shadow-2xl shadow-black/60 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2d]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0">
                                        <Play className="w-3.5 h-3.5 text-cyan fill-cyan" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-cyan uppercase tracking-widest mb-0.5">Tutorial Guide</p>
                                        <h3 className="text-white font-bold text-base leading-tight">{activeVideo.title}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveVideo(null)}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Video */}
                            <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?rel=0&modestbranding=1&autoplay=1&controls=0&iv_load_policy=3`}
                                    title={activeVideo.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    className="absolute inset-0 w-full h-full border-0"
                                />
                                <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, #0e0e0f 30%, transparent 100%)' }} />
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-[#2a2a2d] flex items-center justify-between gap-4">
                                <p className="text-gray-500 text-xs">{activeVideo.description}</p>
                                <button
                                    onClick={() => setActiveVideo(null)}
                                    className="flex-shrink-0 px-4 py-1.5 rounded-lg bg-[#1b1b1d] hover:bg-[#2a2a2d] text-gray-400 hover:text-white text-xs font-medium transition-all border border-[#2a2a2d]"
                                >
                                    Close & Continue
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>
    );
}

