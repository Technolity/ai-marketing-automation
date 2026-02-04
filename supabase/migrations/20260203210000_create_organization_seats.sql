-- ============================================
-- MIGRATION: Create Organization Seats Table
-- ============================================
-- For team/user seat management functionality
-- Allows Growth tier users to invite team members
-- ============================================
CREATE TABLE IF NOT EXISTS public.organization_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    seat_user_id TEXT REFERENCES public.user_profiles(id) ON DELETE
    SET NULL,
        seat_email TEXT NOT NULL,
        invite_token TEXT UNIQUE,
        role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
        permissions JSONB DEFAULT '{"can_edit": true, "can_approve": false}'::jsonb,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        accepted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_organization_seats_owner ON public.organization_seats(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_organization_seats_member ON public.organization_seats(seat_user_id)
WHERE seat_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organization_seats_email ON public.organization_seats(seat_email);
CREATE INDEX IF NOT EXISTS idx_organization_seats_token ON public.organization_seats(invite_token)
WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organization_seats_status ON public.organization_seats(status);
-- Enable RLS
ALTER TABLE public.organization_seats ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Owners can manage their seats
CREATE POLICY "Owners can manage their seats" ON public.organization_seats FOR ALL USING (
    auth.uid()::text = owner_user_id
    OR public.is_admin()
);
-- Members can view their own seat
CREATE POLICY "Members can view their seat" ON public.organization_seats FOR
SELECT USING (auth.uid()::text = seat_user_id);
-- Updated_at trigger
CREATE TRIGGER set_updated_at_organization_seats BEFORE
UPDATE ON public.organization_seats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Add max_seats and current_seat_count to user_profiles if not exists
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS current_seat_count INTEGER DEFAULT 0;
-- Set max_seats based on subscription tier
-- starter: 1 seat, growth: 3 seats, scale: 5 seats
UPDATE public.user_profiles
SET max_seats = CASE
        WHEN is_admin = true THEN 9999
        WHEN subscription_tier = 'starter' THEN 1
        WHEN subscription_tier = 'growth' THEN 3
        WHEN subscription_tier = 'scale' THEN 5
        ELSE 1
    END
WHERE max_seats IS NULL
    OR max_seats = 1;
-- Grant permissions
GRANT ALL ON public.organization_seats TO authenticated;
GRANT ALL ON public.organization_seats TO service_role;