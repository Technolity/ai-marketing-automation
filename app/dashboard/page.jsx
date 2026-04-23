"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GeistSans } from "geist/font/sans";
import {
    Loader2,
    Plus,
    FolderOpen,
    ChevronRight,
    Clock3,
    CheckCircle2,
    Building2,
    Trash2,
    ExternalLink,
    Users,
    Rocket,
    BarChart3,
    Pencil,
    Check,
    X,
    ImagePlus,
    HelpCircle,
    ArrowUpRight,
    ShieldCheck,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import DailyLeadsPage from "@/app/dashboard/daily-leads/page";
import { useAuth } from "@/contexts/AuthContext";
import { UserButton } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import LivePerformancePanel from "@/components/dashboard/LivePerformancePanel";
import VaultReviewPanel from "@/components/dashboard/VaultReviewPanel";
import { cn } from "@/lib/utils";
import BugReportModal from "@/components/BugReportModal";

const TOTAL_APPROVAL_SECTIONS = 16;
const TOTAL_SETUP_STEPS = 20;

const TIER_LIMITS = {
    free: 1,
    tier1: 1,
    tier2: 3,
    tier3: 10,
};

const displayFontClass = GeistSans.className;

const SIDEBAR_COLLAPSE_STORAGE_KEY = "tedos-dashboard-sidebar-collapsed";

const DASHBOARD_TABS = [
    {
        id: "engines",
        label: "My Engines",
        icon: Rocket,
        breadcrumb: "Home > Workspace",
        title: "My Engines",
        description:
            "Monitor build status, launch readiness, and approval momentum for every engine in the workspace.",
        eyebrow: "Workspace Operating Layer",
    },
    {
        id: "performance",
        label: "My Results",
        icon: BarChart3,
        breadcrumb: "Home > Live data",
        title: "My Results",
        description:
            "Track Builder-connected revenue, contacts, appointments, and funnel velocity in one telemetry view.",
        eyebrow: "Realtime Telemetry Layer",
    },
    {
        id: "daily-leads",
        label: "Daily Content",
        icon: ImagePlus,
        breadcrumb: "Home > Daily growth",
        title: "Daily Content",
        description:
            "Generate social creative from vault strategy while keeping the current production-ready Daily Leads workflow intact.",
        eyebrow: "Organic Growth Engine",
    },
    {
        id: "vault-review",
        label: "Review & Approve",
        icon: ShieldCheck,
        breadcrumb: "Home > Approval flow",
        title: "Review & Approve",
        description:
            "Review approvals, spot missing media, and move engines cleanly into Builder launch prep.",
        eyebrow: "Content Approval Desk",
    },
];

function DashboardStatCard({ label, value, helper, icon: Icon, accent = "text-cyan" }) {
    const displayValue = typeof value === "number" ? value.toLocaleString() : value;

    return (
        <div className="rounded-[18px] border border-white/[0.07] bg-[#111214] px-3.5 py-3.5 sm:px-4">
            <div className="flex items-center justify-between gap-3">
                <p className={cn(GeistSans.className, "text-xs font-semibold uppercase tracking-[0.16em] text-[#76767d]")}>
                    {label}
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.06] bg-[#0d0e0f]">
                    <Icon className={cn("h-3.5 w-3.5", accent)} />
                </div>
            </div>
            <p className={cn(displayFontClass, "mt-2.5 text-2xl font-semibold leading-none tracking-[-0.03em] sm:text-3xl", accent)}>
                {displayValue}
            </p>
            <p className={cn(GeistSans.className, "mt-2 text-sm leading-5 text-[#8b8b93]")}>{helper}</p>
        </div>
    );
}

function SidebarNavButton({ active, icon: Icon, label, helper, onClick, href, collapsed = false }) {
    const content = (
        <>
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border transition-colors",
                    active
                        ? "border-cyan/20 bg-cyan/10 text-cyan"
                        : "border-white/[0.07] bg-[#111213] text-[#8b8b93] group-hover:text-white"
                )}
            >
                <Icon className="h-3.5 w-3.5 shrink-0" />
            </div>
            {!collapsed && (
                <div className="min-w-0">
                    <span
                        className={cn(
                            GeistSans.className,
                            "block truncate text-[13px]",
                            active ? "font-semibold text-white" : "font-medium text-[#e8e8ec]"
                        )}
                    >
                        {label}
                    </span>
                    {helper ? (
                        <span className="mt-0.5 block truncate text-[9px] uppercase tracking-[0.14em] text-[#6f7077]">
                            {helper}
                        </span>
                    ) : null}
                </div>
            )}
        </>
    );

    const className = cn(
        GeistSans.className,
        "group flex w-full items-center gap-2.5 border text-left transition-all",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
        active
            ? "rounded-[14px] border-white/[0.08] bg-[#14181a] text-white"
            : "rounded-[14px] border-transparent bg-transparent text-[#f0f0f2] hover:border-white/[0.07] hover:bg-white/[0.03]"
    );

    if (href) {
        return (
            <Link href={href} className={className} title={collapsed ? label : undefined}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={className} title={collapsed ? label : undefined}>
            {content}
        </button>
    );
}

function getProgressPercentage(business) {
    if (business.deployed_at) return 100;
    if (business.vault_generated) {
        const approvedCount = business.approved_count || 0;
        return Math.min(100, Math.round((approvedCount / TOTAL_APPROVAL_SECTIONS) * 100));
    }

    const completedSteps = business.completed_steps_count || 0;
    return Math.min(100, Math.round((completedSteps / TOTAL_SETUP_STEPS) * 100));
}

export default function Dashboard() {
    const router = useRouter();
    const {
        session,
        loading: authLoading,
        isProfileComplete,
        isTeamMember,
        role,
        workspaceName,
        isAdmin,
    } = useAuth();

    const [activeTab, setActiveTab] = useState("engines");
    const [isLoading, setIsLoading] = useState(true);
    const [businesses, setBusinesses] = useState([]);
    const [canManageTeam, setCanManageTeam] = useState(false);
    const [maxFunnels, setMaxFunnels] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [hasDeployedFunnel, setHasDeployedFunnel] = useState(false);
    const [builderLocationId, setBuilderLocationId] = useState("");
    const [editingFunnelId, setEditingFunnelId] = useState(null);
    const [editNameValue, setEditNameValue] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [subscriptionTier, setSubscriptionTier] = useState("free");
    const editInputRef = useRef(null);
    const sidebarPreferenceLoadedRef = useRef(false);

    const loadUserData = useCallback(async () => {
        try {
            const profileRes = await fetchWithAuth("/api/user/profile");
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setMaxFunnels(profileData.max_funnels || TIER_LIMITS[profileData.subscription_tier] || 1);
                setCanManageTeam(["growth", "scale"].includes(profileData.subscription_tier) || isAdmin);
                setSubscriptionTier(profileData.subscription_tier || "free");
            }

            const funnelsRes = await fetchWithAuth("/api/user/funnels");
            if (funnelsRes.ok) {
                const funnelsData = await funnelsRes.json();
                const userFunnels = funnelsData.funnels || [];

                if (userFunnels.length === 0) {
                    router.replace("/introduction");
                    return;
                }

                setBusinesses(userFunnels);

                const deployed = userFunnels.some((funnel) => funnel.deployed_at);
                setHasDeployedFunnel(deployed);

                if (deployed) {
                    try {
                        const builderRes = await fetchWithAuth("/api/builder/location");
                        if (builderRes.ok) {
                            const builderData = await builderRes.json();
                            if (builderData.available && builderData.locationId) {
                                setBuilderLocationId(builderData.locationId);
                            }
                        }
                    } catch (error) {
                        console.error("[Dashboard] Builder location fetch error:", error);
                    }
                }
            }
        } catch (error) {
            console.error("[Dashboard] Load error:", error);
            toast.error("Failed to load your marketing engines");
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, router]);

    useEffect(() => {
        if (authLoading) return;

        if (isAdmin) {
            setCanManageTeam(true);
        }

        if (!session) {
            router.push("/auth/login");
            return;
        }

        if (isProfileComplete === false) {
            router.push("/onboarding");
            return;
        }

        loadUserData();
    }, [session, authLoading, router, isProfileComplete, isAdmin, loadUserData]);

    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [activeTab]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileNavOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        try {
            const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
            if (storedValue !== null) {
                setIsSidebarCollapsed(storedValue === "true");
            }
        } catch (error) {
            console.error("[Dashboard] Sidebar preference read error:", error);
        } finally {
            sidebarPreferenceLoadedRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (!sidebarPreferenceLoadedRef.current) return;
        try {
            window.localStorage.setItem(
                SIDEBAR_COLLAPSE_STORAGE_KEY,
                String(isSidebarCollapsed)
            );
        } catch (error) {
            console.error("[Dashboard] Sidebar preference write error:", error);
        }
    }, [isSidebarCollapsed]);

    const handleCreateBusiness = async () => {
        if (!newBusinessName.trim()) {
            toast.error("Please enter a marketing engine name");
            return;
        }

        if (businesses.length >= maxFunnels) {
            toast.error(`You've reached your limit of ${maxFunnels} marketing engine(s). Upgrade to create more.`);
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetchWithAuth("/api/user/funnels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newBusinessName.trim(),
                    description: "",
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create business");
            }

            toast.success("Marketing Engine created. Ready for buildout.");
            setShowCreateModal(false);
            setNewBusinessName("");
            loadUserData();
        } catch (error) {
            console.error("[Dashboard] Create error:", error);
            toast.error(error.message || "Failed to create business");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBusiness = async (funnelId, businessName) => {
        if (!confirm(`Are you sure you want to delete "${businessName}"? This cannot be undone.`)) {
            return;
        }

        setIsDeleting(funnelId);
        try {
            const res = await fetchWithAuth(`/api/user/funnels?id=${funnelId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            toast.success("Marketing Engine deleted");
            await loadUserData();
        } catch (error) {
            console.error("[Dashboard] Delete error:", error);
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(null);
        }
    };

    const startEditing = (business) => {
        setEditingFunnelId(business.id);
        setEditNameValue(business.funnel_name);
        setTimeout(() => editInputRef.current?.focus(), 50);
    };

    const cancelEditing = () => {
        setEditingFunnelId(null);
        setEditNameValue("");
    };

    const handleRenameBusiness = async (funnelId) => {
        const trimmed = editNameValue.trim();
        if (!trimmed) {
            toast.error("Name cannot be empty");
            return;
        }

        const current = businesses.find((business) => business.id === funnelId);
        if (current && current.funnel_name === trimmed) {
            cancelEditing();
            return;
        }

        setIsSavingName(true);
        try {
            const res = await fetchWithAuth("/api/user/funnels", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ funnelId, name: trimmed }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to rename");
            }

            toast.success("Marketing Engine name updated");
            setBusinesses((prev) =>
                prev.map((business) =>
                    business.id === funnelId ? { ...business, funnel_name: trimmed } : business
                )
            );
            cancelEditing();
        } catch (error) {
            console.error("[Dashboard] Rename error:", error);
            toast.error(error.message || "Failed to rename");
        } finally {
            setIsSavingName(false);
        }
    };

    const activeTabMeta = DASHBOARD_TABS.find((tab) => tab.id === activeTab) || DASHBOARD_TABS[0];
    const canCreateMore = businesses.length < maxFunnels;
    const builderUrl = builderLocationId
        ? `https://app.tedos.ai/v2/location/${builderLocationId}/funnels-websites/funnels`
        : "https://app.tedos.ai";
    const currentUserName =
        session?.user?.user_metadata?.full_name?.trim() ||
        session?.user?.email?.split("@")[0] ||
        "Owner";
    const workspaceDisplayName = isTeamMember
        ? workspaceName || "Shared workspace"
        : `${currentUserName}'s workspace`;
    const workspaceAccessLabel = role === "team_member" ? "Team member access" : "Owner access";
    const workspaceContextLabel = isTeamMember
        ? `Signed in as ${currentUserName}`
        : `Signed in as ${currentUserName}`;

    const engineInsights = useMemo(() => {
        const awaitingReview = businesses.filter(
            (business) =>
                business.vault_generated &&
                !business.deployed_at &&
                (business.approved_count || 0) < TOTAL_APPROVAL_SECTIONS
        );
        const builderReady = businesses.filter(
            (business) =>
                business.deployed_at || (business.approved_count || 0) >= TOTAL_APPROVAL_SECTIONS
        );

        return {
            live: businesses.length,
            awaitingReviewCount: awaitingReview.length,
            pagesReady: businesses.filter((business) => business.vault_generated).length,
            builderSync: builderReady.length,
            awaitingReview,
            builderReady,
        };
    }, [businesses]);

    const renderSidebarContent = ({ collapsed = false, mobile = false } = {}) => (
        <div className="flex h-full flex-col bg-[#0e0e0f]">
            <div className={cn("relative flex h-[72px] items-center border-b border-white/[0.06]", collapsed ? "justify-between px-3" : "justify-between px-5")}>
                <Link
                    href="/"
                    className="flex flex-1 items-center justify-start"
                >
                    <Image
                        src="/tedos-logo.png"
                        alt="TedOS"
                        width={mobile || !collapsed ? 154 : 48}
                        height={40}
                        className={cn("w-auto object-contain transition-all duration-200", mobile || !collapsed ? "h-10" : "h-8")}
                        priority
                    />
                </Link>

                {mobile && (
                    <button
                        type="button"
                        onClick={() => setIsMobileNavOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] transition-colors hover:text-white"
                        aria-label="Close navigation"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}

                {!mobile && (
                    <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed((current) => !current)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-white/[0.12] bg-[#111213] text-[#8b8b93] shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-colors hover:text-white lg:flex"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
                    </button>
                )}
            </div>

            <div className={cn("flex flex-1 flex-col min-h-0 pt-3.5", collapsed ? "px-2.5 pb-4" : "px-3 pb-5")}>
                {!collapsed && (
                    <div className="px-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7d7d84]">Navigation</p>
                    </div>
                )}

                <nav className={cn("mt-3 space-y-2 overflow-y-auto", collapsed && "flex flex-col items-center")}>
                    {DASHBOARD_TABS.map((tab) => (
                        <SidebarNavButton
                            key={tab.id}
                            active={activeTab === tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            collapsed={collapsed}
                            onClick={() => { setActiveTab(tab.id); if (mobile) setIsMobileNavOpen(false); }}
                        />
                    ))}

                    <SidebarNavButton active={false} icon={HelpCircle} label="Help & Support" href="/guide" collapsed={collapsed} />
                </nav>

                <div className={cn("mt-auto border-t border-white/[0.07] pt-5", collapsed ? "px-0" : "px-2")}>
                    {collapsed ? (
                        <div className="space-y-2.5">
                            <BugReportModal collapsed={true} />
                            <div className="flex justify-center">
                                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-[14px] border border-white/[0.08] bg-[#111214]">
                                    <span className={cn(displayFontClass, "text-sm font-semibold text-white")}>{businesses.length}</span>
                                    <span className="text-[9px] uppercase tracking-[0.12em] text-[#7d7d84]">/ {maxFunnels}</span>
                                </div>
                            </div>
                            {(hasDeployedFunnel || builderLocationId) ? (
                                <a href={builderUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex h-10 items-center justify-center rounded-[12px] border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                                    title="Open Builder">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            ) : (
                                <span
                                    className="flex h-10 items-center justify-center rounded-[12px] border border-white/[0.06] bg-[#0d0e0f] text-[#4a4a52] cursor-not-allowed"
                                    title="Deploy a funnel to unlock Builder">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </span>
                            )}
                            <div className="flex justify-center">
                                <UserButton
                                    afterSignOutUrl="/auth/login"
                                    appearance={{ elements: { avatarBox: "h-8 w-8" } }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <BugReportModal />
                            <p className="mt-3.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7d7d84]">Workspace</p>
                            <h3 className={cn(displayFontClass, "mt-2.5 truncate text-[16px] font-semibold tracking-[-0.02em] text-white")}>{workspaceDisplayName}</h3>
                            <p className="mt-1 truncate text-[12px] text-[#8b8b93]">{workspaceContextLabel}</p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#64656c]">{workspaceAccessLabel}</p>
                            <div className="mt-3.5 rounded-[16px] border border-white/[0.07] bg-[#111214] p-3.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7d7d84]">Active engines</p>
                                        <p className={cn(displayFontClass, "mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-white")}>
                                            {businesses.length}<span className="ml-1 text-xs text-[#7d7d84]">/ {maxFunnels}</span>
                                        </p>
                                    </div>
                                    {(hasDeployedFunnel || builderLocationId) ? (
                                        <a href={builderUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-emerald-500/25 bg-emerald-500/10 px-3 text-[12px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300">
                                            Builder<ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    ) : (
                                        <span
                                            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-white/[0.06] bg-[#0d0e0f] px-3 text-[12px] font-medium text-[#4a4a52] cursor-not-allowed select-none"
                                            title="Deploy a funnel to unlock Builder">
                                            Builder<ExternalLink className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 mt-4">
                                <UserButton
                                    afterSignOutUrl="/auth/login"
                                    appearance={{ elements: { avatarBox: "h-8 w-8" } }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold text-white truncate">{workspaceDisplayName}</p>
                                    <p className="text-[10px] text-[#8b8b93] truncate">{workspaceAccessLabel}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const renderMarketingEngines = () => {
        const isStarter = !["growth", "scale", "tier2", "tier3"].includes(subscriptionTier);
        const emptySlotCount = Math.max(0, maxFunnels - businesses.length);

        const EmptySlotCard = ({ index }) => (
            <button
                key={`empty-${index}`}
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded-[24px] border border-dashed border-white/[0.15] bg-[#111214]/50 p-6 flex flex-col items-center justify-center gap-3 min-h-[260px] transition-colors hover:border-cyan/30 hover:bg-[#111214] group"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/20 group-hover:border-cyan/30 transition-colors">
                    <Plus className="h-5 w-5 text-[#4a4a52] group-hover:text-cyan transition-colors" />
                </div>
                <p className={cn(GeistSans.className, "text-sm font-medium text-[#4a4a52] group-hover:text-[#8b8b93] transition-colors")}>
                    New Engine
                </p>
            </button>
        );

        const LockedCard = () => (
            <div className="rounded-[24px] border border-white/[0.07] bg-[#111214] p-6 flex flex-col items-center justify-center gap-4 min-h-[260px] relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-[#0a0a0b]/60 backdrop-blur-[1px] rounded-[24px]" />
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.12] bg-[#1a1a1e]">
                        <svg className="h-5 w-5 text-[#6b6b74]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <div>
                        <p className={cn(GeistSans.className, "text-sm font-semibold text-[#8b8b93]")}>Engine Slot Locked</p>
                        <p className="mt-1.5 text-xs text-[#5a5a62] leading-5 max-w-[160px]">
                            Upgrade to <span className="text-cyan font-medium">Growth</span> or <span className="text-cyan font-medium">Scale</span> to unlock more engines
                        </p>
                    </div>
                    <Link
                        href="/billing"
                        className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-cyan/20 bg-cyan/10 px-3 text-xs font-semibold text-cyan transition-colors hover:bg-cyan/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Upgrade plan
                        <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        );

        return (
            <div>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {businesses.map((business) => {
                        const progress = getProgressPercentage(business);

                        // Determine status
                        let statusLabel, statusClass;
                        if (business.deployed_at) {
                            statusLabel = "Live";
                            statusClass = "text-emerald-400";
                        } else if ((business.approved_count || 0) >= TOTAL_APPROVAL_SECTIONS) {
                            statusLabel = "Ready to Launch";
                            statusClass = "text-cyan";
                        } else if (business.vault_generated) {
                            statusLabel = "Being Reviewed";
                            statusClass = "text-blue-200";
                        } else {
                            statusLabel = "Setting Up";
                            statusClass = "text-amber-300";
                        }

                        return (
                            <div
                                key={business.id}
                                className="rounded-[24px] border border-white/[0.07] bg-[#111214] p-6 cursor-pointer hover:border-cyan/30 transition-colors"
                                onClick={() => router.push(`/vault?funnel_id=${business.id}`)}
                            >
                                {/* Engine name */}
                                {editingFunnelId === business.id ? (
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editNameValue}
                                            onChange={(event) => setEditNameValue(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") handleRenameBusiness(business.id);
                                                if (event.key === "Escape") cancelEditing();
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isSavingName}
                                            className={cn(GeistSans.className, "w-full rounded-[12px] border border-cyan/30 bg-black/20 px-3 py-2 text-base font-medium text-white outline-none transition focus:border-cyan/60 focus:ring-2 focus:ring-cyan/40")}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRenameBusiness(business.id); }}
                                            disabled={isSavingName}
                                            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                        >
                                            {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                            disabled={isSavingName}
                                            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.03] text-[#8b8b93]"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <h3 className="mb-3 text-2xl font-semibold text-white leading-tight">
                                        {business.funnel_name}
                                    </h3>
                                )}

                                {/* Status label */}
                                <p className={cn("mb-4 text-lg font-semibold", statusClass)}>
                                    {statusLabel}
                                </p>

                                {/* Progress bar */}
                                <div className="mb-5">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                                        <div
                                            className="h-full rounded-full bg-cyan transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-sm text-[#8b8b93]">{progress}% complete</p>
                                </div>

                                {/* Primary action button */}
                                {business.deployed_at ? (
                                    <a
                                        href={builderUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="mb-4 flex h-12 w-full items-center justify-center rounded-[14px] bg-emerald-600 text-base font-semibold text-white transition-colors hover:bg-emerald-500"
                                    >
                                        Open Builder ↗
                                    </a>
                                ) : business.vault_generated ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); router.push(`/vault?funnel_id=${business.id}`); }}
                                        className="mb-4 flex h-12 w-full items-center justify-center rounded-[14px] bg-cyan/85 text-base font-semibold text-[#001418] transition-colors hover:brightness-105"
                                    >
                                        Review in Vault
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); router.push(`/intake_form?funnel_id=${business.id}`); }}
                                        className="mb-4 flex h-12 w-full items-center justify-center rounded-[14px] bg-cyan/85 text-base font-semibold text-[#001418] transition-colors hover:brightness-105"
                                    >
                                        Continue Setup
                                    </button>
                                )}

                                {/* Subtle secondary actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); startEditing(business); }}
                                        className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.03] text-[#8b8b93] transition-colors hover:border-cyan/20 hover:text-cyan"
                                        title="Rename engine"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteBusiness(business.id, business.funnel_name); }}
                                        disabled={isDeleting === business.id}
                                        className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.03] text-[#8b8b93] transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                                        title="Delete engine"
                                    >
                                        {isDeleting === business.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {isStarter ? (
                        <>
                            <LockedCard />
                            <LockedCard />
                        </>
                    ) : (
                        Array.from({ length: emptySlotCount }).map((_, i) => (
                            <EmptySlotCard key={`empty-${i}`} index={i} />
                        ))
                    )}
                </div>
            </div>
        );
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
                <Loader2 className="h-10 w-10 animate-spin text-cyan" />
            </div>
        );
    }

    return (
        <div className={cn(GeistSans.className, "min-h-screen bg-[#0a0a0b] text-[#f0f0f2] selection:bg-cyan/20 selection:text-cyan")}>
            <AnimatePresence>
                {isMobileNavOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsMobileNavOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -24, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -24, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="fixed inset-y-0 left-0 z-50 w-[292px] max-w-[85vw] border-r border-white/[0.07] shadow-[0_24px_60px_rgba(0,0,0,0.55)] lg:hidden"
                        >
                            {renderSidebarContent({ mobile: true })}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className="mx-auto w-full px-1.5 py-1.5 sm:px-2 lg:px-3">
                <div className="flex min-h-[calc(100vh-0.75rem)] w-full overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0a0a0b]">
                    <aside className={cn("hidden shrink-0 border-r border-white/[0.07] transition-[width] duration-300 lg:flex", isSidebarCollapsed ? "w-[92px]" : "w-[228px]")}>
                        {renderSidebarContent({ collapsed: isSidebarCollapsed })}
                    </aside>

                    <main className="min-w-0 flex-1">
                        <header className="border-b border-white/[0.06] px-4 py-4 sm:px-5 lg:px-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="flex items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsMobileNavOpen(true)}
                                        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] transition-colors hover:text-white lg:hidden"
                                        aria-label="Open navigation"
                                    >
                                        <Menu className="h-3.5 w-3.5" />
                                    </button>

                                    <div className="max-w-[640px]">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d84]">
                                            {activeTabMeta.eyebrow}
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-1 text-sm font-medium text-[#8b8b93]">
                                            <span>Home</span>
                                            <ChevronRight className="h-3 w-3" />
                                            <span className="text-[#f0f0f2]">{activeTabMeta.label}</span>
                                        </div>
                                        <h1 className={cn(displayFontClass, "mt-2.5 text-2xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-3xl")}>
                                            {activeTabMeta.title}
                                        </h1>
                                        <p className="mt-2.5 max-w-2xl text-sm leading-5 text-[#8b8b93] sm:text-base">
                                            {activeTabMeta.description}
                                        </p>
                                        {!canCreateMore && activeTab === "engines" ? (
                                            <p className="mt-2.5 text-xs font-medium uppercase tracking-[0.12em] text-amber-200/80">
                                                All engine slots are currently active.
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                    {canManageTeam && (
                                        <button
                                            type="button"
                                            onClick={() => router.push("/team")}
                                            className="inline-flex h-11 items-center gap-1.5 rounded-[12px] border border-white/[0.07] bg-[#111213] px-3.5 text-base font-medium text-[#d9d9df] transition-colors hover:border-cyan/20 hover:text-cyan"
                                        >
                                            <Users className="h-3.5 w-3.5" />
                                            Manage Team
                                        </button>
                                    )}

                                    {(hasDeployedFunnel || builderLocationId) && (
                                        <a
                                            href={builderUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(displayFontClass, "inline-flex h-11 items-center gap-1.5 rounded-[12px] border border-white/[0.07] bg-[#111213] px-3.5 text-base font-medium text-[#f0f0f2] transition-colors hover:border-cyan/20 hover:text-cyan")}
                                        >
                                            Open Builder
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(true)}
                                        disabled={!canCreateMore}
                                        className={cn(
                                            displayFontClass,
                                            "inline-flex h-11 items-center gap-1.5 rounded-[12px] px-3.5 text-base font-medium transition",
                                            canCreateMore
                                                ? "bg-cyan/85 text-[#001418] hover:brightness-105"
                                                : "cursor-not-allowed border border-white/[0.07] bg-[#111213] text-[#7d7d84]"
                                        )}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Create engine
                                    </button>

                                </div>
                            </div>
                        </header>

                        <div className="px-4 pb-6 pt-4 sm:px-5 lg:px-6 lg:pb-7 lg:pt-4">
                            <AnimatePresence mode="wait">
                                {activeTab === "engines" ? (
                                    <motion.div
                                        key="engines"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.24 }}
                                    >
                                        {renderMarketingEngines()}
                                    </motion.div>
                                ) : activeTab === "performance" ? (
                                    <motion.div
                                        key="performance"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.24 }}
                                    >
                                        <LivePerformancePanel engineInsights={engineInsights} />
                                    </motion.div>
                                ) : activeTab === "daily-leads" ? (
                                    <motion.div
                                        key="daily-leads"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.24 }}
                                    >
                                        <DailyLeadsPage />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="vault-review"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.24 }}
                                    >
                                        <VaultReviewPanel
                                            businesses={businesses}
                                            builderLocationId={builderLocationId}
                                            onOpenVault={(funnelId) => router.push(`/vault?funnel_id=${funnelId}`)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </main>
                </div>
            </div>

            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111112] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-cyan/20 bg-cyan/10">
                                <Building2 className="h-8 w-8 text-cyan" />
                            </div>

                            <h2 className="mt-6 text-3xl font-black tracking-[-0.05em] text-white">
                                Create New Engine
                            </h2>
                            <p className="mt-3 text-base leading-7 text-gray-500">
                                Name the new marketing engine so the workspace can generate the right
                                Vault, Builder, and reporting context.
                            </p>

                            <input
                                type="text"
                                value={newBusinessName}
                                onChange={(event) => setNewBusinessName(event.target.value)}
                                placeholder="e.g. TedOS Fitness, Acme Consulting"
                                className="mt-8 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-lg text-white outline-none transition focus:border-cyan/50 focus:ring-2 focus:ring-cyan/40"
                                autoFocus
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handleCreateBusiness();
                                    }
                                }}
                            />

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 font-semibold text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateBusiness}
                                    disabled={isCreating || !newBusinessName.trim()}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan/85 px-5 py-3.5 font-black text-black transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create engine"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
