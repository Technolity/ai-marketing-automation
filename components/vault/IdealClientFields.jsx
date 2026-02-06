import { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Users } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { flattenAIResponseToFields } from '@/lib/vault/feedbackUtils';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

/**
 * IdealClientFields - Granular field-level editing for Ideal Client section
 *
 * Props:
 * - funnelId: Funnel ID
 * - onApprove: Callback when section is approved
 */
export default function IdealClientFields({ funnelId, onApprove, onRenderApproveButton, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);

    // AI Feedback modal state
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);
    const [expandedGroup, setExpandedGroup] = useState(null);

    const sectionId = 'idealClient';
    const predefinedFields = getFieldsForSection(sectionId);

    // Fetch fields from database
    const fetchFields = async () => {
        console.log('[IdealClientFields] ========== FETCH START ==========');
        console.log('[IdealClientFields] Fetching fields for:', { funnelId, sectionId });
        setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch fields');

            const data = await response.json();
            console.log('[IdealClientFields] Received fields:', data.fields?.length || 0);
            console.log('[IdealClientFields] Field IDs:', data.fields?.map(f => f.field_id).join(', '));
            setFields(data.fields || []);

            // Check if all fields are approved
            // FIX: If the parent component says it's approved (isApproved prop), we trust that override.
            // This prevents a race condition where fetching old field data overwrites the UI state.
            const allApproved = isApproved || (data.fields.length > 0 && data.fields.every(f => f.is_approved));
            setSectionApproved(allApproved);
            console.log('[IdealClientFields] Section approved status:', allApproved);

        } catch (error) {
            console.error('[IdealClientFields] Fetch error:', error);
        } finally {
            setIsLoading(false);
            console.log('[IdealClientFields] ========== FETCH COMPLETE ==========');
        }
    };

    useEffect(() => {
        console.log('[IdealClientFields] useEffect triggered:', { funnelId, refreshTrigger });
        if (funnelId) {
            fetchFields();
        }
    }, [funnelId, refreshTrigger]);

    // Sync with parent approval state (from header's approve button)
    // The header approve button in page.jsx calls handleApprove() -> updates approvedPhase1
    // -> passes isApproved={true} -> this effect syncs it to local state
    useEffect(() => {
        console.log('[IdealClientFields] isApproved prop changed:', isApproved);
        setSectionApproved(isApproved);
    }, [isApproved]);

    // Initial expansion
    useEffect(() => {
        if (fields.length > 0 && !expandedGroup) {
            // Find the first group name
            const firstGroup = predefinedFields[0]?.group || 'Other';
            setExpandedGroup(firstGroup);
        }
    }, [fields, expandedGroup]);

    // Handle field save
    const handleFieldSave = async (field_id, value, result) => {
        console.log('[IdealClientFields] Field saved:', { field_id, value });

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
        console.log('[IdealClientFields] Opening AI feedback for field:', field_id);
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    // Handle AI feedback save
    const handleFeedbackSave = async (saveData) => {
        console.log('[IdealClientFields] AI feedback save:', { selectedField, saveData });

        if (!selectedField) return;

        // FeedbackChatModal passes { refinedContent, subSection }
        const refinedContent = saveData?.refinedContent || saveData;
        const subSection = saveData?.subSection;

        try {
            // CRITICAL FIX: Handle full section updates differently
            // When subSection is 'all' or undefined and refinedContent has wrapper keys,
            // we need to flatten and save each field individually
            const isFullSectionUpdate = subSection === 'all' || !subSection ||
                refinedContent?.idealClientSnapshot || Object.keys(refinedContent).length > 1;

            if (isFullSectionUpdate) {
                console.log('[IdealClientFields] Full section update detected, flattening fields...');

                // Use feedbackUtils to properly extract individual fields
                const flattenedFields = flattenAIResponseToFields(refinedContent, sectionId);
                console.log('[IdealClientFields] Flattened fields:', Object.keys(flattenedFields));

                // Save each field individually
                const savePromises = Object.entries(flattenedFields).map(async ([fieldId, fieldValue]) => {
                    console.log(`[IdealClientFields] Saving field: ${fieldId}`);
                    const response = await fetch('/api/os/vault-field', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            funnel_id: funnelId,
                            section_id: sectionId,
                            field_id: fieldId,
                            field_value: fieldValue
                        })
                    });

                    if (!response.ok) {
                        console.error(`[IdealClientFields] Failed to save field ${fieldId}`);
                        throw new Error(`Failed to save field: ${fieldId}`);
                    }

                    const result = await response.json();
                    return { fieldId, fieldValue, version: result.version };
                });

                const savedFields = await Promise.all(savePromises);
                console.log('[IdealClientFields] All fields saved:', savedFields.length);

                // Update local state with all saved fields
                setFields(prev => {
                    const updated = [...prev];
                    for (const { fieldId, fieldValue, version } of savedFields) {
                        const idx = updated.findIndex(f => f.field_id === fieldId);
                        if (idx >= 0) {
                            updated[idx] = { ...updated[idx], field_value: fieldValue, version };
                        } else {
                            // Field doesn't exist, add it
                            updated.push({ field_id: fieldId, field_value: fieldValue, version });
                        }
                    }
                    return updated;
                });

            } else {
                // Single field update (original behavior)
                console.log('[IdealClientFields] Single field update:', selectedField.field_id);
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
            }

            // Reset section approval
            setSectionApproved(false);

            // Close modal
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

        } catch (error) {
            console.error('[IdealClientFields] AI feedback save error:', error);
        }
    };

    // Handle section approval
    const handleApproveSection = async () => {
        console.log('[IdealClientFields] Approve button clicked');
        setIsApproving(true);
        try {
            // FIXED: Changed from /api/os/vault-fields/approve to /api/os/vault-section-approve
            const response = await fetchWithAuth('/api/os/vault-section-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[IdealClientFields] Approve API error:', errorData);
                throw new Error(errorData.message || 'Failed to approve section');
            }

            const result = await response.json();
            console.log('[IdealClientFields] Approval successful:', result);

            // Update local state
            setSectionApproved(true);

            // Update fields to mark them as approved
            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));

            // Notify parent component
            if (onApprove) {
                onApprove(sectionId);
            }

            console.log('[IdealClientFields] Section approved, sectionApproved=true');
        } catch (error) {
            console.error('[IdealClientFields] Approve error:', error);
            alert(`Failed to approve section: ${error.message}`);
        } finally {
            setIsApproving(false);
        }
    };

    // Handle section regeneration
    const handleRegenerateSection = async () => {
        setIsRegenerating(true);
        try {
            const response = await fetch('/api/os/regenerate-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_key: 1 // idealClient is key 1
                })
            });

            if (!response.ok) throw new Error('Failed to regenerate section');

            // Refetch fields after regeneration
            await fetchFields();
            setSectionApproved(false);
        } catch (error) {
            console.error('[IdealClientFields] Regenerate error:', error);
        } finally {
            setIsRegenerating(false);
        }
    };

    // Get field value from state
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

        // Handle custom fields
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
                                    <Users className="w-5 h-5 text-cyan" />
                                    <h3 className="text-lg font-semibold text-white">{groupName}</h3>
                                    <span className="text-sm text-gray-500">({groupFields.length} field{groupFields.length > 1 ? 's' : ''})</span>
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
            {/* Expose approve button via onRenderApproveButton callback */}
            {/* Approve button removed (handled by Vault header) */}

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
                    sectionTitle="Ideal Client Profile"
                    currentContent={selectedFieldValue}
                    sessionId={funnelId}
                    onSave={handleFeedbackSave}
                />
            )}
        </>
    );
}
