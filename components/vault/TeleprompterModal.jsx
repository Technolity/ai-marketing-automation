'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Pause, Plus, Minus, RotateCcw, FlipHorizontal2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TeleprompterModal - Full-screen auto-scrolling teleprompter for video scripts.
 * Concatenates all script fields into a single readable view with smooth scrolling.
 *
 * Props:
 *  - isOpen (boolean)
 *  - onClose (function)
 *  - scriptSections (array of { label, text })
 *  - title (string) - e.g. "VSL Script", "Closer Script"
 */
export default function TeleprompterModal({ isOpen, onClose, scriptSections = [], title = 'Script' }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(3); // 1-10 scale
    const [fontSize, setFontSize] = useState(32); // px
    const [isMirrored, setIsMirrored] = useState(false);
    const [countdown, setCountdown] = useState(0); // 3, 2, 1, 0
    const [showControls, setShowControls] = useState(true);

    const containerRef = useRef(null);
    const animationRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const lastTimeRef = useRef(null);
    const fracRef = useRef(0); // Accumulates sub-pixel fractions

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsPlaying(false);
            setCountdown(0);
            setShowControls(true);
            lastTimeRef.current = null;
            fracRef.current = 0;
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
            }
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isOpen]);

    // Smooth scroll loop — accumulates fractional pixels then applies whole-pixel increments
    const scrollLoop = useCallback((timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        if (isPlaying && containerRef.current) {
            // Exponential speed curve for natural feel
            // Speed 1 ≈ 20px/s, Speed 5 ≈ 52px/s, Speed 10 ≈ 172px/s
            const pxPerSecond = 12 + (scrollSpeed * scrollSpeed * 1.6);
            const pxThisFrame = (pxPerSecond * delta) / 1000;

            // Accumulate fractional pixels
            fracRef.current += pxThisFrame;

            // Only apply whole pixels to scrollTop (avoids rounding jitter)
            if (fracRef.current >= 1) {
                const wholePx = Math.floor(fracRef.current);
                fracRef.current -= wholePx;
                containerRef.current.scrollTop += wholePx;
            }

            // Auto-pause at the end
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            if (scrollTop >= scrollHeight - clientHeight - 2) {
                setIsPlaying(false);
                return;
            }
        }

        animationRef.current = requestAnimationFrame(scrollLoop);
    }, [isPlaying, scrollSpeed]);

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = null;
            fracRef.current = 0;
            animationRef.current = requestAnimationFrame(scrollLoop);
        } else {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, scrollLoop]);

    // Countdown before playing
    const startWithCountdown = useCallback(() => {
        if (isPlaying) {
            setIsPlaying(false);
            return;
        }
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsPlaying(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [isPlaying]);

    // Auto-hide controls after inactivity
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (isPlaying) resetControlsTimer();
        else setShowControls(true);
    }, [isPlaying, resetControlsTimer]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                startWithCountdown();
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                setScrollSpeed(prev => Math.min(prev + 1, 10));
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                setScrollSpeed(prev => Math.max(prev - 1, 1));
            } else if (e.code === 'Escape') {
                onClose();
            } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
                setFontSize(prev => Math.min(prev + 4, 72));
            } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
                setFontSize(prev => Math.max(prev - 4, 16));
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, startWithCountdown, onClose]);

    // Reset to top
    const resetScroll = () => {
        setIsPlaying(false);
        fracRef.current = 0;
        if (containerRef.current) containerRef.current.scrollTop = 0;
    };

    if (!isOpen) return null;

    // Calculate progress
    const getProgress = () => {
        if (!containerRef.current) return 0;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight <= clientHeight) return 100;
        return Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black"
                onMouseMove={resetControlsTimer}
                onClick={resetControlsTimer}
            >
                {/* Focus gradient overlays - top and bottom fade */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-10" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-10" />

                {/* Center focus line */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan/20 z-10" />

                {/* Script content */}
                <div
                    ref={containerRef}
                    className="absolute inset-0 overflow-y-auto scrollbar-hide px-8 md:px-16 lg:px-32 py-32"
                    style={{
                        transform: isMirrored ? 'scaleX(-1)' : 'none'
                    }}
                    onScroll={resetControlsTimer}
                >
                    <div
                        className="max-w-4xl mx-auto text-white leading-[1.8] font-light tracking-wide"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {/* Title */}
                        <h1
                            className="text-center font-bold mb-12 text-cyan"
                            style={{ fontSize: `${fontSize * 1.2}px` }}
                        >
                            {title}
                        </h1>

                        {/* Script sections */}
                        {scriptSections.map((section, index) => (
                            <div key={index} className="mb-12">
                                {section.label && (
                                    <h2
                                        className="font-semibold text-cyan/70 mb-4 uppercase tracking-widest"
                                        style={{ fontSize: `${fontSize * 0.5}px` }}
                                    >
                                        {section.label}
                                    </h2>
                                )}
                                <div className="whitespace-pre-wrap">
                                    {section.text}
                                </div>
                                {index < scriptSections.length - 1 && (
                                    <div className="my-8 border-b border-white/10" />
                                )}
                            </div>
                        ))}

                        {/* End padding so last line can scroll to center */}
                        <div className="h-[60vh]" />
                    </div>
                </div>

                {/* Countdown overlay */}
                <AnimatePresence>
                    {countdown > 0 && (
                        <motion.div
                            key="countdown"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="absolute inset-0 flex items-center justify-center z-30 bg-black/60"
                        >
                            <motion.span
                                key={countdown}
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 2 }}
                                transition={{ duration: 0.4 }}
                                className="text-[120px] font-bold text-cyan"
                            >
                                {countdown}
                            </motion.span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Controls */}
                <motion.div
                    initial={false}
                    animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-0 inset-x-0 z-20 pb-6 px-6"
                >
                    {/* Progress bar */}
                    <div className="max-w-2xl mx-auto mb-4">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan rounded-full transition-all duration-300"
                                style={{ width: `${getProgress()}%` }}
                            />
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 bg-[#18181b]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4">
                        {/* Left: Font size controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFontSize(prev => Math.max(prev - 4, 16))}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                                title="Decrease font (−)"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-400 w-10 text-center font-mono">{fontSize}px</span>
                            <button
                                onClick={() => setFontSize(prev => Math.min(prev + 4, 72))}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                                title="Increase font (+)"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Center: Playback controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetScroll}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                                title="Reset to top"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={startWithCountdown}
                                className="w-14 h-14 rounded-full bg-cyan hover:bg-cyan/80 flex items-center justify-center text-black transition-all shadow-lg shadow-cyan/30"
                                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                            >
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                            </button>
                            <button
                                onClick={() => setIsMirrored(!isMirrored)}
                                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${isMirrored ? 'bg-cyan/20 border-cyan/50 text-cyan' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
                                title="Mirror text"
                            >
                                <FlipHorizontal2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right: Speed control */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Speed</span>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={scrollSpeed}
                                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                                className="w-24 h-1.5 accent-cyan cursor-pointer"
                                title={`Speed: ${scrollSpeed}/10 (↑/↓ arrows)`}
                            />
                            <span className="text-sm text-cyan font-mono w-5 text-center">{scrollSpeed}</span>
                        </div>
                    </div>

                    {/* Keyboard hints */}
                    <div className="max-w-2xl mx-auto mt-2 flex items-center justify-center gap-4 text-xs text-gray-600">
                        <span>Space: Play/Pause</span>
                        <span>↑↓: Speed</span>
                        <span>+−: Font</span>
                        <span>Esc: Close</span>
                    </div>
                </motion.div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                    title="Close (Esc)"
                >
                    <X className="w-5 h-5" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
