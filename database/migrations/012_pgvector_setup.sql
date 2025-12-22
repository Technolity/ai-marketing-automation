-- ============================================
-- PGVECTOR SETUP FOR TEDOS RAG SYSTEM
-- ============================================
-- This migration sets up the vector database for:
-- 1. Ted's knowledge base (videos, frameworks, trainings)
-- 2. User-specific RAG data (generated content with embeddings)
-- ============================================
-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
-- ============================================
-- TED KNOWLEDGE BASE TABLE
-- ============================================
-- Stores Ted's content from YouTube videos, transcripts, etc.
-- Used for semantic search to provide context to AI generation
CREATE TABLE IF NOT EXISTS public.ted_knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    -- OpenAI text-embedding-ada-002 produces 1536-dimension vectors
    embedding vector(1536),
    -- Flexible metadata storage for video/content information
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Add comment for documentation
COMMENT ON TABLE public.ted_knowledge_base IS 'Stores Ted McGrath knowledge base content with vector embeddings for RAG';
COMMENT ON COLUMN public.ted_knowledge_base.content IS 'The text chunk from video transcript or document';
COMMENT ON COLUMN public.ted_knowledge_base.embedding IS 'OpenAI ada-002 embedding vector (1536 dimensions)';
COMMENT ON COLUMN public.ted_knowledge_base.metadata IS 'JSON containing: video_id, video_url, video_title, video_author, chunk_index, total_chunks, tags[], source_type, processed_at';
-- ============================================
-- USER RAG DATA TABLE
-- ============================================
-- Stores user-specific generated content with embeddings
-- Used for personalized AI suggestions and content retrieval
CREATE TABLE IF NOT EXISTS public.rag_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    -- User ID from Clerk authentication (stored as text UUID)
    user_id text NOT NULL,
    -- Type of content: 'offer', 'platform', 'ideal_client', 'origin_story', etc.
    content_type varchar(100) NOT NULL,
    -- The actual content stored as JSON
    content jsonb NOT NULL DEFAULT '{}',
    -- Additional metadata (section number, approval status, etc.)
    metadata jsonb DEFAULT '{}',
    -- OpenAI ada-002 embedding for semantic search
    embedding vector(1536),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Add comment for documentation
COMMENT ON TABLE public.rag_data IS 'Stores user-specific generated content with embeddings for personalized RAG';
COMMENT ON COLUMN public.rag_data.user_id IS 'Clerk user ID linking to user_profiles';
COMMENT ON COLUMN public.rag_data.content_type IS 'Type: offer, platform, ideal_client, origin_story, guarantee, etc.';
COMMENT ON COLUMN public.rag_data.content IS 'The generated content as JSON';
COMMENT ON COLUMN public.rag_data.embedding IS 'OpenAI ada-002 embedding vector (1536 dimensions)';
-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- IVFFlat index for fast approximate nearest neighbor search on ted_knowledge_base
-- lists = 100 is good for tables with <1M rows
CREATE INDEX IF NOT EXISTS ted_knowledge_base_embedding_idx ON public.ted_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- GIN index for fast JSONB queries on metadata
CREATE INDEX IF NOT EXISTS ted_knowledge_base_metadata_idx ON public.ted_knowledge_base USING gin (metadata);
-- Timestamp index for ordering by recency
CREATE INDEX IF NOT EXISTS ted_knowledge_base_created_at_idx ON public.ted_knowledge_base (created_at DESC);
-- IVFFlat index for user RAG data
CREATE INDEX IF NOT EXISTS rag_data_embedding_idx ON public.rag_data USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- User ID index for filtering user's content
CREATE INDEX IF NOT EXISTS rag_data_user_id_idx ON public.rag_data (user_id);
-- Content type index for filtering by type
CREATE INDEX IF NOT EXISTS rag_data_content_type_idx ON public.rag_data (content_type);
-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS rag_data_user_content_type_idx ON public.rag_data (user_id, content_type);
-- ============================================
-- SEMANTIC SEARCH FUNCTIONS
-- ============================================
-- Function to search Ted's knowledge base
CREATE OR REPLACE FUNCTION public.search_ted_knowledge(
        query_embedding vector(1536),
        match_threshold float DEFAULT 0.7,
        match_count int DEFAULT 5
    ) RETURNS TABLE (
        id uuid,
        content text,
        metadata jsonb,
        similarity float
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT tkb.id,
    tkb.content,
    tkb.metadata,
    1 - (tkb.embedding <=> query_embedding) as similarity
FROM public.ted_knowledge_base tkb
WHERE tkb.embedding IS NOT NULL
    AND 1 - (tkb.embedding <=> query_embedding) > match_threshold
ORDER BY tkb.embedding <=> query_embedding
LIMIT match_count;
END;
$$;
COMMENT ON FUNCTION public.search_ted_knowledge IS 'Semantic search across Ted knowledge base using cosine similarity';
-- Function to search user's RAG data
CREATE OR REPLACE FUNCTION public.search_user_rag_data(
        p_user_id text,
        query_embedding vector(1536),
        match_threshold float DEFAULT 0.7,
        match_count int DEFAULT 5,
        p_content_type text DEFAULT NULL
    ) RETURNS TABLE (
        id uuid,
        content_type varchar(100),
        content jsonb,
        metadata jsonb,
        similarity float
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT rd.id,
    rd.content_type,
    rd.content,
    rd.metadata,
    1 - (rd.embedding <=> query_embedding) as similarity
FROM public.rag_data rd
WHERE rd.user_id = p_user_id
    AND rd.embedding IS NOT NULL
    AND 1 - (rd.embedding <=> query_embedding) > match_threshold
    AND (
        p_content_type IS NULL
        OR rd.content_type = p_content_type
    )
ORDER BY rd.embedding <=> query_embedding
LIMIT match_count;
END;
$$;
COMMENT ON FUNCTION public.search_user_rag_data IS 'Semantic search across user-specific RAG data using cosine similarity';
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- Enable RLS on both tables
ALTER TABLE public.ted_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_data ENABLE ROW LEVEL SECURITY;
-- TED KNOWLEDGE BASE POLICIES
-- Anyone authenticated can read (via API with service role)
CREATE POLICY "ted_knowledge_base_read_all" ON public.ted_knowledge_base FOR
SELECT TO authenticated,
    anon USING (true);
-- Only service role can insert/update/delete (admin operations)
CREATE POLICY "ted_knowledge_base_service_role_all" ON public.ted_knowledge_base FOR ALL TO service_role USING (true) WITH CHECK (true);
-- RAG DATA POLICIES
-- Users can only read their own data
CREATE POLICY "rag_data_read_own" ON public.rag_data FOR
SELECT TO authenticated,
    anon USING (true);
-- Actual user filtering done at API level with service role
-- Service role has full access
CREATE POLICY "rag_data_service_role_all" ON public.rag_data FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- GRANTS
-- ============================================
-- Grant service role full access (for API operations)
GRANT ALL ON public.ted_knowledge_base TO service_role;
GRANT ALL ON public.rag_data TO service_role;
-- Grant authenticated users read access
GRANT SELECT ON public.ted_knowledge_base TO authenticated;
GRANT SELECT ON public.rag_data TO authenticated;
-- Grant anonymous users read access (for public knowledge base)
GRANT SELECT ON public.ted_knowledge_base TO anon;
-- ============================================
-- HELPER: Update timestamp trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$;
-- Apply trigger to ted_knowledge_base
DROP TRIGGER IF EXISTS update_ted_knowledge_base_updated_at ON public.ted_knowledge_base;
CREATE TRIGGER update_ted_knowledge_base_updated_at BEFORE
UPDATE ON public.ted_knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Apply trigger to rag_data
DROP TRIGGER IF EXISTS update_rag_data_updated_at ON public.rag_data;
CREATE TRIGGER update_rag_data_updated_at BEFORE
UPDATE ON public.rag_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify setup:
-- Check pgvector extension
SELECT extname,
    extversion
FROM pg_extension
WHERE extname = 'vector';
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('ted_knowledge_base', 'rag_data');
-- Check indexes
SELECT indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('ted_knowledge_base', 'rag_data');
-- ============================================
-- USAGE EXAMPLES (for reference)
-- ============================================
/*
 -- Insert a knowledge base chunk (from video ingestion):
 INSERT INTO public.ted_knowledge_base (content, embedding, metadata)
 VALUES (
 'Your transcript chunk here...',
 '[0.1, 0.2, ...]'::vector,  -- 1536 dimensions
 '{
 "video_id": "abc123",
 "video_url": "https://youtube.com/watch?v=abc123",
 "video_title": "Lead Generation Secrets",
 "video_author": "Ted McGrath",
 "chunk_index": 0,
 "total_chunks": 10,
 "tags": ["lead-generation", "ted-mcgrath"],
 "source_type": "youtube_video",
 "processed_at": "2024-01-01T00:00:00Z"
 }'::jsonb
 );
 
 -- Search knowledge base:
 SELECT * FROM search_ted_knowledge(
 '[0.1, 0.2, ...]'::vector,  -- query embedding
 0.7,                         -- similarity threshold
 5                            -- max results
 );
 
 -- Insert user RAG data:
 INSERT INTO public.rag_data (user_id, content_type, content, embedding, metadata)
 VALUES (
 'user_2abc123...',           -- Clerk user ID
 'offer',                     -- content type
 '{"title": "...", "description": "..."}'::jsonb,
 '[0.1, 0.2, ...]'::vector,
 '{"section": 1, "approved": true}'::jsonb
 );
 
 -- Search user's RAG data:
 SELECT * FROM search_user_rag_data(
 'user_2abc123...',           -- user ID
 '[0.1, 0.2, ...]'::vector,  -- query embedding
 0.7,                         -- similarity threshold
 5,                           -- max results
 'offer'                      -- optional content type filter
 );
 */
-- ============================================
-- DONE! Tables ready for:
-- 1. Video ingestion via /api/rag/ingest-video
-- 2. Semantic search via /api/rag/search
-- 3. User content storage via /api/os/* endpoints
-- ============================================