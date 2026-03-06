import { describe, it, expect } from 'vitest'
import {
  validatePlayerName,
  getDocumentTitle,
  isTabActive,
  resolveJoinState,
} from './sessionUtils'

// ─── validatePlayerName ──────────────────────────────────────

describe('validatePlayerName', () => {
  it('returns trimmed name for valid input', () => {
    expect(validatePlayerName('Alice')).toBe('Alice')
  })

  it('trims leading/trailing whitespace', () => {
    expect(validatePlayerName('  Bob  ')).toBe('Bob')
  })

  it('returns null for empty string', () => {
    expect(validatePlayerName('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(validatePlayerName('   ')).toBeNull()
  })

  it('returns null for non-string values', () => {
    expect(validatePlayerName(null)).toBeNull()
    expect(validatePlayerName(undefined)).toBeNull()
    expect(validatePlayerName(42)).toBeNull()
    expect(validatePlayerName(true)).toBeNull()
  })

  it('preserves internal spaces', () => {
    expect(validatePlayerName(' Mary Jane ')).toBe('Mary Jane')
  })
})

// ─── getDocumentTitle ────────────────────────────────────────

describe('getDocumentTitle', () => {
  it('returns base title for root path', () => {
    expect(getDocumentTitle('/')).toBe('The Us Quiz')
  })

  const titleCases = [
    ['/vault/abc', 'Quizzes — The Us Quiz'],
    ['/quiz-packs/abc', 'Quiz Packs — The Us Quiz'],
    ['/quiz/abc/pack1', 'Quiz — The Us Quiz'],
    ['/results/abc/pack1', 'Results — The Us Quiz'],
    ['/deep-dive/abc', 'Deep Dive — The Us Quiz'],
    ['/deep-dive/abc/deck1', 'Deep Dive — The Us Quiz'],
    ['/fun/abc', 'Fun Stuff — The Us Quiz'],
    ['/draw/abc', 'Draw — The Us Quiz'],
    ['/movies/abc', 'Movies — The Us Quiz'],
    ['/books/abc', 'Books — The Us Quiz'],
    ['/tictactoe/abc', 'Tic-Tac-Toe — The Us Quiz'],
    ['/love-notes/abc', 'Love Note Hunt — The Us Quiz'],
    ['/profiles/abc', 'About Us — The Us Quiz'],
    ['/journal/abc', 'Journal — The Us Quiz'],
    ['/join/abc', 'Join — The Us Quiz'],
    ['/watch-guide/abc', 'Watch Guide — The Us Quiz'],
  ]

  it.each(titleCases)('returns correct title for %s', (path, expected) => {
    expect(getDocumentTitle(path)).toBe(expected)
  })

  it('returns base title for unknown paths', () => {
    expect(getDocumentTitle('/random/stuff')).toBe('The Us Quiz')
  })
})

// ─── isTabActive ─────────────────────────────────────────────

describe('isTabActive', () => {
  describe('home tab ("/")', () => {
    it('is active on root path', () => {
      expect(isTabActive('/', '/')).toBe(true)
    })

    it('is NOT active on other paths', () => {
      expect(isTabActive('/', '/vault/abc')).toBe(false)
      expect(isTabActive('/', '/fun/abc')).toBe(false)
    })
  })

  describe('quizzes tab ("/vault/:id")', () => {
    const tabPath = '/vault/abc'

    it('is active on /vault', () => {
      expect(isTabActive(tabPath, '/vault/abc')).toBe(true)
    })

    it('is active on /quiz', () => {
      expect(isTabActive(tabPath, '/quiz/abc/pack1')).toBe(true)
    })

    it('is active on /results', () => {
      expect(isTabActive(tabPath, '/results/abc/pack1')).toBe(true)
    })

    it('is active on /deep-dive', () => {
      expect(isTabActive(tabPath, '/deep-dive/abc')).toBe(true)
      expect(isTabActive(tabPath, '/deep-dive/abc/deck1')).toBe(true)
    })

    it('is active on /quiz-packs', () => {
      expect(isTabActive(tabPath, '/quiz-packs/abc')).toBe(true)
    })

    it('is NOT active on fun-stuff routes', () => {
      expect(isTabActive(tabPath, '/fun/abc')).toBe(false)
      expect(isTabActive(tabPath, '/movies/abc')).toBe(false)
    })

    it('is NOT active on us routes', () => {
      expect(isTabActive(tabPath, '/profiles/abc')).toBe(false)
      expect(isTabActive(tabPath, '/journal/abc')).toBe(false)
    })
  })

  describe('fun stuff tab ("/fun/:id")', () => {
    const tabPath = '/fun/abc'

    it('is active on /fun', () => {
      expect(isTabActive(tabPath, '/fun/abc')).toBe(true)
    })

    it('is active on /draw', () => {
      expect(isTabActive(tabPath, '/draw/abc')).toBe(true)
    })

    it('is active on /movies', () => {
      expect(isTabActive(tabPath, '/movies/abc')).toBe(true)
    })

    it('is active on /books', () => {
      expect(isTabActive(tabPath, '/books/abc')).toBe(true)
    })

    it('is active on /watch-guide', () => {
      expect(isTabActive(tabPath, '/watch-guide/abc')).toBe(true)
    })

    it('is active on /tictactoe', () => {
      expect(isTabActive(tabPath, '/tictactoe/abc')).toBe(true)
    })

    it('is active on /love-notes', () => {
      expect(isTabActive(tabPath, '/love-notes/abc')).toBe(true)
    })

    it('is NOT active on quiz routes', () => {
      expect(isTabActive(tabPath, '/vault/abc')).toBe(false)
      expect(isTabActive(tabPath, '/results/abc/pack1')).toBe(false)
    })

    it('is NOT active on us routes', () => {
      expect(isTabActive(tabPath, '/profiles/abc')).toBe(false)
    })
  })

  describe('us tab ("/profiles/:id")', () => {
    const tabPath = '/profiles/abc'

    it('is active on /profiles', () => {
      expect(isTabActive(tabPath, '/profiles/abc')).toBe(true)
    })

    it('is active on /journal', () => {
      expect(isTabActive(tabPath, '/journal/abc')).toBe(true)
    })

    it('is NOT active on quiz routes', () => {
      expect(isTabActive(tabPath, '/vault/abc')).toBe(false)
    })

    it('is NOT active on fun routes', () => {
      expect(isTabActive(tabPath, '/fun/abc')).toBe(false)
    })
  })
})

// ─── resolveJoinState ────────────────────────────────────────

describe('resolveJoinState', () => {
  it('returns not_found when error is truthy', () => {
    const result = resolveJoinState(null, { message: 'not found' })
    expect(result.status).toBe('not_found')
    expect(result.player1Name).toBe('')
    expect(result.player2Name).toBe('')
  })

  it('returns not_found when data is null', () => {
    const result = resolveJoinState(null, null)
    expect(result.status).toBe('not_found')
  })

  it('returns not_found when data is undefined', () => {
    const result = resolveJoinState(undefined, null)
    expect(result.status).toBe('not_found')
  })

  it('returns ready when player2 has not joined', () => {
    const data = { player1_name: 'Alice', player2_name: null }
    const result = resolveJoinState(data, null)
    expect(result.status).toBe('ready')
    expect(result.player1Name).toBe('Alice')
    expect(result.player2Name).toBe('')
  })

  it('returns ready when player2_name is empty string', () => {
    const data = { player1_name: 'Alice', player2_name: '' }
    const result = resolveJoinState(data, null)
    expect(result.status).toBe('ready')
  })

  it('returns already_joined when player2 exists', () => {
    const data = { player1_name: 'Alice', player2_name: 'Bob' }
    const result = resolveJoinState(data, null)
    expect(result.status).toBe('already_joined')
    expect(result.player1Name).toBe('Alice')
    expect(result.player2Name).toBe('Bob')
  })

  it('prioritises error over data', () => {
    const data = { player1_name: 'Alice', player2_name: null }
    const result = resolveJoinState(data, { message: 'fail' })
    expect(result.status).toBe('not_found')
  })
})
