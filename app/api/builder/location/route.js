import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

/**
 * Get builder location for the current user
 * Returns the location_id from ghl_subaccounts for deep linking to app.tedos.ai
 * Team members will access their owner's builder location
 */
export async function GET(request) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, isTeamMember, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[Builder Location] Fetching for target user ${targetUserId} (Auth: ${userId})`);

        // Get the active subaccount location for the target user (owner if team member)
        const { data: subaccount, error } = await supabase
            .from('ghl_subaccounts')
            .select('location_id, location_name')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching builder location:', error);
            return NextResponse.json({ error: 'Failed to fetch builder location' }, { status: 500 });
        }

        if (!subaccount?.location_id) {
            return NextResponse.json({
                available: false,
                message: 'No builder account found. Complete the deployment process first.'
            });
        }

        // Construct the builder URL
        const builderUrl = `https://app.tedos.ai/location/${subaccount.location_id}/dashboard`;

        return NextResponse.json({
            available: true,
            locationId: subaccount.location_id,
            locationName: subaccount.location_name,
            builderUrl
        });
    } catch (error) {
        console.error('Builder location error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
