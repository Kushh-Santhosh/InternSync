# InternSync — MVP Release Verification & Multi-Source Engine Report

**Production Website:** [https://intern-sync-one.vercel.app](https://intern-sync-one.vercel.app)  
**GitHub Repository:** [https://github.com/Kushh-Santhosh/InternSync](https://github.com/Kushh-Santhosh/InternSync)  
**Production Branch:** `main`  
**Execution Date:** 2026-10-17  
**Quality Status:** Production Acceptance Suite Passed (TypeScript 0 errors, Oxlint 0 errors, Vitest 82/82 Unit Tests Passing across 10 Suites, Playwright E2E suites passing, 0 Secret Leakage).

---

## 1. Executive Summary & Core Delivery

InternSync's opportunity engine has transitioned from relying on paid search APIs to a **resilient, no-paid-API multi-source architecture** backed by official employer career feeds and permitted public feeds:

1. **No-Paid-API Baseline Opportunity Engine:**
   - Deployed server-side source adapters for official employer ATS feeds:
     - **Greenhouse Job Board API:** `https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true`
     - **Lever Postings API:** `https://api.lever.co/v0/postings/{company_site}?mode=json`
     - **Jobicy Permitted Feed:** `https://jobicy.com/api/v2/remote-jobs`
   - Created a verified registry of **33 real employers** with active tech, product, and design internship programs in India (Bengaluru, Hyderabad, Pune, Mumbai) and remote open to India.
   - All direct application URLs route to the official ATS listing or hosted careers page.
   - Shared server-side caching (45-minute TTL) prevents redundant feed downloads.

2. **Genuine Multi-User Architecture (No Hardcoding):**
   - The platform does not depend on Kushal Santhosh's resume or preferences.
   - De-hardcoded graduation batch logic: dynamically derives academic standing for batches 2025–2029 while honoring explicit user standing.
   - De-hardcoded career DNA verification banners so they appear only when ambiguous metrics exist on a candidate's actual profile.
   - Strict account boundaries ensure Student A's skills, projects, and saved applications remain isolated from Student B.

3. **Deterministic Opportunity Matching & Hard Eligibility Gates:**
   - Numerical match score is strictly deterministic:
     - Skills (30%), Eligibility (20%), Project Evidence (15%), Education (10%), Experience (10%), Location (5%), Availability (5%), Intent (5%).
   - Hard eligibility mismatches (degree mismatch, unfulfilled year standing) automatically trigger **`SKIP`** and cap eligibility score under 50, regardless of skill overlap.
   - Tri-state decisions: `APPLY NOW` (≥80% match, fully eligible), `PREPARE FIRST` (55–79% with addressable gaps), `SKIP` (hard blocker or <55%).

4. **Resilience & Circuit Breakers:**
   - Automatic circuit breakers trip for 15 minutes upon encountering OpenRouter HTTP 402 (insufficient credits) or Gemini HTTP 429 (quota exhausted).
   - Search continues seamlessly via the multi-source engine, ensuring zero downtime even when optional AI keys are absent or uncredited.

---

## 2. Verified Employer Source Registry Coverage

| Source Provider | Employers Included | Locations Covered | Roles Supported |
|---|---|---|---|
| **Greenhouse API** (27 employers) | HackerRank, Rubrik, Groww, InMobi, Slice, DevRev, Observe.AI, Databricks, Stripe, Figma, Cloudflare, GitLab, Canonical, Airbnb, Coinbase, Reddit, Datadog, MongoDB, Elastic, Twilio, Okta, Duolingo, Asana, Pinterest, Robinhood, Coursera, Lyft | Bengaluru, Hyderabad, Mumbai, Pune, Remote India, Global Remote | Software Engineering, Full-Stack, Frontend, Backend, AI/ML, Cloud/DevOps, Security, Product Design |
| **Lever API** (6 employers) | FamPay, Meesho, CRED, Zeta, Pocket FM, Paytm | Bengaluru, Gurgaon, Mumbai, Remote India | Mobile, Full-Stack, Backend, UI/UX Design, Data Analytics |
| **Permitted Public Feed** | Jobicy Remote Tech Feed | Remote (open to India & Global) | Junior / Intern Software Developers, Web Engineering |

All registry entries include verified board identifiers, official career URLs, and dynamic status checks.

---

## 3. Test & Verification Matrix

| Test Phase | Tool / Command | Scope / Viewport | Result | Notes |
|---|---|---|---|---|
| **Typecheck** | `npm run typecheck` | Whole project (`tsc -b`) | **0 Errors** | Strict TypeScript compliance |
| **Lint** | `npm run lint` | 115 files (`oxlint`) | **0 Errors** (317 warnings) | Clean linting pass |
| **Unit Tests** | `npm run test` | 10 test suites (`vitest`) | **82/82 Passed** (100%) | Added regression suite for multi-user personalization and multi-source engine |
| **Production Build** | `npm run build` | esbuild server bundle + vite client | **Passed** | Standalone ESM server bundle generated in `api/_handler.js` |
| **API Endpoints E2E** | `playwright test api-endpoints.spec.ts` | Serverless API routes | **14/14 Passed** | Live health, verify-url, and live search handling verified |
| **Opportunities E2E** | `playwright test opportunities-and-matching.spec.ts` | Browser UI & Matching | **8/8 Passed** | Opportunity rendering, detail view, roadmaps, and comparison drawer |

---

## 4. Multi-User Personalization Acceptance

Regression test `tests/unit/multi-user-multi-source.test.ts` verified that two distinctly different students receive divergent, personalized recommendations:
- **Student 1 (Aarav Patel, 3rd-year CS, NIT Surathkal):**
  - High match for Software Engineering Internships (`APPLY NOW`, >80% score).
  - Recommended actions focus on distributed systems and cloud tooling.
  - Automatically skipped for 4th-year-only senior co-ops (`SKIP`, eligibility score <50).
- **Student 2 (Ananya Sen, 4th-year B.Des, NID):**
  - High match for Product Design Internships (`APPLY NOW`, >80% score, Figma & User Research matched).
  - Automatically skipped for strict B.Tech-only software positions due to degree eligibility gate.

---

## 5. Deployment Instructions & Release Status

1. Commit changes to `main` branch.
2. Vercel automatically deploys the updated code and regenerates the serverless lambda bundle.
3. The platform is ready for production students to sign up, upload their resumes, generate their unique Career DNA, and discover verified internships without requiring paid search credentials.
