'use client';

import { useState } from 'react';
import { Plus, X, Check, Sparkles } from 'lucide-react';

/**
 * CustomFieldAdder - Component to add user-created custom fields
 *
 * Props:
 * - sectionId: Section ID (e.g., 'idealClient')
 * - funnelId: Funnel ID for backend save
 * - onFieldAdded: Callback after field is successfully added
 */
export default function CustomFieldAdder({ sectionId, funnelId, onFieldAdded }) {
    const [isAdding, setIsAdding] = useState(false);
    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldType, setFieldType] = useState('text');
    const [initialValue, setInitialValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [useAI, setUseAI] = useState(false);

    const handleStartAdding = () => {
        setIsAdding(true);
        setFieldLabel('');
        setFieldType('text');
        setInitialValue('');
        setError('');
        setUseAI(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setFieldLabel('');
        setFieldType('text');
        setInitialValue('');
        setError('');
        setUseAI(false);
    };

    const handleSave = async () => {
        // Validate
        if (!fieldLabel.trim()) {
            setError('Field label is required');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            // Generate a unique field ID
            const field_id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Prepare field value based on type
            let field_value;
            if (fieldType === 'array') {
                field_value = initialValue.trim() ? [initialValue] : [''];
            } else {
                field_value = initialValue;
            }

            const response = await fetch('/api/os/vault-field', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    field_id,
                    field_label: fieldLabel.trim(),
                    field_value,
                    field_type: fieldType,
                    field_metadata: {
                        rows: fieldType === 'textarea' ? 3 : undefined,
                        maxLength: fieldType === 'text' || fieldType === 'textarea' ? 500 : undefined,
                        minItems: fieldType === 'array' ? 1 : undefined,
                        maxItems: fieldType === 'array' ? 10 : undefined
                    },
                    is_custom: true,
                    use_ai: useAI
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add custom field');
            }

            const result = await response.json();

            // Success - reset form
            setIsAdding(false);
            setFieldLabel('');
            setFieldType('text');
            setInitialValue('');
            setUseAI(false);

            // Callback to parent
            if (onFieldAdded) {
                onFieldAdded(result.field);
            }

        } catch (err) {
            console.error('[CustomFieldAdder] Save error:', err);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAdding) {
        // Custom fields temporarily disabled
        return (
            <button
                disabled
                className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-500 cursor-not-allowed opacity-60"
                title="Custom fields are temporarily under maintenance"
            >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Custom Field</span>
                <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">Under Maintenance</span>
            </button>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-[#18181b] to-[#0e0e0f] border border-cyan/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Add Custom Field</h4>
                <button
                    onClick={handleCancel}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Field Label */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                    Field Label <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    placeholder="e.g., Additional Notes, Special Requirements..."
                    className="w-full px-4 py-2 bg-[#0e0e0f] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-600 focus:border-cyan focus:ring-1 focus:ring-cyan transition-colors"
                />
            </div>

            {/* Field Type */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                    Field Type
                </label>
                <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0e0e0f] border border-[#3a3a3d] rounded-xl text-white focus:border-cyan focus:ring-1 focus:ring-cyan transition-colors"
                >
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text (Paragraph)</option>
                    <option value="array">List (Multiple Items)</option>
                </select>
            </div>

            {/* Initial Value */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                    Initial Value (Optional)
                </label>
                {fieldType === 'textarea' ? (
                    <textarea
                        value={initialValue}
                        onChange={(e) => setInitialValue(e.target.value)}
                        placeholder="Enter initial content..."
                        rows={3}
                        className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-600 resize-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-colors"
                    />
                ) : (
                    <input
                        type="text"
                        value={initialValue}
                        onChange={(e) => setInitialValue(e.target.value)}
                        placeholder={fieldType === 'array' ? 'First item (more can be added later)' : 'Enter initial value...'}
                        className="w-full px-4 py-2 bg-[#0e0e0f] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-600 focus:border-cyan focus:ring-1 focus:ring-cyan transition-colors"
                    />
                )}
            </div>

            {/* AI Generation Toggle */}
            <div className="flex items-center gap-3 p-3 bg-purple-600/10 border border-purple-600/30 rounded-xl">
                <input
                    type="checkbox"
                    id="useAI"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-600 bg-[#0e0e0f] text-purple-600 focus:ring-purple-600 focus:ring-offset-0"
                />
                <label htmlFor="useAI" className="flex-1 flex items-center gap-2 text-sm text-purple-400 cursor-pointer">
                    <Sparkles className="w-4 h-4" />
                    Use AI to generate content for this field
                </label>
            </div>

            {useAI && (
                <p className="text-xs text-gray-500 -mt-2">
                    AI will analyze your existing content and generate relevant content for this new field.
                </p>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-[#3a3a3d] text-white rounded-xl hover:bg-[#4a4a4d] transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !fieldLabel.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan to-purple-600 text-black font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            {useAI ? 'Generating with AI...' : 'Adding...'}
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            {useAI ? 'Generate with AI' : 'Add Field'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
