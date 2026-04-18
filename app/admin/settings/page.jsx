"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Database,
    Users,
    Download,
    RefreshCw,
    Settings,
    Bell,
    Mail,
    Lock,
    Server,
    AlertTriangle,
    Save,
    Check,
    Trash2,
    Loader2,
    Link2,
    Unlink
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// ---- Shared style tokens ----
const TOKEN = {
    cardBg: "#0D1217",
    surface: "#121920",
    border: "#1E2A34",
    cyan: "#16C7E7",
    textPrimary: "#F4F8FB",
    textSecondary: "#B2C0CD",
    textMuted: "#5a6a78",
    success: "#34d399",
    danger: "#f87171",
    purple: "#a78bfa",
    blue: "#60a5fa",
};

// ---- Reusable inline Toggle ----
function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            style={{
                position: "relative",
                width: 44,
                height: 24,
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                backgroundColor: checked ? TOKEN.cyan : TOKEN.border,
                transition: "background-color 0.2s ease",
                padding: 0,
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 3,
                    left: checked ? 23 : 3,
                    width: 18,
                    height: 18,
                    backgroundColor: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
            />
        </button>
    );
}

// ---- Reusable SettingRow (toggle row) ----
function SettingRow({ label, description, checked, onChange, icon: Icon }) {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            backgroundColor: TOKEN.cardBg,
            border: `1px solid ${TOKEN.border}`,
            borderRadius: 10,
            gap: 16,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {Icon && <Icon style={{ width: 18, height: 18, color: TOKEN.cyan, flexShrink: 0 }} />}
                <div style={{ minWidth: 0 }}>
                    <p style={{ color: TOKEN.textPrimary, fontSize: 14, fontWeight: 500, margin: 0 }}>{label}</p>
                    {description && (
                        <p style={{ color: TOKEN.textSecondary, fontSize: 12, margin: "2px 0 0" }}>{description}</p>
                    )}
                </div>
            </div>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

// ---- Reusable Input ----
function StyledInput({ value, onChange, type = "text", placeholder, readOnly, className: _cls, style: extraStyle }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                backgroundColor: TOKEN.surface,
                border: `1px solid ${focused ? TOKEN.cyan : TOKEN.border}`,
                borderRadius: 8,
                color: readOnly ? TOKEN.textSecondary : TOKEN.textPrimary,
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s ease",
                fontFamily: type === "password" ? "monospace" : "inherit",
                ...extraStyle,
            }}
        />
    );
}

// ---- Reusable Textarea ----
function StyledTextarea({ value, onChange, placeholder, rows = 3, style: extraStyle }) {
    const [focused, setFocused] = useState(false);
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                backgroundColor: TOKEN.surface,
                border: `1px solid ${focused ? TOKEN.cyan : TOKEN.border}`,
                borderRadius: 8,
                color: TOKEN.textPrimary,
                fontSize: 14,
                outline: "none",
                resize: "none",
                transition: "border-color 0.15s ease",
                fontFamily: "inherit",
                ...extraStyle,
            }}
        />
    );
}

// ---- SectionCard ----
function SectionCard({ title, description, children, style: extraStyle }) {
    return (
        <div style={{
            backgroundColor: TOKEN.cardBg,
            border: `1px solid ${TOKEN.border}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
            ...extraStyle,
        }}>
            {(title || description) && (
                <div style={{ marginBottom: 18 }}>
                    {title && <p style={{ color: TOKEN.textPrimary, fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</p>}
                    {description && <p style={{ color: TOKEN.textSecondary, fontSize: 13, margin: "4px 0 0" }}>{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

export default function AdminSettings() {
    const { session, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        siteName: "TedOS",
        siteDescription: "AI Marketing Automation Platform",
        emailNotifications: true,
        adminEmail: "admin@tedos.com",
        userRegistration: true,
        autoApproveContent: false,
        maxUsersPerTier: {
            basic: 1000,
            premium: 500,
            enterprise: 100
        },
        maintenanceMode: false,
        require2FA: false,
        allowAPIAccess: true,
        apiEndpoint: "https://api.tedos.com",
        webhookUrl: "",
        customCSS: ""
    });

    // GHL integration state
    const [ghlStatus, setGhlStatus] = useState({ isConnected: false, source: "none", credentials: null });
    const [ghlLoading, setGhlLoading] = useState(false);
    const [ghlForm, setGhlForm] = useState({ agencyId: "", agencyName: "", accessToken: "" });

    useEffect(() => {
        if (!authLoading && session) {
            fetchSettings();
            fetchGhlStatus();
        }
    }, [authLoading, session]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth("/api/admin/settings");
            if (!response.ok) throw new Error("Failed to fetch settings");
            const data = await response.json();
            setSettings(data.settings);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const fetchGhlStatus = async () => {
        try {
            const response = await fetchWithAuth("/api/admin/ghl");
            if (response.ok) {
                const data = await response.json();
                setGhlStatus(data);
            }
        } catch (error) {
            console.error("Error fetching GHL status:", error);
        }
    };

    const handleGhlConnect = async (e) => {
        e.preventDefault();
        if (!ghlForm.agencyId || !ghlForm.accessToken) {
            toast.error("Agency ID and Access Token are required");
            return;
        }
        setGhlLoading(true);
        try {
            const response = await fetchWithAuth("/api/admin/ghl", {
                method: "POST",
                body: JSON.stringify(ghlForm)
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("GHL Agency connected successfully!");
                setGhlForm({ agencyId: "", agencyName: "", accessToken: "" });
                fetchGhlStatus();
            } else {
                toast.error(data.error || "Failed to connect");
            }
        } catch (error) {
            console.error("Error connecting GHL:", error);
            toast.error("Failed to connect GHL Agency");
        } finally {
            setGhlLoading(false);
        }
    };

    const handleGhlDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect the GHL Agency?")) return;
        setGhlLoading(true);
        try {
            const response = await fetchWithAuth("/api/admin/ghl", { method: "DELETE" });
            if (response.ok) {
                toast.success("GHL Agency disconnected");
                fetchGhlStatus();
            }
        } catch (error) {
            console.error("Error disconnecting GHL:", error);
            toast.error("Failed to disconnect");
        } finally {
            setGhlLoading(false);
        }
    };

    const tabs = [
        { id: "general", label: "General", icon: Settings },
        { id: "integrations", label: "Integrations", icon: Link2 },
        { id: "users", label: "User Management", icon: Users },
        { id: "database", label: "Database", icon: Database },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
        { id: "advanced", label: "Advanced", icon: Server }
    ];

    const getCategoryData = (tab) => {
        switch (tab) {
            case "general":
                return {
                    category: "general",
                    settings: {
                        siteName: settings.siteName,
                        siteDescription: settings.siteDescription,
                        userRegistration: settings.userRegistration,
                        maintenanceMode: settings.maintenanceMode
                    }
                };
            case "users":
                return {
                    category: "users",
                    settings: {
                        autoApproveContent: settings.autoApproveContent,
                        maxUsersPerTier: settings.maxUsersPerTier
                    }
                };
            case "notifications":
                return {
                    category: "notifications",
                    settings: {
                        emailNotifications: settings.emailNotifications,
                        adminEmail: settings.adminEmail
                    }
                };
            case "security":
                return {
                    category: "security",
                    settings: {
                        require2FA: settings.require2FA,
                        allowAPIAccess: settings.allowAPIAccess
                    }
                };
            case "advanced":
                return {
                    category: "advanced",
                    settings: {
                        apiEndpoint: settings.apiEndpoint,
                        webhookUrl: settings.webhookUrl,
                        customCSS: settings.customCSS
                    }
                };
            default:
                return null;
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const data = getCategoryData(activeTab);
            if (!data) {
                toast.info("No saveable settings for this tab");
                return;
            }
            const response = await fetchWithAuth("/api/admin/settings", {
                method: "PUT",
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`Failed to save ${data.category} settings`);
            toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings saved!`);
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const toggleMaintenanceMode = async (newValue) => {
        try {
            setSettings(prev => ({ ...prev, maintenanceMode: newValue }));
            const response = await fetchWithAuth("/api/admin/settings", {
                method: "PUT",
                body: JSON.stringify({
                    category: "general",
                    settings: {
                        siteName: settings.siteName,
                        siteDescription: settings.siteDescription,
                        userRegistration: settings.userRegistration,
                        maintenanceMode: newValue
                    }
                })
            });
            if (!response.ok) {
                setSettings(prev => ({ ...prev, maintenanceMode: !newValue }));
                throw new Error("Failed to toggle maintenance mode");
            }
            toast.success(newValue
                ? "Maintenance Mode ENABLED — users will be blocked within 60 seconds"
                : "Maintenance Mode DISABLED — users can access the site again"
            );
        } catch (error) {
            console.error("Error toggling maintenance mode:", error);
            toast.error("Failed to toggle maintenance mode");
        }
    };

    const handleBulkOperation = async (action, confirmMessage) => {
        if (!confirm(confirmMessage)) return;
        try {
            const response = await fetchWithAuth("/api/admin/settings", {
                method: "POST",
                body: JSON.stringify({ action })
            });
            if (!response.ok) throw new Error(`Failed to perform ${action}`);
            const data = await response.json();
            if (action === "export_database" || action === "export_users") {
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${action}_${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
            toast.success(data.message || "Operation completed successfully");
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            toast.error(`Failed to ${action.replace("_", " ")}`);
        }
    };

    const handleExportData = () => handleBulkOperation("export_database", "Export all database data? This may take a few moments.");
    const handleClearCache = () => handleBulkOperation("clear_cache", "Clear all cached data?");
    const handleExportUsers = () => handleBulkOperation("export_users", "Export all users data?");
    const handleBulkDeleteInactive = () => handleBulkOperation("bulk_delete_inactive", "Delete all users who haven't logged in for 90+ days? This cannot be undone.");
    const handleDeleteTestData = () => handleBulkOperation("delete_test_data", "Delete all test data older than 30 days? This cannot be undone.");

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 384 }}>
                    <Loader2 style={{ width: 32, height: 32, color: TOKEN.cyan, animation: "spin 1s linear infinite" }} />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 3, height: 22, backgroundColor: TOKEN.cyan, borderRadius: 2 }} />
                                <h1 style={{ color: TOKEN.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Settings</h1>
                            </div>
                            <p style={{ color: TOKEN.textSecondary, fontSize: 13, marginLeft: 11, margin: "0 0 0 11px" }}>
                                Manage your TedOS platform settings and configurations.
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 22px",
                                backgroundColor: TOKEN.cyan,
                                color: "#05080B",
                                fontWeight: 600,
                                fontSize: 14,
                                border: "none",
                                borderRadius: 8,
                                cursor: saving ? "not-allowed" : "pointer",
                                opacity: saving ? 0.6 : 1,
                                transition: "opacity 0.15s ease",
                            }}
                        >
                            {saving ? (
                                <>
                                    <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save style={{ width: 16, height: 16 }} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <TabButton
                                key={tab.id}
                                label={tab.label}
                                Icon={Icon}
                                isActive={isActive}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        );
                    })}
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    {/* General */}
                    {activeTab === "general" && (
                        <div>
                            <SectionCard title="General Settings" description="Configure basic platform settings">
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <div>
                                        <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Site Name</label>
                                        <StyledInput
                                            value={settings.siteName}
                                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Site Description</label>
                                        <StyledTextarea
                                            value={settings.siteDescription}
                                            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </SectionCard>

                            <SettingRow
                                label="Enable User Registration"
                                description="Allow new users to sign up"
                                checked={settings.userRegistration}
                                onChange={(val) => setSettings({ ...settings, userRegistration: val })}
                            />

                            {/* Maintenance Mode */}
                            <div style={{
                                marginTop: 12,
                                padding: "16px 18px",
                                borderRadius: 10,
                                border: settings.maintenanceMode
                                    ? "1px solid rgba(248,113,113,0.35)"
                                    : `1px solid ${TOKEN.border}`,
                                backgroundColor: settings.maintenanceMode
                                    ? "rgba(248,113,113,0.06)"
                                    : TOKEN.cardBg,
                                transition: "all 0.2s ease",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 8,
                                            backgroundColor: settings.maintenanceMode ? "rgba(248,113,113,0.15)" : "rgba(90,106,120,0.15)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <AlertTriangle style={{
                                                width: 16,
                                                height: 16,
                                                color: settings.maintenanceMode ? TOKEN.danger : TOKEN.textMuted,
                                            }} />
                                        </div>
                                        <div>
                                            <p style={{ color: TOKEN.textPrimary, fontSize: 14, fontWeight: 500, margin: 0 }}>Maintenance Mode</p>
                                            <p style={{ color: settings.maintenanceMode ? TOKEN.danger : TOKEN.textSecondary, fontSize: 12, margin: "2px 0 0" }}>
                                                {settings.maintenanceMode
                                                    ? "Site is BLOCKED for all non-admin users"
                                                    : "Block all non-admin users from accessing the site"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!settings.maintenanceMode) {
                                                if (confirm("Enable Maintenance Mode?\n\nAll non-admin users will immediately be blocked from using the site.\n\nContinue?")) {
                                                    toggleMaintenanceMode(true);
                                                }
                                            } else {
                                                toggleMaintenanceMode(false);
                                            }
                                        }}
                                        style={{
                                            position: "relative",
                                            width: 44,
                                            height: 24,
                                            borderRadius: 99,
                                            border: "none",
                                            cursor: "pointer",
                                            backgroundColor: settings.maintenanceMode ? TOKEN.danger : TOKEN.border,
                                            transition: "background-color 0.2s ease",
                                            padding: 0,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div style={{
                                            position: "absolute",
                                            top: 3,
                                            left: settings.maintenanceMode ? 23 : 3,
                                            width: 18,
                                            height: 18,
                                            backgroundColor: "#fff",
                                            borderRadius: "50%",
                                            transition: "left 0.2s ease",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                        }} />
                                    </button>
                                </div>
                                {settings.maintenanceMode && (
                                    <p style={{ marginTop: 10, fontSize: 12, color: "rgba(248,113,113,0.8)", paddingLeft: 46 }}>
                                        Maintenance mode is active. Users will be blocked within 60 seconds.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Integrations */}
                    {activeTab === "integrations" && (
                        <div>
                            <SectionCard title="Integrations" description="Connect external services to your TedOS platform">
                                {/* GHL Agency Connection */}
                                <div style={{
                                    padding: 20,
                                    backgroundColor: TOKEN.surface,
                                    border: `1px solid ${TOKEN.border}`,
                                    borderRadius: 10,
                                    marginBottom: 16,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                        <div style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 8,
                                            backgroundColor: ghlStatus.isConnected ? "rgba(52,211,153,0.12)" : "rgba(90,106,120,0.15)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <Link2 style={{ width: 17, height: 17, color: ghlStatus.isConnected ? TOKEN.success : TOKEN.textMuted }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ color: TOKEN.textPrimary, fontSize: 15, fontWeight: 600, margin: 0 }}>GoHighLevel Agency</p>
                                            <p style={{ color: TOKEN.textSecondary, fontSize: 13, margin: "2px 0 0" }}>
                                                {ghlStatus.isConnected
                                                    ? `Connected via ${ghlStatus.source}`
                                                    : "Connect your GHL Agency for sub-account creation"}
                                            </p>
                                        </div>
                                        {ghlStatus.isConnected && (
                                            <span style={{
                                                padding: "4px 12px",
                                                backgroundColor: "rgba(52,211,153,0.12)",
                                                color: TOKEN.success,
                                                borderRadius: 99,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}>
                                                Connected
                                            </span>
                                        )}
                                    </div>

                                    {ghlStatus.isConnected ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: 12,
                                                padding: 14,
                                                backgroundColor: TOKEN.cardBg,
                                                border: `1px solid ${TOKEN.border}`,
                                                borderRadius: 8,
                                            }}>
                                                <div>
                                                    <p style={{ color: TOKEN.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Agency ID</p>
                                                    <p style={{ color: TOKEN.textPrimary, fontSize: 13, fontFamily: "monospace", margin: 0 }}>{ghlStatus.credentials?.agencyId}</p>
                                                </div>
                                                <div>
                                                    <p style={{ color: TOKEN.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Agency Name</p>
                                                    <p style={{ color: TOKEN.textPrimary, fontSize: 13, margin: 0 }}>{ghlStatus.credentials?.agencyName}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleGhlDisconnect}
                                                disabled={ghlLoading}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    padding: "8px 14px",
                                                    backgroundColor: "rgba(248,113,113,0.08)",
                                                    border: "1px solid rgba(248,113,113,0.2)",
                                                    borderRadius: 8,
                                                    color: TOKEN.danger,
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    cursor: ghlLoading ? "not-allowed" : "pointer",
                                                    opacity: ghlLoading ? 0.6 : 1,
                                                    width: "fit-content",
                                                }}
                                            >
                                                {ghlLoading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Unlink style={{ width: 14, height: 14 }} />}
                                                Disconnect Agency
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleGhlConnect} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                            <div>
                                                <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                                                    Agency ID (Relationship Number)
                                                </label>
                                                <StyledInput
                                                    value={ghlForm.agencyId}
                                                    onChange={(e) => setGhlForm({ ...ghlForm, agencyId: e.target.value })}
                                                    placeholder="0-055-684"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                                                    Agency Name (Optional)
                                                </label>
                                                <StyledInput
                                                    value={ghlForm.agencyName}
                                                    onChange={(e) => setGhlForm({ ...ghlForm, agencyName: e.target.value })}
                                                    placeholder="TedOS Agency"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                                                    Private Integration Token (PIT)
                                                </label>
                                                <StyledInput
                                                    type="password"
                                                    value={ghlForm.accessToken}
                                                    onChange={(e) => setGhlForm({ ...ghlForm, accessToken: e.target.value })}
                                                    placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                    extraStyle={{ fontFamily: "monospace" }}
                                                />
                                                <p style={{ color: TOKEN.textMuted, fontSize: 12, marginTop: 5 }}>
                                                    Found in GHL Agency Settings → Integrations → Private Integrations
                                                </p>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={ghlLoading}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    padding: "10px 20px",
                                                    backgroundColor: TOKEN.cyan,
                                                    color: "#05080B",
                                                    fontWeight: 600,
                                                    fontSize: 14,
                                                    border: "none",
                                                    borderRadius: 8,
                                                    cursor: ghlLoading ? "not-allowed" : "pointer",
                                                    opacity: ghlLoading ? 0.6 : 1,
                                                    width: "fit-content",
                                                }}
                                            >
                                                {ghlLoading ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Link2 style={{ width: 15, height: 15 }} />}
                                                Connect Agency
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Help note */}
                                <div style={{
                                    padding: "12px 16px",
                                    backgroundColor: "rgba(22,199,231,0.05)",
                                    border: "1px solid rgba(22,199,231,0.2)",
                                    borderRadius: 8,
                                }}>
                                    <p style={{ color: TOKEN.cyan, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                                        <strong>Note:</strong> Connecting your GHL Agency enables automatic sub-account creation for new users.
                                        Each user will get their own GHL location with all funnels and automations pre-configured.
                                    </p>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* User Management */}
                    {activeTab === "users" && (
                        <div>
                            <SectionCard title="User Management" description="Control user permissions and tier limits">
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
                                    {[
                                        { key: "basic", label: "Basic Tier Limit", accentColor: TOKEN.textSecondary },
                                        { key: "premium", label: "Premium Tier Limit", accentColor: TOKEN.cyan },
                                        { key: "enterprise", label: "Enterprise Tier Limit", accentColor: TOKEN.purple },
                                    ].map(({ key, label, accentColor }) => (
                                        <div key={key} style={{
                                            padding: "14px 16px",
                                            backgroundColor: TOKEN.cardBg,
                                            border: `1px solid ${TOKEN.border}`,
                                            borderRadius: 10,
                                        }}>
                                            <label style={{ display: "block", color: accentColor, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                {label}
                                            </label>
                                            <NumberInput
                                                value={settings.maxUsersPerTier[key]}
                                                onChange={(val) => setSettings({
                                                    ...settings,
                                                    maxUsersPerTier: { ...settings.maxUsersPerTier, [key]: val }
                                                })}
                                                accentColor={accentColor}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <SettingRow
                                    label="Auto-Approve Content"
                                    description="Automatically approve all generated content"
                                    checked={settings.autoApproveContent}
                                    onChange={(val) => setSettings({ ...settings, autoApproveContent: val })}
                                />
                            </SectionCard>

                            {/* Bulk Operations */}
                            <div style={{
                                padding: "16px 18px",
                                backgroundColor: "rgba(234,179,8,0.05)",
                                border: "1px solid rgba(234,179,8,0.25)",
                                borderRadius: 12,
                            }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <AlertTriangle style={{ width: 16, height: 16, color: "#eab308", marginTop: 2, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: "#eab308", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Bulk User Operations</p>
                                        <p style={{ color: "rgba(234,179,8,0.75)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
                                            Manage multiple users at once. Use with caution.
                                        </p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                            <button
                                                onClick={handleExportUsers}
                                                style={{
                                                    padding: "7px 14px",
                                                    backgroundColor: "rgba(234,179,8,0.1)",
                                                    border: "1px solid rgba(234,179,8,0.2)",
                                                    borderRadius: 7,
                                                    color: "#eab308",
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Export All Users
                                            </button>
                                            <button
                                                onClick={handleBulkDeleteInactive}
                                                style={{
                                                    padding: "7px 14px",
                                                    backgroundColor: "rgba(248,113,113,0.08)",
                                                    border: "1px solid rgba(248,113,113,0.2)",
                                                    borderRadius: 7,
                                                    color: TOKEN.danger,
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Bulk Delete Inactive
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Database */}
                    {activeTab === "database" && (
                        <div>
                            <SectionCard title="Database Management" description="Manage your database and data">
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
                                    <button
                                        onClick={handleExportData}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 14,
                                            padding: "18px 20px",
                                            backgroundColor: TOKEN.surface,
                                            border: `1px solid ${TOKEN.border}`,
                                            borderRadius: 10,
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "border-color 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(22,199,231,0.4)"}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = TOKEN.border}
                                    >
                                        <div style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 8,
                                            backgroundColor: "rgba(22,199,231,0.08)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <Download style={{ width: 18, height: 18, color: TOKEN.cyan }} />
                                        </div>
                                        <div>
                                            <p style={{ color: TOKEN.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>Export Database</p>
                                            <p style={{ color: TOKEN.textSecondary, fontSize: 12, margin: "2px 0 0" }}>Download all data as JSON</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={handleClearCache}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 14,
                                            padding: "18px 20px",
                                            backgroundColor: TOKEN.surface,
                                            border: `1px solid ${TOKEN.border}`,
                                            borderRadius: 10,
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "border-color 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = TOKEN.border}
                                    >
                                        <div style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 8,
                                            backgroundColor: "rgba(167,139,250,0.08)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <RefreshCw style={{ width: 18, height: 18, color: TOKEN.purple }} />
                                        </div>
                                        <div>
                                            <p style={{ color: TOKEN.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>Clear Cache</p>
                                            <p style={{ color: TOKEN.textSecondary, fontSize: 12, margin: "2px 0 0" }}>Clear all cached data</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Danger Zone */}
                                <div style={{
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    backgroundColor: "rgba(239,68,68,0.04)",
                                    borderRadius: 12,
                                    padding: "16px 18px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                        <AlertTriangle style={{ width: 16, height: 16, color: TOKEN.danger, marginTop: 2, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ color: TOKEN.danger, fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Danger Zone</p>
                                            <p style={{ color: "rgba(248,113,113,0.75)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
                                                These actions are irreversible. Proceed with extreme caution.
                                            </p>
                                            <button
                                                onClick={handleDeleteTestData}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 7,
                                                    padding: "7px 14px",
                                                    backgroundColor: "rgba(248,113,113,0.08)",
                                                    border: "1px solid rgba(248,113,113,0.2)",
                                                    borderRadius: 7,
                                                    color: TOKEN.danger,
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <Trash2 style={{ width: 13, height: 13 }} />
                                                Delete All Test Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === "notifications" && (
                        <div>
                            <SectionCard title="Notification Settings" description="Configure email and system notifications">
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <SettingRow
                                        label="Email Notifications"
                                        description="Send email updates to admins"
                                        checked={settings.emailNotifications}
                                        onChange={(val) => setSettings({ ...settings, emailNotifications: val })}
                                        icon={Mail}
                                    />
                                    <div style={{
                                        padding: "14px 16px",
                                        backgroundColor: TOKEN.cardBg,
                                        border: `1px solid ${TOKEN.border}`,
                                        borderRadius: 10,
                                    }}>
                                        <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                                            Admin Email Address
                                        </label>
                                        <StyledInput
                                            type="email"
                                            value={settings.adminEmail}
                                            onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                                            placeholder="admin@tedos.com"
                                        />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === "security" && (
                        <div>
                            <SectionCard title="Security Settings" description="Manage security and access controls">
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                                    <div style={{
                                        padding: "20px",
                                        backgroundColor: TOKEN.surface,
                                        border: `1px solid ${TOKEN.border}`,
                                        borderRadius: 10,
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                            <Lock style={{ width: 16, height: 16, color: TOKEN.cyan }} />
                                            <p style={{ color: TOKEN.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>Two-Factor Authentication</p>
                                        </div>
                                        <p style={{ color: TOKEN.textSecondary, fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>Require 2FA for admin accounts</p>
                                        <button style={{
                                            padding: "7px 14px",
                                            backgroundColor: "rgba(22,199,231,0.08)",
                                            border: "1px solid rgba(22,199,231,0.2)",
                                            borderRadius: 7,
                                            color: TOKEN.cyan,
                                            fontSize: 13,
                                            fontWeight: 500,
                                            cursor: "pointer",
                                        }}>
                                            Configure 2FA
                                        </button>
                                    </div>

                                    <div style={{
                                        padding: "20px",
                                        backgroundColor: TOKEN.surface,
                                        border: `1px solid ${TOKEN.border}`,
                                        borderRadius: 10,
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                            <Shield style={{ width: 16, height: 16, color: TOKEN.purple }} />
                                            <p style={{ color: TOKEN.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>API Access</p>
                                        </div>
                                        <p style={{ color: TOKEN.textSecondary, fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>Manage API keys and tokens</p>
                                        <button style={{
                                            padding: "7px 14px",
                                            backgroundColor: "rgba(167,139,250,0.08)",
                                            border: "1px solid rgba(167,139,250,0.2)",
                                            borderRadius: 7,
                                            color: TOKEN.purple,
                                            fontSize: 13,
                                            fontWeight: 500,
                                            cursor: "pointer",
                                        }}>
                                            View API Keys
                                        </button>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* Advanced */}
                    {activeTab === "advanced" && (
                        <div>
                            <SectionCard title="Advanced Settings" description="Advanced configurations for developers">
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <div>
                                        <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>API Endpoint</label>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <StyledInput
                                                value={settings.apiEndpoint}
                                                readOnly
                                                extraStyle={{ flex: 1 }}
                                            />
                                            <button style={{
                                                padding: "10px 14px",
                                                backgroundColor: "rgba(22,199,231,0.08)",
                                                border: "1px solid rgba(22,199,231,0.2)",
                                                borderRadius: 8,
                                                color: TOKEN.cyan,
                                                cursor: "pointer",
                                                flexShrink: 0,
                                            }}>
                                                <Check style={{ width: 16, height: 16 }} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Webhook URL</label>
                                        <StyledInput
                                            value={settings.webhookUrl}
                                            onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                                            placeholder="https://your-webhook-url.com"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", color: TOKEN.textSecondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Custom CSS</label>
                                        <StyledTextarea
                                            value={settings.customCSS}
                                            onChange={(e) => setSettings({ ...settings, customCSS: e.target.value })}
                                            placeholder="/* Add custom CSS here */"
                                            rows={6}
                                            style={{ fontFamily: "monospace", fontSize: 13 }}
                                        />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
}

// ---- Internal sub-components ----

function TabButton({ label, Icon, isActive, onClick }) {
    const [hovered, setHovered] = useState(false);

    const activeStyle = {
        padding: "8px 16px",
        backgroundColor: "rgba(22,199,231,0.1)",
        border: "1px solid rgba(22,199,231,0.3)",
        borderRadius: 8,
        color: "#16C7E7",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 7,
        whiteSpace: "nowrap",
    };

    const inactiveStyle = {
        padding: "8px 16px",
        backgroundColor: hovered ? "#121920" : "transparent",
        border: hovered ? "1px solid #1E2A34" : "1px solid transparent",
        borderRadius: 8,
        color: "#B2C0CD",
        fontSize: 13,
        fontWeight: 400,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 7,
        whiteSpace: "nowrap",
        transition: "background-color 0.15s ease, border-color 0.15s ease",
    };

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={isActive ? activeStyle : inactiveStyle}
        >
            <Icon style={{ width: 14, height: 14 }} />
            {label}
        </button>
    );
}

function NumberInput({ value, onChange, accentColor }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 12px",
                backgroundColor: "#121920",
                border: `1px solid ${focused ? (accentColor || "#16C7E7") : "#1E2A34"}`,
                borderRadius: 7,
                color: "#F4F8FB",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s ease",
            }}
        />
    );
}
