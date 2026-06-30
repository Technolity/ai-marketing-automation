'use client';

import { useState, useEffect } from 'react';

export default function GHLTestValuesPage() {
    const [names, setNames] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(false);
    const [result, setResult] = useState(null);
    const [existingValues, setExistingValues] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [error, setError] = useState(null);

    // --- Coded Funnel HTML test section ---
    const [cf, setCf] = useState({
        design: 'coded-v1',
        primary: '#7c3aed',
        secondary: '#4c1d95',
        businessName: 'Acme Coaching',
        headline: 'Steal My 3-Step Client-Getting System',
        subheadline: 'The exact framework I use to book 20+ calls a month.',
        cta: 'Get Instant Access',
        locationId: '',
        page: 'optin',
    });

    // Page keys available per design. Switching design resets the page to a valid one.
    const CF_PAGES = {
        'coded-v1': [
            { value: 'optin', label: 'Opt-in' },
            { value: 'sales', label: 'Sales' },
            { value: 'calendar', label: 'Calendar' },
            { value: 'thankYou', label: 'Thank You' },
        ],
        'booking-v1': [
            { value: 'landing', label: 'Landing' },
            { value: 'qualify', label: 'Qualify' },
            { value: 'calendar', label: 'Calendar' },
            { value: 'thankYou', label: 'Thank You' },
        ],
    };

    const cfSetDesign = (design) => {
        const firstPage = CF_PAGES[design][0].value;
        setCf((prev) => ({ ...prev, design, page: firstPage }));
    };
    const [cfHtml, setCfHtml] = useState('');     // rendered preview HTML (iframe srcDoc)
    const [cfResult, setCfResult] = useState(null);
    const [cfBusy, setCfBusy] = useState(false);
    const [cfAccounts, setCfAccounts] = useState([]); // connected GHL locations for the picker

    const setCfField = (key, value) => setCf((prev) => ({ ...prev, [key]: value }));

    // --- Bake a REAL funnel from its vault (Booking v2, admin-only end-to-end test) ---
    const [bfFunnelId, setBfFunnelId] = useState('');
    const [bfResult, setBfResult] = useState(null);
    const [bfBusy, setBfBusy] = useState(false);
    const [bfLocationId, setBfLocationId] = useState('');
    const [bfPushBusy, setBfPushBusy] = useState(false);
    const bfBake = async () => {
        setBfBusy(true); setBfResult(null); setError(null);
        try {
            const res = await fetch('/api/admin/bake-funnel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelId: bfFunnelId.trim() }),
            });
            const data = await res.json();
            setBfResult(data);
            if (data.error) setError(data.error);
        } catch (err) {
            setError(err.message);
        } finally {
            setBfBusy(false);
        }
    };
    // Bake AND push: same endpoint, but a locationId triggers the GHL upsert of every segment.
    const bfPush = async () => {
        setBfPushBusy(true); setError(null);
        try {
            const res = await fetch('/api/admin/bake-funnel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelId: bfFunnelId.trim(), locationId: bfLocationId.trim() }),
            });
            const data = await res.json();
            setBfResult(data);
            if (data.error) setError(data.error);
        } catch (err) {
            setError(err.message);
        } finally {
            setBfPushBusy(false);
        }
    };

    const cfRandomize = () => {
        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const hex = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
        setCf({
            primary: hex(),
            secondary: hex(),
            businessName: rand(['Nova Fitness', 'PeakFlow Agency', 'BrightPath Coaching', 'IronClad Consulting']),
            headline: rand([
                'Book 30 Calls a Month on Autopilot',
                'The Funnel That 10x’d My Leads',
                'Get Clients Without Cold Outreach',
                'Your Free Blueprint Is Waiting',
            ]),
            subheadline: rand([
                'No ad spend. No guesswork. Just a proven system.',
                'Download the playbook top operators actually use.',
                'Enter your email and we’ll send it instantly.',
            ]),
            cta: rand(['Get Instant Access', 'Send Me The Guide', 'Claim My Spot', 'Show Me How']),
        });
    };

    // Map the three shared inputs onto each page's actual field names so the
    // typed headline/sub/CTA show up regardless of which design+page is selected.
    const cfCopyForPage = () => {
        const { headline, subheadline, cta } = cf;
        if (cf.design === 'booking-v1') {
            switch (cf.page) {
                case 'landing':
                    return { hero_headline: headline, hero_subheadline: subheadline, hero_cta_text: cta, final_cta_text: cta };
                case 'qualify':
                case 'calendar':
                case 'thankYou':
                default:
                    return { headline, subheadline };
            }
        }
        switch (cf.page) {
            case 'sales':
                return { hero_headline_text: headline, hero_subheadline_text: subheadline, hero_cta_text: cta, final_cta_text: cta };
            case 'calendar':
                return { headline, subheadline };
            case 'thankYou':
                return { headline, subheadline };
            case 'optin':
            default:
                return { headline_text: headline, subheadline_text: subheadline, cta_button_text: cta };
        }
    };

    const cfBody = (pushToGhl) => ({
        pushToGhl,
        designId: cf.design,
        page: cf.page,
        locationId: cf.locationId,
        brand: { primary: cf.primary, secondary: cf.secondary, businessName: cf.businessName },
        copy: cfCopyForPage(),
    });

    const cfCall = async (pushToGhl) => {
        setCfBusy(true);
        setError(null);
        setCfResult(null);
        try {
            const res = await fetch('/api/admin/coded-funnel-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cfBody(pushToGhl)),
            });
            const data = await res.json();
            // 'doc' mode returns `html`; 'segments' mode returns the stitched `assembledHtml`.
            if (data.html) setCfHtml(data.html);
            else if (data.assembledHtml) setCfHtml(data.assembledHtml);
            setCfResult(data);
            if (data.error) setError(data.error);
        } catch (err) {
            setError(err.message);
        } finally {
            setCfBusy(false);
        }
    };

    // Fetch existing values on load
    useEffect(() => {
        fetchExistingValues();
    }, []);

    // Load active GHL sub-accounts (locations) for the Coded Funnel picker.
    // Source = ghl_subaccounts, via the coded-funnel-test GET endpoint.
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/coded-funnel-test');
                const data = await res.json();
                const locs = data.locations || [];
                setCfAccounts(locs);
                // Pre-select the first location so a push never fires blank.
                if (locs.length) setCf((prev) => (prev.locationId ? prev : { ...prev, locationId: locs[0].locationId }));
            } catch {
                /* non-blocking — admin can still paste a Location ID */
            }
        })();
    }, []);

    const fetchExistingValues = async () => {
        setLoadingList(true);
        try {
            const res = await fetch('/api/admin/ghl-test-values');
            const data = await res.json();
            if (data.success) {
                setExistingValues(data.customValues || []);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingList(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        const namesList = names
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);

        if (namesList.length === 0) {
            setError('Please enter at least one custom value name');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/admin/ghl-test-values', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ names: namesList })
            });

            const data = await res.json();
            setResult(data);

            if (data.success) {
                setNames('');
                fetchExistingValues(); // Refresh list
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            setError('Select values to delete');
            return;
        }

        if (!confirm(`Delete ${selectedIds.length} custom values?`)) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/ghl-test-values', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            const data = await res.json();
            if (data.success) {
                setSelectedIds([]);
                fetchExistingValues();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === existingValues.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(existingValues.map(v => v.id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">GHL Custom Values Test Tool</h1>
                <p className="text-gray-400 mb-8">Admin tool for creating and managing test custom values in GoHighLevel</p>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {/* Coded Funnel HTML Test Section */}
                <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-purple-700/40">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-semibold">Coded Funnel HTML Test</h2>
                        <button
                            onClick={cfRandomize}
                            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm"
                        >
                            🎲 Randomize
                        </button>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                        Renders the <code className="text-purple-300">coded-v1</code> opt-in template from the
                        fields below, then bakes the full HTML into the GHL{' '}
                        <code className="text-purple-300">{'{{custom_values.test}}'}</code> value.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <label className="text-sm text-gray-400">
                            Design
                            <select value={cf.design}
                                onChange={(e) => cfSetDesign(e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm">
                                <option value="coded-v1">Coded v1 (single value/page)</option>
                                <option value="booking-v1">Booking v1 (segments/page)</option>
                            </select>
                        </label>
                        <label className="text-sm text-gray-400">
                            Page
                            <select value={cf.page}
                                onChange={(e) => setCfField('page', e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm">
                                {CF_PAGES[cf.design].map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <label className="text-sm text-gray-400">
                            Primary color
                            <div className="flex gap-2 mt-1">
                                <input type="color" value={cf.primary}
                                    onChange={(e) => setCfField('primary', e.target.value)}
                                    className="h-10 w-12 bg-gray-900 border border-gray-700 rounded" />
                                <input type="text" value={cf.primary}
                                    onChange={(e) => setCfField('primary', e.target.value)}
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm" />
                            </div>
                        </label>
                        <label className="text-sm text-gray-400">
                            Secondary color
                            <div className="flex gap-2 mt-1">
                                <input type="color" value={cf.secondary}
                                    onChange={(e) => setCfField('secondary', e.target.value)}
                                    className="h-10 w-12 bg-gray-900 border border-gray-700 rounded" />
                                <input type="text" value={cf.secondary}
                                    onChange={(e) => setCfField('secondary', e.target.value)}
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm" />
                            </div>
                        </label>
                        <label className="text-sm text-gray-400 md:col-span-2">
                            Business name
                            <input type="text" value={cf.businessName}
                                onChange={(e) => setCfField('businessName', e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                        </label>
                        <label className="text-sm text-gray-400 md:col-span-2">
                            Headline
                            <input type="text" value={cf.headline}
                                onChange={(e) => setCfField('headline', e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                        </label>
                        <label className="text-sm text-gray-400 md:col-span-2">
                            Subheadline
                            <input type="text" value={cf.subheadline}
                                onChange={(e) => setCfField('subheadline', e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                        </label>
                        <label className="text-sm text-gray-400 md:col-span-2">
                            CTA button text
                            <input type="text" value={cf.cta}
                                onChange={(e) => setCfField('cta', e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm" />
                        </label>
                        <label className="text-sm text-gray-400 md:col-span-2">
                            Pick a connected account ({cfAccounts.length})
                            <select value={cf.locationId}
                                onChange={(e) => setCfField('locationId', e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm">
                                <option value="">— Select a location —</option>
                                {cfAccounts.map((a) => (
                                    <option key={a.locationId} value={a.locationId}>{a.label}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm text-gray-400 md:col-span-2">
                            …or paste a GHL Location ID <span className="text-gray-600">(required to push)</span>
                            <input type="text" value={cf.locationId}
                                onChange={(e) => setCfField('locationId', e.target.value)}
                                placeholder="e.g. ve9EPM428h8vShlRW1KT"
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm" />
                        </label>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">
                        Target location: <code className="text-purple-300">{cf.locationId || 'none selected'}</code>
                    </p>
                    <div className="flex gap-3 mb-4">
                        <button onClick={() => cfCall(false)} disabled={cfBusy}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 rounded-lg font-medium">
                            {cfBusy ? 'Working...' : 'Preview (no push)'}
                        </button>
                        <button onClick={() => cfCall(true)} disabled={cfBusy}
                            className="px-6 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-600 rounded-lg font-medium">
                            {cfBusy ? 'Working...' : (cf.design === 'booking-v1' ? 'Push segments to GHL' : 'Push to custom_values.test')}
                        </button>
                    </div>

                    {cfResult && (
                        <div className={`rounded-lg p-4 mb-4 text-sm border ${cfResult.success ? 'bg-green-900/30 border-green-600 text-green-300' : 'bg-red-900/30 border-red-600 text-red-300'}`}>
                            <p className="font-medium">
                                {cfResult.pushed
                                    ? `✓ Pushed → ${cfResult.totalBytes ?? cfResult.bytes} bytes total`
                                    : cfResult.success
                                        ? `Rendered ${cfResult.totalBytes ?? cfResult.bytes} bytes (preview only)`
                                        : `✗ ${cfResult.error}`}
                            </p>

                            {/* Segments mode: list each custom value + its size. */}
                            {Array.isArray(cfResult.segments) && cfResult.segments.length > 0 && (
                                <ul className="mt-2 text-xs font-mono space-y-0.5">
                                    {cfResult.segments.map((s) => (
                                        <li key={s.name}><code className="text-purple-300">{s.name}</code> · {s.bytes} bytes</li>
                                    ))}
                                </ul>
                            )}

                            {/* Per-segment push outcome. */}
                            {Array.isArray(cfResult.results) && cfResult.results.length > 0 && (
                                <ul className="mt-2 text-xs font-mono space-y-0.5">
                                    {cfResult.results.map((r) => (
                                        <li key={r.name}>{r.ok ? '✓' : '✗'} <code className="text-purple-300">{r.name}</code> ({r.mode}){r.error ? ` — ${r.error}` : ''}</li>
                                    ))}
                                </ul>
                            )}

                            {/* The paste-string: stitch the segment custom values together in the GHL page builder. */}
                            {cfResult.mergeTag && (
                                <div className="mt-2 text-xs">
                                    <span className="text-gray-400">Paste into a GHL Custom Code element:</span>
                                    <pre className="mt-1 text-purple-300 whitespace-pre-wrap break-all bg-gray-900/60 rounded p-2">{cfResult.mergeTag}</pre>
                                    {cf.design === 'booking-v1' && (cf.page === 'calendar' || cf.page === 'qualify') && (
                                        <p className="mt-1 text-amber-300">
                                            Also create the live custom value{' '}
                                            <code>{cf.page === 'calendar' ? 'appt_calendar_embed' : 'appt_qualify_form'}</code>{' '}
                                            and paste your GHL {cf.page === 'calendar' ? 'calendar' : 'form'} embed into it.
                                        </p>
                                    )}
                                </div>
                            )}

                            {Array.isArray(cfResult.failed) && cfResult.failed.length > 0 && (
                                <p className="mt-2 text-xs">failed: {cfResult.failed.map((f) => `${f.name} (${f.ghlStatus})`).join(', ')}</p>
                            )}
                            {cfResult.ghlStatus && <p className="mt-1 text-xs">GHL HTTP {cfResult.ghlStatus}</p>}
                            {cfResult.ghlResponse && (
                                <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(cfResult.ghlResponse, null, 2).slice(0, 800)}
                                </pre>
                            )}
                        </div>
                    )}

                    {cfHtml && (
                        <div>
                            <p className="text-sm text-gray-400 mb-2">Live preview of the exact HTML being pushed:</p>
                            <iframe
                                title="Coded funnel preview"
                                srcDoc={cfHtml}
                                className="w-full h-[520px] bg-white rounded-lg border border-gray-700"
                            />
                        </div>
                    )}
                </div>

                {/* Bake Real Funnel — Booking v2 (admin end-to-end) */}
                <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-cyan-700/40">
                    <h2 className="text-xl font-semibold mb-1">Bake Real Funnel — Booking v2 (admin)</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Reads a funnel&apos;s real vault content (funnel copy + media + brand colors) and bakes the coded
                        booking pages from it. Bake = preview only (no writes). Push = upsert every segment into the
                        location&apos;s custom values (create the placeholders first via GHL Custom Values).
                    </p>
                    <label className="text-sm text-gray-400 block mb-3">
                        Funnel ID <span className="text-gray-600">(from the vault URL ?funnel_id=…)</span>
                        <input type="text" value={bfFunnelId}
                            onChange={(e) => setBfFunnelId(e.target.value)}
                            placeholder="e.g. 1a2b3c4d-…"
                            className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm" />
                    </label>
                    <label className="text-sm text-gray-400 block mb-3">
                        GHL Location ID <span className="text-gray-600">(required only for Push)</span>
                        <input type="text" value={bfLocationId}
                            onChange={(e) => setBfLocationId(e.target.value)}
                            placeholder="e.g. AbCdEfGhIjKlMnOpQrSt"
                            className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono text-sm" />
                    </label>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <button onClick={bfBake} disabled={bfBusy || bfPushBusy || !bfFunnelId.trim()}
                            className="px-6 py-3 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-600 rounded-lg font-medium">
                            {bfBusy ? 'Baking…' : 'Bake from Vault'}
                        </button>
                        <button onClick={bfPush} disabled={bfBusy || bfPushBusy || !bfFunnelId.trim() || !bfLocationId.trim()}
                            className="px-6 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 rounded-lg font-medium"
                            title={!bfLocationId.trim() ? 'Enter a Location ID to push' : 'Bake and push every segment into GHL custom values'}>
                            {bfPushBusy ? 'Pushing…' : 'Bake + Push to GHL'}
                        </button>
                    </div>

                    {bfResult && bfResult.push && (
                        <div className={`mb-4 rounded-lg border p-3 text-sm ${bfResult.push.failed > 0 ? 'border-amber-600/40 bg-amber-900/20 text-amber-200' : 'border-green-600/40 bg-green-900/20 text-green-200'}`}>
                            {bfResult.push.failed > 0 ? '⚠' : '✓'} Pushed to <code>{bfResult.push.locationId}</code> ·
                            {' '}created <b>{bfResult.push.created}</b> · updated <b>{bfResult.push.updated}</b> · failed <b>{bfResult.push.failed}</b> / {bfResult.push.total}
                            {bfResult.push.error && <span className="block text-red-300 mt-1">{bfResult.push.error}</span>}
                            {bfResult.push.failedKeys?.length > 0 && (
                                <ul className="mt-1 font-mono text-xs text-red-300">
                                    {bfResult.push.failedKeys.map((f) => (<li key={f.key}>{f.key}: {f.error}</li>))}
                                </ul>
                            )}
                        </div>
                    )}

                    {bfResult && bfResult.success && (
                        <div className="space-y-6">
                            <p className="text-sm text-green-300">
                                ✓ Baked {bfResult.pages.length} page(s) · type <code>{bfResult.selectedFunnelType || 'none'}</code> · design <code>{bfResult.design}</code>
                                {!bfResult.hasContent && ' · ⚠ no funnel copy in vault (showing fallbacks)'}
                            </p>
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                                <span className={bfResult.colorsFound ? 'text-gray-400' : 'text-amber-300'}>
                                    {bfResult.colorsFound ? 'Brand colors from vault:' : '⚠ Brand colors NOT found in vault — using template defaults:'}
                                </span>
                                {['primary', 'secondary', 'accent'].map((k) => (
                                    <span key={k} className="inline-flex items-center gap-1">
                                        <span style={{ background: (bfResult.brand && bfResult.brand[k]) || '#444', width: 14, height: 14, display: 'inline-block', borderRadius: 3, border: '1px solid #333' }} />
                                        <code className="text-gray-400">{k}: {(bfResult.brand && bfResult.brand[k]) || '—'}</code>
                                    </span>
                                ))}
                            </div>
                            {bfResult.pages.map((p) => (
                                <div key={p.page} className="border border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2 gap-3">
                                        <h3 className="font-semibold capitalize">{p.page}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-400">{p.totalBytes} bytes · {p.segments.length} segments</span>
                                            <a href={`/api/admin/bake-funnel?funnelId=${encodeURIComponent(bfFunnelId.trim())}&page=${p.page}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-cyan-400 hover:text-cyan-300 underline whitespace-nowrap">Open full page ↗</a>
                                        </div>
                                    </div>
                                    <ul className="text-xs font-mono text-gray-400 mb-2">
                                        {p.segments.map((s) => (
                                            <li key={s.name}>
                                                <code className="text-cyan-300">{s.name}</code> · {s.bytes} bytes
                                                {s.kind === 'css'
                                                    ? <span className="text-amber-300"> → GHL CSS field (one value)</span>
                                                    : <span className="text-gray-500"> → HTML custom-code chunk</span>}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-[11px] text-gray-500 mb-1">HTML chunks concatenate in the custom-code element (CSS value goes in the page CSS field):</p>
                                    <pre className="text-xs text-cyan-300 whitespace-pre-wrap break-all bg-gray-900/60 rounded p-2 mb-2">{p.mergeTagString}</pre>
                                    <iframe title={`bake-${p.page}`} srcDoc={p.assembledHtml}
                                        className="w-full h-[520px] bg-white rounded-lg border border-gray-700" />
                                </div>
                            ))}
                        </div>
                    )}
                    {bfResult && !bfResult.success && (<p className="text-sm text-red-300">✗ {bfResult.error}</p>)}
                </div>

                {/* Create Section */}
                <div className="bg-gray-800 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Create Custom Values</h2>
                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">
                                Enter custom value names (one per line):
                            </label>
                            <textarea
                                value={names}
                                onChange={(e) => setNames(e.target.value)}
                                className="w-full h-40 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                                placeholder="02 VSL Hero Headline&#10;02 VSL CTA Text&#10;02 Optin Headline&#10;..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Custom Values'}
                        </button>
                    </form>

                    {result && result.success && (
                        <div className="mt-4 bg-green-900/30 border border-green-600 rounded-lg p-4">
                            <p className="text-green-300 font-medium mb-2">
                                ✓ Created {result.summary.created} / {result.summary.total} values
                            </p>
                            {result.results.created.length > 0 && (
                                <ul className="text-sm text-gray-300 space-y-1">
                                    {result.results.created.map((item, i) => (
                                        <li key={i}>• {item.name} → <code className="text-cyan-400">{item.key}</code></li>
                                    ))}
                                </ul>
                            )}
                            {result.results.failed.length > 0 && (
                                <div className="mt-3 text-red-300">
                                    <p className="font-medium">Failed:</p>
                                    {result.results.failed.map((item, i) => (
                                        <p key={i} className="text-sm">• {item.name}: {item.error}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Existing Values Section */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Existing Custom Values ({existingValues.length})</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchExistingValues}
                                disabled={loadingList}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                            >
                                {loadingList ? 'Loading...' : 'Refresh'}
                            </button>
                            {existingValues.length > 0 && (
                                <>
                                    <button
                                        onClick={selectAll}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                                    >
                                        {selectedIds.length === existingValues.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={selectedIds.length === 0 || loading}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm"
                                    >
                                        Delete Selected ({selectedIds.length})
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {loadingList ? (
                        <p className="text-gray-400">Loading...</p>
                    ) : existingValues.length === 0 ? (
                        <p className="text-gray-500">No custom values found in this location</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="w-10 py-2"></th>
                                        <th className="text-left py-2 px-2">Name</th>
                                        <th className="text-left py-2 px-2">Key</th>
                                        <th className="text-left py-2 px-2">Value (preview)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {existingValues.map((value) => (
                                        <tr
                                            key={value.id}
                                            className={`border-b border-gray-700/50 hover:bg-gray-700/30 ${selectedIds.includes(value.id) ? 'bg-cyan-900/20' : ''
                                                }`}
                                        >
                                            <td className="py-2 px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(value.id)}
                                                    onChange={() => toggleSelect(value.id)}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="py-2 px-2">{value.name}</td>
                                            <td className="py-2 px-2">
                                                <code className="text-cyan-400 text-xs">{value.key}</code>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-xs max-w-xs truncate">
                                                {value.value || '(empty)'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-8 text-sm text-gray-500">
                    <h3 className="font-medium text-gray-400 mb-2">How to use:</h3>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Enter custom value names (one per line) in the text area above</li>
                        <li>Click "Create Custom Values" to create them in GHL</li>
                        <li>Keys will be auto-generated with a test_ prefix</li>
                        <li>Use the table below to view or delete values</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
