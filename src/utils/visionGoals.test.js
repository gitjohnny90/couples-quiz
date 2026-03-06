import { describe, it, expect } from 'vitest'
import { createGoal, updateGoalStatus, deleteGoal } from './visionGoals'

describe('createGoal', () => {
  const fixedDate = new Date('2025-06-15T12:00:00Z')

  it('creates a goal with correct fields', () => {
    const goal = createGoal('travel', 'Visit Tokyo', 'player1', 'abc-123', fixedDate)
    expect(goal).toEqual({
      id: 'abc-123',
      category: 'travel',
      title: 'Visit Tokyo',
      status: 'dreaming',
      createdBy: 'player1',
      createdAt: '2025-06-15T12:00:00.000Z',
      achievedAt: null,
    })
  })

  it('trims whitespace from title', () => {
    const goal = createGoal('travel', '  Visit Tokyo  ', 'player1', 'id', fixedDate)
    expect(goal.title).toBe('Visit Tokyo')
  })

  it('returns null for empty title', () => {
    expect(createGoal('travel', '', 'player1', 'id')).toBeNull()
  })

  it('returns null for whitespace-only title', () => {
    expect(createGoal('travel', '   ', 'player1', 'id')).toBeNull()
  })

  it('returns null for null title', () => {
    expect(createGoal('travel', null, 'player1', 'id')).toBeNull()
  })

  it('returns null for undefined title', () => {
    expect(createGoal('travel', undefined, 'player1', 'id')).toBeNull()
  })

  it('always starts with dreaming status', () => {
    const goal = createGoal('home', 'Buy a house', 'player2', 'id', fixedDate)
    expect(goal.status).toBe('dreaming')
  })

  it('always starts with null achievedAt', () => {
    const goal = createGoal('home', 'Buy a house', 'player2', 'id', fixedDate)
    expect(goal.achievedAt).toBeNull()
  })
})

describe('updateGoalStatus', () => {
  const fixedDate = new Date('2025-06-15T12:00:00Z')
  const goals = [
    { id: 'g1', title: 'Goal 1', status: 'dreaming', achievedAt: null },
    { id: 'g2', title: 'Goal 2', status: 'growing', achievedAt: null },
    { id: 'g3', title: 'Goal 3', status: 'achieved', achievedAt: '2025-01-01T00:00:00.000Z' },
  ]

  it('updates the status of the matching goal', () => {
    const result = updateGoalStatus(goals, 'g1', 'growing', fixedDate)
    expect(result[0].status).toBe('growing')
  })

  it('does not modify other goals', () => {
    const result = updateGoalStatus(goals, 'g1', 'growing', fixedDate)
    expect(result[1]).toEqual(goals[1])
    expect(result[2]).toEqual(goals[2])
  })

  it('sets achievedAt when status becomes achieved', () => {
    const result = updateGoalStatus(goals, 'g1', 'achieved', fixedDate)
    expect(result[0].achievedAt).toBe('2025-06-15T12:00:00.000Z')
  })

  it('clears achievedAt when status changes away from achieved', () => {
    const result = updateGoalStatus(goals, 'g3', 'dreaming', fixedDate)
    expect(result[2].achievedAt).toBeNull()
    expect(result[2].status).toBe('dreaming')
  })

  it('preserves other fields on the updated goal', () => {
    const result = updateGoalStatus(goals, 'g1', 'growing', fixedDate)
    expect(result[0].id).toBe('g1')
    expect(result[0].title).toBe('Goal 1')
  })

  it('returns new array (immutable)', () => {
    const result = updateGoalStatus(goals, 'g1', 'growing', fixedDate)
    expect(result).not.toBe(goals)
    expect(result[0]).not.toBe(goals[0])
  })

  it('returns unchanged array if goalId not found', () => {
    const result = updateGoalStatus(goals, 'nonexistent', 'growing', fixedDate)
    expect(result).toEqual(goals)
  })
})

describe('deleteGoal', () => {
  const goals = [
    { id: 'g1', title: 'Goal 1' },
    { id: 'g2', title: 'Goal 2' },
    { id: 'g3', title: 'Goal 3' },
  ]

  it('removes the goal with matching id', () => {
    const result = deleteGoal(goals, 'g2')
    expect(result).toHaveLength(2)
    expect(result.find(g => g.id === 'g2')).toBeUndefined()
  })

  it('preserves other goals', () => {
    const result = deleteGoal(goals, 'g2')
    expect(result[0].id).toBe('g1')
    expect(result[1].id).toBe('g3')
  })

  it('returns unchanged array if goalId not found', () => {
    const result = deleteGoal(goals, 'nonexistent')
    expect(result).toHaveLength(3)
  })

  it('returns new array (immutable)', () => {
    const result = deleteGoal(goals, 'g1')
    expect(result).not.toBe(goals)
  })

  it('handles empty array', () => {
    expect(deleteGoal([], 'g1')).toEqual([])
  })

  it('can delete the only goal', () => {
    const result = deleteGoal([{ id: 'only' }], 'only')
    expect(result).toEqual([])
  })
})
