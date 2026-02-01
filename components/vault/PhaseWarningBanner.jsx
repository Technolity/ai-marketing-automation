'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PhaseWarningBanner - Displays a prominent warning/info banner
 * Used in Phase 3 to remind users to review the guide before deploying
 */
export default function PhaseWarningBanner({
    type = 'warning', // 'warning' | 'info' | 'success'
    title,
    message,
    linkText,
    linkHref,
    onDismiss
}) {
    const styles = {
        warning: {
            bg: 'from-amber-500/10 to-orange-500/10',
            border: 'border-amber-500/30',
            icon: 'text-amber-400',
            title: 'text-amber-300'
        },
        info: {
            bg: 'from-cyan/10 to-blue-500/10',
            border: 'border-cyan/30',
            icon: 'text-cyan',
            title: 'text-cyan'
        },
        success: {
            bg: 'from-emerald-500/10 to-green-500/10',
            border: 'border-emerald-500/30',
            icon: 'text-emerald-400',
            title: 'text-emerald-300'
        }
    };

    const currentStyle = styles[type] || styles.warning;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${currentStyle.bg} border ${currentStyle.border} backdrop-blur-sm`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-black/20 ${currentStyle.icon}`}>
                    {type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5" />
                    ) : (
                        <BookOpen className="w-5 h-5" />
                    )}
                </div>
                <div className="flex-1">
                    {title && (
                        <h4 className={`font-bold mb-1 ${currentStyle.title}`}>
                            {title}
                        </h4>
                    )}
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {message}
                    </p>
                    {linkHref && linkText && (
                        <Link
                            href={linkHref}
                            className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-cyan hover:text-cyan/80 transition-colors group"
                        >
                            {linkText}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                )}
            </div>
        </motion.div>
    );
}
