/**
 * Pure helper functions for session identity, navigation, and routing.
 */

/**
 * Validate and normalise a player name.
 * @param {string} raw - raw input value
 * @returns {string|null} trimmed name, or null if invalid
 */
export function validatePlayerName(raw) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Determine the page title for a given pathname.
 * @param {string} pathname - e.g. "/vault/abc123"
 * @returns {string}
 */
export function getDocumentTitle(pathname) {
  if (pathname.startsWith('/vault')) return 'Quizzes — The Us Quiz'
  if (pathname.startsWith('/quiz-packs')) return 'Quiz Packs — The Us Quiz'
  if (pathname.startsWith('/quiz/')) return 'Quiz — The Us Quiz'
  if (pathname.startsWith('/results')) return 'Results — The Us Quiz'
  if (pathname.startsWith('/deep-dive')) return 'Deep Dive — The Us Quiz'
  if (pathname.startsWith('/fun')) return 'Fun Stuff — The Us Quiz'
  if (pathname.startsWith('/draw')) return 'Draw — The Us Quiz'
  if (pathname.startsWith('/movies')) return 'Movies — The Us Quiz'
  if (pathname.startsWith('/books')) return 'Books — The Us Quiz'
  if (pathname.startsWith('/tictactoe')) return 'Tic-Tac-Toe — The Us Quiz'
  if (pathname.startsWith('/love-notes')) return 'Love Note Hunt — The Us Quiz'
  if (pathname.startsWith('/profiles')) return 'About Us — The Us Quiz'
  if (pathname.startsWith('/journal')) return 'Journal — The Us Quiz'
  if (pathname.startsWith('/join')) return 'Join — The Us Quiz'
  if (pathname.startsWith('/watch-guide')) return 'Watch Guide — The Us Quiz'
  return 'The Us Quiz'
}

/**
 * Determine whether a bottom-nav tab is active for the current pathname.
 *
 * Tab groupings:
 *  - "/" → exact match only
 *  - "/vault/:id" (quizzes) → /vault, /quiz, /results, /deep-dive, /quiz-packs
 *  - "/fun/:id" (fun stuff) → /fun, /draw, /movies, /books, /watch-guide, /tictactoe, /love-notes
 *  - "/profiles/:id" (us)   → /profiles, /journal
 *
 * @param {string} tabPath - the tab's target path, e.g. "/" or "/vault/abc"
 * @param {string} pathname - current location.pathname
 * @returns {boolean}
 */
export function isTabActive(tabPath, pathname) {
  if (tabPath === '/') return pathname === '/'
  const base = '/' + tabPath.split('/')[1]
  if (base === '/fun') {
    return pathname.startsWith('/fun') ||
           pathname.startsWith('/draw') ||
           pathname.startsWith('/movies') ||
           pathname.startsWith('/books') ||
           pathname.startsWith('/watch-guide') ||
           pathname.startsWith('/tictactoe') ||
           pathname.startsWith('/love-notes')
  }
  if (base === '/vault') {
    return pathname.startsWith('/vault') ||
           pathname.startsWith('/quiz') ||
           pathname.startsWith('/results') ||
           pathname.startsWith('/deep-dive') ||
           pathname.startsWith('/quiz-packs')
  }
  if (base === '/profiles') {
    return pathname.startsWith('/profiles') ||
           pathname.startsWith('/journal')
  }
  return pathname.startsWith(base)
}

/**
 * Resolve the state the JoinPage should display, given the fetched session row.
 * @param {{ player1_name: string, player2_name: string|null }|null} data
 * @param {*} error - Supabase error object (truthy = error)
 * @returns {{ status: 'not_found'|'already_joined'|'ready', player1Name: string, player2Name: string }}
 */
export function resolveJoinState(data, error) {
  if (error || !data) {
    return { status: 'not_found', player1Name: '', player2Name: '' }
  }
  if (data.player2_name) {
    return { status: 'already_joined', player1Name: data.player1_name, player2Name: data.player2_name }
  }
  return { status: 'ready', player1Name: data.player1_name, player2Name: '' }
}
