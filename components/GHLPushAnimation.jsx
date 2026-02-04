"use client";
/**
 * GHLPushAnimation - Content Push Progress Display
 * 
 * Displays while pushing content to GoHighLevel.
 * Modern design matching BuildingAnimation style.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, CheckCircle, Loader2, Cloud, Upload,
    Zap, Globe, Link2, FileText
} from 'lucide-react';

const PUSH_ITEMS = [
    { key: 'message', label: 'Core Message', emoji: '💬' },
    { key: 'offer', label: 'Offer Details', emoji: '💎' },
    { key: 'funnel', label: 'Funnel Pages', emoji: '📄' },
    { key: 'emails', label: 'Email Sequences', emoji: '📧' },
    { key: 'scripts', label: 'Scripts & Copy', emoji: '🎙️' },
    { key: 'assets', label: 'Custom Fields', emoji: '⚡' },
];

// Smooth spring animation config
const gentleSpring = { type: "spring", stiffness: 200, damping: 25 };

export default function GHLPushAnimation({
    processingMessage,
    isPushing = true,
    currentItem = null,
    completedItems = [],
    onComplete
}) {
    const [internalCompleted, setInternalCompleted] = useState([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Use external state if provided, otherwise manage internally
    const completed = completedItems.length > 0 ? completedItems : internalCompleted;

    useEffect(() => {
        if (!isPushing || completedItems.length > 0) return;

        // Internal demo progression
        const interval = setInterval(() => {
            setCurrentItemIndex(prev => {
                if (prev < PUSH_ITEMS.length) {
                    setInternalCompleted(items => [...items, PUSH_ITEMS[prev].key]);
                    return prev + 1;
                }
                return prev;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [isPushing, completedItems.length]);

    // Smooth progress animation
    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const target = ((completed.length + 0.5) / PUSH_ITEMS.length) * 100;
                return prev + (target - prev) * 0.15;
            });
        }, 50);

        return () => clearInterval(progressInterval);
    }, [completed.length]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[100px]" />
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="text-center max-w-3xl px-6 md:px-8 relative z-10 w-full">
                {/* Central Animation Core */}
                <motion.div
                    className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={gentleSpring}
                >
                    {/* Outer ring - slow pulse */}
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 border border-green-500/20 rounded-full"
                    />

                    {/* Middle ring - data flow effect */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border border-emerald-500/30 rounded-full border-dashed"
                    />

                    {/* Inner ring - spinning upload indicator */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-8 border-2 border-t-green-500 border-r-green-500/50 border-b-transparent border-l-transparent rounded-full"
                    />

                    {/* Center icon with glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1],
                                opacity: [0.4, 0.8, 0.4]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-16 h-16 bg-green-500/20 rounded-full blur-xl"
                        />
                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Send className="w-10 h-10 md:w-12 md:h-12 text-green-500 relative z-10 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]" />
                        </motion.div>
                    </div>

                    {/* Orbital elements */}
                    <OrbitalIcon angle={0} icon={<Cloud className="w-3.5 h-3.5" />} color="text-green-500" delay={0} />
                    <OrbitalIcon angle={120} icon={<Globe className="w-3.5 h-3.5" />} color="text-emerald-400" delay={0.3} />
                    <OrbitalIcon angle={240} icon={<Link2 className="w-3.5 h-3.5" />} color="text-teal-400" delay={0.6} />
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...gentleSpring, delay: 0.2 }}
                    className="space-y-3 mb-10"
                >
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                        Pushing to{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                            Builder
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base tracking-wide max-w-md mx-auto">
                        {processingMessage || "Syncing your content to your funnel..."}
                    </p>
                </motion.div>

                {/* Progress Items Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10 max-w-xl mx-auto">
                    {PUSH_ITEMS.map((item, index) => {
                        const isCompleted = completed.includes(item.key);
                        const isCurrent = currentItem === item.key ||
                            (index === currentItemIndex && !isCompleted && !currentItem);

                        return (
                            <motion.div
                                key={item.key}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...gentleSpring, delay: index * 0.08 }}
                                className={`relative p-3 md:p-4 rounded-xl border transition-all duration-300 ${isCompleted
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : isCurrent
                                            ? 'bg-white/5 border-green-500/40 shadow-[0_0_25px_rgba(34,197,94,0.12)]'
                                            : 'bg-white/[0.02] border-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-sm ${isCompleted
                                            ? 'bg-green-500 text-black'
                                            : 'bg-white/5'
                                        }`}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                                        ) : isCurrent ? (
                                            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-green-500" />
                                        ) : (
                                            <span className="text-gray-600">{item.emoji}</span>
                                        )}
                                    </div>
                                    <span className={`text-xs md:text-sm font-semibold tracking-tight ${isCompleted ? 'text-white' : isCurrent ? 'text-green-400' : 'text-gray-500'
                                        }`}>
                                        {item.label}
                                    </span>
                                </div>

                                {/* Active glow effect */}
                                <AnimatePresence>
                                    {isCurrent && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 rounded-xl border border-green-500/40 pointer-events-none"
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...gentleSpring, delay: 0.5 }}
                    className="max-w-sm mx-auto"
                >
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full"
                        />
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <Upload className="w-3 h-3 text-green-500" />
                            Syncing...
                        </span>
                        <span className="font-medium">
                            {completed.length}/{PUSH_ITEMS.length} synced
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Subtle grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        </div>
    );
}

function OrbitalIcon({ angle, icon, color, delay }) {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay }}
            className="absolute inset-0"
        >
            <div
                className="absolute top-1/2 left-1/2"
                style={{
                    transform: `rotate(${angle}deg) translateX(60px) rotate(-${angle}deg) translate(-50%, -50%)`
                }}
            >
                <div className={`w-7 h-7 rounded-lg bg-[#151517] border border-white/10 flex items-center justify-center ${color} shadow-lg`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
