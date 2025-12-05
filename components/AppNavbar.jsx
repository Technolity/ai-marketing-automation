"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ProfileDropdown from "./ProfileDropdown";

export default function AppNavbar() {
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold tracking-tight flex items-center group">
          <span className="text-cyan text-glow">Ted</span>
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">OS</span>
        </a>
        <div className="flex gap-8 items-center">
          {user && (
            <a href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Dashboard
            </a>
          )}
          {user ? (
            <ProfileDropdown />
          ) : (
            <a
              href="/auth/login"
              className="text-sm font-bold bg-cyan/10 hover:bg-cyan/20 text-cyan px-6 py-2.5 rounded-full transition-all border border-cyan/30 hover:shadow-glow-sm"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
