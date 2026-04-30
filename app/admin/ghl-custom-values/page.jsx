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
                                        : "Bulk-create 178 GHL custom values"
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
                            (slots 03–12, 178 keys each). Slot 03 is already
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
                                            Slots 03–12 &nbsp;&bull;&nbsp; 178
                                            custom values per slot &nbsp;&bull;&nbsp;
                                            Slot 03 hardcoded in codebase &nbsp;&bull;&nbsp;
                                            100 ms rate-limit delay with 429
                                            back-off
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

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
