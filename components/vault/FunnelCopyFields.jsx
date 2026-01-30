'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';

export default function FunnelCopyFields({ funnelId, onApprove, onRenderApproveButton, onUnapprove, isApproved, refreshTrigger }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);
    const [activeTab, setActiveTab] = useState('optin'); // optin, sales, calendar, thankyou

    const sectionId = 'funnelCopy';
    const predefinedFields = getFieldsForSection(sectionId);
    const previousApprovalRef = useRef(false);

    // Get subfields for each page
    const optinPage = predefinedFields.find(f => f.field_id === 'optinPage');
    const salesPage = predefinedFields.find(f => f.field_id === 'salesPage');
    const calendarPage = predefinedFields.find(f => f.field_id === 'calendarPage');
    const thankYouPage = predefinedFields.find(f => f.field_id === 'thankYouPage');


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

            console.log(`[FunnelCopyFields] Fetched ${data.fields.length} fields, all approved:`, allApproved);
        } catch (error) {
            console.error('[FunnelCopyFields] Fetch error:', error);
            if (!silent) toast.error('Failed to load funnel copy fields');
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [funnelId]);

    // Initial fetch
    // Initial fetch
    useEffect(() => { if (funnelId) fetchFields(); }, [funnelId, fetchFields]);

    // Sync with parent approval state
    useEffect(() => {
        setSectionApproved(isApproved);
    }, [isApproved]);

    // Refresh when parent triggers refresh (e.g., after background generation)
    useEffect(() => {
        if (refreshTrigger && funnelId) {
            console.log('[FunnelCopyFields] Refresh triggered by parent');
            fetchFields(true); // Silent refresh
        }
    }, [refreshTrigger, funnelId, fetchFields]);

    // Notify parent when approval state changes
    useEffect(() => {
        if (previousApprovalRef.current === true && sectionApproved === false && onUnapprove) {
            // Section was approved, now unapproved - notify parent
            console.log('[FunnelCopyFields] Section unapproved, notifying parent');
            onUnapprove(sectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, sectionId, onUnapprove]);

    // Listen for real-time generation complete event
    useEffect(() => {
        const handleGenerationComplete = (e) => {
            if (e.detail.funnelId === funnelId) {
                console.log('[FunnelCopyFields] Generation complete, refetching...');
                fetchFields(true); // Silent refresh
            }
        };

        window.addEventListener('funnelCopyGenerated', handleGenerationComplete);
        return () => window.removeEventListener('funnelCopyGenerated', handleGenerationComplete);
    }, [funnelId, fetchFields]);

    const handleFieldSave = async (field_id, value, result) => {
        console.log('[FunnelCopyFields] Field saved:', field_id, 'version:', result.version);

        // Handle nested fields (e.g., "optinPage.headline_text")
        if (field_id.includes('.')) {
            const [parentId, childId] = field_id.split('.');

            // Update the parent object in local state
            setFields(prev => prev.map(f => {
                if (f.field_id === parentId) {
                    // Parse existing object value
                    let parentValue = {};
                    if (typeof f.field_value === 'string') {
                        try {
                            parentValue = JSON.parse(f.field_value);
                        } catch (e) {
                            console.error('[FunnelCopyFields] Failed to parse parent value:', e);
                        }
                    } else if (typeof f.field_value === 'object' && f.field_value !== null) {
                        parentValue = { ...f.field_value };
                    }

                    // Update the nested field
                    parentValue[childId] = value;

                    return {
                        ...f,
                        field_value: parentValue,
                        version: result.version,
                        is_approved: false
                    };
                }
                return f;
            }));
        } else {
            // Regular field (not nested)
            setFields(prev => prev.map(f =>
                f.field_id === field_id
                    ? { ...f, field_value: value, version: result.version, is_approved: false }
                    : f
            ));
        }

        // Mark section as unapproved
        setSectionApproved(false);

        // DON'T increment forceRenderKey here - FieldEditor updates via initialValue prop
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

            console.log('[FunnelCopyFields] AI feedback saved for field:', selectedField.field_id);

            // Handle nested fields (e.g., "optinPage.headline_text")
            if (selectedField.field_id.includes('.')) {
                const [parentId, childId] = selectedField.field_id.split('.');

                // Update the parent object in local state
                setFields(prev => prev.map(f => {
                    if (f.field_id === parentId) {
                        // Parse existing object value
                        let parentValue = {};
                        if (typeof f.field_value === 'string') {
                            try {
                                parentValue = JSON.parse(f.field_value);
                            } catch (e) {
                                console.error('[FunnelCopyFields] Failed to parse parent value:', e);
                            }
                        } else if (typeof f.field_value === 'object' && f.field_value !== null) {
                            parentValue = { ...f.field_value };
                        }

                        // Update the nested field
                        parentValue[childId] = refinedContent;

                        return {
                            ...f,
                            field_value: parentValue,
                            version: result.version,
                            is_approved: false
                        };
                    }
                    return f;
                }));
            } else {
                // Regular field (not nested)
                setFields(prev => prev.map(f =>
                    f.field_id === selectedField.field_id
                        ? { ...f, field_value: refinedContent, version: result.version, is_approved: false }
                        : f
                ));
            }

            // Mark section as unapproved
            setSectionApproved(false);

            // DON'T increment forceRenderKey here - FieldEditor updates via initialValue prop

            // Close modal
            setFeedbackModalOpen(false);
            setSelectedField(null);
            setSelectedFieldValue(null);

            toast.success('Changes saved and applied!');
        } catch (error) {
            console.error('[FunnelCopyFields] Save error:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleApproveSection = async () => {
        setIsApproving(true);
        try {
            const response = await fetchWithAuth('/api/os/vault-section-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_id: sectionId })
            });
            if (!response.ok) throw new Error('Failed to approve');

            // Wait for API response before updating local state
            await response.json();

            // Update local state FIRST
            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));
            setSectionApproved(true);

            // THEN notify parent (prevents race condition with data refresh)
            if (onApprove) onApprove(sectionId);

            toast.success('Funnel Copy approved!');
        } catch (error) {
            console.error('[FunnelCopyFields] Approve error:', error);
            toast.error('Failed to approve section');
        } finally {
            setIsApproving(false);
        }
    };

    const getFieldValue = (field_id) => fields.find(f => f.field_id === field_id)?.field_value || null;

    // Get value for a parent field (like optinPage) which is an object
    const getPageFieldValue = (pageFieldId) => {
        const field = fields.find(f => f.field_id === pageFieldId);
        if (!field) return {};

        // Handle JSON string or object
        if (typeof field.field_value === 'string') {
            try {
                return JSON.parse(field.field_value);
            } catch (e) {
                console.error('[FunnelCopyFields] Failed to parse field value:', e);
                return {};
            }
        }

        return typeof field.field_value === 'object' ? field.field_value : {};
    };

    // Render subfields for a page
    const renderPageSubfields = (pageFieldDef) => {
        if (!pageFieldDef || !pageFieldDef.field_metadata?.subfields) {
            return <div className="text-gray-500 text-sm">No fields defined for this page</div>;
        }

        const pageValue = getPageFieldValue(pageFieldDef.field_id);

        // Clone to allow UI-specific modifications without affecting source
        let subfields = [...pageFieldDef.field_metadata.subfields];

        // CUSTOM UI TRANSFORMATION FOR OPTIN PAGE (User Request)
        if (pageFieldDef.field_id === 'optinPage') {
            // 1. Rename 'Sub-Headline' to 'Audience Callout'
            subfields = subfields.map(field => {
                if (field.field_id === 'subheadline_text') {
                    return { ...field, field_label: 'Audience Callout' };
                }
                return field;
            });

            // 2. Reorder sequence: Audience Callout -> Headline -> Button text
            const orderMap = {
                'subheadline_text': 1,
                'headline_text': 2,
                'cta_button_text': 3
            };

            subfields.sort((a, b) => {
                const orderA = orderMap[a.field_id] || 99;
                const orderB = orderMap[b.field_id] || 99;
                return orderA - orderB;
            });
        }

        // Group by 'group' property, preserving order
        const groups = [];
        const seenGroups = new Set();
        const groupedFields = {};

        subfields.forEach(field => {
            const group = field.group || 'Other';
            if (!seenGroups.has(group)) {
                seenGroups.add(group);
                groups.push(group);
                groupedFields[group] = [];
            }
            groupedFields[group].push(field);
        });

        return (
            <div className="space-y-8">
                {groups.map(groupName => (
                    <div key={groupName} className="space-y-4">
                        {groupName !== 'Other' && (
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4 mt-6 first:mt-0">
                                <h4 className="text-cyan font-bold text-lg">{groupName}</h4>
                            </div>
                        )}
                        <div className="space-y-4">
                            {groupedFields[groupName]
                                .filter(subfield => !subfield.isHidden) // Hide fields marked as hidden
                                .map((subfield) => {
                                    // Create a synthetic fieldDef for the subfield
                                    const subfieldDef = {
                                        ...subfield,
                                        field_id: `${pageFieldDef.field_id}.${subfield.field_id}`, // e.g., "optinPage.headline_text"
                                        parent_field_id: pageFieldDef.field_id
                                    };

                                    const subfieldValue = pageValue[subfield.field_id] || null;

                                    return (
                                        <FieldEditor
                                            key={subfieldDef.field_id}
                                            fieldDef={subfieldDef}
                                            initialValue={subfieldValue}
                                            readOnly={sectionApproved}
                                            sectionId={sectionId}
                                            funnelId={funnelId}
                                            onSave={handleFieldSave}
                                            onAIFeedback={handleAIFeedback}
                                        />
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const tabs = [
        { id: 'optin', label: 'Optin Page', icon: FileText },
        { id: 'sales', label: 'VSL / Sales Page', icon: FileText },
        { id: 'calendar', label: 'Calendar Page', icon: FileText },
        { id: 'thankyou', label: 'Thank You Page', icon: FileText }
    ];

    return (
        <>
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                ? 'text-cyan border-b-2 border-cyan'
                                : 'text-white/60 hover:text-white/80'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="py-4">
                        {activeTab === 'optin' && renderPageSubfields(optinPage)}
                        {activeTab === 'sales' && renderPageSubfields(salesPage)}
                        {activeTab === 'calendar' && renderPageSubfields(calendarPage)}
                        {activeTab === 'thankyou' && renderPageSubfields(thankYouPage)}

                    </div>
                )}
            </div>

            {feedbackModalOpen && selectedField && (
                <FeedbackChatModal
                    isOpen={feedbackModalOpen}
                    onClose={() => {
                        setFeedbackModalOpen(false);
                        setSelectedField(null);
                    }}
                    sectionId={sectionId}
                    sectionTitle="Funnel Page Copy"
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
