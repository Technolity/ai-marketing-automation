'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import AIFeedbackModal from './AIFeedbackModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

/**
 * OfferFields - Granular field-level editing for Signature Offer section
 *
 * Props:
 * - funnelId: Funnel ID
 * - onApprove: Callback when section is approved
 */
export default function OfferFields({ funnelId, onApprove, onRenderApproveButton, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);

    // AI Feedback modal state
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    const sectionId = 'offer';
    const predefinedFields = getFieldsForSection(sectionId);

    // Fetch fields from database
    const fetchFields = async () => {
        setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch fields');

            const data = await response.json();
            setFields(data.fields || []);

            // Check if all fields are approved
            const allApproved = data.fields.length > 0 && data.fields.every(f => f.is_approved);
            setSectionApproved(allApproved);

        } catch (error) {
            console.error('[OfferFields] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (funnelId) {
            fetchFields();
        }
    }, [funnelId]);

    // Sync with parent approval state
    useEffect(() => {
        setSectionApproved(isApproved);
    }, [isApproved]);

    // Handle field save
    const handleFieldSave = async (field_id, value, result) => {
        console.log('[OfferFields] Field saved:', { field_id, value });

        // Update local state
        setFields(prev => prev.map(f =>
            f.field_id === field_id
                ? { ...f, field_value: value, version: result.version }
                : f
        ));

        // Reset section approval if any field changes
        setSectionApproved(false);
    };

    // Handle AI feedback request
    const handleAIFeedback = (field_id, field_label, currentValue) => {
        console.log('[OfferFields] Opening AI feedback for field:', field_id);
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    // Handle AI feedback save - supports both single field and batch multi-field save
    const handleFeedbackSave = async (feedbackData) => {
        console.log('[OfferFields] AI feedback save received:', feedbackData);

        // Extract refined content and subSection from callback
        const refinedContent = feedbackData?.refinedContent || feedbackData;
        const subSection = feedbackData?.subSection;

        if (!refinedContent) {
            console.error('[OfferFields] No refined content to save');
            return;
        }

        try {
            // Import feedback utils dynamically
            const { flattenAIResponseToFields, hasMultipleFields } = await import('@/lib/vault/feedbackUtils');

            // Flatten AI response to field IDs
            const flatFields = flattenAIResponseToFields(refinedContent, sectionId);

            console.log('[OfferFields] Flattened fields:', Object.keys(flatFields));

            // If subSection specified and exists in flatFields, only save that field
            if (subSection && subSection !== 'all' && flatFields[subSection]) {
                console.log('[OfferFields] Saving single field:', subSection);

                const response = await fetchWithAuth('/api/os/vault-field', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        funnel_id: funnelId,
                        section_id: sectionId,
                        field_id: subSection,
                        field_value: flatFields[subSection]
                    })
                });

                if (!response.ok) throw new Error('Failed to save field');

            } else if (Object.keys(flatFields).length > 0) {
                // Batch save all fields via new API
                console.log('[OfferFields] Batch saving', Object.keys(flatFields).length, 'fields');

                const response = await fetchWithAuth('/api/os/vault-section-save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        funnel_id: funnelId,
                        section_id: sectionId,
                        fields: flatFields
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to save fields');
                }

                const result = await response.json();
                console.log('[OfferFields] Batch save result:', result);
            }

            // Refresh fields from database
            await fetchFields();

            // Reset section approval
            setSectionApproved(false);

            // Close modal
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

        } catch (error) {
            console.error('[OfferFields] AI feedback save error:', error);
            // Import toast dynamically if not available
            const { toast } = await import('sonner');
            toast.error('Failed to save feedback: ' + error.message);
        }
    };


    // Handle custom field added
    const handleFieldAdded = (newField) => {
        console.log('[OfferFields] Custom field added:', newField);
        setFields(prev => [...prev, newField]);
        setSectionApproved(false);
    };

    // Handle section approval
    const handleApproveSection = async () => {
        setIsApproving(true);
        try {
            // Approve all fields in this section
            const response = await fetchWithAuth('/api/os/vault-section-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId
                })
            });

            if (!response.ok) throw new Error('Failed to approve section');

            // Update local state
            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));
            setSectionApproved(true);

            // Callback to parent
            if (onApprove) {
                onApprove(sectionId);
            }

        } catch (error) {
            console.error('[OfferFields] Approve error:', error);
        } finally {
            setIsApproving(false);
        }
    };

    const handleRegenerateSection = async () => {
        setIsRegenerating(true);
        try {
            const response = await fetch('/api/os/regenerate-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_key: 4 })
            });
            if (!response.ok) throw new Error('Failed to regenerate');
            await fetchFields();
            setSectionApproved(false);
        } catch (error) {
            console.error('[OfferFields] Regenerate error:', error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const getFieldValue = (field_id) => {
        const field = fields.find(f => f.field_id === field_id);
        return field ? field.field_value : null;
    };

    // Expose approve button for parent to render in header
    const approveButton = !sectionApproved ? (
        <button
            onClick={handleApproveSection}
            disabled={isApproving}
            className="bg-gradient-to-r from-cyan to-cyan/80 text-white font-bold px-6 py-2.5 rounded-xl hover:from-cyan/90 hover:to-cyan/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            {isApproving ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Approving...
                </>
            ) : (
                <>
                    <CheckCircle className="w-4 h-4" />
                    Approve Section
                </>
            )}
        </button>
    ) : null;

    // Portal the button to the header
    useEffect(() => {
        if (onRenderApproveButton) {
            onRenderApproveButton(approveButton);
        }
    }, [onRenderApproveButton, approveButton]);

    return (
        <>
            {/* Expose approve button via onRenderApproveButton callback */}
            {/* Approve button removed (handled by Vault header) */}

            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Shared Fields (Offer Mode, Name, 7-Step Blueprint) */}
                        <div className="space-y-6">
                            {predefinedFields
                                .filter(f => ['offerMode', 'offerName', 'sevenStepBlueprint'].includes(f.field_id))
                                .map((fieldDef) => (
                                    <FieldEditor
                                        key={fieldDef.field_id}
                                        fieldDef={fieldDef}
                                        initialValue={getFieldValue(fieldDef.field_id)}
                                        sectionId={sectionId}
                                        funnelId={funnelId}
                                        onSave={handleFieldSave}
                                        onAIFeedback={handleAIFeedback}
                                    />
                                ))}
                        </div>

                        {/* Tier 1 Box */}
                        <div className="mt-8 p-6 bg-[#1a1a1d] border border-[#2a2a2d] rounded-2xl">
                            <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
                                <span className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-sm text-white/70">1</span>
                                Tier 1 — 90-Day Offer
                            </h3>
                            <div className="space-y-4">
                                {predefinedFields
                                    .filter(f => f.field_id.startsWith('tier1'))
                                    .map((fieldDef) => (
                                        <FieldEditor
                                            key={fieldDef.field_id}
                                            fieldDef={fieldDef}
                                            initialValue={getFieldValue(fieldDef.field_id)}
                                            sectionId={sectionId}
                                            funnelId={funnelId}
                                            onSave={handleFieldSave}
                                            onAIFeedback={handleAIFeedback}
                                        />
                                    ))}
                            </div>
                        </div>

                        {/* Tier 2 Box */}
                        <div className="mt-6 p-6 bg-[#1a1a1d] border border-[#2a2a2d] rounded-2xl">
                            <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
                                <span className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-sm text-white/70">2</span>
                                Tier 2 — 12-Month Offer
                            </h3>
                            <div className="space-y-4">
                                {predefinedFields
                                    .filter(f => f.field_id.startsWith('tier2'))
                                    .map((fieldDef) => (
                                        <FieldEditor
                                            key={fieldDef.field_id}
                                            fieldDef={fieldDef}
                                            initialValue={getFieldValue(fieldDef.field_id)}
                                            sectionId={sectionId}
                                            funnelId={funnelId}
                                            onSave={handleFieldSave}
                                            onAIFeedback={handleAIFeedback}
                                        />
                                    ))}
                            </div>
                        </div>

                        {/* Combined Offer Promise */}
                        <div className="mt-8 p-6 bg-[#1a1a1d] border border-[#2a2a2d] rounded-2xl">
                            <h3 className="text-lg font-bold text-white/90 mb-4">
                                Combined Offer Promise
                            </h3>
                            {predefinedFields
                                .filter(f => f.field_id === 'offerPromise')
                                .map((fieldDef) => (
                                    <FieldEditor
                                        key={fieldDef.field_id}
                                        fieldDef={fieldDef}
                                        initialValue={getFieldValue(fieldDef.field_id)}
                                        sectionId={sectionId}
                                        funnelId={funnelId}
                                        onSave={handleFieldSave}
                                        onAIFeedback={handleAIFeedback}
                                    />
                                ))}
                        </div>

                        {/* Custom Fields */}
                        {fields
                            .filter(f => f.is_custom)
                            .map((customField) => (
                                <FieldEditor
                                    key={customField.field_id}
                                    fieldDef={{
                                        field_id: customField.field_id,
                                        field_label: customField.field_label,
                                        field_type: customField.field_type,
                                        field_metadata: customField.field_metadata || {}
                                    }}
                                    initialValue={customField.field_value}
                                    sectionId={sectionId}
                                    funnelId={funnelId}
                                    onSave={handleFieldSave}
                                    onAIFeedback={handleAIFeedback}
                                />
                            ))}
                    </>
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
                    sectionTitle="Signature Offer"
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

