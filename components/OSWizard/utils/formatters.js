/**
 * OSWizard Utility Functions - Formatters
 * 
 * Contains helper functions for formatting data for display.
 * Extracted from OSWizard.jsx for maintainability.
 */

/**
 * Format field names into readable titles
 * e.g., "idealClient" -> "Ideal Client"
 */
export const formatFieldName = (key) => {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

/**
 * Recursively format nested objects/arrays into human-readable strings
 * @param {any} value - The value to format
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum recursion depth to prevent infinite loops
 */
export const formatValue = (value, depth = 0, maxDepth = 5) => {
    // Prevent infinite recursion
    if (depth > maxDepth) {
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    if (value === null || value === undefined) {
        return '';
    }

    // Handle primitive types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return '';

        // Handle array of objects (like email sequence, program modules)
        if (typeof value[0] === 'object' && value[0] !== null) {
            return value.map((item, idx) => {
                const title = item.title || item.name || item.subject || item.headline || `Item ${idx + 1}`;
                const itemContent = Object.entries(item)
                    .filter(([k]) => !['title', 'name'].includes(k))
                    .map(([k, v]) => {
                        const formattedValue = formatValue(v, depth + 1, maxDepth);
                        return `  ${formatFieldName(k)}: ${formattedValue}`;
                    }).join('\n');
                return `${idx + 1}. ${title}\n${itemContent}`;
            }).join('\n\n');
        }
        // Handle array of strings/primitives
        return value.map((item, idx) => `${idx + 1}. ${formatValue(item, depth + 1, maxDepth)}`).join('\n');
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => {
                const formattedKey = formatFieldName(k);
                const formattedValue = formatValue(v, depth + 1, maxDepth);

                // For nested objects, add proper indentation
                if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
                    const indentedValue = formattedValue.split('\n').map(line => `  ${line}`).join('\n');
                    return `${formattedKey}:\n${indentedValue}`;
                }

                // For arrays, add proper indentation
                if (Array.isArray(v)) {
                    const indentedValue = formattedValue.split('\n').map(line => `  ${line}`).join('\n');
                    return `${formattedKey}:\n${indentedValue}`;
                }

                return `${formattedKey}: ${formattedValue}`;
            });

        return entries.join('\n\n');
    }

    return String(value);
};

/**
 * Format JSON content into human-readable sections for display
 * @param {object} jsonContent - The JSON content to format
 * @returns {Array<{key: string, value: string}>} Array of formatted sections
 */
export const formatContentForDisplay = (jsonContent) => {
    if (!jsonContent || typeof jsonContent !== 'object') {
        return [];
    }

    const sections = [];

    // Flatten the top-level structure (e.g., idealClient, message, etc.)
    Object.entries(jsonContent).forEach(([topKey, topValue]) => {
        if (typeof topValue === 'object' && !Array.isArray(topValue)) {
            // This is a nested object like { idealClient: {...} }
            Object.entries(topValue).forEach(([key, value]) => {
                sections.push({
                    key: formatFieldName(key),
                    value: formatValue(value)
                });
            });
        } else {
            // This is a direct key-value pair
            sections.push({
                key: formatFieldName(topKey),
                value: formatValue(topValue)
            });
        }
    });

    return sections;
};
