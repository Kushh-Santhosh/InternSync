export type WorkMode = 'remote' | 'hybrid' | 'onsite' | 'any'

export type RecommendationType = 'APPLY NOW' | 'PREPARE FIRST' | 'SKIP'

export type ApplicationStatus =
  | 'saved'
  | 'preparing'
  | 'applied'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'rejected'

export type EvidenceStrength = 'strong' | 'moderate' | 'limited' | 'none'

export interface StudentProfile {
  id: string
  fullName: string
  email: string
  university: string
  degree: string
  branch: string
  currentYear: number
  graduationYear: number
  location: string
  preferredLocations: string[]
  workModePreference: WorkMode
  availableFrom: string
  availableDurationMonths: number
  avatarUrl?: string
  githubUsername?: string
  careerInterests: string[]
  targetRole: string
  bio?: string
  resumeFileName?: string
  resumeUploadedAt?: string
}

export interface SkillEvidenceItem {
  skillName: string
  category: 'frontend' | 'backend' | 'ai_ml' | 'data' | 'languages' | 'tools'
  confidence: number // 0-100
  evidenceSources: ('resume' | 'project' | 'github' | 'assessment')[]
  assessmentScore?: number // 0-100
  projectCount: number
  githubStrength: EvidenceStrength
  lastValidatedAt?: string
}

export interface ProjectItem {
  id: string
  studentId: string
  title: string
  description: string
  technologies: string[]
  repositoryUrl?: string
  liveUrl?: string
  evidenceStrength: EvidenceStrength
  highlights: string[]
}

export type UrlVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'BROKEN' | 'EXPIRED'

export interface Opportunity {
  id: string
  companyName: string
  companyLogo: string
  roleTitle: string
  category: string
  description: string
  location: string
  workMode: 'remote' | 'hybrid' | 'onsite'
  internshipDurationMonths: number
  stipendAmount?: number
  stipendCurrency?: string
  stipendPeriod?: string
  applicationUrl: string
  source: string
  sourceUrl?: string
  sourceDomain?: string
  urlStatus?: UrlVerificationStatus
  duplicateSources?: string[]
  lastVerifiedAt?: string
  postedAt: string
  deadline: string
  eligibleYears: number[]
  eligibleDegrees: string[]
  requiredSkills: string[]
  preferredSkills: string[]
  experienceRequirements?: string
  availabilityRequirements?: string
  industry?: string
  companySize?: string
  isDemo?: boolean
  isLiveWeb?: boolean
}

export interface MatchScores {
  overallMatchScore: number // 0-100
  skillScore: number
  eligibilityScore: number
  projectScore: number
  educationScore: number
  experienceScore: number
  locationScore: number
  availabilityScore: number
  intentScore: number
}

export interface MatchResult extends MatchScores {
  id: string
  studentId: string
  opportunityId: string
  recommendation: RecommendationType
  whyMatched: string[]
  missingSkills: string[]
  evidenceFound: string[]
  eligibilityNotes: string[]
  actionPlanSummary?: string
  engineVersion: string
  calculatedAt: string
}

export interface SkillGapPlanDay {
  day: number
  title: string
  objective: string
  tasks: string[]
  resources: { label: string; url: string }[]
}

export interface SkillGapPlan {
  opportunityId: string
  roleTitle: string
  companyName: string
  durationDays: number
  criticalGaps: string[]
  importantGaps: string[]
  niceToHaveGaps: string[]
  dailyPlan: SkillGapPlanDay[]
  outcomeSummary: string
}

export interface ApplicationItem {
  id: string
  studentId: string
  opportunityId: string
  opportunity: Opportunity
  matchScore: number
  recommendation: RecommendationType
  status: ApplicationStatus
  notes: string
  appliedAt?: string
  nextAction?: string
  nextActionDate?: string
  updatedAt: string
}

export interface AssessmentQuestion {
  id: string
  skillName: string
  question: string
  codeSnippet?: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface AssessmentResult {
  skillName: string
  rawScore: number
  totalQuestions: number
  normalizedScore: number // 0-100
  signalLevel: 'Verified Strong' | 'Verified Competent' | 'Needs Preparation'
  completedAt: string
}

export interface CareerDirectionRoleFit {
  role: string
  category: string
  fitPercentage: number
  rationale: string
  keyStrengths: string[]
  keyGaps: string[]
  recommendedNextSkills: string[]
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  suggestedActions?: {
    label: string
    action: 'navigate' | 'filter' | 'view_opportunity' | 'view_roadmap'
    target?: string
  }[]
  attachedOpportunityId?: string
}

export interface RawSearchResult {
  title: string
  url: string
  domain: string
  snippet: string
  source: string
  discoveredAt: string
}

export interface SearchQuery {
  text: string
  category?: string
  role?: string
  location?: string
  targetYear?: number
  skills?: string[]
}

export interface ProviderHealth {
  provider: string
  status: 'ACTIVE' | 'NOT_CONFIGURED' | 'ERROR'
  message?: string
  model?: string
  lastChecked: string
}

export interface UploadedDocument {
  id: string
  name: string
  type: 'resume' | 'presentation' | 'report' | 'certificate'
  sizeBytes: number
  uploadedAt: string
  parsedText?: string
  slideCount?: number
  extractedSkills: string[]
  extractedProjects: string[]
}

export interface LiveSearchProgress {
  stage:
    | 'idle'
    | 'reading_dna'
    | 'generating_queries'
    | 'searching_web'
    | 'checking_apis'
    | 'deduplicating'
    | 'extracting_requirements'
    | 'matching'
    | 'completed'
    | 'error'
  message: string
  totalFound: number
  relevantFound: number
  applyNowCount: number
  prepareFirstCount: number
  skipCount: number
  error?: string
}

