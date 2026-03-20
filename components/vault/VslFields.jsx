'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Video, Download, Table, MonitorPlay } from 'lucide-react';
import TeleprompterModal from './TeleprompterModal';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { exportSectionToPDF, exportSectionToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

export default function VslFields({ funnelId, onUnapprove, isApproved, refreshTrigger }) {
    // Long-form VSL state
    const [fields, setFields] = useState([]);
    // Short-form VSL state
    const [shortFields, setShortFields] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [teleprompterOpen, setTeleprompterOpen] = useState(false);
    const previousApprovalRef = useRef(false);

    // Tab state: 'longForm' or 'shortForm'
    const [activeTab, setActiveTab] = useState('longForm');

    // Inform parent (VaultPage) of tab changes so top-level "AI Feedback" button knows which VSL to update
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('vslTabChange', { detail: { tab: activeTab } }));
    }, [activeTab]);

    const longFormSectionId = 'vsl';
    const shortFormSectionId = 'vslShort';

    const longFormPredefinedFields = getFieldsForSection(longFormSectionId);
    const shortFormPredefinedFields = getFieldsForSection(shortFormSectionId);

    // Derived: which section is currently active
    const currentSectionId = activeTab === 'longForm' ? longFormSectionId : shortFormSectionId;
    const currentFields = activeTab === 'longForm' ? fields : shortFields;
    const currentPredefinedFields = activeTab === 'longForm' ? longFormPredefinedFields : shortFormPredefinedFields;

    const fetchFields = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            // Fetch both sections in parallel
            const [longRes, shortRes] = await Promise.all([
                fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${longFormSectionId}`),
                fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${shortFormSectionId}`)
            ]);

            if (!longRes.ok) throw new Error('Failed to fetch long form');
            const longData = await longRes.json();
            setFields(longData.fields || []);

            if (shortRes.ok) {
                const shortData = await shortRes.json();
                setShortFields(shortData.fields || []);
            } else {
                // Short form may not exist yet — that's fine
                setShortFields([]);
            }

            const allLongApproved = longData.fields.length > 0 && longData.fields.every(f => f.is_approved);
            const allApproved = isApproved !== undefined ? isApproved : allLongApproved;
            setSectionApproved(allApproved);

            console.log(`[VslFields] Fetched ${longData.fields.length} long-form fields`);
        } catch (error) {
            console.error('[VslFields] Fetch error:', error);
            if (!silent) toast.error('Failed to load fields');
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [funnelId, isApproved]);

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
            onUnapprove(longFormSectionId);
        }
        previousApprovalRef.current = sectionApproved;
    }, [sectionApproved, onUnapprove]);

    // Initial expansion
    useEffect(() => {
        if (currentFields.length > 0 && !expandedGroup) {
            const firstGroup = currentPredefinedFields[0]?.group || 'Other';
            setExpandedGroup(firstGroup);
        }
    }, [currentFields, expandedGroup, currentPredefinedFields]);

    // Reset expanded group on tab change
    useEffect(() => {
        const firstGroup = currentPredefinedFields[0]?.group || 'Other';
        setExpandedGroup(firstGroup);
    }, [activeTab]);

    const handleFieldSave = async (field_id, value, result) => {
        console.log(`[VslFields] Field saved (${currentSectionId}):`, field_id, 'version:', result.version);
        const setFn = activeTab === 'longForm' ? setFields : setShortFields;
        setFn(prev => prev.map(f => f.field_id === field_id ? { ...f, field_value: value, version: result.version, is_approved: false } : f));
        setSectionApproved(false);
    };

    const handleAIFeedback = (field_id, field_label, currentValue) => {
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    const handleFeedbackSave = async (saveData) => {
        if (!selectedField) return;

        const refinedContent = saveData?.refinedContent || saveData;

        try {
            const response = await fetch('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_id: currentSectionId, field_id: selectedField.field_id, field_value: refinedContent })
            });
            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();
            console.log(`[VslFields] AI feedback saved for field (${currentSectionId}):`, selectedField.field_id);

            const setFn = activeTab === 'longForm' ? setFields : setShortFields;
            setFn(prev => prev.map(f => f.field_id === selectedField.field_id ? { ...f, field_value: refinedContent, version: result.version, is_approved: false } : f));
            setSectionApproved(false);
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
        const groups = {};
        const orderedGroups = [];

        currentPredefinedFields.forEach(fieldDef => {
            const groupName = fieldDef.group || 'Other';
            if (!groups[groupName]) {
                groups[groupName] = [];
                orderedGroups.push(groupName);
            }

            const fieldState = currentFields.find(f => f.field_id === fieldDef.field_id);
            const value = fieldState ? fieldState.field_value : null;

            groups[groupName].push({
                ...fieldDef,
                value
            });
        });

        // Handle custom fields
        const customFields = currentFields.filter(f => f.is_custom);
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
                                            sectionId={currentSectionId}
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

    const tabs = [
        { id: 'longForm', label: 'Long Form' },
        { id: 'shortForm', label: 'Short Form' }
    ];

    // Teleprompter sections for the current tab
    const teleprompterSections = currentPredefinedFields.map(def => ({
        label: def.field_label,
        text: currentFields.find(f => f.field_id === def.field_id)?.field_value || ''
    })).filter(s => s.text);

    const teleprompterTitle = activeTab === 'longForm' ? 'Funnel Video Script' : 'Appointment Booking Video Script';
    const exportTitle = activeTab === 'longForm' ? 'VSL Script' : 'Short Form VSL Script';

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
                            <Video className="w-4 h-4" />
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
                    renderGroupedFields()
                )}
            </div>

            {!isLoading && currentFields.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#2a2a2d] flex items-center justify-between">
                    <button
                        onClick={() => setTeleprompterOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 transition-colors font-medium text-sm"
                        title="Open Teleprompter"
                    >
                        <MonitorPlay className="w-4 h-4" />
                        <span>Teleprompter</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportSectionToPDF(currentFields, exportTitle)}
                            className="p-2 rounded-lg border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => exportSectionToCSV(currentFields, exportTitle)}
                            className="p-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
                            title="Download CSV"
                        >
                            <Table className="w-4 h-4" />
                        </button>
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
                    sectionId={currentSectionId}
                    sectionTitle={activeTab === 'longForm' ? 'Funnel Video Script' : 'Appointment Booking Video Script'}
                    subSection={selectedField.field_id}
                    subSectionTitle={selectedField.field_label}
                    currentContent={selectedFieldValue}
                    sessionId={funnelId}
                    onSave={handleFeedbackSave}
                />
            )}

            {/* Teleprompter Modal */}
            <TeleprompterModal
                isOpen={teleprompterOpen}
                onClose={() => setTeleprompterOpen(false)}
                title={teleprompterTitle}
                scriptSections={teleprompterSections}
            />
        </>
    );
}
