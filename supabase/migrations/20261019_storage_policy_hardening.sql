-- InternSync Database Migration: Storage Policy Hardening & Ownership Path Alignment
-- Migration: 20261019_storage_policy_hardening.sql
-- Bucket: documents (private)
-- Upload path format: {authenticated_user_id}/{document_id}/{safe_filename}

-- 1. Ensure the private 'documents' storage bucket exists with explicit restrictions
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

-- 2. Drop existing policies to ensure clean idempotent re-application
DROP POLICY IF EXISTS "Authenticated users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own documents" ON storage.objects;

-- 3. Policy: Authenticated users can upload documents ONLY into their own folder ({auth.uid()}/...)
CREATE POLICY "Authenticated users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Authenticated users can read/download ONLY their own documents
CREATE POLICY "Authenticated users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Authenticated users can update/replace ONLY their own documents (supports upsert: true)
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
CREATE POLICY "Authenticated users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
