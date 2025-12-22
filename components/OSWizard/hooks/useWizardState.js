/**
 * useWizardState Hook
 * 
 * Manages the core wizard state: steps, progress, view mode, etc.
 * Extracted from OSWizard.jsx for maintainability.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { STEPS, STEP_INPUTS } from '@/lib/os-wizard-data';

/**
 * Processing messages shown during AI content generation
 */
const PROCESSING_MESSAGES = [
    'Analyzing your business...',
    'Identifying your ideal clients...',
    'Crafting your million-dollar message...',
    'Building your signature story...',
    'Designing your high-ticket offer...',
    'Creating sales scripts...',
    'Generating lead magnets...',
    'Writing your VSL script...',
    'Composing email sequences...',
    'Crafting ad copy...',
    'Building your funnel...',
    'Generating content ideas...',
    'Creating your YouTube show...',
    'Finalizing your marketing system...'
];

export function useWizardState(mode = 'dashboard', startAtStepOne = false) {
    const router = useRouter();
    const { session, user, loading: authLoading } = useAuth();

    // Ref to prevent re-initialization on session changes
    const hasInitializedRef = useRef(false);

    // ==========================================
    // VIEW MANAGEMENT STATE
    // ==========================================
    const [viewMode, setViewMode] = useState(mode === 'intake' ? 'step' : 'dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentStep, setCurrentStep] = useState(() => {
        return mode === 'intake' ? 1 : null;
    });

    // ==========================================
    // DATA MANAGEMENT STATE
    // ==========================================
    const [completedSteps, setCompletedSteps] = useState([]);
    const [stepData, setStepData] = useState({});
    const [currentInput, setCurrentInput] = useState({});

    // ==========================================
    // AI GENERATION STATE
    // ==========================================
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [savedContent, setSavedContent] = useState({});
    const [aiAssisting, setAiAssisting] = useState(null);
    const [showHelpFor, setShowHelpFor] = useState(null);

    // ==========================================
    // AI SUGGESTIONS MODAL STATE
    // ==========================================
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [currentFieldForSuggestion, setCurrentFieldForSuggestion] = useState(null);

    // ==========================================
    // CONTENT PREVIEW STATE
    // ==========================================
    const [showContentPreview, setShowContentPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState(null);
    const [generatingPreview, setGeneratingPreview] = useState(false);

    // ==========================================
    // UI STATE
    // ==========================================
    const [isLoading, setIsLoading] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});
    const [showProcessingAnimation, setShowProcessingAnimation] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [showManageDataDropdown, setShowManageDataDropdown] = useState(false);

    // ==========================================
    // EDIT MODE STATE
    // ==========================================
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingStep, setEditingStep] = useState(null);
    const [isUpdatingCascade, setIsUpdatingCascade] = useState(false);

    // ==========================================
    // WIZARD COMPLETION STATE
    // ==========================================
    const [isWizardComplete, setIsWizardComplete] = useState(false);
    const [isSessionSaved, setIsSessionSaved] = useState(true);
    const [hasUnsavedProgress, setHasUnsavedProgress] = useState(false);

    // ==========================================
    // STEP HELPER FUNCTIONS
    // ==========================================

    /**
     * Check if a step is unlocked based on dependencies
     */
    const isStepUnlocked = (stepId) => {
        const step = STEPS.find(s => s.id === stepId);
        if (!step) return false;
        if (step.dependencies.length === 0) return true;
        return step.dependencies.every(depId => completedSteps.includes(depId));
    };

    /**
     * Get step status: 'completed' | 'unlocked' | 'locked'
     */
    const getStepStatus = (stepId) => {
        if (completedSteps.includes(stepId)) return 'completed';
        if (isStepUnlocked(stepId)) return 'unlocked';
        return 'locked';
    };

    // ==========================================
    // PROGRESS SAVE/LOAD
    // ==========================================

    /**
     * Save progress to both localStorage and API
     */
    const saveProgressToStorage = async (newCompletedSteps, newAnswers, newContent, overrides = {}) => {
        try {
            if (!session) return;

            const progressData = {
                currentStep,
                viewMode,
                completedSteps: newCompletedSteps,
                answers: newAnswers,
                generatedContent: newContent,
                isComplete: newCompletedSteps.length >= 20,
                updatedAt: new Date().toISOString(),
                ...overrides
            };

            // Always save to localStorage (guaranteed to work)
            localStorage.setItem(`wizard_progress_${session.user.id}`, JSON.stringify(progressData));

            // Also try to save to Supabase API
            try {
                await fetchWithAuth("/api/os/progress", {
                    method: "POST",
                    body: JSON.stringify(progressData)
                });
            } catch (apiError) {
                console.log('Saved to localStorage (API unavailable)');
            }
        } catch (error) {
            console.error('Save progress error:', error);
        }
    };

    // ==========================================
    // INPUT HANDLERS
    // ==========================================

    const handleInputChange = (field, value) => {
        setCurrentInput(prev => ({ ...prev, [field]: value }));
        setIsSessionSaved(false);
        setHasUnsavedProgress(true);
    };

    // ==========================================
    // INITIALIZATION EFFECT
    // ==========================================
    useEffect(() => {
        if (authLoading) return;

        if (!session) {
            router.push("/auth/login");
            return;
        }

        if (hasInitializedRef.current) {
            setIsLoading(false);
            return;
        }

        hasInitializedRef.current = true;
        let mounted = true;

        const loadProgress = async () => {
            const timeoutId = setTimeout(() => {
                if (mounted) setIsLoading(false);
            }, 5000);

            try {
                // Check localStorage for in-progress work
                const localProgress = localStorage.getItem(`wizard_progress_${session.user.id}`);
                if (localProgress) {
                    const savedProgress = JSON.parse(localProgress);
                    if (savedProgress.completedSteps) setCompletedSteps(savedProgress.completedSteps);
                    if (savedProgress.answers) setStepData(savedProgress.answers);
                    if (savedProgress.generatedContent) {
                        setSavedContent(savedProgress.generatedContent);
                        setGeneratedContent(savedProgress.generatedContent);
                    }

                    if (mode === 'intake' && savedProgress.currentStep && savedProgress.viewMode === 'step') {
                        setCurrentStep(savedProgress.currentStep);
                        setViewMode('step');

                        const stepInputs = STEP_INPUTS[savedProgress.currentStep];
                        if (stepInputs && savedProgress.answers) {
                            const loadedInput = {};
                            stepInputs.forEach(input => {
                                if (savedProgress.answers[input.name]) {
                                    loadedInput[input.name] = savedProgress.answers[input.name];
                                }
                            });
                            setCurrentInput(loadedInput);
                        }
                    }
                    if (savedProgress.isComplete) {
                        setIsWizardComplete(true);
                    }
                    setIsSessionSaved(true);
                }

                // If in intake mode and no current step set, start at step 1
                if (mode === 'intake' && !currentStep) {
                    setCurrentStep(1);
                    setViewMode('step');
                }

                setIsLoading(false);
                clearTimeout(timeoutId);
            } catch (error) {
                console.error('Load progress error:', error);
                if (mounted) setIsLoading(false);
            }
        };

        loadProgress();

        return () => { mounted = false; };
    }, [session, authLoading, router, mode]);

    // Handle startAtStepOne prop
    useEffect(() => {
        if (startAtStepOne && !authLoading && session) {
            setCurrentStep(1);
            setViewMode('step');
            setCurrentInput({});
            setIsLoading(false);
        }
    }, [startAtStepOne, authLoading, session]);

    // Warn on unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            const hasUnsavedInput = Object.values(currentInput).some(val => val && val.toString().trim().length > 0);
            if (hasUnsavedInput && viewMode === 'step') {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [currentInput, viewMode]);

    return {
        // Auth
        session,
        user,
        authLoading,
        router,

        // View Management
        viewMode,
        setViewMode,
        isSidebarOpen,
        setIsSidebarOpen,
        currentStep,
        setCurrentStep,

        // Data Management
        completedSteps,
        setCompletedSteps,
        stepData,
        setStepData,
        currentInput,
        setCurrentInput,

        // AI Generation
        isGenerating,
        setIsGenerating,
        generatedContent,
        setGeneratedContent,
        isReviewMode,
        setIsReviewMode,
        savedContent,
        setSavedContent,
        aiAssisting,
        setAiAssisting,
        showHelpFor,
        setShowHelpFor,

        // AI Suggestions Modal
        showSuggestionsModal,
        setShowSuggestionsModal,
        aiSuggestions,
        setAiSuggestions,
        currentFieldForSuggestion,
        setCurrentFieldForSuggestion,

        // Content Preview
        showContentPreview,
        setShowContentPreview,
        previewContent,
        setPreviewContent,
        generatingPreview,
        setGeneratingPreview,

        // UI State
        isLoading,
        setIsLoading,
        fieldErrors,
        setFieldErrors,
        showProcessingAnimation,
        setShowProcessingAnimation,
        processingMessage,
        setProcessingMessage,
        showManageDataDropdown,
        setShowManageDataDropdown,

        // Edit Mode
        isEditMode,
        setIsEditMode,
        editingStep,
        setEditingStep,
        isUpdatingCascade,
        setIsUpdatingCascade,

        // Wizard Completion
        isWizardComplete,
        setIsWizardComplete,
        isSessionSaved,
        setIsSessionSaved,
        hasUnsavedProgress,
        setHasUnsavedProgress,

        // Helper Functions
        isStepUnlocked,
        getStepStatus,
        saveProgressToStorage,
        handleInputChange,

        // Constants
        PROCESSING_MESSAGES
    };
}
