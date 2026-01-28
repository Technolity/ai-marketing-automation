'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Image as ImageIcon, Upload, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';

/**
 * MediaFields - Cloudinary-integrated media upload component
 *
 * Features:
 * - Local image uploads → Cloudinary URLs
 * - Direct URL input for videos and images
 * - Real-time database saves
 * - Custom value mapping to GHL
 * - Full approval logic integration
 */
export default function MediaFields({ funnelId, onApprove, onUnapprove, isApproved, refreshTrigger }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [forceRenderKey, setForceRenderKey] = useState(0);
    const [uploadingFields, setUploadingFields] = useState({});

    // AI Feedback modal state
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    const sectionId = 'media';
    const predefinedFields = getFieldsForSection(sectionId);
    const previousApprovalRef = useRef(false);

    // Fetch fields from database
    const fetchFields = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch fields');

            const data = await response.json();

            // Update fields state
            setFields(data.fields || []);

            // Check section approval from vault_content.status (set by vault-section-approve)
            // Also check if all fields are approved as fallback
            // CRITICAL FIX: For sections with no fields, rely ONLY on sectionStatus
            const allFieldsApproved = data.fields.length > 0 && data.fields.every(f => f.is_approved);
            const sectionStatusApproved = data.sectionStatus === 'approved';

            // Section is approved if either vault_content.status='approved' OR all fields are approved OR parent says so
            // Priority: 1. Parent isApproved, 2. vault_content.status, 3. All fields approved
            const computedApproved = isApproved || sectionStatusApproved || allFieldsApproved;
            setSectionApproved(computedApproved);

            // Force re-render to update components
            setForceRenderKey(prev => prev + 1);

            console.log(`[MediaFields] Fetched ${data.fields.length} fields, sectionStatus:`, data.sectionStatus, 'allFieldsApproved:', allFieldsApproved);
        } catch (error) {
            console.error('[MediaFields] Fetch error:', error);
            if (!silent) toast.error('Failed to load media fields');
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [funnelId]);

    // Initial fetch
    useEffect(() => {
        if (funnelId) {
            fetchFields();
        }
    }, [funnelId, fetchFields]);

    // Sync with parent approval state
    useEffect(() => {
        setSectionApproved(isApproved);
    }, [isApproved]);

    // Refresh when parent triggers refresh
    useEffect(() => {
        if (refreshTrigger && funnelId) {
            console.log('[MediaFields] Refresh triggered by parent');
            fetchFields(true);
        }
    }, [refreshTrigger, funnelId, fetchFields]);

    // Notify parent when approval state changes
    useEffect(() => {
        if (previousApprovalRef.current === true && sectionApproved === false && onUnapprove) {
            console.log('[MediaFields] Section unapproved, notifying parent');
            onUnapprove(sectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, sectionId, onUnapprove]);

    // Handle file upload to Cloudinary
    const handleFileUpload = async (field_id, file) => {
        if (!file) return;

        // Validate file size only (no format or dimension restrictions)
        const fieldDef = predefinedFields.find(f => f.field_id === field_id);
        const maxSize = fieldDef?.field_metadata?.maxSize || 10485760; // 10MB default

        if (file.size > maxSize) {
            toast.error(`File size must be under ${maxSize / 1024 / 1024}MB`);
            return;
        }

        setUploadingFields(prev => ({ ...prev, [field_id]: true }));

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', file.type.startsWith('image/') ? 'image' : 'video');

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const { url } = await uploadResponse.json();

            // Save URL to database
            await handleFieldSave(field_id, url);

            toast.success('Upload successful!');
        } catch (error) {
            console.error('[MediaFields] Upload error:', error);
            toast.error(error.message || 'Failed to upload file');
        } finally {
            setUploadingFields(prev => ({ ...prev, [field_id]: false }));
        }
    };

    // Handle field save (both uploads and manual URL entry)
    const handleFieldSave = async (field_id, value) => {
        try {
            const response = await fetch('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    field_id: field_id,
                    field_value: value
                })
            });

            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();

            console.log('[MediaFields] Field saved:', { field_id, value, version: result.version });

            // Update local state
            setFields(prev => prev.map(f =>
                f.field_id === field_id
                    ? { ...f, field_value: value, version: result.version, is_approved: false }
                    : f
            ));

            // Mark section as unapproved
            setSectionApproved(false);

            // Sync to custom values
            await syncToCustomValue(field_id, value);

        } catch (error) {
            console.error('[MediaFields] Save error:', error);
            throw error;
        }
    };

    // Sync field value to GHL custom value
    // NOTE: This will fail if GHL credentials aren't configured yet - that's expected!
    // The field is still saved to the database and will sync when GHL is set up.
    const syncToCustomValue = async (field_id, value) => {
        const fieldDef = predefinedFields.find(f => f.field_id === field_id);
        const customValueKey = fieldDef?.field_metadata?.customValueKey;

        if (!customValueKey || !value) return;

        try {
            const response = await fetch('/api/ghl/custom-values/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    updates: {
                        [customValueKey]: value
                    }
                })
            });

            if (!response.ok) {
                // This is expected if GHL isn't configured yet
                // Don't show error to user, just log for debugging
                console.log(`[MediaFields] GHL sync not available for ${customValueKey} (expected if GHL not configured)`);
            } else {
                console.log('[MediaFields] ✅ Synced to GHL custom value:', customValueKey);
            }
        } catch (error) {
            // Silent fail - GHL sync will happen later via batch push
            console.log('[MediaFields] GHL sync skipped:', customValueKey);
        }
    };

    // Handle AI feedback request
    const handleAIFeedback = (field_id, field_label, currentValue) => {
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    // Handle AI feedback save
    const handleFeedbackSave = async (saveData) => {
        if (!selectedField) return;

        // FeedbackChatModal passes { refinedContent, subSection }
        const refinedContent = saveData?.refinedContent || saveData;

        try {
            await handleFieldSave(selectedField.field_id, refinedContent);

            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[MediaFields] AI feedback save error:', error);
            toast.error('Failed to save changes');
        }
    };

    // Handle section approval
    const handleApproveSection = async () => {
        setIsApproving(true);
        try {
            const response = await fetchWithAuth('/api/os/vault-section-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId
                })
            });

            if (!response.ok) throw new Error('Failed to approve section');

            // Wait for API response before updating state
            await response.json();

            // Update local state FIRST
            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));
            setSectionApproved(true);

            // THEN notify parent (prevents race condition)
            if (onApprove) {
                onApprove(sectionId);
            }

            toast.success('Media Library approved!');
        } catch (error) {
            console.error('[MediaFields] Approve error:', error);
            toast.error('Failed to approve section');
        } finally {
            setIsApproving(false);
        }
    };

    // Get field value from state
    const getFieldValue = (field_id) => {
        const field = fields.find(f => f.field_id === field_id);
        return field ? field.field_value : null;
    };

    // Render media field based on type
    const renderMediaField = (fieldDef) => {
        const currentValue = getFieldValue(fieldDef.field_id);
        const isUploading = uploadingFields[fieldDef.field_id];
        const isImage = fieldDef.field_type === 'cloudinary_image';
        const isVideo = fieldDef.field_type === 'video_url';

        return (
            <div key={`${fieldDef.field_id}-${forceRenderKey}`} className="bg-[#18181b] border border-[#2a2a2d] rounded-xl p-6">
                {/* Field Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h4 className="text-white font-semibold text-lg">{fieldDef.field_label}</h4>
                        <p className="text-gray-500 text-sm mt-1">{fieldDef.field_metadata?.hint}</p>

                        {/* Display guidelines if available */}
                        {fieldDef.field_metadata?.guidelines && (
                            <div className="mt-3 bg-[#1f1f22] border border-[#3a3a3d] rounded-lg p-3">
                                <ul className="space-y-1 text-xs text-gray-400">
                                    {fieldDef.field_metadata.guidelines.map((guideline, idx) => (
                                        <li key={idx}>{guideline}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Media Preview */}
                {currentValue && !isUploading && (
                    <div className="mb-4 relative group">
                        {isImage ? (
                            <div className="relative">
                                <img
                                    src={currentValue}
                                    alt={fieldDef.field_label}
                                    className="w-full max-h-64 object-contain rounded-lg bg-black/20"
                                />
                                <button
                                    onClick={() => handleFieldSave(fieldDef.field_id, '')}
                                    className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative bg-black/20 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <LinkIcon className="w-5 h-5 text-cyan" />
                                    <a
                                        href={currentValue}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan hover:underline flex-1 truncate"
                                    >
                                        {currentValue}
                                    </a>
                                    <button
                                        onClick={() => handleFieldSave(fieldDef.field_id, '')}
                                        className="bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Upload/URL Input Section */}
                {!currentValue && (
                    <div className="space-y-4">
                        {/* Image Upload Button */}
                        {isImage && (
                            <label className="block">
                                <input
                                    type="file"
                                    accept={fieldDef.field_metadata?.accept || 'image/*'}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(fieldDef.field_id, file);
                                    }}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                                <div className={`border-2 border-dashed ${isUploading ? 'border-cyan/50 bg-cyan/5' : 'border-[#3a3a3d] hover:border-cyan/50 hover:bg-cyan/5'} rounded-xl p-8 cursor-pointer transition-all`}>
                                    <div className="flex flex-col items-center gap-3">
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                                                <span className="text-cyan font-medium">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-500" />
                                                <span className="text-white font-medium">Click to upload image</span>
                                                <span className="text-gray-500 text-sm">
                                                    {fieldDef.field_metadata?.placeholder || 'Upload an image...'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </label>
                        )}

                        {/* URL Input */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <LinkIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-400 text-sm">{isImage ? 'Or paste image URL' : 'Paste video URL'}</span>
                            </div>
                            <input
                                type="url"
                                placeholder={isVideo ? 'https://youtube.com/watch?v=... or https://vimeo.com/...' : 'https://example.com/image.jpg'}
                                className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-cyan focus:outline-none"
                                onBlur={(e) => {
                                    const url = e.target.value.trim();
                                    if (url && url !== currentValue) {
                                        handleFieldSave(fieldDef.field_id, url);
                                        e.target.value = '';
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const url = e.target.value.trim();
                                        if (url && url !== currentValue) {
                                            handleFieldSave(fieldDef.field_id, url);
                                            e.target.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isUploading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                            <span className="text-cyan font-medium">Uploading to cloud...</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="bg-gradient-to-br from-[#1a1a1d] to-[#0e0e0f] border border-[#3a3a3d] rounded-2xl overflow-hidden">
                {/* Section Header */}
                <div
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#18181b] transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionApproved
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-cyan/20 text-cyan'
                            }`}>
                            {sectionApproved ? (
                                <CheckCircle className="w-6 h-6" />
                            ) : (
                                <ImageIcon className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Media Library</h3>
                            <p className="text-sm text-gray-500">
                                {fields.length} assets • {sectionApproved ? 'Approved' : 'Pending'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                    <div className="p-6 pt-0 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Media Fields */}
                                {predefinedFields.map(renderMediaField)}

                                {/* Approve Button */}
                                {!sectionApproved && fields.every(f => f.field_value) && (
                                    <button
                                        onClick={handleApproveSection}
                                        disabled={isApproving}
                                        className="w-full bg-gradient-to-r from-cyan to-cyan/80 text-white font-bold px-6 py-3 rounded-xl hover:from-cyan/90 hover:to-cyan/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isApproving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Approving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Approve Media Library
                                            </>
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* AI Feedback Modal */}
            {feedbackModalOpen && selectedField && (
                <FeedbackChatModal
                    isOpen={feedbackModalOpen}
                    onClose={() => {
                        setFeedbackModalOpen(false);
                        setSelectedField(null);
                        setSelectedFieldValue(null);
                    }}
                    sectionId={sectionId}
                    sectionTitle="Media Library"
                    subSection={selectedField.field_id}
                    subSectionTitle={selectedField.field_label}
                    currentContent={selectedFieldValue}
                    sessionId={funnelId}
                    onSave={handleFeedbackSave}
                />
            )}
        </>
    );
}
