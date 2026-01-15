'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, MessageSquare, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';

export default function SmsFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);
    const [forceRenderKey, setForceRenderKey] = useState(0);

    const sectionId = 'sms';
    const predefinedFields = getFieldsForSection(sectionId);
    const previousApprovalRef = useRef(false);

    const fetchFields = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            // Update fields state
            setFields(data.fields || []);

            // Calculate approval state
            const allApproved = data.fields.length > 0 && data.fields.every(f => f.is_approved);
            setSectionApproved(allApproved);

            // Force re-render to update FieldEditor components with fresh data
            setForceRenderKey(prev => prev + 1);

            console.log(`[SmsFields] Fetched ${data.fields.length} fields, all approved:`, allApproved);
        } catch (error) {
            console.error('[SmsFields] Fetch error:', error);
            if (!silent) toast.error('Failed to load SMS fields');
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [funnelId]);

    // Initial fetch
    useEffect(() => {
        if (funnelId) fetchFields();
    }, [funnelId, fetchFields]);

    // Refresh when parent triggers refresh (e.g., after background generation)
    useEffect(() => {
        if (refreshTrigger && funnelId) {
            console.log('[SmsFields] Refresh triggered by parent');
            fetchFields(true); // Silent refresh
        }
    }, [refreshTrigger, funnelId, fetchFields]);

    // Notify parent when approval state changes
    useEffect(() => {
        if (previousApprovalRef.current === true && sectionApproved === false && onUnapprove) {
            // Section was approved, now unapproved - notify parent
            console.log('[SmsFields] Section unapproved, notifying parent');
            onUnapprove(sectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, sectionId, onUnapprove]);

    const handleFieldSave = async (field_id, value, result) => {
        console.log('[SmsFields] Field saved:', field_id, 'version:', result.version);

        // Update local state
        setFields(prev => prev.map(f =>
            f.field_id === field_id
                ? { ...f, field_value: value, version: result.version, is_approved: false }
                : f
        ));

        // Mark section as unapproved
        setSectionApproved(false);

        // Force re-render to show updated content
        setForceRenderKey(prev => prev + 1);
    };

    const handleAIFeedback = (field_id, field_label, currentValue) => {
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

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

            console.log('[SmsFields] AI feedback saved for field:', selectedField.field_id);

            // Update local state with new content
            setFields(prev => prev.map(f =>
                f.field_id === selectedField.field_id
                    ? { ...f, field_value: refinedContent, version: result.version, is_approved: false }
                    : f
            ));

            // Mark section as unapproved
            setSectionApproved(false);

            // Force re-render to show updated content
            setForceRenderKey(prev => prev + 1);

            // Close modal
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[SmsFields] Save error:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleFieldAdded = (newField) => { setFields(prev => [...prev, newField]); setSectionApproved(false); };

    const handleApproveSection = async () => {
        setIsApproving(true);
        try {
            const response = await fetchWithAuth('/api/os/vault-section-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_id: sectionId })
            });
            if (!response.ok) throw new Error('Failed to approve');
            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));
            setSectionApproved(true);
            if (onApprove) onApprove(sectionId);
        } catch (error) {
            console.error('[SmsFields] Approve error:', error);
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
                body: JSON.stringify({ funnel_id: funnelId, section_key: 19 })
            });
            if (!response.ok) throw new Error('Failed to regenerate');
            await fetchFields();
            setSectionApproved(false);
        } catch (error) {
            console.error('[SmsFields] Regenerate error:', error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const getFieldValue = (field_id) => {
        const field = fields.find(f => f.field_id === field_id);
        return field?.field_value || null;
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

    return (
        <>
            {/* Approve button handled by Vault header */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {predefinedFields.map((fieldDef) => (
                            <FieldEditor
                                key={`${fieldDef.field_id}-${forceRenderKey}`}
                                fieldDef={fieldDef}
                                initialValue={getFieldValue(fieldDef.field_id)}
                                sectionId={sectionId}
                                funnelId={funnelId}
                                onSave={handleFieldSave}
                                onAIFeedback={handleAIFeedback}
                            />
                        ))}
                    </>
                )}
            </div>
            {feedbackModalOpen && selectedField && (
                <FeedbackChatModal
                    isOpen={feedbackModalOpen}
                    onClose={() => {
                        setFeedbackModalOpen(false);
                        setSelectedField(null);
                        setSelectedFieldValue(null);
                    }}
                    sectionId={sectionId}
                    sectionTitle="SMS Sequences"
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
