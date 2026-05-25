"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
    Database,
    Table as TableIcon,
    Edit,
    Trash2,
    Plus,
    RefreshCw,
    Search,
    ChevronRight,
    AlertCircle,
    Save,
    X,
    CheckCircle,
    XCircle,
    Loader2,
    Sparkles
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

// Field type definitions with dropdown options
const FIELD_DEFINITIONS = {
    subscription_tier: {
        type: 'select',
        options: ['starter', 'growth', 'scale']
    },
    status: {
        type: 'select',
        options: ['not_started', 'pending', 'in_progress', 'completed', 'failed']
    },
    is_admin: {
        type: 'boolean'
    },
    is_active: {
        type: 'boolean'
    },
    is_public: {
        type: 'boolean'
    }
};

// Toast notification component
function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${
                type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : type === 'error'
                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
            }`}
        >
            {type === 'success' && <CheckCircle className="w-5 h-5" />}
            {type === 'error' && <XCircle className="w-5 h-5" />}
            {type === 'info' && <AlertCircle className="w-5 h-5" />}
            <p className="font-medium">{message}</p>
            <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export default function DatabaseManager() {
    const { session, loading: authLoading } = useAuth();
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingRow, setEditingRow] = useState(null);
    const [editData, setEditData] = useState({});
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!authLoading && session) {
            fetchTables();
        }
    }, [authLoading, session]);

    const fetchTables = async () => {
        try {
            const response = await fetchWithAuth('/api/admin/database/tables');
            if (!response.ok) throw new Error('Failed to fetch tables');
            const data = await response.json();
            setTables(data.tables || []);
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    const fetchTableData = async (tableName) => {
        setLoading(true);
        try {
            const response = await fetchWithAuth(`/api/admin/database/data?table=${tableName}`);
            if (!response.ok) throw new Error('Failed to fetch table data');
            const data = await response.json();
            setTableData(data.rows || []);
            setColumns(data.columns || []);
            setSelectedTable(tableName);
        } catch (error) {
            console.error('Error fetching table data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row) => {
        const rowId = row.id || row[columns[0]];
        setEditingRow(rowId);
        // Create a clean copy of the row data
        const cleanData = {};
        columns.forEach(col => {
            cleanData[col] = row[col];
        });
        setEditData(cleanData);
    };

    const handleFieldChange = (column, value) => {
        setEditData(prev => ({
            ...prev,
            [column]: value
        }));
    };

    const handleSave = async () => {
        try {
            // Remove id and timestamp fields from update data
            const updatePayload = { ...editData };
            delete updatePayload.id;
            delete updatePayload.created_at;
            delete updatePayload.updated_at;

            const response = await fetchWithAuth('/api/admin/database/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: selectedTable,
                    data: updatePayload,
                    id: editingRow
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update record');
            }

            setToast({ message: 'Record updated successfully!', type: 'success' });

            // Refresh data
            await fetchTableData(selectedTable);
            setEditingRow(null);
            setEditData({});
        } catch (error) {
            console.error('Error updating record:', error);
            setToast({ message: `Failed to update: ${error.message}`, type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

        try {
            const response = await fetchWithAuth('/api/admin/database/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: selectedTable,
                    id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete record');
            }

            setToast({ message: 'Record deleted successfully!', type: 'success' });

            // Refresh data
            await fetchTableData(selectedTable);
        } catch (error) {
            console.error('Error deleting record:', error);
            setToast({ message: `Failed to delete: ${error.message}`, type: 'error' });
        }
    };

    // Smart field renderer based on column type
    const renderField = (column, value) => {
        const fieldDef = FIELD_DEFINITIONS[column];

        if (fieldDef?.type === 'select') {
            return (
                <select
                    value={value || ''}
                    onChange={(e) => handleFieldChange(column, e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e0e0f] border border-cyan/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all"
                >
                    <option value="">Select...</option>
                    {fieldDef.options.map(option => (
                        <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                        </option>
                    ))}
                </select>
            );
        }

        if (fieldDef?.type === 'boolean') {
            return (
                <select
                    value={value === true || value === 'true' ? 'true' : 'false'}
                    onChange={(e) => handleFieldChange(column, e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-[#0e0e0f] border border-cyan/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all"
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );
        }

        // Check if column is read-only
        if (['id', 'created_at', 'updated_at', 'clerk_id'].includes(column)) {
            return (
                <input
                    type="text"
                    value={value || ''}
                    disabled
                    className="w-full px-3 py-2 bg-[#0e0e0f]/50 border border-gray-700 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
            );
        }

        // Check if it's a number field
        if (typeof value === 'number' || column.includes('count') || column.includes('max_') || column.includes('limit')) {
            return (
                <input
                    type="number"
                    value={value ?? ''}
                    onChange={(e) => handleFieldChange(column, e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-[#0e0e0f] border border-cyan/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all"
                />
            );
        }

        // Default: text input
        return (
            <input
                type="text"
                value={value ?? ''}
                onChange={(e) => handleFieldChange(column, e.target.value)}
                className="w-full px-3 py-2 bg-[#0e0e0f] border border-cyan/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all"
            />
        );
    };

    const filteredData = tableData.filter(row => {
        if (!searchQuery) return true;
        return Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <AdminLayout>
            {/* Toast Notifications */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            <div className="space-y-6" style={{ width: "100%", maxWidth: "100%", overflowX: "auto", boxSizing: "border-box" }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan/30 via-purple-500/20 to-cyan/30 flex items-center justify-center border border-cyan/30 shadow-lg shadow-cyan/20"
                        >
                            <Database className="w-7 h-7 text-cyan" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                                Database Manager
                            </h1>
                            <p className="text-gray-400 text-sm sm:text-base mt-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan" />
                                Direct database access and editing
                            </p>
                        </div>
                    </div>
                    {selectedTable && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchTableData(selectedTable)}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan/20 to-purple-500/20 hover:from-cyan/30 hover:to-purple-500/30 rounded-xl transition-all border border-cyan/30 shadow-lg shadow-cyan/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 text-cyan ${loading ? 'animate-spin' : ''}`} />
                            <span className="font-medium text-white">Refresh</span>
                        </motion.button>
                    )}
                </motion.div>

                {/* Warning Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-lg shadow-orange-500/5"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                    </motion.div>
                    <div>
                        <p className="text-orange-400 font-semibold text-lg">Caution: Direct Database Access</p>
                        <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                            You have full control over the database. Changes are <span className="font-semibold text-orange-300">immediate</span> and <span className="font-semibold text-orange-300">cannot be undone</span>.
                            Exercise caution when editing or deleting records.
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Tables List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-cyan/20 p-5 shadow-xl shadow-cyan/5 sticky top-6">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                                <TableIcon className="w-5 h-5 text-cyan" />
                                Tables
                                <span className="ml-auto text-xs px-2 py-1 bg-cyan/20 text-cyan rounded-full font-semibold">
                                    {tables.length}
                                </span>
                            </h2>
                            <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                                {tables.map((table, idx) => (
                                    <motion.button
                                        key={table}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.02 }}
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => fetchTableData(table)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${
                                            selectedTable === table
                                                ? 'bg-gradient-to-r from-cyan/30 to-purple-500/20 text-white font-semibold border border-cyan/40 shadow-lg shadow-cyan/10'
                                                : 'hover:bg-[#2a2a2d] text-gray-400 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        <span className="truncate">{table}</span>
                                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all ${
                                            selectedTable === table
                                                ? 'opacity-100 translate-x-1'
                                                : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                                        }`} />
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Table Data */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3"
                    >
                        {!selectedTable ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-cyan/20 p-16 text-center shadow-xl"
                            >
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <Database className="w-20 h-20 text-cyan/30 mx-auto mb-6" />
                                </motion.div>
                                <p className="text-gray-400 text-lg">Select a table from the left to view and edit data</p>
                                <p className="text-gray-500 text-sm mt-2">Full control over your database awaits</p>
                            </motion.div>
                        ) : (
                            <div className="bg-gradient-to-br from-[#1b1b1d] to-[#0e0e0f] rounded-2xl border border-cyan/20 overflow-hidden shadow-xl">
                                {/* Search */}
                                <div className="p-5 border-b border-cyan/10 bg-[#0e0e0f]/50 backdrop-blur-sm">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan/50" />
                                            <input
                                                type="text"
                                                placeholder="Search in table..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-[#0e0e0f] border border-cyan/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-3 bg-cyan/10 border border-cyan/30 rounded-xl">
                                            <TableIcon className="w-4 h-4 text-cyan" />
                                            <span className="text-sm font-semibold text-white">
                                                {filteredData.length}
                                            </span>
                                            <span className="text-sm text-gray-400">records</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-96">
                                        <Loader2 className="w-12 h-12 text-cyan animate-spin mb-4" />
                                        <p className="text-gray-400 text-lg font-medium">Loading table data...</p>
                                        <p className="text-gray-500 text-sm mt-1">Please wait</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <div className="max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">
                                            <table className="w-full">
                                                <thead className="bg-gradient-to-r from-[#0e0e0f] to-[#1a1a1c] sticky top-0 z-10 border-b border-cyan/20">
                                                    <tr>
                                                        {columns.map((col) => (
                                                            <th key={col} className="px-4 py-4 text-left text-xs font-bold text-cyan uppercase tracking-wider whitespace-nowrap">
                                                                {col.replace(/_/g, ' ')}
                                                            </th>
                                                        ))}
                                                        <th className="px-4 py-4 text-right text-xs font-bold text-cyan uppercase tracking-wider sticky right-0 bg-[#0e0e0f]">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <AnimatePresence mode="popLayout">
                                                        {filteredData.map((row, idx) => {
                                                            const rowId = row.id || row[columns[0]];
                                                            const isEditing = editingRow === rowId;

                                                            return (
                                                                <motion.tr
                                                                    key={rowId}
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, x: -100 }}
                                                                    transition={{ delay: idx * 0.02 }}
                                                                    className={`border-b border-cyan/5 transition-all ${
                                                                        isEditing
                                                                            ? 'bg-cyan/10 shadow-lg shadow-cyan/20'
                                                                            : 'hover:bg-[#0e0e0f]/50'
                                                                    }`}
                                                                >
                                                                    {columns.map((col) => (
                                                                        <td key={col} className="px-4 py-3 text-sm whitespace-nowrap">
                                                                            {isEditing ? (
                                                                                renderField(col, editData[col])
                                                                            ) : (
                                                                                <span className={`${
                                                                                    col === 'id' || col === 'clerk_id'
                                                                                        ? 'text-gray-500 font-mono text-xs'
                                                                                        : col.includes('email')
                                                                                        ? 'text-cyan'
                                                                                        : col === 'subscription_tier'
                                                                                        ? row[col] === 'scale'
                                                                                            ? 'text-purple-400 font-semibold'
                                                                                            : row[col] === 'growth'
                                                                                            ? 'text-blue-400 font-semibold'
                                                                                            : 'text-green-400 font-semibold'
                                                                                        : col === 'status'
                                                                                        ? row[col] === 'completed'
                                                                                            ? 'text-emerald-400'
                                                                                            : row[col] === 'failed'
                                                                                            ? 'text-red-400'
                                                                                            : row[col] === 'in_progress'
                                                                                            ? 'text-blue-400'
                                                                                            : 'text-gray-400'
                                                                                        : typeof row[col] === 'boolean'
                                                                                        ? row[col]
                                                                                            ? 'text-emerald-400 font-semibold'
                                                                                            : 'text-gray-500'
                                                                                        : 'text-gray-300'
                                                                                }`}>
                                                                                    {typeof row[col] === 'object'
                                                                                        ? JSON.stringify(row[col]).substring(0, 50) + '...'
                                                                                        : typeof row[col] === 'boolean'
                                                                                        ? row[col] ? '✓ True' : '✗ False'
                                                                                        : String(row[col] || '-').substring(0, 100)
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                    <td className="px-4 py-3 text-right sticky right-0 bg-inherit">
                                                                        {isEditing ? (
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <motion.button
                                                                                    whileHover={{ scale: 1.1 }}
                                                                                    whileTap={{ scale: 0.9 }}
                                                                                    onClick={handleSave}
                                                                                    className="p-2.5 bg-gradient-to-r from-emerald-500/20 to-cyan/20 hover:from-emerald-500/30 hover:to-cyan/30 rounded-xl transition-all border border-emerald-500/30 shadow-lg"
                                                                                >
                                                                                    <Save className="w-4 h-4 text-emerald-400" />
                                                                                </motion.button>
                                                                                <motion.button
                                                                                    whileHover={{ scale: 1.1 }}
                                                                                    whileTap={{ scale: 0.9 }}
                                                                                    onClick={() => {
                                                                                        setEditingRow(null);
                                                                                        setEditData({});
                                                                                    }}
                                                                                    className="p-2.5 hover:bg-red-500/20 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                                                                                >
                                                                                    <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                                                                </motion.button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <motion.button
                                                                                    whileHover={{ scale: 1.1 }}
                                                                                    whileTap={{ scale: 0.9 }}
                                                                                    onClick={() => handleEdit(row)}
                                                                                    className="p-2.5 hover:bg-cyan/20 rounded-xl transition-all group border border-transparent hover:border-cyan/30"
                                                                                >
                                                                                    <Edit className="w-4 h-4 text-gray-400 group-hover:text-cyan transition-colors" />
                                                                                </motion.button>
                                                                                <motion.button
                                                                                    whileHover={{ scale: 1.1 }}
                                                                                    whileTap={{ scale: 0.9 }}
                                                                                    onClick={() => handleDelete(rowId)}
                                                                                    className="p-2.5 hover:bg-red-500/20 rounded-xl transition-all group border border-transparent hover:border-red-500/30"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                                                                                </motion.button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </motion.tr>
                                                            );
                                                        })}
                                                    </AnimatePresence>
                                                </tbody>
                                            </table>

                                            {filteredData.length === 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="p-16 text-center"
                                                >
                                                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                                    <p className="text-gray-400 text-lg font-medium">No records found</p>
                                                    <p className="text-gray-500 text-sm mt-2">Try adjusting your search query</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
