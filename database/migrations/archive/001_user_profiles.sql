-- Migration: 001_user_profiles.sql
-- Creates user profiles with role and subscription tier
-- User profiles with role and subscription tier
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    subscription_tier TEXT DEFAULT 'basic' CHECK (
        subscription_tier IN ('basic', 'premium', 'enterprise')
    ),
    tier_expires_at TIMESTAMP WITH TIME ZONE,
    generation_count INTEGER DEFAULT 0,
    last_generation_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(subscription_tier);
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.user_profiles (id, email, full_name)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE
UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
-- Users can read own profile
CREATE POLICY "Users read own profile" ON user_profiles FOR
SELECT USING (auth.uid() = id);
-- Users can update own profile (except is_admin flag - handled by trigger)
CREATE POLICY "Users update own profile" ON user_profiles FOR
UPDATE USING (auth.uid() = id);
-- Admins can read all profiles  
CREATE POLICY "Admins read all profiles" ON user_profiles FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
-- Admins can update all profiles
CREATE POLICY "Admins update all profiles" ON user_profiles FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND is_admin = TRUE
        )
    );
-- Backfill existing users (run once)
INSERT INTO user_profiles (id, email)
SELECT id,
    email
FROM auth.users ON CONFLICT (id) DO NOTHING;
-- Subscription tier limits
COMMENT ON TABLE user_profiles IS 'User profiles with subscription tiers:
- basic: AI-only generation, limited features
- premium: AI + RAG knowledge base access  
- enterprise: Full access including real-time Ted guidance';