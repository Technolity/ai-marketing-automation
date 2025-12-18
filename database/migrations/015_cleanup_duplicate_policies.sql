-- ============================================
-- POLICY CLEANUP & SECURITY FIX
-- ============================================
-- Migration: 015_cleanup_duplicate_policies.sql
-- Created: 2025-12-13
--
-- This migration:
-- 1. FIXES critical rag_data security hole
-- 2. Removes duplicate policies
-- 3. Removes old policies using {public} role
-- 4. Ensures consistent security across all tables
-- ============================================

-- ============================================
-- CRITICAL FIX: Remove overly permissive rag_data policy
-- ============================================

-- This policy allows ANYONE to read ALL rag_data - DANGEROUS!
DROP POLICY IF EXISTS "rag_data_read_own" ON public.rag_data;

-- ============================================
-- Remove OLD policies (using {public} role)
-- ============================================

-- saved_sessions old policies
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.saved_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.saved_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.saved_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.saved_sessions;

-- slide_results old policies
DROP POLICY IF EXISTS "Users can delete own results" ON public.slide_results;
DROP POLICY IF EXISTS "Users can insert own results" ON public.slide_results;
DROP POLICY IF EXISTS "Users can update own results" ON public.slide_results;
DROP POLICY IF EXISTS "Users can view own results" ON public.slide_results;

-- user_profiles old policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- ============================================
-- Remove DUPLICATE policies
-- ============================================

-- knowledge_base duplicates
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.knowledge_base;
DROP POLICY IF EXISTS "Everyone can read published articles" ON public.knowledge_base;

-- Remove old service_role_full_access policies (will use newer named ones)
-- We keep the table-specific policies like "slide_results_admin_all"

-- ============================================
-- Verify user_profiles has proper policies
-- ============================================

-- Drop if exists, then recreate with correct permissions
DROP POLICY IF EXISTS "user_profiles_user_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_insert" ON public.user_profiles;

-- Users can view their own profile
CREATE POLICY "user_profiles_user_select"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()::text
        AND up.is_admin = true
    )
);

-- Users can update their own profile (but not is_admin or subscription_tier)
CREATE POLICY "user_profiles_user_update"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (
    id = auth.uid()::text
    -- Prevent users from modifying their own admin status or tier
    AND is_admin = (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()::text)
    AND subscription_tier = (SELECT subscription_tier FROM public.user_profiles WHERE id = auth.uid()::text)
);

-- Users can insert their own profile (for first-time sync)
CREATE POLICY "user_profiles_user_insert"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid()::text);

-- ============================================
-- Add admin_settings policies if missing
-- ============================================

-- Admin settings should only be accessible by service role
DROP POLICY IF EXISTS "admin_settings_read_admin" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_write_admin" ON public.admin_settings;

-- Only service role can access admin_settings
-- (This table stores system configuration, not user data)

-- ============================================
-- Verify generated_content table exists and has policies
-- ============================================

-- Check if generated_content table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'generated_content'
    ) THEN
        -- Enable RLS
        ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "generated_content_user_select" ON public.generated_content;
        DROP POLICY IF EXISTS "generated_content_user_insert" ON public.generated_content;
        DROP POLICY IF EXISTS "generated_content_user_update" ON public.generated_content;
        DROP POLICY IF EXISTS "generated_content_user_delete" ON public.generated_content;
        DROP POLICY IF EXISTS "generated_content_admin_all" ON public.generated_content;

        -- Create policies
        EXECUTE 'CREATE POLICY "generated_content_user_select" ON public.generated_content FOR SELECT TO authenticated USING (
            user_id = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid()::text
                AND is_admin = true
            )
        )';

        EXECUTE 'CREATE POLICY "generated_content_user_insert" ON public.generated_content FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text)';

        EXECUTE 'CREATE POLICY "generated_content_user_update" ON public.generated_content FOR UPDATE TO authenticated USING (
            user_id = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid()::text
                AND is_admin = true
            )
        ) WITH CHECK (
            user_id = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid()::text
                AND is_admin = true
            )
        )';

        EXECUTE 'CREATE POLICY "generated_content_user_delete" ON public.generated_content FOR DELETE TO authenticated USING (
            user_id = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid()::text
                AND is_admin = true
            )
        )';

        EXECUTE 'CREATE POLICY "generated_content_admin_all" ON public.generated_content FOR ALL TO service_role USING (true) WITH CHECK (true)';

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_content TO authenticated;

        RAISE NOTICE 'generated_content table policies created successfully';
    ELSE
        RAISE NOTICE 'generated_content table does not exist - skipping';
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check for remaining duplicate or problematic policies
/*
-- Check for policies using {public} role (should be none)
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
AND 'public' = ANY(roles)
ORDER BY tablename;

-- Check rag_data policies (should NOT have "rag_data_read_own")
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'rag_data'
ORDER BY policyname;

-- Check for duplicate policies on same table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- Verify all user tables have proper RLS
SELECT
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'user_profiles', 'slide_results', 'intake_answers',
    'saved_sessions', 'wizard_progress', 'rag_data',
    'generated_content', 'ted_knowledge_base', 'transcript_metadata'
)
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
*/

-- ============================================
-- FINAL SECURITY CHECK
-- ============================================

-- Test that policies are working correctly:
/*
-- As a test, try to query rag_data as different user
-- This should return only your own data, not all data

SET ROLE authenticated;
SET "request.jwt.claims" TO '{"sub": "test-user-123"}';

-- This should only return data for user "test-user-123"
SELECT * FROM rag_data LIMIT 5;

-- This should fail or return empty
SELECT * FROM rag_data WHERE user_id = 'different-user-456';

-- Reset role
RESET ROLE;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'Policy cleanup completed successfully!' as status;

-- Summary of changes:
SELECT
    'Removed overly permissive rag_data policy' as fix_1,
    'Removed duplicate policies' as fix_2,
    'Removed policies using {public} role' as fix_3,
    'Added proper user_profiles policies' as fix_4,
    'Verified generated_content policies' as fix_5;
