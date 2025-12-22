"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    Building2,
    BookOpen,
    FileText,
    FileSearch,
    CreditCard,
    Settings,
    ChevronLeft,
    ChevronRight,
    Shield,
    LogOut,
    Menu,
    X,
    Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MENU_ITEMS = [
    { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/businesses", label: "Businesses", icon: Building2 },
    { href: "/admin/transcripts", label: "Transcripts", icon: FileText },
    { href: "/admin/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/admin/content-review", label: "Content Review", icon: FileSearch },
    { href: "/admin/billing", label: "Billing / Tiers", icon: CreditCard },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const { user, isAdmin, loading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    // Handle redirects
    useEffect(() => {
        if (loading) return;

        setHasChecked(true);

        if (!user) {
            window.location.href = "/admin/login";
            return;
        }

        if (!isAdmin) {
            window.location.href = "/dashboard";
            return;
        }
    }, [user, isAdmin, loading]);

    // Show loading only briefly
    if (loading || (!hasChecked && !isAdmin)) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Not admin - will redirect, show nothing
    if (!isAdmin || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white flex">
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarCollapsed ? 80 : 280 }}
                className="hidden lg:flex flex-col bg-[#131314] border-r border-[#1b1b1d] fixed h-screen z-40"
            >
                {/* Logo / Branding - Clickable to go to admin overview */}
                <Link href="/admin/overview" className="p-6 border-b border-[#1b1b1d] flex items-center justify-between hover:bg-[#1b1b1d]/50 transition-colors">
                    <AnimatePresence mode="wait">
                        {!sidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan to-cyan/60 rounded-xl flex items-center justify-center shadow-lg shadow-cyan/20">
                                    <Shield className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg">
                                        <span className="text-cyan">Ted</span>
                                        <span className="text-white">OS</span>
                                    </h1>
                                    <p className="text-xs text-gray-500">Admin Panel</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {sidebarCollapsed && (
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan to-cyan/60 rounded-xl flex items-center justify-center mx-auto">
                            <Shield className="w-5 h-5 text-black" />
                        </div>
                    )}
                </Link>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-cyan/10 text-cyan border border-cyan/30"
                                    : "text-gray-400 hover:bg-[#1b1b1d] hover:text-white"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-cyan" : "group-hover:text-cyan"}`} />
                                <AnimatePresence mode="wait">
                                    {!sidebarCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        );
                    })}
                </nav>

                {/* Exit Admin Link */}
                <div className="p-4 border-t border-[#1b1b1d]">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!sidebarCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap overflow-hidden"
                                >
                                    Exit Admin
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-[#1b1b1d] border border-[#2a2a2d] rounded-full flex items-center justify-center hover:bg-cyan/10 hover:border-cyan/30 transition-all"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#131314] border-b border-[#1b1b1d] z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan to-cyan/60 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-bold">
                        <span className="text-cyan">Ted</span>
                        <span className="text-white">OS</span>
                        <span className="text-gray-500 text-sm ml-2">Admin</span>
                    </span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        className="lg:hidden fixed inset-0 top-16 bg-[#131314] z-40 p-4"
                    >
                        <nav className="space-y-2">
                            {MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? "bg-cyan/10 text-cyan border border-cyan/30"
                                            : "text-gray-400 hover:bg-[#1b1b1d] hover:text-white"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-8 pt-4 border-t border-[#1b1b1d]">
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                                Exit Admin
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={`flex-1 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-[280px]"} transition-all duration-300`}>
                <div className="lg:p-8 p-4 pt-20 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
