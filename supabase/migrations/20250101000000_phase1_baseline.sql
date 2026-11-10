-- Phase 1: Foundational Architecture & Core Voice Engine
-- Database schema for AI Mock Interview Platform

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profile metadata synced from Supabase Auth.';

-- ============================================================================
-- 2. INTERVIEW CONFIGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_title TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'Software Engineering',
    experience_level TEXT NOT NULL CHECK (experience_level IN ('intern', 'junior', 'mid', 'senior', 'lead', 'executive')),
    technical_stack TEXT[] DEFAULT ARRAY[]::TEXT[],
    interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'system_design', 'mixed')),
    system_prompt TEXT,
    vapi_assistant_id TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    is_template BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.interview_configs IS 'Interview setup blueprints, voice assistant configs, and parameters.';

-- ============================================================================
-- 3. INTERVIEW SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES public.interview_configs(id) ON DELETE SET NULL,
    session_status TEXT NOT NULL DEFAULT 'idle' CHECK (session_status IN ('idle', 'connecting', 'active', 'interrupted', 'completed', 'failed', 'cancelled')),
    vapi_call_id TEXT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    transcript JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.interview_sessions IS 'Live and recorded mock interview instances for both auth users and guests.';

-- ============================================================================
-- 4. INTERVIEW FEEDBACK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score NUMERIC(4, 2) CHECK (overall_score >= 0 AND overall_score <= 100),
    technical_score NUMERIC(4, 2) CHECK (technical_score >= 0 AND technical_score <= 100),
    communication_score NUMERIC(4, 2) CHECK (communication_score >= 0 AND communication_score <= 100),
    confidence_score NUMERIC(4, 2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
    weaknesses TEXT[] DEFAULT ARRAY[]::TEXT[],
    key_takeaways TEXT,
    detailed_critique JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.interview_feedback IS 'AI generated evaluation and performance breakdown for completed sessions.';

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_interview_configs_user_id ON public.interview_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_vapi_call_id ON public.interview_sessions(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_session_id ON public.interview_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_user_id ON public.interview_feedback(user_id);

-- ============================================================================
-- 6. PROFILE AUTO-SYNC TRIGGER (auth.users -> public.profiles)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- Authenticated users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Authenticated users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- INTERVIEW CONFIGS POLICIES
-- ----------------------------------------------------------------------------
-- Authenticated users can do full CRUD on configs matching their auth.uid()
CREATE POLICY "Authenticated users can select own configs"
    ON public.interview_configs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert own configs"
    ON public.interview_configs
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update own configs"
    ON public.interview_configs
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete own configs"
    ON public.interview_configs
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Guest/Unauthenticated users can read public templates or guest configs (user_id IS NULL)
CREATE POLICY "Guests can view public configs or guest configs"
    ON public.interview_configs
    FOR SELECT
    TO anon
    USING (user_id IS NULL OR is_template = true);

-- Guest users can create anonymous configs where user_id IS NULL
CREATE POLICY "Guests can insert configs where user_id is null"
    ON public.interview_configs
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- ----------------------------------------------------------------------------
-- INTERVIEW SESSIONS POLICIES
-- ----------------------------------------------------------------------------
-- Authenticated users can do full CRUD on sessions matching their auth.uid()
CREATE POLICY "Authenticated users can select own sessions"
    ON public.interview_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert own sessions"
    ON public.interview_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update own sessions"
    ON public.interview_sessions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete own sessions"
    ON public.interview_sessions
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Guest/Unauthenticated users can view sessions where user_id IS NULL (their anonymous browser session)
CREATE POLICY "Guests can select sessions where user_id is null"
    ON public.interview_sessions
    FOR SELECT
    TO anon
    USING (user_id IS NULL);

-- Guest/Unauthenticated users can insert sessions where user_id IS NULL
CREATE POLICY "Guests can insert sessions where user_id is null"
    ON public.interview_sessions
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- Guest/Unauthenticated users can update sessions where user_id IS NULL (e.g. updating transcript/status)
CREATE POLICY "Guests can update sessions where user_id is null"
    ON public.interview_sessions
    FOR UPDATE
    TO anon
    USING (user_id IS NULL)
    WITH CHECK (user_id IS NULL);

-- ----------------------------------------------------------------------------
-- INTERVIEW FEEDBACK POLICIES
-- ----------------------------------------------------------------------------
-- Authenticated users can view feedback on their sessions
CREATE POLICY "Authenticated users can select own feedback"
    ON public.interview_feedback
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert own feedback"
    ON public.interview_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update own feedback"
    ON public.interview_feedback
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Guest users can view feedback where user_id IS NULL
CREATE POLICY "Guests can select feedback where user_id is null"
    ON public.interview_feedback
    FOR SELECT
    TO anon
    USING (user_id IS NULL);

-- Guest users can insert feedback where user_id IS NULL
CREATE POLICY "Guests can insert feedback where user_id is null"
    ON public.interview_feedback
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);
