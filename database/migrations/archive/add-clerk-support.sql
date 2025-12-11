-- ============================================
-- QUICK UPDATE: Add Clerk Support to Existing Database
-- ============================================
-- Run this in Supabase SQL Editor RIGHT NOW
-- This makes your database Clerk-compatible while keeping dev mode working
-- ============================================

-- Add clerk_id column (nullable for dev mode users)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_id);

-- Add soft delete column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON user_profiles(deleted_at);

-- Add usage tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS generation_count INT DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_generation_at TIMESTAMP NULL;

-- Verify the changes
SELECT 'Clerk support added successfully!' AS status;

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('clerk_id', 'deleted_at', 'generation_count', 'last_generation_at')
ORDER BY column_name;

-- Show current users (should include your 3 dev users)
SELECT
    id,
    email,
    full_name,
    is_admin,
    subscription_tier,
    clerk_id,
    deleted_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;
