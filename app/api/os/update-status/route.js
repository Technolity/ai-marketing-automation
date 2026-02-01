import { auth } from '@clerk/nextjs';
import { getUpdateStatus } from '@/lib/vault/atomicUpdater';

export const dynamic = 'force-dynamic';

/**
 * GET /api/os/update-status?funnelId=xxx
 * 
 * Returns the status of any pending or recent dependency updates.
 * Used by UI to show "Updating..." spinner and clear it when done.
 */
export async function GET(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnelId');

    if (!funnelId) {
        return new Response(JSON.stringify({ error: 'funnelId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[UpdateStatus] Checking update status for funnel:', funnelId);

    try {
        const status = await getUpdateStatus(funnelId);

        console.log('[UpdateStatus] Result:', {
            hasRecentUpdates: status.hasRecentUpdates,
            updateCount: status.updates?.length || 0
        });

        return new Response(JSON.stringify(status), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[UpdateStatus] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
