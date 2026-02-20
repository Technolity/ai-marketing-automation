'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function MessageFields({ funnelId, onApprove, onRenderApproveButton, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);

    // AI Feedback modal state
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    const sectionId = 'message';
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
            const allApproved = isApproved || (data.fields.length > 0 && data.fields.every(f => f.is_approved));
            setSectionApproved(allApproved);

        } catch (error) {
            console.error('[MessageFields] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (funnelId) {
            fetchFields();
        }
    }, [funnelId, refreshTrigger]);

    // Sync with parent approval state
    useEffect(() => {
        setSectionApproved(isApproved);
    }, [isApproved]);

    // Handle field save
    const handleFieldSave = async (field_id, value, result) => {
        console.log('[MessageFields] Field saved:', { field_id, value });

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
        console.log('[MessageFields] Opening AI feedback for field:', field_id);
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    // Handle AI feedback save
    const handleFeedbackSave = async (saveData) => {
        console.log('[MessageFields] AI feedback save:', { selectedField, saveData });

        if (!selectedField) return;

        // FeedbackChatModal passes { refinedContent, subSection }
        const refinedContent = saveData?.refinedContent || saveData;

        // The refinedContent should be the new field value
        // Auto-save it via the FieldEditor's save mechanism
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

            if (!response.ok) throw new Error('Failed to save AI feedback');

            const result = await response.json();

            // Update local state
            setFields(prev => prev.map(f =>
                f.field_id === selectedField.field_id
                    ? { ...f, field_value: refinedContent, version: result.version }
                    : f
            ));

            // Reset section approval
            setSectionApproved(false);

            // Close modal
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

        } catch (error) {
            console.error('[MessageFields] AI feedback save error:', error);
        }
    };

    // Handle custom field added
    const handleFieldAdded = (newField) => {
        console.log('[MessageFields] Custom field added:', newField);
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
            console.error('[MessageFields] Approve error:', error);
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
                body: JSON.stringify({
                    section: sectionId,
                    sessionId: funnelId
                })
            });
            if (!response.ok) throw new Error('Failed to regenerate');
            await fetchFields();
            setSectionApproved(false);
        } catch (error) {
            console.error('[MessageFields] Regenerate error:', error);
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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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

            {/* Fields directly rendered - no wrapper card */}
            <div className="space-y-6">
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
                                    key={fieldDef.field_id}
                                    fieldDef={fieldDef}
                                    initialValue={currentValue}
                                    readOnly={sectionApproved}
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
                    sectionTitle="Million Dollar Message"
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
