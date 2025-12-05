-- AI Marketing Automation Schema
-- Run this in Supabase SQL Editor
-- =====================================================
-- 1. USER ONBOARDING ANSWERS (12 Questions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.intake_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slide_id integer NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intake_answers_user_slide ON public.intake_answers (user_id, slide_id);
-- =====================================================
-- 2. AI GENERATED CONTENT RESULTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.slide_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slide_id integer NOT NULL,
  content_type text,
  ai_output jsonb NOT NULL,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_slide_results_user_slide ON public.slide_results (user_id, slide_id);
-- =====================================================
-- 3. SAVED SESSIONS (For Manage Data functionality)
-- Note: onboarding_data is now NULLABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.saved_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name text NOT NULL,
  onboarding_data jsonb DEFAULT '{}',
  -- NULLABLE with default empty object
  generated_content jsonb,
  results_data jsonb,
  completed_steps integer [] DEFAULT '{}',
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user ON public.saved_sessions (user_id);
-- =====================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE public.intake_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slide_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist (for clean re-run)
DROP POLICY IF EXISTS "Users can view own intake_answers" ON public.intake_answers;
DROP POLICY IF EXISTS "Users can insert own intake_answers" ON public.intake_answers;
DROP POLICY IF EXISTS "Users can update own intake_answers" ON public.intake_answers;
DROP POLICY IF EXISTS "Users can delete own intake_answers" ON public.intake_answers;
DROP POLICY IF EXISTS "Users can view own slide_results" ON public.slide_results;
DROP POLICY IF EXISTS "Users can insert own slide_results" ON public.slide_results;
DROP POLICY IF EXISTS "Users can update own slide_results" ON public.slide_results;
DROP POLICY IF EXISTS "Users can delete own slide_results" ON public.slide_results;
DROP POLICY IF EXISTS "Users can view own saved_sessions" ON public.saved_sessions;
DROP POLICY IF EXISTS "Users can insert own saved_sessions" ON public.saved_sessions;
DROP POLICY IF EXISTS "Users can update own saved_sessions" ON public.saved_sessions;
DROP POLICY IF EXISTS "Users can delete own saved_sessions" ON public.saved_sessions;
-- intake_answers policies
CREATE POLICY "Users can view own intake_answers" ON public.intake_answers FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own intake_answers" ON public.intake_answers FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own intake_answers" ON public.intake_answers FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own intake_answers" ON public.intake_answers FOR DELETE USING (auth.uid() = user_id);
-- slide_results policies
CREATE POLICY "Users can view own slide_results" ON public.slide_results FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own slide_results" ON public.slide_results FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slide_results" ON public.slide_results FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own slide_results" ON public.slide_results FOR DELETE USING (auth.uid() = user_id);
-- saved_sessions policies
CREATE POLICY "Users can view own saved_sessions" ON public.saved_sessions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved_sessions" ON public.saved_sessions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved_sessions" ON public.saved_sessions FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved_sessions" ON public.saved_sessions FOR DELETE USING (auth.uid() = user_id);
-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.intake_answers TO authenticated;
GRANT ALL ON public.slide_results TO authenticated;
GRANT ALL ON public.saved_sessions TO authenticated;
-- If tables already exist and you need to make onboarding_data nullable:
-- ALTER TABLE public.saved_sessions ALTER COLUMN onboarding_data DROP NOT NULL;
-- ALTER TABLE public.saved_sessions ALTER COLUMN onboarding_data SET DEFAULT '{}';