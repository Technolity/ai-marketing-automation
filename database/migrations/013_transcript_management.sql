-- ============================================
-- TRANSCRIPT MANAGEMENT FOR TEDOS RAG SYSTEM
-- ============================================
-- Migration: 013_transcript_management.sql
-- Created: 2025-12-13
-- 
-- This migration adds transcript tracking and management
-- Links transcript sources to their generated RAG chunks
-- 
-- Prerequisites:
--   - ted_knowledge_base table must exist (from 012_pgvector_setup.sql)
--   - update_updated_at_column() function must exist
-- 
-- Current ted_knowledge_base structure:
--   - id (uuid, PK)
--   - content (text)
--   - embedding (vector)
--   - metadata (jsonb)
--   - created_at (timestamptz)
--   - updated_at (timestamptz)
-- ============================================
-- ============================================
-- TRANSCRIPT METADATA TABLE
-- ============================================
-- Stores information about video transcripts before/during/after processing
CREATE TABLE IF NOT EXISTS public.transcript_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    -- Source Information
    source_type TEXT NOT NULL CHECK (source_type IN ('youtube', 'manual', 'document')),
    source_url TEXT,
    -- YouTube URL or document link
    raw_transcript TEXT NOT NULL,
    -- Processing Status
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    ),
    processing_error TEXT,
    -- Metadata
    tags TEXT [] DEFAULT ARRAY []::TEXT [],
    content_types TEXT [] DEFAULT ARRAY []::TEXT [],
    -- ['vsl', 'email', 'ads', 'funnel', 'story']
    -- Statistics
    total_chunks INTEGER DEFAULT 0,
    processed_chunks INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
-- Add comments for documentation
COMMENT ON TABLE public.transcript_metadata IS 'Stores transcript information and processing status for RAG system';
COMMENT ON COLUMN public.transcript_metadata.source_type IS 'Type of source: youtube, manual, or document';
COMMENT ON COLUMN public.transcript_metadata.status IS 'Processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN public.transcript_metadata.tags IS 'Tags for categorization: lead-generation, sales, storytelling, etc.';
COMMENT ON COLUMN public.transcript_metadata.content_types IS 'What content can be generated from this: vsl, email, ads, funnel, story';
-- ============================================
-- UPDATE TED_KNOWLEDGE_BASE TABLE
-- ============================================
-- Add transcript_id to link chunks back to their source transcript
-- Note: ted_knowledge_base already has: id, content, embedding, metadata, created_at, updated_at
ALTER TABLE public.ted_knowledge_base
ADD COLUMN IF NOT EXISTS transcript_id UUID REFERENCES public.transcript_metadata(id) ON DELETE CASCADE;
COMMENT ON COLUMN public.ted_knowledge_base.transcript_id IS 'Links chunk to source transcript (NULL for sample/manual data)';
-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Index for status filtering (show pending/processing/completed/failed)
CREATE INDEX IF NOT EXISTS idx_transcript_metadata_status ON public.transcript_metadata(status);
-- Index for tag filtering (filter by tags)
CREATE INDEX IF NOT EXISTS idx_transcript_metadata_tags ON public.transcript_metadata USING GIN(tags);
-- Index for content type filtering
CREATE INDEX IF NOT EXISTS idx_transcript_metadata_content_types ON public.transcript_metadata USING GIN(content_types);
-- Index for source type filtering
CREATE INDEX IF NOT EXISTS idx_transcript_metadata_source_type ON public.transcript_metadata(source_type);
-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_transcript_metadata_created_at ON public.transcript_metadata(created_at DESC);
-- Index for linking chunks to transcripts
CREATE INDEX IF NOT EXISTS idx_ted_knowledge_base_transcript_id ON public.ted_knowledge_base(transcript_id);
-- Composite index for common query pattern (transcript_id + created_at)
CREATE INDEX IF NOT EXISTS idx_ted_knowledge_base_transcript_created ON public.ted_knowledge_base(transcript_id, created_at DESC);
-- Full-text search index on title
CREATE INDEX IF NOT EXISTS idx_transcript_metadata_title_search ON public.transcript_metadata USING gin(to_tsvector('english', title));
-- Full-text search index on description (only if description is not null)
CREATE INDEX IF NOT EXISTS idx_transcript_metadata_description_search ON public.transcript_metadata USING gin(
    to_tsvector('english', COALESCE(description, ''))
);
-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
-- Automatically update updated_at column on transcript changes
-- Uses existing update_updated_at_column() function
DROP TRIGGER IF EXISTS update_transcript_metadata_updated_at ON public.transcript_metadata;
CREATE TRIGGER update_transcript_metadata_updated_at BEFORE
UPDATE ON public.transcript_metadata FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- Enable RLS on transcript_metadata
ALTER TABLE public.transcript_metadata ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "transcript_metadata_read_all" ON public.transcript_metadata;
DROP POLICY IF EXISTS "transcript_metadata_service_role_all" ON public.transcript_metadata;
-- Allow authenticated users to read all transcripts (for generation context)
CREATE POLICY "transcript_metadata_read_all" ON public.transcript_metadata FOR
SELECT TO authenticated,
    anon USING (true);
-- Only service role (admins via API) can insert/update/delete
CREATE POLICY "transcript_metadata_service_role_all" ON public.transcript_metadata FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- GRANTS
-- ============================================
-- Grant service role full access (for admin operations)
GRANT ALL ON public.transcript_metadata TO service_role;
-- Grant authenticated users read access
GRANT SELECT ON public.transcript_metadata TO authenticated;
-- Grant anonymous users read access (for public API if needed)
GRANT SELECT ON public.transcript_metadata TO anon;
-- ============================================
-- HELPER FUNCTIONS
-- ============================================
-- Function to get transcript statistics
CREATE OR REPLACE FUNCTION public.get_transcript_stats() RETURNS TABLE (
        total_transcripts BIGINT,
        pending_count BIGINT,
        processing_count BIGINT,
        completed_count BIGINT,
        failed_count BIGINT,
        total_chunks BIGINT,
        average_chunks_per_transcript NUMERIC
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT COUNT(*)::BIGINT as total_transcripts,
    COUNT(*) FILTER (
        WHERE status = 'pending'
    )::BIGINT as pending_count,
    COUNT(*) FILTER (
        WHERE status = 'processing'
    )::BIGINT as processing_count,
    COUNT(*) FILTER (
        WHERE status = 'completed'
    )::BIGINT as completed_count,
    COUNT(*) FILTER (
        WHERE status = 'failed'
    )::BIGINT as failed_count,
    COALESCE(SUM(t.total_chunks), 0)::BIGINT as total_chunks,
    CASE
        WHEN COUNT(*) > 0 THEN ROUND(AVG(t.total_chunks), 2)
        ELSE 0
    END as average_chunks_per_transcript
FROM public.transcript_metadata t;
END;
$$;
COMMENT ON FUNCTION public.get_transcript_stats IS 'Returns aggregate statistics for all transcripts';
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_transcript_stats() TO authenticated,
    anon,
    service_role;
-- Function to get transcripts with chunk counts
CREATE OR REPLACE FUNCTION public.get_transcripts_with_chunks(
        p_limit INT DEFAULT 20,
        p_offset INT DEFAULT 0,
        p_status TEXT DEFAULT NULL,
        p_search TEXT DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        title TEXT,
        description TEXT,
        source_type TEXT,
        source_url TEXT,
        status TEXT,
        tags TEXT [],
        content_types TEXT [],
        total_chunks INTEGER,
        processed_chunks INTEGER,
        chunk_count BIGINT,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ,
        processed_at TIMESTAMPTZ
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT t.id,
    t.title,
    t.description,
    t.source_type,
    t.source_url,
    t.status,
    t.tags,
    t.content_types,
    t.total_chunks,
    t.processed_chunks,
    COUNT(k.id)::BIGINT as chunk_count,
    t.created_at,
    t.updated_at,
    t.processed_at
FROM public.transcript_metadata t
    LEFT JOIN public.ted_knowledge_base k ON k.transcript_id = t.id
WHERE (
        p_status IS NULL
        OR t.status = p_status
    )
    AND (
        p_search IS NULL
        OR t.title ILIKE '%' || p_search || '%'
        OR t.description ILIKE '%' || p_search || '%'
    )
GROUP BY t.id
ORDER BY t.created_at DESC
LIMIT p_limit OFFSET p_offset;
END;
$$;
COMMENT ON FUNCTION public.get_transcripts_with_chunks IS 'Returns paginated list of transcripts with actual chunk counts from knowledge base';
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_transcripts_with_chunks(INT, INT, TEXT, TEXT) TO authenticated,
    anon,
    service_role;
-- Function to update transcript_id for LangChain-stored chunks
-- LangChain stores transcript_id in metadata JSONB, we also need it in the column
CREATE OR REPLACE FUNCTION public.update_chunk_transcript_ids(p_transcript_id UUID) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE updated_count INTEGER;
BEGIN -- Update chunks that have transcript_id in metadata but not in column
UPDATE public.ted_knowledge_base
SET transcript_id = p_transcript_id
WHERE (metadata->>'transcript_id')::UUID = p_transcript_id
    AND (
        transcript_id IS NULL
        OR transcript_id != p_transcript_id
    );
GET DIAGNOSTICS updated_count = ROW_COUNT;
RETURN updated_count;
END;
$$;
COMMENT ON FUNCTION public.update_chunk_transcript_ids IS 'Updates transcript_id column from metadata JSONB for LangChain-stored chunks';
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_chunk_transcript_ids(UUID) TO service_role;
-- Function to delete a transcript and all its chunks (cascade)
CREATE OR REPLACE FUNCTION public.delete_transcript(p_transcript_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Delete transcript (chunks are cascaded automatically via FK)
DELETE FROM public.transcript_metadata
WHERE id = p_transcript_id;
RETURN FOUND;
END;
$$;
COMMENT ON FUNCTION public.delete_transcript IS 'Deletes a transcript and all associated chunks';
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_transcript(UUID) TO service_role;
-- ============================================
-- VERIFICATION QUERIES (Run manually to verify)
-- ============================================
/*
 -- Check table exists
 SELECT table_name, table_type
 FROM information_schema.tables
 WHERE table_schema = 'public'
 AND table_name = 'transcript_metadata';
 
 -- Check columns
 SELECT column_name, data_type, is_nullable
 FROM information_schema.columns
 WHERE table_schema = 'public'
 AND table_name = 'transcript_metadata'
 ORDER BY ordinal_position;
 
 -- Check indexes
 SELECT indexname, indexdef
 FROM pg_indexes
 WHERE tablename = 'transcript_metadata'
 ORDER BY indexname;
 
 -- Check ted_knowledge_base has transcript_id column
 SELECT column_name, data_type
 FROM information_schema.columns
 WHERE table_schema = 'public'
 AND table_name = 'ted_knowledge_base'
 AND column_name = 'transcript_id';
 
 -- Test the helper function
 SELECT * FROM public.get_transcript_stats();
 */
-- ============================================
-- USAGE EXAMPLES (for reference)
-- ============================================
/*
 
 -- Insert a new transcript
 INSERT INTO public.transcript_metadata (
 title, description, source_type, source_url, raw_transcript, tags, content_types
 )
 VALUES (
 'Lead Generation Masterclass',
 'Ted McGrath teaches his proven lead generation framework',
 'youtube',
 'https://youtube.com/watch?v=abc123',
 'Full transcript text here...',
 ARRAY['lead-generation', 'ads', 'funnel'],
 ARRAY['vsl', 'email', 'ads']
 )
 RETURNING id;
 
 -- Update transcript status
 UPDATE public.transcript_metadata
 SET
 status = 'completed',
 total_chunks = 23,
 processed_chunks = 23,
 processed_at = NOW()
 WHERE id = 'your-uuid-here';
 
 -- Get all transcripts with pagination
 SELECT * FROM public.get_transcripts_with_chunks(20, 0, NULL, NULL);
 
 -- Get only completed transcripts
 SELECT * FROM public.get_transcripts_with_chunks(20, 0, 'completed', NULL);
 
 -- Search transcripts
 SELECT * FROM public.get_transcripts_with_chunks(20, 0, NULL, 'lead generation');
 
 -- Get transcript stats
 SELECT * FROM public.get_transcript_stats();
 
 -- Get all chunks for a specific transcript
 SELECT
 id, content, metadata, created_at
 FROM public.ted_knowledge_base
 WHERE transcript_id = 'your-uuid-here'
 ORDER BY (metadata->>'chunk_index')::int ASC;
 
 -- Delete transcript (will cascade delete all chunks)
 SELECT public.delete_transcript('your-uuid-here');
 
 */
-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration adds:
-- 1. transcript_metadata table for tracking transcripts
-- 2. transcript_id column to ted_knowledge_base
-- 3. Indexes for performance
-- 4. RLS policies for security
-- 5. Helper functions for admin operations
-- ============================================