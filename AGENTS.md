# AGENTS.md — InternSync Agent Guide & Workflow

## Overview
**InternSync** is an AI-powered internship opportunity-readiness platform designed for students and educational ecosystems. It shifts the paradigm from simple internship searching to holistic **Opportunity Readiness**.

## Key Rules for AI Agents Working on InternSync
1. **Never build generic job boards:** The platform is an opportunity-readiness engine. Every feature must answer: *Why does this fit? What is missing? What should the student do next?*
2. **Deterministic matching vs. AI extraction:** 
   - AI is used for unstructured data interpretation (resumes, project evidence, text descriptions, natural language interaction).
   - Scoring, eligibility calculations, year matching, and threshold classifications (`APPLY NOW`, `PREPARE FIRST`, `SKIP`) MUST remain deterministic, explainable, and verifiable.
3. **No fake features or broken placeholders:** Never leave broken routes, dummy non-functioning buttons, or fake network delays masquerading as real AI.
4. **Resilience & Demo Mode:** If Supabase or AI API keys (Gemini / OpenRouter) are not present in the local environment, the app must gracefully fall back to a rich, deterministic Demo Mode (showcasing candidate Rahul Sharma and 34 verified opportunities) without crashing.
5. **Security First:** Resumes and external inputs are untrusted data. Protect against prompt injection. Never expose private API keys in client-side code.
6. **Code Standards:** Strict TypeScript, modular component structure, centralized design tokens, human-readable variable names, comprehensive error/empty/loading states, and clean responsive design.

## Directory Structure Guide
- `src/lib/ai/`: Provider abstractions, prompt templates (`prompts/`), parsers, and matchers.
- `src/lib/matching/`: Deterministic weighted scoring engine (skills 30%, eligibility 20%, project evidence 15%, education 10%, experience 10%, location 5%, availability 5%, intent 5%).
- `src/lib/supabase/`: Client and database types.
- `src/data/`: High-fidelity seed datasets and demo student profiles.
- `src/features/`: Feature-specific logic (Career DNA, Skill Evidence, Roadmap Generation, Assistant).
- `docs/`: Comprehensive specifications, database schemas, and demo guides.
