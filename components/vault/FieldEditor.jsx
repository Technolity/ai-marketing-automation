'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, AlertCircle, Upload, Loader2, Image as ImageIcon, Video, Trash2, Link as LinkIcon, Info } from 'lucide-react';
import { validateFieldValue } from '@/lib/vault/fieldStructures';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

// Helper to auto-resize a textarea element (no max height - grows with content)
const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};

// Helper to sanitize displayed content
const sanitizeDisplayContent = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    return text
        .replace(/\\n/g, '\n')           // Fix escaped newlines
        .replace(/═+/g, '')              // Remove box chars
        .replace(/─+/g, '')              // Remove line chars
        .replace(/\[object Object\]/g, '') // Remove object strings
        .replace(/^\s*[-=]+\s*$/gm, '')   // Remove separator lines
        .trim();
};

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
            if (Array.isArray(val)) {
                // Sanitize each string item in array
                return val.map(item => typeof item === 'string' ? sanitizeDisplayContent(item) : item);
            }
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) {
                        return parsed.map(item => typeof item === 'string' ? sanitizeDisplayContent(item) : item);
                    }
                    return [];
                } catch {
                    return [];
                }
            }
            return [];
        }
        // Sanitize text values
        if (typeof val === 'string') {
            return sanitizeDisplayContent(val);
        }
        return val;
    };

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
        const validation = validateFieldValue(fieldDef, value);
        setValidationErrors(validation.errors);
    }, [value, fieldDef]);

    const handleSave = async (newValue = value) => {
        // Validate before save
        const validation = validateFieldValue(fieldDef, newValue);
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
                    field_value: newValue
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save field');
            }

            const result = await response.json();

            // Success
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);

            // Callback to parent
            if (onSave) {
                onSave(field_id, newValue, result);
            }

        } catch (error) {
            console.error('[FieldEditor] Save error:', error);
            setValidationErrors([error.message]);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBlur = () => {
        // Only save if value has changed from initial
        const currentValue = JSON.stringify(value);
        const startValue = JSON.stringify(parseValue(initialValue, field_type));

        if (currentValue !== startValue) {
            handleSave();
        }
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
                            onBlur={handleBlur}
                            placeholder={field_metadata.placeholder || field_label}
                            maxLength={field_metadata.maxLength}
                            className="w-full px-4 py-2 bg-[#18181b] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-500 transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan"
                        />
                    ) : (
                        <textarea
                            ref={(el) => el && autoResizeTextarea(el)}
                            value={value || ''}
                            onChange={(e) => {
                                setValue(e.target.value);
                                autoResizeTextarea(e.target);
                            }}
                            onBlur={handleBlur}
                            placeholder={field_metadata.placeholder || field_label}
                            maxLength={field_metadata.maxLength}
                            style={{ minHeight: '4.5rem', maxHeight: '18rem', height: 'auto' }}
                            className="w-full px-4 py-3 bg-[#18181b] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-500 resize-none transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan overflow-y-auto"
                        />
                    )}
                    {field_metadata.maxLength && (
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
                            <div key={idx} className="flex items-start gap-2 group relative">
                                <span className="mt-3 text-sm text-gray-500 font-medium">{idx + 1}.</span>
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={(el) => el && autoResizeTextarea(el, 192)}
                                        value={item || ''}
                                        onChange={(e) => {
                                            const newArray = [...arrayValue];
                                            newArray[idx] = e.target.value;
                                            setValue(newArray);
                                            autoResizeTextarea(e.target, 192);
                                        }}
                                        onBlur={handleBlur}
                                        placeholder={field_metadata.placeholder?.replace('{{index}}', idx + 1) || `Item ${idx + 1}`}
                                        maxLength={field_metadata.itemMaxLength}
                                        style={{ minHeight: '3.5rem', maxHeight: '12rem', height: 'auto' }}
                                        className="w-full px-4 py-2 bg-[#18181b] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-500 transition-colors resize-none focus:border-cyan focus:ring-1 focus:ring-cyan overflow-y-auto"
                                    />
                                </div>
                                {arrayValue.length > minItems && (
                                    <button
                                        onClick={() => {
                                            const newArray = arrayValue.filter((_, i) => i !== idx);
                                            setValue(newArray);
                                            handleSave(newArray); // Immediate save on delete
                                        }}
                                        className="mt-2 p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {arrayValue.length < maxItems && (
                            <button
                                onClick={() => setValue([...arrayValue, ''])}
                                className="text-sm text-cyan hover:text-cyan/80 transition-colors"
                            >
                                + Add item
                            </button>
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
                                <div key={idx} className="bg-[#18181b] border border-[#3a3a3d] rounded-xl p-4 space-y-3 relative group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-400">Item {idx + 1}</span>
                                        {arrayValue.length > minItems && (
                                            <button
                                                onClick={() => {
                                                    const newArray = arrayValue.filter((_, i) => i !== idx);
                                                    setValue(newArray);
                                                    handleSave(newArray);
                                                }}
                                                className="p-1 text-gray-500 hover:text-red-400 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {subfields.map((subfield, sfIdx) => {
                                        const subfieldValue = itemValue[subfield.field_id] || '';
                                        const isTextarea = subfield.field_type === 'textarea';

                                        return (
                                            <div key={sfIdx} className="space-y-1 relative group/sub">
                                                <label className="text-xs font-medium text-gray-500">
                                                    {subfield.field_label}
                                                </label>
                                                {isTextarea ? (
                                                    <textarea
                                                        ref={(el) => el && autoResizeTextarea(el, 160)}
                                                        value={subfieldValue}
                                                        onChange={(e) => {
                                                            const newArray = [...arrayValue];
                                                            newArray[idx] = { ...itemValue, [subfield.field_id]: e.target.value };
                                                            setValue(newArray);
                                                            autoResizeTextarea(e.target, 160);
                                                        }}
                                                        onBlur={handleBlur}
                                                        placeholder={subfield.placeholder}
                                                        maxLength={subfield.maxLength}
                                                        style={{ minHeight: '3rem', maxHeight: '10rem', height: 'auto' }}
                                                        className="w-full px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-600 text-sm resize-none transition-colors focus:border-cyan/50 focus:ring-1 focus:ring-cyan overflow-y-auto"
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
                                                        onBlur={handleBlur}
                                                        placeholder={subfield.placeholder}
                                                        maxLength={subfield.maxLength}
                                                        className="w-full px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-600 text-sm transition-colors focus:border-cyan/50 focus:ring-1 focus:ring-cyan"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {arrayValue.length < maxItems && (
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
                    </div>
                );
            }
        }


        // Object fields (e.g., bestIdealClient with demographic subfields)
        if (field_type === 'object') {
            const subfields = field_metadata.subfields || [];
            let objectValue = {};

            // Helper to safely parse JSON with control characters
            const safeParseJSON = (str) => {
                if (!str || typeof str !== 'string') return null;

                // If it's already an object, return it
                if (typeof str === 'object') return str;

                try {
                    // First try direct parse
                    return JSON.parse(str);
                } catch (e) {
                    // If that fails, try to sanitize the string
                    try {
                        // Replace problematic control characters in string values
                        // This handles raw newlines, tabs, etc. inside JSON strings
                        let sanitized = str
                            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
                                // Map control characters to their escaped versions
                                const map = {
                                    '\n': '\\n',
                                    '\r': '\\r',
                                    '\t': '\\t',
                                    '\b': '\\b',
                                    '\f': '\\f'
                                };
                                return map[char] || '';
                            });

                        return JSON.parse(sanitized);
                    } catch (e2) {
                        // Last resort: try to extract fields manually
                        console.warn('[FieldEditor] Could not parse JSON even after sanitization');
                        return null;
                    }
                }
            };

            // Parse stored JSON string into object
            try {
                // Handle empty/null values gracefully
                if (!value || value === '' || value === 'null' || value === 'undefined') {
                    objectValue = {};
                } else if (typeof value === 'object') {
                    // Already an object
                    objectValue = value;
                } else {
                    objectValue = safeParseJSON(value) || {};
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
                                <div className="relative group">
                                    {subfield.field_type === 'textarea' ? (
                                        <textarea
                                            ref={(el) => el && autoResizeTextarea(el)}
                                            value={subfieldValue}
                                            onChange={(e) => {
                                                const newObj = { ...objectValue, [subfield.field_id]: e.target.value };
                                                setValue(newObj);
                                                autoResizeTextarea(e.target);
                                            }}
                                            onBlur={handleBlur}
                                            placeholder={subfield.placeholder}
                                            maxLength={subfield.maxLength}
                                            style={{ minHeight: '3rem' }}
                                            className="w-full px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-600 text-sm resize-none transition-colors focus:border-cyan/50 focus:ring-1 focus:ring-cyan"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={subfieldValue}
                                            onChange={(e) => {
                                                const newObj = { ...objectValue, [subfield.field_id]: e.target.value };
                                                setValue(newObj);
                                            }}
                                            onBlur={handleBlur}
                                            placeholder={subfield.placeholder}
                                            maxLength={subfield.maxLength}
                                            className="w-full px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-600 text-sm transition-colors focus:border-cyan/50 focus:ring-1 focus:ring-cyan"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                        handleSave(data.fullUrl); // Immediate save on upload
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
                            <label className={`relative block group cursor-pointer ${isUploading ? 'pointer-events-none opacity-70' : ''}`}>
                                <input
                                    type="file"
                                    accept={isVideo ? "video/*" : "image/*"}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                                <div className="w-full px-4 py-8 border-2 border-dashed border-[#2a2a2d] rounded-xl text-center transition-all hover:border-cyan hover:bg-[#1f1f22]">
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

                            {/* URL Input Fallback */}
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                                <input
                                    type="url"
                                    value={value || ''}
                                    onChange={(e) => setValue(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder={field_metadata.placeholder || "Or paste URL..."}
                                    className="w-full pl-10 pr-4 py-2 bg-[#18181b] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-500 transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan"
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

                                <button
                                    onClick={() => {
                                        setValue('');
                                        handleSave(''); // Save empty value 
                                    }}
                                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                    title="Remove file"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
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
                                            onBlur={handleBlur}
                                            placeholder={subfield.placeholder || subfield.field_label}
                                            maxLength={subfield.maxLength}
                                            rows={subfield.rows || 3}
                                            className="w-full px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-600 text-sm resize-none transition-colors focus:border-cyan/50 focus:ring-1 focus:ring-cyan"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={subfieldValue}
                                            onChange={(e) => {
                                                const newObj = { ...objectValue, [subfield.field_id]: e.target.value };
                                                setValue(newObj);
                                            }}
                                            onBlur={handleBlur}
                                            placeholder={subfield.placeholder || subfield.field_label}
                                            maxLength={subfield.maxLength}
                                            className="w-full px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-600 text-sm transition-colors focus:border-cyan/50 focus:ring-1 focus:ring-cyan"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return <p className="text-gray-500">Unsupported field type: {field_type}</p>;
    };

    return (
        <div className="space-y-3">
            {/* Field Label with Info Tooltip */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-300">
                        {field_label}
                    </label>
                    {field_metadata.hint && (
                        <div className="relative group/info">
                            <Info className="w-3.5 h-3.5 text-gray-500 cursor-help hover:text-cyan transition-colors" />
                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-[#1a1a1d] border border-[#3a3a3d] rounded-lg shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50">
                                <p className="text-xs text-gray-400 leading-relaxed">{field_metadata.hint.replace('📍 ', '')}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Save Success Indicator */}
                    {saveSuccess && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3 h-3" />
                            Saved
                        </span>
                    )}
                    {isSaving && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </span>
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
