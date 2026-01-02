'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import CustomFieldAdder from './CustomFieldAdder';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';

export default function MessageFields({ funnelId, onApprove }) {
    const [isExpanded, setIsExpanded] = useState(false);
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
            const response = await fetch(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch fields');

            const data = await response.json();
            setFields(data.fields || []);

            // Check if all fields are approved
            const allApproved = data.fields.length > 0 && data.fields.every(f => f.is_approved);
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
    }, [funnelId]);

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
    const handleFeedbackSave = async (refinedContent) => {
        console.log('[MessageFields] AI feedback save:', { selectedField, refinedContent });

        if (!selectedField) return;

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
            const response = await fetch('/api/os/vault-section-approve', {
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
                body: JSON.stringify({ funnel_id: funnelId, section_key: 2 })
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
                                <Sparkles className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Million Dollar Message</h3>
                            <p className="text-sm text-gray-500">
                                {fields.length} fields • {sectionApproved ? 'Approved' : 'In Progress'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); handleRegenerateSection(); }} disabled={isRegenerating} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                        </button>
                        {!sectionApproved && fields.length > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); handleApproveSection(); }} disabled={isApproving} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50">
                                {isApproving ? 'Approving...' : 'Approve Section'}
                            </button>
                        )}
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
                                            key={fieldDef.field_id}
                                            fieldDef={fieldDef}
                                            initialValue={currentValue}
                                            sectionId={sectionId}
                                            funnelId={funnelId}
                                            onSave={handleFieldSave}
                                            onAIFeedback={handleAIFeedback}
                                        />
                                    );
                                })}

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

                                {/* Custom Field Adder */}
                                <div className="pt-4 border-t border-[#3a3a3d]">
                                    <CustomFieldAdder
                                        sectionId={sectionId}
                                        funnelId={funnelId}
                                        onFieldAdded={handleFieldAdded}
                                    />
                                </div>
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
