import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import drawingPrompts, { drawingRoundMeta, getDrawPackId } from '../data/drawingPrompts'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleStar, DoodleSpiral, SquigglyUnderline } from '../components/Doodles'

export default function FunStuffPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId } = useContext(SessionContext)

  const [drawStatus, setDrawStatus] = useState({ completedCount: 0, startedCount: 0, total: drawingPrompts.length })
  const [movieCount, setMovieCount] = useState(0)
  const [bookCount, setBookCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
    fetchData()
  }, [sessionId])

  const fetchData = async () => {
    const allDrawPackIds = drawingPrompts.map(p => getDrawPackId(p.id))
    const [{ data: drawData }, { data: itemData }] = await Promise.all([
      supabase.from('responses').select('pack_id, player_id').eq('session_id', sessionId).in('pack_id', allDrawPackIds),
      supabase.from('shared_items').select('type, id').eq('session_id', sessionId),
    ])

    if (drawData) {
      const byPack = {}
      drawData.forEach(r => {
        if (!byPack[r.pack_id]) byPack[r.pack_id] = new Set()
        byPack[r.pack_id].add(r.player_id)
      })
      const completedCount = Object.values(byPack).filter(players => players.size >= 2).length
      const startedCount = Object.keys(byPack).length
      setDrawStatus({ completedCount, startedCount, total: drawingPrompts.length })
    }
    if (itemData) {
      setMovieCount(itemData.filter((i) => i.type === 'movie').length)
      setBookCount(itemData.filter((i) => i.type === 'book').length)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            flipping to the fun page...
          </p>
        </motion.div>
      </div>
    )
  }

  const activities = [
    {
      emoji: drawingRoundMeta.emoji,
      title: drawingRoundMeta.title,
      description: drawingRoundMeta.description,
      rotation: 0.4,
      borderColor: drawStatus.completedCount > 0 ? 'var(--accent-blue)' : undefined,
      statusText: drawStatus.completedCount > 0
        ? `${drawStatus.completedCount}/${drawStatus.total} done`
        : drawStatus.startedCount > 0
          ? 'in progress...'
          : 'draw →',
      statusColor: drawStatus.completedCount > 0
        ? 'var(--accent-blue)'
        : drawStatus.startedCount > 0
          ? 'var(--accent-mustard)'
          : 'var(--text-light)',
      onClick: () => navigate(`/draw/${sessionId}`),
    },
    {
      emoji: '🎬',
      title: 'Movies',
      description: 'shared watchlist, genre wheel, and pick for us',
      rotation: -0.5,
      borderColor: movieCount > 0 ? 'var(--accent-coral)' : undefined,
      statusText: movieCount > 0 ? `${movieCount} saved` : 'explore →',
      statusColor: movieCount > 0 ? 'var(--accent-coral)' : 'var(--text-light)',
      onClick: () => navigate(`/movies/${sessionId}`),
    },
    {
      emoji: '📚',
      title: 'Books',
      description: 'shared reading list, genre wheel, and pick for us',
      rotation: 0.3,
      borderColor: bookCount > 0 ? 'var(--accent-sage)' : undefined,
      statusText: bookCount > 0 ? `${bookCount} saved` : 'explore →',
      statusColor: bookCount > 0 ? 'var(--accent-sage)' : 'var(--text-light)',
      onClick: () => navigate(`/books/${sessionId}`),
    },
    {
      emoji: '💕',
      title: 'Tic-Tac-Toe',
      description: "hearts instead of x's and o's — play on the same screen",
      rotation: -0.3,
      statusText: 'play →',
      statusColor: 'var(--text-light)',
      onClick: () => navigate(`/tictactoe/${sessionId}`),
    },
  ]

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={11} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700, marginBottom: 2 }}>
            fun stuff
          </h1>
          <SquigglyUnderline width={100} color="#6B8DAD" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            games, lists, and other shenanigans
          </p>
        </div>

        {/* Activities list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activities.map((activity, i) => (
            <motion.div
              key={activity.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass"
              style={{
                padding: 18,
                cursor: 'pointer',
                transform: `rotate(${activity.rotation}deg)`,
                borderColor: activity.borderColor,
              }}
              onClick={activity.onClick}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{activity.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 1, color: 'var(--text-primary)' }}>
                    {activity.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    {activity.description}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-hand)', fontSize: '0.95rem',
                    fontWeight: activity.statusText.includes('✓') || activity.statusText.includes('saved') ? 700 : 400,
                    color: activity.statusColor,
                  }}>
                    {activity.statusText}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Coming soon placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="sticky-note"
            style={{ padding: 20, textAlign: 'center', marginTop: 8 }}
          >
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
              more fun stuff coming soon...
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
              stay tuned ✨
            </p>
            <div style={{ position: 'absolute', top: -4, right: 10 }}>
              <DoodleStar size={14} opacity={0.3} rotate={10} />
            </div>
          </motion.div>

        </div>

        <div style={{ position: 'absolute', bottom: 130, right: -6 }}>
          <DoodleSpiral size={18} opacity={0.18} rotate={-20} />
        </div>
      </motion.div>
    </div>
  )
}
