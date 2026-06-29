import { describe, expect, it } from 'vitest';
import { buildSlotDeployCustomValues, extractSmsMessage, mergeVaultFieldRowsIntoContent } from '@/lib/ghl/slotDeployMapper';
import { getSlotKeys } from '@/lib/ghl/slots';

const sampleVaultContent = {
  colors: {
    colorPalette: {
      primary: { hex: '#111111' },
      secondary: '#222222',
      tertiary: { hex: '#333333' },
    },
  },
  media: {
    main_vsl: 'https://www.youtube.com/watch?v=abc123',
  },
  emails: {
    emailSequence: {
      email7: { subject: 'Email 7 subject', preview: 'Email 7 preview', body: 'Email 7 body' },
      email8a: { subject: 'Email 8 morning subject', preview: 'Email 8 morning preview', body: 'Email 8 morning body' },
      email8b: { subject: 'Email 8 afternoon subject', preview: 'Email 8 afternoon preview', body: 'Email 8 afternoon body' },
      email8c: { subject: 'Email 8 evening subject', preview: 'Email 8 evening preview', body: 'Email 8 evening body' },
      email14: { subject: 'Email 14 subject', preview: 'Email 14 preview', body: 'Email 14 body' },
      email15a: { subject: 'Email 15 morning subject', preview: 'Email 15 morning preview', body: 'Email 15 morning body' },
      email15b: { subject: 'Email 15 afternoon subject', preview: 'Email 15 afternoon preview', body: 'Email 15 afternoon body' },
      email15c: { subject: 'Email 15 evening subject', preview: 'Email 15 evening preview', body: 'Email 15 evening body' },
    },
  },
  sms: {
    smsSequence: {
      sms8a: { message: 'SMS 8 morning' },
      sms8b: { message: 'SMS 8 afternoon' },
      sms8c: { message: 'SMS 8 evening' },
      sms9: { message: 'SMS 9' },
      sms10: { message: 'SMS 10' },
      sms11: { message: 'SMS 11' },
      sms12: { message: 'SMS 12' },
      sms13: { message: 'SMS 13' },
      sms14: { message: 'SMS 14' },
      sms15a: { message: 'SMS 15 morning' },
      sms15b: { message: 'SMS 15 afternoon' },
      sms15c: { message: 'SMS 15 evening' },
    },
  },
  appointmentReminders: {
    smsReminders: {
      confirmationSms: { message: 'Booked SMS' },
      reminder48HoursSms: { message: '48 hour SMS' },
      reminder24HoursSms: { message: '24 hour SMS' },
      reminder1HourSms: { message: '1 hour SMS' },
      reminder10MinSms: { message: '10 min SMS' },
      startingNowSms: { message: 'At call SMS' },
    },
  },
};

describe('buildSlotDeployCustomValues', () => {
  it('does not stringify empty SMS placeholder objects', () => {
    expect(extractSmsMessage({ timing: '', message: '' })).toBe('');
    expect(extractSmsMessage({ timing: 'Day 8', message: 'Book now' })).toBe('Book now');
  });

  it('maps the reported slot 04 custom values from the current vault shapes', () => {
    const values = buildSlotDeployCustomValues({
      vaultContent: sampleVaultContent,
      slotIndex: 4,
    });

    expect(values).toMatchObject({
      '04_vsl_video_link': 'https://www.youtube.com/embed/abc123',
      '04_primary_color': '#111111',
      '04_secondary_color': '#222222',
      '04_tertiary_color': '#333333',
      '04_optin_sms_8_morning': 'SMS 8 morning',
      '04_optin_sms_8_afternoon': 'SMS 8 afternoon',
      '04_optin_sms_8_evening': 'SMS 8 evening',
      '04_optin_sms_9': 'SMS 9',
      '04_optin_sms_10': 'SMS 10',
      '04_optin_sms_11': 'SMS 11',
      '04_optin_sms_12': 'SMS 12',
      '04_optin_sms_13': 'SMS 13',
      '04_optin_sms_14': 'SMS 14',
      '04_optin_sms_15_morning': 'SMS 15 morning',
      '04_optin_sms_15_afternoon': 'SMS 15 afternoon',
      '04_optin_sms_15_evening': 'SMS 15 evening',
      '04_optin_email_subject_8': 'Email 8 morning subject',
      '04_optin_email_preheader_8': 'Email 8 morning preview',
      '04_optin_email_body_8': 'Email 8 morning body',
      '04_sms_when_call_booked': 'Booked SMS',
      '04_sms_48_hour_before_call_time': '48 hour SMS',
      '04_sms_24_hour_before_call_time': '24 hour SMS',
      '04_sms_1_hour_before_call_time': '1 hour SMS',
      '04_sms_10_min_before_call_time': '10 min SMS',
      '04_sms_at_call_time': 'At call SMS',
      '04_optin_email_subject_7': 'Email 7 subject',
      '04_optin_email_preheader_7': 'Email 7 preview',
      '04_optin_email_body_7': 'Email 7 body',
      '04_optin_email_subject_14': 'Email 14 subject',
      '04_optin_email_preheader_14': 'Email 14 preview',
      '04_optin_email_body_14': 'Email 14 body',
    });
  });

  it('maps the live `banner_image` field to the opt-in mockup image (free gift revert regression)', () => {
    const values = buildSlotDeployCustomValues({
      mediaFromFields: { banner_image: 'https://cdn.example.com/free-gift.png' },
      slotIndex: 3,
    });
    expect(values['03_optin_mockup_image']).toBe('https://cdn.example.com/free-gift.png');
  });

  it('still maps the legacy `product_mockup` field, but `banner_image` wins when both exist', () => {
    const legacyOnly = buildSlotDeployCustomValues({
      mediaFromFields: { product_mockup: 'https://cdn.example.com/legacy.png' },
      slotIndex: 3,
    });
    expect(legacyOnly['03_optin_mockup_image']).toBe('https://cdn.example.com/legacy.png');

    const both = buildSlotDeployCustomValues({
      mediaFromFields: {
        banner_image: 'https://cdn.example.com/free-gift.png',
        product_mockup: 'https://cdn.example.com/legacy.png',
      },
      slotIndex: 3,
    });
    expect(both['03_optin_mockup_image']).toBe('https://cdn.example.com/free-gift.png');
  });

  it('maps the live `profile_photo` field to the bio image', () => {
    const values = buildSlotDeployCustomValues({
      mediaFromFields: { profile_photo: 'https://cdn.example.com/headshot.png' },
      slotIndex: 3,
    });
    expect(values['03_vsl_bio_image']).toBe('https://cdn.example.com/headshot.png');
  });

  it('uses the requested slot prefix for all non-default slots', () => {
    const values = buildSlotDeployCustomValues({
      vaultContent: sampleVaultContent,
      slotIndex: 12,
    });

    expect(values['12_optin_sms_8_morning']).toBe('SMS 8 morning');
    expect(values['12_optin_email_subject_14']).toBe('Email 14 subject');
    expect(values['12_sms_when_call_booked']).toBe('Booked SMS');
    expect(values).not.toHaveProperty('04_optin_sms_8_morning');
  });

  it('only emits deploy keys that the slot template can create', () => {
    const values = buildSlotDeployCustomValues({
      vaultContent: sampleVaultContent,
      slotIndex: 5,
    });
    const creatableKeys = new Set(getSlotKeys(5).map(key => key.ghlKey));
    const missingFromTemplate = Object.keys(values).filter(key => !creatableKeys.has(key));

    expect(missingFromTemplate).toEqual([]);
  });

  it('merges granular vault fields into first deploy content for existing slot keys', () => {
    const mergedVaultContent = mergeVaultFieldRowsIntoContent({
      emails: { emailSequence: {} },
      sms: {
        smsSequence: {
          sms10: { timing: '', message: '' },
        },
      },
    }, [
      {
        section_id: 'emails',
        field_id: 'email8a',
        field_value: JSON.stringify({
          subject: 'Field Email 8 morning subject',
          preview: 'Field Email 8 morning preview',
          body: 'Field Email 8 morning body',
        }),
      },
      {
        section_id: 'sms',
        field_id: 'sms10',
        field_value: JSON.stringify({ timing: 'Day 10', message: 'Field SMS 10' }),
      },
      {
        section_id: 'sms',
        field_id: 'sms11',
        field_value: JSON.stringify({ timing: '', message: '' }),
      },
      {
        section_id: 'sms',
        field_id: 'sms15c',
        field_value: JSON.stringify({ timing: 'Day 15 - Evening', message: 'Field SMS 15 evening' }),
      },
    ]);

    const values = buildSlotDeployCustomValues({
      vaultContent: mergedVaultContent,
      slotIndex: 5,
    });

    expect(values).toMatchObject({
      '05_optin_email_subject_8': 'Field Email 8 morning subject',
      '05_optin_email_preheader_8': 'Field Email 8 morning preview',
      '05_optin_email_body_8': 'Field Email 8 morning body',
      '05_optin_email_subject_8_morning': 'Field Email 8 morning subject',
      '05_optin_sms_10': 'Field SMS 10',
      '05_optin_sms_15_evening': 'Field SMS 15 evening',
    });
    expect(values).not.toHaveProperty('05_optin_sms_11');
  });
});

describe('media field precedence — live vault field_id wins over legacy alias', () => {
  const build = (media, slotIndex = 4) =>
    buildSlotDeployCustomValues({ vaultContent: { media }, slotIndex });

  it('optin mockup: live banner_image wins over stale product_mockup', () => {
    const values = build({ banner_image: 'https://img/new.png', product_mockup: 'https://img/old.png' });
    expect(values['04_optin_mockup_image']).toBe('https://img/new.png');
  });

  it('optin mockup: legacy product_mockup still maps when banner_image absent', () => {
    const values = build({ product_mockup: 'https://img/legacy.png' });
    expect(values['04_optin_mockup_image']).toBe('https://img/legacy.png');
  });

  it('booking video: live vsl_video wins over stale main_vsl (embedded)', () => {
    const values = build({
      vsl_video: 'https://www.youtube.com/watch?v=NEW123',
      main_vsl: 'https://www.youtube.com/watch?v=OLD999',
    });
    expect(values['04_vsl_video_link']).toBe('https://www.youtube.com/embed/NEW123');
  });

  it('booking video: legacy main_vsl still maps when vsl_video absent', () => {
    const values = build({ main_vsl: 'https://www.youtube.com/watch?v=OLD999' });
    expect(values['04_vsl_video_link']).toBe('https://www.youtube.com/embed/OLD999');
  });

  it('bio image: live profile_photo wins over legacy bio_author', () => {
    const values = build({ profile_photo: 'https://img/me.png', bio_author: 'https://img/old-bio.png' });
    expect(values['04_vsl_bio_image']).toBe('https://img/me.png');
  });

  it('thank you video maps from live thankyou_video', () => {
    const values = build({ thankyou_video: 'https://www.youtube.com/watch?v=TY42' });
    expect(values['04_thankyou_page_video_link']).toBe('https://www.youtube.com/embed/TY42');
  });
});
