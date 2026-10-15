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
  fetchUserDocuments,
  deleteUserDocument,
} from '@/lib/supabase/database'
import { generateApplicationId } from '@/lib/utils/uuid'
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

import { BLANK_STUDENT_PROFILE } from '@/data/blank-profile'
export { BLANK_STUDENT_PROFILE }

export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  createdAt: string
}

export interface SignupResult {
  success: boolean
  requiresVerification?: boolean
  email?: string
}

interface AppContextType {
  currentUser: AuthUser | null
  login: (email: string, password?: string) => Promise<boolean>
  signup: (fullName: string, email: string, password?: string) => Promise<SignupResult>
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
  uploadDocument: (
    file: File,
    type: 'resume' | 'presentation' | 'report' | 'certificate'
  ) => Promise<DocumentAnalysisResult>
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

const GLOBAL_STORAGE_KEYS = {
  MODE: 'internsync_demo_mode_v4',
  AUTH_USER: 'internsync_auth_user_v4',
}

function getUserStorageKey(userId: string | null, key: string): string {
  if (!userId) return `internsync_guest_${key}_v4`
  return `internsync_u_${userId}_${key}_v4`
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(GLOBAL_STORAGE_KEYS.AUTH_USER)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Mode selection (defaults to real connected mode)
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(GLOBAL_STORAGE_KEYS.MODE)
      return saved !== null ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  // User Profile (blank by default for new real accounts)
  const [userProfile, setUserProfile] = useState<StudentProfile>(() => {
    if (!currentUser?.id) return BLANK_STUDENT_PROFILE
    try {
      const saved = localStorage.getItem(getUserStorageKey(currentUser.id, 'profile'))
      return saved ? JSON.parse(saved) : BLANK_STUDENT_PROFILE
    } catch {
      return BLANK_STUDENT_PROFILE
    }
  })

  // User Skills (empty by default for new accounts)
  const [userSkills, setUserSkills] = useState<SkillEvidenceItem[]>(() => {
    if (!currentUser?.id) return []
    try {
      const saved = localStorage.getItem(getUserStorageKey(currentUser.id, 'skills'))
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // User Projects (empty by default for new accounts)
  const [userProjects, setUserProjects] = useState<ProjectItem[]>(() => {
    if (!currentUser?.id) return []
    try {
      const saved = localStorage.getItem(getUserStorageKey(currentUser.id, 'projects'))
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Uploaded Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    if (!currentUser?.id) return []
    try {
      const saved = localStorage.getItem(getUserStorageKey(currentUser.id, 'documents'))
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Live opportunities discovered via real search
  const [liveOpportunities, setLiveOpportunities] = useState<Opportunity[]>(() => {
    if (!currentUser?.id) return []
    try {
      const saved = localStorage.getItem(getUserStorageKey(currentUser.id, 'live_opps'))
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Applications Kanban state
  const [applications, setApplications] = useState<ApplicationItem[]>(() => {
    if (!currentUser?.id) return []
    try {
      const saved = localStorage.getItem(getUserStorageKey(currentUser.id, 'applications'))
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

  /**
   * Loads an authenticated user's records from Supabase.
   * Completely replaces in-memory state unconditionally to prevent cross-account data leaks.
   */
  const loadUserData = useCallback(async (userId: string, email: string, fullName: string) => {
    // 1. Reset all state to clean baseline for the authenticated user
    setUserProfile({
      ...BLANK_STUDENT_PROFILE,
      id: userId,
      email,
      fullName,
    })
    setUserSkills([])
    setUserProjects([])
    setDocuments([])
    setApplications([])
    setLiveOpportunities([])

    // 2. Query Supabase for authoritative state
    try {
      const profile = await fetchUserProfile(userId)
      if (profile) {
        setUserProfile({
          ...profile,
          id: userId,
          email: email || profile.email,
        })
      }

      const skills = await fetchUserSkills(userId)
      setUserSkills(skills ?? [])

      const projects = await fetchUserProjects(userId)
      setUserProjects(projects ?? [])

      const docs = await fetchUserDocuments(userId)
      setDocuments(docs ?? [])

      const apps = await fetchUserApplications(userId)
      setApplications(apps ?? [])
    } catch (err) {
      console.warn('[Context] Error restoring session data:', err)
    }
  }, [])

  // Restore real Supabase session & register auth listener on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let isMounted = true

    // Check active session on initial load
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!isMounted || error || !session) return

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        fullName:
          session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
        createdAt: session.user.created_at,
      }
      setCurrentUser(authUser)
      await loadUserData(session.user.id, authUser.email, authUser.fullName)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      if (session) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName:
            session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
          createdAt: session.user.created_at,
        }
        setCurrentUser(user)
        setIsDemoModeState(false)
        await loadUserData(session.user.id, user.email, user.fullName)
      } else {
        // No active Supabase session
        // Only clear state if NOT in Demo Mode (preserves offline/demo judging on page refresh)
        let inDemo = false
        try {
          const savedMode = localStorage.getItem(GLOBAL_STORAGE_KEYS.MODE)
          inDemo = savedMode !== null ? JSON.parse(savedMode) : false
        } catch {
          inDemo = false
        }

        if (!inDemo) {
          setCurrentUser(null)
          setIsDemoModeState(false)
          setUserProfile(BLANK_STUDENT_PROFILE)
          setUserSkills([])
          setUserProjects([])
          setDocuments([])
          setApplications([])
          setLiveOpportunities([])
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadUserData])

  // Synchronize user-scoped storage for offline resilience
  useEffect(() => {
    localStorage.setItem(GLOBAL_STORAGE_KEYS.MODE, JSON.stringify(isDemoMode))
  }, [isDemoMode])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(GLOBAL_STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(GLOBAL_STORAGE_KEYS.AUTH_USER)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser?.id && !isDemoMode) {
      localStorage.setItem(getUserStorageKey(currentUser.id, 'profile'), JSON.stringify(userProfile))
    }
  }, [currentUser?.id, userProfile, isDemoMode])

  useEffect(() => {
    if (currentUser?.id && !isDemoMode) {
      localStorage.setItem(getUserStorageKey(currentUser.id, 'skills'), JSON.stringify(userSkills))
    }
  }, [currentUser?.id, userSkills, isDemoMode])

  useEffect(() => {
    if (currentUser?.id && !isDemoMode) {
      localStorage.setItem(getUserStorageKey(currentUser.id, 'projects'), JSON.stringify(userProjects))
    }
  }, [currentUser?.id, userProjects, isDemoMode])

  useEffect(() => {
    if (currentUser?.id && !isDemoMode) {
      localStorage.setItem(getUserStorageKey(currentUser.id, 'documents'), JSON.stringify(documents))
    }
  }, [currentUser?.id, documents, isDemoMode])

  useEffect(() => {
    if (currentUser?.id && !isDemoMode) {
      localStorage.setItem(getUserStorageKey(currentUser.id, 'applications'), JSON.stringify(applications))
    }
  }, [currentUser?.id, applications, isDemoMode])

  useEffect(() => {
    if (currentUser?.id && !isDemoMode) {
      localStorage.setItem(getUserStorageKey(currentUser.id, 'live_opps'), JSON.stringify(liveOpportunities))
    }
  }, [currentUser?.id, liveOpportunities, isDemoMode])

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
        await loadUserData(user.id, user.email, user.fullName)
        return true
      }
      return false
    }

    throw new Error(
      'Authentication service is unavailable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts, or switch to Demo Mode to explore.'
    )
  }

  // Signup handler respecting email verification
  const signup = async (
    fullName: string,
    email: string,
    password?: string
  ): Promise<SignupResult> => {
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

      // If email confirmation is required by Supabase, session is null
      if (!data.session) {
        return {
          success: true,
          requiresVerification: true,
          email,
        }
      }

      // Immediate session
      const user: AuthUser = {
        id: data.session.user.id,
        email: data.session.user.email || email,
        fullName: data.session.user.user_metadata?.full_name || fullName,
        createdAt: data.session.user.created_at,
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
      setDocuments([])
      setApplications([])
      setLiveOpportunities([])

      await upsertUserProfile(initialProfile)
      return { success: true, requiresVerification: false, email }
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
    try {
      localStorage.removeItem(GLOBAL_STORAGE_KEYS.MODE)
    } catch {
      // ignore
    }
    setUserProfile(BLANK_STUDENT_PROFILE)
    setUserSkills([])
    setUserProjects([])
    setDocuments([])
    setApplications([])
    setLiveOpportunities([])
  }

  const enterDemoMode = () => {
    setIsDemoModeState(true)
    try {
      localStorage.setItem(GLOBAL_STORAGE_KEYS.MODE, JSON.stringify(true))
    } catch {
      // ignore
    }
  }

  // Active profile, skills, projects based strictly on mode & authenticated user
  const activeProfile = useMemo(() => {
    if (isDemoMode) return DEMO_STUDENT_PROFILE
    if (currentUser) {
      return {
        ...userProfile,
        id: currentUser.id,
        email: currentUser.email || userProfile.email,
        fullName: userProfile.fullName || currentUser.fullName,
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
    try {
      localStorage.setItem(GLOBAL_STORAGE_KEYS.MODE, JSON.stringify(demo))
    } catch {
      // ignore
    }
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

  // Upload document handler with true persistence
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

  // Delete document handler connected to actual DB and Storage
  const deleteDocument = async (docId: string): Promise<void> => {
    const doc = documents.find((d) => d.id === docId)
    if (currentUser && isSupabaseConfigured) {
      try {
        await deleteUserDocument(docId, doc?.storagePath)
      } catch (err) {
        console.warn('[Context] Failed to delete document from backend:', err)
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
                confidence: Math.min(
                  100,
                  Math.max(s.confidence, Math.round((s.confidence + score) / 2) + 5)
                ),
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

  const addApplication = (
    opportunityId: string,
    status: ApplicationStatus = 'saved',
    notes = ''
  ) => {
    const opp = activeOpportunities.find((o) => o.id === opportunityId)
    if (!opp) return

    setApplications((prev) => {
      if (prev.some((a) => a.opportunityId === opportunityId)) {
        return prev
      }
      const match = matches.get(opportunityId)
      const studentId = activeProfile.id || currentUser?.id || 'guest-student'
      const newApp: ApplicationItem = {
        id: generateApplicationId(studentId, opportunityId),
        studentId,
        opportunityId,
        opportunity: opp,
        matchScore: match?.overallMatchScore ?? 0,
        recommendation: match?.recommendation ?? 'APPLY NOW',
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
            appliedAt:
              status === 'applied' && !app.appliedAt ? new Date().toISOString() : app.appliedAt,
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
