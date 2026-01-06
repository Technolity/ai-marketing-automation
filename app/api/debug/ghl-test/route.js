
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapSessionToCustomValues } from '@/lib/ghl/customValueMapper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/debug/ghl-test
 * 
 * Body:
 * {
 *   action: 'fetch' | 'push_single' | 'push_all',
 *   sessionId: string,
 *   locationId: string,
 *   accessToken: string,
 *   key: string,          // for 'push_single'
 *   value: string,        // for 'push_single' (override)
 *   customValues: object  // for 'push_all' (overrides)
 * }
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, sessionId, locationId, accessToken, key, value, customValues: overrideValues } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        // 1. Fetch Session Data
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Fetch Generated Images (needed for mapping)
        const { data: images } = await supabaseAdmin
            .from('generated_images')
            .select('*')
            .eq('session_id', sessionId)
            .eq('status', 'completed');

        // 3. Generate Local Mapping
        const mappedValues = mapSessionToCustomValues(session, images || []);

        // 4. Handle "Fetch" Action
        if (action === 'fetch') {
            return NextResponse.json({
                success: true,
                mappedValues,
                source: 'local_generation'
            });
        }

        // 5. Handle "Push" Actions
        if (action === 'push_single' || action === 'push_all') {
            if (!locationId || !accessToken) {
                return NextResponse.json({ error: 'Missing GHL credentials' }, { status: 400 });
            }

            // Fetch existing GHL Custom Values to get IDs
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
                const text = await ghlResponse.text();
                return NextResponse.json({ error: 'GHL Fetch Failed', details: text }, { status: ghlResponse.status });
            }

            const ghlData = await ghlResponse.json();
            const existingValues = ghlData.customValues || [];

            // Map Name -> ID for quick lookup
            // GHL keys might have different casing, so we normalize to lowercase
            const nameToIdMap = new Map();
            existingValues.forEach(v => {
                nameToIdMap.set(v.name.trim().toLowerCase(), v.id);
                // Also handle snake_case conversion if needed
            });

            const results = { updated: [], failed: [], skipped: [] };

            // Prepare payload
            let payload = {};
            if (action === 'push_single') {
                if (!key) return NextResponse.json({ error: 'Missing key for single push' }, { status: 400 });
                payload[key] = value !== undefined ? value : mappedValues[key];
            } else {
                // push_all
                payload = { ...mappedValues, ...overrideValues };
            }

            // Execute Updates
            for (const [k, v] of Object.entries(payload)) {
                // Determine target ID
                const targetId = nameToIdMap.get(k.toLowerCase())
                    || nameToIdMap.get(k.toLowerCase().replace(/_/g, ' ')); // Try matching "First Name" vs "first_name"

                if (!targetId) {
                    results.skipped.push({ key: k, reason: 'Key not found in GHL Blueprint' });
                    continue;
                }

                try {
                    const updateRes = await fetch(
                        `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${targetId}`,
                        {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                                'Version': '2021-07-28'
                            },
                            body: JSON.stringify({
                                name: k, // Keep original name/case provided?? No provided name might overwrite. 
                                // Actually GHL PUT usually takes name & value. 
                                // Let's use the name from existing GHL data to be safe? 
                                // But we only have ID. Let's send the key we have, or just value?
                                // API docs say: { name, value }
                                value: String(v)
                            })
                        }
                    );

                    if (updateRes.ok) {
                        results.updated.push({ key: k, value: v });
                    } else {
                        const err = await updateRes.text();
                        results.failed.push({ key: k, error: err });
                    }
                } catch (e) {
                    results.failed.push({ key: k, error: e.message });
                }

                // Throttle slightly
                await new Promise(r => setTimeout(r, 100));
            }

            return NextResponse.json({
                success: true,
                results
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('[GHL Debug] Error:', error);
        return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
    }
}
