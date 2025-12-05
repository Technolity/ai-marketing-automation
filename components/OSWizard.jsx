"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, CheckCircle, Lock, RefreshCw, ArrowRight, Sparkles,
    ChevronLeft, Menu, X, Info, History, Eye, Trash2, Save, FolderOpen, RotateCcw,
    ChevronDown, Settings
} from "lucide-react";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { STEPS, STEP_INPUTS, STEP_INFO } from "@/lib/os-wizard-data";

// Helper function to format field names into readable titles
const formatFieldName = (key) => {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

// Helper function to recursively format nested objects/arrays
const formatValue = (value, depth = 0) => {
    if (value === null || value === undefined) {
        return '';
    }

    if (Array.isArray(value)) {
        // Handle array of objects (like email sequence, program modules)
        if (value.length > 0 && typeof value[0] === 'object') {
            return value.map((item, idx) => {
                const itemContent = Object.entries(item).map(([k, v]) => {
                    return `${formatFieldName(k)}: ${formatValue(v, depth + 1)}`;
                }).join('\n');
                return `${idx + 1}.\n${itemContent}`;
            }).join('\n\n');
        }
        // Handle array of strings
        return value.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
    }

    if (typeof value === 'object') {
        // Recursively format nested objects
        return Object.entries(value).map(([k, v]) => {
            const formattedKey = formatFieldName(k);
            const formattedValue = formatValue(v, depth + 1);
            if (depth === 0) {
                return `${formattedKey}:\n${formattedValue}`;
            }
            return `  ${formattedKey}: ${formattedValue}`;
        }).join('\n\n');
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




export default function OSWizard() {
    const supabase = createClientComponentClient();
    const router = useRouter();

    // View Management
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'step'
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentStep, setCurrentStep] = useState(null);

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

    // Load saved progress on mount
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push("/auth/login");
                    return;
                }

                // First, check localStorage for saved progress
                const localProgress = localStorage.getItem(`wizard_progress_${session.user.id}`);
                if (localProgress) {
                    const parsed = JSON.parse(localProgress);
                    setCompletedSteps(parsed.completedSteps || []);
                    setStepData(parsed.answers || {});
                    setSavedContent(parsed.generatedContent || {});

                    if (parsed.completedSteps && parsed.completedSteps.length > 0) {
                        toast.success(`Welcome back! You've completed ${parsed.completedSteps.length} steps.`);
                    }
                }

                // Also try Supabase (if table exists)
                try {
                    const res = await fetch("/api/os/progress", {
                        headers: {
                            "Authorization": `Bearer ${session.access_token}`
                        }
                    });

                    const data = await res.json();

                    if (data.exists && !data.useLocalStorage) {
                        setCompletedSteps(data.completedSteps || []);
                        setStepData(data.answers || {});
                        setSavedContent(data.generatedContent || {});

                        if (data.completedSteps && data.completedSteps.length > 0 && !localProgress) {
                            toast.success(`Welcome back! You've completed ${data.completedSteps.length} steps.`);
                        }
                    }
                } catch (apiError) {
                    console.log('Using localStorage for progress storage');
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Load progress error:', error);
                setIsLoading(false);
            }
        };

        loadProgress();
    }, [supabase, router]);

    // Save progress to both localStorage and API
    const saveProgressToStorage = async (newCompletedSteps, newAnswers, newContent, overrides = {}) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const progressData = {
                currentStep,
                completedSteps: newCompletedSteps,
                answers: newAnswers,
                generatedContent: newContent,
                isComplete: newCompletedSteps.length >= 12,
                updatedAt: new Date().toISOString(),
                ...overrides
            };

            // Always save to localStorage (guaranteed to work)
            localStorage.setItem(`wizard_progress_${session.user.id}`, JSON.stringify(progressData));

            // Also try to save to Supabase API
            try {
                await fetch("/api/os/progress", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`
                    },
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
        const status = getStepStatus(stepId);
        if (status === 'locked') {
            toast.error('Complete previous steps first');
            return;
        }

        setCurrentStep(stepId);
        setViewMode('step');
        setGeneratedContent(null);
        setIsReviewMode(false);

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

    // Handle back to dashboard
    const handleBackToDashboard = () => {
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch("/api/os/sessions", {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch("/api/os/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    sessionName,
                    currentStep,
                    completedSteps,
                    answers: stepData,
                    generatedContent: savedContent,
                    isComplete: completedSteps.length >= 12
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Session saved successfully!");
            setShowSaveModal(false);
            setSessionName("");
            fetchSavedSessions(); // Refresh list
        } catch (error) {
            console.error('Save session error:', error);
            toast.error("Failed to save session");
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
            setCurrentStep(null); // Go to dashboard
            setViewMode('dashboard');

            // Save to local storage and sync with main progress
            await saveProgressToStorage(
                sessionData.completed_steps || [],
                sessionData.answers || {},
                sessionData.generated_content || {},
                {
                    currentStep: sessionData.current_step || 1,
                    isComplete: sessionData.is_complete || false
                }
            );

            toast.success(`Loaded session: ${sessionData.session_name}`);
            setShowSavedSessions(false);
        } catch (error) {
            console.error('Load session error:', error);
            toast.error("Failed to load session");
        }
    };

    // Delete a saved session (soft delete - data kept for admin)
    const handleDeleteSession = async (sessionId) => {
        if (!confirm("⚠️ This will delete the whole data of this session for you.\n\nThis action cannot be undone. Are you sure you want to continue?")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`/api/os/sessions?id=${sessionId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });

            const data = await res.json();
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
            toast.error("Failed to delete session");
        }
    };


    // Reset / New Business - clears all progress and results
    const handleReset = async () => {
        if (!confirm("Are you sure? This will clear all current progress and generated content. Make sure you saved your session first!")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Clear state
            setCompletedSteps([]);
            setStepData({});
            setSavedContent({});
            setCurrentStep(null);
            setViewMode('dashboard');
            setIsEditMode(false);
            setEditingStep(null);
            setCurrentInput({});

            // Clear storage
            await saveProgressToStorage([], {}, {}, { currentStep: 1, isComplete: false });

            // Clear slide_results from database so Results page shows empty
            if (session) {
                await fetch('/api/os/reset', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    }
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
    };

    // Helper function to validate step inputs - checks all required fields have content
    const validateStepInputs = () => {
        const stepInputs = STEP_INPUTS[currentStep];
        if (!stepInputs) return { valid: true, emptyFields: [] };

        const emptyFields = [];
        stepInputs.forEach(input => {
            const value = currentInput[input.name] || '';
            // Check if field has at least one word (3+ characters)
            if (!value.trim() || value.trim().length < 3) {
                emptyFields.push(input.label);
            }
        });

        return {
            valid: emptyFields.length === 0,
            emptyFields
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in.");
                return;
            }

            const res = await fetch("/api/os/assist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Determine what can be generated based on completed steps
            const allData = { ...stepData, ...currentInput };

            const res = await fetch("/api/os/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in to generate content.");
                setIsGenerating(false);
                setShowProcessingAnimation(false);
                clearInterval(messageInterval);
                return;
            }

            // On step 12, generate ALL artifacts
            const payload = {
                step: 'all',
                data: {
                    ...stepData,
                    ...currentInput
                }
            };

            const res = await fetch("/api/os/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
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

    // Navigate to next step and save current input
    const handleNextStep = async () => {
        // Validate all fields have content before saving
        const validation = validateStepInputs();
        if (!validation.valid) {
            const fieldList = validation.emptyFields.slice(0, 3).join(', ');
            const moreFields = validation.emptyFields.length > 3 ? ` and ${validation.emptyFields.length - 3} more` : '';
            toast.error(`Please fill in all fields: ${fieldList}${moreFields}`);
            return;
        }

        // Save current input to stepData
        const updatedData = {
            ...stepData,
            ...currentInput
        };
        setStepData(updatedData);
        const newCompletedSteps = [...new Set([...completedSteps, currentStep])];
        setCompletedSteps(newCompletedSteps);

        toast.success(`Step ${currentStep} saved!`);

        // Generate content preview
        setGeneratingPreview(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const res = await fetch("/api/os/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`
                    },
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
            const { data: { session } } = await supabase.auth.getSession();
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
            const res = await fetch("/api/os/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in.");
                return;
            }

            await fetch("/api/os/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ step: 'all', content: generatedContent }),
            });

            // Save final progress
            await saveProgressToStorage(
                completedSteps,
                stepData,
                { ...savedContent, final: generatedContent },
                { currentStep: 12, isComplete: true }
            );

            toast.success("All content saved! Redirecting to results...");
            router.push("/results");
        } catch (error) {
            toast.error("Failed to save. Please try again.");
        }
    };

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
        return (
            <div className="min-h-screen bg-[#0e0e0f] text-white">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Mission Control
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Complete all 12 questions to generate your complete marketing system
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

                        <div className="mt-8 flex justify-center gap-4">
                            <button
                                onClick={() => router.push("/results")}
                                className="px-6 py-3 bg-cyan hover:brightness-110 text-black rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan/20"
                            >
                                <Eye className="w-5 h-5" /> View Current Results
                            </button>

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
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

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
                                                const totalSteps = 12;
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                        onClick={() => handleStepClick(step.id)}
                                        disabled={status === 'locked'}
                                        className={`
                                            w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left
                                            ${status === 'completed'
                                                ? 'bg-green-600/10 border-green-600 hover:border-green-500 hover:shadow-lg hover:shadow-green-900/20'
                                                : status === 'unlocked'
                                                    ? 'bg-[#1b1b1d] border-cyan/50 hover:border-cyan hover:shadow-lg hover:shadow-cyan/20'
                                                    : 'bg-[#1b1b1d] border-gray-700 opacity-50 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`
                                                p-3 rounded-xl
                                                ${status === 'completed'
                                                    ? 'bg-green-600/20'
                                                    : status === 'unlocked'
                                                        ? 'bg-cyan/20'
                                                        : 'bg-gray-700/20'
                                                }
                                            `}>
                                                <Icon className={`w-6 h-6 ${status === 'completed'
                                                    ? 'text-green-500'
                                                    : status === 'unlocked'
                                                        ? 'text-cyan'
                                                        : 'text-gray-500'
                                                    }`} />
                                            </div>

                                            {status === 'completed' && (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            )}
                                            {status === 'locked' && (
                                                <Lock className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>

                                        {step.dependencies.length > 0 && status === 'locked' && (
                                            <div className="mt-4 pt-4 border-t border-gray-700">
                                                <p className="text-xs text-gray-500">
                                                    Requires: {step.dependencies.map(d => `Step ${d}`).join(', ')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Changed my mind button for completed steps */}
                                        {status === 'completed' && (
                                            <div className="mt-4 pt-4 border-t border-gray-700">
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleChangedMyMind(step.id);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.stopPropagation();
                                                            handleChangedMyMind(step.id);
                                                        }
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
                </div >
            </div >
        );
    }

    // Step View with Sidebar
    const CurrentIcon = STEPS[currentStep - 1].icon;

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white font-sans flex">
            {/* Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
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
                                            w-full p-4 rounded-lg text-left transition-all flex items-center gap-3
                                            ${isActive
                                                ? 'bg-cyan text-black'
                                                : status === 'completed'
                                                    ? 'bg-green-600/10 text-green-400 hover:bg-green-600/20'
                                                    : status === 'unlocked'
                                                        ? 'bg-[#1b1b1d] text-gray-300 hover:bg-[#2a2a2d]'
                                                        : 'bg-[#1b1b1d] text-gray-600 cursor-not-allowed opacity-50'
                                            }
                                        `}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm font-medium flex-1">{step.title}</span>
                                        {status === 'completed' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                                        {status === 'locked' && <Lock className="w-4 h-4 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Sidebar Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed left-4 top-20 z-30 bg-[#1b1b1d] p-2 rounded-lg border border-[#2a2a2d] hover:bg-[#2a2a2d] transition-colors"
            >
                {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

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
                            {/* Header */}
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 text-cyan text-sm font-medium mb-4">
                                    <CurrentIcon className="w-4 h-4" />
                                    Step {currentStep} of {STEPS.length}
                                </div>
                                <h1 className="text-4xl font-bold mb-3">{STEPS[currentStep - 1].title}</h1>
                                <p className="text-gray-400 text-lg">{STEPS[currentStep - 1].description}</p>
                            </div>

                            {/* Info Box */}
                            <div className="mb-6 p-4 bg-cyan/10 border border-cyan/30 rounded-lg flex gap-3">
                                <Info className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-cyan mb-1">What is this?</h3>
                                    <p className="text-sm text-gray-300">{STEP_INFO[currentStep]}</p>
                                </div>
                            </div>

                            {/* Input Fields */}
                            <div className="space-y-6 bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-xl">
                                {STEP_INPUTS[currentStep]?.map((input) => (
                                    <div key={input.name}>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-300">
                                                {input.label}
                                            </label>
                                            {input.helpText && (
                                                <button
                                                    onClick={() => setShowHelpFor(showHelpFor === input.name ? null : input.name)}
                                                    className="text-cyan hover:text-cyan transition-colors"
                                                    type="button"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

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
                                            <textarea
                                                className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4 text-white focus:ring-2 focus:ring-cyan focus:border-transparent outline-none transition-all resize-y leading-relaxed whitespace-pre-wrap overflow-y-auto"
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
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleAiAssist(input.name, input.label)}
                                                    disabled={aiAssisting === input.name}
                                                    type="button"
                                                    className="bg-cyan/20 hover:bg-cyan/30 text-cyan px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    {aiAssisting === input.name ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="w-4 h-4" />
                                                    )}
                                                    Enhance with AI
                                                </button>
                                            </div>
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
                                        <button
                                            onClick={handleNextStep}
                                            disabled={generatingPreview}
                                            className="flex-1 bg-cyan hover:brightness-110 text-black px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan/20 disabled:opacity-50"
                                        >
                                            {generatingPreview ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    Next <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className="flex-1 bg-gradient-to-r from-cyan to-blue-500 hover:brightness-110 text-black px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan/30"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Generating All Assets...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Generate All Assets
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
                                                                <ul className="list-disc list-inside text-gray-300 text-sm space-y-0.5">
                                                                    {sectionValue.map((item, i) => (
                                                                        <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-gray-300 text-sm">{String(sectionValue)}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : Array.isArray(mainValue) ? (
                                                <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                                                    {mainValue.map((item, i) => (
                                                        <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
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
