import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { drawingRoundMeta } from '../data/drawingPrompts'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleStar, DoodleSpiral, SquigglyUnderline } from '../components/Doodles'

export default function FunStuffPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId } = useContext(SessionContext)

  const [drawStatus, setDrawStatus] = useState({ count: 0, bothDone: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
    fetchData()
  }, [sessionId])

  const fetchData = async () => {
    const { data: responseData } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('pack_id', drawingRoundMeta.id)

    if (responseData) {
      setDrawStatus({ count: responseData.length, bothDone: responseData.length >= 2 })
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
            games, drawings, and other shenanigans
          </p>
        </div>

        {/* Activities list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Draw Together card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="glass"
            style={{
              padding: 18,
              cursor: 'pointer',
              transform: 'rotate(0.4deg)',
              borderColor: drawStatus.bothDone ? 'var(--accent-blue)' : undefined,
            }}
            onClick={() => drawStatus.bothDone
              ? navigate(`/draw-results/${sessionId}`)
              : navigate(`/draw/${sessionId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{drawingRoundMeta.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 1, color: 'var(--text-primary)' }}>
                  {drawingRoundMeta.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {drawingRoundMeta.description}
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {drawStatus.bothDone ? (
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                    done! ✓
                  </div>
                ) : drawStatus.count >= 1 ? (
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--accent-mustard)' }}>
                    waiting...
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                    draw →
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Coming soon placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="sticky-note"
            style={{ padding: 20, textAlign: 'center', marginTop: 8 }}
          >
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
              more games coming soon...
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
