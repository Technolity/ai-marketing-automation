/**
 * GHL Deploy Workflow
 * Orchestrates deployment of all vault content to GHL custom values
 * Calls individual push APIs sequentially for each section
 * 
 * Flow:
 * 1. Verify user has GHL sub-account
 * 2. Call push APIs for each section (funnel-copy, emails, sms, colors, media)
 * 3. Log deployment and return results
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout

export async function POST(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const funnelId = body.funnelId || body.funnel_id || body.sessionId || body.session_id;

        if (!funnelId) {
            return NextResponse.json({ error: 'funnelId is required' }, { status: 400 });
        }

        console.log(`[Deploy] Starting deployment for funnel ${funnelId}, user ${userId}`);

        // 1. Verify user has GHL sub-account
        const { data: subaccount, error: subError } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount?.location_id) {
            console.error('[Deploy] No sub-account found:', subError);
            return NextResponse.json({
                error: 'GHL sub-account not found. Please complete onboarding first.',
                needsSetup: true
            }, { status: 400 });
        }

        const locationId = subaccount.location_id;
        console.log(`[Deploy] Using location: ${locationId}`);

        // 2. Call each push API sequentially
        const sections = ['funnel-copy', 'emails', 'sms', 'colors', 'media'];
        const results = {
            success: true,
            sections: {},
            totalPushed: 0,
            totalUpdated: 0,
            totalCreated: 0,
            totalFailed: 0,
            errors: []
        };

        // Get the base URL for internal API calls
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
            'http://localhost:3000';

        // Get auth headers to forward
        const authHeader = req.headers.get('authorization');
        const cookieHeader = req.headers.get('cookie');

        for (const section of sections) {
            console.log(`[Deploy] Pushing section: ${section}`);

            try {
                const response = await fetch(`${baseUrl}/api/ghl/push-${section}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authHeader && { 'Authorization': authHeader }),
                        ...(cookieHeader && { 'Cookie': cookieHeader }),
                    },
                    body: JSON.stringify({ funnelId }),
                });

                const result = await response.json();

                results.sections[section] = {
                    success: result.success ?? false,
                    pushed: result.pushed ?? 0,
                    updated: result.updated ?? 0,
                    created: result.created ?? 0,
                    failed: result.failed ?? 0,
                    error: result.error || null
                };

                if (result.success) {
                    results.totalPushed += result.pushed || 0;
                    results.totalUpdated += result.updated || 0;
                    results.totalCreated += result.created || 0;
                } else {
                    results.success = false;
                    results.totalFailed += result.failed || 1;
                    results.errors.push({ section, error: result.error });
                }

                console.log(`[Deploy] ${section}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.pushed || 0} pushed`);

            } catch (sectionError) {
                console.error(`[Deploy] Error pushing ${section}:`, sectionError);
                results.sections[section] = {
                    success: false,
                    pushed: 0,
                    error: sectionError.message
                };
                results.errors.push({ section, error: sectionError.message });
                // Continue with other sections even if one fails
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`[Deploy] Completed in ${duration}s - Total: ${results.totalPushed} pushed, ${results.totalFailed} failed`);

        // 3. Log deployment
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: userId,
            event_type: 'deploy_completed',
            location_id: locationId,
            metadata: {
                funnel_id: funnelId,
                total_pushed: results.totalPushed,
                total_updated: results.totalUpdated,
                total_created: results.totalCreated,
                total_failed: results.totalFailed,
                sections: Object.keys(results.sections),
                duration_seconds: duration,
                success: results.success
            }
        });

        // 4. Update funnel deployment status
        await supabaseAdmin
            .from('user_funnels')
            .update({
                deployed_at: new Date().toISOString(),
                deployment_status: results.success ? 'deployed' : 'partial'
            })
            .eq('id', funnelId);

        return NextResponse.json({
            success: results.success,
            message: results.success
                ? `Successfully deployed ${results.totalPushed} values to GHL!`
                : `Deployment completed with ${results.totalFailed} errors`,
            summary: {
                total: results.totalPushed,
                updated: results.totalUpdated,
                created: results.totalCreated,
                failed: results.totalFailed,
                duration: `${duration}s`
            },
            sections: results.sections,
            errors: results.errors.length > 0 ? results.errors : undefined,
            locationId
        });

    } catch (error) {
        console.error('[Deploy] Fatal error:', error);
        return NextResponse.json({
            error: error.message || 'Deployment failed',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
