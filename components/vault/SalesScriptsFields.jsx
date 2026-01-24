'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Sparkles, RefreshCw, FileDown, FileText } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { exportToPDF, exportToDOCX } from '@/lib/exportUtils';
import { toast } from 'sonner';

/**
 * SalesScriptsFields - Granular field-level editing for Closer Script section
 *
 * Props:
 * - funnelId: Funnel ID
 * - onApprove: Callback when section is approved
 * - onUnapprove: Callback when section becomes unapproved
 * - refreshTrigger: Triggers refresh when value changes
 */
export default function SalesScriptsFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [forceRenderKey, setForceRenderKey] = useState(0);

    // AI Feedback modal state
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    const sectionId = 'salesScripts';
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

            // Calculate approval state
            const allApproved = data.fields.length > 0 && data.fields.every(f => f.is_approved);
            setSectionApproved(allApproved);

            // Force re-render to update FieldEditor components with fresh data
            setForceRenderKey(prev => prev + 1);

            console.log(`[SalesScriptsFields] Fetched ${data.fields.length} fields, all approved:`, allApproved);
        } catch (error) {
            console.error('[SalesScriptsFields] Fetch error:', error);
            if (!silent) toast.error('Failed to load sales script fields');
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
            console.log('[SalesScriptsFields] Refresh triggered by parent');
            fetchFields(true); // Silent refresh
        }
    }, [refreshTrigger, funnelId, fetchFields]);

    // Notify parent when approval state changes
    useEffect(() => {
        if (previousApprovalRef.current === true && sectionApproved === false && onUnapprove) {
            // Section was approved, now unapproved - notify parent
            console.log('[SalesScriptsFields] Section unapproved, notifying parent');
            onUnapprove(sectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, sectionId, onUnapprove]);

    // Handle field save
    const handleFieldSave = async (field_id, value, result) => {
        console.log('[SalesScriptsFields] Field saved:', field_id, 'version:', result.version);

        // Update local state
        setFields(prev => prev.map(f =>
            f.field_id === field_id
                ? { ...f, field_value: value, version: result.version, is_approved: false }
                : f
        ));

        // Mark section as unapproved
        setSectionApproved(false);

        // DON'T increment forceRenderKey here - FieldEditor updates via initialValue prop
    };

    // Handle AI feedback request
    const handleAIFeedback = (field_id, field_label, currentValue) => {
        console.log('[SalesScriptsFields] Opening AI feedback for field:', field_id);
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    // Handle AI feedback save
    const handleFeedbackSave = async (refinedContent) => {
        if (!selectedField) return;

        try {
            const response = await fetchWithAuth('/api/os/vault-field', {
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

            console.log('[SalesScriptsFields] AI feedback saved for field:', selectedField.field_id);

            // Update local state with new content
            setFields(prev => prev.map(f =>
                f.field_id === selectedField.field_id
                    ? { ...f, field_value: refinedContent, version: result.version, is_approved: false }
                    : f
            ));

            // Mark section as unapproved
            setSectionApproved(false);

            // DON'T increment forceRenderKey here - FieldEditor updates via initialValue prop

            // Close modal
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[SalesScriptsFields] AI feedback save error:', error);
            toast.error('Failed to save changes');
        }
    };

    // Handle custom field added
    const handleFieldAdded = (newField) => {
        console.log('[SalesScriptsFields] Custom field added:', newField);
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
            console.error('[SalesScriptsFields] Approve error:', error);
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
                body: JSON.stringify({ funnel_id: funnelId, section_key: 5 })
            });
            if (!response.ok) throw new Error('Failed to regenerate');
            await fetchFields();
            setSectionApproved(false);
        } catch (error) {
            console.error('[SalesScriptsFields] Regenerate error:', error);
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
                        {/* Predefined Fields */}
                        {predefinedFields.map((fieldDef) => {
                            const currentValue = getFieldValue(fieldDef.field_id);
                            return (
                                <FieldEditor
                                    key={`${fieldDef.field_id}-${forceRenderKey}`}
                                    fieldDef={fieldDef}
                                    initialValue={currentValue}
                                    readOnly={sectionApproved}
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
                                    key={`${customField.field_id}-${forceRenderKey}`}
                                    fieldDef={{
                                        field_id: customField.field_id,
                                        field_label: customField.field_label,
                                        field_type: customField.field_type,
                                        field_metadata: customField.field_metadata || {}
                                    }}
                                    initialValue={customField.field_value}
                                    readOnly={sectionApproved}
                                    funnelId={funnelId}
                                    onSave={handleFieldSave}
                                    onAIFeedback={handleAIFeedback}
                                />
                            ))}
                    </>
                )}
            </div>

            {/* Export Buttons - Bottom of Section */}
            {!isLoading && fields.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[#2a2a2d]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-cyan/5 to-purple-500/5 rounded-2xl border border-cyan/20">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Export Your Closer Script</h3>
                            <p className="text-sm text-gray-400">Download your complete script for offline use or printing</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => exportToPDF(fields, 'Closer Script')}
                                className="px-5 py-2.5 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded-xl font-semibold flex items-center gap-2 transition-all"
                            >
                                <FileDown className="w-4 h-4" />
                                Export PDF
                            </button>
                            <button
                                onClick={() => exportToDOCX(fields, 'Closer Script')}
                                className="px-5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl font-semibold flex items-center gap-2 transition-all"
                            >
                                <FileText className="w-4 h-4" />
                                Export Doc
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    sectionTitle="Closer Script"
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

