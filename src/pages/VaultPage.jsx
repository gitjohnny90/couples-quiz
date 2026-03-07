import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import quizPacks from '../data/quizPacks'
import deepDiveDecks from '../data/deepDiveDecks'
import { allPredictPacks } from '../data/predictPartnerQuestions'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from '../components/Doodles'

export default function VaultPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId, playerId } = useContext(SessionContext)
  const { signOut } = useContext(AuthContext)

  const [session, setSession] = useState(null)
  const [mcCompletedCount, setMcCompletedCount] = useState(0)
  const [mcTotalPacks] = useState(quizPacks.length)
  const [ddCompletedCount, setDdCompletedCount] = useState(0)
  const [ppCompletedCount, setPpCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
    fetchData()
  }, [sessionId])

  const fetchData = async () => {
    let { data: sessionData } = await supabase.from('sessions').select('*').eq('id', sessionId).single()

    // Backfill invite code for legacy sessions that don't have one
    if (sessionData && !sessionData.invite_code) {
      const code = `LOVE-${Math.floor(1000 + Math.random() * 9000)}`
      const { data: updated } = await supabase
        .from('sessions')
        .update({ invite_code: code })
        .eq('id', sessionId)
        .select()
        .single()
      if (updated) sessionData = updated
    }

    setSession(sessionData)

    // Multiple choice completion count
    const { data: responseData } = await supabase.from('responses').select('*').eq('session_id', sessionId)
    if (responseData) {
      const packMap = {}
      responseData.forEach((r) => { if (!packMap[r.pack_id]) packMap[r.pack_id] = []; packMap[r.pack_id].push(r) })
      const done = Object.values(packMap).filter((responses) => responses.length >= 2).length
      setMcCompletedCount(done)
    }

    // Predict Partner completion count
    if (responseData) {
      const ppDone = allPredictPacks.filter(pack => {
        const packResponses = responseData.filter(r => r.pack_id === pack.id)
        return packResponses.length >= 2 &&
          packResponses.every(r => r.answers?.responses?.length === 3)
      }).length
      setPpCompletedCount(ppDone)
    }

    // Deep Dive completion count
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

        {/* Quiz type cards */}
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

          {/* Predict Your Partner card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass"
            style={{ padding: 18, cursor: 'pointer', transform: 'rotate(-0.2deg)' }}
            onClick={() => navigate(`/predict-partner/${sessionId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🔮</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 1, color: 'var(--text-primary)' }}>
                  Predict Your Partner
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  answer for yourself, then guess what your person would say
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {ppCompletedCount > 0 ? (
                  <div>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-sage)' }}>
                      {ppCompletedCount}/{allPredictPacks.length}
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

        </div>

        {/* Sign out */}
        <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 8 }}>
          <button
            onClick={async () => {
              await signOut()
              navigate('/auth')
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-hand)',
              fontSize: '1rem',
              color: 'var(--text-light)',
              padding: '8px 16px',
              textDecoration: 'underline',
              textDecorationStyle: 'wavy',
              textDecorationColor: 'var(--border-pencil)',
              textUnderlineOffset: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-coral)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-light)'}
          >
            sign out
          </button>
        </div>
      </motion.div>
    </div>
  )
}
