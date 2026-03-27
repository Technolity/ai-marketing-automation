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
    Bell,
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

const TOTAL_APPROVAL_SECTIONS = 16;
const TOTAL_SETUP_STEPS = 20;

const TIER_LIMITS = {
    free: 1,
    tier1: 1,
    tier2: 3,
    tier3: 10,
};

const SIDEBAR_COLLAPSE_STORAGE_KEY = "tedos-dashboard-sidebar-collapsed";
const displayFontClass = GeistSans.className;

const DASHBOARD_TABS = [
    {
        id: "engines",
        label: "Marketing Engines",
        helper: "Launch systems",
        icon: Rocket,
        breadcrumb: "Home > Workspace",
        title: "Marketing Engines",
        description:
            "Monitor build status, launch readiness, and approval momentum for every engine in the workspace.",
        eyebrow: "Workspace Operating Layer",
    },
    {
        id: "performance",
        label: "Live Performance",
        helper: "Builder Stats",
        icon: BarChart3,
        breadcrumb: "Home > Live data",
        title: "Live Performance",
        description:
            "Track Builder-connected revenue, contacts, appointments, and funnel velocity in one telemetry view.",
        eyebrow: "Realtime Telemetry Layer",
    },
    {
        id: "daily-leads",
        label: "Daily Leads",
        helper: "Social Studio",
        icon: ImagePlus,
        breadcrumb: "Home > Daily growth",
        title: "Daily Leads",
        description:
            "Generate social creative from vault strategy while keeping the current production-ready Daily Leads workflow intact.",
        eyebrow: "Organic Growth Engine",
    },
    {
        id: "vault-review",
        label: "Vault Review",
        helper: "Approval Flow",
        icon: ShieldCheck,
        breadcrumb: "Home > Approval flow",
        title: "Vault Review",
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
                <p className={cn(GeistSans.className, "text-[9px] font-semibold uppercase tracking-[0.16em] text-[#76767d]")}>
                    {label}
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.06] bg-[#0d0e0f]">
                    <Icon className={cn("h-3.5 w-3.5", accent)} />
                </div>
            </div>
            <p className={cn(displayFontClass, "mt-2.5 text-[24px] font-semibold leading-none tracking-[-0.03em] sm:text-[28px]", accent)}>
                {displayValue}
            </p>
            <p className={cn(GeistSans.className, "mt-2 text-[13px] leading-5 text-[#8b8b93]")}>{helper}</p>
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

function TableBadge({ label, tone = "cyan" }) {
    const tones = {
        cyan: "border-cyan/30 bg-cyan/10 text-cyan",
        green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        gray: "border-white/12 bg-white/[0.03] text-[#8b8b93]",
    };

    return (
        <span
            className={cn(
                GeistSans.className,
                "inline-flex items-center rounded-[8px] border px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] leading-none",
                tones[tone] || tones.gray
            )}
        >
            {label}
        </span>
    );
}

function getEngineRowState(business) {
    const approvedCount = business.approved_count || 0;
    const setupCount = business.completed_steps_count || 0;
    const fullyApproved = approvedCount >= TOTAL_APPROVAL_SECTIONS;

    const vault = business.vault_generated
        ? { label: approvedCount > 0 ? "Approved" : "Generated", tone: approvedCount > 0 ? "cyan" : "gray" }
        : { label: setupCount > 0 ? "Building" : "Queued", tone: setupCount > 0 ? "amber" : "gray" };

    const pages = business.deployed_at
        ? { label: "Live", tone: "green" }
        : business.vault_generated
          ? { label: fullyApproved ? "Ready" : "Review", tone: fullyApproved ? "green" : "amber" }
          : { label: "Draft", tone: "gray" };

    const launch = business.deployed_at
        ? { label: "Running", tone: "green" }
        : fullyApproved
          ? { label: "Ready", tone: "cyan" }
          : business.vault_generated
            ? { label: "Waiting", tone: "amber" }
            : { label: "Setup", tone: "gray" };

    return { vault, pages, launch };
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const editInputRef = useRef(null);
    const sidebarPreferenceLoadedRef = useRef(false);

    const loadUserData = useCallback(async () => {
        try {
            const profileRes = await fetchWithAuth("/api/user/profile");
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setMaxFunnels(profileData.max_funnels || TIER_LIMITS[profileData.subscription_tier] || 1);
                setCanManageTeam(["growth", "scale"].includes(profileData.subscription_tier) || isAdmin);
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
            <div
                className={cn(
                    "relative flex h-[72px] items-center border-b border-white/[0.06]",
                    collapsed ? "justify-between px-3" : "justify-between px-5"
                )}
            >
                <Link
                    href="/"
                    className={cn(
                        "flex items-center",
                        mobile || !collapsed ? "flex-1 justify-start" : "flex-1 justify-center"
                    )}
                >
                    <Image
                        src="/tedos-logo.png"
                        alt="TedOS"
                        width={mobile || !collapsed ? 154 : 48}
                        height={40}
                        className={cn(
                            "w-auto object-contain transition-all duration-200",
                            mobile || !collapsed ? "h-10" : "h-8"
                        )}
                        priority
                    />
                </Link>

                {mobile ? (
                    <button
                        type="button"
                        onClick={() => setIsMobileNavOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] transition-colors hover:text-white"
                        aria-label="Close navigation"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed((current) => !current)}
                        className="hidden h-9 w-9 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] transition-colors hover:text-white lg:flex"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                    </button>
                )}
            </div>

            <div
                className={cn(
                    "flex h-full flex-col pt-3.5",
                    collapsed ? "px-2.5 pb-4" : "px-3 pb-5"
                )}
            >
                {!collapsed && (
                    <div className="px-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7d7d84]">
                            Navigation
                        </p>
                    </div>
                )}

                <nav className={cn("mt-3 space-y-2", collapsed && "flex flex-col items-center")}>
                    {DASHBOARD_TABS.map((tab) => (
                        <SidebarNavButton
                            key={tab.id}
                            active={activeTab === tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            helper={tab.helper}
                            collapsed={collapsed}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (mobile) {
                                    setIsMobileNavOpen(false);
                                }
                            }}
                        />
                    ))}

                    <SidebarNavButton
                        active={false}
                        icon={HelpCircle}
                        label="Help & Support"
                        helper="Guide & docs"
                        href="/guide"
                        collapsed={collapsed}
                    />
                </nav>

                <div className={cn("mt-auto border-t border-white/[0.07] pt-5", collapsed ? "px-0" : "px-2")}>
                    {collapsed ? (
                        <div className="space-y-2.5">
                            <div className="flex justify-center">
                                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-[14px] border border-white/[0.08] bg-[#111214]">
                                    <span className={cn(displayFontClass, "text-sm font-semibold text-white")}>
                                        {businesses.length}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.12em] text-[#7d7d84]">
                                        / {maxFunnels}
                                    </span>
                                </div>
                            </div>

                            {(hasDeployedFunnel || builderLocationId) ? (
                                <a
                                    href={builderUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-10 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111214] text-cyan transition-colors hover:text-white"
                                    title="Open Builder"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            ) : (
                                <Link
                                    href="/guide"
                                    className="flex h-10 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111214] text-cyan transition-colors hover:text-white"
                                    title="Open Guide"
                                >
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7d7d84]">
                                Workspace
                            </p>
                            <h3 className={cn(displayFontClass, "mt-2.5 truncate text-[16px] font-semibold tracking-[-0.02em] text-white")}>
                                {workspaceDisplayName}
                            </h3>
                            <p className="mt-1 truncate text-[12px] text-[#8b8b93]">
                                {workspaceContextLabel}
                            </p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#64656c]">
                                {workspaceAccessLabel}
                            </p>

                            <div className="mt-3.5 rounded-[16px] border border-white/[0.07] bg-[#111214] p-3.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7d7d84]">
                                            Active engines
                                        </p>
                                        <p className={cn(displayFontClass, "mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-white")}>
                                            {businesses.length}
                                            <span className="ml-1 text-xs text-[#7d7d84]">/ {maxFunnels}</span>
                                        </p>
                                    </div>

                                    {(hasDeployedFunnel || builderLocationId) ? (
                                        <a
                                            href={builderUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-white/[0.07] bg-[#0d0e0f] px-3 text-[12px] font-medium text-cyan transition-colors hover:text-white"
                                        >
                                            Builder
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    ) : (
                                        <Link
                                            href="/guide"
                                            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-white/[0.07] bg-[#0d0e0f] px-3 text-[12px] font-medium text-cyan transition-colors hover:text-white"
                                        >
                                            Guide
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const renderMarketingEngines = () => {
        return (
            <div className="space-y-4">
                <div className="grid gap-3 xl:grid-cols-4">
                    <DashboardStatCard
                        label="Engines live"
                        value={engineInsights.live}
                        helper="Active marketing engines across this workspace."
                        icon={Rocket}
                        accent="text-cyan"
                    />
                    <DashboardStatCard
                        label="Awaiting review"
                        value={engineInsights.awaitingReviewCount}
                        helper="Vault-generated engines still moving through approvals."
                        icon={Clock3}
                        accent="text-amber-300"
                    />
                    <DashboardStatCard
                        label="Pages ready"
                        value={engineInsights.pagesReady}
                        helper="Funnels with Vault output generated and ready for asset work."
                        icon={CheckCircle2}
                        accent="text-blue-200"
                    />
                    <DashboardStatCard
                        label="Builder sync"
                        value={engineInsights.builderSync}
                        helper="Funnels already live or fully approved for Builder prep."
                        icon={ArrowUpRight}
                        accent="text-emerald-300"
                    />
                </div>

                <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <section className="rounded-[20px] border border-white/[0.07] bg-[#111214] p-4 sm:p-5">
                        <div className="flex flex-col gap-3.5 border-b border-white/[0.06] pb-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-[3px] rounded-[2px] bg-cyan" />
                                    <h3 className={cn(displayFontClass, "text-[20px] font-semibold tracking-[-0.03em] text-white")}>
                                        Your marketing engines
                                    </h3>
                                </div>
                                <p className={cn(GeistSans.className, "mt-2.5 max-w-2xl text-[13px] leading-5 text-[#8b8b93]")}>
                                    Each engine now sits in a simple table so owners can compare review
                                    status, page readiness, and launch state without opening a technical
                                    view.
                                </p>
                            </div>

                            <div className="flex flex-col items-start gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(true)}
                                    disabled={!canCreateMore}
                                    className={cn(
                                        displayFontClass,
                                        "inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] px-3.5 text-[13px] font-medium transition",
                                        canCreateMore
                                            ? "bg-cyan text-[#001418] hover:brightness-105"
                                            : "cursor-not-allowed border border-white/[0.07] bg-[#111213] text-[#7d7d84]"
                                    )}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Create engine
                                </button>
                                {!canCreateMore ? (
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d7d84]">
                                        All available engine slots are active.
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#121315]">
                            <div className="hidden grid-cols-[minmax(0,1.4fr)_112px_112px_112px_196px] border-b border-white/[0.08] bg-[#1b1b1d] md:grid">
                                {["Engine", "Vault", "Pages", "Launch", "Actions"].map((label) => (
                                    <div key={label} className="px-3 py-3">
                                        <p className={cn(GeistSans.className, "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7d7d84]")}>
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {businesses.map((business, index) => {
                                const rowState = getEngineRowState(business);
                                const progress = getProgressPercentage(business);

                                return (
                                    <div key={business.id} className={cn("border-white/[0.07] bg-[#121214]", index < businesses.length - 1 && "border-b")}>
                                        <div className="grid gap-3 px-3.5 py-3 md:grid-cols-[minmax(0,1.4fr)_112px_112px_112px_196px] md:items-center md:gap-0">
                                            <div className="min-w-0 px-0 md:px-3">
                                                {editingFunnelId === business.id ? (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <input ref={editInputRef} type="text" value={editNameValue} onChange={(event) => setEditNameValue(event.target.value)} onKeyDown={(event) => {
                                                            if (event.key === "Enter") handleRenameBusiness(business.id);
                                                            if (event.key === "Escape") cancelEditing();
                                                        }} disabled={isSavingName} className={cn(GeistSans.className, "w-full max-w-sm rounded-[12px] border border-cyan/30 bg-black/20 px-3 py-2 text-[15px] font-medium text-white outline-none transition focus:border-cyan/60 focus:ring-2 focus:ring-cyan/40")} />
                                                        <button type="button" onClick={() => handleRenameBusiness(business.id)} disabled={isSavingName} className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                                                            {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        </button>
                                                        <button type="button" onClick={cancelEditing} disabled={isSavingName} className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.03] text-[#8b8b93]">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn(GeistSans.className, "truncate text-[14px] font-medium text-[#f0f0f2]")}>{business.funnel_name}</p>
                                                        <button type="button" onClick={() => startEditing(business)} className="text-[#8b8b93] transition-colors hover:text-cyan">
                                                            <Pencil className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="mt-1.5 flex items-center gap-2.5">
                                                    <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-white/[0.08]">
                                                        <div className="h-full rounded-full bg-cyan" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className={cn(GeistSans.className, "text-[10px] font-medium uppercase tracking-[0.1em] text-[#8b8b93]")}>{progress}%</span>
                                                </div>
                                            </div>

                                            <div className="px-0 md:px-3"><TableBadge {...rowState.vault} /></div>
                                            <div className="px-0 md:px-3"><TableBadge {...rowState.pages} /></div>
                                            <div className="px-0 md:px-3"><TableBadge {...rowState.launch} /></div>

                                            <div className="flex flex-wrap items-center gap-1.5 px-0 md:justify-end md:px-3">
                                                <button type="button" onClick={() => router.push(`/vault?funnel_id=${business.id}`)} className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-black/20 text-[#f0f0f2] transition-colors hover:border-cyan/20 hover:text-cyan" title="Open Vault">
                                                    <FolderOpen className="h-3.5 w-3.5" />
                                                </button>
                                                {business.deployed_at ? (
                                                    <a href={builderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 transition-colors hover:bg-emerald-500/16" title="Open Builder">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                ) : (
                                                    <button type="button" onClick={() => router.push(`/intake_form?funnel_id=${business.id}`)} className="inline-flex h-8 items-center rounded-[10px] bg-cyan px-3 text-[12px] font-medium text-[#001418] transition-colors hover:brightness-105">
                                                        Continue
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => handleDeleteBusiness(business.id, business.funnel_name)} disabled={isDeleting === business.id} className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.03] text-[#8b8b93] transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50" title="Delete Engine">
                                                    {isDeleting === business.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <div className="space-y-3.5">
                        <section className="rounded-[20px] border border-white/[0.07] bg-[#111214] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-[3px] rounded-[2px] bg-cyan" />
                                    <h3 className={cn(displayFontClass, "text-[18px] font-semibold tracking-[-0.03em] text-white")}>
                                        Review queue
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("vault-review")}
                                    className={cn(GeistSans.className, "rounded-[10px] border border-white/[0.07] bg-[#101112] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#d9d9df] transition-colors hover:border-cyan/20 hover:text-cyan")}
                                >
                                    Open desk
                                </button>
                            </div>
                            <p className={cn(GeistSans.className, "mt-2.5 text-[13px] leading-5 text-[#8b8b93]")}>
                                The next approvals that are holding up launch right now.
                            </p>

                            <div className="mt-5 space-y-3">
                                {engineInsights.awaitingReview.length === 0 ? (
                                    <div className={cn(GeistSans.className, "rounded-[14px] border border-emerald-500/20 bg-[#17181a] p-4 text-sm text-emerald-200")}>
                                        No approval blockers right now.
                                    </div>
                                ) : (
                                    engineInsights.awaitingReview.slice(0, 3).map((business) => (
                                        <div key={business.id} className="rounded-[12px] border border-white/[0.07] border-l-[3px] border-l-cyan bg-[#17181a] p-3.5">
                                            <p className={cn(GeistSans.className, "text-[14px] font-medium leading-[1.55] text-[#f0f0f2]")}>
                                                {business.funnel_name}
                                                <br />
                                                <span className="text-[#8b8b93]">
                                                    {TOTAL_APPROVAL_SECTIONS - (business.approved_count || 0)} sections still need review before launch can proceed.
                                                </span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/vault?funnel_id=${business.id}`)}
                                                className={cn(GeistSans.className, "mt-2.5 text-[13px] font-medium text-cyan transition-colors hover:text-white")}
                                            >
                                                Review in Vault
                                                <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="rounded-[20px] border border-white/[0.07] bg-[#111214] p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-[3px] rounded-[2px] bg-cyan" />
                                <h3 className={cn(displayFontClass, "text-[18px] font-semibold tracking-[-0.03em] text-white")}>
                                    Builder readiness
                                </h3>
                            </div>
                            <p className={cn(GeistSans.className, "mt-2.5 text-[13px] leading-5 text-[#8b8b93]")}>
                                Engines that are already live or have enough approved output to move into Builder prep.
                            </p>

                            <div className="mt-5 space-y-3">
                                {engineInsights.builderReady.length === 0 ? (
                                    <div className={cn(GeistSans.className, "rounded-[14px] border border-white/[0.07] bg-[#17181a] p-4 text-sm text-[#8b8b93]")}>
                                        Nothing is Builder-ready yet.
                                    </div>
                                ) : (
                                    engineInsights.builderReady.slice(0, 4).map((business) => (
                                        <div key={business.id} className="rounded-[12px] border border-cyan/20 bg-[#17181a] p-3.5">
                                            <p className={cn(GeistSans.className, "text-[14px] font-medium text-cyan")}>
                                                {business.funnel_name}
                                            </p>
                                            <p className={cn(GeistSans.className, "mt-1 text-[13px] leading-5 text-[#8b8b93]")}>
                                                {business.deployed_at ? "Already live in Builder." : "Approved output is aligned for Builder handoff."}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {(hasDeployedFunnel || builderLocationId) && (
                                <a
                                    href={builderUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(displayFontClass, "mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] border border-white/[0.07] bg-[#101112] px-3.5 text-[13px] font-medium text-[#f0f0f2] transition-colors hover:border-cyan/20 hover:text-cyan")}
                                >
                                    Open Builder
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            )}
                        </section>
                    </div>
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
                    <aside
                        className={cn(
                            "hidden shrink-0 border-r border-white/[0.07] transition-[width] duration-300 lg:flex",
                            isSidebarCollapsed ? "w-[92px]" : "w-[228px]"
                        )}
                    >
                        {renderSidebarContent({ collapsed: isSidebarCollapsed })}
                    </aside>

                    <main className="min-w-0 flex-1">
                        <header className="border-b border-white/[0.06] px-4 py-4 sm:px-5 lg:px-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="flex items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsMobileNavOpen(true)}
                                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] transition-colors hover:text-white lg:hidden"
                                        aria-label="Open navigation"
                                    >
                                        <Menu className="h-3.5 w-3.5" />
                                    </button>

                                    <div className="max-w-[640px]">
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7d7d84]">
                                            {activeTabMeta.eyebrow}
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[#8b8b93]">
                                            <span>Home</span>
                                            <ChevronRight className="h-3 w-3" />
                                            <span className="text-[#f0f0f2]">{activeTabMeta.helper}</span>
                                        </div>
                                        <h1 className={cn(displayFontClass, "mt-2.5 text-[24px] font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-[28px]")}>
                                            {activeTabMeta.title}
                                        </h1>
                                        <p className="mt-2.5 max-w-2xl text-[13px] leading-5 text-[#8b8b93] sm:text-[14px]">
                                            {activeTabMeta.description}
                                        </p>
                                        {!canCreateMore && activeTab === "engines" ? (
                                            <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-200/80">
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
                                            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-white/[0.07] bg-[#111213] px-3.5 text-[13px] font-medium text-[#d9d9df] transition-colors hover:border-cyan/20 hover:text-cyan"
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
                                            className={cn(displayFontClass, "inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-white/[0.07] bg-[#111213] px-3.5 text-[13px] font-medium text-[#f0f0f2] transition-colors hover:border-cyan/20 hover:text-cyan")}
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
                                            "inline-flex h-9 items-center gap-1.5 rounded-[12px] px-3.5 text-[13px] font-medium transition",
                                            canCreateMore
                                                ? "bg-cyan text-[#001418] hover:brightness-105"
                                                : "cursor-not-allowed border border-white/[0.07] bg-[#111213] text-[#7d7d84]"
                                        )}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Create engine
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("vault-review")}
                                        className="relative flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] transition-colors hover:border-cyan/20 hover:text-cyan"
                                        title="Alerts"
                                    >
                                        <Bell className="h-4 w-4" />
                                        {engineInsights.awaitingReviewCount > 0 && (
                                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan" />
                                        )}
                                    </button>

                                    <div className="rounded-[12px] border border-white/[0.07] bg-[#111213] p-0.5">
                                        <UserButton
                                            afterSignOutUrl="/auth/login"
                                            appearance={{
                                                elements: {
                                                    avatarBox: "h-8 w-8",
                                                },
                                            }}
                                        />
                                    </div>
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
                                        <LivePerformancePanel />
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
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan px-5 py-3.5 font-black text-black transition disabled:cursor-not-allowed disabled:opacity-50"
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
