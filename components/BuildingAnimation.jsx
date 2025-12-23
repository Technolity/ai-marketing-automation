/**
 * BuildingAnimation Component
 * 
 * Full-screen overlay shown during AI content generation.
 * Shows a checklist of items being built with animated progress.
 */

"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';

const BUILD_ITEMS = [
    { key: 'message', label: 'Message' },
    { key: 'offer', label: 'Offer' },
    { key: 'icp', label: 'Ideal Client Profile' },
    { key: 'ads', label: 'Ads' },
    { key: 'emails', label: 'Emails' },
    { key: 'scripts', label: 'Sales Scripts' },
];

export default function BuildingAnimation({ processingMessage, isGenerating = true }) {
    const [completedItems, setCompletedItems] = useState([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    // Simulate progress through checklist items
    useEffect(() => {
        if (!isGenerating) return;

        const interval = setInterval(() => {
            setCurrentItemIndex(prev => {
                if (prev < BUILD_ITEMS.length) {
                    setCompletedItems(items => [...items, BUILD_ITEMS[prev].key]);
                    return prev + 1;
                }
                return prev;
            });
        }, 8000); // Complete one item every 8 seconds (total ~48 seconds for 6 items)

        return () => clearInterval(interval);
    }, [isGenerating]);

    return (
        <div className="fixed inset-0 z-50 bg-[#0e0e0f] flex items-center justify-center">
            <div className="text-center max-w-2xl px-8">
                {/* Animated Logo/Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8"
                >
                    <div className="w-32 h-32 mx-auto relative">
                        {/* Outer ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-4 border-cyan/30"
                        />
                        {/* Middle ring */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-3 rounded-full border-4 border-t-cyan border-r-transparent border-b-cyan border-l-transparent"
                        />
                        {/* Inner glow */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan/40 to-blue-500/40 blur-sm"
                        />
                        {/* Center icon */}
                        <div className="absolute inset-8 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-cyan" />
                        </div>
                    </div>
                </motion.div>

                {/* Processing Title */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl font-bold text-white mb-4"
                >
                    Building your business system...
                </motion.h1>

                {/* Dynamic Message */}
                <motion.div
                    key={processingMessage}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="h-8 mb-8"
                >
                    <p className="text-cyan text-lg font-medium">{processingMessage}</p>
                </motion.div>

                {/* Build Checklist */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 max-w-md mx-auto"
                >
                    {BUILD_ITEMS.map((item, index) => {
                        const isCompleted = completedItems.includes(item.key);
                        const isCurrent = index === currentItemIndex && !isCompleted;

                        return (
                            <motion.div
                                key={item.key}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg text-left
                                    ${isCompleted 
                                        ? 'bg-cyan/20 border border-cyan/30' 
                                        : isCurrent
                                            ? 'bg-[#1b1b1d] border border-cyan/50'
                                            : 'bg-[#1b1b1d] border border-[#2a2a2d]'
                                    }
                                `}
                            >
                                <AnimatePresence mode="wait">
                                    {isCompleted ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <CheckCircle className="w-4 h-4 text-cyan flex-shrink-0" />
                                        </motion.div>
                                    ) : isCurrent ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <Loader2 className="w-4 h-4 text-cyan animate-spin flex-shrink-0" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty"
                                            className="w-4 h-4 rounded-full border border-[#3a3a3d] flex-shrink-0"
                                        />
                                    )}
                                </AnimatePresence>
                                <span className={`text-sm ${isCompleted ? 'text-cyan' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Progress indicator */}
                <div className="w-full max-w-md mx-auto mb-6">
                    <div className="h-1 bg-[#1b1b1d] rounded-full overflow-hidden">
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan to-transparent"
                        />
                    </div>
                </div>

                {/* Time Estimate */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-400"
                >
                    This usually takes 1-2 minutes. Please don&apos;t close this page.
                </motion.p>
            </div>
        </div>
    );
}

