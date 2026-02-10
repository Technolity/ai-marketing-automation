/**
 * Content Hash Utility
 * Compares AI-generated content to detect identical regenerations.
 * Uses stable JSON stringification + SHA-256 for reliable comparison.
 */

import { createHash } from 'crypto';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * Recursively sort object keys for stable JSON stringification.
 * Ensures { a: 1, b: 2 } and { b: 2, a: 1 } produce the same hash.
 */
function stableStringify(obj) {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
        return '[' + obj.map(item => stableStringify(item)).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map(key => {
        return JSON.stringify(key) + ':' + stableStringify(obj[key]);
    });
    return '{' + parts.join(',') + '}';
}

/**
 * Compute a SHA-256 hash of parsed AI content using stable key ordering.
 * @param {object} content - The parsed AI JSON content
 * @returns {string} Hex digest
 */
export function hashContent(content) {
    const stable = stableStringify(content);
    return createHash('sha256').update(stable).digest('hex');
}

/**
 * Fetch the current vault_content row for a section.
 * @param {string} funnelId
 * @param {string} sectionId
 * @returns {Promise<{id: string, content: object, version: number} | null>}
 */
export async function fetchCurrentContent(funnelId, sectionId) {
    const { data, error } = await supabaseAdmin
        .from('vault_content')
        .select('id, content, version')
        .eq('funnel_id', funnelId)
        .eq('section_id', sectionId)
        .eq('is_current_version', true)
        .limit(1)
        .single();

    if (error || !data) return null;
    return data;
}
