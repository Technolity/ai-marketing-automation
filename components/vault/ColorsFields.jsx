'use client';

/**
 * ColorsFields Component
 * Displays brand colors from intake_form questionnaire Q15 (brandColors)
 * Parses hex codes from user text input and displays color preview squares
 */

import { useState, useEffect } from 'react';
import { Palette, Check, AlertCircle } from 'lucide-react';

// Color name to hex mapping for interpreting color names
const COLOR_NAME_MAP = {
    'red': '#dc2626', 'crimson': '#dc143c', 'scarlet': '#ff2400',
    'blue': '#2563eb', 'navy': '#000080', 'ocean': '#006994', 'royal blue': '#4169e1',
    'green': '#16a34a', 'emerald': '#50c878', 'forest': '#228b22', 'sage': '#9dc183',
    'purple': '#9333ea', 'violet': '#8b00ff', 'lavender': '#e6e6fa',
    'orange': '#ea580c', 'amber': '#ffbf00', 'coral': '#ff7f50',
    'pink': '#ec4899', 'rose': '#ff007f', 'magenta': '#ff00ff', 'dusty rose': '#d4a5a5',
    'gold': '#ffd700', 'yellow': '#eab308', 'sunshine': '#fffd37',
    'teal': '#0891b2', 'turquoise': '#40e0d0', 'cyan': '#00d4ff', 'electric blue': '#7df9ff',
    'black': '#000000', 'charcoal': '#36454f', 'slate': '#708090', 'grey': '#808080', 'gray': '#808080',
    'white': '#ffffff', 'cream': '#fffdd0', 'ivory': '#fffff0',
    'brown': '#8b4513', 'bronze': '#cd7f32', 'tan': '#d2b48c',
    'silver': '#c0c0c0', 'platinum': '#e5e4e2',
    'deep purple': '#5b21b6', 'deep black': '#111827', 'electric green': '#10b981',
    'forest green': '#065f46', 'warm gold': '#d97706', 'cream white': '#fffbeb'
};

// Extract hex codes and named colors from text
function parseColorsFromText(text) {
    if (!text) return [];

    const colors = [];

    // Extract hex codes directly (e.g., #000080)
    const hexPattern = /#[0-9A-Fa-f]{6}/gi;
    const hexMatches = text.match(hexPattern) || [];

    // Also look for hex codes in parentheses like "Navy Blue (#000080)"
    const parenHexPattern = /\(#([0-9A-Fa-f]{6})\)/gi;
    let match;
    while ((match = parenHexPattern.exec(text)) !== null) {
        const hex = '#' + match[1].toUpperCase();
        if (!colors.find(c => c.hex === hex)) {
            // Try to find the color name before the parenthesis
            const beforeParen = text.substring(0, match.index).split(/,|and/).pop().trim();
            colors.push({
                name: beforeParen || 'Color',
                hex: hex
            });
        }
    }

    // Add any standalone hex codes
    hexMatches.forEach(hex => {
        const upperHex = hex.toUpperCase();
        if (!colors.find(c => c.hex === upperHex)) {
            colors.push({ name: 'Color', hex: upperHex });
        }
    });

    // If no hex codes found, try to match color names
    if (colors.length === 0) {
        const lowerText = text.toLowerCase();
        for (const [name, hex] of Object.entries(COLOR_NAME_MAP)) {
            if (lowerText.includes(name)) {
                colors.push({
                    name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    hex: hex.toUpperCase()
                });
            }
        }
    }

    return colors;
}

export default function ColorsFields({ content, sectionId, funnelId, onSave, isApproved }) {
    const [brandColorsText, setBrandColorsText] = useState('');
    const [parsedColors, setParsedColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rawAnswer, setRawAnswer] = useState('');

    useEffect(() => {
        const fetchColors = async () => {
            try {
                // FIRST: Try to fetch AI-generated colors from vault_content
                const vaultResponse = await fetch(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=colors`);

                if (vaultResponse.ok) {
                    const vaultData = await vaultResponse.json();
                    console.log('[ColorsFields] Vault data:', vaultData);

                    // If we have generated colors in vault, use those
                    if (vaultData.fields && vaultData.fields.length > 0) {
                        const colorsField = vaultData.fields.find(f => f.field_id === 'palette' || f.field_value);

                        if (colorsField?.field_value) {
                            // AI-generated color palette
                            const generatedColors = typeof colorsField.field_value === 'string'
                                ? JSON.parse(colorsField.field_value)
                                : colorsField.field_value;

                            console.log('[ColorsFields] Using AI-generated colors from vault:', generatedColors);

                            // Convert to display format
                            const displayColors = [];
                            if (generatedColors.primaryColor) {
                                displayColors.push({
                                    name: generatedColors.primaryColor.name,
                                    hex: generatedColors.primaryColor.hex
                                });
                            }
                            if (generatedColors.secondaryColor) {
                                displayColors.push({
                                    name: generatedColors.secondaryColor.name,
                                    hex: generatedColors.secondaryColor.hex
                                });
                            }
                            if (generatedColors.accentColor) {
                                displayColors.push({
                                    name: generatedColors.accentColor.name,
                                    hex: generatedColors.accentColor.hex
                                });
                            }

                            setParsedColors(displayColors);
                            setRawAnswer(generatedColors.reasoning || 'AI-generated professional color palette');
                            setLoading(false);
                            return;
                        }
                    }
                }

                // FALLBACK: Fetch user's original input from profile questionnaire
                const response = await fetch('/api/user/profile');
                if (response.ok) {
                    const profile = await response.json();
                    console.log('[ColorsFields] Profile response:', profile);

                    // The API returns profile fields directly (not wrapped in data.profile)
                    // Try different paths to find brand colors answer
                    const colorAnswer =
                        profile?.intake_form?.brandColors ||
                        profile?.intake_form?.brand_colors ||
                        profile?.intake_form?.['15'] || // Questionnaire Q15
                        profile?.answers?.brandColors ||
                        profile?.brandColors ||
                        '';

                    console.log('[ColorsFields] Found brand colors from questionnaire:', colorAnswer);

                    setRawAnswer(colorAnswer);
                    setBrandColorsText(colorAnswer);

                    if (colorAnswer) {
                        const colors = parseColorsFromText(colorAnswer);
                        console.log('[ColorsFields] Parsed colors from text:', colors);
                        setParsedColors(colors);
                    }
                } else {
                    console.error('[ColorsFields] Profile fetch failed:', response.status);
                }
            } catch (error) {
                console.error('[ColorsFields] Error fetching colors:', error);
            } finally {
                setLoading(false);
            }
        };

        if (funnelId) {
            fetchColors();
        } else {
            setLoading(false);
        }
    }, [funnelId]);

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-400">
                <div className="animate-pulse">Loading brand colors...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-cyan" />
                <h4 className="text-lg font-semibold text-white">Your Brand Colors</h4>
            </div>

            {/* Raw answer display */}
            {rawAnswer && (
                <div className="p-4 bg-[#1a1a1d] rounded-xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-2">From your questionnaire:</p>
                    <p className="text-white text-sm italic">"{rawAnswer}"</p>
                </div>
            )}

            {/* Color swatches */}
            {parsedColors.length > 0 ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Extracted colors - these will be applied to your funnel:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {parsedColors.map((color, index) => (
                            <div key={index} className="flex flex-col items-center gap-2 p-4 bg-[#1a1a1d] rounded-xl border border-white/5">
                                <div
                                    className="w-16 h-16 rounded-xl border-2 border-white/20 shadow-lg"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-xs font-medium text-gray-300 text-center">
                                    {color.name}
                                </span>
                                <span className="text-xs text-cyan font-mono bg-cyan/10 px-2 py-0.5 rounded">
                                    {color.hex}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-6 bg-[#1a1a1d] rounded-xl border border-yellow-500/20 text-center">
                    <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-300">No brand colors found in your questionnaire.</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Default colors will be applied. You can update your brand colors in the questionnaire (Q15).
                    </p>
                </div>
            )}

            {isApproved && parsedColors.length > 0 && (
                <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-lg">
                    <Check className="w-4 h-4" />
                    <span>Colors approved and ready to push to Builder</span>
                </div>
            )}
        </div>
    );
}
