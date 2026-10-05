# InternSync Database Schema Specification

## 1. Schema Overview
InternSync uses PostgreSQL with Supabase, structured around standard relational entity relationships, UUID primary keys, and Row Level Security.

## 2. Table Definitions

### `profiles`
Stores the core student identity and academic background.
- `id`: UUID (references `auth.users.id` on delete cascade), Primary Key
- `full_name`: TEXT NOT NULL
- `university`: TEXT NOT NULL
- `degree`: TEXT NOT NULL (e.g., 'B.Tech')
- `branch`: TEXT NOT NULL (e.g., 'Computer Science & Engineering')
- `current_year`: INTEGER NOT NULL (e.g., 3)
- `graduation_year`: INTEGER NOT NULL (e.g., 2026)
- `location`: TEXT NOT NULL (e.g., 'Bengaluru')
- `preferred_locations`: TEXT[] DEFAULT '{}'
- `work_mode_preference`: TEXT DEFAULT 'any' ('remote', 'onsite', 'hybrid', 'any')
- `available_from`: DATE
- `available_duration_months`: INTEGER DEFAULT 3
- `avatar_url`: TEXT
- `github_username`: TEXT
- `created_at`: TIMESTAMPTZ DEFAULT now()
- `updated_at`: TIMESTAMPTZ DEFAULT now()

### `skills`
Master taxonomy of standardized skills with categories and aliases.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name`: TEXT UNIQUE NOT NULL
- `category`: TEXT NOT NULL ('frontend', 'backend', 'ai_ml', 'data', 'devops', 'mobile', 'soft')
- `aliases`: TEXT[] DEFAULT '{}'

### `student_skills`
Skills associated with a student, including confidence and validation score.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `student_id`: UUID REFERENCES profiles(id) ON DELETE CASCADE
- `skill_name`: TEXT NOT NULL
- `confidence`: INTEGER CHECK (confidence BETWEEN 0 AND 100)
- `evidence_sources`: TEXT[] DEFAULT '{}' ('resume', 'project', 'github', 'assessment')
- `assessment_score`: INTEGER CHECK (assessment_score BETWEEN 0 AND 100)
- `last_validated_at`: TIMESTAMPTZ
- UNIQUE (student_id, skill_name)

### `projects`
Evidence of practical execution.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `student_id`: UUID REFERENCES profiles(id) ON DELETE CASCADE
- `title`: TEXT NOT NULL
- `description`: TEXT NOT NULL
- `technologies`: TEXT[] DEFAULT '{}'
- `repository_url`: TEXT
- `live_url`: TEXT
- `evidence_strength`: TEXT CHECK (evidence_strength IN ('strong', 'moderate', 'limited'))
- `created_at`: TIMESTAMPTZ DEFAULT now()

### `opportunities`
Ingested or seeded internship opportunities.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `company_name`: TEXT NOT NULL
- `company_logo`: TEXT
- `role_title`: TEXT NOT NULL
- `category`: TEXT NOT NULL
- `description`: TEXT NOT NULL
- `location`: TEXT NOT NULL
- `work_mode`: TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite'))
- `internship_duration_months`: INTEGER NOT NULL
- `stipend_amount`: INTEGER
- `stipend_currency`: TEXT DEFAULT 'INR'
- `stipend_period`: TEXT DEFAULT 'month'
- `application_url`: TEXT NOT NULL
- `source`: TEXT DEFAULT 'InternSync Partner'
- `deadline`: TIMESTAMPTZ NOT NULL
- `eligible_years`: INTEGER[] DEFAULT '{3, 4}'
- `eligible_degrees`: TEXT[] DEFAULT '{B.Tech, BE, MCA, M.Tech}'
- `required_skills`: TEXT[] NOT NULL
- `preferred_skills`: TEXT[] DEFAULT '{}'
- `is_demo`: BOOLEAN DEFAULT false
- `created_at`: TIMESTAMPTZ DEFAULT now()

### `match_results`
Cached or calculated match analytics for a student and an opportunity.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `student_id`: UUID REFERENCES profiles(id) ON DELETE CASCADE
- `opportunity_id`: UUID REFERENCES opportunities(id) ON DELETE CASCADE
- `overall_match_score`: INTEGER CHECK (overall_match_score BETWEEN 0 AND 100)
- `skill_score`: INTEGER
- `eligibility_score`: INTEGER
- `project_score`: INTEGER
- `education_score`: INTEGER
- `experience_score`: INTEGER
- `location_score`: INTEGER
- `availability_score`: INTEGER
- `intent_score`: INTEGER
- `recommendation`: TEXT CHECK (recommendation IN ('APPLY NOW', 'PREPARE FIRST', 'SKIP'))
- `why_matched`: TEXT[] DEFAULT '{}'
- `missing_skills`: TEXT[] DEFAULT '{}'
- `engine_version`: TEXT DEFAULT 'v1'
- `calculated_at`: TIMESTAMPTZ DEFAULT now()
- UNIQUE (student_id, opportunity_id)

### `applications`
Kanban pipeline tracking for student applications.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `student_id`: UUID REFERENCES profiles(id) ON DELETE CASCADE
- `opportunity_id`: UUID REFERENCES opportunities(id) ON DELETE CASCADE
- `status`: TEXT CHECK (status IN ('saved', 'preparing', 'applied', 'assessment', 'interview', 'offer', 'rejected'))
- `notes`: TEXT
- `applied_at`: TIMESTAMPTZ
- `next_action`: TEXT
- `next_action_date`: DATE
- `created_at`: TIMESTAMPTZ DEFAULT now()
- `updated_at`: TIMESTAMPTZ DEFAULT now()

### `assessments` & `assessment_questions`
Skill signal testing suite.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `skill_name`: TEXT NOT NULL
- `question`: TEXT NOT NULL
- `code_snippet`: TEXT
- `options`: JSONB NOT NULL
- `correct_index`: INTEGER NOT NULL
- `explanation`: TEXT NOT NULL
- `difficulty`: TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'))

### `assistant_conversations` & `assistant_messages`
Conversation state for the contextual AI career advisor.
- `conversation_id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `student_id`: UUID REFERENCES profiles(id) ON DELETE CASCADE
- `messages`: JSONB NOT NULL
- `updated_at`: TIMESTAMPTZ DEFAULT now()

## 3. Row Level Security (RLS) Policies
- All student tables (`profiles`, `student_skills`, `projects`, `applications`, `match_results`, `assistant_messages`) enforce:
  `WHERE auth.uid() = student_id`
- Opportunities & skill taxonomy are publicly readable (`SELECT true`).
