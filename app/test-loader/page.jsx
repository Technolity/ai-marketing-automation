"use client";
/**
 * Test Page for TedOS Loader Animation
 * Navigate to /test-loader to see the animation in action
 * 
 * Controls:
 * - Slider to manually adjust progress
 * - Auto-play button to simulate generation
 */

import { useState, useEffect } from 'react';
import BuildingAnimation from '@/components/BuildingAnimation';

export default function TestLoaderPage() {
    const [isGenerating, setIsGenerating] = useState(true);
    const [progress, setProgress] = useState(0);
    const [autoPlay, setAutoPlay] = useState(false);
    const [currentSection, setCurrentSection] = useState("Initializing...");

    const sections = [
        "Analyzing your business...",
        "Creating Ideal Client Profile...",
        "Crafting your Message...",
        "Building your Story...",
        "Designing your Offer...",
        "Writing Sales Scripts...",
        "Generating Marketing Assets...",
        "Creating Email Sequences...",
        "Building Landing Pages...",
        "Optimizing Funnel Copy...",
        "Finalizing Content...",
        "Polishing Outputs...",
        "Complete!"
    ];

    // Auto-play simulation
    useEffect(() => {
        if (!autoPlay) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 13) {
                    setAutoPlay(false);
                    return 13;
                }
                return prev + 1;
            });
        }, 800);

        return () => clearInterval(interval);
    }, [autoPlay]);

    // Update section based on progress
    useEffect(() => {
        setCurrentSection(sections[Math.min(progress, sections.length - 1)]);
    }, [progress]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            {/* Loader Animation */}
            <BuildingAnimation
                isGenerating={isGenerating}
                completedCount={progress}
                totalCount={13}
                currentSection={currentSection}
            />

            {/* Control Panel */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-6 border-t border-gray-700">
                <div className="max-w-2xl mx-auto space-y-4">
                    <h2 className="text-lg font-bold text-cyan-400">🧪 Loader Test Controls</h2>

                    {/* Toggle Loader */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsGenerating(!isGenerating)}
                            className={`px-4 py-2 rounded font-medium ${isGenerating
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            {isGenerating ? 'Hide Loader' : 'Show Loader'}
                        </button>

                        <button
                            onClick={() => {
                                setProgress(0);
                                setAutoPlay(true);
                            }}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded font-medium"
                        >
                            ▶ Auto Play
                        </button>

                        <button
                            onClick={() => setProgress(0)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded font-medium"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Progress Slider */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Progress: {progress}/13 ({Math.round((progress / 13) * 100)}%)
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="13"
                            value={progress}
                            onChange={(e) => setProgress(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Current Section */}
                    <p className="text-sm text-gray-400">
                        Current Section: <span className="text-cyan-400">{currentSection}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
