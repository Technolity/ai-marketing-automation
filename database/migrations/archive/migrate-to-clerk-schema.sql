-- ============================================
-- MIGRATION SCRIPT: Supabase Schema → Clerk Schema
-- ============================================
-- This script migrates your existing Supabase database to the new Clerk-compatible schema
-- Run this AFTER testing in development
-- ALWAYS backup your database before running migrations!
-- ============================================

-- ============================================
-- STEP 1: ADD CLERK_ID COLUMN TO EXISTING TABLE
-- ============================================
-- This allows dual mode: existing users keep working while new Clerk users are added

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_id);

-- ============================================
-- STEP 2: ADD DELETED_AT COLUMN FOR SOFT DELETES
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON user_profiles(deleted_at);

-- ============================================
-- STEP 3: ADD GENERATION_COUNT FOR USAGE TRACKING
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS generation_count INT DEFAULT 0 NOT NULL;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_generation_at TIMESTAMP NULL;

-- ============================================
-- VERIFICATION: CHECK CURRENT SCHEMA
-- ============================================
SELECT 'Current user_profiles schema:' AS info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

SELECT COUNT(*) AS total_users FROM user_profiles;
SELECT COUNT(*) AS users_with_clerk_id FROM user_profiles WHERE clerk_id IS NOT NULL;
SELECT COUNT(*) AS dev_mode_users FROM user_profiles WHERE clerk_id IS NULL;

-- ============================================
-- OPTIONAL: RENAME TABLE (Future Migration)
-- ============================================
-- Uncomment these lines when you're ready to rename user_profiles → users
-- WARNING: This will break existing code that references user_profiles

-- -- Create backup
-- CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles;

-- -- Rename table
-- ALTER TABLE user_profiles RENAME TO users;

-- -- Update foreign key references
-- ALTER TABLE saved_sessions DROP CONSTRAINT IF EXISTS saved_sessions_user_id_fkey;
-- ALTER TABLE saved_sessions
-- ADD CONSTRAINT saved_sessions_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE intake_answers DROP CONSTRAINT IF EXISTS intake_answers_user_id_fkey;
-- ALTER TABLE intake_answers
-- ADD CONSTRAINT intake_answers_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE slide_results DROP CONSTRAINT IF EXISTS slide_results_user_id_fkey;
-- ALTER TABLE slide_results
-- ADD CONSTRAINT slide_results_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_user_id_fkey;
-- ALTER TABLE generated_content
-- ADD CONSTRAINT generated_content_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_reviewed_by_fkey;
-- ALTER TABLE generated_content
-- ADD CONSTRAINT generated_content_reviewed_by_fkey
-- FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ALTER TABLE knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_created_by_fkey;
-- ALTER TABLE knowledge_base
-- ADD CONSTRAINT knowledge_base_created_by_fkey
-- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- NOTES FOR FUTURE FULL MIGRATION
-- ============================================
-- When you're ready to migrate to a new database (MySQL/PostgreSQL):
--
-- 1. Export data from Supabase:
--    pg_dump -h your-project.supabase.co -U postgres -d postgres > backup.sql
--
-- 2. Create new database with complete-clerk-schema.sql
--
-- 3. Import data:
--    - Map user_profiles.id → users.id
--    - Copy clerk_id if exists
--    - Maintain all foreign key relationships
--
-- 4. Verify:
--    SELECT COUNT(*) FROM users;
--    SELECT COUNT(*) FROM saved_sessions;
--    SELECT * FROM users WHERE clerk_id IS NOT NULL LIMIT 5;
--
-- 5. Update .env to point to new database
--
-- 6. Test thoroughly in staging before production

SELECT 'Migration Step 1 Complete: clerk_id column added' AS status;
