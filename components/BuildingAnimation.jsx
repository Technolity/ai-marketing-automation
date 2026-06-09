import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Loader2, MailCheck } from 'lucide-react';

/**
 * CRM activation reminder shown during the builder animation.
 * TODO(user): replace with the exact email-template copy/screenshot when provided.
 * This is the single source of truth — swap the strings (and add `screenshotSrc`)
 * once the activation email design lands.
 */
const CRM_ACTIVATION_NOTICE = {
    title: 'Activate your CRM',
    body: 'Check your inbox for a separate activation email and complete your CRM setup while we build your assets.',
    // TODO(user): set this to the activation-email preview image path when provided
    // (e.g. '/crm-activation-email-preview.png') to render the embedded screenshot below.
    screenshotSrc: null,
    screenshotAlt: 'CRM activation email preview',
};

/**
 * BuildingAnimation Component
 *
 * DESIGN UPDATE (Classic & Responsive):
 * - Smaller, classic "TedOS" logo (Cyan/White)
 * - Circular Loader
 * - Clean status text (No grid)
 * - Good spacing from top/bottom
 */
const BuildingAnimation = ({
    isGenerating = false,
    completedSections = [],
    processingMessage
}) => {
    const prefersReducedMotion = useReducedMotion();

    // Determine progress percentage
    const totalExpected = 13;
    const [fakeProgress, setFakeProgress] = useState(0);

    useEffect(() => {
        if (!isGenerating) return;

        // Reset progress when generation starts
        setFakeProgress(0);

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
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white font-sans overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan/5 via-[#050505] to-[#050505] opacity-40" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-6 py-12">

                {/* 1. CLASSIC LOGO TEXT (Smaller & Spaced) */}
                <div className="mb-16 md:mb-20 relative mt-8">
                    {/* Ghost/Blur Layer for Aura Effect */}
                    <h1 className="absolute inset-0 text-center text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter blur-2xl select-none pointer-events-none opacity-50">
                        <span className="text-cyan">Ted</span>
                        <span className="text-white">OS</span>
                    </h1>

                    {/* Sharp Visible Layer */}
                    <h1 className="relative z-10 text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-center select-none">
                        <span className="text-cyan drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">Ted</span>
                        <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">OS</span>
                    </h1>
                </div>


                {/* 2. CIRCULAR LOADER */}
                <div className="relative w-40 h-40 md:w-56 md:h-56 mb-16 flex items-center justify-center">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 rounded-full border border-cyan/10 shadow-[0_0_40px_rgba(6,182,212,0.05)]" />

                    {/* Spinning Gradient Ring */}
                    <motion.div
                        animate={prefersReducedMotion ? {} : { rotate: 360 }}
                        transition={prefersReducedMotion ? {} : { duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan border-r-cyan/30"
                    />

                    {/* Inner Rotating Dashes (Counter-spin) */}
                    <motion.div
                        animate={prefersReducedMotion ? {} : { rotate: -360 }}
                        transition={prefersReducedMotion ? {} : { duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border border-dashed border-white/10"
                    />

                    {/* Center Icon/Percent */}
                    <div className="flex flex-col items-center justify-center">
                        <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-cyan mb-3 animate-pulse opacity-80" />
                        <span className="text-2xl md:text-4xl font-bold font-mono text-white/90">{percent}%</span>
                    </div>
                </div>


                {/* 3. CLEAN STATUS TEXT (No Cards) */}
                <div className="text-center w-full max-w-xl mx-auto min-h-[120px] flex flex-col justify-end pb-8 gap-3">
                    {/* Dynamic Processing Message */}
                    <div className="flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-cyan text-lg md:text-xl font-medium flex items-center justify-center gap-3"
                        >
                            <Loader2 className="w-5 h-5 animate-spin text-cyan/70" />
                            <span className="tracking-wide">
                                Generating Your Assets...
                            </span>
                        </motion.div>
                    </div>

                    {/* Time Remaining Removed as per request */}
                </div>


                {/* 3b. PERSISTENT CRM ACTIVATION NOTICE */}
                {/* Copy lives in CRM_ACTIVATION_NOTICE (top of file) — one-line swap when the email screenshot arrives. */}
                <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.4 }}
                    role="status"
                    aria-live="polite"
                    className="w-full max-w-xl mx-auto mb-4 flex items-start gap-3.5 rounded-2xl border border-cyan/20 bg-cyan/[0.06] px-4 py-3.5 text-left shadow-[0_0_30px_rgba(6,182,212,0.06)] backdrop-blur-sm"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan">
                        <MailCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-cyan">
                            {CRM_ACTIVATION_NOTICE.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-white/70">
                            {CRM_ACTIVATION_NOTICE.body}
                        </p>

                        {/* TODO(user): embedded activation-email screenshot/preview.
                            Renders automatically once CRM_ACTIVATION_NOTICE.screenshotSrc is set. */}
                        {CRM_ACTIVATION_NOTICE.screenshotSrc && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-cyan/15">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={CRM_ACTIVATION_NOTICE.screenshotSrc}
                                    alt={CRM_ACTIVATION_NOTICE.screenshotAlt}
                                    className="block w-full"
                                />
                            </div>
                        )}
                    </div>
                </motion.div>


                {/* 4. SLIM PROGRESS BAR (Spaced from bottom) */}
                <div className="w-full max-w-lg h-[2px] bg-white/5 rounded-full mt-4 overflow-hidden mb-8">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan/40 via-cyan to-cyan/40 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <p className="text-gray-600 text-[10px] md:text-xs uppercase tracking-widest opacity-50">
                    AI Processing // Do not close window
                </p>

            </div>
        </div>
    );
};

export default BuildingAnimation;