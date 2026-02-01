/**
 * useDependencyUpdates Hook
 * 
 * Provides UI feedback when atomic dependency updates occur.
 * Uses toast notifications to inform users that related sections
 * have been automatically updated.
 * 
 * Usage in any field editor:
 * ```
 * import { useDependencyUpdates } from '@/lib/hooks/useDependencyUpdates';
 * 
 * // In component:
 * const { checkForUpdates, isChecking } = useDependencyUpdates(funnelId);
 * 
 * // After saving content:
 * await saveContent();
 * checkForUpdates();  // Will show toast if dependents were updated
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Section ID to friendly name mapping
const SECTION_NAMES = {
    idealClient: 'Ideal Client',
    message: 'Message',
    story: 'Story',
    offer: 'Offer',
    leadMagnet: 'Free Gift',
    vsl: 'VSL Script',
    funnelCopy: 'Funnel Copy',
    emails: 'Emails',
    sms: 'Text Messages',
    facebookAds: 'Facebook Ads',
    setterScript: 'Setter Script',
    salesScripts: 'Sales Scripts',
    bio: 'Bio',
    appointmentReminders: 'Appointment Reminders',
    colors: 'Brand Colors'
};

/**
 * Hook for tracking dependency updates
 */
export function useDependencyUpdates(funnelId) {
    const [isChecking, setIsChecking] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const timeoutRef = useRef(null);

    /**
     * Check for recent dependency updates and show toast notification
     */
    const checkForUpdates = useCallback(async () => {
        if (!funnelId) return;

        setIsChecking(true);

        try {
            // Small delay to let backend process complete
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await fetch(`/api/os/update-status?funnelId=${funnelId}`);

            if (!response.ok) {
                console.error('[useDependencyUpdates] Failed to check status:', response.status);
                return;
            }

            const data = await response.json();

            if (data.hasRecentUpdates && data.updates?.length > 0) {
                // Find updates from the last 30 seconds
                const recentThreshold = Date.now() - 30000;
                const recentUpdates = data.updates.filter(update => {
                    const updateTime = new Date(update.lastUpdate?.timestamp).getTime();
                    return updateTime > recentThreshold;
                });

                if (recentUpdates.length > 0) {
                    const sectionNames = recentUpdates
                        .map(u => SECTION_NAMES[u.sectionId] || u.sectionId)
                        .join(', ');

                    toast.success('Related sections updated', {
                        description: `Your changes have been applied to: ${sectionNames}`,
                        duration: 5000
                    });

                    setLastUpdate({
                        timestamp: Date.now(),
                        sections: recentUpdates.map(u => u.sectionId)
                    });
                }
            }
        } catch (error) {
            console.error('[useDependencyUpdates] Error checking updates:', error);
        } finally {
            setIsChecking(false);
        }
    }, [funnelId]);

    /**
     * Schedule an update check after a delay (prevents duplicate checks)
     */
    const scheduleCheck = useCallback((delayMs = 2000) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            checkForUpdates();
        }, delayMs);
    }, [checkForUpdates]);

    return {
        checkForUpdates,
        scheduleCheck,
        isChecking,
        lastUpdate
    };
}

export default useDependencyUpdates;
