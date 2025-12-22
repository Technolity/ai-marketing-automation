/**
 * Robust JSON Parser with Error Recovery
 * Handles common JSON formatting issues from AI responses
 */

/**
 * Extract JSON from markdown code blocks if present
 */
function extractJsonFromMarkdown(text) {
  // Check for JSON in markdown code blocks
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Check for generic code blocks
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  return text.trim();
}

/**
 * Repair common JSON formatting issues
 */
function repairJson(jsonString) {
  let repaired = jsonString;

  // Remove any text before the first { or [
  const firstBrace = repaired.indexOf('{');
  const firstBracket = repaired.indexOf('[');
  const startIndex = firstBrace === -1 ? firstBracket :
                     firstBracket === -1 ? firstBrace :
                     Math.min(firstBrace, firstBracket);

  if (startIndex > 0) {
    repaired = repaired.substring(startIndex);
  }

  // Remove any text after the last } or ]
  const lastBrace = repaired.lastIndexOf('}');
  const lastBracket = repaired.lastIndexOf(']');
  const endIndex = Math.max(lastBrace, lastBracket);

  if (endIndex > -1 && endIndex < repaired.length - 1) {
    repaired = repaired.substring(0, endIndex + 1);
  }

  // Fix common escaping issues
  // Replace literal newlines in string values with \n
  repaired = repaired.replace(/"([^"]*?)(\r?\n)([^"]*?)"/g, (match, before, newline, after) => {
    return `"${before}\\n${after}"`;
  });

  // Fix unescaped quotes in string values (this is tricky, do best effort)
  // Look for patterns like "text "quoted" text" and fix to "text \"quoted\" text"
  // This is a simplified approach - may not catch all cases

  return repaired;
}

/**
 * Parse JSON with error recovery
 * @param {string} text - The JSON string to parse
 * @param {object} options - Parsing options
 * @returns {object} Parsed JSON object
 * @throws {Error} If JSON cannot be parsed after all recovery attempts
 */
export function parseJsonSafe(text, options = {}) {
  const {
    throwOnError = true,
    defaultValue = null,
    logErrors = true
  } = options;

  if (!text || typeof text !== 'string') {
    if (logErrors) {
      console.error('[JSON Parser] Invalid input:', typeof text);
    }
    if (throwOnError) {
      throw new Error('Invalid JSON input: expected string');
    }
    return defaultValue;
  }

  // Step 1: Extract JSON from markdown if needed
  let jsonText = extractJsonFromMarkdown(text);

  // Step 2: Try direct parse first
  try {
    return JSON.parse(jsonText);
  } catch (firstError) {
    if (logErrors) {
      console.warn('[JSON Parser] Initial parse failed, attempting repair...');
      console.warn('[JSON Parser] Error:', firstError.message);
    }

    // Step 3: Try repairing common issues
    try {
      const repairedJson = repairJson(jsonText);
      return JSON.parse(repairedJson);
    } catch (secondError) {
      if (logErrors) {
        console.error('[JSON Parser] Repair failed');
        console.error('[JSON Parser] Original error:', firstError.message);
        console.error('[JSON Parser] Repair error:', secondError.message);
        console.error('[JSON Parser] First 500 chars:', jsonText.substring(0, 500));
        console.error('[JSON Parser] Last 500 chars:', jsonText.substring(Math.max(0, jsonText.length - 500)));
      }

      if (throwOnError) {
        throw new Error(`JSON parsing failed: ${firstError.message}. Repair attempt also failed: ${secondError.message}`);
      }
      return defaultValue;
    }
  }
}

/**
 * Validate that the parsed JSON has expected structure
 */
export function validateJsonStructure(json, requiredKeys = []) {
  if (!json || typeof json !== 'object') {
    return { valid: false, missing: ['root object'] };
  }

  const missing = [];
  for (const key of requiredKeys) {
    if (!(key in json)) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Parse and validate JSON in one step
 */
export function parseAndValidateJson(text, requiredKeys = [], options = {}) {
  const json = parseJsonSafe(text, options);

  if (json && requiredKeys.length > 0) {
    const validation = validateJsonStructure(json, requiredKeys);
    if (!validation.valid) {
      const error = new Error(`JSON missing required keys: ${validation.missing.join(', ')}`);
      if (options.throwOnError !== false) {
        throw error;
      }
      console.error('[JSON Parser]', error.message);
      return options.defaultValue || null;
    }
  }

  return json;
}

export default parseJsonSafe;
