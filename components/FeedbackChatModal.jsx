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
import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Friendly AI chat openers
const CHAT_OPENERS = [
    "Oh, seems like you want to improve this section! 🎯",
    "Let's make this even better! What would you like to change?",
    "I'm here to help refine this. What's not quite right?"
];

// Sub-section options for different vault sections
// IMPORTANT: IDs must match schema field names exactly
const SECTION_OPTIONS = {
    idealClient: [
        { id: 'bestIdealClient', label: 'Best Ideal Client' },
        { id: 'topChallenges', label: 'Top 3 Challenges' },
        { id: 'whatTheyWant', label: 'What They Want' },
        { id: 'whatMakesThemPay', label: 'What Makes Them Pay' },
        { id: 'howToTalkToThem', label: 'How to Talk to Them' },
        { id: 'all', label: 'Update the entire section' }
    ],
    message: [
        { id: 'oneLiner', label: 'One-Liner Message' },
        { id: 'spokenVersion', label: '30-Second Spoken Version' },
        { id: 'all', label: 'Update the entire section' }
    ],
    story: [
        { id: 'storyBlueprint', label: 'Story Blueprint (6 Phases)' },
        { id: 'networkingStory', label: '60-90s Networking Story' },
        { id: 'stageStory', label: '3-5 min Stage/Podcast Story' },
        { id: 'oneLinerStory', label: '15-25s One-Liner Story' },
        { id: 'socialPostVersion', label: 'Social Post Version' },
        { id: 'emailStory', label: 'Short Email Story' },
        { id: 'pullQuotes', label: 'Signature Pull Quotes' },
        { id: 'all', label: 'Update the entire section' }
    ],
    offer: [
        { id: 'offerName', label: 'Offer Name' },
        { id: 'whoItsFor', label: 'Who It\'s For' },
        { id: 'thePromise', label: 'The Promise' },
        { id: 'offerMode', label: 'Offer Mode' },
        { id: 'sevenStepBlueprint', label: '7-Step Blueprint' },
        { id: 'tier1SignatureOffer', label: 'Tier 1 Signature Offer' },
        { id: 'cta', label: 'Call to Action' },
        { id: 'all', label: 'Update the entire section' }
    ],
    salesScripts: [
        { id: 'callGoal', label: 'Call Goal' },
        { id: 'part1_openingPermission', label: 'Part 1: Opening + Permission' },
        { id: 'part2_discovery', label: 'Part 2: Discovery' },
        { id: 'part3_challengesStakes', label: 'Part 3: Challenges + Stakes' },
        { id: 'part4_recapConfirmation', label: 'Part 4: Recap + Confirmation' },
        { id: 'part5_threeStepPlan', label: 'Part 5: 3-Step Plan' },
        { id: 'part6_closeNextSteps', label: 'Part 6: Close + Next Steps' },
        { id: 'all', label: 'Update the entire section' }
    ],
    setterScript: [
        { id: 'callGoal', label: 'Call Goal' },
        { id: 'step1_openerPermission', label: 'Step 1: Opener + Permission' },
        { id: 'step2_referenceOptIn', label: 'Step 2: Reference Opt-In' },
        { id: 'step3_lowPressureFrame', label: 'Step 3: Low-Pressure Frame' },
        { id: 'step4_currentSituation', label: 'Step 4: Current Situation' },
        { id: 'step5_goalMotivation', label: 'Step 5: Goal + Motivation' },
        { id: 'step6_challengeStakes', label: 'Step 6: Challenge + Stakes' },
        { id: 'step7_authorityDrop', label: 'Step 7: Authority Drop' },
        { id: 'step8_qualifyFit', label: 'Step 8: Qualify Fit + Readiness' },
        { id: 'step9_bookConsultation', label: 'Step 9: Book Consultation' },
        { id: 'step10_confirmShowUp', label: 'Step 10: Confirm Show-Up' },
        { id: 'setterMindset', label: 'Setter Mindset' },
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

    // Deep parse to handle nested JSON strings
    const parsed = deepParseJSON(content);

    // Format the parsed content for display
    return formatForDisplay(parsed);
}

/**
 * Recursively parse JSON strings, including those wrapped in markdown code blocks
 */
function deepParseJSON(content) {
    if (!content) return content;

    if (typeof content === 'string') {
        // Remove markdown code blocks if present
        let cleaned = content
            .replace(/^```(?:json)?[\s\n]*/gi, '')
            .replace(/[\s\n]*```$/gi, '')
            .trim();

        // Try to parse as JSON
        try {
            const parsed = JSON.parse(cleaned);
            // Recursively parse any nested JSON strings
            return deepParseJSON(parsed);
        } catch {
            // Not JSON, return cleaned string
            return cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
    }

    if (Array.isArray(content)) {
        return content.map(item => deepParseJSON(item));
    }

    if (typeof content === 'object' && content !== null) {
        const result = {};
        for (const [key, value] of Object.entries(content)) {
            result[key] = deepParseJSON(value);
        }
        return result;
    }

    return content;
}

/**
 * Format parsed content into clean, simple human-readable text
 * NO JSON structure, NO icons, just clean formatted content
 */
function formatForDisplay(content, depth = 0) {
    if (!content) return '';

    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        return content.map((item, i) => {
            if (typeof item === 'object' && item !== null) {
                return `${i + 1}. ${formatForDisplay(item, depth + 1)}`;
            }
            return `${i + 1}. ${item}`;
        }).join('\n\n');
    }

    if (typeof content === 'object') {
        const lines = [];
        const indent = '  '.repeat(depth);

        for (const [key, value] of Object.entries(content)) {
            // Skip internal keys
            if (key.startsWith('_')) continue;

            // Format the key as a readable label (convert camelCase/snake_case to Title Case)
            const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/[_-]/g, ' ')
                .replace(/part(\d+)/gi, 'Part $1')  // Fix Part1 -> Part 1
                .replace(/step(\d+)/gi, 'Step $1')  // Fix step1 -> Step 1
                .trim()
                .split(' ')
                .map(word => {
                    // Keep numbers as-is, capitalize first letter of words
                    if (/^\d+$/.test(word)) return word;
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join(' ');

            if (Array.isArray(value)) {
                // Arrays: Show label, then numbered items
                lines.push(`${indent}${label}:`);
                value.forEach((item, i) => {
                    if (typeof item === 'object' && item !== null) {
                        lines.push(`${indent}  ${i + 1}. ${formatForDisplay(item, depth + 1)}`);
                    } else {
                        lines.push(`${indent}  ${i + 1}. ${String(item)}`);
                    }
                });
                lines.push(''); // Add blank line after arrays
            } else if (typeof value === 'object' && value !== null) {
                // Nested objects: Show label and recurse
                if (depth === 0) {
                    // Top level - use section headers
                    lines.push(`\n=== ${label} ===`);
                } else {
                    lines.push(`${indent}${label}:`);
                }
                lines.push(formatForDisplay(value, depth + 1));
            } else if (value !== null && value !== undefined) {
                // Simple values
                const valueStr = String(value).replace(/\\n/g, '\n');
                lines.push(`${indent}${label}:`);
                lines.push(`${indent}${valueStr}`);
                lines.push(''); // Add blank line
            }
        }

        return lines.join('\n').trim();
    }

    return String(content);
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
    const { getToken } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSubSection, setSelectedSubSection] = useState(null);
    const [chatStep, setChatStep] = useState(1); // 1: Ask what to change, 2: Get feedback, 3: Show preview
    const [suggestedChanges, setSuggestedChanges] = useState(null);
    const [regenerationCount, setRegenerationCount] = useState(0);
    const messagesEndRef = useRef(null);

    // NEW: Streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState(null);
    const abortControllerRef = useRef(null);

    const MAX_REGENERATIONS = 5;
    const USE_STREAMING = true; // Feature flag

    // Get sub-section options for this section
    const subSectionOptions = SECTION_OPTIONS[sectionId] || SECTION_OPTIONS.default;

    // Scroll to bottom when new messages arrive or streaming content updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingMessage?.content]);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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
            setStreamingMessage(null);
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

    // Handle sending feedback with streaming support
    const handleSendFeedback = async () => {
        if (!inputText.trim() || isProcessing || isStreaming) return;

        const feedback = inputText.trim();
        const userMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: feedback,
            timestamp: Date.now(),
            isComplete: true
        };

        setInputText("");
        setMessages(prev => [...prev, userMessage]);
        setIsProcessing(true);

        if (USE_STREAMING) {
            // NEW: Streaming implementation
            setIsStreaming(true);

            // Initialize streaming assistant message
            const assistantMessageId = `msg_${Date.now() + 1}`;
            setStreamingMessage({
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                isComplete: false,
                isStreaming: true
            });

            // Create abort controller for cleanup
            abortControllerRef.current = new AbortController();

            try {
                // Get Clerk auth token
                const token = await getToken();

                const response = await fetch('/api/os/refine-section-stream', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream',
                    },
                    body: JSON.stringify({
                        sectionId,
                        subSection: selectedSubSection,
                        messageHistory: [...messages, userMessage],
                        currentContent,
                        sessionId
                    }),
                    signal: abortControllerRef.current.signal
                });

                if (!response.ok) {
                    throw new Error('Stream failed');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

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
                                    // Append token to streaming message
                                    setStreamingMessage(prev => prev ? ({
                                        ...prev,
                                        content: prev.content + data.content
                                    }) : null);
                                } else if (currentEvent === 'validated') {
                                    // Complete message with validated content
                                    setStreamingMessage(prev => prev ? ({
                                        ...prev,
                                        isComplete: true,
                                        isStreaming: false,
                                        metadata: {
                                            validatedContent: data.refinedContent,
                                            rawText: data.rawText,
                                            validationWarning: data.validationWarning
                                        }
                                    }) : null);
                                    setSuggestedChanges(data.refinedContent);

                                    if (data.validationWarning) {
                                        toast.warning(data.validationWarning);
                                    }
                                } else if (currentEvent === 'error') {
                                    throw new Error(data.message || 'Stream error');
                                } else if (currentEvent === 'complete') {
                                    // Move streaming message to messages array
                                    if (streamingMessage) {
                                        setMessages(prev => [...prev, streamingMessage]);
                                    }
                                    setStreamingMessage(null);
                                    setChatStep(3);
                                    setRegenerationCount(prev => prev + 1);
                                }
                            } catch (parseError) {
                                console.warn('[FeedbackChat] Failed to parse SSE data:', parseError);
                            }
                            currentEvent = '';
                        }
                    }
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('[FeedbackChat] Stream aborted by user');
                    return;
                }

                console.error('Streaming error:', error);

                // Clear any partial streaming message
                setStreamingMessage(null);

                // Show detailed error with retry option
                let errorMessage = error.message;
                if (errorMessage.includes('wrong schema structure') || errorMessage.includes('mixed schemas')) {
                    errorMessage = '⚠️ Schema validation failed. The AI generated the wrong structure. Please try again.';
                } else if (errorMessage.includes('timeout')) {
                    errorMessage = '⏱️ The request took too long. Please try a simpler refinement or try again.';
                } else if (errorMessage.includes('JSON')) {
                    errorMessage = '❌ The AI returned invalid data. Please try again.';
                } else {
                    errorMessage = `❌ ${errorMessage}`;
                }

                toast.error(errorMessage);

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `${errorMessage}\n\nClick "Try Again" below to retry your request.`,
                    showRetry: true
                }]);
            } finally {
                setIsStreaming(false);
                setIsProcessing(false);
            }

        } else {
            // FALLBACK: Non-streaming implementation (original code)
            try {
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
                                    {(msg.showPreview && msg.previewContent) || msg.metadata?.validatedContent ? (
                                        <div className="mt-3 p-3 bg-[#0e0e0f] rounded-xl border border-[#3a3a3d] max-h-64 overflow-y-auto">
                                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                                {formatPreviewContent(msg.previewContent || msg.metadata?.validatedContent)}
                                            </pre>
                                        </div>
                                    ) : null}
                                </div>
                            </motion.div>
                        ))}

                        {/* Streaming Message */}
                        {streamingMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#2a2a2d] text-white">
                                    {/* While streaming: Show loading indicator (hide raw JSON) */}
                                    {streamingMessage.isStreaming && !streamingMessage.metadata?.validatedContent ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                            <span className="text-sm text-gray-400">Generating your refined content...</span>
                                        </div>
                                    ) : null}

                                    {/* After streaming completes: Show formatted content ONLY */}
                                    {streamingMessage.metadata?.validatedContent && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-cyan font-medium">✓ Content generated successfully</p>
                                            <div className="p-3 bg-[#0e0e0f] rounded-xl border border-[#3a3a3d] max-h-96 overflow-y-auto">
                                                <div className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                                    {formatPreviewContent(streamingMessage.metadata.validatedContent)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Actions for Preview Step */}
                    {chatStep === 3 && suggestedChanges && (
                        <div className="p-4 border-t border-[#2a2a2d] flex flex-wrap gap-3">
                            <button
                                onClick={handleSaveChanges}
                                className="flex-1 py-3 btn-approve rounded-xl flex items-center justify-center gap-2"
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
                                    onKeyPress={(e) => e.key === 'Enter' && !isProcessing && !isStreaming && handleSendFeedback()}
                                    placeholder="Describe what you'd like to change..."
                                    disabled={isProcessing || isStreaming}
                                    className="flex-1 px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors disabled:opacity-50"
                                />
                                <button
                                    onClick={handleSendFeedback}
                                    disabled={!inputText.trim() || isProcessing || isStreaming}
                                    className="px-4 py-3 btn-approve rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing || isStreaming ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                <Lightbulb className="w-3 h-3 inline mr-1" />
                                {isStreaming ? 'AI is generating your response...' : 'Tip: Be specific about what to change and how'}
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
