import { describe, it, expect } from 'vitest'
import { checkWinner, WINNING_COMBOS } from './gameLogic'

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
