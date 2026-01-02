'use client';

import { useState, useEffect } from 'react';
import { Pencil, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { validateFieldValue } from '@/lib/vault/fieldStructures';

/**
 * FieldEditor - Individual field editing component
 *
 * Props:
 * - fieldDef: Field definition from fieldStructures.js
 * - initialValue: Current field value
 * - sectionId: Section ID (e.g., 'idealClient')
 * - funnelId: Funnel ID for backend save
 * - onSave: Callback after successful save
 * - onAIFeedback: Callback to open AI feedback modal for this field
 */
export default function FieldEditor({
    fieldDef,
    initialValue,
    sectionId,
    funnelId,
    onSave,
    onAIFeedback
}) {
    // Parse value - handle JSON strings for array fields
    const parseValue = (val, fieldType) => {
        if (val === null || val === undefined) return fieldType === 'array' ? [] : '';
        if (fieldType === 'array') {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            }
            return [];
        }
        return val;
    };

    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(parseValue(initialValue, fieldDef.field_type));
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const {
        field_id,
        field_label,
        field_type,
        field_metadata
    } = fieldDef;

    // Sync with external changes
    useEffect(() => {
        setValue(parseValue(initialValue, field_type));
    }, [initialValue, field_type]);

    // Validate on value change
    useEffect(() => {
        if (isEditing) {
            const validation = validateFieldValue(fieldDef, value);
            setValidationErrors(validation.errors);
        }
    }, [value, isEditing, fieldDef]);

    const handleEdit = () => {
        setIsEditing(true);
        setSaveSuccess(false);
    };

    const handleCancel = () => {
        setValue(initialValue);
        setIsEditing(false);
        setValidationErrors([]);
    };

    const handleSave = async () => {
        // Validate before save
        const validation = validateFieldValue(fieldDef, value);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const response = await fetch('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    field_id,
                    field_value: value
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save field');
            }

            const result = await response.json();

            // Success
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);

            // Callback to parent
            if (onSave) {
                onSave(field_id, value, result);
            }

        } catch (error) {
            console.error('[FieldEditor] Save error:', error);
            setValidationErrors([error.message]);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAIFeedback = () => {
        if (onAIFeedback) {
            onAIFeedback(field_id, field_label, value);
        }
    };

    // Render based on field type
    const renderFieldInput = () => {
        if (field_type === 'text' || field_type === 'textarea') {
            return (
                <div className="w-full">
                    {field_type === 'text' ? (
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={field_metadata.placeholder || field_label}
                            maxLength={field_metadata.maxLength}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2 bg-[#18181b] border rounded-xl text-white placeholder-gray-500 transition-colors ${isEditing
                                    ? 'border-cyan focus:border-cyan focus:ring-1 focus:ring-cyan'
                                    : 'border-[#3a3a3d] cursor-not-allowed opacity-75'
                                }`}
                        />
                    ) : (
                        <textarea
                            value={value || ''}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={field_metadata.placeholder || field_label}
                            maxLength={field_metadata.maxLength}
                            rows={field_metadata.rows || 3}
                            disabled={!isEditing}
                            className={`w-full px-4 py-3 bg-[#18181b] border rounded-xl text-white placeholder-gray-500 resize-none transition-colors ${isEditing
                                    ? 'border-cyan focus:border-cyan focus:ring-1 focus:ring-cyan'
                                    : 'border-[#3a3a3d] cursor-not-allowed opacity-75'
                                }`}
                        />
                    )}
                    {field_metadata.hint && isEditing && (
                        <p className="mt-2 text-xs text-gray-500">{field_metadata.hint}</p>
                    )}
                    {field_metadata.maxLength && isEditing && (
                        <p className="mt-1 text-xs text-gray-600 text-right">
                            {(value || '').length} / {field_metadata.maxLength}
                        </p>
                    )}
                </div>
            );
        }

        if (field_type === 'array') {
            const arrayValue = Array.isArray(value) ? value : [];
            const minItems = field_metadata.minItems || 0;
            const maxItems = field_metadata.maxItems || 10;

            return (
                <div className="w-full space-y-3">
                    {arrayValue.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="mt-3 text-sm text-gray-500 font-medium">{idx + 1}.</span>
                            <input
                                type="text"
                                value={item || ''}
                                onChange={(e) => {
                                    const newArray = [...arrayValue];
                                    newArray[idx] = e.target.value;
                                    setValue(newArray);
                                }}
                                placeholder={field_metadata.placeholder?.replace('{{index}}', idx + 1) || `Item ${idx + 1}`}
                                maxLength={field_metadata.itemMaxLength}
                                disabled={!isEditing}
                                className={`flex-1 px-4 py-2 bg-[#18181b] border rounded-xl text-white placeholder-gray-500 transition-colors ${isEditing
                                        ? 'border-cyan focus:border-cyan focus:ring-1 focus:ring-cyan'
                                        : 'border-[#3a3a3d] cursor-not-allowed opacity-75'
                                    }`}
                            />
                            {isEditing && arrayValue.length > minItems && (
                                <button
                                    onClick={() => {
                                        const newArray = arrayValue.filter((_, i) => i !== idx);
                                        setValue(newArray);
                                    }}
                                    className="mt-2 p-2 text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {isEditing && arrayValue.length < maxItems && (
                        <button
                            onClick={() => setValue([...arrayValue, ''])}
                            className="text-sm text-cyan hover:text-cyan/80 transition-colors"
                        >
                            + Add item
                        </button>
                    )}
                    {field_metadata.hint && isEditing && (
                        <p className="text-xs text-gray-500">{field_metadata.hint}</p>
                    )}
                </div>
            );
        }

        return <p className="text-gray-500">Unsupported field type: {field_type}</p>;
    };

    return (
        <div className="space-y-3">
            {/* Field Label */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                    {field_label}
                </label>
                <div className="flex items-center gap-2">
                    {/* Save Success Indicator */}
                    {saveSuccess && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3 h-3" />
                            Saved
                        </span>
                    )}

                    {/* AI Feedback Button */}
                    <button
                        onClick={handleAIFeedback}
                        disabled={isEditing}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-3 h-3" />
                        AI Feedback
                    </button>

                    {/* Edit/Save/Cancel Buttons */}
                    {!isEditing ? (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-cyan/20 text-cyan rounded-lg hover:bg-cyan/30 transition-colors"
                        >
                            <Pencil className="w-3 h-3" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || validationErrors.length > 0}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-cyan text-black rounded-lg hover:bg-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3 h-3" />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Field Input */}
            {renderFieldInput()}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        {validationErrors.map((error, idx) => (
                            <p key={idx} className="text-sm text-red-400">{error}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
