import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import {
  normalizeUsername,
  validateUsername,
  getUsernameSyntheticEmail,
  isSyntheticEmail,
} from '../src/lib/supabase/auth-username.ts'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kkgnhoflqusupqnhgzkz.supabase.co'

let anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!anonKey || !serviceKey) {
  try {
    const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', { encoding: 'utf-8' })
    const parsed = JSON.parse(rawKeys)
    anonKey = anonKey || parsed.find((k: any) => k.name === 'anon')?.api_key
    serviceKey = serviceKey || parsed.find((k: any) => k.name === 'service_role')?.api_key
  } catch {
    // Continue with whatever is available
  }
}

if (!anonKey || !serviceKey) {
  throw new Error('Supabase anon or service_role key missing from environment or CLI')
}

const adminClient = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } })
const anonClient = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false } })

async function runVerification() {
  console.log('========================================================================')
  console.log(' USERNAME-BASED AUTH & DATA ISOLATION VERIFICATION SUITE')
  console.log('========================================================================\n')

  // 1. Test Input Validation & Normalization
  console.log('[Step 1] Testing username validation & normalization rules...')
  const invalidCases = [
    { u: 'ab', expected: false, reason: 'too short (<3 chars)' },
    { u: 'a'.repeat(31), expected: false, reason: 'too long (>30 chars)' },
    { u: 'john doe', expected: false, reason: 'contains space' },
    { u: 'user@name', expected: false, reason: 'contains @' },
    { u: 'admin', expected: false, reason: 'reserved keyword' },
    { u: 'internsync', expected: false, reason: 'reserved keyword' },
    { u: 'Valid_User_123', expected: true, reason: 'valid alphanumeric with underscore' },
  ]

  for (const c of invalidCases) {
    const res = validateUsername(c.u)
    if (res.valid !== c.expected) {
      throw new Error(`Validation failed for "${c.u}" (${c.reason}): expected ${c.expected}, got ${res.valid}`)
    }
  }
  console.log('✓ All username validation rules and reserved keyword protections passed.')

  // 2. Synthetic Email Mapping
  console.log('\n[Step 2] Testing synthetic email mapping...')
  const synthetic = getUsernameSyntheticEmail('Kushal_Sharma')
  if (synthetic !== 'kushal_sharma@demo.internsync.invalid') {
    throw new Error(`Unexpected synthetic email: ${synthetic}`)
  }
  if (!isSyntheticEmail(synthetic)) {
    throw new Error('isSyntheticEmail failed to identify synthetic identifier')
  }
  if (isSyntheticEmail('student@gmail.com')) {
    throw new Error('isSyntheticEmail falsely identified genuine email as synthetic')
  }
  console.log('✓ Synthetic identifier format verified: ' + synthetic)

  // 3. Provision User A and User B via RPC
  const ts = Date.now()
  const userAName = `kushal_alpha_${ts}`
  const userBName = `kushal_beta_${ts}`
  const passwordA = `A_${Math.random().toString(36).slice(2, 10)}!Aa1`
  const passwordB = `B_${Math.random().toString(36).slice(2, 10)}!Aa1`
  const wrongPassword = `Wrong_${Math.random().toString(36).slice(2, 10)}!Aa1`
  const diffPassword = `Diff_${Math.random().toString(36).slice(2, 10)}!Aa1`

  console.log(`\n[Step 3] Provisioning Account A (@${userAName}) and Account B (@${userBName})...`)

  const { data: rpcA, error: errA } = await anonClient.rpc('provision_username_student', {
    p_username: userAName,
    p_password: passwordA,
    p_full_name: 'Kushal Alpha Student',
  })
  if (errA || !rpcA?.success) throw new Error(`User A provisioning failed: ${errA?.message || rpcA?.error}`)
  console.log(`✓ Account A created: UserID ${rpcA.userId}, Email ${rpcA.email}`)

  const { data: rpcB, error: errB } = await anonClient.rpc('provision_username_student', {
    p_username: userBName,
    p_password: passwordB,
    p_full_name: 'Kushal Beta Student',
  })
  if (errB || !rpcB?.success) throw new Error(`User B provisioning failed: ${errB?.message || rpcB?.error}`)
  console.log(`✓ Account B created: UserID ${rpcB.userId}, Email ${rpcB.email}`)

  // 4. Test Duplicate Username Prevention
  console.log('\n[Step 4] Testing duplicate username prevention...')
  const { data: dupRpc } = await anonClient.rpc('provision_username_student', {
    p_username: userAName,
    p_password: diffPassword,
    p_full_name: 'Imposter Student',
  })
  if (dupRpc?.success) {
    throw new Error('Duplicate username was permitted! Expected conflict failure.')
  }
  console.log(`✓ Duplicate username "${userAName}" successfully rejected: "${dupRpc?.error}"`)

  // 5. Test Authenticated Sessions via signInWithPassword
  console.log('\n[Step 5] Signing in both accounts with their synthetic identifiers...')
  const clientA = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false } })
  const clientB = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false } })

  const { data: authA, error: signinErrA } = await clientA.auth.signInWithPassword({
    email: rpcA.email,
    password: passwordA,
  })
  if (signinErrA || !authA.user) throw new Error(`User A sign-in failed: ${signinErrA?.message}`)
  console.log(`✓ Account A authenticated (Session User: ${authA.user.id})`)

  const { data: authB, error: signinErrB } = await clientB.auth.signInWithPassword({
    email: rpcB.email,
    password: passwordB,
  })
  if (signinErrB || !authB.user) throw new Error(`User B sign-in failed: ${signinErrB?.message}`)
  console.log(`✓ Account B authenticated (Session User: ${authB.user.id})`)

  // 6. Test Invalid Password Rejection
  console.log('\n[Step 6] Testing invalid credentials rejection...')
  const { error: badAuthErr } = await anonClient.auth.signInWithPassword({
    email: rpcA.email,
    password: wrongPassword,
  })
  if (!badAuthErr) {
    throw new Error('Sign-in with invalid password unexpectedly succeeded!')
  }
  console.log(`✓ Invalid password correctly rejected: ${badAuthErr.message}`)

  // 7. Test Storage Upload & Cross-User Isolation
  console.log('\n[Step 7] Testing Document Upload & Cross-User Private Storage Isolation...')
  const docIdA = `doc-${ts}`
  const fileNameA = 'resume_alpha.pdf'
  const pathA = `${authA.user.id}/${docIdA}/${fileNameA}`
  const contentA = Buffer.from('%PDF-1.4\n%Resume Alpha\nSkills: React, TypeScript, Node.js')

  const { data: uploadA, error: uploadErrA } = await clientA.storage
    .from('documents')
    .upload(pathA, contentA, { contentType: 'application/pdf', upsert: true })

  if (uploadErrA) throw new Error(`Account A storage upload failed: ${uploadErrA.message}`)
  console.log(`✓ Account A successfully uploaded document to private storage: ${uploadA.path}`)

  // Account B attempts to read Account A's file
  console.log('Testing Account B unauthorized read of Account A document...')
  const { data: bReadAData, error: bReadAErr } = await clientB.storage
    .from('documents')
    .download(pathA)

  if (bReadAData && !bReadAErr) {
    throw new Error('SECURITY VIOLATION: Account B successfully read Account A private document!')
  }
  console.log('✓ Account B unauthorized read blocked by Storage RLS: access denied.')

  // Account B attempts to overwrite Account A's file
  console.log('Testing Account B unauthorized overwrite of Account A document...')
  const { error: bOverwriteErr } = await clientB.storage
    .from('documents')
    .upload(pathA, Buffer.from('Malicious payload'), { upsert: true })

  if (!bOverwriteErr) {
    throw new Error('SECURITY VIOLATION: Account B was able to overwrite Account A file!')
  }
  console.log('✓ Account B unauthorized overwrite blocked by Storage RLS: ' + bOverwriteErr.message)

  // 8. Clean Up Test Users
  console.log('\n[Step 8] Cleaning up test users and files...')
  await clientA.storage.from('documents').remove([pathA])
  await adminClient.auth.admin.deleteUser(rpcA.userId)
  await adminClient.auth.admin.deleteUser(rpcB.userId)
  console.log('✓ Test data and accounts cleaned up.')

  console.log('\n========================================================================')
  console.log(' ALL USERNAME-BASED AUTH & ISOLATION CHECKS PASSED PERFECTLY!')
  console.log('========================================================================\n')
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err)
  process.exit(1)
})
