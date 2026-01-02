'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Mail, RefreshCw } from 'lucide-react';
import FieldEditor from './FieldEditor';
import CustomFieldAdder from './CustomFieldAdder';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { getFieldsForSection } from '@/lib/vault/fieldStructures';

export default function EmailsFields({ funnelId, onApprove }) {
    const [isExpanded, setIsExpanded] = useState(false);
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

    return (
        <>
            <div className="bg-gradient-to-br from-[#1a1a1d] to-[#0e0e0f] border border-[#3a3a3d] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#18181b] transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionApproved ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {sectionApproved ? <CheckCircle className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Email & SMS Sequences</h3>
                            <p className="text-sm text-gray-500">{fields.length} fields • {sectionApproved ? 'Approved' : 'In Progress'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); handleRegenerateSection(); }} disabled={isRegenerating} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                        </button>
                        {!sectionApproved && fields.length > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); handleApproveSection(); }} disabled={isApproving} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50">
                                {isApproving ? 'Approving...' : 'Approve Section'}
                            </button>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="p-6 pt-0 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
                        ) : (
                            <>
                                {predefinedFields.map((fieldDef) => (<FieldEditor key={fieldDef.field_id} fieldDef={fieldDef} initialValue={getFieldValue(fieldDef.field_id)} sectionId={sectionId} funnelId={funnelId} onSave={handleFieldSave} onAIFeedback={handleAIFeedback} />))}
                                {fields.filter(f => f.is_custom).map((customField) => (<FieldEditor key={customField.field_id} fieldDef={{ field_id: customField.field_id, field_label: customField.field_label, field_type: customField.field_type, field_metadata: customField.field_metadata || {} }} initialValue={customField.field_value} sectionId={sectionId} funnelId={funnelId} onSave={handleFieldSave} onAIFeedback={handleAIFeedback} />))}
                                <div className="pt-4 border-t border-[#3a3a3d]"><CustomFieldAdder sectionId={sectionId} funnelId={funnelId} onFieldAdded={handleFieldAdded} /></div>
                            </>
                        )}
                    </div>
                )}
            </div>
            {feedbackModalOpen && selectedField && (<FeedbackChatModal isOpen={feedbackModalOpen} onClose={() => { setFeedbackModalOpen(false); setSelectedField(null); }} sectionId={sectionId} sectionTitle="Email & SMS Sequences" subSection={selectedField.field_id} subSectionTitle={selectedField.field_label} currentContent={selectedFieldValue} sessionId={funnelId} onSave={handleFeedbackSave} />)}
        </>
    );
}
