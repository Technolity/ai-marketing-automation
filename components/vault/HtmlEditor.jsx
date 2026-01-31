'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, Code } from 'lucide-react';

/**
 * Simple HTML Editor for email body fields
 * Supports both visual editing and HTML source editing
 */
export default function HtmlEditor({ value, onChange, onBlur, placeholder, disabled, maxLength }) {
    const [mode, setMode] = useState('visual'); // 'visual' or 'source'
    const [localValue, setLocalValue] = useState(value || '');
    const contentEditableRef = useRef(null);
    const textareaRef = useRef(null);

    // Update local value when prop changes
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    // Sync contentEditable with value in visual mode
    useEffect(() => {
        if (mode === 'visual' && contentEditableRef.current) {
            const currentHtml = contentEditableRef.current.innerHTML;
            const newHtml = localValue;

            // Only update if different to avoid cursor jumping
            if (currentHtml !== newHtml) {
                contentEditableRef.current.innerHTML = newHtml;
            }
        }
    }, [localValue, mode]);

    const handleContentEditableInput = () => {
        if (contentEditableRef.current) {
            const html = contentEditableRef.current.innerHTML;
            setLocalValue(html);
            onChange(html);
        }
    };

    const handleTextareaChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
    };

    const handleModeToggle = () => {
        if (mode === 'visual' && contentEditableRef.current) {
            // Switching from visual to source - get HTML from contentEditable
            const html = contentEditableRef.current.innerHTML;
            setLocalValue(html);
        }
        setMode(mode === 'visual' ? 'source' : 'visual');
    };

    return (
        <div className="w-full">
            {/* Mode Toggle */}
            <div className="flex items-center justify-end gap-2 mb-2">
                <button
                    type="button"
                    onClick={handleModeToggle}
                    disabled={disabled}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1a1a1d] border border-[#3a3a3d] rounded-lg text-gray-400 hover:text-white hover:border-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {mode === 'visual' ? (
                        <>
                            <Code className="w-4 h-4" />
                            <span>HTML Source</span>
                        </>
                    ) : (
                        <>
                            <Eye className="w-4 h-4" />
                            <span>Visual</span>
                        </>
                    )}
                </button>
            </div>

            {/* Editor */}
            {mode === 'visual' ? (
                <div
                    ref={contentEditableRef}
                    contentEditable={!disabled}
                    onInput={handleContentEditableInput}
                    onBlur={onBlur}
                    className="w-full px-4 py-3 bg-[#18181b] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-500 transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan focus:outline-none overflow-y-auto prose prose-invert max-w-none"
                    style={{
                        minHeight: '12rem',
                        maxHeight: '24rem',
                        cursor: disabled ? 'not-allowed' : 'text',
                        opacity: disabled ? 0.6 : 1
                    }}
                    suppressContentEditableWarning
                >
                    {/* Content will be set via innerHTML in useEffect */}
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    value={localValue}
                    onChange={handleTextareaChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    disabled={disabled}
                    className="w-full px-4 py-3 bg-[#18181b] border border-[#3a3a3d] rounded-xl text-white placeholder-gray-500 font-mono text-sm resize-none transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan overflow-y-auto disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ minHeight: '12rem', maxHeight: '24rem', height: 'auto' }}
                />
            )}

            {maxLength && (
                <div className="mt-1 text-xs text-gray-500 text-right">
                    {localValue?.length || 0} / {maxLength}
                </div>
            )}

            {/* Styling for rendered HTML content */}
            <style jsx>{`
                .prose :global(p) {
                    margin-bottom: 0.75rem;
                }
                .prose :global(ul), .prose :global(ol) {
                    margin-left: 1.5rem;
                    margin-bottom: 0.75rem;
                }
                .prose :global(li) {
                    margin-bottom: 0.25rem;
                }
                .prose :global(strong) {
                    font-weight: 600;
                    color: #fff;
                }
                .prose :global(a) {
                    color: #06b6d4;
                    text-decoration: underline;
                }
                .prose :global(a:hover) {
                    color: #22d3ee;
                }
                .prose :global(h1), .prose :global(h2), .prose :global(h3) {
                    font-weight: 600;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                }
            `}</style>
        </div>
    );
}
