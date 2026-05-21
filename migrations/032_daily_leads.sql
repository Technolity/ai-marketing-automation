-- Daily Leads Feature Schema
-- Creates tables for daily post generation, smart links, and quota tracking.
-- NOTE: user_id is TEXT (Clerk user ID format: "user_xxx"), NOT UUID.

-- If tables already exist with wrong UUID type, drop and recreate:
DROP TABLE IF EXISTS smart_links CASCADE;
DROP TABLE IF EXISTS post_generations_quota CASCADE;
DROP TABLE IF EXISTS daily_posts CASCADE;

-- ─── 1. daily_posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT    NOT NULL,
  funnel_id       UUID,                  -- which marketing engine this post was built around
  image_url       TEXT    NOT NULL,
  caption         TEXT    NOT NULL,
  keyword         TEXT,                  -- dynamic CTA keyword (e.g. "GUIDE")
  post_date       DATE    NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
  smart_link_id   UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_posts_user_id   ON daily_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_posts_post_date ON daily_posts (user_id, post_date DESC);

-- ─── 2. post_generations_quota ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_generations_quota (
  user_id          TEXT NOT NULL,
  quota_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  generation_count INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, quota_date)
);

-- ─── 3. smart_links ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smart_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  post_id         UUID REFERENCES daily_posts(id) ON DELETE SET NULL,
  short_hash      TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  clicks          INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smart_links_hash    ON smart_links (short_hash);
CREATE INDEX IF NOT EXISTS idx_smart_links_user_id ON smart_links (user_id);

-- ─── Triggers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_posts_updated_at ON daily_posts;
CREATE TRIGGER trg_daily_posts_updated_at
  BEFORE UPDATE ON daily_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run in Supabase dashboard: Storage → New Bucket → "daily-post-images" → Public
-- Or via Supabase CLI: supabase storage create daily-post-images --public
