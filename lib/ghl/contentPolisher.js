/**
 * GHL Content Polisher
 * AI intervention layer that polishes content before pushing to GHL
 * 
 * Features:
 * - Remove JSON artifacts, escape sequences
 * - Format text for human readability  
 * - Convert colors to HEX
 * - Validate color contrast
 * - Ensure professional formatting
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// TEXT CONTENT POLISHING
// =============================================================================

/**
 * Polish text content for GHL custom values
 * Removes JSON artifacts, formats properly, humanizes text
 * @param {string} text - Raw text from vault
 * @param {string} fieldType - 'headline', 'paragraph', 'bullet', 'email', 'sms'
 * @returns {Promise<string>} Polished text
 */
export async function polishTextContent(text, fieldType = 'paragraph') {
    if (!text || typeof text !== 'string') return text || '';

    // Quick clean for simple cases
    let cleaned = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\\/g, '')
        .replace(/[^\S\n]+/g, ' ')  // Collapse spaces/tabs but PRESERVE newlines
        .replace(/\n{3,}/g, '\n\n')  // Limit to max 2 consecutive newlines
        .trim();

    // If text looks clean, return without AI
    if (!needsAIPolishing(cleaned, fieldType)) {
        return formatForFieldType(cleaned, fieldType);
    }

    // Use AI for complex polishing
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a content formatter. Clean and polish the following ${fieldType} text for a marketing funnel.

Rules:
- Remove any JSON formatting, escape sequences, or code artifacts
- Keep the content human-readable and professional
- Preserve the meaning exactly - don't add or remove information
- For headlines: Keep it punchy and attention-grabbing
- For paragraphs: Ensure proper sentence structure
- For bullets: Keep concise and impactful
- For emails: Format with proper line breaks
- For SMS: Keep under 160 characters if possible
- Do NOT add markdown formatting
- Return ONLY the cleaned text, nothing else`
                },
                {
                    role: 'user',
                    content: cleaned
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('[ContentPolisher] AI polishing error:', error);
        return formatForFieldType(cleaned, fieldType);
    }
}

/**
 * Check if text needs AI polishing
 */
function needsAIPolishing(text, fieldType) {
    // Check for JSON artifacts
    if (text.includes('{') || text.includes('[') || text.includes('\\')) return true;

    // Check for excessive whitespace or newlines
    if (/\n{3,}/.test(text) || /\s{3,}/.test(text)) return true;

    // Check for code-like patterns
    if (/^\s*[\[\{]/.test(text) || /[\]\}]\s*$/.test(text)) return true;

    return false;
}

/**
 * Format text based on field type
 */
function formatForFieldType(text, fieldType) {
    switch (fieldType) {
        case 'headline':
            return text.replace(/\n/g, ' ').trim();
        case 'bullet':
            return text.replace(/^[-•]\s*/, '').trim();
        case 'sms':
            return text.substring(0, 160);
        case 'email':
        case 'paragraph':
            // Preserve newlines for emails and paragraphs
            return text;
        default:
            return text;
    }
}

// =============================================================================
// COLOR PROCESSING
// =============================================================================

/**
 * Named colors to HEX mapping
 */
const NAMED_COLORS = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0000FF',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    gray: '#808080',
    grey: '#808080',
    navy: '#000080',
    teal: '#008080',
    maroon: '#800000',
    olive: '#808000',
    lime: '#00FF00',
    aqua: '#00FFFF',
    silver: '#C0C0C0',
    gold: '#FFD700',
};

/**
 * Validate and convert color to HEX format
 * @param {string} color - Color value (hex, rgb, named)
 * @param {string} role - 'text', 'background', 'button', 'border'
 * @returns {string} Valid HEX color
 */
export function validateAndFormatColor(color, role = 'text') {
    if (!color) return getDefaultColor(role);

    let hex = colorToHex(color);

    if (!hex) {
        console.warn(`[ContentPolisher] Invalid color: ${color}, using default`);
        return getDefaultColor(role);
    }

    return hex.toUpperCase();
}

/**
 * Convert any color format to HEX
 */
function colorToHex(color) {
    if (!color || typeof color !== 'string') return null;

    color = color.trim().toLowerCase();

    // Already HEX
    if (/^#[0-9a-f]{6}$/i.test(color)) {
        return color;
    }

    // Short HEX (#fff)
    if (/^#[0-9a-f]{3}$/i.test(color)) {
        return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }

    // Named color
    if (NAMED_COLORS[color]) {
        return NAMED_COLORS[color];
    }

    // RGB format: rgb(r, g, b)
    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    // RGBA format: rgba(r, g, b, a)
    const rgbaMatch = color.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/i);
    if (rgbaMatch) {
        const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    return null;
}

/**
 * Get default color for a role
 */
function getDefaultColor(role) {
    const defaults = {
        text: '#000000',
        background: '#FFFFFF',
        button: '#00BFFF',
        border: '#E0E0E0',
        headline: '#000000',
        subheadline: '#666666',
        cta: '#00BFFF',
        ctaText: '#FFFFFF',
    };
    return defaults[role] || '#000000';
}

// =============================================================================
// COLOR CONTRAST CHECKING
// =============================================================================

/**
 * Check if text color has sufficient contrast with background
 * @param {string} textColor - Text color (HEX)
 * @param {string} bgColor - Background color (HEX)
 * @returns {object} { isReadable, ratio, suggestion }
 */
export function checkColorContrast(textColor, bgColor) {
    const textHex = colorToHex(textColor) || '#000000';
    const bgHex = colorToHex(bgColor) || '#FFFFFF';

    const ratio = getContrastRatio(textHex, bgHex);
    const isReadable = ratio >= 4.5; // WCAG AA standard

    let suggestion = null;
    if (!isReadable) {
        suggestion = suggestBetterColor(textHex, bgHex);
    }

    return { isReadable, ratio: ratio.toFixed(2), suggestion };
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(hex1, hex2) {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Suggest a better color for readability
 */
function suggestBetterColor(textHex, bgHex) {
    const bgLuminance = getLuminance(bgHex);

    // If background is light, suggest dark text
    if (bgLuminance > 0.5) {
        return '#000000';
    }
    // If background is dark, suggest light text
    return '#FFFFFF';
}

/**
 * Smart color adjustment for visibility
 * Ensures text is readable on white backgrounds (most funnel pages)
 * @param {string} color - Original color
 * @param {string} role - 'text', 'headline', etc.
 * @returns {string} Adjusted HEX color
 */
export function ensureReadableColor(color, role = 'text') {
    const hex = colorToHex(color) || getDefaultColor(role);
    const whiteBg = '#FFFFFF';

    const { isReadable, suggestion } = checkColorContrast(hex, whiteBg);

    if (!isReadable && role.includes('text') || role.includes('headline')) {
        console.log(`[ContentPolisher] Color ${hex} not readable on white, adjusting to ${suggestion}`);
        return suggestion;
    }

    return hex;
}

// =============================================================================
// EMAIL & SMS POLISHING
// =============================================================================

/**
 * Polish email content for GHL
 * Formats subject, preheader, and body
 */
export async function polishEmailContent(email) {
    const polished = {
        subject: await polishTextContent(email.subject, 'headline'),
        preheader: await polishTextContent(email.preheader, 'paragraph'),
        body: await polishTextContent(email.body, 'email'),
    };

    // Ensure subject is not too long
    if (polished.subject.length > 100) {
        polished.subject = polished.subject.substring(0, 97) + '...';
    }

    // Ensure preheader is optimal length (40-130 chars)
    if (polished.preheader.length > 130) {
        polished.preheader = polished.preheader.substring(0, 127) + '...';
    }

    return polished;
}

/**
 * Polish SMS content for GHL
 * Ensures proper length and formatting
 */
export async function polishSMSContent(sms) {
    let polished = await polishTextContent(sms, 'sms');

    // Ensure SMS is not too long (160 chars)
    if (polished.length > 160) {
        // Try to cut at a word boundary
        const truncated = polished.substring(0, 157);
        const lastSpace = truncated.lastIndexOf(' ');
        polished = truncated.substring(0, lastSpace > 100 ? lastSpace : 157) + '...';
    }

    return polished;
}

// =============================================================================
// BATCH POLISHING
// =============================================================================

/**
 * Polish all content for a section before GHL push
 * @param {string} section - 'funnelCopy', 'colors', 'emails', 'sms', 'media'
 * @param {object} content - Content to polish
 * @returns {Promise<object>} Polished content
 */
export async function polishSectionContent(section, content) {
    if (!content) return {};

    switch (section) {
        case 'funnelCopy':
            return polishFunnelCopy(content);
        case 'colors':
            return polishColors(content);
        case 'emails':
            return polishEmails(content);
        case 'sms':
            return polishSMS(content);
        case 'media':
            // Media doesn't need polishing, just validation
            return content;
        default:
            return content;
    }
}

async function polishFunnelCopy(content) {
    const polished = {};

    for (const [page, fields] of Object.entries(content)) {
        polished[page] = {};
        for (const [field, value] of Object.entries(fields)) {
            const fieldType = getFieldType(field);
            polished[page][field] = await polishTextContent(value, fieldType);
        }
    }

    return polished;
}

function polishColors(content) {
    const polished = {};

    for (const [page, colors] of Object.entries(content)) {
        polished[page] = {};
        for (const [field, value] of Object.entries(colors)) {
            const role = getColorRole(field);
            polished[page][field] = ensureReadableColor(value, role);
        }
    }

    return polished;
}

async function polishEmails(content) {
    const polished = {};

    for (const [key, email] of Object.entries(content)) {
        if (typeof email === 'object' && email.subject) {
            polished[key] = await polishEmailContent(email);
        } else {
            polished[key] = await polishTextContent(email, 'email');
        }
    }

    return polished;
}

async function polishSMS(content) {
    const polished = {};

    for (const [key, sms] of Object.entries(content)) {
        polished[key] = await polishSMSContent(sms);
    }

    return polished;
}

function getFieldType(field) {
    if (field.includes('headline') || field.includes('Headline')) return 'headline';
    if (field.includes('bullet') || field.includes('Bullet')) return 'bullet';
    if (field.includes('cta') || field.includes('CTA')) return 'headline';
    return 'paragraph';
}

function getColorRole(field) {
    if (field.includes('text') || field.includes('Text')) return 'text';
    if (field.includes('background') || field.includes('Background') || field.includes('bg')) return 'background';
    if (field.includes('cta') || field.includes('CTA') || field.includes('button') || field.includes('Button')) return 'button';
    if (field.includes('border') || field.includes('Border')) return 'border';
    return 'text';
}

export default {
    polishTextContent,
    validateAndFormatColor,
    checkColorContrast,
    ensureReadableColor,
    polishEmailContent,
    polishSMSContent,
    polishSectionContent,
};
