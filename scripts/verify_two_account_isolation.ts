import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const SUPABASE_URL = 'https://kkgnhoflqusupqnhgzkz.supabase.co'
let anonKey = process.env.VITE_SUPABASE_ANON_KEY
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!anonKey || !serviceKey) {
  try {
    const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', { encoding: 'utf-8' })
    const parsed = JSON.parse(rawKeys)
    anonKey = anonKey || parsed.find((k: any) => k.name === 'anon')?.api_key
    serviceKey = serviceKey || parsed.find((k: any) => k.name === 'service_role' || k.name === 'service_role key')?.api_key
  } catch {}
}

if (!anonKey || !serviceKey) {
  throw new Error('Could not find Supabase anon or service_role key')
}

const adminClient = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } })

async function runIsolationVerification() {
  console.log('========================================================================')
  console.log(' PART 3: TWO-ACCOUNT RIGOROUS DATA & STORAGE ISOLATION VERIFICATION')
  console.log('========================================================================\n')

  const userAEmail = 'ananya.design.student@internsync.dev'
  const userBEmail = 'priya.nair.student@internsync.dev'
  const userAPassword = process.env.TEST_USER_A_PASSWORD || `UserA_${Math.random().toString(36).slice(2, 10)}!Aa1`
  const userBPassword = process.env.TEST_USER_B_PASSWORD || `UserB_${Math.random().toString(36).slice(2, 10)}!Aa1`

  const userAUid = 'a7def223-cd31-4d38-b1b4-b81cf40c7968'
  const userBUid = '4d1aa223-819a-4725-9ecd-68d55fbcac40'

  // Ensure passwords are set for both accounts
  await adminClient.auth.admin.updateUserById(userAUid, { password: userAPassword })
  await adminClient.auth.admin.updateUserById(userBUid, { password: userBPassword })
  console.log('✓ Passwords configured for both authorized test accounts')

  // Create isolated clients for User A and User B
  const clientA = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const clientB = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })

  // 1. Authenticate Account A
  console.log('\n[Step 1] Authenticating Account A (Ananya Sen)...')
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  })
  if (errA || !authA.user) throw new Error(`Auth A failed: ${errA?.message}`)
  console.log(`✓ Account A signed in (UID: ${authA.user.id}, Email: ${authA.user.email})`)

  // 2. Upload Genuine Document for Account A
  console.log('\n[Step 2] Uploading Document for Account A...')
  const docIdA = 'a1a1a1a1-1111-4444-aaaa-111111111111'
  const fileNameA = 'ananya_sen_design_portfolio_resume.pdf'
  const pathA = `${authA.user.id}/${docIdA}/${fileNameA}`
  const contentA = Buffer.from('%PDF-1.4\n%Ananya Sen Design Resume\nSkills: Figma, UI/UX Design, CSS Architecture, React')

  const { data: uploadA, error: uploadErrA } = await clientA.storage
    .from('documents')
    .upload(pathA, contentA, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadErrA) throw new Error(`Account A upload failed: ${uploadErrA.message}`)
  console.log(`✓ Document uploaded to Account A private path: ${uploadA.path}`)

  // Insert metadata in public.documents
  const { data: metaA, error: metaErrA } = await clientA
    .from('documents')
    .insert({
      id: docIdA,
      student_id: authA.user.id,
      file_name: fileNameA,
      storage_path: pathA,
      content_type: 'application/pdf',
      file_size: contentA.length,
      document_type: 'resume',
      processing_status: 'parsed',
      extracted_skills: ['Figma', 'UI/UX Design', 'CSS Architecture', 'React'],
    })
    .select()
    .single()
  if (metaErrA) throw new Error(`Account A metadata insert failed: ${metaErrA.message}`)
  console.log(`✓ Account A metadata inserted (Doc ID: ${metaA.id})`)

  // Verify Account A can read own document
  const { data: readA, error: readErrA } = await clientA.storage.from('documents').download(pathA)
  if (readErrA || !readA) throw new Error(`Account A could not read own document: ${readErrA?.message}`)
  console.log(`✓ Account A successfully downloaded own document (${(await readA.text()).length} bytes)`)

  // 3. Authenticate Account B
  console.log('\n[Step 3] Authenticating Account B (Priya Nair)...')
  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: userBEmail,
    password: userBPassword,
  })
  if (errB || !authB.user) throw new Error(`Auth B failed: ${errB?.message}`)
  console.log(`✓ Account B signed in (UID: ${authB.user.id}, Email: ${authB.user.email})`)

  // 4. Cross-User Intrusion & Isolation Checks
  console.log('\n[Step 4] Enforcing Cross-User Security Restrictions...')

  // Test 4A: Account B attempts to download Account A's private resume
  const { data: bReadA, error: bReadAErr } = await clientB.storage.from('documents').download(pathA)
  if (bReadA && !bReadAErr) {
    throw new Error('SECURITY VIOLATION: Account B was able to download Account A private resume!')
  }
  console.log(`✓ Check 4A: Account B BLOCKED from downloading Account A file (${bReadAErr?.message || 'Empty blob'})`)

  // Test 4B: Account B attempts to query Account A's document metadata row
  const { data: bMetaA } = await clientB.from('documents').select('*').eq('id', docIdA)
  if (bMetaA && bMetaA.length > 0) {
    throw new Error('SECURITY VIOLATION: Account B was able to query Account A document metadata!')
  }
  console.log(`✓ Check 4B: Account B BLOCKED from viewing Account A metadata (Returned 0 rows)`)

  // Test 4C: Account B attempts to overwrite Account A's file
  const { error: bOverwriteErr } = await clientB.storage
    .from('documents')
    .upload(pathA, Buffer.from('Malicious overwrite'), { upsert: true })
  if (!bOverwriteErr) {
    throw new Error('SECURITY VIOLATION: Account B was able to overwrite Account A file!')
  }
  console.log(`✓ Check 4C: Account B BLOCKED from overwriting Account A file (${bOverwriteErr.message})`)

  // Test 4D: Account B attempts to delete Account A's file
  const { error: bDeleteErr } = await clientB.storage.from('documents').remove([pathA])
  // Verify Account A file is still fully intact
  const { data: integrityCheck } = await clientA.storage.from('documents').download(pathA)
  if (!integrityCheck) {
    throw new Error('SECURITY VIOLATION: Account B deleted Account A file!')
  }
  console.log(`✓ Check 4D: Account B BLOCKED from deleting Account A file (File preserved intact)`)

  // 5. Account B uploads own document
  console.log('\n[Step 5] Account B uploading own genuine resume...')
  const docIdB = 'b2b2b2b2-2222-4444-bbbb-222222222222'
  const fileNameB = 'priya_nair_backend_systems_resume.pdf'
  const pathB = `${authB.user.id}/${docIdB}/${fileNameB}`
  const contentB = Buffer.from('%PDF-1.4\n%Priya Nair Backend Resume\nSkills: Go, PostgreSQL, Distributed Systems, Docker')

  const { data: uploadB, error: uploadErrB } = await clientB.storage
    .from('documents')
    .upload(pathB, contentB, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadErrB) throw new Error(`Account B upload failed: ${uploadErrB.message}`)
  console.log(`✓ Document uploaded to Account B private path: ${uploadB.path}`)

  // Insert metadata for Account B
  const { data: metaB, error: metaErrB } = await clientB
    .from('documents')
    .insert({
      id: docIdB,
      student_id: authB.user.id,
      file_name: fileNameB,
      storage_path: pathB,
      content_type: 'application/pdf',
      file_size: contentB.length,
      document_type: 'resume',
      processing_status: 'parsed',
      extracted_skills: ['Go', 'PostgreSQL', 'Distributed Systems', 'Docker'],
    })
    .select()
    .single()
  if (metaErrB) throw new Error(`Account B metadata insert failed: ${metaErrB.message}`)
  console.log(`✓ Account B metadata inserted (Doc ID: ${metaB.id})`)

  // Confirm Account A CANNOT read Account B's file
  const { data: aReadB, error: aReadBErr } = await clientA.storage.from('documents').download(pathB)
  if (aReadB && !aReadBErr) {
    throw new Error('SECURITY VIOLATION: Account A was able to download Account B file!')
  }
  console.log(`✓ Check 5B: Account A BLOCKED from downloading Account B file (${aReadBErr?.message || 'Empty blob'})`)

  // 6. Clean up test records
  console.log('\n[Step 6] Cleaning up test artifacts created during audit...')
  await clientA.storage.from('documents').remove([pathA])
  await clientA.from('documents').delete().eq('id', docIdA)
  await clientB.storage.from('documents').remove([pathB])
  await clientB.from('documents').delete().eq('id', docIdB)
  console.log('✓ Cleaned up test files and document records for both accounts.')

  console.log('\n========================================================================')
  console.log(' 🎉 TWO-ACCOUNT USER DATA ISOLATION FULLY VERIFIED & CONFIRMED!')
  console.log('========================================================================')
}

runIsolationVerification().catch((err) => {
  console.error('\n❌ Isolation verification failed:', err)
  process.exit(1)
})
