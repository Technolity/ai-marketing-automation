/**
 * KEY_TEMPLATE — canonical source of truth for all GHL custom value keys
 * used in slot-based funnel deployments.
 *
 * Every entry describes one GHL custom value key:
 *   type      : 'prefixed' — currently deployed with a '03_' prefix
 *               'base'     — currently deployed with no prefix
 *   base      : the key name without any slot prefix (strip '03_' from prefixed)
 *   section   : vault section this key belongs to
 *   vaultPath : dot-notation path inside the vault content object
 *
 * At deploy time, slotGenerator.js replaces the static '03_' / no-prefix with
 * '{N}_' for slot N (e.g. '01_', '02_', '03_', …).
 *
 * Total: 178 keys (86 prefixed + 92 base)
 */

export const KEY_TEMPLATE = [

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIN PAGE  (4 prefixed)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'prefixed', base: 'optin_headline_text',        section: 'funnelCopy', vaultPath: 'funnelCopy.optinPage.headline_text' },
  { type: 'prefixed', base: 'optin_subheadline_text',     section: 'funnelCopy', vaultPath: 'funnelCopy.optinPage.subheadline_text' },
  { type: 'prefixed', base: 'optin_cta_button_text',      section: 'funnelCopy', vaultPath: 'funnelCopy.optinPage.cta_button_text' },
  { type: 'prefixed', base: 'opt_in_popup_form_headline', section: 'funnelCopy', vaultPath: 'funnelCopy.optinPage.popup_form_headline' },

  // ─────────────────────────────────────────────────────────────────────────
  // SALES PAGE / VSL PAGE  (69 prefixed)
  // ─────────────────────────────────────────────────────────────────────────

  // Hero Section (4)
  { type: 'prefixed', base: 'vsl_hero_headline_text',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.hero_headline_text' },
  { type: 'prefixed', base: 'vsl_hero_subheadline_text',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.hero_subheadline_text' },
  { type: 'prefixed', base: 'vsl_hero_below_cta_sub_text',               section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.hero_below_cta_sub_text' },
  { type: 'prefixed', base: 'vsl_cta_text',                              section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.cta_text' },

  // Process Overview (2)
  { type: 'prefixed', base: 'vsl_process_headline',                      section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_headline' },
  { type: 'prefixed', base: 'vsl_process_subheadline',                   section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_subheadline' },

  // 6 Processes (12)
  { type: 'prefixed', base: 'vsl_process_1_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_1_headline' },
  { type: 'prefixed', base: 'vsl_process_1_subheadline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_1_subheadline' },
  { type: 'prefixed', base: 'vsl_process_2_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_2_headline' },
  { type: 'prefixed', base: 'vsl_process_2_subheadline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_2_subheadline' },
  { type: 'prefixed', base: 'vsl_process_3_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_3_headline' },
  { type: 'prefixed', base: 'vsl_process_3_subheadline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_3_subheadline' },
  { type: 'prefixed', base: 'vsl_process_4_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_4_headline' },
  { type: 'prefixed', base: 'vsl_process_4_subheadline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_4_subheadline' },
  { type: 'prefixed', base: 'vsl_process_5_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_5_headline' },
  { type: 'prefixed', base: 'vsl_process_5_subheadline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_5_subheadline' },
  { type: 'prefixed', base: 'vsl_process_6_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_6_headline' },
  { type: 'prefixed', base: 'vsl_process_6_subheadline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.process_6_subheadline' },

  // How It Works (5)
  { type: 'prefixed', base: 'vsl_how_it_works_headline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.how_it_works_headline' },
  { type: 'prefixed', base: 'vsl_how_it_works_subheadline_above_cta',    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.how_it_works_subheadline_above_cta' },
  { type: 'prefixed', base: 'vsl_how_it_works_point_1',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.how_it_works_point_1' },
  { type: 'prefixed', base: 'vsl_how_it_works_point_2',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.how_it_works_point_2' },
  { type: 'prefixed', base: 'vsl_how_it_works_point_3',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.how_it_works_point_3' },

  // Audience Callout (10)
  { type: 'prefixed', base: 'vsl_audience_callout_headline',             section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_headline' },
  { type: 'prefixed', base: 'vsl_audience_callout_for_headline',         section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_for_headline' },
  { type: 'prefixed', base: 'vsl_audience_callout_for_1',                section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_for_1' },
  { type: 'prefixed', base: 'vsl_audience_callout_for_2',                section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_for_2' },
  { type: 'prefixed', base: 'vsl_audience_callout_for_3',                section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_for_3' },
  { type: 'prefixed', base: 'vsl_audience_callout_not_headline',         section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_not_headline' },
  { type: 'prefixed', base: 'vsl_audience_callout_not_1',                section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_not_1' },
  { type: 'prefixed', base: 'vsl_audience_callout_not_2',                section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_not_2' },
  { type: 'prefixed', base: 'vsl_audience_callout_not_3',                section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_not_3' },
  { type: 'prefixed', base: 'vsl_audience_callout_cta_sub_text',         section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.audience_callout_cta_sub_text' },

  // This Is For (1)
  { type: 'prefixed', base: 'vsl_this_is_for_headline',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.this_is_for_headline' },

  // Call Expectations (9)
  { type: 'prefixed', base: 'vsl_call_expectations_headline',            section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_headline' },
  { type: 'prefixed', base: 'vsl_call_expectations_is_for_headline',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_is_for_headline' },
  { type: 'prefixed', base: 'vsl_call_expectations_is_for_bullet_1',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_is_for_bullet_1' },
  { type: 'prefixed', base: 'vsl_call_expectations_is_for_bullet_2',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_is_for_bullet_2' },
  { type: 'prefixed', base: 'vsl_call_expectations_is_for_bullet_3',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_is_for_bullet_3' },
  { type: 'prefixed', base: 'vsl_call_expectations_not_for_headline',    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_not_for_headline' },
  { type: 'prefixed', base: 'vsl_call_expectations_not_for_bullet_1',    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_not_for_bullet_1' },
  { type: 'prefixed', base: 'vsl_call_expectations_not_for_bullet_2',    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_not_for_bullet_2' },
  { type: 'prefixed', base: 'vsl_call_expectations_not_for_bullet_3',    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.call_expectations_not_for_bullet_3' },

  // Bio (2)
  { type: 'prefixed', base: 'vsl_bio_headline_text',                     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.bio_headline_text' },
  { type: 'prefixed', base: 'vsl_bio_paragraph_text',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.bio_paragraph_text' },

  // Testimonials (10)
  { type: 'prefixed', base: 'vsl_testimonial_headline_text',                      section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_headline_text' },
  { type: 'prefixed', base: 'vsl_testimonial_subheadline_text',                   section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_subheadline_text' },
  { type: 'prefixed', base: 'vsl_testimonial_review_1_headline',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_1_headline' },
  { type: 'prefixed', base: 'vsl_testimonial_review_1_subheadline_with_name',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_1_subheadline_with_name' },
  { type: 'prefixed', base: 'vsl_testimonial_review_2_headline',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_2_headline' },
  { type: 'prefixed', base: 'vsl_testimonial_review_2_subheadline_with_name',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_2_subheadline_with_name' },
  { type: 'prefixed', base: 'vsl_testimonial_review_3_headline',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_3_headline' },
  { type: 'prefixed', base: 'vsl_testimonial_review_3_subheadline_with_name',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_3_subheadline_with_name' },
  { type: 'prefixed', base: 'vsl_testimonial_review_4_headline',                  section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_4_headline' },
  { type: 'prefixed', base: 'vsl_testimonial_review_4_subheadline_with_name',     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.testimonial_review_4_subheadline_with_name' },

  // FAQ (9)
  { type: 'prefixed', base: 'vsl_faq_headline_text',                     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_headline_text' },
  { type: 'prefixed', base: 'vsl_faq_question_1',                        section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_question_1' },
  { type: 'prefixed', base: 'vsl_faq_answer_1',                          section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_answer_1' },
  { type: 'prefixed', base: 'vsl_faq_question_2',                        section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_question_2' },
  { type: 'prefixed', base: 'vsl_faq_answer_2',                          section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_answer_2' },
  { type: 'prefixed', base: 'vsl_faq_question_3',                        section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_question_3' },
  { type: 'prefixed', base: 'vsl_faq_answer_3',                          section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_answer_3' },
  { type: 'prefixed', base: 'vsl_faq_question_4',                        section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_question_4' },
  { type: 'prefixed', base: 'vsl_faq_answer_4',                          section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.faq_answer_4' },

  // Final CTA (3)
  { type: 'prefixed', base: 'vsl_final_cta_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.final_cta_headline' },
  { type: 'prefixed', base: 'vsl_final_cta_subheadline',                 section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.final_cta_subheadline' },
  { type: 'prefixed', base: 'vsl_final_cta_subtext',                     section: 'funnelCopy', vaultPath: 'funnelCopy.salesPage.final_cta_subtext' },

  // ─────────────────────────────────────────────────────────────────────────
  // CALENDAR PAGE  (2 prefixed)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'prefixed', base: 'calender_page_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.calendarPage.headline' },
  { type: 'prefixed', base: 'calender_page_embedded_calender_code',      section: 'funnelCopy', vaultPath: 'funnelCopy.calendarPage.calendar_embedded_code' },

  // ─────────────────────────────────────────────────────────────────────────
  // THANK YOU PAGE  (2 prefixed)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'prefixed', base: 'thankyou_page_headline',                    section: 'funnelCopy', vaultPath: 'funnelCopy.thankYouPage.headline' },
  { type: 'prefixed', base: 'thankyou_page_sub__headline',               section: 'funnelCopy', vaultPath: 'funnelCopy.thankYouPage.subheadline' },

  // ─────────────────────────────────────────────────────────────────────────
  // COMPANY EMAIL  (1 prefixed)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'prefixed', base: 'company_email',                             section: 'company',    vaultPath: 'company.email' },

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIA — prefixed  (8 prefixed)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'prefixed', base: 'vsl_bio_image',                             section: 'media',      vaultPath: 'media.bio_author' },
  { type: 'prefixed', base: 'optin_mockup_image',                        section: 'media',      vaultPath: 'media.product_mockup' },
  { type: 'prefixed', base: 'vsl_video_link',                            section: 'media',      vaultPath: 'media.main_vsl' },
  { type: 'prefixed', base: 'thankyou_page_video_link',                  section: 'media',      vaultPath: 'media.thankyou_video' },
  { type: 'prefixed', base: 'vsl_testimonial_review_1_image',            section: 'media',      vaultPath: 'media.testimonial_review_1_image' },
  { type: 'prefixed', base: 'vsl_testimonial_review_2_image',            section: 'media',      vaultPath: 'media.testimonial_review_2_image' },
  { type: 'prefixed', base: 'vsl_testimonial_review_3_image',            section: 'media',      vaultPath: 'media.testimonial_review_3_image' },
  { type: 'prefixed', base: 'vsl_testimonial_review_4_image',            section: 'media',      vaultPath: 'media.testimonial_review_4_image' },

  // ─────────────────────────────────────────────────────────────────────────
  // EMAILS — base keys  (44 base: freeGift×2 + day1-14×3)
  // ─────────────────────────────────────────────────────────────────────────

  // Free Gift (2)
  { type: 'base', base: 'free_gift_email_subject', section: 'emails', vaultPath: 'emails.emailSequence.freeGift.subject' },
  { type: 'base', base: 'free_gift_email_body',    section: 'emails', vaultPath: 'emails.emailSequence.freeGift.body' },

  // Day 1 (3)
  { type: 'base', base: 'optin_email_subject_1',   section: 'emails', vaultPath: 'emails.emailSequence.day1.subject' },
  { type: 'base', base: 'optin_email_preheader_1', section: 'emails', vaultPath: 'emails.emailSequence.day1.preheader' },
  { type: 'base', base: 'optin_email_body_1',      section: 'emails', vaultPath: 'emails.emailSequence.day1.body' },

  // Day 2 (3)
  { type: 'base', base: 'optin_email_subject_2',   section: 'emails', vaultPath: 'emails.emailSequence.day2.subject' },
  { type: 'base', base: 'optin_email_preheader_2', section: 'emails', vaultPath: 'emails.emailSequence.day2.preheader' },
  { type: 'base', base: 'optin_email_body_2',      section: 'emails', vaultPath: 'emails.emailSequence.day2.body' },

  // Day 3 (3)
  { type: 'base', base: 'optin_email_subject_3',   section: 'emails', vaultPath: 'emails.emailSequence.day3.subject' },
  { type: 'base', base: 'optin_email_preheader_3', section: 'emails', vaultPath: 'emails.emailSequence.day3.preheader' },
  { type: 'base', base: 'optin_email_body_3',      section: 'emails', vaultPath: 'emails.emailSequence.day3.body' },

  // Day 4 (3)
  { type: 'base', base: 'optin_email_subject_4',   section: 'emails', vaultPath: 'emails.emailSequence.day4.subject' },
  { type: 'base', base: 'optin_email_preheader_4', section: 'emails', vaultPath: 'emails.emailSequence.day4.preheader' },
  { type: 'base', base: 'optin_email_body_4',      section: 'emails', vaultPath: 'emails.emailSequence.day4.body' },

  // Day 5 (3)
  { type: 'base', base: 'optin_email_subject_5',   section: 'emails', vaultPath: 'emails.emailSequence.day5.subject' },
  { type: 'base', base: 'optin_email_preheader_5', section: 'emails', vaultPath: 'emails.emailSequence.day5.preheader' },
  { type: 'base', base: 'optin_email_body_5',      section: 'emails', vaultPath: 'emails.emailSequence.day5.body' },

  // Day 6 (3)
  { type: 'base', base: 'optin_email_subject_6',   section: 'emails', vaultPath: 'emails.emailSequence.day6.subject' },
  { type: 'base', base: 'optin_email_preheader_6', section: 'emails', vaultPath: 'emails.emailSequence.day6.preheader' },
  { type: 'base', base: 'optin_email_body_6',      section: 'emails', vaultPath: 'emails.emailSequence.day6.body' },

  // Day 7 (3)
  { type: 'base', base: 'optin_email_subject_7',   section: 'emails', vaultPath: 'emails.emailSequence.day7.subject' },
  { type: 'base', base: 'optin_email_preheader_7', section: 'emails', vaultPath: 'emails.emailSequence.day7.preheader' },
  { type: 'base', base: 'optin_email_body_7',      section: 'emails', vaultPath: 'emails.emailSequence.day7.body' },

  // Day 8 (3)
  { type: 'base', base: 'optin_email_subject_8',   section: 'emails', vaultPath: 'emails.emailSequence.day8.subject' },
  { type: 'base', base: 'optin_email_preheader_8', section: 'emails', vaultPath: 'emails.emailSequence.day8.preheader' },
  { type: 'base', base: 'optin_email_body_8',      section: 'emails', vaultPath: 'emails.emailSequence.day8.body' },

  // Day 9 (3)
  { type: 'base', base: 'optin_email_subject_9',   section: 'emails', vaultPath: 'emails.emailSequence.day9.subject' },
  { type: 'base', base: 'optin_email_preheader_9', section: 'emails', vaultPath: 'emails.emailSequence.day9.preheader' },
  { type: 'base', base: 'optin_email_body_9',      section: 'emails', vaultPath: 'emails.emailSequence.day9.body' },

  // Day 10 (3)
  { type: 'base', base: 'optin_email_subject_10',   section: 'emails', vaultPath: 'emails.emailSequence.day10.subject' },
  { type: 'base', base: 'optin_email_preheader_10', section: 'emails', vaultPath: 'emails.emailSequence.day10.preheader' },
  { type: 'base', base: 'optin_email_body_10',      section: 'emails', vaultPath: 'emails.emailSequence.day10.body' },

  // Day 11 (3)
  { type: 'base', base: 'optin_email_subject_11',   section: 'emails', vaultPath: 'emails.emailSequence.day11.subject' },
  { type: 'base', base: 'optin_email_preheader_11', section: 'emails', vaultPath: 'emails.emailSequence.day11.preheader' },
  { type: 'base', base: 'optin_email_body_11',      section: 'emails', vaultPath: 'emails.emailSequence.day11.body' },

  // Day 12 (3)
  { type: 'base', base: 'optin_email_subject_12',   section: 'emails', vaultPath: 'emails.emailSequence.day12.subject' },
  { type: 'base', base: 'optin_email_preheader_12', section: 'emails', vaultPath: 'emails.emailSequence.day12.preheader' },
  { type: 'base', base: 'optin_email_body_12',      section: 'emails', vaultPath: 'emails.emailSequence.day12.body' },

  // Day 13 (3)
  { type: 'base', base: 'optin_email_subject_13',   section: 'emails', vaultPath: 'emails.emailSequence.day13.subject' },
  { type: 'base', base: 'optin_email_preheader_13', section: 'emails', vaultPath: 'emails.emailSequence.day13.preheader' },
  { type: 'base', base: 'optin_email_body_13',      section: 'emails', vaultPath: 'emails.emailSequence.day13.body' },

  // Day 14 (3)
  { type: 'base', base: 'optin_email_subject_14',   section: 'emails', vaultPath: 'emails.emailSequence.day14.subject' },
  { type: 'base', base: 'optin_email_preheader_14', section: 'emails', vaultPath: 'emails.emailSequence.day14.preheader' },
  { type: 'base', base: 'optin_email_body_14',      section: 'emails', vaultPath: 'emails.emailSequence.day14.body' },

  // ─────────────────────────────────────────────────────────────────────────
  // SMS — base keys  (19 base)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'base', base: 'optin_sms_1',            section: 'sms', vaultPath: 'sms.smsSequence.sms1.message' },
  { type: 'base', base: 'optin_sms_2',            section: 'sms', vaultPath: 'sms.smsSequence.sms2.message' },
  { type: 'base', base: 'optin_sms_3',            section: 'sms', vaultPath: 'sms.smsSequence.sms3.message' },
  { type: 'base', base: 'optin_sms_4',            section: 'sms', vaultPath: 'sms.smsSequence.sms4.message' },
  { type: 'base', base: 'optin_sms_5',            section: 'sms', vaultPath: 'sms.smsSequence.sms5.message' },
  { type: 'base', base: 'optin_sms_6',            section: 'sms', vaultPath: 'sms.smsSequence.sms6.message' },
  // sms7a → slot 7 (day 7 morning)
  { type: 'base', base: 'optin_sms_7',            section: 'sms', vaultPath: 'sms.smsSequence.sms7a.message' },
  // sms7b — Day 7 Evening (own key, follows day-8 pattern)
  { type: 'base', base: 'optin_sms_7_evening',    section: 'sms', vaultPath: 'sms.smsSequence.sms7b.message' },
  // Day 8 — Closing Day 1
  { type: 'base', base: 'optin_sms_8_morning',    section: 'sms', vaultPath: 'sms.smsSequence.sms8a.message' },
  { type: 'base', base: 'optin_sms_8_afternoon',  section: 'sms', vaultPath: 'sms.smsSequence.sms8b.message' },
  // sms8c shares the optin_sms_8_evening GHL key with sms7b (as defined in source)
  { type: 'base', base: 'optin_sms_8_evening',    section: 'sms', vaultPath: 'sms.smsSequence.sms8c.message' },
  // Days 9-14
  { type: 'base', base: 'optin_sms_9',            section: 'sms', vaultPath: 'sms.smsSequence.sms9.message' },
  { type: 'base', base: 'optin_sms_10',           section: 'sms', vaultPath: 'sms.smsSequence.sms10.message' },
  { type: 'base', base: 'optin_sms_11',           section: 'sms', vaultPath: 'sms.smsSequence.sms11.message' },
  { type: 'base', base: 'optin_sms_12',           section: 'sms', vaultPath: 'sms.smsSequence.sms12.message' },
  { type: 'base', base: 'optin_sms_13',           section: 'sms', vaultPath: 'sms.smsSequence.sms13.message' },
  { type: 'base', base: 'optin_sms_14',           section: 'sms', vaultPath: 'sms.smsSequence.sms14.message' },
  // Day 15 — Final Closing Day
  { type: 'base', base: 'optin_sms_15_morning',   section: 'sms', vaultPath: 'sms.smsSequence.sms15a.message' },
  { type: 'base', base: 'optin_sms_15_afternoon', section: 'sms', vaultPath: 'sms.smsSequence.sms15b.message' },
  { type: 'base', base: 'optin_sms_15_evening',   section: 'sms', vaultPath: 'sms.smsSequence.sms15c.message' },

  // ─────────────────────────────────────────────────────────────────────────
  // APPOINTMENT REMINDER EMAILS — base keys  (6 reminders × 3 fields = 18 base)
  // ─────────────────────────────────────────────────────────────────────────

  // When Call Booked (3)
  { type: 'base', base: 'email_subject_when_call_booked',   section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.whenCallBooked.subject' },
  { type: 'base', base: 'email_preheader_when_call_booked', section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.whenCallBooked.preheader' },
  { type: 'base', base: 'email_body_when_call_booked',      section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.whenCallBooked.body' },

  // 48 Hour Before (3)
  { type: 'base', base: 'email_subject_48_hour_before_call_time',   section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.48HourBefore.subject' },
  { type: 'base', base: 'email_preheader_48_hour_before_call_time', section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.48HourBefore.preheader' },
  { type: 'base', base: 'email_body_48_hour_before_call_time',      section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.48HourBefore.body' },

  // 24 Hour Before (3)
  { type: 'base', base: 'email_subject_24_hour_before_call_time',   section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.24HourBefore.subject' },
  { type: 'base', base: 'email_preheader_24_hour_before_call_time', section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.24HourBefore.preheader' },
  { type: 'base', base: 'email_body_24_hour_before_call_time',      section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.24HourBefore.body' },

  // 1 Hour Before (3)
  { type: 'base', base: 'email_subject_1_hour_before_call_time',   section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.1HourBefore.subject' },
  { type: 'base', base: 'email_preheader_1_hour_before_call_time', section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.1HourBefore.preheader' },
  { type: 'base', base: 'email_body_1_hour_before_call_time',      section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.1HourBefore.body' },

  // 10 Min Before (3)
  { type: 'base', base: 'email_subject_10_min_before_call_time',   section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.10MinBefore.subject' },
  { type: 'base', base: 'email_preheader_10_min_before_call_time', section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.10MinBefore.preheader' },
  { type: 'base', base: 'email_body_10_min_before_call_time',      section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.10MinBefore.body' },

  // At Call Time (3)
  { type: 'base', base: 'email_subject_at_call_time',   section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.atCallTime.subject' },
  { type: 'base', base: 'email_preheader_at_call_time', section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.atCallTime.preheader' },
  { type: 'base', base: 'email_body_at_call_time',      section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.atCallTime.body' },

  // ─────────────────────────────────────────────────────────────────────────
  // APPOINTMENT REMINDER SMS — base keys  (6 base)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'base', base: 'sms_when_call_booked',            section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.sms.whenCallBooked' },
  { type: 'base', base: 'sms_48_hour_before_call_time',    section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.sms.48HourBefore' },
  { type: 'base', base: 'sms_24_hour_before_call_time',    section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.sms.24HourBefore' },
  { type: 'base', base: 'sms_1_hour_before_call_time',     section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.sms.1HourBefore' },
  { type: 'base', base: 'sms_10_min_before_call_time',     section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.sms.10MinBefore' },
  { type: 'base', base: 'sms_at_call_time',                section: 'appointmentReminders', vaultPath: 'appointmentReminders.appointmentReminders.sms.atCallTime' },

  // ─────────────────────────────────────────────────────────────────────────
  // COLORS — base keys  (3 base)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'base', base: 'primary_color',   section: 'colors', vaultPath: 'colors.colorPalette.primary' },
  { type: 'base', base: 'secondary_color', section: 'colors', vaultPath: 'colors.colorPalette.secondary' },
  { type: 'base', base: 'tertiary_color',  section: 'colors', vaultPath: 'colors.colorPalette.tertiary' },

  // ─────────────────────────────────────────────────────────────────────────
  // UNIVERSAL / COMPANY — base keys  (2 base)
  // ─────────────────────────────────────────────────────────────────────────
  { type: 'base', base: 'logo_image',    section: 'media',   vaultPath: 'media.logo' },
  { type: 'base', base: 'company_name',  section: 'company', vaultPath: 'company.business_name' },
];
