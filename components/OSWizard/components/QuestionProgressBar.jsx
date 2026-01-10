/**
 * QuestionProgressBar Component
 * 
 * Shows progress through the 20 questions with clickable dots for navigation.
 * Part of the TedOS UX - allows users to jump to specific questions when filled.
 */

"use client";
import { motion } from 'framer-motion';
import { STEPS } from '@/lib/os-wizard-data';

export default function QuestionProgressBar({
    currentStep,
    completedSteps = [],
    onDotClick,
    stepData = {}
}) {
    const totalQuestions = 20;
    const progress = ((currentStep - 1) / totalQuestions) * 100;

    // Check if a step has data filled
    const hasStepData = (stepNum) => {
        // Check if the step is completed or has data
        if (completedSteps.includes(stepNum)) return true;

        // Check if stepData has values for this step
        const stepFields = getStepFields(stepNum);
        return stepFields.some(field => {
            const value = stepData[field];
            if (Array.isArray(value)) return value.length > 0;
            return value && String(value).trim().length > 0;
        });
    };

    // Get field names for each step (simplified mapping)
    const getStepFields = (stepNum) => {
        const fieldMap = {
            1: ['industry'],
            2: ['idealClient'],
            3: ['message'],
            4: ['coreProblem'],
            5: ['outcomes'],
            6: ['uniqueAdvantage'],
            7: ['story'],
            8: ['testimonials'],
            9: ['offerProgram'],
            10: ['deliverables'],
            11: ['pricing'],
            12: ['assets'],
            13: ['revenue'],
            14: ['brandVoice'],
            15: ['brandColors'],
            16: ['callToAction'],
            17: ['platforms', 'platformsOther'],
            18: ['goal90Days'],
            19: ['businessStage'],
            20: ['helpNeeded']
        };
        return fieldMap[stepNum] || [];
    };

    // Check if a dot is clickable (has data or is completed)
    const isDotClickable = (stepNum) => {
        return hasStepData(stepNum) || completedSteps.includes(stepNum);
    };

    // Handle dot click
    const handleDotClick = (stepNum) => {
        if (onDotClick && isDotClickable(stepNum)) {
            onDotClick(stepNum);
        }
    };

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

            {/* Clickable Step Dots with Connecting Lines */}
            <div className="relative flex items-center justify-between mt-3">
                {/* Connecting dotted line (behind dots) */}
                <div
                    className="absolute top-1/2 left-0 right-0 h-0 -translate-y-1/2"
                    style={{
                        borderTop: '2px dashed rgba(0, 212, 255, 0.4)',
                        zIndex: 0
                    }}
                />

                {/* Dots */}
                {[...Array(totalQuestions)].map((_, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = completedSteps.includes(stepNum);
                    const isCurrent = stepNum === currentStep;
                    const hasFilled = hasStepData(stepNum);
                    const clickable = isDotClickable(stepNum);

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDotClick(stepNum)}
                            disabled={!clickable}
                            className={`
                                relative z-10 w-3 h-3 rounded-full transition-all duration-200
                                ${isCompleted
                                    ? 'bg-cyan hover:bg-cyan/80 cursor-pointer scale-110'
                                    : isCurrent
                                        ? 'bg-cyan animate-pulse scale-125'
                                        : hasFilled
                                            ? 'bg-cyan/60 hover:bg-cyan cursor-pointer'
                                            : 'bg-[#2a2a2d] border border-cyan/30 cursor-not-allowed'
                                }
                                ${clickable && !isCurrent ? 'hover:scale-150' : ''}
                            `}
                            title={
                                isCompleted
                                    ? `Step ${stepNum}: ${STEPS[idx]?.title || ''} (Completed) - Click to edit`
                                    : hasFilled
                                        ? `Step ${stepNum}: ${STEPS[idx]?.title || ''} (Filled) - Click to review`
                                        : `Step ${stepNum}: ${STEPS[idx]?.title || ''}`
                            }
                        />
                    );
                })}
            </div>

            {/* Help text for clickable dots */}
            {completedSteps.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Click on filled dots to jump to that question
                </p>
            )}
        </div>
    );
}
