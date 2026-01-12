/**
 * Inference Engine - Smart fallback for custom values without explicit prompts
 * Uses pattern matching, type detection, and heuristics
 */

import { NEW_GHL_SCHEMA, getDefaultValue } from './newSchema.js';
import { parseBrandColors, buildGHLColorPalette, mapKeyToColor, getTextColorForBackground } from './colorUtils.js';

// Cache for brand color palette (built once per push)
let _cachedBrandPalette = null;
let _cachedBrandColorsInput = null;

/**
 * Initialize brand color palette from intake form data
 * Call this once before processing colors
 */
export function initializeBrandColors(brandColorsInput) {
  if (brandColorsInput === _cachedBrandColorsInput && _cachedBrandPalette) {
    console.log('[Inference] Using cached brand color palette');
    return _cachedBrandPalette;
  }

  console.log('[Inference] Initializing brand colors from input:', brandColorsInput?.substring(0, 80) || '(none)');

  const parsedColors = parseBrandColors(brandColorsInput);
  _cachedBrandPalette = buildGHLColorPalette(parsedColors, { darkMode: true });
  _cachedBrandColorsInput = brandColorsInput;

  console.log('[Inference] Brand palette ready:', {
    primary: _cachedBrandPalette.primary,
    ctaBackground: _cachedBrandPalette.ctaBackground,
    ctaText: _cachedBrandPalette.ctaText,
    headline: _cachedBrandPalette.headline
  });

  return _cachedBrandPalette;
}

/**
 * Clear the cached brand palette (call when switching users/funnels)
 */
export function clearBrandColorCache() {
  _cachedBrandPalette = null;
  _cachedBrandColorsInput = null;
  console.log('[Inference] Brand color cache cleared');
}

/**
 * Infer value for a custom value key using smart logic
 * @param {string} customValueKey - e.g., "02 VSL hero Headline text Colour"
 * @param {object} vaultContent - All vault sections
 * @returns {string} - Inferred value
 */
export function inferCustomValue(customValueKey, vaultContent) {
  console.log(`[Inference] Inferring value for: "${customValueKey}"`);

  // Get metadata from schema
  const metadata = NEW_GHL_SCHEMA[customValueKey];

  if (!metadata) {
    console.warn(`[Inference] No schema metadata for "${customValueKey}"`);
    return '';
  }

  // Route to appropriate inference strategy based on type
  switch (metadata.type) {
    case 'color':
      return inferColor(customValueKey, metadata, vaultContent);

    case 'image':
    case 'video':
    case 'url':
      return inferMediaUrl(customValueKey, metadata, vaultContent);

    case 'code':
      return inferEmbeddedCode(customValueKey, metadata, vaultContent);

    case 'text':
    default:
      return inferTextValue(customValueKey, metadata, vaultContent);
  }
}

/**
 * Infer color value based on key name and brand colors
 * Uses smart contrast logic to ensure text readability
 * @param {string} key - Custom value key
 * @param {object} metadata - Schema metadata
 * @param {object} vaultContent - Vault content (for brand colors)
 * @returns {string} - Hex color code
 */
function inferColor(key, metadata, vaultContent = {}) {
  console.log(`[Inference] Inferring color for: "${key}"`);

  // Try to use brand palette first
  if (_cachedBrandPalette) {
    const mappedColor = mapKeyToColor(key, _cachedBrandPalette);
    if (mappedColor) {
      console.log(`[Inference] ✓ Brand color matched: "${key}" → ${mappedColor}`);
      return mappedColor;
    }
  }

  // Fallback: Static color map for keys not in palette mapping
  const staticColorMap = {
    // Primary brand colors - will be overridden by brand palette
    'primary': _cachedBrandPalette?.primary || '#0891b2',
    'secondary': _cachedBrandPalette?.secondary || '#06b6d4',
    'accent': _cachedBrandPalette?.accent || '#22d3ee',

    // CTA button colors
    'cta': _cachedBrandPalette?.ctaBackground || '#0891b2',
    'cta_bg': _cachedBrandPalette?.ctaBackground || '#0891b2',
    'cta_background': _cachedBrandPalette?.ctaBackground || '#0891b2',
    'cta_text': _cachedBrandPalette?.ctaText || '#FFFFFF',
    'button': _cachedBrandPalette?.ctaBackground || '#0891b2',

    // Text colors
    'headline': _cachedBrandPalette?.headline || '#000000',
    'subheadline': _cachedBrandPalette?.subheadline || '#0891b2',
    'sub-headline': _cachedBrandPalette?.subheadline || '#0891b2',
    'paragraph': _cachedBrandPalette?.paragraphText || '#000000',
    'text': _cachedBrandPalette?.bodyText || '#000000',
    'body': _cachedBrandPalette?.paragraphText || '#a1a1aa',

    // Background colors
    'background': _cachedBrandPalette?.background || '#0e0e0f',
    'bg': _cachedBrandPalette?.background || '#0e0e0f',
    'card': _cachedBrandPalette?.cardBackground || '#D3D3D3',
    'header': '#000000',

    // Border colors
    'border': _cachedBrandPalette?.border || '#0891b2',

    // Special purpose
    'pill': _cachedBrandPalette?.pillBackground || '#0891b2',
    'urgency': '#ef4444',
    'video': _cachedBrandPalette?.primary || '#0891b2',
  };

  const keyLower = key.toLowerCase();

  // Try to match patterns in the key name
  for (const [pattern, color] of Object.entries(staticColorMap)) {
    if (keyLower.includes(pattern)) {
      console.log(`[Inference] Color matched pattern "${pattern}": ${color}`);
      return color;
    }
  }

  // Check if it's a text color (should use body text for dark mode)
  if (keyLower.includes('text') || keyLower.includes('paragraph')) {
    const textColor = _cachedBrandPalette?.bodyText || '#FFFFFF';
    console.log(`[Inference] Text color fallback: ${textColor}`);
    return textColor;
  }

  if (keyLower.includes('headline')) {
    const headlineColor = _cachedBrandPalette?.headline || '#FFFFFF';
    console.log(`[Inference] Headline color fallback: ${headlineColor}`);
    return headlineColor;
  }

  // Fallback to default from schema or primary color
  const defaultColor = metadata.defaultValue || _cachedBrandPalette?.primary || '#0891b2';
  console.log(`[Inference] Color fallback to default: ${defaultColor}`);
  return defaultColor;
}

/**
 * Infer media URL from vault media fields
 * @param {string} key - Custom value key
 * @param {object} metadata - Schema metadata
 * @param {object} vaultContent - Vault content
 * @returns {string} - Media URL or empty string
 */
function inferMediaUrl(key, metadata, vaultContent) {
  const media = vaultContent.media || {};

  console.log(`[Inference] Looking for media. Available keys:`, Object.keys(media));

  // DIRECT MAPPING from Media Library section (no AI logic needed)
  // These are exact mappings from Media Library fields to custom values
  // Field IDs come from fieldStructures.js (media section)
  const directMediaMapping = {
    // Logo - field_id: 'logoImage' in fieldStructures.js
    '02 Optin Logo Image': ['logoImage', 'logo', 'businessLogo', 'business_logo'],

    // Headshot/Bio Photo - field_id: 'headshotImage' in fieldStructures.js
    '02 VSL Bio Photo': ['headshotImage', 'headshot', 'bioPhoto', 'bio_photo', 'bioAuthorPhoto', 'bio_author_photo', 'author_image'],

    // Product Mockup
    '02 Optin Mockup Image': ['mockupImage', 'productMockup', 'product_mockup', 'lead_magnet_mockup', 'mockup'],

    // Main VSL Video
    '02 VSL video': ['vslVideo', 'mainVideo', 'main_video', 'vsl_video', 'main_vsl'],

    // Thank You Page Video
    '02 Thankyou Page Video': ['thankYouVideo', 'thankYouPageVideo', 'thank_you_video', 'thankyou_video'],

    // Testimonial Profile Pics (numbered)
    '02 VSL Testimonials Profile Pic 1': ['testimonial1Photo', 'testimonial_1', 'testimonialPhoto1'],
    '02 VSL Testimonials Profile Pic 2': ['testimonial2Photo', 'testimonial_2', 'testimonialPhoto2'],
    '02 VSL Testimonials Profile Pic 3': ['testimonial3Photo', 'testimonial_3', 'testimonialPhoto3'],
    '02 VSL Testimonials Profile Pic 4': ['testimonial4Photo', 'testimonial_4', 'testimonialPhoto4']
  };

  // Check for direct mapping first (highest priority)
  if (directMediaMapping[key]) {
    for (const fieldName of directMediaMapping[key]) {
      if (media[fieldName]) {
        console.log(`[Inference] Direct media mapping: "${key}" → ${fieldName} = ${media[fieldName].substring(0, 50)}...`);
        return media[fieldName];
      }
    }
    console.log(`[Inference] No match for "${key}". Tried: ${directMediaMapping[key].join(', ')}`);
  }

  // Fallback: Pattern-based matching for other media fields (testimonials, etc.)
  const keyLower = key.toLowerCase();
  const mediaPatterns = {
    'testimonial': ['testimonial_video', 'testimonial_image'],
    'profile pic': ['testimonial_1', 'testimonial_2', 'testimonial_3', 'testimonial_4']
  };

  // Try to match key to media field
  for (const [pattern, fieldNames] of Object.entries(mediaPatterns)) {
    if (keyLower.includes(pattern)) {
      // Try each potential field name
      for (const fieldName of fieldNames) {
        if (media[fieldName]) {
          console.log(`[Inference] Media URL found for pattern "${pattern}": ${fieldName}`);
          return media[fieldName];
        }
      }
    }
  }

  // Check for numbered testimonial profile pics
  const testimonialMatch = key.match(/Profile Pic (\d+)/i);
  if (testimonialMatch) {
    const num = parseInt(testimonialMatch[1]);
    const fieldName = `testimonial_${num}`;
    if (media[fieldName]) {
      console.log(`[Inference] Testimonial image found: ${fieldName}`);
      return media[fieldName];
    }
  }

  // Fallback to default value from schema
  const defaultUrl = metadata.defaultValue || '';
  if (defaultUrl) {
    console.log(`[Inference] Media URL using default: ${defaultUrl}`);
  } else {
    console.log(`[Inference] No media URL found for "${key}", returning empty`);
  }
  return defaultUrl;
}

/**
 * Infer embedded code (like calendar)
 * @param {string} key - Custom value key
 * @param {object} metadata - Schema metadata
 * @param {object} vaultContent - Vault content
 * @returns {string} - Embedded code or empty string
 */
function inferEmbeddedCode(key, metadata, vaultContent) {
  const media = vaultContent.media || {};

  // Check for calendar embed code
  if (key.toLowerCase().includes('calendar') || key.toLowerCase().includes('booking')) {
    if (media.booking_calendar_code || media.calendar_embed) {
      console.log(`[Inference] Calendar embed code found`);
      return media.booking_calendar_code || media.calendar_embed;
    }
  }

  // Fallback to default
  const defaultCode = metadata.defaultValue || '';
  console.log(`[Inference] Embedded code using default (${defaultCode.length} chars)`);
  return defaultCode;
}

/**
 * Infer text value (fallback for any unmapped text fields)
 * @param {string} key - Custom value key
 * @param {object} metadata - Schema metadata
 * @param {object} vaultContent - Vault content
 * @returns {string} - Text value
 */
function inferTextValue(key, metadata, vaultContent) {
  // Most text values should be handled by explicit prompts
  // This is a fallback for any missed values

  // ALWAYS return default value from schema (never empty)
  const defaultText = metadata.defaultValue || '';
  if (defaultText) {
    console.log(`[Inference] Text value using default: "${defaultText.substring(0, 50)}${defaultText.length > 50 ? '...' : ''}"`);
  } else {
    console.warn(`[Inference] WARNING: No default value for "${key}" - this should not happen!`);
  }
  return defaultText;
}

/**
 * Fill missing values using inference
 * @param {object} generatedValues - Values from prompt engine
 * @param {array} allCustomValueKeys - All custom value keys from schema
 * @param {object} vaultContent - Vault content for inference
 * @returns {object} - Complete custom values object
 */
export function fillMissingWithInference(generatedValues, allCustomValueKeys, vaultContent) {
  const complete = { ...generatedValues };
  let inferredCount = 0;

  console.log(`[Inference] Starting inference for ${allCustomValueKeys.length} total custom values`);
  console.log(`[Inference] Already have ${Object.keys(generatedValues).length} values from prompts`);

  for (const key of allCustomValueKeys) {
    // Skip if already generated and not empty
    if (complete[key] && complete[key] !== '') {
      continue;
    }

    // Infer value
    const inferredValue = inferCustomValue(key, vaultContent);
    complete[key] = inferredValue;

    if (inferredValue && inferredValue !== '') {
      inferredCount++;
    }
  }

  const totalFilled = Object.values(complete).filter(v => v && v !== '').length;
  console.log(`[Inference] ✓ Inference complete: ${inferredCount} values inferred, ${totalFilled}/${allCustomValueKeys.length} total filled`);

  return complete;
}

/**
 * Get inference statistics
 * @param {object} customValues - Custom values object
 * @param {array} allKeys - All custom value keys
 * @returns {object} - Statistics
 */
export function getInferenceStatistics(customValues, allKeys) {
  const filled = allKeys.filter(key => customValues[key] && customValues[key] !== '').length;
  const empty = allKeys.length - filled;

  const byType = {};
  for (const key of allKeys) {
    const metadata = NEW_GHL_SCHEMA[key];
    if (!metadata) continue;

    if (!byType[metadata.type]) {
      byType[metadata.type] = { total: 0, filled: 0, empty: 0 };
    }

    byType[metadata.type].total++;
    if (customValues[key] && customValues[key] !== '') {
      byType[metadata.type].filled++;
    } else {
      byType[metadata.type].empty++;
    }
  }

  return {
    total: allKeys.length,
    filled,
    empty,
    fillRate: Math.round((filled / allKeys.length) * 100) + '%',
    byType
  };
}

/**
 * Validate inferred values (check for common issues)
 * @param {object} customValues - Custom values object
 * @returns {array} - Array of warnings
 */
export function validateInferredValues(customValues) {
  const warnings = [];

  for (const [key, value] of Object.entries(customValues)) {
    const metadata = NEW_GHL_SCHEMA[key];
    if (!metadata) continue;

    // Check colors are valid hex codes
    if (metadata.type === 'color' && value) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        warnings.push({
          key,
          issue: 'Invalid color format',
          value,
          expected: 'Hex code like #000000'
        });
      }
    }

    // Check URLs are valid
    if ((metadata.type === 'image' || metadata.type === 'video' || metadata.type === 'url') && value) {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        warnings.push({
          key,
          issue: 'Invalid URL format',
          value: value.substring(0, 50),
          expected: 'Should start with http:// or https://'
        });
      }
    }

    // Check critical values are not empty
    if (metadata.critical && (!value || value === '')) {
      warnings.push({
        key,
        issue: 'Critical value is empty',
        value: '',
        expected: 'Must have a value'
      });
    }
  }

  if (warnings.length > 0) {
    console.warn(`[Inference] Found ${warnings.length} validation warnings`);
  }

  return warnings;
}

export default {
  inferCustomValue,
  fillMissingWithInference,
  getInferenceStatistics,
  validateInferredValues
};
