import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { DEMO_STUDENT_PROFILE, DEMO_STUDENT_PROJECTS, DEMO_STUDENT_SKILLS } from '@/data/demo-profile'
import { SEED_OPPORTUNITIES } from '@/data/seed-opportunities'
import { processUploadedDocument, type DocumentAnalysisResult } from '@/lib/documents/document-intelligence'
import { OpportunitySearchOrchestrator } from '@/features/opportunities/search/orchestrator'
import { calculateMatch } from '@/lib/matching/engine'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  fetchUserProfile,
  upsertUserProfile,
  fetchUserSkills,
  upsertUserSkill,
  fetchUserProjects,
  insertUserProject,
  fetchUserApplications,
  upsertUserApplication,
} from '@/lib/supabase/database'
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

const BLANK_STUDENT_PROFILE: StudentProfile = {
  id: '',
  fullName: '',
  email: '',
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
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  githubUsername: '',
  careerInterests: ['AI Engineering', 'Full Stack Development'],
  targetRole: 'Software Engineering Intern',
  bio: '',
}

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
  logout: () => Promise<void>
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
  isSupabaseConfigured: boolean
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
  }
  setIsDemoMode: (isDemo: boolean) => void
  updateProfile: (profile: Partial<StudentProfile>) => void
  recordAssessmentResult: (skillName: string, score: number) => void
  uploadDocument: (file: File, type: 'resume' | 'presentation' | 'report' | 'certificate') => Promise<DocumentAnalysisResult>
  deleteDocument: (docId: string) => Promise<void>
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
  MODE: 'internsync_demo_mode_v3',
  USER_PROFILE: 'internsync_user_profile_v3',
  USER_SKILLS: 'internsync_user_skills_v3',
  USER_PROJECTS: 'internsync_user_projects_v3',
  DOCUMENTS: 'internsync_documents_v3',
  APPLICATIONS: 'internsync_applications_v3',
  LIVE_OPPORTUNITIES: 'internsync_live_opps_v3',
  AUTH_USER: 'internsync_auth_user_v3',
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

  // Real User Profile (blank by default for new real accounts)
  const [userProfile, setUserProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
      return saved ? JSON.parse(saved) : BLANK_STUDENT_PROFILE
    } catch {
      return BLANK_STUDENT_PROFILE
    }
  })

  // Real User Skills (empty by default for new accounts)
  const [userSkills, setUserSkills] = useState<SkillEvidenceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_SKILLS)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Real User Projects (empty by default for new accounts)
  const [userProjects, setUserProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROJECTS)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Real Uploaded Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Live opportunities discovered via real search
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
  }>({})

  // Comparison drawer state
  const [comparisonIds, setComparisonIds] = useState<string[]>([])

  // Applications Kanban state
  const [applications, setApplications] = useState<ApplicationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPLICATIONS)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return []
  })

  // Restore real Supabase session & register auth listener on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let isMounted = true

    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted || error || !session) return

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
        createdAt: session.user.created_at,
      }
      setCurrentUser(authUser)

      // Fetch user records from Supabase
      fetchUserProfile(session.user.id).then((profile) => {
        if (profile && isMounted) {
          setUserProfile((prev) => ({
            ...prev,
            ...profile,
            id: session.user.id,
            email: session.user.email || prev.email,
          }))
        }
      })

      fetchUserSkills(session.user.id).then((skills) => {
        if (skills && skills.length > 0 && isMounted) setUserSkills(skills)
      })

      fetchUserProjects(session.user.id).then((projects) => {
        if (projects && projects.length > 0 && isMounted) setUserProjects(projects)
      })

      fetchUserApplications(session.user.id).then((apps) => {
        if (apps && apps.length > 0 && isMounted) setApplications(apps)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      if (session) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
          createdAt: session.user.created_at,
        }
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Synchronize storage for offline access & seamless restoration
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

  // Login handler
  const login = async (email: string, password?: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      if (!password) {
        throw new Error('Please enter your password.')
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        const user: AuthUser = {
          id: data.session.user.id,
          email: data.session.user.email || email,
          fullName: data.session.user.user_metadata?.full_name || email.split('@')[0],
          createdAt: data.session.user.created_at,
        }
        setCurrentUser(user)
        setIsDemoModeState(false)

        // Load profile and state for authenticated user
        const profile = await fetchUserProfile(user.id)
        if (profile) {
          setUserProfile({ ...profile, id: user.id, email: user.email })
        } else {
          setUserProfile({
            ...BLANK_STUDENT_PROFILE,
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          })
        }

        const skills = await fetchUserSkills(user.id)
        setUserSkills(skills)

        const projects = await fetchUserProjects(user.id)
        setUserProjects(projects)

        const apps = await fetchUserApplications(user.id)
        setApplications(apps)

        return true
      }
      return false
    }

    // If Supabase is unconfigured, reject simulated login
    throw new Error(
      'Authentication service is unavailable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts, or switch to Demo Mode to explore.'
    )
  }

  // Signup handler
  const signup = async (fullName: string, email: string, password?: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) {
        throw new Error(error.message)
      }

      const user: AuthUser = {
        id: data.user?.id || `user-${Date.now()}`,
        email,
        fullName,
        createdAt: new Date().toISOString(),
      }
      setCurrentUser(user)
      setIsDemoModeState(false)

      const initialProfile: StudentProfile = {
        ...BLANK_STUDENT_PROFILE,
        id: user.id,
        fullName,
        email,
      }
      setUserProfile(initialProfile)
      setUserSkills([])
      setUserProjects([])
      setLiveOpportunities([])
      setApplications([])

      if (data.user?.id) {
        await upsertUserProfile(initialProfile)
      }

      return true
    }

    throw new Error(
      'Account creation is unavailable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts, or switch to Demo Mode to explore.'
    )
  }

  // Logout handler
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {})
    }
    setCurrentUser(null)
    setIsDemoModeState(false)
    setUserProfile(BLANK_STUDENT_PROFILE)
    setUserSkills([])
    setUserProjects([])
    setApplications([])
    setLiveOpportunities([])
    setDocuments([])
  }

  const enterDemoMode = () => {
    setIsDemoModeState(true)
  }

  // Active profile, skills, projects based strictly on mode & authenticated user
  const activeProfile = useMemo(() => {
    if (isDemoMode) return DEMO_STUDENT_PROFILE
    if (currentUser) {
      return {
        ...userProfile,
        id: currentUser.id,
        fullName: userProfile.fullName || currentUser.fullName,
        email: userProfile.email || currentUser.email,
      }
    }
    return userProfile
  }, [isDemoMode, currentUser, userProfile])

  const activeSkills = isDemoMode ? DEMO_STUDENT_SKILLS : userSkills
  const activeProjects = isDemoMode ? DEMO_STUDENT_PROJECTS : userProjects

  // Active opportunities based strictly on mode (real live opportunities prioritized)
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

  // Fetch integration health
  const refreshIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/health')
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data)
      }
    } catch {
      // fallback
    }
  }, [])

  useEffect(() => {
    refreshIntegrations()
  }, [refreshIntegrations])

  const setIsDemoMode = (demo: boolean) => {
    setIsDemoModeState(demo)
  }

  const updateProfile = (updates: Partial<StudentProfile>) => {
    if (isDemoMode) {
      // Demo mode updates remain in-memory
    } else {
      setUserProfile((prev) => {
        const updated = { ...prev, ...updates }
        if (currentUser && isSupabaseConfigured) {
          upsertUserProfile(updated)
        }
        return updated
      })
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
        setUserProfile((prev) => {
          const updated = { ...prev, ...result.updatedProfile }
          if (currentUser && isSupabaseConfigured) {
            upsertUserProfile(updated)
          }
          return updated
        })
      }

      setUserSkills((_prev) => {
        const merged = result.newSkills
        if (currentUser && isSupabaseConfigured) {
          merged.forEach((s) => upsertUserSkill(currentUser.id, s))
        }
        return merged
      })

      if (result.newProjects.length > 0) {
        setUserProjects((prev) => {
          const updated = [...result.newProjects, ...prev]
          if (currentUser && isSupabaseConfigured) {
            result.newProjects.forEach((p) => insertUserProject(p))
          }
          return updated
        })
      }
    }

    return result
  }

  // Delete document handler
  const deleteDocument = async (docId: string): Promise<void> => {
    const doc = documents.find((d) => d.id === docId)
    if (doc?.storagePath && isSupabaseConfigured) {
      try {
        const { deleteDocumentFromStorage } = await import('@/lib/supabase/database')
        await deleteDocumentFromStorage(doc.storagePath)
      } catch {
        // Continue to remove locally
      }
    }
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
  }

  // Live opportunity search runner
  const searchLiveOpportunities = async (forceRefresh = false) => {
    const orchestrator = new OpportunitySearchOrchestrator()
    try {
      const run = await orchestrator.runDiscovery(
        activeProfile,
        activeSkills,
        activeProjects,
        isDemoMode,
        (progress) => setSearchProgress(progress),
        forceRefresh
      )

      if (run.opportunities.length > 0) {
        if (!isDemoMode) {
          setLiveOpportunities(run.opportunities)
        }
        setLiveCounts(run.counts)
      } else {
        if (!isDemoMode) {
          setLiveOpportunities([])
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
        const updated = prev.map((s) =>
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
        const item = updated.find((s) => s.skillName.toLowerCase() === skillName.toLowerCase())
        if (item && currentUser && isSupabaseConfigured) {
          upsertUserSkill(currentUser.id, item)
        }
        return updated
      } else {
        const newSkill: SkillEvidenceItem = {
          skillName,
          category: 'languages' as const,
          confidence: Math.round(score * 0.9),
          evidenceSources: ['assessment'] as ('resume' | 'project' | 'github' | 'assessment')[],
          assessmentScore: score,
          projectCount: 0,
          githubStrength: 'none' as const,
          lastValidatedAt: new Date().toISOString(),
        }
        if (currentUser && isSupabaseConfigured) {
          upsertUserSkill(currentUser.id, newSkill)
        }
        return [...prev, newSkill]
      }
    }

    if (!isDemoMode) {
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

      if (currentUser && isSupabaseConfigured) {
        upsertUserApplication(newApp)
      }

      return [newApp, ...prev]
    })
  }

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) {
          const updated = {
            ...app,
            status,
            appliedAt: status === 'applied' && !app.appliedAt ? new Date().toISOString() : app.appliedAt,
            updatedAt: new Date().toISOString(),
          }
          if (currentUser && isSupabaseConfigured) {
            upsertUserApplication(updated)
          }
          return updated
        }
        return app
      })
    )
  }

  const updateApplicationNotes = (applicationId: string, notes: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) {
          const updated = { ...app, notes, updatedAt: new Date().toISOString() }
          if (currentUser && isSupabaseConfigured) {
            upsertUserApplication(updated)
          }
          return updated
        }
        return app
      })
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
        isSupabaseConfigured,
        searchProgress,
        liveCounts,
        integrations,
        setIsDemoMode,
        updateProfile,
        recordAssessmentResult,
        uploadDocument,
        deleteDocument,
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
