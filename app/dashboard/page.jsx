"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Rocket, ExternalLink, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import OSWizard from "@/components/OSWizard";

// System Is Live Banner Component
function SystemLiveBanner({ funnels, onViewFunnels }) {
    const [expanded, setExpanded] = useState(false);

    if (!funnels || funnels.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500/10 via-cyan/10 to-green-500/10 border border-green-500/30 rounded-2xl p-4 md:p-6 mb-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                            Your system is live
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </h2>
                        <p className="text-gray-400 text-sm">
                            You can edit or regenerate anything at any time.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                >
                    <Zap className="w-4 h-4" />
                    View Funnels ({funnels.length})
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {/* Expanded Funnels List */}
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-green-500/20"
                >
                    <div className="grid gap-3">
                        {funnels.map((funnel) => (
                            <div
                                key={funnel.id}
                                className="bg-[#1b1b1d] rounded-lg p-4 flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="text-white font-medium">{funnel.funnel_name}</h3>
                                    <p className="text-gray-500 text-sm">{funnel.funnel_type}</p>
                                </div>
                                <a
                                    href={funnel.funnel_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-cyan/20 hover:bg-cyan/30 text-cyan px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all"
                                >
                                    Visit
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

// No Funnels Banner Component
function NoFunnelsBanner() {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-2xl p-4 md:p-6 mb-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-6 h-6 text-cyan" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-white">
                            Complete your first funnel to go live
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Build your funnel and launch it to start getting leads.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/vault')}
                    className="bg-cyan hover:brightness-110 text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                >
                    Open Vault
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [funnels, setFunnels] = useState([]);
    const [funnelsLoaded, setFunnelsLoaded] = useState(false);

    useEffect(() => {
        console.log('[Dashboard] Page mounted');
        console.log('[Dashboard] Auth loading:', authLoading);
        console.log('[Dashboard] Session:', session ? 'Authenticated' : 'Not authenticated');

        if (authLoading) {
            console.log('[Dashboard] Waiting for auth to complete...');
            return;
        }

        if (!session) {
            console.log('[Dashboard] No session found, redirecting to login');
            router.push("/auth/login");
            return;
        }

        console.log('[Dashboard] User authenticated, checking for progress');

        const checkUserProgress = async () => {
            try {
                // Check localStorage for in-progress work
                const localProgress = localStorage.getItem(`wizard_progress_${session.user.id}`);
                console.log('[Dashboard] Local progress:', localProgress ? 'Found' : 'Not found');

                if (localProgress) {
                    const savedProgress = JSON.parse(localProgress);
                    console.log('[Dashboard] Saved progress:', savedProgress);
                    console.log('[Dashboard] Completed steps:', savedProgress.completedSteps?.length || 0);
                    console.log('[Dashboard] Answers:', Object.keys(savedProgress.answers || {}).length);

                    // If user has ANY progress (completed steps OR any answers), show dashboard
                    if (savedProgress.completedSteps?.length > 0 ||
                        (savedProgress.answers && Object.keys(savedProgress.answers).length > 0)) {
                        console.log('[Dashboard] Found localStorage progress - showing grid');
                        setIsLoading(false);
                        // Load funnels in background
                        loadFunnels();
                        return;
                    }
                }

                // Check database for saved sessions
                console.log('[Dashboard] Checking database for saved sessions');
                const sessionsRes = await fetch("/api/os/sessions");
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    console.log('[Dashboard] Database sessions:', sessionsData.sessions?.length || 0);

                    // If user has ANY saved sessions, show dashboard
                    if (sessionsData.sessions?.length > 0) {
                        console.log('[Dashboard] Found saved sessions, showing grid');
                        setIsLoading(false);
                        // Load funnels in background
                        loadFunnels();
                        return;
                    }
                }

                // No progress found - redirect new users to introduction
                console.log('[Dashboard] No progress found - new user detected');
                console.log('[Dashboard] Redirecting to /introduction for onboarding');
                router.push("/introduction");
                return;
            } catch (error) {
                console.error('[Dashboard] Check progress error:', error);
                // On error, redirect to introduction as safe fallback
                console.log('[Dashboard] Error occurred, redirecting to introduction as fallback');
                router.push("/introduction");
                return;
            }
        };

        checkUserProgress();
    }, [session, authLoading, router]);

    // Load user's funnels
    const loadFunnels = async () => {
        try {
            const res = await fetchWithAuth('/api/ghl/funnels?status=active');
            const data = await res.json();

            if (data.success && data.funnels) {
                setFunnels(data.funnels);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to load funnels:', error);
        } finally {
            setFunnelsLoaded(true);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Always show dashboard grid with OSWizard in dashboard mode
    return (
        <div className="min-h-[calc(100vh-5rem)] bg-[#0e0e0f]">
            {/* System Status Banner */}
            <div className="max-w-7xl mx-auto px-6 pt-6">
                {funnelsLoaded && (
                    funnels.length > 0 ? (
                        <SystemLiveBanner funnels={funnels} />
                    ) : (
                        <NoFunnelsBanner />
                    )
                )}
            </div>

            <OSWizard mode="dashboard" />
        </div>
    );
}
