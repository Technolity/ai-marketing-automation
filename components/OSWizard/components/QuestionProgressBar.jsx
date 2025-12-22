/**
 * QuestionProgressBar Component
 * 
 * Shows progress through the 20 questions.
 * New component for the TedOS UX overhaul.
 */

"use client";
import { motion } from 'framer-motion';
import { STEPS } from '@/lib/os-wizard-data';

export default function QuestionProgressBar({ currentStep, completedSteps }) {
    const totalQuestions = 20;
    const progress = ((currentStep - 1) / totalQuestions) * 100;

    return (
        <div className="w-full mb-8">
            {/* Question Counter */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">
                    Question {currentStep} of {totalQuestions}
                </span>
                <span className="text-sm text-cyan font-medium">
                    {Math.round(progress)}% Complete
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-[#1b1b1d] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan to-blue-500 rounded-full"
                />
            </div>

            {/* Step Dots (optional visual) */}
            <div className="flex justify-between mt-2">
                {[...Array(totalQuestions)].map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx + 1 < currentStep
                                ? 'bg-cyan'
                                : idx + 1 === currentStep
                                    ? 'bg-cyan animate-pulse'
                                    : 'bg-[#2a2a2d]'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
