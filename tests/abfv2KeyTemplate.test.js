import { describe, it, expect } from 'vitest';
import { ABFV2_KEY_TEMPLATE, getAbfv2SlotKeys, abfv2KeyCounts } from '@/lib/ghl/slots/abfv2KeyTemplate';

describe('ABFv2 key template', () => {
  it('includes the 11 baked segments and the workflow content, excludes free-gift', () => {
    const bases = ABFV2_KEY_TEMPLATE.map((e) => e.base);
    // 11 baked
    expect(bases).toContain('bv1_landing_css');
    expect(bases.filter((b) => /^bv1_landing_[1-6]$/.test(b))).toHaveLength(6);
    expect(bases).toContain('bv1_calendar_main');
    expect(bases).toContain('bv1_thankyou_main');
    expect(ABFV2_KEY_TEMPLATE.filter((e) => e.section === 'funnelHtml')).toHaveLength(11);
    // workflow content present
    expect(bases).toContain('optin_email_subject_1');
    expect(bases).toContain('optin_sms_1');
    expect(bases).toContain('email_subject_when_call_booked');
    expect(bases).toContain('sms_when_call_booked');
    expect(bases).toContain('company_name');
    // free-gift EXCLUDED
    expect(bases.filter((b) => b.startsWith('free_gift'))).toHaveLength(0);
    // copy/colors/media NOT included as values (baked)
    expect(ABFV2_KEY_TEMPLATE.some((e) => e.section === 'colors')).toBe(false);
    expect(ABFV2_KEY_TEMPLATE.some((e) => e.section === 'media')).toBe(false);
  });

  it('slot-prefixes every key as {NN}_abfv2_<base>', () => {
    const s1 = getAbfv2SlotKeys(1);
    expect(s1.every((k) => k.ghlKey.startsWith('01_abfv2_'))).toBe(true);
    expect(s1.find((k) => k.base === 'bv1_landing_css').ghlKey).toBe('01_abfv2_bv1_landing_css');
    expect(getAbfv2SlotKeys(10).find((k) => k.base === 'optin_email_subject_1').ghlKey)
      .toBe('10_abfv2_optin_email_subject_1');
  });

  it('has the expected per-section counts (117 total per slot)', () => {
    const counts = abfv2KeyCounts();
    expect(counts).toMatchObject({ funnelHtml: 11, emails: 60, sms: 20, appointmentReminders: 24, company: 2 });
    expect(counts.total).toBe(117);
    expect(counts.total).toBe(ABFV2_KEY_TEMPLATE.length);
  });
});
