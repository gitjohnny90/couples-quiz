import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import quizPacks from '../data/quizPacks'
import { motion } from 'framer-motion'
import PageDoodles, { SquigglyUnderline, DoodleStar } from '../components/Doodles'

export default function QuizPacksPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerName } = useContext(SessionContext)

  const [completedPacks, setCompletedPacks] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: responseData } = await supabase.from('responses').select('*').eq('session_id', sessionId)
      const packMap = {}
      if (responseData) responseData.forEach((r) => { if (!packMap[r.pack_id]) packMap[r.pack_id] = []; packMap[r.pack_id].push(r) })

      const completed = {}
      Object.entries(packMap).forEach(([packId, responses]) => {
        const pack = quizPacks.find((p) => p.id === packId)
        if (!pack) return
        const bothDone = responses.length >= 2
        const p1 = responses.find((r) => r.player_id === 'player1')
        const p2 = responses.find((r) => r.player_id === 'player2')
        let matchCount = 0
        if (bothDone && p1 && p2) pack.questions.forEach((q) => { if (p1.answers[q.id] === p2.answers[q.id]) matchCount++ })
        completed[packId] = { count: responses.length, bothDone, matchCount, total: pack.questions.length }
      })
      setCompletedPacks(completed)
      setLoading(false)
    }
    fetchData()
  }, [sessionId])

  const totalQuestions = Object.values(completedPacks).filter((p) => p.bothDone).reduce((s, p) => s + p.total, 0)
  const totalMatches = Object.values(completedPacks).filter((p) => p.bothDone).reduce((s, p) => s + p.matchCount, 0)
  const overallPercent = totalQuestions > 0 ? Math.round((totalMatches / totalQuestions) * 100) : null
  const completedCount = Object.values(completedPacks).filter((p) => p.bothDone).length

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

  const cardRotations = [-0.7, 0.5, -0.3, 0.8, -0.5, 0.4]

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={4} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
            Multiple Choice 🧠
          </h1>
          <SquigglyUnderline width={120} color="#D4A843" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
            pick the same answers and see how well you know each other
          </p>
        </div>

        {/* Overall compatibility — sticky note */}
        {overallPercent !== null && (
          <div className="sticky-note" style={{ padding: 22, marginBottom: 18, textAlign: 'center', position: 'relative' }}>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              how well do we know each other?
            </p>
            <div style={{ fontFamily: 'var(--font-hand)', fontSize: '2.8rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1 }}>
              {overallPercent}%
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              {totalMatches} of {totalQuestions} matched across {completedCount} quiz{completedCount !== 1 ? 'zes' : ''}
            </p>
            <div className="progress-bar-track" style={{ marginTop: 10 }}>
              <div className="progress-bar-fill" style={{ width: `${overallPercent}%`, background: 'var(--accent-sage)' }} />
            </div>
            <div style={{ position: 'absolute', top: -6, right: 8 }}>
              <DoodleStar size={14} opacity={0.35} rotate={8} />
            </div>
          </div>
        )}

        {/* Quiz pack cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quizPacks.map((pack, i) => {
            const status = completedPacks[pack.id]
            const bothDone = status?.bothDone
            const playerDone = status?.count >= 1

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass"
                style={{
                  padding: 18,
                  cursor: 'pointer',
                  transform: `rotate(${cardRotations[i]}deg)`,
                  borderColor: bothDone ? 'var(--accent-sage)' : undefined,
                }}
                onClick={() => bothDone ? navigate(`/results/${sessionId}/${pack.id}`) : navigate(`/quiz/${sessionId}/${pack.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{pack.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 1, color: 'var(--text-primary)' }}>
                      {pack.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {pack.description}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {bothDone ? (
                      <div>
                        <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-sage)' }}>
                          {status.matchCount}/{status.total}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>matched</div>
                      </div>
                    ) : playerDone ? (
                      <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--accent-mustard)' }}>
                        waiting...
                      </div>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                        play →
                      </div>
                    )}
                  </div>
                </div>

                {bothDone && (
                  <div className="progress-bar-track" style={{ marginTop: 10 }}>
                    <div className="progress-bar-fill" style={{
                      width: `${(status.matchCount / status.total) * 100}%`,
                      background: status.matchCount === status.total ? 'var(--accent-sage)' : undefined
                    }} />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Journal link */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 24 }}
          onClick={() => navigate(`/journal/${sessionId}`)}
        >
          📖 open journal
        </button>

        {/* Back */}
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate(`/vault/${sessionId}`)}>
          ← back to quizzes
        </button>
      </motion.div>
    </div>
  )
}
