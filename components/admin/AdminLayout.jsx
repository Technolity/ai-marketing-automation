"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileText,
    CreditCard,
    Settings,
    Shield,
    LogOut,
    Menu,
    X,
    Loader2,
    Database,
    FolderKanban,
    BadgeCheck,
    Megaphone,
    MessageSquare,
} from "@/lib/icons";
import { useAuth } from "@/contexts/AuthContext";

const MENU_ITEMS = [
    { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: BadgeCheck },
    { href: "/admin/funnels", label: "Funnels", icon: FolderKanban },
    { href: "/admin/ghl-accounts", label: "GHL Sub-Accounts", icon: Database },
    { href: "/admin/database", label: "Database Manager", icon: Database, badge: "GOD MODE" },
    { href: "/admin/transcripts", label: "Transcripts", icon: FileText },
    { href: "/admin/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/admin/billing", label: "Billing / Tiers", icon: CreditCard },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const { user, isAdmin, loading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        if (loading) return;
        setHasChecked(true);
        if (!user) { window.location.href = "/admin/login"; return; }
        if (!isAdmin) { window.location.href = "/dashboard"; return; }
    }, [user, isAdmin, loading]);

    if (loading || (!hasChecked && !isAdmin)) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#060B12]">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#18D3F6" }} />
            </div>
        );
    }

    if (!isAdmin || !user) return null;

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#060B12", color: "#F2FAFF", overflowX: "hidden", width: "100%" }}>

            {/* ── Desktop Sidebar (lg+) ──────────────────────────── */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarCollapsed ? 80 : 280 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="hidden lg:flex flex-col fixed h-screen z-40 overflow-hidden"
                style={{ backgroundColor: "#0B131D", borderRight: "1px solid #183042" }}
            >
                {/* Logo */}
                <Link
                    href="/admin/overview"
                    className="p-5 flex items-center justify-between transition-colors"
                    style={{ borderBottom: "1px solid #183042" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#0E1E2A"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                    <AnimatePresence mode="wait">
                        {!sidebarCollapsed && (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-start gap-1"
                            >
                                <Image
                                    src="/tedos-logo.png"
                                    alt="TedOS"
                                    width={120}
                                    height={32}
                                    className="h-8 w-auto object-contain"
                                    priority
                                />
                                <span
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: "#18D3F6", color: "#060B12" }}
                                >
                                    Admin
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {sidebarCollapsed && (
                        <Shield
                            className="w-5 h-5 mx-auto flex-shrink-0"
                            style={{ color: "#18D3F6" }}
                        />
                    )}
                </Link>

                {/* Nav items */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative"
                                style={{
                                    backgroundColor: isActive ? "#0E2C37" : "transparent",
                                    color: isActive ? "#18D3F6" : "#A6BCD0",
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "#1A2129";
                                        e.currentTarget.style.color = "#F4F8FB";
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "#A6BCD0";
                                    }
                                }}
                            >
                                <Icon
                                    className="w-5 h-5 flex-shrink-0 transition-colors"
                                    style={{ color: isActive ? "#18D3F6" : "inherit" }}
                                />
                                <AnimatePresence mode="wait">
                                    {!sidebarCollapsed && (
                                        <motion.span
                                            key="label"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="whitespace-nowrap overflow-hidden text-sm font-medium"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {item.badge && !sidebarCollapsed && (
                                    <span
                                        className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                                        style={{ backgroundColor: "#18D3F6", color: "#060B12" }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Exit Admin */}
                <div className="p-3" style={{ borderTop: "1px solid #183042" }}>
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
                        style={{ color: "#A6BCD0" }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                            e.currentTarget.style.color = "#f87171";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#A6BCD0";
                        }}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!sidebarCollapsed && (
                                <motion.span
                                    key="exit"
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

            </motion.aside>

            {/* ── Collapse toggle — fixed sibling, never clipped ── */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex fixed z-50 h-7 w-7 items-center justify-center rounded-full"
                style={{
                    top: 22,
                    left: sidebarCollapsed ? 66 : 266,
                    transition: "left 0.25s ease-in-out, background-color 0.15s, border-color 0.15s, color 0.15s",
                    backgroundColor: "#0B131D",
                    border: "1px solid #183042",
                    color: "#A6BCD0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#0E2C37";
                    e.currentTarget.style.borderColor = "#18D3F6";
                    e.currentTarget.style.color = "#18D3F6";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#0B131D";
                    e.currentTarget.style.borderColor = "#183042";
                    e.currentTarget.style.color = "#A6BCD0";
                }}
            >
                {sidebarCollapsed
                    ? <PanelLeftOpen className="w-3 h-3" />
                    : <PanelLeftClose className="w-3 h-3" />
                }
            </button>

            {/* ── Tablet Icon Rail (md, hidden on lg+) ──────────── */}
            <aside
                className="hidden md:flex lg:hidden flex-col fixed h-screen z-40 w-14"
                style={{ backgroundColor: "#0B131D", borderRight: "1px solid #183042" }}
            >
                <Link
                    href="/admin/overview"
                    className="h-16 flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ borderBottom: "1px solid #183042" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1A2129"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                    <Shield
                        className="w-5 h-5"
                        style={{ color: "#18D3F6" }}
                    />
                </Link>

                <nav className="flex-1 py-3 flex flex-col items-center gap-0.5 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                                style={{
                                    backgroundColor: isActive ? "#0E2C37" : "transparent",
                                    color: isActive ? "#18D3F6" : "#A6BCD0",
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "#1A2129";
                                        e.currentTarget.style.color = "#F4F8FB";
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "#B2C0CD";
                                    }
                                }}
                            >
                                <Icon className="w-5 h-5" />
                            </Link>
                        );
                    })}
                </nav>

                <div className="py-3 flex justify-center flex-shrink-0" style={{ borderTop: "1px solid #1E2A34" }}>
                    <Link
                        href="/"
                        title="Exit Admin"
                        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                        style={{ color: "#B2C0CD" }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                            e.currentTarget.style.color = "#f87171";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#B2C0CD";
                        }}
                    >
                        <LogOut className="w-5 h-5" />
                    </Link>
                </div>
            </aside>

            {/* ── Mobile Header ──────────────────────────────────── */}
            <div
                className="md:hidden fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4"
                style={{ backgroundColor: "#0B131D", borderBottom: "1px solid #183042" }}
            >
                <div className="flex items-center gap-3">
                    <Image
                        src="/tedos-logo.png"
                        alt="TedOS"
                        width={90}
                        height={24}
                        className="h-6 w-auto object-contain"
                        priority
                    />
                    <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "#18D3F6", color: "#060B12" }}
                    >
                        Admin
                    </span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                    style={{ color: "#B2C0CD" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1A2129"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* ── Mobile Menu Overlay ────────────────────────────── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "-100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "-100%" }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="md:hidden fixed inset-0 top-14 z-40 p-4 overflow-y-auto overflow-x-hidden"
                        style={{ backgroundColor: "#0B131D" }}
                    >
                        <nav className="space-y-0.5">
                            {MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium"
                                        style={{
                                            backgroundColor: isActive ? "#10333E" : "transparent",
                                            color: isActive ? "#16C7E7" : "#B2C0CD",
                                        }}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                        {item.badge && (
                                            <span
                                                className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                                                style={{ backgroundColor: "#18D3F6", color: "#060B12" }}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-6 pt-4" style={{ borderTop: "1px solid #183042" }}>
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium"
                                style={{ color: "#B2C0CD" }}
                            >
                                <LogOut className="w-5 h-5" />
                                Exit Admin
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Content ───────────────────────────────────── */}
            <main
                className={`flex-1 md:ml-14 transition-all duration-300 ${
                    sidebarCollapsed ? "lg:ml-20" : "lg:ml-[280px]"
                }`}
                style={{ overflowX: "auto", overflowY: "hidden", maxWidth: "100vw" }}
            >
                <div className="p-4 pt-[72px] md:p-6 lg:p-8" style={{ width: "100%", maxWidth: "100%", overflowX: "auto", boxSizing: "border-box" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
