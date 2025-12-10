"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useAuth } from "@/contexts/AuthContext";

export default function AppNavbar() {
  const { isAdmin, loading } = useAuth();
  const pathname = usePathname();

  // Show minimal navbar while loading
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <span className="text-2xl font-bold tracking-tight flex items-center">
            <span className="text-cyan text-glow">Ted</span>
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">OS</span>
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight flex items-center group">
          <span className="text-cyan text-glow">Ted</span>
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">OS</span>
        </Link>

        <div className="flex gap-4 items-center">
          <SignedIn>
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            {/* Admin Link - Only visible if admin */}
            {isAdmin && (
              <Link
                href="/admin/overview"
                className="flex items-center gap-2 text-sm font-medium text-cyan hover:text-cyan/80 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            {/* Clerk User Button */}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-white hover:text-cyan transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
