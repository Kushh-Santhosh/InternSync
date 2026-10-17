-- InternSync Database Migration: Documents, Career Preferences, and Opportunity Persistence
-- PostgreSQL 15+ compatible for Supabase

-- 1. Ensure Profiles table stores target role, career interests, and bio
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS career_interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- 2. Opportunities table enhancements for live discovered listings
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_domain TEXT;

-- Enable authenticated users to insert & update discovered opportunities
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'opportunities' AND policyname = 'Authenticated users can insert opportunities'
  ) THEN
    CREATE POLICY "Authenticated users can insert opportunities" 
      ON public.opportunities FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'opportunities' AND policyname = 'Authenticated users can update opportunities'
  ) THEN
    CREATE POLICY "Authenticated users can update opportunities" 
      ON public.opportunities FOR UPDATE 
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 3. Applications table enhancements for persisted match results & idempotent saves
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT 'APPLY NOW';

-- Ensure unique application per student + opportunity for idempotent upsert
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

-- 4. User-owned Documents Table
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

-- RLS for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'Users can manage own documents'
  ) THEN
    CREATE POLICY "Users can manage own documents" 
      ON public.documents FOR ALL 
      USING (auth.uid() = student_id);
  END IF;
END $$;
