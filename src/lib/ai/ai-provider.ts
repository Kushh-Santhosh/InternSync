import type {
  AssistantMessage,
  CareerDirectionRoleFit,
  Opportunity,
  ProjectItem,
  SkillEvidenceItem,
  StudentProfile,
} from '@/types'

export interface StructuredResumeResult {
  personal: {
    fullName: string
    email: string
    location: string
    university: string
    degree: string
    branch: string
    currentYear: number
    graduationYear: number
  }
  skills: {
    name: string
    category: 'frontend' | 'backend' | 'ai_ml' | 'data' | 'languages' | 'tools'
    confidence: number
  }[]
  projects: {
    title: string
    description: string
    technologies: string[]
    evidenceStrength: 'strong' | 'moderate' | 'limited'
    highlights: string[]
  }[]
  careerInterests: string[]
  summary: string
}

export interface MatchContext {
  student: StudentProfile
  skills: SkillEvidenceItem[]
  projects: ProjectItem[]
  opportunity: Opportunity
}

export interface AIProvider {
  name: string
  analyzeResume(resumeText: string): Promise<StructuredResumeResult>
  generateCareerDirection(interests: string[]): Promise<CareerDirectionRoleFit[]>
  askAssistant(messages: AssistantMessage[], context: {
    student: StudentProfile
    opportunities: Opportunity[]
  }): Promise<string>
}
