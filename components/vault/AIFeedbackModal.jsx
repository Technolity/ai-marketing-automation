'use client';

/**
 * AIFeedbackModal - Unified AI Feedback Component
 * 
 * A properly centered, fixed modal for AI-powered content editing.
 * Supports 3 modes: Single Field, Multi-Field, Full Section
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Sparkles, Loader2, AlertCircle, Check,
    FileText, Layers, RefreshCw, Send, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

// Editing modes
const MODES = {
    SINGLE: 'single',      // Edit one field
    MULTI: 'multi',        // Edit multiple related fields  
    SECTION: 'section'     // Regenerate entire section
};

const MODE_CONFIG = {
    [MODES.SINGLE]: {
        icon: FileText,
        label: 'Single Field',
        description: 'Edit one specific field',
        color: 'cyan'
    },
    [MODES.MULTI]: {
        icon: Layers,
        label: 'Multiple Fields',
        description: 'Edit a group of related fields',
        color: 'purple'
    },
    [MODES.SECTION]: {
        icon: RefreshCw,
        label: 'Full Section',
        description: 'AI regenerates entire section',
        color: 'orange'
    }
};

export default function AIFeedbackModal({
    isOpen,
    onClose,
    // Context
    sectionId,
    sectionTitle,
    funnelId,
    // Field context (for single/multi mode)
    fieldId = null,
    fieldLabel = null,
    fieldValue = null,
    // Full section context
    currentContent = null,
    // Callbacks
    onSave,
    onRefresh
}) {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState(MODES.SINGLE);
    const [feedback, setFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewContent, setPreviewContent] = useState(null);
    const [step, setStep] = useState(1); // 1: Input, 2: Preview, 3: Success

    // Mount check for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFeedback('');
            setPreviewContent(null);
            setStep(1);
            setIsProcessing(false);
            // Default to single field mode if fieldId provided
            setMode(fieldId ? MODES.SINGLE : MODES.SECTION);
        }
    }, [isOpen, fieldId]);

    // Handle feedback submission
    const handleSubmit = async () => {
        if (!feedback.trim() || isProcessing) return;

        setIsProcessing(true);

        try {
            let response;
            let result;

            if (mode === MODES.SINGLE && fieldId) {
                // Single field refinement
                response = await fetchWithAuth('/api/os/refine-section', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionId,
                        subSection: fieldId,
                        feedback: feedback.trim(),
                        currentContent: { [fieldId]: fieldValue },
                        sessionId: funnelId
                    })
                });
            } else if (mode === MODES.SECTION) {
                // Full section regeneration
                response = await fetchWithAuth('/api/os/refine-section', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionId,
                        subSection: 'all',
                        feedback: feedback.trim(),
                        currentContent,
                        sessionId: funnelId
                    })
                });
            } else {
                // Multi-field mode - same as section for now
                response = await fetchWithAuth('/api/os/refine-section', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionId,
                        subSection: 'all',
                        feedback: feedback.trim(),
                        currentContent,
                        sessionId: funnelId
                    })
                });
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate refinement');
            }

            result = await response.json();
            setPreviewContent(result.refinedContent);
            setStep(2);

        } catch (error) {
            console.error('[AIFeedbackModal] Error:', error);
            toast.error(error.message || 'Failed to generate refinement');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle saving the refined content
    const handleSave = async () => {
        if (!previewContent) return;

        setIsProcessing(true);

        try {
            if (mode === MODES.SINGLE && fieldId) {
                // Save single field via PATCH
                const fieldValueToSave = previewContent[fieldId] || previewContent;

                const response = await fetchWithAuth('/api/os/vault-field', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        funnel_id: funnelId,
                        section_id: sectionId,
                        field_id: fieldId,
                        field_value: fieldValueToSave
                    })
                });

                if (!response.ok) throw new Error('Failed to save field');

                toast.success(`${fieldLabel || 'Field'} updated!`);
            } else {
                // Save full section - call onSave callback
                if (onSave) {
                    onSave(previewContent);
                }
                toast.success(`${sectionTitle || 'Section'} updated!`);
            }

            setStep(3);

            // Close after brief success display
            setTimeout(() => {
                if (onRefresh) onRefresh();
                onClose();
            }, 1000);

        } catch (error) {
            console.error('[AIFeedbackModal] Save error:', error);
            toast.error(error.message || 'Failed to save changes');
        } finally {
            setIsProcessing(false);
        }
    };

    // Don't render on server
    if (!mounted) return null;
    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        style={{ zIndex: 9998 }}
                    />

                    {/* Modal Container - Centered */}
                    <div
                        className="fixed inset-0 flex items-center justify-center p-4"
                        style={{ zIndex: 9999 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#18181b] border border-[#2a2a2d] rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2d]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-cyan/20 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">AI Feedback</h3>
                                        <p className="text-xs text-gray-400">
                                            {fieldLabel || sectionTitle || 'Edit Content'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={isProcessing}
                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                {step === 1 && (
                                    <>
                                        {/* Mode Selector - Only show if no specific field */}
                                        {!fieldId && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {Object.entries(MODE_CONFIG).map(([key, config]) => {
                                                    const Icon = config.icon;
                                                    const isActive = mode === key;
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => setMode(key)}
                                                            className={`p-3 rounded-xl border transition-all text-center ${isActive
                                                                    ? 'border-purple-500 bg-purple-500/10'
                                                                    : 'border-[#2a2a2d] hover:border-gray-600'
                                                                }`}
                                                        >
                                                            <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
                                                            <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                                                {config.label}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Info Box */}
                                        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-3">
                                            <div className="flex gap-2">
                                                <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-purple-200/80">
                                                    {mode === MODES.SINGLE
                                                        ? 'Describe how you want to change this field.'
                                                        : mode === MODES.MULTI
                                                            ? 'Describe changes for multiple related fields.'
                                                            : 'Tell the AI how to improve the entire section.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Feedback Input */}
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="e.g., Make the tone more conversational, focus on the pain points..."
                                            className="w-full h-28 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl p-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none outline-none text-sm"
                                            disabled={isProcessing}
                                            autoFocus
                                        />
                                    </>
                                )}

                                {step === 2 && previewContent && (
                                    <>
                                        {/* Preview Header */}
                                        <div className="flex items-center gap-2 text-green-400">
                                            <Check className="w-4 h-4" />
                                            <span className="text-sm font-medium">Preview Generated</span>
                                        </div>

                                        {/* Preview Content */}
                                        <div className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl p-3 max-h-48 overflow-y-auto">
                                            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                                                {typeof previewContent === 'string'
                                                    ? previewContent
                                                    : JSON.stringify(previewContent, null, 2).substring(0, 1000)}
                                            </pre>
                                        </div>

                                        <p className="text-xs text-gray-500">
                                            Review the changes above. Click &quot;Apply Changes&quot; to save.
                                        </p>
                                    </>
                                )}

                                {step === 3 && (
                                    <div className="text-center py-6">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Check className="w-6 h-6 text-green-400" />
                                        </div>
                                        <p className="text-white font-medium">Changes Saved!</p>
                                        <p className="text-sm text-gray-400">Refreshing content...</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            {step !== 3 && (
                                <div className="flex justify-end gap-3 p-4 border-t border-[#2a2a2d]">
                                    <button
                                        onClick={step === 2 ? () => setStep(1) : onClose}
                                        disabled={isProcessing}
                                        className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors disabled:opacity-50"
                                    >
                                        {step === 2 ? 'Back' : 'Cancel'}
                                    </button>

                                    {step === 1 && (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!feedback.trim() || isProcessing}
                                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Generate
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {step === 2 && (
                                        <button
                                            onClick={handleSave}
                                            disabled={isProcessing}
                                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Apply Changes
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    // Render via portal to document.body
    return createPortal(modalContent, document.body);
}
