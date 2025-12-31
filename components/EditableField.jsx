"use client";
import { useState, useEffect, useRef } from "react";
import { Edit3, Check, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

/**
 * EditableField - Inline text editing with auto-save and AI refinement
 *
 * Features:
 * - Click to edit any field
 * - Auto-save to Supabase on blur/Enter
 * - AI refinement button for targeted improvements
 * - Clean text display (no JSON)
 *
 * @param {string} label - Field label to display
 * @param {string} value - Current field value
 * @param {string} fieldPath - JSON path (e.g., "setterCallScript.quickOutline.callGoal")
 * @param {string} sectionId - Vault section ID
 * @param {string} sessionId - Session/content ID for saving
 * @param {Function} onSave - Callback when value is saved
 * @param {boolean} multiline - Use textarea for long text
 * @param {number} maxLength - Optional max character count
 */
export default function EditableField({
    label,
    value,
    fieldPath,
    sectionId,
    sessionId,
    onSave,
    multiline = false,
    maxLength = null
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);
    const inputRef = useRef(null);

    // Update local value when prop changes
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // Select all text for easy editing
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (currentValue === value) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch('/api/os/vault-field-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    sectionId,
                    fieldPath,
                    newValue: currentValue
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Field updated successfully');
                onSave?.(fieldPath, currentValue);
                setIsEditing(false);
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save: ' + error.message);
            // Revert to original value
            setCurrentValue(value);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
        // Ctrl+Enter saves in multiline mode
        if (e.key === 'Enter' && multiline && e.ctrlKey) {
            e.preventDefault();
            handleSave();
        }
    };

    const handleAIRefine = () => {
        setShowAIMenu(true);
        // TODO: Open AI refinement modal for this specific field
        toast.info('AI refinement coming soon for this field');
    };

    const charCount = currentValue?.length || 0;
    const isOverLimit = maxLength && charCount > maxLength;

    return (
        <div className="group relative mb-4">
            {/* Label */}
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">
                    {label}
                </label>
                {maxLength && (
                    <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
                        {charCount} / {maxLength}
                    </span>
                )}
            </div>

            {/* Editable Content */}
            <div className="relative">
                {isEditing ? (
                    <div className="space-y-2">
                        {multiline ? (
                            <textarea
                                ref={inputRef}
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-4 py-3 bg-[#1b1b1d] border-2 border-cyan rounded-lg text-white resize-none focus:outline-none focus:border-cyan/70"
                                rows={Math.min(Math.max(3, currentValue?.split('\n').length || 3), 15)}
                                disabled={isSaving}
                            />
                        ) : (
                            <input
                                ref={inputRef}
                                type="text"
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-4 py-3 bg-[#1b1b1d] border-2 border-cyan rounded-lg text-white focus:outline-none focus:border-cyan/70"
                                disabled={isSaving}
                            />
                        )}

                        {/* Edit Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isOverLimit}
                                className="px-4 py-2 bg-cyan hover:bg-cyan/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-black rounded-lg font-medium flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Save
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-4 py-2 bg-[#2a2a2d] hover:bg-[#3a3a3d] disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            {multiline && (
                                <span className="text-xs text-gray-500 ml-auto">
                                    Ctrl+Enter to save
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] group-hover:border-cyan/50 rounded-lg cursor-text transition-colors relative"
                    >
                        {/* Display Value */}
                        <div className="text-white whitespace-pre-wrap pr-24">
                            {currentValue || <span className="text-gray-500 italic">Click to add content</span>}
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAIRefine();
                                }}
                                className="p-2 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 rounded-lg transition-all"
                                title="AI Refine"
                            >
                                <Sparkles className="w-4 h-4 text-black" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="p-2 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg transition-all"
                                title="Edit"
                            >
                                <Edit3 className="w-4 h-4 text-cyan" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
