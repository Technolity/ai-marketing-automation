"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
    Users,
    Building2,
    FileText,
    Activity,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminOverview() {
    const { session, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && session) {
            fetchStats();
        } else if (!authLoading && !session) {
            setLoading(false);
            setError("Not authenticated");
        }
    }, [authLoading, session]);

    const fetchStats = async () => {
        try {
            // Use AbortController for timeout (increased to 15s for stats)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch('/api/admin/stats', {
                credentials: 'include', // Include cookies for auth
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            if (err.name === 'AbortError') {
                setError('Request timed out. Please try again.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Format tier data for pie chart (TedOS tiers)
    const tierData = stats ? [
        { name: "Starter", value: stats.users?.byTier?.starter || 0, color: "#6b7280" },
        { name: "Growth", value: stats.users?.byTier?.growth || 0, color: "#00E5FF" },
        { name: "Scale", value: stats.users?.byTier?.scale || 0, color: "#8b5cf6" },
    ] : [];

    const STATS_CARDS = stats ? [
        {
            label: "Total Users",
            value: stats.users?.total?.toLocaleString() || "0",
            change: `+${stats.users?.thisWeek || 0} this week`,
            up: true,
            icon: Users,
            color: "cyan"
        },
        {
            label: "Marketing Engines",
            value: stats.businesses?.total?.toLocaleString() || "0",
            change: `${stats.businesses?.completed || 0} completed`,
            up: true,
            icon: Building2,
            color: "blue"
        },
        {
            label: "Content Generated",
            value: stats.content?.total?.toLocaleString() || "0",
            change: `+${stats.content?.thisWeek || 0} this week`,
            up: true,
            icon: FileText,
            color: "purple"
        },
        {
            label: "Paid Users",
            value: ((stats.users?.byTier?.growth || 0) + (stats.users?.byTier?.scale || 0)).toLocaleString(),
            change: `${Math.round(((stats.users?.byTier?.growth || 0) + (stats.users?.byTier?.scale || 0)) / Math.max(stats.users?.total || 1, 1) * 100)}%`,
            up: true,
            icon: Activity,
            color: "green"
        },
    ] : [];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={fetchStats}
                        className="mt-4 px-4 py-2 bg-cyan/10 text-cyan rounded-lg hover:bg-cyan/20 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
                    <p className="text-gray-400">Welcome back! Here's what's happening with TedOS today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STATS_CARDS.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[#1b1b1d] rounded-2xl p-6 border border-[#2a2a2d] hover:border-cyan/30 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-${stat.color}-500/10`}>
                                        <Icon className={`w-6 h-6 text-${stat.color === 'cyan' ? 'cyan' : stat.color + '-500'}`} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-[#1b1b1d] rounded-2xl p-6 border border-[#2a2a2d]"
                    >
                        <h3 className="text-lg font-semibold mb-6">Weekly Activity</h3>
                        {stats?.weeklyActivity && stats.weeklyActivity.length > 0 ? (
                            <>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={288}>
                                        <AreaChart data={stats.weeklyActivity}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorContent" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2d" />
                                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#1b1b1d",
                                                    border: "1px solid #2a2a2d",
                                                    borderRadius: "8px",
                                                    color: "#fff"
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="users"
                                                stroke="#00E5FF"
                                                fillOpacity={1}
                                                fill="url(#colorUsers)"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="content"
                                                stroke="#8b5cf6"
                                                fillOpacity={1}
                                                fill="url(#colorContent)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center justify-center gap-6 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-cyan" />
                                        <span className="text-sm text-gray-400">New Users</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                                        <span className="text-sm text-gray-400">Content Generated</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-gray-500">
                                No activity data available
                            </div>
                        )}
                    </motion.div>

                    {/* Tier Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-[#1b1b1d] rounded-2xl p-6 border border-[#2a2a2d]"
                    >
                        <h3 className="text-lg font-semibold mb-6">User Tiers</h3>
                        {tierData && tierData.some(t => t.value > 0) ? (
                            <>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={192}>
                                        <PieChart>
                                            <Pie
                                                data={tierData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {tierData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#1b1b1d",
                                                    border: "1px solid #2a2a2d",
                                                    borderRadius: "8px",
                                                    color: "#fff"
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-4">
                                    {tierData.map((tier) => (
                                        <div key={tier.name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                                            <span className="text-sm text-gray-400">{tier.name}</span>
                                            <span className="text-sm text-white ml-auto">{tier.value} users</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-gray-500">
                                No tier data available
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#1b1b1d] rounded-2xl p-6 border border-[#2a2a2d]"
                >
                    <h3 className="text-lg font-semibold mb-6">Quick Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-[#0e0e0f] rounded-xl">
                            <p className="text-gray-400 text-sm mb-1">New Users This Week</p>
                            <p className="text-2xl font-bold text-cyan">{stats?.users?.thisWeek || 0}</p>
                        </div>
                        <div className="p-4 bg-[#0e0e0f] rounded-xl">
                            <p className="text-gray-400 text-sm mb-1">New Users This Month</p>
                            <p className="text-2xl font-bold text-cyan">{stats?.users?.thisMonth || 0}</p>
                        </div>
                        <div className="p-4 bg-[#0e0e0f] rounded-xl">
                            <p className="text-gray-400 text-sm mb-1">Completed Businesses</p>
                            <p className="text-2xl font-bold text-green-500">{stats?.businesses?.completed || 0}</p>
                        </div>
                        <div className="p-4 bg-[#0e0e0f] rounded-xl">
                            <p className="text-gray-400 text-sm mb-1">Content This Week</p>
                            <p className="text-2xl font-bold text-purple-500">{stats?.content?.thisWeek || 0}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
