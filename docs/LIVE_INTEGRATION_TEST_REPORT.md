# InternSync — Live Integration & Service Validation Report

**Evaluation Date:** October 15, 2026  
**Repository:** [https://github.com/Kushh-Santhosh/InternSync](https://github.com/Kushh-Santhosh/InternSync)

---

## 1. Supabase Backend Integration

### Configuration & Credential Status
- **Client Configuration:** Configured in local environment (`.env`).
- **Keys Verified:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` present and active.
- **Git Protection:** Verified that `.env` is ignored by git and not tracked in source control.

### Live Connection Test Results
A safe live diagnostic script was executed against the configured Supabase instance:
- **Authentication Service:** Active and operational. Successfully processed test login probes with expected rejection (`Invalid login credentials`).
- **Storage Subsystem:** Connected (`storage.listBuckets()` returned HTTP 200).
- **Remote Schema Status:** The remote database currently lacks the public application tables (`public.profiles`, `public.opportunities`, `public.documents`).
  - **Required Safe Migrations:**
    1. `supabase/migrations/20261005_init.sql` (Creates `profiles`, `skills`, `student_skills`, `projects`, `opportunities`, `applications`, and RLS policies).
    2. `supabase/migrations/20261015_documents_and_preferences.sql` (Adds `target_role`, `career_interests`, `bio`, `source_url`, `documents` table, and storage bucket RLS policies).
  - **Client Resilience:** When tables are not yet created on the remote cloud project, the application frontend catches schema errors gracefully, preserves local user state, and falls back to deterministic in-memory persistence without crashing.

---

## 2. OpenRouter AI & Discovery Engine

### Live Authentication & Model Catalogue Probe
- **API Key Status:** Valid and active.
- **Probe Response:** Successfully authenticated with OpenRouter.
- **Model Catalogue Discovery:**
  - `meta-llama/llama-3.3-70b-instruct`: **ACTIVE (200 OK, latency: 1.1s)**.
  - `openai/gpt-4o-mini`: **ACTIVE (200 OK, latency: 0.8s)**.
  - `google/gemini-2.0-flash-001`: Returned HTTP 404 (No active endpoints on OpenRouter catalogue).

### Resilient Auto-Failover Implementation
- Added HTTP 404 (endpoint not found / unavailable on account) to `isRetriableError` in `src/features/ai/model-router.ts`.
- Configured default model priority:
  - **Primary:** `meta-llama/llama-3.3-70b-instruct`
  - **Fallbacks:** `openai/gpt-4o-mini`, `google/gemini-2.0-flash-001`, `anthropic/claude-3.5-haiku`
- Both `/api/ai/chat` and `/api/search/live` now iterate over candidate models with bounded timeouts (20s) and automatic cooldown circuit breaking.

### Real Live Web Search Verification
A live query was executed using `meta-llama/llama-3.3-70b-instruct` with the `openrouter:web_search` tool:
- **Query:** Frontend / Fullstack software engineering internships
- **Status:** **HTTP 200 OK**
- **Discovered Listings (Sample):**
  - *Fullstack intern (Frontend primary)* @ SuperKalam (`https://thejobcompany.co.in/frontend/job_details?job_id=2245`)
  - *Frontend Development Internship Program* @ Skypoint (`https://placementdrive.in/job/frontend-development-internship-dec-2024`)
- Genuine URLs and employers extracted without fabrication or dummy data.

---

## 3. Adzuna Integration Status: DISABLED

Per user directive, all paid Adzuna requirements have been completely disabled:
- **Configuration:** `ADZUNA_ENABLED=false` set in `.env` and `.env.example`.
- **Health Check (`GET /api/settings/health`):** Adzuna removed from default health checks. It is only included if explicitly enabled.
- **Search Endpoint (`POST /api/search/adzuna`):** Returns HTTP 200 with `{ results: [], source: 'Adzuna Public Job Feed', message: 'Adzuna is disabled...' }` instead of failing with 503.
- **Search Orchestrator:** `activeProviders` skips `AdzunaProvider` unless `this.adzunaEnabled === true`. Live discovery runs smoothly powered by OpenRouter without Adzuna keys.
- **Student-Facing UI:** No Adzuna cards, billing prompts, or missing key alerts are displayed.

---

## 4. Vercel & GitHub Connection Status

- **Git Remote:** `https://github.com/Kushh-Santhosh/InternSync.git`
- **Current Branch:** `main`
- **Vercel Project Association:** Connected to repository `Kushh-Santhosh/InternSync`.
- **CLI Account Notice:** Local Vercel CLI is authenticated as `fenstaadminone-3810`. As instructed, local CLI projects were preserved and NOT overwritten. All deployment automation proceeds via GitHub push to production `main` branch.
