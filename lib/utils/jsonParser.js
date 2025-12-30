/**
 * Robust JSON Parser with Error Recovery
 * Handles common JSON formatting issues from AI responses
 * Optimized for performance with regex-based repairs
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
 * Pre-clean JSON string to fix common AI generation issues - OPTIMIZED
 */
function preCleanJson(jsonString) {
  // Remove control characters except newlines and tabs (we'll handle those later)
  // Keep emojis and other valid Unicode
  let cleaned = jsonString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // Quick check: if no problematic patterns, return early
  const hasIssues = cleaned.includes('\n"') || cleaned.includes('\r"') || cleaned.match(/\\[^"\\/bfnrtu]/);
  if (!hasIssues) {
    return cleaned;
  }

  // Fix literal newlines in string values (replace with \n)
  cleaned = cleaned.replace(/"([^"]*)\r?\n([^"]*)"/g, '"$1\\n$2"');

  // Fix invalid escape sequences (but preserve valid ones)
  cleaned = cleaned.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');

  return cleaned;
}

/**
 * Fix string values with embedded quotes - OPTIMIZED VERSION
 * Uses regex and smart heuristics instead of character-by-character iteration
 */
function fixStringValues(jsonString) {
  // Fast path: if no quotes issues detected, return as-is
  if (!jsonString.includes('"') || !jsonString.match(/[^\\]"[^,:}\]]/)) {
    return jsonString;
  }

  // Use a more efficient approach: fix common patterns with regex
  let fixed = jsonString;

  // Fix unescaped quotes within strings (heuristic: quote followed by word char)
  // Match: "...<unescaped quote><word char>" and escape the quote
  fixed = fixed.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"([a-zA-Z0-9])/g, '"$1\\"$2');

  // Balance quotes if needed
  const quoteCount = (fixed.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // Odd number of quotes - add one at the end
    const lastBrace = Math.max(fixed.lastIndexOf('}'), fixed.lastIndexOf(']'));
    if (lastBrace > 0) {
      fixed = fixed.substring(0, lastBrace) + '"' + fixed.substring(lastBrace);
    } else {
      fixed += '"';
    }
  }

  return fixed;
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

  // Fix unescaped backslashes before quotes (common AI error)
  repaired = repaired.replace(/\\'/g, "'"); // Remove escaped single quotes
  repaired = repaired.replace(/([^\\])\\"/g, '$1\\\\"'); // Fix partially escaped quotes
  
  // Fix smart quotes and apostrophes
  repaired = repaired.replace(/[\u201C\u201D]/g, '"'); // Replace smart double quotes
  repaired = repaired.replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes
  repaired = repaired.replace(/[\u2032]/g, "'"); // Replace prime symbol
  
  // Fix other problematic unicode characters
  repaired = repaired.replace(/[\u2013\u2014]/g, '-'); // Replace em/en dashes
  repaired = repaired.replace(/[\u2026]/g, '...'); // Replace ellipsis
  
  // Fix trailing commas (common AI error)
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unescaped control characters (but keep newlines for now)
  repaired = repaired.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Apply string value fixing to handle embedded quotes
  try {
    repaired = fixStringValues(repaired);
  } catch (stringError) {
    console.warn('[JSON Parser] String value fixing failed in standard repair:', stringError.message);
    // Continue with original repaired string
  }

  return repaired;
}

/**
 * Aggressive JSON repair - try to salvage even badly broken JSON
 */
function aggressiveRepair(jsonString) {
  let repaired = jsonString;
  
  // Remove any markdown formatting
  repaired = repaired.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Find the main JSON object
  const start = repaired.indexOf('{');
  const end = repaired.lastIndexOf('}');
  
  if (start === -1 || end === -1 || start >= end) {
    throw new Error('No valid JSON object found');
  }
  
  repaired = repaired.substring(start, end + 1);
  
  // Replace problematic characters
  repaired = repaired
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // All smart quotes
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'") // All smart apostrophes
    .replace(/[\u2013\u2014]/g, '-') // Dashes
    .replace(/[\u2026]/g, '...') // Ellipsis
    .replace(/[\u00A0]/g, ' '); // Non-breaking space
  
  // Fix string values with embedded quotes
  try {
    repaired = fixStringValues(repaired);
  } catch (e) {
    console.warn('[JSON Parser] String fixing failed:', e.message);
  }
  
  // Normalize whitespace within string values is now handled by fixStringValues
  // Don't collapse whitespace globally as it might break string content
  
  // Fix property names without quotes
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  
  // Fix trailing commas
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  
  // Fix multiple commas
  repaired = repaired.replace(/,+/g, ',');
  
  // Attempt to balance braces
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces);
  }
  
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

  // Step 1.5: Pre-clean the JSON to fix common AI issues
  jsonText = preCleanJson(jsonText);

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
        console.warn('[JSON Parser] Standard repair failed, attempting aggressive repair...');
      }
      
      // Step 4: Try aggressive repair as last resort
      try {
        const aggressivelyRepaired = aggressiveRepair(jsonText);
        const result = JSON.parse(aggressivelyRepaired);
        if (logErrors) {
          console.log('[JSON Parser] ✓ Aggressive repair succeeded!');
        }
        return result;
      } catch (thirdError) {
        if (logErrors) {
          console.error('[JSON Parser] All repair attempts failed');
          console.error('[JSON Parser] Original error:', firstError.message);
          console.error('[JSON Parser] Repair error:', secondError.message);
          console.error('[JSON Parser] Aggressive error:', thirdError.message);
          
          // Extract position from error message if available
          const posMatch = firstError.message.match(/position (\d+)/);
          if (posMatch) {
            const pos = parseInt(posMatch[1]);
            const start = Math.max(0, pos - 100);
            const end = Math.min(jsonText.length, pos + 100);
            console.error(`[JSON Parser] Context around error position ${pos}:`);
            console.error('[JSON Parser] >>>', jsonText.substring(start, end));
            console.error('[JSON Parser] Problem char:', JSON.stringify(jsonText[pos]));
          }
          
          console.error('[JSON Parser] First 500 chars:', jsonText.substring(0, 500));
          console.error('[JSON Parser] Last 500 chars:', jsonText.substring(Math.max(0, jsonText.length - 500)));
        }

        if (throwOnError) {
          throw new Error(`JSON parsing failed after all attempts: ${firstError.message}`);
        }
        return defaultValue;
      }
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
