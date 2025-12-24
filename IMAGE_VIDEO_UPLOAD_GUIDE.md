# 🎨 Image Upload & Video URL Feature Guide

## ✨ What's New

You can now **upload your own images** and **add video URLs** to your VSL funnel! The system will:
- ✅ Use your uploaded images
- ✅ AI generates ONLY the images you don't upload
- ✅ Embed your videos in the funnel
- ✅ Save time and money (no AI generation for uploaded images)

---

## 🚀 How To Use

### **Step 1: Complete Phase 1 (Business Core)**
```
1. Complete intake form
2. Generate content
3. Approve all 6 sections
4. Click "Build VSL Funnel (Test)"
```

### **Step 2: Enter GHL Credentials**
```
- Location ID
- API Key
```

### **Step 3: Open Advanced Options (NEW!)**
```
Click: ▶ Advanced: Upload Images & Add Videos (Optional)

Shows counter: "0 images, 0 videos"
```

### **Step 4: Upload Your Images**

You can upload any or all of these:

#### **Logo Image**
- **Where it shows:** Optin page, footer, headers
- **Format:** PNG or JPG with transparent background recommended
- **Example:** `https://yourdomain.com/logo.png`

#### **Bio / Author Photo**
- **Where it shows:** VSL page (bio section), about sections
- **Format:** Professional headshot, square format works best
- **Example:** `https://yourdomain.com/author.jpg`

#### **Product Mockup**
- **Where it shows:** Optin page, VSL page
- **Format:** PNG with mockup of your product/service
- **Example:** `https://yourdomain.com/product.png`

#### **Results / Proof Image**
- **Where it shows:** VSL page (testimonials section)
- **Format:** Screenshots, charts, before/after
- **Example:** `https://yourdomain.com/results.png`

**💡 Tip:** AI will only generate images you **don't** upload!

---

### **Step 5: Add Video URLs**

#### **Main VSL Video (Required for VSL Funnel)**
- **Where it shows:** Main VSL page
- **Supported platforms:** YouTube, Vimeo, Wistia, Loom
- **Format:** Full video URL or embed code
- **Examples:**
  - YouTube: `https://www.youtube.com/watch?v=abc123`
  - Vimeo: `https://vimeo.com/123456789`
  - Wistia: `https://home.wistia.com/medias/abc123def`

#### **Testimonial Video (Optional)**
- **Where it shows:** VSL page (testimonial section)
- **Format:** Video testimonial from happy client
- **Example:** `https://www.youtube.com/watch?v=testimonial123`

#### **Thank You Page Video (Optional)**
- **Where it shows:** Thank you page after booking
- **Format:** Next steps video, welcome message
- **Example:** `https://www.youtube.com/watch?v=thankyou456`

**💡 Tip:** GHL auto-embeds YouTube, Vimeo, and Wistia videos

---

### **Step 6: Push to GHL**
```
Click: "Push 88 Custom Values to GHL"
(Now actually 91 with video URLs!)
```

---

## 📊 What Gets Pushed

### **With No Uploads (AI Generates All)**
```
Total Values: 91
- 88 text/color values
- 3 AI-generated images (author, product, results)
- 0 videos (empty fields)

AI Generation Time: ~2 minutes
Cost: 3 DALL-E 3 images
```

### **With All Uploads**
```
Total Values: 91
- 88 text/color values
- 4 uploaded images (logo, author, product, results)
- 3 video URLs

AI Generation Time: ~5 seconds
Cost: $0 (no image generation!)
```

### **With Partial Uploads (Recommended)**
```
Example: Upload logo + author photo, AI generates the rest

Total Values: 91
- 88 text/color values
- 2 uploaded images
- 2 AI-generated images (product, results)
- 3 video URLs

AI Generation Time: ~1 minute
Cost: 2 DALL-E 3 images
```

---

## 🎯 Best Practices

### **When To Upload Your Own Images**

✅ **Upload these:**
- Logo (you already have this!)
- Author/bio photo (professional headshot)
- Existing product mockups
- Real testimonial screenshots

❌ **Let AI generate these:**
- Product mockups (if you don't have one)
- Results graphics
- Hero backgrounds
- Generic images

### **Video Best Practices**

✅ **Main VSL Video:**
- Length: 10-20 minutes
- Quality: HD (1080p minimum)
- Platform: YouTube (unlisted) or Wistia
- Content: Problem → Solution → CTA

✅ **Testimonial Video:**
- Length: 1-3 minutes
- Quality: Good audio is more important than video
- Platform: Any (YouTube, Vimeo work great)
- Content: Specific results, transformation story

✅ **Thank You Video:**
- Length: 2-5 minutes
- Quality: HD
- Platform: Wistia or YouTube
- Content: What to expect, next steps, excitement

---

## 🔧 Technical Details

### **Image Upload Format**
```javascript
{
  logo: 'https://yourdomain.com/logo.png',
  bio_author: 'https://yourdomain.com/author.jpg',
  product_mockup: 'https://yourdomain.com/product.png',
  results_image: 'https://yourdomain.com/results.png'
}
```

### **Video URL Format**
```javascript
{
  main_vsl: 'https://www.youtube.com/watch?v=abc123',
  testimonial_video: 'https://vimeo.com/123456',
  thankyou_video: 'https://www.youtube.com/watch?v=xyz789'
}
```

### **GHL Custom Values Created**
```
vsl_video_url: {main_vsl}
testimonial_video_url: {testimonial_video}
thankyou_video_url: {thankyou_video}
```

### **API Changes**
```javascript
// Old
POST /api/ghl/push-vsl
{ sessionId, locationId, accessToken }

// New
POST /api/ghl/push-vsl
{ 
  sessionId, 
  locationId, 
  accessToken,
  uploadedImages: { logo, bio_author, product_mockup, results_image },
  videoUrls: { main_vsl, testimonial_video, thankyou_video }
}
```

---

## 🧪 Testing Workflow

### **Test 1: No Uploads (Full AI)**
```
1. Don't upload anything
2. Don't add video URLs
3. Push to GHL
4. Verify: 3 images generated, 91 values pushed
```

### **Test 2: All Uploads**
```
1. Upload all 4 images
2. Add all 3 video URLs
3. Push to GHL
4. Verify: No AI generation, 91 values pushed, your images/videos used
```

### **Test 3: Partial Uploads**
```
1. Upload logo + author photo
2. Add main VSL video URL
3. Push to GHL
4. Verify: AI generates 2 missing images, 91 values pushed
```

---

## 📁 Where Images Are Stored

### **Uploaded Images**
- Stored in GHL as custom value URLs
- You host them on your domain
- No storage in our database

### **AI-Generated Images**
- Stored in Supabase Storage: `funnel-images` bucket
- Public URLs created automatically
- Saved to `generated_images` table
- Can be reused for future pushes

---

## 🎨 UI Features

### **Collapsible Section**
```
▶ Advanced: Upload Images & Add Videos (Optional)
  Shows: "0 images, 0 videos"

Click to expand/collapse
```

### **Image Upload Fields**
```
Each field has:
- Label (e.g., "Logo Image")
- URL input field
- Placeholder example URL
- Auto-saves on blur
```

### **Video URL Fields**
```
Each field has:
- Label with context (e.g., "Main VSL Video (Required)")
- URL input field
- Platform examples in placeholder
- Tips below each section
```

### **Counter Badge**
```
Shows real-time count:
"2 images, 1 videos"

Updates as you add URLs
```

---

## ✅ Success Indicators

**Upload Working:**
```
✓ Counter updates when you add URLs
✓ Toast: "{image_type} image added!"
✓ Terminal: "User uploaded X images"
✓ Terminal: "Missing images to generate: [...]"
```

**Push Working:**
```
✓ Terminal: "Total images: X (Y uploaded + Z generated)"
✓ UI: "Total Values: 91"
✓ GHL: Custom values populated with your URLs
✓ GHL: Videos embed correctly in pages
```

---

## 🆘 Troubleshooting

### **"Image not showing in GHL"**
**Solution:**
- Verify URL is publicly accessible
- Check HTTPS (GHL requires secure URLs)
- Test URL in browser first
- Make sure URL ends in .jpg, .png, or .webp

### **"Video not embedding"**
**Solution:**
- Use full video URL (not shortened)
- For YouTube: Use watch URL, not youtu.be
- For Wistia: Use full media URL
- Check video is public/unlisted, not private

### **"AI still generating all images"**
**Solution:**
- Make sure you clicked outside input after pasting URL
- Check browser console for errors
- Verify URLs are in correct format
- Restart dev server

### **"Counter not updating"**
**Solution:**
- URLs must be valid (start with http:// or https://)
- Refresh page if stuck
- Check browser console for errors

---

## 🔮 Future Enhancements

This feature will be expanded to:
- ✅ File upload (not just URLs)
- ✅ Image preview before push
- ✅ Image cropping/resizing tool
- ✅ Video thumbnail generation
- ✅ Bulk image upload
- ✅ Image library/gallery
- ✅ Reuse images across funnels

---

## 🎯 Quick Reference

| Action | Result |
|--------|--------|
| Upload logo | Used in header, footer, optin page |
| Upload author photo | Used in bio section, about page |
| Upload product mockup | Used in optin, VSL pages |
| Upload results image | Used in testimonials, proof section |
| Add main VSL video | Embedded in main VSL page |
| Add testimonial video | Embedded in testimonials section |
| Add thank you video | Embedded in thank you page |
| Leave field empty | AI generates image automatically |

---

**All code is committed and pushed! Ready to test!** 🚀

Try it now:
1. Go to `/test-vsl-push`
2. Click "Advanced Options"
3. Add some images/videos
4. Push to GHL
5. See the magic! ✨

