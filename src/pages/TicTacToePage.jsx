import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageDoodles, { SquigglyUnderline } from '../components/Doodles'
import { checkWinner } from '../utils/gameLogic'

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

export default function TicTacToePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [board, setBoard] = useState(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState('p1')
  const [winner, setWinner] = useState(null)
  const [winningCells, setWinningCells] = useState([])

  const handleCellClick = (index) => {
    if (board[index] || winner) return
    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const result = checkWinner(newBoard)
    if (result) {
      setWinner(result.winner)
      setWinningCells(result.cells)
    } else {
      setCurrentPlayer(currentPlayer === 'p1' ? 'p2' : 'p1')
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('p1')
    setWinner(null)
    setWinningCells([])
  }

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
            hearts instead of x's and o's — take turns on the same screen
          </p>
        </div>

        {/* Turn indicator / Winner message */}
        <div className="glass" style={{ padding: 14, textAlign: 'center', marginBottom: 16 }}>
          {winner ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '1.4rem', fontWeight: 700,
                color: winner === 'draw' ? 'var(--text-secondary)' : winner === 'p1' ? 'var(--accent-coral)' : 'var(--accent-blue)',
              }}>
                {winner === 'draw' ? "it's a tie!" : winner === 'p1' ? 'coral hearts win!' : 'blue hearts win!'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 4 }}>
                {winner === 'draw' ? 'great minds think alike' : 'well played, lovebirds'}
              </p>
            </motion.div>
          ) : (
            <p style={{
              fontFamily: 'var(--font-hand)', fontSize: '1.2rem',
              color: currentPlayer === 'p1' ? 'var(--accent-coral)' : 'var(--accent-blue)',
            }}>
              {currentPlayer === 'p1' ? "coral heart's turn" : "blue heart's turn"}
            </p>
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
              return (
                <motion.button
                  key={index}
                  whileTap={!cell && !winner ? { scale: 0.95 } : {}}
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
                    cursor: cell || winner ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {cell && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {cell === 'p1' ? <CoralHeart /> : <BlueHeart />}
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
