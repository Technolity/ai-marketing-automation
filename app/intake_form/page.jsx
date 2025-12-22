"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import OSWizard from "@/components/OSWizard";
import { Loader2 } from "lucide-react";

export default function IntakeFormPage() {
    const router = useRouter();
    const { session, authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[IntakeForm] Page mounted');
        console.log('[IntakeForm] Auth loading:', authLoading);
        console.log('[IntakeForm] Session:', session ? 'Authenticated' : 'Not authenticated');

        if (authLoading) {
            console.log('[IntakeForm] Waiting for auth to complete...');
            return;
        }

        if (!session) {
            console.log('[IntakeForm] No session found, redirecting to login');
            router.push("/auth/login");
            return;
        }

        console.log('[IntakeForm] User authenticated, showing intake form');
        setIsLoading(false);
    }, [session, authLoading, router]);

    if (authLoading || isLoading) {
        return (
            <div className="h-[calc(100vh-5rem)] bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-5rem)] bg-[#0e0e0f] overflow-hidden">
            <OSWizard mode="intake" />
        </div>
    );
}
