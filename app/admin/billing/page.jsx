"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    Crown,
    Zap,
    Building2,
    Check,
    Sparkles
} from "lucide-react";
import AdminLayout from '@/components/admin/AdminLayout';
import { T as _T } from '@/components/admin/adminTheme';

const TIERS = [
    {
        id: "premium",
        name: "Premium",
        price: "$97",
        period: "/month",
        description: "Perfect for growing businesses",
        icon: Zap,
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

    return (
        <AdminLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", maxWidth: "100%", overflowX: "auto", boxSizing: "border-box" }}>
                {/* Header */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 3, height: 22, backgroundColor: _T.cyan, borderRadius: 2 }} />
                        <h1 style={{ color: _T.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Billing / Tiers</h1>
                    </div>
                    <p style={{ color: _T.textSecondary, fontSize: 13, marginLeft: 11, margin: "0 0 0 11px" }}>Manage subscription tiers and pricing</p>
                </div>

                {/* Tiers Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                    {TIERS.map((tier, index) => {
                        const Icon = tier.icon;
                        const isActive = activeTiers[tier.id];

                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.07 }}
                                style={{
                                    backgroundColor: _T.card,
                                    border: `1px solid ${tier.popular ? "#16C7E7" : "#1E2A34"}`,
                                    borderTop: `3px solid ${tier.popular ? "#16C7E7" : "#1E2A34"}`,
                                    borderRadius: 14,
                                    padding: 28,
                                    position: "relative",
                                    opacity: isActive ? 1 : 0.45,
                                    transition: "opacity 0.2s ease",
                                }}
                            >
                                {/* Popular Badge */}
                                {tier.popular && (
                                    <div style={{
                                        position: "absolute",
                                        top: -1,
                                        right: 20,
                                        backgroundColor: _T.cyan,
                                        color: "#05080B",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: "3px 10px",
                                        borderRadius: "0 0 8px 8px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}>
                                        Most Popular
                                    </div>
                                )}

                                {/* Tier Icon + Name */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        backgroundColor: "rgba(22,199,231,0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <Icon style={{ width: 20, height: 20, color: _T.cyan }} />
                                    </div>
                                    <div>
                                        <p style={{ color: _T.textPrimary, fontSize: 20, fontWeight: 700, margin: 0 }}>{tier.name}</p>
                                        <p style={{ color: _T.textSecondary, fontSize: 13, marginTop: 2, margin: "2px 0 0" }}>{tier.description}</p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div style={{ marginBottom: 20 }}>
                                    <span style={{ color: _T.textPrimary, fontSize: 36, fontWeight: 700 }}>{tier.price}</span>
                                    {tier.period && (
                                        <span style={{ color: _T.textSecondary, fontSize: 14, marginLeft: 4 }}>{tier.period}</span>
                                    )}
                                </div>

                                {/* Features */}
                                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                                    {tier.features.map((f) => (
                                        <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <Check style={{ width: 14, height: 14, color: _T.green, flexShrink: 0 }} />
                                            <span style={{ color: _T.textSecondary, fontSize: 13 }}>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Active Toggle */}
                                <div style={{ borderTop: "1px solid #1E2A34", paddingTop: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, color: isActive ? "#34d399" : "#5a6a78", fontWeight: 500 }}>
                                            {isActive ? "Active" : "Disabled"}
                                        </span>
                                        <button
                                            onClick={() => toggleTier(tier.id)}
                                            style={{
                                                position: "relative",
                                                width: 44,
                                                height: 24,
                                                borderRadius: 99,
                                                border: "none",
                                                cursor: "pointer",
                                                backgroundColor: isActive ? "#16C7E7" : "#1E2A34",
                                                transition: "background-color 0.2s ease",
                                                padding: 0,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 3,
                                                    left: isActive ? 23 : 3,
                                                    width: 18,
                                                    height: 18,
                                                    backgroundColor: "#fff",
                                                    borderRadius: "50%",
                                                    transition: "left 0.2s ease",
                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                                }}
                                            />
                                        </button>
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
                    transition={{ delay: 0.1 }}
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "18px 22px",
                        backgroundColor: "rgba(22,199,231,0.05)",
                        border: "1px solid rgba(22,199,231,0.2)",
                        borderRadius: 12,
                    }}
                >
                    <Sparkles style={{ width: 18, height: 18, color: _T.cyan, flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <p style={{ color: _T.textPrimary, fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Tier Management</p>
                        <p style={{ color: _T.textSecondary, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
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
