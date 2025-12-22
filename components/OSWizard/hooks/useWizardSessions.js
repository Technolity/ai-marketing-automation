/**
 * useWizardSessions Hook
 * 
 * Manages session save/load/delete operations.
 * Extracted from OSWizard.jsx for maintainability.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export function useWizardSessions({
    session,
    completedSteps,
    stepData,
    currentStep,
    currentInput,
    generatedContent,
    savedContent,
    isWizardComplete,
    setCompletedSteps,
    setStepData,
    setSavedContent,
    setGeneratedContent,
    setCurrentStep,
    setViewMode,
    setIsWizardComplete,
    setIsSessionSaved,
    setHasUnsavedProgress,
    setCurrentInput,
    saveProgressToStorage
}) {
    // ==========================================
    // SESSION MANAGEMENT STATE
    // ==========================================
    const [savedSessions, setSavedSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [showSavedSessions, setShowSavedSessions] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [sessionName, setSessionName] = useState("");
    const [isSavingSession, setIsSavingSession] = useState(false);

    // ==========================================
    // SESSION FUNCTIONS
    // ==========================================

    /**
     * Fetch all saved sessions from database
     */
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

    /**
     * Save current session with a name
     */
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
                    generatedContent: generatedContent || savedContent,
                    isComplete: completedSteps.length >= 20 && isWizardComplete
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Session saved successfully!");
            setShowSaveModal(false);
            setSessionName("");
            setIsSessionSaved(true);
            setHasUnsavedProgress(false);
            fetchSavedSessions();
        } catch (error) {
            console.error('Save session error:', error);
            toast.error("Failed to save session");
        } finally {
            setIsSavingSession(false);
        }
    };

    /**
     * Quick save progress with auto-generated name
     */
    const handleQuickSave = async () => {
        if (!session) return;

        setIsSavingSession(true);
        try {
            const autoName = `Progress - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

            const res = await fetchWithAuth("/api/os/sessions", {
                method: "POST",
                body: JSON.stringify({
                    sessionName: autoName,
                    currentStep,
                    completedSteps,
                    answers: { ...stepData, ...currentInput },
                    generatedContent: generatedContent || savedContent,
                    isComplete: false
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

    /**
     * Load a saved session
     */
    const handleLoadSession = async (sessionData) => {
        try {
            setCompletedSteps(sessionData.completed_steps || []);
            setStepData(sessionData.answers || {});
            setSavedContent(sessionData.generated_content || {});
            setGeneratedContent(sessionData.generated_content || {});
            setCurrentStep(null);
            setViewMode('dashboard');
            setIsWizardComplete(sessionData.is_complete || (sessionData.completed_steps?.length >= 20));

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

    /**
     * Delete a saved session (soft delete)
     */
    const handleDeleteSession = async (sessionId) => {
        if (!confirm("⚠️ This will delete the whole data of this session for you.\n\nThis action cannot be undone. Are you sure you want to continue?")) {
            return;
        }

        try {
            if (!session) {
                toast.error('Please log in again');
                return;
            }

            const res = await fetchWithAuth(`/api/os/sessions?id=${sessionId}`, {
                method: "DELETE"
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Session deleted successfully");
            fetchSavedSessions();

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

    /**
     * Reset / New Business - clears all progress
     */
    const handleReset = async () => {
        if (!confirm("Are you sure? This will clear all current progress and generated content. Make sure you saved your session first!")) return;

        try {
            setCompletedSteps([]);
            setStepData({});
            setSavedContent({});
            setCurrentStep(null);
            setViewMode('dashboard');
            setCurrentInput({});
            setIsWizardComplete(false);

            await saveProgressToStorage([], {}, {}, { currentStep: 1, isComplete: false });

            localStorage.removeItem('ted_has_active_session');
            localStorage.removeItem('ted_results_source');

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

    return {
        // State
        savedSessions,
        loadingSessions,
        showSavedSessions,
        setShowSavedSessions,
        showSaveModal,
        setShowSaveModal,
        sessionName,
        setSessionName,
        isSavingSession,

        // Functions
        fetchSavedSessions,
        handleSaveSession,
        handleQuickSave,
        handleLoadSession,
        handleDeleteSession,
        handleReset
    };
}
