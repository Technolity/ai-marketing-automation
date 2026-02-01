'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ArrowRight, CheckCircle, Rocket, BookOpen, FileCheck } from 'lucide-react';

/**
 * EmergencyHelpButton - A floating help button that shows contextual guidance
 * Always visible in the bottom-right corner of the Vault page
 */
export default function EmergencyHelpButton({
    activeTab,
    phase1Complete,
    phase2Complete,
    phase3Complete,
    hasFunnelChoice,
    onNavigate,
    approvedPhase1Count,
    approvedPhase2Count,
    approvedPhase3Count,
    totalPhase1,
    totalPhase2,
    totalPhase3
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Determine current state and next action
    const getHelpContent = () => {
        // Phase 1 not complete
        if (!phase1Complete) {
            const remaining = totalPhase1 - approvedPhase1Count;
            return {
                icon: FileCheck,
                location: 'Phase 1: Core Business DNA',
                status: `${approvedPhase1Count} of ${totalPhase1} sections approved`,
                instruction: remaining === 1
                    ? 'Approve the last section to unlock Phase 2!'
                    : `Review and approve ${remaining} more sections to proceed.`,
                actionText: 'Continue Approving',
                action: () => {
                    setIsOpen(false);
                    onNavigate?.('dna');
                }
            };
        }

        // Phase 1 complete but no funnel choice
        if (phase1Complete && !hasFunnelChoice) {
            return {
                icon: Rocket,
                location: 'Phase 1 Complete!',
                status: 'Ready to choose your funnel',
                instruction: 'Select your recommended funnel type to unlock Phase 2 marketing assets.',
                actionText: 'Choose My Funnel',
                action: () => {
                    setIsOpen(false);
                    onNavigate?.('funnel-recommendation');
                }
            };
        }

        // Phase 2 not complete
        if (!phase2Complete) {
            const remaining = totalPhase2 - approvedPhase2Count;
            return {
                icon: FileCheck,
                location: 'Phase 2: Marketing Assets',
                status: `${approvedPhase2Count} of ${totalPhase2} sections approved`,
                instruction: remaining === 1
                    ? 'Approve the last asset to unlock Sales Scripts!'
                    : `Review and approve ${remaining} more assets to proceed.`,
                actionText: 'Continue Approving',
                action: () => {
                    setIsOpen(false);
                    onNavigate?.('assets');
                }
            };
        }

        // Phase 3 not complete
        if (!phase3Complete) {
            const remaining = totalPhase3 - approvedPhase3Count;
            return {
                icon: FileCheck,
                location: 'Phase 3: Sales Scripts',
                status: `${approvedPhase3Count} of ${totalPhase3} scripts approved`,
                instruction: remaining === 1
                    ? 'Approve the last script to deploy your funnel!'
                    : `Review and approve ${remaining} more scripts to deploy.`,
                actionText: 'Continue Approving',
                action: () => {
                    setIsOpen(false);
                    onNavigate?.('scripts');
                }
            };
        }

        // All phases complete
        return {
            icon: Rocket,
            location: 'All Phases Complete! 🎉',
            status: 'Your vault is fully approved',
            instruction: 'Deploy your content to the Builder to activate your marketing system.',
            actionText: 'Deploy Now',
            action: () => {
                setIsOpen(false);
                onNavigate?.('deploy');
            }
        };
    };

    const help = getHelpContent();
    const HelpIcon = help.icon;

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-cyan to-blue-600 rounded-full shadow-lg shadow-cyan/30 flex items-center justify-center text-white hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Need help? Click here!"
            >
                <HelpCircle className="w-6 h-6" />
            </motion.button>

            {/* Help Dialog */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#131314] border border-[#2a2a2d] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors text-gray-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Content */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <HelpIcon className="w-8 h-8 text-cyan" />
                                </div>

                                {/* Where am I? */}
                                <div className="mb-4">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Where You Are</p>
                                    <h3 className="text-lg font-bold text-white">{help.location}</h3>
                                    <p className="text-sm text-cyan mt-1">{help.status}</p>
                                </div>

                                {/* Divider */}
                                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan/50 to-transparent mx-auto my-4" />

                                {/* What do I do next? */}
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">What To Do Next</p>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {help.instruction}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={help.action}
                                className="w-full px-6 py-4 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all group"
                            >
                                {help.actionText}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Guide Link */}
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onNavigate?.('guide');
                                }}
                                className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-cyan text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                View Full Guide
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
