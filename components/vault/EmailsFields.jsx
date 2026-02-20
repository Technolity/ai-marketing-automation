'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';
import { fieldGroups } from '@/lib/vault/fieldGroups';

export default function EmailsFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    // Grouping state
    const [expandedGroup, setExpandedGroup] = useState('Day 1: Welcome');

    const sectionId = 'emails';

    // Augment fields with group information
    const predefinedFields = getFieldsForSection(sectionId).map(field => ({
        ...field,
        group: fieldGroups.emails[field.field_id] || 'Other'
    }));

    // Define group order explicitly
    const groupOrder = [
        'Day 1: Welcome',
        'Days 2-7: Nurture & Value',
        'Day 8: First Offer',
        'Days 9-14: Advanced Value',
        'Day 15: Final Offer'
    ];

    const previousApprovalRef = useRef(false);

    const fetchFields = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setFields(data.fields || []);
            // Check if all fields are approved
            const allApproved = isApproved || (data.fields.length > 0 && data.fields.every(f => f.is_approved));
            setSectionApproved(allApproved);
            console.log(`[EmailsFields] Fetched ${data.fields.length} fields, all approved:`, allApproved);
        } catch (error) {
            console.error('[EmailsFields] Fetch error:', error);
            if (!silent) toast.error('Failed to load email fields');
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
            console.log('[EmailsFields] Refresh triggered by parent');
            fetchFields(true);
        }
    }, [refreshTrigger, funnelId, fetchFields]);

    useEffect(() => {
        if (previousApprovalRef.current === true && sectionApproved === false && onUnapprove) {
            console.log('[EmailsFields] Section unapproved, notifying parent');
            onUnapprove(sectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, sectionId, onUnapprove]);

    const handleFieldSave = async (field_id, value, result) => {
        console.log('[EmailsFields] Field saved:', field_id, 'version:', result.version);
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
        const subSection = saveData?.subSection;
        let valueToSave = refinedContent;
        let saveFieldId = selectedField.field_id;

        // Detect hierarchical sub-field refinement:
        // subSection may be "email1.body" while selectedField.field_id is "email1"
        let isHierarchicalRefinement = false;
        let hierarchicalParentId = null;
        let hierarchicalChildId = null;

        if (subSection && subSection.includes('.')) {
            const [parentPart, childPart] = subSection.split('.');
            // Verify this is a child of the selected field
            if (parentPart === selectedField.field_id) {
                isHierarchicalRefinement = true;
                hierarchicalParentId = parentPart;
                hierarchicalChildId = childPart;
                console.log('[EmailsFields] Hierarchical refinement detected:', { parentPart, childPart, subSection });
            }
        }

        if (refinedContent && typeof refinedContent === 'object') {
            if (isHierarchicalRefinement && hierarchicalChildId && hierarchicalChildId in refinedContent) {
                // Hierarchical case: refinedContent = { body: "..." }, extract the child value
                valueToSave = refinedContent[hierarchicalChildId];
                console.log('[EmailsFields] Extracted child value from hierarchical refinement:', { childId: hierarchicalChildId, valuePreview: String(valueToSave).substring(0, 100) });
            } else if (subSection && subSection in refinedContent) {
                valueToSave = refinedContent[subSection];
            } else if (selectedField.field_id in refinedContent) {
                valueToSave = refinedContent[selectedField.field_id];
            } else if (selectedField.field_id?.endsWith('.body') && typeof refinedContent.body === 'string') {
                valueToSave = refinedContent.body;
            }
        }

        // If this is a nested email subfield (e.g., email1.body) OR a hierarchical refinement, update the parent object
        if (selectedField.field_id.includes('.') || isHierarchicalRefinement) {
            const parentId = hierarchicalParentId || selectedField.field_id.split('.')[0];
            const childId = hierarchicalChildId || selectedField.field_id.split('.')[1];
            if (valueToSave && typeof valueToSave === 'object' && childId in valueToSave) {
                valueToSave = valueToSave[childId];
            }

            // CRITICAL FIX: Fetch parent field value fresh from API instead of using stale state
            // This prevents overwriting the entire email object with just the child field
            let parentObject = {};

            try {
                console.log('[EmailsFields] Fetching fresh parent field value for:', parentId);
                const parentResponse = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
                if (parentResponse.ok) {
                    const parentData = await parentResponse.json();
                    const freshParentField = parentData.fields?.find(f => f.field_id === parentId);

                    if (freshParentField?.field_value) {
                        if (typeof freshParentField.field_value === 'string') {
                            try {
                                parentObject = JSON.parse(freshParentField.field_value);
                                console.log('[EmailsFields] Parsed parent field value:', parentObject);
                            } catch (e) {
                                console.error('[EmailsFields] Failed to parse parent field value:', e);
                                // Initialize with default email structure
                                parentObject = { subject: '', preview: '', body: '' };
                            }
                        } else if (typeof freshParentField.field_value === 'object') {
                            parentObject = { ...freshParentField.field_value };
                        }
                    } else {
                        // Parent field doesn't exist - initialize with default email structure
                        console.warn('[EmailsFields] Parent field not found, using default structure');
                        parentObject = { subject: '', preview: '', body: '' };
                    }
                } else {
                    console.error('[EmailsFields] Failed to fetch parent field, falling back to local state');
                    // Fallback to local state if API call fails
                    const parentField = fields.find(f => f.field_id === parentId);
                    if (parentField?.field_value) {
                        if (typeof parentField.field_value === 'string') {
                            try {
                                parentObject = JSON.parse(parentField.field_value);
                            } catch {
                                parentObject = { subject: '', preview: '', body: '' };
                            }
                        } else if (typeof parentField.field_value === 'object') {
                            parentObject = { ...parentField.field_value };
                        }
                    } else {
                        parentObject = { subject: '', preview: '', body: '' };
                    }
                }
            } catch (fetchError) {
                console.error('[EmailsFields] Error fetching parent field:', fetchError);
                // Final fallback to local state
                const parentField = fields.find(f => f.field_id === parentId);
                if (parentField?.field_value) {
                    if (typeof parentField.field_value === 'string') {
                        try {
                            parentObject = JSON.parse(parentField.field_value);
                        } catch {
                            parentObject = { subject: '', preview: '', body: '' };
                        }
                    } else if (typeof parentField.field_value === 'object') {
                        parentObject = { ...parentField.field_value };
                    }
                } else {
                    parentObject = { subject: '', preview: '', body: '' };
                }
            }

            parentObject[childId] = valueToSave;
            valueToSave = parentObject;
            saveFieldId = parentId;

            console.log('[EmailsFields] Final merged parent object:', { parentId, childId, valueToSave: JSON.stringify(valueToSave).substring(0, 200) });
        }

        try {
            const response = await fetchWithAuth('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_id: sectionId, field_id: saveFieldId, field_value: valueToSave })
            });
            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();
            console.log('[EmailsFields] AI feedback saved for field:', saveFieldId);
            setFields(prev => prev.map(f => f.field_id === saveFieldId ? { ...f, field_value: valueToSave, version: result.version, is_approved: false } : f));
            setSectionApproved(false);
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);
            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[EmailsFields] Save error:', error);
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
            console.error('[EmailsFields] Approve error:', error);
        } finally {
            setIsApproving(false);
        }
    };

    const getFieldValue = (field_id) => {
        const field = fields.find(f => f.field_id === field_id);
        const value = field?.field_value || null;
        return value;
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
            const isExpanded = expandedGroup === groupName;
            const groupFields = groupedFields[groupName];

            return (
                <div key={groupName} className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                    <button
                        onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                        className={`w-full flex items-center justify-between p-4 transition-all ${isExpanded ? 'bg-white/10' : 'hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-white">{groupName}</h3>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/5">
                                {groupFields.length} Emails
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                        </div>
                    </button>

                    {isExpanded && (
                        <div className="p-6 space-y-8 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
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
                    sectionTitle="Email Campaigns"
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
