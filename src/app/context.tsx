import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_STUDENT_PROFILE, DEMO_STUDENT_PROJECTS, DEMO_STUDENT_SKILLS } from '@/data/demo-profile'
import { SEED_OPPORTUNITIES } from '@/data/seed-opportunities'
import { processUploadedDocument, type DocumentAnalysisResult } from '@/lib/documents/document-intelligence'
import { OpportunitySearchOrchestrator } from '@/features/opportunities/search/orchestrator'
import { calculateMatch } from '@/lib/matching/engine'
import type {
  ApplicationItem,
  ApplicationStatus,
  LiveSearchProgress,
  MatchResult,
  Opportunity,
  ProjectItem,
  ProviderHealth,
  SkillEvidenceItem,
  StudentProfile,
  UploadedDocument,
} from '@/types'

const INITIAL_USER_PROFILE: StudentProfile = {
  id: 'user-connected-me',
  fullName: 'Student Candidate',
  email: '',
  university: 'University Student',
  degree: 'B.Tech',
  branch: 'Computer Science & Engineering',
  currentYear: 3,
  graduationYear: 2026,
  location: 'Bengaluru / Remote',
  preferredLocations: ['Bengaluru', 'Remote'],
  workModePreference: 'hybrid',
  availableFrom: new Date().toISOString().split('T')[0],
  availableDurationMonths: 3,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  githubUsername: '',
  careerInterests: ['AI Engineering', 'Full Stack Development'],
  targetRole: 'Software Engineering Intern',
  bio: '',
}

const INITIAL_USER_SKILLS: SkillEvidenceItem[] = []
const INITIAL_USER_PROJECTS: ProjectItem[] = []

export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  createdAt: string
}

interface AppContextType {
  currentUser: AuthUser | null
  login: (email: string, password?: string) => Promise<boolean>
  signup: (fullName: string, email: string, password?: string) => Promise<boolean>
  logout: () => void
  enterDemoMode: () => void
  profile: StudentProfile
  skills: SkillEvidenceItem[]
  projects: ProjectItem[]
  documents: UploadedDocument[]
  opportunities: Opportunity[]
  matches: Map<string, MatchResult>
  applications: ApplicationItem[]
  comparisonIds: string[]
  isDemoMode: boolean
  searchProgress: LiveSearchProgress
  liveCounts: {
    totalDiscovered: number
    deduplicated: number
    analyzed: number
    applyNow: number
    prepareFirst: number
    skip: number
  } | null
  integrations: {
    openrouter?: ProviderHealth
    adzuna?: ProviderHealth
    github?: ProviderHealth
  }
  setIsDemoMode: (isDemo: boolean) => void
  updateProfile: (profile: Partial<StudentProfile>) => void
  recordAssessmentResult: (skillName: string, score: number) => void
  uploadDocument: (file: File, type: 'resume' | 'presentation' | 'report' | 'certificate') => Promise<DocumentAnalysisResult>
  searchLiveOpportunities: (forceRefresh?: boolean) => Promise<void>
  refreshIntegrations: () => Promise<void>
  addApplication: (opportunityId: string, status?: ApplicationStatus, notes?: string) => void
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void
  updateApplicationNotes: (applicationId: string, notes: string) => void
  toggleComparison: (opportunityId: string) => void
  clearComparison: () => void
  resetToDemo: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const STORAGE_KEYS = {
  MODE: 'internsync_demo_mode_v2',
  DEMO_PROFILE: 'internsync_demo_profile_v1',
  USER_PROFILE: 'internsync_user_profile_v1',
  USER_SKILLS: 'internsync_user_skills_v1',
  USER_PROJECTS: 'internsync_user_projects_v1',
  DOCUMENTS: 'internsync_documents_v1',
  APPLICATIONS: 'internsync_applications_v1',
  LIVE_OPPORTUNITIES: 'internsync_live_opps_v1',
  AUTH_USER: 'internsync_auth_user_v1',
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Mode selection (defaults to real connected mode)
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODE)
      return saved !== null ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  // User Profile
  const [userProfile, setUserProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE
    } catch {
      return INITIAL_USER_PROFILE
    }
  })

  // User Skills
  const [userSkills, setUserSkills] = useState<SkillEvidenceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_SKILLS)
      return saved ? JSON.parse(saved) : INITIAL_USER_SKILLS
    } catch {
      return INITIAL_USER_SKILLS
    }
  })

  // User Projects
  const [userProjects, setUserProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROJECTS)
      return saved ? JSON.parse(saved) : INITIAL_USER_PROJECTS
    } catch {
      return INITIAL_USER_PROJECTS
    }
  })

  // Uploaded Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Live opportunities discovered
  const [liveOpportunities, setLiveOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIVE_OPPORTUNITIES)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Live search progress state
  const [searchProgress, setSearchProgress] = useState<LiveSearchProgress>({
    stage: 'idle',
    message: '',
    totalFound: 0,
    relevantFound: 0,
    applyNowCount: 0,
    prepareFirstCount: 0,
    skipCount: 0,
  })

  const [liveCounts, setLiveCounts] = useState<{
    totalDiscovered: number
    deduplicated: number
    analyzed: number
    applyNow: number
    prepareFirst: number
    skip: number
  } | null>(null)

  // Integrations state
  const [integrations, setIntegrations] = useState<{
    openrouter?: ProviderHealth
    adzuna?: ProviderHealth
    github?: ProviderHealth
  }>({})

  // Comparison drawer state
  const [comparisonIds, setComparisonIds] = useState<string[]>([])

  // Applications Kanban state (defaults to real saved applications)
  const [applications, setApplications] = useState<ApplicationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPLICATIONS)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return []
  })

  // Synchronize storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODE, JSON.stringify(isDemoMode))
  }, [isDemoMode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile))
  }, [userProfile])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_SKILLS, JSON.stringify(userSkills))
  }, [userSkills])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROJECTS, JSON.stringify(userProjects))
  }, [userProjects])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents))
  }, [documents])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications))
  }, [applications])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LIVE_OPPORTUNITIES, JSON.stringify(liveOpportunities))
  }, [liveOpportunities])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
    }
  }, [currentUser])

  const login = async (email: string, _password?: string): Promise<boolean> => {
    const user: AuthUser = {
      id: userProfile.id || `user-${Date.now()}`,
      email,
      fullName: userProfile.fullName || email.split('@')[0],
      createdAt: new Date().toISOString(),
    }
    setCurrentUser(user)
    setIsDemoModeState(false)
    return true
  }

  const signup = async (fullName: string, email: string, _password?: string): Promise<boolean> => {
    const user: AuthUser = {
      id: `user-${Date.now()}`,
      email,
      fullName,
      createdAt: new Date().toISOString(),
    }
    setCurrentUser(user)
    setIsDemoModeState(false)
    // Initialize personal profile for the authenticated student (never Rahul Sharma)
    setUserProfile({
      id: user.id,
      fullName,
      email,
      university: '',
      degree: 'B.Tech',
      branch: 'Computer Science',
      currentYear: 3,
      graduationYear: 2026,
      location: 'Bengaluru',
      preferredLocations: ['Bengaluru', 'Remote'],
      workModePreference: 'hybrid',
      availableFrom: new Date().toISOString().split('T')[0],
      availableDurationMonths: 3,
      careerInterests: ['AI Engineering', 'Full Stack Development'],
      targetRole: 'Software Engineering Intern',
      bio: '',
    })
    setUserSkills([])
    setUserProjects([])
    setLiveOpportunities([])
    return true
  }

  const logout = () => {
    setCurrentUser(null)
    setIsDemoModeState(false)
  }

  const enterDemoMode = () => {
    setIsDemoModeState(true)
  }

  // Active profile, skills, projects based on mode & authenticated user
  const activeProfile = useMemo(() => {
    if (isDemoMode) return DEMO_STUDENT_PROFILE
    if (currentUser) {
      return {
        ...userProfile,
        fullName: currentUser.fullName || userProfile.fullName,
        email: currentUser.email || userProfile.email,
      }
    }
    return userProfile
  }, [isDemoMode, currentUser, userProfile])

  const activeSkills = isDemoMode ? DEMO_STUDENT_SKILLS : userSkills
  const activeProjects = isDemoMode ? DEMO_STUDENT_PROJECTS : userProjects

  // Active opportunities based on mode (real live opportunities prioritized)
  const activeOpportunities = useMemo(() => {
    if (isDemoMode) {
      return SEED_OPPORTUNITIES
    }
    return liveOpportunities
  }, [isDemoMode, liveOpportunities])

  // Recalculate matches deterministically whenever active data changes
  const matches = useMemo(() => {
    const map = new Map<string, MatchResult>()
    activeOpportunities.forEach((opp) => {
      const result = calculateMatch({
        student: activeProfile,
        skills: activeSkills,
        projects: activeProjects,
        opportunity: opp,
      })
      map.set(opp.id, result)
    })
    return map
  }, [activeProfile, activeSkills, activeProjects, activeOpportunities])

  // Fetch integration health on mount
  const refreshIntegrations = async () => {
    try {
      const res = await fetch('/api/settings/health')
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data)
      }
    } catch {
      // fallback
    }
  }

  useEffect(() => {
    refreshIntegrations()
  }, [])

  const setIsDemoMode = (demo: boolean) => {
    setIsDemoModeState(demo)
  }

  const updateProfile = (updates: Partial<StudentProfile>) => {
    if (isDemoMode) {
      // In demo mode, apply locally
    } else {
      setUserProfile((prev) => ({ ...prev, ...updates }))
    }
  }

  // Upload document handler
  const uploadDocument = async (
    file: File,
    type: 'resume' | 'presentation' | 'report' | 'certificate'
  ): Promise<DocumentAnalysisResult> => {
    const result = await processUploadedDocument(file, type, activeProfile, activeSkills)

    setDocuments((prev) => [result.document, ...prev])

    if (!isDemoMode) {
      if (result.updatedProfile) {
        setUserProfile((prev) => ({ ...prev, ...result.updatedProfile }))
      }
      setUserSkills(result.newSkills)
      if (result.newProjects.length > 0) {
        setUserProjects((prev) => [...result.newProjects, ...prev])
      }
    }

    return result
  }

  // Live opportunity search runner
  const searchLiveOpportunities = async (forceRefresh = false) => {
    const orchestrator = new OpportunitySearchOrchestrator()
    try {
      const run = await orchestrator.runDiscovery(
        activeProfile,
        activeSkills,
        isDemoMode,
        (progress) => setSearchProgress(progress),
        forceRefresh
      )

      if (run.opportunities.length > 0) {
        if (!isDemoMode) {
          setLiveOpportunities(run.opportunities)
        }
        setLiveCounts(run.counts)
      }
    } catch (err: unknown) {
      setSearchProgress({
        stage: 'error',
        message: err instanceof Error ? err.message : 'Discovery run encountered an error',
        totalFound: 0,
        relevantFound: 0,
        applyNowCount: 0,
        prepareFirstCount: 0,
        skipCount: 0,
        error: String(err),
      })
    }
  }

  const recordAssessmentResult = (skillName: string, score: number) => {
    const updater = (prev: SkillEvidenceItem[]) => {
      const existing = prev.find(
        (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
      )
      if (existing) {
        return prev.map((s) =>
          s.skillName.toLowerCase() === skillName.toLowerCase()
            ? {
                ...s,
                assessmentScore: score,
                confidence: Math.min(100, Math.max(s.confidence, Math.round((s.confidence + score) / 2) + 5)),
                evidenceSources: Array.from(new Set([...s.evidenceSources, 'assessment'] as const)),
                lastValidatedAt: new Date().toISOString(),
              }
            : s
        )
      } else {
        return [
          ...prev,
          {
            skillName,
            category: 'languages' as const,
            confidence: Math.round(score * 0.9),
            evidenceSources: ['assessment'] as ('resume' | 'project' | 'github' | 'assessment')[],
            assessmentScore: score,
            projectCount: 0,
            githubStrength: 'none' as const,
            lastValidatedAt: new Date().toISOString(),
          },
        ]
      }
    }

    if (isDemoMode) {
      // demo updates
    } else {
      setUserSkills(updater)
    }
  }

  const addApplication = (opportunityId: string, status: ApplicationStatus = 'saved', notes = '') => {
    const opp = activeOpportunities.find((o) => o.id === opportunityId)
    if (!opp) return

    setApplications((prev) => {
      if (prev.some((a) => a.opportunityId === opportunityId)) {
        return prev
      }
      const match = matches.get(opportunityId)
      const newApp: ApplicationItem = {
        id: `app-${Date.now()}`,
        studentId: activeProfile.id,
        opportunityId,
        opportunity: opp,
        matchScore: match?.overallMatchScore || 70,
        recommendation: match?.recommendation || 'APPLY NOW',
        status,
        notes: notes || `Added to ${status} stage.`,
        appliedAt: status === 'applied' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      }
      return [newApp, ...prev]
    })
  }

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status,
              appliedAt: status === 'applied' && !app.appliedAt ? new Date().toISOString() : app.appliedAt,
              updatedAt: new Date().toISOString(),
            }
          : app
      )
    )
  }

  const updateApplicationNotes = (applicationId: string, notes: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, notes, updatedAt: new Date().toISOString() }
          : app
      )
    )
  }

  const toggleComparison = (opportunityId: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(opportunityId)) {
        return prev.filter((id) => id !== opportunityId)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), opportunityId]
      }
      return [...prev, opportunityId]
    })
  }

  const clearComparison = () => {
    setComparisonIds([])
  }

  const resetToDemo = () => {
    setIsDemoModeState(true)
    setComparisonIds([])
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        signup,
        logout,
        enterDemoMode,
        profile: activeProfile,
        skills: activeSkills,
        projects: activeProjects,
        documents,
        opportunities: activeOpportunities,
        matches,
        applications,
        comparisonIds,
        isDemoMode,
        searchProgress,
        liveCounts,
        integrations,
        setIsDemoMode,
        updateProfile,
        recordAssessmentResult,
        uploadDocument,
        searchLiveOpportunities,
        refreshIntegrations,
        addApplication,
        updateApplicationStatus,
        updateApplicationNotes,
        toggleComparison,
        clearComparison,
        resetToDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
