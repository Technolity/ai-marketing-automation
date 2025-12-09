"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    Building2,
    BookOpen,
    FileSearch,
    CreditCard,
    Settings,
    ChevronLeft,
    ChevronRight,
    Shield,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useAdminGuard } from "@/lib/useAdminGuard";

const MENU_ITEMS = [
    { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/businesses", label: "Businesses", icon: Building2 },
    { href: "/admin/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/admin/content-review", label: "Content Review", icon: FileSearch },
    { href: "/admin/billing", label: "Billing / Tiers", icon: CreditCard },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const { isAdmin, isLoading } = useAdminGuard();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0f]">
                <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
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
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSidebarCollapsed(!sidebarCollapsed);
                        }}
                        className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        )}
                    </button>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? "bg-cyan text-black font-semibold shadow-lg shadow-cyan/20"
                                        : "text-gray-400 hover:text-white hover:bg-[#1b1b1d]"
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
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

                {/* Footer */}
                <div className="p-4 border-t border-[#1b1b1d]">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-[#1b1b1d] transition-all"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!sidebarCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    Exit Admin
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#131314] border-b border-[#1b1b1d] px-4 py-3 flex items-center justify-between">
                <Link href="/admin/overview" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan to-cyan/60 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-bold">
                        <span className="text-cyan">Ted</span>
                        <span className="text-white">OS</span>
                        <span className="text-gray-500 text-sm ml-2">Admin</span>
                    </span>
                </Link>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors"
                >
                    {mobileMenuOpen ? (
                        <X className="w-6 h-6 text-gray-400" />
                    ) : (
                        <Menu className="w-6 h-6 text-gray-400" />
                    )}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#131314] z-50 pt-16"
                        >
                            <nav className="p-4 space-y-2">
                                {MENU_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                                ${isActive
                                                    ? "bg-cyan text-black font-semibold"
                                                    : "text-gray-400 hover:text-white hover:bg-[#1b1b1d]"
                                                }
                                            `}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1b1b1d]">
                                <Link
                                    href="/"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-[#1b1b1d] transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Exit Admin</span>
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main
                className={`
                    flex-1 min-h-screen pt-16 lg:pt-0 transition-all duration-300
                    ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-[280px]"}
                `}
            >
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
