"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import GHLCredentialsForm from "@/components/GHLCredentialsForm";

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <SettingsIcon className="w-8 h-8 text-cyan" />
                            Settings
                        </h1>
                        <p className="text-gray-400">Manage your integrations and account preferences</p>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <div className="bg-[#161617] border border-white/5 rounded-2xl p-6 lg:p-8">
                        <GHLCredentialsForm
                            onCredentialsSaved={() => {
                                // Optional: Refresh data or show specific success state
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
