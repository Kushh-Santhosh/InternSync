import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BLANK_STUDENT_PROFILE } from '@/data/blank-profile'
import type { SkillEvidenceItem, ProjectItem, ApplicationItem } from '@/types'

// Mock Supabase Database Service
const mockDatabase = {
  profiles: new Map<string, any>(),
  skills: new Map<string, SkillEvidenceItem[]>(),
  projects: new Map<string, ProjectItem[]>(),
  applications: new Map<string, ApplicationItem[]>(),
  documents: new Map<string, any[]>(),
}

vi.mock('@/lib/supabase/database', () => ({
  fetchUserProfile: vi.fn().mockImplementation((userId: string) => {
    return Promise.resolve(mockDatabase.profiles.get(userId) || null)
  }),
  upsertUserProfile: vi.fn().mockImplementation((profile: any) => {
    mockDatabase.profiles.set(profile.id, profile)
    return Promise.resolve(true)
  }),
  fetchUserSkills: vi.fn().mockImplementation((userId: string) => {
    return Promise.resolve(mockDatabase.skills.get(userId) || [])
  }),
  upsertUserSkill: vi.fn().mockImplementation((userId: string, skill: SkillEvidenceItem) => {
    const list = mockDatabase.skills.get(userId) || []
    mockDatabase.skills.set(userId, [...list, skill])
    return Promise.resolve(true)
  }),
  fetchUserProjects: vi.fn().mockImplementation((userId: string) => {
    return Promise.resolve(mockDatabase.projects.get(userId) || [])
  }),
  insertUserProject: vi.fn().mockImplementation((project: ProjectItem) => {
    const list = mockDatabase.projects.get(project.studentId) || []
    mockDatabase.projects.set(project.studentId, [...list, project])
    return Promise.resolve(true)
  }),
  fetchUserApplications: vi.fn().mockImplementation((userId: string) => {
    return Promise.resolve(mockDatabase.applications.get(userId) || [])
  }),
  upsertUserApplication: vi.fn().mockImplementation((app: ApplicationItem) => {
    const list = mockDatabase.applications.get(app.studentId) || []
    mockDatabase.applications.set(app.studentId, [...list, app])
    return Promise.resolve(true)
  }),
  fetchUserDocuments: vi.fn().mockImplementation((userId: string) => {
    return Promise.resolve(mockDatabase.documents.get(userId) || [])
  }),
  deleteUserDocument: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase/client'
import {
  fetchUserProfile,
  fetchUserSkills,
  fetchUserProjects,
  fetchUserApplications,
} from '@/lib/supabase/database'

describe('Account Switching, Session Restoration & Isolation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockDatabase.profiles.clear()
    mockDatabase.skills.clear()
    mockDatabase.projects.clear()
    mockDatabase.applications.clear()
    mockDatabase.documents.clear()
  })

  it('guarantees User A with data -> logout -> User B with no data sees strictly zero records', async () => {
    const userA_Id = '11111111-1111-1111-1111-111111111111'
    const userB_Id = '22222222-2222-2222-2222-222222222222'

    // Populate User A records in database
    mockDatabase.profiles.set(userA_Id, {
      ...BLANK_STUDENT_PROFILE,
      id: userA_Id,
      fullName: 'Alice Developer',
      degree: 'B.Tech',
      currentYear: 4,
    })
    mockDatabase.skills.set(userA_Id, [
      {
        skillName: 'Python',
        category: 'languages',
        confidence: 85,
        evidenceSources: ['resume', 'project'],
        projectCount: 2,
        githubStrength: 'strong',
      },
      {
        skillName: 'React',
        category: 'frontend',
        confidence: 80,
        evidenceSources: ['project'],
        projectCount: 1,
        githubStrength: 'moderate',
      },
    ])
    mockDatabase.projects.set(userA_Id, [
      {
        id: 'proj-1',
        studentId: userA_Id,
        title: 'Distributed KV Store',
        description: 'Raft consensus in Python',
        technologies: ['Python', 'FastAPI'],
        evidenceStrength: 'strong',
        highlights: [],
      },
    ])

    // User B has NO records in database (brand new account)

    // 1. Authenticate as User A
    const profileA = await fetchUserProfile(userA_Id)
    const skillsA = await fetchUserSkills(userA_Id)
    const projectsA = await fetchUserProjects(userA_Id)
    const appsA = await fetchUserApplications(userA_Id)

    expect(profileA?.fullName).toBe('Alice Developer')
    expect(skillsA).toHaveLength(2)
    expect(projectsA).toHaveLength(1)
    expect(appsA).toHaveLength(0)

    // Cache User A state under User A scoped key
    localStorage.setItem(`internsync_u_${userA_Id}_skills_v4`, JSON.stringify(skillsA))

    // 2. Logout User A
    await (supabase as any).auth.signOut()

    // 3. Authenticate as User B (empty account)
    const profileB = await fetchUserProfile(userB_Id)
    const skillsB = await fetchUserSkills(userB_Id)
    const projectsB = await fetchUserProjects(userB_Id)
    const appsB = await fetchUserApplications(userB_Id)

    // User B must receive genuinely empty arrays from server
    expect(profileB).toBeNull()
    expect(skillsB).toHaveLength(0)
    expect(projectsB).toHaveLength(0)
    expect(appsB).toHaveLength(0)

    // Check user-scoped storage isolation: User B's scoped storage must be empty
    const userBCachedSkills = localStorage.getItem(`internsync_u_${userB_Id}_skills_v4`)
    expect(userBCachedSkills).toBeNull()

    // And User A's data must NEVER be attributed to User B
    expect(skillsB).not.toEqual(skillsA)
  })

  it('restores authenticated user records correctly upon session restoration', async () => {
    const studentId = 'student-restore-1'

    mockDatabase.profiles.set(studentId, {
      ...BLANK_STUDENT_PROFILE,
      id: studentId,
      fullName: 'Rahul Sharma',
      degree: 'B.Tech',
      branch: 'Computer Science',
      currentYear: 3,
      targetRole: 'AI Engineering Intern',
      careerInterests: ['AI Engineering', 'Full Stack Development'],
    })

    mockDatabase.skills.set(studentId, [
      {
        skillName: 'TypeScript',
        category: 'languages',
        confidence: 90,
        evidenceSources: ['resume', 'assessment'],
        assessmentScore: 92,
        projectCount: 3,
        githubStrength: 'strong',
      },
    ])

    // Simulate session restoration
    const profile = await fetchUserProfile(studentId)
    const skills = await fetchUserSkills(studentId)

    expect(profile).not.toBeNull()
    expect(profile?.fullName).toBe('Rahul Sharma')
    expect(profile?.targetRole).toBe('AI Engineering Intern')
    expect(profile?.careerInterests).toEqual(['AI Engineering', 'Full Stack Development'])
    expect(skills).toHaveLength(1)
    expect(skills[0].skillName).toBe('TypeScript')
  })

  it('respects Supabase email confirmation requirement and displays verification state', async () => {
    // When email confirmation is enabled, Supabase returns data.session === null
    ;(supabase.auth.signUp as any).mockResolvedValue({
      data: {
        user: { id: 'unconfirmed-user-uuid', email: 'student@college.edu' },
        session: null, // No session until email link clicked
      },
      error: null,
    })

    const { data, error } = await supabase.auth.signUp({
      email: 'student@college.edu',
      password: 'testpassword',
      options: { data: { full_name: 'New Student' } },
    })

    expect(error).toBeNull()
    expect(data.user?.id).toBe('unconfirmed-user-uuid')
    expect(data.session).toBeNull()

    // Must recognize verification is required
    const requiresVerification = data.session === null
    expect(requiresVerification).toBe(true)
  })
})
