'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export default function FeedbackModal({
    isOpen,
    onClose,
    section,
    onSubmit,
    isSubmitting
}) {
    const [feedback, setFeedback] = useState('');
    const [mounted, setMounted] = useState(false);

    // Ensure we're mounted before using portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleSubmit = () => {
        if (!feedback.trim()) return;
        onSubmit(feedback);
        setFeedback('');
    };

    // Don't render on server or before mount
    if (!mounted || typeof document === 'undefined') return null;
    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-[#18181b] border border-[#2a2a2d] shadow-2xl rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2a2a2d]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Feedback</h3>
                            <p className="text-xs text-gray-400">Refine {section?.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-3">
                        <div className="flex gap-2">
                            <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-purple-200/80">
                                Describe how you want to improve this section. The AI will regenerate based on your feedback.
                            </p>
                        </div>
                    </div>

                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="e.g., Make the tone more professional..."
                        className="w-full h-24 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:border-purple-500/50 resize-none outline-none"
                        disabled={isSubmitting}
                        autoFocus
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-[#2a2a2d]">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!feedback.trim() || isSubmitting}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Submit
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
