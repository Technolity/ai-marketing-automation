/**
 * Background Image Generation System
 * Generates AI images for funnel pages using available AI providers
 * Supports OpenAI DALL-E 3 (more providers can be added)
 * Stores in Supabase storage and returns public URLs
 */

import { generateImage, getProviderStatus } from '@/lib/ai/providerConfig';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Image types needed for a complete funnel
 */
export const IMAGE_TYPES = {
  HERO: 'hero',
  TESTIMONIAL_1: 'testimonial_1',
  TESTIMONIAL_2: 'testimonial_2',
  PRODUCT: 'product',
  FEATURE_1: 'feature_1',
  FEATURE_2: 'feature_2',
  FEATURE_3: 'feature_3',
  BACKGROUND: 'background',
  LOGO: 'logo'
};

/**
 * Generate image prompts based on user's questionnaire answers
 */
export function generateImagePrompts(sessionData) {
  const { answers } = sessionData;

  const industry = answers.industry || 'business';
  const idealClient = answers.idealClient || 'professional';
  const businessStage = answers.businessStage || 'growth';
  const productName = answers.productName || answers.offer || 'product';
  const colors = answers.brandColors || answers.preferredColors || 'modern professional colors';

  const prompts = {
    [IMAGE_TYPES.HERO]: {
      prompt: `Professional hero image for ${industry} business.
        Show ${idealClient} achieving success, ${businessStage} stage business aesthetic.
        Modern, high-quality, photorealistic. ${colors} color scheme.
        No text overlays. Inspiring and aspirational mood. 16:9 aspect ratio.`,
      purpose: 'Main hero image for landing page'
    },

    [IMAGE_TYPES.TESTIMONIAL_1]: {
      prompt: `Professional headshot of satisfied ${industry} client.
        ${idealClient} demographic, genuine smile, confidence.
        Clean background, professional lighting, photorealistic portrait.
        Warm and trustworthy feel. Square 1:1 aspect ratio.`,
      purpose: 'Testimonial profile photo 1'
    },

    [IMAGE_TYPES.TESTIMONIAL_2]: {
      prompt: `Professional headshot of successful ${industry} customer.
        Different ${idealClient}, authentic and approachable.
        Neutral background, natural lighting, photorealistic.
        Friendly and professional. Square 1:1 aspect ratio.`,
      purpose: 'Testimonial profile photo 2'
    },

    [IMAGE_TYPES.PRODUCT]: {
      prompt: `Product mockup for ${productName} in ${industry} industry.
        Professional 3D render or photograph, clean presentation.
        ${colors} color scheme, modern aesthetic.
        No text, high-quality, studio lighting. 4:3 aspect ratio.`,
      purpose: 'Product/program visualization'
    },

    [IMAGE_TYPES.FEATURE_1]: {
      prompt: `Icon or illustration representing transformation in ${industry}.
        Minimalist, modern, professional style. ${colors} color scheme.
        Suitable for feature section. Clean background. Square 1:1.`,
      purpose: 'Feature icon 1'
    },

    [IMAGE_TYPES.FEATURE_2]: {
      prompt: `Icon or illustration representing growth and results in ${industry}.
        Clean, professional, modern design. ${colors} color scheme.
        Feature section imagery. White or transparent background. Square 1:1.`,
      purpose: 'Feature icon 2'
    },

    [IMAGE_TYPES.FEATURE_3]: {
      prompt: `Icon or illustration representing support and community in ${industry}.
        Professional, approachable style. ${colors} color scheme.
        Feature section visual. Clean background. Square 1:1.`,
      purpose: 'Feature icon 3'
    },

    [IMAGE_TYPES.BACKGROUND]: {
      prompt: `Subtle background pattern for ${industry} funnel pages.
        Abstract, professional, non-distracting. ${colors} color palette.
        Suitable for webpage background, very subtle. 16:9 wide format.`,
      purpose: 'Background pattern'
    }
  };

  return prompts;
}

/**
 * Generate a single image using DALL-E 3
 */
export async function generateSingleImage({ prompt, imageType, userId, sessionId }) {
  try {
    console.log(`Generating ${imageType} image...`);

    // Create record in database first (status: generating)
    const { data: imageRecord, error: insertError } = await supabaseAdmin
      .from('generated_images')
      .insert({
        user_id: userId,
        session_id: sessionId,
        image_type: imageType,
        image_purpose: prompt.purpose,
        prompt_used: prompt.prompt,
        status: 'generating'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating image record:', insertError);
      throw insertError;
    }

    // Log available providers
    const providerStatus = getProviderStatus();
    console.log('Image generation provider status:', providerStatus);

    // Generate image using available provider
    const imageUrl = await generateImage(prompt.prompt, {
      size: '1024x1024',
      quality: 'standard'
    });

    // Download image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload to Supabase storage
    const fileName = `${userId}/${sessionId}/${imageType}_${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('funnel-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading to Supabase:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('funnel-images')
      .getPublicUrl(fileName);

    // Update record with success
    await supabaseAdmin
      .from('generated_images')
      .update({
        supabase_path: fileName,
        public_url: publicUrl,
        status: 'completed',
        generated_at: new Date(),
        width: 1024,
        height: 1024,
        format: 'png'
      })
      .eq('id', imageRecord.id);

    console.log(`✓ Generated ${imageType}: ${publicUrl}`);

    return {
      id: imageRecord.id,
      imageType,
      publicUrl,
      supabasePath: fileName,
      status: 'completed'
    };

  } catch (error) {
    console.error(`Error generating ${imageType}:`, error);

    // Update record with error
    if (imageRecord?.id) {
      await supabaseAdmin
        .from('generated_images')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', imageRecord.id);
    }

    return {
      imageType,
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Generate all funnel images in parallel (background job)
 */
export async function generateAllFunnelImages(sessionData, userId) {
  const { id: sessionId } = sessionData;

  console.log(`Starting background image generation for session ${sessionId}`);

  const prompts = generateImagePrompts(sessionData);

  // Generate images in parallel (but with slight delays to avoid rate limits)
  const imagePromises = Object.entries(prompts).map(async ([imageType, prompt], index) => {
    // Stagger requests by 2 seconds each to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, index * 2000));

    return generateSingleImage({
      prompt,
      imageType,
      userId,
      sessionId
    });
  });

  const results = await Promise.allSettled(imagePromises);

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'completed');
  const failed = results.filter(r => r.status === 'rejected' || r.value?.status === 'failed');

  console.log(`Image generation complete: ${successful.length} success, ${failed.length} failed`);

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'failed', error: r.reason })
  };
}

/**
 * Get generated images for a session
 */
export async function getSessionImages(sessionId) {
  const { data, error } = await supabaseAdmin
    .from('generated_images')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching images:', error);
    return [];
  }

  return data || [];
}

/**
 * Map generated images to custom value format
 */
export function mapImagesToCustomValues(images) {
  const customValues = {};

  images.forEach(image => {
    const key = `${image.image_type}_url`;
    customValues[key] = image.public_url;
  });

  return customValues;
}
