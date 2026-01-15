"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DollarSign, Users, LineChart as LineChartIcon,
    ArrowUpRight,
    PieChart as PieIcon, Activity, BarChart3, Timer, TrendingUp,
    Calendar, Clock, Info, Hammer
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    AreaChart, Area, LineChart, Line
} from 'recharts';

// Global styles to remove focus outlines from all chart elements
if (typeof document !== 'undefined') {
    const styleId = 'recharts-focus-fix';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .recharts-wrapper,
            .recharts-surface,
            svg,
            .recharts-layer,
            .recharts-bar-rectangle,
            .recharts-sector,
            .recharts-pie-sector,
            .recharts-area,
            .recharts-line {
                outline: none !important;
            }
            .recharts-wrapper:focus,
            .recharts-surface:focus,
            svg:focus {
                outline: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [metricsData, setMetricsData] = useState(null);
    const [contactsData, setContactsData] = useState(null);
    const [appointmentsData, setAppointmentsData] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            // Parallel fetch all GHL data at once for optimal performance
            const [metricsRes, contactsRes, appointmentsRes] = await Promise.all([
                fetchWithAuth('/api/ghl/metrics'),
                fetchWithAuth('/api/ghl/contacts'),
                fetchWithAuth('/api/ghl/appointments')
            ]);

            // Process metrics (existing)
            if (metricsRes.ok) {
                const json = await metricsRes.json();
                setConnected(json.connected);
                if (json.connected) {
                    setMetricsData(json.metrics);
                }
            }

            // Process contacts
            if (contactsRes.ok) {
                const json = await contactsRes.json();
                if (json.connected) {
                    setContactsData(json.metrics);
                }
            }

            // Process appointments
            if (appointmentsRes.ok) {
                const json = await appointmentsRes.json();
                if (json.connected) {
                    setAppointmentsData(json.metrics);
                }
            }
        } catch (error) {
            console.error('Failed to load GHL data', error);
        } finally {
            setLoading(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
                ))}
            </div>
        );
    }

    // Disconnected State - Coming Soon
    if (!connected) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-8 bg-gradient-to-r from-blue-900/10 to-cyan/5 rounded-3xl border border-cyan/20 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan/20 to-blue-500/20 flex items-center justify-center border border-cyan/20 shadow-lg shadow-cyan/5">
                    <Hammer className="w-8 h-8 text-cyan" />
                </div>
                <h3 className="text-xl font-bold text-white">Marketing Platform Integration</h3>
                <p className="text-gray-400 text-center max-w-md">
                    Builder connection is currently under development. This feature will be available shortly to connect your marketing platform and view live metrics.
                </p>
                <span className="px-4 py-2 bg-cyan/10 text-cyan text-sm font-bold rounded-lg border border-cyan/20">
                    Coming Soon
                </span>
            </motion.div>
        );
    }


    // Connected State
    return (
        <div className="space-y-6 mb-12">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan/20 to-blue-500/10 rounded-lg border border-cyan/20">
                        <Activity className="w-5 h-5 text-cyan" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                        Live Performance
                    </h2>
                </div>
            </div>

            {/* Row 1: Quick Stats - 6 KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <KPICard
                    title="Total Value"
                    value={`$${parseInt(metricsData?.pipelineValue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    color="text-cyan"
                    gradient="from-cyan to-blue-500"
                />
                <KPICard
                    title="Active Opps"
                    value={metricsData?.activeOpportunities || 0}
                    subtitle="In Pipeline"
                    icon={Users}
                    color="text-purple-400"
                    gradient="from-purple-500 to-pink-500"
                />
                <KPICard
                    title="Win Rate"
                    value={`${metricsData?.efficiency?.velocity ? Math.min(100, Math.round((metricsData.efficiency.totalWon / (metricsData.pipelineValue || 1)) * 100)) : 0}%`}
                    subtitle="Conversion"
                    icon={TrendingUp}
                    color="text-green-400"
                    gradient="from-green-500 to-emerald-500"
                />
                <KPICard
                    title="Total Contacts"
                    value={contactsData?.totalContacts?.toLocaleString() || 0}
                    subtitle={`+${contactsData?.newThisWeek || 0} this week`}
                    icon={Users}
                    color="text-blue-400"
                    gradient="from-blue-500 to-cyan"
                />
                <KPICard
                    title="Appointments"
                    value={appointmentsData?.todayCount || 0}
                    subtitle={`${appointmentsData?.upcomingCount || 0} upcoming`}
                    icon={Timer}
                    color="text-amber-400"
                    gradient="from-amber-500 to-orange-500"
                />
                <KPICard
                    title="Monthly Revenue"
                    value={`$${parseInt(metricsData?.totalRevenue || 0).toLocaleString()}`}
                    subtitle={metricsData?.revenueGrowth || '+0%'}
                    icon={DollarSign}
                    color="text-green-400"
                    gradient="from-green-500 to-emerald-500"
                />
            </div>

            {/* Row 2: Revenue Trend & Contact Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Chart (2 cols) */}
                <RevenueTrendWidget data={metricsData} />

                {/* Contact Sources (1 col) */}
                <ContactSourcesWidget data={contactsData} />
            </div>

            {/* Row 3: Opportunity Status & Funnel Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Distribution (Donut) */}
                <OpportunityStatusPieChart data={metricsData?.statusData} />

                {/* Funnel Performance (Bar) */}
                <div className="lg:col-span-2 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Funnel Stage Volume
                    </h3>
                    <div className="flex-1" style={{ minHeight: '250px', outline: 'none' }} tabIndex={-1}>
                        {metricsData?.funnelData?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metricsData.funnelData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#666"
                                        tick={{ fill: '#666', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        tick={{ fill: '#666', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <RechartsTooltip
                                        cursor={false}
                                        content={<CustomBarTooltip />}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#3b82f6"
                                        radius={[8, 8, 0, 0]}
                                        animationDuration={800}
                                        className="transition-all duration-300 hover:brightness-125"
                                    >
                                        {metricsData.funnelData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={['#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'][index % 4]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-xs">No stage data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 4: Appointments & Lead Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Appointments Widget (1 col) */}
                <AppointmentsWidget data={appointmentsData} />

                {/* Lead Sources Table (2 cols) */}
                <div className="lg:col-span-2 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Lead Source Performance
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    <th className="pb-2 pl-4">Source</th>
                                    <th className="pb-2">Leads</th>
                                    <th className="pb-2">Total Value</th>
                                    <th className="pb-2 text-right pr-4">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metricsData?.leadSources?.length > 0 ? (
                                    metricsData.leadSources.map((source, i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-3 pl-4 bg-white/[0.02] rounded-l-xl border-y border-l border-white/5 group-hover:border-white/10 text-sm font-semibold text-white">
                                                {source.source}
                                            </td>
                                            <td className="py-3 bg-white/[0.02] border-y border-white/5 group-hover:border-white/10 text-sm text-gray-300">
                                                {source.leads}
                                            </td>
                                            <td className="py-3 bg-white/[0.02] border-y border-white/5 group-hover:border-white/10 text-sm font-mono text-cyan">
                                                ${source.value.toLocaleString()}
                                            </td>
                                            <td className="py-3 pr-4 bg-white/[0.02] rounded-r-xl border-y border-r border-white/5 group-hover:border-white/10 text-right">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${parseFloat(source.winRate) > 20 ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                                                    }`}>
                                                    {source.winRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                                            No specific source data found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon: Icon, color, gradient }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-[#161617]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all`}
        >
            <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity ${color}`}>
                <Icon className="w-32 h-32" />
            </div>
            <div className="relative z-10">
                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    {title}
                </h3>
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-white tracking-tight">
                        {value}
                    </span>
                    {subtitle && (
                        <span className="text-[10px] text-gray-500 font-medium">{subtitle}</span>
                    )}
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${gradient} w-[70%] rounded-full`} />
                </div>
            </div>
        </motion.div>
    );
}

// Revenue Trend Widget
function RevenueTrendWidget({ data }) {
    if (!data?.revenueTrend || data.revenueTrend.length === 0) {
        return (
            <div className="lg:col-span-2 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4" />
                    Revenue Trend
                </h3>
                <div className="h-[250px] flex items-center justify-center text-gray-500 text-xs">
                    No revenue data available
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col"
        >
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <LineChartIcon className="w-4 h-4" />
                        Revenue Trend (6 Months)
                    </h3>
                    <div className="mt-2 flex items-baseline gap-3">
                        <span className="text-2xl font-black text-white">
                            ${parseInt(data.totalRevenue || 0).toLocaleString()}
                        </span>
                        <span className={`text-sm font-bold ${data.revenueGrowth?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                            {data.revenueGrowth}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1" style={{ minHeight: '250px', outline: 'none' }} tabIndex={-1}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueTrend}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#1b1b1d', borderColor: '#333', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => [`$${parseInt(value).toLocaleString()}`, 'Revenue']}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            fill="url(#revenueGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

// Contact Sources Widget
function ContactSourcesWidget({ data }) {
    if (!data?.sourceBreakdown || data.sourceBreakdown.length === 0) {
        return (
            <div className="lg:col-span-1 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <PieIcon className="w-4 h-4" />
                    Contact Sources
                </h3>
                <div className="h-[250px] flex items-center justify-center text-gray-500 text-xs">
                    No contact source data
                </div>
            </div>
        );
    }

    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];
    const chartData = data.sourceBreakdown.slice(0, 6).map((item, index) => ({
        name: item.source,
        value: item.count,
        color: colors[index]
    }));

    const [showInfo, setShowInfo] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col relative"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <PieIcon className="w-4 h-4" />
                    Contact Sources
                </h3>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan/20"
                    style={{ outline: 'none' }}
                >
                    <Info className="w-4 h-4 text-gray-400 hover:text-cyan transition-colors" />
                </button>
            </div>
            <div className="flex-1" style={{ minHeight: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={800}
                            style={{ outline: 'none' }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="rgba(0,0,0,0)"
                                    className="transition-all duration-300 hover:brightness-125 focus:outline-none"
                                    style={{ outline: 'none' }}
                                />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-[#1b1b1d] border border-cyan/20 rounded-xl px-4 py-3 shadow-2xl"
                                        style={{ outline: 'none' }}
                                    >
                                        <p className="text-sm font-bold text-white mb-1">{payload[0].name}</p>
                                        <p className="text-2xl font-black text-cyan">{payload[0].value}</p>
                                    </motion.div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Info Button Legend Popup */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-16 right-6 bg-[#1b1b1d] border border-white/10 rounded-xl p-4 shadow-2xl z-10 min-w-[200px]"
                        style={{ outline: 'none' }}
                    >
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Legend</h4>
                        <div className="space-y-2">
                            {chartData.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-white font-medium truncate">{item.name}</span>
                                    <span className="text-xs text-gray-500 ml-auto">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Appointments Widget
function AppointmentsWidget({ data }) {
    if (!data) {
        return (
            <div className="lg:col-span-1 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Today's Appointments
                </h3>
                <div className="h-[250px] flex items-center justify-center text-gray-500 text-xs">
                    Loading appointments...
                </div>
            </div>
        );
    }

    if (data.error === 'APPOINTMENTS_API_UNAVAILABLE') {
        return (
            <div className="lg:col-span-1 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Appointments
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <Calendar className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">Calendar API not available</p>
                    <p className="text-xs text-gray-600 mt-1">Contact support to enable appointments</p>
                </div>
            </div>
        );
    }

    const upcomingAppointments = data.upcomingAppointments || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col"
        >
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today's Appointments
            </h3>

            {upcomingAppointments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-600 mb-3 opacity-50" />
                    <p className="text-sm text-gray-500">No upcoming appointments</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto max-h-[280px]">
                    {upcomingAppointments.slice(0, 5).map((appt) => {
                        const startTime = new Date(appt.startTime);
                        const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        const dateStr = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        return (
                            <div
                                key={appt.id}
                                className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 hover:border-cyan/20 transition-all group"
                            >
                                <div className="flex flex-col items-center justify-center min-w-[50px] pt-1">
                                    <Clock className="w-4 h-4 text-cyan mb-1" />
                                    <span className="text-xs font-bold text-white">{timeStr}</span>
                                    <span className="text-[10px] text-gray-500">{dateStr}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan transition-colors">
                                        {appt.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 truncate">{appt.contactName}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${appt.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                                        }`}>
                                        {appt.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}

// Custom Bar Tooltip with lift animation
function CustomBarTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            className="bg-[#1b1b1d] border border-cyan/20 rounded-xl px-4 py-3 shadow-2xl shadow-cyan/10"
            style={{ outline: 'none' }}
        >
            <p className="text-sm font-bold text-white mb-1">{label}</p>
            <p className="text-2xl font-black text-cyan">{payload[0].value}</p>
            <div className="mt-2 h-1 w-full bg-gradient-to-r from-cyan to-blue-500 rounded-full" />
        </motion.div>
    );
}

// Opportunity Status Pie Chart with Info Button Legend
function OpportunityStatusPieChart({ data }) {
    const [showInfo, setShowInfo] = useState(false);

    if (!data || data.length === 0) {
        return (
            <div className="lg:col-span-1 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <PieIcon className="w-4 h-4" />
                    Opportunity Status
                </h3>
                <div className="h-[250px] flex items-center justify-center text-gray-500 text-xs">
                    No data available
                </div>
            </div>
        );
    }

    return (
        <div className="lg:col-span-1 bg-[#161617]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col relative">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <PieIcon className="w-4 h-4" />
                    Opportunity Status
                </h3>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan/20"
                    style={{ outline: 'none' }}
                >
                    <Info className="w-4 h-4 text-gray-400 hover:text-cyan transition-colors" />
                </button>
            </div>

            <div className="flex-1" style={{ minHeight: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={800}
                            style={{ outline: 'none' }}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="rgba(0,0,0,0)"
                                    className="transition-all duration-300 hover:brightness-125 focus:outline-none"
                                    style={{ outline: 'none' }}
                                />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-[#1b1b1d] border border-cyan/20 rounded-xl px-4 py-3 shadow-2xl"
                                        style={{ outline: 'none' }}
                                    >
                                        <p className="text-sm font-bold text-white mb-1">{payload[0].name}</p>
                                        <p className="text-2xl font-black text-cyan">{payload[0].value}</p>
                                    </motion.div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Info Button Legend Popup */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-16 right-6 bg-[#1b1b1d] border border-white/10 rounded-xl p-4 shadow-2xl z-10 min-w-[200px]"
                        style={{ outline: 'none' }}
                    >
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Legend</h4>
                        <div className="space-y-2">
                            {data.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-white font-medium">{item.name}</span>
                                    <span className="text-xs text-gray-500 ml-auto">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
