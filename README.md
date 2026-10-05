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
*(Note: If left empty, InternSync automatically activates its deterministic **Demo Mode** featuring Rahul Sharma's profile and 34 pre-evaluated opportunities).*

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Running Tests & Quality Checks
```bash
npm run typecheck   # Strict TypeScript check
npm run lint        # Oxlint linting
npm run test        # Vitest suite
npm run build       # Production bundle build
```

---

## 📁 Repository Structure
```
InternSync/
├── docs/                     # Comprehensive specs & guides
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── AI_ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── DEMO_FLOW.md
├── src/
│   ├── app/                  # Router, layouts, global providers
│   ├── components/           # Reusable UI primitives & compound widgets
│   ├── pages/                # Main application views
│   ├── features/             # Business domain feature modules
│   ├── lib/                  # AI abstraction, matching engine, Supabase client
│   ├── data/                 # Seed opportunities, skill taxonomy, demo profiles
│   ├── types/                # Domain TypeScript definitions
│   └── styles/               # Design tokens & Tailwind styles
├── supabase/
│   ├── migrations/           # PostgreSQL schema with RLS
│   └── functions/            # Edge function templates
├── tests/                    # Vitest unit & integration tests
└── vite.config.ts
```

---

## 🛡️ Security & Privacy
- Resumes and external inputs are strictly isolated as untrusted data with prompt-injection defense prompts.
- All scoring formulas and eligibility gates are 100% deterministic to guarantee fairness and auditability.
- No personal contact details or sensitive demographic attributes are factored into matching algorithms.

---

## 📜 License
MIT License. Built for competition and ideathon evaluation.
# InternSync
