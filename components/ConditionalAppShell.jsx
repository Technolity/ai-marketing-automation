"use client";
import { usePathname } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import MainLayout from "@/components/MainLayout";

/**
 * Renders the full app shell (AppNavbar + AnnouncementBanner + MainLayout)
 * for every route EXCEPT "/" which has its own LandingNav inside page.jsx.
 */
export default function ConditionalAppShell({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <>
      <AppNavbar />
      <AnnouncementBanner />
      <MainLayout>
        {children}
      </MainLayout>
    </>
  );
}
