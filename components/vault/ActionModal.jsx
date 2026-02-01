'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, Rocket, ArrowRight, Info } from 'lucide-react';

/**
 * ActionModal - A streamlined modal for instructions and deployment actions
 * Supports step-by-step visualization for complex workflows
 */
export default function ActionModal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon = Rocket,
    steps = [],
    currentStep = 0,
    isProcessing = false,
    processingText = 'Processing...',
    primaryAction,
    primaryActionText = 'Continue',
    secondaryAction,
    secondaryActionText = 'Cancel',
    children,
    showCloseButton = true,
    preventCloseWhileProcessing = true
}) {
    const handleClose = () => {
        if (preventCloseWhileProcessing && isProcessing) return;
        onClose?.();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#131314] border border-[#2a2a2d] rounded-2xl p-8 max-w-md w-full shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-cyan" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{title}</h2>
                                    {subtitle && (
                                        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
                                    )}
                                </div>
                            </div>
                            {showCloseButton && !isProcessing && (
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors text-gray-500 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Steps Visualization */}
                        {steps.length > 0 && (
                            <div className="mb-6 space-y-3">
                                {steps.map((step, index) => {
                                    const isComplete = index < currentStep;
                                    const isCurrent = index === currentStep;
                                    const isPending = index > currentStep;

                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isComplete ? 'bg-emerald-500/10 border border-emerald-500/20' :
                                                    isCurrent ? 'bg-cyan/10 border border-cyan/30' :
                                                        'bg-[#1b1b1d] border border-[#2a2a2d] opacity-50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-emerald-500 text-white' :
                                                    isCurrent ? 'bg-cyan text-black' :
                                                        'bg-[#2a2a2d] text-gray-500'
                                                }`}>
                                                {isComplete ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : isCurrent && isProcessing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <span className="text-sm font-bold">{index + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium text-sm ${isComplete ? 'text-emerald-400' :
                                                        isCurrent ? 'text-white' :
                                                            'text-gray-500'
                                                    }`}>
                                                    {step.title}
                                                </p>
                                                {step.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {step.description}
                                                    </p>
                                                )}
                                            </div>
                                            {step.time && (
                                                <span className="text-xs text-gray-600">
                                                    ~{step.time}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Custom Content */}
                        {children}

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            {secondaryAction && (
                                <button
                                    onClick={secondaryAction}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {secondaryActionText}
                                </button>
                            )}
                            {primaryAction && (
                                <button
                                    onClick={primaryAction}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {processingText}
                                        </>
                                    ) : (
                                        <>
                                            {primaryActionText}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
