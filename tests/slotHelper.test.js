import { describe, expect, it } from 'vitest';

async function loadSlotHelper() {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
  return import('@/lib/ghl/slotHelper');
}

describe('slot helper utilities', () => {
  it('prefixes base keys for non-default slots', async () => {
    const { transformKey } = await loadSlotHelper();

    expect(transformKey('optin_sms_8_morning', '04_', '04_')).toBe('04_optin_sms_8_morning');
    expect(transformKey('03_vsl_video_link', '04_', '04_')).toBe('04_vsl_video_link');
  });

  it('adds stored slot IDs into the existing-value lookup map', async () => {
    const { addStoredSlotIdsToExistingMap } = await loadSlotHelper();
    const existingMap = new Map();
    const eqCalls = [];
    const chain = {
      from(table) {
        expect(table).toBe('ghl_slot_custom_value_ids');
        return chain;
      },
      select(columns) {
        expect(columns).toBe('ghl_key, ghl_id');
        return chain;
      },
      eq(column, value) {
        eqCalls.push([column, value]);
        if (eqCalls.length === 3) {
          return Promise.resolve({
            data: [{ ghl_key: '04_optin_sms_8_morning', ghl_id: 'cv_123' }],
            error: null,
          });
        }
        return chain;
      },
    };

    const count = await addStoredSlotIdsToExistingMap(existingMap, {
      userId: 'user_1',
      locationId: 'loc_1',
      slotIndex: 4,
      supabaseClient: chain,
    });

    expect(count).toBe(1);
    expect(existingMap.get('04_optin_sms_8_morning')).toMatchObject({
      id: 'cv_123',
      name: '04_optin_sms_8_morning',
      source: 'stored_slot_id',
    });
    expect(eqCalls).toEqual([
      ['user_id', 'user_1'],
      ['location_id', 'loc_1'],
      ['slot_index', 4],
    ]);
  });
});
