/**
 * Launch Builder Button Component
 * Allows users to seamlessly open their GHL subaccount builder
 */

'use client';

import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LaunchBuilderButton({ className = '' }) {
    const [loading, setLoading] = useState(false);

    const handleLaunchBuilder = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/ghl/launch-builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to launch builder');
            }

            console.log('[LaunchBuilder] Opening GHL:', data.locationName);

            // Open GHL in new tab with auto-login
            window.open(data.url, '_blank', 'noopener,noreferrer');

            toast.success(`Opening ${data.locationName}...`);

        } catch (error) {
            console.error('[LaunchBuilder] Error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLaunchBuilder}
            disabled={loading}
            className={`
                flex items-center gap-2 
                px-6 py-3 
                bg-gradient-to-r from-blue-600 to-purple-600 
                hover:from-blue-700 hover:to-purple-700
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white font-semibold rounded-lg 
                shadow-lg hover:shadow-xl
                transition-all duration-200
                ${className}
            `}
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Launching...</span>
                </>
            ) : (
                <>
                    <ExternalLink className="w-5 h-5" />
                    <span>Launch GHL Builder</span>
                </>
            )}
        </button>
    );
}
