-- Migration: 030_add_ghl_setup_flag.sql
-- Purpose: Add a flag to track if GHL account setup has been triggered via Pabbly
-- This prevents duplicate sub-account creation if the user updates their profile multiple times.
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ghl_setup_triggered_at TIMESTAMPTZ DEFAULT NULL;
COMMENT ON COLUMN public.user_profiles.ghl_setup_triggered_at IS 'Timestamp when Pabbly GHL setup automation was triggered';