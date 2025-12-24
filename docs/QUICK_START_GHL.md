# GHL Integration - Quick Start Guide

## 🚀 What's Been Implemented

### 1. Complete Custom Value Mapper (ALL 122 Fields)
**File:** `lib/ghl/customValueMapper_FULL.js`

**What it does:**
- Maps ALL 122 GHL merge tags from your approved content
- Handles fallbacks (if primary source is empty, uses backup)
- Formats arrays as HTML bullet lists
- Extracts colors from text to hex codes
- Maps images from database

**Key Functions:**
- `mapSessionToCustomValues(sessionData, images)` - Main mapping function
- `validateMapping(customValues)` - Checks all 122 fields
- `getContentSourceMap()` - Shows which prompt generates which fields

---

### 2. Funnel-Type Specific Image Generation
**File:** `lib/ghl/funnelImageGenerator.js`

**What it does:**
- Generates images ONLY with OpenAI DALL-E 3 (Claude is text-only)
- Creates different images based on funnel type
- Uses approved content to craft intelligent prompts
- Stores images in Supabase with proper organization

**Funnel Types:**
- `free-book-funnel` → book_mockup, book_cover, author_photo
- `lead-magnet-funnel` → lead_magnet_mockup, author_photo
- `vsl-funnel` → author_photo, product_mockup, results_image
- `webinar-funnel` → webinar_thumbnail, author_photo, slides_preview
- `application-funnel` → author_photo, program_image, badge_image

**Key Functions:**
- `generateFunnelImages({ userId, sessionId, funnelType, approvedContent })` - Main generation
- `generateImagePromptsForFunnel(funnelType, approvedContent)` - Creates prompts
- `validateFunnelImages(sessionId, funnelType)` - Checks all images exist

---

### 3. Mapping Validation System
**File:** `lib/ghl/mappingValidator.js`

**What it does:**
- Validates content schemas (checks generated content structure)
- Validates field mappings (checks custom values are correct)
- Validates images (checks all required images exist)
- Generates human-readable reports

**3 Levels of Validation:**
1. **Content Schema** - Checks prompts generated correct structure
2. **Field Mapping** - Checks custom values mapped correctly
3. **Image Validation** - Checks images generated and accessible

**Key Functions:**
- `comprehensiveValidation(sessionData, images)` - Validates everything
- `generateValidationReport(validationResult)` - Creates readable report

---

## 📍 Where Content Comes From

### Content Sources → GHL Fields

```
Prompt 1 (Ideal Client)
  → pain_point_1, pain_point_2, pain_point_3
  → problem_agitation

Prompt 2 (Million-Dollar Message)
  → headline_main (fallback)
  → sales_headline (fallback)
  → sales_subheadline
  → brand_tagline
  → mechanism_name
  → mechanism_description

Prompt 3 (Story)
  → vsl_bio_description
  → author_description

Prompt 4 (Offer/Program)
  → offer_name
  → offer_description
  → offer_bullets
  → bonus_1_name, bonus_2_name, bonus_3_name
  → mechanism_name (fallback)

Prompt 6 (Lead Magnet) ⭐ PRIMARY SOURCE
  → headline_main (primary!)
  → subheadline (primary!)
  → lead_magnet_title
  → lead_magnet_description
  → lead_magnet_bullets
  → cta_button_text

Prompt 7 (VSL)
  → sales_headline (primary!)
  → video_headline
  → video_description
  → hero_cta_text

Prompt 8 (Emails)
  → email_1_subject through email_15_subject
  → email_1_body through email_15_body
  → FAQ questions/answers

Prompt 15 (Appointment Reminders)
  → appt_confirm_subject/body
  → appt_reminder_24h_subject/body
  → appt_reminder_1h_subject/body
  → appt_followup_subject/body
  → appt_noshow_subject/body

OpenAI DALL-E 3 (Images)
  → lead_magnet_image_url
  → author_image_url
  → logo_url

User Intake (Q1-Q20)
  → brand_name
  → author_name
  → author_title
  → support_email
  → phone_number
  → website_url
  → social_facebook
  → social_instagram

Brand Colors (Q15 + Extraction)
  → primary_color (hex)
  → secondary_color (hex)
```

---

## 🧪 How To Test (Step-by-Step)

### Phase 1: Funnel Pages Only (Current)

#### Step 1: Complete Setup
```bash
# 1. Ensure OpenAI API key is set
OPENAI_API_KEY=sk-...

# 2. Ensure Claude is set for content
USE_CLAUDE=true
ANTHROPIC_API_KEY=sk-ant-...

# 3. Database migrations
# Run migrations 021 and 022 in Supabase
```

#### Step 2: Generate Content
```
1. Go to /intake_form
2. Fill all 20 questions (or use sample data button)
3. Click "Generate All Content"
4. Wait for all 14 content types to generate
```

#### Step 3: Approve Business Core
```
1. Go to /business-core
2. Review each of 6 sections:
   - Ideal Client
   - Million-Dollar Message
   - Personal Story
   - Offer & Program
   - Sales Scripts
   - Lead Magnet
3. Click "Approve" for each (or regenerate if needed)
```

#### Step 4: Choose Funnel & Generate Images
```
1. Go to /funnel-recommendation
2. Select funnel type (e.g., "Lead Magnet Funnel")
3. Go to /build-funnel
4. Step 2: Generate Images
   - System reads funnel type
   - System reads approved content
   - OpenAI generates 2-3 images
   - Images saved to Supabase
5. Verify images appear in UI
```

#### Step 5: Map & Validate
```
1. Still in /build-funnel
2. Step 3: Generate Custom Values
   - System maps all content to 70 custom values
   - System validates schemas
   - System validates mappings
3. Review validation report:
   ✓ Content Schema: PASS
   ✓ Mapping: 70/70 fields
   ✓ Images: 2-3 images
4. Fix any errors before proceeding
```

#### Step 6: Push to GHL
```
1. Step 5: Connect GHL
2. Enter GHL credentials:
   - Location ID
   - Access Token
3. Click "Push to GHL"
4. System checks existing custom values
5. System creates NEW or updates EXISTING
6. Wait for completion (70 API calls, ~14 seconds)
7. Review push report:
   ✓ Created: 45 values
   ✓ Updated: 25 values
   ✓ Failed: 0 values
```

#### Step 7: Verify in GHL
```
1. Open GHL Dashboard
2. Go to Settings → Custom Values
3. Count total values (should be ~70)
4. Spot-check random values:
   - Search "headline_main" → Should have your lead magnet title
   - Search "sales_headline" → Should have your VSL hook
   - Search "primary_color" → Should be hex code like #0891b2
   - Search "lead_magnet_image_url" → Should be Supabase URL
```

#### Step 8: Test in Funnel
```
1. Go to GHL Funnel Builder
2. Create test page
3. Add text element
4. Insert merge tag: {{custom_value.headline_main}}
5. Preview page
6. Verify content appears correctly
7. Test more merge tags:
   - {{custom_value.subheadline}}
   - {{custom_value.sales_headline}}
   - {{custom_value.offer_name}}
8. Add image element
9. Insert merge tag: {{custom_value.lead_magnet_image_url}}
10. Preview - image should load
```

---

## ✅ Success Checklist

After testing, you should have:

**Content:**
- [ ] All 20 intake questions answered
- [ ] All 14 content types generated
- [ ] 6 business core sections approved
- [ ] No "[INSERT]" or "TBD" placeholders

**Images:**
- [ ] 2-3 images generated per funnel type
- [ ] All images accessible via public URL
- [ ] Images match industry and brand

**Mapping:**
- [ ] 70 custom values generated
- [ ] Validation report shows "PASS"
- [ ] All required fields non-empty
- [ ] Colors in hex format
- [ ] Image URLs valid

**GHL Integration:**
- [ ] 70/70 values pushed successfully
- [ ] 0 failures in push operation
- [ ] Values visible in GHL dashboard
- [ ] Merge tags work in funnel pages
- [ ] No jumbled/mixed content

**Funnel Testing:**
- [ ] Created test page with merge tags
- [ ] All merge tags display correct content
- [ ] Images load correctly
- [ ] Colors match brand
- [ ] No empty fields

---

## 🐛 Troubleshooting

### Issue: "headline_main is empty"
**Fix:** Approve Lead Magnet section in /business-core

### Issue: "primary_color is undefined"
**Fix:** Edit Q15 with hex code like "#0891b2"

### Issue: "Images not generated"
**Fix:** Check OpenAI API key, check console for errors

### Issue: "GHL push failed: 401"
**Fix:** Re-authenticate with GHL, get fresh access token

### Issue: "Content is jumbled"
**Fix:** Check MAPPING_RULES in mappingValidator.js

### Issue: "Validation shows errors"
**Fix:** Read validation report, fix specific errors listed

---

## 🎯 What's Next (Phase 2)

After funnel testing is complete:

1. **Email Automation (30 fields)**
   - Push email subjects/bodies
   - Create GHL workflow
   - Test email delivery

2. **SMS Automation (10 fields)**
   - Push SMS content
   - Create GHL SMS workflow
   - Test SMS delivery

3. **Appointment Reminders (12 fields)**
   - Push reminder content
   - Create GHL calendar automation
   - Test reminder sending

---

## 📞 Need Help?

1. **Check validation report first:**
   ```bash
   POST /api/ghl/validate
   Body: { sessionId: "your-session-id" }
   ```

2. **Check console logs** in browser DevTools

3. **Review GHL_INTEGRATION_GUIDE.md** for complete details

4. **Contact support** with:
   - Validation report
   - Console errors
   - Screenshot of issue

---

**Quick Start Complete!**

You now have:
✅ Complete custom value mapping (122 fields)
✅ Funnel-specific image generation (OpenAI)
✅ Comprehensive validation system
✅ Ready to test funnel integration

Next: Follow Step-by-Step testing workflow above! 🚀

