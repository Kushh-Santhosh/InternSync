# InternSync Product Specification

## 1. Executive Summary
- **Product Name:** InternSync
- **Tagline:** Understand your fit. Improve your profile. Find the right internship.
- **Mission:** Empower every student to bridge the gap between academic learning and industry readiness through explainable AI career intelligence.

## 2. Core Problem
Students applying to internships face severe information asymmetry:
1. **Blind Applications:** Submitting dozens of applications without knowing if they meet baseline eligibility (academic year, degree, graduation timeline, location, availability).
2. **Keyword vs. Evidence Gap:** Listing skills on resumes without understanding whether projects substantiate those skills.
3. **No Constructive Feedback:** Silent rejections provide zero insight into what skills or portfolio elements were missing.
4. **Lack of Actionable Paths:** Students do not know how to bridge the gap in 2–4 weeks before target application deadlines.

## 3. The InternSync Solution
InternSync flips the script from "Search and Spray" to **Opportunity Readiness**:
- **Career DNA:** A multi-dimensional profile synthesizing education, technical skills, soft skills, project evidence, and verified assessment scores.
- **Skill Evidence Engine:** Cross-references resume claims with project descriptions, GitHub repositories, and interactive skill assessments to compute evidence confidence.
- **Explainable Matching Engine:** A transparent, deterministic 8-vector scoring system that attributes exact percentage contributions and highlights exact pros and cons.
- **Decision Engine (Apply / Prepare / Skip):**
  - **APPLY NOW:** High match (>=80%) and full eligibility satisfied.
  - **PREPARE FIRST:** Reasonable match (60–79%) with addressable skill gaps and actionable 14-day study sprint.
  - **SKIP:** Hard eligibility mismatch (year, graduation, location, critical prerequisites) or match <60%.
- **14-Day Skill-Gap Roadmap:** Curated day-by-day action plans with milestones, exercises, and project blueprints.
- **AI Career Assistant:** Claude/Linear-inspired career advisor equipped with the user's structured Career DNA.
- **Application Tracker:** Kanban-style pipeline tracking Saved, Preparing, Applied, Assessment, Interview, Offer, and Rejected stages.

## 4. User Personas
### Primary Persona: Rahul Sharma
- **Academic Background:** 3rd Year B.Tech Computer Science & Engineering, Bengaluru.
- **Skills:** Python, React, TypeScript, SQL, basic Machine Learning.
- **Projects:** AI Study Assistant (React/Node), Smart Attendance System (OpenCV/Python).
- **Goal:** Land a high-impact AI Engineering or Full-Stack Internship for Summer 2025.
- **Frustration:** Unclear whether he qualifies for AI roles requiring PyTorch/Computer Vision, or whether full-stack roles are a safer bet.

## 5. User Journey & Core Loops
```
[ Landing Page ]
       ↓
[ Onboarding / Resume Upload ]
       ↓
[ AI Extraction & Validation ]
       ↓
[ Career DNA Synthesis ]
       ↓
[ Skill Lab Assessments (Optional Validation) ]
       ↓
[ Opportunity Intelligence Dashboard ]
       ↓
[ Match Explanation & Gap Analysis ]
   ├── APPLY NOW  ──> [ Apply & Track in Kanban ]
   ├── PREPARE    ──> [ 14-Day Sprint Roadmap ]
   └── SKIP       ──> [ Divert Effort to Better Fits ]
```

## 6. Non-Functional Requirements
- **Design Philosophy:** Minimalist, calm, intelligent, dark/light mode with near-black primary tokens, indigo accent (`#4f46e5` / `#6366f1`), subtle border radii, crisp typography (Inter/system-ui), no cheesy animations.
- **Performance:** First Contentful Paint < 1.0s, deterministic score calculations < 10ms.
- **Privacy & Safety:** All uploaded documents treated as untrusted input; no model prompt injection vulnerabilities.
