"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";

export default function AppNavbar() {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin');

  // Determine logo link based on user state
  const logoHref = user ? "/dashboard" : "/";

  // Show minimal navbar while loading
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <span className="text-2xl font-bold tracking-tight flex items-center">
            <span className="text-cyan text-glow">Ted</span>
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">OS</span>
          </span>
          <div className="w-20 h-10" /> {/* Placeholder for layout */}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        {/* Logo - redirects to dashboard if logged in, otherwise home */}
        <Link href={logoHref} className="text-2xl font-bold tracking-tight flex items-center group">
          <span className="text-cyan text-glow">Ted</span>
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">OS</span>
        </Link>
        <div className="flex gap-8 items-center">
          {/* Dashboard link - Only visible when logged in AND NOT on admin pages */}
          {user && !isAdminPage && (
            <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
          )}
          {/* Admin Link - Only visible to admins */}
          {isAdmin && (
            <Link
              href="/admin/overview"
              className="flex items-center gap-2 text-sm font-medium text-cyan hover:text-cyan/80 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
          {user ? (
            <ProfileDropdown />
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-bold bg-cyan/10 hover:bg-cyan/20 text-cyan px-6 py-2.5 rounded-full transition-all border border-cyan/30 hover:shadow-glow-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
