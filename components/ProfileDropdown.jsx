"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();
    const { user, signOut } = useAuth();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setIsOpen(false);
        try {
            await signOut();
            toast.success("Signed out successfully");
            // Force a hard redirect to clear any cached state
            window.location.href = "/auth/login";
        } catch (error) {
            console.error("Sign out error:", error);
            toast.error("Failed to sign out");
            // Still try to redirect even on error
            window.location.href = "/auth/login";
        }
    };

    if (!user) return null;

    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#1b1b1d] transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-cyan flex items-center justify-center">
                    <User className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-medium hidden md:block">{displayName}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1b1b1d] rounded-xl border border-[#2a2a2d] shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-[#2a2a2d]">
                        <p className="text-sm font-medium text-white">{displayName}</p>
                        <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-600/20 hover:text-red-400 transition-colors text-left"
                    >
                        <LogOut className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Sign Out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
