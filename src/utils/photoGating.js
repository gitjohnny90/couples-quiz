/**
 * Pure time-gating functions for the Daily Photo Challenge.
 * No side effects, no imports, no Supabase calls — fully unit-testable.
 *
 * State shape (stored in responses table JSONB answers column):
 * {
 *   completedSections: { [sectionId]: isoTimestamp },
 *   inProgressSectionId: string | null,
 *   lastCompletedAt: string | null,
 * }
 */

/**
 * Returns the Date representing 6:00:00.000 AM on the calendar day
 * AFTER the given timestamp, in local time.
 *
 * @param {string|Date} completedAt - ISO timestamp or Date of section completion
 * @returns {Date}
 */
export function next6amAfter(completedAt) {
  const d = new Date(completedAt)
  const next = new Date(d)
  next.setDate(next.getDate() + 1)
  next.setHours(6, 0, 0, 0)
  return next
}

/**
 * Returns true if the global freeze is still active
 * (i.e. a section was completed and it is not yet 6am the next day).
 *
 * @param {object|null} state - The answers JSONB from the DB
 * @param {Date} [now] - Injectable "now" for testing (default: new Date())
 * @returns {boolean}
 */
export function isGloballyFrozen(state, now = new Date()) {
  if (!state?.lastCompletedAt) return false
  return now < next6amAfter(state.lastCompletedAt)
}

/**
 * Returns the ISO string of when the global freeze lifts, or null if not frozen.
 *
 * @param {object|null} state - The answers JSONB from the DB
 * @param {Date} [now] - Injectable "now" for testing (default: new Date())
 * @returns {string|null}
 */
export function frozenUntil(state, now = new Date()) {
  if (!isGloballyFrozen(state, now)) return null
  return next6amAfter(state.lastCompletedAt).toISOString()
}

/**
 * Returns the lock/availability status for a single section.
 *
 * @param {string} sectionId
 * @param {object|null} state - The answers JSONB from the DB
 * @param {Date} [now] - Injectable "now" for testing (default: new Date())
 * @returns {'completed'|'in-progress'|'available'|'locked-in-progress'|'locked-frozen'}
 */
/**
 * Returns true if a player has submitted all 3 photos for a given section.
 * Each entry must be non-null with a truthy .path property.
 *
 * @param {object|null} playerAnswers - The JSONB answers object from the per-player responses row
 * @param {string} sectionId - The section to check
 * @returns {boolean}
 */
export function isSectionCompleteForPlayer(playerAnswers, sectionId) {
  const photos = playerAnswers?.[sectionId]
  if (!Array.isArray(photos) || photos.length < 3) return false
  return photos.every(p => p !== null && p?.path)
}

export function getSectionStatus(sectionId, state, now = new Date()) {
  const completed = state?.completedSections ?? {}
  const inProgress = state?.inProgressSectionId ?? null

  if (completed[sectionId]) return 'completed'
  if (inProgress === sectionId) return 'in-progress'
  if (isGloballyFrozen(state, now)) return 'locked-frozen'
  if (inProgress && inProgress !== sectionId) return 'locked-in-progress'
  return 'available'
}
