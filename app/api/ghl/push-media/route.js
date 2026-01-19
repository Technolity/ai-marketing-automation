/**
 * Push Media to GHL Custom Values
 * Pushes images and video URLs
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { MEDIA_MAP } from '@/lib/ghl/customValuesMap';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { funnelId } = await req.json();

        if (!funnelId) {
            return Response.json({ error: 'funnelId is required' }, { status: 400 });
        }

        console.log('[PushMedia] Starting push for funnel:', funnelId);

        // Get GHL credentials
        const { data: credentials, error: credError } = await supabaseAdmin
            .from('ghl_credentials')
            .select('location_id, access_token')
            .eq('user_id', userId)
            .single();

        if (credError || !credentials) {
            return Response.json({ error: 'GHL not connected' }, { status: 400 });
        }

        // Get media content from vault_content_fields
        const { data: mediaFields, error: mediaError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'media');

        if (mediaError) {
            console.error('[PushMedia] Error fetching media:', mediaError);
            return Response.json({ error: 'Failed to fetch media' }, { status: 500 });
        }

        // Build custom values payload
        const customValues = [];
        const mediaContent = {};

        // Convert array to object
        mediaFields?.forEach(field => {
            mediaContent[field.field_id] = field.field_value;
        });

        // Map media to GHL keys
        for (const [page, fields] of Object.entries(MEDIA_MAP)) {
            for (const [field, ghlKey] of Object.entries(fields)) {
                // Try different field naming conventions
                const value = mediaContent[field] ||
                    mediaContent[`${page}_${field}`] ||
                    mediaContent[ghlKey];

                if (value && typeof value === 'string' && value.startsWith('http')) {
                    customValues.push({ key: ghlKey, value });
                }
            }
        }

        // Also check for direct cloudinary URLs
        const cloudinaryFields = ['logo', 'profile_photo', 'banner_image', 'vsl_video'];
        for (const field of cloudinaryFields) {
            const value = mediaContent[field];
            if (value && typeof value === 'string' && value.startsWith('http')) {
                const ghlKey = mapMediaFieldToGHL(field);
                if (ghlKey && !customValues.find(cv => cv.key === ghlKey)) {
                    customValues.push({ key: ghlKey, value });
                }
            }
        }

        console.log('[PushMedia] Pushing', customValues.length, 'media values to GHL');

        // Push to GHL
        const pushResults = await pushToGHL(
            credentials.location_id,
            credentials.access_token,
            customValues
        );

        // Log push operation
        await supabaseAdmin
            .from('ghl_push_logs')
            .insert({
                user_id: userId,
                funnel_id: funnelId,
                section: 'media',
                values_pushed: customValues.length,
                success: pushResults.success,
                error: pushResults.error || null,
            });

        return Response.json({
            success: true,
            pushed: customValues.length,
            details: pushResults,
        });

    } catch (error) {
        console.error('[PushMedia] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Map media field to GHL key
 */
function mapMediaFieldToGHL(field) {
    const mapping = {
        logo: '02_optin_logo_image',
        profile_photo: '02_vsl_bio_photo_text',
        banner_image: '02_optin_mockup_image',
        vsl_video: '02_vsl_video',
    };
    return mapping[field];
}

/**
 * Push values to GHL Custom Values API
 */
async function pushToGHL(locationId, accessToken, customValues) {
    const results = { success: true, pushed: 0, failed: 0, errors: [] };

    for (const { key, value } of customValues) {
        try {
            const response = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${key}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28',
                    },
                    body: JSON.stringify({ value }),
                }
            );

            if (response.ok) {
                results.pushed++;
            } else {
                results.failed++;
                const err = await response.json();
                results.errors.push({ key, error: err });
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ key, error: err.message });
        }
    }

    results.success = results.failed === 0;
    return results;
}
