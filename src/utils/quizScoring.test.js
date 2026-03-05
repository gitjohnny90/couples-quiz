import { describe, it, expect } from 'vitest'
import { calculateMatchScore, hasFinishedAll } from './quizScoring'

describe('calculateMatchScore', () => {
  const questions = [
    { id: 'q1' },
    { id: 'q2' },
    { id: 'q3' },
  ]

  it('returns 0 when no responses exist', () => {
    expect(calculateMatchScore([], questions)).toBe(0)
  })

  it('returns 0 when only one player answered', () => {
    const responses = [
      { player_id: 'player1', answers: { q1: 'a', q2: 'b', q3: 'c' } },
    ]
    expect(calculateMatchScore(responses, questions)).toBe(0)
  })

  it('returns full score when all answers match', () => {
    const responses = [
      { player_id: 'player1', answers: { q1: 'a', q2: 'b', q3: 'c' } },
      { player_id: 'player2', answers: { q1: 'a', q2: 'b', q3: 'c' } },
    ]
    expect(calculateMatchScore(responses, questions)).toBe(3)
  })

  it('returns 0 when no answers match', () => {
    const responses = [
      { player_id: 'player1', answers: { q1: 'a', q2: 'b', q3: 'c' } },
      { player_id: 'player2', answers: { q1: 'x', q2: 'y', q3: 'z' } },
    ]
    expect(calculateMatchScore(responses, questions)).toBe(0)
  })

  it('returns partial score for some matches', () => {
    const responses = [
      { player_id: 'player1', answers: { q1: 'a', q2: 'b', q3: 'c' } },
      { player_id: 'player2', answers: { q1: 'a', q2: 'y', q3: 'c' } },
    ]
    expect(calculateMatchScore(responses, questions)).toBe(2)
  })

  it('treats missing answers as undefined (both missing matches)', () => {
    const responses = [
      { player_id: 'player1', answers: { q1: 'a' } },
      { player_id: 'player2', answers: { q1: 'a' } },
    ]
    // q2 and q3: undefined === undefined → true
    expect(calculateMatchScore(responses, questions)).toBe(3)
  })

  it('handles missing answers object gracefully', () => {
    const responses = [
      { player_id: 'player1' },
      { player_id: 'player2' },
    ]
    // Both have empty answers objects, all undefined === undefined
    expect(calculateMatchScore(responses, questions)).toBe(3)
  })
})

describe('hasFinishedAll', () => {
  const questions = [
    { id: 'q1' },
    { id: 'q2' },
    { id: 'q3' },
  ]

  it('returns false when questions is null/undefined', () => {
    expect(hasFinishedAll([], null, 'player1')).toBe(false)
    expect(hasFinishedAll([], undefined, 'player1')).toBe(false)
  })

  it('returns false when data is empty', () => {
    expect(hasFinishedAll([], questions, 'player1')).toBe(false)
  })

  it('returns false when player answered some but not all questions', () => {
    const data = [
      { question_id: 'q1', player_id: 'player1' },
      { question_id: 'q2', player_id: 'player1' },
    ]
    expect(hasFinishedAll(data, questions, 'player1')).toBe(false)
  })

  it('returns true when player answered all questions', () => {
    const data = [
      { question_id: 'q1', player_id: 'player1' },
      { question_id: 'q2', player_id: 'player1' },
      { question_id: 'q3', player_id: 'player1' },
    ]
    expect(hasFinishedAll(data, questions, 'player1')).toBe(true)
  })

  it('only considers the specified player', () => {
    const data = [
      { question_id: 'q1', player_id: 'player1' },
      { question_id: 'q2', player_id: 'player2' },
      { question_id: 'q3', player_id: 'player2' },
    ]
    expect(hasFinishedAll(data, questions, 'player1')).toBe(false)
    expect(hasFinishedAll(data, questions, 'player2')).toBe(false)
  })

  it('returns true with extra responses from other players', () => {
    const data = [
      { question_id: 'q1', player_id: 'player1' },
      { question_id: 'q2', player_id: 'player1' },
      { question_id: 'q3', player_id: 'player1' },
      { question_id: 'q1', player_id: 'player2' },
    ]
    expect(hasFinishedAll(data, questions, 'player1')).toBe(true)
  })

  it('returns true for empty questions array', () => {
    expect(hasFinishedAll([], [], 'player1')).toBe(true)
  })
})
