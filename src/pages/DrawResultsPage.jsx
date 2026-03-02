import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import drawingPrompts, { drawingRoundMeta, getDrawPackId } from '../data/drawingPrompts'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleHeart, DoodleStar, SquigglyUnderline } from '../components/Doodles'

export default function DrawResultsPage() {
  const { sessionId, promptId } = useParams()
  const navigate = useNavigate()
  const { playerName } = useContext(SessionContext)

  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Use per-prompt pack_id if promptId present, else legacy fallback
  const targetPackId = promptId ? getDrawPackId(promptId) : drawingRoundMeta.id

  // Look up prompt text from static data when available
  const promptFromData = promptId ? drawingPrompts.find(p => p.id === promptId) : null

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('pack_id', targetPackId)

    if (!error && data) setResponses(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchResponses()

    // Realtime: listen for partner's drawing submission
    const channel = supabase
      .channel(`draw-${sessionId}-${promptId || 'legacy'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `session_id=eq.${sessionId}`,
        },
        () => fetchResponses()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, promptId])

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${sessionId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            loading drawings...
          </p>
        </motion.div>
      </div>
    )
  }

  const bothDone = responses.length >= 2
  const p1 = responses.find((r) => r.player_id === 'player1')
  const p2 = responses.find((r) => r.player_id === 'player2')

  // Waiting for partner
  if (!bothDone) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={8} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: 40 }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
          <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>
            waiting for your person...
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 24 }}>
            they need to draw their masterpiece too!
          </p>

          <div className="glass" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
              send them this link:
            </p>
            <div style={{
              background: '#fff',
              borderBottom: '2px solid var(--border-pencil)',
              padding: '10px 14px',
              fontSize: '0.8rem',
              wordBreak: 'break-all',
              color: 'var(--accent-coral)',
              marginBottom: 12,
              fontFamily: 'var(--font-body)',
            }}>
              {window.location.origin}/join/{sessionId}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyLink}>
              {copied ? 'copied!' : 'copy link'}
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => { setLoading(true); fetchResponses() }}
          >
            check again
          </button>

          {promptId && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 8, marginLeft: 8 }}
              onClick={() => navigate(`/draw/${sessionId}`)}
            >
              draw another →
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  // Both done — reveal time!
  const promptText = promptFromData?.text || p1?.answers?.promptText || p2?.answers?.promptText || ''

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={9} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
            the big reveal
          </h1>
          <SquigglyUnderline width={100} color="#6B8DAD" opacity={0.4} style={{ margin: '0 auto 8px' }} />
        </div>

        {/* Prompt reminder */}
        <div className="glass" style={{ padding: 16, marginBottom: 18, textAlign: 'center', transform: 'rotate(0.3deg)' }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
            the prompt was:
          </p>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            "{promptText}"
          </p>
        </div>

        {/* Reveal card */}
        {!revealed ? (
          <motion.div
            className="glass"
            style={{
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              transform: 'rotate(-0.5deg)',
            }}
            onClick={() => setRevealed(true)}
            whileTap={{ scale: 0.97 }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤫</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              tap to reveal the masterpieces
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 6 }}>
              (prepare yourselves)
            </p>
            <div style={{ position: 'absolute', top: 8, right: 16 }}>
              <DoodleStar size={16} opacity={0.3} rotate={15} />
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Side-by-side drawings */}
              <div className="drawing-reveal-grid">
                {/* Player 1 */}
                <motion.div
                  className="drawing-reveal-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <p className="drawing-reveal-name" style={{ color: 'var(--accent-coral)' }}>
                    {p1?.player_name || 'player 1'}
                  </p>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={p1?.answers?.drawing}
                      alt={`${p1?.player_name}'s drawing`}
                    />
                    <div className="torn-edge-small" />
                  </div>
                </motion.div>

                {/* Player 2 */}
                <motion.div
                  className="drawing-reveal-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="drawing-reveal-name" style={{ color: 'var(--accent-blue)' }}>
                    {p2?.player_name || 'player 2'}
                  </p>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={p2?.answers?.drawing}
                      alt={`${p2?.player_name}'s drawing`}
                    />
                    <div className="torn-edge-small" />
                  </div>
                </motion.div>
              </div>

              {/* Fun reaction */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ textAlign: 'center', marginTop: 20 }}
              >
                <div className="sticky-note" style={{ padding: 16, display: 'inline-block' }}>
                  <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>
                    modern art, honestly 🎨
                  </p>
                  <DoodleHeart size={12} color="#E88D7A" opacity={0.5} style={{ position: 'absolute', top: -4, right: -4 }} />
                </div>
              </motion.div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/fun/${sessionId}`)}
                >
                  ← back to fun stuff
                </button>
                {promptId && (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/draw/${sessionId}`)}
                  >
                    draw another →
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  )
}
