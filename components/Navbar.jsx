"use client";
import ProfileDropdown from "./ProfileDropdown";

export default function Navbar() {
    return (
        <div className="h-16 border-b border-[#1b1b1d] bg-[#0e0e0f] flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-white">S</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-white">Scalez Media</span>
            </div>

            <div className="flex items-center gap-4">
                <ProfileDropdown />
            </div>
        </div>
    );
}
