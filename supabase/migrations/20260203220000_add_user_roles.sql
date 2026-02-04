-- ============================================
-- MIGRATION: Add User Roles for Team Access
-- ============================================
-- Adds role column to distinguish Owners from Team Members
-- Team Members can only access their linked Owner's workspace
-- ============================================
-- Add role column with constraint
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'team_member'));
-- Add column to track which owner a team member belongs to
-- This denormalizes organization_seats for faster lookups
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role_owner_id TEXT REFERENCES public.user_profiles(id) ON DELETE
SET NULL;
-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_owner ON public.user_profiles(role_owner_id);
-- Update existing users: ensure they are 'owner' by default
UPDATE public.user_profiles
SET role = 'owner'
WHERE role IS NULL;
COMMENT ON COLUMN public.user_profiles.role IS 'User role: owner (has own workspace) or team_member (can only access linked owner workspace)';
COMMENT ON COLUMN public.user_profiles.role_owner_id IS 'For team_member role: the owner user_id whose workspace they can access';