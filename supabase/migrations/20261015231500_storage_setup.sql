-- InternSync Database Migration: Storage Bucket & Object-Level Security Policies
-- Designed for Supabase Storage (PostgreSQL 15+)

-- 1. Create the private 'documents' storage bucket idempotently
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit per file
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

-- 2. Note: RLS is already enabled by Supabase on storage.objects by default.
-- (Executing ALTER TABLE storage.objects produces ERROR 42501: must be owner of table objects)

-- 3. Policy: Authenticated users can upload documents ONLY to their own folder (auth.uid()/<file>)
DROP POLICY IF EXISTS "Authenticated users can upload own documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Authenticated users can read/download ONLY their own documents
DROP POLICY IF EXISTS "Authenticated users can read own documents" ON storage.objects;
CREATE POLICY "Authenticated users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Authenticated users can update/replace ONLY their own documents
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

-- 6. Policy: Authenticated users can delete ONLY their own documents
DROP POLICY IF EXISTS "Authenticated users can delete own documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
