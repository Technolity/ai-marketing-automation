-- ============================================
-- TED OS COMPLETE DATABASE SCHEMA (Clerk Compatible)
-- ============================================
-- Supports: PostgreSQL 12+, MySQL 8.0+
-- Compatible with: Supabase, PlanetScale, Railway, Neon, etc.
-- ============================================

-- ============================================
-- TABLE 1: USERS (formerly user_profiles)
-- ============================================
CREATE TABLE users (
    -- Primary identifiers
    id VARCHAR(255) PRIMARY KEY,  -- UUID format (dev) or Clerk ID (production)
    clerk_id VARCHAR(255) UNIQUE,  -- Clerk user ID (NULL in dev mode)

    -- Profile information
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,

    -- Authorization
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,

    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'basic' NOT NULL,
    tier_expires_at TIMESTAMP NULL,

    -- Usage tracking
    generation_count INT DEFAULT 0 NOT NULL,
    last_generation_at TIMESTAMP NULL,

    -- Audit timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,

    -- Constraints
    CONSTRAINT chk_subscription_tier CHECK (subscription_tier IN ('basic', 'premium', 'enterprise'))
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- ============================================
-- TABLE 2: SAVED_SESSIONS
-- ============================================
CREATE TABLE saved_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,

    -- Session metadata
    session_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),

    -- Progress tracking
    current_step INT DEFAULT 1 NOT NULL,
    completed_steps JSON,  -- Array of completed step numbers [1, 2, 3, ...]

    -- Data storage (JSON columns)
    answers JSON,  -- User answers by step: {1: "answer", 2: "answer", ...}
    generated_content JSON,  -- AI generated content by type
    results_data JSON,  -- Processed/approved results
    onboarding_data JSON,  -- Additional onboarding information

    -- Status tracking
    is_complete BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_session_status CHECK (status IN ('active', 'in_progress', 'completed', 'deleted'))
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON saved_sessions(user_id);
CREATE INDEX idx_sessions_is_deleted ON saved_sessions(is_deleted);
CREATE INDEX idx_sessions_status ON saved_sessions(status);
CREATE INDEX idx_sessions_created_at ON saved_sessions(created_at);

-- ============================================
-- TABLE 3: INTAKE_ANSWERS
-- ============================================
CREATE TABLE intake_answers (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    slide_id INT NOT NULL,

    -- Answer data
    answers JSON NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Unique constraint (one answer per user per slide)
    UNIQUE KEY unique_user_slide (user_id, slide_id)
);

-- Indexes
CREATE INDEX idx_intake_user_id ON intake_answers(user_id);
CREATE INDEX idx_intake_slide_id ON intake_answers(slide_id);

-- ============================================
-- TABLE 4: SLIDE_RESULTS
-- ============================================
CREATE TABLE slide_results (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    slide_id INT NOT NULL,

    -- AI output
    ai_output JSON NOT NULL,

    -- Approval tracking
    approved BOOLEAN DEFAULT FALSE NOT NULL,
    approved_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_slide_results_user_id ON slide_results(user_id);
CREATE INDEX idx_slide_results_slide_id ON slide_results(slide_id);
CREATE INDEX idx_slide_results_approved ON slide_results(approved);

-- ============================================
-- TABLE 5: GENERATED_CONTENT
-- ============================================
CREATE TABLE generated_content (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),

    -- Content information
    content_type VARCHAR(50) NOT NULL,
    content_data JSON NOT NULL,

    -- Review status
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    admin_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES saved_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT chk_content_status CHECK (status IN ('pending', 'approved', 'rejected', 'edited'))
);

-- Indexes
CREATE INDEX idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX idx_generated_content_status ON generated_content(status);
CREATE INDEX idx_generated_content_reviewed_by ON generated_content(reviewed_by);

-- ============================================
-- TABLE 6: KNOWLEDGE_BASE
-- ============================================
CREATE TABLE knowledge_base (
    id VARCHAR(255) PRIMARY KEY,

    -- Content
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,

    -- Categorization
    industry VARCHAR(100),
    content_type VARCHAR(50) DEFAULT 'article' NOT NULL,
    tags JSON,  -- Array of tag strings

    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- Metadata
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Foreign key
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_knowledge_is_active ON knowledge_base(is_active);
CREATE INDEX idx_knowledge_industry ON knowledge_base(industry);
CREATE INDEX idx_knowledge_content_type ON knowledge_base(content_type);

-- Full-text search (PostgreSQL)
-- For MySQL: CREATE FULLTEXT INDEX idx_content_search ON knowledge_base(title, content);
CREATE INDEX idx_knowledge_title ON knowledge_base(title);

-- ============================================
-- TABLE 7: ADMIN_SETTINGS (optional)
-- ============================================
CREATE TABLE admin_settings (
    id VARCHAR(255) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index
CREATE INDEX idx_admin_settings_category ON admin_settings(category);

-- ============================================
-- DEV MODE SEED DATA
-- ============================================
-- Insert test users for development mode
INSERT INTO users (id, clerk_id, email, full_name, is_admin, subscription_tier) VALUES
('11111111-1111-1111-1111-111111111111', NULL, 'basic@test.com', 'Test User (Basic)', FALSE, 'basic'),
('22222222-2222-2222-2222-222222222222', NULL, 'premium@test.com', 'Premium User', FALSE, 'premium'),
('33333333-3333-3333-3333-333333333333', NULL, 'admin@test.com', 'Admin User', TRUE, 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Sample session
INSERT INTO saved_sessions (id, user_id, session_name, business_name, current_step, completed_steps, answers, generated_content, is_complete, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Test Business Session', 'Test Corp', 1, '[]', '{}', '{}', FALSE, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT 'TedOS Database Schema Created Successfully!' AS status;

SELECT
    'users' AS table_name,
    COUNT(*) AS row_count
FROM users
UNION ALL
SELECT 'saved_sessions', COUNT(*) FROM saved_sessions
UNION ALL
SELECT 'intake_answers', COUNT(*) FROM intake_answers
UNION ALL
SELECT 'slide_results', COUNT(*) FROM slide_results
UNION ALL
SELECT 'generated_content', COUNT(*) FROM generated_content
UNION ALL
SELECT 'knowledge_base', COUNT(*) FROM knowledge_base;

-- ============================================
-- NOTES
-- ============================================
-- 1. UUID Generation:
--    - PostgreSQL: Use gen_random_uuid()
--    - MySQL: Use UUID()
--    - Application: Generate UUIDs in app code
--
-- 2. JSON Columns:
--    - PostgreSQL: Native JSON/JSONB type
--    - MySQL 8.0+: Native JSON type
--
-- 3. Auto-update timestamps:
--    - PostgreSQL: Use triggers
--    - MySQL: Use ON UPDATE CURRENT_TIMESTAMP
--
-- 4. Clerk Integration:
--    - clerk_id is NULL for dev mode users
--    - id can be UUID (dev) or Clerk ID (production)
--    - Use clerk_id when querying Clerk users
--    - Use id when querying dev mode users
--
-- 5. Soft Deletes:
--    - Users: deleted_at timestamp
--    - Sessions: is_deleted boolean
--    - Always filter WHERE deleted_at IS NULL or is_deleted = FALSE
