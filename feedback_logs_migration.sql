-- Create feedback_logs table for tracking AI refinement interactions
CREATE TABLE IF NOT EXISTS public.feedback_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES public.user_funnels(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL,
    session_id UUID,
    -- Optional link to saved_sessions if relevant
    -- Interaction details
    user_message TEXT,
    -- The prompt/feedback provided by user
    ai_response TEXT,
    -- The textual response from AI (if any, separate from content)
    -- Applied changes
    applied_changes JSONB,
    -- The actual structure applied
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS Policies
ALTER TABLE public.feedback_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own feedback logs" ON public.feedback_logs FOR
INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
CREATE POLICY "Users view own feedback logs" ON public.feedback_logs FOR
SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );
-- Service role bypass
CREATE POLICY "Service role manages feedback logs" ON public.feedback_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Index for analytics
CREATE INDEX idx_feedback_logs_user ON public.feedback_logs(user_id);
CREATE INDEX idx_feedback_logs_section ON public.feedback_logs(section_id);