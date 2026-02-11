'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, MessageSquare, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';
import { fieldGroups } from '@/lib/vault/fieldGroups';

export default function SmsFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    // Grouping state
    const [expandedGroup, setExpandedGroup] = useState('Welcome & Nurture');

    const sectionId = 'sms';

    // Augment fields with group information
    const predefinedFields = getFieldsForSection(sectionId).map(field => ({
        ...field,
        group: fieldGroups.sms[field.field_id] || 'Other'
    }));

    // Define group order explicitly
    const groupOrder = [
        'Welcome & Nurture',
        'Proof & Booking',
        'The Close',
        'No-Show Recovery'
    ];

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
            const allApproved = isApproved || (data.fields.length > 0 && data.fields.every(f => f.is_approved));
            setSectionApproved(allApproved);

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

    // Sync with parent approval state
    useEffect(() => {
        setSectionApproved(isApproved);
    }, [isApproved]);

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

        // FieldEditor will re-render automatically when initialValue prop changes
    };

    const handleAIFeedback = (field_id, field_label, currentValue) => {
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    const handleFeedbackSave = async (saveData) => {
        if (!selectedField) return;

        // FeedbackChatModal passes { refinedContent, subSection }
        const refinedContent = saveData?.refinedContent || saveData;

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

            // FieldEditor will re-render automatically when initialValue prop changes

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
                body: JSON.stringify({
                    section: sectionId,
                    sessionId: funnelId
                })
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
                        {groupOrder.map((groupName) => {
                            const groupFields = predefinedFields.filter(f => f.group === groupName);
                            if (groupFields.length === 0) return null;

                            const isExpanded = expandedGroup === groupName;

                            return (
                                <div key={groupName} className="bg-[#18181b] border border-[#3a3a3d] rounded-xl overflow-hidden">
                                    {/* Group Header */}
                                    <button
                                        onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                                        className="w-full px-6 py-4 flex items-center justify-between bg-[#1a1a1d] hover:bg-[#1f1f22] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="w-5 h-5 text-cyan" />
                                            <h3 className="text-lg font-semibold text-white">{groupName}</h3>
                                            <span className="text-sm text-gray-500">({groupFields.length} SMS{groupFields.length > 1 ? 's' : ''})</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>

                                    {/* Group Content */}
                                    {isExpanded && (
                                        <div className="p-6 space-y-6 bg-[#0e0e0f]">
                                            {groupFields.map((fieldDef) => (
                                                <FieldEditor
                                                    key={fieldDef.field_id}
                                                    fieldDef={fieldDef}
                                                    initialValue={getFieldValue(fieldDef.field_id)}
                                                    readOnly={sectionApproved}
                                                    sectionId={sectionId}
                                                    funnelId={funnelId}
                                                    onSave={handleFieldSave}
                                                    onAIFeedback={handleAIFeedback}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
