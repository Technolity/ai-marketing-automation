-- =====================================================
-- ADMIN GOD MODE: Row Level Security Policies
-- Run this in Supabase SQL Editor to grant admins full access
-- =====================================================
-- This will allow admins to view and manage ALL user data across the platform
-- =====================================================
-- USER_PROFILES - Admin Access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all user_profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all user_profiles" ON public.user_profiles FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can update all user_profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all user_profiles" ON public.user_profiles FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can delete user_profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete user_profiles" ON public.user_profiles FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()::text
            AND is_admin = true
    )
);
-- =====================================================
-- USER_FUNNELS - Admin Access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all user_funnels" ON public.user_funnels;
CREATE POLICY "Admins can view all user_funnels" ON public.user_funnels FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can update all user_funnels" ON public.user_funnels;
CREATE POLICY "Admins can update all user_funnels" ON public.user_funnels FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can delete any user_funnels" ON public.user_funnels;
CREATE POLICY "Admins can delete any user_funnels" ON public.user_funnels FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()::text
            AND is_admin = true
    )
);
-- =====================================================
-- VAULT_CONTENT - Admin Access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all vault_content" ON public.vault_content;
CREATE POLICY "Admins can view all vault_content" ON public.vault_content FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can update vault_content" ON public.vault_content;
CREATE POLICY "Admins can update vault_content" ON public.vault_content FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can delete vault_content" ON public.vault_content;
CREATE POLICY "Admins can delete vault_content" ON public.vault_content FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()::text
            AND is_admin = true
    )
);
-- =====================================================
-- GHL_CREDENTIALS - Admin Access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all ghl_credentials" ON public.ghl_credentials;
CREATE POLICY "Admins can view all ghl_credentials" ON public.ghl_credentials FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can update ghl_credentials" ON public.ghl_credentials;
CREATE POLICY "Admins can update ghl_credentials" ON public.ghl_credentials FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
-- =====================================================
-- INTAKE_ANSWERS - Admin Access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all intake_answers" ON public.intake_answers;
CREATE POLICY "Admins can view all intake_answers" ON public.intake_answers FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
-- =====================================================
-- SLIDE_RESULTS - Admin Access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all slide_results" ON public.slide_results;
CREATE POLICY "Admins can view all slide_results" ON public.slide_results FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
DROP POLICY IF EXISTS "Admins can update slide_results" ON public.slide_results;
CREATE POLICY "Admins can update slide_results" ON public.slide_results FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
-- =====================================================
-- SAVED_SESSIONS - Admin Access
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all saved_sessions" ON public.saved_sessions;
CREATE POLICY "Admins can view all saved_sessions" ON public.saved_sessions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles
            WHERE id = auth.uid()::text
                AND is_admin = true
        )
    );
-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running, verify with:
-- SELECT tablename, policyname FROM pg_policies WHERE policyname LIKE '%Admin%' ORDER BY tablename;