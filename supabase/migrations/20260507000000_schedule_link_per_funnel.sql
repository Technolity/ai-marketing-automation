-- Move schedule_link from user_profiles to user_funnels so each funnel
-- can have its own booking URL.
ALTER TABLE user_funnels ADD COLUMN IF NOT EXISTS schedule_link TEXT;

-- Backfill: copy existing user-level link to all their funnels
UPDATE user_funnels f
SET    schedule_link = p.schedule_link
FROM   user_profiles p
WHERE  p.id = f.user_id
  AND  p.schedule_link IS NOT NULL
  AND  f.schedule_link IS NULL;
