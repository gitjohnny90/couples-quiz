import { describe, it, expect } from 'vitest'
import { checkWinner, WINNING_COMBOS, determineLoveNotePhase } from './gameLogic'

describe('checkWinner', () => {
  it('returns null for an empty board', () => {
    const board = Array(9).fill(null)
    expect(checkWinner(board)).toBeNull()
  })

  it('returns null for an incomplete game with no winner', () => {
    const board = ['p1', 'p2', null, null, 'p1', null, null, null, null]
    expect(checkWinner(board)).toBeNull()
  })

  it('detects a row win (top row)', () => {
    const board = ['p1', 'p1', 'p1', 'p2', 'p2', null, null, null, null]
    expect(checkWinner(board)).toEqual({ winner: 'p1', cells: [0, 1, 2] })
  })

  it('detects a row win (middle row)', () => {
    const board = [null, 'p1', null, 'p2', 'p2', 'p2', null, 'p1', null]
    expect(checkWinner(board)).toEqual({ winner: 'p2', cells: [3, 4, 5] })
  })

  it('detects a row win (bottom row)', () => {
    const board = [null, null, null, null, null, null, 'p1', 'p1', 'p1']
    expect(checkWinner(board)).toEqual({ winner: 'p1', cells: [6, 7, 8] })
  })

  it('detects a column win (left column)', () => {
    const board = ['p2', null, null, 'p2', 'p1', null, 'p2', null, 'p1']
    expect(checkWinner(board)).toEqual({ winner: 'p2', cells: [0, 3, 6] })
  })

  it('detects a column win (middle column)', () => {
    const board = [null, 'p1', null, null, 'p1', 'p2', null, 'p1', null]
    expect(checkWinner(board)).toEqual({ winner: 'p1', cells: [1, 4, 7] })
  })

  it('detects a column win (right column)', () => {
    const board = [null, null, 'p2', null, null, 'p2', null, null, 'p2']
    expect(checkWinner(board)).toEqual({ winner: 'p2', cells: [2, 5, 8] })
  })

  it('detects a diagonal win (top-left to bottom-right)', () => {
    const board = ['p1', 'p2', null, null, 'p1', 'p2', null, null, 'p1']
    expect(checkWinner(board)).toEqual({ winner: 'p1', cells: [0, 4, 8] })
  })

  it('detects a diagonal win (top-right to bottom-left)', () => {
    const board = [null, null, 'p2', null, 'p2', null, 'p2', null, null]
    expect(checkWinner(board)).toEqual({ winner: 'p2', cells: [2, 4, 6] })
  })

  it('detects a draw when all cells filled with no winner', () => {
    const board = ['p1', 'p2', 'p1', 'p1', 'p2', 'p2', 'p2', 'p1', 'p1']
    // Verify no winning combo exists
    expect(checkWinner(board)).toEqual({ winner: 'draw', cells: [] })
  })

  it('returns winner even when board is full', () => {
    const board = ['p1', 'p1', 'p1', 'p2', 'p2', 'p1', 'p1', 'p2', 'p2']
    const result = checkWinner(board)
    expect(result.winner).toBe('p1')
  })

  it('has exactly 8 winning combos', () => {
    expect(WINNING_COMBOS).toHaveLength(8)
  })
})

describe('determineLoveNotePhase', () => {
  const REQ = 3

  it('returns setup when player has placed no notes', () => {
    expect(determineLoveNotePhase(0, 0, 0, REQ)).toBe('setup')
  })

  it('returns setup when player has placed fewer than required', () => {
    expect(determineLoveNotePhase(2, 0, 0, REQ)).toBe('setup')
  })

  it('returns setup when player has placed fewer even if partner is done', () => {
    expect(determineLoveNotePhase(1, 3, 0, REQ)).toBe('setup')
  })

  it('returns waiting when player placed enough but partner has not', () => {
    expect(determineLoveNotePhase(3, 0, 0, REQ)).toBe('waiting')
  })

  it('returns waiting when player placed enough but partner placed fewer', () => {
    expect(determineLoveNotePhase(3, 2, 0, REQ)).toBe('waiting')
  })

  it('returns hunting when both placed enough and hits < required', () => {
    expect(determineLoveNotePhase(3, 3, 0, REQ)).toBe('hunting')
  })

  it('returns hunting when both placed enough and some hits but not all', () => {
    expect(determineLoveNotePhase(3, 3, 2, REQ)).toBe('hunting')
  })

  it('returns reveal when both placed enough and all hits found', () => {
    expect(determineLoveNotePhase(3, 3, 3, REQ)).toBe('reveal')
  })

  it('returns reveal when hits exceed required', () => {
    expect(determineLoveNotePhase(3, 3, 5, REQ)).toBe('reveal')
  })

  it('works with more notes than required', () => {
    expect(determineLoveNotePhase(5, 4, 1, REQ)).toBe('hunting')
  })

  it('defaults notesRequired to 3', () => {
    expect(determineLoveNotePhase(3, 3, 3)).toBe('reveal')
    expect(determineLoveNotePhase(2, 2, 0)).toBe('setup')
  })

  it('works with custom notesRequired', () => {
    expect(determineLoveNotePhase(5, 5, 5, 5)).toBe('reveal')
    expect(determineLoveNotePhase(5, 5, 3, 5)).toBe('hunting')
    expect(determineLoveNotePhase(5, 4, 0, 5)).toBe('waiting')
    expect(determineLoveNotePhase(4, 5, 0, 5)).toBe('setup')
  })
})
