/**
 * Deployed Funnel Card Component
 * Shows a prominent "Funnel Live" status with builder access button
 * Displayed after successful funnel deployment
 */

'use client';

import { useState } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';
import LaunchBuilderButton from '@/components/LaunchBuilderButton';

export default function DeployedFunnelCard() {
    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <>
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg p-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Status Section */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20">
                            <CheckCircle className="w-7 h-7 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                                Funnel Live
                                <button
                                    onClick={() => setShowInstructions(true)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    aria-label="View instructions"
                                >
                                    <Info className="w-5 h-5" />
                                </button>
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">
                                Your funnel has been successfully deployed to Builder
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div>
                        <LaunchBuilderButton />
                    </div>
                </div>
            </div>

            {/* Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Info className="w-6 h-6 text-blue-400" />
                                How to Access Your Funnel
                            </h3>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-3">
                            <p className="text-gray-300 text-sm">
                                Follow these steps to preview your deployed funnel:
                            </p>
                            <ol className="space-y-3 text-gray-300 text-sm">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs">
                                        1
                                    </span>
                                    <span>Click the "Go to Builder" button to open your TedOS Builder account</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs">
                                        2
                                    </span>
                                    <span>Navigate to the <strong>Sites</strong> section in the left sidebar</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs">
                                        3
                                    </span>
                                    <span>Find and open <strong>Funnel-03</strong> from your sites list</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs">
                                        4
                                    </span>
                                    <span>Click the <strong>Preview</strong> icon to view your live funnel</span>
                                </li>
                            </ol>
                        </div>

                        {/* Close Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
