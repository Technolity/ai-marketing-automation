// app/auth/forgot-password/page.jsx
"use client";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPassword() {
    const router = useRouter();
    const { isLoaded, signIn } = useSignIn();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState("email"); // "email" | "code" | "success"

    // Step 1: Request password reset code
    const handleRequestCode = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });

            toast.success("Reset code sent to your email!");
            setStep("code");
        } catch (error) {
            console.error("Reset request error:", error);
            const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Failed to send reset code";

            if (error.errors?.[0]?.code === "form_identifier_not_found") {
                toast.error("No account found with this email.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify code and set new password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: code,
                password: newPassword,
            });

            if (result.status === "complete") {
                toast.success("Password reset successfully!");
                setStep("success");

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push("/auth/login");
                }, 2000);
            } else {
                console.log("Reset result:", result);
                toast.error("Password reset incomplete. Please try again.");
            }
        } catch (error) {
            console.error("Reset error:", error);
            const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Failed to reset password";

            if (error.errors?.[0]?.code === "form_code_incorrect") {
                toast.error("Invalid verification code. Please check and try again.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend code
    const handleResendCode = async () => {
        if (!isLoaded) return;
        setLoading(true);

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });
            toast.success("New code sent to your email!");
        } catch (error) {
            toast.error("Failed to resend code");
        } finally {
            setLoading(false);
        }
    };

    // Show loading while Clerk initializes
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Success step
    if (step === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-dark relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-2 text-cyan text-glow">Password Reset!</h1>
                    <p className="text-gray-400 mb-6">
                        Your password has been reset successfully.
                        <br />Redirecting to login...
                    </p>

                    <Link
                        href="/auth/login"
                        className="text-cyan hover:underline"
                    >
                        Go to login now
                    </Link>
                </div>
            </div>
        );
    }

    // Code verification step
    if (step === "code") {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-dark relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center">
                            <KeyRound className="w-8 h-8 text-cyan" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-2 text-center text-cyan text-glow">Reset Password</h1>
                    <p className="text-center text-gray-400 mb-6">
                        Enter the code sent to<br />
                        <span className="text-white font-medium">{email}</span>
                    </p>

                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Verification Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 text-center text-2xl tracking-widest focus:border-cyan focus:outline-none transition-all"
                                placeholder="000000"
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 focus:border-cyan focus:outline-none transition-all"
                                placeholder="At least 8 characters"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 focus:border-cyan focus:outline-none transition-all"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length < 6}
                            className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all text-black"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Resetting...
                                </span>
                            ) : (
                                "Reset Password"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleResendCode}
                            disabled={loading}
                            className="text-cyan hover:underline disabled:opacity-50"
                        >
                            Resend code
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setStep("email");
                            setCode("");
                            setNewPassword("");
                            setConfirmPassword("");
                        }}
                        className="mt-4 w-full text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>
        );
    }

    // Email input step (default)
    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-dark relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-cyan" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-2 text-center text-cyan text-glow">Forgot Password?</h1>
                <p className="text-center text-gray-400 mb-8">
                    Enter your email and we'll send you a code to reset your password.
                </p>

                <form onSubmit={handleRequestCode} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 focus:border-cyan focus:outline-none transition-all input-glow"
                            placeholder="you@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all text-black"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sending...
                            </span>
                        ) : (
                            "Send Reset Code"
                        )}
                    </button>
                </form>

                <Link
                    href="/auth/login"
                    className="mt-6 w-full text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
            </div>
        </div>
    );
}
