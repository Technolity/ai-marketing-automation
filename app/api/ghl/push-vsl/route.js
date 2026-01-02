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
        const {
            sessionId,
            locationId,
            accessToken,
            uploadedImages = {},
            videoUrls = {},
            selectedKeys = null, // If provided, only push these keys
            imageOptions = {}     // 'skip' | 'upload' | 'generate' per image slot
        } = body;

        // Note: sessionId is actually a funnel ID from user_funnels table
        const funnelId = sessionId;

        console.log('[PushVSL] Starting push for funnel:', funnelId);
        console.log('[PushVSL] Uploaded images:', Object.keys(uploadedImages).filter(k => uploadedImages[k]));
        console.log('[PushVSL] Video URLs:', Object.keys(videoUrls).filter(k => videoUrls[k]));
        console.log('[PushVSL] Selected keys:', selectedKeys ? `${selectedKeys.length} selected` : 'all');
        console.log('[PushVSL] Image options:', imageOptions);

        // Step 1: Fetch funnel data from user_funnels
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('*')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (funnelError || !funnel) {
            console.error('[PushVSL] Funnel not found:', funnelError);
            return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
        }

        // Step 1b: Fetch vault content for this funnel
        const { data: vaultContent, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, section_title, content, phase')
            .eq('funnel_id', funnelId)
            .eq('user_id', userId)
            .eq('is_current_version', true);

        if (vaultError) {
            console.error('[PushVSL] Vault content error:', vaultError);
        }

        // Build session-like object from funnel and vault data for compatibility
        const session = {
            id: funnel.id,
            user_id: funnel.user_id,
            name: funnel.funnel_name,
            answers: funnel.wizard_answers || {},
            results_data: {}
        };

        // Map vault content to results_data format
        if (vaultContent && vaultContent.length > 0) {
            for (const item of vaultContent) {
                session.results_data[item.section_id] = {
                    title: item.section_title,
                    data: item.content
                };
            }
        }

        console.log('[PushVSL] Loaded funnel with', Object.keys(session.results_data).length, 'vault sections');

        // Step 2: Handle images based on imageOptions
        // Options per image: 'skip' | 'upload' | 'generate'
        let images = [];

        // Determine which images to process based on imageOptions
        const shouldProcessImage = (imageKey) => {
            const option = imageOptions[imageKey];
            return option !== 'skip'; // Process if 'upload' or 'generate' or not specified
        };

        const shouldGenerateImage = (imageKey) => {
            return imageOptions[imageKey] === 'generate';
        };

        // Convert uploaded images to the format expected by mapper
        const uploadedImageRecords = [];

        // Only include images that aren't set to 'skip'
        if (uploadedImages.logo && shouldProcessImage('logo')) {
            uploadedImageRecords.push({
                image_type: 'logo',
                public_url: uploadedImages.logo,
                status: 'uploaded'
            });
        }
        if (uploadedImages.bio_author && shouldProcessImage('bio_author')) {
            uploadedImageRecords.push({
                image_type: 'author_photo',
                public_url: uploadedImages.bio_author,
                status: 'uploaded'
            });
        }
        if (uploadedImages.product_mockup && shouldProcessImage('product_mockup')) {
            uploadedImageRecords.push({
                image_type: 'product_mockup',
                public_url: uploadedImages.product_mockup,
                status: 'uploaded'
            });
        }
        if (uploadedImages.results_image && shouldProcessImage('results_image')) {
            uploadedImageRecords.push({
                image_type: 'results_image',
                public_url: uploadedImages.results_image,
                status: 'uploaded'
            });
        }

        console.log('[PushVSL] User uploaded', uploadedImageRecords.length, 'images');

        // Check which images should be generated (based on imageOptions)
        const imageTypeMap = {
            'bio_author': 'author_photo',
            'product_mockup': 'product_mockup',
            'results_image': 'results_image'
        };

        const uploadedTypes = uploadedImageRecords.map(img => img.image_type);

        // Only generate images if:
        // 1. imageOptions says 'generate' for that slot, OR
        // 2. No imageOptions provided and image is missing
        const imagesToGenerate = [];
        for (const [slotKey, imageType] of Object.entries(imageTypeMap)) {
            if (shouldGenerateImage(slotKey) && !uploadedTypes.includes(imageType)) {
                imagesToGenerate.push(imageType);
            } else if (!imageOptions[slotKey] && !uploadedTypes.includes(imageType)) {
                // Backward compatibility: generate missing if no explicit option
                imagesToGenerate.push(imageType);
            }
        }

        console.log('[PushVSL] Images to generate:', imagesToGenerate);

        // Generate only specified images
        if (imagesToGenerate.length > 0) {
            console.log('[PushVSL] Generating', imagesToGenerate.length, 'images...');

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
                onlyGenerate: imagesToGenerate // Only generate specified ones
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
            // Normalize: convert spaces to underscores, then lowercase
            const spacesToUnderscores = v.name.replace(/\s+/g, '_');
            const lowercased = spacesToUnderscores.toLowerCase();

            existingMap.set(v.name, v); // Original name
            existingMap.set(v.name.toLowerCase(), v); // Lowercase only
            existingMap.set(spacesToUnderscores, v); // Spaces to underscores
            existingMap.set(lowercased, v); // Normalized (spaces→underscores→lowercase)
        });

        console.log('[PushVSL] Found', existingValues.length, 'existing custom values in GHL');
        console.log('[PushVSL] ALL GHL keys:', existingValues.map(v => v.name).sort());
        console.log('[PushVSL] Our 91 keys:', Object.keys(customValues).sort());

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

        // Filter by selectedKeys if provided
        const keysToProcess = selectedKeys
            ? Object.entries(customValues).filter(([key]) => selectedKeys.includes(key))
            : Object.entries(customValues);

        console.log('[PushVSL] Processing', keysToProcess.length, 'values (of', Object.keys(customValues).length, 'total)');

        for (const [key, value] of keysToProcess) {
            // Try multiple matching strategies
            const spacesToUnderscores = key.replace(/\s+/g, '_');
            const lowercased = key.toLowerCase();
            const normalized = spacesToUnderscores.toLowerCase();

            const existing = existingMap.get(key) ||               // Exact match
                existingMap.get(lowercased) ||          // Lowercase
                existingMap.get(spacesToUnderscores) || // Spaces to underscores
                existingMap.get(normalized);            // Full normalization

            const existingId = existing?.id || null;
            const method = existingId ? 'PUT' : 'POST';
            const url = existingId
                ? `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`
                : `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;

            if (existingId) {
                console.log(`[PushVSL] ✅ UPDATE: ${key} (ID: ${existingId})`);
            } else {
                console.log(`[PushVSL] ❌ CREATE (not found): ${key}`);
                console.log(`[PushVSL]    Tried: exact="${key}", lower="${lowercased}", spaces→_="${spacesToUnderscores}", normalized="${normalized}"`);
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

        // Step 7: Save GHL funnel record (session_id column references user_funnels.id)
        const { data: funnelRecord, error: funnelRecordError } = await supabaseAdmin
            .from('ghl_funnels')
            .insert({
                user_id: userId,
                session_id: funnelId, // This references user_funnels.id
                funnel_name: customValues.offer_name || 'VSL Funnel',
                funnel_type: 'vsl-funnel',
                funnel_url: `https://app.gohighlevel.com/location/${locationId}`,
                status: 'active'
            })
            .select()
            .single();

        if (funnelRecordError) {
            console.warn('[PushVSL] Failed to save GHL funnel record:', funnelRecordError);
            // Non-blocking error - push was still successful
        }

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

