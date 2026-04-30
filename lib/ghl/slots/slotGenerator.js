/**
 * slotGenerator.js
 *
 * Generates slot-specific GHL custom value key sets from the canonical KEY_TEMPLATE.
 * All keys get a '{N}_' prefix for slot N (e.g. '01_', '02_', '03_', …).
 *
 * The slot index determines the numeric prefix:
 *   slotIndex=1  → prefix '01_'
 *   slotIndex=3  → prefix '03_'  (matches current hardcoded '03_' deployment)
 */

import { KEY_TEMPLATE } from './keyTemplate.js';

/**
 * Returns an array of key descriptors for the given slot index.
 * Each descriptor extends the KEY_TEMPLATE entry with:
 *   ghlKey      — the actual GHL custom value key to read/write for this slot
 *   originalKey — the key as it exists in the current '03_'-prefixed or no-prefix deployment
 *
 * @param {number} slotIndex - 1-based slot number
 * @returns {Array<{type: string, base: string, section: string, vaultPath: string, ghlKey: string, originalKey: string}>}
 */
export function getSlotKeys(slotIndex) {
  const prefix = String(slotIndex).padStart(2, '0') + '_';
  return KEY_TEMPLATE.map(entry => ({
    ...entry,
    ghlKey: prefix + entry.base,
    originalKey: entry.type === 'prefixed'
      ? '03_' + entry.base
      : entry.base,
  }));
}

/**
 * Returns a map from vaultPath → ghlKey for the given slot index.
 * Useful for building a deploy payload: look up the vault value by path,
 * then write it to the returned GHL key.
 *
 * Note: if two entries share the same vaultPath (which can happen with shared
 * SMS keys), the last one wins. Check KEY_TEMPLATE comments for those cases.
 *
 * @param {number} slotIndex - 1-based slot number
 * @returns {Object.<string, string>} vaultPath → ghlKey
 */
export function getSlotVaultMap(slotIndex) {
  return Object.fromEntries(
    getSlotKeys(slotIndex).map(k => [k.vaultPath, k.ghlKey])
  );
}

/**
 * Returns the slot keys grouped by section name.
 *
 * @param {number} slotIndex - 1-based slot number
 * @returns {Object.<string, Array>} section → key descriptor array
 */
export function getSlotKeysBySection(slotIndex) {
  const keys = getSlotKeys(slotIndex);
  return keys.reduce((acc, k) => {
    (acc[k.section] = acc[k.section] || []).push(k);
    return acc;
  }, {});
}
