import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';

/**
 * BuildingAnimation Component
 * 
 * DESIGN UPDATE (Mockup Match):
 * - Beating "TedOS" text on top
 * - Cyan Circular Loader with sparkles
 * - Dynamic Status Text ("Building your business system...")
 * - Grid of Section Pills (Ideal Client, Message, Offer, etc.)
 */
const BuildingAnimation = ({ isGenerating = false, completedSections = [], processingMessage }) => {
    // Grid items to display status for
    const SECTIONS_GRID = [
        { id: 'Ideal Client', label: 'Ideal Client Profile' },
        { id: 'Message', label: 'Message' },
        { id: 'Offer', label: 'Offer' },
        { id: 'Ads', label: 'Ads' },
        { id: 'Emails', label: 'Emails' },
        { id: 'Sales Script', label: 'Sales Scripts' }
    ];

    // Determine progress percentage
    const totalExpected = 13;
    const [fakeProgress, setFakeProgress] = useState(0);

    useEffect(() => {
        if (!isGenerating) return;

        // Fast initial progress
        const interval = setInterval(() => {
            setFakeProgress(prev => {
                if (prev >= 95) return prev; // Stall at 95%
                // Slow down as we get higher
                const increment = prev < 50 ? 1 : prev < 80 ? 0.5 : 0.1;
                return prev + increment;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isGenerating]);

    // Calculate display percentage
    const completedCount = completedSections.length;
    let percent = Math.floor((completedCount / totalExpected) * 100);

    // If we have actual completion data, use it over fake progress once it overtakes
    if (percent < fakeProgress) percent = Math.floor(fakeProgress);
    if (percent > 100) percent = 100;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan/10 via-[#050505] to-[#050505] opacity-50" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-6">

                {/* 1. BEATING LOGO TEXT */}
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-12"
                >
                    <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan via-white to-cyan drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        TedOS
                    </h1>
                </motion.div>


                {/* 2. CIRCULAR LOADER */}
                <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 rounded-full border border-cyan/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]" />

                    {/* Spinning Gradient Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan border-r-cyan/50"
                    />

                    {/* Inner Rotating Dashes (Counter-spin) */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border border-dashed border-white/20"
                    />

                    {/* Center Icon/Percent */}
                    <div className="flex flex-col items-center justify-center">
                        <Sparkles className="w-8 h-8 text-cyan mb-2 animate-pulse" />
                        <span className="text-3xl font-bold font-mono text-white">{percent}%</span>
                    </div>
                </div>


                {/* 3. HEADLINE & STATUS TEXT */}
                <div className="text-center mb-16 space-y-3 w-full">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        Building your business system...
                    </h2>

                    {/* Dynamic Processing Message */}
                    <div className="h-8 flex items-center justify-center">
                        <motion.div
                            key={processingMessage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-cyan text-lg font-medium flex items-center justify-center gap-2"
                        >
                            {processingMessage ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {processingMessage}
                                </>
                            ) : (
                                "Initializing AI engines..."
                            )}
                        </motion.div>
                    </div>
                </div>


                {/* 4. SECTION STATUS GRID (Pills) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl px-4">
                    {SECTIONS_GRID.map((item) => {
                        const isCompleted = completedSections.some(cs =>
                            cs.toLowerCase().includes(item.id.toLowerCase()) ||
                            cs.toLowerCase() === item.label.toLowerCase()
                        );

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0.5, scale: 0.95 }}
                                animate={{
                                    opacity: isCompleted ? 1 : 0.4,
                                    scale: isCompleted ? 1 : 0.95,
                                    borderColor: isCompleted ? "rgba(34, 197, 94, 0.5)" : "rgba(255,255,255,0.1)",
                                    backgroundColor: isCompleted ? "rgba(34, 197, 94, 0.05)" : "rgba(255,255,255,0.02)"
                                }}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg border border-white/10 transition-all duration-300
                                    ${isCompleted ? 'shadow-[0_0_15px_rgba(34,197,94,0.1)]' : ''}
                                `}
                            >
                                <div className={`
                                    w-4 h-4 rounded-full flex items-center justify-center border transition-colors duration-300
                                    ${isCompleted
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-white/20'
                                    }
                                `}>
                                    {isCompleted && <CheckCircle className="w-3 h-3 text-black" />}
                                </div>
                                <span className={`text-sm font-medium transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                    {item.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>


                {/* Bottom Progress Bar (Slim) */}
                <div className="w-full max-w-md h-1 bg-white/10 rounded-full mt-12 overflow-hidden">
                    <motion.div
                        className="h-full bg-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <p className="text-gray-500 text-xs mt-4">
                    This usually takes 1-2 minutes. Please don't close this page.
                </p>

            </div>
        </div>
    );
};

export default BuildingAnimation;
