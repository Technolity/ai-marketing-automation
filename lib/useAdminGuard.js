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
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Don't check until auth context has initialized
        if (loading) return;

        // Already checked
        if (checked) return;

        // Not logged in
        if (!user) {
            setChecked(true);
            router.push("/auth/admin/login");
            return;
        }

        // Not admin
        if (!isAdmin) {
            setChecked(true);
            router.push("/dashboard");
            return;
        }

        // Is admin - all good
        setChecked(true);
    }, [user, isAdmin, loading, router, checked]);

    return {
        isAdmin: isAdmin && checked,
        isLoading: loading || !checked,
        user
    };
}
