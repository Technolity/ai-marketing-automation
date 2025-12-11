-- TedOS Complete Database Schema
-- Run this in your Supabase SQL Editor to set up all required tables
-- ====================
-- 1. USER_PROFILES TABLE
-- ====================
-- Check if user_profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS user_profiles (
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
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
-- Create policies
CREATE POLICY "Users can read own profile" ON user_profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Trigger to auto-create profile on user signup
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
-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ====================
-- 2. INTAKE_ANSWERS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS intake_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slide_id integer NOT NULL,
    answers jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE intake_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own intake answers" ON intake_answers;
CREATE POLICY "Users can manage own intake answers" ON intake_answers FOR ALL USING (auth.uid() = user_id);
-- ====================
-- 3. SLIDE_RESULTS TABLE (Stores generated AI content)
-- ====================
CREATE TABLE IF NOT EXISTS slide_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slide_id integer NOT NULL,
    ai_output jsonb NOT NULL DEFAULT '{}',
    approved boolean DEFAULT false,
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE slide_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own slide results" ON slide_results;
CREATE POLICY "Users can manage own slide results" ON slide_results FOR ALL USING (auth.uid() = user_id);
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_slide_results_user_id ON slide_results(user_id);
CREATE INDEX IF NOT EXISTS idx_slide_results_approved ON slide_results(approved);
-- ====================
-- 4. SAVED_SESSIONS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS saved_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name text NOT NULL,
    business_name text,
    answers jsonb DEFAULT '{}',
    completed_steps integer [] DEFAULT '{}',
    current_step integer DEFAULT 1,
    generated_content jsonb DEFAULT '{}',
    results_data jsonb DEFAULT '{}',
    onboarding_data jsonb DEFAULT '{}',
    is_complete boolean DEFAULT false,
    status text DEFAULT 'active',
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE saved_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own saved sessions" ON saved_sessions;
CREATE POLICY "Users can manage own saved sessions" ON saved_sessions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_id ON saved_sessions(user_id);
-- ====================
-- 5. GENERATED_CONTENT TABLE (For content review)
-- ====================
CREATE TABLE IF NOT EXISTS generated_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES saved_sessions(id) ON DELETE
    SET NULL,
        content_type text NOT NULL,
        content_data jsonb NOT NULL DEFAULT '{}',
        status text DEFAULT 'pending' CHECK (
            status IN ('pending', 'approved', 'rejected', 'edited')
        ),
        admin_notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
);
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own generated content" ON generated_content;
CREATE POLICY "Users can read own generated content" ON generated_content FOR
SELECT USING (auth.uid() = user_id);
-- ====================
-- 6. KNOWLEDGE_BASE TABLE (Admin managed)
-- ====================
CREATE TABLE IF NOT EXISTS knowledge_base (
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
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
-- Everyone can read active knowledge base entries
DROP POLICY IF EXISTS "Anyone can read active knowledge base" ON knowledge_base;
CREATE POLICY "Anyone can read active knowledge base" ON knowledge_base FOR
SELECT USING (is_active = true);
-- ====================
-- 7. ADMIN HELPER FUNCTION
-- ====================
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ====================
-- 8. ADMIN POLICIES (Allow admins to access all data)
-- ====================
-- Admin access to user_profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles" ON user_profiles FOR
SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles" ON user_profiles FOR
UPDATE USING (is_admin());
-- Admin access to slide_results
DROP POLICY IF EXISTS "Admins can manage all slide results" ON slide_results;
CREATE POLICY "Admins can manage all slide results" ON slide_results FOR ALL USING (is_admin());
-- Admin access to saved_sessions
DROP POLICY IF EXISTS "Admins can read all saved sessions" ON saved_sessions;
CREATE POLICY "Admins can read all saved sessions" ON saved_sessions FOR
SELECT USING (is_admin());
-- Admin access to generated_content
DROP POLICY IF EXISTS "Admins can manage all generated content" ON generated_content;
CREATE POLICY "Admins can manage all generated content" ON generated_content FOR ALL USING (is_admin());
-- Admin full access to knowledge_base
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON knowledge_base;
CREATE POLICY "Admins can manage knowledge base" ON knowledge_base FOR ALL USING (is_admin());
-- ====================
-- 9. SET YOUR ADMIN USER
-- ====================
-- IMPORTANT: Replace 'your-email@example.com' with your actual admin email
-- Run this query after signing up to make yourself an admin:
-- UPDATE user_profiles 
-- SET is_admin = true, subscription_tier = 'enterprise'
-- WHERE email = 'your-email@example.com';
-- ====================
-- SUCCESS MESSAGE
-- ====================
-- If you see this, all tables were created successfully!
SELECT 'TedOS Database Schema created successfully!' as message;