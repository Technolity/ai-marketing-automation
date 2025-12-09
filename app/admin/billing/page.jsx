"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    Crown,
    Zap,
    Building2,
    Check,
    Star,
    Sparkles
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const TIERS = [
    {
        id: "premium",
        name: "Premium",
        price: "$97",
        period: "/month",
        description: "Perfect for growing businesses",
        icon: Zap,
        color: "cyan",
        popular: false,
        features: [
            "Up to 5 businesses",
            "100 content generations/month",
            "Email support",
            "Basic analytics",
            "Standard templates",
        ],
    },
    {
        id: "premium-plus",
        name: "Premium+",
        price: "$197",
        period: "/month",
        description: "For serious marketers",
        icon: Crown,
        color: "purple",
        popular: true,
        features: [
            "Up to 20 businesses",
            "Unlimited generations",
            "Priority support",
            "Advanced analytics",
            "Premium templates",
            "API access",
            "White-label options",
        ],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For large organizations",
        icon: Building2,
        color: "blue",
        popular: false,
        features: [
            "Unlimited businesses",
            "Unlimited generations",
            "Dedicated support",
            "Custom integrations",
            "Custom templates",
            "Full API access",
            "White-label",
            "SLA guarantee",
            "Training & onboarding",
        ],
    },
];

export default function AdminBilling() {
    const [activeTiers, setActiveTiers] = useState({
        premium: true,
        "premium-plus": true,
        enterprise: true,
    });

    const toggleTier = (tierId) => {
        setActiveTiers((prev) => ({
            ...prev,
            [tierId]: !prev[tierId],
        }));
    };

    const colorClasses = {
        cyan: {
            gradient: "from-cyan/20 to-blue-500/20",
            border: "border-cyan/50 hover:border-cyan",
            text: "text-cyan",
            bg: "bg-cyan",
            glow: "shadow-cyan/20",
        },
        purple: {
            gradient: "from-purple-500/20 to-pink-500/20",
            border: "border-purple-500/50 hover:border-purple-500",
            text: "text-purple-400",
            bg: "bg-purple-500",
            glow: "shadow-purple-500/20",
        },
        blue: {
            gradient: "from-blue-500/20 to-indigo-500/20",
            border: "border-blue-500/50 hover:border-blue-500",
            text: "text-blue-400",
            bg: "bg-blue-500",
            glow: "shadow-blue-500/20",
        },
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">Billing / Tiers</h1>
                    <p className="text-gray-400">Manage subscription tiers and pricing plans.</p>
                </div>

                {/* Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TIERS.map((tier, index) => {
                        const colors = colorClasses[tier.color];
                        const Icon = tier.icon;
                        const isActive = activeTiers[tier.id];

                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative bg-[#1b1b1d] rounded-2xl border-2 ${colors.border} transition-all overflow-hidden ${!isActive ? "opacity-50" : ""
                                    }`}
                            >
                                {/* Popular Badge */}
                                {tier.popular && (
                                    <div className="absolute top-4 right-4">
                                        <span className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                                            <Star className="w-3 h-3" />
                                            Popular
                                        </span>
                                    </div>
                                )}

                                {/* Header */}
                                <div className={`p-6 bg-gradient-to-br ${colors.gradient}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-3 rounded-xl ${colors.bg}/20`}>
                                            <Icon className={`w-6 h-6 ${colors.text}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{tier.name}</h3>
                                            <p className="text-sm text-gray-400">{tier.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">{tier.price}</span>
                                        <span className="text-gray-400">{tier.period}</span>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="p-6 space-y-4">
                                    <ul className="space-y-3">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm">
                                                <div className={`p-1 rounded-full ${colors.bg}/20`}>
                                                    <Check className={`w-3 h-3 ${colors.text}`} />
                                                </div>
                                                <span className="text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Toggle */}
                                    <div className="pt-4 border-t border-[#2a2a2d]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-400">
                                                {isActive ? "Active" : "Disabled"}
                                            </span>
                                            <button
                                                onClick={() => toggleTier(tier.id)}
                                                className={`relative w-14 h-7 rounded-full transition-colors ${isActive ? colors.bg : "bg-gray-600"
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: isActive ? 28 : 4 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Info Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start gap-4 p-6 bg-cyan/5 rounded-2xl border border-cyan/20"
                >
                    <Sparkles className="w-6 h-6 text-cyan flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold mb-1">Tier Management</h4>
                        <p className="text-sm text-gray-400">
                            Toggle tiers on/off to control which plans are available to users.
                            Changes will take effect immediately for new subscriptions.
                            Existing subscriptions will not be affected.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
