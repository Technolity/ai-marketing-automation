"use client";
import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef(null);
    const supabase = createClientComponentClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, [supabase]);

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
        try {
            await supabase.auth.signOut();
            toast.success("Signed out successfully");
            router.push("/auth/login");
        } catch (error) {
            toast.error("Failed to sign out");
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
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
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2d] transition-colors text-left"
                    >
                        <LogOut className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Sign Out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
