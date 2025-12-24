/**
 * Funnel-Type Specific Image Generation
 * Generates images tailored to the funnel type and approved content
 * Uses OpenAI DALL-E 3 ONLY for image generation
 */

import OpenAI from 'openai';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Funnel type definitions with required images
 */
export const FUNNEL_TYPES = {
  'free-book-funnel': {
    name: 'Free Book Funnel',
    requiredImages: ['book_mockup', 'author_photo', 'book_cover'],
    description: 'Physical book offer with shipping'
  },
  'lead-magnet-funnel': {
    name: 'Lead Magnet Funnel',
    requiredImages: ['lead_magnet_mockup', 'author_photo'],
    description: 'Digital download offer'
  },
  'vsl-funnel': {
    name: 'VSL Funnel',
    requiredImages: ['author_photo', 'product_mockup', 'results_image'],
    description: 'Video sales letter with appointment booking'
  },
  'webinar-funnel': {
    name: 'Webinar Funnel',
    requiredImages: ['webinar_thumbnail', 'author_photo', 'slides_preview'],
    description: 'Live or automated webinar registration'
  },
  'application-funnel': {
    name: 'Application Funnel',
    requiredImages: ['author_photo', 'program_image', 'badge_image'],
    description: 'High-ticket application and qualifier'
  }
};

/**
 * Generate image prompts based on funnel type and approved content
 */
export function generateImagePromptsForFunnel(funnelType, approvedContent) {
  const { answers = {} } = approvedContent;
  
  // Extract key info from approved content
  const industry = answers.industry || 'professional services';
  const idealClient = approvedContent.idealClient || {};
  const message = approvedContent.message || {};
  const program = approvedContent.program || {};
  const leadMagnet = approvedContent.leadMagnet || {};
  const story = approvedContent.story || {};
  
  const businessName = answers.businessName || 'Premium Business';
  const programName = program.programName || message.oneLineMessage || 'Transform Your Life';
  const leadMagnetTitle = leadMagnet?.titleAndHook?.mainTitle || 'Free Guide';
  const brandColors = answers.brandColors || 'blue and white';
  const authorDescription = story?.shortVersion?.substring(0, 200) || `${industry} expert`;

  // Build prompts based on funnel type
  const funnelConfig = FUNNEL_TYPES[funnelType];
  if (!funnelConfig) {
    throw new Error(`Invalid funnel type: ${funnelType}`);
  }

  const prompts = [];

  funnelConfig.requiredImages.forEach(imageType => {
    let prompt = '';
    let folder = 'general';

    switch (imageType) {
      case 'book_mockup':
        prompt = `Professional 3D book mockup for "${leadMagnetTitle}" on ${industry}. Hardcover book with clean, modern design. ${brandColors} color scheme. Premium quality, on white background, professional product photography style, bestseller aesthetic.`;
        folder = 'books';
        break;

      case 'book_cover':
        prompt = `Book cover design for "${leadMagnetTitle}". ${industry} theme. Bold title text, professional layout, ${brandColors} colors. Modern, premium, eye-catching. Flat design ready for print.`;
        folder = 'books';
        break;

      case 'lead_magnet_mockup':
        prompt = `Digital product mockup for "${leadMagnetTitle}". PDF or ebook displayed on tablet/laptop screen. ${industry} related imagery. ${brandColors} colors. Professional, clean, modern aesthetic. High-end digital product visualization.`;
        folder = 'lead-magnets';
        break;

      case 'author_photo':
        prompt = `Professional business headshot of a ${industry} expert. Confident, approachable, successful. Studio lighting, blurred background, business professional attire. High-quality corporate photography style. Warm, trustworthy expression.`;
        folder = 'people';
        break;

      case 'product_mockup':
        prompt = `Product mockup for "${programName}" program. ${industry} theme. Course materials, templates, or software interface. ${brandColors} colors. Premium, professional, high-value aesthetic.`;
        folder = 'products';
        break;

      case 'results_image':
        prompt = `Before-and-after transformation visual for ${industry} results. Graph showing improvement, success metrics, or visual comparison. ${brandColors} colors. Professional infographic style, data visualization, compelling transformation story.`;
        folder = 'results';
        break;

      case 'webinar_thumbnail':
        prompt = `Webinar thumbnail image for "${programName}". ${industry} topic. Bold text area, professional design, ${brandColors} colors. YouTube/webinar thumbnail style, high contrast, attention-grabbing. Include space for text overlay.`;
        folder = 'webinars';
        break;

      case 'slides_preview':
        prompt = `Preview of professional presentation slides for ${industry} webinar. Multiple slides visible, clean design, ${brandColors} colors. Modern PowerPoint/Keynote aesthetic, business professional, data-driven content preview.`;
        folder = 'webinars';
        break;

      case 'program_image':
        prompt = `Hero image for "${programName}" high-ticket program. ${industry} theme. Luxury, premium, exclusive aesthetic. ${brandColors} colors. Corporate, professional, aspirational. High-end business program visual.`;
        folder = 'programs';
        break;

      case 'badge_image':
        prompt = `Premium badge or seal for ${industry} certification/program. ${brandColors} colors. Gold accents, professional emblem, trust badge. Circular or shield design, elegant, authoritative, high-value indicator.`;
        folder = 'badges';
        break;

      default:
        prompt = `Professional ${industry} related image. ${brandColors} colors. Clean, modern, high-quality business aesthetic.`;
        folder = 'general';
    }

    prompts.push({
      id: imageType,
      prompt,
      folder,
      funnelType
    });
  });

  return prompts;
}

/**
 * Generate images for a specific funnel type
 * Returns array of generated image objects with public URLs
 */
export async function generateFunnelImages({
  userId,
  sessionId,
  funnelType,
  approvedContent,
  onProgress,
  onlyGenerate = null // Array of image types to generate, or null for all
}) {
  console.log(`[FunnelImageGen] Starting generation for ${funnelType}`);

  // Generate prompts based on funnel type
  let imagePrompts = generateImagePromptsForFunnel(funnelType, approvedContent);
  
  // Filter to only generate specific images if requested
  if (onlyGenerate && Array.isArray(onlyGenerate)) {
    imagePrompts = imagePrompts.filter(prompt => onlyGenerate.includes(prompt.id));
    console.log(`[FunnelImageGen] Filtering to only generate:`, onlyGenerate);
  }
  
  const totalImages = imagePrompts.length;

  console.log(`[FunnelImageGen] Will generate ${totalImages} images for ${funnelType}`);

  const generatedImages = [];
  const failedImages = [];

  for (let i = 0; i < imagePrompts.length; i++) {
    const imageConfig = imagePrompts[i];
    const progress = Math.round(((i + 1) / totalImages) * 100);

    onProgress?.({
      step: 'generating',
      progress,
      current: i + 1,
      total: totalImages,
      imageType: imageConfig.id
    });

    try {
      console.log(`[FunnelImageGen] Generating: ${imageConfig.id}`);

      // Generate with DALL-E 3 (OpenAI ONLY)
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imageConfig.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json'
      });

      const base64Data = response.data[0].b64_json;
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Upload to Supabase Storage
      const fileName = `${userId}/${imageConfig.folder}/${imageConfig.id}_${Date.now()}.png`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('funnel-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`[FunnelImageGen] Upload error for ${imageConfig.id}:`, uploadError);
        failedImages.push({ type: imageConfig.id, error: uploadError.message });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('funnel-images')
        .getPublicUrl(fileName);

      const imageRecord = {
        user_id: userId,
        session_id: sessionId,
        image_type: imageConfig.id,
        image_url: fileName,
        public_url: urlData.publicUrl,
        storage_path: fileName,
        funnel_type: funnelType,
        prompt_used: imageConfig.prompt,
        status: 'completed'
      };

      // Save to database
      const { data: savedImage, error: dbError } = await supabaseAdmin
        .from('generated_images')
        .insert(imageRecord)
        .select()
        .single();

      if (dbError) {
        console.error(`[FunnelImageGen] DB save error:`, dbError);
      }

      generatedImages.push(imageRecord);
      console.log(`[FunnelImageGen] ✓ Generated: ${imageConfig.id}`);

      // Rate limiting: 60 requests per minute for DALL-E 3
      await new Promise(resolve => setTimeout(resolve, 1100));

    } catch (error) {
      console.error(`[FunnelImageGen] Error generating ${imageConfig.id}:`, error);
      failedImages.push({
        type: imageConfig.id,
        error: error.message
      });
    }
  }

  onProgress?.({
    step: 'complete',
    progress: 100,
    message: `Generated ${generatedImages.length}/${totalImages} images`
  });

  return {
    success: failedImages.length === 0,
    generated: generatedImages,
    failed: failedImages,
    totalGenerated: generatedImages.length,
    totalFailed: failedImages.length,
    funnelType
  };
}

/**
 * Get required images for a funnel type
 */
export function getRequiredImagesForFunnel(funnelType) {
  const config = FUNNEL_TYPES[funnelType];
  if (!config) {
    return [];
  }
  return config.requiredImages;
}

/**
 * Check if all required images exist for a session
 */
export async function validateFunnelImages(sessionId, funnelType) {
  const requiredImages = getRequiredImagesForFunnel(funnelType);
  
  const { data: existingImages, error } = await supabaseAdmin
    .from('generated_images')
    .select('image_type')
    .eq('session_id', sessionId)
    .eq('status', 'completed');

  if (error) {
    console.error('[FunnelImageGen] Error fetching images:', error);
    return { valid: false, missing: requiredImages };
  }

  const existingTypes = existingImages.map(img => img.image_type);
  const missing = requiredImages.filter(type => !existingTypes.includes(type));

  return {
    valid: missing.length === 0,
    required: requiredImages,
    existing: existingTypes,
    missing
  };
}

export default {
  FUNNEL_TYPES,
  generateImagePromptsForFunnel,
  generateFunnelImages,
  getRequiredImagesForFunnel,
  validateFunnelImages
};

