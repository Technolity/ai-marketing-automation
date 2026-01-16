'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';

/**
 * MediaFields - Granular field-level editing for Media section
 *
 * Props:
 * - funnelId: Funnel ID
 * - onApprove: Callback when section is approved
 * - onUnapprove: Callback when section becomes unapproved
 * - refreshTrigger: Triggers refresh when value changes
 */
export default function MediaFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, refreshTrigger }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [forceRenderKey, setForceRenderKey] = useState(0);

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

            // Check if all fields are approved
            const allApproved = data.fields.length > 0 && data.fields.every(f => f.is_approved);
            setSectionApproved(allApproved);

            // Force re-render to update FieldEditor components
            setForceRenderKey(prev => prev + 1);

            console.log(`[MediaFields] Fetched ${data.fields.length} fields, all approved:`, allApproved);
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

    // Refresh when parent triggers refresh (e.g., after background generation)
    useEffect(() => {
        if (refreshTrigger && funnelId) {
            console.log('[MediaFields] Refresh triggered by parent');
            fetchFields(true); // Silent refresh
        }
    }, [refreshTrigger, funnelId, fetchFields]);

    // Notify parent when approval state changes
    useEffect(() => {
        if (previousApprovalRef.current === true && sectionApproved === false && onUnapprove) {
            // Section was approved, now unapproved - notify parent
            console.log('[MediaFields] Section unapproved, notifying parent');
            onUnapprove(sectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, sectionId, onUnapprove]);

    // Handle field save
    const handleFieldSave = async (field_id, value, result) => {
        console.log('[MediaFields] Field saved:', { field_id, value, version: result.version });

        // Update local state
        setFields(prev => prev.map(f =>
            f.field_id === field_id
                ? { ...f, field_value: value, version: result.version, is_approved: false }
                : f
        ));

        // Mark section as unapproved
        setSectionApproved(false);

        // DON'T increment forceRenderKey here - it causes all FieldEditors to remount and lose state
        // The FieldEditor will update via initialValue prop change through useEffect
    };

    // Handle AI feedback request
    const handleAIFeedback = (field_id, field_label, currentValue) => {
        // AI could suggest "What kind of photo works best here?"
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    // Handle AI feedback save
    const handleFeedbackSave = async (refinedContent) => {
        if (!selectedField) return;
        try {
            const response = await fetch('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    field_id: selectedField.field_id,
                    field_value: refinedContent
                })
            });

            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();

            console.log('[MediaFields] AI feedback saved for field:', selectedField.field_id);

            // Update local state with new content
            setFields(prev => prev.map(f =>
                f.field_id === selectedField.field_id
                    ? { ...f, field_value: refinedContent, version: result.version, is_approved: false }
                    : f
            ));

            // Mark section as unapproved
            setSectionApproved(false);

            // Close modal
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[MediaFields] Save error:', error);
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

            // Mark all fields as approved
            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));
            setSectionApproved(true);

            // Notify parent
            if (onApprove) {
                onApprove(sectionId);
            }

            toast.success('Media section approved!');
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
                            <h3 className="text-lg font-bold text-white">Media Assets</h3>
                            <p className="text-sm text-gray-500">
                                {fields.length} uploads • {sectionApproved ? 'Approved' : 'Pending Uploads'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Approve button removed (handled by Vault header) */}
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
                                {/* Predefined Fields */}
                                {predefinedFields.map((fieldDef) => {
                                    const currentValue = getFieldValue(fieldDef.field_id);
                                    return (
                                        <FieldEditor
                                            key={`${fieldDef.field_id}-${forceRenderKey}`}
                                            fieldDef={fieldDef}
                                            initialValue={currentValue}
                                            sectionId={sectionId}
                                            funnelId={funnelId}
                                            onSave={handleFieldSave}
                                            onAIFeedback={handleAIFeedback}
                                        />
                                    );
                                })}
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
                    sectionTitle="Media Assets"
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

