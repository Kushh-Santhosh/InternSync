import { supabase, isSupabaseConfigured } from './client'
import type {
  ApplicationItem,
  ApplicationStatus,
  ProjectItem,
  SkillEvidenceItem,
  StudentProfile,
} from '@/types'

/**
 * Supabase Database Persistence Service
 * Enforces per-user data isolation via Row Level Security (RLS).
 */

export async function fetchUserProfile(userId: string): Promise<StudentProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[Database] Error fetching profile:', error.message)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      fullName: data.full_name,
      email: '', // filled from auth session
      university: data.university,
      degree: data.degree,
      branch: data.branch,
      currentYear: data.current_year,
      graduationYear: data.graduation_year,
      location: data.location,
      preferredLocations: data.preferred_locations || [],
      workModePreference: data.work_mode_preference || 'any',
      availableFrom: data.available_from || new Date().toISOString().split('T')[0],
      availableDurationMonths: data.available_duration_months || 3,
      avatarUrl: data.avatar_url,
      githubUsername: data.github_username,
      careerInterests: [],
      targetRole: 'Software Engineering Intern',
      bio: '',
    }
  } catch (err) {
    console.warn('[Database] Exception fetching profile:', err)
    return null
  }
}

export async function upsertUserProfile(profile: StudentProfile): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      full_name: profile.fullName,
      university: profile.university,
      degree: profile.degree,
      branch: profile.branch,
      current_year: profile.currentYear,
      graduation_year: profile.graduationYear,
      location: profile.location,
      preferred_locations: profile.preferredLocations,
      work_mode_preference: profile.workModePreference,
      available_from: profile.availableFrom || null,
      available_duration_months: profile.availableDurationMonths,
      avatar_url: profile.avatarUrl || null,
      github_username: profile.githubUsername || null,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[Database] Failed to save profile:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[Database] Exception saving profile:', err)
    return false
  }
}

export async function fetchUserSkills(studentId: string): Promise<SkillEvidenceItem[]> {
  if (!isSupabaseConfigured || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('student_skills')
      .select('*')
      .eq('student_id', studentId)

    if (error) {
      console.warn('[Database] Error fetching skills:', error.message)
      return []
    }

    return (data || []).map((row) => ({
      skillName: row.skill_name,
      category: 'languages',
      confidence: row.confidence,
      evidenceSources: row.evidence_sources || [],
      assessmentScore: row.assessment_score || undefined,
      projectCount: 0,
      githubStrength: 'none',
      lastValidatedAt: row.last_validated_at || undefined,
    }))
  } catch {
    return []
  }
}

export async function upsertUserSkill(
  studentId: string,
  skill: SkillEvidenceItem
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase.from('student_skills').upsert(
      {
        student_id: studentId,
        skill_name: skill.skillName,
        confidence: skill.confidence,
        evidence_sources: skill.evidenceSources,
        assessment_score: skill.assessmentScore || null,
        last_validated_at: skill.lastValidatedAt || new Date().toISOString(),
      },
      { onConflict: 'student_id,skill_name' }
    )

    if (error) {
      console.warn('[Database] Error upserting skill:', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

export async function fetchUserProjects(studentId: string): Promise<ProjectItem[]> {
  if (!isSupabaseConfigured || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', studentId)

    if (error) {
      console.warn('[Database] Error fetching projects:', error.message)
      return []
    }

    return (data || []).map((p) => ({
      id: p.id,
      studentId: p.student_id,
      title: p.title,
      description: p.description,
      technologies: p.technologies || [],
      repositoryUrl: p.repository_url || undefined,
      liveUrl: p.live_url || undefined,
      evidenceStrength: p.evidence_strength || 'moderate',
      highlights: [],
    }))
  } catch {
    return []
  }
}

export async function insertUserProject(project: ProjectItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase.from('projects').insert({
      id: project.id.startsWith('proj-') ? undefined : project.id,
      student_id: project.studentId,
      title: project.title,
      description: project.description,
      technologies: project.technologies,
      repository_url: project.repositoryUrl || null,
      live_url: project.liveUrl || null,
      evidence_strength: project.evidenceStrength || 'moderate',
    })

    if (error) {
      console.warn('[Database] Error saving project:', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

export async function fetchUserApplications(studentId: string): Promise<ApplicationItem[]> {
  if (!isSupabaseConfigured || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunities(*)')
      .eq('student_id', studentId)

    if (error) {
      console.warn('[Database] Error fetching applications:', error.message)
      return []
    }

    return (data || []).map((row) => ({
      id: row.id,
      studentId: row.student_id,
      opportunityId: row.opportunity_id,
      opportunity: row.opportunities
        ? {
            id: row.opportunities.id,
            companyName: row.opportunities.company_name,
            companyLogo: row.opportunities.company_logo || '',
            roleTitle: row.opportunities.role_title,
            category: row.opportunities.category,
            description: row.opportunities.description,
            location: row.opportunities.location,
            workMode: row.opportunities.work_mode,
            internshipDurationMonths: row.opportunities.internship_duration_months,
            stipendAmount: row.opportunities.stipend_amount,
            stipendCurrency: row.opportunities.stipend_currency || 'INR',
            stipendPeriod: row.opportunities.stipend_period || 'month',
            applicationUrl: row.opportunities.application_url,
            source: row.opportunities.source || 'Direct',
            deadline: row.opportunities.deadline,
            eligibleYears: row.opportunities.eligible_years || [3, 4],
            eligibleDegrees: row.opportunities.eligible_degrees || ['B.Tech'],
            requiredSkills: row.opportunities.required_skills || [],
            preferredSkills: row.opportunities.preferred_skills || [],
            postedAt: row.opportunities.created_at,
          }
        : {
            id: row.opportunity_id,
            companyName: 'Company',
            companyLogo: '',
            roleTitle: 'Internship Opportunity',
            category: 'Engineering',
            description: '',
            location: 'Remote',
            workMode: 'remote',
            internshipDurationMonths: 3,
            applicationUrl: '',
            source: 'Saved',
            deadline: new Date().toISOString(),
            eligibleYears: [3, 4],
            eligibleDegrees: ['B.Tech'],
            requiredSkills: [],
            preferredSkills: [],
            postedAt: new Date().toISOString(),
          },
      matchScore: 80,
      recommendation: 'APPLY NOW',
      status: row.status as ApplicationStatus,
      notes: row.notes || '',
      appliedAt: row.applied_at || undefined,
      updatedAt: row.updated_at || undefined,
    }))
  } catch {
    return []
  }
}

export async function upsertUserApplication(app: ApplicationItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    // If the opportunity is not yet in the DB opportunities table, ensure it exists
    if (app.opportunity && !app.opportunity.id.startsWith('opp-live-')) {
      await supabase.from('opportunities').upsert({
        id: app.opportunity.id,
        company_name: app.opportunity.companyName,
        company_logo: app.opportunity.companyLogo || null,
        role_title: app.opportunity.roleTitle,
        category: app.opportunity.category || 'Engineering',
        description: app.opportunity.description || 'Discovered opportunity',
        location: app.opportunity.location || 'Remote',
        work_mode: app.opportunity.workMode || 'remote',
        internship_duration_months: app.opportunity.internshipDurationMonths || 3,
        stipend_amount: app.opportunity.stipendAmount || null,
        application_url: app.opportunity.applicationUrl,
        source: app.opportunity.source || 'InternSync Discovered',
        deadline: app.opportunity.deadline || new Date(Date.now() + 21 * 86400000).toISOString(),
        required_skills: app.opportunity.requiredSkills || [],
        preferred_skills: app.opportunity.preferredSkills || [],
      })
    }

    const { error } = await supabase.from('applications').upsert({
      id: app.id.startsWith('app-') ? undefined : app.id,
      student_id: app.studentId,
      opportunity_id: app.opportunityId,
      status: app.status,
      notes: app.notes || null,
      applied_at: app.appliedAt || null,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.warn('[Database] Error saving application:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Database] Exception saving application:', err)
    return false
  }
}

/**
 * Upload a document to private Supabase Storage
 */
export async function uploadDocumentToStorage(
  userId: string,
  file: File
): Promise<{ path: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { path: '', error: 'Supabase storage is not configured' }
  }

  try {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${userId}/${Date.now()}-${sanitizedName}`

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      return { path: '', error: error.message }
    }

    return { path: filePath }
  } catch (err: unknown) {
    return { path: '', error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

/**
 * Delete a document from Supabase Storage
 */
export async function deleteDocumentFromStorage(filePath: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase.storage.from('documents').remove([filePath])
    return !error
  } catch {
    return false
  }
}
