-- ============================================================================
-- InternSync: Complete Idempotent Database & Storage Migration (All-In-One)
-- Run this script in your Supabase Project -> SQL Editor
-- Compatible with PostgreSQL 15+ / Supabase Cloud
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
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
    target_role TEXT DEFAULT '',
    career_interests TEXT[] DEFAULT '{}',
    bio TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure additional columns exist if profile was created earlier
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS career_interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- ============================================================================
-- 2. SKILLS TAXONOMY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}'
);

-- ============================================================================
-- 3. STUDENT SKILLS & EVIDENCE TABLE
-- ============================================================================
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

-- ============================================================================
-- 4. PROJECTS TABLE
-- ============================================================================
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

-- ============================================================================
-- 5. OPPORTUNITIES TABLE
-- ============================================================================
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
    source_url TEXT,
    source_domain TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    eligible_years INTEGER[] DEFAULT '{3, 4}',
    eligible_degrees TEXT[] DEFAULT '{B.Tech, BE, MCA}',
    required_skills TEXT[] NOT NULL,
    preferred_skills TEXT[] DEFAULT '{}',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_domain TEXT;

-- ============================================================================
-- 6. MATCH RESULTS TABLE
-- ============================================================================
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

-- ============================================================================
-- 7. APPLICATIONS PIPELINE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'preparing', 'applied', 'assessment', 'interview', 'offer', 'rejected')),
    notes TEXT,
    match_score INTEGER DEFAULT 0,
    recommendation TEXT DEFAULT 'APPLY NOW',
    applied_at TIMESTAMPTZ,
    next_action TEXT,
    next_action_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT 'APPLY NOW';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'applications_student_id_opportunity_id_key'
  ) THEN
    ALTER TABLE public.applications 
      ADD CONSTRAINT applications_student_id_opportunity_id_key 
      UNIQUE (student_id, opportunity_id);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN
    NULL;
END $$;

-- ============================================================================
-- 8. ASSESSMENT QUESTIONS & CONVERSATIONS TABLES
-- ============================================================================
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

CREATE TABLE IF NOT EXISTS public.assistant_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 9. USER-OWNED DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'presentation', 'report', 'certificate', 'transcript', 'other')),
    processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'parsing', 'parsed', 'failed', 'needs_ocr')),
    extracted_skills TEXT[] DEFAULT '{}',
    extracted_projects TEXT[] DEFAULT '{}',
    extracted_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) FOR TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Public read for catalogs
DROP POLICY IF EXISTS "Public read for opportunities" ON public.opportunities;
CREATE POLICY "Public read for opportunities" ON public.opportunities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for skills taxonomy" ON public.skills;
CREATE POLICY "Public read for skills taxonomy" ON public.skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for assessment questions" ON public.assessment_questions;
CREATE POLICY "Public read for assessment questions" ON public.assessment_questions FOR SELECT USING (true);

-- Authenticated opportunities insertion & updating (live discovery)
DROP POLICY IF EXISTS "Authenticated users can insert opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can insert opportunities" 
  ON public.opportunities FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can update opportunities" 
  ON public.opportunities FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Student ownership policies
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own skills" ON public.student_skills;
CREATE POLICY "Users can manage own skills" ON public.student_skills FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can manage own matches" ON public.match_results;
CREATE POLICY "Users can manage own matches" ON public.match_results FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can manage own applications" ON public.applications;
CREATE POLICY "Users can manage own applications" ON public.applications FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can manage own assistant chats" ON public.assistant_conversations;
CREATE POLICY "Users can manage own assistant chats" ON public.assistant_conversations FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents" ON public.documents FOR ALL USING (auth.uid() = student_id);

-- ============================================================================
-- 11. SUPABASE STORAGE BUCKET & STORAGE RLS POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can upload own documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can read own documents" ON storage.objects;
CREATE POLICY "Authenticated users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can update own documents" ON storage.objects;
CREATE POLICY "Authenticated users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can delete own documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
