-- ============================================
-- MIGRATION: Update RLS Policies for Shared Access
-- ============================================
-- Updates RLS policies to allow team members (seats)
-- to access owner's data across core tables
-- ============================================
-- Helper function to check if user is a seat member
CREATE OR REPLACE FUNCTION public.is_seat_member_of(p_owner_id TEXT) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.organization_seats
        WHERE owner_user_id = p_owner_id
            AND seat_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
            AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- USER_FUNNELS: Allow seat members to access owner's funnels
-- ============================================
DROP POLICY IF EXISTS "Users can view own funnels" ON public.user_funnels;
CREATE POLICY "Users can view own funnels" ON public.user_funnels FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
        OR public.is_seat_member_of(user_id)
    );
DROP POLICY IF EXISTS "Users can update own funnels" ON public.user_funnels;
CREATE POLICY "Users can update own funnels" ON public.user_funnels FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR public.is_admin()
        OR public.is_seat_member_of(user_id)
    );
-- ============================================
-- VAULT_CONTENT: Allow seat members to access owner's vault
-- ============================================
DROP POLICY IF EXISTS "Users can view own vault content" ON public.vault_content;
CREATE POLICY "Users can view own vault content" ON public.vault_content FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
        OR public.is_seat_member_of(user_id)
    );
DROP POLICY IF EXISTS "Users can update own vault content" ON public.vault_content;
CREATE POLICY "Users can update own vault content" ON public.vault_content FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR public.is_admin()
        OR public.is_seat_member_of(user_id)
    );
-- ============================================
-- GHL_SUBACCOUNTS: Allow seat members to view builder location
-- ============================================
DROP POLICY IF EXISTS "Users can view own subaccounts" ON public.ghl_subaccounts;
CREATE POLICY "Users can view own subaccounts" ON public.ghl_subaccounts FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
        OR public.is_seat_member_of(user_id)
    );
-- ============================================
-- GENERATED_IMAGES: Allow seat members to access owner's images
-- ============================================
DROP POLICY IF EXISTS "Users can view own images" ON public.generated_images;
CREATE POLICY "Users can view own images" ON public.generated_images FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
        OR public.is_seat_member_of(user_id)
    );
DROP POLICY IF EXISTS "Users can update own images" ON public.generated_images;
CREATE POLICY "Users can update own images" ON public.generated_images FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR public.is_admin()
        OR public.is_seat_member_of(user_id)
    );