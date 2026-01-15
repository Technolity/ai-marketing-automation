import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { mapSessionToCustomValues } from '@/lib/ghl/customValueMapper';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/ghl/deploy-workflow
 * Trigger Pabbly workflow to deploy content to GHL
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { funnelId } = await req.json();
        if (!funnelId) {
            return NextResponse.json({ error: 'Missing funnelId' }, { status: 400 });
        }

        // 1. Get User's GHL Location ID
        // Per user request, prioritize fetching from ghl_subaccount_logs to ensure we use the specific sub-account 
        // created by the recent Pabbly workflow.

        let locationId = null;

        // A. Try ghl_subaccount_logs first (most recent entry with a location_id)
        const { data: logEntry, error: logError } = await supabaseAdmin
            .from('ghl_subaccount_logs')
            .select('location_id')
            .eq('user_id', userId)
            .not('location_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (logEntry && logEntry.location_id) {
            locationId = logEntry.location_id;
            console.log('Found Location ID in ghl_subaccount_logs:', locationId);
        } else {
            console.warn('No Location ID found in logs, falling back to user_profiles.');

            // B. Fallback to user_profiles
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .select('ghl_location_id')
                .eq('id', userId)
                .single();

            if (profile && profile.ghl_location_id) {
                locationId = profile.ghl_location_id;
            }
        }

        if (!locationId) {
            return NextResponse.json({ error: 'No GHL Location ID found. Please ensure your account setup is complete.' }, { status: 400 });
        }

        // 2. Fetch Data for Mapping
        // We need three things to reconstruct the "Session Data" for the mapper:
        // A. Vault Content (The approved AI text)
        // B. Session Answers (The user's inputs/company info)
        // C. Generated Images (The approved images)

        const [contentResult, sessionResult, imagesResult] = await Promise.all([
            // A. Fetch Vault Content (Only current/approved version)
            supabaseAdmin
                .from('vault_content')
                .select('section_id, content')
                .eq('funnel_id', funnelId)
                .eq('is_current_version', true),

            // B. Fetch Session Answers (Assuming funnelId is the sessionId)
            supabaseAdmin
                .from('saved_sessions')
                .select('answers, business_name')
                .eq('id', funnelId) // Verify if funnelId corresponds to saved_sessions.id
                .single(),

            // C. Fetch Generated Images
            supabaseAdmin
                .from('generated_images')
                .select('*')
                .eq('session_id', funnelId) // Using funnelId as sessionId
                .eq('status', 'completed')
        ]);

        if (contentResult.error) {
            console.error('Content fetch error:', contentResult.error);
            return NextResponse.json({ error: 'Failed to fetch vault content' }, { status: 500 });
        }

        // 3. Reconstruct Session Data for Mapper
        const vaultContent = contentResult.data || [];
        const session = sessionResult.data || {};
        const images = imagesResult.data || [];

        // Transform vault_content array into results_data object keyed by section_id
        // vault_content: [{ section_id: '1', content: {...} }, ...]
        // target: { '1': { data: {...} }, '2': { data: {...} } }
        const resultsData = {};

        vaultContent.forEach(item => {
            // Content is stored as JSONB, so it's already an object
            // Ensure section_id is a string key
            const sectionKey = String(item.section_id);

            // The mapper expects structure: results[key].data
            resultsData[sectionKey] = {
                data: item.content
            };
        });

        // Construct the sessionData object expected by mapSessionToCustomValues
        const sessionData = {
            results_data: resultsData,
            answers: session.answers || {},
            business_name: session.business_name
        };

        // 4. Map to GHL Custom Values
        console.log(`[Deploy] Mapping content for Funnel ${funnelId} to Location ${locationId}`);
        const mappedValues = mapSessionToCustomValues(sessionData, images);

        // 5. Transform for Pabbly (Array of objects)
        // Pabbly Iterator expects an array to loop through
        const customValuesPayload = Object.entries(mappedValues).map(([key, value]) => ({
            key: key,       // The Custom Value Name (e.g. "vsl_hero_headline")
            value: value    // The Content
        }));

        console.log(`[Deploy] Prepared ${customValuesPayload.length} custom values for Pabbly.`);

        // 6. Trigger Pabbly Webhook
        const webhookUrl = process.env.PABBLY_DEPLOY_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error('PABBLY_DEPLOY_WEBHOOK_URL not configured');
            return NextResponse.json({ error: 'Deployment configuration missing (Webhook)' }, { status: 500 });
        }

        const payload = {
            userId: userId,
            funnelId: funnelId,
            locationId: locationId,
            customValues: customValuesPayload, // This is the iterator source
            timestamp: new Date().toISOString(),
            meta: {
                source: 'tedos_vault_deploy',
                itemCount: customValuesPayload.length
            }
        };

        const pabblyResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!pabblyResponse.ok) {
            const errText = await pabblyResponse.text();
            console.error('Pabbly Webhook Error:', errText);
            return NextResponse.json({ error: 'Failed to trigger deployment automation' }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            message: 'Deployment started',
            count: customValuesPayload.length
        });

    } catch (error) {
        console.error('Deploy API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
