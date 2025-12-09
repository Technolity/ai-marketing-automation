"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook for admin route protection
 * Uses shared AuthContext for faster performance
 */
export function useAdminGuard() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        // Don't do anything while loading
        if (loading) return;

        // Already redirecting
        if (redirecting) return;

        // Not logged in - redirect to admin login
        if (!user) {
            setRedirecting(true);
            window.location.href = "/auth/admin/login";
            return;
        }

        // Logged in but not admin - redirect to user dashboard
        if (!isAdmin) {
            setRedirecting(true);
            window.location.href = "/dashboard";
            return;
        }
    }, [user, isAdmin, loading, redirecting]);

    return {
        isAdmin: !loading && isAdmin && user,
        isLoading: loading || redirecting,
        user
    };
}
