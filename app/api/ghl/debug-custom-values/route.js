/**
 * Debug Endpoint: List All Custom Values in GHL
 * Shows ID, Name, and current Value for all custom values
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getLocationToken } from '@/lib/ghl/tokenHelper';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[DebugCustomValues] Starting fetch...');

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

        console.log('[DebugCustomValues] Location ID:', subaccount.location_id);

        // Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;

        // Fetch ALL custom values
        const allValues = [];
        let skip = 0;
        const limit = 100;

        while (true) {
            console.log(`[DebugCustomValues] Fetching batch: skip=${skip}, limit=${limit}`);

            const response = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Version': '2021-07-28',
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[DebugCustomValues] GHL API error:', response.status, errorText);
                return Response.json({
                    error: `GHL API error: ${response.status}`,
                    details: errorText.substring(0, 200)
                }, { status: response.status });
            }

            const data = await response.json();
            const values = data.customValues || [];

            console.log(`[DebugCustomValues] Fetched ${values.length} values in this batch`);
            allValues.push(...values);

            if (values.length < limit) break;
            skip += limit;

            // Safety limit
            if (allValues.length >= 1000) break;
        }

        console.log(`[DebugCustomValues] Total custom values fetched: ${allValues.length}`);

        // Group by prefix (03_, 02_, no prefix)
        const grouped = {
            '03_prefix': [],
            '02_prefix': [],
            'no_prefix': [],
            'other': []
        };

        allValues.forEach(cv => {
            const item = {
                id: cv.id,
                name: cv.name,
                value: cv.value ? (cv.value.length > 50 ? cv.value.substring(0, 50) + '...' : cv.value) : '(empty)'
            };

            if (cv.name.startsWith('03_')) {
                grouped['03_prefix'].push(item);
            } else if (cv.name.startsWith('02_')) {
                grouped['02_prefix'].push(item);
            } else if (cv.name.match(/^[a-z_]+$/)) {
                grouped['no_prefix'].push(item);
            } else {
                grouped['other'].push(item);
            }
        });

        // Sort each group by name
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => a.name.localeCompare(b.name));
        });

        return Response.json({
            success: true,
            total: allValues.length,
            grouped: grouped,
            counts: {
                '03_prefix': grouped['03_prefix'].length,
                '02_prefix': grouped['02_prefix'].length,
                'no_prefix': grouped['no_prefix'].length,
                'other': grouped['other'].length
            },
            // Also return full list for easy searching
            all: allValues.map(cv => ({
                id: cv.id,
                name: cv.name,
                value: cv.value ? (cv.value.length > 50 ? cv.value.substring(0, 50) + '...' : cv.value) : '(empty)'
            })).sort((a, b) => a.name.localeCompare(b.name))
        });

    } catch (error) {
        console.error('[DebugCustomValues] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
