import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapToVSLFunnel } from '@/lib/ghl/vslFunnelMapper';

/**
 * POST /api/ghl/update-assets
 * Partial update: Only push images and videos to GHL custom values
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, locationId, accessToken, uploadedImages = {}, videoUrls = {} } = body;

        if (!locationId || !accessToken) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        console.log('[UpdateAssets] Starting partial push for session:', sessionId);

        // Fetch session to get context for mapper (even if we only update assets)
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Map images to the format expected by mapper
        const tempImages = [];
        if (uploadedImages.logo) tempImages.push({ image_type: 'logo', public_url: uploadedImages.logo });
        if (uploadedImages.bio_author) tempImages.push({ image_type: 'author_photo', public_url: uploadedImages.bio_author });
        if (uploadedImages.product_mockup) tempImages.push({ image_type: 'product_mockup', public_url: uploadedImages.product_mockup });
        if (uploadedImages.results_image) tempImages.push({ image_type: 'results_image', public_url: uploadedImages.results_image });

        // Get all custom values from mapper
        const allCustomValues = mapToVSLFunnel(session, tempImages, videoUrls);

        // Filter to ONLY asset-related keys
        const assetKeys = [
            'optin_logo_image',
            'vsl_bio_image',
            'optin_mockup_image',
            'vsl_video_url',
            'testimonial_video_url',
            'thankyou_video_url'
        ];

        const assetValues = {};
        assetKeys.forEach(key => {
            if (allCustomValues[key]) {
                assetValues[key] = allCustomValues[key];
            }
        });

        if (Object.keys(assetValues).length === 0) {
            return NextResponse.json({ error: 'No assets to update' }, { status: 400 });
        }

        // Fetch existing GHL custom values to get IDs
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28'
                }
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            return NextResponse.json({ error: 'GHL fetch failed', details: errorText }, { status: ghlResponse.status });
        }

        const ghlData = await ghlResponse.json();
        const existingValues = ghlData.customValues || [];
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name.toLowerCase(), v);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v);
        });

        const results = { updated: [], failed: [] };

        for (const [key, value] of Object.entries(assetValues)) {
            const existing = existingMap.get(key.toLowerCase());
            const existingId = existing?.id;

            if (!existingId) {
                results.failed.push({ key, error: 'Custom value not found in GHL blueprint' });
                continue;
            }

            try {
                const pushResponse = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'Version': '2021-07-28'
                        },
                        body: JSON.stringify({ name: key, value: String(value) })
                    }
                );

                if (pushResponse.ok) {
                    results.updated.push({ key, value });
                } else {
                    const errorText = await pushResponse.text();
                    results.failed.push({ key, error: errorText });
                }
            } catch (error) {
                results.failed.push({ key, error: error.message });
            }

            await new Promise(resolve => setTimeout(resolve, 100)); // Minor delay
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: Object.keys(assetValues).length,
                updated: results.updated.length,
                failed: results.failed.length
            },
            details: results
        });

    } catch (error) {
        console.error('[UpdateAssets] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
