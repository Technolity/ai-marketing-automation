/**
 * Color Utilities for Brand Color Management
 * 
 * Provides:
 * - Parsing of brand colors from Q15 intake form
 * - WCAG-compliant contrast ratio calculations
 * - Smart color assignment with automatic text color selection
 * - Color name to hex conversion
 * 
 * All functions include detailed logging for debugging.
 */

// ============================================
// COLOR NAME TO HEX MAPPING
// ============================================

const COLOR_NAMES = {
    // Basic colors
    black: '#000000',
    white: '#FFFFFF',
    gray: '#808080',
    grey: '#808080',
    silver: '#C0C0C0',

    // Primary colors
    red: '#FF0000',
    blue: '#0000FF',
    yellow: '#FFFF00',
    green: '#008000',

    // Extended palette
    navy: '#000080',
    teal: '#008080',
    cyan: '#00FFFF',
    aqua: '#00FFFF',
    purple: '#800080',
    magenta: '#FF00FF',
    fuchsia: '#FF00FF',
    orange: '#FFA500',
    pink: '#FFC0CB',
    gold: '#FFD700',
    bronze: '#CD7F32',
    copper: '#B87333',
    coral: '#FF7F50',
    salmon: '#FA8072',
    maroon: '#800000',
    crimson: '#DC143C',
    lime: '#00FF00',
    olive: '#808000',
    forest: '#228B22',
    mint: '#98FF98',
    turquoise: '#40E0D0',
    indigo: '#4B0082',
    violet: '#EE82EE',
    lavender: '#E6E6FA',
    beige: '#F5F5DC',
    ivory: '#FFFFF0',
    chocolate: '#D2691E',
    tan: '#D2B48C',

    // Modern web colors
    charcoal: '#36454F',
    slate: '#708090',
    midnight: '#191970',
    skyblue: '#87CEEB',
    royalblue: '#4169E1',
    steelblue: '#4682B4'
};

// ============================================
// HEX PARSING
// ============================================

/**
 * Parse brand colors input from Q15 into structured format
 * Handles: hex codes, color names, labeled colors (Primary: #XXX)
 * 
 * @param {string} input - Raw brand colors input
 * @returns {object} - Parsed color palette
 */
export function parseBrandColors(input) {
    console.log('[ColorUtils] Parsing brand colors input:', input?.substring(0, 100) || '(empty)');

    if (!input || typeof input !== 'string') {
        console.log('[ColorUtils] No valid input, returning empty palette');
        return { primary: null, secondary: null, accent: null, background: null, colors: [] };
    }

    const result = {
        primary: null,
        secondary: null,
        accent: null,
        background: null,
        colors: [] // All extracted colors in order
    };

    // Extract hex codes
    const hexPattern = /#[0-9A-Fa-f]{6}\b/g;
    const hexMatches = input.match(hexPattern) || [];
    console.log('[ColorUtils] Found hex codes:', hexMatches);

    // Extract 3-digit hex codes and expand them
    const shortHexPattern = /#[0-9A-Fa-f]{3}\b/g;
    const shortHexMatches = input.match(shortHexPattern) || [];
    const expandedShortHex = shortHexMatches.map(h =>
        '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]
    );
    console.log('[ColorUtils] Found short hex codes:', shortHexMatches, '→', expandedShortHex);

    // Combine all hex codes
    const allHexCodes = [...hexMatches.map(h => h.toUpperCase()), ...expandedShortHex.map(h => h.toUpperCase())];

    // Extract color names
    const inputLower = input.toLowerCase();
    const foundColorNames = [];
    for (const [name, hex] of Object.entries(COLOR_NAMES)) {
        // Match whole word only
        const regex = new RegExp(`\\b${name}\\b`, 'i');
        if (regex.test(inputLower)) {
            foundColorNames.push({ name, hex: hex.toUpperCase() });
        }
    }
    console.log('[ColorUtils] Found color names:', foundColorNames.map(c => c.name));

    // Combine: hex codes first, then named colors (avoiding duplicates)
    const allColors = [...allHexCodes];
    foundColorNames.forEach(c => {
        if (!allColors.includes(c.hex)) {
            allColors.push(c.hex);
        }
    });

    result.colors = allColors;
    console.log('[ColorUtils] All colors extracted:', allColors);

    // Check for labeled colors (Primary:, Secondary:, Accent:, Background:)
    const labelPatterns = {
        primary: /primary\s*[:\-]?\s*(#[0-9A-Fa-f]{3,6}|\w+)/i,
        secondary: /secondary\s*[:\-]?\s*(#[0-9A-Fa-f]{3,6}|\w+)/i,
        accent: /accent\s*[:\-]?\s*(#[0-9A-Fa-f]{3,6}|\w+)/i,
        background: /background\s*[:\-]?\s*(#[0-9A-Fa-f]{3,6}|\w+)/i,
        bg: /bg\s*[:\-]?\s*(#[0-9A-Fa-f]{3,6}|\w+)/i
    };

    for (const [label, pattern] of Object.entries(labelPatterns)) {
        const match = input.match(pattern);
        if (match) {
            let color = match[1];
            // Convert name to hex if needed
            if (!color.startsWith('#')) {
                color = COLOR_NAMES[color.toLowerCase()] || null;
            }
            if (color) {
                const normalizedLabel = label === 'bg' ? 'background' : label;
                result[normalizedLabel] = color.toUpperCase();
                console.log(`[ColorUtils] Labeled color found: ${normalizedLabel} = ${result[normalizedLabel]}`);
            }
        }
    }

    // If no labeled colors, assign by position
    if (!result.primary && allColors.length > 0) {
        result.primary = allColors[0];
        console.log('[ColorUtils] Auto-assigned primary:', result.primary);
    }
    if (!result.secondary && allColors.length > 1) {
        result.secondary = allColors[1];
        console.log('[ColorUtils] Auto-assigned secondary:', result.secondary);
    }
    if (!result.accent && allColors.length > 2) {
        result.accent = allColors[2];
        console.log('[ColorUtils] Auto-assigned accent:', result.accent);
    }

    console.log('[ColorUtils] Final parsed palette:', {
        primary: result.primary,
        secondary: result.secondary,
        accent: result.accent,
        background: result.background,
        totalColors: result.colors.length
    });

    return result;
}

// ============================================
// LUMINANCE & CONTRAST CALCULATIONS
// ============================================

/**
 * Calculate relative luminance of a color (WCAG formula)
 * @param {string} hex - Hex color code
 * @returns {number} - Luminance value 0-1
 */
export function getLuminance(hex) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
        console.warn('[ColorUtils] Invalid hex for luminance:', hex);
        return 0;
    }

    // Remove # and parse
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    // Apply sRGB to linear conversion
    const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    const rLin = toLinear(r);
    const gLin = toLinear(g);
    const bLin = toLinear(b);

    // Calculate luminance
    const luminance = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
    return luminance;
}

/**
 * Calculate contrast ratio between two colors (WCAG)
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @returns {number} - Contrast ratio (1 to 21)
 */
export function getContrastRatio(color1, color2) {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    const ratio = (lighter + 0.05) / (darker + 0.05);
    return Math.round(ratio * 100) / 100; // Round to 2 decimals
}

/**
 * Check if a color is considered "dark"
 * @param {string} hex - Hex color code
 * @returns {boolean}
 */
export function isDarkColor(hex) {
    const luminance = getLuminance(hex);
    return luminance < 0.5;
}

/**
 * Check if a color is considered "light"
 * @param {string} hex - Hex color code
 * @returns {boolean}
 */
export function isLightColor(hex) {
    return !isDarkColor(hex);
}

// ============================================
// SMART COLOR ASSIGNMENT
// ============================================

/**
 * Get best text color (black or white) for a given background
 * @param {string} bgColor - Background hex color
 * @returns {string} - '#000000' or '#FFFFFF'
 */
export function getTextColorForBackground(bgColor) {
    if (!bgColor) return '#000000';

    const whiteContrast = getContrastRatio('#FFFFFF', bgColor);
    const blackContrast = getContrastRatio('#000000', bgColor);

    const textColor = whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';

    console.log(`[ColorUtils] Text color for bg ${bgColor}: ${textColor} (white: ${whiteContrast}:1, black: ${blackContrast}:1)`);
    return textColor;
}

/**
 * Ensure a color has sufficient contrast against a background
 * If not, return fallback (black or white)
 * @param {string} color - Text/foreground color
 * @param {string} bgColor - Background color
 * @param {number} minRatio - Minimum contrast ratio (default 4.5 for WCAG AA)
 * @returns {object} - { color, contrast, adjusted }
 */
export function ensureContrast(color, bgColor, minRatio = 4.5) {
    const contrast = getContrastRatio(color, bgColor);

    if (contrast >= minRatio) {
        console.log(`[ColorUtils] ✓ Contrast OK: ${color} on ${bgColor} = ${contrast}:1`);
        return { color, contrast, adjusted: false };
    }

    // Not enough contrast - use black or white
    const fallback = getTextColorForBackground(bgColor);
    const fallbackContrast = getContrastRatio(fallback, bgColor);

    console.log(`[ColorUtils] ⚠ Poor contrast (${contrast}:1 < ${minRatio}:1): ${color} on ${bgColor} → Using ${fallback} (${fallbackContrast}:1)`);

    return { color: fallback, contrast: fallbackContrast, adjusted: true };
}

/**
 * Build a complete color palette for GHL from brand colors
 * Ensures all text colors have proper contrast
 * 
 * @param {object} brandColors - Parsed brand colors from parseBrandColors()
 * @param {object} options - Configuration options
 * @returns {object} - Complete palette for GHL custom values
 */
export function buildGHLColorPalette(brandColors, options = {}) {
    console.log('[ColorUtils] Building GHL color palette...');

    const {
        defaultPrimary = '#0891b2',
        defaultBackground = '#0e0e0f',
        darkMode = true
    } = options;

    // Start with defaults
    const primary = brandColors?.primary || defaultPrimary;
    const secondary = brandColors?.secondary || primary;
    const accent = brandColors?.accent || secondary;
    const background = brandColors?.background || (darkMode ? defaultBackground : '#FFFFFF');

    console.log('[ColorUtils] Base colors:', { primary, secondary, accent, background });

    // Build palette with contrast-safe text colors
    const palette = {
        // Primary brand
        primary,
        secondary,
        accent,

        // Backgrounds
        background,
        cardBackground: darkMode ? '#1a1a1d' : '#F5F5F5',

        // CTA button
        ctaBackground: primary,
        ctaText: getTextColorForBackground(primary),
        ctaHover: adjustBrightness(primary, darkMode ? 20 : -20),

        // Headlines - ensure readable on background
        headline: ensureContrast(primary, background, 4.5).color,
        subheadline: ensureContrast(secondary, background, 4.5).color,

        // Body text - high contrast required
        bodyText: darkMode ? '#FFFFFF' : '#000000',
        paragraphText: darkMode ? '#a1a1aa' : '#4a4a4a',

        // Borders & accents
        border: accent,
        pillBackground: primary,
        pillText: getTextColorForBackground(primary),

        // Special
        urgency: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b'
    };

    console.log('[ColorUtils] ✓ GHL palette built:', {
        ctaBackground: palette.ctaBackground,
        ctaText: palette.ctaText,
        headline: palette.headline,
        background: palette.background
    });

    return palette;
}

/**
 * Adjust brightness of a hex color
 * @param {string} hex - Original color
 * @param {number} percent - Positive = lighter, negative = darker
 * @returns {string} - Adjusted hex color
 */
export function adjustBrightness(hex, percent) {
    if (!hex) return hex;

    const cleanHex = hex.replace('#', '');
    let r = parseInt(cleanHex.substring(0, 2), 16);
    let g = parseInt(cleanHex.substring(2, 4), 16);
    let b = parseInt(cleanHex.substring(4, 6), 16);

    r = Math.min(255, Math.max(0, r + (r * percent / 100)));
    g = Math.min(255, Math.max(0, g + (g * percent / 100)));
    b = Math.min(255, Math.max(0, b + (b * percent / 100)));

    const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Map GHL custom value key to palette color
 * @param {string} key - GHL custom value key (e.g., "02 VSL CTA BG Colour")
 * @param {object} palette - Color palette from buildGHLColorPalette
 * @returns {string|null} - Hex color or null if no match
 */
export function mapKeyToColor(key, palette) {
    if (!key || !palette) return null;

    const keyLower = key.toLowerCase();

    // CTA colors
    if (keyLower.includes('cta') && keyLower.includes('bg')) {
        console.log(`[ColorUtils] Mapped "${key}" → ctaBackground: ${palette.ctaBackground}`);
        return palette.ctaBackground;
    }
    if (keyLower.includes('cta') && keyLower.includes('text')) {
        console.log(`[ColorUtils] Mapped "${key}" → ctaText: ${palette.ctaText}`);
        return palette.ctaText;
    }

    // Headlines
    if (keyLower.includes('headline') && !keyLower.includes('sub')) {
        console.log(`[ColorUtils] Mapped "${key}" → headline: ${palette.headline}`);
        return palette.headline;
    }
    if (keyLower.includes('sub') && keyLower.includes('headline')) {
        console.log(`[ColorUtils] Mapped "${key}" → subheadline: ${palette.subheadline}`);
        return palette.subheadline;
    }

    // Background
    if (keyLower.includes('bg') || keyLower.includes('background')) {
        if (keyLower.includes('card')) {
            return palette.cardBackground;
        }
        console.log(`[ColorUtils] Mapped "${key}" → background: ${palette.background}`);
        return palette.background;
    }

    // Text/paragraph/body
    if (keyLower.includes('paragraph') || keyLower.includes('body')) {
        console.log(`[ColorUtils] Mapped "${key}" → paragraphText: ${palette.paragraphText}`);
        return palette.paragraphText;
    }
    if (keyLower.includes('text') && !keyLower.includes('cta')) {
        console.log(`[ColorUtils] Mapped "${key}" → bodyText: ${palette.bodyText}`);
        return palette.bodyText;
    }

    // Border
    if (keyLower.includes('border')) {
        console.log(`[ColorUtils] Mapped "${key}" → border: ${palette.border}`);
        return palette.border;
    }

    // Pill
    if (keyLower.includes('pill')) {
        if (keyLower.includes('text')) {
            return palette.pillText;
        }
        return palette.pillBackground;
    }

    // Accent/primary/secondary
    if (keyLower.includes('accent')) {
        return palette.accent;
    }
    if (keyLower.includes('primary')) {
        return palette.primary;
    }
    if (keyLower.includes('secondary')) {
        return palette.secondary;
    }

    // No match
    console.log(`[ColorUtils] No color mapping for "${key}"`);
    return null;
}

export default {
    parseBrandColors,
    getLuminance,
    getContrastRatio,
    isDarkColor,
    isLightColor,
    getTextColorForBackground,
    ensureContrast,
    buildGHLColorPalette,
    adjustBrightness,
    mapKeyToColor,
    COLOR_NAMES
};
