import { supabase, isSupabaseConfigured } from './client'
import {
  generateApplicationId,
  generateOpportunityId,
  isValidUUID,
} from '@/lib/utils/uuid'
import type {
  ApplicationItem,
  ApplicationStatus,
  Opportunity,
  ProjectItem,
  RecommendationType,
  SkillEvidenceItem,
  StudentProfile,
  UploadedDocument,
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
      fullName: data.full_name || '',
      email: '', // filled from auth session
      university: data.university || '',
      degree: data.degree || '',
      branch: data.branch || '',
      currentYear: data.current_year ?? 0,
      graduationYear: data.graduation_year ?? 0,
      location: data.location || '',
      preferredLocations: data.preferred_locations || [],
      workModePreference: data.work_mode_preference || 'any',
      availableFrom: data.available_from || '',
      availableDurationMonths: data.available_duration_months || 0,
      avatarUrl: data.avatar_url || '',
      githubUsername: data.github_username || '',
      careerInterests: data.career_interests || [],
      targetRole: data.target_role || '',
      bio: data.bio || '',
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
      full_name: profile.fullName || 'Student Candidate',
      university: profile.university || 'University',
      degree: profile.degree || 'B.Tech',
      branch: profile.branch || 'Computer Science',
      current_year: profile.currentYear >= 1 && profile.currentYear <= 5 ? profile.currentYear : 3,
      graduation_year: profile.graduationYear >= 2020 ? profile.graduationYear : new Date().getFullYear() + 2,
      location: profile.location || 'India',
      preferred_locations: profile.preferredLocations || [],
      work_mode_preference: profile.workModePreference || 'any',
      available_from: profile.availableFrom || null,
      available_duration_months: profile.availableDurationMonths || 3,
      avatar_url: profile.avatarUrl || null,
      github_username: profile.githubUsername || null,
      target_role: profile.targetRole || null,
      career_interests: profile.careerInterests || [],
      bio: profile.bio || null,
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
      id: isValidUUID(project.id) ? project.id : undefined,
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

/**
 * Persists an opportunity to the database idempotently.
 * Returns the stable UUID of the opportunity.
 */
export async function upsertOpportunity(opp: Opportunity): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const oppId = isValidUUID(opp.id)
    ? opp.id
    : generateOpportunityId(opp.sourceUrl || opp.applicationUrl, opp.companyName, opp.roleTitle)

  try {
    const { error } = await supabase.from('opportunities').upsert({
      id: oppId,
      company_name: opp.companyName,
      company_logo: opp.companyLogo || null,
      role_title: opp.roleTitle,
      category: opp.category || 'Engineering',
      description: opp.description || 'Verified internship opportunity',
      location: opp.location || 'Remote',
      work_mode: opp.workMode || 'remote',
      internship_duration_months: opp.internshipDurationMonths || 3,
      stipend_amount: opp.stipendAmount || null,
      stipend_currency: opp.stipendCurrency || 'INR',
      stipend_period: opp.stipendPeriod || 'month',
      application_url: opp.applicationUrl,
      source: opp.source || 'InternSync Discovered',
      source_url: opp.sourceUrl || null,
      source_domain: opp.sourceDomain || null,
      deadline: opp.deadline || new Date(Date.now() + 21 * 86400000).toISOString(),
      eligible_years: opp.eligibleYears || [],
      eligible_degrees: opp.eligibleDegrees || [],
      required_skills: opp.requiredSkills || [],
      preferred_skills: opp.preferredSkills || [],
      is_demo: Boolean(opp.isDemo),
    })

    if (error) {
      console.warn('[Database] Error saving opportunity:', error.message)
      return null
    }

    return oppId
  } catch (err) {
    console.warn('[Database] Exception saving opportunity:', err)
    return null
  }
}

/**
 * Loads user applications.
 * Restores original title, company, URL, source, match score, recommendation, and status.
 * If a referenced opportunity cannot be restored, returns an honest unavailable-record state without inventing details.
 */
export async function fetchUserApplications(studentId: string): Promise<ApplicationItem[]> {
  if (!isSupabaseConfigured || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunities(*)')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.warn('[Database] Error fetching applications:', error.message)
      return []
    }

    return (data || []).map((row) => {
      const oppRow = row.opportunities
      const hasOpp = Boolean(oppRow)

      const opportunity: Opportunity = hasOpp
        ? {
            id: oppRow.id,
            companyName: oppRow.company_name,
            companyLogo: oppRow.company_logo || '',
            roleTitle: oppRow.role_title,
            category: oppRow.category || 'Engineering',
            description: oppRow.description || '',
            location: oppRow.location || 'Remote',
            workMode: oppRow.work_mode || 'remote',
            internshipDurationMonths: oppRow.internship_duration_months || 3,
            stipendAmount: oppRow.stipend_amount,
            stipendCurrency: oppRow.stipend_currency || 'INR',
            stipendPeriod: oppRow.stipend_period || 'month',
            applicationUrl: oppRow.application_url || '',
            source: oppRow.source || 'Direct',
            sourceUrl: oppRow.source_url || undefined,
            sourceDomain: oppRow.source_domain || undefined,
            deadline: oppRow.deadline || '',
            eligibleYears: oppRow.eligible_years || [],
            eligibleDegrees: oppRow.eligible_degrees || [],
            requiredSkills: oppRow.required_skills || [],
            preferredSkills: oppRow.preferred_skills || [],
            postedAt: oppRow.created_at || new Date().toISOString(),
          }
        : {
            id: row.opportunity_id,
            companyName: 'Unavailable Listing',
            companyLogo: '',
            roleTitle: 'Opportunity record unavailable',
            category: 'Unavailable',
            description: 'The referenced opportunity listing could not be restored from the database.',
            location: 'Unavailable',
            workMode: 'remote',
            internshipDurationMonths: 0,
            applicationUrl: '',
            source: 'Unavailable',
            deadline: '',
            eligibleYears: [],
            eligibleDegrees: [],
            requiredSkills: [],
            preferredSkills: [],
            postedAt: row.created_at || '',
          }

      // Restore actual match score & recommendation, or honest 0 / SKIP when unavailable
      const matchScore = hasOpp ? (row.match_score ?? 70) : (row.match_score ?? 0)
      const recommendation: RecommendationType = hasOpp
        ? (row.recommendation as RecommendationType) || 'APPLY NOW'
        : (row.recommendation as RecommendationType) || 'SKIP'

      return {
        id: row.id,
        studentId: row.student_id,
        opportunityId: row.opportunity_id,
        opportunity,
        matchScore,
        recommendation,
        status: row.status as ApplicationStatus,
        notes: row.notes || '',
        appliedAt: row.applied_at || undefined,
        updatedAt: row.updated_at || undefined,
      }
    })
  } catch {
    return []
  }
}

/**
 * Persists an application and its underlying opportunity.
 * Handles retries and duplicate saves idempotently.
 */
export async function upsertUserApplication(app: ApplicationItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    // 1. Ensure opportunity exists in the database first
    const oppId = await upsertOpportunity(app.opportunity)
    if (!oppId) {
      console.warn('[Database] Could not persist referenced opportunity. Aborting application save.')
      return false
    }

    // 2. Ensure application ID is a valid UUID (deterministic from student + opportunity)
    const appId = isValidUUID(app.id)
      ? app.id
      : generateApplicationId(app.studentId, oppId)

    // 3. Upsert application referencing the persisted opportunity
    const { error: appError } = await supabase.from('applications').upsert(
      {
        id: appId,
        student_id: app.studentId,
        opportunity_id: oppId,
        status: app.status,
        notes: app.notes || null,
        applied_at: app.appliedAt || null,
        match_score: app.matchScore ?? null,
        recommendation: app.recommendation ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,opportunity_id' }
    )

    if (appError) {
      console.warn('[Database] Error saving application:', appError.message)
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
  file: File,
  docId?: string
): Promise<{ path: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { path: '', error: 'Supabase storage is not configured' }
  }

  // Ensure caller provides a valid UUID user ID
  if (!userId || !isValidUUID(userId)) {
    return { path: '', error: 'Authentication required: User must be signed in with a valid account to upload to cloud storage.' }
  }

  try {
    // Verify authenticated session matches target user ID
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData.user || authData.user.id !== userId) {
      return { path: '', error: 'Session mismatch: You must be logged in as this student to upload documents.' }
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    // Follow clean ownership hierarchy: {authenticated_user_id}/{document_id}/{safe_filename}
    const filePath = docId
      ? `${userId}/${docId}/${sanitizedName}`
      : `${userId}/${Date.now()}-${sanitizedName}`

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
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
 * Generate a secure time-limited signed URL for private document download
 */
export async function getDocumentSignedUrl(
  filePath: string,
  expiresIn = 300
): Promise<{ signedUrl?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Supabase storage is not configured' }
  }

  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      return { error: error.message }
    }

    return { signedUrl: data.signedUrl }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to generate signed download URL' }
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

/**
 * Persist document metadata to public.documents table
 */
export async function insertUserDocumentMetadata(doc: {
  id?: string
  studentId: string
  fileName: string
  storagePath: string
  contentType: string
  fileSize: number
  documentType: 'resume' | 'presentation' | 'report' | 'certificate' | 'transcript' | 'other'
  processingStatus: 'uploaded' | 'parsing' | 'parsed' | 'failed' | 'needs_ocr'
  extractedSkills?: string[]
  extractedProjects?: string[]
  extractedData?: unknown
  errorMessage?: string
}): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const docId = isValidUUID(doc.id) ? doc.id : undefined

    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...(docId ? { id: docId } : {}),
        student_id: doc.studentId,
        file_name: doc.fileName,
        storage_path: doc.storagePath,
        content_type: doc.contentType,
        file_size: doc.fileSize,
        document_type: doc.documentType,
        processing_status: doc.processingStatus,
        extracted_skills: doc.extractedSkills || [],
        extracted_projects: doc.extractedProjects || [],
        extracted_data: doc.extractedData || null,
        error_message: doc.errorMessage || null,
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[Database] Failed to insert document metadata:', error.message)
      return null
    }

    return { id: data.id }
  } catch (err) {
    console.warn('[Database] Exception inserting document metadata:', err)
    return null
  }
}

/**
 * Fetch all user document metadata records from public.documents
 */
export async function fetchUserDocuments(userId: string): Promise<UploadedDocument[]> {
  if (!isSupabaseConfigured || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Database] Error fetching user documents:', error.message)
      return []
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.file_name,
      type: row.document_type as UploadedDocument['type'],
      sizeBytes: row.file_size,
      uploadedAt: row.created_at,
      storagePath: row.storage_path,
      extractedSkills: row.extracted_skills || [],
      extractedProjects: row.extracted_projects || [],
      extractedData: row.extracted_data || undefined,
    }))
  } catch {
    return []
  }
}

/**
 * Deletes a document record and its underlying private storage file.
 */
export async function deleteUserDocument(
  docId: string,
  storagePath?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    // 1. Delete storage file if path exists
    if (storagePath) {
      await deleteDocumentFromStorage(storagePath)
    }

    // 2. Delete database record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)

    if (error) {
      console.warn('[Database] Error deleting document metadata:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('[Database] Exception deleting document:', err)
    return false
  }
}
