'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Video, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';

export default function VslFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);
    const [forceRenderKey, setForceRenderKey] = useState(0);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const previousApprovalRef = useRef(false);

    const sectionId = 'vsl';
    const predefinedFields = getFieldsForSection(sectionId);

    const fetchFields = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setFields(data.fields || []);
            const allApproved = isApproved || (data.fields.length > 0 && data.fields.every(f => f.is_approved));
            setSectionApproved(allApproved);
            setForceRenderKey(prev => prev + 1);
            console.log(`[VslFields] Fetched ${data.fields.length} fields, all approved:`, allApproved);
        } catch (error) {
            console.error('[VslFields] Fetch error:', error);
            if (!silent) toast.error('Failed to load fields');
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [funnelId]);

    useEffect(() => { if (funnelId) fetchFields(); }, [funnelId, fetchFields]);

    // Sync with parent approval state
    useEffect(() => {
        setSectionApproved(isApproved);
    }, [isApproved]);

    useEffect(() => {
        if (refreshTrigger && funnelId) {
            console.log('[VslFields] Refresh triggered by parent');
            fetchFields(true);
        }
    }, [refreshTrigger, funnelId, fetchFields]);

    useEffect(() => {
        if (previousApprovalRef.current === true && sectionApproved === false && onUnapprove) {
            console.log('[VslFields] Section unapproved, notifying parent');
            onUnapprove(sectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, sectionId, onUnapprove]);

    // Initial expansion
    useEffect(() => {
        if (fields.length > 0 && !expandedGroup) {
            // Find the first group name
            const firstGroup = predefinedFields[0]?.group || 'Other';
            setExpandedGroup(firstGroup);
        }
    }, [fields, expandedGroup]);



    const handleFieldSave = async (field_id, value, result) => {
        console.log('[VslFields] Field saved:', field_id, 'version:', result.version);
        setFields(prev => prev.map(f => f.field_id === field_id ? { ...f, field_value: value, version: result.version, is_approved: false } : f));
        setSectionApproved(false);
        setForceRenderKey(prev => prev + 1);
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
                body: JSON.stringify({ funnel_id: funnelId, section_id: sectionId, field_id: selectedField.field_id, field_value: refinedContent })
            });
            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();
            console.log('[VslFields] AI feedback saved for field:', selectedField.field_id);
            setFields(prev => prev.map(f => f.field_id === selectedField.field_id ? { ...f, field_value: refinedContent, version: result.version, is_approved: false } : f));
            setSectionApproved(false);
            setForceRenderKey(prev => prev + 1);
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);
            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[VslFields] Save error:', error);
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
            console.error('[VslFields] Approve error:', error);
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
                body: JSON.stringify({ funnel_id: funnelId, section_key: 7 })
            });
            if (!response.ok) throw new Error('Failed to regenerate');
            await fetchFields();
            setSectionApproved(false);
        } catch (error) {
            console.error('[VslFields] Regenerate error:', error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const getFieldValue = (field_id) => fields.find(f => f.field_id === field_id)?.field_value || null;

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

    // Helper to group fields
    const renderGroupedFields = () => {
        // Group fields by their group property
        const groups = {};
        const orderedGroups = [];

        // First, handle predefined fields order and grouping
        predefinedFields.forEach(fieldDef => {
            const groupName = fieldDef.group || 'Other';
            if (!groups[groupName]) {
                groups[groupName] = [];
                orderedGroups.push(groupName);
            }

            // Find the actual field state
            const fieldState = fields.find(f => f.field_id === fieldDef.field_id);
            // Use state value if available, otherwise null
            const value = fieldState ? fieldState.field_value : null;

            groups[groupName].push({
                ...fieldDef,
                value
            });
        });

        // Handle custom fields (put them in 'Custom Fields' group)
        const customFields = fields.filter(f => f.is_custom);
        if (customFields.length > 0) {
            if (!groups['Custom Fields']) {
                groups['Custom Fields'] = [];
                orderedGroups.push('Custom Fields');
            }
            customFields.forEach(f => {
                groups['Custom Fields'].push({
                    field_id: f.field_id,
                    field_label: f.field_label,
                    field_type: f.field_type,
                    field_metadata: f.field_metadata || {},
                    value: f.field_value,
                    is_custom: true
                });
            });
        }

        return (
            <div className="space-y-4">
                {orderedGroups.map((groupName) => {
                    const isExpanded = expandedGroup === groupName;
                    return (
                        <div key={groupName} className="bg-[#1a1a1d] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
                            {/* Group Header */}
                            <button
                                onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                                className={`w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 transition-colors text-left ${isExpanded ? 'border-b border-white/5' : ''}`}
                            >
                                <h3 className="text-lg font-bold text-cyan">{groupName}</h3>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Group Fields */}
                            {isExpanded && (
                                <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                    {groups[groupName].map((field) => (
                                        <FieldEditor
                                            key={`${field.field_id}-${forceRenderKey}`}
                                            fieldDef={field}
                                            initialValue={field.value}
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
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                    </div>
                ) : (
                    renderGroupedFields()
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
                    sectionTitle="Funnel Video Script"
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
