-- Add schedule_link to user_profiles for hardcoded booking URL
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS schedule_link TEXT;
