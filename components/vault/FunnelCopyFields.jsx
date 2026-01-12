'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, FileText } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'sonner';

export default function FunnelCopyFields({ funnelId, onApprove, onRenderApproveButton }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);
    const [activeTab, setActiveTab] = useState('optin'); // optin, sales, booking, thankyou

    const sectionId = 'funnelCopy';
    const predefinedFields = getFieldsForSection(sectionId);

    // Get subfields for each page
    const optinPage = predefinedFields.find(f => f.field_id === 'optinPage');
    const salesPage = predefinedFields.find(f => f.field_id === 'salesPage');
    const bookingPage = predefinedFields.find(f => f.field_id === 'bookingPage');
    const thankYouPage = predefinedFields.find(f => f.field_id === 'thankYouPage');

    const fetchFields = async () => {
        setIsLoading(true);
        try {
            const response = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setFields(data.fields || []);
            setSectionApproved(data.fields.length > 0 && data.fields.every(f => f.is_approved));
        } catch (error) {
            console.error('[FunnelCopyFields] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (funnelId) fetchFields(); }, [funnelId]);

    // Listen for real-time generation complete event
    useEffect(() => {
        const handleGenerationComplete = (e) => {
            if (e.detail.funnelId === funnelId) {
                console.log('[FunnelCopyFields] Generation complete, refetching...');
                fetchFields();
            }
        };

        window.addEventListener('funnelCopyGenerated', handleGenerationComplete);
        return () => window.removeEventListener('funnelCopyGenerated', handleGenerationComplete);
    }, [funnelId]);

    const handleFieldSave = async (field_id, value, result) => {
        setFields(prev => prev.map(f => f.field_id === field_id ? { ...f, field_value: value, version: result.version } : f));
        setSectionApproved(false);
    };

    const handleAIFeedback = (field_id, field_label, currentValue) => {
        setSelectedField({ field_id, field_label });
        setSelectedFieldValue(currentValue);
        setFeedbackModalOpen(true);
    };

    const handleFeedbackSave = async (refinedContent) => {
        if (!selectedField) return;
        try {
            const response = await fetch('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_id: sectionId, field_id: selectedField.field_id, field_value: refinedContent })
            });
            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();
            setFields(prev => prev.map(f => f.field_id === selectedField.field_id ? { ...f, field_value: refinedContent, version: result.version } : f));
            setSectionApproved(false);
            setFeedbackModalOpen(false);
            setSelectedField(null);
        } catch (error) {
            console.error('[FunnelCopyFields] Save error:', error);
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
            setFields(prev => prev.map(f => ({ ...f, is_approved: true })));
            setSectionApproved(true);
            if (onApprove) onApprove(sectionId);
            toast.success('Funnel Copy approved!');
        } catch (error) {
            console.error('[FunnelCopyFields] Approve error:', error);
            toast.error('Failed to approve section');
        } finally {
            setIsApproving(false);
        }
    };

    const handleRegenerateSection = async () => {
        setIsRegenerating(true);
        toast.info('Regenerating Funnel Copy in background...');

        try {
            const response = await fetch('/api/os/generate-funnel-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to regenerate');
            }

            const { jobId } = await response.json();

            // Poll for completion
            const pollStatus = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/os/generation-status?jobId=${jobId}`);
                    const job = await statusRes.json();

                    if (job.status === 'completed') {
                        clearInterval(pollStatus);
                        setIsRegenerating(false);
                        await fetchFields();
                        setSectionApproved(false);
                        toast.success('Funnel Copy regenerated successfully!');
                    } else if (job.status === 'failed') {
                        clearInterval(pollStatus);
                        setIsRegenerating(false);
                        toast.error('Regeneration failed: ' + job.errorMessage);
                    }
                } catch (err) {
                    console.error('[FunnelCopyFields] Polling error:', err);
                }
            }, 3000);

            // Stop polling after 5 minutes
            setTimeout(() => {
                clearInterval(pollStatus);
                if (isRegenerating) {
                    setIsRegenerating(false);
                    toast.error('Regeneration timeout - please refresh and try again');
                }
            }, 300000);

        } catch (error) {
            console.error('[FunnelCopyFields] Regenerate error:', error);
            toast.error(error.message || 'Failed to regenerate');
            setIsRegenerating(false);
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

        return (
            <div className="space-y-4">
                {pageFieldDef.field_metadata.subfields.map((subfield) => {
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
                            sectionId={sectionId}
                            funnelId={funnelId}
                            onSave={handleFieldSave}
                            onAIFeedback={handleAIFeedback}
                        />
                    );
                })}
            </div>
        );
    };

    const tabs = [
        { id: 'optin', label: 'Optin Page', icon: FileText },
        { id: 'sales', label: 'Sales Page (VSL)', icon: FileText },
        { id: 'booking', label: 'Booking Page', icon: FileText },
        { id: 'thankyou', label: 'Thank You Page', icon: FileText }
    ];

    return (
        <>
            <div className="space-y-6">
                {/* Regenerate Button */}
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Funnel Page Copy</h3>
                    <button
                        onClick={handleRegenerateSection}
                        disabled={isRegenerating}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-white/20"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                </div>

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
                        {activeTab === 'booking' && renderPageSubfields(bookingPage)}
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
