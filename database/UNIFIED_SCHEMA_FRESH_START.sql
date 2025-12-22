-- ============================================
-- TEDOS AI MARKETING AUTOMATION
-- UNIFIED DATABASE SCHEMA - FRESH START
-- ============================================
-- This script creates ALL tables from scratch
-- Compatible with Clerk authentication (text user IDs)
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================
-- Updated: December 2024
-- Version: 3.0 - Complete with RAG, GHL, Transcripts
-- Total Tables: 14
-- ============================================
-- ============================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;
-- ============================================
-- STEP 2: CLEAN SLATE - DROP EVERYTHING
-- ============================================
-- Drop all policies
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT schemaname,
        tablename,
        policyname
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE format(
    'DROP POLICY IF EXISTS %I ON %I.%I',
    r.policyname,
    r.schemaname,
    r.tablename
);
END LOOP;
END $$;
-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_ghl_credentials_updated_at ON ghl_credentials;
DROP TRIGGER IF EXISTS update_ted_knowledge_base_updated_at ON ted_knowledge_base;
DROP TRIGGER IF EXISTS update_rag_data_updated_at ON rag_data;
DROP TRIGGER IF EXISTS update_transcript_metadata_updated_at ON transcript_metadata;
-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.search_ted_knowledge(vector, float, int) CASCADE;
DROP FUNCTION IF EXISTS public.search_user_rag_data(text, vector, float, int, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_transcript_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_transcripts_with_chunks(int, int, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_chunk_transcript_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.delete_transcript(uuid) CASCADE;
-- Drop all tables (in dependency order)
DROP TABLE IF EXISTS public.ghl_push_operations CASCADE;
DROP TABLE IF EXISTS public.ghl_custom_value_mappings CASCADE;
DROP TABLE IF EXISTS public.generated_css CASCADE;
DROP TABLE IF EXISTS public.generated_images CASCADE;
DROP TABLE IF EXISTS public.ghl_credentials CASCADE;
DROP TABLE IF EXISTS public.generated_content CASCADE;
DROP TABLE IF EXISTS public.slide_results CASCADE;
DROP TABLE IF EXISTS public.intake_answers CASCADE;
DROP TABLE IF EXISTS public.saved_sessions CASCADE;
DROP TABLE IF EXISTS public.ted_knowledge_base CASCADE;
DROP TABLE IF EXISTS public.transcript_metadata CASCADE;
DROP TABLE IF EXISTS public.rag_data CASCADE;
DROP TABLE IF EXISTS public.knowledge_base CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
-- ============================================
-- STEP 3: CREATE CORE TABLES
-- ============================================
-- 3.1 USER_PROFILES
CREATE TABLE public.user_profiles (
    id text PRIMARY KEY,
    -- Clerk user ID
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    is_admin boolean DEFAULT false,
    subscription_tier text DEFAULT 'basic' CHECK (
        subscription_tier IN ('basic', 'premium', 'enterprise')
    ),
    tier_expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_tier ON public.user_profiles(subscription_tier);
-- 3.2 SAVED_SESSIONS
CREATE TABLE public.saved_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_name text NOT NULL,
    business_name text,
    current_step integer DEFAULT 1,
    completed_steps integer [] DEFAULT '{}',
    is_complete boolean DEFAULT false,
    status text DEFAULT 'active' CHECK (
        status IN ('active', 'in_progress', 'completed', 'deleted')
    ),
    answers jsonb DEFAULT '{}',
    generated_content jsonb DEFAULT '{}',
    results_data jsonb DEFAULT '{}',
    onboarding_data jsonb DEFAULT '{}',
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_saved_sessions_user ON public.saved_sessions(user_id);
CREATE INDEX idx_saved_sessions_status ON public.saved_sessions(status);
CREATE INDEX idx_saved_sessions_created ON public.saved_sessions(created_at DESC);
-- 3.3 INTAKE_ANSWERS
CREATE TABLE public.intake_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    slide_id integer NOT NULL,
    answers jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_intake_answers_user ON public.intake_answers(user_id);
CREATE INDEX idx_intake_answers_slide ON public.intake_answers(slide_id);
-- 3.4 SLIDE_RESULTS
CREATE TABLE public.slide_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    slide_id integer NOT NULL,
    ai_output jsonb NOT NULL DEFAULT '{}',
    approved boolean DEFAULT false,
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_slide_results_user ON public.slide_results(user_id);
CREATE INDEX idx_slide_results_slide ON public.slide_results(slide_id);
CREATE INDEX idx_slide_results_approved ON public.slide_results(approved);
-- 3.5 GENERATED_CONTENT (Admin review)
CREATE TABLE public.generated_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    content_data jsonb NOT NULL,
    needs_review boolean DEFAULT false,
    reviewed boolean DEFAULT false,
    reviewed_by text,
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_generated_content_user ON public.generated_content(user_id);
CREATE INDEX idx_generated_content_session ON public.generated_content(session_id);
CREATE INDEX idx_generated_content_type ON public.generated_content(content_type);
CREATE INDEX idx_generated_content_review ON public.generated_content(needs_review, reviewed);
-- ============================================
-- STEP 4: RAG / VECTOR TABLES
-- ============================================
-- 4.1 TRANSCRIPT_METADATA (Source tracking)
CREATE TABLE public.transcript_metadata (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    source_type text NOT NULL CHECK (source_type IN ('youtube', 'manual', 'document')),
    source_url text,
    raw_transcript text NOT NULL,
    status text DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    ),
    processing_error text,
    tags text [] DEFAULT ARRAY []::text [],
    content_types text [] DEFAULT ARRAY []::text [],
    total_chunks integer DEFAULT 0,
    processed_chunks integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz
);
CREATE INDEX idx_transcript_metadata_status ON public.transcript_metadata(status);
CREATE INDEX idx_transcript_metadata_tags ON public.transcript_metadata USING GIN(tags);
CREATE INDEX idx_transcript_metadata_source_type ON public.transcript_metadata(source_type);
CREATE INDEX idx_transcript_metadata_created_at ON public.transcript_metadata(created_at DESC);
-- 4.2 TED_KNOWLEDGE_BASE (Vector embeddings)
CREATE TABLE public.ted_knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}',
    transcript_id uuid REFERENCES public.transcript_metadata(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX ted_knowledge_base_embedding_idx ON public.ted_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ted_knowledge_base_metadata_idx ON public.ted_knowledge_base USING gin (metadata);
CREATE INDEX ted_knowledge_base_created_at_idx ON public.ted_knowledge_base (created_at DESC);
CREATE INDEX idx_ted_knowledge_base_transcript_id ON public.ted_knowledge_base(transcript_id);
-- 4.3 RAG_DATA (User-specific vectors)
CREATE TABLE public.rag_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    content_type varchar(100) NOT NULL,
    content jsonb NOT NULL DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    embedding vector(1536),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX rag_data_embedding_idx ON public.rag_data USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX rag_data_user_id_idx ON public.rag_data (user_id);
CREATE INDEX rag_data_content_type_idx ON public.rag_data (content_type);
CREATE INDEX rag_data_user_content_type_idx ON public.rag_data (user_id, content_type);
-- ============================================
-- STEP 5: GHL INTEGRATION TABLES
-- ============================================
-- 5.1 GHL_CREDENTIALS
CREATE TABLE public.ghl_credentials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    location_id text NOT NULL,
    access_token text NOT NULL,
    location_name text,
    is_active boolean DEFAULT true,
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_ghl_credentials_user ON public.ghl_credentials(user_id);
CREATE INDEX idx_ghl_credentials_active ON public.ghl_credentials(is_active);
CREATE INDEX idx_ghl_credentials_location ON public.ghl_credentials(location_id);
-- 5.2 GHL_CUSTOM_VALUE_MAPPINGS
CREATE TABLE public.ghl_custom_value_mappings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.saved_sessions(id) ON DELETE
    SET NULL,
        custom_values jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id, session_id)
);
CREATE INDEX idx_ghl_custom_values_user ON public.ghl_custom_value_mappings(user_id);
CREATE INDEX idx_ghl_custom_values_session ON public.ghl_custom_value_mappings(session_id);
CREATE INDEX idx_ghl_custom_values_created ON public.ghl_custom_value_mappings(created_at DESC);
-- 5.3 GENERATED_IMAGES
CREATE TABLE public.generated_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    image_type text NOT NULL,
    image_purpose text,
    prompt_used text,
    supabase_path text NOT NULL,
    public_url text NOT NULL,
    width integer,
    height integer,
    format text DEFAULT 'png',
    file_size integer,
    status text DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
    error_message text,
    created_at timestamptz DEFAULT now(),
    generated_at timestamptz,
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_generated_images_user ON public.generated_images(user_id);
CREATE INDEX idx_generated_images_session ON public.generated_images(session_id);
CREATE INDEX idx_generated_images_type ON public.generated_images(image_type);
CREATE INDEX idx_generated_images_status ON public.generated_images(status);
-- 5.4 GENERATED_CSS
CREATE TABLE public.generated_css (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    css_code text NOT NULL,
    color_scheme jsonb NOT NULL,
    sections_covered text [],
    is_applied boolean DEFAULT false,
    fallback_used boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_generated_css_user ON public.generated_css(user_id);
CREATE INDEX idx_generated_css_session ON public.generated_css(session_id);
-- 5.5 GHL_PUSH_OPERATIONS
CREATE TABLE public.ghl_push_operations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    ghl_credential_id uuid REFERENCES public.ghl_credentials(id) ON DELETE
    SET NULL,
        operation_type text NOT NULL CHECK (
            operation_type IN (
                'push_values',
                'fetch_snapshot',
                'push_images',
                'push_css'
            )
        ),
        status text DEFAULT 'pending' CHECK (
            status IN (
                'pending',
                'in_progress',
                'completed',
                'failed',
                'partial'
            )
        ),
        total_items integer DEFAULT 0,
        completed_items integer DEFAULT 0,
        failed_items integer DEFAULT 0,
        custom_values_pushed jsonb DEFAULT '{}',
        snapshot_values_found jsonb DEFAULT '{}',
        errors jsonb DEFAULT '[]',
        warnings jsonb DEFAULT '[]',
        started_at timestamptz DEFAULT now(),
        completed_at timestamptz,
        duration_ms integer
);
CREATE INDEX idx_ghl_push_ops_user ON public.ghl_push_operations(user_id);
CREATE INDEX idx_ghl_push_ops_session ON public.ghl_push_operations(session_id);
CREATE INDEX idx_ghl_push_ops_status ON public.ghl_push_operations(status);
CREATE INDEX idx_ghl_push_ops_started ON public.ghl_push_operations(started_at DESC);
-- ============================================
-- STEP 6: FUNCTIONS
-- ============================================
-- 6.1 Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Alias for compatibility
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 6.2 Admin check function
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = current_setting('request.jwt.claims', true)::json->>'sub'
            AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 6.3 Search Ted knowledge base
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
-- 6.4 Search user RAG data
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
-- 6.5 Transcript stats
CREATE OR REPLACE FUNCTION public.get_transcript_stats() RETURNS TABLE (
        total_transcripts BIGINT,
        pending_count BIGINT,
        processing_count BIGINT,
        completed_count BIGINT,
        failed_count BIGINT,
        total_chunks BIGINT,
        average_chunks_per_transcript NUMERIC
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT COUNT(*)::BIGINT,
    COUNT(*) FILTER (
        WHERE status = 'pending'
    )::BIGINT,
    COUNT(*) FILTER (
        WHERE status = 'processing'
    )::BIGINT,
    COUNT(*) FILTER (
        WHERE status = 'completed'
    )::BIGINT,
    COUNT(*) FILTER (
        WHERE status = 'failed'
    )::BIGINT,
    COALESCE(SUM(t.total_chunks), 0)::BIGINT,
    CASE
        WHEN COUNT(*) > 0 THEN ROUND(AVG(t.total_chunks), 2)
        ELSE 0
    END
FROM public.transcript_metadata t;
END;
$$;
-- ============================================
-- STEP 7: TRIGGERS
-- ============================================
CREATE TRIGGER trigger_user_profiles_updated_at BEFORE
UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_saved_sessions_updated_at BEFORE
UPDATE ON public.saved_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_ghl_credentials_updated_at BEFORE
UPDATE ON public.ghl_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_generated_images_updated_at BEFORE
UPDATE ON public.generated_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_generated_css_updated_at BEFORE
UPDATE ON public.generated_css FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_ghl_custom_values_updated_at BEFORE
UPDATE ON public.ghl_custom_value_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_ted_knowledge_base_updated_at BEFORE
UPDATE ON public.ted_knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rag_data_updated_at BEFORE
UPDATE ON public.rag_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transcript_metadata_updated_at BEFORE
UPDATE ON public.transcript_metadata FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================
-- STEP 8: ROW LEVEL SECURITY (RLS)
-- ============================================
-- USER_PROFILES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR
SELECT USING (
        id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR
UPDATE USING (
        id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR
SELECT USING (is_admin());
-- SAVED_SESSIONS
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.saved_sessions FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can create own sessions" ON public.saved_sessions FOR
INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can update own sessions" ON public.saved_sessions FOR
UPDATE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can delete own sessions" ON public.saved_sessions FOR DELETE USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
-- GHL_CREDENTIALS
ALTER TABLE public.ghl_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own GHL credentials" ON public.ghl_credentials FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
-- GHL_CUSTOM_VALUE_MAPPINGS
ALTER TABLE public.ghl_custom_value_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own GHL custom values" ON public.ghl_custom_value_mappings FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
-- GENERATED_IMAGES
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own images" ON public.generated_images FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can create own images" ON public.generated_images FOR
INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can update own images" ON public.generated_images FOR
UPDATE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
-- GENERATED_CSS
ALTER TABLE public.generated_css ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own CSS" ON public.generated_css FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
-- GHL_PUSH_OPERATIONS
ALTER TABLE public.ghl_push_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own push operations" ON public.ghl_push_operations FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can create own push operations" ON public.ghl_push_operations FOR
INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can update own push operations" ON public.ghl_push_operations FOR
UPDATE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
-- OTHER TABLES
ALTER TABLE public.intake_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own intake answers" ON public.intake_answers FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
ALTER TABLE public.slide_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own slide results" ON public.slide_results FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own generated content" ON public.generated_content FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
-- RAG TABLES (Service role controlled)
ALTER TABLE public.ted_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ted_knowledge_base_read_all" ON public.ted_knowledge_base FOR
SELECT TO authenticated,
    anon USING (true);
CREATE POLICY "ted_knowledge_base_service_role_all" ON public.ted_knowledge_base FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.rag_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_data_read_all" ON public.rag_data FOR
SELECT TO authenticated,
    anon USING (true);
CREATE POLICY "rag_data_service_role_all" ON public.rag_data FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE public.transcript_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transcript_metadata_read_all" ON public.transcript_metadata FOR
SELECT TO authenticated,
    anon USING (true);
CREATE POLICY "transcript_metadata_service_role_all" ON public.transcript_metadata FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- STEP 9: GRANTS
-- ============================================
GRANT ALL ON public.ted_knowledge_base TO service_role;
GRANT ALL ON public.rag_data TO service_role;
GRANT ALL ON public.transcript_metadata TO service_role;
GRANT ALL ON public.ghl_custom_value_mappings TO authenticated;
GRANT ALL ON public.ghl_custom_value_mappings TO service_role;
GRANT SELECT ON public.ted_knowledge_base TO authenticated;
GRANT SELECT ON public.rag_data TO authenticated;
GRANT SELECT ON public.transcript_metadata TO authenticated;
GRANT SELECT ON public.ted_knowledge_base TO anon;
GRANT EXECUTE ON FUNCTION public.search_ted_knowledge(vector, float, int) TO authenticated,
    anon,
    service_role;
GRANT EXECUTE ON FUNCTION public.search_user_rag_data(text, vector, float, int, text) TO authenticated,
    anon,
    service_role;
GRANT EXECUTE ON FUNCTION public.get_transcript_stats() TO authenticated,
    anon,
    service_role;
-- ============================================
-- STEP 10: VERIFICATION
-- ============================================
DO $$
DECLARE table_count integer;
BEGIN
SELECT COUNT(*) INTO table_count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'user_profiles',
        'saved_sessions',
        'intake_answers',
        'slide_results',
        'generated_content',
        'ghl_credentials',
        'ghl_custom_value_mappings',
        'generated_images',
        'generated_css',
        'ghl_push_operations',
        'ted_knowledge_base',
        'rag_data',
        'transcript_metadata'
    );
RAISE NOTICE '============================================';
RAISE NOTICE 'SCHEMA CREATION COMPLETE';
RAISE NOTICE '============================================';
RAISE NOTICE 'Tables created: % out of 13',
table_count;
IF table_count = 13 THEN RAISE NOTICE 'SUCCESS: All tables created successfully!';
ELSE RAISE WARNING 'INCOMPLETE: Some tables may be missing!';
END IF;
RAISE NOTICE '============================================';
RAISE NOTICE 'TABLES INCLUDED:';
RAISE NOTICE '  - user_profiles (Clerk auth)';
RAISE NOTICE '  - saved_sessions (questionnaire + results)';
RAISE NOTICE '  - intake_answers, slide_results';
RAISE NOTICE '  - generated_content (admin review)';
RAISE NOTICE '  - ghl_credentials, ghl_custom_value_mappings';
RAISE NOTICE '  - generated_images, generated_css';
RAISE NOTICE '  - ghl_push_operations';
RAISE NOTICE '  - ted_knowledge_base, rag_data (vectors)';
RAISE NOTICE '  - transcript_metadata';
RAISE NOTICE '============================================';
RAISE NOTICE 'NEXT STEPS:';
RAISE NOTICE '1. Create storage bucket: funnel-images (public)';
RAISE NOTICE '2. Add storage policies for image uploads';
RAISE NOTICE '============================================';
END $$;
-- ============================================
-- END OF UNIFIED SCHEMA v3.0
-- ============================================
-- Tables: 13
-- Indexes: 40+
-- Functions: 5
-- Triggers: 9
-- Policies: 25+
-- ============================================