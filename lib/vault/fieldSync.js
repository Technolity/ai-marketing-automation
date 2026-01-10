/**
 * Field Sync Rules for Vault Content
 *
 * Defines sync relationships between fields across different vault sections.
 * When a source field is updated, automatically sync to dependent fields.
 */

/**
 * Field sync rules mapping
 * Structure: { sourceSection: { sourceField: [{ targetSection, targetField, transform }] } }
 */
export const FIELD_SYNC_RULES = {
  // Lead Magnet → Facebook Ads sync
  leadMagnet: {
    'freeGift.title': [
      {
        targetSection: 'facebookAds',
        targetField: 'adCopy.freeGiftName',
        transform: (value) => value, // Direct copy
        description: 'Sync Free Gift title to all Facebook Ads'
      }
    ]
  }
};

/**
 * Get sync targets for a given source field
 * @param {string} sectionId - Source section ID (e.g., 'leadMagnet')
 * @param {string} fieldPath - Source field path (e.g., 'freeGift.title')
 * @returns {Array} Array of sync target configurations
 */
export function getSyncTargets(sectionId, fieldPath) {
  const sectionRules = FIELD_SYNC_RULES[sectionId];
  if (!sectionRules) return [];

  const fieldRules = sectionRules[fieldPath];
  if (!fieldRules) return [];

  return fieldRules;
}

/**
 * Check if a field has sync targets
 * @param {string} sectionId - Source section ID
 * @param {string} fieldPath - Source field path
 * @returns {boolean} True if field has sync targets
 */
export function hasSyncTargets(sectionId, fieldPath) {
  return getSyncTargets(sectionId, fieldPath).length > 0;
}

/**
 * Get value from nested object path
 * @param {object} obj - Source object
 * @param {string} path - Dot-notation path (e.g., 'freeGift.title')
 * @returns {any} Value at path or undefined
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set value in nested object path
 * @param {object} obj - Target object
 * @param {string} path - Dot-notation path
 * @param {any} value - Value to set
 * @returns {object} Modified object (mutates original)
 */
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();

  let current = obj;
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

/**
 * Apply sync transformations to target content
 * @param {string} sourceSection - Source section ID
 * @param {string} sourceField - Source field path
 * @param {any} sourceValue - Source field value
 * @param {object} targetContent - Target section content to modify
 * @returns {object} Modified target content with sync applied
 */
export function applySyncToTarget(sourceSection, sourceField, sourceValue, targetContent) {
  const syncTargets = getSyncTargets(sourceSection, sourceField);

  if (syncTargets.length === 0) {
    return targetContent;
  }

  const modifiedContent = { ...targetContent };

  for (const target of syncTargets) {
    const transformedValue = target.transform ? target.transform(sourceValue) : sourceValue;
    setNestedValue(modifiedContent, target.targetField, transformedValue);
  }

  return modifiedContent;
}

/**
 * Generate sync preview message for UI
 * @param {string} sourceSection - Source section ID
 * @param {string} sourceField - Source field path
 * @returns {string} Human-readable sync description
 */
export function getSyncPreviewMessage(sourceSection, sourceField) {
  const syncTargets = getSyncTargets(sourceSection, sourceField);

  if (syncTargets.length === 0) {
    return null;
  }

  const targetDescriptions = syncTargets.map(target => {
    const sectionName = formatSectionName(target.targetSection);
    return `${sectionName} (${target.targetField})`;
  });

  return `Will sync to: ${targetDescriptions.join(', ')}`;
}

/**
 * Format section ID to human-readable name
 * @param {string} sectionId - Section ID (e.g., 'facebookAds')
 * @returns {string} Formatted name (e.g., 'Facebook Ads')
 */
function formatSectionName(sectionId) {
  const nameMap = {
    'leadMagnet': 'Lead Magnet',
    'facebookAds': 'Facebook Ads',
    'idealClient': 'Ideal Client',
    'message': 'Message',
    'story': 'Story',
    'offer': 'Offer',
    'salesScripts': 'Sales Scripts',
    'vsl': 'VSL',
    'emails': 'Emails',
    'funnelCopy': 'Funnel Copy'
  };

  return nameMap[sectionId] || sectionId;
}

export default {
  FIELD_SYNC_RULES,
  getSyncTargets,
  hasSyncTargets,
  getNestedValue,
  setNestedValue,
  applySyncToTarget,
  getSyncPreviewMessage
};
