import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

/**
 * GET /api/os/generation-status?id=xxx
 * Poll the status of a background generation job
 */
export async function GET(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
        return Response.json({ error: workspaceError }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    // Accept both `id` and `jobId` for backwards compatibility
    const jobId = searchParams.get('id') || searchParams.get('jobId');

    if (!jobId) {
        return Response.json({ error: 'id parameter is required' }, { status: 400 });
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabaseAdmin
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', targetUserId) // Ensure user owns this job
        .single();

    if (jobError || !job) {
        return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    return Response.json({
        id: job.id,
        funnelId: job.funnel_id,
        jobType: job.job_type,
        status: job.status,
        progressPercentage: job.progress_percentage,
        currentSection: job.current_section,
        sectionsCompleted: job.sections_completed || [],
        sectionsFailed: job.sections_failed || [],
        errorMessage: job.error_message,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        totalTimeMs: job.total_time_ms,
        createdAt: job.created_at
    });
}
