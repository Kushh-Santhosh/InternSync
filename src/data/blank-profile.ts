import type { StudentProfile } from '@/types'

/**
 * Clean, unassumed blank student profile.
 * Unknown and optional fields are represented truthfully as 0 or empty strings.
 */
export const BLANK_STUDENT_PROFILE: StudentProfile = {
  id: '',
  fullName: '',
  email: '',
  university: '',
  degree: '',
  branch: '',
  currentYear: 0, // unconfirmed / unknown
  graduationYear: 0, // unconfirmed / unknown
  location: '',
  preferredLocations: [],
  workModePreference: 'any',
  availableFrom: '',
  availableDurationMonths: 0,
  avatarUrl: '',
  githubUsername: '',
  careerInterests: [],
  targetRole: '',
  bio: '',
}
