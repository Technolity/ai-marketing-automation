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

    // Fetch existing values on load
    useEffect(() => {
        fetchExistingValues();
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
