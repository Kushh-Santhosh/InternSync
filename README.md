# InternSync 🎯

> **Understand your fit. Improve your profile. Find the right internship.**

InternSync is a competition-grade, AI-powered internship opportunity-readiness platform for students. Rather than acting as a simple search aggregator, InternSync analyzes a student's complete profile, validates skill claims with project and code evidence, evaluates strict academic eligibility, explains why roles match or mismatch, categorizes opportunities into **APPLY / PREPARE / SKIP**, and generates tailored 14-day skill-gap preparation plans.

---

## ✨ Key Features

1. **🧬 Career DNA Engine**
   Multi-dimensional capability scoring (Software Engineering, AI/ML, Full-Stack, Data Science) synthesized from coursework, projects, GitHub signals, and assessments.

2. **🔍 Evidence-Based Skill Verification**
   Skills are backed by multi-source evidence (Resume, Projects, GitHub repositories, and Skill Lab assessments) with confidence ratings (Strong, Moderate, Limited).

3. **📊 Explainable Deterministic Matching**
   Weighted scoring engine evaluating 8 distinct vectors:
   - Skill Compatibility: 30%
   - Academic Eligibility: 20%
   - Project Evidence: 15%
   - Education: 10%
   - Experience: 10%
   - Location: 5%
   - Availability: 5%
   - Career Intent: 5%

4. **⚡ Tri-State Decision Engine**
   - **APPLY NOW:** High match (>=80%) with full eligibility satisfied.
   - **PREPARE FIRST:** 60–79% match with addressable gaps and a generated 14-day study plan.
   - **SKIP:** Ineligible or poor alignment, saving students valuable time.

5. **📅 14-Day Preparation Roadmaps**
   Actionable daily study sprints with exercises, curated resources, and milestone checkpoints for target opportunities.

6. **⚖️ 3-Way Opportunity Comparison**
   Side-by-side comparative analysis matrix with AI-generated trade-off recommendations.

7. **🧪 Skill Lab (Adaptive Assessments)**
   Signal tests covering Python, React, TypeScript, SQL, and AI/ML to boost skill confidence.

8. **📋 Kanban Application Tracker**
   Full application lifecycle management across 7 stages: *Saved*, *Preparing*, *Applied*, *Assessment*, *Interview*, *Offer*, *Rejected*.

9. **💬 AI Career Assistant**
   Context-aware conversational advisor grounded in the student's live Career DNA and ingested opportunities.

10. **🚀 100% Offline Demo Mode**
    Runs out-of-the-box with high-fidelity seed data (34 opportunities across India & Remote) even if external Supabase or AI keys are absent.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Lucide React, Radix UI patterns
- **Backend & Database:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **AI Engine:** Provider abstraction supporting Google Gemini, OpenRouter, and a deterministic local fallback
- **Testing & Tooling:** Vitest, Testing Library, Oxlint

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested on Node 20+)
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/your-username/InternSync.git
cd InternSync
npm install
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Note: If left unconfigured, InternSync offers an explicit, isolated **Interactive Demo Mode** for demonstration purposes without writing mock data to production accounts).*

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Running Tests & Quality Checks
```bash
npm run typecheck   # Strict TypeScript check (0 errors)
npm run lint        # Oxlint linting (0 errors)
npm run test        # Vitest unit & integration suite (47 tests passing across 7 suites)
npm run test:e2e    # Playwright browser E2E suite (50 tests passing across Desktop & Mobile)
npm run build       # Production bundle build
```

---

## 🛠️ Real Product Implementation & Architecture

### Verified Production Capabilities
1. **Real Supabase Authentication & Multi-Tenant Isolation:**
   - Full signup, login, session restoration, logout, and password updates backed by Supabase Auth.
   - Strict Row Level Security (RLS) ensuring student profiles, uploaded documents, skill evidence, projects, and applications remain strictly private to the authenticated owner.
2. **Multi-Format Document Parsing & Intelligence:**
   - Client-side format parsers for **PDF** (literal strings, Tj/TJ stream operators), **DOCX** (JSZip XML extraction from `word/document.xml`), **PPTX** (`ppt/slides/slide*.xml`), and **TXT**.
   - Strict security validation: rejects dangerous executables (`.exe`, `.sh`, `.bat`), enforces 10MB upload limits, and accurately flags image-based documents requiring OCR.
   - Honest, measured skill confidence (60–72% baseline for resume claims; no fabricated 90%+ scores for keyword mentions).
3. **Deterministic 8-Factor Matching Engine:**
   - Explainable scoring: Skills (30%), Eligibility (20%), Project Evidence (15%), Education (10%), Experience (10%), Location (5%), Availability (5%), Intent (5%).
   - Hard academic eligibility gates (e.g. academic standing / year mismatch strictly yields **SKIP** recommendation regardless of high skill match).
   - Project evidence actively increases matching scores (verified via automated regression test).
4. **Live Opportunity Discovery:**
   - Server-side OpenRouter web search and Adzuna API integration.
   - Provider credentials and internal model chains are securely kept server-side; students are never asked for API keys.
   - Transparent error payloads: returns explicit typed error states (`503 OPENROUTER_NOT_CONFIGURED`, `502 SEARCH_PROVIDER_ERROR`) rather than silently returning empty or fake results.
   - Honest empty states: if 0 opportunities are found, 0 are displayed.
5. **Persistent Application Tracker & Skill Lab:**
   - Full 7-stage application lifecycle (*Saved*, *Preparing*, *Applied*, *Assessment*, *Interview*, *Offer*, *Rejected*) persisted to Supabase database.
   - Explicit student action: saving an opportunity does not claim an application was submitted; application status is only marked applied on student confirmation.
   - Objective Skill Lab quizzes for Python, React, SQL, and Machine Learning that persist verified assessment scores to the student's profile.
6. **Separated Interactive Demo Mode:**
   - Distinct, explicit toggle for judges to preview the platform with demo profile (Rahul Sharma) and 34 pre-evaluated opportunities without contaminating real user accounts.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```bash
# Supabase Configuration (Required for user authentication, database, and storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Internal AI & Search Discovery (Server-side implementation details)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-001

# Adzuna Live Jobs API (Optional secondary opportunity source)
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_APP_KEY=your-adzuna-app-key
```

---

## 🗄️ Database Setup & Migrations

To apply database tables, constraints, indexes, and Row Level Security:

1. In your Supabase dashboard or CLI, run the migration in:
   `supabase/migrations/20260329000001_initial_schema.sql`
2. Ensure the private Storage bucket `documents` is created with authenticated upload/read policies.

---

## 🧪 Quality Gate & Test Execution

InternSync is verified against strict automated unit, integration, and browser acceptance tests:

### Unit & Integration Suites (`npm run test` — Vitest, 47 tests):
- `tests/unit/opportunity-persistence.test.ts` (6 tests passing): UUIDv5 identity generation, database persistence before application linking, collision resistance, and graceful failure handling.
- `tests/unit/account-switching.test.ts` (3 tests passing): Multi-tenant account isolation, state cleanup upon logout, and session restoration.
- `tests/unit/document-extraction.test.ts` (9 tests passing): Compressed PDF extraction, multi-page parsing, scanned document detection, legacy `.doc`/`.ppt` rejection, and structured schema extraction.
- `tests/unit/real-product-pipeline.test.ts` (10 tests passing): 150+ skill taxonomy normalization, measured confidence scores, deterministic 8-factor fit, project evidence contribution, and hard eligibility mismatch gating.
- `tests/unit/live-search.test.ts` (8 tests passing): Query generation, URL normalization, deduplication, and requirement extraction.
- `tests/unit/matching.test.ts` (6 tests passing): Scoring weights, eligibility edge cases, and 14-day roadmap synthesis.
- `tests/unit/model-router.test.ts` (5 tests passing): Health checks, latency tracking, and fallback chains.

### End-to-End Browser Suites (`npm run test:e2e` — Playwright, 50 tests across Desktop & Mobile):
- `tests/e2e/api-endpoints.spec.ts` (14 tests): Serverless endpoints (`/api/settings/health`, `/api/verify-url`, `/api/search/live`, `/api/search/adzuna`, `/api/ai/extract-resume`) and SPA routing integrity.
- `tests/e2e/auth-isolation.spec.ts` (10 tests): Landing page, protected route redirection, login form validation, demo mode activation, refresh session persistence, and clean logout.
- `tests/e2e/document-and-settings.spec.ts` (10 tests): Career DNA evidence breakdown, student-centric settings tabs, documents dropzone, Skill Lab quiz scoring, and Dream Internship simulator.
- `tests/e2e/opportunities-and-matching.spec.ts` (8 tests): Verified opportunity badging, deterministic match breakdown, 14-day roadmap, saving to application tracker without false applied states, and comparison drawer.
- `tests/e2e/navigation-and-layout.spec.ts` (8 tests): Honest 404 page, direct nested route navigation (`/career-paths`, `/profile`, `/assistant`), and mobile responsive drawer navigation.

---

## 🚀 Vercel Production & Preview Deployment

InternSync is configured for seamless deployment to Vercel with dedicated serverless functions and Single Page Application (SPA) routing:

1. **Vercel Functions:** Standalone serverless endpoints in `api/` handle all backend logic (`/api/search/live`, `/api/ai/extract-resume`, `/api/ai/chat`, `/api/verify-url`, `/api/settings/health`).
2. **SPA Routing:** Configured in `vercel.json` so `/api/(.*)` routes directly to serverless functions, and `/(.*)` rewrites to `/index.html` for client-side navigation.
3. **Node Runtime:** Node.js `>=20.0.0` configured in `package.json`.
4. **Environment Variables Required in Vercel:**
   - `VITE_SUPABASE_URL`: Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anonymous Public Key
   - `OPENROUTER_API_KEY`: Server-side OpenRouter Key
   - `OPENROUTER_DEFAULT_MODEL`: Server-side Model (default: `google/gemini-2.0-flash-001`)
   - `ADZUNA_APP_ID`: (Optional) Adzuna App ID
   - `ADZUNA_APP_KEY`: (Optional) Adzuna App Key

---

## 🛡️ Security & Privacy
- Resumes and external inputs are strictly isolated as untrusted data with prompt-injection defense prompts and size limits.
- All scoring formulas and eligibility gates are 100% deterministic to guarantee fairness and auditability.
- Private document files and student records are protected by database Row Level Security.
- Server-side API keys and internal provider configurations are never leaked to client bundles or settings pages.

---

## 📜 License
MIT License. Built for competition and ideathon evaluation.
