"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Shield, PanelLeftClose, PanelLeftOpen, LayoutDashboard, X } from "lucide-react";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import PlanBadge from "@/components/PlanBadge";
import { motion, AnimatePresence } from "framer-motion";

function NavItem({ href, icon: Icon, label, collapsed, active, isAdmin: adminStyle, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-[12px] border transition-all font-poppins",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
        active
          ? "border-white/[0.08] bg-[#14181a] text-white"
          : "border-transparent text-[#8b8b93] hover:border-white/[0.07] hover:bg-white/[0.03] hover:text-white"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border transition-colors",
        active
          ? adminStyle
            ? "border-cyan/20 bg-cyan/10 text-cyan"
            : "border-white/[0.10] bg-[#1a1e20] text-white"
          : "border-white/[0.07] bg-[#111213] text-[#8b8b93] group-hover:text-white"
      )}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
      </div>
      {!collapsed && (
        <span className={cn("text-[13px] truncate", active ? "font-semibold text-white" : "font-medium")}>
          {label}
        </span>
      )}
    </Link>
  );
}

function SidebarBody({ collapsed, onToggle, onClose, isAdmin, loading, pathname, workspaceDisplayName, workspaceAccessLabel, onLinkClick }) {
  return (
    <>
      {/* Header */}
      <div className={cn(
        "relative flex h-[72px] items-center border-b border-white/[0.06] flex-shrink-0",
        collapsed ? "justify-center px-3" : "justify-between px-5"
      )}>
        <Link href="/" onClick={onLinkClick} className="flex items-center justify-start overflow-hidden">
          <Image
            src="/tedos-logo.png"
            alt="TedOS"
            width={150}
            height={40}
            className="h-10 w-auto object-contain flex-shrink-0"
            priority
          />
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] hover:text-white transition-colors flex-shrink-0"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Desktop collapse toggle — protrudes on right border */}
        {!onClose && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "absolute right-0 top-[36px] -translate-y-1/2 translate-x-1/2 z-50",
              "h-7 w-7 flex items-center justify-center rounded-full",
              "border border-white/[0.12] bg-[#111213]",
              "text-[#8b8b93] hover:text-white transition-colors",
              "shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 min-h-0 overflow-y-auto pt-4 space-y-1", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="px-2 mb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7d7d84] font-poppins">
            Navigation
          </p>
        )}
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} active={pathname === "/dashboard"} onClick={onLinkClick} />
        <NavItem href="/guide" icon={BookOpen} label="Guide" collapsed={collapsed} active={pathname.startsWith("/guide")} onClick={onLinkClick} />
        <NavItem href="/team" icon={Users} label="Team" collapsed={collapsed} active={pathname.startsWith("/team")} onClick={onLinkClick} />
        {!loading && isAdmin && (
          <NavItem href="/admin/overview" icon={Shield} label="Admin" collapsed={collapsed} active={pathname.startsWith("/admin")} isAdmin onClick={onLinkClick} />
        )}
      </nav>

      {/* Bottom */}
      <div className={cn(
        "border-t border-white/[0.06] flex-shrink-0",
        collapsed ? "p-3 flex flex-col items-center gap-3" : "p-4 flex flex-col gap-3"
      )}>
        <SignedIn>
          {!collapsed && (
            <div className="w-full">
              <PlanBadge />
            </div>
          )}
          <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center" : "")}>
            <UserButton afterSignOutUrl="/" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white truncate leading-tight">{workspaceDisplayName}</p>
                <p className="text-[10px] text-[#8b8b93] truncate mt-0.5">{workspaceAccessLabel}</p>
              </div>
            )}
          </div>
        </SignedIn>
      </div>
    </>
  );
}

export default function AppSidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { isAdmin, loading, isTeamMember, workspaceName } = useAuth();
  const currentUserName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Owner';
  const workspaceDisplayName = isTeamMember ? workspaceName || 'Shared workspace' : `${currentUserName}'s workspace`;
  const workspaceAccessLabel = isTeamMember ? 'Team access' : 'Owner';

  const sharedProps = { isAdmin, loading, pathname, workspaceDisplayName, workspaceAccessLabel };

  return (
    <>
      {/* Desktop sidebar: hidden on mobile, fixed on lg+ */}
      <aside
        className={cn(
          "hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-40 lg:flex lg:flex-col",
          "bg-[#0e0e0f] border-r border-white/[0.07]",
          "transition-[width] duration-300",
          isCollapsed ? "w-[72px]" : "w-[228px]"
        )}
      >
        <SidebarBody {...sharedProps} collapsed={isCollapsed} onToggle={onToggle} />
      </aside>

      {/* Mobile drawer: overlay, hidden on desktop */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-0 top-0 h-screen w-[280px] z-50 flex flex-col bg-[#0e0e0f] border-r border-white/[0.07] lg:hidden"
            >
              <SidebarBody {...sharedProps} collapsed={false} onClose={onMobileClose} onLinkClick={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
