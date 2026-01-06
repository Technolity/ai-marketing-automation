"use client";
/**
 * FieldChatbot - True conversational AI for field-level content editing
 * 
 * This is a real-time chatbot that:
 * - Only works on ONE field at a time
 * - Returns plain text (not JSON schemas)
 * - Saves directly to database
 * - Maintains conversation history
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Send, Loader2, Save, MessageSquare,
    RotateCcw, Sparkles, Check, Copy
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function FieldChatbot({
    isOpen,
    onClose,
    fieldId,
    fieldLabel,
    fieldValue,
    sectionId,
    funnelId,
    onSave
}) {
    const { getToken } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [pendingContent, setPendingContent] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingText]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Initialize with greeting
    useEffect(() => {
        if (isOpen) {
            setMessages([{
                role: 'assistant',
                content: `I'm ready to help you refine the "${fieldLabel}" field.\n\nCurrent content:\n"${fieldValue?.substring(0, 200) || '(empty)'}${fieldValue?.length > 200 ? '...' : ''}"\n\nWhat would you like to change?`
            }]);
            setPendingContent(null);
            setStreamingText("");
        }
    }, [isOpen, fieldLabel, fieldValue]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSend = async () => {
        if (!inputText.trim() || isProcessing) return;

        const feedback = inputText.trim();
        setInputText("");

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: feedback }]);
        setIsProcessing(true);
        setStreamingText("");
        setPendingContent(null);

        abortControllerRef.current = new AbortController();

        try {
            const token = await getToken();

            console.log('[FieldChatbot] Sending:', {
                fieldId,
                sectionId,
                feedback,
                currentValueLength: fieldValue?.length || 0
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
                    fieldValue,
                    sectionId,
                    funnelId,
                    feedback,
                    messageHistory: messages.map(m => ({ role: m.role, content: m.content }))
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
                                setStreamingText(fullContent);
                            } else if (currentEvent === 'complete') {
                                const refinedText = data.refinedContent || fullContent;
                                setPendingContent(refinedText);
                                setStreamingText("");

                                // Add assistant message with preview
                                setMessages(prev => [...prev, {
                                    role: 'assistant',
                                    content: `Here's the refined content:\n\n"${refinedText}"\n\nClick Save to apply, or tell me what else to change.`,
                                    refinedContent: refinedText
                                }]);
                            } else if (currentEvent === 'error') {
                                throw new Error(data.message || 'Generation failed');
                            }
                        } catch (parseError) {
                            console.warn('[FieldChatbot] Parse error:', parseError);
                        }
                        currentEvent = '';
                    }
                }
            }

            // If no complete event, use streamed content
            if (!pendingContent && fullContent) {
                setPendingContent(fullContent);
                setStreamingText("");
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Here's the refined content:\n\n"${fullContent}"\n\nClick Save to apply, or tell me what else to change.`,
                    refinedContent: fullContent
                }]);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[FieldChatbot] Aborted');
                return;
            }
            console.error('[FieldChatbot] Error:', error);
            toast.error(error.message || 'Failed to generate');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Sorry, something went wrong: ${error.message}\n\nPlease try again.`
            }]);
        } finally {
            setIsProcessing(false);
            setStreamingText("");
        }
    };

    const handleSaveContent = async () => {
        if (!pendingContent) return;

        try {
            // Save to database
            const response = await fetchWithAuth('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    field_id: fieldId,
                    field_value: pendingContent  // Just the plain text
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save');
            }

            toast.success('Content saved!');

            // Callback to parent to update UI
            if (onSave) {
                onSave(pendingContent);
            }

            // Add confirmation message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '✅ Saved! You can continue refining or close this chat.'
            }]);

            setPendingContent(null);

        } catch (error) {
            console.error('[FieldChatbot] Save error:', error);
            toast.error('Failed to save: ' + error.message);
        }
    };

    const handleCopy = () => {
        if (pendingContent) {
            navigator.clipboard.writeText(pendingContent);
            toast.success('Copied to clipboard!');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#2a2a2d]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan/30 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-cyan" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">AI Assistant</h3>
                                <p className="text-xs text-gray-500">{fieldLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-cyan text-black'
                                        : 'bg-[#2a2a2d] text-white'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                                    {/* Show action buttons for refined content */}
                                    {msg.refinedContent && !pendingContent && (
                                        <p className="text-xs text-gray-400 mt-2 italic">
                                            (This content was saved)
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Streaming indicator */}
                        {streamingText && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#2a2a2d] text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                                        <span className="text-xs text-gray-400">Generating...</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap text-gray-300">
                                        "{streamingText}"
                                        <span className="inline-block w-1.5 h-4 bg-cyan animate-pulse ml-0.5" />
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Action buttons when content is ready */}
                    {pendingContent && (
                        <div className="p-4 border-t border-[#2a2a2d] flex gap-2">
                            <button
                                onClick={handleSaveContent}
                                className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save to Field
                            </button>
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2.5 bg-[#2a2a2d] hover:bg-[#3a3a3d] text-white rounded-xl text-sm flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-[#2a2a2d]">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSend()}
                                placeholder="Tell me what to change..."
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim() || isProcessing}
                                className="px-4 py-3 bg-cyan hover:bg-cyan/90 text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Examples: "Make it shorter", "Change 15K to 20K", "More professional tone"
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
