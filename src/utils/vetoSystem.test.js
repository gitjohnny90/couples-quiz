import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createVetoSystem } from './vetoSystem'

describe('vetoSystem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getVetoInfo', () => {
    it('returns count 0 when localStorage is empty', () => {
      const { getVetoInfo } = createVetoSystem('test_vetoes')
      const info = getVetoInfo()
      expect(info.count).toBe(0)
      expect(info.weekStart).toBeTypeOf('number')
    })

    it('returns stored data when within the week', () => {
      const weekStart = Date.now() - 1000 // 1 second ago
      localStorage.setItem('test_vetoes', JSON.stringify({ count: 2, weekStart }))
      const { getVetoInfo } = createVetoSystem('test_vetoes')
      const info = getVetoInfo()
      expect(info.count).toBe(2)
      expect(info.weekStart).toBe(weekStart)
    })

    it('resets after 7 days', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      localStorage.setItem('test_vetoes', JSON.stringify({ count: 5, weekStart: eightDaysAgo }))
      const { getVetoInfo } = createVetoSystem('test_vetoes')
      const info = getVetoInfo()
      expect(info.count).toBe(0)
    })

    it('does not reset just under 7 days', () => {
      // Use 6 days 23 hours to avoid timing edge case at exactly 7 days
      const justUnderSevenDays = Date.now() - (7 * 24 * 60 * 60 * 1000 - 60000)
      localStorage.setItem('test_vetoes', JSON.stringify({ count: 3, weekStart: justUnderSevenDays }))
      const { getVetoInfo } = createVetoSystem('test_vetoes')
      const info = getVetoInfo()
      expect(info.count).toBe(3)
    })

    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('test_vetoes', 'not valid json{{{')
      const { getVetoInfo } = createVetoSystem('test_vetoes')
      const info = getVetoInfo()
      expect(info.count).toBe(0)
    })
  })

  describe('saveVeto', () => {
    it('increments count from 0', () => {
      const { saveVeto } = createVetoSystem('test_vetoes')
      const result = saveVeto()
      expect(result.count).toBe(1)
    })

    it('increments existing count', () => {
      const weekStart = Date.now()
      localStorage.setItem('test_vetoes', JSON.stringify({ count: 1, weekStart }))
      const { saveVeto } = createVetoSystem('test_vetoes')
      const result = saveVeto()
      expect(result.count).toBe(2)
      expect(result.weekStart).toBe(weekStart)
    })

    it('persists to localStorage', () => {
      const { saveVeto } = createVetoSystem('test_vetoes')
      saveVeto()
      const stored = JSON.parse(localStorage.getItem('test_vetoes'))
      expect(stored.count).toBe(1)
    })

    it('multiple saves increment correctly', () => {
      const { saveVeto } = createVetoSystem('test_vetoes')
      saveVeto()
      saveVeto()
      const result = saveVeto()
      expect(result.count).toBe(3)
    })
  })

  describe('key isolation', () => {
    it('different keys are independent', () => {
      const movies = createVetoSystem('movie_vetoes')
      const books = createVetoSystem('book_vetoes')

      movies.saveVeto()
      movies.saveVeto()
      books.saveVeto()

      expect(movies.getVetoInfo().count).toBe(2)
      expect(books.getVetoInfo().count).toBe(1)
    })
  })
})
