import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * Looks up funnel's assigned slot from funnel_slot_assignments.
 * Returns { slotIndex, slotPrefix, basePrefix }
 */
export async function resolveSlotForFunnel(funnelId, supabaseClient) {
    const client = supabaseClient || supabaseAdmin;

    const { data, error } = await client
        .from('funnel_slot_assignments')
        .select('slot_index')
        .eq('funnel_id', funnelId)
        .maybeSingle();

    if (error) throw new Error(`Failed to resolve slot for funnel ${funnelId}: ${error.message}`);

    const slotIndex = data?.slot_index ?? 3;
    const slotPrefix = String(slotIndex).padStart(2, '0') + '_';
    const basePrefix = slotIndex === 3 ? '' : slotPrefix;

    return { slotIndex, slotPrefix, basePrefix };
}

/**
 * Transform a GHL key from its default format to the target slot's format.
 * Default format: prefixed keys start with '03_', base keys have no prefix.
 *
 * e.g. transformKey('03_optin_headline_text', '04_') → '04_optin_headline_text'
 * e.g. transformKey('primary_color', '04_', '04_') → '04_primary_color'
 * e.g. transformKey('03_company_email', '03_') → '03_company_email'
 * e.g. transformKey('primary_color', '03_', '') → 'primary_color'
 */
export function transformKey(key, slotPrefix, basePrefix) {
    if (key.startsWith('03_')) {
        return slotPrefix + key.slice(3);
    }
    return basePrefix + key;
}

export async function addStoredSlotIdsToExistingMap(existingMap, {
    userId,
    locationId,
    slotIndex,
    supabaseClient,
}) {
    const client = supabaseClient || supabaseAdmin;
    const { data, error } = await client
        .from('ghl_slot_custom_value_ids')
        .select('ghl_key, ghl_id')
        .eq('user_id', userId)
        .eq('location_id', locationId)
        .eq('slot_index', slotIndex);

    if (error) {
        console.warn(`[SlotHelper] Failed to load stored slot IDs: ${error.message}`);
        return 0;
    }

    for (const row of data || []) {
        if (!row.ghl_key || !row.ghl_id) continue;
        const entry = { id: row.ghl_id, name: row.ghl_key, source: 'stored_slot_id' };
        existingMap.set(row.ghl_key, entry);
        existingMap.set(row.ghl_key.toLowerCase(), entry);
    }

    return data?.length || 0;
}
