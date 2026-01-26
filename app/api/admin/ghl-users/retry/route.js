/**
 * GHL User Retry API
 * Retry failed GHL User creation
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(userId) {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    return profile?.is_admin === true;
}

export async function POST(req) {
    const requestId = `retry_${Date.now()}`;
    console.log(`\n[GHL User Retry ${requestId}] ========== START ==========`);

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId: targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        console.log(`[GHL User Retry ${requestId}] Retrying for user: ${targetUserId}`);

        // Call the create endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/ghl-users/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetUserId })
        });

        let result;
        try {
            const responseText = await response.text();
            result = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
            console.error(`[GHL User Retry ${requestId}] Failed to parse response:`, parseError);
            result = { error: 'Invalid response from create endpoint' };
        }

        if (!response.ok) {
            console.error(`[GHL User Retry ${requestId}] Retry failed:`, {
                status: response.status,
                result: result,
                hasResult: !!result
            });
            return NextResponse.json(
                result || { error: `Request failed with status ${response.status}` },
                { status: response.status }
            );
        }

        console.log(`[GHL User Retry ${requestId}] Retry successful`);
        return NextResponse.json(result || { success: true });

    } catch (error) {
        console.error(`[GHL User Retry ${requestId}] Error:`, error);
        return NextResponse.json({
            error: 'Retry failed',
            message: error.message
        }, { status: 500 });
    }
}
