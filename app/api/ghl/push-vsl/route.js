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
        const { sessionId, locationId, accessToken } = body;

        console.log('[PushVSL] Starting push for session:', sessionId);

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

        // Step 2: Check if images exist, if not generate them
        const { data: existingImages } = await supabaseAdmin
            .from('generated_images')
            .select('*')
            .eq('session_id', sessionId)
            .eq('status', 'completed');

        let images = existingImages || [];

        if (images.length === 0) {
            console.log('[PushVSL] No images found, generating...');
            
            // Generate VSL funnel images
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
                }
            });

            images = imageResult.generated || [];
            console.log('[PushVSL] Generated', images.length, 'images');
        } else {
            console.log('[PushVSL] Using', images.length, 'existing images');
        }

        // Step 3: Map content to custom values
        const customValues = mapToVSLFunnel(session, images);
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

        // Create map for quick lookup
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v);
            existingMap.set(v.name.toLowerCase(), v);
        });

        console.log('[PushVSL] Found', existingValues.length, 'existing custom values in GHL');

        // Step 6: Push all custom values to GHL
        const results = {
            created: [],
            updated: [],
            failed: []
        };

        for (const [key, value] of Object.entries(customValues)) {
            const existing = existingMap.get(key) || existingMap.get(key.toLowerCase());
            const existingId = existing?.id || null;
            const method = existingId ? 'PUT' : 'POST';
            const url = existingId
                ? `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`
                : `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;

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

