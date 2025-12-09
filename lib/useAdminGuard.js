"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook for admin route protection
 * Simplified to prevent loading stuck states
 */
export function useAdminGuard() {
    const { user, isAdmin, loading } = useAuth();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Wait for auth to finish loading
        if (loading) return;

        // Mark as checked
        setChecked(true);

        // Not logged in - redirect to admin login
        if (!user) {
            window.location.href = "/auth/admin/login";
            return;
        }

        // Logged in but not admin - redirect to user dashboard
        if (!isAdmin) {
            window.location.href = "/dashboard";
            return;
        }
    }, [user, isAdmin, loading]);

    // Return loading if auth is loading OR if we haven't checked yet
    return {
        isAdmin: checked && isAdmin && !!user,
        isLoading: loading || (!checked && !isAdmin),
        user
    };
}
