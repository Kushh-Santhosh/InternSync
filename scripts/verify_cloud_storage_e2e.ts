import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase URL or Anon Key');
  process.exit(1);
}

async function runCloudVerification() {
  console.log('=================================================================');
  console.log(' SUPABASE CLOUD PERSISTENCE, STORAGE & RLS END-TO-END VALIDATION');
  console.log('=================================================================');
  console.log(`Connecting to: ${SUPABASE_URL}`);

  // 1. Authenticated Student Client
  const studentClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 2. Anonymous / Unauthenticated Client (for intrusion & leakage checks)
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const studentEmail = process.env.TEST_STUDENT_EMAIL || 'internsync.test.a.1792086565384@gmail.com';
  const studentPassword = process.env.TEST_STUDENT_PASSWORD;

  if (!studentPassword) {
    console.warn('[INFO] TEST_STUDENT_PASSWORD environment variable not configured. Set TEST_STUDENT_PASSWORD to run manual cloud storage verification.');
    return;
  }

  const { data: authData, error: authErr } = await studentClient.auth.signInWithPassword({
    email: studentEmail,
    password: studentPassword,
  });

  if (authErr || !authData.user) {
    throw new Error(`Failed to sign in student: ${authErr?.message}`);
  }
  const student = authData.user;
  console.log(`✓ Student authenticated successfully!`);
  console.log(`  UID:   ${student.id}`);
  console.log(`  Email: ${student.email}`);
  console.log(`  Role:  ${student.role}`);

  console.log('\n[Phase 2] Verifying Student Profile in public.profiles...');
  const { data: profile, error: profileErr } = await studentClient
    .from('profiles')
    .upsert({
      id: student.id,
      full_name: 'Rahul Sharma (Test Persona)',
      university: 'Delhi Technological University',
      degree: 'B.Tech',
      branch: 'Computer Science',
      current_year: 3,
      graduation_year: 2026,
      location: 'New Delhi, India',
      target_role: 'Full Stack AI Engineer',
      career_interests: ['Web Development', 'Machine Learning', 'Cloud Architecture']
    })
    .select()
    .single();

  if (profileErr) {
    throw new Error(`Failed to establish student profile: ${profileErr.message}`);
  }
  console.log(`✓ Student profile verified (Name: ${profile.full_name}, Target: ${profile.target_role})`);

  console.log('\n[Phase 3] Testing Document Upload to Private "documents" Storage Bucket...');
  const timestamp = Date.now();
  const testFileName = `verified_eval_document_${timestamp}.txt`;
  const legitimatePath = `${student.id}/${testFileName}`;
  const fileContent = Buffer.from(
    `=== INTERNSYNC CANDIDATE EVIDENCE ===\nCandidate: Rahul Sharma\nRole: Full Stack AI Engineer\nProjects: InternSync Platform, Autonomous Matching Engine\nSkills: TypeScript, React, Python, PostgreSQL, Vector Search\nTimestamp: ${new Date().toISOString()}\n=====================================`
  );

  const { data: uploadResult, error: uploadErr } = await studentClient.storage
    .from('documents')
    .upload(legitimatePath, fileContent, {
      contentType: 'text/plain',
      upsert: true
    });

  if (uploadErr) {
    throw new Error(`Document upload to storage bucket failed: ${uploadErr.message}`);
  }
  console.log(`✓ File stored successfully in Supabase Storage!`);
  console.log(`  Storage Path: ${uploadResult.path}`);

  console.log('\n[Phase 4] Creating Document Metadata Record in public.documents...');
  const { data: docRecord, error: docErr } = await studentClient
    .from('documents')
    .insert({
      student_id: student.id,
      file_name: testFileName,
      storage_path: legitimatePath,
      content_type: 'text/plain',
      file_size: fileContent.length,
      document_type: 'resume',
      processing_status: 'parsed',
      extracted_skills: ['TypeScript', 'React', 'Python', 'PostgreSQL', 'Vector Search'],
      extracted_projects: ['InternSync Platform', 'Autonomous Matching Engine'],
      extracted_data: {
        candidate_name: 'Rahul Sharma',
        verified: true,
        evaluation_score: 94
      }
    })
    .select()
    .single();

  if (docErr || !docRecord) {
    throw new Error(`Failed to create document record in public.documents: ${docErr?.message}`);
  }
  console.log(`✓ Document metadata record inserted in database!`);
  console.log(`  Document ID: ${docRecord.id}`);
  console.log(`  Status:      ${docRecord.processing_status}`);
  console.log(`  Skills:      ${docRecord.extracted_skills.join(', ')}`);

  console.log('\n[Phase 5] Testing Authenticated Retrieval & Signed URL Generation...');
  const { data: downloadedBlob, error: downloadErr } = await studentClient.storage
    .from('documents')
    .download(legitimatePath);

  if (downloadErr || !downloadedBlob) {
    throw new Error(`Failed to download own document: ${downloadErr?.message}`);
  }
  const downloadedText = await downloadedBlob.text();
  console.log(`✓ Authenticated download succeeded! (${downloadedText.length} bytes read)`);

  const { data: signedUrlData, error: signedUrlErr } = await studentClient.storage
    .from('documents')
    .createSignedUrl(legitimatePath, 120);

  if (signedUrlErr || !signedUrlData?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${signedUrlErr?.message}`);
  }
  console.log(`✓ Signed URL generated successfully (expires in 120s)`);

  console.log('\n[Phase 6] Rigorous RLS & Cross-User Isolation Enforcement Tests...');

  // Test A: Can student upload outside their designated auth.uid() folder?
  const foreignUploadPath = `99999999-9999-9999-9999-999999999999/malicious_${timestamp}.txt`;
  const { error: crossFolderErr } = await studentClient.storage
    .from('documents')
    .upload(foreignUploadPath, Buffer.from('Intrusion attempt'));

  if (!crossFolderErr) {
    throw new Error('SECURITY VIOLATION: Student was allowed to upload to a foreign user folder!');
  }
  console.log(`✓ RLS Policy Check 1: Student blocked from writing to foreign folder (${crossFolderErr.message})`);

  // Test B: Can anonymous/unauthenticated user download student's document?
  const { data: anonDownload, error: anonDownloadErr } = await anonClient.storage
    .from('documents')
    .download(legitimatePath);

  if (anonDownload && !anonDownloadErr) {
    throw new Error('SECURITY VIOLATION: Unauthenticated user was able to download private document!');
  }
  console.log(`✓ RLS Policy Check 2: Anonymous user blocked from downloading document (${anonDownloadErr?.message || 'Unauthorized'})`);

  // Test C: Can anonymous/unauthenticated user query student's database record?
  const { data: anonDbRows } = await anonClient
    .from('documents')
    .select('*')
    .eq('id', docRecord.id);

  if (anonDbRows && anonDbRows.length > 0) {
    throw new Error('SECURITY VIOLATION: Unauthenticated user was able to read document metadata!');
  }
  console.log(`✓ RLS Policy Check 3: Anonymous database query returned 0 rows (database RLS active)`);

  // Test D: Can anonymous user delete student's storage object?
  const { error: _anonDeleteErr } = await anonClient.storage
    .from('documents')
    .remove([legitimatePath]);

  // Confirm document is still intact
  const { data: integrityCheck } = await studentClient.storage
    .from('documents')
    .download(legitimatePath);

  if (!integrityCheck) {
    throw new Error('SECURITY VIOLATION: Anonymous user deleted student storage object!');
  }
  console.log(`✓ RLS Policy Check 4: Anonymous delete attempt thwarted; file preserved`);

  console.log('\n[Phase 7] Clean Lifecycle Deletion Verification...');
  // Student deletes own storage object
  const { error: removeObjErr } = await studentClient.storage
    .from('documents')
    .remove([legitimatePath]);

  if (removeObjErr) {
    throw new Error(`Owner failed to delete storage file: ${removeObjErr.message}`);
  }
  console.log(`✓ Storage object deleted by owner`);

  // Student deletes database metadata
  const { error: removeRowErr } = await studentClient
    .from('documents')
    .delete()
    .eq('id', docRecord.id);

  if (removeRowErr) {
    throw new Error(`Owner failed to delete document metadata: ${removeRowErr.message}`);
  }
  console.log(`✓ Database record deleted by owner`);

  // Verify storage object no longer exists
  const { error: verifyDeletedErr } = await studentClient.storage
    .from('documents')
    .download(legitimatePath);

  if (!verifyDeletedErr) {
    throw new Error('Storage object still exists after owner deletion!');
  }
  console.log(`✓ Confirmed storage object is completely gone (returned 404/Not Found)`);

  console.log('\n=================================================================');
  console.log(' 🎉 ALL 7 PHASES PASSED WITH 100% SUCCESS — CLOUD IS FULLY READY!');
  console.log('=================================================================');
}

runCloudVerification().catch((err) => {
  console.error('\n❌ Cloud verification failed:', err);
  process.exit(1);
});
