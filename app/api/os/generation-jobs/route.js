import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

/**
 * GET /api/os/generation-jobs
 * 
 * Fetch active generation jobs for a funnel.
 * Used by the vault page to poll for background generation status.
 */
export async function GET(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id');

    if (!funnelId) {
        return Response.json({ error: 'funnel_id is required' }, { status: 400 });
    }

    try {
        // Fetch recent jobs for this funnel (last 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

        const { data: jobs, error } = await supabaseAdmin
            .from('generation_jobs')
            .select('id, job_type, status, progress_percentage, current_section, sections_to_generate, started_at, completed_at, error_message')
            .eq('funnel_id', funnelId)
            .eq('user_id', userId)
            .gte('created_at', tenMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('[GenerationJobs] Database error:', error);
            // If table doesn't exist, return empty
            if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
                return Response.json({ activeJobs: [], recentJobs: [] });
            }
            return Response.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        // Separate active vs completed jobs
        const activeJobs = jobs?.filter(j => j.status === 'queued' || j.status === 'processing') || [];
        const completedJobs = jobs?.filter(j => j.status === 'completed') || [];
        const failedJobs = jobs?.filter(j => j.status === 'failed') || [];

        return Response.json({
            activeJobs,
            completedJobs,
            failedJobs,
            hasActiveJobs: activeJobs.length > 0
        });

    } catch (error) {
        console.error('[GenerationJobs] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
