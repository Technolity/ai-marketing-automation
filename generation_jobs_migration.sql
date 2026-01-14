-- ============================================
-- MIGRATION: Add generation_jobs table
-- Run this in Supabase SQL Editor
-- ============================================
-- Create the generation_jobs table for background job tracking
CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funnel_id UUID REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    sections_to_generate TEXT [] DEFAULT ARRAY []::TEXT [],
    status TEXT DEFAULT 'queued' CHECK (
        status IN ('queued', 'processing', 'completed', 'failed')
    ),
    progress_percentage INTEGER DEFAULT 0,
    current_section TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_generation_jobs_funnel ON public.generation_jobs(funnel_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created ON public.generation_jobs(created_at DESC);
-- Enable RLS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
-- RLS Policies
DROP POLICY IF EXISTS "Users can view own generation jobs" ON public.generation_jobs;
CREATE POLICY "Users can view own generation jobs" ON public.generation_jobs FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
DROP POLICY IF EXISTS "Users can insert own generation jobs" ON public.generation_jobs;
CREATE POLICY "Users can insert own generation jobs" ON public.generation_jobs FOR
INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
DROP POLICY IF EXISTS "Users can update own generation jobs" ON public.generation_jobs;
CREATE POLICY "Users can update own generation jobs" ON public.generation_jobs FOR
UPDATE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
-- Service role bypass
DROP POLICY IF EXISTS "Service role bypass generation_jobs" ON public.generation_jobs;
CREATE POLICY "Service role bypass generation_jobs" ON public.generation_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_generation_jobs_updated_at ON public.generation_jobs;
CREATE TRIGGER trigger_generation_jobs_updated_at BEFORE
UPDATE ON public.generation_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Verify
SELECT 'generation_jobs table created successfully' as status;