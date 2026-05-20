import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { fetchExistingCustomValues, buildExistingMap, findExistingId, normalizeForComparison } from '@/lib/ghl/ghlKeyMatcher';
import { resolveSlotForFunnel, addStoredSlotIdsToExistingMap } from '@/lib/ghl/slotHelper';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const { funnel_id: funnelId, embed_code: embedCode } = await req.json();
    if (!funnelId || !embedCode) {
        return NextResponse.json({ error: 'funnel_id and embed_code are required' }, { status: 400 });
    }

    const { slotIndex, slotPrefix } = await resolveSlotForFunnel(funnelId, supabaseAdmin);

    // GHL key: slot-prefixed calendar embed code (note: "calender" typo is intentional — matches existing GHL keys)
    const ghlKey = `${slotPrefix}calender_page_embedded_calender_code`;

    // Save to vault_content_fields
    const fieldId = 'calendarPage.calendar_embedded_code';
    await supabaseAdmin
        .from('vault_content_fields')
        .upsert({
            funnel_id: funnelId,
            user_id: targetUserId,
            section_id: 'funnelCopy',
            field_id: fieldId,
            field_value: embedCode,
            is_current_version: true,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'funnel_id,user_id,section_id,field_id' });

    // Get GHL subaccount + token
    const { data: subaccount } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('location_id')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .single();

    if (!subaccount?.location_id) {
        return NextResponse.json({ error: 'GHL sub-account not found. Please complete onboarding.' }, { status: 400 });
    }

    const tokenResult = await getLocationToken(targetUserId, subaccount.location_id);
    if (!tokenResult.success) {
        return NextResponse.json({ error: tokenResult.error }, { status: 401 });
    }

    const { access_token: accessToken, location_id: locationId } = tokenResult;

    // Find the existing custom value in GHL
    const existingValues = await fetchExistingCustomValues(locationId, accessToken);
    const existingMap = buildExistingMap(existingValues);
    await addStoredSlotIdsToExistingMap(existingMap, {
        userId: targetUserId,
        locationId,
        slotIndex,
        supabaseClient: supabaseAdmin,
    });

    const existing = findExistingId(existingMap, ghlKey);
    if (!existing?.id) {
        return NextResponse.json({ error: `Custom value key not found in GHL: ${ghlKey}` }, { status: 404 });
    }

    // Skip if value unchanged
    if (existing.value !== null && normalizeForComparison(embedCode) === normalizeForComparison(existing.value)) {
        return NextResponse.json({ success: true, key: ghlKey, status: 'unchanged' });
    }

    const response = await fetch(
        `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existing.id}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({ name: existing.name, value: embedCode }),
        }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Unknown error' }));
        return NextResponse.json({ error: 'GHL push failed', details: err }, { status: 500 });
    }

    return NextResponse.json({ success: true, key: ghlKey });
}
