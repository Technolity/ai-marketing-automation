/**
 * Launch Builder Button Component
 * Allows users to seamlessly open their TedOS builder account
 */

'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LaunchBuilderButton({ className = '' }) {
    const [loading, setLoading] = useState(false);
    const [available, setAvailable] = useState(false);
    const [locationName, setLocationName] = useState('');

    // Check if builder is available on mount
    useEffect(() => {
        const checkAvailability = async () => {
            try {
                const response = await fetch('/api/builder/location');
                const data = await response.json();
                if (data.available) {
                    setAvailable(true);
                    setLocationName(data.locationName || 'Your Builder');
                }
            } catch (error) {
                console.error('[LaunchBuilder] Availability check failed:', error);
            }
        };
        checkAvailability();
    }, []);

    const handleLaunchBuilder = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/builder/location');
            const data = await response.json();

            if (!data.available) {
                throw new Error(data.message || 'Builder not available yet');
            }

            console.log('[LaunchBuilder] Opening builder:', data.locationName);

            // Open builder in new tab
            window.open(data.builderUrl, '_blank', 'noopener,noreferrer');

            toast.success(`Opening ${data.locationName || 'Builder'}...`);

        } catch (error) {
            console.error('[LaunchBuilder] Error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Don't show button if builder not available
    if (!available) {
        return null;
    }

    return (
        <button
            onClick={handleLaunchBuilder}
            disabled={loading}
            className={`
                flex items-center gap-2 
                px-6 py-3 
                bg-gradient-to-r from-cyan-600 to-blue-600 
                hover:from-cyan-700 hover:to-blue-700
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
                    <span>Opening...</span>
                </>
            ) : (
                <>
                    <ExternalLink className="w-5 h-5" />
                    <span>Go to Builder</span>
                </>
            )}
        </button>
    );
}
