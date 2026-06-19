'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Palette, Check, AlertCircle, X } from 'lucide-react';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { toast } from 'sonner';

const COLOR_NAME_MAP = {
    'red': '#dc2626', 'crimson': '#dc143c', 'scarlet': '#ff2400',
    'blue': '#2563eb', 'navy': '#000080', 'ocean': '#006994', 'royal blue': '#4169e1',
    'green': '#16a34a', 'emerald': '#50c878', 'forest': '#228b22', 'sage': '#9dc183',
    'purple': '#9333ea', 'violet': '#8b00ff', 'lavender': '#e6e6fa',
    'orange': '#ea580c', 'amber': '#ffbf00', 'coral': '#ff7f50',
    'pink': '#ec4899', 'rose': '#ff007f', 'magenta': '#ff00ff', 'dusty rose': '#d4a5a5',
    'gold': '#ffd700', 'yellow': '#eab308', 'sunshine': '#fffd37',
    'teal': '#0891b2', 'turquoise': '#40e0d0', 'cyan': '#00d4ff', 'electric blue': '#7df9ff',
    'black': '#000000', 'charcoal': '#36454f', 'slate': '#708090', 'grey': '#808080', 'gray': '#808080',
    'white': '#ffffff', 'cream': '#fffdd0', 'ivory': '#fffff0',
    'brown': '#8b4513', 'bronze': '#cd7f32', 'tan': '#d2b48c',
    'silver': '#c0c0c0', 'platinum': '#e5e4e2',
    'deep purple': '#5b21b6', 'deep black': '#111827', 'electric green': '#10b981',
    'forest green': '#065f46', 'warm gold': '#d97706', 'cream white': '#fffbeb'
};

function parseColorsFromText(text) {
    if (!text) return [];
    const colors = [];
    const parenHexPattern = /\(#([0-9A-Fa-f]{6})\)/gi;
    let match;
    while ((match = parenHexPattern.exec(text)) !== null) {
        const hex = '#' + match[1].toUpperCase();
        if (!colors.find(c => c.hex === hex)) {
            const beforeParen = text.substring(0, match.index).split(/,|and/).pop().trim();
            colors.push({ name: beforeParen || 'Color', hex });
        }
    }
    const hexPattern = /#[0-9A-Fa-f]{6}/gi;
    (text.match(hexPattern) || []).forEach(hex => {
        const upper = hex.toUpperCase();
        if (!colors.find(c => c.hex === upper)) colors.push({ name: 'Color', hex: upper });
    });
    if (colors.length === 0) {
        const lower = text.toLowerCase();
        for (const [name, hex] of Object.entries(COLOR_NAME_MAP)) {
            if (lower.includes(name))
                colors.push({ name: name.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), hex: hex.toUpperCase() });
        }
    }
    return colors;
}

// ─── Color math ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
    const h = (hex || '#000000').replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16) || 0, g: parseInt(h.slice(2, 4), 16) || 0, b: parseInt(h.slice(4, 6), 16) || 0 };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h, s, v) {
    h /= 60; s /= 100; v /= 100;
    const i = Math.floor(h) % 6, f = h - Math.floor(h),
        p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    const rows = [[v, q, p, p, t, v], [t, v, v, q, p, p], [p, p, t, v, v, q]];
    return { r: rows[0][i] * 255, g: rows[1][i] * 255, b: rows[2][i] * 255 };
}

// ─── Color Picker Popup ────────────────────────────────────────────────────

const SV_W = 224, SV_H = 200, HUE_W = 224, HUE_H = 14;

function ColorPickerPopup({ hex, onChangeHex, onApply, groupRef }) {
    const svRef = useRef(null);
    const hueRef = useRef(null);
    const popupRef = useRef(null);
    const dragging = useRef(null);

    const init = (() => {
        const { r, g, b } = hexToRgb(hex);
        return rgbToHsv(r, g, b);
    })();

    const [hue, setHue] = useState(init.h);
    const [sv, setSv] = useState({ s: init.s, v: init.v });

    // Keep latest onApply in a ref so the outside-click handler (registered once) never goes stale
    const onApplyRef = useRef(onApply);
    useEffect(() => { onApplyRef.current = onApply; }, [onApply]);

    // Draw SV gradient square
    const drawSv = useCallback(() => {
        const ctx = svRef.current?.getContext('2d');
        if (!ctx) return;
        const { r, g, b } = hsvToRgb(hue, 100, 100);
        ctx.clearRect(0, 0, SV_W, SV_H);
        const hGrad = ctx.createLinearGradient(0, 0, SV_W, 0);
        hGrad.addColorStop(0, '#fff');
        hGrad.addColorStop(1, `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`);
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, 0, SV_W, SV_H);
        const vGrad = ctx.createLinearGradient(0, 0, 0, SV_H);
        vGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vGrad.addColorStop(1, '#000');
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, SV_W, SV_H);
    }, [hue]);

    // Draw hue bar (once)
    useEffect(() => {
        const ctx = hueRef.current?.getContext('2d');
        if (!ctx) return;
        const grad = ctx.createLinearGradient(0, 0, HUE_W, 0);
        for (let i = 0; i <= 6; i++) {
            const { r, g, b } = hsvToRgb(i * 60, 100, 100);
            grad.addColorStop(i / 6, `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, HUE_W, HUE_H);
    }, []);

    useEffect(() => { drawSv(); }, [drawSv]);

    // Notify parent of live color changes
    useEffect(() => {
        const { r, g, b } = hsvToRgb(hue, sv.s, sv.v);
        onChangeHex(rgbToHex(r, g, b));
    }, [hue, sv]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pointer event helpers
    const pickSv = useCallback((e) => {
        const canvas = svRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        setSv({
            s: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
            v: Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100)),
        });
    }, []);

    const pickHue = useCallback((e) => {
        const canvas = hueRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        setHue(Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360)));
    }, []);

    // Global pointermove / pointerup while dragging
    useEffect(() => {
        const move = (e) => {
            if (dragging.current === 'sv') pickSv(e);
            else if (dragging.current === 'hue') pickHue(e);
        };
        const up = () => { dragging.current = null; };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    }, [pickSv, pickHue]);

    // Close + save on outside click — registered once, uses ref so it's never stale
    useEffect(() => {
        const handler = (e) => {
            if (groupRef?.current?.contains(e.target)) return; // click inside swatch group = ignore
            if (popupRef.current?.contains(e.target)) return;  // click inside popup = ignore
            onApplyRef.current();
        };
        // Delay to avoid the same mousedown that opened the picker from closing it
        const t = setTimeout(() => document.addEventListener('pointerdown', handler), 100);
        return () => { clearTimeout(t); document.removeEventListener('pointerdown', handler); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Derived values for cursor position (use actual canvas px dimensions)
    const cursorLeft = `${(sv.s / 100) * 100}%`;
    const cursorTop  = `${(1 - sv.v / 100) * 100}%`;
    const hueLeft    = `${(hue / 360) * 100}%`;
    const { r: pr, g: pg, b: pb } = hsvToRgb(hue, sv.s, sv.v);
    const previewHex = rgbToHex(pr, pg, pb);

    return (
        <div
            ref={popupRef}
            className="absolute z-50 rounded-2xl border border-white/10 shadow-2xl p-4 flex flex-col gap-3 select-none"
            style={{ background: '#0D1217', width: 256, top: '110%', left: '50%', transform: 'translateX(-50%)' }}
            onPointerDown={e => e.stopPropagation()} // keep outside-click from firing inside popup
        >
            {/* SV square */}
            <div
                className="relative rounded-xl overflow-hidden cursor-crosshair"
                style={{ width: SV_W, height: SV_H }}
                onPointerDown={(e) => {
                    e.preventDefault();
                    dragging.current = 'sv';
                    pickSv(e);
                    e.currentTarget.setPointerCapture(e.pointerId);
                }}
            >
                <canvas ref={svRef} width={SV_W} height={SV_H} className="block w-full h-full rounded-xl" />
                {/* Circular crosshair */}
                <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                        left: cursorLeft, top: cursorTop,
                        width: 14, height: 14,
                        transform: 'translate(-50%,-50%)',
                        border: '2.5px solid white',
                        boxShadow: '0 0 0 1.5px rgba(0,0,0,0.5)',
                    }}
                />
            </div>

            {/* Hue bar */}
            <div
                className="relative rounded-full overflow-visible cursor-ew-resize"
                style={{ width: HUE_W, height: HUE_H }}
                onPointerDown={(e) => {
                    e.preventDefault();
                    dragging.current = 'hue';
                    pickHue(e);
                    e.currentTarget.setPointerCapture(e.pointerId);
                }}
            >
                <canvas ref={hueRef} width={HUE_W} height={HUE_H} className="block w-full h-full rounded-full" />
                {/* Hue thumb */}
                <div
                    className="absolute top-1/2 pointer-events-none rounded-full"
                    style={{
                        left: hueLeft,
                        transform: 'translate(-50%,-50%)',
                        width: 20, height: 20,
                        border: '3px solid white',
                        boxShadow: '0 0 0 1.5px rgba(0,0,0,0.4)',
                        background: `hsl(${hue},100%,50%)`,
                    }}
                />
            </div>

            {/* Preview + Apply */}
            <div className="flex items-center gap-3 pt-1">
                <div
                    className="w-9 h-9 rounded-lg border border-white/20 flex-shrink-0 shadow-md"
                    style={{ background: previewHex }}
                />
                <span className="text-xs font-mono text-gray-300 flex-1">{previewHex}</span>
                <button
                    onClick={onApplyRef.current}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan/20 text-cyan border border-cyan/30 hover:bg-cyan/30 transition-colors"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────

const SLOT_LABELS = ['Primary', 'Secondary', 'Tertiary'];

export default function ColorsFields({ content, sectionId, funnelId, onSave, isApproved }) {
    const [parsedColors, setParsedColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rawAnswer, setRawAnswer] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);
    const [saving, setSaving] = useState(false);
    const [needsWizardAnswersSync, setNeedsWizardAnswersSync] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [currentContent, setCurrentContent] = useState('');
    const [debugInfo] = useState(null);

    // Always-current ref — avoids stale closures in save callbacks
    const colorsRef = useRef(parsedColors);
    useEffect(() => { colorsRef.current = parsedColors; }, [parsedColors]);

    // Per-swatch group refs (wraps swatch button + popup together)
    const groupRefs = useRef([]);

    // ── Save ─────────────────────────────────────────────────────────────
    const saveColors = useCallback(async (colors) => {
        if (!funnelId || !colors || colors.length === 0) return;
        setSaving(true);
        try {
            const [primary, secondary, tertiary] = colors;
            const colorPaletteObject = {
                primary:   primary   || { name: 'Primary',   hex: '#000000' },
                secondary: secondary || { name: 'Secondary', hex: '#1A1A1A' },
                tertiary:  tertiary  || { name: 'Tertiary',  hex: '#FFFFFF' },
                reasoning: rawAnswer || 'Manually adjusted brand colors',
            };

            // Save to vault_content (also read by push-colors as fallback)
            const sectionRes = await fetch('/api/os/vault-section', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionId: 'colors', funnelId, content: { colorPalette: colorPaletteObject } }),
            });
            if (!sectionRes.ok) {
                const err = await sectionRes.json().catch(() => ({}));
                throw new Error(err.error || 'Vault section save failed');
            }

            // Save to vault_content_fields (primary source for push-colors)
            const fieldsRes = await fetch('/api/os/vault-section-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_id: 'colors', fields: { colorPalette: colorPaletteObject } }),
            });
            if (!fieldsRes.ok) {
                // Non-fatal: vault_content is saved above; push-colors has a fallback for vault_content
                console.warn('[ColorsFields] vault-section-save failed (push-colors will use vault_content fallback):', await fieldsRes.text().catch(() => ''));
            }

            // Lock in the display so a fetchColors re-run won't overwrite the user's choice
            setParsedColors(colors.filter(Boolean));

            if (onSave) onSave({ colorPalette: colorPaletteObject });
            toast.success('Brand color saved');
        } catch (err) {
            console.error('[ColorsFields] saveColors error:', err);
            toast.error('Failed to save color: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [funnelId, rawAnswer, onSave]);

    // Apply = close picker and save the latest colors from the ref (not stale closure)
    const handleApply = useCallback(() => {
        setEditingIndex(null);
        saveColors(colorsRef.current);
    }, [saveColors]);

    // Live color update from picker (no save, just UI update)
    const handlePickerChange = useCallback((idx, hex) => {
        setParsedColors(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], hex };
            return next;
        });
    }, []);

    // ── AI Feedback save ─────────────────────────────────────────────────
    const handleFeedbackSave = async (refinedContent) => {
        try {
            let pal;
            if (typeof refinedContent === 'string' && refinedContent.trim().startsWith('{')) {
                try { pal = JSON.parse(refinedContent.trim()); } catch {}
            } else if (typeof refinedContent === 'object') {
                pal = refinedContent;
            }
            if (!pal?.primary) {
                const ex = parseColorsFromText(refinedContent);
                pal = {
                    primary:   ex[0] || { name: 'Primary',   hex: '#000000' },
                    secondary: ex[1] || { name: 'Secondary', hex: '#6B7280' },
                    tertiary:  ex[2] || { name: 'Tertiary',  hex: '#3B82F6' },
                    reasoning: typeof refinedContent === 'string' ? refinedContent : 'AI-generated palette',
                };
            }
            await fetch('/api/os/vault-section', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionId: 'colors', funnelId, content: { colorPalette: pal } }),
            });
            await fetch('/api/os/vault-section-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_id: 'colors', fields: { colorPalette: pal } }),
            }).catch(() => {});
            const d = [pal.primary, pal.secondary, pal.tertiary].filter(Boolean);
            setParsedColors(d);
            setRawAnswer(pal.reasoning || '');
            setFeedbackModalOpen(false);
            toast.success('Brand colors updated!');
            if (onSave) onSave({ colorPalette: pal });
        } catch (err) {
            toast.error('Failed to save: ' + err.message);
        }
    };

    // ── Data fetching ─────────────────────────────────────────────────────
    useEffect(() => {
        const fetch_ = async () => {
            try {
                // Priority 1: content prop
                if (content && (content.colorPalette || content.primary || content.primaryColor)) {
                    let c = content.colorPalette || content;
                    if (typeof c === 'string') { try { c = JSON.parse(c); } catch {} }
                    if (typeof c === 'object') {
                        const d = [];
                        const p = c.primaryColor || c.primary;    if (p) d.push({ name: p.name, hex: p.hex });
                        const s = c.secondaryColor || c.secondary; if (s) d.push({ name: s.name, hex: s.hex });
                        const t = c.accentColor || c.tertiary;     if (t) d.push({ name: t.name, hex: t.hex });
                        if (d.length > 0) { setParsedColors(d); setRawAnswer(c.reasoning || ''); setLoading(false); return; }
                    }
                }

                // Priority 2: vault fields
                try {
                    const vr = await fetch(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=colors`);
                    if (vr.ok) {
                        const vd = await vr.json();
                        const cf = vd.fields?.find(f => f.field_id === 'colorPalette');
                        let gc = cf?.field_value;
                        if (gc) {
                            if (typeof gc === 'string') { try { gc = JSON.parse(gc); } catch { gc = null; } }
                            if (gc && typeof gc === 'object') {
                                const d = [];
                                const p = gc.primaryColor || gc.primary;    if (p) d.push({ name: p.name, hex: p.hex });
                                const s = gc.secondaryColor || gc.secondary; if (s) d.push({ name: s.name, hex: s.hex });
                                const t = gc.accentColor || gc.tertiary;     if (t) d.push({ name: t.name, hex: t.hex });
                                if (d.length > 0) { setParsedColors(d); setRawAnswer(gc.reasoning || ''); setLoading(false); return; }
                            }
                        }
                    }
                } catch {}

                // Priority 3: questionnaire
                try {
                    const qr = await fetch(`/api/intake-form/answers?funnel_id=${funnelId}`);
                    if (qr.ok) {
                        const qd = await qr.json();
                        const ca = qd.answers?.brandColors || qd.answers?.['21'] || qd.answers?.['15'] || '';
                        if (ca) { setRawAnswer(ca); setParsedColors(parseColorsFromText(ca)); setLoading(false); return; }
                    }
                } catch {}

                // Priority 4: user profile
                const pr = await fetch('/api/user/profile');
                if (pr.ok) {
                    const profile = await pr.json();
                    const ca = profile?.intake_form?.brandColors || profile?.intake_form?.['21'] || profile?.intake_form?.['15'] || '';
                    if (ca) { setRawAnswer(ca); setParsedColors(parseColorsFromText(ca)); }
                }
                setNeedsWizardAnswersSync(true);
            } catch (err) {
                console.error('[ColorsFields] fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        if (funnelId) fetch_(); else setLoading(false);
    }, [funnelId, content]);

    // ── Render ─────────────────────────────────────────────────────────────
    if (loading) {
        return <div className="p-8 text-center text-gray-400 animate-pulse">Loading brand colors...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-cyan" />
                <h4 className="text-lg font-semibold text-white">Your Brand Colors</h4>
                {saving && <span className="text-xs text-gray-500 ml-auto animate-pulse">Saving…</span>}
            </div>

            {debugInfo && (
                <div className="p-4 bg-red-900/20 rounded-xl border border-red-500/30">
                    <p className="text-xs text-red-400">{debugInfo.error}</p>
                </div>
            )}

            {rawAnswer && (
                <div className="p-4 bg-[#1a1a1d] rounded-xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">From your questionnaire:</p>
                    <p className="text-white text-sm italic">"{rawAnswer}"</p>
                </div>
            )}

            {parsedColors.length > 0 ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        {isApproved
                            ? 'Colors are locked while this section is approved. Unapprove the section to edit.'
                            : 'Click any color to edit — drag the picker to any shade'}
                    </p>

                    <div className="flex flex-wrap gap-8">
                        {parsedColors.map((color, index) => (
                            <div
                                key={index}
                                ref={el => { groupRefs.current[index] = { current: el }; }}
                                className="relative flex flex-col items-center gap-2"
                            >
                                {/* Swatch button — locked while the section is approved */}
                                <button
                                    onClick={() => { if (isApproved) return; setEditingIndex(prev => prev === index ? null : index); }}
                                    disabled={isApproved}
                                    className={`group relative w-20 h-20 rounded-2xl border-2 transition-all duration-200 focus:outline-none ${isApproved ? 'cursor-not-allowed' : ''}`}
                                    style={{
                                        backgroundColor: color.hex,
                                        borderColor: editingIndex === index ? '#16C7E7' : 'rgba(255,255,255,0.15)',
                                        boxShadow: editingIndex === index
                                            ? `0 0 0 3px rgba(22,199,231,0.25), 0 6px 24px ${color.hex}66`
                                            : `0 4px 16px ${color.hex}44`,
                                    }}
                                    title={isApproved ? 'Unapprove this section to edit colors' : 'Click to edit color'}
                                >
                                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <Palette className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow" />
                                    </div>
                                </button>

                                <span className="text-xs font-semibold text-gray-300">
                                    {SLOT_LABELS[index] || color.name}
                                </span>
                                <span className="text-xs text-cyan font-mono bg-cyan/10 px-2 py-0.5 rounded">
                                    {color.hex}
                                </span>

                                {/* Picker — rendered inside the group div so groupRef contains it */}
                                {editingIndex === index && !isApproved && (
                                    <ColorPickerPopup
                                        hex={color.hex}
                                        onChangeHex={(hex) => handlePickerChange(index, hex)}
                                        onApply={handleApply}
                                        groupRef={groupRefs.current[index]}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-gray-500 pt-1">Click "Apply" or click outside the picker to save</p>
                </div>
            ) : (
                <div className="p-6 bg-[#1a1a1d] rounded-xl border border-yellow-500/20 text-center">
                    <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-300">No brand colors found in your questionnaire.</p>
                    <p className="text-sm text-gray-500 mt-2">Default colors will be applied. Update brand colors in the questionnaire (Q15).</p>
                </div>
            )}

            {isApproved && parsedColors.length > 0 && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-lg mt-4">
                    <Check className="w-4 h-4" />
                    <span>Colors approved and ready to push to Builder</span>
                </div>
            )}

            {feedbackModalOpen && (
                <FeedbackChatModal
                    isOpen={feedbackModalOpen}
                    onClose={() => setFeedbackModalOpen(false)}
                    onSave={handleFeedbackSave}
                    initialContent={currentContent}
                    sectionName="Brand Colors"
                    funnelId={funnelId}
                />
            )}
        </div>
    );
}
