'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Video, Download, Table } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { exportSectionToPDF, exportSectionToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

export default function VslFields({ funnelId, onUnapprove, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);
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
    }, [fields, expandedGroup, predefinedFields]);



    const handleFieldSave = async (field_id, value, result) => {
        console.log('[VslFields] Field saved:', field_id, 'version:', result.version);
        setFields(prev => prev.map(f => f.field_id === field_id ? { ...f, field_value: value, version: result.version, is_approved: false } : f));
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
                body: JSON.stringify({ funnel_id: funnelId, section_id: sectionId, field_id: selectedField.field_id, field_value: refinedContent })
            });
            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();
            console.log('[VslFields] AI feedback saved for field:', selectedField.field_id);
            setFields(prev => prev.map(f => f.field_id === selectedField.field_id ? { ...f, field_value: refinedContent, version: result.version, is_approved: false } : f));
            setSectionApproved(false);
            // FieldEditor will re-render automatically when initialValue prop changes
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);
            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[VslFields] Save error:', error);
            toast.error('Failed to save changes');
        }
    };

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
                    const groupFields = groups[groupName];
                    const isExpanded = expandedGroup === groupName;

                    return (
                        <div key={groupName} className="bg-[#18181b] border border-[#3a3a3d] rounded-xl overflow-hidden">
                            {/* Group Header */}
                            <button
                                onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                                className="w-full px-6 py-4 flex items-center justify-between bg-[#1a1a1d] hover:bg-[#1f1f22] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Video className="w-5 h-5 text-cyan" />
                                    <h3 className="text-lg font-semibold text-white">{groupName}</h3>
                                    <span className="text-sm text-gray-500">({groupFields.length} step{groupFields.length > 1 ? 's' : ''})</span>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Group Fields */}
                            {isExpanded && (
                                <div className="p-6 space-y-6 bg-[#0e0e0f]">
                                    {groupFields.map((field) => (
                                        <FieldEditor
                                            key={field.field_id}
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

            {!isLoading && fields.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#2a2a2d] flex items-center justify-end gap-2">
                    <button
                        onClick={() => exportSectionToPDF(fields, 'VSL Script')}
                        className="p-2 rounded-lg border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
                        title="Download PDF"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => exportSectionToCSV(fields, 'VSL Script')}
                        className="p-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
                        title="Download CSV"
                    >
                        <Table className="w-4 h-4" />
                    </button>
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
