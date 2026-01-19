'use client';

import { useState } from 'react';
import { Rocket, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

/**
 * Push to GHL Button Component
 * Shows rocket icon button that pushes section content to GHL custom values
 * 
 * @param {string} section - 'funnelCopy', 'colors', 'emails', 'sms', 'media'
 * @param {string} funnelId - Current funnel ID
 * @param {boolean} isApproved - Whether section is approved (only show if approved)
 * @param {boolean} isVaultComplete - For colors section, only show after all phases approved
 */
export default function PushToGHLButton({
    section,
    funnelId,
    isApproved = false,
    isVaultComplete = false,
    label = 'Push to Builder'
}) {
    const [isPushing, setIsPushing] = useState(false);
    const [pushSuccess, setPushSuccess] = useState(false);

    // Colors section only shows after all phases approved
    if (section === 'colors' && !isVaultComplete) {
        return null;
    }

    // Only show for approved sections
    if (!isApproved) {
        return null;
    }

    const handlePush = async () => {
        if (!funnelId) {
            toast.error('No funnel selected');
            return;
        }

        setIsPushing(true);
        setPushSuccess(false);

        try {
            const endpoint = `/api/ghl/push-${section}`;
            const response = await fetchWithAuth(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelId }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setPushSuccess(true);
                toast.success(`✅ ${getSectionLabel(section)} pushed to Builder!`, {
                    description: `${result.pushed} values updated`,
                });

                // Reset success state after 3 seconds
                setTimeout(() => setPushSuccess(false), 3000);
            } else {
                toast.error(`Failed to push ${getSectionLabel(section)}`, {
                    description: result.error || 'Unknown error',
                });
            }
        } catch (error) {
            console.error('[PushToGHLButton] Error:', error);
            toast.error('Push failed', { description: error.message });
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <button
            onClick={handlePush}
            disabled={isPushing}
            className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200 
        ${pushSuccess
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-cyan/20 to-blue-500/20 text-cyan border border-cyan/30 hover:from-cyan/30 hover:to-blue-500/30'
                }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
            title={`Push ${getSectionLabel(section)} to GoHighLevel`}
        >
            {isPushing ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pushing...
                </>
            ) : pushSuccess ? (
                <>
                    <CheckCircle className="w-4 h-4" />
                    Pushed!
                </>
            ) : (
                <>
                    <Rocket className="w-4 h-4" />
                    {label}
                </>
            )}
        </button>
    );
}

/**
 * Get human-readable section label
 */
function getSectionLabel(section) {
    const labels = {
        'funnel-copy': 'Funnel Copy',
        funnelCopy: 'Funnel Copy',
        colors: 'Colors',
        emails: 'Emails',
        sms: 'SMS',
        media: 'Media',
    };
    return labels[section] || section;
}
