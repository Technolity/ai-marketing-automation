-- Fix missing generation_count column in user_profiles
-- Run this in your Supabase SQL Editor
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS generation_count INTEGER DEFAULT 0;
-- Optional: ensure it's not null and has default
UPDATE public.user_profiles
SET generation_count = 0
WHERE generation_count IS NULL;
-- Verify it exists
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
    AND column_name = 'generation_count';