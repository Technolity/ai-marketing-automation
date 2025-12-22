"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OSWizard from "@/components/OSWizard";

export default function Dashboard() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

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
            <OSWizard mode="dashboard" />
        </div>
    );
}
