export const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function checkWinner(board) {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], cells: combo }
    }
  }
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', cells: [] }
  }
  return null
}

/**
 * Determine the Love Note Hunt phase from DB state.
 * @param {number} myNoteCount - how many notes the current player placed
 * @param {number} partnerNoteCount - how many notes partner placed
 * @param {number} hitCount - how many correct guesses player has made
 * @param {number} notesRequired - notes needed per player (default 3)
 * @returns {'setup'|'waiting'|'hunting'|'reveal'}
 */
export function determineLoveNotePhase(myNoteCount, partnerNoteCount, hitCount, notesRequired = 3) {
  if (myNoteCount >= notesRequired && partnerNoteCount >= notesRequired) {
    return hitCount >= notesRequired ? 'reveal' : 'hunting'
  } else if (myNoteCount >= notesRequired) {
    return 'waiting'
  }
  return 'setup'
}
