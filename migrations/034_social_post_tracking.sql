-- Social Post Tracking (Post for Me)
-- Adds columns to daily_posts so a published post can be correlated to its
-- Post for Me social-post record and, later, its engagement metrics.
-- NOTE: user_id on daily_posts is TEXT (Clerk user ID). These are plain ALTERs;
-- no new table, so existing GRANTs on daily_posts continue to apply.

ALTER TABLE daily_posts
  ADD COLUMN IF NOT EXISTS pfm_post_id         TEXT,          -- Post for Me social-post id (spp_... / post id)
  ADD COLUMN IF NOT EXISTS published_platforms TEXT[]  NOT NULL DEFAULT '{}',  -- e.g. {'x','instagram'}
  ADD COLUMN IF NOT EXISTS published_at        TIMESTAMPTZ;   -- when it was actually pushed to socials

CREATE INDEX IF NOT EXISTS idx_daily_posts_pfm_post_id ON daily_posts (pfm_post_id);

-- Re-assert GRANTs (safe to run repeatedly; keeps prod in sync with the GRANT policy).
GRANT ALL ON public.daily_posts TO authenticated, service_role;
