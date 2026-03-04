import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import quizPacks from '../data/quizPacks'
import deepDiveDecks from '../data/deepDiveDecks'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from '../components/Doodles'

export default function VaultPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId } = useContext(SessionContext)

  const [session, setSession] = useState(null)
  const [mcCompletedCount, setMcCompletedCount] = useState(0)
  const [mcTotalPacks] = useState(quizPacks.length)
  const [ddCompletedCount, setDdCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
    fetchData()
  }, [sessionId])

  // Polling fallback — check for partner joining & quiz progress updates
  useEffect(() => {
    if (session?.player2_name) return
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [sessionId, session?.player2_name])

  const fetchData = async () => {
    const { data: sessionData } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    setSession(sessionData)

    // Multiple choice completion count
    const { data: responseData } = await supabase.from('responses').select('*').eq('session_id', sessionId)
    if (responseData) {
      const packMap = {}
      responseData.forEach((r) => { if (!packMap[r.pack_id]) packMap[r.pack_id] = []; packMap[r.pack_id].push(r) })
      const done = Object.values(packMap).filter((responses) => responses.length >= 2).length
      setMcCompletedCount(done)
    }

    // Deep Dive completion count
    const playerId = localStorage.getItem('playerId')
    const { data: ddData } = await supabase.from('deep_dive_responses').select('*').eq('session_id', sessionId)
    if (ddData) {
      const ddDone = deepDiveDecks.filter((deck) =>
        deck.questions.every((q) => {
          const mine = ddData.find((r) => r.question_id === q.id && r.player_id === playerId)
          const theirs = ddData.find((r) => r.question_id === q.id && r.player_id !== playerId)
          return mine && theirs
        })
      ).length
      setDdCompletedCount(ddDone)
    }

    setLoading(false)
  }

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
            opening the notebook...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={4} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700, marginBottom: 2 }}>
            our quizzes
          </h1>
          <SquigglyUnderline width={110} color="#D4A843" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {session?.player1_name}
            {session?.player2_name
              ? <> <DoodleHeart size={12} color="#E88D7A" opacity={0.6} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }} /> {session.player2_name}</>
              : ' — waiting for your person'}
          </p>
        </div>

        {/* Share link card */}
        {!session?.player2_name && (
          <div className="glass" style={{ padding: 20, marginBottom: 18, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', marginBottom: 8 }}>
              send this to your person:
            </p>
            <div style={{
              background: '#fff', borderBottom: '2px solid var(--border-pencil)',
              padding: '10px 14px', fontSize: '0.8rem', wordBreak: 'break-all',
              color: 'var(--accent-coral)', marginBottom: 12, fontFamily: 'var(--font-body)'
            }}>
              {window.location.origin}/join/{sessionId}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyLink}>
              {copied ? 'copied!' : 'copy link'}
            </button>
          </div>
        )}

        {/* Two quiz type cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Multiple Choice card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass"
            style={{ padding: 18, cursor: 'pointer', transform: 'rotate(-0.4deg)' }}
            onClick={() => navigate(`/quiz-packs/${sessionId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🧠</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 1, color: 'var(--text-primary)' }}>
                  Multiple Choice
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  pick the same answers and see how well you match
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {mcCompletedCount > 0 ? (
                  <div>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-sage)' }}>
                      {mcCompletedCount}/{mcTotalPacks}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>done</div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                    play →
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Deep Dive card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass"
            style={{ padding: 18, cursor: 'pointer', transform: 'rotate(0.3deg)' }}
            onClick={() => navigate(`/deep-dive/${sessionId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>📖</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 1, color: 'var(--text-primary)' }}>
                  Deep Dive
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  open-ended questions you both write answers to — then reveal together
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {ddCompletedCount > 0 ? (
                  <div>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-sage)' }}>
                      {ddCompletedCount}/{deepDiveDecks.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>decks</div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                    new →
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Coming soon placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky-note"
            style={{ padding: 20, textAlign: 'center', marginTop: 8 }}
          >
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
              more quizzes coming soon...
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
              stay tuned ✨
            </p>
            <div style={{ position: 'absolute', top: -4, right: 10 }}>
              <DoodleStar size={14} opacity={0.3} rotate={10} />
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  )
}
