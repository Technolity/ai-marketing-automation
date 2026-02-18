'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Sparkles, RefreshCw, Download, Table } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { exportSectionToPDF, exportSectionToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { fieldGroups } from '@/lib/vault/fieldGroups';

/**
 * SalesScriptsFields - Granular field-level editing for Closer Script section
 * Uses expandable groups (accordions) to organize fields.
 */
export default function SalesScriptsFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);

    // Grouping state
    const [expandedGroup, setExpandedGroup] = useState('Opening');

    // AI Feedback modal state
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    const sectionId = 'salesScripts';

    // Augment fields with group information
    const predefinedFields = getFieldsForSection(sectionId).map(field => ({
        ...field,
        group: fieldGroups.salesScripts[field.field_id] || 'Other'
    }));

    // Define group order explicitly
    const groupOrder = ['Opening', 'Discovery', 'The Pitch', 'The Close'];


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
            const allApproved = isApproved || (data.fields.length > 0 && data.fields.every(f => f.is_approved));
            setSectionApproved(allApproved);

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

    // Sync with parent approval state
    useEffect(() => {
        setSectionApproved(isApproved);
    }, [isApproved]);

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
        setFields(prev => prev.map(f =>
            f.field_id === field_id
                ? { ...f, field_value: value, version: result.version, is_approved: false }
                : f
        ));
        setSectionApproved(false);
    };

    // Handle AI feedback request
    const handleAIFeedback = (field_id, field_label, currentValue) => {
        console.log('[SalesScriptsFields] Opening AI feedback for field:', field_id);
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    // Handle AI feedback save
    const handleFeedbackSave = async (saveData) => {
        if (!selectedField) return;
        const refinedContent = saveData?.refinedContent || saveData;

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

            setFields(prev => prev.map(f =>
                f.field_id === selectedField.field_id
                    ? { ...f, field_value: refinedContent, version: result.version, is_approved: false }
                    : f
            ));
            setSectionApproved(false);
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
            const response = await fetchWithAuth('/api/os/vault-section-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId
                })
            });

            if (!response.ok) throw new Error('Failed to approve section');

            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));
            setSectionApproved(true);
            if (onApprove) onApprove(sectionId);

        } catch (error) {
            console.error('[SalesScriptsFields] Approve error:', error);
        } finally {
            setIsApproving(false);
        }
    };

    const getFieldValue = (field_id) => {
        const field = fields.find(f => f.field_id === field_id);
        return field ? field.field_value : null;
    };

    // Grouping helper
    const renderGroupedFields = () => {
        // Group fields
        const groupedFields = predefinedFields.reduce((acc, field) => {
            const group = field.group;
            if (!acc[group]) acc[group] = [];
            acc[group].push(field);
            return acc;
        }, {});

        // Get groups present in data, preserving desired order
        const definedGroupsInOrder = groupOrder.filter(g => groupedFields[g]);
        // Add any 'Other' or undefined groups at the end
        Object.keys(groupedFields).forEach(g => {
            if (!definedGroupsInOrder.includes(g)) {
                definedGroupsInOrder.push(g);
            }
        });

        return definedGroupsInOrder.map((groupName) => {
            const groupFields = groupedFields[groupName];
            const isExpanded = expandedGroup === groupName;

            return (
                <div key={groupName} className="bg-[#18181b] border border-[#3a3a3d] rounded-xl overflow-hidden">
                    {/* Group Header */}
                    <button
                        onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                        className="w-full px-6 py-4 flex items-center justify-between bg-[#1a1a1d] hover:bg-[#1f1f22] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-cyan" />
                            <h3 className="text-lg font-semibold text-white">{groupName}</h3>
                            <span className="text-sm text-gray-500">({groupFields.length} field{groupFields.length > 1 ? 's' : ''})</span>
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
                            {groupFields.map((fieldDef) => {
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
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <>
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {renderGroupedFields()}

                        {/* Custom Fields */}
                        {fields.filter(f => f.is_custom).length > 0 && (
                            <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                                <button
                                    onClick={() => setExpandedGroup(expandedGroup === 'Custom Fields' ? null : 'Custom Fields')}
                                    className={`w-full flex items-center justify-between p-4 transition-all ${expandedGroup === 'Custom Fields' ? 'bg-white/10' : 'hover:bg-white/10'
                                        }`}
                                >
                                    <h3 className="font-semibold text-lg text-white">Custom Fields</h3>
                                    {expandedGroup === 'Custom Fields' ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                                </button>
                                {expandedGroup === 'Custom Fields' && (
                                    <div className="p-6 space-y-8 border-t border-white/10">
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
                        )}
                    </>
                )}
            </div>

            {/* Export Buttons - Bottom of Section */}
            {!isLoading && fields.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#2a2a2d] flex items-center justify-end gap-2">
                    <button
                        onClick={() => exportSectionToPDF(fields, 'Closer Script')}
                        className="p-2 rounded-lg border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
                        title="Download PDF"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => exportSectionToCSV(fields, 'Closer Script')}
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
