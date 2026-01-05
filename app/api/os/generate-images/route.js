import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import OpenAI from 'openai';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { businessData, imageType } = body;
        // imageType is optional: if provided, generates ONLY that image. If missing, attempts all (risk of timeout).

        console.log('[Generate Images] Request for user:', userId, 'Type:', imageType || 'ALL');

        // Extract relevant info from business data
        const industry = businessData?.industry || 'professional services';
        const businessName = businessData?.idealClient?.businessName || 'Premium Business';
        const offerName = businessData?.offerProgram?.programName || businessData?.message?.headline || 'Transform Your Life';
        const brandColors = businessData?.brandColors || 'blue and white';

        // Define image prompts based on business data
        const allPrompts = [
            {
                id: 'hero_book',
                prompt: `Professional 3D book cover mockup floating at an angle. The book title is "${offerName}" in bold modern typography. Dark moody background with subtle ${brandColors} gradient lighting. High-end product photography style, dramatic shadows, premium feel. No text other than the title.`,
                folder: 'hero'
            },
            {
                id: 'hero_product',
                prompt: `Premium digital product bundle mockup for ${industry} business. Includes laptop showing dashboard, tablet with ebook, and phone with app. Dark background with ${brandColors} accent glow. Professional product photography, clean minimal style.`,
                folder: 'hero'
            },
            {
                id: 'testimonial_1',
                prompt: `Professional headshot portrait of a successful ${industry} business owner in their 40s. Confident smile, business attire. Studio lighting, neutral background. High quality corporate photography style. Photorealistic.`,
                folder: 'testimonials'
            },
            {
                id: 'testimonial_2',
                prompt: `Professional headshot portrait of a successful entrepreneur in their 30s. Warm genuine smile, smart casual attire. Natural lighting, clean background. High quality portrait photography. Photorealistic.`,
                folder: 'testimonials'
            },
            {
                id: 'feature_icon',
                prompt: `Minimalist 3D icon representing ${industry} success and growth. Abstract geometric shapes with ${brandColors} gradient colors. Dark background, soft lighting, modern tech aesthetic. Clean vector-like 3D render.`,
                folder: 'features'
            }
        ];

        // Filter prompts if imageType is specified
        const promptsToGenerate = imageType
            ? allPrompts.filter(p => p.id === imageType)
            : allPrompts;

        if (promptsToGenerate.length === 0) {
            return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
        }

        const generatedImages = [];

        // Generate images using DALL-E 3
        for (const imageConfig of promptsToGenerate) { // Note: Sequential execution for safety if multiple
            try {
                console.log(`[Generate Images] Creating: ${imageConfig.id}`);

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
                    console.error(`[Generate Images] Upload error for ${imageConfig.id}:`, uploadError);
                    continue;
                }

                // Get public URL
                const { data: urlData } = supabaseAdmin.storage
                    .from('funnel-images')
                    .getPublicUrl(fileName);

                generatedImages.push({
                    id: imageConfig.id,
                    url: urlData.publicUrl,
                    folder: imageConfig.folder
                });

                console.log(`[Generate Images] Successfully created: ${imageConfig.id}`);

            } catch (imageError) {
                console.error(`[Generate Images] Error generating ${imageConfig.id}:`, imageError);
                // We return partial results if some fail, but log the error
            }
        }

        return NextResponse.json({
            success: true,
            images: generatedImages,
            count: generatedImages.length
        });

    } catch (error) {
        console.error('[Generate Images] Error:', error);
        // Ensure JSON is returned
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

