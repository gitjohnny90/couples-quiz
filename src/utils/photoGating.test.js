import { describe, it, expect } from 'vitest'
import { next6amAfter, isGloballyFrozen, frozenUntil, getSectionStatus } from './photoGating'

// Helper: create a Date at a specific hour on today's date
function todayAt(hours, minutes = 0) {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

// Helper: create a Date at a specific hour on the next calendar day
function tomorrowAt(hours, minutes = 0) {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(hours, minutes, 0, 0)
  return d
}

// ─── next6amAfter ────────────────────────────────────────────

describe('next6amAfter', () => {
  it('returns 6am on the calendar day after the given timestamp', () => {
    const completedAt = todayAt(14, 0) // 2pm today
    const result = next6amAfter(completedAt)
    const expected = tomorrowAt(6, 0)
    expect(result.getHours()).toBe(6)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getDate()).toBe(expected.getDate())
  })

  it('accepts an ISO string as input', () => {
    const completedAt = todayAt(14, 0)
    const result = next6amAfter(completedAt.toISOString())
    expect(result.getHours()).toBe(6)
    expect(result.getDate()).toBe(tomorrowAt(6).getDate())
  })

  it('returns the next day 6am when completed just before midnight', () => {
    const completedAt = todayAt(23, 59)
    const result = next6amAfter(completedAt)
    expect(result.getHours()).toBe(6)
    expect(result.getDate()).toBe(tomorrowAt(6).getDate())
  })

  it('edge case: completed at 5:59am — next6am is 6am SAME day (just 1 min later)', () => {
    // When completed at 5:59am, next6am is 6am the next calendar day
    // (we always go to the NEXT day's 6am, not same-day)
    const completedAt = todayAt(5, 59)
    const result = next6amAfter(completedAt)
    // next6amAfter always moves to next calendar day
    expect(result.getDate()).toBe(tomorrowAt(6).getDate())
    expect(result.getHours()).toBe(6)
  })
})

// ─── isGloballyFrozen ────────────────────────────────────────

describe('isGloballyFrozen', () => {
  it('returns false when state is null', () => {
    expect(isGloballyFrozen(null)).toBe(false)
  })

  it('returns false when state is empty object', () => {
    expect(isGloballyFrozen({})).toBe(false)
  })

  it('returns false when state has no lastCompletedAt', () => {
    const state = { completedSections: {}, inProgressSectionId: null, lastCompletedAt: null }
    expect(isGloballyFrozen(state)).toBe(false)
  })

  it('returns false when lastCompletedAt is null', () => {
    const state = { lastCompletedAt: null }
    expect(isGloballyFrozen(state)).toBe(false)
  })

  it('returns true when completed at 2pm and now is 11pm same day', () => {
    const completedAt = todayAt(14, 0) // 2pm today
    const now = todayAt(23, 0) // 11pm today
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(isGloballyFrozen(state, now)).toBe(true)
  })

  it('returns true when completed at 11pm and now is 5:59am next day', () => {
    const completedAt = todayAt(23, 0) // 11pm today
    const now = tomorrowAt(5, 59) // 5:59am tomorrow
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(isGloballyFrozen(state, now)).toBe(true)
  })

  it('returns false when completed at 2pm and now is 7am next day', () => {
    const completedAt = todayAt(14, 0) // 2pm today
    const now = tomorrowAt(7, 0) // 7am tomorrow
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(isGloballyFrozen(state, now)).toBe(false)
  })

  it('returns false when completed at 2pm and now is exactly 6am next day', () => {
    const completedAt = todayAt(14, 0)
    const now = tomorrowAt(6, 0) // exactly 6am tomorrow
    const state = { lastCompletedAt: completedAt.toISOString() }
    // At exactly 6am it should be UNfrozen (>= 6am means open)
    expect(isGloballyFrozen(state, now)).toBe(false)
  })

  it('edge case: completed at 5:59am — frozen at 6:01am same "next day" should be false', () => {
    // completed today at 5:59am → next6am is tomorrow 6am
    const completedAt = todayAt(5, 59)
    const now = tomorrowAt(6, 1) // 6:01am tomorrow
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(isGloballyFrozen(state, now)).toBe(false)
  })

  it('frozen right at the boundary: 5:59am next day is still frozen', () => {
    const completedAt = todayAt(5, 59)
    const now = tomorrowAt(5, 59) // 5:59am tomorrow — still frozen
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(isGloballyFrozen(state, now)).toBe(true)
  })
})

// ─── frozenUntil ─────────────────────────────────────────────

describe('frozenUntil', () => {
  it('returns null when not frozen', () => {
    const state = { lastCompletedAt: null }
    expect(frozenUntil(state)).toBeNull()
  })

  it('returns null when state is null', () => {
    expect(frozenUntil(null)).toBeNull()
  })

  it('returns ISO string of next 6am when frozen', () => {
    const completedAt = todayAt(14, 0)
    const now = todayAt(23, 0)
    const state = { lastCompletedAt: completedAt.toISOString() }
    const result = frozenUntil(state, now)
    expect(typeof result).toBe('string')
    // The returned ISO string should parse to 6am
    const parsed = new Date(result)
    expect(parsed.getHours()).toBe(6)
    expect(parsed.getMinutes()).toBe(0)
    expect(parsed.getSeconds()).toBe(0)
  })

  it('returns null when gate has unlocked (after 6am next day)', () => {
    const completedAt = todayAt(14, 0)
    const now = tomorrowAt(7, 0)
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(frozenUntil(state, now)).toBeNull()
  })
})

// ─── isSectionCompleteForPlayer ──────────────────────────────

import { isSectionCompleteForPlayer } from './photoGating'

describe('isSectionCompleteForPlayer', () => {
  it('returns false when playerAnswers is null', () => {
    expect(isSectionCompleteForPlayer(null, 'morning-routine')).toBe(false)
  })

  it('returns false when playerAnswers is empty object', () => {
    expect(isSectionCompleteForPlayer({}, 'morning-routine')).toBe(false)
  })

  it('returns false when all 3 entries are null', () => {
    expect(isSectionCompleteForPlayer({ 'morning-routine': [null, null, null] }, 'morning-routine')).toBe(false)
  })

  it('returns false when one entry is null (missing path)', () => {
    expect(isSectionCompleteForPlayer(
      { 'morning-routine': [{ path: 'a' }, null, { path: 'c' }] },
      'morning-routine'
    )).toBe(false)
  })

  it('returns true when all 3 entries have a truthy path (caption can be empty string)', () => {
    expect(isSectionCompleteForPlayer(
      { 'morning-routine': [{ path: 'a', caption: '' }, { path: 'b', caption: 'x' }, { path: 'c', caption: '' }] },
      'morning-routine'
    )).toBe(true)
  })

  it('returns false when sectionId is not present in playerAnswers', () => {
    expect(isSectionCompleteForPlayer(
      { 'other-section': [{ path: 'a' }, { path: 'b' }, { path: 'c' }] },
      'morning-routine'
    )).toBe(false)
  })

  it('returns false when array has only 1 element (not 3)', () => {
    expect(isSectionCompleteForPlayer(
      { 'morning-routine': [{ path: 'a' }] },
      'morning-routine'
    )).toBe(false)
  })
})

// ─── getSectionStatus ────────────────────────────────────────

describe('getSectionStatus', () => {
  const openState = {
    completedSections: {},
    inProgressSectionId: null,
    lastCompletedAt: null,
  }

  it('returns "completed" for a section in completedSections', () => {
    const state = {
      completedSections: { 'morning-routine': '2026-04-01T14:00:00.000Z' },
      inProgressSectionId: null,
      lastCompletedAt: '2026-04-01T14:00:00.000Z',
    }
    // Use a now that is after the gate (7am next day) so other sections are available
    const now = tomorrowAt(7, 0)
    expect(getSectionStatus('morning-routine', state, now)).toBe('completed')
  })

  it('returns "in-progress" for the inProgressSectionId section', () => {
    const state = {
      completedSections: {},
      inProgressSectionId: 'date-night',
      lastCompletedAt: null,
    }
    const now = todayAt(14, 0)
    expect(getSectionStatus('date-night', state, now)).toBe('in-progress')
  })

  it('returns "locked-frozen" when globally frozen and section is incomplete', () => {
    const completedAt = todayAt(14, 0)
    const now = todayAt(23, 0) // still frozen
    const state = {
      completedSections: { 'morning-routine': completedAt.toISOString() },
      inProgressSectionId: null,
      lastCompletedAt: completedAt.toISOString(),
    }
    expect(getSectionStatus('date-night', state, now)).toBe('locked-frozen')
  })

  it('returns "locked-in-progress" when another section is in progress', () => {
    const state = {
      completedSections: {},
      inProgressSectionId: 'date-night',
      lastCompletedAt: null,
    }
    const now = todayAt(14, 0)
    expect(getSectionStatus('morning-routine', state, now)).toBe('locked-in-progress')
  })

  it('returns "available" when gate is open and no section in progress', () => {
    const now = todayAt(10, 0)
    expect(getSectionStatus('morning-routine', openState, now)).toBe('available')
    expect(getSectionStatus('date-night', openState, now)).toBe('available')
  })

  it('returns "available" for all sections when gate is open', () => {
    const now = todayAt(10, 0)
    expect(getSectionStatus('morning-routine', openState, now)).toBe('available')
    expect(getSectionStatus('current-meal', openState, now)).toBe('available')
    expect(getSectionStatus('end-of-day', openState, now)).toBe('available')
  })

  it('returns "available" for null state (no DB row yet)', () => {
    const now = todayAt(10, 0)
    expect(getSectionStatus('morning-routine', null, now)).toBe('available')
  })

  it('completed section keeps "completed" even after gate unlocks', () => {
    const completedAt = todayAt(14, 0)
    const state = {
      completedSections: { 'morning-routine': completedAt.toISOString() },
      inProgressSectionId: null,
      lastCompletedAt: completedAt.toISOString(),
    }
    const now = tomorrowAt(7, 0) // after unlock
    expect(getSectionStatus('morning-routine', state, now)).toBe('completed')
    // Other sections are now available
    expect(getSectionStatus('date-night', state, now)).toBe('available')
  })
})
