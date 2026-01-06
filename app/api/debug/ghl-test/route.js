
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

        console.log('[GHL Test API] Received action:', action);

        // --- 1. LIST FUNNELS ---
        if (action === 'list_funnels') {
            const { data: funnels, error } = await supabaseAdmin
                .from('user_funnels')
                .select('id, funnel_name, created_at, updated_at, vault_generated')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ success: true, funnels });
        }


        // For other actions, Session ID is likely required
        if ((action === 'fetch_details' || action === 'push_single' || action === 'push_all' || action === 'push_batch') && !sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }


        // 1. Fetch Session Data (Try Legacy Wizard Session)
        let session = null;
        let isVaultFunnel = false;
        let funnelData = null;

        const { data: legacySession, error: sessionError } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (legacySession) {
            session = legacySession;
            console.log('[GHL Test API] Found legacy session');
        } else {
            // 1b. Try Fetching as Funnel (Vault)
            const { data: funnel, error: funnelError } = await supabaseAdmin
                .from('user_funnels')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (funnel) {
                console.log('[GHL Test API] Found Vault funnel, fetching content...');
                isVaultFunnel = true;
                funnelData = funnel;

                // Fetch Vault Content to reconstruct session-like object
                const { data: vaultContent } = await supabaseAdmin
                    .from('vault_content')
                    .select('section_id, content')
                    .eq('funnel_id', sessionId)
                    .eq('is_current_version', true);

                // Reconstruct data for mapper
                if (vaultContent) {
                    const results_data = {};

                    // Map section_ids to step numbers expected by mapper
                    const sectionMap = {
                        'idealClient': '1',
                        'message': '2',
                        'story': '3',
                        'offer': '4',
                        'salesScripts': '5',
                        'leadMagnet': '6',
                        'vsl': '7',
                        'emails': '8',
                        'facebookAds': '9',
                        'funnelCopy': '10',
                        // Bio is typically in 15 or 3, mapper says 15
                        'bio': '15'
                    };

                    vaultContent.forEach(row => {
                        const stepNum = sectionMap[row.section_id];
                        if (stepNum) {
                            // Mapper expects results[stepNum].data[key]
                            // We need to know the key the mapper expects for each step
                            // Step 1: idealClientProfile
                            // Step 2: millionDollarMessage
                            // Step 3: signatureStory
                            // Step 4: programBlueprint
                            // Step 5: salesScript
                            // Step 6: leadMagnet
                            // Step 7: vslScript
                            // Step 8: emailSequence
                            // Step 9: facebookAds
                            // Step 10: funnelCopy

                            const dataKeys = {
                                '1': 'idealClientProfile',
                                '2': 'millionDollarMessage',
                                '3': 'signatureStory',
                                '4': 'programBlueprint',
                                '5': 'salesScript',
                                '6': 'leadMagnet',
                                '7': 'vslScript',
                                '8': 'emailSequence',
                                '9': 'facebookAds',
                                '10': 'funnelCopy',
                                '15': 'bio'
                            };

                            const key = dataKeys[stepNum];
                            if (key && row.content) {
                                if (!results_data[stepNum]) results_data[stepNum] = { data: {} };
                                results_data[stepNum].data[key] = row.content;
                            }
                        }
                    });

                    // Construct pseudo-session
                    session = {
                        id: sessionId,
                        results_data,
                        answers: {
                            // Extract basic info that might be in funnel or needed
                            companyName: funnel.funnel_name,
                            // If answers aren't stored in user_funnels, we might miss some (like phone, address)
                            // But mappedValues relies on them. 
                            // Hopefully they are in vault_content or we accept they are missing.
                        }
                    };
                }
            }
        }

        if (!session) {
            console.error('[GHL Test API] Session/Funnel not found for ID:', sessionId);
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
        if (action === 'fetch' || action === 'fetch_details') {
            return NextResponse.json({
                success: true,
                mappedValues,
                source: 'local_generation'
            });
        }


        // 5. Handle "Push" Actions
        if (action === 'push_single' || action === 'push_all' || action === 'push_batch') {
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
            } else if (action === 'push_batch') {
                // Strictly use provided values (for selective push)
                payload = { ...overrideValues };
            } else {
                // push_all: Default mapped values + overrides
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
