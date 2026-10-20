# InternSync 🎯

<div align="center">
  <img src="public/brand/internsync-logo.png" alt="InternSync Logo" width="340" />
  <p><strong>From Apply Everywhere to Know Where You Fit.</strong></p>
  <p><em>AI-Powered Internship Opportunity-Readiness & Decision-Support Platform</em></p>
  <p>
    <a href="https://intern-sync-one.vercel.app"><strong>🌐 Live Website</strong></a> •
    <a href="https://github.com/Kushh-Santhosh/InternSync"><strong>📦 GitHub Repository</strong></a> •
    <a href="#-quick-start-local-development"><strong>⚡ Quick Start</strong></a> •
    <a href="#-level-2-mvp-presentation-alignment"><strong>📊 MVP Pitch Deck</strong></a>
  </p>
</div>

---

## 🏆 Project Overview

**Team:** Team Fensta  
**Competition:** SaaarthiX Hackathon — Level 2 MVP  
**Production URL:** [https://intern-sync-one.vercel.app](https://intern-sync-one.vercel.app)  
**Repository:** [https://github.com/Kushh-Santhosh/InternSync](https://github.com/Kushh-Santhosh/InternSync)  

InternSync shifts the student job search paradigm from generic keyword aggregators to an **Opportunity Readiness & Decision-Support Engine**. Every feature answers:
*Why does this role fit? What qualifications or skills are missing? What should the student do next?*

---

## 🌟 The 4 Core Structural Gaps InternSync Solves

1. **The Discovery Gap:** Stale, duplicate, or expired job postings across disconnected boards are replaced with live, traceable ATS feeds (Greenhouse, Lever, Ashby, Jobicy) with 100% genuine source application URLs.
2. **The Understanding Gap:** Unstructured, dense job descriptions are parsed into transparent requirements: required skills, academic year cutoffs, degree prerequisites, and work mode.
3. **The Readiness Gap:** Static self-declared keyword resumes are transformed into a dynamic, 8-factor **Career DNA** backed by extracted project evidence, course credentials, and validated technical signals.
4. **The Decision Gap:** Random spraying and silent ghosting are replaced with a deterministic tri-state recommendation engine: **APPLY NOW** (≥80%), **PREPARE FIRST** (60–79% with a 14-day sprint roadmap), and **SKIP** (<60% or hard eligibility failure).

---

## 🔄 Core Student Workflow

```
Resume / Multi-Evidence Ingestion (PDF, Projects)
                    ↓
         Dynamic 8-Factor Career DNA
                    ↓
Live Opportunity Research (Greenhouse, Lever, Ashby)
                    ↓
  Deterministic Weighted Fit & Gap Scoring
                    ↓
    Tri-State Decision & Preparation Action
 [ APPLY NOW (≥80%) | PREPARE FIRST (60-79%) | SKIP (<60%) ]
```

---

## ✨ Implemented Product Capabilities

| Capability | Status | Implementation Details |
|---|---|---|
| **Official Brand Overhaul** | ✅ Production Live | Distinctive 4-petal cyan/blue/purple symbol, dark navy `Intern` and purple `Sync` wordmark, SVG & ICO favicons, PWA web manifest. |
| **Authentication & Profile Isolation** | ✅ Production Live | Supabase Auth supporting Email and instant Username logins (`@demo.internsync.invalid`), strict Row Level Security (RLS) policies. |
| **Document Intelligence & Parsing** | ✅ Production Live | Client-side native PDF text stream extraction (`unpdf`), project deck slide ingestion, 10MB limit enforcement, scanned document OCR detection. |
| **8-Factor Career DNA** | ✅ Production Live | Skills (30%), Eligibility (20%), Projects (15%), Education (10%), Experience (10%), Location (5%), Availability (5%), Intent (5%). |
| **Live ATS Opportunity Discovery** | ✅ Production Live | 34 verified opportunities across HackerRank, Supabase, Rubrik, InMobi with zero fictional records, backed by live URL verifier. |
| **Deterministic Fit Engine** | ✅ Production Live | Pure mathematical scoring with transparent breakdown of matching skills, missing tools, and strict academic eligibility gates. |
| **Resume Intelligence & Critique** | ✅ Production Live | STAR-format bullet elevation, role-targeted gap explanations without hallucinating achievements or experience. |
| **14-Day Preparation Roadmaps** | ✅ Production Live | Daily milestone-driven learning sprints for roles classified as `PREPARE FIRST`. |
| **Kanban Application Tracker** | ✅ Production Live | 7-stage application lifecycle (*Saved*, *Preparing*, *Applied*, *Assessment*, *Interview*, *Offer*, *Rejected*) persisted to Supabase. |
| **AI Career Assistant** | ✅ Production Live | Context-aware advisor grounded in the student's live Career DNA and ingested opportunities with Gemini/OpenRouter fallback routing. |

---

## 🛠️ Technology Stack

- **Frontend:** Vite, React 19, Strict TypeScript, Tailwind CSS, Lucide React
- **Backend & Cloud:** Supabase (PostgreSQL 15+, Auth, RLS, Storage)
- **AI Engine:** Multi-provider router supporting Google Gemini, OpenRouter, and local deterministic fallback
- **Document Ingestion:** `unpdf` native WebAssembly PDF parser, JSZip XML parser for Office formats
- **Testing & Quality:** Vitest (86 tests passing), Playwright E2E suites, Oxlint (0 errors)

---

## 📊 Level 2 MVP Presentation Alignment

The platform directly mirrors the 11-slide SaaarthiX Level 2 MVP pitch deck:
- **Slide 1 — Product Reveal:** "From Apply Everywhere to Know Where You Fit" (Landing Page Hero)
- **Slide 2 — Student Problem:** 4 real challenges (Discovery Overload, Eligibility Uncertainty, Unspoken Gaps, Decision Paralysis)
- **Slide 3 — 4 Core Gaps:** Discovery, Understanding, Readiness, Decision
- **Slide 4 — Introducing InternSync:** 5-Stage Opportunity Readiness Pipeline
- **Slide 5 — Student Profile & Career DNA:** 8-Factor Profile Extraction & Cloud Persistence
- **Slide 6 — Live Opportunity Discovery:** Genuine ATS Listings with Direct Application Links
- **Slide 7 — Match & Fit Analysis:** Deterministic Scoring & Tri-State Classification
- **Slide 8 — Resume Intelligence:** Truthful Bullet Improvement & 14-Day Prep Roadmaps
- **Slide 9 — Live Product Demonstration:** End-to-End Walkthrough
- **Slide 10 — Architecture & Rigor:** Verified Tech Stack & Cloud RLS Security
- **Slide 11 — Vision & Links:** Next Steps, Live App, and GitHub Repository

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+
- npm or pnpm

### 2. Clone and Install
```bash
git clone https://github.com/Kushh-Santhosh/InternSync.git
cd InternSync
npm install
```

### 3. Environment Configuration
Copy the template file:
```bash
cp .env.example .env
```

Required environment variables (no secret credentials committed to GitHub):
```bash
# Supabase Configuration (Required for cloud authentication and storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Model Routing (Server-side; falls back cleanly to deterministic local engine if omitted)
GOOGLE_GENAI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=your-openrouter-key
```

### 4. Development & Build
```bash
npm run dev        # Launch Vite development server at http://localhost:5173
npm run build      # Compile server bundle and production Vite bundle
npm run typecheck  # Strict TypeScript compilation check (0 errors)
npm run lint       # Fast Oxlint static analysis (0 errors)
npm run test       # Run 86 unit & integration tests with Vitest
```

---

## 🔒 Security & Data Privacy

- **Untrusted Input Protection:** Resume PDFs and candidate documents are treated as untrusted data; prompt-injection defenses and strict regex sanitizers are applied.
- **Row Level Security:** Supabase RLS policies guarantee candidates can only access and modify their own documents, profiles, and tracked applications.
- **Client Key Isolation:** Private API keys (Gemini, OpenRouter, Supabase service roles) are strictly confined to server-side middleware and never exposed to client-side bundles.

---

## 📄 License

MIT License. Developed with pride by Team Fensta for SaaarthiX.
