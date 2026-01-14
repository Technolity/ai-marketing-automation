"use client";

/**
 * BuilderSetupStep Component
 * 
 * Special step 0 handler for OS Wizard that:
 * 1. Collects business name and optional phone
 * 2. Creates GHL sub-account via API
 * 3. Saves locationId to user profile
 * 4. Pre-fills business name for subsequent wizard steps
 */
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle, Building } from "lucide-react";

export default function BuilderSetupStep({
    currentInput,
    onInputChange,
    onComplete,
    existingBusinessName
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [setupStatus, setSetupStatus] = useState(null); // null, 'pending', 'already_setup'
    const [error, setError] = useState(null);
    const [detectedTimezone, setDetectedTimezone] = useState('America/New_York');

    // Detect timezone on mount
    useEffect(() => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setDetectedTimezone(tz || 'America/New_York');
        } catch (e) {
            // Fallback
        }
    }, []);

    // Check if user already has a GHL location
    useEffect(() => {
        const checkExistingSetup = async () => {
            try {
                const response = await fetch('/api/ghl/setup-location');
                const data = await response.json();

                if (data.isSetup) {
                    setSetupStatus('already_setup');
                    // Pre-fill the input
                    if (data.businessName && !currentInput.businessName) {
                        onInputChange('businessName', data.businessName);
                    }
                } else {
                    setSetupStatus('pending');
                    // Pre-fill from existing profile if available
                    if (existingBusinessName && !currentInput.businessName) {
                        onInputChange('businessName', existingBusinessName);
                    }
                }
            } catch (err) {
                console.error('[BuilderSetup] Status check failed:', err);
                setSetupStatus('pending');
            } finally {
                setIsCheckingStatus(false);
            }
        };

        checkExistingSetup();
    }, []);

    const handleSetupComplete = async () => {
        if (!currentInput.businessName || currentInput.businessName.trim().length < 2) {
            setError('Please enter your business name (at least 2 characters)');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/ghl/setup-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: currentInput.businessName.trim(),
                    phone: currentInput.phone || '',
                    timezone: detectedTimezone
                })
            });

            const data = await response.json();

            if (data.success || data.alreadyExists) {
                setSetupStatus('already_setup');
                // Call the parent completion handler
                if (onComplete) {
                    onComplete({
                        businessName: currentInput.businessName.trim(),
                        phone: currentInput.phone || '',
                        locationId: data.locationId
                    });
                }
            } else {
                setError(data.error || 'Failed to set up builder. Please try again.');
            }
        } catch (err) {
            console.error('[BuilderSetup] Error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isCheckingStatus) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
                <p className="text-text-secondary">Checking setup status...</p>
            </div>
        );
    }

    // Already setup - show success and allow continue
    if (setupStatus === 'already_setup') {
        return (
            <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-green-500 mb-1">Builder Already Set Up!</h3>
                        <p className="text-text-secondary">
                            Your marketing platform is connected. You can proceed to the next step.
                        </p>
                    </div>
                </div>

                <div className="bg-surface-light rounded-xl p-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Business Name
                    </label>
                    <p className="text-lg font-medium text-text">
                        {currentInput.businessName || 'Your Business'}
                    </p>
                </div>
            </div>
        );
    }

    // Setup form
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent/10 to-purple-500/10 rounded-xl p-6 border border-accent/20">
                <div className="flex items-center gap-3 mb-3">
                    <Building className="w-8 h-8 text-accent" />
                    <h3 className="text-xl font-semibold">Welcome to TedOS!</h3>
                </div>
                <p className="text-text-secondary">
                    Let's set up your marketing builder. This takes just a few seconds and unlocks all the AI-powered features.
                </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
                {/* Business Name */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={currentInput.businessName || ''}
                        onChange={(e) => onInputChange('businessName', e.target.value)}
                        placeholder="e.g., John's Marketing Agency, HealthCoach Pro..."
                        className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    />
                    <p className="text-xs text-text-muted mt-1">
                        This will be used throughout your marketing materials
                    </p>
                </div>

                {/* Phone (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Business Phone <span className="text-text-muted">(optional)</span>
                    </label>
                    <input
                        type="tel"
                        value={currentInput.phone || ''}
                        onChange={(e) => onInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    />
                </div>

                {/* Timezone Display */}
                <div className="text-sm text-text-muted">
                    <span className="text-text-secondary">Timezone:</span> {detectedTimezone}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSetupComplete}
                disabled={isSubmitting || !currentInput.businessName?.trim()}
                className="w-full py-4 bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Setting Up...
                    </>
                ) : (
                    'Complete Setup & Continue'
                )}
            </button>
        </div>
    );
}
