# InternSync Implementation Plan & Milestones

## Phase Matrix & Execution Schedule

### Phase 1: Foundation & Design System (Tokens, Layouts, Core Primitives)
- [x] Vite + React 19 + TypeScript + Tailwind v4 + Lucide React + Vitest setup.
- [x] Path alias `@/*` configured and verified.
- [ ] Theme system: Near-black text (`#0f172a`), refined slate backgrounds (`#f8fafc` / `#ffffff`), deep indigo accent (`#4f46e5`), muted success (`#10b981`), amber warning (`#f59e0b`), muted rose danger (`#f43f5e`).
- [ ] Base UI components: Button, Card, Badge, Modal, Tabs, Input, Select, Progress, ScoreRing, Toast.

### Phase 2: Supabase & Offline Demo Layer
- [ ] Supabase client configuration with env fallback.
- [ ] SQL migrations (`supabase/migrations/20261005_init.sql`).
- [ ] Offline Local Storage adapter for zero-credential hackathon stability.

### Phase 3: AI Engine & Provider Abstraction
- [ ] Unified `AIProvider` interface.
- [ ] Gemini & OpenRouter provider drivers.
- [ ] Deterministic Demo AI provider with realistic response trees.
- [ ] Versioned prompt directory (`src/lib/ai/prompts/`).
- [ ] Zod schemas for all AI outputs.

### Phase 4: Deterministic Matching Engine
- [ ] Skill normalizer & alias resolver (e.g. 'React.js' -> 'React', 'ML' -> 'Machine Learning').
- [ ] 8-factor weighted scoring algorithm.
- [ ] Tri-state recommendation engine (`APPLY NOW`, `PREPARE FIRST`, `SKIP`).
- [ ] Unit tests for math & classification thresholds.

### Phase 5: Landing Page & Command Palette
- [ ] Hero section with punchy copy & mock interactive card.
- [ ] Core loop illustration (Understand -> Validate -> Match -> Improve).
- [ ] Global Command Palette (`Cmd+K` / `Ctrl+K`).

### Phase 6: Onboarding & Resume Upload Engine
- [ ] Drag-and-drop resume uploader with animated extraction stages.
- [ ] Multi-step onboarding with fallbacks for manual profile creation.

### Phase 7: Career DNA Hub
- [ ] Capability breakdown (Software Engineering, AI/ML, Full Stack, Data Science).
- [ ] Skill confidence cards showing evidence sources (Resume, Project, GitHub, Assessment).
- [ ] Project gallery with technology chips and evidence strengths.

### Phase 8: Opportunity Directory & 3-Way Comparator
- [ ] 30+ realistic seeded opportunities across Bengaluru, Hyderabad, Pune, Mumbai, Delhi, Remote.
- [ ] Advanced faceted filters (Location, Work mode, Category, Recommendation filter).
- [ ] Multi-opportunity comparison table (up to 3 items).

### Phase 9: Opportunity Details & 14-Day Roadmap
- [ ] Match breakdown bars with transparent % contributions.
- [ ] Why you match checklist vs. missing prerequisites.
- [ ] 14-day sprint timeline for "PREPARE FIRST" roles.

### Phase 10: Skill Lab Assessments
- [ ] Interactive 5-question quick quiz across Python, React, SQL, and ML.
- [ ] Instant score recalculation and verified skill signal badge.

### Phase 11: Career Direction Discovery
- [ ] Signal test recommending ideal roles based on preferences.

### Phase 12: Application Tracker (Kanban)
- [ ] 7-stage interactive pipeline (Saved -> Preparing -> Applied -> Assessment -> Interview -> Offer -> Rejected).
- [ ] Stage shifting, notes, next action dates.

### Phase 13: AI Career Assistant (`/assistant`)
- [ ] Claude/Linear styled workspace.
- [ ] Context-aware chat with student's Career DNA injection.
- [ ] Suggested prompts and structured advice.

### Phase 14: Quality Assurance, Tests & Browser Verification
- [ ] Unit & integration tests for all matching formulas.
- [ ] Responsive browser verification at 1440px, 768px, and 390px.
