import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load .env
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
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL');
  process.exit(1);
}

// Retrieve service role key in-memory via official CLI (never logged or printed)
let serviceRoleKey = '';
try {
  const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  });
  const parsed = JSON.parse(rawKeys);
  const found = parsed.find((k: { name: string; api_key?: string }) => k.name === 'service_role key' || k.name === 'service_role');
  if (found && found.api_key) {
    serviceRoleKey = found.api_key;
  }
} catch (e) {
  console.error('Failed to query service role key via CLI:', e);
}

if (!serviceRoleKey) {
  console.error('Could not obtain service role key from CLI');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function safeCleanup() {
  console.log('=== SAFELY CLEANING UP TEST RECORDS VIA OFFICIAL ADMIN API ===');

  // 1. Identify users
  const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    throw new Error(`Failed to list users: ${listErr.message}`);
  }

  const testUserIds: string[] = [];
  for (const u of listData.users) {
    // Strictly match test emails created during automated verification
    if (
      u.email?.startsWith('internsync.test.a.') ||
      u.email === 'internsync.student.a@gmail.com' ||
      u.email === 'internsync.student.b@gmail.com'
    ) {
      console.log(`Identified test user: ${u.email} (UID: ${u.id})`);
      testUserIds.push(u.id);
    } else {
      console.log(`PRESERVING non-test / owner user: ${u.email} (UID: ${u.id})`);
    }
  }

  // 2. Clean up test files in storage
  console.log('\nCleaning test files from storage...');
  for (const uid of testUserIds) {
    const { data: files } = await adminClient.storage.from('documents').list(uid);
    if (files && files.length > 0) {
      const paths = files.map(f => `${uid}/${f.name}`);
      console.log(`Removing ${paths.length} test storage files for ${uid}...`);
      await adminClient.storage.from('documents').remove(paths);
    }
  }

  // 3. Clean up test documents in public.documents
  console.log('Cleaning test rows from public.documents...');
  for (const uid of testUserIds) {
    const { error: delDocErr } = await adminClient
      .from('documents')
      .delete()
      .eq('student_id', uid);
    if (delDocErr) {
      console.warn(`Warning deleting documents for ${uid}:`, delDocErr.message);
    }
  }

  // 4. Clean up test profiles
  console.log('Cleaning test rows from public.profiles...');
  for (const uid of testUserIds) {
    const { error: delProfErr } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', uid);
    if (delProfErr) {
      console.warn(`Warning deleting profile for ${uid}:`, delProfErr.message);
    }
  }

  // 5. Delete test users via official Supabase Auth Administration API
  console.log('Deleting test users via official auth.admin.deleteUser()...');
  for (const uid of testUserIds) {
    const { error: delUserErr } = await adminClient.auth.admin.deleteUser(uid);
    if (delUserErr) {
      console.error(`Error deleting user ${uid}:`, delUserErr.message);
    } else {
      console.log(`✓ Deleted test auth user ${uid}`);
    }
  }

  console.log('\n✓ Cleanup complete. Checking remaining state...');
  const { data: remainingUsers } = await adminClient.auth.admin.listUsers();
  console.log(`Remaining auth users: ${remainingUsers?.users.length || 0}`);

  const { data: remainingDocs } = await adminClient.from('documents').select('id');
  console.log(`Remaining documents: ${remainingDocs?.length || 0}`);

  const { data: remainingProfiles } = await adminClient.from('profiles').select('id');
  console.log(`Remaining profiles: ${remainingProfiles?.length || 0}`);
}

safeCleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
