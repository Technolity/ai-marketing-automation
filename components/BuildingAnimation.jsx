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
                        className="text-center max-w-2xl px-8"
                    >
                        {/* TedOS Logo Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="relative mb-10 mx-auto"
                            style={{ width: '320px', height: '100px' }}
                        >
                            {/* Background: Grayscale outline layer (always visible) */}
                            <img
                                src="/tedos-logo.png"
                                alt="TedOS"
                                className="absolute inset-0 w-full h-full object-contain"
                                style={{
                                    filter: 'grayscale(100%) brightness(0.4) contrast(1.2)',
                                    opacity: 0.5,
                                }}
                            />

                            {/* Foreground: Color layer with clip mask (reveals on progress) */}
                            <motion.img
                                src="/tedos-logo.png"
                                alt="TedOS"
                                className="absolute inset-0 w-full h-full object-contain"
                                style={{
                                    clipPath: `inset(0 ${100 - displayPercentage}% 0 0)`,
                                    filter: isComplete
                                        ? 'drop-shadow(0 0 30px rgba(0, 245, 255, 0.8)) drop-shadow(0 0 60px rgba(0, 245, 255, 0.4))'
                                        : 'drop-shadow(0 0 15px rgba(0, 245, 255, 0.5))',
                                }}
                                animate={isComplete ? {
                                    filter: [
                                        'drop-shadow(0 0 30px rgba(0, 245, 255, 0.8)) drop-shadow(0 0 60px rgba(0, 245, 255, 0.4))',
                                        'drop-shadow(0 0 50px rgba(0, 245, 255, 1)) drop-shadow(0 0 80px rgba(0, 245, 255, 0.6))',
                                        'drop-shadow(0 0 30px rgba(0, 245, 255, 0.8)) drop-shadow(0 0 60px rgba(0, 245, 255, 0.4))'
                                    ]
                                } : {}}
                                transition={isComplete ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                            />

                            {/* Glow effect behind logo on progress */}
                            <motion.div
                                className="absolute inset-0 -z-10"
                                style={{
                                    background: `linear-gradient(90deg, 
                                        rgba(0, 245, 255, 0.15) 0%, 
                                        rgba(0, 245, 255, 0.05) ${displayPercentage}%, 
                                        transparent ${displayPercentage}%
                                    )`,
                                    filter: 'blur(20px)',
                                    borderRadius: '20px',
                                }}
                            />
                        </motion.div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md mx-auto mb-6">
                            <div className="h-1.5 bg-[#1a1a1c] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${displayPercentage}%`,
                                        background: 'linear-gradient(90deg, #00F5FF 0%, #00D4E0 50%, #00B8C8 100%)',
                                        boxShadow: '0 0 20px rgba(0, 245, 255, 0.6), 0 0 40px rgba(0, 245, 255, 0.3)',
                                    }}
                                />
                            </div>

                            {/* Percentage text */}
                            <motion.p
                                className="text-right text-sm mt-2 font-mono"
                                style={{ color: '#00F5FF' }}
                            >
                                {formattedPercentage.toFixed(1)}%
                            </motion.p>
                        </div>

                        {/* Dynamic Status Message */}
                        <motion.div
                            key={displayMessage}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="h-8 mb-6"
                        >
                            <p className="text-lg font-medium" style={{ color: '#00F5FF' }}>
                                {displayMessage}
                            </p>
                        </motion.div>

                        {/* Completed sections indicator */}
                        {completedSections.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-green-400 text-xs mb-4"
                            >
                                ✓ {completedSections.length} sections ready
                            </motion.div>
                        )}

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-500 text-sm"
                        >
                            Building your marketing system.
                            <br />
                            <span className="text-gray-600">Please don&apos;t close this page.</span>
                        </motion.p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

