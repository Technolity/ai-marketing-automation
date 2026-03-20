"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Copy, Check, ArrowRight, KeyRound, Mail } from "lucide-react";

const DEFAULT_PASSWORD = "TedOS@123!";

export default function WelcomePage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [copiedField, setCopiedField] = useState(null);

    // Redirect to dashboard if user is not new (already visited welcome)
    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.replace("/sign-in");
        }
    }, [isLoaded, user, router]);

    const copyToClipboard = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            // fallback — silently ignore
        }
    };

    const email = user?.primaryEmailAddress?.emailAddress || "";

    if (!isLoaded || !user) {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                {/* Success badge */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Account activated</span>
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        Welcome to TedOS
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Your account is ready. Here are your login credentials — save them now.
                    </p>
                </div>

                {/* Credentials card */}
                <div className="bg-[#111113] border border-[#2a2a2d] rounded-2xl overflow-hidden mb-4">

                    {/* Email row */}
                    <div className="px-5 py-4 border-b border-[#1f1f22]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-0.5">Email</p>
                                    <p className="text-sm font-medium text-white truncate">{email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(email, "email")}
                                className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Copy email"
                            >
                                {copiedField === "email"
                                    ? <Check className="w-4 h-4 text-green-400" />
                                    : <Copy className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    </div>

                    {/* Password row */}
                    <div className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <KeyRound className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-0.5">Temporary Password</p>
                                    <p className="text-sm font-mono font-medium text-white">{DEFAULT_PASSWORD}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(DEFAULT_PASSWORD, "password")}
                                className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Copy password"
                            >
                                {copiedField === "password"
                                    ? <Check className="w-4 h-4 text-green-400" />
                                    : <Copy className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* Warning note */}
                <p className="text-center text-xs text-gray-600 mb-6">
                    Change your password in account settings after signing in.
                </p>

                {/* CTA */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                </button>

            </div>
        </div>
    );
}
