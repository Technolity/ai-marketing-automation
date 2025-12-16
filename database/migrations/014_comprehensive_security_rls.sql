-- ============================================
-- COMPREHENSIVE SECURITY & RLS POLICIES
-- ============================================
-- Migration: 014_comprehensive_security_rls.sql
-- Created: 2025-12-13
--
-- This migration adds comprehensive Row Level Security (RLS) policies
-- to ALL user-facing tables to ensure complete data isolation and security
--
-- Current Tables in Database:
--   - admin_settings
--   - user_profiles
--   - wizard_progress
--   - saved_sessions
--   - intake_answers
--   - slide_results
--   - knowledge_base
--   - ted_knowledge_base
--   - rag_data
--   - transcript_metadata (added by 013 migration)
--
-- Security Principles:
--   1. Users can ONLY access their own data
--   2. Admins can access all data (via is_admin flag)
--   3. Service role bypasses RLS for system operations
--   4. All policies use auth.uid() for user identification
--   5. Soft deletes preserve data while hiding from users
-- ============================================
-- ============================================
-- ENABLE RLS ON ALL USER TABLES
-- ============================================
-- user_profiles: Already has RLS enabled
-- transcript_metadata: Already has RLS enabled (admin only from 013 migration)
-- ted_knowledge_base: Will be enabled below
-- Enable RLS on content tables (only if table exists)
DO $$ BEGIN -- slide_results
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'slide_results'
) THEN
ALTER TABLE public.slide_results ENABLE ROW LEVEL SECURITY;
END IF;
-- intake_answers
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'intake_answers'
) THEN
ALTER TABLE public.intake_answers ENABLE ROW LEVEL SECURITY;
END IF;
-- saved_sessions
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'saved_sessions'
) THEN
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;
END IF;
-- wizard_progress
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'wizard_progress'
) THEN
ALTER TABLE public.wizard_progress ENABLE ROW LEVEL SECURITY;
END IF;
-- rag_data
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'rag_data'
) THEN
ALTER TABLE public.rag_data ENABLE ROW LEVEL SECURITY;
END IF;
-- ted_knowledge_base
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'ted_knowledge_base'
) THEN
ALTER TABLE public.ted_knowledge_base ENABLE ROW LEVEL SECURITY;
END IF;
-- knowledge_base
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'knowledge_base'
) THEN
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
END IF;
END $$;
-- ============================================
-- DROP EXISTING POLICIES (for idempotency)
-- ============================================
-- slide_results
DROP POLICY IF EXISTS "slide_results_user_select" ON public.slide_results;
DROP POLICY IF EXISTS "slide_results_user_insert" ON public.slide_results;
DROP POLICY IF EXISTS "slide_results_user_update" ON public.slide_results;
DROP POLICY IF EXISTS "slide_results_user_delete" ON public.slide_results;
DROP POLICY IF EXISTS "slide_results_admin_all" ON public.slide_results;
-- intake_answers
DROP POLICY IF EXISTS "intake_answers_user_select" ON public.intake_answers;
DROP POLICY IF EXISTS "intake_answers_user_insert" ON public.intake_answers;
DROP POLICY IF EXISTS "intake_answers_user_update" ON public.intake_answers;
DROP POLICY IF EXISTS "intake_answers_user_delete" ON public.intake_answers;
DROP POLICY IF EXISTS "intake_answers_admin_all" ON public.intake_answers;
-- saved_sessions
DROP POLICY IF EXISTS "saved_sessions_user_select" ON public.saved_sessions;
DROP POLICY IF EXISTS "saved_sessions_user_insert" ON public.saved_sessions;
DROP POLICY IF EXISTS "saved_sessions_user_update" ON public.saved_sessions;
DROP POLICY IF EXISTS "saved_sessions_user_delete" ON public.saved_sessions;
DROP POLICY IF EXISTS "saved_sessions_admin_all" ON public.saved_sessions;
-- wizard_progress
DROP POLICY IF EXISTS "wizard_progress_user_select" ON public.wizard_progress;
DROP POLICY IF EXISTS "wizard_progress_user_insert" ON public.wizard_progress;
DROP POLICY IF EXISTS "wizard_progress_user_update" ON public.wizard_progress;
DROP POLICY IF EXISTS "wizard_progress_user_delete" ON public.wizard_progress;
DROP POLICY IF EXISTS "wizard_progress_admin_all" ON public.wizard_progress;
-- rag_data
DROP POLICY IF EXISTS "rag_data_user_select" ON public.rag_data;
DROP POLICY IF EXISTS "rag_data_user_insert" ON public.rag_data;
DROP POLICY IF EXISTS "rag_data_user_update" ON public.rag_data;
DROP POLICY IF EXISTS "rag_data_user_delete" ON public.rag_data;
DROP POLICY IF EXISTS "rag_data_admin_all" ON public.rag_data;
DROP POLICY IF EXISTS "rag_data_read_all" ON public.rag_data;
DROP POLICY IF EXISTS "rag_data_service_role_all" ON public.rag_data;
-- ted_knowledge_base
DROP POLICY IF EXISTS "ted_knowledge_base_read_all" ON public.ted_knowledge_base;
DROP POLICY IF EXISTS "ted_knowledge_base_service_role_all" ON public.ted_knowledge_base;
-- knowledge_base
DROP POLICY IF EXISTS "knowledge_base_read_all" ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base_service_role_all" ON public.knowledge_base;
-- ============================================
-- SLIDE_RESULTS POLICIES
-- ============================================
-- Users can only see/manage their own slide results
-- Admins can see/manage all slide results
CREATE POLICY "slide_results_user_select" ON public.slide_results FOR
SELECT TO authenticated USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
CREATE POLICY "slide_results_user_insert" ON public.slide_results FOR
INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "slide_results_user_update" ON public.slide_results FOR
UPDATE TO authenticated USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    ) WITH CHECK (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
CREATE POLICY "slide_results_user_delete" ON public.slide_results FOR DELETE TO authenticated USING (
    user_id = auth.uid()::text
    OR EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()::text
            AND is_admin = true
    )
);
-- Service role has full access
CREATE POLICY "slide_results_admin_all" ON public.slide_results FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- INTAKE_ANSWERS POLICIES
-- ============================================
CREATE POLICY "intake_answers_user_select" ON public.intake_answers FOR
SELECT TO authenticated USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
CREATE POLICY "intake_answers_user_insert" ON public.intake_answers FOR
INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "intake_answers_user_update" ON public.intake_answers FOR
UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "intake_answers_user_delete" ON public.intake_answers FOR DELETE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "intake_answers_admin_all" ON public.intake_answers FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- SAVED_SESSIONS POLICIES
-- ============================================
-- Include soft delete check (is_deleted = false)
CREATE POLICY "saved_sessions_user_select" ON public.saved_sessions FOR
SELECT TO authenticated USING (
        (
            user_id = auth.uid()::text
            AND (
                is_deleted IS NULL
                OR is_deleted = false
            )
        )
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
CREATE POLICY "saved_sessions_user_insert" ON public.saved_sessions FOR
INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "saved_sessions_user_update" ON public.saved_sessions FOR
UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "saved_sessions_user_delete" ON public.saved_sessions FOR DELETE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "saved_sessions_admin_all" ON public.saved_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- WIZARD_PROGRESS POLICIES
-- ============================================
CREATE POLICY "wizard_progress_user_select" ON public.wizard_progress FOR
SELECT TO authenticated USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
CREATE POLICY "wizard_progress_user_insert" ON public.wizard_progress FOR
INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "wizard_progress_user_update" ON public.wizard_progress FOR
UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "wizard_progress_user_delete" ON public.wizard_progress FOR DELETE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "wizard_progress_admin_all" ON public.wizard_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- RAG_DATA POLICIES
-- ============================================
-- User-specific RAG embeddings for personalized content generation
-- Columns: id, user_id, content_type, content, metadata, embedding, created_at, updated_at
CREATE POLICY "rag_data_user_select" ON public.rag_data FOR
SELECT TO authenticated USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
CREATE POLICY "rag_data_user_insert" ON public.rag_data FOR
INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "rag_data_user_update" ON public.rag_data FOR
UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "rag_data_user_delete" ON public.rag_data FOR DELETE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "rag_data_admin_all" ON public.rag_data FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- TED_KNOWLEDGE_BASE POLICIES
-- ============================================
-- Ted McGrath's knowledge base - read-only for all users, admin manages
CREATE POLICY "ted_knowledge_base_read_all" ON public.ted_knowledge_base FOR
SELECT TO authenticated,
    anon USING (true);
CREATE POLICY "ted_knowledge_base_service_role_all" ON public.ted_knowledge_base FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- KNOWLEDGE_BASE POLICIES
-- ============================================
-- General knowledge base - read-only for all users, admin manages
CREATE POLICY "knowledge_base_read_all" ON public.knowledge_base FOR
SELECT TO authenticated,
    anon USING (true);
CREATE POLICY "knowledge_base_service_role_all" ON public.knowledge_base FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ============================================
-- GRANTS FOR AUTHENTICATED USERS
-- ============================================
-- Grant authenticated users appropriate access to their tables
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.slide_results TO authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.intake_answers TO authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.saved_sessions TO authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.wizard_progress TO authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.rag_data TO authenticated;
GRANT SELECT ON public.ted_knowledge_base TO authenticated,
    anon;
GRANT SELECT ON public.knowledge_base TO authenticated,
    anon;
-- Service role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
-- ============================================
-- SECURITY HELPER FUNCTIONS
-- ============================================
-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin() RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()::text
            AND is_admin = true
    );
END;
$$;
COMMENT ON FUNCTION public.is_current_user_admin IS 'Returns true if the current authenticated user is an admin';
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
-- Get current user's subscription tier
CREATE OR REPLACE FUNCTION public.get_current_user_tier() RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE user_tier TEXT;
BEGIN
SELECT subscription_tier INTO user_tier
FROM public.user_profiles
WHERE id = auth.uid()::text;
RETURN COALESCE(user_tier, 'basic');
END;
$$;
COMMENT ON FUNCTION public.get_current_user_tier IS 'Returns the subscription tier of the current authenticated user';
GRANT EXECUTE ON FUNCTION public.get_current_user_tier() TO authenticated;
-- Verify user can access specific session
CREATE OR REPLACE FUNCTION public.can_access_session(session_uuid UUID) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.saved_sessions
        WHERE id = session_uuid
            AND (
                user_id = auth.uid()::text
                OR EXISTS (
                    SELECT 1
                    FROM public.user_profiles
                    WHERE id = auth.uid()::text
                        AND is_admin = true
                )
            )
    );
END;
$$;
COMMENT ON FUNCTION public.can_access_session IS 'Checks if current user can access a specific session';
GRANT EXECUTE ON FUNCTION public.can_access_session(UUID) TO authenticated;
-- ============================================
-- INDEXES FOR PERFORMANCE (RLS QUERIES)
-- ============================================
-- Indexes to speed up RLS policy checks
CREATE INDEX IF NOT EXISTS idx_slide_results_user_id ON public.slide_results(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_answers_user_id ON public.intake_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_id ON public.saved_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_progress_user_id ON public.wizard_progress(user_id);
-- Partial index for soft delete filter
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_not_deleted ON public.saved_sessions(user_id)
WHERE (
        is_deleted IS NULL
        OR is_deleted = false
    );
-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_slide_results_user_slide ON public.slide_results(user_id, slide_id);
CREATE INDEX IF NOT EXISTS idx_intake_answers_user_slide ON public.intake_answers(user_id, slide_id);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_created ON public.saved_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_data_user_id ON public.rag_data(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_data_user_type ON public.rag_data(user_id, content_type);
-- ============================================
-- VERIFICATION QUERIES (Run manually to test)
-- ============================================
/*
 -- Check RLS is enabled on all tables
 SELECT schemaname, tablename, rowsecurity
 FROM pg_tables
 WHERE schemaname = 'public'
 AND tablename IN ('slide_results', 'intake_answers', 'saved_sessions', 'wizard_progress', 'rag_data', 'ted_knowledge_base', 'knowledge_base', 'transcript_metadata')
 ORDER BY tablename;
 
 -- List all RLS policies
 SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
 FROM pg_policies
 WHERE schemaname = 'public'
 ORDER BY tablename, policyname;
 
 -- Test helper functions
 SELECT public.is_current_user_admin();
 SELECT public.get_current_user_tier();
 SELECT public.can_access_session('some-uuid-here');
 */
-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration adds:
-- 1. User-specific RLS on: slide_results, intake_answers, saved_sessions, wizard_progress, rag_data
-- 2. Read-only RLS on: ted_knowledge_base, knowledge_base
-- 3. Admin bypass for all policies
-- 4. Service role full access
-- 5. Helper functions for security checks
-- 6. Performance indexes for RLS queries
-- 7. Complete data isolation between users
-- ============================================