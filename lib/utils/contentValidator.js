/**
 * Content Validator
 * 
 * Validates AI-generated content to ensure it's deterministic, 
 * business-ready, and contains no placeholders.
 */

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
    /\[insert\s/i,
    /\[your\s/i,
    /\[add\s/i,
    /\[fill\s/i,
    /\[example\]/i,
    /\[tbd\]/i,
    /\[todo\]/i,
    /\[placeholder\]/i,
    /\[client\s*name\s*here\]/i,
    /\[name\s*here\]/i,
    /for\s+example[,:]/i,
    /e\.g\.\s*,?\s*\[/i,
    /such\s+as\s+\[/i,
    /i\.e\.\s*,?\s*\[/i,
    /\[X+\]/g,
    /\[xxx+\]/gi,
    /\.\.\.\s*\[/i,
    /\{\{[^}]+placeholder/i,
];

// Generic filler phrases to detect
const FILLER_PATTERNS = [
    /lorem\s+ipsum/i,
    /sample\s+text/i,
    /example\s+content/i,
    /dummy\s+data/i,
    /test\s+content/i,
    /coming\s+soon/i,
    /to\s+be\s+determined/i,
    /to\s+be\s+added/i,
    /to\s+be\s+filled/i,
];

// Vague/generic terms that suggest non-specific content
const VAGUE_PATTERNS = [
    /various\s+(options|people|things)/i,
    /many\s+(options|people|things)/i,
    /several\s+(options|people|things)/i,
    /\bsome\s+type\s+of\b/i,
    /\bsome\s+kind\s+of\b/i,
    /\betc\.?\s*$/i,
    /\band\s+so\s+on\b/i,
];

/**
 * Check a string for placeholder text
 * @param {string} text - Text to check
 * @returns {Object} - { hasPlaceholders: boolean, found: string[] }
 */
export function checkForPlaceholders(text) {
    if (!text || typeof text !== 'string') {
        return { hasPlaceholders: false, found: [] };
    }

    const found = [];
    
    for (const pattern of PLACEHOLDER_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            found.push(...matches);
        }
    }

    return {
        hasPlaceholders: found.length > 0,
        found: [...new Set(found)] // Unique matches
    };
}

/**
 * Check a string for filler/generic content
 * @param {string} text - Text to check
 * @returns {Object} - { hasFiller: boolean, found: string[] }
 */
export function checkForFiller(text) {
    if (!text || typeof text !== 'string') {
        return { hasFiller: false, found: [] };
    }

    const found = [];
    
    for (const pattern of FILLER_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            found.push(...matches);
        }
    }

    return {
        hasFiller: found.length > 0,
        found: [...new Set(found)]
    };
}

/**
 * Check for vague/non-specific content
 * @param {string} text - Text to check
 * @returns {Object} - { hasVague: boolean, found: string[] }
 */
export function checkForVagueContent(text) {
    if (!text || typeof text !== 'string') {
        return { hasVague: false, found: [] };
    }

    const found = [];
    
    for (const pattern of VAGUE_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            found.push(...matches);
        }
    }

    return {
        hasVague: found.length > 0,
        found: [...new Set(found)]
    };
}

/**
 * Recursively check all string values in an object
 * @param {Object} obj - Object to check
 * @returns {Object} - Validation result
 */
export function validateObjectContent(obj) {
    const issues = {
        placeholders: [],
        filler: [],
        vague: [],
        emptyFields: []
    };

    function traverse(value, path = '') {
        if (value === null || value === undefined) {
            issues.emptyFields.push(path);
            return;
        }

        if (typeof value === 'string') {
            if (value.trim() === '') {
                issues.emptyFields.push(path);
                return;
            }

            const placeholderCheck = checkForPlaceholders(value);
            if (placeholderCheck.hasPlaceholders) {
                issues.placeholders.push({
                    path,
                    found: placeholderCheck.found,
                    sample: value.substring(0, 100)
                });
            }

            const fillerCheck = checkForFiller(value);
            if (fillerCheck.hasFiller) {
                issues.filler.push({
                    path,
                    found: fillerCheck.found,
                    sample: value.substring(0, 100)
                });
            }

            const vagueCheck = checkForVagueContent(value);
            if (vagueCheck.hasVague) {
                issues.vague.push({
                    path,
                    found: vagueCheck.found,
                    sample: value.substring(0, 100)
                });
            }
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                traverse(item, `${path}[${index}]`);
            });
        } else if (typeof value === 'object') {
            Object.keys(value).forEach(key => {
                traverse(value[key], path ? `${path}.${key}` : key);
            });
        }
    }

    traverse(obj);

    return {
        isValid: issues.placeholders.length === 0 && issues.filler.length === 0,
        issues,
        summary: {
            placeholderCount: issues.placeholders.length,
            fillerCount: issues.filler.length,
            vagueCount: issues.vague.length,
            emptyCount: issues.emptyFields.length
        }
    };
}

/**
 * Validate content type-specific requirements
 * @param {string} contentType - Type of content (idealClient, message, vsl, etc.)
 * @param {Object} content - The generated content
 * @returns {Object} - Validation result with type-specific checks
 */
export function validateContentType(contentType, content) {
    const baseValidation = validateObjectContent(content);
    const typeIssues = [];

    switch (contentType) {
        case 'idealClient':
            if (!content.idealClientProfile?.demographics?.ageRange) {
                typeIssues.push('Missing specific age range in demographics');
            }
            if (!content.idealClientProfile?.demographics?.incomeRange) {
                typeIssues.push('Missing specific income range in demographics');
            }
            if (!content.idealClientProfile?.painPoints || content.idealClientProfile.painPoints.length < 2) {
                typeIssues.push('Need at least 2 detailed pain points');
            }
            break;

        case 'message':
            if (!content.millionDollarMessage?.oneLineMessage) {
                typeIssues.push('Missing one-line message');
            }
            if (!content.millionDollarMessage?.uniqueMechanism?.name) {
                typeIssues.push('Missing unique mechanism name');
            }
            break;

        case 'vsl':
            if (!content.vslScript?.fullScript) {
                typeIssues.push('Missing full VSL script');
            }
            if (content.vslScript?.fullScript) {
                // Check for formatting in full script (should be clean)
                if (content.vslScript.fullScript.includes('##') || 
                    content.vslScript.fullScript.includes('**Section')) {
                    typeIssues.push('VSL script contains formatting - should be teleprompter-ready');
                }
            }
            if (!content.vslScript?.threeTips || content.vslScript.threeTips.length !== 3) {
                typeIssues.push('Must have exactly 3 tips');
            }
            break;

        case 'offer':
            if (!content.programBlueprint?.stepsToSuccess || content.programBlueprint.stepsToSuccess.length < 3) {
                typeIssues.push('Need at least 3 steps to success');
            }
            if (!content.programBlueprint?.threeTips || content.programBlueprint.threeTips.length !== 3) {
                typeIssues.push('Must have exactly 3 actionable tips');
            }
            break;

        case 'emails':
            if (!content.emailSequence?.emails || content.emailSequence.emails.length < 15) {
                typeIssues.push('Need at least 15 complete emails');
            }
            // Check each email has body content
            content.emailSequence?.emails?.forEach((email, idx) => {
                if (!email.body || email.body.length < 200) {
                    typeIssues.push(`Email ${idx + 1} body is too short or missing`);
                }
            });
            break;

        case 'facebookAds':
            if (!content.facebookAds?.ads || content.facebookAds.ads.length < 10) {
                typeIssues.push('Need all 10 ad variations');
            }
            // Check each ad has complete primaryText
            content.facebookAds?.ads?.forEach((ad, idx) => {
                if (!ad.primaryText || ad.primaryText.length < 300) {
                    typeIssues.push(`Ad ${idx + 1} primaryText is too short`);
                }
            });
            break;

        case 'leadMagnet':
            if (!content.leadMagnet?.workbookContent) {
                typeIssues.push('Missing workbook content');
            }
            if (!content.leadMagnet?.fulfillmentEmail?.body) {
                typeIssues.push('Missing fulfillment email body');
            }
            break;
    }

    return {
        ...baseValidation,
        isValid: baseValidation.isValid && typeIssues.length === 0,
        typeIssues,
        contentType
    };
}

/**
 * Safe JSON parsing with better error handling
 * @param {string} jsonString - String to parse
 * @returns {Object} - { success: boolean, data: Object|null, error: string|null }
 */
export function safeParseJSON(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
        return { success: false, data: null, error: 'Invalid input: expected string' };
    }

    // Clean the string - remove markdown code blocks if present
    let cleaned = jsonString.trim();
    
    // Remove ```json and ``` markers
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    
    cleaned = cleaned.trim();

    // Try to find JSON object boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    try {
        const data = JSON.parse(cleaned);
        return { success: true, data, error: null };
    } catch (e) {
        return { 
            success: false, 
            data: null, 
            error: `JSON parse error: ${e.message}. First 100 chars: ${cleaned.substring(0, 100)}` 
        };
    }
}

/**
 * Full validation pipeline
 * @param {string} jsonString - Raw JSON string from AI
 * @param {string} contentType - Type of content
 * @returns {Object} - Complete validation result
 */
export function validateGeneratedContent(jsonString, contentType) {
    // Step 1: Parse JSON
    const parseResult = safeParseJSON(jsonString);
    if (!parseResult.success) {
        return {
            success: false,
            stage: 'parsing',
            error: parseResult.error,
            data: null
        };
    }

    // Step 2: Validate content
    const validation = validateContentType(contentType, parseResult.data);
    
    // Step 3: Return result
    if (!validation.isValid) {
        return {
            success: false,
            stage: 'validation',
            error: 'Content validation failed',
            data: parseResult.data,
            validation
        };
    }

    return {
        success: true,
        stage: 'complete',
        data: parseResult.data,
        validation
    };
}

export default {
    checkForPlaceholders,
    checkForFiller,
    checkForVagueContent,
    validateObjectContent,
    validateContentType,
    safeParseJSON,
    validateGeneratedContent
};

