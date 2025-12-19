/**
 * ProcessingAnimation Component
 * 
 * Full-screen overlay shown during AI content generation.
 * Extracted from OSWizard.jsx for maintainability.
 */

"use client";
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function ProcessingAnimation({ processingMessage }) {
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
                    Processing Your Business
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

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-400"
                >
                    This takes about 60-90 seconds. Please don&apos;t close this page.
                </motion.p>
            </div>
        </div>
    );
}
