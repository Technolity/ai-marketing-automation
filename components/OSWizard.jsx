"use client";
/**
 * OSWizard Component
 * 
 * Main wizard component for the TedOS questionnaire and content generation flow.
 * 
 * MODULAR STRUCTURE (components/OSWizard/):
 * - hooks/useWizardState.js - Core state management
 * - hooks/useWizardSessions.js - Session save/load/delete
 * - components/ProcessingAnimation.jsx - Loading overlay
 * - components/QuestionProgressBar.jsx - "Question X of 20" progress bar
 * - utils/formatters.js - Display formatting helpers
 * - utils/validators.js - Input validation
 * 
 * The modular files are ready for gradual migration.
 * This file remains the master until migration is complete.
 */
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, CheckCircle, Lock, RefreshCw, ArrowRight, Sparkles,
    ChevronLeft, Menu, X, Info, History, Eye, Trash2, Save, FolderOpen, RotateCcw,
    ChevronDown, Settings, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { STEPS, STEP_INPUTS, STEP_INFO, ASSET_OPTIONS, REVENUE_OPTIONS, PLATFORM_OPTIONS, BUSINESS_STAGE_OPTIONS } from "@/lib/os-wizard-data";

// Import modular components
import { QuestionProgressBar } from "./OSWizard/components";

// Helper function to format field names into readable titles
const formatFieldName = (key) => {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

// Helper function to recursively format nested objects/arrays
const formatValue = (value, depth = 0, maxDepth = 5) => {
    // Prevent infinite recursion
    if (depth > maxDepth) {
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    if (value === null || value === undefined) {
        return '';
    }

    // Handle primitive types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return '';

        // Handle array of objects (like email sequence, program modules)
        if (typeof value[0] === 'object' && value[0] !== null) {
            return value.map((item, idx) => {
                const title = item.title || item.name || item.subject || item.headline || `Item ${idx + 1}`;
                const itemContent = Object.entries(item)
                    .filter(([k]) => !['title', 'name'].includes(k))
                    .map(([k, v]) => {
                        const formattedValue = formatValue(v, depth + 1, maxDepth);
                        return `  ${formatFieldName(k)}: ${formattedValue}`;
                    }).join('\n');
                return `${idx + 1}. ${title}\n${itemContent}`;
            }).join('\n\n');
        }
        // Handle array of strings/primitives
        return value.map((item, idx) => `${idx + 1}. ${formatValue(item, depth + 1, maxDepth)}`).join('\n');
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => {
                const formattedKey = formatFieldName(k);
                const formattedValue = formatValue(v, depth + 1, maxDepth);

                // For nested objects, add proper indentation
                if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
                    const indentedValue = formattedValue.split('\n').map(line => `  ${line}`).join('\n');
                    return `${formattedKey}:\n${indentedValue}`;
                }

                // For arrays, add proper indentation
                if (Array.isArray(v)) {
                    const indentedValue = formattedValue.split('\n').map(line => `  ${line}`).join('\n');
                    return `${formattedKey}:\n${indentedValue}`;
                }

                return `${formattedKey}: ${formattedValue}`;
            });

        return entries.join('\n\n');
    }

    return String(value);
};


// Helper function to format JSON content into human-readable sections
const formatContentForDisplay = (jsonContent) => {
    if (!jsonContent || typeof jsonContent !== 'object') {
        return [];
    }

    const sections = [];

    // Flatten the top-level structure (e.g., idealClient, message, etc.)
    Object.entries(jsonContent).forEach(([topKey, topValue]) => {
        if (typeof topValue === 'object' && !Array.isArray(topValue)) {
            // This is a nested object like { idealClient: {...} }
            Object.entries(topValue).forEach(([key, value]) => {
                sections.push({
                    key: formatFieldName(key),
                    value: formatValue(value)
                });
            });
        } else {
            // This is a direct key-value pair
            sections.push({
                key: formatFieldName(topKey),
                value: formatValue(topValue)
            });
        }
    });

    return sections;
};




export default function OSWizard({ mode = 'dashboard', startAtStepOne = false }) {
    const router = useRouter();
    const { session, user, loading: authLoading } = useAuth();

    // Ref to prevent re-initialization on session changes
    const hasInitializedRef = useRef(false);

    // View Management - initialize based on mode prop
    const [viewMode, setViewMode] = useState(mode === 'intake' ? 'step' : 'dashboard'); // 'dashboard' or 'step'
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // Initialize currentStep to 1 if in intake mode (prevents render errors)
    const [currentStep, setCurrentStep] = useState(() => {
        const initialStep = mode === 'intake' ? 1 : null;
        console.log('[OSWizard] Initial currentStep:', initialStep, 'mode:', mode);
        return initialStep;
    });

    // Data Management
    const [completedSteps, setCompletedSteps] = useState([]);
    const [stepData, setStepData] = useState({});
    const [currentInput, setCurrentInput] = useState({});

    // AI Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [aiAssisting, setAiAssisting] = useState(null); // Track which field is being AI-assisted
    const [showHelpFor, setShowHelpFor] = useState(null); // Track which field's help is showing
    const [showSavedSessions, setShowSavedSessions] = useState(false); // Track saved sessions view
    const [savedSessions, setSavedSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [sessionName, setSessionName] = useState("");
    const [isSavingSession, setIsSavingSession] = useState(false);

    // Track if current session has been saved (for navigation warnings)
    const [isSessionSaved, setIsSessionSaved] = useState(true);
    const [hasUnsavedProgress, setHasUnsavedProgress] = useState(false);

    // Field-level validation errors
    const [fieldErrors, setFieldErrors] = useState({});

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

    const [isLoading, setIsLoading] = useState(true);

    // AI Suggestions Modal
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [currentFieldForSuggestion, setCurrentFieldForSuggestion] = useState(null);

    // Content Preview Modal
    const [showContentPreview, setShowContentPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState(null);
    const [generatingPreview, setGeneratingPreview] = useState(false);

    // Edit Mode (Changed my mind)
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingStep, setEditingStep] = useState(null);
    const [savedContent, setSavedContent] = useState({}); // Stores generated content per step
    const [isUpdatingCascade, setIsUpdatingCascade] = useState(false);

    // Processing Animation
    const [showProcessingAnimation, setShowProcessingAnimation] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const processingMessages = [
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

    // Manage Data Dropdown
    const [showManageDataDropdown, setShowManageDataDropdown] = useState(false);

    // Wizard Completion State - locks editing until reset
    const [isWizardComplete, setIsWizardComplete] = useState(false);

    // Handle startAtStepOne prop - immediately go to Step 1 when prop is true
    // This runs separately from initialization to handle when wizard is already mounted
    useEffect(() => {
        if (startAtStepOne && !authLoading && session) {
            console.log('[DEBUG] startAtStepOne is true - navigating to Step 1');
            setCurrentStep(1);
            setViewMode('step');
            setCurrentInput({});
            setIsLoading(false);
        }
    }, [startAtStepOne, authLoading, session]);

    // Load saved progress on mount - ONLY ONCE
    useEffect(() => {
        console.log('[OSWizard] useEffect triggered - mode:', mode, 'authLoading:', authLoading, 'session:', !!session);

        // Wait for auth to finish loading
        if (authLoading) {
            console.log('[OSWizard] Auth still loading, waiting...');
            return;
        }

        // Redirect if no session after auth check completes
        if (!session) {
            console.log('[OSWizard] No session found, redirecting to login');
            router.push("/auth/login");
            return;
        }

        // PREVENT RE-INITIALIZATION: Only run once per mount
        // If already initialized, just make sure loading is false and return
        if (hasInitializedRef.current) {
            console.log('[OSWizard] Already initialized, skipping re-initialization');
            setIsLoading(false); // CRITICAL: Ensure loading is false even on re-renders
            return;
        }

        console.log('[OSWizard] Starting initialization for mode:', mode);
        let mounted = true;

        const loadProgress = async () => {
            console.log('[OSWizard] loadProgress() started');
            // Mark as initialized immediately to prevent re-runs
            hasInitializedRef.current = true;

            // Safety timeout
            const timeoutId = setTimeout(() => {
                if (mounted) {
                    console.warn('[OSWizard] Load timeout - forcing render');
                    setIsLoading(false);
                }
            }, 5000);

            try {
                if (!mounted) return;

                // FIRST: Check localStorage for in-progress work (survives browser minimize/refocus)
                try {
                    const localProgress = localStorage.getItem(`wizard_progress_${session.user.id}`);
                    console.log('[OSWizard] localStorage check:', localProgress ? 'Found' : 'Not found');

                    if (localProgress) {
                        const savedProgress = JSON.parse(localProgress);
                        console.log('[OSWizard] Saved progress:', savedProgress);
                        console.log('[OSWizard] Completed steps:', savedProgress.completedSteps?.length || 0);
                        console.log('[OSWizard] Answers:', Object.keys(savedProgress.answers || {}).length);

                        // Restore state from localStorage (data only, not viewMode)
                        if (savedProgress.completedSteps) setCompletedSteps(savedProgress.completedSteps);
                        if (savedProgress.answers) setStepData(savedProgress.answers);
                        if (savedProgress.generatedContent) {
                            setSavedContent(savedProgress.generatedContent);
                            setGeneratedContent(savedProgress.generatedContent);
                        }

                        // Only restore step view state if we're in intake mode (not dashboard)
                        // Dashboard mode should ALWAYS show the dashboard grid
                        if (mode === 'intake' && savedProgress.currentStep && savedProgress.viewMode === 'step') {
                            console.log('[OSWizard] Intake mode - restoring step', savedProgress.currentStep);
                            setCurrentStep(savedProgress.currentStep);
                            setViewMode('step');

                            // Load saved answers for current step
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
                            console.log('[OSWizard] Wizard marked as complete');
                            setIsWizardComplete(true);
                        }
                        setIsSessionSaved(true);
                    } else {
                        console.log('[OSWizard] No localStorage progress found');
                    }
                } catch (e) {
                    console.error('[OSWizard] localStorage check error:', e);
                }


                // Try to fetch saved sessions from database
                try {
                    console.log('[OSWizard] Fetching saved sessions from database...');
                    const sessionsRes = await fetchWithAuth("/api/os/sessions");

                    if (!mounted) return;

                    if (sessionsRes.ok) {
                        const sessionsData = await sessionsRes.json();
                        console.log('[OSWizard] Database sessions:', sessionsData.sessions?.length || 0);

                        if (sessionsData.sessions && sessionsData.sessions.length > 0) {
                            setSavedSessions(sessionsData.sessions);
                            console.log('[OSWizard] Set saved sessions list');

                            // Auto-load the most recent session ONLY if no localStorage data
                            const hasLocalData = localStorage.getItem(`wizard_progress_${session.user.id}`);
                            if (!hasLocalData) {
                                console.log('[OSWizard] No local data, auto-loading most recent session');
                                const mostRecent = sessionsData.sessions[0];
                                setCompletedSteps(mostRecent.completed_steps || []);
                                setStepData(mostRecent.answers || {});
                                setSavedContent(mostRecent.generated_content || {});
                                setGeneratedContent(mostRecent.generated_content || {});
                                setIsWizardComplete(mostRecent.is_complete || (mostRecent.completed_steps?.length >= 20));
                                setIsSessionSaved(true);

                                toast.success(`Loaded your session: ${mostRecent.session_name}`);
                            } else {
                                console.log('[OSWizard] Local data exists, not auto-loading session');
                            }
                        }
                    }
                } catch (sessionsError) {
                    console.error('[OSWizard] Could not fetch saved sessions:', sessionsError);
                }

                if (!mounted) return;

                // Check if user clicked "Start Questionnaire" from welcome screen
                try {
                    const startFlag = localStorage.getItem(`start_questionnaire_${session.user.id}`);
                    console.log('[OSWizard] Start questionnaire flag:', startFlag);

                    if (startAtStepOne || startFlag === 'true') {
                        localStorage.removeItem(`start_questionnaire_${session.user.id}`);

                        if (mode === 'intake') {
                            console.log('[OSWizard] Starting questionnaire at step 1');
                            setViewMode('step');
                            setCurrentStep(1);
                            setCurrentInput({});
                        } else {
                            console.log('[OSWizard] On dashboard, ignoring start flag (cleared)');
                        }
                    }
                } catch (e) {
                    console.error('[OSWizard] Storage access error', e);
                }

                // If in intake mode and no current step set, start at step 1
                if (mode === 'intake' && !currentStep) {
                    console.log('[OSWizard] Intake mode with no current step, starting at step 1');
                    setCurrentStep(1);
                    setViewMode('step');
                }

                console.log('[OSWizard] Initialization complete, setting isLoading to false');
                console.log('[OSWizard] Final state - viewMode:', viewMode === 'step' ? 'step' : 'dashboard', 'currentStep:', currentStep || 'none');
                setIsLoading(false);
                clearTimeout(timeoutId);
            } catch (error) {
                console.error('[OSWizard] Load progress error:', error);
                if (mounted) setIsLoading(false);
            } finally {
                clearTimeout(timeoutId);
            }
        };

        loadProgress();

        return () => {
            mounted = false;
        };
    }, [session, authLoading, router]); // eslint-disable-line react-hooks/exhaustive-deps

    // Save progress to both localStorage and API
    const saveProgressToStorage = async (newCompletedSteps, newAnswers, newContent, overrides = {}) => {
        try {
            if (!session) return;

            const progressData = {
                currentStep,
                viewMode, // Save current view mode for restoration
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

    // Check if a step is unlocked based on dependencies
    const isStepUnlocked = (stepId) => {
        const step = STEPS.find(s => s.id === stepId);
        if (!step) return false;
        if (step.dependencies.length === 0) return true;
        return step.dependencies.every(depId => completedSteps.includes(depId));
    };

    // Get step status
    const getStepStatus = (stepId) => {
        if (completedSteps.includes(stepId)) return 'completed';
        if (isStepUnlocked(stepId)) return 'unlocked';
        return 'locked';
    };

    // Handle step click from Mission Control
    const handleStepClick = (stepId) => {
        console.log('[DEBUG] handleStepClick called with stepId:', stepId);
        console.log('[DEBUG] Current viewMode:', viewMode);

        const status = getStepStatus(stepId);
        console.log('[DEBUG] Step status:', status);

        if (status === 'locked') {
            toast.error('Complete previous steps first');
            return;
        }

        // If in dashboard mode, save current step to localStorage and navigate to intake_form
        if (mode === 'dashboard') {
            // Save step info to localStorage so intake_form can load it
            if (session) {
                const localProgress = localStorage.getItem(`wizard_progress_${session.user.id}`);
                let progressData = localProgress ? JSON.parse(localProgress) : {};
                progressData.currentStep = stepId;
                progressData.viewMode = 'step';
                localStorage.setItem(`wizard_progress_${session.user.id}`, JSON.stringify(progressData));
            }
            router.push('/intake_form');
            return;
        }

        console.log('[DEBUG] Setting viewMode to step');
        setCurrentStep(stepId);
        setViewMode('step');
        setGeneratedContent(null);
        setIsReviewMode(false);
        console.log('[DEBUG] viewMode should now be step');

        // Load saved answers if step was completed
        if (status === 'completed') {
            const stepInputs = STEP_INPUTS[stepId];
            if (stepInputs) {
                const loadedInput = {};
                stepInputs.forEach(input => {
                    if (stepData[input.name]) {
                        loadedInput[input.name] = stepData[input.name];
                    }
                });
                setCurrentInput(loadedInput);
            }
        } else {
            setCurrentInput({});
        }
    };

    // Handle back to dashboard with unsaved changes warning
    const handleBackToDashboard = async () => {
        // Auto-save current progress to localStorage before leaving
        if (session && (completedSteps.length > 0 || Object.keys(stepData).length > 0 || Object.keys(currentInput).length > 0)) {
            const progressData = {
                currentStep,
                viewMode: 'dashboard',
                completedSteps,
                answers: { ...stepData, ...currentInput },
                generatedContent: savedContent,
                isComplete: completedSteps.length >= 20,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`wizard_progress_${session.user.id}`, JSON.stringify(progressData));
            console.log('[DEBUG] Auto-saved progress to localStorage on dashboard navigation');
        }

        // If in intake mode (separate page), navigate to dashboard page
        if (mode === 'intake') {
            router.push('/dashboard');
            return;
        }

        // Otherwise just change view mode
        setViewMode('dashboard');
        setCurrentStep(null);
        setCurrentInput({});
        setGeneratedContent(null);
        setIsReviewMode(false);
        setIsEditMode(false);
        setEditingStep(null);
    };

    // Fetch saved sessions
    const fetchSavedSessions = async () => {
        setLoadingSessions(true);
        try {
            if (!session) return;

            const res = await fetchWithAuth("/api/os/sessions");
            const data = await res.json();
            setSavedSessions(data.sessions || []);
        } catch (error) {
            console.error('Fetch sessions error:', error);
            toast.error("Failed to load saved sessions");
        } finally {
            setLoadingSessions(false);
        }
    };

    // Save current session
    const handleSaveSession = async () => {
        if (!sessionName.trim()) {
            toast.error("Please enter a session name");
            return;
        }

        setIsSavingSession(true);
        try {
            if (!session) return;

            const res = await fetchWithAuth("/api/os/sessions", {
                method: "POST",
                body: JSON.stringify({
                    sessionName,
                    currentStep,
                    completedSteps,
                    answers: stepData,
                    generatedContent: generatedContent || savedContent, // Use full generated content if available
                    isComplete: completedSteps.length >= 20 && isWizardComplete
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Session saved successfully!");
            setShowSaveModal(false);
            setSessionName("");
            setIsSessionSaved(true); // Mark as saved - no more warnings
            setHasUnsavedProgress(false);
            fetchSavedSessions(); // Refresh list
        } catch (error) {
            console.error('Save session error:', error);
            toast.error("Failed to save session");
        } finally {
            setIsSavingSession(false);
        }
    };

    // Quick save progress (auto-named) - for in-progress saves
    const handleQuickSave = async () => {
        if (!session) return;

        setIsSavingSession(true);
        try {
            // Generate auto name with timestamp
            const autoName = `Progress - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

            const res = await fetchWithAuth("/api/os/sessions", {
                method: "POST",
                body: JSON.stringify({
                    sessionName: autoName,
                    currentStep,
                    completedSteps,
                    answers: { ...stepData, ...currentInput }, // Include current input
                    generatedContent: generatedContent || savedContent,
                    isComplete: false // Mid-progress save
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Progress saved!");
            setIsSessionSaved(true);
            setHasUnsavedProgress(false);
            fetchSavedSessions();
        } catch (error) {
            console.error('Quick save error:', error);
            toast.error("Failed to save progress");
        } finally {
            setIsSavingSession(false);
        }
    };

    // Load a saved session
    const handleLoadSession = async (sessionData) => {
        try {
            // Update state
            setCompletedSteps(sessionData.completed_steps || []);
            setStepData(sessionData.answers || {});
            setSavedContent(sessionData.generated_content || {});
            setGeneratedContent(sessionData.generated_content || {});
            setCurrentStep(null); // Go to dashboard
            setViewMode('dashboard');

            // Set wizard complete status based on session
            setIsWizardComplete(sessionData.is_complete || (sessionData.completed_steps?.length >= 20));

            // Save to local storage and sync with main progress
            await saveProgressToStorage(
                sessionData.completed_steps || [],
                sessionData.answers || {},
                sessionData.generated_content || {},
                {
                    currentStep: sessionData.current_step || 1,
                    isComplete: sessionData.is_complete || (sessionData.completed_steps?.length >= 20)
                }
            );

            // Set session source for Results page
            localStorage.setItem('ted_has_active_session', 'true');
            localStorage.setItem('ted_results_source', JSON.stringify({
                type: 'loaded',
                name: sessionData.session_name,
                id: sessionData.id
            }));

            toast.success(`Loaded session: ${sessionData.session_name}`);
            setShowSavedSessions(false);
        } catch (error) {
            console.error('Load session error:', error);
            toast.error("Failed to load session");
        }
    };


    // Delete a saved session (soft delete - data kept for admin)
    const handleDeleteSession = async (sessionId) => {
        console.log('Delete clicked for session:', sessionId);

        if (!confirm("⚠️ This will delete the whole data of this session for you.\n\nThis action cannot be undone. Are you sure you want to continue?")) {
            console.log('Delete cancelled by user');
            return;
        }

        try {
            if (!session) {
                console.error('No auth session found');
                toast.error('Please log in again');
                return;
            }

            console.log('Sending delete request for session:', sessionId);

            const res = await fetchWithAuth(`/api/os/sessions?id=${sessionId}`, {
                method: "DELETE"
            });

            const data = await res.json();
            console.log('Delete response:', data);

            if (data.error) throw new Error(data.error);

            toast.success("Session deleted successfully");
            fetchSavedSessions(); // Refresh list

            // Clear current state if deleted session was loaded
            setCompletedSteps([]);
            setStepData({});
            setSavedContent({});
            setCurrentInput({});

        } catch (error) {
            console.error('Delete session error:', error);
            toast.error(`Failed to delete session: ${error.message}`);
        }
    };



    // Reset / New Business - clears all progress and results
    const handleReset = async () => {
        if (!confirm("Are you sure? This will clear all current progress and generated content. Make sure you saved your session first!")) return;

        try {
            // Session is available from useAuth hook

            // Clear state
            setCompletedSteps([]);
            setStepData({});
            setSavedContent({});
            setCurrentStep(null);
            setViewMode('dashboard');
            setIsEditMode(false);
            setEditingStep(null);
            setCurrentInput({});
            setIsWizardComplete(false); // Unlock editing


            // Clear storage
            await saveProgressToStorage([], {}, {}, { currentStep: 1, isComplete: false });

            // Clear session tracking for Results page
            localStorage.removeItem('ted_has_active_session');
            localStorage.removeItem('ted_results_source');

            // Clear slide_results from database so Results page shows empty
            if (session) {
                await fetchWithAuth('/api/os/reset', {
                    method: 'POST'
                });
            }

            toast.success("Reset complete. Ready for new business!");
        } catch (error) {
            console.error('Reset error:', error);
            toast.error("Failed to reset");
        }
    };



    const handleInputChange = (field, value) => {
        setCurrentInput(prev => ({ ...prev, [field]: value }));
        // Mark session as unsaved when user makes changes
        setIsSessionSaved(false);
        setHasUnsavedProgress(true);
    };

    // Helper function to validate step inputs - checks all required fields have content
    const validateStepInputs = () => {
        const stepInputs = STEP_INPUTS[currentStep];
        if (!stepInputs) return { valid: true, emptyFields: [], errors: {} };

        const emptyFields = [];
        const errors = {};

        stepInputs.forEach(input => {
            // Skip conditional inputs if their condition isn't met
            if (input.conditionalOn) {
                const parentValue = currentInput[input.conditionalOn] || [];
                if (!parentValue.includes(input.conditionalValue)) {
                    return; // Skip validation for this field
                }
            }

            // Skip validation for optional fields
            if (input.optional) {
                return;
            }

            const value = currentInput[input.name];
            let isInvalid = false;

            // Handle arrays (multiselect)
            if (input.type === 'multiselect') {
                if (!value || !Array.isArray(value) || value.length === 0) {
                    isInvalid = true;
                    errors[input.name] = 'Please select at least one option';
                }
            }
            // Handle select dropdowns
            else if (input.type === 'select') {
                if (!value || value === '') {
                    isInvalid = true;
                    errors[input.name] = 'Please select an option';
                }
            }
            // Handle text inputs (textarea, text)
            else {
                const strValue = value || '';
                if (!strValue.trim()) {
                    isInvalid = true;
                    errors[input.name] = 'This field is required';
                } else if (strValue.trim().length < 3) {
                    isInvalid = true;
                    errors[input.name] = 'Please enter at least 3 characters';
                }
            }

            if (isInvalid) {
                emptyFields.push(input.label);
            }
        });

        return {
            valid: emptyFields.length === 0,
            emptyFields,
            errors
        };
    };

    // AI Assist for individual fields - now shows 5 suggestions
    const handleAiAssist = async (fieldName, fieldLabel) => {
        // Check if field has at least some content for better suggestions
        const fieldValue = currentInput[fieldName] || '';
        if (!fieldValue.trim() || fieldValue.trim().length < 3) {
            toast.error(`Please enter at least a few words in "${fieldLabel}" before using AI Enhance.`);
            return;
        }

        setAiAssisting(fieldName);
        setCurrentFieldForSuggestion(fieldName);
        try {
            if (!session) {
                toast.error("You must be logged in.");
                return;
            }

            const res = await fetchWithAuth("/api/os/assist", {
                method: "POST",
                body: JSON.stringify({
                    fieldLabel,
                    sectionTitle: STEPS[currentStep - 1].title,
                    userContext: { ...currentInput, ...stepData },
                    userInput: currentInput[fieldName] || ""
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setAiSuggestions(data.suggestions || []);
            setShowSuggestionsModal(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to get AI suggestions.");
        } finally {
            setAiAssisting(null);
        }
    };

    // Select a suggestion from the modal
    const handleSelectSuggestion = (suggestion) => {
        if (currentFieldForSuggestion) {
            handleInputChange(currentFieldForSuggestion, suggestion);
            toast.success("Suggestion selected!");
        }
        setShowSuggestionsModal(false);
        setAiSuggestions([]);
        setCurrentFieldForSuggestion(null);
    };

    // Generate content preview based on current answers
    const generateContentPreview = async () => {
        setGeneratingPreview(true);
        try {
            if (!session) return;

            // Determine what can be generated based on completed steps
            const allData = { ...stepData, ...currentInput };

            const res = await fetchWithAuth("/api/os/generate", {
                method: "POST",
                body: JSON.stringify({
                    step: 'preview',
                    data: allData,
                    completedSteps: completedSteps.length + 1
                }),
            });

            const data = await res.json();
            if (!data.error) {
                setPreviewContent(data.result);
                setShowContentPreview(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGeneratingPreview(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setShowProcessingAnimation(true);

        // Start cycling through processing messages
        let messageIndex = 0;
        setProcessingMessage(processingMessages[0]);
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % processingMessages.length;
            setProcessingMessage(processingMessages[messageIndex]);
        }, 2000);

        try {
            if (!session) {
                toast.error("You must be logged in to generate content.");
                setIsGenerating(false);
                setShowProcessingAnimation(false);
                clearInterval(messageInterval);
                return;
            }

            // On step 20, generate ALL artifacts
            const payload = {
                step: 'all',
                data: {
                    ...stepData,
                    ...currentInput
                }
            };

            const res = await fetchWithAuth("/api/os/generate", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            clearInterval(messageInterval);
            setProcessingMessage('Your marketing system is ready! 🚀');

            // Brief delay to show success message
            await new Promise(resolve => setTimeout(resolve, 1500));

            setGeneratedContent(data.result);
            setIsReviewMode(true);

            // Mark step 20 as completed and update saved content
            const allCompletedSteps = [...new Set([...completedSteps, 20])];
            setCompletedSteps(allCompletedSteps);
            setSavedContent(data.result);

            // Mark wizard as complete - locks editing until reset
            setIsWizardComplete(true);

            // Set active session flag for Results page
            localStorage.setItem('ted_has_active_session', 'true');
            localStorage.setItem('ted_results_source', JSON.stringify({
                type: 'current',
                name: 'Current Session'
            }));

            // Save completion state to localStorage
            if (session) {
                const progressData = {
                    completedSteps: allCompletedSteps,
                    answers: { ...stepData, ...currentInput },
                    generatedContent: data.result,
                    isComplete: true,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(`wizard_progress_${session.user.id}`, JSON.stringify(progressData));
            }

            toast.success("All content generated successfully!");


        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content. Please try again.");
            clearInterval(messageInterval);
        } finally {
            setIsGenerating(false);
            setShowProcessingAnimation(false);
        }
    };

    // Skip optional step
    const handleSkipStep = async () => {
        const currentStepConfig = STEPS.find(s => s.id === currentStep);
        if (!currentStepConfig?.optional) {
            toast.error('This step cannot be skipped');
            return;
        }

        // Mark step as completed even though it's skipped
        const newCompletedSteps = [...new Set([...completedSteps, currentStep])];
        setCompletedSteps(newCompletedSteps);

        // Save progress
        if (session) {
            const progressData = {
                currentStep: currentStep < STEPS.length ? currentStep + 1 : currentStep,
                viewMode: 'step',
                completedSteps: newCompletedSteps,
                answers: stepData,
                generatedContent: savedContent,
                isComplete: newCompletedSteps.length >= 20,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`wizard_progress_${session.user.id}`, JSON.stringify(progressData));
        }

        toast.success(`Step ${currentStep} skipped`);

        // Move to next step
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
            setCurrentInput({});
            setFieldErrors({});
        } else {
            setViewMode('dashboard');
        }
    };

    // Navigate to next step and save current input
    const handleNextStep = async () => {
        // Validate all fields have content before saving
        const validation = validateStepInputs();
        if (!validation.valid) {
            setFieldErrors(validation.errors);
            const fieldList = validation.emptyFields.slice(0, 3).join(', ');
            const moreFields = validation.emptyFields.length > 3 ? ` and ${validation.emptyFields.length - 3} more` : '';
            toast.error(`Please fill in required fields: ${fieldList}${moreFields}`);
            return;
        }

        // Clear field errors if validation passed
        setFieldErrors({});

        // Save current input to stepData
        const updatedData = {
            ...stepData,
            ...currentInput
        };
        setStepData(updatedData);
        const newCompletedSteps = [...new Set([...completedSteps, currentStep])];
        setCompletedSteps(newCompletedSteps);

        // Immediately save to localStorage (guaranteed, even if preview fails)
        if (session) {
            const progressData = {
                currentStep: currentStep < STEPS.length ? currentStep + 1 : currentStep,
                viewMode: 'step',
                completedSteps: newCompletedSteps,
                answers: updatedData,
                generatedContent: savedContent,
                isComplete: newCompletedSteps.length >= 20,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`wizard_progress_${session.user.id}`, JSON.stringify(progressData));
        }

        toast.success(`Step ${currentStep} saved!`);

        // Generate content preview
        setGeneratingPreview(true);
        try {
            // Session is available from useAuth hook
            if (session) {
                const res = await fetchWithAuth("/api/os/generate", {
                    method: "POST",
                    body: JSON.stringify({
                        step: 'preview',
                        data: updatedData,
                        completedSteps: newCompletedSteps.length
                    }),
                });

                const data = await res.json();
                if (!data.error && data.result) {
                    setPreviewContent(data.result);

                    // Save the preview content for this step
                    const newSavedContent = {
                        ...savedContent,
                        [`step${currentStep}`]: data.result
                    };
                    setSavedContent(newSavedContent);

                    setShowContentPreview(true);

                    // Calculate next step (clamp to max steps)
                    const nextStep = currentStep < STEPS.length ? currentStep + 1 : currentStep;

                    // Save progress to localStorage and Supabase
                    await saveProgressToStorage(
                        newCompletedSteps,
                        updatedData,
                        newSavedContent,
                        { currentStep: nextStep }
                    );
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGeneratingPreview(false);
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
            setCurrentInput({});
        }
    };

    // Handle "Changed my mind" - enter edit mode for a completed step
    const handleChangedMyMind = (stepId) => {
        setIsEditMode(true);
        setEditingStep(stepId);
        setCurrentStep(stepId);

        // Load saved answers for this step
        const stepInputs = STEP_INPUTS[stepId];
        if (stepInputs) {
            const loadedInput = {};
            stepInputs.forEach(input => {
                if (stepData[input.name]) {
                    loadedInput[input.name] = stepData[input.name];
                }
            });
            setCurrentInput(loadedInput);
        }

        setViewMode('step');
        toast.info("Edit your answer. Changes will update all related content.");
    };

    // Handle cascade update after editing a previous step
    const handleCascadeUpdate = async () => {
        setIsUpdatingCascade(true);
        try {
            if (!session) return;

            // Update the answers with edited content
            const updatedData = {
                ...stepData,
                ...currentInput
            };
            setStepData(updatedData);

            // Find steps that need to be regenerated (all steps after the edited one)
            const affectedSteps = completedSteps.filter(s => s > editingStep);

            // For now, regenerate the preview for the current step
            const res = await fetchWithAuth("/api/os/generate", {
                method: "POST",
                body: JSON.stringify({
                    step: 'preview',
                    data: updatedData,
                    completedSteps: editingStep
                }),
            });

            const data = await res.json();

            // Update saved content
            const newSavedContent = {
                ...savedContent,
                [`step${editingStep}`]: data.result
            };

            // Clear affected steps' content so they regenerate
            affectedSteps.forEach(step => {
                delete newSavedContent[`step${step}`];
            });

            setSavedContent(newSavedContent);

            // Save to localStorage and Supabase
            const resumeStep = Math.min(completedSteps.length + 1, STEPS.length);
            await saveProgressToStorage(
                completedSteps,
                updatedData,
                newSavedContent,
                { currentStep: resumeStep }
            );

            toast.success("Answer updated! Related content will regenerate.");
            setIsEditMode(false);
            setEditingStep(null);
            handleBackToDashboard();

        } catch (error) {
            console.error(error);
            toast.error("Failed to update. Please try again.");
        } finally {
            setIsUpdatingCascade(false);
        }
    };

    const handleApprove = async () => {
        try {
            if (!session) {
                toast.error("You must be logged in.");
                return;
            }

            console.log('[OSWizard] Approving content with', Object.keys(generatedContent || {}).length, 'sections');

            // Call approve API to save to database
            const approveRes = await fetchWithAuth("/api/os/approve", {
                method: "POST",
                body: JSON.stringify({ step: 'all', content: generatedContent }),
            });

            const approveData = await approveRes.json();
            if (approveData.error) {
                throw new Error(approveData.error);
            }

            console.log('[OSWizard] Content approved and saved to database');

            // Save final progress to localStorage and database
            await saveProgressToStorage(
                completedSteps,
                stepData,
                { ...savedContent, final: generatedContent },
                { currentStep: 20, isComplete: true }
            );

            // Ensure the active session flag is set for results page
            localStorage.setItem('ted_has_active_session', 'true');
            localStorage.setItem('ted_results_source', JSON.stringify({
                type: 'current',
                name: 'Current Session'
            }));

            toast.success("All content saved! Redirecting to results...");

            // Wait a brief moment before redirecting to ensure all saves are complete
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('[OSWizard] Redirecting to /results');
            router.push("/results");
        } catch (error) {
            console.error('[OSWizard] Approve error:', error);
            toast.error("Failed to save. Please try again.");
        }
    };

    // DEBUG: Log viewMode on every render
    console.log('[DEBUG RENDER] Current viewMode:', viewMode, 'currentStep:', currentStep, 'isLoading:', isLoading);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Processing Animation Overlay
    if (showProcessingAnimation) {
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
                        transition={{ delay: 0.5 }}
                        className="text-gray-400 text-sm"
                    >
                        Building your complete marketing system. This may take a few moments...
                    </motion.p>

                    {/* Floating particles effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * 100 + "%",
                                    y: "110%",
                                    opacity: 0.3
                                }}
                                animate={{
                                    y: "-10%",
                                    opacity: [0.3, 0.8, 0.3]
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2
                                }}
                                className="absolute w-1 h-1 bg-cyan rounded-full"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Mission Control View
    if (viewMode === 'dashboard') {
        // User is first-time if they have no completed steps AND no saved sessions
        const isFirstTimeUser = completedSteps.length === 0 && savedSessions.length === 0;


        return (
            <div className="min-h-[calc(100vh-5rem)] bg-[#0e0e0f] text-white">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Dashboard header - same for all users */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center relative"
                    >
                        {/* Background subtle glow for header */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-cyan/5 blur-3xl rounded-full -z-10"></div>

                        <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
                            Mission Control
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                            {isFirstTimeUser
                                ? "Start building your business — click any section below to begin"
                                : completedSteps.length === STEPS.length
                                    ? "All steps complete! View your results or make changes below."
                                    : `Continue building your business — ${completedSteps.length}/${STEPS.length} steps completed`
                            }
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-gray-400">Completed ({completedSteps.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyan"></div>
                                <span className="text-gray-400">Unlocked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                                <span className="text-gray-400">Locked</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action buttons - visible for all users */}
                    <div className="mt-8 flex justify-center gap-4">
                        {/* Start/Continue button */}
                        {!isWizardComplete && (
                            <button
                                onClick={() => router.push("/intake_form")}
                                className="px-6 py-3 bg-cyan hover:brightness-110 text-black rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan/20"
                            >
                                <ArrowRight className="w-5 h-5" /> {isFirstTimeUser ? "Start Questionnaire" : "Continue"}
                            </button>
                        )}

                        {isWizardComplete && (
                            <button
                                onClick={() => router.push("/results")}
                                className="px-6 py-3 bg-cyan hover:brightness-110 text-black rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan/20"
                            >
                                <Eye className="w-5 h-5" /> View Current Results
                            </button>
                        )}

                        {/* Manage Data Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowManageDataDropdown(!showManageDataDropdown)}
                                className="px-6 py-3 bg-[#1b1b1d] hover:bg-[#252528] border border-[#2a2a2d] rounded-lg font-semibold flex items-center gap-2 transition-all"
                            >
                                <Settings className="w-5 h-5 text-cyan" />
                                Manage Data
                                <ChevronDown className={`w-4 h-4 transition-transform ${showManageDataDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showManageDataDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg shadow-xl z-50 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            handleReset();
                                            setShowManageDataDropdown(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-red-600/10 hover:text-red-400 transition-all"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset / New Business
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSaveModal(true);
                                            setShowManageDataDropdown(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-green-600/10 hover:text-green-400 transition-all"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Session
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSavedSessions(!showSavedSessions);
                                            if (!showSavedSessions) fetchSavedSessions();
                                            setShowManageDataDropdown(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-cyan/10 hover:text-cyan transition-all"
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                        Load Saved Session
                                    </button>

                                    {/* Edit Current Session - only when wizard is complete */}
                                    {isWizardComplete && (
                                        <button
                                            onClick={() => {
                                                setIsWizardComplete(false); // Unlock editing
                                                setShowManageDataDropdown(false);
                                                toast.success("Session unlocked! You can now edit your answers and regenerate content.");
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-yellow-600/10 hover:text-yellow-400 transition-all border-t border-[#2a2a2d]"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Edit Current Session
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Save Session Modal */}
                    <AnimatePresence>
                        {showSaveModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-2xl p-6 w-full max-w-md"
                                >
                                    <h3 className="text-xl font-bold mb-4">Save Current Session</h3>
                                    <p className="text-gray-400 mb-4">Give your session a name to easily identify it later.</p>

                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        placeholder="e.g., Fitness Coach Marketing Plan"
                                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan mb-6"
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowSaveModal(false)}
                                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveSession}
                                            disabled={isSavingSession}
                                            className="flex-1 px-4 py-3 bg-cyan hover:brightness-110 text-black rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSavingSession ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" /> Save
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Saved Sessions List */}
                    {
                        showSavedSessions && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-8"
                            >
                                <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <FolderOpen className="w-5 h-5 text-cyan" />
                                        Saved Sessions
                                    </h3>

                                    {loadingSessions ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 text-cyan animate-spin" />
                                        </div>
                                    ) : savedSessions.length === 0 ? (
                                        <p className="text-gray-400 text-center py-8">
                                            No saved sessions yet. Save your current progress to see it here.
                                        </p>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {savedSessions.map((session) => {
                                                const stepsCompleted = session.completed_steps?.length || 0;
                                                const totalSteps = 20;
                                                const progressPercent = (stepsCompleted / totalSteps) * 100;
                                                const isAllComplete = stepsCompleted >= totalSteps;
                                                const businessName = session.answers?.businessName || session.answers?.business_name || '';

                                                return (
                                                    <div
                                                        key={session.id}
                                                        className="p-4 bg-[#0e0e0f] rounded-lg border border-[#2a2a2d] hover:border-cyan/50 transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-white">{session.session_name}</h4>
                                                                    {isAllComplete && (
                                                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                                                                            <CheckCircle className="w-3 h-3" /> Complete
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {businessName && (
                                                                    <p className="text-sm text-cyan mb-1">{businessName}</p>
                                                                )}
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(session.updated_at || session.created_at).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleLoadSession(session)}
                                                                    className="px-4 py-2 bg-cyan hover:brightness-110 text-black rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                                                >
                                                                    <FolderOpen className="w-4 h-4" /> Load
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSession(session.id)}
                                                                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg text-sm font-medium transition-all"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-400">Progress</span>
                                                                <span className={isAllComplete ? 'text-green-400 font-medium' : 'text-gray-400'}>
                                                                    {stepsCompleted}/{totalSteps} sections
                                                                </span>
                                                            </div>
                                                            <div className="h-2 bg-[#2a2a2d] rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${isAllComplete ? 'bg-green-500' : 'bg-cyan'}`}
                                                                    style={{ width: `${progressPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    }

                    {/* Step Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {STEPS.map((step, index) => {
                            const status = getStepStatus(step.id);
                            const Icon = step.icon;

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <button
                                        onClick={() => !isWizardComplete && handleStepClick(step.id)}
                                        disabled={status === 'locked' || isWizardComplete}
                                        className={`
                                            w-full p-6 rounded-2xl border transition-all duration-300 text-left glass-card
                                            ${status === 'completed' && isWizardComplete
                                                ? 'border-green-600/50 opacity-80'
                                                : status === 'completed'
                                                    ? 'border-green-600/50 hover:border-green-500 hover:shadow-lg hover:shadow-green-900/20'
                                                    : status === 'unlocked'
                                                        ? 'border-cyan/30 hover:border-cyan hover:shadow-glow-cyan'
                                                        : 'border-white/5 opacity-50 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`
                                                p-3 rounded-xl
                                                ${status === 'completed' ? 'bg-green-600/20' : status === 'unlocked' ? 'bg-cyan/10' : 'bg-gray-700/50'}
                                            `}>
                                                <Icon className={`w-6 h-6 ${status === 'completed' ? 'text-green-500' : status === 'unlocked' ? 'text-cyan' : 'text-gray-500'}`} />
                                            </div>
                                            {/* Show green lock when wizard complete with content, otherwise show appropriate icon */}
                                            {status === 'completed' && isWizardComplete ? (
                                                <div className="flex items-center gap-1">
                                                    <Lock className="w-5 h-5 text-green-500" />
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                </div>
                                            ) : status === 'completed' ? (
                                                <CheckCircle className="w-6 h-6 text-green-500" />
                                            ) : status === 'locked' ? (
                                                <Lock className="w-5 h-5 text-gray-600" />
                                            ) : null}
                                        </div>

                                        <h3 className={`font-bold text-lg mb-1 ${status === 'completed' ? 'text-green-400' : status === 'unlocked' ? 'text-white' : 'text-gray-500'}`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm">{step.description}</p>

                                        {/* Only show "Changed my mind" when NOT complete (content not generated yet) */}
                                        {status === 'completed' && !isWizardComplete && (
                                            <div className="mt-4 pt-3 border-t border-green-600/30">
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsEditMode(true);
                                                        setEditingStep(step.id);
                                                        handleStepClick(step.id);
                                                    }}
                                                    className="w-full py-2 px-3 bg-cyan/10 hover:bg-cyan/20 text-cyan hover:text-cyan rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    Changed my mind
                                                </div>
                                            </div>
                                        )}
                                    </button>

                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Guard: Ensure currentStep is valid before rendering step view
    if (!currentStep || currentStep < 1 || currentStep > STEPS.length) {
        console.warn('[OSWizard] Invalid currentStep:', currentStep, '- showing loading');
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Step View with Sidebar
    const CurrentIcon = STEPS[currentStep - 1].icon;

    return (
        <div className="h-[calc(100vh-5rem)] bg-[#0e0e0f] text-white font-sans flex overflow-hidden">
            {/* Sidebar - Hidden in intake mode for linear question flow */}
            <AnimatePresence>
                {isSidebarOpen && mode !== 'intake' && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className="w-80 bg-[#131314] border-r border-[#1b1b1d] flex flex-col"
                    >
                        <div className="p-6 border-b border-[#1b1b1d]">
                            <button
                                onClick={handleBackToDashboard}
                                className="text-sm text-gray-400 hover:text-white flex items-center gap-2 mb-4"
                            >
                                <ChevronLeft className="w-4 h-4" /> Mission Control
                            </button>
                            <h2 className="text-xl font-bold">Steps</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {STEPS.map((step) => {
                                const status = getStepStatus(step.id);
                                const Icon = step.icon;
                                const isActive = currentStep === step.id;

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => status !== 'locked' && handleStepClick(step.id)}
                                        disabled={status === 'locked'}
                                        className={`
                                            w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 border border-transparent
                                            ${isActive
                                                ? 'bg-cyan text-black shadow-lg shadow-cyan/20'
                                                : status === 'completed'
                                                    ? 'bg-green-600/5 text-green-400 hover:bg-green-600/10 hover:border-green-600/30'
                                                    : status === 'unlocked'
                                                        ? 'bg-[#1b1b1d] text-gray-300 hover:bg-[#252528] hover:border-white/10'
                                                        : 'bg-[#1b1b1d] text-gray-600 cursor-not-allowed opacity-50'
                                            }
                                        `}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm font-bold flex-1 tracking-tight">{step.title}</span>
                                        {status === 'completed' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                                        {status === 'locked' && <Lock className="w-4 h-4 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Sidebar Button - Hidden in intake mode for linear flow */}
            {mode !== 'intake' && (
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="fixed left-4 top-20 z-30 bg-[#1b1b1d] p-2 rounded-lg border border-[#2a2a2d] hover:bg-[#2a2a2d] transition-colors"
                >
                    {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
            )}

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className={`flex-1 overflow-y-auto p-8 transition-all duration-500 ${isReviewMode ? 'lg:w-[60%]' : 'w-full'}`}>
                    <div className="max-w-3xl mx-auto pt-8">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Header with Progress Bar */}
                            <div className="mb-8">
                                {/* NEW: Question Progress Bar for single-question UX */}
                                <QuestionProgressBar
                                    currentStep={currentStep}
                                    completedSteps={completedSteps}
                                />

                                <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center gap-3 tracking-tighter">
                                    {STEPS[currentStep - 1].title}
                                    {STEPS[currentStep - 1].optional && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-normal">Optional</span>
                                    )}
                                </h1>
                                <p className="text-gray-400 text-lg font-light leading-relaxed">{STEPS[currentStep - 1].description}</p>
                            </div>

                            {/* Info Box removed */}

                            {/* Input Fields */}
                            <div className="space-y-8 glass-card p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                                {/* Interactive glow effect in the corner */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/5 blur-3xl rounded-full pointer-events-none"></div>
                                {STEP_INPUTS[currentStep]?.filter((input) => {
                                    // Hide conditional fields if their condition isn't met
                                    if (input.conditionalOn) {
                                        const parentValue = currentInput[input.conditionalOn] || [];
                                        return parentValue.includes(input.conditionalValue);
                                    }
                                    return true;
                                }).map((input, idx) => (
                                    <div key={input.name}>
                                        {/* Help button for additional context */}
                                        {input.helpText && (
                                            <div className="flex justify-end mb-2">
                                                <button
                                                    onClick={() => setShowHelpFor(showHelpFor === input.name ? null : input.name)}
                                                    className="text-cyan hover:text-cyan transition-colors text-sm flex items-center gap-1"
                                                    type="button"
                                                >
                                                    <Info className="w-4 h-4" />
                                                    <span>Help</span>
                                                </button>
                                            </div>
                                        )}

                                        {showHelpFor === input.name && input.helpText && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-3 p-4 bg-cyan/10 border border-cyan/30 rounded-lg"
                                            >
                                                <p className="text-sm text-cyan leading-relaxed">
                                                    {input.helpText}
                                                </p>
                                            </motion.div>
                                        )}

                                        <div className="space-y-2">
                                            {/* Field Label with Optional Badge - Only show if not the first primary input */}
                                            {idx > 0 && (
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    {input.label}
                                                    {input.optional && (
                                                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Optional</span>
                                                    )}
                                                </label>
                                            )}

                                            {/* Render based on input type */}
                                            {input.type === 'select' ? (
                                                /* Select dropdown */
                                                <select
                                                    className={`w-full bg-[#0e0e0f] border rounded-lg p-4 text-white focus:ring-2 focus:ring-cyan focus:border-transparent outline-none transition-all cursor-pointer ${fieldErrors[input.name] ? 'border-red-500' : 'border-[#2a2a2d]'
                                                        }`}
                                                    value={currentInput[input.name] || ""}
                                                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                                                >
                                                    <option value="" className="text-gray-500">{input.placeholder}</option>
                                                    {(input.options === 'REVENUE_OPTIONS' ? REVENUE_OPTIONS :
                                                        input.options === 'BUSINESS_STAGE_OPTIONS' ? BUSINESS_STAGE_OPTIONS :
                                                            []).map(option => (
                                                                <option key={option.value} value={option.value} className="bg-[#0e0e0f]">
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                </select>
                                            ) : input.type === 'multiselect' ? (
                                                /* Multi-select checkboxes */
                                                <div className={`bg-[#0e0e0f] border rounded-lg p-4 ${fieldErrors[input.name] ? 'border-red-500' : 'border-[#2a2a2d]'
                                                    }`}>
                                                    <p className="text-gray-400 text-sm mb-3">{input.placeholder}</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {(input.options === 'ASSET_OPTIONS' ? ASSET_OPTIONS :
                                                            input.options === 'PLATFORM_OPTIONS' ? PLATFORM_OPTIONS :
                                                                []).map(option => {
                                                                    const selectedValues = currentInput[input.name] || [];
                                                                    const isSelected = selectedValues.includes(option.value);
                                                                    return (
                                                                        <label
                                                                            key={option.value}
                                                                            className={`
                                                                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                                                                        ${isSelected
                                                                                    ? 'bg-cyan/20 border border-cyan/50 text-cyan'
                                                                                    : 'bg-[#1b1b1d] border border-[#2a2a2d] text-gray-300 hover:border-gray-500'
                                                                                }
                                                                    `}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={(e) => {
                                                                                    const newValues = e.target.checked
                                                                                        ? [...selectedValues, option.value]
                                                                                        : selectedValues.filter(v => v !== option.value);
                                                                                    handleInputChange(input.name, newValues);
                                                                                }}
                                                                                className="w-4 h-4 accent-cyan"
                                                                            />
                                                                            <span className="text-sm font-medium">{option.label}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                    </div>
                                                    {/* Show "Other" text input if other is selected */}
                                                    {input.hasOtherInput && (currentInput[input.name] || []).includes('other') && (
                                                        <div className="mt-4">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan focus:border-transparent outline-none transition-all"
                                                                placeholder="Specify other platforms..."
                                                                value={currentInput[`${input.name}Other`] || ""}
                                                                onChange={(e) => handleInputChange(`${input.name}Other`, e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Default textarea */
                                                <>
                                                    <textarea
                                                        className={`w-full bg-[#0e0e0f] border rounded-lg p-4 text-white focus:ring-2 focus:ring-cyan focus:border-transparent outline-none transition-all resize-y leading-relaxed whitespace-pre-wrap overflow-y-auto ${fieldErrors[input.name] ? 'border-red-500' : 'border-[#2a2a2d]'
                                                            }`}
                                                        placeholder={input.placeholder}
                                                        value={currentInput[input.name] || input.defaultValue || ""}
                                                        onChange={(e) => {
                                                            handleInputChange(input.name, e.target.value);
                                                            // Auto-expand based on content up to max
                                                            const minHeight = (input.rows || 5) * 28;
                                                            const maxHeight = 400;
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = Math.min(maxHeight, Math.max(minHeight, e.target.scrollHeight)) + 'px';
                                                        }}
                                                        rows={input.rows || 5}
                                                        style={{
                                                            minHeight: `${(input.rows || 5) * 28}px`,
                                                            maxHeight: '400px'
                                                        }}
                                                    />
                                                </>
                                            )}

                                            {/* Validation Error Message */}
                                            {fieldErrors[input.name] && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-red-500 text-sm mt-1 flex items-center gap-1"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {fieldErrors[input.name]}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4 flex gap-3">
                                    {isEditMode ? (
                                        /* Edit mode buttons */
                                        <>
                                            <button
                                                onClick={handleBackToDashboard}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleCascadeUpdate}
                                                disabled={isUpdatingCascade}
                                                className="flex-1 bg-cyan hover:brightness-110 text-black px-6 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-cyan/30"
                                            >
                                                {isUpdatingCascade ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-5 h-5" />
                                                        Update & Regenerate
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : currentStep < STEPS.length ? (
                                        <div className="flex justify-between items-center w-full gap-3">
                                            {/* Polish with AI Button - Left side */}
                                            <button
                                                onClick={() => {
                                                    const stepInputs = STEP_INPUTS[currentStep];
                                                    if (stepInputs && stepInputs[0]) {
                                                        handleAiAssist(stepInputs[0].name, stepInputs[0].label);
                                                    }
                                                }}
                                                disabled={aiAssisting}
                                                type="button"
                                                className="bg-cyan/20 hover:bg-cyan/30 text-cyan px-5 py-3 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                {aiAssisting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4" />
                                                )}
                                                Polish with AI
                                            </button>

                                            {/* Right side buttons */}
                                            <div className="flex items-center gap-3">
                                                {/* Skip Button - REMOVED for linear flow (TedOS UX overhaul) */}
                                                {/* Users must answer all questions in order */}

                                                {/* Next Step Button */}
                                                <button
                                                    onClick={handleNextStep}
                                                    disabled={generatingPreview}
                                                    className="bg-cyan hover:brightness-110 text-black px-8 py-3.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg shadow-cyan/25 disabled:opacity-50 btn-premium"
                                                >
                                                    {generatingPreview ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Next <ArrowRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className="flex-1 bg-gradient-to-r from-cyan to-blue-500 hover:brightness-110 text-black px-8 py-5 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan/30 btn-premium"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Generating All Assets...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Generate My Business Core
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* AI Output Panel */}
                <AnimatePresence>
                    {isReviewMode && generatedContent && (
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full lg:w-[40%] border-l border-[#1b1b1d] bg-[#131314] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-[#1b1b1d] flex justify-between items-center sticky top-0 bg-[#131314]/95 backdrop-blur z-20">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    AI Generated Result
                                </h3>
                            </div>

                            {/* Warning Message */}
                            <div className="mx-6 mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-yellow-500 font-semibold text-sm mb-1">
                                        Important: Save Your Data!
                                    </p>
                                    <p className="text-yellow-200/80 text-sm leading-relaxed">
                                        Please click "Approve" to save your generated content before leaving this page.
                                        If you exit without saving, all your generated content will be lost.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {formatContentForDisplay(generatedContent).map(({ key, value }, index) => (
                                    <div key={`${key}-${index}`} className="space-y-3">
                                        <h4 className="text-sm font-bold text-cyan uppercase tracking-wide flex items-center gap-2">
                                            <div className="w-1 h-4 bg-cyan rounded-full"></div>
                                            {key}
                                        </h4>
                                        <div className="bg-[#0e0e0f] p-5 rounded-xl border border-[#2a2a2d] hover:border-[#3a3a3d] transition-colors">
                                            <p className="text-gray-200 whitespace-pre-wrap text-base leading-relaxed font-normal">
                                                {value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 border-t border-[#1b1b1d] bg-[#131314] sticky bottom-0 z-20 flex gap-3">
                                <button
                                    onClick={handleGenerate}
                                    className="flex-1 py-3 rounded-lg font-medium text-gray-300 hover:bg-[#1b1b1d] border border-[#2a2a2d] transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Regenerate
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Suggestions Modal */}
            <AnimatePresence>
                {showSuggestionsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSuggestionsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-cyan" />
                                Choose a Suggestion
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">Click on any suggestion to use it</p>

                            <div className="space-y-3">
                                {aiSuggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectSuggestion(suggestion)}
                                        className="w-full p-4 text-left bg-[#0e0e0f] hover:bg-cyan/10 border border-[#2a2a2d] hover:border-cyan/50 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan text-sm font-bold flex items-center justify-center flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <p className="text-gray-300 group-hover:text-white transition-colors">
                                                {suggestion}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowSuggestionsModal(false)}
                                className="mt-6 w-full py-3 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Preview Modal */}
            <AnimatePresence>
                {showContentPreview && previewContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowContentPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {previewContent.title || "Content Preview"}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        Step {previewContent.stepsCompleted || completedSteps.length} completed
                                    </p>
                                </div>
                            </div>

                            <p className="text-cyan text-sm mb-6 pl-[52px]">
                                ✨ AI generated this based on your answers
                            </p>

                            <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto">
                                {previewContent.content ? (
                                    // Handle nested structure like { idealClient: {...} }
                                    Object.entries(previewContent.content).map(([mainKey, mainValue]) => (
                                        <div key={mainKey}>
                                            <h4 className="text-lg font-bold text-cyan mb-3 capitalize">
                                                {mainKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                            </h4>

                                            {typeof mainValue === 'object' && mainValue !== null && !Array.isArray(mainValue) ? (
                                                <div className="space-y-3">
                                                    {Object.entries(mainValue).map(([sectionKey, sectionValue]) => (
                                                        <div key={sectionKey} className="p-4 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl">
                                                            <h5 className="text-cyan font-semibold mb-2 capitalize text-sm">
                                                                {sectionKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                                            </h5>

                                                            {typeof sectionValue === 'object' && !Array.isArray(sectionValue) ? (
                                                                <div className="space-y-1">
                                                                    {Object.entries(sectionValue).map(([k, v]) => (
                                                                        <div key={k} className="flex">
                                                                            <span className="text-gray-500 text-xs uppercase w-32 flex-shrink-0">
                                                                                {k.replace(/([A-Z])/g, ' $1').trim()}:
                                                                            </span>
                                                                            <span className="text-gray-200 text-sm">
                                                                                {Array.isArray(v) ? v.join(', ') : String(v)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : Array.isArray(sectionValue) ? (
                                                                <ul className="space-y-2">
                                                                    {sectionValue.map((item, i) => (
                                                                        <li key={i} className="text-gray-300 text-sm">
                                                                            {typeof item === 'object' ? (
                                                                                <div className="p-2 bg-[#1b1b1d] rounded border border-[#2a2a2d]">
                                                                                    {item.title && <p className="font-semibold text-white">{item.title}</p>}
                                                                                    {item.name && <p className="font-semibold text-white">{item.name}</p>}
                                                                                    {item.description && <p className="text-gray-400 text-xs mt-1">{item.description}</p>}
                                                                                    {item.elementType && <p className="text-cyan text-xs">{item.elementType}</p>}
                                                                                    {!item.title && !item.name && !item.description && !item.elementType && (
                                                                                        <p>{JSON.stringify(item)}</p>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <span>• {item}</span>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-gray-300 text-sm">{String(sectionValue)}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : Array.isArray(mainValue) ? (
                                                <ul className="space-y-2">
                                                    {mainValue.map((item, i) => (
                                                        <li key={i} className="text-gray-300 text-sm">
                                                            {typeof item === 'object' ? (
                                                                <div className="p-2 bg-[#1b1b1d] rounded border border-[#2a2a2d]">
                                                                    {item.title && <p className="font-semibold text-white">{item.title}</p>}
                                                                    {item.name && <p className="font-semibold text-white">{item.name}</p>}
                                                                    {item.description && <p className="text-gray-400 text-xs mt-1">{item.description}</p>}
                                                                    {item.elementType && <p className="text-cyan text-xs">{item.elementType}</p>}
                                                                    {!item.title && !item.name && !item.description && !item.elementType && (
                                                                        <p>{JSON.stringify(item)}</p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span>• {item}</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-300 text-sm">{String(mainValue)}</p>
                                            )}
                                        </div>
                                    ))
                                ) : previewContent.preview ? (
                                    // Fallback for unlocked: false
                                    <div className="p-6 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-center">
                                        <p className="text-gray-400">{previewContent.preview.message}</p>
                                    </div>
                                ) : (
                                    // Legacy structure
                                    <div className="text-center py-8">
                                        <p className="text-gray-400">No preview available yet. Complete more questions to see content.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowContentPreview(false);
                                        generateContentPreview();
                                    }}
                                    className="flex-1 py-3 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg text-gray-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Regenerate
                                </button>
                                <button
                                    onClick={() => setShowContentPreview(false)}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve & Continue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
