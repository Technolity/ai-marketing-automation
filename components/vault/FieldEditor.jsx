'use client';

import { useState, useEffect } from 'react';
import { Pencil, Sparkles, Check, X, AlertCircle, Upload, Loader2, Image as ImageIcon, Video, Trash2, Link as LinkIcon } from 'lucide-react';
import InlineAIButton from './InlineAIButton';
import { validateFieldValue } from '@/lib/vault/fieldStructures';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

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
    const [isUploading, setIsUploading] = useState(false);
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
            const response = await fetchWithAuth('/api/os/vault-field', {
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
    // Handle inline AI update
    const handleInlineAIUpdate = (newValue) => {
        setValue(newValue);
        // Trigger auto-save after AI update
        setTimeout(async () => {
            try {
                const response = await fetchWithAuth('/api/os/vault-field', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        funnel_id: funnelId,
                        section_id: sectionId,
                        field_id,
                        field_value: newValue
                    })
                });
                if (response.ok) {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                    if (onSave) onSave(field_id, newValue, await response.json());
                }
            } catch (error) {
                console.error('[FieldEditor] AI update save error:', error);
            }
        }, 100);
    };

    const renderFieldInput = () => {
        if (field_type === 'text' || field_type === 'textarea') {
            return (
                <div className="w-full relative group">
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
                    {/* Inline AI Button - appears on hover */}
                    {!isEditing && (value || '').length > 0 && (
                        <InlineAIButton
                            fieldId={field_id}
                            fieldLabel={field_label}
                            currentValue={value || ''}
                            sectionId={sectionId}
                            funnelId={funnelId}
                            onUpdate={handleInlineAIUpdate}
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
            const itemType = field_metadata.itemType || 'text';

            // Simple text/string array
            if (itemType === 'text') {
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

            // Array of objects with subfields
            if (itemType === 'object') {
                const subfields = field_metadata.subfields || [];

                return (
                    <div className="w-full space-y-4">
                        {arrayValue.map((item, idx) => {
                            const itemValue = typeof item === 'object' ? item : {};

                            return (
                                <div key={idx} className="bg-[#18181b] border border-[#3a3a3d] rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-400">Item {idx + 1}</span>
                                        {isEditing && arrayValue.length > minItems && (
                                            <button
                                                onClick={() => {
                                                    const newArray = arrayValue.filter((_, i) => i !== idx);
                                                    setValue(newArray);
                                                }}
                                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {subfields.map((subfield, sfIdx) => {
                                        const subfieldValue = itemValue[subfield.field_id] || '';
                                        const isTextarea = subfield.field_type === 'textarea';

                                        return (
                                            <div key={sfIdx} className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">
                                                    {subfield.field_label}
                                                </label>
                                                {isTextarea ? (
                                                    <textarea
                                                        value={subfieldValue}
                                                        onChange={(e) => {
                                                            const newArray = [...arrayValue];
                                                            newArray[idx] = { ...itemValue, [subfield.field_id]: e.target.value };
                                                            setValue(newArray);
                                                        }}
                                                        placeholder={subfield.placeholder}
                                                        maxLength={subfield.maxLength}
                                                        rows={subfield.rows || 2}
                                                        disabled={!isEditing}
                                                        className={`w-full px-3 py-2 bg-[#0e0e0f] border rounded-lg text-white placeholder-gray-600 text-sm resize-none transition-colors ${isEditing
                                                            ? 'border-cyan/50 focus:border-cyan focus:ring-1 focus:ring-cyan'
                                                            : 'border-[#2a2a2d] cursor-not-allowed opacity-75'
                                                            }`}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={subfieldValue}
                                                        onChange={(e) => {
                                                            const newArray = [...arrayValue];
                                                            newArray[idx] = { ...itemValue, [subfield.field_id]: e.target.value };
                                                            setValue(newArray);
                                                        }}
                                                        placeholder={subfield.placeholder}
                                                        maxLength={subfield.maxLength}
                                                        disabled={!isEditing}
                                                        className={`w-full px-3 py-2 bg-[#0e0e0f] border rounded-lg text-white placeholder-gray-600 text-sm transition-colors ${isEditing
                                                            ? 'border-cyan/50 focus:border-cyan focus:ring-1 focus:ring-cyan'
                                                            : 'border-[#2a2a2d] cursor-not-allowed opacity-75'
                                                            }`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {isEditing && arrayValue.length < maxItems && (
                            <button
                                onClick={() => {
                                    // Create empty object with all subfield keys
                                    const emptyItem = {};
                                    subfields.forEach(sf => emptyItem[sf.field_id] = '');
                                    setValue([...arrayValue, emptyItem]);
                                }}
                                className="text-sm text-cyan hover:text-cyan/80 transition-colors"
                            >
                                + Add item
                            </button>
                        )}
                        {field_metadata.hint && isEditing && (
                            <p className="text-xs text-gray-500 mt-2">{field_metadata.hint}</p>
                        )}
                    </div>
                );
            }
        }

        // Object fields (e.g., bestIdealClient with demographic subfields)
        if (field_type === 'object') {
            const subfields = field_metadata.subfields || [];
            let objectValue = {};

            // Parse stored JSON string into object
            try {
                // Handle empty/null values gracefully
                if (!value || value === '' || value === 'null' || value === 'undefined') {
                    objectValue = {};
                } else {
                    objectValue = typeof value === 'string' ? JSON.parse(value) : (value || {});
                }
            } catch (e) {
                // Only log if the value wasn't empty - empty values failing to parse is expected
                if (value && value.length > 0) {
                    console.error('[FieldEditor] Failed to parse object value:', e);
                }
                objectValue = {};
            }

            return (
                <div className="w-full space-y-3">
                    {subfields.map((subfield, idx) => {
                        const subfieldValue = objectValue[subfield.field_id] || '';

                        return (
                            <div key={idx} className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">
                                    {subfield.field_label}
                                </label>
                                {subfield.field_type === 'textarea' ? (
                                    <textarea
                                        value={subfieldValue}
                                        onChange={(e) => {
                                            const newObj = { ...objectValue, [subfield.field_id]: e.target.value };
                                            setValue(newObj);
                                        }}
                                        placeholder={subfield.placeholder}
                                        rows={subfield.rows || 3}
                                        maxLength={subfield.maxLength}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 bg-[#0e0e0f] border rounded-lg text-white placeholder-gray-600 text-sm resize-none transition-colors ${isEditing
                                            ? 'border-cyan/50 focus:border-cyan focus:ring-1 focus:ring-cyan'
                                            : 'border-[#2a2a2d] cursor-not-allowed opacity-75'
                                            }`}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={subfieldValue}
                                        onChange={(e) => {
                                            const newObj = { ...objectValue, [subfield.field_id]: e.target.value };
                                            setValue(newObj);
                                        }}
                                        placeholder={subfield.placeholder}
                                        maxLength={subfield.maxLength}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 bg-[#0e0e0f] border rounded-lg text-white placeholder-gray-600 text-sm transition-colors ${isEditing
                                            ? 'border-cyan/50 focus:border-cyan focus:ring-1 focus:ring-cyan'
                                            : 'border-[#2a2a2d] cursor-not-allowed opacity-75'
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                    {field_metadata.hint && isEditing && (
                        <p className="text-xs text-gray-500 mt-2">{field_metadata.hint}</p>
                    )}
                </div>
            );
        }

        if (field_type === 'image' || field_type === 'video_url') {
            const isVideo = field_type === 'video_url';

            const handleFileUpload = async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Client-side validation
                const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB video, 10MB image
                if (file.size > maxSize) {
                    toast.error(`File too large. Max size: ${isVideo ? '100MB' : '10MB'}`);
                    return;
                }

                setIsUploading(true);
                const toastId = toast.loading('Uploading...');

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('type', isVideo ? 'video' : 'image');

                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await res.json();

                    if (res.ok && data.success) {
                        setValue(data.fullUrl);
                        toast.success('File uploaded!', { id: toastId });
                    } else {
                        throw new Error(data.error || 'Upload failed');
                    }
                } catch (error) {
                    console.error('Upload Error:', error);
                    toast.error(`Upload failed: ${error.message}`, { id: toastId });
                } finally {
                    setIsUploading(false);
                }
            };

            return (
                <div className="w-full space-y-4">
                    {!value ? (
                        <div className="space-y-3">
                            {/* Upload Area */}
                            {isEditing && (
                                <label className={`relative block group cursor-pointer ${isUploading ? 'pointer-events-none opacity-70' : ''}`}>
                                    <input
                                        type="file"
                                        accept={isVideo ? "video/*" : "image/*"}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={!isEditing || isUploading}
                                    />
                                    <div className={`w-full px-4 py-8 border-2 border-dashed rounded-xl text-center transition-all ${isEditing
                                        ? 'border-gray-700 hover:border-cyan hover:bg-[#1f1f22]'
                                        : 'border-[#2a2a2d] cursor-not-allowed'
                                        }`}>
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2 text-cyan">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span className="text-sm">Uploading...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-300">
                                                <Upload className="w-6 h-6" />
                                                <span className="text-sm font-medium">Click to upload {isVideo ? 'video' : 'image'}</span>
                                                <span className="text-xs text-gray-600">Max size: {isVideo ? '100MB' : '10MB'}</span>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            )}

                            {/* URL Input Fallback */}
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                                <input
                                    type="url"
                                    value={value || ''}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={field_metadata.placeholder || "Or paste URL..."}
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-2 bg-[#18181b] border rounded-xl text-white placeholder-gray-500 transition-colors ${isEditing
                                        ? 'border-cyan focus:border-cyan focus:ring-1 focus:ring-cyan'
                                        : 'border-[#3a3a3d] cursor-not-allowed opacity-75'
                                        }`}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative group bg-[#18181b] border border-[#3a3a3d] rounded-xl p-3 overflow-hidden">
                            <div className="flex items-center gap-3">
                                {isVideo ? (
                                    <div className="w-12 h-12 bg-[#2a2a2d] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Video className="w-6 h-6 text-gray-400" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-[#2a2a2d] rounded-lg overflow-hidden flex-shrink-0 relative">
                                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-300 truncate">{value}</p>
                                    <a
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-cyan hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                        View in new tab <LinkIcon className="w-3 h-3" />
                                    </a>
                                </div>

                                {isEditing && (
                                    <button
                                        onClick={() => setValue('')}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                        title="Remove file"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {field_metadata.hint && isEditing && (
                        <p className="text-xs text-gray-500">{field_metadata.hint}</p>
                    )}
                </div>
            );
        }

        if (field_type === 'object') {
            const subfields = field_metadata.subfields || [];
            const objectValue = value && typeof value === 'object' ? value : {};

            return (
                <div className="w-full space-y-4">
                    <div className="bg-[#18181b] border border-[#3a3a3d] rounded-xl p-4 space-y-4">
                        {subfields.map((subfield, idx) => {
                            const subfieldValue = objectValue[subfield.field_id] || '';
                            const isTextarea = subfield.field_type === 'textarea';

                            return (
                                <div key={idx} className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">
                                        {subfield.field_label}
                                    </label>
                                    {isTextarea ? (
                                        <textarea
                                            value={subfieldValue}
                                            onChange={(e) => {
                                                const newObj = { ...objectValue, [subfield.field_id]: e.target.value };
                                                setValue(newObj);
                                            }}
                                            placeholder={subfield.placeholder || subfield.field_label}
                                            maxLength={subfield.maxLength}
                                            rows={subfield.rows || 3}
                                            disabled={!isEditing}
                                            className={`w-full px-3 py-2 bg-[#0e0e0f] border rounded-lg text-white placeholder-gray-600 text-sm resize-none transition-colors ${isEditing
                                                ? 'border-cyan/50 focus:border-cyan focus:ring-1 focus:ring-cyan'
                                                : 'border-[#2a2a2d] cursor-not-allowed opacity-75'
                                                }`}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={subfieldValue}
                                            onChange={(e) => {
                                                const newObj = { ...objectValue, [subfield.field_id]: e.target.value };
                                                setValue(newObj);
                                            }}
                                            placeholder={subfield.placeholder || subfield.field_label}
                                            maxLength={subfield.maxLength}
                                            disabled={!isEditing}
                                            className={`w-full px-3 py-2 bg-[#0e0e0f] border rounded-lg text-white placeholder-gray-600 text-sm transition-colors ${isEditing
                                                ? 'border-cyan/50 focus:border-cyan focus:ring-1 focus:ring-cyan'
                                                : 'border-[#2a2a2d] cursor-not-allowed opacity-75'
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
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
