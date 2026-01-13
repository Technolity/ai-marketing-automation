-- ============================================
-- COMPLETE PRODUCTION DATABASE SCHEMA
-- AI MARKETING AUTOMATION PLATFORM
-- ============================================
-- Version: 2.1 (January 2026)
-- 
-- IMPORTANT: Run this script AS-IS in Supabase SQL Editor
-- Tables are created BEFORE functions that reference them
-- ============================================
-- ============================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================
-- STEP 2: DROP EVERYTHING (FRESH START)
-- ============================================
-- Drop all policies first
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT schemaname,
        tablename,
        policyname
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE format(
    'DROP POLICY IF EXISTS %I ON %I.%I',
    r.policyname,
    r.schemaname,
    r.tablename
);
END LOOP;
END $$;
-- Drop triggers (silent if not exist)
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_user_funnels_updated_at ON public.user_funnels;
DROP TRIGGER IF EXISTS trigger_questionnaire_updated_at ON public.questionnaire_responses;
DROP TRIGGER IF EXISTS trigger_ghl_credentials_updated_at ON public.ghl_credentials;
DROP TRIGGER IF EXISTS vault_content_updated_at ON public.vault_content;
DROP TRIGGER IF EXISTS vault_fields_updated_at ON public.vault_content_fields;
DROP TRIGGER IF EXISTS increment_funnel_count_trigger ON public.user_funnels;
DROP TRIGGER IF EXISTS decrement_funnel_count_trigger ON public.user_funnels;
DROP TRIGGER IF EXISTS trigger_saved_sessions_updated_at ON public.saved_sessions;
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.can_create_funnel(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.increment_funnel_count() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_funnel_count() CASCADE;
-- Drop all tables (in dependency order - children first)
DROP TABLE IF EXISTS public.vault_content_fields CASCADE;
DROP TABLE IF EXISTS public.vault_content CASCADE;
DROP TABLE IF EXISTS public.questionnaire_responses CASCADE;
DROP TABLE IF EXISTS public.questions_master CASCADE;
DROP TABLE IF EXISTS public.ghl_push_operations CASCADE;
DROP TABLE IF EXISTS public.ghl_custom_value_mappings CASCADE;
DROP TABLE IF EXISTS public.generated_css CASCADE;
DROP TABLE IF EXISTS public.generated_images CASCADE;
DROP TABLE IF EXISTS public.ghl_credentials CASCADE;
DROP TABLE IF EXISTS public.generated_content CASCADE;
DROP TABLE IF EXISTS public.slide_results CASCADE;
DROP TABLE IF EXISTS public.intake_answers CASCADE;
DROP TABLE IF EXISTS public.saved_sessions CASCADE;
DROP TABLE IF EXISTS public.user_funnels CASCADE;
DROP TABLE IF EXISTS public.ted_knowledge_base CASCADE;
DROP TABLE IF EXISTS public.transcript_metadata CASCADE;
DROP TABLE IF EXISTS public.rag_data CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
-- ============================================
-- STEP 3: CREATE ALL TABLES FIRST
-- ============================================
-- 3.1 USER PROFILES (Clerk-based authentication)
CREATE TABLE public.user_profiles (
    id TEXT PRIMARY KEY,
    -- Clerk user ID (e.g., "user_2abc123...")
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    -- Authorization
    is_admin BOOLEAN DEFAULT false,
    -- Subscription tier system (TedOS pricing)
    -- starter: $297/month - 1 funnel
    -- growth: $497/month - 3 funnels  
    -- scale: $997/month - 10 funnels
    subscription_tier TEXT DEFAULT 'starter' CHECK (
        subscription_tier IN ('starter', 'growth', 'scale')
    ),
    tier_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    -- Funnel limits (tier-based, admins bypass)
    max_funnels INTEGER DEFAULT 1,
    current_funnel_count INTEGER DEFAULT 0,
    -- Usage tracking
    last_generation_at TIMESTAMPTZ,
    total_generations INTEGER DEFAULT 0,
    -- GHL Sub-Account (auto-created on signup)
    ghl_location_id TEXT,
    ghl_location_name TEXT,
    ghl_location_created_at TIMESTAMPTZ,
    ghl_sync_status TEXT DEFAULT 'not_synced' CHECK (
        ghl_sync_status IN ('not_synced', 'pending', 'synced', 'failed')
    ),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_tier ON public.user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_ghl ON public.user_profiles(ghl_location_id)
WHERE ghl_location_id IS NOT NULL;
-- 3.2 USER FUNNELS (Marketing Engines)
CREATE TABLE public.user_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    -- Funnel identity (called "Marketing Engine" in frontend)
    funnel_name TEXT NOT NULL,
    funnel_description TEXT,
    -- ========================================
    -- WIZARD ANSWERS (All 20 questions stored as JSON)
    -- ========================================
    -- This stores ALL questionnaire answers including:
    -- Q1: businessType (dropdown)
    -- Q2: industry (text)
    -- Q3: idealClient (textarea)
    -- Q4: message (textarea)
    -- Q5: coreProblem (textarea)
    -- Q6: outcomes (textarea)
    -- Q7: uniqueAdvantage (textarea)
    -- Q8: Story - 6 sub-fields:
    --     - storyLowMoment (The Pit)
    --     - storyDiscovery (The Search)
    --     - storySearchAgain (Search Again)
    --     - storyBreakthrough (The Breakthrough)
    --     - storyBigIdea (The Big Idea)
    --     - storyResults (The Results)
    -- Q9: testimonials (textarea)
    -- Q10: offerProgram (textarea)
    -- Q11: deliverables (textarea)
    -- Q12: pricing (textarea)
    -- Q13: assets (multi-select)
    -- Q14: revenue (dropdown)
    -- Q15: brandVoice (textarea)
    -- Q16: brandColors (textarea)
    -- Q17: callToAction (textarea)
    -- Q18: platforms (multi-select)
    -- Q19: goal90Days (textarea)
    -- Q20: businessStage (dropdown)
    -- Q21: helpNeeded (textarea)
    wizard_answers JSONB DEFAULT '{}'::jsonb,
    -- Progress tracking
    questionnaire_completed BOOLEAN DEFAULT false,
    questionnaire_completed_at TIMESTAMPTZ,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER [] DEFAULT ARRAY []::INTEGER [],
    -- Vault generation status
    vault_generated BOOLEAN DEFAULT false,
    vault_generated_at TIMESTAMPTZ,
    vault_generation_status TEXT DEFAULT 'not_started' CHECK (
        vault_generation_status IN (
            'not_started',
            'generating',
            'completed',
            'failed'
        )
    ),
    -- Phase approvals
    phase1_approved BOOLEAN DEFAULT false,
    phase1_approved_at TIMESTAMPTZ,
    phase2_unlocked BOOLEAN DEFAULT false,
    phase2_unlocked_at TIMESTAMPTZ,
    -- AI regeneration tracking
    regeneration_counts JSONB DEFAULT '{}'::jsonb,
    -- Soft delete
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Only one active funnel per user (for now)
CREATE UNIQUE INDEX idx_unique_active_funnel ON public.user_funnels(user_id)
WHERE is_active = true
    AND is_deleted = false;
CREATE INDEX idx_user_funnels_user ON public.user_funnels(user_id);
-- 3.3 QUESTIONS MASTER (Template - not user-specific)
CREATE TABLE public.questions_master (
    id INTEGER PRIMARY KEY,
    step_number INTEGER NOT NULL,
    category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    input_type TEXT NOT NULL DEFAULT 'textarea',
    input_options JSONB,
    validation_rules JSONB,
    placeholder_text TEXT,
    help_text TEXT,
    display_order INTEGER NOT NULL,
    used_in_vault_sections TEXT [] DEFAULT ARRAY []::TEXT [],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_questions_master_step ON public.questions_master(step_number);
-- 3.4 QUESTIONNAIRE RESPONSES (Per-question storage - optional granular tracking)
CREATE TABLE public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    -- Flexible answer storage
    answer_text TEXT,
    answer_selection TEXT,
    answer_selections TEXT [],
    answer_json JSONB,
    answered_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_funnel_question UNIQUE (funnel_id, question_id)
);
CREATE INDEX idx_questionnaire_funnel ON public.questionnaire_responses(funnel_id);
CREATE INDEX idx_questionnaire_user ON public.questionnaire_responses(user_id);
-- 3.5 VAULT CONTENT (Section-level storage)
-- Section IDs: idealClient, message, offer, vsl, salesScripts, setterScript,
--              story, leadMagnet, facebookAds, emails, funnelCopy, bio,
--              appointmentReminders, media, sms
CREATE TABLE public.vault_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content JSONB NOT NULL,
    prompt_used TEXT,
    phase INTEGER DEFAULT 1,
    numeric_key INTEGER,
    status TEXT DEFAULT 'generated' CHECK (
        status IN (
            'generating',
            'generated',
            'approved',
            'needs_revision'
        )
    ),
    is_locked BOOLEAN DEFAULT false,
    is_current_version BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    parent_version_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(funnel_id, section_id, version)
);
CREATE INDEX idx_vault_content_funnel ON public.vault_content(funnel_id);
CREATE INDEX idx_vault_content_section ON public.vault_content(funnel_id, section_id);
CREATE INDEX idx_vault_content_user ON public.vault_content(user_id);
-- 3.6 VAULT CONTENT FIELDS (Granular field-level editing)
CREATE TABLE public.vault_content_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    field_id TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_value JSONB NOT NULL,
    field_type TEXT NOT NULL,
    field_metadata JSONB,
    is_custom BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    ai_feedback JSONB,
    display_order INTEGER DEFAULT 0,
    is_current_version BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(funnel_id, section_id, field_id, version)
);
CREATE INDEX idx_vault_fields_funnel_section ON public.vault_content_fields(funnel_id, section_id);
CREATE INDEX idx_vault_fields_user ON public.vault_content_fields(user_id);
-- 3.7 SAVED SESSIONS (Legacy)
CREATE TABLE public.saved_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    business_name TEXT,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER [] DEFAULT '{}',
    is_complete BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    answers JSONB DEFAULT '{}',
    generated_content JSONB DEFAULT '{}',
    results_data JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_saved_sessions_user ON public.saved_sessions(user_id);
-- 3.8 Legacy tables
CREATE TABLE public.intake_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    slide_id INTEGER NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.slide_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    slide_id INTEGER NOT NULL,
    ai_output JSONB NOT NULL DEFAULT '{}',
    approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.generated_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_data JSONB NOT NULL,
    needs_review BOOLEAN DEFAULT false,
    reviewed BOOLEAN DEFAULT false,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 3.9 GHL Integration
CREATE TABLE public.ghl_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    location_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.ghl_custom_value_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.saved_sessions(id) ON DELETE
    SET NULL,
        custom_values JSONB NOT NULL DEFAULT '{}',
        last_pushed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, funnel_id)
);
CREATE TABLE public.ghl_push_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    ghl_credential_id UUID REFERENCES public.ghl_credentials(id) ON DELETE
    SET NULL,
        operation_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        total_items INTEGER DEFAULT 0,
        completed_items INTEGER DEFAULT 0,
        failed_items INTEGER DEFAULT 0,
        custom_values_pushed JSONB DEFAULT '{}',
        errors JSONB DEFAULT '[]',
        warnings JSONB DEFAULT '[]',
        started_at TIMESTAMPTZ DEFAULT now(),
        completed_at TIMESTAMPTZ,
        duration_ms INTEGER
);
-- 3.9b GHL Agency Credentials (for YOUR agency OAuth token - NOT per-user)
-- This stores the agency-level OAuth token for creating sub-accounts
CREATE TABLE public.ghl_agency_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Agency identification
    agency_id TEXT NOT NULL UNIQUE,
    agency_name TEXT,
    -- OAuth tokens (for agency-level operations like sub-account creation)
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    -- Tracking
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Only one active agency credential at a time
CREATE UNIQUE INDEX idx_ghl_agency_active ON public.ghl_agency_credentials(is_active)
WHERE is_active = true;
-- 3.9c GHL Sub-Account Creation Logs (audit trail)
CREATE TABLE public.ghl_subaccount_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    -- Request details
    request_payload JSONB,
    -- Response details
    ghl_location_id TEXT,
    response_payload JSONB,
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ghl_subaccount_logs_user ON public.ghl_subaccount_logs(user_id);
-- 3.10 Media
CREATE TABLE public.generated_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    image_type TEXT NOT NULL,
    image_purpose TEXT,
    prompt_used TEXT,
    supabase_path TEXT,
    public_url TEXT NOT NULL,
    cloudinary_public_id TEXT,
    width INTEGER,
    height INTEGER,
    format TEXT DEFAULT 'png',
    file_size INTEGER,
    status TEXT DEFAULT 'generating',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.generated_css (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.saved_sessions(id) ON DELETE CASCADE,
    css_code TEXT NOT NULL,
    color_scheme JSONB NOT NULL,
    sections_covered TEXT [],
    is_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- ============================================
-- 3.11 RAG/VECTOR TABLES (Admin Knowledge Base)
-- ============================================
-- These store Ted's training content uploaded by admin
-- via transcript processing
CREATE TABLE public.transcript_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL CHECK (
        source_type IN ('youtube', 'manual', 'document', 'audio')
    ),
    source_url TEXT,
    raw_transcript TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    ),
    processing_error TEXT,
    tags TEXT [] DEFAULT ARRAY []::TEXT [],
    content_types TEXT [] DEFAULT ARRAY []::TEXT [],
    total_chunks INTEGER DEFAULT 0,
    processed_chunks INTEGER DEFAULT 0,
    -- Admin tracking
    uploaded_by TEXT,
    -- admin user_id who uploaded
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_transcript_status ON public.transcript_metadata(status);
CREATE INDEX idx_transcript_tags ON public.transcript_metadata USING GIN(tags);
-- Main knowledge base with vector embeddings
CREATE TABLE public.ted_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    transcript_id UUID REFERENCES public.transcript_metadata(id) ON DELETE CASCADE,
    -- Categorization for RAG retrieval
    content_category TEXT,
    -- e.g., 'ideal_client', 'offer', 'story', 'messaging'
    importance_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ted_knowledge_base_embedding_idx ON public.ted_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_kb_category ON public.ted_knowledge_base(content_category);
-- User-specific RAG data (for personalized content)
CREATE TABLE public.rag_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    content_type VARCHAR(100) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX rag_data_embedding_idx ON public.rag_data USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX rag_data_user_idx ON public.rag_data(user_id);
CREATE INDEX rag_data_funnel_idx ON public.rag_data(funnel_id);
-- ============================================
-- STEP 4: CREATE FUNCTIONS (AFTER tables exist)
-- ============================================
-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Admin check
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = current_setting('request.jwt.claims', true)::json->>'sub'
            AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Tier-based funnel limit check
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
IF v_is_admin = true THEN RETURN true;
END IF;
RETURN v_current_count < v_max_funnels;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Increment funnel count
CREATE OR REPLACE FUNCTION public.increment_funnel_count() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.user_profiles
SET current_funnel_count = current_funnel_count + 1
WHERE id = NEW.user_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Decrement funnel count on soft delete
CREATE OR REPLACE FUNCTION public.decrement_funnel_count() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.user_profiles
SET current_funnel_count = GREATEST(0, current_funnel_count - 1)
WHERE id = OLD.user_id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- STEP 5: CREATE TRIGGERS
-- ============================================
CREATE TRIGGER trigger_user_profiles_updated_at BEFORE
UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_user_funnels_updated_at BEFORE
UPDATE ON public.user_funnels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_questionnaire_updated_at BEFORE
UPDATE ON public.questionnaire_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER vault_content_updated_at BEFORE
UPDATE ON public.vault_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER vault_fields_updated_at BEFORE
UPDATE ON public.vault_content_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_ghl_credentials_updated_at BEFORE
UPDATE ON public.ghl_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_saved_sessions_updated_at BEFORE
UPDATE ON public.saved_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER increment_funnel_count_trigger
AFTER
INSERT ON public.user_funnels FOR EACH ROW EXECUTE FUNCTION public.increment_funnel_count();
CREATE TRIGGER decrement_funnel_count_trigger
AFTER
UPDATE ON public.user_funnels FOR EACH ROW
    WHEN (
        OLD.is_deleted = false
        AND NEW.is_deleted = true
    ) EXECUTE FUNCTION public.decrement_funnel_count();
-- ============================================
-- STEP 6: ROW LEVEL SECURITY (RLS)
-- ============================================
-- USER_PROFILES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR
SELECT USING (
        id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR
UPDATE USING (
        id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR
INSERT WITH CHECK (
        id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Admins view all profiles" ON public.user_profiles FOR
SELECT USING (is_admin());
CREATE POLICY "Service role bypass user_profiles" ON public.user_profiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- USER_FUNNELS
ALTER TABLE public.user_funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own funnels" ON public.user_funnels FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users create own funnels" ON public.user_funnels FOR
INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users update own funnels" ON public.user_funnels FOR
UPDATE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users delete own funnels" ON public.user_funnels FOR DELETE USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass user_funnels" ON public.user_funnels FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- QUESTIONNAIRE_RESPONSES
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own questionnaire" ON public.questionnaire_responses FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass questionnaire" ON public.questionnaire_responses FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- VAULT_CONTENT
ALTER TABLE public.vault_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vault content" ON public.vault_content FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass vault_content" ON public.vault_content FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- VAULT_CONTENT_FIELDS
ALTER TABLE public.vault_content_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vault fields" ON public.vault_content_fields FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass vault_fields" ON public.vault_content_fields FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- SAVED_SESSIONS
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.saved_sessions FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass saved_sessions" ON public.saved_sessions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- GHL TABLES
ALTER TABLE public.ghl_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own GHL creds" ON public.ghl_credentials FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass ghl_creds" ON public.ghl_credentials FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
ALTER TABLE public.ghl_custom_value_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own GHL mappings" ON public.ghl_custom_value_mappings FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass ghl_mappings" ON public.ghl_custom_value_mappings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
ALTER TABLE public.ghl_push_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own GHL ops" ON public.ghl_push_operations FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Service role bypass ghl_push" ON public.ghl_push_operations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- MEDIA TABLES
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own images" ON public.generated_images FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass images" ON public.generated_images FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- LEGACY TABLES
ALTER TABLE public.intake_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own intake" ON public.intake_answers FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass intake" ON public.intake_answers FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
ALTER TABLE public.slide_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own slides" ON public.slide_results FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass slides" ON public.slide_results FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own generated" ON public.generated_content FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Service role bypass generated" ON public.generated_content FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- RAG/VECTOR TABLES (user-specific)
ALTER TABLE public.rag_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own RAG data" ON public.rag_data FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
CREATE POLICY "Service role bypass rag_data" ON public.rag_data FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- ============================================
-- STEP 7: SEED TIER HELPER DATA
-- ============================================
-- This comment documents the tier configuration:
-- TedOS Starter: $297/month, 1 funnel (max_funnels = 1)
-- TedOS Growth: $497/month, 3 funnels (max_funnels = 3)
-- TedOS Scale: $997/month, 10 funnels (max_funnels = 10)
-- Admin: Unlimited (set max_funnels = 9999 manually)
-- When a user signs up or upgrades, set max_funnels like:
-- starter → max_funnels = 1
-- growth → max_funnels = 3
-- scale → max_funnels = 10
-- ============================================
-- STEP 8: VERIFICATION
-- ============================================
DO $$
DECLARE t_count INTEGER;
BEGIN
SELECT COUNT(*) INTO t_count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
RAISE NOTICE '============================================';
RAISE NOTICE 'DATABASE CREATION COMPLETE';
RAISE NOTICE '============================================';
RAISE NOTICE 'Tables created: %',
t_count;
RAISE NOTICE '============================================';
RAISE NOTICE 'USER ISOLATION: Via RLS policies';
RAISE NOTICE 'FUNNEL ISOLATION: Via user_id + funnel_id FK';
RAISE NOTICE '============================================';
RAISE NOTICE 'TIER SYSTEM:';
RAISE NOTICE '  TedOS Starter: $297/mo - 1 funnel';
RAISE NOTICE '  TedOS Growth: $497/mo - 3 funnels';
RAISE NOTICE '  TedOS Scale: $997/mo - 10 funnels';
RAISE NOTICE '============================================';
RAISE NOTICE 'QUESTIONNAIRE: 20 questions stored in';
RAISE NOTICE '  user_funnels.wizard_answers (JSONB)';
RAISE NOTICE '  Including Story with 6 sub-fields';
RAISE NOTICE '============================================';
RAISE NOTICE 'RAG/KNOWLEDGE BASE:';
RAISE NOTICE '  ted_knowledge_base - Admin uploaded content';
RAISE NOTICE '  transcript_metadata - Source tracking';
RAISE NOTICE '  rag_data - User-specific vectors';
RAISE NOTICE '============================================';
END $$;
-- ============================================
-- END OF SCHEMA
-- ============================================