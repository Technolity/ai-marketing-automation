"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");

    // Check if already logged in as admin on mount
    useEffect(() => {
        let mounted = true;

        const checkAdminSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!mounted) return;

                if (user) {
                    // Check if user is admin
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('is_admin')
                        .eq('id', user.id)
                        .single();

                    if (profile?.is_admin) {
                        // Already logged in as admin
                        router.push("/admin/overview");
                    } else {
                        // Logged in but NOT admin - sign them out so they can use proper login
                        await supabase.auth.signOut();
                        setChecking(false);
                    }
                } else {
                    setChecking(false);
                }
            } catch (error) {
                console.error("Session check error:", error);
                if (mounted) setChecking(false);
            }
        };

        checkAdminSession();

        return () => {
            mounted = false;
        };
    }, [supabase, router]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Sign in with credentials
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;

            // Check if user profile exists and is admin
            let { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('id', data.user.id)
                .single();

            // If profile doesn't exist, create it (non-admin by default)
            if (profileError) {
                const { data: newProfile, error: insertError } = await supabase
                    .from('user_profiles')
                    .upsert({
                        id: data.user.id,
                        email: data.user.email,
                        is_admin: false,
                        subscription_tier: 'basic'
                    }, { onConflict: 'id' })
                    .select('is_admin')
                    .single();

                if (insertError) {
                    await supabase.auth.signOut();
                    setError(`Database error: ${insertError.message}`);
                    setLoading(false);
                    return;
                }

                profile = newProfile;
            }

            if (!profile?.is_admin) {
                // Not an admin - sign out and show error
                await supabase.auth.signOut();
                setError("Access denied. This portal is for administrators only. Use the regular login for user accounts.");
                setLoading(false);
                return;
            }

            // Success - user is admin
            toast.success("Welcome, Administrator!");
            // Use hard redirect to ensure clean state
            window.location.href = "/admin/overview";

        } catch (error) {
            console.error("Admin login error:", error);
            setError(error.message || "Login failed. Please try again.");
            setLoading(false);
        }
    };

    // Show loading while checking session
    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0b] relative overflow-hidden">
            {/* Background Effects - Cyan/Ice theme */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/15 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full relative z-10"
            >
                {/* Admin Badge */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3 px-4 py-2 bg-cyan/10 border border-cyan/30 rounded-full shadow-lg shadow-cyan/10">
                        <Shield className="w-5 h-5 text-cyan" />
                        <span className="text-cyan text-sm font-medium">Admin Portal</span>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-[#131314] border border-[#2a2a2d] rounded-2xl p-8 shadow-2xl shadow-cyan/5">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="text-cyan text-glow">Ted</span>
                            <span className="text-white">OS</span>
                            <span className="text-cyan/80 ml-2">Admin</span>
                        </h1>
                        <p className="text-gray-400">Sign in to access the admin dashboard</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
                        >
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleAdminLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl p-4 text-white focus:border-cyan focus:outline-none transition-all focus:shadow-lg focus:shadow-cyan/10"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl p-4 pr-12 text-white focus:border-cyan focus:outline-none transition-all focus:shadow-lg focus:shadow-cyan/10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg transition-all text-black shadow-lg shadow-cyan/30"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                "Access Admin Panel"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-[#2a2a2d] text-center">
                        <p className="text-gray-500 text-sm">
                            Not an admin?{" "}
                            <a href="/auth/login" className="text-cyan hover:underline">
                                User Login
                            </a>
                        </p>
                    </div>
                </div>

                {/* Security Notice */}
                <p className="text-center text-gray-600 text-xs mt-6">
                    🔒 This portal is monitored. Unauthorized access attempts are logged.
                </p>
            </motion.div>
        </div>
    );
}
