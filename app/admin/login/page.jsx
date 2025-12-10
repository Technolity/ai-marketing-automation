// app/admin/login/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useSignIn, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Shield, KeyRound } from "lucide-react";

export default function AdminLogin() {
    const router = useRouter();
    const { isLoaded, signIn, setActive } = useSignIn();
    const { isSignedIn } = useAuth();
    const { user } = useUser();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

    // 2FA State
    const [needs2FA, setNeeds2FA] = useState(false);
    const [totpCode, setTotpCode] = useState("");

    // Check admin status when already signed in
    useEffect(() => {
        if (isSignedIn && user && !checking) {
            setChecking(true);
            verifyAdminStatus();
        }
    }, [isSignedIn, user]);

    const verifyAdminStatus = async () => {
        try {
            console.log("Checking admin status...");
            setChecking(true);

            const res = await fetch("/api/admin/verify");
            const data = await res.json();

            console.log("Admin verify response:", data);

            if (data.isAdmin === true) {
                toast.success("Welcome back, Admin!");
                // Use direct navigation - don't let anything else redirect
                window.location.replace("/admin/overview");
                return; // Stop execution
            } else {
                console.log("Not admin, response:", data);
                toast.error("Access denied. You are not an admin.");
                setChecking(false);
            }
        } catch (error) {
            console.error("Admin check error:", error);
            toast.error("Error checking admin status");
            setChecking(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);

        try {
            const result = await signIn.create({
                identifier: email,
                password: password,
            });

            console.log("Sign in result:", result.status);

            if (result.status === "complete") {
                // Set session active first
                await setActive({ session: result.createdSessionId });

                // Small delay to ensure session is set
                await new Promise(resolve => setTimeout(resolve, 500));

                // Now verify admin
                await verifyAdminStatus();

            } else if (result.status === "needs_second_factor") {
                setNeeds2FA(true);
                toast.info("Enter your 2FA code");
            } else {
                console.log("Unexpected sign in status:", result.status, result);
                toast.error(`Login status: ${result.status}`);
            }
        } catch (error) {
            console.error("Login error:", error);
            const errorCode = error.errors?.[0]?.code;
            const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Login failed";

            if (errorCode === "form_password_incorrect") {
                toast.error("Incorrect password.");
            } else if (errorCode === "form_identifier_not_found") {
                toast.error("No account with this email.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handle2FAVerify = async (e) => {
        e.preventDefault();
        if (!isLoaded || !signIn) return;

        setLoading(true);

        try {
            const result = await signIn.attemptSecondFactor({
                strategy: "totp",
                code: totpCode,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                await new Promise(resolve => setTimeout(resolve, 500));
                await verifyAdminStatus();
            } else {
                console.log("2FA result:", result);
                toast.error("Verification incomplete");
            }
        } catch (error) {
            console.error("2FA error:", error);
            const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Invalid code";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Show checking state
    if (checking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b]">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                <p className="text-gray-400">Verifying admin access...</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
        );
    }

    // 2FA Code Entry Screen
    if (needs2FA) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0b] relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-md w-full bg-[#111113] border border-red-900/30 p-8 rounded-2xl relative z-10 shadow-2xl">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-red-600/10 border border-red-600/30 rounded-full flex items-center justify-center">
                            <KeyRound className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-2 text-center text-white">Two-Factor Authentication</h1>
                    <p className="text-gray-500 text-center mb-8">Enter the code from your authenticator app</p>

                    <form onSubmit={handle2FAVerify} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-[#0a0a0b] border border-gray-800 rounded-xl p-4 text-white text-center text-2xl tracking-[0.5em] focus:border-red-500 focus:outline-none transition-all"
                                placeholder="000000"
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || totpCode.length < 6}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 py-4 rounded-xl font-bold text-lg transition-all text-white"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                "Verify & Continue"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setNeeds2FA(false);
                                setTotpCode("");
                            }}
                            className="w-full text-gray-500 hover:text-gray-300 py-2 transition-colors"
                        >
                            ← Back to login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Main Login Form
    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0b] relative overflow-hidden">
            {/* Background Glows - Red theme for admin */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-md w-full bg-[#111113] border border-red-900/30 p-8 rounded-2xl relative z-10 shadow-2xl">
                {/* Admin Badge */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-full">
                        <Shield className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">Admin Portal</span>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-2 text-center text-white">TedOS Admin</h1>
                <p className="text-gray-500 text-center mb-8">Authorized personnel only</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Admin Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#0a0a0b] border border-gray-800 rounded-xl p-4 text-white focus:border-red-500 focus:outline-none transition-all"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0a0a0b] border border-gray-800 rounded-xl p-4 pr-12 text-white focus:border-red-500 focus:outline-none transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 py-4 rounded-xl font-bold text-lg transition-all text-white"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Authenticating...
                            </span>
                        ) : (
                            "Access Admin Panel"
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600 text-sm">
                    Not an admin?{" "}
                    <a href="/auth/login" className="text-gray-400 hover:text-white transition-colors">
                        User Login →
                    </a>
                </p>
            </div>
        </div>
    );
}
