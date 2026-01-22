"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Key, Loader2 } from "lucide-react";

export default function GHLAuthorize() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAuthorize = () => {
        setLoading(true);
        // Redirect to the authorize endpoint
        window.location.href = '/api/ghl/oauth/authorize';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#0f0f10] to-[#1a1a1c] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-2xl p-8 shadow-2xl">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan to-blue-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <Key className="w-8 h-8 text-black" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        Authorize GHL Access
                    </h1>
                    <p className="text-gray-400 text-center mb-8">
                        Grant TedOS permission to create and manage GHL user accounts with the latest scopes.
                    </p>

                    {/* Info */}
                    <div className="bg-[#0f0f10] border border-[#2a2a2d] rounded-lg p-4 mb-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
                            <span>Create GHL User accounts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
                            <span>Manage locations and contacts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
                            <span>Access company data</span>
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleAuthorize}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-cyan to-blue-500 text-black font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Redirecting...
                            </>
                        ) : (
                            <>
                                Authorize Now
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {/* Note */}
                    <p className="text-xs text-gray-500 text-center mt-6">
                        You'll be redirected to GHL to grant permissions. This will update your OAuth token with the required scopes.
                    </p>
                </div>
            </div>
        </div>
    );
}
