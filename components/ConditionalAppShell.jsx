"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";

const SIDEBAR_STORAGE_KEY = "tedos-sidebar-collapsed";

// Exact routes with no shell
const NO_SHELL_EXACT = ["/", "/introduction"];
// Prefix-based routes with no shell
const NO_SHELL_PREFIXES = ["/dashboard", "/auth", "/admin"];

export default function ConditionalAppShell({ children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) setIsCollapsed(stored === "true");
    } catch {}

    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    if (isDesktop) setIsMobileOpen(false);
  }, [isDesktop]);

  const handleToggle = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  // No shell for these routes
  const noShell =
    NO_SHELL_EXACT.includes(pathname) ||
    NO_SHELL_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (noShell) return <>{children}</>;

  const sidebarWidth = mounted && isCollapsed ? 72 : 228;
  const contentMarginLeft = isDesktop && mounted ? sidebarWidth : 0;

  return (
    <>
      <AppSidebar
        isCollapsed={mounted ? isCollapsed : false}
        onToggle={handleToggle}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div
        className="min-h-screen font-poppins transition-[margin-left] duration-300"
        style={{ marginLeft: `${contentMarginLeft}px` }}
      >
        {/* Mobile top bar — hamburger + logo, hidden on desktop */}
        <div className="lg:hidden flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#0e0e0f] px-4 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] hover:text-white transition-colors flex-shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Image
            src="/tedos-logo.png"
            alt="TedOS"
            width={100}
            height={28}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>

        <AnnouncementBanner />
        {children}
      </div>
    </>
  );
}
