"use client";
/**
 * BuildingAnimation Component
 * 
 * Smooth continuous loading animation that runs 0-100% independently.
 * Uses sine-wave acceleration for natural feel (faster start, slower end).
 * Status messages cycle through generation phases for engagement.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

// Status messages that cycle during animation
const STATUS_MESSAGES = [
    'Analyzing your business...',
    'Identifying your ideal clients...',
    'Crafting your million-dollar message...',
    'Building your signature story...',
    'Designing your high-ticket offer...',
    'Creating sales scripts...',
    'Generating your marketing system...',
    'Optimizing for conversions...',
    'Finalizing your assets...'
];

export default function BuildingAnimation({
    isGenerating,
    onEarlyRedirect = null, // Callback when ready to redirect (optional)
    completedSections = [], // Array of completed section names (for display)
    processingMessage = "" // Override message from parent (optional)
}) {
    // Smooth animated percentage that runs 0-100% over ~50 seconds
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

    // Total animation duration in ms (~50 seconds)
    const ANIMATION_DURATION = 50000;

    // Smooth animation using requestAnimationFrame
    useEffect(() => {
        if (!isGenerating) {
            setDisplayPercentage(0);
            setCurrentMessageIndex(0);
            startTimeRef.current = null;
            return;
        }

        startTimeRef.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

            // Sine-wave easing: faster at start, slower approaching 100%
            // Using sine function for smooth deceleration
            const easedProgress = Math.sin(progress * Math.PI / 2);
            const percentage = easedProgress * 100;

            setDisplayPercentage(percentage);

            // Update message index based on progress (cycle through messages)
            const messageIndex = Math.min(
                Math.floor(progress * STATUS_MESSAGES.length),
                STATUS_MESSAGES.length - 1
            );
            setCurrentMessageIndex(messageIndex);

            // Continue animation if not complete
            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isGenerating]);

    // Detect completion for pulse effect
    useEffect(() => {
        if (displayPercentage >= 99) {
            setIsComplete(true);
        } else {
            setIsComplete(false);
        }
    }, [displayPercentage]);


    // Get display message - prefer processingMessage from parent, then cycle
    const displayMessage = processingMessage || STATUS_MESSAGES[currentMessageIndex];

    // Format the display - show one decimal for smooth feeling
    const formattedPercentage = displayPercentage >= 99.5
        ? 100
        : Math.floor(displayPercentage * 10) / 10;

    return (
        <AnimatePresence>
            {isGenerating && (
                <div className="fixed inset-0 z-[100] bg-[#0a0a0b] flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center max-w-4xl px-8 w-full"
                    >
                        {/* Fluid Logo Container */}
                        <div className="relative mx-auto mb-16" style={{ width: '600px', height: '160px' }}>
                            {/* 1. Base Layer: Dark/Empty Logo (Opacity 0.2) */}
                            <img
                                src="/tedos-logo.png"
                                alt="TedOS"
                                className="absolute inset-0 w-full h-full object-contain opacity-20 filter grayscale"
                            />

                            {/* 2. Water Fill Layer: Masked by Logo */}
                            <div
                                className="absolute inset-0 w-full h-full"
                                style={{
                                    maskImage: 'url(/tedos-logo.png)',
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    WebkitMaskImage: 'url(/tedos-logo.png)',
                                    WebkitMaskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center',
                                }}
                            >
                                {/* The Rising Water */}
                                <div className="absolute inset-0 w-full h-full flex flex-col justify-end overflow-hidden">
                                    <motion.div
                                        className="w-full relative bg-cyan"
                                        style={{ height: `${displayPercentage}%` }}
                                        transition={{ type: "spring", stiffness: 20, damping: 10 }}
                                    >
                                        {/* Wave Surface */}
                                        <div className="absolute top-[-20px] left-0 right-0 h-[40px] w-[200%] flex animate-wave">
                                            {/* We simulate a wave using CSS or SVG if available. 
                                                Since we don't have a wave SVG, we'll use a simple oscillating gradient or border 
                                                trick for now to keep it robust without assets. 
                                                A simple solid rise with a glow is often cleaner. */}
                                            <div className="w-full h-full bg-cyan opacity-50 blur-md transform translate-y-2"></div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* 3. Shine/Glow Overlay */}
                            <div
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                style={{
                                    background: `linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
                                    backgroundSize: '200% 100%',
                                    animation: 'shine 3s infinite linear'
                                }}
                            />
                        </div>

                        {/* Progress Bar (Thinner & Wider) */}
                        <div className="w-full max-w-2xl mx-auto mb-8">
                            <div className="h-1 bg-[#1a1a1c] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-cyan shadow-[0_0_20px_rgba(0,245,255,0.6)]"
                                    style={{ width: `${displayPercentage}%` }}
                                />
                            </div>
                            <motion.p
                                className="text-right text-lg mt-3 font-mono font-bold text-cyan"
                            >
                                {formattedPercentage.toFixed(0)}%
                            </motion.p>
                        </div>

                        {/* Text Content */}
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="space-y-4"
                        >
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Building your Marketing Engine
                            </h2>
                            <p className="text-xl text-cyan/80 font-medium">
                                {displayMessage}
                            </p>

                            <p className="text-gray-500 text-sm mt-8">
                                Please don't close this page. This process takes about 60 seconds.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

