# Complete GHL Integration Guide

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Testing Phase - Funnel Custom Values Only

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Custom Values (122 Total)](#custom-values)
3. [Content-to-Field Mapping](#mapping)
4. [Image Generation (OpenAI Only)](#images)
5. [Funnel Type Specifications](#funnel-types)
6. [Testing Workflow](#testing)
7. [Validation & Troubleshooting](#validation)
8. [API Integration](#api)

---

## 🎯 System Overview

### What This System Does

**TedOS → GHL Integration** automatically:
1. Generates 122 custom values from your approved content
2. Creates funnel-specific images with OpenAI DALL-E 3
3. Maps content correctly to prevent jumbled data
4. Pushes/updates values directly to your GHL location
5. Validates everything before and after push

### Current Testing Phase

**✅ What We're Testing NOW:**
- Funnel page custom values (text content only)
- Image generation based on funnel type
- Mapping validation and schema checking
- Custom value create/update logic

**⏳ Coming After Testing:**
- Email sequence automation (18 emails)
- SMS sequence (5 messages)
- Appointment reminder automation (6 emails)

---

## 📝 Custom Values (122 Total)

### Distribution

| Category | Count | Status |
|----------|-------|--------|
| **Opt-in Page** | 15 | ✅ Mapped |
| **Thank You Page** | 10 | ✅ Mapped |
| **Sales Page** | 35 | ✅ Mapped |
| **Email Sequence** | 30 | ⏳ Phase 2 |
| **SMS Sequence** | 10 | ⏳ Phase 2 |
| **Appointment Reminders** | 12 | ⏳ Phase 2 |
| **Brand & Identity** | 10 | ✅ Mapped |

**Current Focus:** 70 custom values for funnel pages

---

## 🗺️ Content-to-Field Mapping

### How Content Maps to GHL Fields

#### Opt-in Page (15 fields)

```javascript
// From Lead Magnet (Prompt 6)
headline_main → leadMagnet.titleAndHook.mainTitle
subheadline → leadMagnet.titleAndHook.subtitle
lead_magnet_title → leadMagnet.titleAndHook.mainTitle
lead_magnet_description → leadMagnet.deliverables.format
lead_magnet_bullets → leadMagnet.mainContent.sections (formatted as HTML list)
cta_button_text → leadMagnet.landingPageCopy.ctaButtonText

// From Images (OpenAI)
lead_magnet_image_url → Generated based on funnel type
author_image_url → Professional headshot (generated)
logo_url → Brand logo (optional)

// From User Intake (Q1-Q20)
author_name → answers.authorName || answers.industry
author_title → answers.authorTitle || "{industry} Specialist"

// Static/Generated
trust_badges → "✓ 100% Free ✓ Instant Access ✓ No Credit Card Required"
social_proof_number → "Join 10,000+ members"
urgency_text → "Limited spots available this week"
privacy_text → "We respect your privacy. Unsubscribe at any time."
cta_subtext → "Join thousands of successful entrepreneurs"
```

#### Sales Page - Hero (4 fields)

```javascript
// From VSL (Prompt 7) + Message (Prompt 2)
sales_headline → vsl.keyHooks[0] || message.oneLineMessage
sales_subheadline → message.outcomePromise.realisticExpectation
hero_cta_text → vsl.callToActionName || "Book Your Free Strategy Session"

// User Provided
hero_video_url → (User uploads video)
```

#### Sales Page - Problem Section (5 fields)

```javascript
// From Ideal Client (Prompt 1)
pain_point_1 → idealClient.painPoints[0].pain
pain_point_2 → idealClient.painPoints[1].pain
pain_point_3 → idealClient.painPoints[2].pain

// From Message (Prompt 2)
problem_agitation → message.coreProblemReframe.currentStateLanguage

// Static
problem_headline → "Are You Struggling With This?"
```

#### Sales Page - Solution Section (4 fields)

```javascript
// From Message (Prompt 2) + Program (Prompt 4)
mechanism_name → message.uniqueMechanism.mechanismName || program.programName
mechanism_description → message.uniqueMechanism.howItsDifferent

// Static
solution_headline → "Introducing The Solution"
solution_text → (pulled from mechanism_name)
```

#### Sales Page - Offer Section (13 fields)

```javascript
// From Program/Offer (Prompt 4)
offer_name → program.programName
offer_description → program.overview.whatItIs
offer_bullets → program.deliverables[] (formatted as HTML list)

bonus_1_name → program.deliverables[0].what
bonus_1_value → "$5,000" (example)
bonus_1_description → program.deliverables[0].value

bonus_2_name → program.deliverables[1].what
bonus_2_value → "$2,500" (example)
bonus_2_description → program.deliverables[1].value

bonus_3_name → program.deliverables[2].what
bonus_3_value → "$1,500" (example)
bonus_3_description → program.deliverables[2].value

// From User Intake
offer_price → answers.pricing || "$5,000"

// Generated
offer_value → "Total Value: $25,000"
```

#### Brand & Identity (10 fields)

```javascript
// From User Intake (Q1-Q20)
brand_name → answers.businessName || answers.industry
support_email → answers.supportEmail || "support@yourbusiness.com"
phone_number → answers.phone || ""
website_url → answers.website || ""
social_facebook → answers.facebook || ""
social_instagram → answers.instagram || ""

// From Message (Prompt 2)
brand_tagline → message.oneLineMessage

// From Images (OpenAI)
logo_url → (Generated or uploaded)

// From Brand Colors (Q15 extraction)
primary_color → Extracted from answers.brandColors (hex format)
secondary_color → Extracted from answers.brandColors (hex format)
```

### Fallback Logic

Every critical field has a fallback chain:

```
headline_main:
  1. leadMagnet.titleAndHook.mainTitle (primary)
  2. message.oneLineMessage (fallback 1)
  3. "" (empty if all fail)

sales_headline:
  1. vsl.keyHooks[0] (primary)
  2. message.oneLineMessage (fallback 1)
  3. "" (empty if all fail)

mechanism_name:
  1. message.uniqueMechanism.mechanismName (primary)
  2. program.programName (fallback 1)
  3. "" (empty if all fail)
```

This ensures **no field is ever completely empty** if content exists anywhere in the system.

---

## 🖼️ Image Generation (OpenAI Only)

### Why OpenAI DALL-E 3?

- **Claude:** Text-only (no images)
- **Gemini:** Image generation not reliable for production
- **OpenAI DALL-E 3:** Industry-standard, consistent quality, 1024x1024 resolution

### Funnel-Type Specific Images

Each funnel type requires different images:

#### Free Book Funnel
```javascript
Required Images:
1. book_mockup → 3D book mockup (hardcover)
2. book_cover → Flat book cover design
3. author_photo → Professional headshot
```

#### Lead Magnet Funnel
```javascript
Required Images:
1. lead_magnet_mockup → PDF/ebook on device
2. author_photo → Professional headshot
```

#### VSL Funnel
```javascript
Required Images:
1. author_photo → Professional headshot
2. product_mockup → Course/program mockup
3. results_image → Before/after or results graph
```

#### Webinar Funnel
```javascript
Required Images:
1. webinar_thumbnail → YouTube-style thumbnail
2. author_photo → Professional headshot
3. slides_preview → Presentation slides preview
```

#### Application Funnel
```javascript
Required Images:
1. author_photo → Professional headshot
2. program_image → High-ticket program hero image
3. badge_image → Premium certification badge
```

### Image Generation Process

1. **User selects funnel type** at `/funnel-recommendation`
2. **System generates prompts** based on:
   - Funnel type
   - Approved content (ideal client, message, program)
   - Industry from Q1
   - Brand colors from Q15
3. **OpenAI DALL-E 3** generates images (1024x1024, standard quality)
4. **Upload to Supabase Storage** (`funnel-images` bucket)
5. **Save to database** (`generated_images` table)
6. **Map to custom values:**
   - `lead_magnet_image_url`
   - `author_image_url`
   - `logo_url`

### Example Image Prompt

For a "Lead Magnet Funnel" in the "business coaching" industry:

```
Digital product mockup for "5-Step Business Growth Blueprint". 
PDF or ebook displayed on tablet/laptop screen. 
Business coaching related imagery. 
Blue and white colors. 
Professional, clean, modern aesthetic. 
High-end digital product visualization.
```

---

## 🎯 Funnel Type Specifications

### Complete Funnel Type Config

```javascript
FUNNEL_TYPES = {
  'free-book-funnel': {
    name: 'Free Book Funnel',
    requiredImages: ['book_mockup', 'author_photo', 'book_cover'],
    description: 'Physical book offer with shipping',
    customValues: 70, // Total fields needed
    primaryGoal: 'Lead capture + book request'
  },
  
  'lead-magnet-funnel': {
    name: 'Lead Magnet Funnel',
    requiredImages: ['lead_magnet_mockup', 'author_photo'],
    description: 'Digital download offer',
    customValues: 70,
    primaryGoal: 'Lead capture + instant download'
  },
  
  'vsl-funnel': {
    name: 'VSL Funnel',
    requiredImages: ['author_photo', 'product_mockup', 'results_image'],
    description: 'Video sales letter with appointment booking',
    customValues: 70,
    primaryGoal: 'Watch video → Book call'
  },
  
  'webinar-funnel': {
    name: 'Webinar Funnel',
    requiredImages: ['webinar_thumbnail', 'author_photo', 'slides_preview'],
    description: 'Live or automated webinar registration',
    customValues: 70,
    primaryGoal: 'Register for webinar → Attend'
  },
  
  'application-funnel': {
    name: 'Application Funnel',
    requiredImages: ['author_photo', 'program_image', 'badge_image'],
    description: 'High-ticket application and qualifier',
    customValues: 70,
    primaryGoal: 'Qualify leads → Application → Call'
  }
};
```

---

## ✅ Testing Workflow

### Step-by-Step Testing Process

#### 1. Complete Intake (20 Questions)
```
Location: /intake_form
Goal: Answer all 20 questions with real business data
Result: answers object saved to database
```

#### 2. Generate All Content
```
Location: /intake_form (after Q20)
Action: Click "Generate All Content"
AI: Claude generates all 14 content types
Result: results_data object with keys 1-15
```

#### 3. Review & Approve Business Core
```
Location: /business-core
Content Types: 6 core types (Ideal Client, Message, Story, Offer, Sales Scripts, Lead Magnet)
Action: Expand each → Review → Approve or Regenerate
Result: 6 approved content types
```

#### 4. Choose Funnel Type
```
Location: /funnel-recommendation
Options: Free Book, Lead Magnet, VSL, Webinar, Application
Action: Select funnel type
Result: Funnel type saved
```

#### 5. Generate Funnel Images
```
Location: /build-funnel (Step 2)
AI: OpenAI DALL-E 3 generates funnel-specific images
Process:
  - Read funnel type
  - Read approved content
  - Generate image prompts
  - Call DALL-E 3 for each image
  - Upload to Supabase Storage
  - Save to generated_images table
Result: 2-3 images (depending on funnel type)
```

#### 6. Map Content to Custom Values
```
Location: /build-funnel (Step 3)
Process:
  - Fetch approved content
  - Fetch generated images
  - Run customValueMapper_FULL.js
  - Generate all 70 custom values
  - Run validation
Result: customValues object (70 fields)
```

#### 7. Push to GHL
```
Location: /build-funnel (Step 5)
Action: Enter GHL credentials → Push
Process:
  - Fetch existing GHL custom values
  - Compare with generated values
  - Create new values (if not exist)
  - Update existing values (if exist)
  - Track success/failure for each
Result: All 70 values pushed to GHL location
```

#### 8. Validate in GHL
```
Location: GHL Dashboard → Settings → Custom Values
Check:
  ✓ All 70 values are present
  ✓ Values have correct content (not empty)
  ✓ No jumbled/mixed content
  ✓ Images have valid URLs
  ✓ Colors are hex format
```

#### 9. Use in Funnel
```
Location: GHL Funnel Builder → Add Page/Element
Usage:
  - Add text element
  - Insert merge tag: {{custom_value.headline_main}}
  - Preview page
  - Content should appear correctly
```

---

## 🔍 Validation & Troubleshooting

### Automatic Validation

The system runs **3 levels of validation**:

#### Level 1: Content Schema Validation

Checks that generated content has correct structure:

```javascript
// Example: Lead Magnet schema
{
  titleAndHook: { mainTitle, subtitle },
  mainContent: { sections: [] },
  deliverables: { format, delivery },
  landingPageCopy: { ctaButtonText }
}
```

**Pass:** All required fields present  
**Fail:** Missing fields listed in validation report

#### Level 2: Mapping Validation

Checks that custom values are correctly mapped:

```javascript
// Example checks:
- headline_main exists and is string
- headline_main length < 100 characters
- primary_color is valid hex (#RRGGBB)
- author_image_url is valid URL
- All required fields are non-empty
```

**Pass:** All rules satisfied  
**Fail:** Errors/warnings listed

#### Level 3: GHL Push Validation

Checks that values were successfully created/updated in GHL:

```javascript
// For each custom value:
- Was API call successful?
- Was value created or updated?
- Does GHL now have the correct value?
```

**Pass:** 70/70 values pushed successfully  
**Partial:** Some failures (listed in report)  
**Fail:** Push operation failed entirely

### Manual Validation Checklist

After push, manually verify:

**In TedOS:**
- [ ] All 6 business core sections approved
- [ ] All images generated and have public URLs
- [ ] Validation report shows "PASS"
- [ ] No errors in push operation

**In GHL:**
- [ ] Go to Settings → Custom Values
- [ ] Count total values (should be ~70)
- [ ] Spot-check 5-10 random values
- [ ] Verify `headline_main` has your lead magnet title
- [ ] Verify `sales_headline` has your VSL hook
- [ ] Verify `offer_name` has your program name
- [ ] Verify `primary_color` is your brand color
- [ ] Verify image URLs are accessible (click to open)

**In Funnel:**
- [ ] Create test page
- [ ] Add merge tag `{{custom_value.headline_main}}`
- [ ] Preview page - should show your headline
- [ ] Add merge tag `{{custom_value.lead_magnet_image_url}}`
- [ ] Preview page - should show your image

### Common Issues & Fixes

#### Issue 1: "Missing required field: headline_main"

**Cause:** Lead magnet content not generated or approved  
**Fix:**
1. Go to `/business-core`
2. Find "Lead Magnet" section
3. Click "Regenerate" if empty
4. Approve once generated

#### Issue 2: "Invalid hex color: undefined"

**Cause:** Brand colors not provided in Q15  
**Fix:**
1. Go to `/intake_form`
2. Edit Q15 (Brand Colors)
3. Enter: "#0891b2" (or your hex code)
4. Regenerate content

#### Issue 3: "Image URL not valid"

**Cause:** Images not generated or failed to upload  
**Fix:**
1. Go to `/build-funnel` Step 2
2. Click "Regenerate Images"
3. Wait for all images to complete
4. Check validation report

#### Issue 4: "Content is jumbled/wrong field"

**Cause:** Mapping rule error  
**Fix:**
1. Check `lib/ghl/mappingValidator.js` MAPPING_RULES
2. Verify source path for affected field
3. Update if incorrect
4. Re-push to GHL

#### Issue 5: "GHL push failed: 401 Unauthorized"

**Cause:** Invalid GHL access token  
**Fix:**
1. Re-authenticate with GHL
2. Check token expiration
3. Generate new token if needed

---

## 🔌 API Integration

### Key Files

```
lib/ghl/
├── customValueMapper_FULL.js    // Maps content → 122 custom values
├── funnelImageGenerator.js      // Generates funnel-specific images (OpenAI)
├── mappingValidator.js          // Validates schemas and mappings
├── pushSystem.js                // Pushes to GHL (create/update)
└── MERGE_TAGS.md                // Complete list of 122 merge tags
```

### API Endpoints

#### 1. Generate Images
```javascript
POST /api/ghl/images/generate
Body: {
  sessionId: "uuid",
  funnelType: "lead-magnet-funnel",
  approvedContent: { ... }
}
Response: {
  success: true,
  generated: [
    { image_type: "lead_magnet_mockup", public_url: "..." },
    { image_type: "author_photo", public_url: "..." }
  ]
}
```

#### 2. Generate Custom Values
```javascript
POST /api/ghl/custom-values/generate
Body: {
  sessionId: "uuid"
}
Response: {
  success: true,
  customValues: { ... }, // 70 key-value pairs
  validation: { valid: true, ... }
}
```

#### 3. Push to GHL
```javascript
POST /api/ghl/push
Body: {
  sessionId: "uuid",
  locationId: "ghl-location-id",
  accessToken: "ghl-access-token"
}
Response: {
  success: true,
  summary: {
    total: 70,
    created: 45,
    updated: 25,
    failed: 0
  }
}
```

#### 4. Validate Mapping
```javascript
POST /api/ghl/validate
Body: {
  sessionId: "uuid"
}
Response: {
  overallValid: true,
  schemaValidation: { ... },
  mappingValidation: { ... },
  imageValidation: { ... },
  summary: { ... }
}
```

---

## 📊 Success Metrics

### What "Success" Looks Like

After completing the testing workflow:

✅ **Content Generation:**
- 6/6 business core sections approved
- VSL, Emails, Funnel Copy generated
- No placeholder text like "[INSERT]" or "TBD"

✅ **Image Generation:**
- 2-3 images per funnel type
- All images accessible via public URL
- Images match funnel type and industry

✅ **Mapping Validation:**
- 70/70 custom values generated
- All required fields non-empty
- No schema errors
- No mapping errors

✅ **GHL Push:**
- 70/70 values created/updated
- 0 failures
- Values visible in GHL dashboard

✅ **Funnel Integration:**
- Merge tags display correct content
- No empty fields in funnel
- Images load correctly
- Colors match brand

---

## 🎯 Next Steps (After Testing)

### Phase 2: Email & SMS Automation

Once funnel testing is complete:

1. **Enable Email Sequence (30 fields)**
   - Map `emails.emailList[]` to `email_1_subject` through `email_15_subject`
   - Push email subjects and bodies as custom values
   - Create GHL workflow to send emails

2. **Enable SMS Sequence (10 fields)**
   - Map `leadMagnet.smsFollowUp[]` to `sms_1` through `sms_5`
   - Include SMS CTA URLs
   - Create GHL SMS workflow

3. **Enable Appointment Reminders (12 fields)**
   - Map `appointmentReminders.emails[]` to `appt_*` fields
   - Create GHL calendar automation
   - Test reminder sending

### Phase 3: Advanced Features

- **Content Regeneration:** Update custom values when content is regenerated
- **A/B Testing:** Push multiple value sets for split testing
- **Analytics Dashboard:** Track which custom values drive conversions
- **Template Library:** Pre-built funnel templates with placeholder values

---

## 📞 Support

**Issues or Questions?**

1. Check validation report first (`/api/ghl/validate`)
2. Review this guide thoroughly
3. Check console logs for errors
4. Contact support with validation report attached

---

**End of Guide**

Last Updated: December 2024  
Version: 1.0  
Status: Testing Phase
