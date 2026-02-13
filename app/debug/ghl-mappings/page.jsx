
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Check, X, RefreshCw, Send, Save, Image as ImageIcon, Film, Layout, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function GHLDebugPage() {
    const { userId } = useAuth();

    // Core State
    const [funnels, setFunnels] = useState([]);
    const [selectedFunnel, setSelectedFunnel] = useState(null);
    const [activeTab, setActiveTab] = useState('values'); // 'values' | 'media'

    // GHL State
    const [locationId, setLocationId] = useState('');
    const [accessToken, setAccessToken] = useState('');

    // Data State
    const [loading, setLoading] = useState(false);
    const [mappedValues, setMappedValues] = useState({});
    const [mediaAssets, setMediaAssets] = useState([]);
    const [statusMap, setStatusMap] = useState({}); // { key: 'success' | 'error' | 'skipped' }

    // Selection State
    const [selectedKeys, setSelectedKeys] = useState(new Set());

    // STARTUP
    useEffect(() => {
        loadFunnels();
        const savedLoc = localStorage.getItem('ghl_debug_loc');
        const savedTok = localStorage.getItem('ghl_debug_tok');
        if (savedLoc) setLocationId(savedLoc);
        if (savedTok) setAccessToken(savedTok);
    }, []);

    const saveCreds = () => {
        localStorage.setItem('ghl_debug_loc', locationId);
        localStorage.setItem('ghl_debug_tok', accessToken);
    };

    // --- API CALLS ---

    const loadFunnels = async () => {
        try {
            const res = await fetch('/api/debug/ghl-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list_funnels' })
            });
            const data = await res.json();
            if (data.success) {
                setFunnels(data.funnels || []);
            }
        } catch (e) {
            toast.error('Failed to load funnels');
        }
    };

    const loadDetails = async (funnelId) => {
        if (!funnelId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/debug/ghl-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch_details',
                    sessionId: funnelId
                })
            });
            const data = await res.json();
            if (data.success) {
                setMappedValues(data.mappedValues || {});
                setMediaAssets(data.mediaAssets || []);
                // Select all by default? No, let user select.
                setSelectedKeys(new Set());
                setStatusMap({});
                toast.success(`Loaded ${Object.keys(data.mappedValues || {}).length} values`);
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('Error fetching details');
        } finally {
            setLoading(false);
        }
    };

    const pushSelected = async () => {
        if (!locationId || !accessToken) return toast.error('GHL Credentials Required');
        if (selectedKeys.size === 0) return toast.error('No fields selected');

        if (!confirm(`Push ${selectedKeys.size} values to GHL?`)) return;

        setLoading(true);
        saveCreds();

        // Construct payload of ONLY selected keys
        const payload = {};
        selectedKeys.forEach(key => {
            payload[key] = mappedValues[key];
        });

        // Set status to loading for selected
        const loadingStatus = { ...statusMap };
        selectedKeys.forEach(key => loadingStatus[key] = 'loading');
        setStatusMap(loadingStatus);

        try {
            const res = await fetch('/api/debug/ghl-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({
                    action: 'push_batch', // Uses strict batch logic
                    locationId,
                    accessToken,
                    customValues: payload
                })
            });

            const data = await res.json();
            if (data.success) {
                const newStatus = { ...statusMap };
                data.results.updated.forEach(u => newStatus[u.key] = 'success');
                data.results.failed.forEach(f => newStatus[f.key] = 'error');
                data.results.skipped.forEach(s => newStatus[s.key] = 'skipped');
                setStatusMap(newStatus);
                toast.success(`Pushed: ${data.results.updated.length} success, ${data.results.failed.length} failed`);
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('Push failed');
        } finally {
            setLoading(false);
        }
    };

    // --- UI HANDLERS ---

    const handleFunnelSelect = (funnel) => {
        setSelectedFunnel(funnel);
        loadDetails(funnel.id);
    };

    const toggleKey = (key) => {
        const next = new Set(selectedKeys);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelectedKeys(next);
    };

    const toggleAll = () => {
        if (selectedKeys.size === Object.keys(mappedValues).length) {
            setSelectedKeys(new Set());
        } else {
            setSelectedKeys(new Set(Object.keys(mappedValues)));
        }
    };

    const handleValueChange = (key, val) => {
        setMappedValues(prev => ({ ...prev, [key]: val }));
    };

    // --- STATUS BADGES ---

    // Helper to determine row color based on status
    const getRowClass = (key) => {
        if (statusMap[key] === 'success') return 'bg-green-900/20';
        if (statusMap[key] === 'error') return 'bg-red-900/20';
        if (statusMap[key] === 'skipped') return 'bg-yellow-900/10';
        if (selectedKeys.has(key)) return 'bg-cyan-900/20';
        return '';
    };

    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            {/* SIDEBAR - Funnel Selector */}
            <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950">
                <div className="p-4 border-b border-zinc-800">
                    <h1 className="font-bold text-xl text-cyan-400 flex items-center gap-2">
                        <Database size={20} />
                        GHL Debugger
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase px-2 mb-2">My Businesses</h3>
                    {funnels.map(f => (
                        <button
                            key={f.id}
                            onClick={() => handleFunnelSelect(f)}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all border ${selectedFunnel?.id === f.id
                                ? 'bg-zinc-900 border-cyan-800 text-white'
                                : 'hover:bg-zinc-900 border-transparent text-zinc-400'
                                }`}
                        >
                            <div className="font-semibold truncate">{f.funnel_name}</div>
                            <div className="text-xs text-zinc-500 mt-1 flex justify-between">
                                <span>{f.vault_generated ? 'Generated' : 'Draft'}</span>
                                <span>{new Date(f.created_at).toLocaleDateString()}</span>
                            </div>
                        </button>
                    ))}
                    {funnels.length === 0 && (
                        <div className="text-zinc-500 text-sm p-4 text-center">No businesses found.</div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {selectedFunnel ? (
                    <>
                        {/* HEADER */}
                        <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedFunnel.funnel_name}</h2>
                                <div className="flex items-center gap-4 text-sm text-zinc-400">
                                    <span className="bg-zinc-800 px-2 py-1 rounded text-xs">{selectedFunnel.id}</span>
                                    {selectedFunnel.vault_generated && <span className="text-green-400 flex items-center gap-1"><Check size={12} /> Content Generated</span>}
                                </div>
                            </div>

                            {/* GHL CREDENTIALS BOX */}
                            <div className="flex flex-col gap-2 w-1/3 bg-zinc-900 p-3 rounded border border-zinc-800">
                                <div className="text-xs font-semibold text-zinc-500 mb-1">GHL CONNECTION</div>
                                <input
                                    className="bg-zinc-950 border border-zinc-700 p-1.5 rounded text-xs"
                                    placeholder="Location ID"
                                    value={locationId}
                                    onChange={e => setLocationId(e.target.value)}
                                />
                                <input
                                    className="bg-zinc-950 border border-zinc-700 p-1.5 rounded text-xs"
                                    placeholder="Access Token (Bearer)"
                                    value={accessToken} // Security: Mask this visually if specific req, currently plain for debug
                                    onChange={e => setAccessToken(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* TAB BAR */}
                        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950">
                            {[
                                { id: 'values', label: 'Custom Values', icon: Layout },
                                { id: 'media', label: 'Media Assets', icon: ImageIcon }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-cyan-500 text-cyan-400'
                                        : 'border-transparent text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-auto bg-black p-6">

                            {/* --- VALUES TAB --- */}
                            {activeTab === 'values' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedKeys.size > 0 && selectedKeys.size === Object.keys(mappedValues).length}
                                                onChange={toggleAll}
                                                className="rounded border-zinc-700 bg-zinc-900"
                                            />
                                            <span className="text-sm text-zinc-400">
                                                {selectedKeys.size} selected of {Object.keys(mappedValues).length}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => loadDetails(selectedFunnel.id)}
                                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2"
                                            >
                                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                                            </button>
                                            <button
                                                onClick={pushSelected}
                                                disabled={selectedKeys.size === 0 || loading}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2 font-medium"
                                            >
                                                <Send size={14} /> Push To Builder
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-900 text-zinc-400 font-medium">
                                                <tr>
                                                    <th className="p-3 w-10"></th>
                                                    <th className="p-3 w-1/4">Key</th>
                                                    <th className="p-3">Value</th>
                                                    <th className="p-3 w-24">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                {Object.entries(mappedValues).map(([key, value]) => (
                                                    <tr key={key} className={`hover:bg-zinc-900/50 transition-colors ${getRowClass(key)}`}>
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedKeys.has(key)}
                                                                onChange={() => toggleKey(key)}
                                                                className="rounded border-zinc-700 bg-zinc-900"
                                                            />
                                                        </td>
                                                        <td className="p-3 font-mono text-xs text-cyan-300 break-all">{key}</td>
                                                        <td className="p-3">
                                                            <textarea
                                                                value={value}
                                                                onChange={(e) => handleValueChange(key, e.target.value)}
                                                                className="w-full bg-transparent border-none focus:ring-1 focus:ring-cyan-500 rounded p-1 h-8 focus:h-20 transition-all resize-none text-zinc-300"
                                                            />
                                                        </td>
                                                        <td className="p-3 flex justify-center items-center">
                                                            {statusMap[key] === 'loading' && <Loader2 className="animate-spin text-yellow-500" size={16} />}
                                                            {statusMap[key] === 'success' && <Check className="text-green-500" size={16} />}
                                                            {statusMap[key] === 'error' && <X className="text-red-500" size={16} />}
                                                            {statusMap[key] === 'skipped' && <span className="text-xs text-zinc-500">Skip</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {Object.keys(mappedValues).length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-zinc-500">
                                                            No custom values mapped yet. Generate content first.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* --- MEDIA TAB --- */}
                            {activeTab === 'media' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {mediaAssets.map((asset, idx) => (
                                            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors group">
                                                <div className="aspect-video bg-black flex items-center justify-center relative">
                                                    {asset.type === 'image' ? (
                                                        <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 text-zinc-600">
                                                            <Film size={32} />
                                                            <span className="text-xs">Video Asset</span>
                                                        </div>
                                                    )}

                                                    {/* Provider Badge */}
                                                    <div className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${asset.provider === 'Cloudinary'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-zinc-700 text-zinc-300'
                                                        }`}>
                                                        {asset.provider}
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <div className="text-xs font-mono text-cyan-400 mb-1">{asset.label}</div>
                                                    <div className="text-[10px] text-zinc-500 truncate" title={asset.url}>
                                                        {asset.url}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {mediaAssets.length === 0 && (
                                        <div className="text-zinc-500 text-center py-20 bg-zinc-900/30 rounded border border-zinc-800 border-dashed">
                                            No media assets found linked to this business.
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </>
                ) : (
                    // EMPTY STATE
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                        <Database size={48} className="mb-4 opacity-50" />
                        <p className="text-lg">Select a business from the sidebar to inspect.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
