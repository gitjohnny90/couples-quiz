import { useContext, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import PageDoodles, { SquigglyUnderline } from '../components/Doodles'
import { checkWinner } from '../utils/gameLogic'

const PACK_ID = 'tictactoe'
const GAME_PLAYER_ID = 'game' // shared row — not a real player

const HEART_PATH = 'M16 28 C12 24, 2 18, 3 11 C4 6, 9 4, 13 7 C14.5 8.5, 15.5 9, 16 10 C16.5 9, 17.5 8.5, 19 7 C23 4, 28 6, 29 11 C30 18, 20 24, 16 28Z'

const CoralHeart = () => (
  <svg width={40} height={40} viewBox="0 0 32 32" fill="none">
    <path d={HEART_PATH} fill="var(--accent-coral)" />
  </svg>
)

const BlueHeart = () => (
  <svg width={40} height={40} viewBox="0 0 32 32" fill="none">
    <path d={HEART_PATH} fill="var(--accent-blue)" />
  </svg>
)

const INITIAL_STATE = {
  board: Array(9).fill(null),
  currentPlayer: 'player1',
  winner: null,
  winningCells: [],
}

export default function TicTacToePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerName, playerId } = useContext(SessionContext)

  const [gameState, setGameState] = useState(INITIAL_STATE)
  const [loading, setLoading] = useState(true)

  const { board, currentPlayer, winner, winningCells } = gameState
  const isMyTurn = currentPlayer === playerId && !winner

  // Fetch existing game or create a fresh one
  const fetchGame = useCallback(async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', GAME_PLAYER_ID)
      .order('created_at', { ascending: true })
      .limit(1)

    if (!error && data && data.length > 0) {
      setGameState(data[0].answers)
    } else if (!error && (!data || data.length === 0)) {
      // No game row yet — create one
      const { data: newRow, error: insertErr } = await supabase
        .from('responses')
        .insert({
          session_id: sessionId,
          pack_id: PACK_ID,
          player_id: GAME_PLAYER_ID,
          player_name: 'game',
          answers: INITIAL_STATE,
        })
        .select()
        .single()

      if (!insertErr && newRow) {
        setGameState(newRow.answers)
      }
    }
    setLoading(false)
  }, [sessionId])

  // Place a heart on a cell
  const handleCellClick = async (index) => {
    if (board[index] || winner || currentPlayer !== playerId) return

    const newBoard = [...board]
    newBoard[index] = playerId

    let newState = { ...gameState, board: newBoard }

    const result = checkWinner(newBoard)
    if (result) {
      newState.winner = result.winner
      newState.winningCells = result.cells
    } else {
      newState.currentPlayer = playerId === 'player1' ? 'player2' : 'player1'
    }

    // Optimistic update
    setGameState(newState)

    // Persist to Supabase
    await supabase
      .from('responses')
      .update({ answers: newState })
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', GAME_PLAYER_ID)
  }

  // Reset the board
  const resetGame = async () => {
    const freshState = { ...INITIAL_STATE, board: Array(9).fill(null) }
    setGameState(freshState)
    await supabase
      .from('responses')
      .update({ answers: freshState })
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', GAME_PLAYER_ID)
  }

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchGame()

    const channel = supabase
      .channel(`tictactoe-${sessionId}`)
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  // Polling fallback — only when waiting for partner
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
            setting up the board...
          </p>
        </motion.div>
      </div>
    )
  }

  const winnerColor = winner === 'player1' ? 'var(--accent-coral)' : 'var(--accent-blue)'

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={13} />
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
            Tic-Tac-Toe
          </h1>
          <SquigglyUnderline width={110} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4, maxWidth: 300, margin: '0 auto' }}>
            hearts instead of x's and o's — you're {playerId === 'player1' ? '💗 coral' : '💙 blue'}
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
                {winner === 'draw' ? 'great minds think alike' : winner === playerId ? 'nicely done 💕' : 'well played, lovebirds'}
              </p>
            </motion.div>
          ) : isMyTurn ? (
            <p style={{
              fontFamily: 'var(--font-hand)', fontSize: '1.2rem',
              color: playerId === 'player1' ? 'var(--accent-coral)' : 'var(--accent-blue)',
            }}>
              your turn — tap to place your heart
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
        <div className="glass" style={{ padding: 20 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            maxWidth: 280,
            margin: '0 auto',
          }}>
            {board.map((cell, index) => {
              const isWinning = winningCells.includes(index)
              const row = Math.floor(index / 3)
              const col = index % 3
              const canClick = !cell && isMyTurn
              return (
                <motion.button
                  key={index}
                  whileTap={canClick ? { scale: 0.95 } : {}}
                  onClick={() => handleCellClick(index)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isWinning ? '#FFF0EC' : 'transparent',
                    border: 'none',
                    borderRight: col < 2 ? '1.5px solid var(--border-pencil)' : 'none',
                    borderBottom: row < 2 ? '1.5px solid var(--border-pencil)' : 'none',
                    cursor: canClick ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    opacity: !cell && !winner && !isMyTurn ? 0.6 : 1,
                  }}
                >
                  {cell && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {cell === 'player1' ? <CoralHeart /> : <BlueHeart />}
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
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
