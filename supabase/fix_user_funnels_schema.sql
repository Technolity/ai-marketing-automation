-- Fix missing columns in user_funnels for Phase 1 completion
-- Run this in your Supabase SQL Editor
-- 1. Add selected_funnel_type column
ALTER TABLE public.user_funnels
ADD COLUMN IF NOT EXISTS selected_funnel_type TEXT;
-- 2. Add funnel_choice_made_at column
ALTER TABLE public.user_funnels
ADD COLUMN IF NOT EXISTS funnel_choice_made_at TIMESTAMPTZ;
-- 3. Verify columns exist
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'user_funnels'
    AND column_name IN ('selected_funnel_type', 'funnel_choice_made_at');