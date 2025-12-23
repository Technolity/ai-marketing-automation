"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
    CheckCircle, 
    ExternalLink, 
    LayoutDashboard, 
    Edit3, 
    Mail, 
    Rocket,
    Copy,
    Check,
    Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

export default function FunnelLivePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { session, authLoading } = useAuth();
    
    const [funnel, setFunnel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const funnelId = searchParams.get('funnelId');

    useEffect(() => {
        if (authLoading) return;

        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadFunnel = async () => {
            if (!funnelId) {
                // No funnel ID - maybe redirect or show a default state
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetchWithAuth(`/api/ghl/funnel/${funnelId}`);
                const data = await res.json();
                
                if (data.success && data.funnel) {
                    setFunnel(data.funnel);
                }
            } catch (error) {
                console.error('Failed to load funnel:', error);
                toast.error('Failed to load funnel details');
            } finally {
                setIsLoading(false);
            }
        };

        loadFunnel();
    }, [session, authLoading, router, funnelId]);

    const handleCopyUrl = async () => {
        if (funnel?.funnel_url) {
            await navigator.clipboard.writeText(funnel.funnel_url);
            setCopied(true);
            toast.success('URL copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center px-6 py-12">
            {/* Background effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl w-full relative z-10"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex justify-center mb-8"
                >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-cyan/20 flex items-center justify-center border border-green-500/30">
                        <Rocket className="w-12 h-12 text-green-400" />
                    </div>
                </motion.div>

                {/* Main Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                        Your funnel is live.
                    </h1>
                    {funnel?.funnel_name && (
                        <p className="text-xl text-gray-400">
                            {funnel.funnel_name}
                        </p>
                    )}
                </motion.div>

                {/* Funnel URL Card */}
                {funnel?.funnel_url && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6 mb-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-cyan/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-cyan" />
                            </div>
                            <span className="text-gray-300 font-medium">Funnel URL</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-[#0e0e0f] rounded-lg px-4 py-3 border border-[#2a2a2d] overflow-hidden">
                                <p className="text-cyan truncate text-sm md:text-base">
                                    {funnel.funnel_url}
                                </p>
                            </div>
                            <button
                                onClick={handleCopyUrl}
                                className="p-3 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg transition-colors"
                                title="Copy URL"
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-400" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>

                        {/* Visit Funnel Button */}
                        <a
                            href={funnel.funnel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 w-full bg-cyan hover:brightness-110 text-black px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan/20"
                        >
                            Visit Funnel
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    </motion.div>
                )}

                {/* Status Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-3 justify-center mb-8"
                >
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-400 text-sm font-medium">Funnel Active</span>
                    </div>
                    <div className="flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-2">
                        <Mail className="w-4 h-4 text-cyan" />
                        <span className="text-cyan text-sm font-medium">Email automation running</span>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex-1 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        View Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/build-funnel')}
                        className="flex-1 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                        <Edit3 className="w-5 h-5" />
                        Edit Funnel
                    </button>
                </motion.div>

                {/* Celebration confetti effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: "50%",
                                y: "-10%",
                                scale: 0,
                                rotate: Math.random() * 360
                            }}
                            animate={{
                                y: "110%",
                                scale: [0, 1, 1],
                                rotate: Math.random() * 360 + 360
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                delay: Math.random() * 0.5,
                                ease: "easeOut"
                            }}
                            className={`absolute w-2 h-2 rounded-full ${
                                ['bg-cyan', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400'][Math.floor(Math.random() * 4)]
                            }`}
                            style={{
                                left: `${Math.random() * 100}%`
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

