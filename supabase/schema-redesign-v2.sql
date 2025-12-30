-- =====================================================
-- TED OS - REDESIGNED DATABASE SCHEMA V2
-- =====================================================
-- New workflow: Sequential questions → Generate Vault → Interactive AI editing
-- Optimized for fast retrieval, user isolation, and multiple funnels per user
--
-- NOTE: This schema is IDEMPOTENT - safe to run multiple times
-- All indexes use DROP IF EXISTS before CREATE
-- =====================================================
-- =====================================================
-- 1. USER PROFILES (Enhanced)
-- =====================================================
-- Core user info, tier management, and usage tracking
-- NOTE: Admin users (is_admin = true) bypass ALL tier/plan restrictions
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,
    -- Clerk User ID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    -- Role & Privileges
    -- IMPORTANT: is_admin = true means UNLIMITED access to everything
    is_admin BOOLEAN DEFAULT false,
    -- Subscription / Tier (Ignored for admins)
    subscription_tier TEXT DEFAULT 'basic',
    -- basic, premium, enterprise
    tier_expires_at TIMESTAMP WITH TIME ZONE,
    -- Usage Tracking
    total_generations INTEGER DEFAULT 0,
    -- Total AI generations across all funnels
    last_generation_at TIMESTAMP WITH TIME ZONE,
    -- Funnel Limits (tier-based, IGNORED for admins)
    -- Tier 1 (basic): 1 funnel
    -- Tier 2 (premium): 3 funnels + 2 seats
    -- Tier 3 (enterprise): 10 funnels + 3 seats
    max_funnels INTEGER DEFAULT 1,
    current_funnel_count INTEGER DEFAULT 0,
    -- Seats/Users (tier-based, IGNORED for admins)
    -- Base: 1 seat, Additional: $97/month each
    max_seats INTEGER DEFAULT 1,
    current_seat_count INTEGER DEFAULT 0,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_user_profiles_subscription_tier;
DROP INDEX IF EXISTS idx_user_profiles_admin;
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_admin ON public.user_profiles(is_admin)
WHERE is_admin = true;
-- =====================================================
-- 2. QUESTIONS MASTER (Reference Table)
-- =====================================================
-- Master definition of all 20 questionnaire questions
-- This is a reference table - populated once, rarely changed
CREATE TABLE IF NOT EXISTS public.questions_master (
    id SERIAL PRIMARY KEY,
    step_number INTEGER UNIQUE NOT NULL,
    -- 1-20
    field_name TEXT NOT NULL,
    -- 'idealClient', 'message', 'coreProblem', etc.
    question_title TEXT NOT NULL,
    -- Display title
    question_text TEXT NOT NULL,
    -- Full question prompt
    question_subtitle TEXT,
    -- Additional context
    -- Question categorization
    category TEXT NOT NULL,
    -- 'business_foundation', 'target_audience', 'offer_details', etc.
    phase TEXT NOT NULL,
    -- 'core_discovery', 'brand_identity', 'strategy'
    -- Input configuration
    input_type TEXT NOT NULL,
    -- 'textarea', 'select', 'multiselect'
    input_options JSONB,
    -- For select/multiselect: {"options": ["option1", "option2"]}
    validation_rules JSONB,
    -- {"required": true, "minLength": 10, "maxLength": 500}
    -- Display configuration
    placeholder_text TEXT,
    help_text TEXT,
    display_order INTEGER NOT NULL,
    -- Which vault content sections use this question
    -- e.g., ["idealClient", "message", "salesScripts"] - multiple sections can use same question
    used_in_vault_sections TEXT [] DEFAULT ARRAY []::TEXT [],
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_questions_step_number;
DROP INDEX IF EXISTS idx_questions_category;
DROP INDEX IF EXISTS idx_questions_active;
CREATE INDEX idx_questions_step_number ON public.questions_master(step_number);
CREATE INDEX idx_questions_category ON public.questions_master(category);
CREATE INDEX idx_questions_active ON public.questions_master(is_active)
WHERE is_active = true;
-- =====================================================
-- 3. USER FUNNELS (Multiple Funnels per User)
-- =====================================================
-- Each user can create multiple funnels (tier-based limit)
-- Admins bypass funnel limits entirely
CREATE TABLE IF NOT EXISTS public.user_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    -- Funnel identification
    funnel_name TEXT NOT NULL,
    -- User-defined name
    funnel_description TEXT,
    -- Progress tracking
    questionnaire_completed BOOLEAN DEFAULT false,
    questionnaire_completed_at TIMESTAMP WITH TIME ZONE,
    current_step INTEGER DEFAULT 1,
    -- Which question they're on (1-20)
    completed_steps INTEGER [] DEFAULT ARRAY []::INTEGER [],
    -- Array of completed step numbers
    -- Vault generation
    vault_generated BOOLEAN DEFAULT false,
    vault_generated_at TIMESTAMP WITH TIME ZONE,
    vault_generation_status TEXT DEFAULT 'not_started',
    -- 'not_started', 'generating', 'completed', 'failed'
    -- Phase approvals
    phase1_approved BOOLEAN DEFAULT false,
    phase1_approved_at TIMESTAMP WITH TIME ZONE,
    phase2_unlocked BOOLEAN DEFAULT false,
    phase2_unlocked_at TIMESTAMP WITH TIME ZONE,
    -- Regeneration caps tracking (per section)
    -- Example: {"idealClient": 2, "message": 3, "story": 1}
    -- Max 4-5 regenerations per section (enforced in API)
    regeneration_counts JSONB DEFAULT '{}'::jsonb,
    -- Status
    is_active BOOLEAN DEFAULT true,
    -- Current funnel user is working on
    is_deleted BOOLEAN DEFAULT false,
    -- Soft delete
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_unique_active_funnel_per_user;
DROP INDEX IF EXISTS idx_user_funnels_user_id;
DROP INDEX IF EXISTS idx_user_funnels_active;
DROP INDEX IF EXISTS idx_user_funnels_not_deleted;
DROP INDEX IF EXISTS idx_user_funnels_updated_at;
-- Partial unique index: Only one active funnel per user
CREATE UNIQUE INDEX idx_unique_active_funnel_per_user ON public.user_funnels(user_id)
WHERE is_active = true
    AND is_deleted = false;
CREATE INDEX idx_user_funnels_user_id ON public.user_funnels(user_id);
CREATE INDEX idx_user_funnels_active ON public.user_funnels(user_id, is_active)
WHERE is_active = true;
CREATE INDEX idx_user_funnels_not_deleted ON public.user_funnels(user_id, is_deleted)
WHERE is_deleted = false;
CREATE INDEX idx_user_funnels_updated_at ON public.user_funnels(updated_at DESC);
-- =====================================================
-- 4. QUESTIONNAIRE RESPONSES (All Q&A in One Place)
-- =====================================================
-- Stores ALL question-answer pairs for a funnel in one place
-- This is the single source of truth for user's questionnaire data
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    -- Question reference
    question_id INTEGER NOT NULL REFERENCES public.questions_master(id),
    step_number INTEGER NOT NULL,
    -- Denormalized for faster queries
    -- Answer data
    answer_text TEXT,
    -- For textarea inputs
    answer_selection TEXT,
    -- For single select
    answer_selections TEXT [],
    -- For multiselect
    answer_json JSONB,
    -- For complex structured answers
    -- Metadata
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Constraints: One response per question per funnel
    CONSTRAINT unique_funnel_question UNIQUE (funnel_id, question_id)
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_questionnaire_responses_funnel_id;
DROP INDEX IF EXISTS idx_questionnaire_responses_user_id;
DROP INDEX IF EXISTS idx_questionnaire_responses_step_number;
DROP INDEX IF EXISTS idx_questionnaire_responses_funnel_step;
CREATE INDEX idx_questionnaire_responses_funnel_id ON public.questionnaire_responses(funnel_id);
CREATE INDEX idx_questionnaire_responses_user_id ON public.questionnaire_responses(user_id);
CREATE INDEX idx_questionnaire_responses_step_number ON public.questionnaire_responses(funnel_id, step_number);
-- Composite index for fast "get all answers for a funnel" query
CREATE INDEX idx_questionnaire_responses_funnel_step ON public.questionnaire_responses(funnel_id, step_number);
-- =====================================================
-- 5. VAULT CONTENT (Generated Content Storage)
-- =====================================================
-- Stores AI-generated vault content with versioning
-- Each section can have multiple versions, but only one is "current"
CREATE TABLE IF NOT EXISTS public.vault_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    -- Content identification
    section_id TEXT NOT NULL,
    -- 'idealClient', 'message', 'story', 'offer', etc.
    section_title TEXT NOT NULL,
    -- Display name
    numeric_key INTEGER,
    -- 1-16 for vault sections
    phase TEXT NOT NULL,
    -- 'phase1' or 'phase2'
    -- Content versioning
    version INTEGER DEFAULT 1,
    -- Increments with each regeneration
    is_current_version BOOLEAN DEFAULT true,
    -- Only one current version per section
    -- Generated content
    content JSONB NOT NULL,
    -- The actual AI-generated content
    -- Generation metadata
    prompt_used TEXT,
    model_used TEXT DEFAULT 'gpt-4o-mini',
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    -- Status & approval
    status TEXT DEFAULT 'draft',
    -- 'draft', 'approved', 'archived'
    approved_at TIMESTAMP WITH TIME ZONE,
    -- Lock status (for progressive unlock)
    is_locked BOOLEAN DEFAULT true,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_unique_current_version;
DROP INDEX IF EXISTS idx_vault_content_funnel_id;
DROP INDEX IF EXISTS idx_vault_content_user_id;
DROP INDEX IF EXISTS idx_vault_content_section;
DROP INDEX IF EXISTS idx_vault_content_current;
DROP INDEX IF EXISTS idx_vault_content_phase;
DROP INDEX IF EXISTS idx_vault_content_status;
DROP INDEX IF EXISTS idx_vault_content_funnel_current;
-- Partial unique index: Only one current version per section per funnel
CREATE UNIQUE INDEX idx_unique_current_version ON public.vault_content(funnel_id, section_id)
WHERE is_current_version = true;
CREATE INDEX idx_vault_content_funnel_id ON public.vault_content(funnel_id);
CREATE INDEX idx_vault_content_user_id ON public.vault_content(user_id);
CREATE INDEX idx_vault_content_section ON public.vault_content(funnel_id, section_id);
CREATE INDEX idx_vault_content_current ON public.vault_content(funnel_id, is_current_version)
WHERE is_current_version = true;
CREATE INDEX idx_vault_content_phase ON public.vault_content(funnel_id, phase);
CREATE INDEX idx_vault_content_status ON public.vault_content(funnel_id, status);
-- Optimized for vault page queries: get all current content for a funnel
CREATE INDEX idx_vault_content_funnel_current ON public.vault_content(funnel_id, phase, numeric_key)
WHERE is_current_version = true
    AND status != 'archived';
-- =====================================================
-- 6. CONTENT EDIT HISTORY (AI Feedback & Iterations)
-- =====================================================
-- Tracks user feedback and AI edits for "Edit with AI" / Feedback Chat feature
-- Prevents recurring to old unapproved generations
CREATE TABLE IF NOT EXISTS public.content_edit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_content_id UUID NOT NULL REFERENCES public.vault_content(id) ON DELETE CASCADE,
    funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    -- Edit context
    edit_session_id UUID,
    -- Groups related edits in one conversation
    edit_number INTEGER,
    -- Sequence within edit session (1st feedback, 2nd feedback, etc.)
    -- User feedback (for AI Feedback Chat)
    user_feedback_type TEXT,
    -- 'section_update', 'point_improvement', 'general_feedback'
    user_feedback_text TEXT NOT NULL,
    -- What user said they want changed
    -- AI conversation history (for Feedback Chat feature)
    conversation_history JSONB,
    -- Array of {role: 'user'|'assistant', content: '...'}
    -- Content changes
    content_before JSONB,
    -- Content before this edit
    content_after JSONB,
    -- Content after this edit
    sections_modified TEXT [],
    -- Which sections of content were changed
    -- Result
    edit_applied BOOLEAN DEFAULT false,
    -- Whether user accepted the edit
    applied_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_content_edit_history_vault_content;
DROP INDEX IF EXISTS idx_content_edit_history_funnel;
DROP INDEX IF EXISTS idx_content_edit_history_session;
DROP INDEX IF EXISTS idx_content_edit_history_created;
CREATE INDEX idx_content_edit_history_vault_content ON public.content_edit_history(vault_content_id);
CREATE INDEX idx_content_edit_history_funnel ON public.content_edit_history(funnel_id);
CREATE INDEX idx_content_edit_history_session ON public.content_edit_history(edit_session_id);
CREATE INDEX idx_content_edit_history_created ON public.content_edit_history(created_at DESC);
-- =====================================================
-- 7. GENERATION JOBS (Track "Building Your Empire" Progress)
-- =====================================================
-- Tracks vault generation jobs for progress tracking and error handling
CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    -- Job configuration
    job_type TEXT NOT NULL,
    -- 'initial_vault', 'regenerate_section', 'phase2_generation'
    sections_to_generate TEXT [],
    -- Which sections to generate
    -- Progress tracking
    status TEXT DEFAULT 'queued',
    -- 'queued', 'processing', 'completed', 'failed'
    progress_percentage INTEGER DEFAULT 0,
    -- 0-100
    current_section TEXT,
    -- Which section is currently being generated
    -- Results
    sections_completed TEXT [] DEFAULT ARRAY []::TEXT [],
    sections_failed TEXT [] DEFAULT ARRAY []::TEXT [],
    error_message TEXT,
    error_details JSONB,
    -- Performance
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_time_ms INTEGER,
    total_tokens_used INTEGER,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_generation_jobs_funnel;
DROP INDEX IF EXISTS idx_generation_jobs_status;
DROP INDEX IF EXISTS idx_generation_jobs_created;
CREATE INDEX idx_generation_jobs_funnel ON public.generation_jobs(funnel_id);
CREATE INDEX idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX idx_generation_jobs_created ON public.generation_jobs(created_at DESC);
-- =====================================================
-- 8. UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS set_updated_at_user_profiles ON public.user_profiles;
CREATE TRIGGER set_updated_at_user_profiles BEFORE
UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_questions_master ON public.questions_master;
CREATE TRIGGER set_updated_at_questions_master BEFORE
UPDATE ON public.questions_master FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_user_funnels ON public.user_funnels;
CREATE TRIGGER set_updated_at_user_funnels BEFORE
UPDATE ON public.user_funnels FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_questionnaire_responses ON public.questionnaire_responses;
CREATE TRIGGER set_updated_at_questionnaire_responses BEFORE
UPDATE ON public.questionnaire_responses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_vault_content ON public.vault_content;
CREATE TRIGGER set_updated_at_vault_content BEFORE
UPDATE ON public.vault_content FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- =====================================================
-- 8.5 ORGANIZATION SEATS (Team Members Support)
-- =====================================================
-- Allows users to invite team members to share funnels
-- Tier-based: Basic 1 seat, Premium 2 seats, Enterprise 3 seats
CREATE TABLE IF NOT EXISTS public.organization_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    seat_user_id TEXT REFERENCES public.user_profiles(id) ON DELETE
    SET NULL,
        seat_email TEXT,
        -- Invited but not registered yet
        -- Role & permissions
        role TEXT DEFAULT 'member',
        -- 'owner', 'admin', 'member'
        permissions JSONB DEFAULT '{"can_edit": true, "can_approve": false}'::jsonb,
        -- Status
        status TEXT DEFAULT 'pending',
        -- 'pending', 'active', 'revoked'
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        accepted_at TIMESTAMP WITH TIME ZONE,
        -- Metadata
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Drop and recreate indexes (idempotent)
DROP INDEX IF EXISTS idx_organization_seats_owner;
DROP INDEX IF EXISTS idx_organization_seats_member;
DROP INDEX IF EXISTS idx_organization_seats_email;
DROP INDEX IF EXISTS idx_organization_seats_status;
CREATE INDEX idx_organization_seats_owner ON public.organization_seats(owner_user_id);
CREATE INDEX idx_organization_seats_member ON public.organization_seats(seat_user_id)
WHERE seat_user_id IS NOT NULL;
CREATE INDEX idx_organization_seats_email ON public.organization_seats(seat_email)
WHERE seat_email IS NOT NULL;
CREATE INDEX idx_organization_seats_status ON public.organization_seats(status);
DROP TRIGGER IF EXISTS set_updated_at_organization_seats ON public.organization_seats;
CREATE TRIGGER set_updated_at_organization_seats BEFORE
UPDATE ON public.organization_seats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- NOTE: Admins (is_admin = true) can access ALL data via service role
-- Regular RLS applies to normal users only
-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()::text
            AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_seats ENABLE ROW LEVEL SECURITY;
-- USER PROFILES POLICIES (Admins can see all)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR
SELECT USING (
        auth.uid()::text = id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR
SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR
UPDATE USING (
        auth.uid()::text = id
        OR public.is_admin()
    );
-- QUESTIONS MASTER POLICIES (Read-only for all authenticated users)
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions_master;
CREATE POLICY "Anyone can read questions" ON public.questions_master FOR
SELECT USING (auth.role() = 'authenticated');
-- USER FUNNELS POLICIES (Admins can access all)
DROP POLICY IF EXISTS "Users can view own funnels" ON public.user_funnels;
CREATE POLICY "Users can view own funnels" ON public.user_funnels FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert own funnels" ON public.user_funnels;
CREATE POLICY "Users can insert own funnels" ON public.user_funnels FOR
INSERT WITH CHECK (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can update own funnels" ON public.user_funnels;
CREATE POLICY "Users can update own funnels" ON public.user_funnels FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can delete own funnels" ON public.user_funnels;
CREATE POLICY "Users can delete own funnels" ON public.user_funnels FOR DELETE USING (
    auth.uid()::text = user_id
    OR public.is_admin()
);
-- QUESTIONNAIRE RESPONSES POLICIES
DROP POLICY IF EXISTS "Users can view own responses" ON public.questionnaire_responses;
CREATE POLICY "Users can view own responses" ON public.questionnaire_responses FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert own responses" ON public.questionnaire_responses;
CREATE POLICY "Users can insert own responses" ON public.questionnaire_responses FOR
INSERT WITH CHECK (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can update own responses" ON public.questionnaire_responses;
CREATE POLICY "Users can update own responses" ON public.questionnaire_responses FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can delete own responses" ON public.questionnaire_responses;
CREATE POLICY "Users can delete own responses" ON public.questionnaire_responses FOR DELETE USING (
    auth.uid()::text = user_id
    OR public.is_admin()
);
-- VAULT CONTENT POLICIES
DROP POLICY IF EXISTS "Users can view own vault content" ON public.vault_content;
CREATE POLICY "Users can view own vault content" ON public.vault_content FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert own vault content" ON public.vault_content;
CREATE POLICY "Users can insert own vault content" ON public.vault_content FOR
INSERT WITH CHECK (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can update own vault content" ON public.vault_content;
CREATE POLICY "Users can update own vault content" ON public.vault_content FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can delete own vault content" ON public.vault_content;
CREATE POLICY "Users can delete own vault content" ON public.vault_content FOR DELETE USING (
    auth.uid()::text = user_id
    OR public.is_admin()
);
-- CONTENT EDIT HISTORY POLICIES
DROP POLICY IF EXISTS "Users can view own edit history" ON public.content_edit_history;
CREATE POLICY "Users can view own edit history" ON public.content_edit_history FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert own edit history" ON public.content_edit_history;
CREATE POLICY "Users can insert own edit history" ON public.content_edit_history FOR
INSERT WITH CHECK (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
-- GENERATION JOBS POLICIES
DROP POLICY IF EXISTS "Users can view own generation jobs" ON public.generation_jobs;
CREATE POLICY "Users can view own generation jobs" ON public.generation_jobs FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert own generation jobs" ON public.generation_jobs;
CREATE POLICY "Users can insert own generation jobs" ON public.generation_jobs FOR
INSERT WITH CHECK (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can update own generation jobs" ON public.generation_jobs;
CREATE POLICY "Users can update own generation jobs" ON public.generation_jobs FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
-- ORGANIZATION SEATS POLICIES
DROP POLICY IF EXISTS "Owners can manage their seats" ON public.organization_seats;
CREATE POLICY "Owners can manage their seats" ON public.organization_seats FOR ALL USING (
    auth.uid()::text = owner_user_id
    OR public.is_admin()
);
DROP POLICY IF EXISTS "Members can view their seat" ON public.organization_seats;
CREATE POLICY "Members can view their seat" ON public.organization_seats FOR
SELECT USING (auth.uid()::text = seat_user_id);
-- =====================================================
-- 10. HELPER FUNCTIONS FOR COMMON QUERIES
-- =====================================================
-- Function: Get all questionnaire responses for a funnel in order
CREATE OR REPLACE FUNCTION public.get_funnel_questionnaire(p_funnel_id UUID) RETURNS TABLE (
        step_number INTEGER,
        question_text TEXT,
        field_name TEXT,
        answer_text TEXT,
        answer_selection TEXT,
        answer_selections TEXT [],
        answered_at TIMESTAMP WITH TIME ZONE
    ) AS $$ BEGIN RETURN QUERY
SELECT qm.step_number,
    qm.question_text,
    qm.field_name,
    qr.answer_text,
    qr.answer_selection,
    qr.answer_selections,
    qr.answered_at
FROM public.questionnaire_responses qr
    JOIN public.questions_master qm ON qr.question_id = qm.id
WHERE qr.funnel_id = p_funnel_id
ORDER BY qm.step_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function: Get current vault content for a funnel
CREATE OR REPLACE FUNCTION public.get_current_vault_content(p_funnel_id UUID) RETURNS TABLE (
        section_id TEXT,
        section_title TEXT,
        numeric_key INTEGER,
        phase TEXT,
        content JSONB,
        status TEXT,
        is_locked BOOLEAN,
        approved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE
    ) AS $$ BEGIN RETURN QUERY
SELECT vc.section_id,
    vc.section_title,
    vc.numeric_key,
    vc.phase,
    vc.content,
    vc.status,
    vc.is_locked,
    vc.approved_at,
    vc.created_at
FROM public.vault_content vc
WHERE vc.funnel_id = p_funnel_id
    AND vc.is_current_version = true
    AND vc.status != 'archived'
ORDER BY vc.numeric_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function: Archive old version when new version is created
CREATE OR REPLACE FUNCTION public.archive_old_vault_versions() RETURNS TRIGGER AS $$ BEGIN -- When a new current version is inserted, archive the old current version
    IF NEW.is_current_version = true THEN
UPDATE public.vault_content
SET is_current_version = false,
    status = 'archived'
WHERE funnel_id = NEW.funnel_id
    AND section_id = NEW.section_id
    AND id != NEW.id
    AND is_current_version = true;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS archive_old_versions ON public.vault_content;
CREATE TRIGGER archive_old_versions
AFTER
INSERT ON public.vault_content FOR EACH ROW EXECUTE FUNCTION public.archive_old_vault_versions();
-- Function: Check if user can create more funnels (tier limit check)
-- Returns true if user is admin OR has not reached their funnel limit
CREATE OR REPLACE FUNCTION public.can_create_funnel(p_user_id TEXT) RETURNS BOOLEAN AS $$
DECLARE v_is_admin BOOLEAN;
v_max_funnels INTEGER;
v_current_count INTEGER;
BEGIN
SELECT is_admin,
    max_funnels,
    current_funnel_count INTO v_is_admin,
    v_max_funnels,
    v_current_count
FROM public.user_profiles
WHERE id = p_user_id;
-- Admins can create unlimited funnels
IF v_is_admin = true THEN RETURN true;
END IF;
-- Check tier limit
RETURN v_current_count < v_max_funnels;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function: Increment funnel count on create
CREATE OR REPLACE FUNCTION public.increment_funnel_count() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.user_profiles
SET current_funnel_count = current_funnel_count + 1
WHERE id = NEW.user_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS increment_funnel_count_trigger ON public.user_funnels;
CREATE TRIGGER increment_funnel_count_trigger
AFTER
INSERT ON public.user_funnels FOR EACH ROW EXECUTE FUNCTION public.increment_funnel_count();
-- Function: Decrement funnel count on delete
CREATE OR REPLACE FUNCTION public.decrement_funnel_count() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.user_profiles
SET current_funnel_count = GREATEST(0, current_funnel_count - 1)
WHERE id = OLD.user_id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS decrement_funnel_count_trigger ON public.user_funnels;
CREATE TRIGGER decrement_funnel_count_trigger
AFTER DELETE ON public.user_funnels FOR EACH ROW EXECUTE FUNCTION public.decrement_funnel_count();
-- =====================================================
-- 11. INITIAL DATA: POPULATE QUESTIONS MASTER
-- =====================================================
-- Based on os-wizard-data.js analysis
INSERT INTO public.questions_master (
        step_number,
        field_name,
        question_title,
        question_text,
        question_subtitle,
        category,
        phase,
        input_type,
        input_options,
        validation_rules,
        placeholder_text,
        help_text,
        display_order,
        used_in_vault_sections
    )
VALUES -- Step 1: Industry
    (
        1,
        'industry',
        'What industry are you in?',
        'Tell us about your business industry and type',
        'Foundation of your business',
        'business_foundation',
        'core_discovery',
        'select',
        '{"options": ["Coaching", "Consulting", "Course Creator", "Agency", "SaaS", "Ecommerce", "Other"]}'::jsonb,
        '{"required": true}'::jsonb,
        'Select your industry...',
        'This helps us tailor content to your specific market',
        1,
        ARRAY ['idealClient', 'message', 'story', 'offer']
    ),
    -- Step 2: Ideal Client
    (
        2,
        'idealClient',
        'Who is your ideal client?',
        'Describe your perfect customer in detail',
        'WHO you serve',
        'target_audience',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": true, "minLength": 20}'::jsonb,
        'e.g., Female entrepreneurs aged 30-45 struggling with visibility...',
        'Be specific: demographics, pain points, desires, where they hang out online',
        2,
        ARRAY ['idealClient', 'message', 'vsl', 'facebookAds', 'emails']
    ),
    -- Step 3: Core Message
    (
        3,
        'message',
        'What is your core message?',
        'What is the main transformation or outcome you help people achieve?',
        'WHAT you help them with',
        'core_message',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": true, "minLength": 20}'::jsonb,
        'e.g., I help coaches build 6-figure businesses without paid ads...',
        'This becomes the foundation of all your marketing',
        3,
        ARRAY ['message', 'vsl', 'facebookAds', 'funnelCopy', 'bio']
    ),
    -- Step 4: Core Problem
    (
        4,
        'coreProblem',
        'What core problem do you solve?',
        'What is the #1 problem your ideal client is facing?',
        'Their biggest pain point',
        'problem_definition',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": true, "minLength": 20}'::jsonb,
        'e.g., They have great expertise but no one knows about them...',
        'Focus on the emotional and practical impact of this problem',
        4,
        ARRAY ['message', 'vsl', 'leadMagnet', 'salesScripts']
    ),
    -- Step 5: Desired Outcomes
    (
        5,
        'outcomes',
        'What outcomes do clients get?',
        'What specific, measurable results do your clients achieve?',
        'Results & benefits',
        'results_benefits',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": true, "minLength": 20}'::jsonb,
        'e.g., Consistent $10K months, booked calendar, premium clients...',
        'List 3-5 concrete outcomes with numbers when possible',
        5,
        ARRAY ['offer', 'vsl', 'funnelCopy', 'salesScripts']
    ),
    -- Step 6: Unique Advantage
    (
        6,
        'uniqueAdvantage',
        'What makes you different?',
        'What is your unique approach or advantage over competitors?',
        'Your differentiation',
        'differentiation',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": true, "minLength": 20}'::jsonb,
        'e.g., My 3-Step Visibility Framework that works in 90 days...',
        'This is your secret sauce - what you do differently or better',
        6,
        ARRAY ['message', 'story', 'offer', 'bio']
    ),
    -- Step 7: Brand Story
    (
        7,
        'story',
        'What is your brand story?',
        'Share your journey - why you started, what you overcame, why you care',
        'WHY you do this work',
        'brand_story',
        'brand_identity',
        'textarea',
        NULL,
        '{"required": false, "minLength": 50}'::jsonb,
        'Share your transformation story...',
        'This builds trust and connection. Include struggle, breakthrough, mission',
        7,
        ARRAY ['story', 'vsl', 'bio', 'emails']
    ),
    -- Step 8: Testimonials
    (
        8,
        'testimonials',
        'Client testimonials or results',
        'Share any client success stories, testimonials, or case studies',
        'Social proof',
        'social_proof',
        'brand_identity',
        'textarea',
        NULL,
        '{"required": false}'::jsonb,
        'e.g., "Sarah went from $2K to $15K months in 60 days..."',
        'Include specific results, before/after, client names if possible',
        8,
        ARRAY ['vsl', 'funnelCopy', 'salesScripts', 'facebookAds']
    ),
    -- Step 9: Offer/Program
    (
        9,
        'offerProgram',
        'What is your main offer?',
        'Describe your signature program, service, or product',
        'Your core offer',
        'offer_details',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": true, "minLength": 30}'::jsonb,
        'e.g., 8-week group coaching program for visibility...',
        'Include what it is, how long, delivery method, key components',
        9,
        ARRAY ['offer', 'salesScripts', 'vsl', 'funnelCopy']
    ),
    -- Step 10: Deliverables
    (
        10,
        'deliverables',
        'What do clients get?',
        'List the specific components, modules, or deliverables in your offer',
        'What is included',
        'product_details',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": true, "minLength": 30}'::jsonb,
        'e.g., 8 weekly group calls, workbook, templates, community access...',
        'Be specific about what they receive and experience',
        10,
        ARRAY ['offer', 'salesScripts', 'funnelCopy']
    ),
    -- Step 11: Pricing
    (
        11,
        'pricing',
        'What is your pricing?',
        'Share your offer pricing and payment options',
        'Investment details',
        'pricing_info',
        'core_discovery',
        'textarea',
        NULL,
        '{"required": false}'::jsonb,
        'e.g., $3,997 one-time or 3 payments of $1,497...',
        'Include price, payment plans, any bonuses or guarantees',
        11,
        ARRAY ['offer', 'salesScripts', 'vsl']
    ),
    -- Step 12: Marketing Assets
    (
        12,
        'assets',
        'What marketing assets do you need?',
        'Select the types of content you want to create',
        'Content types',
        'marketing_assets',
        'strategy',
        'multiselect',
        '{"options": ["VSL Script", "Email Sequence", "Facebook Ads", "Landing Page Copy", "Lead Magnet", "Social Content", "Sales Script"]}'::jsonb,
        '{"required": false}'::jsonb,
        NULL,
        'Choose what you need most right now (you can create more later)',
        12,
        ARRAY ['vsl', 'emails', 'facebookAds', 'funnelCopy', 'leadMagnet', 'contentIdeas']
    ),
    -- Step 13: Revenue Stage
    (
        13,
        'revenue',
        'What is your current revenue?',
        'Select your current monthly revenue range',
        'Business stage indicator',
        'business_stage',
        'strategy',
        'select',
        '{"options": ["$0-$5K/mo", "$5K-$10K/mo", "$10K-$25K/mo", "$25K-$50K/mo", "$50K-$100K/mo", "$100K+/mo"]}'::jsonb,
        '{"required": false}'::jsonb,
        'Select your range...',
        'This helps us calibrate messaging for your stage',
        13,
        ARRAY ['message', 'offer']
    ),
    -- Step 14: Brand Voice
    (
        14,
        'brandVoice',
        'What is your brand voice?',
        'How do you want to sound in your marketing?',
        'Tone & personality',
        'brand_identity',
        'brand_identity',
        'textarea',
        NULL,
        '{"required": false}'::jsonb,
        'e.g., Warm and empowering, professional but approachable...',
        'Describe the tone and personality of your brand communication',
        14,
        ARRAY ['vsl', 'emails', 'facebookAds', 'funnelCopy', 'bio']
    ),
    -- Step 15: Brand Colors
    (
        15,
        'brandColors',
        'What are your brand colors?',
        'Share your brand color palette (if you have one)',
        'Visual identity',
        'brand_identity',
        'brand_identity',
        'textarea',
        NULL,
        '{"required": false}'::jsonb,
        'e.g., Navy blue, gold, cream...',
        'Optional but helpful for design recommendations',
        15,
        ARRAY []::TEXT []
    ),
    -- Step 16: Call to Action
    (
        16,
        'callToAction',
        'What action do you want people to take?',
        'What is the next step for interested prospects?',
        'Your CTA',
        'cta',
        'strategy',
        'textarea',
        NULL,
        '{"required": true, "minLength": 10}'::jsonb,
        'e.g., Book a free strategy call, Download my guide...',
        'This is where you send leads (calendar link, lead magnet, application)',
        16,
        ARRAY ['vsl', 'facebookAds', 'funnelCopy', 'leadMagnet', 'emails']
    ),
    -- Step 17: Platforms
    (
        17,
        'platforms',
        'Where will you market?',
        'Select the platforms you will use to reach your audience',
        'Distribution channels',
        'distribution',
        'strategy',
        'multiselect',
        '{"options": ["Facebook", "Instagram", "LinkedIn", "YouTube", "TikTok", "Email", "Podcast", "Other"]}'::jsonb,
        '{"required": true}'::jsonb,
        NULL,
        'Choose your primary marketing channels',
        17,
        ARRAY ['contentIdeas', 'facebookAds', 'emails']
    ),
    -- Step 18: 90-Day Goal
    (
        18,
        'goal90Days',
        'What is your 90-day goal?',
        'What specific goal do you want to achieve in the next 90 days?',
        'Short-term objective',
        'goals',
        'strategy',
        'textarea',
        NULL,
        '{"required": true, "minLength": 20}'::jsonb,
        'e.g., Enroll 10 clients at $5K each, build email list to 1,000...',
        'Be specific and measurable - this guides your entire strategy',
        18,
        ARRAY ['contentIdeas', 'emails']
    ),
    -- Step 19: Business Stage
    (
        19,
        'businessStage',
        'What stage is your business in?',
        'Select where you are in your business journey',
        'Current phase',
        'business_maturity',
        'strategy',
        'select',
        '{"options": ["Just Starting (0-6 months)", "Building (6-18 months)", "Growing (1.5-3 years)", "Scaling (3+ years)"]}'::jsonb,
        '{"required": true}'::jsonb,
        'Select your stage...',
        'This helps us match strategy to your current reality',
        19,
        ARRAY ['message', 'offer', 'contentIdeas']
    ),
    -- Step 20: Help Needed
    (
        20,
        'helpNeeded',
        'What do you need help with most?',
        'What is the biggest challenge or area where you need support?',
        'Focus areas',
        'focus_areas',
        'strategy',
        'textarea',
        NULL,
        '{"required": true, "minLength": 20}'::jsonb,
        'e.g., Getting consistent leads, converting sales calls, creating content...',
        'This helps prioritize what we build for you first',
        20,
        ARRAY ['leadMagnet', 'salesScripts', 'contentIdeas']
    ) ON CONFLICT (step_number) DO NOTHING;
-- =====================================================
-- END OF SCHEMA
-- =====================================================
-- Summary of key improvements:
-- ✅ Questions stored in master table (easy to reference)
-- ✅ All Q&A stored together per business (fast AI retrieval)
-- ✅ Vault content with versioning (no recurring old generations)
-- ✅ Edit history tracking (AI feedback loop)
-- ✅ Multi-business support (tier-based limits)
-- ✅ Proper indexing (fast queries)
-- ✅ User isolation (RLS policies)
-- ✅ Generation job tracking (progress indicators)
-- ✅ Helper functions (common queries optimized)