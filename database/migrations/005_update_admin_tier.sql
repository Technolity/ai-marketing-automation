-- Update admin user to enterprise tier
-- Run this in Supabase SQL Editor to set the admin's tier properly
-- Option 1: Update by email
UPDATE user_profiles
SET subscription_tier = 'enterprise',
    tier_expires_at = NULL -- Enterprise never expires
WHERE email = 'your-email.example.com';
-- Or Option 2: Update all admins to enterprise tier
-- UPDATE user_profiles 
-- SET 
--     subscription_tier = 'enterprise',
--     tier_expires_at = NULL
-- WHERE is_admin = true;
-- Verify the update
SELECT id,
    email,
    is_admin,
    subscription_tier,
    tier_expires_at
FROM user_profiles
WHERE is_admin = true;