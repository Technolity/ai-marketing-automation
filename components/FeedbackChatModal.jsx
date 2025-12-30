"use client";
/**
 * FeedbackChatModal - AI Feedback Chat for Vault Sections
 * 
 * Replaces Edit/Regenerate buttons with a conversational AI feedback system.
 * User describes what they want changed, AI generates targeted updates.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Send, Loader2, CheckCircle, MessageSquare,
    Lightbulb, RefreshCw, Save
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Friendly AI chat openers
const CHAT_OPENERS = [
    "Oh, seems like you want to improve this section! 🎯",
    "Let's make this even better! What would you like to change?",
    "I'm here to help refine this. What's not quite right?"
];

// Sub-section options for different vault sections
const SECTION_OPTIONS = {
    idealClient: [
        { id: 'demographics', label: 'Demographics & Age Range' },
        { id: 'psychographics', label: 'Psychographics & Mindset' },
        { id: 'painPoints', label: 'Pain Points & Frustrations' },
        { id: 'desires', label: 'Desires & Dream Outcomes' },
        { id: 'objections', label: 'Common Objections' },
        { id: 'all', label: 'Update the entire section' }
    ],
    message: [
        { id: 'headline', label: 'Main Headline' },
        { id: 'subheadline', label: 'Subheadline' },
        { id: 'uniqueMechanism', label: 'Unique Mechanism' },
        { id: 'bigPromise', label: 'Big Promise' },
        { id: 'all', label: 'Update the entire section' }
    ],
    story: [
        { id: 'hook', label: 'Story Hook / Opening' },
        { id: 'struggle', label: 'Struggle / Low Point' },
        { id: 'breakthrough', label: 'Breakthrough Moment' },
        { id: 'transformation', label: 'Transformation & Results' },
        { id: 'all', label: 'Update the entire section' }
    ],
    offer: [
        { id: 'name', label: 'Offer Name' },
        { id: 'modules', label: 'Modules / Components' },
        { id: 'bonuses', label: 'Bonuses' },
        { id: 'pricing', label: 'Pricing & Guarantees' },
        { id: 'all', label: 'Update the entire section' }
    ],
    default: [
        { id: 'opening', label: 'Opening / Hook' },
        { id: 'body', label: 'Main Content' },
        { id: 'closing', label: 'Closing / CTA' },
        { id: 'all', label: 'Update the entire section' }
    ]
};

/**
 * Format AI-generated content for human-readable display
 * Converts JSON objects/strings into clean, formatted text
 */
function formatPreviewContent(content) {
    if (!content) return '';

    // If it's a string that looks like JSON, try to parse it
    if (typeof content === 'string') {
        // Remove markdown code blocks if present
        let cleaned = content.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '').trim();

        // Try to parse as JSON
        try {
            const parsed = JSON.parse(cleaned);
            return formatObject(parsed);
        } catch {
            // Not JSON, return as-is but clean up escape sequences
            return cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
    }

    // If it's already an object, format it
    if (typeof content === 'object') {
        return formatObject(content);
    }

    return String(content);
}

/**
 * Recursively format an object into readable text
 */
function formatObject(obj, depth = 0) {
    if (!obj || typeof obj !== 'object') return String(obj || '');

    const indent = '  '.repeat(depth);
    const lines = [];

    for (const [key, value] of Object.entries(obj)) {
        // Format the key as a readable label
        const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/[_-]/g, ' ')
            .replace(/^\s/, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        if (Array.isArray(value)) {
            lines.push(`${indent}📌 ${label}:`);
            value.forEach((item, i) => {
                if (typeof item === 'object' && item !== null) {
                    lines.push(`${indent}  ${i + 1}. ${formatObject(item, depth + 2)}`);
                } else {
                    lines.push(`${indent}  • ${item}`);
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            lines.push(`${indent}📌 ${label}:`);
            lines.push(formatObject(value, depth + 1));
        } else if (value) {
            // For simple key-value pairs
            const valueStr = String(value).replace(/\\n/g, '\n');
            if (valueStr.length > 100 || valueStr.includes('\n')) {
                lines.push(`${indent}📌 ${label}:`);
                lines.push(`${indent}  ${valueStr}`);
            } else {
                lines.push(`${indent}• ${label}: ${valueStr}`);
            }
        }
    }

    return lines.join('\n');
}

export default function FeedbackChatModal({
    isOpen,
    onClose,
    sectionId,
    sectionTitle,
    currentContent,
    sessionId,
    onSave
}) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSubSection, setSelectedSubSection] = useState(null);
    const [chatStep, setChatStep] = useState(1); // 1: Ask what to change, 2: Get feedback, 3: Show preview
    const [suggestedChanges, setSuggestedChanges] = useState(null);
    const [regenerationCount, setRegenerationCount] = useState(0);
    const messagesEndRef = useRef(null);

    const MAX_REGENERATIONS = 5;

    // Get sub-section options for this section
    const subSectionOptions = SECTION_OPTIONS[sectionId] || SECTION_OPTIONS.default;

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initialize chat when modal opens
    useEffect(() => {
        if (isOpen) {
            const opener = CHAT_OPENERS[Math.floor(Math.random() * CHAT_OPENERS.length)];
            setMessages([
                {
                    role: 'assistant',
                    content: opener
                },
                {
                    role: 'assistant',
                    content: "Which part of this section would you like to improve?",
                    showOptions: true
                }
            ]);
            setChatStep(1);
            setSelectedSubSection(null);
            setSuggestedChanges(null);
        }
    }, [isOpen]);

    // Handle sub-section selection
    const handleSubSectionSelect = (option) => {
        setSelectedSubSection(option.id);
        setMessages(prev => [
            ...prev,
            { role: 'user', content: option.label },
            {
                role: 'assistant',
                content: `Great choice! What specifically would you like to change about the "${option.label}"? 

Be as specific as possible - for example:
• "Make the language more conversational"
• "Focus more on the pain point of time scarcity"
• "Add urgency without being pushy"`
            }
        ]);
        setChatStep(2);
    };

    // Handle sending feedback
    const handleSendFeedback = async () => {
        if (!inputText.trim() || isProcessing) return;

        const feedback = inputText.trim();
        setInputText("");
        setMessages(prev => [...prev, { role: 'user', content: feedback }]);
        setIsProcessing(true);

        try {
            // Add thinking message
            setMessages(prev => [...prev, { role: 'assistant', content: '🤔 Analyzing your feedback...', isThinking: true }]);

            const response = await fetchWithAuth('/api/os/refine-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId,
                    subSection: selectedSubSection,
                    feedback,
                    currentContent,
                    sessionId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate refinement');
            }

            const data = await response.json();

            // Remove thinking message and add preview
            setMessages(prev => {
                const withoutThinking = prev.filter(m => !m.isThinking);
                return [
                    ...withoutThinking,
                    {
                        role: 'assistant',
                        content: "Here's my suggested update based on your feedback:",
                        showPreview: true,
                        previewContent: data.refinedContent
                    }
                ];
            });

            setSuggestedChanges(data.refinedContent);
            setRegenerationCount(prev => prev + 1);
            setChatStep(3);

        } catch (error) {
            console.error('Refinement error:', error);
            setMessages(prev => {
                const withoutThinking = prev.filter(m => !m.isThinking);
                return [
                    ...withoutThinking,
                    { role: 'assistant', content: `❌ Sorry, I couldn't generate that refinement. ${error.message}` }
                ];
            });
            toast.error("Refinement failed");
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle saving changes
    const handleSaveChanges = () => {
        if (!suggestedChanges) return;

        onSave(suggestedChanges);
        toast.success("Changes saved!");
        onClose();
    };

    // Handle "Try Again" - same feedback, different output
    const handleTryAgain = async () => {
        if (regenerationCount >= MAX_REGENERATIONS) {
            toast.error(`Maximum refinements (${MAX_REGENERATIONS}) reached for this section.`);
            return;
        }

        setIsProcessing(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '🔄 Generating an alternative...', isThinking: true }]);

        try {
            const response = await fetchWithAuth('/api/os/refine-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId,
                    subSection: selectedSubSection,
                    feedback: 'Please provide an alternative version',
                    currentContent,
                    sessionId,
                    iteration: regenerationCount + 1
                })
            });

            if (!response.ok) throw new Error('Failed to regenerate');

            const data = await response.json();

            setMessages(prev => {
                const withoutThinking = prev.filter(m => !m.isThinking);
                return [
                    ...withoutThinking,
                    {
                        role: 'assistant',
                        content: "Here's an alternative version:",
                        showPreview: true,
                        previewContent: data.refinedContent
                    }
                ];
            });

            setSuggestedChanges(data.refinedContent);
            setRegenerationCount(prev => prev + 1);

        } catch (error) {
            console.error('Retry error:', error);
            toast.error("Failed to generate alternative");
            setMessages(prev => prev.filter(m => !m.isThinking));
        } finally {
            setIsProcessing(false);
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
                    className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#2a2a2d]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-purple-500/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-cyan" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Improve: {sectionTitle}</h3>
                                <p className="text-xs text-gray-500">
                                    {regenerationCount}/{MAX_REGENERATIONS} refinements used
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-cyan text-black'
                                    : 'bg-[#2a2a2d] text-white'
                                    }`}>
                                    {msg.isThinking ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{msg.content}</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    )}

                                    {/* Sub-section options */}
                                    {msg.showOptions && (
                                        <div className="mt-3 space-y-2">
                                            {subSectionOptions.map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleSubSectionSelect(option)}
                                                    className="w-full text-left px-3 py-2 bg-[#1b1b1d] hover:bg-[#0e0e0f] rounded-lg text-sm text-gray-300 transition-colors"
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Preview content */}
                                    {msg.showPreview && msg.previewContent && (
                                        <div className="mt-3 p-3 bg-[#0e0e0f] rounded-xl border border-[#3a3a3d] max-h-64 overflow-y-auto">
                                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                                {formatPreviewContent(msg.previewContent)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Actions for Preview Step */}
                    {chatStep === 3 && suggestedChanges && (
                        <div className="p-4 border-t border-[#2a2a2d] flex flex-wrap gap-3">
                            <button
                                onClick={handleSaveChanges}
                                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                            <button
                                onClick={handleTryAgain}
                                disabled={isProcessing || regenerationCount >= MAX_REGENERATIONS}
                                className="flex-1 py-3 bg-[#2a2a2d] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Input for Feedback Step */}
                    {chatStep === 2 && (
                        <div className="p-4 border-t border-[#2a2a2d]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendFeedback()}
                                    placeholder="Describe what you'd like to change..."
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors disabled:opacity-50"
                                />
                                <button
                                    onClick={handleSendFeedback}
                                    disabled={!inputText.trim() || isProcessing}
                                    className="px-4 py-3 bg-cyan text-black rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                <Lightbulb className="w-3 h-3 inline mr-1" />
                                Tip: Be specific about what to change and how
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
