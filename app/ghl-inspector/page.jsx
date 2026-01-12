"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Download, Loader2, ArrowLeft, Filter, CheckCircle, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function GHLInspectorPage() {
    const router = useRouter();
    const [locationId, setLocationId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const handleFetch = async () => {
        if (!locationId.trim()) {
            toast.error('Please enter a Location ID');
            return;
        }
        if (!accessToken.trim()) {
            toast.error('Please enter an Access Token');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`/api/ghl/inspect?locationId=${locationId}&accessToken=${accessToken}`);
            const result = await res.json();

            if (result.error) {
                toast.error(result.error);
                return;
            }

            setData(result);
            toast.success(`Found ${result.total} custom values`);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch custom values');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!data) return;

        const csv = [
            ['Name', 'Key'].join(','),
            ...data.customValues.map(cv => [
                `"${(cv.name || '').replace(/"/g, '""')}"`,
                `"${(cv.key || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ghl-custom-values-${locationId}-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Exported to CSV');
    };

    const handleExportPDF = () => {
        if (!data) return;

        // Create printable HTML
        const printWindow = window.open('', '_blank');
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>GHL Custom Values - ${locationId}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #fff; }
        h1 { color: #333; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
        th { background: #1f2937; color: white; padding: 10px; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e5e5; }
        tr:nth-child(even) { background: #f9f9f9; }
        .key-cell { font-family: monospace; color: #0ea5e9; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <h1>🔍 GHL Custom Values Inspector</h1>
    <p><strong>Location ID:</strong> ${locationId}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    
    <div class="stats">
        <div class="stat"><div class="stat-value">${data.stats.total}</div><div class="stat-label">Total</div></div>
        <div class="stat"><div class="stat-value" style="color:#22c55e">${data.stats.filled}</div><div class="stat-label">Filled</div></div>
        <div class="stat"><div class="stat-value" style="color:#f97316">${data.stats.empty}</div><div class="stat-label">Empty</div></div>
    </div>
    
    <table>
        <thead>
            <tr><th>Name</th><th>Key</th></tr>
        </thead>
        <tbody>
            ${filteredValues.map(cv => `
                <tr>
                    <td>${cv.name || ''}</td>
                    <td class="key-cell">${cv.key || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <script>window.print();</script>
</body>
</html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        toast.success('PDF opened in new tab - use Print to save');
    };

    // Filter and search
    const filteredValues = data?.customValues.filter(cv => {
        const keyStr = cv.key || '';
        const valueStr = cv.value || '';
        const matchesSearch = keyStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            valueStr.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || cv.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }) || [];

    const categories = data ? ['all', ...Object.keys(data.grouped)] : ['all'];

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mb-6 p-2 -ml-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
                        🔍 GHL Custom Values Inspector
                    </h1>
                    <p className="text-gray-400">
                        Fetch and inspect all custom values from a GHL location
                    </p>
                </div>

                {/* Input Form */}
                <div className="bg-[#1b1b1d] rounded-xl p-6 border border-[#2a2a2d] mb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            GHL Location ID
                        </label>
                        <input
                            type="text"
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            placeholder="Enter location ID (e.g., 12345abcde)"
                            className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/50 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            GHL Access Token
                            <span className="text-xs text-gray-500 ml-2">(Settings → API in GHL)</span>
                        </label>
                        <input
                            type="password"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                            placeholder="Enter your GHL API access token"
                            className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/50 transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleFetch}
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Fetching...
                            </>
                        ) : (
                            'Fetch Custom Values'
                        )}
                    </button>
                </div>

                {/* Results */}
                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d]">
                                <div className="text-2xl font-bold text-cyan">{data.stats.total}</div>
                                <div className="text-sm text-gray-400">Total Custom Values</div>
                            </div>
                            <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d]">
                                <div className="text-2xl font-bold text-green-500">{data.stats.filled}</div>
                                <div className="text-sm text-gray-400">Filled</div>
                            </div>
                            <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d]">
                                <div className="text-2xl font-bold text-orange-500">{data.stats.empty}</div>
                                <div className="text-sm text-gray-400">Empty</div>
                            </div>
                            <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d]">
                                <div className="text-2xl font-bold text-purple-500">
                                    {Math.round((data.stats.filled / data.stats.total) * 100)}%
                                </div>
                                <div className="text-sm text-gray-400">Completion</div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-[#1b1b1d] rounded-xl p-4 border border-[#2a2a2d] flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or key..."
                                    className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/50"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-500" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan/50"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleExportCSV}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                CSV
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                PDF
                            </button>
                        </div>

                        {/* Table */}
                        <div className="bg-[#1b1b1d] rounded-xl border border-[#2a2a2d] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#0e0e0f] border-b border-[#2a2a2d]">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase w-1/2">Name</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase w-1/2">Key</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a2d]">
                                        {filteredValues.map((cv, index) => (
                                            <tr key={index} className="hover:bg-[#252528] transition-colors">
                                                <td className="px-4 py-3 text-sm text-white font-medium">
                                                    {cv.name || <span className="text-gray-600 italic">—</span>}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm text-cyan select-all">
                                                    {cv.key || <span className="text-gray-600 italic">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredValues.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No custom values match your filters
                                </div>
                            )}

                            <div className="bg-[#0e0e0f] px-4 py-3 border-t border-[#2a2a2d] text-sm text-gray-400">
                                Showing {filteredValues.length} of {data.total} custom values
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
