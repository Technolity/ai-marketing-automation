-- ============================================
-- TED OS: DISABLE AUTH & CREATE TEST USERS
-- ============================================
-- Run this in Supabase SQL Editor
-- This will:
--   1. Disable RLS on all tables (no auth required)
--   2. Remove FK constraint temporarily
--   3. Create test users directly in the database
-- ============================================
-- ============================================
-- STEP 1: DISABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================
-- This makes all data publicly accessible (DEV MODE ONLY!)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slide_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base DISABLE ROW LEVEL SECURITY;
-- ============================================
-- STEP 2: GRANT PUBLIC ACCESS TO ALL TABLES
-- ============================================
-- Allow anonymous and authenticated users full access
GRANT ALL ON public.user_profiles TO anon,
    authenticated;
GRANT ALL ON public.saved_sessions TO anon,
    authenticated;
GRANT ALL ON public.intake_answers TO anon,
    authenticated;
GRANT ALL ON public.slide_results TO anon,
    authenticated;
GRANT ALL ON public.generated_content TO anon,
    authenticated;
GRANT ALL ON public.knowledge_base TO anon,
    authenticated;
-- ============================================
-- STEP 3: DROP FOREIGN KEY CONSTRAINTS (DEV MODE)
-- ============================================
-- This allows us to create test users without auth.users entries
-- Drop FK from user_profiles to auth.users
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
-- Drop FK from saved_sessions to auth.users
ALTER TABLE public.saved_sessions DROP CONSTRAINT IF EXISTS saved_sessions_user_id_fkey;
-- Drop FK from intake_answers to auth.users
ALTER TABLE public.intake_answers DROP CONSTRAINT IF EXISTS intake_answers_user_id_fkey;
-- Drop FK from slide_results to auth.users
ALTER TABLE public.slide_results DROP CONSTRAINT IF EXISTS slide_results_user_id_fkey;
-- Drop FK from generated_content to auth.users (both columns)
ALTER TABLE public.generated_content DROP CONSTRAINT IF EXISTS generated_content_user_id_fkey;
ALTER TABLE public.generated_content DROP CONSTRAINT IF EXISTS generated_content_reviewed_by_fkey;
-- Drop FK from knowledge_base to auth.users
ALTER TABLE public.knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_created_by_fkey;
-- ============================================
-- STEP 4: CREATE TEST USERS IN USER_PROFILES
-- ============================================
-- Now we can insert without FK constraint
-- Test User 1: Regular User
INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        is_admin,
        subscription_tier,
        created_at,
        updated_at
    )
VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'testuser@example.com',
        'Test User',
        false,
        'basic',
        now(),
        now()
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();
-- Test User 2: Premium User
INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        is_admin,
        subscription_tier,
        created_at,
        updated_at
    )
VALUES (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'premium@example.com',
        'Premium User',
        false,
        'premium',
        now(),
        now()
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    subscription_tier = EXCLUDED.subscription_tier,
    updated_at = now();
-- Test User 3: Admin User
INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        is_admin,
        subscription_tier,
        created_at,
        updated_at
    )
VALUES (
        '33333333-3333-3333-3333-333333333333'::uuid,
        'admin@example.com',
        'Admin User',
        true,
        'enterprise',
        now(),
        now()
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_admin = true,
    subscription_tier = 'enterprise',
    updated_at = now();
-- Also make your existing user an admin (if exists)
UPDATE public.user_profiles
SET is_admin = true,
    subscription_tier = 'enterprise'
WHERE email = 'waris@scalezmedia.com';
-- ============================================
-- STEP 5: CREATE SAMPLE SESSION FOR TEST USER
-- ============================================
INSERT INTO public.saved_sessions (
        id,
        user_id,
        session_name,
        business_name,
        current_step,
        completed_steps,
        answers,
        generated_content,
        is_complete,
        status,
        created_at,
        updated_at
    )
VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Test Business Session',
        'Test Corp',
        1,
        '{}',
        '{}',
        '{}',
        false,
        'active',
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
-- ============================================
-- VERIFICATION: Check what was created
-- ============================================
SELECT '✅ RLS DISABLED - DEV MODE ACTIVE' as status;
SELECT '--- TEST USERS CREATED ---' as info;
SELECT id,
    email,
    full_name,
    is_admin,
    subscription_tier
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 5;
-- ============================================
-- TEST USER IDs FOR YOUR CODE:
-- ============================================
-- Regular User: 11111111-1111-1111-1111-111111111111
-- Premium User: 22222222-2222-2222-2222-222222222222
-- Admin User:   33333333-3333-3333-3333-333333333333
-- ============================================
-- ⚠️ WARNING: TO RE-ENABLE FOR PRODUCTION, run:
-- database/migrations/007_fresh_complete_schema.sql