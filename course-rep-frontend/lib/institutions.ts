export const DEFAULT_INSTITUTIONS: string[] = [
  'Example University of Science & Technology',
  'University of Lagos (UNILAG)',
  'Covenant University (CU)',
  'University of Ibadan (UI)',
  'Obafemi Awolowo University (OAU)',
  'Federal University of Technology, Owerri (FUTO)',
  'Ahmadu Bello University (ABU)',
  'University of Nigeria, Nsukka (UNN)',
  'University of Benin (UNIBEN)',
  'Lagos State University (LASU)',
  'University of Ilorin (UNILORIN)',
  'Federal University of Technology, Akure (FUTA)',
  'Babcock University',
  'Nnamdi Azikiwe University (UNIZIK)',
]

export const INSTITUTIONS_STORAGE_KEY = 'course_rep_enlisted_institutions'

/**
 * Retrieve all enlisted institutions, merging standard institutions with any custom-added ones from localStorage.
 */
export function getEnlistedInstitutions(): string[] {
  if (typeof window === 'undefined') return DEFAULT_INSTITUTIONS
  try {
    const raw = localStorage.getItem(INSTITUTIONS_STORAGE_KEY)
    if (!raw) return DEFAULT_INSTITUTIONS
    const stored = JSON.parse(raw)
    if (Array.isArray(stored)) {
      const combined = [...DEFAULT_INSTITUTIONS]
      for (const item of stored) {
        if (typeof item === 'string' && item.trim()) {
          const trimmed = item.trim()
          if (!combined.some((inst) => inst.toLowerCase() === trimmed.toLowerCase())) {
            combined.push(trimmed)
          }
        }
      }
      return combined
    }
    return DEFAULT_INSTITUTIONS
  } catch {
    return DEFAULT_INSTITUTIONS
  }
}

/**
 * Enlist a new or custom institution to data records.
 * If it doesn't already exist in the records, it is added and persisted.
 */
export function enlistInstitution(name: string): string[] {
  if (typeof window === 'undefined') return DEFAULT_INSTITUTIONS
  const trimmed = name.trim()
  if (!trimmed) return getEnlistedInstitutions()

  try {
    const list = getEnlistedInstitutions()
    const exists = list.some((inst) => inst.toLowerCase() === trimmed.toLowerCase())
    if (!exists) {
      const updated = [...list, trimmed]
      // Save custom ones
      const customOnly = updated.filter(
        (inst) => !DEFAULT_INSTITUTIONS.some((d) => d.toLowerCase() === inst.toLowerCase())
      )
      localStorage.setItem(INSTITUTIONS_STORAGE_KEY, JSON.stringify(customOnly))
      window.dispatchEvent(new CustomEvent('institutions-updated', { detail: updated }))
      return updated
    }
    return list
  } catch {
    return getEnlistedInstitutions()
  }
}
