-- Create the get_transcript_stats RPC function
-- This function returns aggregate statistics about the transcript/RAG system
CREATE OR REPLACE FUNCTION public.get_transcript_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_transcripts', (SELECT count(*) FROM public.transcript_metadata),
        'pending', (SELECT count(*) FROM public.transcript_metadata WHERE status = 'pending'),
        'processing', (SELECT count(*) FROM public.transcript_metadata WHERE status = 'processing'),
        'completed', (SELECT count(*) FROM public.transcript_metadata WHERE status = 'completed'),
        'failed', (SELECT count(*) FROM public.transcript_metadata WHERE status = 'failed'),
        'total_chunks', (SELECT count(*) FROM public.ted_knowledge_base),
        'chunks_with_transcript', (SELECT count(*) FROM public.ted_knowledge_base WHERE transcript_id IS NOT NULL),
        'orphaned_chunks', (SELECT count(*) FROM public.ted_knowledge_base WHERE transcript_id IS NULL),
        'avg_chunks_per_transcript', (
            SELECT COALESCE(ROUND(AVG(total_chunks)::numeric, 1), 0)
            FROM public.transcript_metadata
            WHERE status = 'completed'
        ),
        'total_transcript_chars', (
            SELECT COALESCE(SUM(LENGTH(raw_transcript)), 0)
            FROM public.transcript_metadata
        ),
        'latest_transcript_at', (
            SELECT MAX(created_at)
            FROM public.transcript_metadata
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_transcript_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transcript_stats() TO service_role;
