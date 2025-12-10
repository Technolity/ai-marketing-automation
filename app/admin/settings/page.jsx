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
    Loader2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

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

    // Fetch settings on mount
    useEffect(() => {
        if (!authLoading && session) {
            fetchSettings();
        }
    }, [authLoading, session]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth('/api/admin/settings');

            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            const data = await response.json();
            setSettings(data.settings);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "general", label: "General", icon: Settings },
        { id: "users", label: "User Management", icon: Users },
        { id: "database", label: "Database", icon: Database },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
        { id: "advanced", label: "Advanced", icon: Server }
    ];

    const handleSave = async () => {
        try {
            setSaving(true);

            // Save settings by category
            const categorySettings = {
                general: {
                    siteName: settings.siteName,
                    siteDescription: settings.siteDescription,
                    userRegistration: settings.userRegistration,
                    maintenanceMode: settings.maintenanceMode
                },
                users: {
                    autoApproveContent: settings.autoApproveContent,
                    maxUsersPerTier: settings.maxUsersPerTier
                },
                notifications: {
                    emailNotifications: settings.emailNotifications,
                    adminEmail: settings.adminEmail
                },
                security: {
                    require2FA: settings.require2FA,
                    allowAPIAccess: settings.allowAPIAccess
                },
                advanced: {
                    apiEndpoint: settings.apiEndpoint,
                    webhookUrl: settings.webhookUrl,
                    customCSS: settings.customCSS
                }
            };

            // Save each category
            for (const [category, categoryData] of Object.entries(categorySettings)) {
                const response = await fetchWithAuth('/api/admin/settings', {
                    method: 'PUT',
                    body: JSON.stringify({
                        category,
                        settings: categoryData
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to save ${category} settings`);
                }
            }

            toast.success("All settings saved successfully!");
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkOperation = async (action, confirmMessage) => {
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetchWithAuth('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                throw new Error(`Failed to perform ${action}`);
            }

            const data = await response.json();

            // Handle different action responses
            if (action === 'export_database' || action === 'export_users') {
                // Create downloadable JSON file
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${action}_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
            }

            toast.success(data.message || 'Operation completed successfully');
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            toast.error(`Failed to ${action.replace('_', ' ')}`);
        }
    };

    const handleExportData = () => {
        handleBulkOperation('export_database', 'Export all database data? This may take a few moments.');
    };

    const handleClearCache = () => {
        handleBulkOperation('clear_cache', 'Clear all cached data?');
    };

    const handleExportUsers = () => {
        handleBulkOperation('export_users', 'Export all users data?');
    };

    const handleBulkDeleteInactive = () => {
        handleBulkOperation('bulk_delete_inactive', 'Delete all users who haven\'t logged in for 90+ days? This cannot be undone.');
    };

    const handleDeleteTestData = () => {
        handleBulkOperation('delete_test_data', 'Delete all test data older than 30 days? This cannot be undone.');
    };

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Settings</h1>
                        <p className="text-gray-400">Manage your TedOS platform settings and configurations.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-cyan hover:brightness-110 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save All Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-cyan/20 text-cyan border border-cyan/30"
                                        : "bg-[#1b1b1d] text-gray-400 border border-[#2a2a2d] hover:border-cyan/20"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-8"
                >
                    {/* General Settings */}
                    {activeTab === "general" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">General Settings</h2>
                                <p className="text-gray-400 mb-8">Configure basic platform settings</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Site Name</label>
                                    <input
                                        type="text"
                                        value={settings.siteName}
                                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white focus:outline-none focus:border-cyan transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Site Description</label>
                                    <textarea
                                        value={settings.siteDescription}
                                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white focus:outline-none focus:border-cyan transition-colors resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#0e0e0f] rounded-lg">
                                    <div>
                                        <p className="font-medium">Enable User Registration</p>
                                        <p className="text-sm text-gray-400">Allow new users to sign up</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, userRegistration: !settings.userRegistration })}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${
                                            settings.userRegistration ? "bg-cyan" : "bg-gray-600"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                                settings.userRegistration ? "translate-x-7" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#0e0e0f] rounded-lg">
                                    <div>
                                        <p className="font-medium">Maintenance Mode</p>
                                        <p className="text-sm text-gray-400">Put site in maintenance mode</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${
                                            settings.maintenanceMode ? "bg-red-500" : "bg-gray-600"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                                settings.maintenanceMode ? "translate-x-7" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Management */}
                    {activeTab === "users" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">User Management</h2>
                                <p className="text-gray-400 mb-8">Control user permissions and tier limits</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-[#0e0e0f] rounded-lg border border-[#2a2a2d]">
                                    <label className="block text-sm font-medium mb-2 text-gray-400">Basic Tier Limit</label>
                                    <input
                                        type="number"
                                        value={settings.maxUsersPerTier.basic}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            maxUsersPerTier: { ...settings.maxUsersPerTier, basic: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded text-white focus:outline-none focus:border-cyan"
                                    />
                                </div>

                                <div className="p-4 bg-[#0e0e0f] rounded-lg border border-cyan/20">
                                    <label className="block text-sm font-medium mb-2 text-cyan">Premium Tier Limit</label>
                                    <input
                                        type="number"
                                        value={settings.maxUsersPerTier.premium}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            maxUsersPerTier: { ...settings.maxUsersPerTier, premium: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-4 py-2 bg-[#1b1b1d] border border-cyan/30 rounded text-white focus:outline-none focus:border-cyan"
                                    />
                                </div>

                                <div className="p-4 bg-[#0e0e0f] rounded-lg border border-purple-500/20">
                                    <label className="block text-sm font-medium mb-2 text-purple-400">Enterprise Tier Limit</label>
                                    <input
                                        type="number"
                                        value={settings.maxUsersPerTier.enterprise}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            maxUsersPerTier: { ...settings.maxUsersPerTier, enterprise: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-4 py-2 bg-[#1b1b1d] border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-[#0e0e0f] rounded-lg">
                                <div>
                                    <p className="font-medium">Auto-Approve Content</p>
                                    <p className="text-sm text-gray-400">Automatically approve all generated content</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, autoApproveContent: !settings.autoApproveContent })}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${
                                        settings.autoApproveContent ? "bg-cyan" : "bg-gray-600"
                                    }`}
                                >
                                    <div
                                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                            settings.autoApproveContent ? "translate-x-7" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-yellow-500">Bulk User Operations</p>
                                        <p className="text-sm text-yellow-200/80 mb-3">
                                            Manage multiple users at once. Use with caution.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={handleExportUsers}
                                                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Export All Users
                                            </button>
                                            <button
                                                onClick={handleBulkDeleteInactive}
                                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Bulk Delete Inactive
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Database Management */}
                    {activeTab === "database" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Database Management</h2>
                                <p className="text-gray-400 mb-8">Manage your database and data</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleExportData}
                                    className="flex items-center justify-between p-6 bg-[#0e0e0f] rounded-lg border border-[#2a2a2d] hover:border-cyan/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-cyan/10 rounded-lg group-hover:bg-cyan/20 transition-colors">
                                            <Download className="w-6 h-6 text-cyan" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Export Database</p>
                                            <p className="text-sm text-gray-400">Download all data as JSON</p>
                                        </div>
                                    </div>
                                    <span className="text-cyan opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </button>

                                <button
                                    onClick={handleClearCache}
                                    className="flex items-center justify-between p-6 bg-[#0e0e0f] rounded-lg border border-[#2a2a2d] hover:border-purple-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                            <RefreshCw className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Clear Cache</p>
                                            <p className="text-sm text-gray-400">Clear all cached data</p>
                                        </div>
                                    </div>
                                    <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </button>
                            </div>

                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-red-500">Danger Zone</p>
                                        <p className="text-sm text-red-200/80 mb-3">
                                            These actions are irreversible. Proceed with extreme caution.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={handleDeleteTestData}
                                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete All Test Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === "notifications" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
                                <p className="text-gray-400 mb-8">Configure email and system notifications</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-[#0e0e0f] rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-cyan" />
                                        <div>
                                            <p className="font-medium">Email Notifications</p>
                                            <p className="text-sm text-gray-400">Send email updates to admins</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${
                                            settings.emailNotifications ? "bg-cyan" : "bg-gray-600"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                                settings.emailNotifications ? "translate-x-7" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="p-4 bg-[#0e0e0f] rounded-lg">
                                    <label className="block text-sm font-medium mb-2">Admin Email Address</label>
                                    <input
                                        type="email"
                                        value={settings.adminEmail}
                                        onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                                        placeholder="admin@tedos.com"
                                        className="w-full px-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white focus:outline-none focus:border-cyan transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === "security" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
                                <p className="text-gray-400 mb-8">Manage security and access controls</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-[#0e0e0f] rounded-lg border border-[#2a2a2d]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Lock className="w-5 h-5 text-cyan" />
                                        <p className="font-semibold">Two-Factor Authentication</p>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">Require 2FA for admin accounts</p>
                                    <button className="px-4 py-2 bg-cyan/10 text-cyan rounded-lg text-sm font-medium hover:bg-cyan/20 transition-colors">
                                        Configure 2FA
                                    </button>
                                </div>

                                <div className="p-6 bg-[#0e0e0f] rounded-lg border border-[#2a2a2d]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Shield className="w-5 h-5 text-purple-400" />
                                        <p className="font-semibold">API Access</p>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">Manage API keys and tokens</p>
                                    <button className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/20 transition-colors">
                                        View API Keys
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Advanced */}
                    {activeTab === "advanced" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Advanced Settings</h2>
                                <p className="text-gray-400 mb-8">Advanced configurations for developers</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-[#0e0e0f] rounded-lg">
                                    <label className="block text-sm font-medium mb-2">API Endpoint</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={settings.apiEndpoint}
                                            readOnly
                                            className="flex-1 px-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-gray-400"
                                        />
                                        <button className="px-4 py-3 bg-cyan/10 text-cyan rounded-lg hover:bg-cyan/20 transition-colors">
                                            <Check className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-[#0e0e0f] rounded-lg">
                                    <label className="block text-sm font-medium mb-2">Webhook URL</label>
                                    <input
                                        type="text"
                                        value={settings.webhookUrl}
                                        onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                                        placeholder="https://your-webhook-url.com"
                                        className="w-full px-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white focus:outline-none focus:border-cyan transition-colors"
                                    />
                                </div>

                                <div className="p-4 bg-[#0e0e0f] rounded-lg">
                                    <label className="block text-sm font-medium mb-2">Custom CSS</label>
                                    <textarea
                                        value={settings.customCSS}
                                        onChange={(e) => setSettings({ ...settings, customCSS: e.target.value })}
                                        placeholder="/* Add custom CSS here */"
                                        rows={6}
                                        className="w-full px-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
}
