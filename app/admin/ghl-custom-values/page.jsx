"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    Download,
    Plus,
    User,
    X,
    ChevronDown,
    Database,
    Hash,
    Layers,
    Tag,
    Send,
    Palette,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";

// ── Status badge helpers ────────────────────────────────────────────────────

const STATUS_STYLES = {
    active: {
        pill: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: CheckCircle,
        label: "Active",
    },
    partial: {
        pill: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: AlertTriangle,
        label: "Partial",
    },
    not_created: {
        pill: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: XCircle,
        label: "Not created",
    },
};

function StatusPill({ status }) {
    const cfg = STATUS_STYLES[status] || STATUS_STYLES.not_created;
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.pill}`}
        >
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ── Create result inline panel ──────────────────────────────────────────────

function CreateResult({ result, onDismiss }) {
    if (!result) return null;
    const hasErrors = result.failed > 0;
    return (
        <div
            className={`mt-3 rounded-xl border p-4 text-sm ${
                hasErrors
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-200"
                    : "bg-green-500/10 border-green-500/30 text-green-200"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="font-semibold">
                        {result.message || "Done"}
                    </p>
                    <p>
                        Created:{" "}
                        <span className="font-bold text-white">
                            {result.created}
                        </span>{" "}
                        &nbsp;|&nbsp; Skipped:{" "}
                        <span className="font-bold text-white">
                            {result.skipped}
                        </span>{" "}
                        &nbsp;|&nbsp; Failed:{" "}
                        <span
                            className={`font-bold ${
                                result.failed > 0
                                    ? "text-red-400"
                                    : "text-white"
                            }`}
                        >
                            {result.failed}
                        </span>
                    </p>
                    {result.failedKeys?.length > 0 && (
                        <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-orange-300 hover:text-white">
                                Show failed keys ({result.failedKeys.length})
                            </summary>
                            <ul className="mt-1 max-h-32 overflow-y-auto space-y-0.5 font-mono text-xs text-gray-400">
                                {result.failedKeys.map((f, i) => (
                                    <li key={i}>
                                        {f.key}:{" "}
                                        <span className="text-red-400">
                                            {f.error}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </div>
                <button
                    onClick={onDismiss}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>
        </div>
    );
}

// ── Slot table row ──────────────────────────────────────────────────────────

function SlotRow({ slot, userId, locationId, onRefresh }) {
    const [creating, setCreating] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [result, setResult] = useState(null);

    const handleCreate = async () => {
        if (creating) return;
        setCreating(true);
        setResult(null);
        try {
            const res = await fetchWithAuth("/api/admin/ghl-custom-values", {
                method: "POST",
                body: JSON.stringify({
                    action: "create_slot",
                    ...(locationId ? { location_id: locationId } : { userId }),
                    slot_index: slot.slot_index,
                }),
            });
            const data = await res.json();
            if (!res.ok && res.status !== 409) {
                throw new Error(data.error || "Create failed");
            }
            setResult(data);
            toast.success(
                `Slot ${slot.slot_index}: ${data.created} keys created`
            );
            onRefresh();
        } catch (err) {
            console.error("Create slot error:", err);
            toast.error(err.message || "Failed to create slot");
        } finally {
            setCreating(false);
        }
    };

    const handleSync = async () => {
        if (syncing) return;
        setSyncing(true);
        setResult(null);
        try {
            const res = await fetchWithAuth("/api/admin/ghl-custom-values", {
                method: "POST",
                body: JSON.stringify({
                    action: "sync_slot",
                    ...(locationId ? { location_id: locationId } : { userId }),
                    slot_index: slot.slot_index,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Sync failed");
            const dbMsg = data.db_count !== undefined ? ` (${data.db_count} in DB)` : "";
            setResult({ message: `Synced ${data.synced} keys from GHL${dbMsg}`, ...data });
            toast.success(`Slot ${slot.slot_index}: ${data.synced} matched, ${data.db_count ?? "?"} in DB`);
            onRefresh();
        } catch (err) {
            console.error("Sync slot error:", err);
            toast.error(err.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const res = await fetchWithAuth("/api/admin/ghl-custom-values", {
                method: "POST",
                body: JSON.stringify({
                    action: "export_slot",
                    ...(locationId ? { location_id: locationId } : { userId }),
                    slot_index: slot.slot_index,
                    format: "csv",
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Export failed");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `slot_${slot.slot_index}_keys.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Slot ${slot.slot_index} CSV downloaded`);
        } catch (err) {
            console.error("Export slot error:", err);
            toast.error(err.message || "Export failed");
        } finally {
            setExporting(false);
        }
    };

    const isBaseSlot = slot.slot_index === 3;
    const isActive = slot.status === "active";
    const canCreate = !isBaseSlot && slot.status !== "active";

    return (
        <>
            <tr className="hover:bg-[#202022] transition-colors">
                {/* Slot */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-gray-500" />
                        <span className="font-mono font-semibold text-white">
                            {String(slot.slot_index).padStart(2, "0")}
                        </span>
                        {isBaseSlot && (
                            <span className="text-xs font-medium text-cyan bg-cyan/10 border border-cyan/20 rounded-full px-2 py-0.5">
                                Base
                            </span>
                        )}
                    </div>
                </td>

                {/* Prefix */}
                <td className="px-4 py-3">
                    <code className="text-xs bg-[#0e0e0f] border border-[#2a2a2d] rounded px-2 py-1 text-cyan font-mono">
                        {slot.prefix}
                    </code>
                </td>

                {/* Keys created */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span
                            className={`font-semibold tabular-nums ${
                                isActive
                                    ? "text-green-400"
                                    : slot.key_count > 0
                                    ? "text-yellow-400"
                                    : "text-gray-500"
                            }`}
                        >
                            {slot.key_count}
                        </span>
                        <span className="text-gray-600">/</span>
                        <span className="text-gray-400">
                            {slot.total_keys}
                        </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-1.5 h-1 w-24 bg-[#2a2a2d] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                isActive
                                    ? "bg-green-500"
                                    : slot.key_count > 0
                                    ? "bg-yellow-500"
                                    : "bg-gray-700"
                            }`}
                            style={{
                                width: `${
                                    slot.total_keys > 0
                                        ? (slot.key_count / slot.total_keys) *
                                          100
                                        : 0
                                }%`,
                            }}
                        />
                    </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                    <StatusPill status={slot.status} />
                </td>

                {/* Created at */}
                <td className="px-4 py-3 text-xs text-gray-500">
                    {slot.created_at
                        ? new Date(slot.created_at).toLocaleDateString(
                              undefined,
                              {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                              }
                          )
                        : "—"}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        {canCreate && (
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                    slot.status === "partial"
                                        ? "Resume creating remaining keys"
                                        : "Bulk-create 195 GHL custom values"
                                }
                            >
                                {creating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                                {creating
                                    ? "Creating…"
                                    : slot.status === "partial"
                                    ? "Resume"
                                    : "Create"}
                            </button>
                        )}
                        {isBaseSlot && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan border border-cyan/20 bg-cyan/5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Hardcoded
                            </span>
                        )}
                        {!isBaseSlot && isActive && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-500/20 bg-green-500/5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Complete
                            </span>
                        )}
                        {!isBaseSlot && (
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-[#1b1b1d] text-gray-300 border border-[#2a2a2d] hover:border-cyan hover:text-cyan disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Import existing GHL values into DB by name match"
                            >
                                {syncing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                Sync
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            disabled={exporting || slot.key_count === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-[#1b1b1d] text-gray-300 border border-[#2a2a2d] hover:border-gray-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Download slot keys as CSV"
                        >
                            {exporting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Download className="w-3.5 h-3.5" />
                            )}
                            Export
                        </button>
                    </div>
                </td>
            </tr>
            {/* Inline result row */}
            {result && (
                <tr>
                    <td colSpan={6} className="px-4 pb-3">
                        <CreateResult
                            result={result}
                            onDismiss={() => setResult(null)}
                        />
                    </td>
                </tr>
            )}
        </>
    );
}

// ── Key template breakdown panel ────────────────────────────────────────────

const TEMPLATE_SECTIONS = [
    {
        name: "Funnel Copy",
        section: "funnelCopy",
        count: 75,
        prefixType: "prefixed",
        desc: "Optin page (4), Sales/VSL page (67), Calendar (2), Thank You (2)",
        keyPattern: (prefix) => `${prefix}vsl_hero_headline_text, ${prefix}optin_headline_text, …`,
    },
    {
        name: "Emails",
        section: "emails",
        count: 62,
        prefixType: "base",
        desc: "Free Gift (2) + Day 1–14 (subject, preheader, body × 14) + day 8/day 15 closing variants",
        keyPattern: (prefix) => `${prefix}free_gift_email_subject, ${prefix}optin_email_subject_1, …`,
    },
    {
        name: "SMS",
        section: "sms",
        count: 20,
        prefixType: "base",
        desc: "Day 1–15 message sequence (incl. morning/afternoon/evening variants)",
        keyPattern: (prefix) => `${prefix}optin_sms_1 … ${prefix}optin_sms_15_evening`,
    },
    {
        name: "Appointment Reminders",
        section: "appointmentReminders",
        count: 24,
        prefixType: "base",
        desc: "6 triggers × 3 email fields (subject, preheader, body) + 6 SMS fields",
        keyPattern: (prefix) => `${prefix}email_subject_when_call_booked, ${prefix}sms_when_call_booked, …`,
    },
    {
        name: "Colors",
        section: "colors",
        count: 3,
        prefixType: "base",
        desc: "Primary, Secondary, Tertiary brand colors (hex values)",
        keyPattern: (prefix) => `${prefix}primary_color, ${prefix}secondary_color, ${prefix}tertiary_color`,
    },
    {
        name: "Media",
        section: "media",
        count: 9,
        prefixType: "mixed",
        desc: "8 prefixed (bio photo, mockup, VSL video, thank-you video, 4 testimonial images) + logo (base)",
        keyPattern: (prefix, slotPrefix) => `${slotPrefix}vsl_bio_image, ${slotPrefix}optin_mockup_image, ${prefix}logo_image, …`,
    },
    {
        name: "Company",
        section: "company",
        count: 2,
        prefixType: "mixed",
        desc: "company_name (base-prefixed) + company_email (slot-prefixed)",
        keyPattern: (prefix, slotPrefix) => `${prefix}company_name, ${slotPrefix}company_email`,
    },
];

const PREFIX_BADGE = {
    prefixed: { label: "slot prefix", cls: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    base:     { label: "base prefix", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    mixed:    { label: "mixed",       cls: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

function KeyTemplatePanel({ activeSlotIndex }) {
    const [open, setOpen] = useState(false);
    const slotNum = activeSlotIndex ?? 4;
    const slotPrefix = String(slotNum).padStart(2, "0") + "_";
    const basePrefix = slotNum === 3 ? "" : slotPrefix;

    return (
        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#202022] transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-cyan" />
                    <div>
                        <span className="text-sm font-semibold text-white">
                            Key Template Reference
                        </span>
                        <span className="ml-3 text-xs text-gray-500">
                            195 keys across 7 sections
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {activeSlotIndex && (
                        <code className="text-xs font-mono text-cyan bg-cyan/10 border border-cyan/20 rounded px-2 py-0.5">
                            showing slot {String(activeSlotIndex).padStart(2, "0")} keys
                        </code>
                    )}
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </div>
            </button>

            {open && (
                <div className="border-t border-[#2a2a2d]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#131314] border-b border-[#2a2a2d]">
                                    {["Section", "Keys", "Prefix Type", "Description", "Example Keys"].map((h) => (
                                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2a2d]">
                                {TEMPLATE_SECTIONS.map((s) => {
                                    const badge = PREFIX_BADGE[s.prefixType];
                                    const example = s.keyPattern(basePrefix, slotPrefix);
                                    return (
                                        <tr key={s.section} className="hover:bg-[#202022] transition-colors">
                                            <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                                                {s.name}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums font-semibold text-cyan whitespace-nowrap">
                                                {s.count}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.cls}`}>
                                                    <Tag className="w-3 h-3" />
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs max-w-xs">
                                                {s.desc}
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="text-xs font-mono text-gray-300 bg-[#0e0e0f] border border-[#2a2a2d] rounded px-2 py-1 whitespace-nowrap">
                                                    {example}
                                                </code>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#131314] border-t border-[#2a2a2d]">
                                    <td className="px-4 py-2.5 font-semibold text-white text-sm">Total</td>
                                    <td className="px-4 py-2.5 font-bold text-cyan text-sm">195</td>
                                    <td colSpan={3} className="px-4 py-2.5 text-xs text-gray-500">
                                        <strong className="text-gray-400">prefixed</strong> = always uses slot prefix (03_/04_/…) &nbsp;|&nbsp;
                                        <strong className="text-gray-400">base</strong> = no prefix on slot 03, slot prefix on 04–12 &nbsp;|&nbsp;
                                        <strong className="text-gray-400">mixed</strong> = entries of both types in this section
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Push Value Panel ────────────────────────────────────────────────────────

function PushValuePanel({ mode, selectedUser, activeLocationId }) {
    const [values, setValues] = useState([]);
    const [cvLoading, setCvLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedValue, setSelectedValue] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [pushing, setPushing] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        const hasTarget = mode === "direct" ? activeLocationId : selectedUser;
        if (!hasTarget) return;
        setCvLoading(true);
        setValues([]);
        setSelectedValue(null);
        fetchWithAuth("/api/admin/ghl-custom-values", {
            method: "POST",
            body: JSON.stringify({
                action: "list_values",
                ...(activeLocationId ? { location_id: activeLocationId } : { userId: selectedUser?.id }),
            }),
        })
            .then((r) => r.json())
            .then((d) => { if (d.values) setValues(d.values); })
            .catch(console.error)
            .finally(() => setCvLoading(false));
    }, [mode, selectedUser, activeLocationId]);

    const filtered = values.filter(
        (v) => !searchQuery || v.ghl_key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePush = async () => {
        if (!selectedValue || pushing) return;
        setPushing(true);
        try {
            const res = await fetchWithAuth("/api/admin/ghl-custom-values", {
                method: "POST",
                body: JSON.stringify({
                    action: "push_value",
                    ...(activeLocationId ? { location_id: activeLocationId } : { userId: selectedUser?.id }),
                    ghl_id: selectedValue.ghl_id,
                    ghl_key: selectedValue.ghl_key,
                    value: inputValue,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Push failed");
            toast.success(`Pushed "${selectedValue.ghl_key}"`);
            setInputValue("");
        } catch (err) {
            toast.error(err.message || "Push failed");
        } finally {
            setPushing(false);
        }
    };

    return (
        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2a2a2d] flex items-center gap-3">
                <Send className="w-4 h-4 text-cyan" />
                <div>
                    <span className="text-sm font-semibold text-white">
                        Push Value to Custom Value
                    </span>
                    <span className="ml-3 text-xs text-gray-500">
                        {cvLoading ? "Loading…" : `${values.length} keys available`}
                    </span>
                </div>
            </div>
            <div className="p-5 space-y-4">
                {/* Key selector */}
                <div ref={panelRef} className="relative">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Custom Value Key
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={cvLoading ? "Loading keys…" : "Search for a key…"}
                            value={selectedValue ? selectedValue.ghl_key : searchQuery}
                            onChange={(e) => {
                                setSelectedValue(null);
                                setSearchQuery(e.target.value);
                                setDropdownOpen(true);
                            }}
                            onFocus={() => setDropdownOpen(true)}
                            className="w-full pl-9 pr-10 py-2.5 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors font-mono text-sm"
                        />
                        {selectedValue && (
                            <button
                                onClick={() => { setSelectedValue(null); setSearchQuery(""); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        )}
                    </div>
                    {dropdownOpen && !selectedValue && (
                        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-[#131314] border border-[#2a2a2d] rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-gray-500">
                                    {cvLoading ? "Loading…" : "No keys found"}
                                </div>
                            ) : (
                                filtered.slice(0, 60).map((v) => (
                                    <button
                                        key={`${v.slot_index}-${v.ghl_key}`}
                                        onClick={() => {
                                            setSelectedValue(v);
                                            setSearchQuery("");
                                            setDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1b1b1d] transition-colors text-left"
                                    >
                                        <span className="text-xs font-mono text-cyan shrink-0 w-6 text-right">
                                            {String(v.slot_index).padStart(2, "0")}
                                        </span>
                                        <span className="text-xs font-mono text-gray-300 truncate flex-1">
                                            {v.ghl_key}
                                        </span>
                                        <span className="text-xs text-gray-600 shrink-0">
                                            {v.section}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Value textarea */}
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Value
                    </label>
                    <textarea
                        rows={3}
                        placeholder="Enter the value to push to GHL…"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors text-sm resize-none"
                    />
                </div>

                <button
                    onClick={handlePush}
                    disabled={!selectedValue || pushing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {pushing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    {pushing ? "Pushing…" : "Push Value"}
                </button>
            </div>
        </div>
    );
}

// ── Default Colors Panel ─────────────────────────────────────────────────────

const DEFAULT_COLORS = {
    primary: "#1A1A2E",
    secondary: "#16213E",
    tertiary: "#0F3460",
};

const COLOR_ROWS = [
    { key: "primary",   label: "Primary",   desc: "Backgrounds, headers, CTAs" },
    { key: "secondary", label: "Secondary", desc: "Alternating backgrounds" },
    { key: "tertiary",  label: "Tertiary",  desc: "Text colors, accents" },
];

function DefaultColorsPanel({ mode, selectedUser, activeLocationId }) {
    const [colors, setColors] = useState(DEFAULT_COLORS);
    const [pushing, setPushing] = useState(false);
    const [result, setResult] = useState(null);

    const setColor = (key, val) => setColors((prev) => ({ ...prev, [key]: val }));

    const handlePush = async () => {
        if (pushing) return;
        setPushing(true);
        setResult(null);
        try {
            const res = await fetchWithAuth("/api/admin/ghl-custom-values", {
                method: "POST",
                body: JSON.stringify({
                    action: "push_default_colors",
                    ...(activeLocationId ? { location_id: activeLocationId } : { userId: selectedUser?.id }),
                    primary: colors.primary,
                    secondary: colors.secondary,
                    tertiary: colors.tertiary,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Push failed");
            setResult(data);
            toast.success(`Colors pushed to ${data.updated} custom value${data.updated !== 1 ? "s" : ""}`);
        } catch (err) {
            toast.error(err.message || "Push failed");
        } finally {
            setPushing(false);
        }
    };

    return (
        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2a2a2d] flex items-center gap-3">
                <Palette className="w-4 h-4 text-cyan" />
                <div>
                    <span className="text-sm font-semibold text-white">
                        Default Brand Colors
                    </span>
                    <span className="ml-3 text-xs text-gray-500">
                        One-click push to primary, secondary &amp; tertiary across all slots
                    </span>
                </div>
            </div>
            <div className="p-5 space-y-5">
                <div className="space-y-3">
                    {COLOR_ROWS.map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center gap-4">
                            <div className="w-28 shrink-0">
                                <p className="text-sm font-semibold text-white">{label}</p>
                                <p className="text-xs text-gray-500">{desc}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-1">
                                {/* Native color picker */}
                                <label className="relative cursor-pointer">
                                    <input
                                        type="color"
                                        value={colors[key]}
                                        onChange={(e) => setColor(key, e.target.value)}
                                        className="sr-only"
                                    />
                                    <div
                                        className="w-9 h-9 rounded-lg border-2 border-[#2a2a2d] hover:border-cyan transition-colors"
                                        style={{ backgroundColor: colors[key] }}
                                    />
                                </label>
                                {/* Hex text input */}
                                <input
                                    type="text"
                                    value={colors[key]}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColor(key, v);
                                    }}
                                    maxLength={7}
                                    placeholder="#000000"
                                    className="w-28 px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white focus:outline-none focus:border-cyan transition-colors font-mono text-sm"
                                />
                                <button
                                    onClick={() => setColor(key, DEFAULT_COLORS[key])}
                                    className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
                                    title="Reset to default"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {result && (
                    <div
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
                            result.failed > 0
                                ? "bg-orange-500/10 border-orange-500/30 text-orange-200"
                                : "bg-green-500/10 border-green-500/30 text-green-200"
                        }`}
                    >
                        {result.failed > 0 ? (
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                        ) : (
                            <CheckCircle className="w-4 h-4 shrink-0" />
                        )}
                        Updated {result.updated}/{result.total} color values
                        {result.failed > 0 && ` · ${result.failed} failed`}
                    </div>
                )}

                <button
                    onClick={handlePush}
                    disabled={pushing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {pushing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Palette className="w-4 h-4" />
                    )}
                    {pushing ? "Pushing colors…" : "Push colors to all slots"}
                </button>
            </div>
        </div>
    );
}

// ── Baked Booking Funnel Panel ───────────────────────────────────────────────

const BAKE_PAGE_LABEL = { landing: "Landing", calendar: "Calendar", thankYou: "Thank You" };

function BakedFunnelPanel({ locationId }) {
    const [grouped, setGrouped] = useState([]);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState(null);
    const [slot, setSlot] = useState("");
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [result, setResult] = useState(null);

    // Fetch the key list from the server so what we SHOW always matches what the
    // bake produces (the names are derived from the renderers, never hardcoded here).
    // Re-fetches when the slot changes: blank → 11 baked test keys; N → full 117-key set.
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const q = slot.trim() ? `&slot=${Number(slot.trim())}` : "";
        fetchWithAuth(`/api/admin/bake-funnel/create-values?funnelType=booking${q}`)
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                setGrouped(d.grouped || []);
                setCounts(d.counts || null);
                if (typeof d.total === "number") setTotal(d.total);
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [slot]);

    const handleCreate = async () => {
        if (creating || !locationId) return;
        setCreating(true);
        setResult(null);
        try {
            const res = await fetchWithAuth("/api/admin/bake-funnel/create-values", {
                method: "POST",
                body: JSON.stringify({ locationId, funnelType: "booking", slot: slot.trim() ? Number(slot.trim()) : undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Create failed");
            setResult(data);
            toast.success(`Booking funnel: ${data.created} created, ${data.updated} updated`);
        } catch (err) {
            toast.error(err.message || "Create failed");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2a2a2d] flex items-center gap-3">
                <Layers className="w-4 h-4 text-cyan" />
                <div>
                    <span className="text-sm font-semibold text-white">
                        Baked Booking Funnel — Custom Values
                    </span>
                    <span className="ml-3 text-xs text-gray-500">
                        {loading ? "Loading…" : slot.trim()
                            ? `${total} values · slot ${Number(slot.trim())} · {NN}_abfv2_ prefixed`
                            : `${total} baked values · un-prefixed test`}
                    </span>
                </div>
            </div>
            <div className="p-5 space-y-4">
                {/* Slot selector — blank = 11 baked un-prefixed; N = full 117-key {NN}_abfv2_ set */}
                <label className="block text-xs font-semibold text-gray-400">
                    Slot # <span className="text-gray-600">(blank = 11 baked test keys · N = full 117-key abfv2 set)</span>
                    <input type="number" min="1" max="99" value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        placeholder="e.g. 1"
                        className="w-28 mt-1 block bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan" />
                </label>

                {counts && slot.trim() && (
                    <div className="text-xs text-gray-400">
                        Slot {Number(slot.trim())}: <b className="text-white">{counts.total}</b> values —{" "}
                        {counts.funnelHtml} baked · {counts.emails} emails · {counts.sms} sms · {counts.appointmentReminders} reminders · {counts.company} company
                    </div>
                )}

                {/* Per-page breakdown: which value goes into GHL's CSS editor vs the code element */}
                <div className="space-y-3">
                    {grouped.map((g) => (
                        <div key={g.page} className="rounded-xl border border-[#2a2a2d] bg-[#0e0e0f] p-3">
                            <p className="text-xs font-semibold text-white mb-2">
                                {BAKE_PAGE_LABEL[g.page] || g.page}
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase tracking-wider text-purple-300 mb-1">
                                        → CSS editor
                                    </p>
                                    {g.css.map((k) => (
                                        <code key={k} className="block text-xs font-mono text-gray-300">{k}</code>
                                    ))}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase tracking-wider text-blue-300 mb-1">
                                        → code element ({g.html.length})
                                    </p>
                                    {g.html.map((k) => (
                                        <code key={k} className="block text-xs font-mono text-gray-300">{k}</code>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleCreate}
                    disabled={creating || !locationId}
                    title={locationId ? "Create all booking funnel custom values in this location" : "Select a location first"}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creating ? "Creating…" : `Create ${total || ""} custom values`}
                </button>

                <CreateResult result={result} onDismiss={() => setResult(null)} />
            </div>
        </div>
    );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminGHLCustomValues() {
    // Mode: 'user' | 'direct'
    const [mode, setMode] = useState("user");

    // User search state
    const [searchInput, setSearchInput] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const debounceRef = useRef(null);
    const searchRef = useRef(null);

    // Selected user state
    const [selectedUser, setSelectedUser] = useState(null);

    // Direct location state
    const [locationInput, setLocationInput] = useState("");
    const [activeLocationId, setActiveLocationId] = useState(null);

    // Slot data state
    const [slotData, setSlotData] = useState(null);
    const [slotLoading, setSlotLoading] = useState(false);
    const [slotError, setSlotError] = useState(null);
    const [backfillingAll, setBackfillingAll] = useState(false);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e) {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Debounced user search via existing admin/users endpoint
    const handleSearchChange = (value) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setSearchResults([]);
            setDropdownOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const params = new URLSearchParams({ search: value, limit: "10" });
                const res = await fetchWithAuth(`/api/admin/users?${params}`);
                if (!res.ok) throw new Error("Search failed");
                const data = await res.json();
                setSearchResults(data.users || []);
                setDropdownOpen(true);
            } catch (err) {
                console.error("User search error:", err);
                toast.error("User search failed");
            } finally {
                setSearchLoading(false);
            }
        }, 350);
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        setSearchInput(`${user.full_name || user.email} — ${user.email}`);
        setDropdownOpen(false);
        setSearchResults([]);
    };

    const clearUser = () => {
        setSelectedUser(null);
        setSearchInput("");
        setSlotData(null);
        setSlotError(null);
    };

    const clearLocation = () => {
        setActiveLocationId(null);
        setLocationInput("");
        setSlotData(null);
        setSlotError(null);
    };

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setSlotData(null);
        setSlotError(null);
    };

    // Load slot data whenever a user or direct location is selected
    const loadSlots = useCallback(async () => {
        const param = mode === "direct"
            ? (activeLocationId ? `locationId=${activeLocationId}` : null)
            : (selectedUser ? `userId=${selectedUser.id}` : null);
        if (!param) return;
        setSlotLoading(true);
        setSlotError(null);
        try {
            const res = await fetchWithAuth(
                `/api/admin/ghl-custom-values?${param}&_t=${Date.now()}`,
                { cache: "no-store" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load slots");
            setSlotData(data);
        } catch (err) {
            console.error("Load slots error:", err);
            setSlotError(err.message);
            toast.error(err.message || "Failed to load slot data");
        } finally {
            setSlotLoading(false);
        }
    }, [selectedUser, activeLocationId, mode]);

    useEffect(() => {
        loadSlots();
    }, [loadSlots]);

    const handleBackfillAllSlots = async () => {
        if (backfillingAll) return;
        if (mode === "user" && !selectedUser?.id) return;
        if (mode === "direct" && !activeLocationId) return;

        setBackfillingAll(true);
        try {
            const res = await fetchWithAuth("/api/admin/ghl-custom-values", {
                method: "POST",
                body: JSON.stringify({
                    action: "create_all_slots",
                    ...(mode === "direct"
                        ? { location_id: activeLocationId }
                        : { userId: selectedUser.id }),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Backfill failed");
            }
            toast.success(
                `Backfilled slots 04-12: ${data.created} missing keys created`
            );
            await loadSlots();
        } catch (err) {
            console.error("Backfill all slots error:", err);
            toast.error(err.message || "Failed to backfill slots");
        } finally {
            setBackfillingAll(false);
        }
    };

    // Summary stats derived from slot data
    const stats = slotData
        ? {
              active: slotData.slots.filter((s) => s.status === "active")
                  .length,
              partial: slotData.slots.filter((s) => s.status === "partial")
                  .length,
              not_created: slotData.slots.filter(
                  (s) => s.status === "not_created"
              ).length,
              total: slotData.slots.length,
          }
        : null;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold mb-1">
                            GHL Custom Value Groups
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Bulk-create slot custom values in GHL for any user
                            (slots 03–12, 195 keys each). Slot 03 is already
                            mapped in the codebase — create slots 04–12 for
                            higher-tier users.
                        </p>
                    </div>
                    {selectedUser && slotData && (
                        <button
                            onClick={loadSlots}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg transition-colors border border-[#2a2a2d] text-sm"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    slotLoading ? "animate-spin" : ""
                                }`}
                            />
                            Refresh
                        </button>
                    )}
                </div>

                {/* ── Mode Toggle ── */}
                <div className="flex gap-2 p-1 bg-[#0e0e0f] rounded-xl border border-[#2a2a2d] w-fit">
                    {["user", "direct"].map((m) => (
                        <button
                            key={m}
                            onClick={() => handleModeSwitch(m)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                mode === m
                                    ? "bg-cyan/10 text-cyan border border-cyan/30"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            {m === "user" ? "Search User" : "Direct Location ID"}
                        </button>
                    ))}
                </div>

                {/* ── User Search (user mode) ── */}
                {mode === "user" && <div
                    className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-5"
                    ref={searchRef}
                >
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Search User
                    </label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={searchInput}
                            onChange={(e) =>
                                handleSearchChange(e.target.value)
                            }
                            onFocus={() => {
                                if (searchResults.length > 0)
                                    setDropdownOpen(true);
                            }}
                            className="w-full pl-11 pr-10 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
                        />
                        {/* Right side: loading spinner / clear button */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {searchLoading && (
                                <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                            )}
                            {selectedUser && (
                                <button
                                    onClick={clearUser}
                                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                    title="Clear selection"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown */}
                        {dropdownOpen && searchResults.length > 0 && (
                            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#131314] border border-[#2a2a2d] rounded-xl shadow-2xl overflow-hidden">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => selectUser(user)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1b1b1d] transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4 text-cyan" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {user.full_name || "No name"}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        {user.business_name && (
                                            <span className="ml-auto text-xs text-cyan shrink-0 truncate max-w-[120px]">
                                                {user.business_name}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {dropdownOpen &&
                            !searchLoading &&
                            searchResults.length === 0 && (
                                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#131314] border border-[#2a2a2d] rounded-xl shadow-2xl px-4 py-6 text-center text-sm text-gray-500">
                                    No users found
                                </div>
                            )}
                    </div>

                    {/* Selected user info pill */}
                    {selectedUser && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-cyan/5 border border-cyan/20 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-cyan" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate">
                                    {selectedUser.full_name || "No name"}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {selectedUser.email}
                                </p>
                            </div>
                            {slotData?.location_id && (
                                <div className="shrink-0">
                                    <code className="text-xs font-mono text-gray-400 bg-[#0e0e0f] border border-[#2a2a2d] rounded px-2 py-1">
                                        {slotData.location_id}
                                    </code>
                                </div>
                            )}
                        </div>
                    )}
                </div>}

                {/* ── Direct Location Input (direct mode) ── */}
                {mode === "direct" && (
                    <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-5">
                        <label className="block text-sm font-semibold text-gray-300 mb-3">
                            GHL Location ID
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="e.g. AbCdEfGhIjKlMnOpQrSt"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && locationInput.trim()) {
                                        setActiveLocationId(locationInput.trim());
                                    }
                                }}
                                className="flex-1 px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors font-mono text-sm"
                            />
                            <button
                                onClick={() => {
                                    if (locationInput.trim()) setActiveLocationId(locationInput.trim());
                                }}
                                disabled={!locationInput.trim()}
                                className="px-5 py-3 rounded-xl bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Load Slots
                            </button>
                            {activeLocationId && (
                                <button
                                    onClick={clearLocation}
                                    className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                                    title="Clear"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                        {activeLocationId && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                <Database className="w-3.5 h-3.5 text-cyan" />
                                <span>Active location:</span>
                                <code className="font-mono text-cyan">{activeLocationId}</code>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Slot data section ── */}
                {(mode === "user" ? selectedUser : activeLocationId) && (
                    <>
                        {/* Summary stat cards */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#1b1b1d] rounded-xl p-4 border border-green-500/20 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />{" "}
                                            Active
                                        </p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {stats.active}
                                        </p>
                                    </div>
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <CheckCircle className="w-16 h-16 text-green-500" />
                                    </div>
                                </div>
                                <div className="bg-[#1b1b1d] rounded-xl p-4 border border-yellow-500/20 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-yellow-400 text-sm font-medium flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />{" "}
                                            Partial
                                        </p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {stats.partial}
                                        </p>
                                    </div>
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <AlertTriangle className="w-16 h-16 text-yellow-500" />
                                    </div>
                                </div>
                                <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d] relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />{" "}
                                            Not Created
                                        </p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {stats.not_created}
                                        </p>
                                    </div>
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <XCircle className="w-16 h-16 text-gray-500" />
                                    </div>
                                </div>
                                <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d] relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                            <Database className="w-4 h-4" />{" "}
                                            Total Slots
                                        </p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {stats.total}
                                        </p>
                                    </div>
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <Database className="w-16 h-16 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {slotData && (
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-cyan/20 bg-cyan/5 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Backfill legacy slots to the current 195-key template
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Adds only missing keys for slots 04-12 and skips slot 03, so it is safe to rerun after partial failures.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBackfillAllSlots}
                                    disabled={backfillingAll || slotLoading}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition-all hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {backfillingAll ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                    {backfillingAll ? "Backfilling..." : "Backfill Slots 04-12"}
                                </button>
                            </div>
                        )}

                        {/* Slot table */}
                        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] overflow-hidden">
                            {slotLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                                </div>
                            ) : slotError ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-3">
                                    <XCircle className="w-8 h-8 text-red-400" />
                                    <p className="text-sm text-red-400">
                                        {slotError}
                                    </p>
                                    <button
                                        onClick={loadSlots}
                                        className="text-sm text-cyan hover:underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : slotData ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#2a2a2d] bg-[#131314]">
                                                {[
                                                    "Slot",
                                                    "Prefix",
                                                    "Keys Created",
                                                    "Status",
                                                    "Created",
                                                    "Actions",
                                                ].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2a2a2d]">
                                            {slotData.slots.map((slot) => (
                                                <SlotRow
                                                    key={slot.slot_index}
                                                    slot={slot}
                                                    userId={mode === "user" ? selectedUser?.id : undefined}
                                                    locationId={mode === "direct" ? activeLocationId : undefined}
                                                    onRefresh={loadSlots}
                                                />
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Table footer note */}
                                    <div className="px-4 py-3 border-t border-[#2a2a2d] bg-[#131314]">
                                        <p className="text-xs text-gray-500">
                                            Slots 03–12 &nbsp;&bull;&nbsp; 195
                                            custom values per slot &nbsp;&bull;&nbsp;
                                            Slot 03 hardcoded in codebase &nbsp;&bull;&nbsp;
                                            100 ms rate-limit delay with 429
                                            back-off
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Key template breakdown */}
                        <KeyTemplatePanel activeSlotIndex={slotData?.slots?.find(s => s.status === "active" && s.slot_index !== 3)?.slot_index ?? null} />

                        {/* Push value to any custom value */}
                        <PushValuePanel
                            mode={mode}
                            selectedUser={selectedUser}
                            activeLocationId={activeLocationId}
                        />

                        {/* Default brand colors — push to all slots */}
                        <DefaultColorsPanel
                            mode={mode}
                            selectedUser={selectedUser}
                            activeLocationId={activeLocationId}
                        />

                        {/* Baked booking funnel — one-click create its custom values */}
                        <BakedFunnelPanel
                            locationId={mode === "direct" ? activeLocationId : slotData?.location_id}
                        />

                        {/* No GHL subaccount warning */}
                        {slotData && !slotData.location_id && (
                            <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-sm text-orange-200">
                                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold text-orange-300 mb-0.5">
                                        No GHL sub-account found
                                    </p>
                                    <p>
                                        This user does not have a GHL location
                                        linked. Create a sub-account for them
                                        first via{" "}
                                        <a
                                            href="/admin/ghl-accounts"
                                            className="underline hover:text-white transition-colors"
                                        >
                                            GHL Sub-Accounts
                                        </a>{" "}
                                        before bulk-creating custom values.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── Empty state ── */}
                {(mode === "user" ? !selectedUser : !activeLocationId) && (
                    <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                            <Database className="w-8 h-8 text-cyan" />
                        </div>
                        <div>
                            <p className="text-white font-semibold mb-1">
                                {mode === "user" ? "Select a user to get started" : "Enter a Location ID to get started"}
                            </p>
                            <p className="text-gray-500 text-sm max-w-sm">
                                {mode === "user"
                                    ? "Search for a user by name or email above, then view and manage their GHL custom value slot groups."
                                    : "Paste a GHL location ID above and click Load Slots to manage custom values for that location directly."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
