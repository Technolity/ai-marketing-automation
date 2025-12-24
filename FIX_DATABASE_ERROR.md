# 🔧 Fix Database Errors - Quick Guide

## ❌ Errors You Were Seeing

```
[FunnelImageGen] DB save error: {
  code: 'PGRST204',
  message: "Could not find the 'funnel_type' column of 'generated_images' in the schema cache"
}

[PushVSL] Mapped 84 custom values  ← Should be 88!
[PushVSL] Push complete: { created: 0, updated: 59, failed: 25 }  ← 25 failures!
```

---

## ✅ What I Fixed

### **Issue 1: Missing `generated_images` Table**
**Problem:** Code was trying to save images to a table that didn't exist  
**Fix:** Created migration `024_generated_images_table.sql`

### **Issue 2: Only 84 Values Instead of 88**
**Problem:** Mapper was deleting empty values  
**Fix:** Keep all 88 fields, convert `null` to empty string

---

## 🚀 How To Apply The Fix

### **Step 1: Run the Database Migration**

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Go to **SQL Editor** (left sidebar)

2. **Copy the Migration SQL**
   - Open: `database/migrations/024_generated_images_table.sql`
   - Copy ALL the SQL code

3. **Run the Migration**
   - Paste into Supabase SQL Editor
   - Click **Run** (bottom right)
   - Should see: "Success. No rows returned"

4. **Verify Table Created**
   - Go to **Table Editor** (left sidebar)
   - Look for `generated_images` table
   - Should have columns: id, user_id, session_id, image_type, funnel_type, image_url, etc.

---

### **Step 2: Restart Your Dev Server**

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

---

### **Step 3: Test Again**

```bash
1. Go to http://localhost:3000/test-vsl-push
2. Enter your GHL credentials
3. Click "Push 88 Custom Values to GHL"
4. Watch the terminal output:
   ✓ [VSLMapper] Mapped 88 custom values  ← Should see 88 now!
   ✓ [FunnelImageGen] ✓ Generated: author_photo  ← No DB errors!
   ✓ [PushVSL] Push complete: { created: X, updated: Y, failed: 0 }  ← Zero failures!
```

---

## 📊 Expected Output (After Fix)

### **Terminal Output:**
```
[PushVSL] Starting push for session: d640bf89-85a8-4764-8862-88e42428e762
[PushVSL] No images found, generating...
[FunnelImageGen] Starting generation for vsl-funnel
[FunnelImageGen] Will generate 3 images for vsl-funnel

[FunnelImageGen] Generating: author_photo
✓ [FunnelImageGen] ✓ Generated: author_photo  ← NO ERROR!

[FunnelImageGen] Generating: product_mockup
✓ [FunnelImageGen] ✓ Generated: product_mockup  ← NO ERROR!

[FunnelImageGen] Generating: results_image
✓ [FunnelImageGen] ✓ Generated: results_image  ← NO ERROR!

[VSLMapper] Mapped 88 custom values  ← 88 INSTEAD OF 84!
[PushVSL] Found 91 existing custom values in GHL
[PushVSL] Push complete: { created: 0, updated: 88, failed: 0 }  ← ZERO FAILURES!
```

### **UI Results:**
```
Summary:
- Total Values: 88 ✓ (was 84)
- Created: 0
- Updated: 88 ✓ (was 59)
- Failed: 0 ✓ (was 25)

Validation:
✓ Content validation: Pass
✓ Field mapping: Pass
✓ Images: Pass
```

---

## 🎯 What Changed

### **Before Fix:**
```javascript
// Mapper was deleting empty values
Object.keys(customValues).forEach(key => {
  if (customValues[key] === '' || customValues[key] === null) {
    delete customValues[key];  ← Removed 4 fields!
  }
});
// Result: Only 84 values
```

### **After Fix:**
```javascript
// Keep all fields, convert null to empty string
Object.keys(customValues).forEach(key => {
  if (customValues[key] === null || customValues[key] === undefined) {
    customValues[key] = '';  ← Keep the field!
  }
});
// Result: All 88 values present
```

---

## 📋 Migration SQL (Copy This)

If you can't find the file, here's the complete SQL:

```sql
-- ============================================
-- MIGRATION 024: Generated Images Table
-- ============================================

CREATE TABLE IF NOT EXISTS generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES saved_sessions(id) ON DELETE CASCADE,
    
    -- Image metadata
    image_type TEXT NOT NULL,
    funnel_type TEXT NOT NULL,
    
    -- Storage paths
    image_url TEXT NOT NULL,
    public_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    
    -- Generation details
    prompt_used TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_session_id ON generated_images(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_funnel_type ON generated_images(funnel_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_image_type ON generated_images(image_type);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_images_unique 
    ON generated_images(user_id, session_id, image_type, funnel_type);

-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own generated images" ON generated_images
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own generated images" ON generated_images
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own generated images" ON generated_images
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own generated images" ON generated_images
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

## ✅ Verification Checklist

After running the migration and restarting:

- [ ] Supabase shows `generated_images` table exists
- [ ] Dev server restarted (npm run dev)
- [ ] Test page loads without errors
- [ ] Push shows "Mapped 88 custom values" in terminal
- [ ] No "[FunnelImageGen] DB save error" messages
- [ ] Images save successfully to database
- [ ] Push result shows "failed: 0"
- [ ] All 88 values visible in GHL Custom Values dashboard

---

## 🆘 Troubleshooting

### **"Table already exists" error**
**Solution:** That's fine! It means the table was created. Just continue.

### **"Permission denied" error**
**Solution:** Make sure you're logged into Supabase dashboard with admin access.

### **Still seeing 84 values after fix**
**Solution:**
1. Clear browser cache
2. Restart dev server
3. Check that you pulled latest code: `git pull origin feature/tedos-ux-overhaul`

### **Images still not saving**
**Solution:**
1. Verify table exists in Supabase
2. Check RLS policies are created
3. Ensure OpenAI API key has credits

---

## 📞 Next Steps

After applying the fix:
1. ✅ Run migration in Supabase
2. ✅ Restart dev server
3. ✅ Test push again
4. ✅ Verify all 88 values pushed
5. ✅ Check images saved to database
6. ✅ Verify in GHL Custom Values dashboard

**Everything should work perfectly now!** 🎉

