
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Check, X, RefreshCw, Send, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function GHLDebugPage() {
    const { userId } = useAuth();
    const [sessionId, setSessionId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [accessToken, setAccessToken] = useState('');

    const [loading, setLoading] = useState(false);
    const [mappedValues, setMappedValues] = useState({});
    const [statusMap, setStatusMap] = useState({}); // { key: 'success' | 'error' | 'skipped' }

    // Load last used credentials from localStorage for convenience
    useEffect(() => {
        const savedLoc = localStorage.getItem('ghl_debug_loc');
        const savedTok = localStorage.getItem('ghl_debug_tok');
        const savedSess = localStorage.getItem('ghl_debug_sess');
        if (savedLoc) setLocationId(savedLoc);
        if (savedTok) setAccessToken(savedTok);
        if (savedSess) setSessionId(savedSess);
    }, []);

    const saveCreds = () => {
        localStorage.setItem('ghl_debug_loc', locationId);
        localStorage.setItem('ghl_debug_tok', accessToken);
        localStorage.setItem('ghl_debug_sess', sessionId);
    };

    const fetchValues = async () => {
        if (!sessionId) return toast.error('Session ID required');

        setLoading(true);
        try {
            const res = await fetch('/api/debug/ghl-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch',
                    sessionId
                })
            });

            const data = await res.json();
            if (data.success) {
                setMappedValues(data.mappedValues);
                toast.success(`Fetched ${Object.keys(data.mappedValues).length} values`);
                saveCreds();
            } else {
                toast.error(data.error || 'Fetch failed');
            }
        } catch (e) {
            toast.error('Error fetching values');
        } finally {
            setLoading(false);
        }
    };

    const pushSingle = async (key, value) => {
        if (!locationId || !accessToken) return toast.error('Credentials required');

        setStatusMap(prev => ({ ...prev, [key]: 'loading' }));
        try {
            const res = await fetch('/api/debug/ghl-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'push_single',
                    sessionId,
                    locationId,
                    accessToken,
                    key,
                    value
                })
            });

            const data = await res.json();
            if (data.success && data.results.updated.length > 0) {
                setStatusMap(prev => ({ ...prev, [key]: 'success' }));
                toast.success(`Pushed ${key}`);
            } else {
                setStatusMap(prev => ({ ...prev, [key]: 'error' }));
                toast.error(`Failed to push ${key}: ${data.results?.failed?.[0]?.error || data.results?.skipped?.[0]?.reason || 'Unknown error'}`);
            }
        } catch (e) {
            setStatusMap(prev => ({ ...prev, [key]: 'error' }));
        }
    };

    const pushAll = async () => {
        if (!confirm('Are you sure you want to push ALL values? This may take a while.')) return;
        setLoading(true);
        setStatusMap({}); // Reset status

        try {
            const res = await fetch('/api/debug/ghl-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'push_all',
                    sessionId,
                    locationId,
                    accessToken,
                    customValues: mappedValues
                })
            });

            const data = await res.json();
            if (data.success) {
                const newStatus = {};
                data.results.updated.forEach(u => newStatus[u.key] = 'success');
                data.results.failed.forEach(f => newStatus[f.key] = 'error');
                data.results.skipped.forEach(s => newStatus[s.key] = 'skipped');
                setStatusMap(newStatus);
                toast.success(`Push Complete: ${data.results.updated.length} updated, ${data.results.failed.length} failed`);
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error('Batch push failed');
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (key, newValue) => {
        setMappedValues(prev => ({
            ...prev,
            [key]: newValue
        }));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto bg-black min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-8 text-cyan-400">GHL Mapping Debugger</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-4 p-4 border border-zinc-800 rounded-lg">
                    <h2 className="font-semibold text-lg">1. Session Context</h2>
                    <input
                        className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded"
                        placeholder="Session ID (UUID)"
                        value={sessionId}
                        onChange={e => setSessionId(e.target.value)}
                    />
                    <button
                        onClick={fetchValues}
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 p-2 rounded flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={16} />}
                        Fetch Local Data
                    </button>
                    <p className="text-xs text-zinc-500">
                        Fetches data from `saved_sessions` and runs `customValueMapper.js` locally.
                    </p>
                </div>

                <div className="space-y-4 p-4 border border-zinc-800 rounded-lg col-span-2">
                    <h2 className="font-semibold text-lg">2. GHL Credentials (For Push)</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            className="bg-zinc-900 border border-zinc-700 p-2 rounded"
                            placeholder="Location ID"
                            value={locationId}
                            onChange={e => setLocationId(e.target.value)}
                        />
                        <input
                            className="bg-zinc-900 border border-zinc-700 p-2 rounded"
                            placeholder="Access Token (Bearer)"
                            value={accessToken}
                            onChange={e => setAccessToken(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={pushAll}
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 p-2 rounded flex items-center justify-center gap-2"
                        >
                            <Send size={16} />
                            Push All Values
                        </button>
                    </div>
                </div>
            </div>

            {Object.keys(mappedValues).length > 0 && (
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="bg-zinc-900 p-4 grid grid-cols-12 gap-4 font-bold border-b border-zinc-800">
                        <div className="col-span-3">Key</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-7">Value (Editable)</div>
                        <div className="col-span-1">Action</div>
                    </div>

                    <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
                        {Object.entries(mappedValues).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-12 gap-4 p-4 hover:bg-zinc-900/50 items-center">
                                <div className="col-span-3 text-sm font-mono text-cyan-300 break-all">
                                    {key}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    {statusMap[key] === 'loading' && <Loader2 className="animate-spin text-yellow-500" size={16} />}
                                    {statusMap[key] === 'success' && <Check className="text-green-500" size={16} />}
                                    {statusMap[key] === 'error' && <X className="text-red-500" size={16} />}
                                    {statusMap[key] === 'skipped' && <span className="text-zinc-500 text-xs">Skip</span>}
                                </div>
                                <div className="col-span-7">
                                    <textarea
                                        className="w-full bg-transparent border border-zinc-800 focus:border-cyan-500 rounded p-1 text-sm h-10 focus:h-24 transition-all"
                                        value={value}
                                        onChange={(e) => handleValueChange(key, e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 text-center">
                                    <button
                                        onClick={() => pushSingle(key, value)}
                                        className="text-zinc-400 hover:text-white p-2 rounded hover:bg-zinc-800"
                                        title="Push this value"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
