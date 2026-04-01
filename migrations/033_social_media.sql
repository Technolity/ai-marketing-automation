-- Social Media Integration Schema
-- Adds Buffer OAuth, social posting, and analytics tracking.
-- NOTE: user_id is TEXT (Clerk user ID format: "user_xxx"), NOT UUID.
-- Requires: update_updated_at_column() function (already exists from migration 032).

-- ─── 1. Buffer token columns on user_profiles ─────────────────────────────────
-- Stores the encrypted Buffer OAuth access token per workspace.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS buffer_access_token   TEXT,
  ADD COLUMN IF NOT EXISTS buffer_connected_at   TIMESTAMPTZ;

-- ─── 2. buffer_profiles ───────────────────────────────────────────────────────
-- One row per connected social account (Twitter, Instagram, Facebook).
-- A user can have at most one of each platform.
CREATE TABLE IF NOT EXISTS buffer_profiles (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT    NOT NULL,
  buffer_id     TEXT    NOT NULL UNIQUE,          -- Buffer's internal profile ID
  service       TEXT    NOT NULL CHECK (service IN ('twitter', 'instagram', 'facebook')),
  display_name  TEXT    NOT NULL,                 -- @username or profile name
  avatar_url    TEXT,
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, service)                       -- one per platform per workspace
);

CREATE INDEX IF NOT EXISTS idx_buffer_profiles_user_id ON buffer_profiles (user_id);

-- ─── 3. social_posts ──────────────────────────────────────────────────────────
-- Tracks every post submitted to Buffer (may link back to a daily_post).
CREATE TABLE IF NOT EXISTS social_posts (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT    NOT NULL,
  daily_post_id       UUID    REFERENCES daily_posts(id) ON DELETE SET NULL,

  -- Content
  image_url           TEXT    NOT NULL,
  caption             TEXT    NOT NULL,
  platforms           TEXT[]  NOT NULL DEFAULT '{}',
  hashtags            JSONB   NOT NULL DEFAULT '{}',  -- { "twitter": "#ai", "instagram": "#ai #marketing ..." }

  -- Buffer integration
  buffer_id           TEXT    UNIQUE,                 -- Buffer's update/post ID (nullable until posted)
  buffer_profile_ids  TEXT[]  DEFAULT '{}',           -- which Buffer profile IDs were targeted

  -- Status
  post_status         TEXT    NOT NULL DEFAULT 'pending'
                              CHECK (post_status IN ('pending', 'published', 'scheduled', 'failed')),
  post_error          TEXT,                           -- error message if status = 'failed'
  published_at        TIMESTAMPTZ,
  scheduled_for       TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_id      ON social_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_daily_post   ON social_posts (daily_post_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_published_at ON social_posts (user_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_status       ON social_posts (user_id, post_status);

DROP TRIGGER IF EXISTS trg_social_posts_updated_at ON social_posts;
CREATE TRIGGER trg_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 4. social_post_metrics ───────────────────────────────────────────────────
-- One row per social_post, populated / refreshed by the Buffer analytics sync job.
CREATE TABLE IF NOT EXISTS social_post_metrics (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id      UUID    NOT NULL UNIQUE REFERENCES social_posts(id) ON DELETE CASCADE,

  -- Raw metrics (from Buffer API)
  likes               INT     NOT NULL DEFAULT 0,
  comments            INT     NOT NULL DEFAULT 0,
  shares              INT     NOT NULL DEFAULT 0,
  views               INT     NOT NULL DEFAULT 0,    -- impressions
  reaches             INT     NOT NULL DEFAULT 0,
  link_clicks         INT     NOT NULL DEFAULT 0,

  -- Calculated
  engagement_rate     FLOAT   NOT NULL DEFAULT 0,    -- (likes+comments+shares)/views*100
  ctr                 FLOAT   NOT NULL DEFAULT 0,    -- link_clicks/views*100

  -- Sync health
  last_synced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_error_count    INT     NOT NULL DEFAULT 0,
  sync_error_message  TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_post_metrics_post_id     ON social_post_metrics (social_post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_metrics_synced_at   ON social_post_metrics (last_synced_at);

DROP TRIGGER IF EXISTS trg_social_post_metrics_updated_at ON social_post_metrics;
CREATE TRIGGER trg_social_post_metrics_updated_at
  BEFORE UPDATE ON social_post_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
