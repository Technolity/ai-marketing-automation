/**
 * Push Media to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * ONLY UPDATES existing custom values (never creates new ones)
 * Uses ghlKeyMatcher.js for enhanced 11-level key matching
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { MEDIA_MAP } from '@/lib/ghl/customValuesMap';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues } from '@/lib/ghl/ghlKeyMatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

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

        console.log('[PushMedia] ========== START ==========');
        console.log('[PushMedia] Funnel ID:', funnelId);

        // Get user's location ID
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return Response.json({ error: 'GHL sub-account not found' }, { status: 400 });
        }

        console.log('[PushMedia] Location ID:', subaccount.location_id);

        // Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            console.error('[PushMedia] Token error:', tokenResult.error);
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;
        console.log('[PushMedia] OAuth token obtained');

        // Fetch existing custom values using shared utility
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        console.log('[PushMedia] Found', existingValues.length, 'existing custom values in GHL');

        // ========== LOG MEDIA-RELATED CUSTOM VALUES ==========
        console.log('[PushMedia] ========== MEDIA CUSTOM VALUES IN GHL ==========');
        const mediaRelated = existingValues.filter(v =>
            v.name.toLowerCase().includes('image') ||
            v.name.toLowerCase().includes('video') ||
            v.name.toLowerCase().includes('logo') ||
            v.name.toLowerCase().includes('bio') ||
            v.name.toLowerCase().includes('mockup') ||
            v.name.toLowerCase().includes('vsl') ||
            v.name.toLowerCase().includes('thankyou')
        );
        console.log(`[PushMedia] Found ${mediaRelated.length} media-related custom values:`);
        mediaRelated.forEach(v => {
            console.log(`  - "${v.name}" (ID: ${v.id})`);
        });
        console.log('[PushMedia] ========== END MEDIA CUSTOM VALUES ==========');

        // Build enhanced lookup map with 11-level matching
        const existingMap = buildExistingMap(existingValues);

        // Get media content from vault_content_fields
        const { data: mediaFields } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'media')
            .eq('is_current_version', true);

        console.log('[PushMedia] Media fields from vault:', mediaFields?.length || 0);
        if (mediaFields) {
            mediaFields.forEach(f => {
                console.log(`[PushMedia]   - ${f.field_id}: ${f.field_value?.substring(0, 50)}...`);
            });
        }

        if (!mediaFields || mediaFields.length === 0) {
            return Response.json({ error: 'No media content found. Please upload media first.' }, { status: 404 });
        }

        // Build media content map
        const mediaContent = {};
        mediaFields.forEach(field => {
            mediaContent[field.field_id] = field.field_value;
        });

        // Build custom values using MEDIA_MAP (flat structure)
        const customValues = [];
        const notFoundKeys = [];

        console.log('[PushMedia] Mapping media fields to GHL custom values...');
        for (const [vaultFieldId, ghlKey] of Object.entries(MEDIA_MAP)) {
            const mediaUrl = mediaContent[vaultFieldId];

            if (mediaUrl && mediaUrl.trim()) {
                // Use enhanced 11-level key matching
                const existingId = findExistingId(existingMap, ghlKey);

                if (existingId) {
                    customValues.push({
                        vaultField: vaultFieldId,
                        key: ghlKey,
                        value: mediaUrl,
                        existingId
                    });
                    console.log(`[PushMedia] ✓ Mapped: ${vaultFieldId} → ${ghlKey} (exists in GHL)`);
                } else {
                    notFoundKeys.push(ghlKey);
                    console.log(`[PushMedia] ⚠ Skipping: ${vaultFieldId} → ${ghlKey} (NOT FOUND in GHL after 11 tries)`);
                }
            } else {
                console.log(`[PushMedia] ⚠ Skipping: ${vaultFieldId} (no media URL)`);
            }
        }

        if (customValues.length === 0) {
            return Response.json({
                error: 'No media URLs found to push',
                notFoundKeys,
                hint: 'Upload media files in the Media Library section first'
            }, { status: 400 });
        }

        console.log('[PushMedia] Pushing', customValues.length, 'media values to GHL...');

        // Push to GHL (ONLY UPDATE, never create)
        const results = { success: true, updated: 0, skipped: 0, failed: 0, errors: [], notFoundKeys };

        for (const { vaultField, key, value, existingId } of customValues) {
            try {
                const response = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
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
                    results.updated++;
                    console.log(`[PushMedia] ✓ UPDATED: ${key} (${vaultField})`);
                } else {
                    results.failed++;
                    const err = await response.json().catch(() => ({ message: 'Unknown error' }));
                    results.errors.push({ key, error: err });
                    console.error(`[PushMedia] ✗ FAILED: ${key} -`, err);
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ key, error: err.message });
                console.error(`[PushMedia] ✗ ERROR: ${key} -`, err.message);
            }
        }

        results.success = results.failed === 0;
        results.skipped = notFoundKeys.length;

        console.log('[PushMedia] ========== COMPLETE ==========');
        console.log('[PushMedia] Updated:', results.updated);
        console.log('[PushMedia] Skipped (not found in GHL):', results.skipped);
        console.log('[PushMedia] Failed:', results.failed);

        // Log push operation
        await supabaseAdmin.from('ghl_push_logs').insert({
            user_id: userId,
            funnel_id: funnelId,
            section: 'media',
            values_pushed: results.updated,
            success: results.success,
        });

        return Response.json({
            success: true,
            ...results,
            message: `Updated ${results.updated} media value(s). ${results.skipped} custom value(s) not found in GHL (will not be created).`
        });

    } catch (error) {
        console.error('[PushMedia] FATAL ERROR:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
