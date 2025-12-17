# GoHighLevel Setup Guide - Phase 0 MVP

This guide walks you through setting up the TedOS integration with GoHighLevel using the Snapshot template approach (Phase 0 MVP).

## Overview

Phase 0 uses **GoHighLevel Snapshots** with **Custom Values** to quickly deploy your AI-generated marketing funnels. Instead of building a full custom integration from scratch, we:

1. Use pre-built GHL Snapshot templates (like the Incubator VSL Funnel)
2. Map your AI-generated content to GHL Custom Values
3. Push those values to your GHL location via API
4. The snapshot template automatically pulls from those custom values

**Time to deploy**: ~1 hour (vs weeks for full custom integration)

---

## Prerequisites

- Active GoHighLevel account
- Agency/Sub-account access
- API access enabled
- Completed TedOS questionnaire with generated content

---

## Part 1: Your Tasks (GHL Dashboard Setup)

### Step 1: Setup Whitelabel for TedOS (30 min)

1. **Login to your GHL Agency Account**
   - Go to [app.gohighlevel.com](https://app.gohighlevel.com)
   - Navigate to **Settings** → **White Label**

2. **Configure Domain (Optional but Recommended)**
   - Custom domain: `app.tedos.com` or your preferred domain
   - Follow GHL's DNS setup instructions
   - Wait for SSL certificate (10-15 minutes)

3. **Branding Setup**
   - Upload TedOS logo
   - Set brand colors:
     - Primary: `#0891b2` (Cyan)
     - Secondary: `#06b6d4`
     - Accent: `#22d3ee`
   - Customize email templates to match TedOS branding

### Step 2: Import Incubator VSL Funnel Snapshot (15 min)

1. **Navigate to Snapshots**
   - In your GHL dashboard, go to **Settings** → **Snapshots**
   - Or use direct URL: `https://app.gohighlevel.com/v2/location/[LOCATION_ID]/snapshots`

2. **Import the Incubator VSL Funnel Template**

   **If you have the snapshot link:**
   - Click **"Import Snapshot"**
   - Paste the snapshot link provided by TedOS team
   - Name it: `TedOS Incubator VSL Funnel Template`
   - Click **"Import"**

   **If importing from file:**
   - Download the snapshot file from TedOS resources
   - Click **"Upload Snapshot"**
   - Select the downloaded `.snapshot` file
   - Name it: `TedOS Incubator VSL Funnel Template`
   - Click **"Upload & Import"**

3. **Verify Import**
   - Check that the following pages imported:
     - ✅ Landing Page (Opt-in)
     - ✅ Thank You Page
     - ✅ VSL Page
   - Check that workflows imported:
     - ✅ Email Sequence
     - ✅ SMS Follow-up (if applicable)

### Step 3: Edit Funnel Template to Use Custom Values ONLY (Important!)

This step ensures the template pulls content from your AI-generated custom values instead of hardcoded text.

1. **Open the Imported Funnel in Builder**
   - Go to **Sites** → **Funnels**
   - Find `TedOS Incubator VSL Funnel Template`
   - Click **"Edit"**

2. **Replace Hardcoded Text with Custom Value Placeholders**

   For each page in the funnel, replace static text with custom value merge tags:

   **Landing Page (Opt-in Page):**
   ```
   Headline: {{custom_values.headline}}
   Subheadline: {{custom_values.subheadline}}
   CTA Button: {{custom_values.optin_button_text}}
   Bullet 1: {{custom_values.optin_bullet_1}}
   Bullet 2: {{custom_values.optin_bullet_2}}
   Bullet 3: {{custom_values.optin_bullet_3}}
   ```

   **Thank You Page:**
   ```
   Headline: {{custom_values.thankyou_headline}}
   Message: {{custom_values.thankyou_message}}
   Next Step: {{custom_values.thankyou_next_step}}
   ```

   **VSL Page:**
   ```
   Hook: {{custom_values.vsl_hook}}
   Problem: {{custom_values.vsl_problem}}
   Solution: {{custom_values.vsl_solution}}
   CTA: {{custom_values.vsl_cta}}
   ```

   **Program/Offer Section:**
   ```
   Program Name: {{custom_values.program_name}}
   Price: {{custom_values.program_price}}
   Step 1 Title: {{custom_values.step_1_title}}
   Step 1 Description: {{custom_values.step_1_description}}
   ```

3. **Update Email Sequences**
   - Go to **Automation** → **Workflows**
   - Find the imported email sequence
   - Edit each email to use custom values:
   ```
   Subject: {{custom_values.email_1_subject}}
   Preview Text: {{custom_values.email_1_preview}}
   ```

4. **Save Template**
   - Click **"Save"** on each page
   - Click **"Publish"** to make changes live

### Step 4: Get Your GHL API Credentials (5 min)

You'll need these to connect TedOS to your GHL account.

1. **Get Your Access Token**
   - Go to **Settings** → **API Key** (or **Integrations** → **API**)
   - Click **"Create API Key"** or copy existing one
   - **⚠️ IMPORTANT**: Copy this token immediately and store securely
   - You won't be able to see it again!

2. **Get Your Location ID**
   - Go to **Settings** → **Business Profile**
   - Your Location ID is in the URL: `https://app.gohighlevel.com/v2/location/[LOCATION_ID]/...`
   - Or find it under **Settings** → **Company** → **Location ID**

3. **Store Credentials Securely**
   - **Access Token**: `[YOUR_TOKEN_HERE]`
   - **Location ID**: `[YOUR_LOCATION_ID]`
   - You'll paste these into TedOS when pushing funnels

---

## Part 2: Using the Integration (TedOS Side)

Once you've completed the GHL setup above, here's how to push your funnels:

### Step 1: Generate Your Marketing Content

1. Complete the TedOS questionnaire
2. Generate all content sections (or at minimum: Ideal Client + Core Message)
3. **Recommended**: Generate "All" to create the Master Marketing System for best results
4. Save your session

### Step 2: Configure GHL Credentials in TedOS

1. Go to the **Results** page
2. Click the **Settings** icon (⚙️) next to "Build My Funnel"
3. Enter your credentials:
   - **Access Token**: Paste from GHL
   - **Location ID**: Paste from GHL
   - **Contact ID** (Optional): Leave empty for now

### Step 3: Build Your Funnel

1. Click **"Build My Funnel"** 🚀
2. TedOS will:
   - ✅ Extract content from your session
   - ✅ Map to 60+ custom values
   - ✅ Push to your GHL location via API
   - ✅ Populate the snapshot template automatically

3. Wait for confirmation (usually 10-30 seconds)

### Step 4: Verify in GHL

1. Go back to your GHL dashboard
2. Navigate to **Contacts** → **Custom Fields**
3. You should see all the custom values populated:
   - `business_name`
   - `headline`
   - `vsl_hook`
   - etc. (60+ fields)

4. Open your funnel pages - they should now display your AI-generated content!

---

## Complete List of Custom Values

The TedOS system maps to **60+ custom value fields**. Here's the complete list:

### Business Basics
- `business_name`
- `headline`
- `subheadline`
- `tagline`

### Ideal Client
- `ideal_client_name`
- `ideal_client_age`
- `ideal_client_income`
- `ideal_client_industry`

### Pain Points
- `pain_point_1`, `pain_point_1_impact`
- `pain_point_2`, `pain_point_2_impact`
- `pain_point_3`, `pain_point_3_impact`

### Desires & Outcomes
- `desire_1`, `desire_2`, `desire_3`
- `outcome_1`, `outcome_2`, `outcome_3`

### VSL Script
- `vsl_hook`
- `vsl_problem`
- `vsl_agitation`
- `vsl_solution`
- `vsl_proof`
- `vsl_cta`

### Landing Page / Opt-in
- `optin_headline`
- `optin_subheadline`
- `optin_bullet_1`, `optin_bullet_2`, `optin_bullet_3`
- `optin_button_text`

### Thank You Page
- `thankyou_headline`
- `thankyou_message`
- `thankyou_next_step`

### Program / Offer
- `program_name`
- `program_price`
- `program_value`
- `program_guarantee`

### Program Steps (3-step framework)
- `step_1_title`, `step_1_description`, `step_1_benefit`
- `step_2_title`, `step_2_description`, `step_2_benefit`
- `step_3_title`, `step_3_description`, `step_3_benefit`

### Email Sequence (first 3)
- `email_1_subject`, `email_1_preview`
- `email_2_subject`, `email_2_preview`
- `email_3_subject`, `email_3_preview`

### Social Proof
- `testimonial_1`, `testimonial_1_name`, `testimonial_1_result`
- `testimonial_2`, `testimonial_2_name`, `testimonial_2_result`

### About / Bio
- `founder_name`
- `bio_short`
- `bio_story`

### Urgency / Scarcity
- `urgency_message`
- `deadline`
- `bonus_1`, `bonus_2`

### Social Media
- `social_facebook`
- `social_instagram`
- `social_linkedin`

### Brand Colors
- `brand_color_primary`
- `brand_color_secondary`
- `brand_color_accent`

---

## Troubleshooting

### "Failed to push to GHL"

**Possible causes:**
1. **Invalid Access Token**
   - Regenerate token in GHL
   - Make sure you copied the full token (they're long!)

2. **Wrong Location ID**
   - Double-check the ID from your GHL URL
   - It should be a UUID format (e.g., `abc123-def456-...`)

3. **API Access Not Enabled**
   - Contact GHL support to enable API access
   - Some accounts have restricted API access

### "Missing required content types"

**Solution:**
- You need at least **Ideal Client** and **Core Message** generated
- For best results, generate "All" content to create the Master Marketing System

### "Custom values not showing in funnel"

**Possible causes:**
1. **Template not updated with custom value placeholders**
   - Go back to Step 3 in Part 1
   - Replace hardcoded text with `{{custom_values.field_name}}`

2. **Fields pushed but template using different field names**
   - Check spelling: `{{custom_values.headline}}` (not `{{custom_fields.headline}}`)
   - GHL is case-sensitive!

3. **Need to republish funnel**
   - After pushing custom values, republish the funnel pages in GHL

---

## What's Next?

### Phase 1: Full Custom Integration (Coming Soon)

After Phase 0 proves the concept, we'll implement:
- Direct funnel creation via GHL API (no manual snapshot import)
- Automatic page building
- Workflow automation setup
- Custom domain configuration
- A/B testing integration
- Analytics tracking

### Give Feedback

Encountered issues? Have suggestions?
- Report issues: [GitHub Issues](https://github.com/tedos/ai-marketing-automation/issues)
- Feature requests: Contact TedOS support

---

## Security Notes

**⚠️ Never commit your GHL credentials to version control**
- Access tokens should be stored in environment variables
- Never share your Access Token publicly
- Rotate tokens regularly (every 90 days recommended)

**🔒 Credentials are stored locally**
- The TedOS app stores your GHL credentials in browser localStorage only
- They are never sent to our servers
- Only used for direct API calls from your browser to GHL

---

## Summary Checklist

**GHL Dashboard Setup (Your Tasks):**
- [ ] Setup whitelabel for TedOS
- [ ] Import Incubator VSL Funnel Snapshot
- [ ] Edit funnel to use custom value placeholders
- [ ] Get GHL Access Token
- [ ] Get GHL Location ID

**TedOS App Usage:**
- [ ] Complete questionnaire
- [ ] Generate content (minimum: Ideal Client + Core Message)
- [ ] Save session
- [ ] Configure GHL credentials in app
- [ ] Click "Build My Funnel"
- [ ] Verify custom values in GHL dashboard

**Time Investment:**
- Setup (one-time): ~1 hour
- Each funnel deployment: ~1 minute

---

**Ready to build your first AI-powered funnel? Let's go! 🚀**
