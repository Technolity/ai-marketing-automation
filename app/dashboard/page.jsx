"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppNavbar from "@/components/AppNavbar";
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

        // No redirects - always show dashboard for authenticated users
        console.log('[Dashboard] User authenticated, showing dashboard grid');
        setIsLoading(false);
    }, [session, authLoading, router]);

    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Always show dashboard grid with OSWizard in dashboard mode
    return (
        <div className="min-h-screen bg-[#0e0e0f]">
            <AppNavbar />
            <OSWizard mode="dashboard" />
        </div>
    );
}
