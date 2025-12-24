# VSL Funnel Custom Values Mapping

Complete mapping of all 88 custom values used in your VSL funnel template.

---

## 📊 Overview

- **Total Custom Values:** 88
- **Funnel Pages:** 6 (Optin, VSL, Questionnaire, Booking, Thank You, Confirmation)
- **Content Sources:** 7 prompts + user intake + images + colors

---

## 🗺️ Complete Mapping

### OPTIN PAGE (12 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `optin_logo_image` | Images | Generated logo (optional) |
| `optin_headline_text` | Lead Magnet | titleAndHook.mainTitle |
| `optin_headline_text_color` | Colors | primary |
| `optin_sub_headline_text` | Lead Magnet | titleAndHook.subtitle |
| `optin_sub_headline_text_color` | Colors | secondary |
| `optin_cta_text` | Lead Magnet | landingPageCopy.ctaButtonText |
| `optin_cta_text_color` | Static | #ffffff |
| `optin_cta_background_color` | Colors | primary |
| `optin_header_bgcolor` | Static | #0a0a0b |
| `optin_mockup_image` | Images | Product mockup (generated) |
| `optin_popup_headline` | Lead Magnet | audienceConnection.openingStatement |
| `optin_popup_headline_color` | Colors | primary |

---

### QUESTIONNAIRE PAGE (6 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `questionnaire_hero_headline` | Message | oneLineMessage |
| `questionnaire_hero_headline_color` | Colors | primary |
| `questionnaire_hero_headline_pill_bgcolor` | Colors | secondary |
| `questionnaire_form_headline` | Static | "Tell Us About Your Goals" |
| `questionnaire_form_headline_color` | Colors | primary |
| `questionnaire_form_bgcolor` | Static | #1b1b1d |

---

### THANK YOU PAGE (7 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `thankyou_page_headline` | Static | "You're In! Here's What Happens Next..." |
| `thankyou_page_headline_color` | Colors | primary |
| `thankyou_page_sub_headline` | Static | "Watch the video below..." |
| `thankyou_page_sub_headline_color` | Colors | secondary |
| `thankyou_page_testimonial_headline` | Static | "What Others Are Saying..." |
| `thankyou_page_testimonial_headline_color` | Colors | primary |
| `thankyou_testimonial_bgcolor` | Static | #151517 |

---

### VSL PAGE - HERO SECTION (11 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `vsl_hero_headline` | VSL | keyHooks[0] |
| `vsl_hero_headline_color` | Colors | primary |
| `vsl_hero_sub_headline` | Message | outcomePromise.realisticExpectation |
| `vsl_hero_sub_headline_color` | Colors | secondary |
| `vsl_hero_acknowledgement_pill` | Static | "FREE TRAINING" |
| `vsl_hero_acknowledgement_pill_bgcolor` | Colors | secondary |
| `vsl_hero_acknowledgement_pill_color` | Static | #ffffff |
| `vsl_hero_timer_headline` | VSL | urgencyElements[0] |
| `vsl_hero_timer_headline_color` | Static | #ef4444 |
| `vsl_hero_cta_question_headline` | Message | ctaFraming.positioning |
| `vsl_hero_cta_question_headline_color` | Colors | primary |

---

### VSL PAGE - PROCESS SECTION (10 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `vsl_process_headline` | Static | "Here's How It Works..." |
| `vsl_process_headline_color` | Colors | primary |
| `vsl_process_sub_headline` | Program | overview.uniqueFramework |
| `vsl_process_sub_headline_color` | Colors | secondary |
| `vsl_process_description` | Static | #a1a1aa (color) |
| `vsl_process_description_pt_1` | VSL | stepsToSuccess[0].description |
| `vsl_process_description_pt_2` | VSL | stepsToSuccess[1].description |
| `vsl_process_description_pt_3` | VSL | stepsToSuccess[2].description |
| `vsl_process_description_pt_4` | VSL | stepsToSuccess[3].description |
| `vsl_process_description_pt_5` | VSL | threeTips[0].actionStep |

---

### VSL PAGE - TESTIMONIAL SECTION (4 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `vsl_testimonial_headline` | Static | "Real Results From Real People" |
| `vsl_testimonial_headline_color` | Colors | primary |
| `vsl_testimonial_sub_headline` | VSL / Intake | socialProofMentions[0] |
| `vsl_testimonial_sub_headline_color` | Colors | secondary |

---

### VSL PAGE - BIO SECTION (7 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `vsl_bio_image` | Images | Author photo (generated) |
| `vsl_bio_headline` | Static | "Meet Your Guide" |
| `vsl_bio_headline_colour` | Colors | primary |
| `vsl_bio_founder_name` | Intake | authorName (Q14) |
| `vsl_bio_founder_name_colour` | Colors | primary |
| `vsl_bio_description` | Story | shortVersion |
| `vsl_bio_description_colour` | Static | #a1a1aa |

---

### VSL PAGE - CTA SECTION (5 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `vsl_cta_headline` | VSL | callToActionName |
| `vsl_cta_headline_color` | Static | #ffffff |
| `vsl_cta_sub_headline` | Message | ctaFraming.emotionalState |
| `vsl_cta_sub_headline_text_color` | Static | #ffffff |
| `vsl_cta_bgcolor` | Colors | primary |

---

### VSL PAGE - FAQ SECTION (18 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `vsl_faq_headline` | Static | "Frequently Asked Questions" |
| `vsl_faq_headline_color` | Colors | primary |
| `vsl_faq_ques_color` | Colors | primary |
| `vsl_faq_answer_color` | Static | #a1a1aa |
| `vsl_faq_ques_1` | Emails | faqs[0].question |
| `vsl_faq_answer_1` | Emails | faqs[0].answer |
| `vsl_faq_ques_2` | Emails | faqs[1].question |
| `vsl_faq_answer_2` | Emails | faqs[1].answer |
| `vsl_faq_ques_3` | Emails | faqs[2].question |
| `vsl_faq_answer_3` | Emails | faqs[2].answer |
| `vsl_faq_ques_4` | Emails | faqs[3].question |
| `vsl_faq_answer_4` | Emails | faqs[3].answer |
| `vsl_faq_ques_5` | Emails | faqs[4].question |
| `vsl_faq_answer_5` | Emails | faqs[4].answer |
| `vsl_faq_ques_6` | VSL | objectionHandlers[0].objection |
| `vsl_faq_answer_6` | VSL | objectionHandlers[0].response |
| `vsl_faq_ques_7` | VSL | objectionHandlers[1].objection |
| `vsl_faq_answer_7` | VSL | objectionHandlers[1].response |

---

### BOOKING CALENDAR PAGE (3 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `booking_calender_headline` | VSL | callToActionName |
| `booking_calender_headline_color` | Colors | primary |
| `booking_calender_headline_pill_color` | Colors | secondary |

---

### FOOTER / COMPANY INFO (6 fields)

| Custom Value | Source | Path |
|--------------|--------|------|
| `company_name` | Intake | businessName (Q2) |
| `company_address` | Intake | address |
| `company_support_email` | Intake | supportEmail |
| `company_telephone` | Intake | phone |
| `footer_bgcolor` | Static | #0a0a0b |
| `footer_text_color` | Static | #71717a |

---

## 📝 Content Source Summary

### Prompt 1 - Ideal Client
- No direct custom values (used for context)

### Prompt 2 - Million-Dollar Message
- `questionnaire_hero_headline`
- `vsl_hero_sub_headline`
- `vsl_hero_cta_question_headline`
- `vsl_cta_sub_headline`

### Prompt 3 - Personal Story
- `vsl_bio_description`

### Prompt 4 - Offer & Program
- `vsl_process_sub_headline`

### Prompt 6 - Lead Magnet
- `optin_headline_text`
- `optin_sub_headline_text`
- `optin_cta_text`
- `optin_popup_headline`

### Prompt 7 - VSL Script
- `vsl_hero_headline`
- `vsl_hero_timer_headline`
- `vsl_process_description_pt_1` through `pt_5`
- `vsl_testimonial_sub_headline`
- `vsl_cta_headline`
- `booking_calender_headline`
- `vsl_faq_ques_6, vsl_faq_answer_6`
- `vsl_faq_ques_7, vsl_faq_answer_7`

### Prompt 8 - Email Sequence
- `vsl_faq_ques_1` through `vsl_faq_ques_5`
- `vsl_faq_answer_1` through `vsl_faq_answer_5`

### User Intake (Q1-Q20)
- `vsl_bio_founder_name`
- `company_name`
- `company_address`
- `company_support_email`
- `company_telephone`

### Images (OpenAI DALL-E 3)
- `optin_logo_image`
- `optin_mockup_image`
- `vsl_bio_image`

### Colors (Q15 extraction)
- All `*_color` fields (30+ fields)
- Extracted from brand colors text → hex codes

### Static Values
- Headlines like "Here's How It Works..."
- Colors like #ffffff, #0a0a0b
- Text like "FREE TRAINING"

---

## ✅ Validation

After mapping, the system validates:

1. **Required fields present:**
   - `optin_headline_text`
   - `vsl_hero_headline`
   - `vsl_cta_headline`
   - `company_name`
   - `vsl_process_headline`
   - `vsl_bio_founder_name`

2. **Total field count:** Should be ~88 fields

3. **Coverage percentage:** (present / 88) × 100

---

## 🎯 Example Output

```json
{
  "optin_headline_text": "5-Step Business Growth Blueprint",
  "optin_headline_text_color": "#0891b2",
  "vsl_hero_headline": "How to Scale Your Business Without Burning Out",
  "vsl_hero_headline_color": "#0891b2",
  "vsl_process_description_pt_1": "Identify your ideal client avatar",
  "vsl_faq_ques_1": "How quickly will I see results?",
  "vsl_faq_answer_1": "Most clients see results within 2-3 weeks...",
  "vsl_bio_image": "https://supabase.co/storage/funnel-images/author_123.png",
  "company_name": "Ted McGrath Business Coaching",
  "booking_calender_headline": "Book Your Free Strategy Session"
}
```

---

## 🚀 Usage

```javascript
import { mapToVSLFunnel, validateVSLMapping } from '@/lib/ghl/vslFunnelMapper';

// Map session to custom values
const customValues = mapToVSLFunnel(sessionData, generatedImages);

// Validate mapping
const validation = validateVSLMapping(customValues);

console.log(validation);
// {
//   valid: true,
//   totalFields: 88,
//   expectedFields: 88,
//   coverage: 100,
//   missing: [],
//   status: 'PASS'
// }
```

---

**Last Updated:** December 2024  
**Funnel Type:** VSL Funnel (6 pages)  
**Total Fields:** 88

