"use client";
/**
 * Post-Login Redirect Handler
 * 
 * Routes users based on their account state:
 * - No businesses → Introduction page (create first business)
 * - Has businesses → Dashboard (view/continue their work)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Loader2 } from "lucide-react";

export default function RedirectPage() {
    const router = useRouter();
    const { session, authLoading } = useAuth();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!session) {
            router.push("/auth/login");
            return;
        }

        checkUserState();
    }, [session, authLoading, router]);

    const checkUserState = async () => {
        try {
            // Check if user has any businesses
            const res = await fetchWithAuth('/api/user/funnels');

            if (res.ok) {
                const data = await res.json();

                if (data.funnels && data.funnels.length > 0) {
                    // User has businesses → go to dashboard
                    console.log('[Redirect] User has businesses, going to dashboard');
                    router.replace('/dashboard');
                } else {
                    // New user, no businesses → go to introduction
                    console.log('[Redirect] New user, going to introduction');
                    router.replace('/introduction');
                }
            } else {
                // API error, default to introduction
                console.error('[Redirect] API error, defaulting to introduction');
                router.replace('/introduction');
            }
        } catch (error) {
            console.error('[Redirect] Check error:', error);
            // On error, default to introduction
            router.replace('/introduction');
        }
    };

    return (
        <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Setting up your workspace...</p>
            </div>
        </div>
    );
}
