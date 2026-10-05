import type { SearchQuery, StudentProfile } from '@/types'

export interface QueryGenerationOptions {
  maxQueries?: number
  currentYear?: number
}

/**
 * Generates targeted search queries based on the student's actual Career DNA.
 * Does NOT hardcode Rahul Sharma or fixed queries.
 */
export function generateSearchQueries(
  profile: StudentProfile,
  topSkills: string[] = [],
  options: QueryGenerationOptions = {}
): SearchQuery[] {
  const maxQueries = options.maxQueries || 8
  const currentCalendarYear = new Date().getFullYear()

  // Target roles from profile
  const roleCandidates: string[] = []
  if (profile.targetRole) {
    roleCandidates.push(profile.targetRole)
  }
  for (const interest of profile.careerInterests || []) {
    if (!roleCandidates.includes(interest)) {
      roleCandidates.push(interest)
    }
  }

  // Common role expansions
  const expandedRoles = new Set<string>()
  for (const role of roleCandidates) {
    expandedRoles.add(role.toLowerCase().includes('intern') ? role : `${role} Intern`)
    if (/ai|machine learning|ml/i.test(role)) {
      expandedRoles.add('AI Engineer Intern')
      expandedRoles.add('Machine Learning Intern')
    }
    if (/full stack|frontend|backend|software/i.test(role)) {
      expandedRoles.add('Full Stack Developer Intern')
      expandedRoles.add('Software Engineer Intern')
    }
  }

  const roles = Array.from(expandedRoles).slice(0, 4)

  // Locations: primary city + preferred locations + Remote
  const locationList = new Set<string>()
  if (profile.location) locationList.add(profile.location)
  for (const loc of profile.preferredLocations || []) {
    locationList.add(loc)
  }
  locationList.add('Remote')
  locationList.add('India')

  // Skills
  const keySkills = topSkills.slice(0, 3)

  const queries: SearchQuery[] = []
  const seenTexts = new Set<string>()

  const addQuery = (q: SearchQuery) => {
    const norm = q.text.toLowerCase().trim()
    if (!seenTexts.has(norm) && queries.length < maxQueries) {
      seenTexts.add(norm)
      queries.push(q)
    }
  }

  // 1. Role + Primary Location + Year
  for (const role of roles) {
    const loc = profile.location || 'India'
    addQuery({
      text: `${role} ${loc} ${currentCalendarYear}`,
      role,
      location: loc,
      targetYear: profile.currentYear,
      skills: keySkills,
    })
  }

  // 2. Role + Remote
  for (const role of roles.slice(0, 2)) {
    addQuery({
      text: `${role} India remote internship`,
      role,
      location: 'Remote',
      targetYear: profile.currentYear,
      skills: keySkills,
    })
  }

  // 3. Top Skills + Location + Students
  if (keySkills.length > 0) {
    const skillPair = keySkills.slice(0, 2).join(' ')
    const loc = profile.location || 'Bengaluru'
    addQuery({
      text: `${skillPair} internship ${loc} college students`,
      role: roles[0] || 'Software Intern',
      location: loc,
      targetYear: profile.currentYear,
      skills: keySkills,
    })
  }

  // 4. Academic year eligibility targeted query
  if (profile.currentYear && roles.length > 0) {
    const loc = profile.location || 'India'
    addQuery({
      text: `${roles[0]} ${loc} ${profile.currentYear}rd year students`,
      role: roles[0],
      location: loc,
      targetYear: profile.currentYear,
      skills: keySkills,
    })
  }

  return queries
}
