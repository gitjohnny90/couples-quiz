import { useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { SquigglyUnderline } from '../components/Doodles'
import PageGuide from '../components/PageGuide'

const PACK_ID = 'heartline'
const GAME_PLAYER_ID = 'game'

const ROWS = 6
const COLS = 7
const WIN_LENGTH = 4

const HEART_PATH = 'M16 28 C12 24, 2 18, 3 11 C4 6, 9 4, 13 7 C14.5 8.5, 15.5 9, 16 10 C16.5 9, 17.5 8.5, 19 7 C23 4, 28 6, 29 11 C30 18, 20 24, 16 28Z'

function makeEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

const INITIAL_STATE = {
  board: makeEmptyBoard(),
  currentPlayer: 'player1',
  winner: null,
  winningCells: [], // [{row, col}, ...]
  lastMove: null,   // {row, col} for drop animation
}

// Check all 4-in-a-row possibilities from a given cell in a given direction
function checkDirection(board, row, col, dr, dc) {
  const player = board[row][col]
  if (!player) return null
  const cells = [{ row, col }]
  for (let i = 1; i < WIN_LENGTH; i++) {
    const r = row + dr * i
    const c = col + dc * i
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) return null
    cells.push({ row: r, col: c })
  }
  return { winner: player, cells }
}

function checkWinner(board) {
  // Directions: horizontal, vertical, diagonal-down-right, diagonal-down-left
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dr, dc] of directions) {
        const result = checkDirection(board, row, col, dr, dc)
        if (result) return result
      }
    }
  }
  // Check draw — all cells filled
  const isFull = board.every(row => row.every(cell => cell !== null))
  if (isFull) return { winner: 'draw', cells: [] }
  return null
}

// Find the lowest empty row in a column
function getDropRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!board[row][col]) return row
  }
  return -1 // column full
}

const CoralHeart = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d={HEART_PATH} fill="var(--accent-coral)" />
  </svg>
)

const BlueHeart = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d={HEART_PATH} fill="var(--accent-blue)" />
  </svg>
)

export default function HeartLinePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId, playerId } = useContext(SessionContext)

  useEffect(() => { if (sessionId) setSessionId(sessionId) }, [sessionId])

  const mountedRef = useRef(true)
  const channelId = useRef(`heartline-${sessionId}-${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const [gameState, setGameState] = useState(INITIAL_STATE)
  const [loading, setLoading] = useState(true)
  const [hoveredCol, setHoveredCol] = useState(null)
  const [animatingDrop, setAnimatingDrop] = useState(null) // {row, col, player}

  const { board, currentPlayer, winner, winningCells, lastMove } = gameState
  const isMyTurn = currentPlayer === playerId && !winner

  const isWinningCell = (row, col) =>
    winningCells.some(c => c.row === row && c.col === col)

  const fetchGame = useCallback(async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('player_id, answers')
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', GAME_PLAYER_ID)
      .order('created_at', { ascending: true })
      .limit(1)

    if (!mountedRef.current) return
    if (!error && data && data.length > 0) {
      setGameState(data[0].answers)
    } else if (!error && (!data || data.length === 0)) {
      // Bootstrap the shared game row. Use upsert with ignoreDuplicates so
      // simultaneous mounts by both partners don't race-collide on the
      // (session_id, pack_id, player_id) unique constraint — first writer
      // creates the row, second is a silent no-op.
      const { data: upserted } = await supabase
        .from('responses')
        .upsert(
          {
            session_id: sessionId,
            pack_id: PACK_ID,
            player_id: GAME_PLAYER_ID,
            player_name: 'game',
            answers: INITIAL_STATE,
          },
          { onConflict: 'session_id,pack_id,player_id', ignoreDuplicates: true }
        )
        .select('answers')
        .maybeSingle()

      if (!mountedRef.current) return
      if (upserted) {
        setGameState(upserted.answers)
      } else {
        const { data: existing } = await supabase
          .from('responses')
          .select('answers')
          .eq('session_id', sessionId)
          .eq('pack_id', PACK_ID)
          .eq('player_id', GAME_PLAYER_ID)
          .maybeSingle()
        if (mountedRef.current && existing) setGameState(existing.answers)
      }
    }
    if (mountedRef.current) setLoading(false)
  }, [sessionId])

  const handleColumnClick = async (col) => {
    if (winner || currentPlayer !== playerId) return
    const row = getDropRow(board, col)
    if (row < 0) return // column full

    const newBoard = board.map(r => [...r])
    newBoard[row][col] = playerId

    // Trigger drop animation
    setAnimatingDrop({ row, col, player: playerId })

    let newState = {
      ...gameState,
      board: newBoard,
      lastMove: { row, col },
    }

    const result = checkWinner(newBoard)
    if (result) {
      newState.winner = result.winner
      newState.winningCells = result.cells
    } else {
      newState.currentPlayer = playerId === 'player1' ? 'player2' : 'player1'
    }

    setGameState(newState)

    await supabase
      .from('responses')
      .update({ answers: newState })
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', GAME_PLAYER_ID)

    // Clear animation after it completes
    setTimeout(() => setAnimatingDrop(null), 400)
  }

  const resetGame = async () => {
    const freshState = { ...INITIAL_STATE, board: makeEmptyBoard() }
    setGameState(freshState)
    setAnimatingDrop(null)
    await supabase
      .from('responses')
      .update({ answers: freshState })
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', GAME_PLAYER_ID)
  }

  // Initial fetch + realtime
  useEffect(() => {
    fetchGame()

    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responses',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (
            payload.new?.pack_id === PACK_ID &&
            payload.new?.player_id === GAME_PLAYER_ID
          ) {
            setGameState(payload.new.answers)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  // Polling fallback when waiting for partner
  useEffect(() => {
    if (isMyTurn || winner) return
    const interval = setInterval(fetchGame, 3000)
    return () => clearInterval(interval)
  }, [fetchGame, isMyTurn, winner])

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            drawing the grid...
          </p>
        </motion.div>
      </div>
    )
  }

  const winnerColor = winner === 'player1' ? 'var(--accent-coral)' : 'var(--accent-blue)'

  // Calculate cell size based on viewport
  const cellSize = `min(${Math.floor(88 / COLS)}vw, 52px)`

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageGuide pageKey="heartLine" />
      <PageDoodles seed={17} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>💕</div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
            Heart Line
          </h1>
          <SquigglyUnderline width={110} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4, maxWidth: 320, margin: '0 auto' }}>
            like connect four, but with hearts — tap a column to drop yours in, first to get 4 in a row wins
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: 6 }}>
            you're {playerId === 'player1' ? '💗 coral' : '💙 blue'}
          </p>
        </div>

        {/* Turn indicator / Winner message */}
        <div className="glass" style={{ padding: 14, textAlign: 'center', marginBottom: 16 }}>
          {winner ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '1.4rem', fontWeight: 700,
                color: winner === 'draw' ? 'var(--text-secondary)' : winnerColor,
              }}>
                {winner === 'draw' ? "it's a tie!" : winner === playerId ? 'you win!' : 'they win!'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 4 }}>
                {winner === 'draw' ? 'every cell filled with love' : winner === playerId ? 'four hearts in a row 💕' : 'well played, lovebird'}
              </p>
            </motion.div>
          ) : isMyTurn ? (
            <p style={{
              fontFamily: 'var(--font-hand)', fontSize: '1.2rem',
              color: playerId === 'player1' ? 'var(--accent-coral)' : 'var(--accent-blue)',
            }}>
              your turn — tap a column to drop your heart
            </p>
          ) : (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '1.2rem',
                color: 'var(--text-secondary)',
              }}>
                waiting for your person...
              </p>
            </motion.div>
          )}
        </div>

        {/* Game Board */}
        <div className="glass" style={{ padding: 12, overflowX: 'auto' }}>
          {/* Column tap targets (arrows at top) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${cellSize})`,
            justifyContent: 'center',
            gap: 0,
            marginBottom: 4,
          }}>
            {Array.from({ length: COLS }).map((_, col) => {
              const colFull = getDropRow(board, col) < 0
              const canDrop = isMyTurn && !colFull
              return (
                <div
                  key={`top-${col}`}
                  onClick={() => handleColumnClick(col)}
                  onMouseEnter={() => canDrop && setHoveredCol(col)}
                  onMouseLeave={() => setHoveredCol(null)}
                  style={{
                    width: cellSize,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: canDrop ? 'pointer' : 'default',
                    opacity: canDrop ? (hoveredCol === col ? 1 : 0.4) : 0,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '1rem',
                    color: playerId === 'player1' ? 'var(--accent-coral)' : 'var(--accent-blue)',
                  }}>
                    ▼
                  </span>
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${cellSize})`,
            gridTemplateRows: `repeat(${ROWS}, ${cellSize})`,
            justifyContent: 'center',
            gap: 0,
            border: '1.5px solid var(--border-pencil)',
            borderRadius: 6,
            background: 'rgba(255, 248, 240, 0.5)',
          }}>
            {board.map((row, rowIdx) =>
              row.map((cell, colIdx) => {
                const winning = isWinningCell(rowIdx, colIdx)
                const isLastMove = lastMove && lastMove.row === rowIdx && lastMove.col === colIdx
                const isAnimating = animatingDrop && animatingDrop.row === rowIdx && animatingDrop.col === colIdx
                const colFull = getDropRow(board, colIdx) < 0
                const canDrop = isMyTurn && !colFull && !cell

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => handleColumnClick(colIdx)}
                    onMouseEnter={() => canDrop && setHoveredCol(colIdx)}
                    onMouseLeave={() => setHoveredCol(null)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: colIdx < COLS - 1 ? '1px solid var(--border-pencil)' : 'none',
                      borderBottom: rowIdx < ROWS - 1 ? '1px solid var(--border-pencil)' : 'none',
                      cursor: canDrop ? 'pointer' : 'default',
                      background: winning
                        ? (cell === 'player1' ? 'rgba(232, 141, 122, 0.15)' : 'rgba(126, 184, 216, 0.15)')
                        : (hoveredCol === colIdx && isMyTurn && !cell)
                          ? 'rgba(0,0,0,0.03)'
                          : 'transparent',
                      transition: 'background 0.15s',
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    <AnimatePresence>
                      {cell && (
                        <motion.div
                          initial={isAnimating ? { y: -(rowIdx + 1) * 52, opacity: 0.8 } : { scale: 0 }}
                          animate={{ y: 0, scale: 1, opacity: 1 }}
                          transition={isAnimating
                            ? { type: 'spring', stiffness: 300, damping: 18, mass: 0.8 }
                            : { type: 'spring', stiffness: 400, damping: 15 }
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {winning && (
                            <motion.div
                              animate={{ boxShadow: ['0 0 0px rgba(232,141,122,0)', '0 0 12px rgba(232,141,122,0.5)', '0 0 0px rgba(232,141,122,0)'] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              style={{
                                position: 'absolute',
                                inset: 4,
                                borderRadius: '50%',
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                          {cell === 'player1' ? <CoralHeart size={28} /> : <BlueHeart size={28} />}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Reset button */}
        {winner && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={resetGame}
            >
              play again
            </button>
          </motion.div>
        )}

        {/* Back */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 16 }}
          onClick={() => navigate(`/fun/${sessionId}`)}
        >
          ← back to fun stuff
        </button>
      </motion.div>
    </div>
  )
}
