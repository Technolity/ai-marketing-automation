"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MaintenancePage from "./MaintenancePage";

/**
 * MaintenanceGuard
 *
 * Wraps the entire app. Checks /api/maintenance-status on mount and periodically.
 * If maintenance mode is ON and the user is NOT an admin, shows the MaintenancePage.
 * Admin users see a small sticky banner at the top instead, so they know the site
 * is under maintenance while they continue to work.
 *
 * Routes starting with /admin are always allowed through (for admin login flow).
 * Auth routes (/auth/*) and public routes (/) are also allowed through.
 */

// Paths that are always accessible even in maintenance
const ALWAYS_ALLOWED = [
    '/admin',
    '/auth',
    '/sign-in',
    '/sign-up',
    '/',
];

function isAlwaysAllowed(pathname) {
    if (pathname === '/') return true;
    return ALWAYS_ALLOWED.some(prefix => prefix !== '/' && pathname.startsWith(prefix));
}

export default function MaintenanceGuard({ children }) {
    const { isAdmin, loading: authLoading } = useAuth();
    const pathname = usePathname();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkMaintenance = async () => {
            try {
                const res = await fetch('/api/maintenance-status');
                const data = await res.json();
                if (isMounted) {
                    setMaintenanceMode(data.maintenanceMode === true);
                    setChecked(true);
                }
            } catch (error) {
                console.error('[MaintenanceGuard] Error checking status:', error);
                if (isMounted) {
                    // Fail open: if check fails, don't block the site
                    setMaintenanceMode(false);
                    setChecked(true);
                }
            }
        };

        checkMaintenance();

        // Re-check every 60 seconds in case admin toggles it
        const interval = setInterval(checkMaintenance, 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // While we haven't checked yet, render children normally (fail-open)
    if (!checked) {
        return <>{children}</>;
    }

    // If maintenance mode is OFF, render normally
    if (!maintenanceMode) {
        return <>{children}</>;
    }

    // Maintenance mode is ON

    // Always allow admin routes, auth routes, and landing page
    if (isAlwaysAllowed(pathname)) {
        return (
            <>
                {isAdmin && <MaintenanceBanner />}
                {children}
            </>
        );
    }

    // If user is admin, let them through with a banner
    if (!authLoading && isAdmin) {
        return (
            <>
                <MaintenanceBanner />
                {children}
            </>
        );
    }

    // Non-admin user on a protected route → show maintenance page
    if (!authLoading) {
        return <MaintenancePage />;
    }

    // Auth is loading — show children, guard will re-render once loaded
    return <>{children}</>;
}

/**
 * Small sticky banner at the top of the page for admins
 * to remind them the site is currently in maintenance mode.
 */
function MaintenanceBanner() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-500/90 backdrop-blur-sm text-black text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-3">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
            </span>
            🔧 Maintenance Mode is active — only admins can access the site right now
            <button
                onClick={() => setDismissed(true)}
                className="ml-4 px-2 py-0.5 bg-black/20 hover:bg-black/30 rounded text-xs transition-colors"
            >
                Dismiss
            </button>
        </div>
    );
}
