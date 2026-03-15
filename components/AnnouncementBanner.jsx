"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, CheckCircle, AlertTriangle, Tag } from "lucide-react";

const TYPE_STYLES = {
    info: {
        bg: "from-blue-600/90 to-blue-700/90",
        icon: Info,
        glow: "shadow-blue-500/20",
    },
    success: {
        bg: "from-emerald-600/90 to-emerald-700/90",
        icon: CheckCircle,
        glow: "shadow-emerald-500/20",
    },
    warning: {
        bg: "from-amber-500/90 to-amber-600/90",
        icon: AlertTriangle,
        glow: "shadow-amber-500/20",
    },
    discount: {
        bg: "from-purple-600/90 to-pink-600/90",
        icon: Tag,
        glow: "shadow-purple-500/20",
    },
};

export default function AnnouncementBanner() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [announcement, setAnnouncement] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Don't show on admin pages (admin layout has its own structure)
    // or on the dashboard page (AppNavbar is hidden there)
    const isAdminPage = pathname?.startsWith("/admin");
    const isDashboard = pathname === "/dashboard";

    useEffect(() => {
        if (!user || isAdminPage || isDashboard) return;

        const fetchAnnouncement = async () => {
            try {
                const res = await fetch("/api/announcements");
                if (!res.ok) return;
                const data = await res.json();
                if (data.announcement) {
                    setAnnouncement(data.announcement);
                }
            } catch (err) {
                console.warn("[AnnouncementBanner] Fetch failed:", err);
            } finally {
                setLoaded(true);
            }
        };

        fetchAnnouncement();
    }, [user, isAdminPage, isDashboard]);

    const handleDismiss = async () => {
        setDismissed(true);

        if (!announcement?.id) return;

        try {
            await fetch("/api/announcements/dismiss", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ announcementId: announcement.id }),
            });
        } catch (err) {
            console.warn("[AnnouncementBanner] Dismiss failed:", err);
        }
    };

    // Don't render on admin/dashboard, or before loaded, or if dismissed
    if (isAdminPage || isDashboard || !loaded || !announcement || dismissed) return null;

    const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`fixed top-20 left-0 right-0 z-40 bg-gradient-to-r ${style.bg} backdrop-blur-xl shadow-lg ${style.glow}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-semibold text-white text-sm">
                                {announcement.title}
                            </span>
                            <span className="text-white/80 text-sm ml-2 hidden sm:inline">
                                — {announcement.message}
                            </span>
                            <p className="text-white/80 text-xs mt-0.5 sm:hidden truncate">
                                {announcement.message}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        aria-label="Dismiss notification"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
