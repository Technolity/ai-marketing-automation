"use client";
/**
 * InlineAIButton - Floating AI assistance button for field-level content refinement
 * 
 * Appears on hover over any editable field, provides quick access to AI assistance
 * for that specific field. Supports:
 * - Quick actions (shorter, professional, urgent)
 * - Conversational refinement
 * - Direct database save
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, X, Send, Loader2, Check,
    Minimize2, ArrowDownCircle, Wand2,
    MessageSquare, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Quick action presets
const QUICK_ACTIONS = [
    { id: 'shorter', label: 'Shorter', prompt: 'Make this more concise while keeping the key message' },
    { id: 'professional', label: 'Professional', prompt: 'Make this sound more professional and polished' },
    { id: 'conversational', label: 'Casual', prompt: 'Make this more conversational and friendly' },
    { id: 'urgent', label: 'Add Urgency', prompt: 'Add a sense of urgency without being pushy' },
    { id: 'confident', label: 'Confident', prompt: 'Make this sound more confident and authoritative' }
];

export default function InlineAIButton({
    fieldId,
    fieldLabel,
    currentValue,
    sectionId,
    funnelId,
    onUpdate,
    position = 'top-right' // 'top-right', 'bottom-right', 'floating'
}) {
    const { getToken } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [previewContent, setPreviewContent] = useState(null);
    const [messages, setMessages] = useState([]);
    const panelRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                if (!isProcessing) {
                    handleClose();
                }
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isProcessing]);

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setIsExpanded(false);
        setInputText("");
        setStreamingContent("");
        setPreviewContent(null);
        setMessages([]);
    };

    const handleQuickAction = async (action) => {
        await processRequest(action.prompt, action.label);
    };

    const handleCustomFeedback = async () => {
        if (!inputText.trim()) return;
        await processRequest(inputText, 'Custom');
        setInputText("");
    };

    const processRequest = async (feedback, actionLabel) => {
        if (isProcessing) return;

        setIsProcessing(true);
        setStreamingContent("");
        setPreviewContent(null);

        // Add user message to history
        const userMsg = { role: 'user', content: feedback, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);

        abortControllerRef.current = new AbortController();

        try {
            const token = await getToken();

            console.log('[InlineAI] Sending request:', {
                fieldId,
                sectionId,
                feedback,
                valueLength: currentValue?.length || 0
            });

            const response = await fetch('/api/os/refine-field', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    fieldId,
                    fieldLabel,
                    fieldValue: currentValue,
                    sectionId,
                    funnelId,
                    feedback,
                    messageHistory: messages
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let currentEvent = '';
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEvent = line.slice(7).trim();
                    } else if (line.startsWith('data: ') && currentEvent) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (currentEvent === 'token') {
                                fullContent += data.content;
                                setStreamingContent(fullContent);
                            } else if (currentEvent === 'complete') {
                                setPreviewContent(data.refinedContent || fullContent);
                                setStreamingContent("");

                                // Add assistant response to history
                                setMessages(prev => [...prev, {
                                    role: 'assistant',
                                    content: data.refinedContent || fullContent,
                                    timestamp: Date.now()
                                }]);
                            } else if (currentEvent === 'error') {
                                throw new Error(data.message || 'Stream error');
                            }
                        } catch (parseError) {
                            console.warn('[InlineAI] Parse error:', parseError);
                        }
                        currentEvent = '';
                    }
                }
            }

            // If no complete event, use streamed content
            if (!previewContent && fullContent) {
                setPreviewContent(fullContent);
                setStreamingContent("");
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[InlineAI] Request aborted');
                return;
            }
            console.error('[InlineAI] Error:', error);
            toast.error(error.message || 'Failed to generate refinement');
            setStreamingContent("");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAccept = async () => {
        if (!previewContent) return;

        try {
            // Save directly to database
            const response = await fetchWithAuth('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    field_id: fieldId,
                    value: previewContent
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save');
            }

            // Update parent component
            onUpdate(previewContent);

            toast.success('Updated!');
            handleClose();

        } catch (error) {
            console.error('[InlineAI] Save error:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleTryAgain = () => {
        setPreviewContent(null);
        setStreamingContent("");
        setIsExpanded(true);
    };

    // Position classes
    const positionClasses = {
        'top-right': 'absolute top-1 right-1',
        'bottom-right': 'absolute bottom-1 right-1',
        'floating': 'fixed'
    };

    return (
        <>
            {/* AI Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsOpen(true)}
                className={`${positionClasses[position]} z-10 p-1.5 bg-gradient-to-br from-purple-500/20 to-cyan/20 hover:from-purple-500/40 hover:to-cyan/40 border border-purple-500/30 hover:border-cyan/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm`}
                title="AI Assist"
            >
                <Sparkles className="w-3.5 h-3.5 text-cyan" />
            </motion.button>

            {/* AI Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2d]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan/20 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-cyan" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">AI Assist</h3>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{fieldLabel}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={isProcessing}
                                    className="p-1.5 hover:bg-[#2a2a2d] rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Current Value Preview */}
                            <div className="px-4 py-3 bg-[#0e0e0f] border-b border-[#2a2a2d]">
                                <p className="text-xs text-gray-500 mb-1">Current:</p>
                                <p className="text-sm text-gray-300 line-clamp-2">
                                    {currentValue || <span className="italic text-gray-500">Empty</span>}
                                </p>
                            </div>

                            {/* Content Area */}
                            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                                {/* Quick Actions */}
                                {!previewContent && !streamingContent && !isExpanded && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-400">Quick actions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_ACTIONS.map((action) => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => handleQuickAction(action)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1.5 bg-[#2a2a2d] hover:bg-[#3a3a3d] text-gray-300 text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    <Wand2 className="w-3 h-3" />
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setIsExpanded(true)}
                                            className="w-full py-2 text-xs text-gray-400 hover:text-cyan flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            Or describe what you want...
                                        </button>
                                    </div>
                                )}

                                {/* Streaming Content */}
                                {streamingContent && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                                            <span className="text-xs text-gray-400">Generating...</span>
                                        </div>
                                        <div className="p-3 bg-[#0e0e0f] rounded-xl border border-[#2a2a2d]">
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                                {streamingContent}
                                                <span className="inline-block w-1.5 h-4 bg-cyan animate-pulse ml-0.5" />
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Preview Content */}
                                {previewContent && !streamingContent && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span className="text-xs text-green-400">Ready to apply</span>
                                        </div>
                                        <div className="p-3 bg-[#0e0e0f] rounded-xl border border-green-500/30">
                                            <p className="text-sm text-gray-200 whitespace-pre-wrap">
                                                {previewContent}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAccept}
                                                className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Check className="w-4 h-4" />
                                                Apply
                                            </button>
                                            <button
                                                onClick={handleTryAgain}
                                                className="flex-1 py-2.5 bg-[#2a2a2d] hover:bg-[#3a3a3d] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Custom Input */}
                                {isExpanded && !previewContent && !streamingContent && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-400">Describe what you want to change:</p>
                                        <div className="flex gap-2">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleCustomFeedback()}
                                                placeholder="e.g., Make it more persuasive..."
                                                disabled={isProcessing}
                                                className="flex-1 px-3 py-2 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors disabled:opacity-50"
                                            />
                                            <button
                                                onClick={handleCustomFeedback}
                                                disabled={!inputText.trim() || isProcessing}
                                                className="px-3 py-2 bg-cyan hover:bg-cyan/90 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setIsExpanded(false)}
                                            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                                        >
                                            ← Back to quick actions
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
