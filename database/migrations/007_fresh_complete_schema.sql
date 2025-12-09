-- ============================================
-- TED OS COMPLETE DATABASE SCHEMA
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This will DROP and recreate ALL tables fresh
-- ============================================
-- ============================================
-- STEP 1: DROP EVERYTHING (Clean Slate)
-- ============================================
-- Drop all policies first (they reference tables)
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
-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
-- Drop all tables (in order due to foreign keys)
DROP TABLE IF EXISTS public.generated_content CASCADE;
DROP TABLE IF EXISTS public.slide_results CASCADE;
DROP TABLE IF EXISTS public.intake_answers CASCADE;
DROP TABLE IF EXISTS public.saved_sessions CASCADE;
DROP TABLE IF EXISTS public.knowledge_base CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================
-- 2.1 USER_PROFILES TABLE
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
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
-- 2.2 SAVED_SESSIONS TABLE (User's saved business sessions)
CREATE TABLE public.saved_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name text NOT NULL,
    business_name text,
    current_step integer DEFAULT 1,
    completed_steps integer [] DEFAULT '{}',
    answers jsonb DEFAULT '{}',
    generated_content jsonb DEFAULT '{}',
    results_data jsonb DEFAULT '{}',
    onboarding_data jsonb DEFAULT '{}',
    is_complete boolean DEFAULT false,
    status text DEFAULT 'active' CHECK (
        status IN ('active', 'in_progress', 'completed', 'deleted')
    ),
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 2.3 INTAKE_ANSWERS TABLE (Step-by-step answers)
CREATE TABLE public.intake_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slide_id integer NOT NULL,
    answers jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 2.4 SLIDE_RESULTS TABLE (AI Generated Content per slide)
CREATE TABLE public.slide_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slide_id integer NOT NULL,
    ai_output jsonb NOT NULL DEFAULT '{}',
    approved boolean DEFAULT false,
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 2.5 GENERATED_CONTENT TABLE (For admin content review)
CREATE TABLE public.generated_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.saved_sessions(id) ON DELETE
    SET NULL,
        content_type text NOT NULL,
        content_data jsonb NOT NULL DEFAULT '{}',
        status text DEFAULT 'pending' CHECK (
            status IN ('pending', 'approved', 'rejected', 'edited')
        ),
        admin_notes text,
        reviewed_by uuid REFERENCES auth.users(id),
        reviewed_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
);
-- 2.6 KNOWLEDGE_BASE TABLE (Admin managed RAG content)
CREATE TABLE public.knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    industry text,
    content_type text DEFAULT 'article',
    tags text [] DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_id ON public.saved_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_is_deleted ON public.saved_sessions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_slide_results_user_id ON public.slide_results(user_id);
CREATE INDEX IF NOT EXISTS idx_slide_results_approved ON public.slide_results(approved);
CREATE INDEX IF NOT EXISTS idx_intake_answers_user_id ON public.intake_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON public.generated_content(status);
-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slide_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
-- ============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================
-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url'
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================
-- USER_PROFILES policies
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.user_profiles FOR
SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.user_profiles FOR
UPDATE USING (public.is_admin());
-- SAVED_SESSIONS policies
CREATE POLICY "Users can manage own sessions" ON public.saved_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all sessions" ON public.saved_sessions FOR
SELECT USING (public.is_admin());
-- INTAKE_ANSWERS policies
CREATE POLICY "Users can manage own intake answers" ON public.intake_answers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all intake answers" ON public.intake_answers FOR
SELECT USING (public.is_admin());
-- SLIDE_RESULTS policies
CREATE POLICY "Users can manage own slide results" ON public.slide_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all slide results" ON public.slide_results FOR ALL USING (public.is_admin());
-- GENERATED_CONTENT policies
CREATE POLICY "Users can read own generated content" ON public.generated_content FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all generated content" ON public.generated_content FOR ALL USING (public.is_admin());
-- KNOWLEDGE_BASE policies
CREATE POLICY "Anyone can read active knowledge base" ON public.knowledge_base FOR
SELECT USING (is_active = true);
CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base FOR ALL USING (public.is_admin());
-- ============================================
-- STEP 7: GRANT SERVICE ROLE FULL ACCESS
-- ============================================
-- This allows the service role (used by API) to bypass RLS
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.saved_sessions TO service_role;
GRANT ALL ON public.intake_answers TO service_role;
GRANT ALL ON public.slide_results TO service_role;
GRANT ALL ON public.generated_content TO service_role;
GRANT ALL ON public.knowledge_base TO service_role;
-- ============================================
-- STEP 8: CREATE YOUR ADMIN USER
-- ============================================
-- After running this script, run the following query
-- replacing 'your-email@example.com' with YOUR email:
-- UPDATE public.user_profiles 
-- SET is_admin = true, subscription_tier = 'enterprise'
-- WHERE email = 'your-email@example.com';
-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'SUCCESS: TED OS Database Schema Created!' as status;
-- List all tables created
SELECT table_name,
    (
        SELECT count(*)
        FROM information_schema.columns
        WHERE table_name = t.table_name
    ) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;