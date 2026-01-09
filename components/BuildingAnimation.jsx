"use client";
/**
 * BuildingAnimation Component
 * 
 * Cinematic loading experience:
 * 1. "TedOS" logo fills up vertically with Cyan/White as progress increases.
 * 2. Glitch effect and screen flash triggered at 100% completion.
 * 3. Modern, non-technical status messages.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

// Status messages that cycle during animation
const STATUS_MESSAGES = [
    'Getting to know your business...',
    'Finding your perfect people...',
    'Sharpening your message...',
    'Crafting your story...',
    'Structuring your offer...',
    'Polishing your words...',
    'Connecting the dots...',
    'Making it look professional...',
    'System Initialized.'
];

export default function BuildingAnimation({
    isGenerating,
    onEarlyRedirect = null,
    completedSections = [],
    processingMessage = ""
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
            const easedProgress = Math.sin(progress * Math.PI / 2);
            const percentage = easedProgress * 100;

            setDisplayPercentage(percentage);

            // Update message index based on progress
            const messageIndex = Math.min(
                Math.floor(progress * STATUS_MESSAGES.length),
                STATUS_MESSAGES.length - 1
            );
            setCurrentMessageIndex(messageIndex);

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

    useEffect(() => {
        setIsComplete(displayPercentage >= 99);
    }, [displayPercentage]);

    const displayMessage = processingMessage || STATUS_MESSAGES[currentMessageIndex];
    const formattedPercentage = displayPercentage >= 99.5 ? 100 : Math.floor(displayPercentage * 10) / 10;

    // Determine fill styles based on percentage
    // The fill will rise from bottom (0%) to top (100%)
    const fillStyle = {
        background: `linear-gradient(to top, 
            var(--fill-color) ${displayPercentage}%, 
            rgba(255, 255, 255, 0.1) ${displayPercentage}%
        )`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    };

    // Glitch variants for the finale
    const glitchVariants = {
        normal: { x: 0, y: 0, opacity: 1, filter: "hue-rotate(0deg)" },
        glitch: {
            x: [0, -5, 5, -2, 2, 0],
            y: [0, 2, -2, 1, -1, 0],
            opacity: [1, 0.8, 1, 0.9, 1],
            filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(-45deg)", "hue-rotate(0deg)"],
            transition: {
                duration: 0.2,
                repeat: Infinity,
                repeatType: "mirror"
            }
        }
    };

    return (
        <AnimatePresence>
            {isGenerating && (
                <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
                    {/* Background Ambience */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan/5 via-[#0a0a0b] to-[#000000] opacity-80" />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                    />

                    {/* Completion Flash Overlay */}
                    <AnimatePresence>
                        {isComplete && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.2, times: [0, 0.1, 1] }}
                                className="absolute inset-0 bg-white z-50 pointer-events-none mix-blend-overlay"
                            />
                        )}
                    </AnimatePresence>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center"
                    >
                        {/* THE LOGO CONTAINER */}
                        <motion.div
                            className="relative mb-24 select-none"
                            animate={isComplete ? "glitch" : "normal"}
                            variants={glitchVariants}
                        >
                            <div className="flex items-center justify-center tracking-tighter text-8xl sm:text-[10rem] font-black leading-none">
                                {/* "Ted" - Fills with Cyan */}
                                <div className="relative">
                                    {/* Ghost/Blur Layer */}
                                    <span className="absolute inset-0 text-cyan/20 blur-xl opacity-50">Ted</span>
                                    {/* Filled Layer */}
                                    <span
                                        className="relative z-10 block transition-all duration-100"
                                        style={{
                                            ...fillStyle,
                                            '--fill-color': '#06b6d4' // Cyan-500
                                        }}
                                    >
                                        Ted
                                    </span>
                                </div>

                                {/* "OS" - Fills with White */}
                                <div className="relative ml-2">
                                    {/* Ghost/Blur Layer */}
                                    <span className="absolute inset-0 text-white/10 blur-xl opacity-30">OS</span>
                                    {/* Filled Layer */}
                                    <span
                                        className="relative z-10 block transition-all duration-100"
                                        style={{
                                            ...fillStyle,
                                            '--fill-color': '#ffffff'
                                        }}
                                    >
                                        OS
                                    </span>
                                </div>
                            </div>

                            {/* "System Online" Glitch Text below triggers at end */}
                            {isComplete && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute -bottom-8 left-0 right-0 text-center"
                                >
                                    <span className="text-cyan font-mono text-sm tracking-[0.5em] uppercase animate-pulse">
                                        System Ready
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Progress Line */}
                        <div className="w-full max-w-md relative mb-12">
                            {/* Line Container */}
                            <div className="relative h-[2px] w-full bg-[#1a1a1c] overflow-visible">
                                {/* Active Line */}
                                <motion.div
                                    className="absolute top-0 left-0 h-full bg-cyan shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                    style={{ width: `${displayPercentage}%` }}
                                >
                                    {/* Leading Spark */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-[40px] bg-gradient-to-r from-transparent to-cyan/50 blur-md transform translate-x-12" />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                                </motion.div>
                            </div>

                            {/* Percentage Glitch Text */}
                            <div className="mt-4 flex justify-between items-end font-mono">
                                <span className="text-gray-600 text-xs uppercase tracking-widest">
                                    System Integration
                                </span>
                                <span className="text-cyan text-xl font-bold">
                                    {formattedPercentage.toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        {/* Status Message */}
                        <div className="h-16 flex items-center justify-center">
                            <AnimatePresence mode='wait'>
                                <motion.p
                                    key={currentMessageIndex}
                                    initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
                                    transition={{ duration: 0.4 }}
                                    className="text-gray-400 font-medium text-lg tracking-wide text-center"
                                >
                                    {displayMessage}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
