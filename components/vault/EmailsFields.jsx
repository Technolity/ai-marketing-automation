'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Mail, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';

export default function EmailsFields({ funnelId, onApprove, onRenderApproveButton }) {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sectionApproved, setSectionApproved] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldValue, setSelectedFieldValue] = useState(null);

    const sectionId = 'emails';
    const predefinedFields = getFieldsForSection(sectionId);

    const fetchFields = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=${sectionId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setFields(data.fields || []);
            setSectionApproved(data.fields.length > 0 && data.fields.every(f => f.is_approved));
        } catch (error) {
            console.error('[EmailsFields] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (funnelId) fetchFields(); }, [funnelId]);

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
            console.error('[EmailsFields] Save error:', error);
        }
    };

    const handleFieldAdded = (newField) => { setFields(prev => [...prev, newField]); setSectionApproved(false); };

    const handleApproveSection = async () => {
        setIsApproving(true);
        try {
            const response = await fetch('/api/os/vault-section-approve', {
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

    const handleRegenerateSection = async () => {
        setIsRegenerating(true);
        try {
            const response = await fetch('/api/os/regenerate-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: funnelId, section_key: 8 })
            });
            if (!response.ok) throw new Error('Failed to regenerate');
            await fetchFields();
            setSectionApproved(false);
        } catch (error) {
            console.error('[EmailsFields] Regenerate error:', error);
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
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-green-400 font-semibold">Approved</span>
        </div>
    );

    return (
        <>
            {/* Expose approve button via onRenderApproveButton callback */}
            {onRenderApproveButton && onRenderApproveButton(approveButton)}

            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
                ) : (
                    <>
                        {predefinedFields.map((fieldDef) => (<FieldEditor key={fieldDef.field_id} fieldDef={fieldDef} initialValue={getFieldValue(fieldDef.field_id)} sectionId={sectionId} funnelId={funnelId} onSave={handleFieldSave} onAIFeedback={handleAIFeedback} />))}
                    </>
                )}
            </div>
            {feedbackModalOpen && selectedField && (<FeedbackChatModal isOpen={feedbackModalOpen} onClose={() => { setFeedbackModalOpen(false); setSelectedField(null); }} sectionId={sectionId} sectionTitle="Email & SMS Sequences" subSection={selectedField.field_id} subSectionTitle={selectedField.field_label} currentContent={selectedFieldValue} sessionId={funnelId} onSave={handleFeedbackSave} />)}
        </>
    );
}

