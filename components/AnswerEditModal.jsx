"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Edit3, RefreshCw, Loader2, CheckCircle, AlertCircle,
    ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import {
    STEPS, STEP_INPUTS, BUSINESS_TYPE_OPTIONS, REVENUE_OPTIONS,
    PLATFORM_OPTIONS, BUSINESS_STAGE_OPTIONS, ASSET_OPTIONS
} from "@/lib/os-wizard-data";

// Option mappings for selects/multiselects
const OPTIONS_MAP = {
    BUSINESS_TYPE_OPTIONS,
    REVENUE_OPTIONS,
    PLATFORM_OPTIONS,
    BUSINESS_STAGE_OPTIONS,
    ASSET_OPTIONS
};

/**
 * AnswerEditModal
 * 
 * Modal component that allows users to edit their intake answers
 * and trigger a batch regeneration of all affected content.
 */
export default function AnswerEditModal({
    isOpen,
    onClose,
    currentAnswers = {},
    sessionId,
    onRefreshResults
}) {
    const [editedAnswers, setEditedAnswers] = useState({});
    const [expandedSteps, setExpandedSteps] = useState({});
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regenerationProgress, setRegenerationProgress] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize edited answers when modal opens
    useEffect(() => {
        if (isOpen) {
            setEditedAnswers({ ...currentAnswers });
            setExpandedSteps({});
            setHasChanges(false);
        }
    }, [isOpen, currentAnswers]);

    // Check for changes
    useEffect(() => {
        const changed = Object.keys(editedAnswers).some(key => {
            return JSON.stringify(editedAnswers[key]) !== JSON.stringify(currentAnswers[key]);
        });
        setHasChanges(changed);
    }, [editedAnswers, currentAnswers]);

    const handleInputChange = (fieldName, value) => {
        setEditedAnswers(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleMultiSelectChange = (fieldName, value) => {
        const currentValues = editedAnswers[fieldName] || [];
        let newValues;

        if (currentValues.includes(value)) {
            newValues = currentValues.filter(v => v !== value);
        } else {
            newValues = [...currentValues, value];
        }

        handleInputChange(fieldName, newValues);
    };

    const toggleStep = (stepId) => {
        setExpandedSteps(prev => ({
            ...prev,
            [stepId]: !prev[stepId]
        }));
    };

    const handleRegenerate = async () => {
        if (!hasChanges) {
            toast.info("No changes detected");
            return;
        }

        setIsRegenerating(true);
        setRegenerationProgress({ status: "Starting regeneration...", sections: [] });

        try {
            // Calculate what changed
            const changedFields = {};
            for (const key of Object.keys(editedAnswers)) {
                if (JSON.stringify(editedAnswers[key]) !== JSON.stringify(currentAnswers[key])) {
                    changedFields[key] = editedAnswers[key];
                }
            }

            setRegenerationProgress({
                status: `Regenerating content based on ${Object.keys(changedFields).length} changed field(s)...`,
                sections: []
            });

            const response = await fetch('/api/os/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updatedAnswers: changedFields,
                    sessionId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Regeneration failed');
            }

            setRegenerationProgress({
                status: "Complete!",
                sections: data.regeneratedSections || [],
                failed: data.failedSections || []
            });

            toast.success(`✨ Regenerated ${data.regeneratedSections?.length || 0} sections!`);

            // Wait a moment to show success, then close and refresh
            setTimeout(() => {
                onClose();
                if (onRefreshResults) {
                    onRefreshResults();
                }
            }, 1500);

        } catch (error) {
            console.error('Regeneration error:', error);
            toast.error(error.message || 'Failed to regenerate content');
            setRegenerationProgress(null);
        } finally {
            setIsRegenerating(false);
        }
    };

    const renderInput = (input, stepData) => {
        const value = editedAnswers[input.name] || '';
        const options = input.options ? OPTIONS_MAP[input.options] || [] : [];

        switch (input.type) {
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        placeholder={input.placeholder}
                        rows={input.rows || 3}
                        className="w-full bg-[#1a1a1c] border border-[#2a2a2d] rounded-xl p-4 text-white 
                                   placeholder-gray-500 focus:ring-2 focus:ring-cyan/50 focus:border-cyan 
                                   outline-none transition-all resize-none text-sm"
                    />
                );

            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        className="w-full bg-[#1a1a1c] border border-[#2a2a2d] rounded-xl p-4 text-white 
                                   focus:ring-2 focus:ring-cyan/50 focus:border-cyan outline-none 
                                   transition-all text-sm appearance-none cursor-pointer"
                    >
                        <option value="">{input.placeholder}</option>
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );

            case 'multiselect':
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {options.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleMultiSelectChange(input.name, opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                        ${selectedValues.includes(opt.value)
                                            ? 'bg-cyan/20 text-cyan border border-cyan/40'
                                            : 'bg-[#1a1a1c] text-gray-400 border border-[#2a2a2d] hover:border-gray-600'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        placeholder={input.placeholder}
                        className="w-full bg-[#1a1a1c] border border-[#2a2a2d] rounded-xl p-4 text-white 
                                   placeholder-gray-500 focus:ring-2 focus:ring-cyan/50 focus:border-cyan 
                                   outline-none transition-all text-sm"
                    />
                );
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !isRegenerating) onClose();
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0e0e0f] rounded-2xl border border-[#2a2a2d] w-full max-w-3xl max-h-[85vh] 
                               overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#2a2a2d] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan/20 to-blue-500/20 border border-cyan/20">
                                <Edit3 className="w-5 h-5 text-cyan" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Update Your Business</h2>
                                <p className="text-sm text-gray-500">Edit answers to regenerate all content</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isRegenerating}
                            className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {isRegenerating ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 text-cyan animate-spin" />
                                    <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                                </div>
                                <p className="mt-4 text-lg font-medium text-white">
                                    {regenerationProgress?.status || "Regenerating..."}
                                </p>
                                {regenerationProgress?.sections?.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md">
                                        {regenerationProgress.sections.map(section => (
                                            <span key={section} className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                {section}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            STEPS.map((step) => {
                                const stepInputs = STEP_INPUTS[step.id] || [];
                                const isExpanded = expandedSteps[step.id];
                                const hasValue = stepInputs.some(input => editedAnswers[input.name]);
                                const isChanged = stepInputs.some(input =>
                                    JSON.stringify(editedAnswers[input.name]) !== JSON.stringify(currentAnswers[input.name])
                                );

                                return (
                                    <div
                                        key={step.id}
                                        className={`border rounded-xl overflow-hidden transition-all
                                            ${isChanged
                                                ? 'border-yellow-500/50 bg-yellow-500/5'
                                                : 'border-[#2a2a2d] bg-[#1b1b1d]/50'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleStep(step.id)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-[#2a2a2d]/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg bg-[#2a2a2d] flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {step.id}
                                                </span>
                                                <div className="text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white text-sm">{step.title}</span>
                                                        {isChanged && (
                                                            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded font-bold">
                                                                CHANGED
                                                            </span>
                                                        )}
                                                        {step.optional && !hasValue && (
                                                            <span className="text-[10px] text-gray-600">(optional)</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{step.description}</p>
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#2a2a2d]/50">
                                                        {stepInputs.map((input) => (
                                                            <div key={input.name}>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    {input.label}
                                                                </label>
                                                                {renderInput(input, editedAnswers)}
                                                                {input.helpText && (
                                                                    <p className="mt-1.5 text-xs text-gray-500">
                                                                        {input.helpText}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {!isRegenerating && (
                        <div className="p-6 border-t border-[#2a2a2d] flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                {hasChanges ? (
                                    <span className="text-yellow-400 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Changes detected - regeneration required
                                    </span>
                                ) : (
                                    "No changes made"
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-[#2a2a2d] hover:bg-[#3a3a3d] text-white rounded-xl 
                                               font-medium transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={!hasChanges}
                                    className="px-5 py-2.5 bg-gradient-to-r from-cyan to-blue-600 hover:brightness-110 
                                               text-white rounded-xl font-bold flex items-center gap-2 transition-all 
                                               text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan/20"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Regenerate My Business
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
