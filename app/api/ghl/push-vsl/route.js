import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapToVSLFunnel, validateVSLMapping } from '@/lib/ghl/vslFunnelMapper';
import { generateFunnelImages } from '@/lib/ghl/funnelImageGenerator';

/**
 * POST /api/ghl/push-vsl
 * Complete workflow: Generate images → Map content → Push to GHL
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, locationId, accessToken, uploadedImages = {}, videoUrls = {} } = body;

        console.log('[PushVSL] Starting push for session:', sessionId);
        console.log('[PushVSL] Uploaded images:', Object.keys(uploadedImages).filter(k => uploadedImages[k]));
        console.log('[PushVSL] Video URLs:', Object.keys(videoUrls).filter(k => videoUrls[k]));

        // Step 1: Fetch session data
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Step 2: Handle images - use uploaded or generate missing ones
        let images = [];
        
        // Convert uploaded images to the format expected by mapper
        const uploadedImageRecords = [];
        if (uploadedImages.logo) {
            uploadedImageRecords.push({
                image_type: 'logo',
                public_url: uploadedImages.logo,
                status: 'uploaded'
            });
        }
        if (uploadedImages.bio_author) {
            uploadedImageRecords.push({
                image_type: 'author_photo',
                public_url: uploadedImages.bio_author,
                status: 'uploaded'
            });
        }
        if (uploadedImages.product_mockup) {
            uploadedImageRecords.push({
                image_type: 'product_mockup',
                public_url: uploadedImages.product_mockup,
                status: 'uploaded'
            });
        }
        if (uploadedImages.results_image) {
            uploadedImageRecords.push({
                image_type: 'results_image',
                public_url: uploadedImages.results_image,
                status: 'uploaded'
            });
        }

        console.log('[PushVSL] User uploaded', uploadedImageRecords.length, 'images');

        // Check which images are missing
        const requiredImages = ['author_photo', 'product_mockup', 'results_image'];
        const uploadedTypes = uploadedImageRecords.map(img => img.image_type);
        const missingImages = requiredImages.filter(type => !uploadedTypes.includes(type));

        console.log('[PushVSL] Missing images to generate:', missingImages);

        // Generate only missing images
        if (missingImages.length > 0) {
            console.log('[PushVSL] Generating', missingImages.length, 'missing images...');
            
            const imageResult = await generateFunnelImages({
                userId,
                sessionId,
                funnelType: 'vsl-funnel',
                approvedContent: {
                    answers: session.answers || {},
                    idealClient: session.results_data?.['1']?.data?.idealClientProfile,
                    message: session.results_data?.['2']?.data?.millionDollarMessage,
                    program: session.results_data?.['4']?.data?.programBlueprint,
                    leadMagnet: session.results_data?.['6']?.data?.leadMagnet,
                    story: session.results_data?.['3']?.data?.signatureStory
                },
                onProgress: (progress) => {
                    console.log('[PushVSL] Image generation:', progress);
                },
                onlyGenerate: missingImages // Only generate missing ones
            });

            images = [...uploadedImageRecords, ...(imageResult.generated || [])];
            console.log('[PushVSL] Total images:', images.length, '(', uploadedImageRecords.length, 'uploaded +', imageResult.generated?.length || 0, 'generated)');
        } else {
            images = uploadedImageRecords;
            console.log('[PushVSL] Using all uploaded images, no generation needed');
        }

        // Step 3: Map content to custom values (including videos)
        const customValues = mapToVSLFunnel(session, images, videoUrls);
        console.log('[PushVSL] Mapped', Object.keys(customValues).length, 'custom values');

        // Step 4: Validate mapping
        const validation = validateVSLMapping(customValues);
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Validation failed',
                validation,
                customValues
            }, { status: 400 });
        }

        // Step 5: Fetch existing GHL custom values
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
            return NextResponse.json({
                error: 'Failed to fetch GHL custom values',
                details: errorText
            }, { status: ghlResponse.status });
        }

        const ghlData = await ghlResponse.json();
        const existingValues = ghlData.customValues || [];

        // Create map for quick lookup with normalized keys
        const existingMap = new Map();
        existingValues.forEach(v => {
            // Normalize: lowercase and remove special chars for matching
            const normalizedKey = v.name.toLowerCase().replace(/[^a-z0-9_]/g, '');
            existingMap.set(v.name, v); // Original name
            existingMap.set(v.name.toLowerCase(), v); // Lowercase
            existingMap.set(normalizedKey, v); // Normalized
        });

        console.log('[PushVSL] Found', existingValues.length, 'existing custom values in GHL');
        console.log('[PushVSL] Sample existing keys:', existingValues.slice(0, 10).map(v => v.name));
        console.log('[PushVSL] Our custom value keys:', Object.keys(customValues).slice(0, 10));
        
        // Debug: Check if any of our keys match existing ones
        const ourKeys = Object.keys(customValues);
        const matchCounts = {
            exact: 0,
            lowercase: 0,
            normalized: 0,
            none: 0
        };
        
        ourKeys.forEach(key => {
            const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (existingMap.has(key)) {
                matchCounts.exact++;
            } else if (existingMap.has(key.toLowerCase())) {
                matchCounts.lowercase++;
            } else if (existingMap.has(normalizedKey)) {
                matchCounts.normalized++;
            } else {
                matchCounts.none++;
            }
        });
        
        console.log('[PushVSL] Match statistics:', matchCounts);

        // Step 6: Push all custom values to GHL
        const results = {
            created: [],
            updated: [],
            failed: []
        };

        for (const [key, value] of Object.entries(customValues)) {
            // Try multiple matching strategies
            const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
            const existing = existingMap.get(key) || 
                            existingMap.get(key.toLowerCase()) || 
                            existingMap.get(normalizedKey);
            
            const existingId = existing?.id || null;
            const method = existingId ? 'PUT' : 'POST';
            const url = existingId
                ? `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`
                : `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;
            
            if (existingId) {
                console.log(`[PushVSL] ✅ UPDATE: ${key} (ID: ${existingId})`);
            } else {
                console.log(`[PushVSL] ❌ CREATE (not found): ${key}`);
                console.log(`[PushVSL]    Tried: exact="${key}", lower="${key.toLowerCase()}", normalized="${normalizedKey}"`);
            }

            try {
                const pushResponse = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28'
                    },
                    body: JSON.stringify({
                        name: key,
                        value: String(value)
                    })
                });

                if (pushResponse.ok) {
                    if (existingId) {
                        results.updated.push({ key, value });
                    } else {
                        results.created.push({ key, value });
                    }
                } else {
                    const errorText = await pushResponse.text();
                    results.failed.push({ key, error: errorText });
                }
            } catch (error) {
                results.failed.push({ key, error: error.message });
            }

            // Rate limiting: 120ms between requests
            await new Promise(resolve => setTimeout(resolve, 120));
        }

        console.log('[PushVSL] Push complete:', {
            created: results.created.length,
            updated: results.updated.length,
            failed: results.failed.length
        });

        // Step 7: Save funnel record
        const { data: funnelRecord } = await supabaseAdmin
            .from('ghl_funnels')
            .insert({
                user_id: userId,
                session_id: sessionId,
                funnel_name: customValues.offer_name || 'VSL Funnel',
                funnel_type: 'vsl-funnel',
                funnel_url: `https://app.gohighlevel.com/location/${locationId}`,
                status: 'active'
            })
            .select()
            .single();

        return NextResponse.json({
            success: true,
            summary: {
                total: Object.keys(customValues).length,
                created: results.created.length,
                updated: results.updated.length,
                failed: results.failed.length,
                images: images.length
            },
            validation,
            funnelId: funnelRecord?.id,
            details: results
        });

    } catch (error) {
        console.error('[PushVSL] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

