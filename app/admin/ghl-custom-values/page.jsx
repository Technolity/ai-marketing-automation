"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    Plus, Trash2, Send, Loader2, CheckCircle, XCircle,
    AlertTriangle, FileJson, List, Download, RefreshCw, Copy
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { T as _T, cardStyle, RADIUS } from "@/components/admin/adminTheme";

const T = {
    cardBg: _T.card, surface: _T.panel, border: _T.border,
    cyan: _T.cyan, primary: _T.textPrimary, secondary: _T.textSecondary,
    muted: _T.textMuted, success: _T.green, warning: _T.amber,
    danger: _T.red, purple: _T.purple,
};

function ActionBtn({ onClick, disabled, title, color = T.cyan, children, label }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button onClick={onClick} disabled={disabled} title={title}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: label ? "10px 20px" : "10px 12px", borderRadius: 10,
                border: `1px solid ${hovered && !disabled ? color : T.border}`,
                cursor: disabled ? "not-allowed" : "pointer", color,
                opacity: disabled ? 0.5 : 1, fontSize: 13, fontWeight: 600,
                backgroundColor: hovered && !disabled ? `${color}12` : T.cardBg,
                transition: "all 0.15s ease",
            }}>
            {children}{label && <span>{label}</span>}
        </button>
    );
}

function InputField({ label, value, onChange, placeholder, mono, style: extraStyle }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, ...extraStyle }}>
            {label && <label style={{ color: T.secondary, fontSize: 12, fontWeight: 600 }}>{label}</label>}
            <input type="text" value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: "100%", boxSizing: "border-box", padding: "10px 14px",
                    backgroundColor: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, color: T.primary, fontSize: 13, outline: "none",
                    fontFamily: mono ? "monospace" : "inherit",
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.cyan}
                onBlur={e => e.currentTarget.style.borderColor = T.border} />
        </div>
    );
}

export default function AdminGHLCustomValues() {
    const { session } = useAuth();
    const [locationId, setLocationId] = useState("");
    const [activeTab, setActiveTab] = useState("builder"); // builder | json
    const [rows, setRows] = useState([{ key: "", value: "" }]);
    const [jsonInput, setJsonInput] = useState("");
    const [isPushing, setIsPushing] = useState(false);
    const [results, setResults] = useState(null);
    const [history, setHistory] = useState([]);

    const addRow = () => setRows(prev => [...prev, { key: "", value: "" }]);
    const removeRow = (idx) => setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
    const updateRow = (idx, field, val) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

    const getCustomValues = useCallback(() => {
        if (activeTab === "json") {
            try {
                const parsed = JSON.parse(jsonInput);
                if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Must be a JSON object");
                return parsed;
            } catch (err) {
                toast.error(`Invalid JSON: ${err.message}`);
                return null;
            }
        }
        const validRows = rows.filter(r => r.key.trim());
        if (validRows.length === 0) { toast.error("Add at least one key-value pair"); return null; }
        const obj = {};
        validRows.forEach(r => { obj[r.key.trim()] = r.value; });
        return obj;
    }, [activeTab, jsonInput, rows]);

    const handlePush = async () => {
        if (!locationId.trim()) { toast.error("Enter a GHL Location ID"); return; }
        const customValues = getCustomValues();
        if (!customValues) return;
        const keyCount = Object.keys(customValues).length;
        setIsPushing(true); setResults(null);
        try {
            const response = await fetchWithAuth("/api/admin/ghl-custom-values/bulk-create", {
                method: "POST",
                body: JSON.stringify({ locationId: locationId.trim(), customValues }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Push failed");
            setResults(data);
            setHistory(prev => [{ locationId: locationId.trim(), timestamp: new Date().toISOString(),
                total: data.total, created: data.created, updated: data.updated, failed: data.failed,
                results: data.results || [] }, ...prev.slice(0, 19)]);
            if (data.created > 0 || data.updated > 0) toast.success(`${data.created} created, ${data.updated} updated`);
            if (data.failed > 0) toast.warning(`${data.failed} failed`);
        } catch (err) { toast.error(err.message); }
        finally { setIsPushing(false); }
    };

    const handleExportResults = () => {
        if (!results?.results) return;
        const exportData = results.results.map(r => ({
            key: r.key, ghl_id: r.ghlId || "N/A", action: r.action,
            success: r.success, error: r.error || null,
        }));
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `ghl-custom-values-${locationId}-${Date.now()}.json`;
        a.click(); URL.revokeObjectURL(url);
        toast.success("Results exported");
    };

    const handleCopyIds = () => {
        if (!results?.results) return;
        const idMap = {};
        results.results.filter(r => r.success && r.ghlId).forEach(r => { idMap[r.key] = r.ghlId; });
        navigator.clipboard.writeText(JSON.stringify(idMap, null, 2));
        toast.success("IDs copied to clipboard");
    };

    const loadTemplateFromMap = () => {
        try {
            const templateRows = [
                { key: "03_optin_headline_text", value: "" },
                { key: "03_optin_subheadline_text", value: "" },
                { key: "03_optin_cta_button_text", value: "" },
                { key: "03_vsl_hero_headline_text", value: "" },
                { key: "03_vsl_hero_subheadline_text", value: "" },
                { key: "03_vsl_cta_text", value: "" },
                { key: "03_vsl_bio_headline_text", value: "" },
                { key: "03_vsl_bio_paragraph_text", value: "" },
                { key: "03_calender_page_headline", value: "" },
                { key: "03_thankyou_page_headline", value: "" },
            ];
            setRows(templateRows);
            setActiveTab("builder");
            toast.success("Template loaded — fill in the values");
        } catch { toast.error("Failed to load template"); }
    };

    const STAT_CARDS = results ? [
        { label: "Created", value: results.created || 0, color: T.success, icon: Plus },
        { label: "Updated", value: results.updated || 0, color: T.cyan, icon: RefreshCw },
        { label: "Failed", value: results.failed || 0, color: T.danger, icon: XCircle },
        { label: "Total", value: results.total || 0, color: T.secondary, icon: CheckCircle },
    ] : null;

    return (
        <AdminLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 3, height: 22, backgroundColor: T.purple, borderRadius: 2 }} />
                            <h1 style={{ color: T.primary, fontSize: 22, fontWeight: 700, margin: 0 }}>GHL Custom Values</h1>
                        </div>
                        <p style={{ color: T.secondary, fontSize: 13, marginLeft: 11 }}>Bulk create or update custom values in any GHL sub-account.</p>
                    </div>
                    <ActionBtn onClick={loadTemplateFromMap} title="Load standard 03_ keys" color={T.purple} label="Load Template">
                        <FileJson style={{ width: 14, height: 14 }} />
                    </ActionBtn>
                </div>

                {/* Location ID Input */}
                <div style={{ ...cardStyle, padding: 24 }}>
                    <InputField label="GHL Location ID" value={locationId} onChange={setLocationId}
                        placeholder="e.g. nGGnFrvFOelEOy2kjFlo" mono />
                    <p style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>
                        Find this in the GHL dashboard URL: app.gohighlevel.com/location/<strong style={{ color: T.cyan }}>LOCATION_ID</strong>/dashboard
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, backgroundColor: T.surface, borderRadius: 12, padding: 4, border: `1px solid ${T.border}` }}>
                    {[{ id: "builder", label: "Visual Builder", icon: List }, { id: "json", label: "JSON Input", icon: FileJson }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                                fontSize: 13, fontWeight: 600, transition: "all 0.15s ease",
                                backgroundColor: activeTab === tab.id ? T.cardBg : "transparent",
                                color: activeTab === tab.id ? T.cyan : T.muted,
                                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                            }}>
                            <tab.icon style={{ width: 14, height: 14 }} />{tab.label}
                        </button>
                    ))}
                </div>

                {/* Builder Tab */}
                {activeTab === "builder" && (
                    <div style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: T.secondary, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                Key-Value Pairs ({rows.filter(r => r.key.trim()).length})
                            </span>
                            <ActionBtn onClick={addRow} color={T.success} title="Add row">
                                <Plus style={{ width: 14, height: 14 }} />
                            </ActionBtn>
                        </div>
                        <div style={{ display: "flex", gap: 12, padding: "8px 0" }}>
                            <span style={{ flex: 1, color: T.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Custom Value Name</span>
                            <span style={{ flex: 2, color: T.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Value</span>
                            <span style={{ width: 36 }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                            {rows.map((row, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <input type="text" value={row.key} onChange={e => updateRow(idx, "key", e.target.value)}
                                        placeholder="03_optin_headline_text"
                                        style={{
                                            flex: 1, padding: "9px 12px", backgroundColor: T.surface,
                                            border: `1px solid ${T.border}`, borderRadius: 8, color: T.primary,
                                            fontSize: 12, fontFamily: "monospace", outline: "none", boxSizing: "border-box",
                                        }}
                                        onFocus={e => e.currentTarget.style.borderColor = T.cyan}
                                        onBlur={e => e.currentTarget.style.borderColor = T.border} />
                                    <input type="text" value={row.value} onChange={e => updateRow(idx, "value", e.target.value)}
                                        placeholder="Enter value..."
                                        style={{
                                            flex: 2, padding: "9px 12px", backgroundColor: T.surface,
                                            border: `1px solid ${T.border}`, borderRadius: 8, color: T.primary,
                                            fontSize: 13, outline: "none", boxSizing: "border-box",
                                        }}
                                        onFocus={e => e.currentTarget.style.borderColor = T.cyan}
                                        onBlur={e => e.currentTarget.style.borderColor = T.border} />
                                    <button onClick={() => removeRow(idx)} title="Remove"
                                        style={{
                                            width: 36, height: 36, borderRadius: 8, border: "none",
                                            backgroundColor: "transparent", color: T.danger, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            opacity: rows.length <= 1 ? 0.3 : 1,
                                        }}>
                                        <Trash2 style={{ width: 14, height: 14 }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* JSON Tab */}
                {activeTab === "json" && (
                    <div style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                        <span style={{ color: T.secondary, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            Paste JSON Object
                        </span>
                        <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)}
                            placeholder={'{\n  "03_optin_headline_text": "Your headline here",\n  "03_optin_subheadline_text": "Your subheadline"\n}'}
                            rows={14}
                            style={{
                                width: "100%", boxSizing: "border-box", padding: 16,
                                backgroundColor: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 12, color: T.primary, fontSize: 13,
                                fontFamily: "monospace", lineHeight: 1.6, outline: "none", resize: "vertical",
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = T.cyan}
                            onBlur={e => e.currentTarget.style.borderColor = T.border} />
                    </div>
                )}

                {/* Push Button */}
                <button onClick={handlePush} disabled={isPushing || !locationId.trim()}
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        padding: "14px 24px", borderRadius: 12, border: "none", cursor: isPushing ? "wait" : "pointer",
                        fontSize: 15, fontWeight: 700, color: "#060B12",
                        background: isPushing ? T.muted : `linear-gradient(135deg, ${T.cyan}, ${T.purple})`,
                        boxShadow: isPushing ? "none" : "0 8px 24px rgba(24,211,246,0.25)",
                        opacity: !locationId.trim() ? 0.5 : 1, transition: "all 0.2s ease",
                    }}>
                    {isPushing ? <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Pushing to GHL...</>
                        : <><Send style={{ width: 18, height: 18 }} /> Push Custom Values to GHL</>}
                </button>

                {/* Results Section */}
                {results && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                            {STAT_CARDS.map(({ label, value, color, icon: Icon }) => (
                                <div key={label} style={{
                                    backgroundColor: T.cardBg, borderRadius: 12, padding: 16,
                                    border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                        <Icon style={{ width: 14, height: 14, color }} />
                                        <span style={{ color: T.secondary, fontSize: 11, fontWeight: 500 }}>{label}</span>
                                    </div>
                                    <p style={{ color: T.primary, fontSize: 24, fontWeight: 700, margin: 0 }}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <ActionBtn onClick={handleExportResults} color={T.cyan} label="Export Results">
                                <Download style={{ width: 14, height: 14 }} />
                            </ActionBtn>
                            <ActionBtn onClick={handleCopyIds} color={T.success} label="Copy ID Map">
                                <Copy style={{ width: 14, height: 14 }} />
                            </ActionBtn>
                        </div>

                        {/* Results table */}
                        <div style={{ ...cardStyle, overflow: "hidden" }}>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.surface }}>
                                            {["Status", "Key", "GHL ID", "Action", "Error"].map(h => (
                                                <th key={h} style={{
                                                    padding: "10px 14px", textAlign: "left", color: T.muted,
                                                    fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em",
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.results.map((r, idx) => (
                                            <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(24,211,246,0.03)"}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                                                <td style={{ padding: "10px 14px" }}>
                                                    {r.success
                                                        ? <CheckCircle style={{ width: 14, height: 14, color: T.success }} />
                                                        : <XCircle style={{ width: 14, height: 14, color: T.danger }} />}
                                                </td>
                                                <td style={{ padding: "10px 14px", color: T.primary, fontSize: 12, fontFamily: "monospace" }}>{r.key}</td>
                                                <td style={{ padding: "10px 14px", color: r.ghlId ? T.cyan : T.muted, fontSize: 11, fontFamily: "monospace" }}>
                                                    {r.ghlId || "—"}
                                                </td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    <span style={{
                                                        display: "inline-flex", padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                                                        backgroundColor: r.action === "created" ? "rgba(49,215,155,0.12)" : r.action === "updated" ? "rgba(24,211,246,0.12)" : "rgba(248,113,113,0.12)",
                                                        color: r.action === "created" ? T.success : r.action === "updated" ? T.cyan : T.danger,
                                                        border: `1px solid ${r.action === "created" ? "rgba(49,215,155,0.25)" : r.action === "updated" ? "rgba(24,211,246,0.25)" : "rgba(248,113,113,0.25)"}`,
                                                    }}>{r.action}</span>
                                                </td>
                                                <td style={{ padding: "10px 14px", color: T.danger, fontSize: 11 }}>{r.error || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* History */}
                {history.length > 0 && (
                    <div style={{ ...cardStyle, padding: 24 }}>
                        <span style={{ color: T.secondary, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "block" }}>
                            Session History
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {history.map((h, idx) => (
                                <div key={idx} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 14px", backgroundColor: T.surface, borderRadius: 10,
                                    border: `1px solid ${T.border}`, fontSize: 12,
                                }}>
                                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <span style={{ color: T.cyan, fontFamily: "monospace" }}>{h.locationId}</span>
                                        <span style={{ color: T.muted }}>{new Date(h.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <span style={{ color: T.success }}>{h.created} created</span>
                                        <span style={{ color: T.cyan }}>{h.updated} updated</span>
                                        {h.failed > 0 && <span style={{ color: T.danger }}>{h.failed} failed</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
