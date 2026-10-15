# InternSync — Final Comprehensive Real-Product Audit

**Audit Date:** October 14, 2026  
**Auditor:** Antigravity AI Agent  
**Repository:** `https://github.com/Kushh-Santhosh/InternSync`  
**Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, Supabase (PostgreSQL + RLS + Auth + Storage), OpenRouter AI Router.

---

## 1. Executive Summary

This comprehensive audit was performed across all source files, documentation, migrations, server handlers, feature modules, test suites, and page components. 

The baseline codebase has a modern visual design, a deterministic 8-factor matching engine, and an OpenRouter model failover system. However, the audit revealed several critical production blockers:
1. **Simulated Authentication:** Login, signup, and OAuth buttons bypassed Supabase Auth entirely and generated mock IDs in `localStorage`.
2. **Hardcoded Demo Personas in Production Flows:** Rahul Sharma's identity, pre-filled projects, and hardcoded assessment scores leaked into real user states.
3. **Hardcoded Empty Projects in Live Matching:** The live search orchestrator (`orchestrator.ts`) explicitly passed `projects: []` when invoking `calculateMatch`, causing student projects to be ignored.
4. **Binary Document Parsing Deficiencies:** Resume parsing for `.docx` and `.pdf` files lacked proper format decoding, falling back to raw binary strings.
5. **Swallowed Search Errors:** `/api/search/live` silently caught all missing API key and upstream errors and returned 200 OK with empty arrays, disguising outages as "no internships found".
6. **Fake Controls in Settings & Applications:** Settings had hardcoded mock documents and a simulated password change that made no API calls. Application links marked jobs as "applied" automatically.
7. **Client Secret Exposure Risk & Unnecessary Integrations:** Settings exposed internal AI provider dashboards and GitHub OAuth mocks that were not requested.

---

## 2. Detailed Findings & Severity Matrix

| ID | Issue Description | Severity | Affected Files | Fix Required |
|---|---|---|---|---|
| **AUD-01** | **Simulated Auth & Missing Supabase Integration**<br>`login` and `signup` in `context.tsx` wrote arbitrary JSON to `localStorage` without calling Supabase Auth. Google and GitHub OAuth buttons signed in as fake mock accounts. | **CRITICAL (P0)** | `src/app/context.tsx`<br>`src/pages/auth/LoginPage.tsx`<br>`src/pages/auth/SignupPage.tsx` | Wire real `supabase.auth.signInWithPassword`, `signUp`, `signOut`, `getSession`, and `onAuthStateChange`. Detect missing Supabase configuration and display clear status instead of fake success. Remove fake OAuth handlers. |
| **AUD-02** | **Rahul Sharma & Seed Leakage into Real Accounts**<br>New users received default pre-filled skills, fake career directions, and 72% default readiness score even with zero evidence. | **CRITICAL (P0)** | `src/app/context.tsx`<br>`src/pages/dashboard/DashboardPage.tsx`<br>`src/pages/career/CareerDnaPage.tsx`<br>`src/pages/career/CareerPathsPage.tsx`<br>`src/pages/dream/DreamInternshipPage.tsx` | Isolate Demo Mode strictly behind an explicit toggle (`isDemoMode`). Real user accounts initialize completely blank (0 skills, 0 projects, 0 applications, 0% score). Compute career directions dynamically from user's actual profile. |
| **AUD-03** | **Hardcoded Empty Project Array in Matching Orchestrator**<br>`orchestrator.ts` lines 146 and 248 called `calculateMatch` with `projects: []`, completely bypassing student projects during live search matching. | **CRITICAL (P0)** | `src/features/opportunities/search/orchestrator.ts` | Pass `projects` from `useApp()` into `runDiscovery` and into each `calculateMatch` invocation so practical project evidence contributes to the 15% project weight. |
| **AUD-04** | **Fake .example.com Application URLs in Opportunities**<br>All 34 seed opportunities had fake domains (`demolabs.example.com`, etc.). Furthermore, clicking "Apply" in `OpportunityDetailPage.tsx` marked the application as `applied` automatically. | **HIGH (P1)** | `src/data/seed-opportunities.ts`<br>`src/pages/opportunities/OpportunityDetailPage.tsx` | Replace `.example.com` domains with valid target URLs in fixtures. Never automatically record an application as submitted when a student merely clicks an external link. |
| **AUD-05** | **Document Parsing Deficiencies & Artificial Delays**<br>PDF and DOCX uploads read binary content with `file.text()` instead of structured parsers. `ResumeUploadCard.tsx` used artificial `setTimeout` delays. | **HIGH (P1)** | `src/lib/documents/document-intelligence.ts`<br>`src/components/resume/ResumeUploadCard.tsx` | Implement real DOCX XML parser (`word/document.xml` via JSZip) and readable PDF stream text extractor. Upload files to Supabase Storage if configured. Remove artificial delays. |
| **AUD-06** | **Silent Error Swallowing in Live Search**<br>`/api/search/live` and providers caught all exceptions and returned `{ results: [] }` with HTTP 200, masking missing keys and rate limits. | **HIGH (P1)** | `src/server/api-handler.ts`<br>`src/features/opportunities/providers/OpenRouterWebProvider.ts`<br>`src/features/opportunities/search/orchestrator.ts` | Return typed error payloads (`status: 401`, `status: 503`, code `OPENROUTER_NOT_CONFIGURED`). Provide user-facing notification describing the exact service status. |
| **AUD-07** | **Fake Password Change & Mock Documents in Settings**<br>`SettingsPage.tsx` showed 3 hardcoded mock documents and `handleChangePassword` simply cleared inputs and showed a success toast. | **HIGH (P1)** | `src/pages/settings/SettingsPage.tsx` | Connect document tab to real uploaded user documents with Supabase Storage deletion. Implement real Supabase password update `supabase.auth.updateUser({ password })`. Remove internal provider/model config tabs. |
| **AUD-08** | **AI Assistant Defaulting to Hardcoded Demo Provider**<br>`getAIProvider()` always returned `DemoAIProvider` which answered with hardcoded responses mentioning VisionForge, Demo Labs, and fixed counts. | **MEDIUM (P2)** | `src/lib/ai/ai-client.ts`<br>`src/pages/assistant/AssistantPage.tsx` | Connect `AssistantToolExecutor` to live user Career DNA, real matches, and server-side model router via `/api/ai/chat` when OpenRouter is configured. |
| **AUD-09** | **Assessment Scores Invented for Unverified Skills**<br>`SkillLabPage.tsx` defaulted unverified skills to scores 86, 74, 43, 58. | **MEDIUM (P2)** | `src/pages/assessments/SkillLabPage.tsx` | Only show assessment scores when the student has actually taken the Skill Lab quiz. Distinguish unverified vs verified. |

---

## 3. Repair Roadmap

1. **Step 1: Real Supabase Auth & Account State Isolation**
   - Connect `src/lib/supabase/client.ts` to `src/app/context.tsx`.
   - Implement real email/password login, signup, session restoration, logout, and auth-state listener.
   - Sync authenticated student profile, skills, projects, and applications with Supabase database tables (`profiles`, `student_skills`, `projects`, `applications`).
   - Clean separation: Demo mode requires explicit activation; real users start blank.

2. **Step 2: Fix Matching Engine Orchestrator**
   - Update `OpportunitySearchOrchestrator.runDiscovery` to accept `projects: ProjectItem[]`.
   - Update both discovery loops to pass `projects` to `calculateMatch`.

3. **Step 3: Real Document Intelligence & Storage**
   - Implement DOCX parser via JSZip parsing `word/document.xml`.
   - Implement clean text extraction for PDF and plain text.
   - Support private Supabase Storage upload to `resumes` / `documents` bucket when configured.
   - Remove fake `setTimeout` network delays from `ResumeUploadCard.tsx`.

4. **Step 4: Honest Opportunity Search & Error Propagation**
   - Fix `/api/search/live` in `src/server/api-handler.ts` to return proper HTTP errors and distinct error codes when `OPENROUTER_API_KEY` is missing or fails.
   - Add `/api/search/adzuna` endpoint in `api-handler.ts` to securely query Adzuna server-side.
   - Handle provider outages without returning fake success.
   - Remove `.example.com` links and fake auto-application tracking.

5. **Step 5: Clean Student Settings & Privacy**
   - Remove internal AI models, API keys, and fake GitHub OAuth from `SettingsPage.tsx`.
   - Connect Settings to real user documents and real Supabase password change.

6. **Step 6: Real Career DNA, Skill Lab & Assistant Alignment**
   - Dynamic Career Direction generation based on actual student skills/interests.
   - Remove hardcoded scores from `SkillLabPage.tsx`.
   - Remove Rahul Sharma's hardcoded projects from `CareerDnaPage.tsx`, `CareerPathsPage.tsx`, and `DreamInternshipPage.tsx`.

7. **Step 7: Verification & Quality Gate**
   - Run typecheck, lint, and vitest unit/integration tests.
   - Ensure all acceptance criteria from the audit pass with zero regressions.

---

## 4. Final Implementation & Verification Report

### Genuinely Implemented Capabilities
- [x] **Real Supabase Auth Integration:** Full signup, email/password login, session restoration via `onAuthStateChange`, sign out, and password update via `supabase.auth.updateUser` in `src/app/context.tsx` and `src/pages/settings/SettingsPage.tsx`.
- [x] **Account Isolation & Blank Initial State:** Real accounts initialize with 0 skills, 0 projects, 0 applications, and 0% readiness. Rahul Sharma profile and seed data are strictly quarantined to explicit Interactive Demo Mode.
- [x] **Multi-Format Document Parsing:**
  - DOCX parsing via `JSZip` extracting XML content from `word/document.xml`.
  - PDF parser extracting text from literal strings and text operators (`Tj`, `TJ`, `BT ... ET`).
  - Strict upload security: rejects `.exe`, `.bat`, `.sh`, `.bin`, `.msi`, `.js`, caps files at 10MB, and flags image-only files requiring OCR.
  - Realistic confidence calculation: capped at measured 60–72% for resume mentions, avoiding keyword-stuffed inflation.
  - Supabase Storage integration uploading documents to private storage.
- [x] **Matching Engine with Real Project Evidence:**
  - `OpportunitySearchOrchestrator.runDiscovery` passes student's actual `projects` into `calculateMatch`.
  - Automated tests confirm project evidence actively and measurably increases match scores.
  - Hard academic standing / year mismatch gates enforce `SKIP` recommendation regardless of high skill match.
- [x] **Live Opportunity Discovery & Server-Side Security:**
  - `src/server/api-handler.ts` handles `/api/search/live` and `/api/search/adzuna` with sanitized prompt injection protection.
  - Internal server returns typed HTTP 503 (`OPENROUTER_NOT_CONFIGURED`) and 502 (`SEARCH_PROVIDER_ERROR`) instead of disguising failures as 200 OK with empty lists.
  - API keys and AI models remain strictly internal server-side implementation details.
- [x] **Honest Application Tracking & Portal Linking:**
  - Opening external application portals no longer auto-marks opportunities as `applied`. Explicit "Mark as Applied" and "Save to Pipeline" actions persist to Supabase.
  - Badging distinguishes `Verified Listing • Source` from `Demo Opportunity`.
- [x] **Student-Centric Settings:**
  - Real document management with upload and storage deletion.
  - Real Supabase password update.
  - Internal AI models, keys, and mock GitHub OAuth removed from user-facing screens.
- [x] **Truthful Skill Lab & Career DNA:**
  - Removed hardcoded default scores (86, 74, 43, 58). Unassessed skills honestly report "Not tested".
  - Quizzes for Python, React, SQL, and Machine Learning calculate and persist true normalized scores.
  - Career directions dynamically derived from student's actual skills and target roles.

### Commands Executed & Real Results
1. `npm run typecheck`:
   - Command: `tsc -b`
   - Result: **0 errors** (Clean exit code 0).
2. `npm run lint`:
   - Command: `oxlint`
   - Result: **0 errors, 7 non-blocking warnings** (Clean exit code 0).
3. `npm run test`:
   - Command: `vitest run`
   - Result: **7 test suites passed, 47 tests passed, 0 failed** (Clean exit code 0).
   - Test files:
     - `tests/unit/opportunity-persistence.test.ts` (6 passed)
     - `tests/unit/account-switching.test.ts` (3 passed)
     - `tests/unit/document-extraction.test.ts` (9 passed)
     - `tests/unit/real-product-pipeline.test.ts` (10 passed)
     - `tests/unit/live-search.test.ts` (8 passed)
     - `tests/unit/matching.test.ts` (6 passed)
     - `tests/unit/model-router.test.ts` (5 passed)
4. `npm run build`:
   - Command: `tsc -b && vite build`
   - Result: **Production client bundle built cleanly in `dist/`** (Clean exit code 0).
   - Bundle scan: No leaked OpenRouter keys, service role secrets, or client credentials found in `dist/`.

---

## 5. Phase 2 — Critical Post-Audit Bug Fixes & Verification

### Finding P2-01: Live-Opportunity Application Persistence Path
- **Defect:** Live opportunity discovery generated string IDs in the format `opp-live-<timestamp>-<index>`, whereas the Supabase database schema requires valid UUIDs for `opportunities.id` and `applications.opportunity_id`. Additionally, `database.ts` explicitly skipped persisting opportunities with `opp-live-` IDs and then attempted to insert an application foreign-key referencing that non-existent record. When loading applications, missing listing data was masked by fabricating a placeholder company ("Company"), a default match score (80), and an unverified recommendation (`APPLY NOW`).
- **Resolution:**
  - Implemented RFC 4122 compliant deterministic UUIDv5 generation in `src/lib/utils/uuid.ts` (`generateOpportunityId`) based on normalized canonical URLs or stable title+company signatures.
  - Rewrote `upsertUserApplication` in `src/lib/supabase/database.ts` to persist the opportunity in PostgreSQL *before* creating or updating the referencing application.
  - Implemented idempotent retry and on-conflict handling for both opportunities and applications.
  - Persisted original title, company, source, URL, status, and actual match score/recommendation.
  - Removed all fabricated default values: when a referenced opportunity cannot be loaded from the database, the system restores an honest unavailable state (score: 0, recommendation: `SKIP`, title: "Unavailable Listing", badged with `Listing Unavailable`), rather than fabricating details.
  - Added regression test suite `tests/unit/opportunity-persistence.test.ts` covering end-to-end saving, reloading, collision resistance, and graceful failure propagation.

### Finding P2-02: Account Switching & Session Isolation
- **Defect:** `context.tsx` conditionally replaced local user skills, projects, and applications only if the fetched server arrays were non-empty (`if (skills && skills.length > 0)`). Consequently, logging out of User A (who had skills/projects) and logging in as User B (who had no data) left User A's data visible in User B's dashboard. Furthermore, `localStorage` used global un-scoped keys, and signup assumed immediate authentication even when Supabase required email confirmation.
- **Resolution:**
  - Scoped all client cache keys to the authenticated user ID (`internsync_u_<userId>_*`).
  - Implemented unconditional state replacement upon authentication change: switching to a user with empty records unconditionally resets React state to empty arrays.
  - Handled logout and session expiry safely by flushing all user-scoped state.
  - Updated signup flow in `context.tsx` and `SignupPage.tsx` to inspect `data.session`. If Supabase requires email verification (`session === null`), the UI halts authentication and presents a verification instructions card rather than falsely entering the dashboard.
  - Added regression test suite `tests/unit/account-switching.test.ts` validating User A -> logout -> User B isolation and browser refresh session restoration.

### Finding P2-03: Document Extraction Integrity & Format Handling
- **Defect:** The previous PDF parser extracted text by scanning raw byte strings for PDF operators (`Tj`, `TJ`), which failed on standard compressed streams (`/FlateDecode`) and multi-page documents. Legacy binary files (`.doc`, `.ppt`) were passed into `JSZip`-based DOCX/PPTX parsers, which triggered unhandled decompression errors. Scanned image-only PDFs were not distinguished from readable text PDFs.
- **Resolution:**
  - Integrated `unpdf` for multi-page, compressed PDF text extraction, retaining a sliced buffer fallback for uncompressed streams.
  - Implemented scanned PDF detection (`isScanned: true`) when page text density is below threshold, surfacing an explicit "Scanned document requiring OCR" notice.
  - Implemented header validation (`0xD0CF11E0A1B11AE1`) in `docx-parser.ts` and `pptx-parser.ts` to detect and reject legacy binary formats with an actionable message prompting the student to save as modern `.docx` or `.pdf`.
  - Added server-side structured AI extraction endpoint `POST /api/ai/extract-resume` in `src/server/api-handler.ts` using the configured OpenRouter model router with prompt injection protection, schema validation, and strict distinction between explicit text evidence and unconfirmed claims.
  - Added regression test suite `tests/unit/document-extraction.test.ts` testing compressed PDFs, multi-page PDFs, scanned PDFs, empty PDFs, DOCX, PPTX, legacy `.doc`/`.ppt`, and corrupted files.

### Finding P2-04: Document Metadata & Preference Persistence
- **Defect:** Files uploaded to Supabase Storage were never tracked in a database table, preventing metadata restoration after session refresh. In `fetchUserProfile` and `upsertUserProfile`, `target_role` was hardcoded to "Frontend Developer" and `career_interests` was returned as `[]`.
- **Resolution:**
  - Created database migration `supabase/migrations/20261015_documents_and_preferences.sql` defining:
    - `public.documents` table with owner user ID, original filename, private storage path, content type, byte size, document type, processing status, and metadata JSON.
    - Added Row Level Security (RLS) policies for user-isolated select, insert, update, and delete.
    - Added `target_role`, `career_interests`, and `bio` columns to `public.profiles`.
    - Added `match_score` and `recommendation` columns to `public.applications`.
  - Implemented `insertUserDocumentMetadata`, `fetchUserDocuments`, and `deleteUserDocument` in `database.ts` and hooked them up to `useApp` and `SettingsPage.tsx`.
  - Updated `fetchUserProfile` and `upsertUserProfile` to persist and restore actual target roles, career interests, and bio without hardcoded defaults.

### Finding P2-05: Removal of Assumed Candidate Defaults
- **Defect:** Baseline profile templates defaulted students to 3rd year, B.Tech Computer Science, and specific preferences, falsely satisfying opportunity eligibility gates and inflating match scores for incomplete profiles.
- **Resolution:**
  - Replaced assumed defaults with `BLANK_STUDENT_PROFILE` (`src/data/blank-profile.ts`) with empty degree, `currentYear: 0`, and unfilled location.
  - Updated matching engine (`src/lib/matching/engine.ts`) to recognize unconfirmed academic standing, penalize eligibility scores (30-50%), record unconfirmed breakdown notes, and prevent `APPLY NOW` recommendations when prerequisites cannot be verified.
  - Enforced required academic inputs in `OnboardingPage.tsx` with clear validation indicators.

---

## 6. Verification Status & Outstanding Limitations

### Verified Workflows
- **Unit & Integration Test Suite:** 47 automated tests passing across 7 test files covering deterministic matching, live discovery, model routing, opportunity UUIDv5 persistence, account switching isolation, multi-page document parsing, and legacy format rejection.
- **Type Safety & Build:** Zero TypeScript compiler diagnostics (`tsc -b`); clean Vite production client bundle in `dist/`.
- **Security Audit:** Zero secrets or credentials present in client code or production bundle.

### Operational Requirements & Unverified External Services
- **Supabase Cloud Instance:** Full persistence of documents, applications, and profiles requires a live Supabase project with executed migrations (`20260329000001_initial_schema.sql` and `20261015_documents_and_preferences.sql`). When running locally without active Supabase credentials, InternSync safely operates in isolated demo mode or surfaces truthful configuration notices.
- **OpenRouter Live API:** Live AI search and structured resume extraction require an active `OPENROUTER_API_KEY` on the backend server. In the absence of an API key, the server returns an honest HTTP 503 (`OPENROUTER_NOT_CONFIGURED`) error rather than simulating fake results.
- **Adzuna API:** Live job search via Adzuna requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`. Unconfigured providers report provider downtime truthfully.


