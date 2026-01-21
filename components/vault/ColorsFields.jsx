'use client';

/**
 * ColorsFields Component
 * Displays brand colors from intake_form and allows pushing to GHL
 */

import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export default function ColorsFields({ content, sectionId, funnelId, onSave, isApproved }) {
    const [brandColors, setBrandColors] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try to get colors from content first (saved in vault_content)
        if (content?.brandColors) {
            setBrandColors(content.brandColors);
            setLoading(false);
            return;
        }

        // Fetch from user profile intake_form
        const fetchColors = async () => {
            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    const intakeColors = data.profile?.intake_form?.brandColors ||
                        data.profile?.intake_form?.brand_colors ||
                        data.profile?.brand_colors;

                    if (intakeColors) {
                        setBrandColors(intakeColors);
                    } else {
                        // Default colors
                        setBrandColors({
                            primary: '#00D4FF',
                            secondary: '#1E1E1E',
                            accent: '#00FF88',
                            text: '#FFFFFF',
                            background: '#0A0A0A'
                        });
                    }
                }
            } catch (error) {
                console.error('[ColorsFields] Error fetching colors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchColors();
    }, [content]);

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-400">
                <div className="animate-pulse">Loading brand colors...</div>
            </div>
        );
    }

    const colorEntries = brandColors ? Object.entries(brandColors).filter(([key, value]) =>
        typeof value === 'string' && value.startsWith('#')
    ) : [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-cyan" />
                <h4 className="text-lg font-semibold text-white">Your Brand Colors</h4>
            </div>

            <p className="text-sm text-gray-400 mb-6">
                These colors from your intake form will be applied to your funnel pages. Push to Builder to update your GHL funnel with these colors.
            </p>

            {colorEntries.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {colorEntries.map(([name, color]) => (
                        <div key={name} className="flex flex-col items-center gap-2">
                            <div
                                className="w-16 h-16 rounded-xl border-2 border-white/10 shadow-lg"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-medium text-gray-300 capitalize">
                                {name.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                                {color}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-6 bg-[#1a1a1d] rounded-xl border border-white/5 text-center">
                    <p className="text-gray-400">No brand colors found in your intake form.</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Default colors will be applied to your funnel.
                    </p>
                </div>
            )}

            {isApproved && (
                <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Colors approved and ready to push</span>
                </div>
            )}
        </div>
    );
}
