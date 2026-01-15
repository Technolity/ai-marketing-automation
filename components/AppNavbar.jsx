"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useAuth } from "@/contexts/AuthContext";

export default function AppNavbar() {
  const { isAdmin, loading } = useAuth();
  const pathname = usePathname();

  if (pathname === "/dashboard") return null;

  // Show minimal navbar while loading
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-white/5 bg-dark/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
          <span className="flex items-center">
            <img src="/tedos-logo.png" alt="TedOS" className="h-12 w-auto object-contain" />
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-white/5 bg-[#0e0e0f]/60 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight flex items-center group">
          <img src="/tedos-logo.png" alt="TedOS" className="h-12 w-auto object-contain" />
        </Link>

        <div className="flex gap-4 items-center">
          <SignedIn>
            {/* Dashboard Link */}
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className="text-sm font-bold text-gray-400 hover:text-white transition-all duration-300"
            >
              <span>Dashboard</span>
            </Link>

            {/* Admin Link - Only visible if admin */}
            {isAdmin && (
              <Link
                href="/admin/overview"
                className="flex items-center gap-2 text-sm font-bold text-cyan hover:text-white transition-all duration-300 px-3 py-1.5 rounded-full bg-cyan/5 border border-cyan/10 hover:border-cyan/30"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {/* Clerk User Button */}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <Link href="/auth/signup">
              <button className="text-sm font-bold text-white hover:text-cyan transition-all duration-300 px-5 py-2 rounded-full border border-white/10 hover:border-cyan/50 bg-white/5">
                Get Started
              </button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
