/**
 * Email Formatter - Converts markdown-style formatting to HTML for GHL emails
 * 
 * Transforms:
 * - **text** → <strong>text</strong>
 * - *text* → <em>text</em>
 * - Line breaks → <br> tags
 * - Double line breaks → paragraph breaks
 * - Lists with - or • → <ul><li> tags
 * - [Link Text](URL) → <a href="URL">Link Text</a>
 */

/**
 * Convert markdown-formatted email body to HTML
 * @param {string} markdownBody - Email body with markdown formatting
 * @param {object} options - Formatting options
 * @returns {string} - HTML formatted email body
 */
export function convertEmailToHtml(markdownBody, options = {}) {
    if (!markdownBody || typeof markdownBody !== 'string') {
        return '';
    }

    const {
        wrapInContainer = true,
        fontFamily = 'Arial, sans-serif',
        fontSize = '16px',
        lineHeight = '1.6',
        textColor = '#333333'
    } = options;

    let html = markdownBody;

    // Step 1: Escape HTML entities (prevent XSS, preserve special chars)
    html = escapeHtml(html);

    // Step 2: Convert markdown links [text](url) → <a href="url">text</a>
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #0891b2; text-decoration: underline;">$1</a>');

    // Step 3: Convert **bold** → <strong>bold</strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Step 4: Convert *italic* → <em>italic</em> (but not inside URLs)
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Step 5: Convert bullet lists (lines starting with - or •)
    html = convertBulletLists(html);

    // Step 6: Convert numbered lists (lines starting with 1. 2. etc)
    html = convertNumberedLists(html);

    // Step 7: Convert paragraphs (double line breaks)
    html = convertParagraphs(html);

    // Step 8: Wrap in container with styling if requested
    if (wrapInContainer) {
        html = `<div style="font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineHeight}; color: ${textColor};">${html}</div>`;
    }

    return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Convert bullet lists to HTML <ul><li> structure
 */
function convertBulletLists(html) {
    const lines = html.split('\n');
    const result = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const bulletMatch = line.match(/^[\s]*[-•]\s+(.+)$/);

        if (bulletMatch) {
            if (!inList) {
                result.push('<ul style="margin: 10px 0; padding-left: 20px;">');
                inList = true;
            }
            result.push(`<li style="margin: 5px 0;">${bulletMatch[1]}</li>`);
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            result.push(line);
        }
    }

    if (inList) {
        result.push('</ul>');
    }

    return result.join('\n');
}

/**
 * Convert numbered lists to HTML <ol><li> structure
 */
function convertNumberedLists(html) {
    const lines = html.split('\n');
    const result = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const numberMatch = line.match(/^[\s]*(\d+)[.)]\s+(.+)$/);

        if (numberMatch) {
            if (!inList) {
                result.push('<ol style="margin: 10px 0; padding-left: 20px;">');
                inList = true;
            }
            result.push(`<li style="margin: 5px 0;">${numberMatch[2]}</li>`);
        } else {
            if (inList) {
                result.push('</ol>');
                inList = false;
            }
            result.push(line);
        }
    }

    if (inList) {
        result.push('</ol>');
    }

    return result.join('\n');
}

/**
 * Convert paragraphs - double line breaks become <p> tags
 * Single line breaks become <br>
 */
function convertParagraphs(html) {
    // Split by double newlines (paragraph breaks)
    const paragraphs = html.split(/\n\n+/);

    // Wrap each paragraph and convert single newlines to <br>
    const htmlParagraphs = paragraphs.map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';

        // Don't wrap if it's already a list or other HTML
        if (trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<div')) {
            return trimmed;
        }

        // Convert single newlines to <br> within the paragraph
        const withBreaks = trimmed.replace(/\n/g, '<br>');

        return `<p style="margin: 0 0 15px 0;">${withBreaks}</p>`;
    });

    return htmlParagraphs.filter(p => p).join('\n');
}

/**
 * Format email body for GHL with full HTML email structure
 * Use this for the complete email body ready for GHL
 */
export function formatEmailForGHL(emailBody, options = {}) {
    const {
        preservePlainText = false // Set to true to keep both plain text and HTML
    } = options;

    if (preservePlainText) {
        // Return object with both versions
        return {
            plain: emailBody,
            html: convertEmailToHtml(emailBody)
        };
    }

    return convertEmailToHtml(emailBody);
}

/**
 * Check if content appears to already be HTML
 */
export function isAlreadyHtml(content) {
    if (!content || typeof content !== 'string') return false;

    // Check for common HTML tags
    const htmlPatterns = [
        /<[a-z][\s\S]*>/i,  // Any HTML tag
        /<p>/i,
        /<br\s*\/?>/i,
        /<strong>/i,
        /<div>/i
    ];

    return htmlPatterns.some(pattern => pattern.test(content));
}

/**
 * Batch convert multiple email bodies
 */
export function batchConvertEmails(emailBodies) {
    const results = {};

    for (const [key, body] of Object.entries(emailBodies)) {
        // Only convert body fields, not subjects
        if (key.toLowerCase().includes('body')) {
            results[key] = isAlreadyHtml(body) ? body : convertEmailToHtml(body);
        } else {
            results[key] = body; // Keep subjects as plain text
        }
    }

    return results;
}

export default {
    convertEmailToHtml,
    formatEmailForGHL,
    isAlreadyHtml,
    batchConvertEmails
};
