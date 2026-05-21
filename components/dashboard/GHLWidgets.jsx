"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DollarSign, Users, LineChart as LineChartIcon,
    ArrowUpRight,
    PieChart as PieIcon, Activity, BarChart3, Timer, TrendingUp,
    Calendar, Clock, Info, Hammer, ExternalLink, Zap
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRouter } from 'next/navigation';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    AreaChart, Area, LineChart, Line
} from 'recharts';
import { cn } from "@/lib/utils";

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
            const [metricsRes, contactsRes, appointmentsRes] = await Promise.all([
                fetchWithAuth('/api/ghl/metrics'),
                fetchWithAuth('/api/ghl/contacts'),
                fetchWithAuth('/api/ghl/appointments')
            ]);

            if (metricsRes.ok) {
                const json = await metricsRes.json();
                setConnected(json.connected);
                if (json.connected) setMetricsData(json.metrics);
            }
            if (contactsRes.ok) {
                const json = await contactsRes.json();
                if (json.connected) setContactsData(json.metrics);
            }
            if (appointmentsRes.ok) {
                const json = await appointmentsRes.json();
                if (json.connected) setAppointmentsData(json.metrics);
            }
        } catch (error) {
            console.error('Failed to load GHL data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-1 mb-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-32 bg-[#161618] animate-pulse border border-white/5" />
                ))}
            </div>
        );
    }

    if (!connected) {
        return (
            <div className="mb-8 p-12 bg-[#111112] border border-amber-500/20 flex flex-col items-center justify-center gap-6 relative">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20">
                    <Zap className="w-10 h-10 text-amber-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Platform Disconnected</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 max-w-lg">
                        Connect your marketing system to activate real-time business telemetry.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/admin/ghl-authorize')}
                    className="px-8 py-4 bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-400 transition-all"
                >
                    Connect Platform
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1 mb-12">
            {/* KPI Cards Grid - Solid 1px spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-1">
                <KPICard
                    title="Total Value"
                    value={`$${parseInt(metricsData?.pipelineValue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    color="text-cyan"
                    status="complete"
                />
                <KPICard
                    title="Active Opps"
                    value={metricsData?.activeOpportunities || 0}
                    subtitle="In Pipeline"
                    icon={Users}
                    color="text-purple-400"
                    status="in-progress"
                />
                <KPICard
                    title="Win Rate"
                    value={`${metricsData?.efficiency?.velocity ? Math.min(100, Math.round((metricsData.efficiency.totalWon / (metricsData.pipelineValue || 1)) * 100)) : 0}%`}
                    subtitle="Conversion"
                    icon={TrendingUp}
                    color="text-green-400"
                    status="deployed"
                />
                <KPICard
                    title="Total Contacts"
                    value={contactsData?.totalContacts?.toLocaleString() || 0}
                    subtitle={`+${contactsData?.newThisWeek || 0} new`}
                    icon={Users}
                    color="text-blue-400"
                />
                <KPICard
                    title="Appointments"
                    value={appointmentsData?.todayCount || 0}
                    subtitle={`${appointmentsData?.upcomingCount || 0} soon`}
                    icon={Timer}
                    color="text-amber-400"
                />
                <KPICard
                    title="Monthly Rev"
                    value={`$${parseInt(metricsData?.totalRevenue || 0).toLocaleString()}`}
                    subtitle={metricsData?.revenueGrowth || '+0%'}
                    icon={DollarSign}
                    color="text-green-400"
                    status="deployed"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
                <RevenueTrendWidget data={metricsData} />
                <ContactSourcesWidget data={contactsData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
                <OpportunityStatusPieChart data={metricsData?.statusData} />
                <div className="lg:col-span-2 bg-[#111112] border border-white/5 p-6 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Funnel Stage Volume
                    </h3>
                    <div className="flex-1" style={{ minHeight: '250px' }}>
                        {metricsData?.funnelData?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metricsData.funnelData}>
                                    <CartesianGrid strokeDasharray="0" stroke="#1f1f23" vertical={false} />
                                    <XAxis dataKey="name" stroke="#444" tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#444" tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomBarTooltip />} />
                                    <Bar dataKey="value" fill="#00E5FF" animationDuration={500}>
                                        {metricsData.funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#00E5FF', '#3b82f6', '#8b5cf6', '#d946ef'][index % 4]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[10px] font-bold uppercase text-gray-600">No Stage Data</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
                <AppointmentsWidget data={appointmentsData} />
                <div className="lg:col-span-2 bg-[#111112] border border-white/5 p-6 overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Lead Source Performance
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] border-b border-white/5">
                                    <th className="pb-4 pl-2">Source</th>
                                    <th className="pb-4">Leads</th>
                                    <th className="pb-4">Value</th>
                                    <th className="pb-4 text-right pr-2">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {metricsData?.leadSources?.length > 0 ? (
                                    metricsData.leadSources.map((source, i) => (
                                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 pl-2 text-xs font-bold text-white uppercase tracking-tight">{source.source}</td>
                                            <td className="py-4 text-xs text-gray-400 font-bold">{source.leads}</td>
                                            <td className="py-4 text-xs font-mono font-bold text-cyan">${source.value.toLocaleString()}</td>
                                            <td className="py-4 text-right pr-2">
                                                <span className={cn(
                                                    "px-2 py-1 text-[9px] font-black uppercase border",
                                                    parseFloat(source.winRate) > 20 ? "text-green-500 border-green-500/20" : "text-gray-500 border-white/10"
                                                )}>
                                                    {source.winRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="text-center py-12 text-[10px] font-bold uppercase text-gray-600">No Source Data Found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon: Icon, color, status }) {
    return (
        <div className="bg-[#111112] border border-white/5 p-5 relative overflow-hidden group hover:bg-[#161618] transition-colors">
            {/* Minimalist Status Bar */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-[2px]",
                status === 'deployed' ? "bg-green-500" :
                status === 'complete' ? "bg-cyan" :
                status === 'in-progress' ? "bg-amber-500" : "bg-transparent"
            )} />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                        {title}
                    </h3>
                    <Icon className={cn("w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity", color)} />
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-black text-white tracking-tighter">
                        {value}
                    </span>
                    {subtitle && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mt-1">{subtitle}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function RevenueTrendWidget({ data }) {
    if (!data?.revenueTrend || data.revenueTrend.length === 0) {
        return (
            <div className="lg:col-span-2 bg-[#111112] border border-white/5 p-6 flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                    <LineChartIcon className="w-3.5 h-3.5" />
                    Revenue Trend
                </h3>
                <div className="h-[250px] flex items-center justify-center text-[10px] font-bold uppercase text-gray-600">No Revenue Data</div>
            </div>
        );
    }

    return (
        <div className="lg:col-span-2 bg-[#111112] border border-white/5 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                        <LineChartIcon className="w-3.5 h-3.5" />
                        Revenue Performance
                    </h3>
                    <div className="mt-3 flex items-baseline gap-4">
                        <span className="text-3xl font-black text-white tracking-tighter">
                            ${parseInt(data.totalRevenue || 0).toLocaleString()}
                        </span>
                        <span className={cn("text-xs font-black uppercase tracking-widest", data.revenueGrowth?.startsWith('+') ? 'text-green-500' : 'text-red-500')}>
                            {data.revenueGrowth}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1" style={{ minHeight: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueTrend}>
                        <CartesianGrid strokeDasharray="0" stroke="#1f1f23" vertical={false} />
                        <XAxis dataKey="month" stroke="#444" tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#444" tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0a0a0b', border: '1px solid #1f1f23', padding: '12px' }}
                            itemStyle={{ color: '#00E5FF', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#00E5FF" strokeWidth={2} fill="rgba(0, 229, 255, 0.05)" animationDuration={600} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function ContactSourcesWidget({ data }) {
    const [showInfo, setShowInfo] = useState(false);
    if (!data?.sourceBreakdown || data.sourceBreakdown.length === 0) {
        return (
            <div className="lg:col-span-1 bg-[#111112] border border-white/5 p-6 flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                    <PieIcon className="w-3.5 h-3.5" />
                    Contact Sources
                </h3>
                <div className="h-[250px] flex items-center justify-center text-[10px] font-bold uppercase text-gray-600">No Source Data</div>
            </div>
        );
    }

    const colors = ['#00E5FF', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];
    const chartData = data.sourceBreakdown.slice(0, 6).map((item, index) => ({
        name: item.source,
        value: item.count,
        color: colors[index]
    }));

    return (
        <div className="lg:col-span-1 bg-[#111112] border border-white/5 p-6 flex flex-col relative">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <PieIcon className="w-3.5 h-3.5" />
                    Lead Distribution
                </h3>
                <button onClick={() => setShowInfo(!showInfo)} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <Info className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1" style={{ minHeight: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={0} dataKey="value" animationDuration={500}>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                        </Pie>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <AnimatePresence>
                {showInfo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0a0b] p-6 z-10 border border-white/10">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Legend</h4>
                            <button onClick={() => setShowInfo(false)} className="text-[9px] font-black uppercase text-cyan hover:text-white">Close</button>
                         </div>
                        <div className="space-y-2">
                            {chartData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2" style={{ backgroundColor: item.color }} />
                                        <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AppointmentsWidget({ data }) {
    if (!data || data.error === 'APPOINTMENTS_API_UNAVAILABLE') {
        return (
            <div className="lg:col-span-1 bg-[#111112] border border-white/5 p-6 flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Appointments
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <p className="text-[10px] font-bold uppercase text-gray-600">Calendar Data Inactive</p>
                </div>
            </div>
        );
    }

    const upcoming = data.upcomingAppointments || [];

    return (
        <div className="lg:col-span-1 bg-[#111112] border border-white/5 p-6 flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Live Schedule
            </h3>

            {upcoming.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8">
                    <p className="text-[10px] font-bold uppercase text-gray-600">No Appointments Today</p>
                </div>
            ) : (
                <div className="space-y-1 overflow-y-auto max-h-[300px]">
                    {upcoming.slice(0, 5).map((appt) => {
                        const startTime = new Date(appt.startTime);
                        const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        return (
                            <div key={appt.id} className="p-3 bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-cyan uppercase">{timeStr}</span>
                                    <span className={cn("text-[8px] font-black uppercase px-1 border", appt.status === 'confirmed' ? "text-green-500 border-green-500/20" : "text-gray-500 border-white/10")}>{appt.status}</span>
                                </div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate mb-0.5">{appt.title}</h4>
                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest truncate">{appt.contactName}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CustomBarTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-[#0a0a0b] border border-white/10 p-3 shadow-2xl">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-black text-white tracking-tighter">{payload[0].value}</p>
            <div className="mt-2 h-[2px] w-full bg-cyan" />
        </div>
    );
}

function CustomPieTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-[#0a0a0b] border border-white/10 p-3 shadow-2xl">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{payload[0].name}</p>
            <p className="text-xl font-black text-white tracking-tighter">{payload[0].value}</p>
        </div>
    );
}

function OpportunityStatusPieChart({ data }) {
    const [showInfo, setShowInfo] = useState(false);
    if (!data || data.length === 0) {
        return (
            <div className="lg:col-span-1 bg-[#111112] border border-white/5 p-6 flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                    <PieIcon className="w-3.5 h-3.5" />
                    Opportunity Status
                </h3>
                <div className="h-[250px] flex items-center justify-center text-[10px] font-bold uppercase text-gray-600">No Data</div>
            </div>
        );
    }

    return (
        <div className="lg:col-span-1 bg-[#111112] border border-white/5 p-6 flex flex-col relative">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <PieIcon className="w-3.5 h-3.5" />
                    Pipeline Status
                </h3>
                <button onClick={() => setShowInfo(!showInfo)} className="p-2 text-gray-600 hover:text-white transition-colors">
                    <Info className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1" style={{ minHeight: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={0} dataKey="value" animationDuration={500}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                        </Pie>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <AnimatePresence>
                {showInfo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0a0b] p-6 z-10 border border-white/10">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Legend</h4>
                            <button onClick={() => setShowInfo(false)} className="text-[9px] font-black uppercase text-cyan hover:text-white">Close</button>
                         </div>
                        <div className="space-y-2">
                            {data.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2" style={{ backgroundColor: item.color }} />
                                        <span className="text-[10px] font-bold text-white uppercase truncate">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
