-- HOTFIX: Fix infinite recursion in user_profiles RLS policies
-- Run this in Supabase SQL Editor
-- First, drop ALL existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
-- Create simple, non-recursive policies
-- Users can read their own profile
CREATE POLICY "Users read own profile" ON user_profiles FOR
SELECT USING (auth.uid() = id);
-- Users can insert their own profile
CREATE POLICY "Users insert own profile" ON user_profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "Users update own profile" ON user_profiles FOR
UPDATE USING (auth.uid() = id);
-- For admin access, we'll use a security definer function instead to avoid recursion
-- Create a function that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
DECLARE admin_status BOOLEAN;
BEGIN
SELECT is_admin INTO admin_status
FROM user_profiles
WHERE id = auth.uid();
RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Now manually insert/update your admin user profile
-- Replace 'your-email@example.com' with your actual admin email
INSERT INTO user_profiles (id, email, is_admin, subscription_tier)
SELECT id,
    email,
    true,
    'enterprise'
FROM auth.users
WHERE email = 'your-email@example.com' ON CONFLICT (id) DO
UPDATE
SET is_admin = true,
    subscription_tier = 'enterprise';