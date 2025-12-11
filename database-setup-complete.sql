-- =====================================================
-- TED OS - Complete Database Schema (Updated)
-- =====================================================
-- This script creates all necessary tables reflecting the current project state.
-- Run this in your Supabase SQL Editor.
-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Stores user tier, admin status, and usage limits.
-- Matches usage in app/api/user/tier/route.js
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,
    -- Matches Clerk User ID
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    -- Role & Privileges
    is_admin BOOLEAN DEFAULT false,
    -- Subscription / Tier
    subscription_tier TEXT DEFAULT 'basic',
    -- basic, premium, enterprise
    tier_expires_at TIMESTAMP WITH TIME ZONE,
    -- Usage Tracking
    generation_count INTEGER DEFAULT 0,
    last_generation_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_updated_at_user_profiles ON public.user_profiles;
CREATE TRIGGER set_updated_at_user_profiles BEFORE
UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- =====================================================
-- 2. SAVED SESSIONS TABLE
-- =====================================================
-- Stores 20-step questionnaire progress and generated content.
-- Matches usage in app/api/os/sessions/route.js
CREATE TABLE IF NOT EXISTS public.saved_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    -- References Clerk User ID
    session_name TEXT NOT NULL,
    -- Progress Tracking
    completed_steps INTEGER [] DEFAULT ARRAY []::INTEGER [],
    -- Array of completed step IDs (1-20)
    current_step INTEGER DEFAULT 1,
    is_complete BOOLEAN DEFAULT false,
    view_mode TEXT DEFAULT 'dashboard',
    -- 'dashboard' or 'step'
    -- Data Storage (JSONB for flexibility with 20 steps)
    -- answers JSONB structure:
    -- {
    --   "industry": "...", "idealClient": "...", "message": "...", "coreProblem": "...",
    --   "outcomes": "...", "uniqueAdvantage": "...", "story": "...", "testimonials": "...",
    --   "offerProgram": "...", "deliverables": "...", "pricing": "...", "assets": [...],
    --   "revenue": "...", "brandVoice": "...", "brandColors": "...", "callToAction": "...",
    --   "platforms": [...], "goal90Days": "...", "businessStage": "...", "helpNeeded": "..."
    -- }
    answers JSONB DEFAULT '{}'::jsonb,
    -- Generated Content
    generated_content JSONB DEFAULT '{}'::jsonb,
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    -- Soft delete support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_id ON public.saved_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_is_deleted ON public.saved_sessions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_updated_at ON public.saved_sessions(updated_at DESC);
-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_saved_sessions ON public.saved_sessions;
CREATE TRIGGER set_updated_at_saved_sessions BEFORE
UPDATE ON public.saved_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- =====================================================
-- 3. SLIDE RESULTS TABLE
-- =====================================================
-- Stores approved final outcomes/results.
-- Matches usage in app/results/page.jsx (slide_id 99 for full results)
CREATE TABLE IF NOT EXISTS public.slide_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    slide_id INTEGER NOT NULL,
    -- 99 for full wizard results, or specific step IDs
    -- AI Generated Output
    ai_output JSONB DEFAULT '{}'::jsonb,
    -- Status
    approved BOOLEAN DEFAULT false,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Constraint: One result per slide per user (upsert logic often used)
    CONSTRAINT unique_user_slide UNIQUE (user_id, slide_id)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_slide_results_user_id ON public.slide_results(user_id);
CREATE INDEX IF NOT EXISTS idx_slide_results_approved ON public.slide_results(approved);
-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_slide_results ON public.slide_results;
CREATE TRIGGER set_updated_at_slide_results BEFORE
UPDATE ON public.slide_results FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- =====================================================
-- 4. KNOWLEDGE BASE (Optional/Admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT [] DEFAULT ARRAY []::TEXT [],
    is_published BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slide_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
-- USER PROFILES POLICIES
-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR
SELECT USING (auth.uid()::text = id);
-- Service role can do anything (handled by Supabase service key), but for client update:
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR
UPDATE USING (auth.uid()::text = id);
-- SAVED SESSIONS POLICIES
-- Users can only see/edit their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.saved_sessions;
CREATE POLICY "Users can view own sessions" ON public.saved_sessions FOR
SELECT USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.saved_sessions;
CREATE POLICY "Users can insert own sessions" ON public.saved_sessions FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can update own sessions" ON public.saved_sessions;
CREATE POLICY "Users can update own sessions" ON public.saved_sessions FOR
UPDATE USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.saved_sessions;
CREATE POLICY "Users can delete own sessions" ON public.saved_sessions FOR DELETE USING (auth.uid()::text = user_id);
-- SLIDE RESULTS POLICIES
DROP POLICY IF EXISTS "Users can view own results" ON public.slide_results;
CREATE POLICY "Users can view own results" ON public.slide_results FOR
SELECT USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can insert own results" ON public.slide_results;
CREATE POLICY "Users can insert own results" ON public.slide_results FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can update own results" ON public.slide_results;
CREATE POLICY "Users can update own results" ON public.slide_results FOR
UPDATE USING (auth.uid()::text = user_id);
-- KNOWLEDGE BASE POLICIES
-- Everyone can read published
DROP POLICY IF EXISTS "Everyone can read published articles" ON public.knowledge_base;
CREATE POLICY "Everyone can read published articles" ON public.knowledge_base FOR
SELECT USING (is_published = true);
-- Only admins can write (handled via app logic usually, or check is_admin in profile)
-- For simplicity, restricting writes to service role (backend API) or admin users via policy
-- Assuming 'is_admin' check would require a join or claim, skipping for basic setup.
-- =====================================================
-- 6. FIELD REFERENCE (Documentation)
-- =====================================================
/*
 The 'answers' JSONB column in saved_sessions stores the following 20 steps:
 
 1. industry (text)
 2. idealClient (text)
 3. message (text)
 4. coreProblem (text)
 5. outcomes (text)
 6. uniqueAdvantage (text)
 7. story (text)
 8. testimonials (text)
 9. offerProgram (text)
 10. deliverables (text)
 11. pricing (text)
 12. assets (array)
 13. revenue (string)
 14. brandVoice (text)
 15. brandColors (text)
 16. callToAction (text)
 17. platforms (array)
 18. goal90Days (text)
 19. businessStage (string)
 20. helpNeeded (text)
 */