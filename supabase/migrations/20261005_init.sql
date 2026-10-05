-- InternSync Database Schema Migration
-- Designed for PostgreSQL 15+ on Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    university TEXT NOT NULL,
    degree TEXT NOT NULL,
    branch TEXT NOT NULL,
    current_year INTEGER NOT NULL CHECK (current_year BETWEEN 1 AND 5),
    graduation_year INTEGER NOT NULL,
    location TEXT NOT NULL,
    preferred_locations TEXT[] DEFAULT '{}',
    work_mode_preference TEXT DEFAULT 'any' CHECK (work_mode_preference IN ('remote', 'onsite', 'hybrid', 'any')),
    available_from DATE,
    available_duration_months INTEGER DEFAULT 3,
    avatar_url TEXT,
    github_username TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Skills Taxonomy Table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}'
);

-- 3. Student Skills & Evidence Table
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    evidence_sources TEXT[] DEFAULT '{}',
    assessment_score INTEGER CHECK (assessment_score BETWEEN 0 AND 100),
    last_validated_at TIMESTAMPTZ,
    UNIQUE(student_id, skill_name)
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}',
    repository_url TEXT,
    live_url TEXT,
    evidence_strength TEXT DEFAULT 'moderate' CHECK (evidence_strength IN ('strong', 'moderate', 'limited')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_logo TEXT,
    role_title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    work_mode TEXT NOT NULL CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
    internship_duration_months INTEGER NOT NULL,
    stipend_amount INTEGER,
    stipend_currency TEXT DEFAULT 'INR',
    stipend_period TEXT DEFAULT 'month',
    application_url TEXT NOT NULL,
    source TEXT DEFAULT 'InternSync Direct',
    deadline TIMESTAMPTZ NOT NULL,
    eligible_years INTEGER[] DEFAULT '{3, 4}',
    eligible_degrees TEXT[] DEFAULT '{B.Tech, BE, MCA}',
    required_skills TEXT[] NOT NULL,
    preferred_skills TEXT[] DEFAULT '{}',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Match Results Table
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    overall_match_score INTEGER NOT NULL CHECK (overall_match_score BETWEEN 0 AND 100),
    skill_score INTEGER NOT NULL,
    eligibility_score INTEGER NOT NULL,
    project_score INTEGER NOT NULL,
    education_score INTEGER NOT NULL,
    experience_score INTEGER NOT NULL,
    location_score INTEGER NOT NULL,
    availability_score INTEGER NOT NULL,
    intent_score INTEGER NOT NULL,
    recommendation TEXT NOT NULL CHECK (recommendation IN ('APPLY NOW', 'PREPARE FIRST', 'SKIP')),
    why_matched TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    engine_version TEXT DEFAULT 'v1',
    calculated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, opportunity_id)
);

-- 7. Applications Pipeline Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'preparing', 'applied', 'assessment', 'interview', 'offer', 'rejected')),
    notes TEXT,
    applied_at TIMESTAMPTZ,
    next_action TEXT,
    next_action_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Assessment Questions Table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL,
    question TEXT NOT NULL,
    code_snippet TEXT,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

-- 9. Assistant Conversations Table
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- Public read for reference catalogs
CREATE POLICY "Public read for opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Public read for skills taxonomy" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read for assessment questions" ON public.assessment_questions FOR SELECT USING (true);

-- Student ownership policies
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own skills" ON public.student_skills FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own matches" ON public.match_results FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own applications" ON public.applications FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own assistant chats" ON public.assistant_conversations FOR ALL USING (auth.uid() = student_id);
