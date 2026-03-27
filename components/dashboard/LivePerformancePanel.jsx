"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowUpRight,
    CalendarDays,
    DollarSign,
    Loader2,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { cn } from "@/lib/utils";
const displayFontClass = "font-sans";

const cardTones = [
    "text-cyan",
    "text-emerald-300",
    "text-blue-200",
    "text-amber-300",
];

const stageFills = [
    "bg-cyan",
    "bg-emerald-400",
    "bg-blue-300",
    "bg-amber-300",
];

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});

function formatCurrency(value, compact = false) {
    const numericValue = Number(value) || 0;

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 0,
    }).format(numericValue);
}

function formatNumber(value, compact = false) {
    const numericValue = Number(value) || 0;
    return compact ? compactNumberFormatter.format(numericValue) : numericValue.toLocaleString();
}

function formatShortDay(dateString) {
    if (!dateString) return "--";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatAppointmentDate(dateString) {
    if (!dateString) return "No upcoming appointment";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "No upcoming appointment";

    return `${date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    })} - ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    })}`;
}

function buildBarSeries(points = [], valueKey = "count", limit = 5, minimumHeight = 16, maxHeight = 88) {
    const recentPoints = points.slice(-limit);
    const maxValue = Math.max(...recentPoints.map((point) => Number(point?.[valueKey]) || 0), 1);

    return recentPoints.map((point) => {
        const value = Number(point?.[valueKey]) || 0;

        return {
            label: formatShortDay(point?.date),
            value,
            height: Math.max(minimumHeight, Math.round((value / maxValue) * maxHeight)),
        };
    });
}

function buildDeltaLabel(points = [], valueKey = "count", windowSize = 7) {
    const currentWindow = points.slice(-windowSize);
    const previousWindow = points.slice(-windowSize * 2, -windowSize);
    const currentTotal = currentWindow.reduce((sum, point) => sum + (Number(point?.[valueKey]) || 0), 0);
    const previousTotal = previousWindow.reduce((sum, point) => sum + (Number(point?.[valueKey]) || 0), 0);

    if (currentTotal === 0 && previousTotal === 0) {
        return "No recent movement";
    }

    if (previousTotal === 0) {
        return `+${currentTotal > 0 ? 100 : 0}% vs last week`;
    }

    const delta = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    return `${delta > 0 ? "+" : ""}${delta}% vs last week`;
}

function SectionHeading({ title, description }) {
    return (
        <div className="border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
                <div className="h-4 w-[3px] rounded-full bg-cyan" />
                <h3 className={cn(displayFontClass, "text-[18px] font-semibold tracking-[-0.03em] text-white")}>
                    {title}
                </h3>
            </div>
            <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#8b8b93]">
                {description}
            </p>
        </div>
    );
}

function MetricCard({ label, value, helper, icon: Icon, tone }) {
    return (
        <div className="rounded-[18px] border border-white/[0.07] bg-[#111214] px-3.5 py-3.5 sm:px-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7c7c83]">
                        {label}
                    </p>
                    <p
                        className={cn(
                            displayFontClass,
                            "mt-2.5 truncate text-[24px] font-semibold leading-none tracking-[-0.03em] sm:text-[28px]",
                            tone
                        )}
                    >
                        {value}
                    </p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#0f1011]">
                    <Icon className={cn("h-3.5 w-3.5", tone)} />
                </div>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-[#8b8b93]">{helper}</p>
        </div>
    );
}

function EmptyState({ label }) {
    return (
        <div className="flex min-h-[136px] items-center justify-center rounded-[14px] border border-white/[0.08] bg-[#13181b] px-4 text-center text-[13px] text-[#8b8b93]">
            {label}
        </div>
    );
}

export default function LivePerformancePanel() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [metricsData, setMetricsData] = useState(null);
    const [contactsData, setContactsData] = useState(null);
    const [appointmentsData, setAppointmentsData] = useState(null);

    useEffect(() => {
        let isActive = true;

        const loadData = async () => {
            try {
                const [metricsRes, contactsRes, appointmentsRes] = await Promise.all([
                    fetchWithAuth("/api/ghl/metrics"),
                    fetchWithAuth("/api/ghl/contacts"),
                    fetchWithAuth("/api/ghl/appointments"),
                ]);

                const [metricsJson, contactsJson, appointmentsJson] = await Promise.all([
                    metricsRes.ok ? metricsRes.json() : null,
                    contactsRes.ok ? contactsRes.json() : null,
                    appointmentsRes.ok ? appointmentsRes.json() : null,
                ]);

                if (!isActive) return;

                setConnected(Boolean(metricsJson?.connected));
                setMetricsData(metricsJson?.connected ? metricsJson.metrics || null : null);
                setContactsData(contactsJson?.connected ? contactsJson.metrics || null : null);
                setAppointmentsData(appointmentsJson?.connected ? appointmentsJson.metrics || null : null);
            } catch (error) {
                console.error("[LivePerformancePanel] Failed to load data", error);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isActive = false;
        };
    }, []);

    const metricCards = useMemo(
        () => [
            {
                label: "Pipeline value",
                value: formatCurrency(metricsData?.pipelineValue, true),
                helper: "Open opportunity value inside Builder-connected pipelines.",
                icon: DollarSign,
            },
            {
                label: "Active deals",
                value: formatNumber(metricsData?.activeOpportunities),
                helper: "Open opportunities currently moving across live stages.",
                icon: TrendingUp,
            },
            {
                label: "New leads",
                value: formatNumber(contactsData?.newThisWeek),
                helper: "Contacts captured over the last seven days.",
                icon: Users,
            },
            {
                label: "Upcoming calls",
                value: formatNumber(appointmentsData?.upcomingCount),
                helper: "Appointments already scheduled for the coming week.",
                icon: CalendarDays,
            },
        ],
        [appointmentsData?.upcomingCount, contactsData?.newThisWeek, metricsData?.activeOpportunities, metricsData?.pipelineValue]
    );

    const leadFlow = useMemo(
        () => buildBarSeries(contactsData?.growthTrend || [], "count", 5, 16, 88),
        [contactsData?.growthTrend]
    );

    const appointmentFlow = useMemo(
        () => buildBarSeries(appointmentsData?.bookingTrend || [], "bookings", 5, 12, 52),
        [appointmentsData?.bookingTrend]
    );

    const leadDeltaLabel = useMemo(
        () => buildDeltaLabel(contactsData?.growthTrend || [], "count", 7),
        [contactsData?.growthTrend]
    );

    const stageVolume = useMemo(() => {
        const stages = (metricsData?.funnelData || []).slice(0, 4);
        const maxStageValue = Math.max(...stages.map((stage) => Number(stage?.value) || 0), 1);

        return stages.map((stage, index) => ({
            name: stage.name,
            value: Number(stage.value) || 0,
            width: Math.max(10, Math.round(((Number(stage.value) || 0) / maxStageValue) * 100)),
            fillClass: stageFills[index % stageFills.length],
        }));
    }, [metricsData?.funnelData]);

    const leadSources = useMemo(
        () => (metricsData?.leadSources || []).slice(0, 4),
        [metricsData?.leadSources]
    );

    const nextAppointment = appointmentsData?.upcomingAppointments?.[0] || null;

    if (loading) {
        return (
            <div className="space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[116px] animate-pulse rounded-[18px] border border-white/[0.08] bg-[#111214]"
                        />
                    ))}
                </div>
                <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.7fr)_300px]">
                    <div className="h-[452px] animate-pulse rounded-[20px] border border-white/[0.08] bg-[#111214]" />
                    <div className="space-y-3.5">
                        <div className="h-[206px] animate-pulse rounded-[20px] border border-white/[0.08] bg-[#111214]" />
                        <div className="h-[224px] animate-pulse rounded-[20px] border border-white/[0.08] bg-[#111214]" />
                    </div>
                </div>
            </div>
        );
    }

    if (!connected) {
        return (
            <section className="rounded-[20px] border border-amber-500/20 bg-[#111214] p-5 sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-amber-500/20 bg-amber-500/10">
                            <Zap className="h-4 w-4 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-200/70">
                                Builder stats offline
                            </p>
                            <h3 className={cn(displayFontClass, "mt-2 text-[22px] font-semibold tracking-[-0.03em] text-white")}>
                                Connect your Builder telemetry.
                            </h3>
                            <p className="mt-2.5 max-w-2xl text-[13px] leading-5 text-[#8b8b93]">
                                Live Performance needs a connected GHL location before it can show revenue, contacts, and appointment flow.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/admin/ghl-authorize")}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] border border-amber-400/20 bg-amber-400 px-4 text-[13px] font-semibold text-[#16120a] transition hover:brightness-105"
                    >
                        Connect Builder Stats
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </section>
        );
    }

    return (
        <div className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card, index) => (
                    <MetricCard key={card.label} {...card} tone={cardTones[index % cardTones.length]} />
                ))}
            </div>

            <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.7fr)_300px]">
                <section className="rounded-[20px] border border-white/[0.07] bg-[#111214] p-4 sm:p-5">
                    <SectionHeading
                        title="Lead trend"
                        description="A simple week view that shows whether demand is moving up, not just how many leads exist."
                    />

                    <div className="mt-4 rounded-[16px] border border-white/[0.08] bg-[#13181b] p-3.5 sm:p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[14px] font-medium text-white">5-day lead flow</p>
                            <p className="text-[13px] font-medium text-cyan">{leadDeltaLabel}</p>
                        </div>

                        {leadFlow.length === 0 ? (
                            <div className="mt-4">
                                <EmptyState label="No contact trend data is available yet." />
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-5 gap-2.5 sm:gap-3">
                                {leadFlow.map((bar) => (
                                    <div key={bar.label} className="flex h-[130px] flex-col items-center justify-end gap-1.5">
                                        <div className="flex h-[104px] w-full items-end justify-center rounded-[12px] border border-white/[0.08] bg-[#101114] px-1.5 pb-1.5">
                                            <div
                                                className="w-full rounded-[10px] bg-gradient-to-t from-cyan/25 via-cyan/50 to-cyan"
                                                style={{ height: `${bar.height}px` }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-medium text-[#f0f0f2]">{bar.value}</p>
                                            <p className="text-[10px] uppercase tracking-[0.1em] text-[#7c7c83]">
                                                {bar.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-3.5 overflow-hidden rounded-[16px] border border-white/[0.08]">
                        <div className="hidden grid-cols-[minmax(0,1.5fr)_80px_88px_92px] border-b border-white/[0.08] bg-[#1b1b1d] px-4 py-2.5 sm:grid">
                            {["Source", "Leads", "Value", "Win"].map((label) => (
                                <p
                                    key={label}
                                    className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7c7c83]"
                                >
                                    {label}
                                </p>
                            ))}
                        </div>

                        <div className="space-y-2 bg-[#13181b] p-3 sm:space-y-0 sm:p-0">
                            {leadSources.length === 0 ? (
                                <div className="px-4 py-7 text-center text-[13px] text-[#8b8b93]">
                                    No lead source data is available yet.
                                </div>
                            ) : (
                                leadSources.map((source) => (
                                    <div
                                        key={source.source}
                                        className="rounded-[12px] border border-white/[0.08] bg-[#13181b] px-4 py-2.5 sm:grid sm:grid-cols-[minmax(0,1.5fr)_80px_88px_92px] sm:items-center sm:rounded-none sm:border-x-0 sm:border-t-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-medium text-[#f0f0f2]" title={source.source}>
                                                {source.source}
                                            </p>
                                        </div>
                                        <div className="mt-2.5 flex flex-wrap gap-2 text-xs sm:mt-0 sm:block sm:text-[13px]">
                                            <span className="inline-flex rounded-[8px] border border-white/[0.08] bg-[#101114] px-2 py-1 text-[#f0f0f2] sm:hidden">
                                                Leads {formatNumber(source.leads)}
                                            </span>
                                            <span className="hidden text-[#f0f0f2] sm:inline">
                                                {formatNumber(source.leads)}
                                            </span>
                                        </div>
                                        <div className="hidden text-[13px] text-[#f0f0f2] sm:block">
                                            {formatCurrency(source.value, true)}
                                        </div>
                                        <div className="mt-2 sm:mt-0">
                                            <span className="inline-flex rounded-[8px] border border-cyan/20 bg-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan">
                                                {source.winRate}%
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <div className="space-y-3.5">
                    <section className="rounded-[20px] border border-white/[0.07] bg-[#111214] p-4">
                        <SectionHeading
                            title="Stage volume"
                            description="Current lead stages at a glance without the extra dashboard noise."
                        />

                        <div className="mt-4 space-y-3.5">
                            {stageVolume.length === 0 ? (
                                <EmptyState label="No funnel stage data is available yet." />
                            ) : (
                                stageVolume.map((stage) => (
                                    <div key={stage.name} className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-[13px] font-medium text-[#f0f0f2]" title={stage.name}>
                                                {stage.name}
                                            </p>
                                            <span className="text-[13px] text-[#8b8b93]">{formatNumber(stage.value)}</span>
                                        </div>
                                        <div className="h-2.5 overflow-hidden rounded-full border border-white/[0.08] bg-[#101114]">
                                            <div
                                                className={cn("h-full rounded-full", stage.fillClass)}
                                                style={{ width: `${stage.width}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-[20px] border border-white/[0.07] bg-[#111214] p-4">
                        <SectionHeading
                            title="Appointments"
                            description="Booked-call pace and the next appointment that matters."
                        />

                        {appointmentFlow.length === 0 ? (
                            <div className="mt-4 space-y-3.5">
                                <EmptyState label="No appointment flow is available yet." />
                                <EmptyState label="The next appointment card will appear here once bookings are available." />
                            </div>
                        ) : (
                            <>
                                <div className="mt-4 grid grid-cols-5 gap-2.5">
                                    {appointmentFlow.map((bar) => (
                                        <div key={bar.label} className="flex h-[84px] flex-col items-center justify-end gap-1.5">
                                            <div className="flex h-[64px] w-full items-end justify-center rounded-[12px] border border-white/[0.08] bg-[#101114] px-1.5 pb-1.5">
                                                <div
                                                    className="w-full rounded-[8px] bg-gradient-to-t from-cyan/25 via-cyan/45 to-cyan"
                                                    style={{ height: `${bar.height}px` }}
                                                />
                                            </div>
                                            <p className="text-[10px] uppercase tracking-[0.1em] text-[#7c7c83]">
                                                {bar.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-[14px] border border-white/[0.08] bg-[#13181b] p-3.5">
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7c7c83]">
                                            Today
                                        </p>
                                        <p className={cn(displayFontClass, "mt-1.5 text-[22px] font-semibold tracking-[-0.03em] text-white")}>
                                            {formatNumber(appointmentsData?.todayCount)}
                                        </p>
                                        <p className="mt-1.5 text-[13px] text-[#8b8b93]">Appointments scheduled for today.</p>
                                    </div>
                                    <div className="rounded-[14px] border border-white/[0.08] bg-[#13181b] p-3.5">
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7c7c83]">
                                            This month
                                        </p>
                                        <p className={cn(displayFontClass, "mt-1.5 text-[22px] font-semibold tracking-[-0.03em] text-white")}>
                                            {formatNumber(appointmentsData?.thisMonth)}
                                        </p>
                                        <p className="mt-1.5 text-[13px] text-[#8b8b93]">Total appointments booked this month.</p>
                                    </div>
                                </div>

                                <div className="mt-3.5 rounded-[14px] border border-white/[0.08] bg-[#13181b] p-3.5">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7c7c83]">
                                        Next appointment
                                    </p>
                                    <p className="mt-1.5 text-[14px] font-medium text-[#f0f0f2]">
                                        {formatAppointmentDate(nextAppointment?.startTime)}
                                    </p>
                                    <p className="mt-1 text-[13px] leading-5 text-[#8b8b93]">
                                        {nextAppointment
                                            ? `${nextAppointment.contactName} - ${nextAppointment.title}`
                                            : "The next appointment will appear here once the Builder calendar is connected."}
                                    </p>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
